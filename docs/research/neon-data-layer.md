# Neon data-layer recommendation

Checked: 2026-08-10

## Recommendation

Use **Neon Postgres with Drizzle ORM and `@neondatabase/serverless`**. Model
Routempo as relational tables and keep database calls behind a small `AppStore`
repository boundary.

Do **not** design for PostgreSQL/MongoDB hot-swapping. The repository boundary
will keep a later migration contained, but changing between relational and
document databases would still require a new schema, queries, migrations, and
data conversion. Prisma does not remove that work: its documentation explicitly
says providers cannot be switched automatically and migration histories are
provider-specific ([Prisma migration limitations](https://www.prisma.io/docs/orm/prisma-migrate/understanding-prisma-migrate/limitations-and-known-issues)).

Drizzle is the best fit here because Routempo needs explicit relational modeling,
auditable SQL migrations, flexible reporting queries, and a lightweight runtime
more than it needs Prisma's higher-level generated client.

## Why this fits the current application

The server is TanStack Start/Nitro, launched as a Node process, not an edge-only
deployment (`package.json`, `vite.config.ts`). The recommendation below was used
to replace the prototype's MongoDB document store: application data is now
normalized in PostgreSQL tables, and Better Auth uses its Drizzle adapter
([`store.server.ts`](../../src/lib/store.server.ts),
[`auth.server.ts`](../../src/lib/auth.server.ts)).

That storage model is adequate for a prototype, but Routempo's actual domain is
relational:

- users own routines and settings;
- routines belong to categories and generate scheduled occurrences;
- completion, skip, and missed events form an append-oriented history;
- insights aggregate occurrences and events over time.

Postgres gives these relationships constraints, atomic multi-row writes, useful
indexes, and expressive aggregation. A sensible first schema is `user_settings`,
`categories`, `routines`, `routine_schedule_rules`, `occurrences`, and
`routine_events`, alongside Better Auth's tables. Keep finalized events
append-only; do not continue storing the entire `AppData` graph as one JSON row.

## Prisma versus Drizzle

| Concern           | Drizzle                                                                                              | Prisma                                                                                                                                                                  | Routempo decision                                                                  |
| ----------------- | ---------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| Neon integration  | Native `neon-http` and `neon-websockets` adapters over Neon's serverless driver                      | GA `@prisma/adapter-neon` and normal Prisma Client API                                                                                                                  | Both are credible                                                                  |
| Type safety       | TypeScript schema infers selects/inserts; SQL-like query builder                                     | Generated Client from Prisma Schema Language                                                                                                                            | Both strong; Drizzle keeps DB and TS concepts closer                               |
| Query flexibility | SQL-like API and raw SQL escape hatch suit analytics                                                 | High-level Client plus TypedSQL/raw SQL for unsupported shapes                                                                                                          | Drizzle is the more direct fit for reporting queries                               |
| Migrations        | Drizzle Kit generates inspectable SQL and snapshots; `generate` + `migrate` for tracked environments | Prisma Migrate generates editable SQL and has a mature declarative workflow                                                                                             | Both good; prefer checked-in SQL, never production `push`                          |
| Transactions      | Supports transactions and savepoints; actual capability depends on Neon transport                    | Supports sequential and interactive transactions; actual capability also depends on driver/transport                                                                    | Use HTTP for atomic batches/one-shot work; WebSockets or TCP for interactive flows |
| Runtime weight    | Thin, native-driver-oriented layer with no generated query engine                                    | More generated machinery, although modern Prisma driver adapters are substantially more deployment-friendly than older Prisma engines                                   | Drizzle better matches this small server application                               |
| MongoDB           | Not supported                                                                                        | Supported only through a materially different connector/workflow; current docs say Prisma 7 MongoDB support is still forthcoming and direct users should remain on 6.19 | Do not select Prisma merely for theoretical Mongo portability                      |
| Better Auth       | Official adapter; Better Auth can generate Drizzle schema, then Drizzle Kit owns migrations          | Official adapter; schema generation supported, but Better Auth's migration command is not                                                                               | Slight workflow advantage to Drizzle                                               |

Sources: [Drizzle with Neon](https://orm.drizzle.team/docs/get-started/neon-new),
[Drizzle migrations](https://orm.drizzle.team/docs/migrations),
[Drizzle transactions](https://orm.drizzle.team/docs/transactions),
[Prisma with Neon](https://www.prisma.io/docs/orm/v6/overview/databases/neon),
[Prisma transactions](https://www.prisma.io/docs/orm/prisma-client/queries/transactions),
[Prisma TypedSQL](https://docs.prisma.io/docs/orm/prisma-client/using-raw-sql/typedsql),
[Better Auth Drizzle adapter](https://better-auth.com/docs/adapters/drizzle), and
[Better Auth Prisma adapter](https://better-auth.com/docs/adapters/prisma).

## Neon connection strategy

Use two URLs:

- `DATABASE_URL`: the pooled Neon URL for normal application traffic;
- `DIRECT_DATABASE_URL`: the direct Neon URL used only by migrations,
  `pg_dump`/`pg_restore`, and administration.

Neon uses PgBouncer transaction pooling for pooled URLs. It recommends pooled
connections for serverless functions and web apps, but direct connections for
migrations and administrative tools. Session-scoped behavior such as
`SET`/`RESET`, `LISTEN`/`NOTIFY`, session advisory locks, and preserved temporary
tables is not available through transaction pooling
([Neon connection pooling](https://neon.com/docs/connect/connection-pooling)).

For the application driver:

- default to Drizzle's Neon HTTP adapter for ordinary request/response queries
  and non-interactive transactions;
- use Neon's WebSocket `Pool`/`Client` adapter only when a feature genuinely
  needs an interactive, session-bound transaction;
- a conventional `pg` connection is also valid while deploying this Nitro build
  as a long-lived Node server, but the Neon driver preserves deployment options.

Neon documents HTTP as fastest for one-shot, non-interactive work and WebSockets
for sessions, interactive transactions, and `node-postgres` compatibility. The
current GA serverless driver requires Node 19+
([Neon serverless driver](https://neon.com/docs/serverless/serverless-driver)).

## Auth and migration workflow

Configure Better Auth with the official Drizzle adapter and persist its user,
session, account, and verification records in the same Neon database. Generate
the required schema with Better Auth's CLI, review it, add Better Auth's
recommended indexes, and let Drizzle Kit own the resulting migration history.
Better Auth documents indexes for user email, account user ID, and session user
ID/token, among others
([Better Auth performance guidance](https://better-auth.com/docs/guides/optimizing-for-performance)).

For every schema change:

1. update the TypeScript schema;
2. run `drizzle-kit generate`;
3. review and commit the SQL migration;
4. test it against a Neon development branch;
5. run `drizzle-kit migrate` with the direct URL during deployment.

Use `drizzle-kit push` only for disposable prototyping. Drizzle's own Neon guide
positions `push` for rapid schema experimentation and `generate`/`migrate` for
migration files ([Drizzle Neon guide](https://orm.drizzle.team/docs/tutorials/drizzle-with-neon)).

## Portability: what is worth preserving

Preserve **domain-level portability**, not query-level portability. Define an
interface around use cases such as `listToday`, `createRoutine`,
`recordCompletion`, `updateSettings`, and `getInsightSummary`. Keep Drizzle
tables and expressions inside the Postgres implementation.

This makes changing Postgres providers straightforward because Neon remains
standard Postgres. Moving to MongoDB would still be a deliberate rewrite.
Prisma's Mongo connector differs in IDs, relations, null-versus-missing
semantics, transactions, and schema evolution; Prisma Migrate does not support
MongoDB, and current Prisma documentation says MongoDB support for Prisma 7 is
not yet available
([Prisma MongoDB connector](https://www.prisma.io/docs/orm/core-concepts/supported-databases/mongodb)).

## Alternative considered

**Kysely** is the strongest lighter alternative: a zero-dependency, type-safe
SQL query builder with explicit migrations. Choose it if the team wants to own
more SQL and database typing manually. It offers no MongoDB portability and
requires more assembly than Drizzle, so it is not the better default for this
project ([Kysely documentation](https://www.kysely.dev/)).

Prisma remains a reasonable choice if the team's top priority is its generated
client, Prisma Studio, and more abstract CRUD ergonomics. Those benefits do not
outweigh Drizzle's direct Neon integration and SQL control for Routempo's
time-series-style logs and analytics.
