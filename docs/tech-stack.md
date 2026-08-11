# RoutineFlow — Industry Standard Tech Stack

Packages selected by category. All production-ready, actively maintained.

---

## Core Framework

| Package         | Use             | Why                                                     |
| --------------- | --------------- | ------------------------------------------------------- |
| **Next.js 16+** | React framework | App Router, Server Components, API routes, edge runtime |
| **React 19**    | UI library      | Latest Concurrent features, Server Actions              |

---

## Authentication

| Package         | Use            | Status                                                    |
| --------------- | -------------- | --------------------------------------------------------- |
| **better-auth** | Auth framework | ✅ **CHOSEN** — TypeScript-first, modular, Next.js native |
| **lucia-auth**  | Alternative    | Consider if Better Auth doesn't fit                       |
| **next-auth**   | Legacy         | Avoid — superseded by Better Auth for modern stacks       |

---

## Validation & Schema

| Package     | Use                               | Why                                                             |
| ----------- | --------------------------------- | --------------------------------------------------------------- |
| **zod**     | Schema validation, type inference | ✅ **RECOMMENDED** — First-class TS integration, widely adopted |
| **arktype** | Alternative                       | Faster runtime, smaller bundle                                  |
| **valibot** | Alternative                       | Similar to Zod, more modular API                                |
| **typebox** | Alternative                       | JSON Schema-first                                               |

---

## Database

| Package                   | Use                   | Why                                                  |
| ------------------------- | --------------------- | ---------------------------------------------------- |
| **mongodb**               | MongoDB native driver | ✅ **CHOSEN** in BRD — Native driver, direct control |
| **prisma**                | ORM alternative       | Type-safe queries, migrations, great DX              |
| **drizzle-orm**           | ORM alternative       | SQL-like syntax, tiny bundle, no migrations required |
| **mongodb-memory-server** | Testing               | In-memory MongoDB for tests                          |

---

## Email Service

| Package        | Use            | Why                                                                 |
| -------------- | -------------- | ------------------------------------------------------------------- |
| **resend**     | Email delivery | ✅ **CHOSEN** — Developer-friendly, React-ready, generous free tier |
| **nodemailer** | SMTP transport | Use with self-hosted SMTP or as Resend fallback                     |
| **sendgrid**   | Alternative    | Enterprise-grade, complex setup                                     |
| **postmark**   | Alternative    | Transactional email specialist                                      |

---

## UI Components

| Package         | Use                  | Why                                                            |
| --------------- | -------------------- | -------------------------------------------------------------- |
| **shadcn/ui**   | Component primitives | ✅ **CHOSEN** — Copy-paste, fully owned, Radix-based, Tailwind |
| **radix-ui**    | Unstyled primitives  | Underlying primitive library for shadcn                        |
| **headless-ui** | Alternative          | Tailwind-designed, fully accessible                            |
| **park-ui**     | Alternative          | Panda CSS + Arktype based                                      |

---

## Icons

| Package          | Use          | Why                                                    |
| ---------------- | ------------ | ------------------------------------------------------ |
| **lucide-react** | Icon library | ✅ **CHOSEN** — Tree-shakeable, consistent, 10k+ icons |
| **heroicons**    | Alternative  | Tailwind official, smaller set                         |
| **react-icons**  | Alternative  | Aggregates multiple libraries                          |

---

## Charts & Analytics

| Package      | Use                  | Why                                                       |
| ------------ | -------------------- | --------------------------------------------------------- |
| **recharts** | Charts               | ✅ **RECOMMENDED** — React-native, composable, responsive |
| **tremor**   | Dashboard components | Pre-built analytics components, Recharts-based            |
| **visx**     | Alternative          | D3-based, more control, steeper curve                     |
| **chart.js** | Alternative          | Canvas-based, widely used, less React-idiomatic           |

---

## Date & Time

