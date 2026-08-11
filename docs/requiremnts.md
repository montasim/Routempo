---
## RoutineFlow — Business Requirements Document (v2.1)
---

# 1. Product Definition

RoutineFlow is a web-based routine execution tracking system that records scheduled behaviors, captures real execution times, and produces structured behavioral analytics.

It is not a to-do app.

It is a behavioral measurement system.

---

# 2. Platform Scope

## Clients

- Web app — Analytics, routine management, notification permission/status, settings, and export tools, built with Next.js.
- API clients — The backend API must support first-party web and mobile clients through the same versioned API contract.

This BRD defines the V1 web product and shared backend API. Native mobile UI implementation is out of scope for this repository, but API contracts must be designed for mobile apps from the start. Mobile apps must use the same RoutineFlow web/API backend for auth, routines, occurrences, logs, analytics, and export access. There is no separate mobile backend in V1. All application APIs are versioned under `/api/v1`.

---

# 3. Core System Principle

Every scheduled routine instance generates an occurrence.

Every finalized occurrence produces a log.

All analytics are derived from `routine_logs` only.

No analytics are manually stored.

`routine_logs` are the historical source of truth. A log must snapshot the routine metadata needed for historical analytics and exports, so later routine edits or deletion do not rewrite history.

---

# 4. Authentication System

## 4.1 Auth Framework

**Better Auth** — integrated for session management, session persistence, and adapter behavior.

### 4.1.1 Better Auth MongoDB Integration

Better Auth provides built-in MongoDB adapter via `better-auth/adapters/mongodb`.

```ts
import { betterAuth } from "better-auth"
import { mongodbAdapter } from "better-auth/adapters/mongodb"
import { client } from "@/db"

export const auth = betterAuth({
  database: mongodbAdapter(client),
  session: {
    expiresIn: 604800, // 7 days
    storeSessionInDatabase: true,
  },
})
```

### 4.1.2 Session Schema

Better Auth creates `session` collection with:

| Field       | Type   | Description                                 |
| ----------- | ------ | ------------------------------------------- |
| `id`        | string | Primary key                                 |
| `userId`    | string | Foreign key → user                          |
| `token`     | string | Unique session token (used for bearer auth) |
| `expiresAt` | Date   | Expiration timestamp                        |
| `ipAddress` | string | Device IP (optional)                        |
| `userAgent` | string | Device UA (optional)                        |
| `createdAt` | Date   | Created timestamp                           |
| `updatedAt` | Date   | Updated timestamp                           |

### 4.1.3 MongoDB Connection Pooling

For serverless deployment (Vercel/Netlify):

```ts
// Lazy client initialization
minPoolSize: 0
maxPoolSize: 10
```

Client created on first request. No idle connections during cold periods.

### 4.1.4 Bearer Token Format

Mobile bearer tokens use Better Auth `session.token` directly.

- **No separate bearer token mechanism**
- Session token serves as bearer token for API/mobile clients
- `/api/v1/auth/me` validates by querying `sessions` collection by token

### 4.1.5 Session Refresh

Refresh endpoint available for mobile clients.

**Endpoint:** `POST /api/v1/auth/refresh`

Request: empty body (uses current session cookie or bearer token)

Response data:

```json
{
  "session": {
    "token": "refreshed_session_token",
    "expiresAt": "2026-07-06T00:00:00.000Z"
  },
  "user": {}
}
```

Rules:

- Web clients can extend sessions via cookie-based refresh
- Mobile clients call `/api/v1/auth/refresh` before token expiry
- Better Auth `updateAge` option controls refresh window

## 4.2 Authentication Methods

### Email OTP and Social Login

```json
{
  "methods": ["email OTP", "Google social login"],
  "otpFlow": "user enters email → receive 6-digit code → submit code in app → session",
  "socialFlow": "user starts social login through RoutineFlow web API → provider OAuth flow → RoutineFlow session",
  "codeExpiry": "3 minutes",
  "maxAttempts": 3,
  "resendCooldownSeconds": 60
}
```

V1 supports email OTP and Google social login. Password login and magic-link login are excluded.

OTP codes must be stored in MongoDB only. In-memory OTP storage is not allowed for V1 because production is serverless and may run across multiple function instances.

Rules:

- Login emails must contain a numeric OTP code, not a verification link
- Do not use magic-link or URL-based verification for login
- The user verifies by entering the OTP code into the web or mobile app
- The same versioned OTP endpoints must support both web and mobile clients
- OTP codes expire after 3 minutes
- Verification fails after 3 incorrect attempts
- A user may request a new OTP only after the resend cooldown
- Rate limits apply per email and per IP
- A successful verification deletes the OTP immediately
- OTP records must be stored as hashed codes, not plaintext codes
- OTP records must use a MongoDB TTL index on `expiresAt`
- OTP records must include `email`, `codeHash`, `attemptCount`, `expiresAt`, `resendAvailableAt`, `ipHash`, `userAgentHash`, `createdAt`, and `consumedAt`
- OTP codes, auth cookies, and bearer tokens must never be logged
- Social login is configured on the web/backend only; native mobile Google SDK login is not configured in V1
- Mobile social login must use the RoutineFlow versioned web API flow, not a direct Google OAuth client in the mobile app
- Mobile social login must return to the mobile app through a one-time RoutineFlow exchange code, not by placing a long-lived session token in a URL

Package requirements:

- Use Better Auth for session lifecycle, session persistence, cookie handling, and adapter behavior
- Use Better Auth social provider support for Google login
- Use a custom numeric OTP send/verify flow backed by MongoDB if Better Auth's default email flow is URL-oriented or does not meet the MongoDB-only OTP requirement
- Use Resend for OTP email delivery
- Use Zod to validate OTP request and verification payloads
- Use a Mongo-backed limiter for OTP abuse controls, or a serverless-safe managed limiter if MongoDB cannot meet abuse-control performance requirements

## 4.3 Session Management

- **Cookie-based web sessions:** 7-day expiry, secure, httpOnly, SameSite-protected
- **Bearer token API sessions:** mobile/API clients send `Authorization: Bearer <sessionToken>`
- **Custom DB adapter:** Bridges Better Auth to MongoDB and local/dev JSON fallback storage

Session rules:

- Token expiry follows the server session expiry
- Logout revokes the server session
- Expired or revoked sessions return `401`
- Protected API routes accept either a valid web session cookie or a valid bearer session token
- Mobile/API bearer sessions are created by successful OTP verification or successful social-login exchange
- Mobile clients must store bearer tokens only in secure OS credential storage
- Bearer token responses must never be logged

## 4.4 Auth Endpoints

| Endpoint                                  | Purpose                                                             |
| ----------------------------------------- | ------------------------------------------------------------------- |
| `POST /api/v1/auth/otp/send`              | Send OTP code to email                                              |
| `POST /api/v1/auth/otp/verify`            | Verify OTP code and create session                                  |
| `POST /api/v1/auth/refresh`               | Refresh current session (extend expiry)                             |
| `GET /api/v1/auth/social/google/start`    | Start RoutineFlow-managed Google OAuth                              |
| `GET /api/v1/auth/social/google/callback` | OAuth callback handled by RoutineFlow backend                       |
| `POST /api/v1/auth/social/exchange`       | Exchange a one-time mobile social auth code for a bearer session    |
| `POST /api/v1/auth/logout`                | Revoke current session                                              |
| `GET /api/v1/auth/me`                     | Get current user session                                            |
| `GET/POST /api/v1/auth/[...all]`          | Better Auth internal session handler, if required by implementation |

---

# 4.5 Security Architecture

## 4.5.1 CORS Policy

Allowed origins must be configured before production deployment.

**TODO:** Define production CORS origins before deploy.

**Current placeholder:**

```env
# .env.production
CORS_ALLOWED_ORIGINS="https://routineflow.app"
```

**Development:**

```env
# .env.development
CORS_ALLOWED_ORIGINS="http://localhost:3000,http://localhost:3001"
```

Rules:

- Mobile deep-link schemes (`routineflow://*`) do not send CORS preflight
- OAuth redirect URIs validated separately via `ALLOWED_REDIRECT_URIS`
- Wildcards (`*.routineflow.app`) not recommended; use explicit domains

## 4.5.2 Content Security Policy

**Policy:** Self-only (most restrictive)

```
default-src 'self';
script-src 'self';
style-src 'self' 'unsafe-inline';
img-src 'self' data:;
connect-src 'self';
font-src 'self';
object-src 'none';
base-uri 'self';
form-action 'self';
frame-ancestors 'none';
```

Rules:

- No external script sources
- Inline styles allowed for Tailwind/shadcn
- May need adjustment if external CDNs required

## 4.5.3 Input Sanitization

**Approach:** Zod validation + MongoDB driver parameterized queries

- All API inputs validated via Zod schemas before processing
- MongoDB driver handles query parameterization automatically
- No raw user input in query construction
- NoSQL injection protection via type coercion + driver escaping

## 4.5.4 Rate Limiting

**OTP endpoints:** Per email + per IP limits (already specified in BRD)

**API endpoints:** 100 requests per minute per user/IP

**Headers:**

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1719853200
```

**Over limit:** `429 Too Many Requests` with `Retry-After` header.

## 4.5.5 Request Size Limits

**Max request body:** 2MB for API routes (Next.js default)

**Max export size:** 10MB; async generation for larger exports

## 4.5.6 Secrets Management

**Storage:** Environment variables via `@t3-oss/env-nextjs`

**Required secrets:**

```env
MONGODB_URI=
RESEND_API_KEY=
BETTER_AUTH_SECRET=
BETTER_AUTH_URL=
INNGEST_SIGNING_KEY=
SCHEDULED_JOB_SECRET=
ALLOWED_REDIRECT_URIS=
```

**Rules:**

- No hardcoded secrets
- Secrets validated at startup
- Never log secrets or tokens

---

# 5. Time System (Critical Foundation)

## 5.1 Timezone Model

Each user has a single timezone stored in their settings:

```json
{
  "timezone": "Asia/Dhaka"
}
```

Rules:

- All scheduling is stored in user timezone as a local time string (HH:mm)
- All execution timestamps (`completedAt`) are stored in UTC internally
- All UI and exports convert to user timezone at render/export time
- Timezone and recurrence calculations must use a dedicated date/time library, not ad hoc `Date` string math

Default: auto-detect browser timezone on signup. User can override.

Package requirement: use `@js-temporal/polyfill` for timezone-safe scheduling and occurrence generation. `date-fns` may be used for display formatting, but it must not replace the core scheduling rules.

### 5.1.1 DST Transitions

**DST Handling:** `@js-temporal/polyfill` handles daylight saving time transitions correctly.

- IANA timezone data includes all DST rules
- No special DST logic required
- Temporal automatically adjusts scheduled times across DST boundaries
- Historical logs preserve correct times via `timezoneAtLog` snapshot

Example: User in `America/New_York` has routine at 07:00. When DST starts, 07:00 EDT is correctly computed as 11:00 UTC (vs 12:00 UTC during EST).

---

## 5.2 Scheduling Rule

```text
07:00 Gym
```

Means 07:00 in the user's current timezone, not UTC.

---

## 5.3 Timezone Change Rule

Timezone changes are sensitive because they change the UTC interpretation of future local routine times. The web UI and mobile clients must show a confirmation step before submitting a timezone change.

When a user changes their timezone:

- The stored local time string (e.g. `07:00`) remains unchanged
- The real-world UTC equivalent shifts accordingly
- Future occurrences are generated using the new timezone interpretation
- Existing pending occurrences whose local date is after the user's new current local date must be deleted and regenerated under the new timezone
- Existing pending occurrences whose local date equals the user's new current local date must be regenerated only if they have not reached their old `scheduledTimeUtc`
- Existing pending occurrences for the current local date that have already reached their old `scheduledTimeUtc` keep their original `scheduledTimeUtc` and `timezoneAtGeneration` so delay calculation remains stable for the current day
- Existing pending occurrences older than the user's new current local date must not be regenerated; missed detection must finalize them as `Missed`
- Existing completed, missed, or skipped logs must never be rewritten
- Notification schedules for deleted/regenerated pending occurrences must be canceled and recreated
- Timezone changes must write an audit-safe application log entry with user id, old timezone, new timezone, affected occurrence counts, and request id, without logging auth tokens or personal secrets

Timezone change workflow:

1. Validate the requested IANA timezone with the shared settings schema.
2. Compute the user's current local date in the old timezone and the new timezone.
3. Load pending occurrences in the active 7-day window.
4. Preserve pending current-day occurrences that are already due under the old timezone.
5. Delete and regenerate pending future occurrences using the new timezone.
6. Recompute `scheduledTimeUtc`, `timezoneAtGeneration`, `reminderMinutes`, and `notificationDueAt` for regenerated occurrences.
7. Cancel or reschedule notification jobs for every affected occurrence.
8. Return a response that includes `oldTimezone`, `newTimezone`, `occurrencesRegenerated`, `occurrencesPreserved`, and `notificationJobsUpdated`.

**Historical log integrity rule:**

Every `routine_log` entry must snapshot the user's timezone at the moment of that log:

```text
{
  routineId,
  routineTitleAtLog,
  routineCategoryIdAtLog,
  routineCategoryNameAtLog,
  routineCategoryColorAtLog,
  date,
  scheduledTime,        // local time string: "07:00"
  scheduledTimeUtc,     // UTC equivalent at time of generation
  completedAt,          // UTC timestamp
  timezoneAtLog,        // e.g. "Asia/Dhaka" — timezone used for this occurrence
  status,
  delayMinutes
}
```

This means historical analytics always reflect the timezone that was active when the behavior occurred. A user who moved from Dhaka to London will see their old logs computed correctly in their old timezone, and new logs in the new one.

---

## 5.4 Occurrence Timezone Snapshot

When an occurrence is generated, it must capture:

```text
{
  scheduledTimeUtc,
  timezoneAtGeneration
}
```

This allows correct delay calculation even if the user's timezone changes between occurrence generation and actual completion.

If a timezone change affects pending future occurrences, those occurrences must be deleted and regenerated, and notification jobs/local browser reminders must be resynced.

---

# 6. Occurrence Generation System (Critical)

This is the foundational mechanism the entire system depends on. It must be explicitly defined.

## 6.1 Generation Strategy

Occurrences are **not** pre-generated for all future dates.

They are generated in a **rolling 7-day persisted window** using a server-side scheduled job plus an app-launch/API fallback.

**Rule:** For each user, the system maintains occurrences for the user's current local date plus the next 6 local dates.

Example: at any point on June 20 in the user's timezone, occurrences should exist for June 20 through June 26 for all active routines whose recurrence rules match those dates.

At least once per hour, the scheduled job ensures that every user's active 7-day window is complete.

---

## 6.2 Scheduled Job Specification

```text
Trigger:    Every hour, server-side, through Vercel Cron, Netlify Scheduled Functions, or Inngest
Logic:      For each user, compute their current local date
            Ensure occurrences exist for current local date + next 6 dates
            Generate only missing occurrences whose routine recurrence matches each date
