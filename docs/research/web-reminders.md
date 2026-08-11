# Web reminders and weekly summaries

Checked: 2026-08-11

## Recommendation

Implement reminders as **standards-based Web Push backed by durable notification
jobs in Neon Postgres**. Run a small, idempotent dispatcher every minute from the
deployment platform's scheduler. Use the same channel for the Monday weekly
summary.

Do not use `setTimeout`, an open browser tab, or the service worker itself as the
scheduler. A push service can start the registered service worker when a message
arrives, even if it is not currently running; that is the mechanism that makes a
closed-browser reminder possible ([W3C Push API, push delivery](https://www.w3.org/TR/push-api/#dfn-push-message),
[MDN background operation](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Offline_and_background_operation)).

For this codebase, a database-backed polling dispatcher is a better first
implementation than one long-lived workflow per occurrence:

- routine, timezone, and reminder edits can update pending jobs transactionally;
- completion, skipping, disabling, and deletion can cancel pending jobs in the
  same database transaction;
- unique constraints and job leases can prevent duplicate user-visible sends;
- it does not couple the application to a particular deployment host.

The repository already names Inngest as its preferred durable-job option. It
remains a good second implementation: `step.sleepUntil()` sleeps without holding
compute, `cancelOn` can stop a sleeping reminder after a matching event, and the
official docs include a TanStack Start handler ([Inngest sleeps](https://www.inngest.com/docs/features/inngest-functions/steps-workflows/sleeps),
[cancellation](https://www.inngest.com/docs/features/inngest-functions/cancellation/cancel-on-events),
[TanStack Start integration](https://www.inngest.com/docs/getting-started/tanstack-start-quick-start)).
It adds another hosted dependency and still needs careful event/DB consistency,
so it is not necessary for the first working Web Push release.

## What is required in the browser

### 1. Service worker

Register a same-origin worker such as `/push-service-worker.js`. Service workers
and Push are restricted to secure contexts; production must use HTTPS, while
`http://localhost` is treated as secure for development
([MDN Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API),
[MDN secure contexts](https://developer.mozilla.org/en-US/docs/Web/Security/Secure_Contexts)).

The worker needs these handlers:

- `push`: parse a small JSON payload and call
  `event.waitUntil(self.registration.showNotification(...))`;
- `notificationclick`: close the notification, focus an existing Routempo client
  if possible, or open the payload's same-origin route;
- optionally `pushsubscriptionchange`: attempt to replace the subscription and
  synchronize it to the server. This event is not supported consistently, so the
  application must also reconcile `pushManager.getSubscription()` on normal app
  startup ([MDN `pushsubscriptionchange`](https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerGlobalScope/pushsubscriptionchange_event)).

Every push must produce a visible notification. `userVisibleOnly: true` is a
promise to the browser, not merely a subscription option
([WebKit Web Push](https://webkit.org/blog/12945/meet-web-push/),
[MDN `PushManager.subscribe`](https://developer.mozilla.org/en-US/docs/Web/API/PushManager/subscribe)).

### 2. Explicit permission and subscription

The Notifications switch must initiate this sequence directly from its click or
tap handler:

1. Feature-detect `Notification`, `serviceWorker`, and `PushManager`.
2. Call `Notification.requestPermission()` only after the user explicitly enables
   notifications.
3. Wait for `navigator.serviceWorker.ready`.
4. Call `registration.pushManager.subscribe({ userVisibleOnly: true,
applicationServerKey })` with the stable VAPID public key.
5. POST `subscription.toJSON()` to an authenticated application endpoint.

Browsers increasingly require both notification permission and subscription to
be requested from a user gesture. The public VAPID key identifies the application
server; sends must use the matching private key
([MDN subscription requirements](https://developer.mozilla.org/en-US/docs/Web/API/PushManager/subscribe),
[`web-push` VAPID usage](https://github.com/web-push-libs/web-push#using-vapid-key-for-applicationserverkey)).

The UI cannot truthfully show “Routine reminders: on” merely because a database
boolean is true. Show distinct states:

- unsupported browser;
- permission not requested;
- enabled on this device;
- blocked in browser settings;
- temporarily unavailable because push is not configured on the server.

Set new users' notification preferences to off until they opt in. If permission
is denied, persist the preference as off and explain that the user must change it
in browser/OS settings; repeatedly requesting permission will not repair it.

### 3. iPhone and iPad constraint

On iOS and iPadOS, Web Push is available to web apps added to the Home Screen,
and permission must be requested through direct user interaction. A web app
manifest using `display: "standalone"` or `"fullscreen"`, a stable manifest
`id`, and appropriate icons are therefore part of production support
([WebKit iOS/iPadOS Web Push](https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/)).
Use feature detection instead of user-agent checks and show installation guidance
when an iOS browser cannot expose Push.

## VAPID and server-side delivery

Use the maintained Node `web-push` package unless the deployment runtime lacks
Node crypto/network APIs. Generate a VAPID key pair once and keep it stable:

- `VAPID_PUBLIC_KEY`: safe to expose to the authenticated or public client;
- `VAPID_PRIVATE_KEY`: server secret;
- `VAPID_SUBJECT`: a monitored `mailto:` address or production HTTPS URL.

`web-push` can generate the URL-safe keys, configure VAPID, encrypt a payload,
and send to the browser-provided endpoint
([`web-push` README](https://github.com/web-push-libs/web-push/blob/master/README.md)).
Do not use `https://localhost` as the VAPID subject: the library documents that
Safari rejects that subject; use a real `mailto:` contact in every environment.

Store one row per browser/profile subscription, not one row per user:

```text
push_subscription
  id
  user_id
  endpoint             unique
  p256dh
  auth
  expiration_time      nullable
  user_agent           nullable, diagnostic only
  enabled
  last_success_at      nullable
  last_failure_at      nullable
  created_at
  updated_at
```

Treat the endpoint and key material as credentials. The Push API specifies that
the endpoint plus subscription keys are all an application server needs to send
messages, and the encrypted protocol still exposes timing, frequency, and size
metadata to the push service ([W3C Push API security and framework](https://www.w3.org/TR/push-api/#security-and-privacy-considerations)).
Never log complete endpoints or keys, return other devices' subscriptions to the
client, or place them in analytics.

Upsert subscriptions only for the authenticated user. Provide an authenticated
delete endpoint for the current subscription and an “all devices” operation if
needed. On sign-out, removing the current device subscription is the safer
default because routine titles may be sensitive.

Push subscriptions can be refreshed, revoked, or expired. Reconcile the current
subscription on each authenticated app start. When a send returns a permanent
expired/not-found response, disable or delete that row; RFC 8030 requires a push
service to return `404 Not Found` for an expired subscription
([RFC 8030 section 7.3](https://datatracker.ietf.org/doc/html/rfc8030#section-7.3),
[W3C subscription refreshes](https://www.w3.org/TR/push-api/#subscription-refreshes)).
Retry network failures and retryable 5xx/429 responses with bounded exponential
backoff.

Use a short TTL for routine reminders so a device coming online much later does
not display a stale alarm. The `web-push` API exposes TTL, urgency, and topic;
topic can coalesce repeated delivery attempts for the same logical notification
([`web-push` send options](https://github.com/web-push-libs/web-push#sendnotificationpushsubscription-payload-options)).

## Database job model

The existing `routine_occurrence` table needs enough scheduling information to
represent a real instant, not just a local date:

```text
routine_occurrence additions
  scheduled_at          timestamptz
  timezone              text
  reminder_minutes      integer
  notification_due_at   timestamptz

notification_job
  id
  user_id
  kind                   routine_reminder | weekly_summary
  routine_id             nullable
  occurrence_date        nullable
  summary_week           nullable
  due_at                 timestamptz
  status                 pending | processing | sent | canceled | failed
  attempt_count
  lease_until            nullable
  next_attempt_at
  sent_at                nullable
  last_error_code        nullable
  created_at
  updated_at
```

Add a unique logical-delivery key, for example
`(user_id, kind, routine_id, occurrence_date)` for reminders and
`(user_id, kind, summary_week)` for summaries. A unique constraint is required
even if the scheduler claims that it invokes only once: production schedulers
can overlap or invoke a job more than once. Vercel explicitly recommends both
locking and idempotency and states that failed cron invocations are not retried
([Vercel cron operations](https://vercel.com/docs/cron-jobs/manage-cron-jobs)).

The dispatcher should:

1. authenticate the scheduler request with a dedicated secret;
2. atomically claim a bounded batch where `status = pending`,
   `next_attempt_at <= now()`, and `due_at <= now()`;
3. re-read the routine/occurrence/settings before sending;
4. cancel the job if the occurrence is no longer pending, the routine is disabled,
   or the corresponding notification preference is off;
5. send to every enabled subscription for the user;
6. record per-subscription results, clean up expired subscriptions, and mark the
   logical job sent only after processing succeeds;
7. release/retry transient failures with exponential backoff and a maximum age.

Claiming and sending cannot be one long database transaction because network I/O
would hold locks. Use a short atomic lease, then send outside the transaction.
A worker that dies after sending but before recording success can still duplicate
a notification, so use both the logical unique key and a stable Web Push `topic`.

Changes must update jobs, not just preferences:

- creating/editing an enabled routine generates its future occurrences and jobs;
- changing the default reminder recomputes pending jobs that inherit the default;
- changing timezone regenerates future occurrence instants and jobs;
- completing, skipping, disabling, or deleting cancels the pending job;
- turning routine reminders off cancels/ignores reminder jobs;
- turning weekly summaries off cancels/ignores summary jobs.

Historical logs remain unchanged.

## Timezone and DST rules

Store the user's selected IANA timezone, local routine date/time intent, and the
computed UTC instant. Detect the initial device timezone with
`Intl.DateTimeFormat().resolvedOptions().timeZone`, whose value is an IANA name,
but let the saved user setting remain authoritative afterward
([MDN `resolvedOptions`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat/resolvedOptions)).

Validate timezone names server-side. PostgreSQL exposes recognized names through
`pg_timezone_names`, and its named IANA zones carry historical/DST transition
rules. `timestamptz` instants are stored internally in UTC
([PostgreSQL timezone names](https://www.postgresql.org/docs/current/view-pg-timezone-names.html),
[PostgreSQL date/time types](https://www.postgresql.org/docs/current/datatype-datetime.html)).
Never store only a numeric UTC offset because offsets change across DST and by
government action.

For each occurrence:

```text
scheduled_at = local occurrence date + routine wall-clock time in user's zone
notification_due_at = scheduled_at - reminder_minutes
```

Define DST behavior explicitly and cover it in tests:

- nonexistent wall time during a spring-forward gap: move forward to the first
  valid instant after the gap;
- repeated wall time during a fall-back overlap: choose the earlier occurrence;
- timezone setting changes: preserve the user's local wall-clock routine time and
  regenerate future instants, rather than preserving the old UTC instant.

Weekly summary currently promises “every Monday” but specifies no time. Make the
product rule explicit; `09:00 Monday` in the saved user timezone is a reasonable
default. Materialize one summary job per local ISO week, compute its UTC `due_at`
with the same DST policy, and aggregate the previous local Monday-through-Sunday
window. If the product later permits a user-selected time, it changes only this
job generation rule.

## Scheduler and deployment constraints

TanStack Start supplies request handlers but does not itself guarantee a
continuously running process. Production needs one of:

- the host's minute-level scheduler calling an authenticated route such as
  `POST /api/jobs/notifications`;
- a small dedicated worker process using the same dispatcher module;
- Inngest-hosted durable functions.

Vercel Cron calls a production route with an HTTP request and always evaluates
cron expressions in UTC. Its Hobby tier only supports daily, imprecise jobs, so
minute-level reminders require a paid plan or another scheduler
([Vercel Cron](https://vercel.com/docs/cron-jobs),
[Vercel cron accuracy](https://vercel.com/docs/cron-jobs/manage-cron-jobs#cron-job-accuracy)).
Cloudflare Cron Triggers support every-minute UTC schedules, but run in a Worker
handler; they can instead call a secured Routempo endpoint
([Cloudflare Cron Triggers](https://developers.cloudflare.com/workers/configuration/cron-triggers/)).

Neon's `pg_cron` is not the recommended default here. Neon documents it as a
paid-plan feature enabled by support request, and a SQL cron job alone does not
deliver encrypted Web Push over HTTP
([Neon `pg_cron` announcement](https://neon.com/docs/changelog/2025-01-10)).

Production also requires:

- HTTPS on the canonical origin;
- a stable public service-worker URL and correct JavaScript content type;
- a web app manifest and icons for installability/iOS;
- outbound HTTPS access from the Node delivery runtime to browser push services,
  including `*.push.apple.com` where applicable;
- stable VAPID keys, a monitored VAPID contact, and a scheduler secret in the
  deployment secret store;
- migrations applied before the scheduler is enabled;
- structured delivery metrics without endpoint/key leakage;
- alerts for a growing pending/failed queue and scheduler silence.

Do not add offline asset caching merely to support push. A minimal service worker
with only push/click/subscription handlers avoids stale application deployments.

## Local development and verification

`pnpm dev` on `http://localhost:3000` can register a service worker and request
notifications because localhost is a secure context. It cannot create future
jobs without the server secrets and it has no scheduler. Provide a development
command or a protected manual request that runs the dispatcher once.

Verification should cover:

- permission granted, denied, unsupported, and revoked states;
- subscription upsert, replacement, unsubscribe, and multiple devices;
- one notification for a due routine, with correct title and deep link;
- cancellation after complete/skip/routine disable/settings off;
- retryable delivery failures and removal on expired subscription;
- duplicate/overlapping dispatcher invocations;
- notification offsets of 0, 5, 10, and 30 minutes;
- timezone changes plus spring-forward and fall-back boundaries;
- exactly one Monday summary for the previous local week;
- production build serving the worker and manifest from their expected URLs.

Local browser tests can verify registration and UI state, but end-to-end push
delivery still depends on an external browser push service. Test at least Chrome,
Firefox, desktop Safari, and an installed iOS Home Screen app before claiming
cross-browser support.

## Definition of “working” for the settings page

The feature is complete only when:

- saving a default reminder changes `notification_due_at` for applicable pending
  occurrences;
- enabling notifications obtains permission and stores a live subscription for
  that device;
- a production scheduler dispatches due jobs without an open Routempo tab;
- disabling notifications prevents future sends;
- weekly summary creates and delivers one real notification every Monday in the
  saved timezone;
- mutation failures reach the UI rather than being presented as successful saves.

Until all of those are configured, the UI should say that delivery is unavailable
or “coming soon”; a persisted boolean alone is not a functioning reminder.