| Package                   | Use                      | Why                                                                                  |
| ------------------------- | ------------------------ | ------------------------------------------------------------------------------------ |
| **@js-temporal/polyfill** | Timezone-safe scheduling | ✅ **CHOSEN** — Required for correct local-date/time recurrence and timezone changes |
| **date-fns**              | Display formatting only  | Optional — use for UI formatting, not core scheduling                                |
| **dayjs**                 | Alternative              | Moment-like API, tiny, plugin-based                                                  |
| **intl-dateformat**       | Native                   | Browser API, use if requirements simple                                              |
| **tzdata**                | IANA timezone data       | Required for accurate timezone conversion                                            |

---

## State Management

| Package           | Use          | Why                                                 |
| ----------------- | ------------ | --------------------------------------------------- |
| **zustand**       | Client state | ✅ **CHOSEN** in BRD — Tiny, simple, no boilerplate |
| **jotai**         | Alternative  | Atomic state, React Suspense native                 |
| **redux-toolkit** | Alternative  | Complex state, time-travel debugging                |

---

## Data Fetching

| Package                   | Use          | Why                                                   |
| ------------------------- | ------------ | ----------------------------------------------------- |
| **@tanstack/react-query** | Server state | ✅ **CHOSEN** in BRD — Caching, refetching, mutations |
| **swr**                   | Alternative  | Simpler API, smaller bundle                           |
| **react-router**          | Data loaders | If using Remix-style loaders                          |

---

## Forms

| Package                 | Use               | Why                                                      |
| ----------------------- | ----------------- | -------------------------------------------------------- |
| **react-hook-form**     | Form management   | ✅ **RECOMMENDED** — Minimal re-renders, Zod integration |
| **zod**                 | Schema validation | Pair with react-hook-form                                |
| **@hookform/resolvers** | Zod adapter       | Connects Zod to react-hook-form                          |

---

## Notifications / Toasts

| Package                  | Use                 | Why                                              |
| ------------------------ | ------------------- | ------------------------------------------------ |
| **sonner**               | Toast notifications | ✅ **CHOSEN** — Minimal API, great UX, stackable |
| **react-hot-toast**      | Alternative         | Similar, less feature-rich                       |
| **react-toastify**       | Alternative         | Older, more configurable                         |
| **web-notification-api** | Browser native      | For local reminders (BRD requirement)            |

---

## Data Export

| Package       | Use                   | Why                                                     |
| ------------- | --------------------- | ------------------------------------------------------- |
| **xlsx**      | Excel generation      | ✅ **CHOSEN** in BRD (SheetJS) — Full Excel feature set |
| **papaparse** | CSV export/generation | Fallback for simple exports                             |
| **exceljs**   | Alternative           | More features, slower                                   |

---

## Serverless Jobs / Scheduling

| Package                         | Use                                                | Why                                                                                          |
| ------------------------------- | -------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| **inngest**                     | Durable background jobs and reminder orchestration | ✅ **CHOSEN / preferred** — Serverless-safe events, durable waits, retries, and cancellation |
| **Vercel Cron**                 | Platform scheduled trigger                         | Use when deploying on Vercel                                                                 |
| **Netlify Scheduled Functions** | Platform scheduled trigger                         | Use when deploying on Netlify                                                                |
| **bull**                        | Queue alternative                                  | Requires Redis and always-on workers; not preferred for V1 serverless                        |

---

## Styling

| Package                      | Use                          | Why                                                       |
| ---------------------------- | ---------------------------- | --------------------------------------------------------- |
| **tailwindcss**              | Utility CSS                  | ✅ **RECOMMENDED** — Industry standard, highly productive |
| **clsx**                     | Conditional classes          | ✅ **RECOMMENDED** — Merge conditional classes            |
| **tailwind-merge**           | Tailwind conflict resolution | ✅ **RECOMMENDED** — Merge Tailwind classes correctly     |
| **class-variance-authority** | Component variants           | ✅ **RECOMMENDED** — Type-safe variant props              |
| **next-themes**              | Dark mode                    | Theme switching with SSR support                          |

---

## Testing