Idempotent: Yes — generation is skipped if an occurrence already exists for userId + routineId + date
```

V1 is deployed on serverless infrastructure such as Vercel or Netlify. The implementation must not depend on an in-process scheduler for production. Local development may use a manual trigger or dev scheduler, but production occurrence generation and missed detection must use a durable platform scheduler or Inngest.

### 6.2.1 Job Failure Recovery

If scheduled job fails for extended period:

1. **Missed Detection Recovery:** All pending occurrences older than user's current local date are marked as `Missed` on next successful run.
2. **Occurrence Generation Recovery:** Current 7-day window is generated normally. No backfill for future dates beyond active window.
3. **Gap Period:** Lost occurrences during failure gap are recorded as `Missed` logs only. No historical backfill.

**Rules:**

- Job processes all users on recovery
- Per-user failures logged to `scheduled_job_failures` collection
- Exponential backoff for repeated per-user failures
- No manual intervention required; auto-recover on next successful run

---

## 6.3 On-Demand Generation (App Launch Fallback)

When the app launches, it must check:

```text
Are occurrences present for today + the next 6 local dates?
If not → trigger generation immediately via API call
```

This handles:

- Scheduled-job failure recovery
- New users who sign up mid-day
- Edge cases around timezone boundaries
- Browser local notification resync after settings or permission changes

---

## 6.4 Occurrence Schema

```text
{
  id,
  routineId,
  userId,
  date,                   // "2026-06-21" in user timezone
  scheduledTime,          // "07:00" local
  scheduledTimeUtc,       // UTC equivalent
  timezoneAtGeneration,   // snapshotted IANA timezone
  status,                 // Pending | Completed | Missed | Skipped
  reminderMinutes,        // resolved offset used for this occurrence
  notificationDueAt       // UTC reminder target for notification orchestration/local reminders
}
```

---

## 6.5 Notification Scheduling on Generation

At the moment an occurrence is generated, the intended reminder time is computed:

```text
notificationDueAt = scheduledTimeUtc - reminderMinutes
```

This creates a notification schedule target for browser local reminders and, when enabled, Inngest reminder orchestration.

Notification behavior:

- The web client fetches upcoming occurrences
- The web client schedules best-effort local browser notifications using the Web Notifications API when supported and permitted
- The server may emit an Inngest event to create a durable reminder job for the occurrence
- Notification jobs and browser timers are rescheduled when occurrences, reminder settings, timezone, or routine schedules change

V1 reminder delivery is best-effort unless a concrete delivery channel such as Web Push, email, or native push is explicitly added. Inngest can orchestrate reminder timing and cancellation, but it is not itself a push transport.

---

## 6.6 Notification Sync Recovery

When the web app loads:

1. Fetch all upcoming occurrences for the next 7 days from the server
2. Re-schedule all corresponding browser local notifications if permission is granted
3. Re-check notification permission state
4. Cancel stale local notification timers that no longer match server occurrence data
5. Send notification permission/status changes to the backend so server-side reminder jobs can respect current preferences

Without this, timezone, reminder, and routine schedule changes can leave stale browser reminders or stale Inngest reminder jobs.

---

# 7. Missed Detection System

## 7.1 Ownership

Missed detection is **server-side only**. The client never writes a `Missed` status.

Rationale: if missed detection were client-side, a user who never opens the app would accumulate no missed logs — the system would be blind to their absence.

---

## 7.2 Missed Detection Scheduled Job

```text
Trigger:    Every hour, server-side (same scheduled job as occurrence generation, second pass)
Logic:      For each user, compute their current local date
            Query all occurrences with date < current local date and status = Pending
            Mark each as Missed
            Write a routine_log entry with status: Missed
Idempotent: Yes — only processes occurrences still in Pending state
```

The job must not depend on running at an exact local minute such as `00:05`. Any successful run after a user's local date advances must catch up all unresolved older pending occurrences.

---

## 7.3 Missed Log Entry

```text
{
  routineId,
  occurrenceId,
  date,
  scheduledTime,
  scheduledTimeUtc,
  routineTitleAtLog,
  routineCategoryIdAtLog,
  routineCategoryNameAtLog,
  routineCategoryColorAtLog,
  scheduleTypeAtLog,
  recurrenceTypeAtLog,
  recurrenceRulesAtLog,
  reminderMinutesAtLog,
  completedAt: null,
  timezoneAtLog,
  status: "Missed",
  delayMinutes: null
}
```

---

## 7.4 Scheduled Job Failure Handling

If the missed detection scheduled job fails for any reason:

- On next successful run, it processes all unresolved Pending occurrences older than the current day
- This is safe because the idempotency check uses occurrence date, not run time

---

# 8. Global Notification System

## 8.1 Global Reminder Setting

User defines one global offset:

```text
15 minutes before event
```

Options: 5, 10, 15, 20, 30, 45, 60 minutes. Custom minutes allowed.

---

## 8.2 Notification Rule

```text
Scheduled: 07:00 local
Reminder:  15 min before
Notification fires: 06:45 local (computed from scheduledTimeUtc - 15 min)
```

---

## 8.3 Per-Routine Override

```json
{
  "reminderOverride": 60
}
```

`reminderOverride: null` means use the user's global reminder setting.

---

## 8.4 Notification Reliability

V1 uses:

- Browser Notification API for best-effort local browser reminders
- Client-side scheduling from synced occurrence data
- Inngest for durable reminder orchestration if enabled
- Optional service worker support where useful for notification display

Requirements:

- User must explicitly grant browser notification permission
- The web client must schedule reminders for the next 7 days after each successful occurrence sync
- The web client must cancel and reschedule reminders when occurrences, timezone, reminder settings, or routine schedules change
- Server-side reminder jobs must be canceled or rescheduled when occurrences, timezone, reminder settings, notification permissions, or routine schedules change
- If notification permission is denied or unsupported, the UI must show notification status clearly in settings
- The system must not assume reliable closed-browser delivery unless a push/email/native delivery channel is added
- Inngest may manage reminder timing, retries, and cancellation, but a separate delivery channel is required for reliable closed-browser notifications

---

# 9. Routine System

## 9.1 Routine Definition

```text
{
  id,
  userId,
  title,
  categoryId,           // references categories.id
  scheduledTime,        // "07:00" local time string
  recurrenceType,       // daily | weekly | monthly | yearly
  recurrenceRules,      // e.g. { daysOfWeek: [1,3,5] }
  reminderOverride,     // null = use global
  isActive,
  scheduleType          // "fixed" | "dynamic" — see Section 9.3
}
```

---

## 9.2 Recurrence Types

- Daily
- Weekly (specific days)
- Monthly (specific dates)
- Yearly (specific month/day combinations)

### Daily

```json
{
  "recurrenceType": "daily",
  "recurrenceRules": {}
}
```

### Weekly

```json
{
  "recurrenceType": "weekly",
  "recurrenceRules": {
    "daysOfWeek": [1, 3, 5]
  }
}
```

`daysOfWeek` uses `0 = Sunday` through `6 = Saturday`.

### Monthly

```json
{
  "recurrenceType": "monthly",
  "recurrenceRules": {
    "daysOfMonth": [1, 15, 31]
  }
}
```

If a month does not contain a requested day, such as February 31, no occurrence is generated for that invalid date.

### Yearly

```json
{
  "recurrenceType": "yearly",
  "recurrenceRules": {
    "dates": [
      { "month": 1, "day": 1 },
      { "month": 12, "day": 31 }
    ]
  }
}
```

`month` is `1-12`. Invalid calendar dates are ignored.

Custom interval recurrence is excluded from V1.

---

## 9.3 Prayer Routine — Schedule Type Design

Prayer times are location-based and change daily. They cannot be stored as a fixed `scheduledTime` string.

To avoid a schema migration in V2, the `scheduleType` field is introduced now:

```text
{
  scheduleType: "fixed",     // standard routines: use scheduledTime field
  scheduleType: "dynamic"    // prayer/dynamic routines: scheduledTime is null
                             // time is resolved at occurrence generation time
                             // from an external calculation engine
}
```

For V1, no dynamic routines are implemented. But the occurrence generation logic must branch on `scheduleType` so V2 can plug in the prayer time engine without touching the schema or the analytics layer.

---

## 9.4 Category System

Categories are first-class, user-owned grouping resources for routines.

They are not analytics aggregates. Category statistics are derived from `routine_logs` using the category snapshot fields written at log time.

Category rules:

- Users can list, create, edit, and soft-delete categories
- The web UI must include a dedicated Categories page
- Clicking a category opens a category detail/statistics view
- Routine create/edit forms must allow selecting an existing category
- Routine create/edit forms must allow creating a new category inline without leaving the routine modal
- Category names are unique per user among non-deleted categories, case-insensitive
- Category edits do not regenerate occurrences because category does not affect scheduling or notifications
- Renaming a category updates current category display and current routine references, but historical `routine_logs` are not rewritten
- Deleting a category is blocked while active or inactive non-deleted routines reference it, unless a future reassignment workflow is implemented
- Category deletion is a soft delete and creates a sync tombstone for mobile cache correctness
- Default categories may be seeded for new users, such as Fitness, Health, Work, Mind, Personal, and Spiritual

Category fields:

```text
{
  id,
  userId,
  name,
  color,
  description,
  sortOrder,
  isDeleted,
  deletedAt
}
```

---

# 10. Execution Model

## 10.1 Completion Rule

User taps Complete. System records:

```text
completedAt: current UTC timestamp
```

No manual time input. No exceptions.

Completion also writes a `routine_logs` entry containing the occurrence fields and the routine metadata snapshot required by Section 12.6.

Completion eligibility:

- Only `Pending` occurrences may be completed
- The occurrence local `date` must equal the user's current local date at the time of the request
- Future-dated and past-dated occurrences cannot be completed through the API
- Same-day early completion is allowed and produces a negative `delayMinutes`
- The server's current time and the occurrence's `timezoneAtGeneration` are authoritative; clients cannot submit `completedAt`

---

## 10.2 Status Types

- `Pending` — generated, not yet acted on
- `Completed` — user tapped Complete
- `Missed` — server marked after end of day
- `Skipped` — user explicitly skipped

---

## 10.3 Delay Calculation

```text
delayMinutes = (completedAt - scheduledTimeUtc) in minutes
```

Negative = completed early. Positive = completed late. Stored on the log at write time, not computed at query time.

---

## 10.4 Skip Rule

User explicitly marks skip. A skip log is written immediately and does not wait for end of day. Skip does not trigger missed detection.

Skip eligibility:

- Only `Pending` occurrences may be skipped
- The occurrence local `date` must equal the user's current local date at the time of the request
- Future-dated and past-dated occurrences cannot be skipped through the API
- Skip is final in V1; there is no undo flow and no later conversion from `Skipped` to `Completed`
- A skipped occurrence writes a `routine_logs` entry with `status: "Skipped"`, `completedAt: null`, and `delayMinutes: null`
- Skip confirmation is required in the web UI and mobile clients because skip finalizes a measurement log

Skip confirmation copy must name the routine, scheduled local time, date, and consequence: the occurrence will be recorded as skipped and excluded from completion timing.

---

# 11. Excluded Streak System

Streak functionality is removed from V1.

Rules:

- No streak counters are stored in V1
- No streak preferences exist in user settings
- No streak metrics appear in analytics
- No streak sheet appears in exports
- No streak pause/resume feature exists in V1
- If streaks are added in a later version, they must be derived from `routine_logs` and introduced through a new API version if response contracts change

---

# 12. Data Model (MongoDB)

## 12.1 users

```text
{
  id,
  name,
  email,
  image,
  createdAt,
  updatedAt
}
```

---

## 12.2 user_settings

```text
{
  userId,
  timezone,
  defaultReminderMinutes,
  notificationPreferences: {
    browserNotificationsEnabled
  },
  createdAt,
  updatedAt
}
```

---

## 12.3 categories

```text
{
  id,
  userId,
  name,
  color,
  description,
  sortOrder,
  isDeleted,
  deletedAt,
  createdAt,
  updatedAt
}
```

---

## 12.4 routines

```text
{
  id,
  userId,
  title,
  categoryId,
  scheduledTime,
  scheduleType,
  recurrenceType,
  recurrenceRules,
  reminderOverride,
  isActive,
  isDeleted,
  deletedAt,
  createdAt,
  updatedAt
}
```

---

## 12.5 occurrences

```text
{
  id,
  routineId,
  userId,
  date,
  scheduledTime,
  scheduledTimeUtc,
  timezoneAtGeneration,
  status,
  reminderMinutes,
  notificationDueAt,
  createdAt,
  updatedAt
}
```

---

## 12.6 routine_logs (Source of Truth)

```text
{
  id,
  routineId,
  occurrenceId,
  userId,
  routineTitleAtLog,
  routineCategoryIdAtLog,
  routineCategoryNameAtLog,
  routineCategoryColorAtLog,
  scheduleTypeAtLog,
  recurrenceTypeAtLog,
  recurrenceRulesAtLog,
  reminderMinutesAtLog,
  date,
  scheduledTime,
  scheduledTimeUtc,
  completedAt,
  timezoneAtLog,
  status,
  delayMinutes
}
```

Every analytics query and export reads from this collection only.

The snapshot fields are mandatory. They preserve historical analytics when a routine is renamed, recategorized, rescheduled, deactivated, edited, or deleted.

---

## 12.7 sessions (Better Auth)

Session records for web cookie authentication and bearer API/mobile authentication.

---

## 12.8 accounts / social identities (Better Auth)

Better Auth-owned account/social identity records for Google social login. Application code may read these records through Better Auth APIs or the custom adapter, but must not depend on undocumented internal field names outside the adapter.

---

## 12.9 verifications (Better Auth)

Framework-owned Better Auth verification records. Custom email OTP codes for V1 are stored in the `otp_codes` MongoDB collection defined in this section, not in memory.

---

## 12.10 otp_codes

```text
{
  id,
  email,
  codeHash,
  name,
  timezone,
  attemptCount,
  maxAttempts,
  expiresAt,
  resendAvailableAt,
  consumedAt,
  ipHash,
  userAgentHash,
  requestId,
  createdAt,
  updatedAt
}
```

Rules:

- OTP codes expire after 3 minutes
- `codeHash` is stored instead of the plaintext OTP
- A TTL index on `expiresAt` removes expired records
- A successful verification sets `consumedAt` and prevents reuse
- Verification fails after 3 incorrect attempts
- Rate limiting must check both email and IP dimensions before sending or verifying OTP
- OTP values, hashes, auth cookies, and bearer tokens must never be logged

---

## 12.11 mobile_social_auth_codes

```text
{
  id,
  codeHash,
  userId,
  provider,
  redirectUri,
  expiresAt,
  consumedAt,
  requestId,
  createdAt
}
```

Rules:

- Used only for mobile social login after RoutineFlow completes the web/backend OAuth callback
- Expires after 2 minutes
- One-time use only
- The mobile app exchanges the code at `/api/v1/auth/social/exchange` for a bearer-compatible RoutineFlow session token
- Long-lived bearer tokens must never be placed in query parameters, deep links, logs, or browser history

---

## 12.12 idempotency_keys

```text
{
  id,
  userId,
  key,
  method,
  path,
  requestFingerprint,
  status,
  responseStatus,
  responseBody,
  resourceType,
  resourceId,
  expiresAt,
  createdAt,
  updatedAt
}
```

Rules:

- Required for retryable mobile mutating requests
- `key` is unique per `userId + method + path`
- `requestFingerprint` is a stable hash of the validated request body and relevant path parameters
- Reusing the same key with the same fingerprint returns the original response
- Reusing the same key with a different fingerprint returns `409 IDEMPOTENCY_KEY_REUSED`
- Concurrent requests using the same key must allow only one mutation to execute
- Records expire after 24 hours unless a longer retention period is required by mobile sync
- Stored response bodies must never include auth tokens, OTP values, secrets, or unnecessary personal data

---

## 12.13 sync_tombstones

```text
{
  id,
  userId,
  resourceType,
  resourceId,
  deletedAt,
  reason,
  createdAt
}
```

Used for mobile cache correctness when routines are soft-deleted or pending occurrences are removed because of routine deletion, routine deactivation, schedule edits, reminder edits, or timezone regeneration.

Category soft deletion also writes a tombstone with `resourceType: "category"` so mobile clients can remove cached categories.

**Retention:** Indefinite. Tombstones never deleted. Mobile clients always see full deletion history.

---

## 12.14 Required Indexes / Constraints

```text
users.email                             unique
user_settings.userId                    unique
categories.userId + normalizedName + isDeleted unique partial
categories.userId + sortOrder           index
routines.userId + isDeleted             index
routines.userId + categoryId + isDeleted index
occurrences.userId + date               index
occurrences.userId + routineId + date   unique
occurrences.notificationDueAt + status  index
routine_logs.userId + date              index
routine_logs.occurrenceId               unique
otp_codes.email + createdAt             index
otp_codes.expiresAt                     TTL
otp_codes.email + consumedAt            index
mobile_social_auth_codes.codeHash       unique
mobile_social_auth_codes.expiresAt      TTL
idempotency_keys.userId + method + path + key unique
idempotency_keys.expiresAt              TTL
sync_tombstones.userId + resourceType + deletedAt index
```

The unique occurrence and log constraints are required for scheduled-job idempotency.

---

## 12.15 Detailed Collection Schemas

General database rules:

- MongoDB stores `_id` as `ObjectId`; API responses expose it as `id: string`
- All timestamps are UTC `Date` values in storage and ISO 8601 strings in API responses
- All user-facing local dates use `YYYY-MM-DD` in the user's timezone
- All local routine times use `HH:mm` 24-hour format
- All write paths must validate input with shared Zod schemas before persistence
- Production collections must create the required indexes during deployment/bootstrap

### users

| Field       | Type           | Required | Rules                          |
| ----------- | -------------- | -------: | ------------------------------ |
| `_id`       | ObjectId       |      Yes | Primary key                    |
| `name`      | string         |      Yes | 1-120 chars                    |
| `email`     | string         |      Yes | Lowercase, unique, valid email |
| `image`     | string \| null |       No | URL string or null             |
| `createdAt` | Date           |      Yes | UTC                            |
| `updatedAt` | Date           |      Yes | UTC                            |

### user_settings

| Field                                                    | Type           | Required | Rules                                              |
| -------------------------------------------------------- | -------------- | -------: | -------------------------------------------------- |
| `_id`                                                    | ObjectId       |      Yes | Primary key                                        |
| `userId`                                                 | string         |      Yes | Unique, references users.id                        |
| `timezone`                                               | string         |      Yes | Valid IANA timezone                                |
| `defaultReminderMinutes`                                 | number         |      Yes | Integer, `0-1440`                                  |
| `notificationPreferences.browserNotificationsEnabled`    | boolean        |      Yes | Default `false` until permission is granted        |
| `notificationPreferences.overnightNotificationsDisabled` | boolean        |      Yes | Default `false`; simple overnight disable toggle   |
| `dataRetentionMonths`                                    | number \| null |      Yes | `null` = indefinite; `1-120` = months to keep logs |
| `createdAt`                                              | Date           |      Yes | UTC                                                |
| `updatedAt`                                              | Date           |      Yes | UTC                                                |

### categories

| Field            | Type           | Required | Rules                                                                      |
| ---------------- | -------------- | -------: | -------------------------------------------------------------------------- |
| `_id`            | ObjectId       |      Yes | Primary key                                                                |
| `userId`         | string         |      Yes | References users.id                                                        |
| `name`           | string         |      Yes | 1-64 chars; unique per user among non-deleted categories, case-insensitive |
| `normalizedName` | string         |      Yes | Lowercase/trimmed name for uniqueness                                      |
| `color`          | string         |      Yes | Hex color string, validated against `^#[0-9a-fA-F]{6}$`                    |
| `description`    | string \| null |      Yes | Null or 0-240 chars                                                        |
| `sortOrder`      | number         |      Yes | Integer for user-controlled ordering                                       |
| `isDeleted`      | boolean        |      Yes | Soft-delete flag; default `false`                                          |
| `deletedAt`      | Date \| null   |      Yes | UTC soft-delete timestamp; null when not deleted                           |
| `createdAt`      | Date           |      Yes | UTC                                                                        |
| `updatedAt`      | Date           |      Yes | UTC                                                                        |

