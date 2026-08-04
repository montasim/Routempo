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

[Open the live app](https://theroutineflow.netlify.app)

> **Project status:** RoutineFlow is an actively developed web application. The public deployment is suitable for evaluation; review the limitations below before relying on it as the only record of important routines.

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

RoutineFlow measures recorded behavior; it does not guarantee habit formation or replace medical, mental-health, or professional advice. Reminder delivery depends on the configured deployment services, and local development may use fallback storage and authentication behavior that should not be used as production configuration.

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
| Scheduled jobs | `SCHEDULED_JOB_SECRET`, `INNGEST_SIGNING_KEY` |

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

The production application is deployed at [theroutineflow.netlify.app](https://theroutineflow.netlify.app). A production deployment must provide persistent MongoDB storage, secure authentication secrets, the canonical site URL, and whichever email/OAuth services are enabled. Scheduled-job secrets are required only when those jobs are configured.

Run the same pre-deployment gates used for contribution review:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

## Contributing

Issues and focused pull requests are welcome. Before opening a pull request:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

Please describe the problem being solved, keep changes scoped, and include screenshots for user-interface changes.

Use [GitHub Issues](https://github.com/montasim/routine-flow-web/issues) for reproducible bugs and feature proposals. Do not include credentials, authentication tokens, or private routine data in public reports.

## Support

If RoutineFlow is useful to you, you can support its continued development through [SupportKori](https://www.supportkori.com/montasim).

## License status

No open-source license file is currently included. Source visibility alone does not grant permission to copy, modify, or redistribute this project.
