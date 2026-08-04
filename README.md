<p align="center">
  <img src="./public/wordmark.svg" alt="RoutineFlow" width="360">
</p>

<p align="center">
  A behavior and routine tracking system for turning daily intentions into measurable consistency.
</p>

<p align="center">
  <a href="https://theroutineflow.netlify.app"><img alt="Live demo" src="https://img.shields.io/badge/Live_demo-Netlify-00C7B7?logo=netlify&logoColor=white"></a>
  <a href="https://www.supportkori.com/montasim"><img alt="Support on SupportKori" src="https://img.shields.io/badge/Support-SupportKori-FFDD00"></a>
</p>

RoutineFlow helps people define recurring behaviors, generate a reliable daily plan, record what actually happened, and inspect the gap between intention and execution. It combines routine scheduling, completion logs, analytics, and data export in one responsive web application.

**[Start tracking](https://theroutineflow.netlify.app) · [Review the OpenAPI contract](./docs/api/openapi-v1.yaml) · [Report an issue](https://github.com/montasim/routine-flow-web/issues)**

> **Project status:** RoutineFlow is an actively developed web application. The public deployment is suitable for evaluation; review the limitations below before relying on it as the only record of important routines.

## Why RoutineFlow?

Habit apps often reduce progress to a streak without preserving what was planned, what actually happened, or how behavior changes across a week. RoutineFlow models scheduled occurrences separately from routines, records completion and skip decisions, and turns those records into calendars, analytics, and exports. That makes the product useful both for daily action and for reviewing drift between intention and execution.

## Features

- Create routines with categories, schedules, priorities, and reminder settings.
- Generate and maintain a rolling seven-day window of routine occurrences.
- Complete or skip occurrences and keep an auditable behavior log.
- Review daily and weekly progress through dashboards, calendars, and analytics.
- Export routine data for analysis outside the application.
- Sign in with email OTP or Google OAuth when the corresponding providers are configured.
- Use the versioned REST API documented by the OpenAPI contract.

## How it works

```text
Next.js web app
      │
      ├── /api/v1/* ──► routine, occurrence, analytics, export, and auth services
      │
      ├── Better Auth ─► email OTP and optional Google OAuth
      │
      └── storage ─────► MongoDB in production / local file-backed data in development
```

Occurrence generation is server-owned: the application persists a forward-looking window, then completion and skip actions create the records used by the analytics views.

## Core workflow

1. Create an account or sign in with an enabled authentication method.
2. Add a routine with its category, schedule, priority, and reminder preference.
3. Use the daily view to complete or skip generated occurrences.
4. Review consistency in the dashboard, calendar, and analytics views.
5. Export your records when you need an external copy or want to analyze them elsewhere.

RoutineFlow measures recorded behavior; it does not guarantee habit formation or replace medical, mental-health, or professional advice. Reminder preferences are stored, but this README does not claim that notification delivery is implemented. Local development may use fallback storage and authentication behavior that should not be used as production configuration.

### Review progress and export data

Use the dashboard for the current daily and weekly picture, the calendar for date-oriented history, and analytics for longer patterns. Export data before moving environments or whenever you need an independent copy; the hosted application should not be treated as the only backup of important personal records.

## Tech stack

| Area | Technology |
| --- | --- |
| Application | Next.js 16, React 19, TypeScript |
| UI | Tailwind CSS, Radix UI, shadcn/ui |
| Data and forms | TanStack Query, Zustand, React Hook Form, Zod |
| Authentication | Better Auth, Resend, optional Google OAuth |
| Persistence | MongoDB with a local development fallback |
| Analytics and export | Recharts, SheetJS |
| Quality | ESLint, Prettier, Vitest, Testing Library, Playwright |

## Getting started

### Prerequisites

- Node.js 20 or newer
- pnpm

### Installation

```bash
git clone https://github.com/montasim/routine-flow-web.git
cd routine-flow-web
pnpm install --frozen-lockfile
```

Review [`.env.example`](./.env.example), then create `.env.local` with the values needed for your environment. Local development can use the built-in development storage and authentication defaults; production requires real database and signing credentials.

```bash
cp .env.example .env.local
```

```bash
pnpm dev
```

Open <http://localhost:3000>. When email delivery is not configured locally, the development OTP is `123456`.

## Configuration

The environment template documents every supported variable. The main groups are:

| Purpose | Variables |
| --- | --- |
| Database | `MONGODB_URI` |
| Auth and canonical URL | `AUTH_SECRET`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `NEXT_PUBLIC_SITE_URL` |
| Email OTP | `RESEND_API_KEY`, `OTP_FROM_EMAIL` |
| Google sign-in | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` |
| API and redirects | `CORS_ALLOWED_ORIGINS`, `ALLOWED_REDIRECT_URIS` |
| Cron authorization | `SCHEDULED_JOB_SECRET` |
| Reserved background-job placeholder | `INNGEST_SIGNING_KEY` (not currently read by the application) |

Do not commit `.env.local` or real credentials.

## Available commands

| Command | Purpose |
| --- | --- |
| `pnpm dev` | Start the development server |
| `pnpm build` | Create a production build |
| `pnpm start` | Run the production server |
| `pnpm lint` | Run ESLint |
| `pnpm typecheck` | Check TypeScript without emitting files |
| `pnpm test` | Run the Vitest suite |
| `pnpm format` | Format TypeScript and TSX files |

## API and project documentation

- [OpenAPI v1 contract](./docs/api/openapi-v1.yaml)
- [Product requirements](./docs/requiremnts.md)
- [Technology decisions](./docs/tech-stack.md)
- [Design system](./docs/design_system/readme.md)

## Deployment

The production application is deployed at [theroutineflow.netlify.app](https://theroutineflow.netlify.app). A production deployment must provide persistent MongoDB storage, secure authentication secrets, the canonical site URL, and whichever email/OAuth services are enabled. `SCHEDULED_JOB_SECRET` is required when calling the cron endpoint; setting the reserved Inngest placeholder does not enable an Inngest route.

Run the same pre-deployment gates used for contribution review:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

## Project status, privacy, and limitations

- RoutineFlow is under active development; interfaces, API behavior, and stored-data shape may change.
- Production persistence requires MongoDB. The local file-backed fallback is a development convenience, not a production database.
- Email OTP, Google sign-in, reminders, and scheduled work depend on the corresponding providers and secrets being configured.
- Analytics describe only the occurrences recorded in RoutineFlow and cannot infer unrecorded behavior.
- Routine data may be personal. Protect production authentication, database access, logs, backups, and export files accordingly.
- The repository currently has no dedicated security policy, support guide, code of conduct, or license file.
- No repository-owned production screenshot is currently available; the verified live deployment is the primary visual proof.

## Documentation

- [OpenAPI v1 contract](./docs/api/openapi-v1.yaml)
- [Product requirements](./docs/requiremnts.md)
- [Technology decisions](./docs/tech-stack.md)
- [Design-system guide](./docs/design_system/readme.md)
- [Web UI kit](./docs/design_system/ui_kits/web/README.md)
- [Mobile UI kit](./docs/design_system/ui_kits/mobile/README.md)

## Contributing

Issues and focused pull requests are welcome. Before opening a pull request:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

Please describe the problem being solved, keep changes scoped, and include screenshots for user-interface changes.

## Support and security

Use [GitHub Issues](https://github.com/montasim/routine-flow-web/issues) for reproducible bugs and feature proposals. Do not include credentials, authentication tokens, or private routine data in public reports.

There is no private security-reporting policy in the repository yet. Contact the maintainer through the profile below before publicly disclosing a suspected vulnerability.

## Funding

If RoutineFlow is useful to you, you can support its continued development through [SupportKori](https://www.supportkori.com/montasim).

Bug reports, workflow feedback, documentation improvements, and code contributions are equally valuable ways to help.

## Author

Built and maintained by [Montasim](https://github.com/montasim).

## License status

No open-source license file is currently included. Source visibility alone does not grant permission to copy, modify, or redistribute this project.