### routines

| Field              | Type                                           | Required | Rules                                                                          |
| ------------------ | ---------------------------------------------- | -------: | ------------------------------------------------------------------------------ |
| `_id`              | ObjectId                                       |      Yes | Primary key                                                                    |
| `userId`           | string                                         |      Yes | References users.id                                                            |
| `title`            | string                                         |      Yes | 1-120 chars                                                                    |
| `categoryId`       | string                                         |      Yes | References categories.id; category must belong to same user and not be deleted |
| `scheduledTime`    | string \| null                                 |      Yes | `HH:mm` for `fixed`; null for future `dynamic`                                 |
| `scheduleType`     | `"fixed" \| "dynamic"`                         |      Yes | V1 creates only `fixed` routines                                               |
| `recurrenceType`   | `"daily" \| "weekly" \| "monthly" \| "yearly"` |      Yes | Custom interval excluded from V1                                               |
| `recurrenceRules`  | object                                         |      Yes | Shape depends on `recurrenceType`                                              |
| `reminderOverride` | number \| null                                 |      Yes | Null means use user default; number is integer `0-1440`                        |
| `isActive`         | boolean                                        |      Yes | Inactive routines do not generate future occurrences                           |
| `isDeleted`        | boolean                                        |      Yes | Soft-delete flag; default `false`                                              |
| `deletedAt`        | Date \| null                                   |      Yes | UTC soft-delete timestamp; null when not deleted                               |
| `createdAt`        | Date                                           |      Yes | UTC                                                                            |
| `updatedAt`        | Date                                           |      Yes | UTC                                                                            |

Recurrence rule shapes:

```json
{
  "daily": {},
  "weekly": { "daysOfWeek": [0, 1, 2, 3, 4, 5, 6] },
  "monthly": { "daysOfMonth": [1, 15, 31] },
  "yearly": { "dates": [{ "month": 1, "day": 1 }] }
}
```

### occurrences

| Field                  | Type                                                | Required | Rules                                  |
| ---------------------- | --------------------------------------------------- | -------: | -------------------------------------- |
| `_id`                  | ObjectId                                            |      Yes | Primary key                            |
| `routineId`            | string                                              |      Yes | References routines.id                 |
| `userId`               | string                                              |      Yes | References users.id                    |
| `date`                 | string                                              |      Yes | `YYYY-MM-DD` in `timezoneAtGeneration` |
| `scheduledTime`        | string                                              |      Yes | Local `HH:mm` snapshot                 |
| `scheduledTimeUtc`     | Date                                                |      Yes | UTC equivalent at generation time      |
| `timezoneAtGeneration` | string                                              |      Yes | Valid IANA timezone                    |
| `status`               | `"Pending" \| "Completed" \| "Missed" \| "Skipped"` |      Yes | Starts as `Pending`                    |
| `reminderMinutes`      | number                                              |      Yes | Resolved reminder offset               |
| `notificationDueAt`    | Date                                                |      Yes | `scheduledTimeUtc - reminderMinutes`   |
| `createdAt`            | Date                                                |      Yes | UTC                                    |
| `updatedAt`            | Date                                                |      Yes | UTC                                    |

### routine_logs

| Field                       | Type                                           | Required | Rules                                        |
| --------------------------- | ---------------------------------------------- | -------: | -------------------------------------------- |
| `_id`                       | ObjectId                                       |      Yes | Primary key                                  |
| `routineId`                 | string                                         |      Yes | Routine id at log time                       |
| `occurrenceId`              | string                                         |      Yes | Unique, references occurrences.id            |
| `userId`                    | string                                         |      Yes | References users.id                          |
| `routineTitleAtLog`         | string                                         |      Yes | Routine title snapshot                       |
| `routineCategoryIdAtLog`    | string                                         |      Yes | Category id snapshot                         |
| `routineCategoryNameAtLog`  | string                                         |      Yes | Category name snapshot                       |
| `routineCategoryColorAtLog` | string                                         |      Yes | Category color snapshot                      |
| `scheduleTypeAtLog`         | `"fixed" \| "dynamic"`                         |      Yes | Routine schedule type snapshot               |
| `recurrenceTypeAtLog`       | `"daily" \| "weekly" \| "monthly" \| "yearly"` |      Yes | Routine recurrence snapshot                  |
| `recurrenceRulesAtLog`      | object                                         |      Yes | Routine recurrence rules snapshot            |
| `reminderMinutesAtLog`      | number                                         |      Yes | Resolved reminder offset snapshot            |
| `date`                      | string                                         |      Yes | Occurrence local date                        |
| `scheduledTime`             | string                                         |      Yes | Occurrence local time snapshot               |
| `scheduledTimeUtc`          | Date                                           |      Yes | UTC scheduled time snapshot                  |
| `completedAt`               | Date \| null                                   |      Yes | UTC completion time, null for missed/skipped |
| `timezoneAtLog`             | string                                         |      Yes | Timezone used for occurrence/log             |
| `status`                    | `"Completed" \| "Missed" \| "Skipped"`         |      Yes | Logs never use `Pending`                     |
| `delayMinutes`              | number \| null                                 |      Yes | Completed only; null for missed/skipped      |
| `createdAt`                 | Date                                           |      Yes | UTC                                          |

### Auth, idempotency, and sync collections

Better Auth owns session, account/social identity, and framework verification records required by its adapter. Application-owned `otp_codes`, `mobile_social_auth_codes`, `idempotency_keys`, and `sync_tombstones` collections must follow the schemas and index rules above.

---

# 13. Analytics Engine

All metrics are computed from `routine_logs`. Nothing is pre-aggregated in V1.

Analytics rules:

- `Pending` occurrences are operational state and are excluded from historical analytics until finalized
- `Completed`, `Missed`, and `Skipped` logs count as scheduled occurrences unless a metric explicitly excludes skipped logs
- Completion rate = `Completed / (Completed + Missed + Skipped)`
- Average delay uses `Completed` logs only
- Routine and category analytics use the snapshot fields stored on `routine_logs`, not the current routine document
- Recurrence gaps are not counted as scheduled occurrences
- Future dates are excluded from all historical metrics
- V1 analytics do not include streak metrics

## 13.1 Daily Metrics

- Completion rate
- Missed count
- Average delay
- Best/worst routine by delay

---

## 13.2 Weekly Metrics

- Completion trend (day-by-day for the week)
- Delay variation (std deviation of delayMinutes)
- **Weekly Trend Analysis** — direction of improvement/decline

---

## 13.3 Monthly Metrics

- Consistency score per routine (completed days / scheduled days)
- Routine reliability ranking
- Category performance

---

## 13.4 Yearly Metrics

- Heatmap calendar (completion rate per day)
- Discipline score (0–100, see 13.5)
- **Behavioral Drift** — rolling 30-day consistency trend over the year

**Performance Note:** Yearly heatmap queries for users with 10,000+ logs may be slow.

