# Routempo

Routempo is a full-stack routine planner built with TanStack Start, Neon
PostgreSQL, Drizzle ORM, shadcn/ui, Tailwind CSS, and Better Auth. The production
interface follows the workflow prototype in [`prototypes/v1`](./prototypes/v1).

## Local development

1. Copy `.env.example` to `.env`, add a Better Auth secret, and add the database
   connection string from your Neon project.
2. Add Google OAuth credentials. Use
   `http://localhost:3000/api/auth/callback/google` as the authorized callback.
3. To enable Microsoft sign-in and Microsoft 365 sync, add Microsoft Entra OAuth
   credentials and register
   `http://localhost:3000/api/auth/oauth2/callback/microsoft-entra-id` as a web
   redirect URI. The default `common` tenant supports personal, work, and school
   accounts.
4. Enable the Google Calendar API and Google Tasks API in the Google Cloud
   project. In Microsoft Entra, allow delegated `Calendars.ReadWrite` and
   `Tasks.ReadWrite` permissions. Routempo asks users to grant these sync scopes
   separately from sign-in.
5. Run `pnpm install` and `pnpm db:migrate`.
6. Generate Web Push credentials with `pnpm push:keys`, then add the public and
   private keys to `VAPID_PUBLIC_KEY` and `VAPID_PRIVATE_KEY`. Set
   `VAPID_SUBJECT` to a monitored `mailto:` address or an HTTPS URL.
7. Set `CRON_SECRET` to a random secret and run `pnpm dev`.

`DATABASE_URL` is used by both the application and Drizzle Kit. Database
failures are surfaced instead of silently falling back to temporary in-memory
storage.

## Reminders and weekly summaries

Routempo stores a rolling seven-day set of timezone-aware notification jobs in
PostgreSQL. A production scheduler must send an authenticated `POST` request to
`/api/notifications/run` every minute:

```sh
curl -X POST \
  -H "Authorization: Bearer $CRON_SECRET" \
  https://your-routempo-host.example/api/notifications/run
```

The endpoint leases due jobs, retries transient push failures, removes expired
browser subscriptions, and uses per-device delivery records to prevent
duplicates. Browser permission is requested only after the user enables
delivery. On iPhone and iPad, Web Push requires installing Routempo on the Home
Screen first.

## Calendar and task sync

Settings includes Google and Microsoft integration controls. Import converts
upcoming calendar events (the next 90 days) and open tasks into one-off
Routempo routines. Export sends enabled routines to the provider's primary
calendar or default task list. Routempo records each imported or exported item
so subsequent syncs do not create duplicates.