| Package                    | Use             | Why                                                           |
| -------------------------- | --------------- | ------------------------------------------------------------- |
| **vitest**                 | Unit tests      | ✅ **RECOMMENDED** — Fast, ESM-native, Jest-compatible API    |
| **playwright**             | E2E tests       | ✅ **RECOMMENDED** — Cross-browser, reliable, great debugging |
| **@testing-library/react** | Component tests | DOM testing utilities                                         |
| **msw**                    | API mocking     | Mock Service Worker for request interception                  |

---

## Code Quality

| Package        | Use                         | Why                       |
| -------------- | --------------------------- | ------------------------- |
| **typescript** | Type system                 | ✅ **REQUIRED**           |
| **eslint**     | Linting                     | ✅ **REQUIRED**           |
| **prettier**   | Formatting                  | ✅ **RECOMMENDED**        |
| **biome**      | Lint + format (alternative) | Faster, all-in-one, newer |
| **oxlint**     | Faster ESLint alternative   | 100x faster, compatible   |

---

## Accessibility

| Package                    | Use                             | Why                                            |
| -------------------------- | ------------------------------- | ---------------------------------------------- |
| **@axe-core/react**        | Automated accessibility testing | ✅ **REQUIRED** — WCAG 2.2 AA compliance       |
| **eslint-plugin-jsx-a11y** | Accessibility linting           | ✅ **REQUIRED** — Catch a11y issues in JSX/TSX |

---

## Utilities

| Package       | Use           | Why                                              |
| ------------- | ------------- | ------------------------------------------------ |
| **nanoid**    | ID generation | ✅ **RECOMMENDED** — Secure, collision-resistant |
| **uuid**      | Alternative   | Standard UUID format                             |
| **lodash-es** | Utilities     | Use only specific functions needed               |

---

## API Contract

| Package                | Use                                    | Why                                                                                |
| ---------------------- | -------------------------------------- | ---------------------------------------------------------------------------------- |
| **openapi-typescript** | Generate TypeScript types from OpenAPI | ✅ **RECOMMENDED** — Keeps web/mobile DTOs aligned with `docs/api/openapi-v1.yaml` |
| **openapi-fetch**      | Typed API client                       | Optional — useful for generated first-party clients                                |
| **@redocly/cli**       | OpenAPI linting/bundling               | ✅ **RECOMMENDED** — Validates formal mobile API contract                          |

---

## Monitoring (Optional V2)

| Package              | Use               | Why                             |
| -------------------- | ----------------- | ------------------------------- |
| **sentry**           | Error tracking    | Industry standard, rich context |
| **vercel-analytics** | Web analytics     | If using Vercel                 |
| **posthog**          | Product analytics | Open-source alternative         |

---

## Summary — Core Stack

```json
{
  "framework": "Next.js 16+",
  "language": "TypeScript",
  "styling": "Tailwind CSS",
  "ui": "shadcn/ui",
  "auth": "better-auth",
  "db": "mongodb (native)",
  "validation": "zod",
  "forms": "react-hook-form + zod",
  "state": "zustand",
  "fetching": "@tanstack/react-query",
  "charts": "recharts",
  "icons": "lucide-react",
  "email": "resend",
  "export": "xlsx",
  "toasts": "sonner",
  "dates": "@js-temporal/polyfill + date-fns display helpers",
  "jobs": "inngest + platform scheduled functions",
  "apiContract": "OpenAPI 3.1",
  "testing": "vitest + playwright",
  "a11y": "@axe-core/react + eslint-plugin-jsx-a11y"
}
```

---

## Installation Command

```bash
pnpm add \
  better-auth zod \
  mongodb resend \
  xlsx papaparse \
  recharts \
  lucide-react \
  @js-temporal/polyfill date-fns \
  zustand \
  @tanstack/react-query \
  @tanstack/react-table \
  react-hook-form @hookform/resolvers \
  inngest pino \
  sonner \
  clsx tailwind-merge class-variance-authority \
  nanoid

pnpm add -D \
  vitest @vitest/ui \
  playwright \
  @testing-library/react @testing-library/jest-dom \
  msw \
  openapi-typescript @redocly/cli \
  typescript \
  eslint \
  eslint-plugin-jsx-a11y \
  prettier prettier-plugin-tailwindcss \
  tailwindcss \
  @axe-core/react
```