**Approach:** Lazy load heatmap client-side. Frontend fetches heatmap data in chunks (e.g., month-by-month) rather than entire dataset at once. Backend endpoints support date range pagination.

---

## 13.5 Discipline Score Formula

```text
disciplineScore =
  (completionRate × 0.45)
+ (consistencyScore × 0.35)
+ (delayPenalty × 0.20)
```

Where:

- `completionRate` = completed / total scheduled, as a 0–100 value
- `consistencyScore` = completed scheduled occurrences / total scheduled occurrences over the selected period, normalized to 0–100
- `delayPenalty` = 100 minus a scaled average positive delay (0 delay or early completion = 100, 60+ min late = 0)

All inputs normalized to 0–100 before weighting.

---

## 13.6 Behavioral Drift Metric

Rolling 30-day window consistency comparison. Detects when a user's behavior is trending upward or downward over time. Calculated by comparing the consistency score of the most recent 30 days against the previous 30 days.

---

# 14. UI System

## 14.1 Web App

- Dashboard — today's occurrences with Complete / Skip actions
- Analytics dashboard
- Calendar — past and future occurrence view
- Routine management — CRUD
- Category management — dedicated category list, category CRUD, inline category creation from the routine form, and category detail/statistics views
- Historical analysis
- Export tools
- Settings — timezone, reminders, notification permission state, profile

---

## 14.2 UI Components

All UI must use shadcn/ui components. No default HTML tags. No custom CSS classes.

**Allowed components:**

- From shadcn/ui: Button, Card, Dialog, Input, Select, Switch, Badge, Alert, Tabs, Table, Skeleton, Separator, ScrollArea, Tooltip, Popover, DropdownMenu, Form, Label, Textarea, Checkbox, RadioGroup, Slider
- From sonner: toast()
- From recharts: analytics charts (wrapped in Card containers)

**Strictly forbidden:**

- Plain HTML tags in feature code: `<div>`, `<span>`, `<p>`, `<h1>`-`<h6>`, `<ul>`, `<li>`, `<a>`, `<img>`, `<button>`, `<input>`, `<select>`, `<textarea>`, `<form>` (use shadcn components instead)
- Custom CSS classes in class="" attributes
- Inline styles via style={}
- Custom className values not from shadcn/cva patterns
- globals.css content beyond Tailwind directives (no custom CSS)

**Component wrappers:**

Create shadcn-based wrappers for app-specific patterns:

- ProgressRing — composition of shadcn Card + custom SVG wrapped in shadcn component
- YearlyHeatmap — shadcn Card + grid layout using only Tailwind utilities

---

## 14.3 UI Consistency Requirements

The web UI must be consistent across all screens and flows.

**Strict shadcn/ui + Tailwind only rules:**

- ALL UI must use shadcn/ui components from `components/ui` — no exceptions
- ALL styling must use Tailwind utility classes — no custom CSS classes
- NO inline styles via style={} — use Tailwind utilities or shadcn variants
- NO default HTML tags in feature code — use shadcn components:
  - Use `<Button>` not `<button>`
  - Use `<Card>` not `<div className="card">`
  - Use `<Input>` not `<input>`
  - Use `<Dialog>` not custom modal divs
  - Use `<Form>` + `<Label>` not plain form tags
- NO custom CSS in `globals.css` — only Tailwind directives (@tailwind base/components/utilities)
- NO custom CSS modules — use Tailwind utilities only
- NO emotion/styled-components/css-in-js — use Tailwind utilities only
- NO className values not from shadcn/cva patterns — use class-variance-authority for variants

**Component rules:**

- Use `class-variance-authority`, `clsx`, and `tailwind-merge` for reusable component variants
- Do not import Radix UI primitives directly; Radix exists only inside shadcn/ui components
- All modals use shadcn Dialog with consistent header/body/footer structure
- Routine/category create/edit compose shared modal/form shadcn components
- Confirmation uses one shadcn Dialog-based confirmation component
- Forms use shadcn Form + Label + Input + Select patterns
- Empty/loading/error states use shadcn Alert, Skeleton, or Card patterns
- Page layouts use shadcn Separator for section gaps
- Similar surfaces use same Tailwind spacing scale (p-4, gap-4, etc.)
- Cards use shadcn Card with CardHeader/CardTitle/CardContent
- Icon buttons use shadcn Button with variant="ghost" + size="icon"
- Skeletons use shadcn Skeleton components matching real layout

**Layout composition:**

- Feature code composes shadcn components — not raw HTML
- Use shadcn ScrollArea for scrollable regions
- Use shadcn Tabs for tab navigation
- Use shadcn Table for data tables
- Use shadcn Tooltip for help text
- Use shadcn Popover for dropdown content
- Use shadcn DropdownMenu for action menus

**globals.css requirement:**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
/* Nothing else — no custom styles, no theme overrides */
```

All visual variety comes from:

1. Tailwind utilities in class names
2. shadcn component variants
3. class-variance-authority patterns

---

## 14.4 Confirmation Requirements

Destructive, irreversible, and sensitive actions must show a confirmation step before the final mutation or export begins.

Required confirmations:

- Logout
- Delete routine (soft delete)
- Deactivate routine when it removes or hides pending future occurrences
- Edit routine schedule, recurrence, reminder override, or active state when it regenerates or removes pending occurrences
- Edit timezone
- Edit reminder or notification settings when it reschedules notification jobs
- Edit profile/account fields that affect identity or login
- Skip routine occurrence
- Export data to Excel or CSV
- Bulk actions, if added later
- Any future action that deletes data, changes historical interpretation, regenerates occurrences, revokes auth, downloads personal data, or cannot be undone

Confirmation modal rules:

- Use one shared `ConfirmationDialog` component for all confirmation flows
- The modal must use the same shadcn/ui dialog foundation, overlay, width, radius, header structure, body spacing, footer layout, and responsive behavior everywhere
- The modal must receive typed props for title, description, confirm label, cancel label, action tone, icon, loading state, and callback
- Destructive confirmations must use the same destructive button variant and placement everywhere
- Non-destructive confirmations, such as export, must use the same primary button placement and footer spacing
- Confirmation copy must clearly name the action and its consequence, such as occurrence regeneration, logout, soft deletion, skip finalization, or personal data download
- Confirm buttons must show a loading state and prevent duplicate submissions while the action is pending
- Escape, backdrop click, close button, and cancel behavior must be consistent across all confirmation modals
- Keyboard focus must move into the modal on open and return to the triggering control on close
- Confirmation modals must be responsive and usable on the supported small viewport range
- Toasts may report the result after the action completes, but they do not replace confirmation before the action

Exceptions:

- Routine completion may remain a direct action because it is the core high-frequency workflow
- Routine title/category edits that do not regenerate occurrences and do not affect auth, export, or notification behavior may save without confirmation after normal form validation
- Opening an export preview or changing local filters does not require confirmation until the file download/export action starts

---

## 14.4 Accessibility Requirements (WCAG 2.2 AA)

**Compliance Level:** WCAG 2.2 Level AA

The web application must comply with Web Content Accessibility Guidelines 2.2 Level AA to ensure accessibility for users with disabilities.

### 14.4.1 Color and Visual Contrast

- **Color contrast:** Text must have minimum contrast ratio of 4.5:1 for normal text and 3:1 for large text (18pt+ or 14pt+ bold)
- **UI components:** Visual boundaries and interactive elements must have minimum 3:1 contrast against adjacent colors
- **Color independence:** Information must not be conveyed by color alone; use icons, labels, or patterns in addition to color
- **Focus indicators:** All interactive elements must have visible focus indicators with minimum 3:1 contrast
- **Exception:** Logos and incidental decorative elements exempt from contrast requirements

### 14.4.2 Keyboard Accessibility

- **Full keyboard navigation:** All functionality must be operable via keyboard alone
- **Tab order:** Logical tab order following visual layout and DOM order
- **Skip links:** "Skip to main content" link must be present and visible on focus
- **No keyboard traps:** User must be able to navigate away from any component using standard keyboard commands
- **Shortcuts:** Keyboard shortcuts must be documented; single-key shortcuts must include disable mechanism or confirmation (WCAG 2.2)

### 14.4.3 Screen Reader Support

- **Semantic HTML:** Use proper semantic elements (`<nav>`, `<main>`, `<article>`, `<section>`, `<button>`, etc.)
- **ARIA labels:** Interactive elements without visible text must have `aria-label` or `aria-labelledby`
- **Live regions:** Dynamic content updates (toasts, loading states, errors) must use `aria-live` regions
- **Landmarks:** Page must use ARIA landmarks for navigation (`role="navigation"`, `role="main"`, etc.)
- **Lists:** Groups of related items (routine lists, occurrence lists) must use proper list semantics

### 14.4.4 Forms and Input

- **Labels:** All form inputs must have associated `<label>` elements or `aria-label`
- **Required fields:** Must be indicated programmatically (`required` attribute) and visually (asterisk + "required" text)
- **Error messages:** Validation errors must be announced to screen readers via `aria-describedby` or `aria-invalid`
- **Instructions:** Field-level instructions must be programmatically associated with inputs
- **Autocomplete:** Appropriate autocomplete values for common fields (email, timezone, etc.)

### 14.4.5 Modal and Dialog Accessibility

- **Focus trap:** When modal opens, focus must move inside and be trapped until closed
- **Focus return:** When modal closes, focus must return to triggering element
- **Escape key:** Modals must close on Escape key press
- **Focus management:** Confirmation modals, routine forms, and all dialogs must follow focus trap/return rules
- **Backdrop:** Click outside modal content must close (same as Escape)
- **ARIA attributes:** Modals must have `role="dialog"` and `aria-modal="true"`

### 14.4.6 Notifications and Alerts

- **Toasts:** Toast notifications must use `role="status"` or `role="alert"` with `aria-live`
- **Error states:** Error messages must be announced immediately (`aria-live="assertive"`)
- **Success states:** Success messages may use polite announcements (`aria-live="polite"`)
- **Dismissible:** Users must be able to dismiss persistent notifications

### 14.4.7 Touch Targets

- **Minimum size:** Touch targets must be at least 44×44 CSS pixels
- **Spacing:** Adjacent touch targets must have adequate spacing (minimum 8px between)
- **Exception:** Inline text links exempt from size requirement if context is clear

### 14.4.8 Text and Content

- **Text resize:** Text must remain readable when resized up to 200% without horizontal scrolling
- **Line height:** Line spacing must be at least 1.5 times font size for paragraphs, 2 for headings
- **Paragraph spacing:** Space after paragraphs must be at least 2 times font size
- **Character spacing:** Letter spacing in blocks must be at least 0.12 times font size
- **Word spacing:** Word spacing must be at least 0.16 times font size

### 14.4.9 Motion and Animation

- **No auto-play:** Animations must not auto-play unless user initiated
- **Pause control:** Moving, blinking, or scrolling content must have pause/stop mechanism
- **Reduced motion:** Respect `prefers-reduced-motion` media query; disable animations when set
- **Seizure safety:** No content that flashes more than 3 times per second

### 14.4.10 Tables and Data

- **Headers:** Data tables must have `<th>` elements with `scope="row"` or `scope="col"`
- **Captions:** Tables must have `<caption>` describing table content
- **Responsive:** Tables must reflow or scroll on small viewports without breaking meaning
- **Sortable:** If table columns are sortable, sort order must be announced to screen readers

### 14.4.11 Icons and Images

- **Alt text:** All images must have descriptive `alt` attribute (empty for decorative)
- **SVG icons:** Icons conveying meaning must have `aria-label` or be hidden from screen readers (`aria-hidden="true"` if decorative)
- **Icon buttons:** Buttons with only icons must have `aria-label` describing action

### 14.4.12 Time-Based Media

- **Captions:** If audio/video content added, must provide captions
- **Audio description:** Visual-only content must have audio description alternative
- **Controls:** Media controls must be keyboard accessible

### 14.4.13 Language and Reading

- **Lang attribute:** Page must have `lang` attribute on `<html>` element
- **Language changes:** Content in different language must indicate language change via `lang` attribute
- **Reading level:** Content should use clear, simple language where possible

### 14.4.14 Consistent Navigation and Identification

- **Consistent layout:** Navigation and content regions must be consistent across pages
- **Link purpose:** Link text must clearly indicate destination (avoid "click here")
- **Component labels:** Repeated components (routine cards, etc.) must have consistent labels

### 14.4.15 Error Identification and Recovery

- **Error identification:** Errors must be identified and described to user in text
- **Error suggestions:** Where possible, suggest corrections for input errors
- **Error context:** Errors must be announced at field level and form level
- **Recovery:** User must be able to recover from errors without losing data

### 14.4.16 Focus Appearance (WCAG 2.2)

- **Focus indicator:** Focus indicator must be clearly visible with minimum 3:1 contrast against adjacent colors
- **Focus scope:** Focus must be clearly visible in all contexts (modals, dropdowns, etc.)

### 14.4.17 Target Size (WCAG 2.2)

- **Touch targets:** Interactive elements must be at least 24×24 CSS pixels (enhanced from earlier guidelines)
- **Pointer targets:** Pointer targets for touch input must meet spacing and size requirements

### 14.4.18 Dragging Alternatives (WCAG 2.2)

- **Drag-free alternative:** If dragging is implemented, provide single-click alternative
- **Reorder controls:** List reordering must provide keyboard-accessible alternatives

### 14.4.19 Accessibility Testing

**Required testing before production:**

- Automated testing: Axe-core or Lighthouse accessibility audits
- Keyboard navigation: All flows tested with keyboard only
- Screen reader: Test with NVDA (Windows) or VoiceOver (Mac)
- Color contrast: Verify all text meets 4.5:1 ratio
- Touch targets: Verify minimum 44×44px on mobile
- Focus indicators: Verify visible focus on all interactive elements

**Package requirements:**

- Use `@axe-core/react` for automated accessibility testing in development
- Use eslint-plugin-jsx-a11y for accessibility linting
- Test with screen readers before major releases

---

## 14.5 Client-Side Form Schema Requirements

Every client form must have a form-level schema that matches the API input contract for the same operation.

Required form schemas:

- OTP send form
- OTP verification form
- Routine create form
- Routine edit form
- Routine delete/deactivate confirmation form, if typed confirmation input is required
- Category create form
- Category edit form
- Category delete confirmation form, if typed confirmation input is required
- Settings form
- Timezone/reminder settings subform
- Notification preferences form
- Analytics filter form
- Export configuration form
- Profile/account form, if implemented

Rules:

- Use Zod for all form-level schemas
- Use React Hook Form with `@hookform/resolvers/zod` for non-trivial forms
- Form schemas must live in shared schema modules or feature schema modules that can be reused by forms, API routes, tests, and fixtures
- Client form schemas must validate the same shape, enum values, date formats, time formats, recurrence rules, numeric ranges, and required fields as the API schemas
- Form schemas may add UI-only fields, but UI-only fields must be transformed or stripped before API submission
- API-owned fields such as `id`, `userId`, `createdAt`, `updatedAt`, `status`, `completedAt`, and server timestamps must not be accepted from form submissions unless explicitly documented
- Validation errors must render beside the relevant field using the shared form message component
- Form-level errors must render in the shared alert/error pattern inside the form or modal body
- Default values must come from typed schema-safe mappers, not duplicated inline objects across components
- Form submit buttons must be disabled or loading while a mutation is pending
- Forms must preserve typed values and show clear validation messages after failed client validation or API validation
- API Problem Details validation errors must map back to matching form fields when `errors.path` is present
- Each form schema must have focused tests for required fields, invalid values, transforms, and API payload mapping when the form controls business-critical behavior

Suggested schema module layout:

```text
lib/schemas/auth.ts
lib/schemas/routine.ts
lib/schemas/recurrence.ts
lib/schemas/settings.ts
lib/schemas/analytics.ts
lib/schemas/export.ts
lib/schemas/forms.ts        // form-specific composition only, no duplicated business rules
```

---

## 14.6 Responsive Design Requirements

The web app must be fully responsive across large, medium, and small devices.

Viewport targets:

- **Small:** phone-sized browser viewports, including iPhone SE-sized screens through iPhone 17 Pro Max-sized screens
- **Medium:** tablet and small laptop viewports
- **Large:** desktop and wide desktop viewports

Rules:

- All primary workflows must be usable at small, medium, and large viewport sizes
- Small-screen layouts must support the practical iPhone range from compact SE-sized screens through large Pro Max-sized screens
- No page may require horizontal scrolling for normal content on supported viewport widths
- Navigation must adapt for small screens without hiding required workflows
- Tables, charts, heatmaps, calendars, and analytics panels must reflow, scroll within their own bounded area, or switch to an appropriate compact representation
- Modal dialogs must fit small screens with safe internal scrolling and fixed, reachable action buttons
- Form fields, buttons, tabs, filters, and occurrence actions must remain touch-friendly on small screens
- Text must not overlap, clip, or overflow its container at supported viewport sizes
- Dashboard metric grids must collapse cleanly from desktop multi-column layouts to compact mobile layouts
- Responsive behavior must be verified at representative widths, including 320px, 375px, 390px, 430px, 768px, 1024px, 1440px, and 1920px

---

## 14.7 Frontend Code Quality Requirements

The web implementation must follow DRY, clean code, SOLID principles, modular architecture, and Next.js best practices.

Rules:

- Prefer small, focused components with one responsibility
- Extract repeated UI patterns into shared components before adding another duplicate implementation
- Keep feature-specific logic inside feature modules and shared logic inside reusable libraries/hooks
- Keep route handlers thin; move business logic into services/modules
- Validate route inputs with shared schemas, preferably Zod
- Use Server Components by default; use Client Components only for interactivity, browser APIs, local notification scheduling, or client state
- Keep browser-only notification code behind client-only hooks/modules
- Avoid mixing persistence, analytics calculation, and UI rendering in the same module
- Use clear module boundaries for auth, routines, occurrences, logs, analytics, notifications, exports, and settings
- Use named functions and explicit types for business-critical paths
- Avoid hidden duplicated constants; shared constants belong in a central constants module
- Avoid premature abstractions, but extract abstractions when duplication affects behavior or maintenance

Package usage rules:

- Use Zod for request schemas, form schemas, settings schemas, recurrence schemas, environment validation, and API response contracts where practical
- Use React Hook Form with `@hookform/resolvers/zod` for routine, settings, auth, and export forms
- Use Zustand only for local UI state such as navigation, active filters, modal state, and notification permission state
- Use TanStack Query only for client-side server-state synchronization where Server Components are not enough
- Use TanStack Table for dense logs, routines, and export-preview tables
- Use Recharts for analytics charts and dashboard visualizations
- Use SheetJS (`xlsx`) for Excel export unless styled workbook requirements justify switching to ExcelJS
- Use `@t3-oss/env-nextjs` with Zod for environment variable validation
- Use Vitest for unit tests, Testing Library for React component tests, and Playwright for browser/responsive flow tests
- Use Prettier with `prettier-plugin-tailwindcss` for deterministic formatting and Tailwind class ordering

### 14.7.1 Test Coverage Targets

**V1 Coverage Goals:**

| Type              | Target              | Priority                       |
| ----------------- | ------------------- | ------------------------------ |
| Unit tests        | 70%                 | Core business logic            |
| Integration tests | 50%                 | API routes, DB operations      |
| E2E tests         | Critical paths only | Auth, CRUD, occurrence actions |

**Critical paths (require >90% coverage):**

- Auth flows (OTP send/verify, social login, session refresh)
- Occurrence generation
- Missed detection
- Log creation (complete, skip, missed)
- Timezone change handling

**Test tools:**

- Vitest: Unit tests for pure functions, schemas, services
- Testing Library: Component tests for forms, modals, UI flows
- Playwright: E2E for auth, routine CRUD, occurrence actions, export
- MSW: API mocking for client-side tests

---

# 15. Data Export System

## 15.1 Export Types

- Full export
- Date-range export
- Routine-specific export
- Category-specific export

---

## 15.2 Output Format

Primary: Excel (.xlsx) with multiple sheets. Optional: CSV fallback.

---

## 15.3 Excel Structure

**Sheet 1 — Categories:** category metadata

**Sheet 2 — Routines:** routine metadata with current category references

**Sheet 3 — Logs (Primary Dataset):**

```text
Date | Routine Snapshot | Category Id Snapshot | Category Name Snapshot | Category Color Snapshot | Scheduled (local) | Completed (local) | Delay (min) | Status | Timezone
```

**Sheet 4 — Summary:** aggregated statistics

**Sheet 5 — Deleted Resources / Sync Tombstones:** soft-deleted routines, soft-deleted categories, removed pending occurrences, and deletion metadata required for historical context and mobile sync

---

## 15.4 Export Rules

- All times converted to user timezone at export time using `timezoneAtLog`
- Data must exactly match what analytics displays
- No partial or missing status rows
- Log rows must use `routine_logs` snapshot fields, not current routine metadata
- Deleted routines and categories must still export correctly from log snapshots
- Export actions must show the shared confirmation modal before file generation or download begins
- Export confirmation must show selected format, date range, routine/category filters, and a clear note that personal routine data will be downloaded

---

# 16. API Routes

| Route                                 | Method       | Purpose                                                   |
| ------------------------------------- | ------------ | --------------------------------------------------------- |
| `/api/v1/auth/[...all]`               | GET/POST     | Better Auth internal session handler, if required         |
| `/api/v1/auth/me`                     | GET          | Current user session                                      |
| `/api/v1/auth/otp/send`               | POST         | Send OTP code to email                                    |
| `/api/v1/auth/otp/verify`             | POST         | Verify OTP code and create session                        |
| `/api/v1/auth/social/google/start`    | GET          | Start Google social login through RoutineFlow backend     |
| `/api/v1/auth/social/google/callback` | GET          | Backend OAuth callback                                    |
| `/api/v1/auth/social/exchange`        | POST         | Exchange one-time mobile social code for bearer session   |
| `/api/v1/auth/logout`                 | POST         | Revoke current web or API session                         |
| `/api/v1/settings`                    | GET/PATCH    | Read/update timezone, reminders, notification settings    |
| `/api/v1/categories`                  | GET/POST     | List/Create routine categories                            |
| `/api/v1/categories/[id]`             | PATCH/DELETE | Update/soft-delete routine category                       |
| `/api/v1/routines`                    | GET/POST     | List/Create routines                                      |
| `/api/v1/routines/[id]`               | PATCH/DELETE | Update/soft-delete routine                                |
| `/api/v1/occurrences`                 | GET          | List occurrences by date range                            |
| `/api/v1/occurrences/generate`        | POST         | On-demand 7-day occurrence window generation              |
| `/api/v1/occurrences/[id]/complete`   | POST         | Mark eligible same-day occurrence as completed            |
| `/api/v1/occurrences/[id]/skip`       | POST         | Skip eligible same-day occurrence                         |
| `/api/v1/logs`                        | GET          | List routine logs                                         |
| `/api/v1/analytics`                   | GET          | Fetch analytics metrics                                   |
| `/api/v1/export`                      | GET          | Export data (Excel/CSV)                                   |
| `/api/v1/sync/tombstones`             | GET          | List mobile sync tombstones                               |
| `/api/v1/cron`                        | POST         | Platform scheduled-job trigger, if not handled by Inngest |

Non-application integration routes, such as `/api/inngest`, may exist for provider webhooks/SDK handlers. They must not expose RoutineFlow business resources and are not part of the public mobile API contract.

All protected API routes require either a valid web session cookie or `Authorization: Bearer <sessionToken>`.

List endpoints must support pagination or bounded date ranges. Unbounded production queries are not allowed.

## 16.1 API Contract Conventions

All application-owned API routes must use shared Zod schemas for request validation and response shaping. API contracts must be resource-oriented, REST-aligned, and stable enough for first-party mobile apps that may update slower than the web app.

Versioning:

- The API contract is V1
- Web and mobile clients must use the same resource API contract
- Do not create separate web-only and mobile-only business APIs for routines, occurrences, logs, settings, analytics, or exports
- Client-specific behavior should be handled through auth transport, headers, pagination, and response metadata, not duplicated endpoint families
- All application-owned routes must be versioned using `/api/v1/...`
- Unversioned `/api/...` application routes are not part of the V1 contract
- Breaking response or input changes require a new API version
- Additive optional fields are allowed without a new version

Supported client auth:

```text
Web:        Cookie session
Mobile/API: Authorization: Bearer <sessionToken>
```

Mobile auth acquisition:

- Web and mobile auth both use `POST /api/v1/auth/otp/send` and `POST /api/v1/auth/otp/verify`
- The email must contain a numeric OTP code only, not a verification URL
- Google social login is supported through RoutineFlow backend/web API routes
- Password login and magic-link verification are excluded from V1
- Web clients receive a secure cookie session after successful OTP verification
- Web clients receive a secure cookie session after successful social login
- Mobile/API clients receive a bearer-compatible RoutineFlow session token after successful OTP verification or social-login code exchange
- Mobile apps must not configure a native Google OAuth client in V1

Recommended client headers:

```text
Authorization: Bearer <sessionToken>       // mobile/API clients only
Content-Type: application/json             // requests with JSON bodies
Accept: application/json, application/problem+json
X-Client-Platform: web | ios | android
X-Client-Version: 1.0.0
X-Request-Id: uuid
Idempotency-Key: uuid                      // mutating requests only
```

Input conventions:

- Path parameters identify resources by public string `id`, never MongoDB `_id`
- `GET` endpoints read filters, sorting, pagination, and sync cursors from query parameters
- `POST`, `PATCH`, and other mutating endpoints use `application/json` request bodies
- `DELETE` endpoints should not require a request body
- Partial updates use `PATCH`; full replacement `PUT` is not required in V1
- Request and response field names use camelCase
- Date-only input uses `YYYY-MM-DD`
- Local time input uses `HH:mm`
- Instant/timestamp input uses ISO 8601 UTC strings
- Request bodies must reject unknown dangerous fields such as `userId`, `createdAt`, `updatedAt`, `status`, and server-owned timestamps unless explicitly documented
- List requests must be bounded by cursor pagination, explicit `limit`, or validated date ranges
- Mobile clients must be able to safely retry mutating requests with the same `Idempotency-Key`

Single-resource JSON success response:

```json
{
  "data": {
    "routine": {}
  },
  "meta": {
    "apiVersion": "v1",
    "requestId": "uuid",
    "serverTime": "2026-06-29T00:00:00.000Z"
  }
}
```

List JSON success response:

```json
{
  "data": {
    "routines": []
  },
  "meta": {
    "apiVersion": "v1",
    "requestId": "uuid",
    "serverTime": "2026-06-29T00:00:00.000Z",
    "limit": 50,
    "hasMore": true,
    "nextCursor": "opaque_cursor_or_null"
  }
}
```

Error responses must use Problem Details (`application/problem+json`):

```json
{
  "type": "https://routineflow.app/problems/validation-error",
  "title": "Validation failed",
  "status": 422,
  "detail": "One or more fields are invalid.",
  "instance": "/api/v1/routines",
  "code": "VALIDATION_ERROR",
  "requestId": "uuid",
  "errors": [
    {
      "path": "scheduledTime",
      "message": "Expected HH:mm"
    }
  ]
}
```

Rules:

- API responses expose `id`, not MongoDB `_id`
- API timestamps are ISO 8601 strings
- API local dates are `YYYY-MM-DD`
- API local times are `HH:mm`
- API responses do not include `success: true` or `success: false`; HTTP status codes and Problem Details carry the outcome
- API responses that mobile clients cache must include `updatedAt` where applicable
- Mutating endpoints must accept `Idempotency-Key` where duplicate writes are possible and be safe to retry after network failure
- Server time, not client time, is authoritative for completion, skip, missed detection, and log creation
- Request and response bodies must remain reasonably compact for mobile networks
- Error `code` values must be stable and machine-readable
- Each response must include or propagate a stable `requestId` for client support and Pino log correlation
- Response ordering must be deterministic
- Successful reads and updates return `200 OK`
- Successful creates return `201 Created` and should include a `Location` header
- Accepted async work returns `202 Accepted`
- Successful deletes return `204 No Content` when no response body is needed, or `200 OK` with deletion metadata when mobile sync requires it
- Malformed JSON, unsupported query syntax, or invalid content negotiation returns `400 Bad Request`
- Semantic validation errors return `422 Unprocessable Content`
- Unauthorized requests return `401`
- Forbidden cross-user access returns `403`
- Missing resources return `404`
- Conflict, duplicate idempotency key misuse, or invalid state transition returns `409`
- Rate-limited requests return `429`
- Unexpected server failures return `500`
- List endpoints return bounded data and pagination metadata where applicable

Pagination metadata:

```json
{
  "limit": 50,
  "hasMore": true,
  "nextCursor": "opaque_cursor_or_null",
  "total": 125,
  "page": 1
}
```

`total` and `page` are optional and should be returned only when they are required by the UI and cheap enough to compute. Cursor pagination is preferred for mobile sync.

Mobile sync metadata:

```json
{
  "serverTime": "2026-06-29T00:00:00.000Z",
  "syncToken": "opaque_sync_token"
}
```

Sync rules:

- List endpoints that mobile clients may cache should support `updatedSince` or cursor-based pagination before mobile release
- Deleted/deactivated records that affect mobile cache correctness must be represented through explicit response data or sync invalidation
- Offline mobile retries must not create duplicate routines, occurrences, or logs

## 16.2 Formal API Contract

The mobile API contract must be documented in a machine-readable OpenAPI 3.1 document before mobile release.

Required file:

```text
docs/api/openapi-v1.yaml
```

Contract rules:

- The OpenAPI file is the formal source of truth for first-party mobile clients
- Every `/api/v1` route must appear in the OpenAPI file before implementation is considered complete
- Every request body, query parameter, path parameter, header, response body, binary response, and Problem Details error response must be defined
- Security schemes must define cookie session auth and bearer token auth
- Shared schemas must include User, UserSettings, Category, Routine, Occurrence, RoutineLog, AnalyticsResponse, PaginationMeta, ApiMeta, ProblemDetails, and IdempotencyConflictProblem
- OpenAPI examples must include successful OTP login, social-login exchange, category create, category update, category soft delete, routine create, occurrence complete, occurrence skip, timezone update, soft delete, logs pagination, analytics, export, and tombstone sync
- Contract tests must validate route responses against the OpenAPI schemas
- Mobile client generation or typed API wrappers must use the OpenAPI file rather than hand-written divergent DTOs
- Breaking OpenAPI changes require `/api/v2`
- Additive optional response fields are allowed in `/api/v1` only when older mobile clients remain compatible

## 16.3 Mobile Idempotency Contract

Mobile clients may retry requests because of offline use, flaky networks, or app process death. Retryable mutating endpoints must support the `Idempotency-Key` header.

### 16.3.1 Concurrent Idempotency Handling

When two requests with same `Idempotency-Key` arrive simultaneously:

- First request processes normally
- Second request receives `409 IDEMPOTENCY_KEY_IN_PROGRESS` immediately
- Client retries after delay (exponential backoff recommended)

**Response:**

```json
{
  "type": "https://routineflow.app/problems/idempotency-in-progress",
  "title": "Idempotency key in progress",
  "status": 409,
  "code": "IDEMPOTENCY_KEY_IN_PROGRESS",
  "detail": "A request with this idempotency key is currently processing. Retry after a short delay.",
  "retryAfter": 5
}
```

### 16.3.2 Conflict Resolution: Last-Write-Wins

When mobile app edits resource while offline and user edits same resource on web:

- Server timestamp (`updatedAt`) determines winner
- Most recent server write wins
- Offline changes accepted if newer than server state
- No version conflict errors; no merge logic

**Example:**

```
1. Mobile: Edit routine title "Gym" → "Morning Gym" (offline, 10:00)
2. Web: Edit routine title "Gym" → "Strength" (online, 10:05)
3. Mobile syncs at 10:10
4. Server receives mobile update at 10:10
5. Server: web update (10:05) is newer → mobile update rejected
6. Mobile receives current state: "Strength"
```

Rules:

- Server `updatedAt` is authoritative
- Client should refresh after receiving stale update error
- No 409 CONFLICT for version mismatches (unless explicitly implemented later)

Required endpoints:

- `POST /api/v1/routines`
- `PATCH /api/v1/routines/[id]`
- `DELETE /api/v1/routines/[id]`
- `PATCH /api/v1/settings`
- `POST /api/v1/occurrences/generate`
- `POST /api/v1/occurrences/[id]/complete`
- `POST /api/v1/occurrences/[id]/skip`
- `POST /api/v1/auth/logout`
- `POST /api/v1/auth/social/exchange`

Rules:

- The header value must be a UUID or another high-entropy opaque string with 20+ bytes of entropy
- Keys are scoped to `userId + method + path`
- Anonymous public endpoints may scope keys to `email + ipHash + method + path` when required
- The server stores `requestFingerprint` after schema validation
- The fingerprint includes method, normalized path, path parameters, and normalized JSON body
- The fingerprint excludes volatile headers, auth tokens, cookies, request id, and user agent
- First request with a new key creates an `idempotency_keys` record with `status: "processing"`
- A successful mutation stores `responseStatus`, `responseBody`, `resourceType`, and `resourceId`
- Retrying the same key and same fingerprint returns the stored response with header `Idempotency-Replayed: true`
- Retrying the same key with a different fingerprint returns `409 IDEMPOTENCY_KEY_REUSED`
- If the original request is still processing, the server returns `409 IDEMPOTENCY_KEY_IN_PROGRESS` or waits briefly and returns the completed response
- If the mutation succeeded but response storage failed, the handler must recover from the resource uniqueness constraint or log uniqueness constraint before returning
- Idempotency records expire after 24 hours
- Stored response bodies must not contain bearer tokens, OTP codes, auth cookies, or secrets
- Auth token issuing endpoints may store only safe response metadata and must reconstruct sensitive token responses through the auth session record when replay is valid
- Duplicate completion or skip requests without a matching idempotency replay must return `409 INVALID_OCCURRENCE_STATE`
- Duplicate routine creates with a valid replay must not create another routine
- Duplicate soft deletes with a valid replay must return the original deletion metadata

Problem Details codes:

```text
IDEMPOTENCY_KEY_REQUIRED
IDEMPOTENCY_KEY_INVALID
IDEMPOTENCY_KEY_REUSED
IDEMPOTENCY_KEY_IN_PROGRESS
INVALID_OCCURRENCE_STATE
```

## 16.4 API Input / Output Contracts

The "Response data" examples below define the inner `data` object. JSON endpoints must wrap that object in the shared `data`/`meta` response shape from Section 16.1 unless the endpoint explicitly returns a binary file or `204 No Content`.

### `POST /api/v1/auth/otp/send`

Auth: public.

Request:

```json
{
  "email": "user@example.com",
  "name": "Demo User",
  "timezone": "Asia/Dhaka"
}
```

Response data:

```json
{
  "message": "Verification code sent to email.",
  "resendAfterSeconds": 60
}
```

Validation:

- `email` is required and must be valid
- `name` is optional, max 120 chars
- `timezone` is optional but must be a valid IANA timezone
- Rate limits apply per IP and email
- Successful OTP email send returns `202 Accepted`
- Email content must include the numeric OTP code only
- Email content must not include a login link, magic link, or verification URL
- OTP code expires after 3 minutes
- OTP code is stored only as a hash in MongoDB

### `POST /api/v1/auth/otp/verify`

Auth: public.

Request:

```json
{
  "email": "user@example.com",
  "code": "123456"
}
```

Response data:

```json
{
  "session": {
    "token": "session_token_for_api_clients",
    "expiresAt": "2026-07-06T00:00:00.000Z"
  },
  "user": {
    "id": "user_id",
    "name": "Demo User",
    "email": "user@example.com",
    "image": null
  }
}
```

Rules:

- Successful verification creates the web session cookie for web clients
- Successful verification returns a bearer-compatible session token for API/mobile clients
- Failed verification increments attempt count
- Expired, missing, or invalid OTP returns `401`
- OTP records are consumed on success and cannot be reused

### `GET /api/v1/auth/social/google/start`

Auth: public.

Query:

```text
client: web | mobile
redirectUri?: string
state?: string
```

Rules:

- Starts Google social login through the RoutineFlow backend/web API
- Web clients use a normal browser redirect and receive a web session cookie after callback
- Mobile clients open this route in the system browser and provide an allowed deep-link `redirectUri`
- Mobile clients do not use a native Google SDK or native Google OAuth client id in V1
- The server must validate `redirectUri` against `ALLOWED_REDIRECT_URIS` environment variable
- OAuth `state` must be signed or stored server-side and validated on callback

**Environment variable:**

```env
# .env.production
ALLOWED_REDIRECT_URIS="routineflow://auth/callback,https://routineflow.app/auth/callback"
```

**TODO:** Define exact `ALLOWED_REDIRECT_URIS` values before production deployment.

### `GET /api/v1/auth/social/google/callback`

Auth: public OAuth callback.

Rules:

- Handles the Google OAuth callback through Better Auth or the RoutineFlow auth service
- Creates or links the RoutineFlow user account
- Creates a web cookie session for web login
- For mobile login, creates a one-time `mobile_social_auth_codes` record and redirects to the allowlisted mobile deep link with `code` and `state`
- The callback must never redirect with a bearer session token in the URL

### `POST /api/v1/auth/social/exchange`

Auth: public with one-time mobile social code.

Headers:

```text
Idempotency-Key: uuid
```

Request:

```json
{
  "code": "one_time_exchange_code",
  "redirectUri": "routineflow://auth/callback"
}
```

Response data:

```json
{
  "session": {
    "token": "session_token_for_api_clients",
    "expiresAt": "2026-07-06T00:00:00.000Z"
  },
  "user": {
    "id": "user_id",
    "name": "Demo User",
    "email": "user@example.com",
    "image": null
  }
}
```

Rules:

- Exchanges a valid one-time social auth code for a bearer-compatible RoutineFlow session
- The code expires after 2 minutes
- The code can be consumed only once
- Reusing an already consumed or expired code returns `401`
- Bearer token responses must not be logged or stored in idempotency response bodies

### `POST /api/v1/auth/logout`

Auth: required.

Request: empty body.

Response data:

```json
{
  "revoked": true
}
```

Rules:

- Logout revokes the current web cookie session or bearer session token
- Web logout must clear the auth cookie
- Mobile/API logout invalidates the bearer token used for the request
- Reusing a revoked token returns `401`
- The web UI must show the shared confirmation modal before logout

### `GET /api/v1/auth/me`

Auth: required.

Response data:

```json
{
  "user": {
    "id": "user_id",
    "name": "Demo User",
    "email": "user@example.com",
    "image": null
  },
  "settings": {
    "timezone": "Asia/Dhaka",
    "defaultReminderMinutes": 15,
    "notificationPreferences": {
      "browserNotificationsEnabled": false
    }
  }
}
```

### `GET /api/v1/settings`

Auth: required.

Response data: current `user_settings`.

### `PATCH /api/v1/settings`

Auth: required.

Request:

```json
{
  "timezone": "Asia/Dhaka",
  "defaultReminderMinutes": 15,
  "notificationPreferences": {
    "browserNotificationsEnabled": true
  }
}
```

Response data: updated `user_settings`.

Rules:

- All fields are optional, but at least one field is required
- Timezone changes follow the workflow in Section 5.3
- Reminder changes update `notificationDueAt` for pending future occurrences
- Reminder and notification changes cancel/reschedule notification jobs for affected pending occurrences

### `GET /api/v1/categories`

Auth: required.

Query:

```text
includeDeleted?: boolean
updatedSince?: ISO timestamp
cursor?: string
limit?: number
```

Response data:

```json
{
  "categories": []
}
```

Rules:

- Default response excludes soft-deleted categories
- Categories sort by `sortOrder asc`, then `name asc`
- Mobile clients use `updatedSince` with tombstones to keep category caches current

### `POST /api/v1/categories`

Auth: required.

Headers:

```text
Idempotency-Key: uuid
```

Request:

```json
{
  "name": "Fitness",
  "color": "#1F9D5B",
  "description": "Training and movement routines",
  "sortOrder": 10
}
```

Response data:

```json
{
  "category": {}
}
```

Rules:

- Successful create returns `201 Created`
- Category names are unique per user among non-deleted categories, case-insensitive
- Routine create/edit forms may call this endpoint inline before submitting the routine payload

### `PATCH /api/v1/categories/[id]`

Auth: required.

Request: partial category update.

```json
{
  "name": "Fitness",
  "color": "#1F9D5B",
  "description": "Training and movement routines",
  "sortOrder": 10
}
```

Response data:

```json
{
  "category": {}
}
```

Rules:

- Category edits do not regenerate occurrences
- Historical `routine_logs` are never rewritten after category rename, color change, or description change
- Current routine list/detail responses should resolve current category display from the category resource

### `DELETE /api/v1/categories/[id]`

Auth: required.

Response data:

```json
{
  "deleted": true,
  "category": {
    "id": "category_id",
    "isDeleted": true,
    "deletedAt": "2026-06-29T00:00:00.000Z"
  },
  "tombstone": {
    "resourceType": "category",
    "resourceId": "category_id",
    "deletedAt": "2026-06-29T00:00:00.000Z"
  }
}
```

Rules:

- Category deletion is a soft delete
- Delete returns `409 Conflict` if any non-deleted routine still references the category
- Historical logs are never deleted or rewritten
- A category tombstone is required for mobile sync

### `GET /api/v1/routines`

Auth: required.

Query:

```text
includeInactive?: boolean
categoryId?: string
updatedSince?: ISO timestamp
cursor?: string
limit?: number
```

Response data:

```json
{
  "routines": []
}
```

### `POST /api/v1/routines`

Auth: required.

Headers:

```text
Idempotency-Key: uuid
```

Request:

```json
{
  "title": "Morning Gym",
  "categoryId": "category_fitness_id",
  "scheduledTime": "07:00",
  "recurrenceType": "weekly",
  "recurrenceRules": {
    "daysOfWeek": [1, 3, 5]
  },
  "reminderOverride": null
}
```

Response data:

```json
{
  "routine": {}
}
```

Rules:

- Successful create returns `201 Created`
- Response should include `Location: /api/v1/routines/{id}` when versioned routes are enabled
- V1 creates `scheduleType: "fixed"` only
- Creating a routine generates matching occurrences in the active 7-day window

### `PATCH /api/v1/routines/[id]`

Auth: required.

Request: partial routine update.

```json
{
  "title": "Morning Strength",
  "categoryId": "category_fitness_id",
  "scheduledTime": "07:30",
  "recurrenceType": "daily",
  "recurrenceRules": {},
  "reminderOverride": 30,
  "isActive": true
}
```

Response data:

```json
{
  "routine": {}
}
```

Rules:

- Updating schedule, reminder, recurrence, active state, or timezone regenerates pending future occurrences in the 7-day window
- Updating `categoryId` does not regenerate occurrences because category does not affect scheduling or reminders
- Historical logs are never rewritten

### `DELETE /api/v1/routines/[id]`

Auth: required.

Response data:

```json
{
  "deleted": true,
  "routine": {
    "id": "routine_id",
    "isDeleted": true,
    "deletedAt": "2026-06-29T00:00:00.000Z"
  },
  "pendingOccurrencesRemoved": 4,
  "tombstone": {
    "resourceType": "routine",
    "resourceId": "routine_id",
    "deletedAt": "2026-06-29T00:00:00.000Z"
  }
}
```

Rules:

- Routine deletion is a soft delete
- The routine document remains in MongoDB with `isDeleted: true`, `isActive: false`, and `deletedAt`
- Historical logs are never deleted or rewritten
- Pending occurrences with local date greater than or equal to the user's current local date are removed and represented through sync tombstones when needed for mobile cache correctness
- Pending occurrences older than the user's current local date must be finalized as missed before deletion cleanup
- Soft-deleted routines are excluded from default routine lists unless `includeDeleted=true`
- Creating a new routine with the same title as a soft-deleted routine is allowed unless a future product rule explicitly prevents duplicate active titles

### `GET /api/v1/occurrences`

Auth: required.

Query:

```text
date?: YYYY-MM-DD
startDate?: YYYY-MM-DD
endDate?: YYYY-MM-DD
status?: Pending | Completed | Missed | Skipped
updatedSince?: ISO timestamp
cursor?: string
```

Response data:

```json
{
  "occurrences": []
}
```

Rules:

- If `date` is provided, it takes precedence over `startDate/endDate`
- Date range is required for multi-day queries
- Maximum range is 31 days

### `POST /api/v1/occurrences/generate`

Auth: required.

Request: empty body.

Response data:

```json
{
  "windowStart": "2026-06-29",
  "windowEnd": "2026-07-05",
  "occurrencesGenerated": 4,
  "missedMarked": 1
}
```

### `POST /api/v1/occurrences/[id]/complete`

Auth: required.

Headers:

```text
Idempotency-Key: uuid
```

Request: empty body.

Response data:

```json
{
  "occurrence": {},
  "log": {}
}
```

Rules:

- Only `Pending` occurrences may be completed
- The occurrence local date must equal the user's current local date
- Future-dated and past-dated occurrences cannot be completed
- `completedAt` is server-generated UTC time
- `delayMinutes` is computed from `completedAt - scheduledTimeUtc`
- Log snapshot fields are mandatory
- Retrying with the same `Idempotency-Key` must not create duplicate logs

### `POST /api/v1/occurrences/[id]/skip`

Auth: required.

Headers:

```text
Idempotency-Key: uuid
```

Request: empty body.

Response data:

```json
{
  "occurrence": {},
  "log": {}
}
```

Rules:

- Only `Pending` occurrences may be skipped
- The occurrence local date must equal the user's current local date
- Future-dated and past-dated occurrences cannot be skipped
- Web and mobile clients must show confirmation before sending the skip mutation
- Skip writes a log immediately
- Skip does not wait for missed detection
- Skip is final in V1 and cannot be undone
- Retrying with the same `Idempotency-Key` must not create duplicate logs

### `GET /api/v1/logs`

Auth: required.

Query:

```text
startDate?: YYYY-MM-DD
endDate?: YYYY-MM-DD
routineId?: string
categoryId?: string
status?: Completed | Missed | Skipped
updatedSince?: ISO timestamp
cursor?: string
page?: number
limit?: number
```

Response data:

```json
{
  "logs": []
}
```

Meta: pagination metadata.

Rules:

- Default `limit` is 50
- Maximum `limit` is 200
- Logs sort by `date desc`, then `scheduledTime desc`

### `GET /api/v1/analytics`

Auth: required.

Query:

```text
period: daily | weekly | monthly | yearly
date?: YYYY-MM-DD
startDate?: YYYY-MM-DD
endDate?: YYYY-MM-DD
routineId?: string
categoryId?: string
```

Response data:

```json
{
  "period": "weekly",
  "metrics": {},
  "series": [],
  "generatedAt": "2026-06-29T00:00:00.000Z"
}
```

Rules:

- Analytics read from `routine_logs` only
- Future dates are excluded
- Empty datasets return zero/empty metrics, not server errors

### `GET /api/v1/export`

Auth: required.

Query:

```text
format?: xlsx | csv
range?: all | 7d | 30d | 90d | custom
startDate?: YYYY-MM-DD
endDate?: YYYY-MM-DD
routineId?: string
categoryId?: string
```

Response:

```text
Binary file response with Content-Type and Content-Disposition headers.
```

Rules:

- Default format is `xlsx`
- `range=custom` requires `startDate` and `endDate`
- Exported data must match analytics/log data for the same filters

### `GET /api/v1/sync/tombstones`

Auth: required.

Query:

```text
resourceType?: routine | occurrence | category
updatedSince?: ISO timestamp
cursor?: string
limit?: number
```

Response data:

```json
{
  "tombstones": []
}
```

Rules:

- Default `limit` is 50
- Maximum `limit` is 200
- Tombstones sort by `deletedAt asc`, then `resourceId asc`
- Mobile clients use this endpoint to remove cached routines, occurrences, or categories that no longer appear in normal list endpoints
- Tombstones must not expose user emails, auth data, or unrelated resource data

### `POST /api/v1/cron`

Auth: server-to-server scheduled-job secret.

Headers:

```text
Authorization: Bearer <scheduledJobSecret>
X-Request-Id: uuid
```

Response data:

```json
{
  "processedUsers": 12,
  "occurrencesGenerated": 40,
  "missedMarked": 8,
  "startedAt": "2026-06-29T00:00:00.000Z",
  "finishedAt": "2026-06-29T00:00:02.000Z"
}
```

Rules:

- Scheduled-job trigger route must reject missing, malformed, or invalid credentials in production
- Scheduled-job credentials must not be passed in query parameters
- Scheduled-job output must not expose user emails, OTP values, auth cookies, or secrets

---

# 17. System Architecture

## 17.1 Frontend Stack

- Next.js 16+ (web app in this repository)
- React 19+
- TypeScript 5+
- Tailwind CSS 4+ — ALL styling via Tailwind utilities only
- shadcn/ui as the ONLY component primitive layer — no default HTML tags
- React Hook Form + Zod resolver for form state and validation
- Zustand for local client UI state where needed
- TanStack Query for client-side server-state synchronization where needed
- TanStack Table for dense tabular views
- Recharts for analytics visualizations

**Styling architecture:**

- NO custom CSS classes — only Tailwind utilities
- NO inline styles — only Tailwind classes
- NO custom CSS in globals.css — only @tailwind directives
- NO CSS modules — use Tailwind utilities
- NO css-in-js libraries — use Tailwind utilities
- ALL UI components from shadcn/ui
- Component variants via class-variance-authority only

## 17.2 Backend Stack

- Next.js API routes deployed as serverless functions on Vercel or Netlify
- MongoDB native driver
- Better Auth (authentication)
- Pino for structured server-side logging
- Zod for API input/output validation
- Resend for OTP email delivery
- `@js-temporal/polyfill` for timezone-safe scheduling
- `@t3-oss/env-nextjs` + Zod for environment validation
- Mongo-backed OTP storage and rate limiting
- Inngest for durable background jobs and notification orchestration if selected for V1

## 17.3 Background Jobs

- Occurrence window maintenance: hourly, timezone-aware per user
- Missed detection: hourly catch-up over unresolved past pending occurrences
- Notification orchestration: event-driven reminder job creation, cancellation, and rescheduling

Production rules:

- Production must not rely on an always-running Node process
- Use Vercel Cron, Netlify Scheduled Functions, or Inngest for scheduled work
- Inngest is preferred when reminder jobs need durable `sleepUntil`, cancellation on occurrence changes, retry handling, and event-based orchestration
- If Inngest is used, expose the Inngest serve handler through `/api/inngest`; this route is not part of the public RoutineFlow mobile API

## 17.4 Dual Storage Mode

- **Primary:** MongoDB
- **Local/dev fallback:** Local JSON file storage
- **Production:** MongoDB required; application startup or deployment validation must fail if MongoDB is missing or unavailable

JSON fallback is for local development only and must not be used in production.

---

## 17.5 Infrastructure

- **CORS/Proxy middleware** — `proxy.ts` for API routing
- **Configuration management** — `lib/config.ts`
- **Logger utility** — Pino-backed structured logging (`lib/logger.ts`)
- **Constants** — app-wide constants (`lib/constant.ts`)
- **Auth client** — React auth utilities (`lib/auth-client.ts`)
- **Schema modules** — shared Zod schemas for auth, categories, routines, recurrence, occurrences, logs, settings, analytics, export, client forms, API contracts, and environment variables
- **UI foundation modules** — shared app shell, page layout, section, panel/card, toolbar, form field, alert, empty state, skeleton, modal, and confirmation dialog components
- **Service modules** — isolated business logic for auth, categories, routines, occurrences, missed detection, analytics, notifications, exports, and email delivery

## 17.6 Logging Requirements

The application must use structured server-side logging.

Rules:

- Use Pino as the logger implementation
- Use `pino-pretty` only in local development
- All application logs must go through `lib/logger.ts`
- Do not call `console.log`, `console.warn`, or `console.error` directly in application code
- Logs must include level, timestamp, context, message, and structured metadata
- Use child/context loggers for auth, database, routines, occurrences, scheduled jobs, analytics, export, email, and notification modules
- Redact secrets, OTP codes, auth cookies, session tokens, API keys, and sensitive personal data
- Errors must include error message, stack trace when available, context, and safe metadata
- Scheduled job and occurrence generation logs must include user-safe identifiers and counts, but not raw secrets or OTP values
- Production logs must be JSON-compatible for platform log drains and external observability tools
- Error monitoring tools such as Sentry may be added later, but they do not replace structured Pino application logs

### 17.6.1 Error Tracking Strategy

**V1 Approach:** Pino structured logs only

- Errors logged via Pino with stack traces
- JSON logs drained to platform logging (Vercel/Netlify)
- No dedicated error tracking service in V1
- External error monitoring (Sentry, etc.) deferred to V2

### 17.6.2 Performance SLOs

**Service Level Objectives:**

| Metric               | Target   |
| -------------------- | -------- |
| p50 latency (reads)  | < 500ms  |
| p95 latency (reads)  | < 1000ms |
| p99 latency (reads)  | < 2000ms |
| p50 latency (writes) | < 200ms  |
| p95 latency (writes) | < 500ms  |
| p99 latency (writes) | < 1000ms |

**Monitoring:** Platform metrics (Vercel/Netlify) or custom latency logging via Pino.

---

## 17.7 Backup Strategy

**Approach:** MongoDB Atlas automated backups

- Assumes MongoDB Atlas deployment
- Continuous backups with point-in-time recovery
- Retention policy: 30 days (configurable)
- No custom backup jobs in V1
- For self-hosted MongoDB: external backup job required (V2 scope)

---

# 18. Notification Architecture

Occurrence generation computes `notificationDueAt`. Notification delivery is separated into orchestration and transport.

## 18.1 Inngest-Based Orchestration

Inngest may be used in V1 to manage durable reminder jobs on serverless infrastructure.

Inngest responsibilities:

- Receive events when occurrences are created, updated, skipped, completed, missed, deleted, or regenerated
- Create reminder functions that wait until `notificationDueAt`
- Use durable sleep/wait behavior rather than in-process timers
- Cancel pending reminder functions when an occurrence is completed, skipped, missed, deleted, deactivated, or regenerated
- Retry transient reminder-processing failures
- Emit structured logs with occurrence id, user id, request id, and safe status metadata

Required events:

```text
occurrence.generated
occurrence.completed
occurrence.skipped
occurrence.missed
occurrence.deleted
routine.updated
routine.deleted
settings.timezoneChanged
settings.reminderChanged
notification.permissionChanged
```

Rules:

- Inngest stores orchestration state; MongoDB remains the source of truth for occurrences and logs
- Reminder functions must re-read the occurrence before delivery and send nothing unless status is still `Pending`
- Reminder functions must verify the user's latest notification preferences before delivery
- Reminder functions must be canceled/rescheduled on timezone, reminder, or routine schedule changes
- Inngest function ids/event ids must be deterministic enough to avoid duplicate active reminder jobs per occurrence
- Inngest is not a notification delivery transport by itself

## 18.2 Delivery Channels

V1 web delivery:

- Browser Notification API may display reminders when permission is granted and the browser/platform supports it
- Browser permission denial must not block core routine tracking
- Browser local reminders are best-effort and must be labeled as such in settings

Potential server-triggered delivery:

- If reliable reminders are required while the browser is closed, V1 must add a real delivery channel such as Web Push, email reminders, or future native mobile push
- Inngest can schedule and trigger those delivery attempts, but the delivery provider must be specified separately
- Without Web Push, email reminders, or native push, Inngest cannot make closed-browser reminders reliable

Sync behavior:

- On app load: fetch upcoming 7 days of occurrences and reschedule supported browser local reminders
- On timezone, reminder, notification permission, or routine schedule changes: resync occurrences and cancel/reschedule notification jobs
- Notification status in settings must clearly show enabled, denied, unsupported, and best-effort states

---

# 19. Third-Party Integrations

| Service                  | Purpose                                                                             |
| ------------------------ | ----------------------------------------------------------------------------------- |
| Better Auth              | Session management, Google social login, bearer/mobile session support              |
| MongoDB                  | Primary database                                                                    |
| Resend                   | Email delivery (OTP)                                                                |
| Inngest                  | Durable background jobs and notification orchestration on serverless infrastructure |
| Browser Notification API | Best-effort web local reminders                                                     |
| SheetJS (XLSX)           | Excel export generation                                                             |
| Pino                     | Structured server-side logging                                                      |
| Lucide Icons             | UI iconography                                                                      |
| Sonner                   | Toast notifications                                                                 |
| shadcn/ui                | Component primitives and dialogs                                                    |

## 19.1 Package Stack Requirements

| Responsibility        | Required Package(s)                                                                 | Requirement                                                                                                            |
| --------------------- | ----------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| App framework         | `next`, `react`, `react-dom`, `typescript`                                          | Use Next.js App Router, React 19+, and TypeScript for the web app                                                      |
| Styling               | `tailwindcss`, `tailwind-merge`, `clsx`, `class-variance-authority`                 | ALL styling via Tailwind utilities ONLY — no custom CSS, no inline styles, no css-in-js                                |
| UI primitives         | shadcn/ui source components                                                         | ALL UI from shadcn/ui ONLY — no default HTML tags, no custom components outside shadcn patterns                        |
| Icons                 | `lucide-react`                                                                      | Use Lucide icons for interface actions and status indicators                                                           |
| Toasts                | `sonner`                                                                            | Use for success/error feedback after user actions                                                                      |
| Theme                 | `next-themes`                                                                       | Use only if theme switching is implemented                                                                             |
| Auth                  | `better-auth`                                                                       | Use for web sessions, Google social login, bearer API sessions, session lifecycle, and adapter integration             |
| Email                 | `resend`                                                                            | Use for OTP email delivery                                                                                             |
| Validation            | `zod`                                                                               | Use for route inputs, form schemas, recurrence rules, settings, environment variables, and critical response contracts |
| Env validation        | `@t3-oss/env-nextjs` + `zod`                                                        | Validate required environment variables at startup/runtime boundaries                                                  |
| Forms                 | `react-hook-form`, `@hookform/resolvers`                                            | Use with Zod schemas for all non-trivial forms                                                                         |
| Local UI state        | `zustand`                                                                           | Use for client-only UI state; do not use for persisted server data                                                     |
| Server state          | `@tanstack/react-query`                                                             | Use when client-side syncing/caching is required beyond Server Components                                              |
| Tables                | `@tanstack/react-table`                                                             | Use for logs, routines, and export-preview tables                                                                      |
| Charts                | `recharts`                                                                          | Use for analytics charts, trend lines, score visuals, and dashboard graphs                                             |
| Date/time             | `@js-temporal/polyfill`, optional `date-fns`                                        | Use Temporal for scheduling/timezone correctness; use date-fns only for display helpers                                |
| Database              | `mongodb`                                                                           | Use the official MongoDB Node.js driver                                                                                |
| Excel export          | `xlsx`                                                                              | Use for V1 Excel and CSV export generation                                                                             |
| Logging               | `pino`                                                                              | Use for structured server-side JSON logs                                                                               |
| Dev log formatting    | `pino-pretty`                                                                       | Use only in local development for readable logs                                                                        |
| Background jobs       | `inngest`                                                                           | Preferred for durable occurrence/missed/notification orchestration in serverless deployments                           |
| API contract          | OpenAPI 3.1 tooling such as `openapi-typescript` and contract-test tooling          | Required for formal mobile API contract and typed clients                                                              |
| Rate limiting         | Mongo-backed limiter, or managed serverless-safe limiter if MongoDB is insufficient | Required for OTP send/verify abuse prevention                                                                          |
| Unit tests            | `vitest`                                                                            | Use for pure business logic, recurrence, analytics, and timezone tests                                                 |
| Component tests       | `@testing-library/react`, `@testing-library/jest-dom`                               | Use for forms, confirmation modals, shared components, and stateful UI                                                 |
| Browser tests         | `@playwright/test`                                                                  | Use for auth flow, routine CRUD, occurrence actions, export, and responsive viewport verification                      |
| Formatting            | `prettier`, `prettier-plugin-tailwindcss`                                           | Use for deterministic formatting and Tailwind class ordering                                                           |
| Accessibility testing | `@axe-core/react`                                                                   | Automated accessibility testing in development; must pass before deploy                                                |
| Accessibility linting | `eslint-plugin-jsx-a11y`                                                            | Lint for accessibility issues in JSX/TSX                                                                               |

Package boundaries:

- Business-critical schemas must live in shared schema modules and be reused by API routes, forms, and tests
- Client form schemas must compose shared business schemas instead of duplicating field rules in component files
- Confirmation flows must use the shared confirmation dialog component; feature code must not create one-off confirmation modals
- Shared layout and spacing components must be reused before adding new page-specific margin, padding, gap, or panel patterns
- Server SDKs and clients, including MongoDB and Resend, must use lazy initialization instead of module-scope runtime initialization
- Inngest client/function definitions must be isolated from request handlers except for the serve route and event-send boundaries
- Server logs must go through the Pino-backed logger module; `console.*` must not be used directly in application code
- Browser-only packages and APIs must be isolated behind client components or client hooks
- No package may introduce a second competing UI primitive layer outside shadcn/ui
- **STYLING BOUNDARIES — CRITICAL:**
  - NO custom CSS classes — only Tailwind utilities
  - NO inline styles — only Tailwind classes
  - NO custom CSS in globals.css — only @tailwind directives
  - NO CSS modules — use Tailwind utilities
  - NO css-in-js (emotion/styled-components) — use Tailwind utilities
  - NO default HTML tags in feature code — use shadcn components
  - All component variants via class-variance-authority only
- New packages require a concrete ownership and responsibility section before adoption

---

# 20. Core Design Constraint

The `routine_logs` collection is the single source of truth.

If logs are correct: analytics, exports, and future AI insights are all correct.

If logs are wrong: the entire system is wrong.

The occurrence generation scheduled job and the completion/missed/skip write paths are the most critical code paths in the system. They must be the most tested.

Every finalized log must include enough routine snapshot data to explain what the user was scheduled to do at that time without joining to the current `routines` document.

---

# 21. V1 Scope

**Included:**

- Authentication with Email OTP and Google social login
- Session management with secure web cookies
- Session refresh endpoint for mobile clients
- Shared OTP auth endpoints for web and mobile API sessions
- RoutineFlow-managed mobile social login through web/API flow, with no native Google login configuration in the mobile app
- Shared versioned `/api/v1` mobile-ready REST API contract
- Formal OpenAPI 3.1 mobile API contract
- Category CRUD
- Category detail/statistics views
- Inline category creation from routine create/edit forms
- Routine CRUD
- Routine soft delete
- Recurrence types: daily, weekly, monthly, yearly
- Occurrence generation (7-day rolling server window + app-launch fallback)
- Serverless-safe background jobs using Vercel Cron, Netlify Scheduled Functions, or Inngest
- Inngest-based notification orchestration if selected for V1
- Best-effort web local notifications using the Browser Notification API
- Overnight notification disable toggle
- Completion and skip tracking
- Skip confirmation before finalizing a skipped log
- Missed detection (server-side scheduled job)
- Job failure recovery (missed occurrences for gap period)
- Delay tracking
- Analytics (daily / weekly / monthly / yearly)
- Discipline score
- Lazy-loaded heatmap for performance
- Timezone system with per-log timezone snapshot
- Timezone change workflow with pending occurrence regeneration rules
- DST transition handling via Temporal
- Global and per-routine reminder system
- Excel export
- Behavioral drift tracking
- Mobile sync conflict resolution (Last-Write-Wins)
- Mobile idempotency with concurrent request handling
- Mobile sync tombstones for soft-deleted/removed resources (indefinite retention)
- User-controlled data retention setting
- MongoDB production storage with Atlas automated backups
- Local/dev JSON fallback
- MongoDB-only OTP storage with 3-minute expiry
- Better Auth MongoDB adapter integration
- Security layer: CORS, CSP, rate limiting, input sanitization
- Pino structured server-side logging
- Error tracking via platform logs (no dedicated service in V1)
- Performance SLOs: p95 < 1s reads, < 500ms writes
- Vitest (70% unit), Testing Library (50% integration), Playwright (critical paths) testing coverage
- shadcn/ui component system
- Zod validation and env schemas
- React Hook Form + Zod form validation
- Zustand local UI state where needed
- TanStack Query server-state synchronization where needed
- TanStack Table for dense data views
- Recharts analytics visualizations
- Temporal-based timezone-safe scheduling
- Resend OTP email delivery
- OTP rate limiting
- Prettier + Tailwind class formatting
- WCAG 2.2 AA accessibility compliance
- @axe-core/react automated accessibility testing
- eslint-plugin-jsx-a11y accessibility linting
- Keyboard navigation for all functionality
- Screen reader support with semantic HTML and ARIA
- Color contrast 4.5:1 for text, 3:1 for UI components
- Focus management and visible focus indicators
- Touch targets minimum 44×44 CSS pixels
- Micro-level, component-shaped skeleton loaders
- Shared modal foundation and consistent UI patterns
- Shared confirmation modal for logout, edit, delete, export, and other sensitive actions
- Client-side form-level Zod schemas aligned with API input contracts
- Consistent spacing, padding, margins, panel structure, and layout rhythm across all UI surfaces
- Responsive layouts for large, medium, and small browser viewports
- DRY, modular, clean-code implementation
- **STYLING ARCHITECTURE (NON-NEGOTIABLE):**
  - ALL UI via shadcn/ui components — no default HTML tags
  - ALL styling via Tailwind utilities — no custom CSS
  - NO inline styles — use Tailwind classes only
  - NO custom CSS in globals.css — only @tailwind directives
  - NO CSS modules — use Tailwind utilities
  - NO css-in-js libraries — use Tailwind utilities

**Excluded:**

- AI coach
- Team features
- Wearables
- Smart rescheduling automation
- Dynamic prayer time engine (schema is ready, implementation is V2)
- Custom interval recurrence
- Streak features
- Streak pause/resume feature
- Native mobile UI/app implementation in this repository
- Native mobile Google login configuration
- Guaranteed closed-browser reminder delivery unless Web Push, email reminders, or native push is explicitly added

---

# 22. System Behavior Summary

User signs up or signs in with email OTP or Google social login.

User defines routines once.

Server maintains a rolling 7-day occurrence window via serverless scheduled jobs, with app-launch/API fallback.

Occurrence generation computes notification due times.

The notification layer uses browser local reminders where supported and may use Inngest to orchestrate durable reminder jobs.

User interacts only by completing or skipping.

Server detects and logs missed routines at end of each user's day.

The system continuously builds a structured behavioral dataset in `routine_logs`.

That dataset drives analytics, exports, and future AI analysis.

---

# 23. Production Deployment Checklist

TODO items must be completed before production deployment.

## 23.1 Security Configuration

- [ ] Define `CORS_ALLOWED_ORIGINS` environment variable values
- [ ] Define `ALLOWED_REDIRECT_URIS` environment variable values (OAuth deep links)
- [ ] Confirm MongoDB connection pooling settings for serverless
- [ ] Configure CSP headers if external resources required
- [ ] Set up rate limiting for all API endpoints (not just OTP)

## 23.2 Infrastructure

- [ ] Configure MongoDB Atlas automated backups
- [ ] Set up Vercel Cron or Netlify Scheduled Functions
- [ ] Configure Inngest (if using for notification orchestration)
- [ ] Set up log drains for Pino JSON logs
- [ ] Configure environment variables for production

## 23.3 Monitoring & Observability

- [ ] Set up platform monitoring dashboards (Vercel/Netlify)
- [ ] Configure alert contact email via `ALERT_EMAIL` environment variable
- [ ] Test error logging via Pino
- [ ] Verify performance SLO compliance via platform metrics

## 23.4 API Contract

- [ ] Complete OpenAPI 3.1 spec at `docs/api/openapi-v1.yaml`
- [ ] Run contract tests against all `/api/v1` routes
- [ ] Verify mobile client compatibility with OpenAPI schemas
- [ ] Document all error codes and Problem Details responses

## 23.5 Testing

- [ ] Achieve 70% unit test coverage
- [ ] Achieve 50% integration test coverage
- [ ] Complete E2E tests for critical paths
- [ ] Run performance tests for analytics queries
- [ ] Test scheduled job failure recovery

## 23.6 Data Retention

- [ ] Confirm data retention policy with legal/compliance
- [ ] Configure background job for data deletion based on `dataRetentionMonths`
- [ ] Document tombstone indefinite retention approach
- [ ] Test GDPR data export if required by jurisdiction

## 23.7 Accessibility (WCAG 2.2 AA)

- [ ] Run axe-core accessibility audit — all critical issues resolved
- [ ] Run eslint-plugin-jsx-a11y — all errors resolved
- [ ] Test keyboard navigation: all flows work without mouse
- [ ] Test screen reader compatibility (NVDA/VoiceOver)
- [ ] Verify color contrast: 4.5:1 for text, 3:1 for components
- [ ] Verify touch targets: minimum 44×44 CSS pixels
- [ ] Verify focus indicators visible on all interactive elements
- [ ] Test `prefers-reduced-motion` media query respected
- [ ] Verify modal focus trap/return behavior
- [ ] Verify form labels and error announcements
- [ ] Verify skip links present and functional
- [ ] Verify lang attribute on HTML element
- [ ] Verify ARIA landmarks present

---

_End of specification. Version 2.2 — updates: architecture decisions from requirements review (Better Auth MongoDB adapter, session refresh, CORS/CSP/security layer, conflict resolution, job failure recovery, performance SLOs, DST handling, overnight notifications, test coverage targets), production deployment checklist added._
