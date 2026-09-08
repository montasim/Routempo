# Routempo Android implementation and parity plan

Status: Native implementation integrated; 71 capabilities implemented, 4 backend/foundation capabilities verified, 4 release-edge capabilities partial, and 2 web-only capabilities closed; device and production-signing gates remain
Source revision: `d927c7314a5c801035f55f52dbb870af6107e551`
Audited: 2026-09-08
Native target: Kotlin + Jetpack Compose; no WebView shell

## 1. Outcome

The repository is now a monorepo with the existing TanStack application under `apps/web/`; Wave 0 adds the first-party Kotlin/Compose Android client under `apps/mobile/`. The native client must preserve every supported Routempo workflow while adapting the web information architecture to the approved Android prototype in [`prototypes/android/v1`](../prototypes/android/v1/README.md). It must use the versioned `/api/v1` contract in [`docs/api/openapi-v1.yaml`](api/openapi-v1.yaml), not the legacy display-shaped `/api/app` endpoint.

The machine-readable parity ledger is [`android-parity.json`](android-parity.json). It is the delivery contract: a capability is not done until its Android disposition, implementation location, and passing evidence are recorded there.

## 2. Evidence and boundaries

The audit covered:

- Every TanStack route and shared component now under `apps/web/src/routes`, `apps/web/src/components`, and `apps/web/src/lib`.
- The OpenAPI contract, v1 handler, authentication/session code, integrations, notification scheduling, export/import schemas, database schema, and automated tests.
- The deployed public login experience at `https://routempo.netlify.app`.
- The 1,268-line interactive Android HTML prototype and its 796-line implementation handoff.
- PWA manifest/service worker behavior and the historical mobile design kit.

Limitations:

- Authenticated production screens were not exercised because no test account/session was provided. Static source, tests, OpenAPI, and the prototype cover those flows; authenticated runtime parity remains a pre-release test gate.
- The original audit did not have installed dependencies. Wave -1 subsequently recorded and repeated the install, typecheck, unit, and production-build baselines; section 4.3 records the exact results.
- The native Gradle project, wrapper, modules, manifest/resources, feature screens, v1 client, offline cache, notification workers, and JVM tests now exist under `apps/mobile`.
- Android Studio 2026.1.4.7 is installed. A repository-local verified JDK 17, Android SDK platforms 26/36, Build Tools 36.0.0, Platform Tools, Emulator, and Gradle 9.4.1 toolchain produce debug and minified release builds. Two system-image downloads were interrupted by host-network connection resets, so emulator/device testing and production signing remain release gates rather than being reported as passed.
- Root and scoped `AGENTS.md` files now distinguish repository, TanStack web, and Kotlin/Compose Android guidance.

## 3. Product decisions for Android

These decisions remove ambiguity before parallel implementation.

| Topic                | Android decision                                                                                                                                                                                                                         |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Native strategy      | Compose/Material 3 single-activity app. Do not ship the HTML prototype or authenticated product in a WebView.                                                                                                                            |
| Primary navigation   | Follow the Android prototype: Today, Plan, central Add, Review, Settings. Review contains Insights and Logs. This is a native adaptation of the web's five links.                                                                        |
| Today layout         | Ship prototype variant A, the chronological checklist. Preserve complete/skip semantics and add API-supported Undo. Do not copy the web bug where “Up next” follows creation order instead of time.                                      |
| Source of truth      | `/api/v1` and its category IDs, dated occurrences, cursor pagination, bearer sessions, analytics, backup, and integration endpoints. Never model a recurring routine with one global outcome status.                                     |
| Authentication       | Secure Custom Tabs plus the server's one-time-code bridge for Google and Microsoft; the v1 Google ID-token endpoint remains available for a later Credential Manager configuration. Provider-neutral account/sign-out copy.              |
| Legal/support        | Terms, Privacy, and SupportKori remain reachable from sign-in and Settings using trusted external Custom Tabs. No embedded product WebView.                                                                                              |
| Theme                | System/light/dark stored in DataStore. Web `localStorage` behavior maps to a native preference.                                                                                                                                          |
| Notifications        | Native local notifications scheduled from server settings and occurrence data. Use WorkManager for durable best-effort scheduling; do not promise exact-to-the-minute delivery. Browser Web Push/PWA mechanics are replaced, not copied. |
| Offline behavior     | Cached read-only content and explicit stale/offline state. Online writes use idempotency and retry; do not silently queue arbitrary mutations until conflict/order semantics are implemented and tested.                                 |
| Files                | Android Storage Access Framework for JSON backup/restore and CSV export. `/backup` is the interoperable format; protect occurrence history.                                                                                              |
| Errors               | Distinguish loading, empty, offline/stale, unauthenticated, validation, conflict, rate-limit, server, and retry states. A load failure must never render as an empty account.                                                            |
| Prototype precedence | `prototypes/android/v1` governs UI. `docs/design_system/ui_kits/mobile` is historical React Native/Expo material, not an implementation contract.                                                                                        |

## 4. Monorepo layout and migration

### 4.1 Implemented web layout and Android target

The migration uses `apps/` (plural) rather than `app/`. This avoids the awkward and ambiguous path `app/mobile/app/`, because `app/` is also the conventional Android application module name.

```text
Routempo/
  apps/
    web/                         # Existing TanStack Start + Nitro application/backend
      src/
      public/
      drizzle/
      tests/
      package.json              # @routempo/web dependencies and web scripts
      components.json
      drizzle.config.ts
      playwright.config.ts
      tsconfig.json
      vite.config.ts
      vitest.config.ts
      .env.example
    mobile/                      # Native Gradle/Compose Android application
      settings.gradle.kts
      build.gradle.kts
      gradle.properties
      gradle/
        libs.versions.toml
        wrapper/
      gradlew
      gradlew.bat
      app/                       # Android application module
      core/
      feature/
  docs/                          # Cross-product plans, API contract, decisions
    api/openapi-v1.yaml
    android-implementation-plan.md
    android-parity.json
  prototypes/                    # Shared design evidence; not shipped
  package.json                   # Private workspace orchestrator only
  pnpm-workspace.yaml
  pnpm-lock.yaml
  netlify.toml                   # Root deployment entry, paths adjusted for apps/web
  .gitignore
  .prettierignore
  .prettierrc
  AGENTS.md
  README.md
```

Do not literally put every current repository file inside `apps/web`. Move web-owned runtime/build/database/test files, while keeping repository governance, shared documentation, the parity ledger, Android prototype, root lockfile, and deployment orchestration at the monorepo root.

| Keep at repository root                                                                                                                                                          | Move to `apps/web/`                                                                                                                                                                                    | Do not move/copy                                                                                             |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------ |
| `docs/`, `prototypes/`, `AGENTS.md`, root `README.md`, `.gitignore`, Prettier policy, `pnpm-lock.yaml`, `pnpm-workspace.yaml`, root orchestration `package.json`, `netlify.toml` | `src/`, `public/`, `drizzle/`, `tests/`, web `package.json`, `components.json`, `drizzle.config.ts`, `playwright.config.ts`, `tsconfig.json`, `vite.config.ts`, `vitest.config.ts`, web `.env.example` | `.git/`, `node_modules/`, build outputs, caches, real `.env` files, Android Studio local files, signing keys |

### 4.2 Workspace ownership

- Rename the moved package to `@routempo/web`; its existing dependencies and app scripts stay in `apps/web/package.json`.
- Make the root `package.json` private and dependency-light. It should only orchestrate commands such as `web:dev`, `web:build`, `web:typecheck`, `web:test`, and `web:test:e2e` with `pnpm --filter @routempo/web ...`.
- Pin the validated pnpm version in the root `packageManager` field so local development, CI, and Netlify use the same workspace behavior.
- Add `packages: ["apps/web"]` to `pnpm-workspace.yaml` while retaining the existing pnpm security/release-age configuration. `apps/mobile` is Gradle-owned and must not get a fake Node wrapper merely to appear in the pnpm workspace.
- Keep one root `pnpm-lock.yaml`; do not create a second lockfile under `apps/web`.
- Keep `netlify.toml` at root with `base = "apps/web"`, `command = "pnpm build"`, and `publish = "dist"`. Paths are relative to the configured base; do not prefix the command or publish directory with `apps/web` again.
- Change root ignore patterns from root-only paths such as `/node_modules` and `/dist` to intentional monorepo patterns. Cover nested web output and Android `.gradle/`, `**/build/`, `local.properties`, IDE state, signing material, and generated APK/AAB files without ignoring checked-in Gradle wrapper files.
- Move only the committed `.env.example`. Real local secrets must be securely re-provisioned for the new web working directory (or loaded through an explicit root path); never `git mv`, copy, or commit real `.env` files. Netlify/CI environment variables remain platform-managed.
- Keep [`docs/api/openapi-v1.yaml`](api/openapi-v1.yaml) as the language-neutral shared contract. Do not attempt to share TypeScript runtime/domain source directly with Kotlin; generate or map client DTOs from the contract and share fixtures, not executable code.
- Do not add Turborepo or Nx initially. pnpm already handles the single JavaScript workspace and Gradle handles Android. Add a task orchestrator only when caching/dependency-graph needs justify its maintenance cost.
- Scoped guidance now lives in `apps/web/AGENTS.md` for TanStack/Vite rules and `apps/mobile/AGENTS.md` for Kotlin/Compose/Gradle rules; the stale root Next.js-only instruction has been narrowed.

### 4.3 Completed Wave -1 migration and verification

Wave -1 moved the web-owned source, public assets, database files, tests, and package-local configuration beneath `apps/web/`; renamed the package to `@routempo/web`; created the dependency-light root orchestrator; registered `apps/web` in the pnpm workspace; kept one root lockfile; and updated root/scoped path guidance. The recorded source revision was `d927c7314a5c801035f55f52dbb870af6107e551`.

| Gate                            | Pre-move result                                                                                                                                   | Post-move result                                                               | Disposition                                                                    |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------ |
| Frozen dependency install       | Passed                                                                                                                                            | Passed                                                                         | Verified                                                                       |
| Workspace discovery             | Single root package                                                                                                                               | `pnpm list` reported `routempo-workspace` and `@routempo/web`                  | Verified                                                                       |
| TypeScript typecheck            | Passed                                                                                                                                            | Passed                                                                         | Verified                                                                       |
| Unit/component/API tests        | 30 files, 108 tests passed                                                                                                                        | 30 files, 108 tests passed                                                     | Verified                                                                       |
| Node-server production build    | Passed                                                                                                                                            | Passed                                                                         | Verified                                                                       |
| Netlify-preset production build | Not a separate pre-move gate                                                                                                                      | Passed with `apps/web/dist` and `apps/web/.netlify/functions-internal` present | Artifact gate verified                                                         |
| Playwright E2E                  | Playwright reported 19/19 failures because the baseline configuration hardcodes `/usr/bin/google-chrome` on Windows and `DATABASE_URL` was absent | Not rerun; both unchanged environment prerequisites remain                     | Deferred environment gate; not evidence of a move regression or runtime parity |

The root Netlify configuration is now intentionally `base = "apps/web"`, `command = "pnpm build"`, and `publish = "dist"`. The successful preset build proves local artifact generation at the expected paths; it does **not** prove a hosted Netlify preview, production environment variables, provider OAuth, database migrations, service-worker delivery, or authenticated runtime behavior. Those external/runtime gates remain deferred until a disposable database, a Windows-compatible Playwright browser configuration, provider test accounts, and a preview deployment are available.

### 4.4 CI and change boundaries

- Web lane: trigger for `apps/web/**`, shared API contract, root pnpm/Netlify configuration, and relevant docs/config; run install, typecheck, unit, build, and Playwright smoke tests.
- Android lane: trigger for `apps/mobile/**`, shared API contract, parity ledger, and mobile CI configuration; run Gradle dependency verification, unit tests, lint, assemble, and selected emulator tests.
- Contract lane: changes to `docs/api/openapi-v1.yaml` or backend v1 schemas trigger both web/server contract tests and Android client contract tests.
- Root-only documentation changes should not rebuild both products unless they change the contract, parity ledger, or build configuration.
- Keep web/backend and mobile release versioning independent; a monorepo does not require synchronized app releases.

## 5. Complete micro-feature inventory

### 5.1 Entry, authentication, shell, and global behavior

| Area                | Micro-level behavior to preserve or adapt                                                                                                                                                                       |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Launch/session      | Restore secure bearer session; refresh near expiry; serialize concurrent refresh; route signed-out users to sign-in; route valid sessions to Today; clear session and protected cache on terminal auth failure. |
| Sign-in             | Google and Microsoft actions; busy/disabled state; cancel; provider/network/server errors; return to Today; explain that Calendar/Tasks access is granted separately.                                           |
| Sign-in education   | Plan, Record, Learn product explanation; manual paging; optional auto-advance only when visible; pause for interaction; honor reduced motion.                                                                   |
| Legal               | Terms and Privacy links from sign-in and Settings; safe external navigation and return.                                                                                                                         |
| Support             | Native Settings/About support entry opening the existing SupportKori destination.                                                                                                                               |
| Shell               | Bottom navigation with selected state; central Add action; Android back-stack behavior; deep-link routing; avatar with image/initial fallback; timezone-aware date.                                             |
| Account             | Name/email display, Settings shortcut, confirmation-gated sign-out, progress/error feedback, provider-neutral managed-email copy.                                                                               |
| Theme               | System default, light, and dark; persistence; live recomposition; accessible contrast.                                                                                                                          |
| Feedback            | Progress indicators, skeletons, field errors, banners/snackbars, confirmation dialogs, retry actions, and one-shot success/error messages without duplication after rotation.                                   |
| Invalid/fatal state | Unknown deep link shows a recoverable unavailable screen; screen failure offers Retry and Today; never show a web-style 404 inside a WebView.                                                                   |
| New account         | Authenticated onboarding/empty account is distinct from load failure; defaults are 10 minutes before with routine/weekly notifications off.                                                                     |

### 5.2 Today and occurrence execution

| Area           | Micro-level behavior                                                                                                                                                                                                                                    |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Greeting       | Morning/afternoon/evening from the saved timezone and first name.                                                                                                                                                                                       |
| Load           | Request today's dated occurrences; support API date ranges no wider than 93 days; generate/resolve missed state through v1 behavior; chronological time/title order; refresh and retry.                                                                 |
| Empty states   | No routines at all → Add first routine; routines exist but none today → Plan/Add; offline without cache; server failure.                                                                                                                                |
| Checklist      | Time, title, category, optional note, pending/completed/skipped state, accessible status and actions; completed items remain understandable.                                                                                                            |
| Complete       | Idempotent complete request; immediate busy/optimistic feedback; audit log side effect; success snackbar; error rollback; prevent double submission.                                                                                                    |
| Skip           | Confirmation; explain only this occurrence is skipped; idempotent request; audit log side effect; success/error behavior.                                                                                                                               |
| Undo           | Snackbar action invokes occurrence revert; returns occurrence to pending and removes/reconciles its generated outcome log per API behavior; handles expired/missing/conflicting state. An already-resolved outcome must be reverted before changing it. |
| All done       | Distinct completion state after every occurrence is resolved while weekly summary remains available.                                                                                                                                                    |
| Weekly summary | Monday–Sunday marks, today's completion percentage, complete/partial/empty meaning, and link to Review/Insights when history exists or Plan otherwise.                                                                                                  |
| Detail         | Today opens dated-occurrence detail with valid complete/skip/revert actions; future/past Plan and All routines open definition detail without illegal Today actions.                                                                                    |

### 5.3 Routine creation, recurrence, detail, and management

| Area              | Micro-level behavior                                                                                                                                                                                                                                                                  |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Entry points      | Central Add, Today empty/add, Plan empty/add, selected non-past Plan date; preserve the selected date when valid.                                                                                                                                                                     |
| Basics            | Required title: preserve the web's max 120 after resolving the current v1 max-100 mismatch; required start date; required 24-hour API time with localized picker/display; default 08:00; optional note max 160. Do not freeze the Kotlin constraint until Wave 0 aligns the contract. |
| Past guard        | New start date cannot be before today in saved timezone; all entry points enforce it; editing an existing past start date remains possible.                                                                                                                                           |
| Repeat            | Once, daily, weekly, monthly, yearly; start/end inclusive; once strips end and unused repeat fields.                                                                                                                                                                                  |
| Weekly            | One or more weekdays; seed from start date; cannot remove final selection; Sunday–Saturday controls have group semantics.                                                                                                                                                             |
| Monthly           | Day 1–31; dates absent from shorter months generate no occurrence.                                                                                                                                                                                                                    |
| Yearly            | Month plus valid day; February 29 only occurs in leap years.                                                                                                                                                                                                                          |
| End date          | Optional, clearable, never before start; changing start date reconciles repeat day/month values.                                                                                                                                                                                      |
| Category          | Required searchable selector; select by stable ID; inline create; NFKC-normalize/trim; max 60; case-folded duplicate rejection (or select the existing category returned by a race); empty custom value gets an inline error.                                                         |
| Save              | Client validation mirrors API; server field/problem errors map to fields or form; busy state; safe retry with idempotency; successful create returns to context.                                                                                                                      |
| Definition detail | Title, note, schedule, recurrence summary, date range, category, active state; edit, pause/resume, delete.                                                                                                                                                                            |
| Edit              | Pre-populate fields; preserve stable routine ID/mappings; reconcile future occurrences per server; clear obsolete recurrence fields.                                                                                                                                                  |
| Pause/resume      | Immediate confirmed state; paused routines disappear from scheduled views and reminder scheduling but preserve history.                                                                                                                                                               |
| Delete            | Confirmation explicitly says logs remain; remove routine definition, occurrences, future scheduling, reminders, and integration mappings; retain historical log snapshots.                                                                                                            |

### 5.4 Plan

| Area              | Micro-level behavior                                                                                                                                                             |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Tabs              | Schedule and All routines with state restoration and accessible selection semantics.                                                                                             |
| Date window       | Seven days centered on today initially (three before/three after); previous/next by seven; selected date and full accessibility label.                                           |
| Selected schedule | Count, chronological time/title order, time/title/repeat/note/category rows, refresh/retry.                                                                                      |
| Open day          | Distinct empty state; Add available today/future and disabled with explanation in the past.                                                                                      |
| All routines      | Creation/order returned by API, schedule/category metadata, active state, row detail, edit, pause/resume, delete. No invented drag reorder, bulk edit, or category filter in v1. |
| Context gating    | Today-only occurrence mutations never appear for a future/past selected date or definition-only row.                                                                             |

### 5.5 Review: Insights

| Area               | Micro-level behavior                                                                                                                            |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| Range              | 7, 30, and 90 days; default 7; selected semantics; refresh/retry.                                                                               |
| Empty              | No-account-routines action to Add; no results in current range with optional 90-day expansion; load failure is separate.                        |
| Metrics            | Completion rate, scheduled total, completed, skipped + missed. Use `/analytics`, not Android-side reconstruction from mutable current routines. |
| Daily completion   | Seven-day daily series, visual and spoken numeric values; clearly label the represented dates.                                                  |
| Distribution       | Completed, skipped, missed, and not recorded according to API response; chart has a complete TalkBack summary.                                  |
| Category breakdown | Completed/total, progress, percentage, sorted by total descending then name; semantic progress values.                                          |

### 5.6 Review: behavior logs

| Area           | Micro-level behavior                                                                                                                                                                                             |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Summary/filter | All/completed/skipped/missed counts; mutually exclusive filter; restore selected filter.                                                                                                                         |
| List           | Newest first; date/event time, title/category, scheduled/actual/variance, status; pull-to-refresh; cursor pagination with loading/retry/end states.                                                              |
| Empty          | No logs → Add first log; no matches → Show all; load/offline failure separate.                                                                                                                                   |
| Audit detail   | Event ID, recorded timestamp, actor, source, timezone snapshot, and routine snapshot; copyable values where useful.                                                                                              |
| Manual create  | Title required/max 100; ISO date; event time required/max 30; category required/max 60 with suggestions; outcome complete/skip/missed; scheduled required/max 30; actual optional/max 30; note optional/max 240. |
| Edit           | Same validation; does not edit routine; source becomes Manual edit while original actor/recorded timestamp remain per server contract.                                                                           |
| Delete         | Permanent-delete confirmation, busy/error/success states, list/summary reconciliation.                                                                                                                           |
| Export         | CSV export from `/export` via Storage Access Framework with create-document, cancellation, progress, and write failure behavior.                                                                                 |

### 5.7 Settings: profile, timezone, reminders, and delivery

| Area             | Micro-level behavior                                                                                                                                                                                                                             |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Profile          | Editable name required/max 80; provider-managed read-only email; avatar; unsaved-change/save/busy/error state.                                                                                                                                   |
| Timezone         | Search IANA IDs by identifier/readable name/UTC offset; display device zone; Use current shortcut when different; initialize a new account from device zone; save server-side.                                                                   |
| Offset           | All API values: scheduled time, 5, 10, 15, 20, 30, 45, or 60 minutes before. This corrects the prototype's missing 20/45 values.                                                                                                                 |
| Preferences      | Routine reminders and weekly summary switches are drafts until Save; explicit saved/error feedback; avoid a subscribed-but-nothing-enabled ambiguity.                                                                                            |
| Permission       | Android 13+ not-requested, granted, denied, denied permanently/system-disabled states; rationale/open-settings actions; older-version path.                                                                                                      |
| Channels         | Separate routine and weekly-summary channels with user-visible names; report channel/system disablement.                                                                                                                                         |
| Routine reminder | Enabled active occurrences, saved timezone and global offset, rolling schedule; notification opens Today/the occurrence; duplicate prevention; suppress work that is more than one hour late rather than delivering a misleading stale reminder. |
| Weekly summary   | Monday 09:00 saved timezone; notification opens Review/Insights.                                                                                                                                                                                 |
| Rescheduling     | Recompute after settings, timezone, routine, sign-in, reboot, time/timezone change, app update, and restore; cancel on sign-out/disable/delete.                                                                                                  |

### 5.8 Settings: categories

| Area       | Micro-level behavior                                                                                                                                                                                                                                               |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| List       | Empty state, search/list, usage count from routines, Add action, loading/retry.                                                                                                                                                                                    |
| Add/rename | NFKC-normalize and trim; required; max 60; case-folded duplicate validation; unchanged-name disabled; field/server errors. A create race may return/select the existing category. Rename updates assigned routines while logs keep their server-defined snapshots. |
| Delete     | Disabled with explanation while any active or paused routine uses it; otherwise confirmation and optimistic/retry-safe feedback.                                                                                                                                   |

### 5.9 Settings: backup, restore, and interoperability

| Area              | Micro-level behavior                                                                                                                                                                                      |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| JSON backup       | GET `/backup`; user chooses destination; versioned JSON; date-based suggested filename; includes settings, categories, routines, occurrences, and logs.                                                   |
| JSON restore      | Open document; JSON/type/size validation; show filename and replacement warning; explicit confirmation; PUT `/backup`; replacement, not merge; preserve full occurrence history; reload all repositories. |
| Limits            | Enforce/handle 10 MB UI limit and server limits: 1,000 routines, 500 categories, 10,000 logs, 10,000 occurrences; duplicate IDs and invalid timezone/recurrence/timestamp fail safely.                    |
| Safety            | Cancellation is non-error; parsing never mutates; partial local write does not claim success; integration mappings clearing is disclosed; app token/database are excluded from Android Auto Backup.       |
| Web compatibility | Do not round-trip rich Android backup through the legacy web import until its occurrence-loss behavior is fixed; document the warning in UI/help.                                                         |

### 5.10 Settings: Google/Microsoft integrations

| Area          | Micro-level behavior                                                                                                                                                                                                                                                       |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Status        | Checking, ready, sign-in-only, not connected, credentials unavailable, network failure, expired/reconnect; never mislabel a fetch failure as unconfigured.                                                                                                                 |
| Connect/grant | Connect, Grant access, Reconnect via Custom Tabs/App Links; cancel, invalid callback/state, expiry, and provider/server errors.                                                                                                                                            |
| Disconnect    | Confirmation and DELETE provider endpoint; local state refresh. Preserve existing integration mappings (current server behavior), so reconnect does not duplicate prior transfers, and explain that behavior. This is API/prototype capability absent from current web UI. |
| Calendar      | Separate Import/Export for Google/Microsoft; imports next 90 days up to 250 non-cancelled events; exports enabled unmapped routines, max 250, as 30-minute events.                                                                                                         |
| Tasks         | Import incomplete tasks from up to 20 lists/100 each; task routines default 08:00; export to default/first list.                                                                                                                                                           |
| Mapping rules | Provider category creation, past/invalid/blank/already-mapped skips, enabled-only export, persistent mapping prevents duplicates.                                                                                                                                          |
| Batch UX      | One operation at a time; active control says Working; other controls disabled; success/partial/failure counts; imported data refreshes without process/page restart.                                                                                                       |
| Semantics     | Manual batch transfer only; do not imply continuous or two-way synchronization; no invented sync history.                                                                                                                                                                  |

### 5.11 Cross-cutting quality and platform behavior

| Area              | Required behavior                                                                                                                                                                                                          |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| API               | JSON envelopes/problem details, `X-Request-Id`, bearer token, one refresh retry, idempotency key for retryable mutations, 401/403/404/409/429/5xx mapping, cursor pagination.                                              |
| Time              | Saved IANA zone governs greeting, today, recurrence/date gates, analytics, reminders, and manual-log defaults; API uses ISO date and 24-hour time; UI localizes display only.                                              |
| Cache/offline     | Room-backed last successful reads, freshness label, retry, no false empty state; process-death restoration; cache cleared on account change/sign-out.                                                                      |
| Security          | HTTPS release traffic; no secrets/tokens/PII in logs; encrypted/Keystore-backed session storage; backup exclusions; OAuth state/PKCE where required; exported components minimized.                                        |
| Permissions       | Request only Internet, notification permission on API 33+, auth/deep-link handling, and user-mediated document access. No location, camera, microphone, media, or broad storage permissions exist in product requirements. |
| Accessibility     | TalkBack labels/state/actions, 48dp targets, scalable text, focus order/return, semantics for tabs/charts/progress, non-color outcome cues, contrast, reduced motion.                                                      |
| Adaptive UI       | Phone bottom navigation; expanded widths may use rail/two panes; portrait/landscape; keyboard/insets; dialogs/sheets remain scrollable.                                                                                    |
| Lifecycle         | Rotation/process death preserve navigation/forms safely; foreground refresh; background work bounded; deep links and notification taps deterministic.                                                                      |
| PWA-only behavior | Web install manifest, service worker window focusing, and browser push subscription are explicitly not applicable; native installation/navigation/notifications replace them.                                              |

## 6. Recommended Kotlin architecture

Use a Gradle multi-module project rooted at `apps/mobile/`:

```text
apps/mobile/
  settings.gradle.kts
  build.gradle.kts
  gradle.properties
  gradle/libs.versions.toml
  gradle/wrapper/
  gradlew
  gradlew.bat
  app/                         # Application, root graph, deep links, files, notification workers
  core/model/                  # API/domain/UI-safe models and time abstractions
  core/network/                # v1 client, auth, envelopes, retry/idempotency
  core/data/                   # SQLite account-scoped snapshot cache
  core/designsystem/           # Theme, components, icons/assets
  feature/auth/
  feature/today/
  feature/routines/
  feature/plan/
  feature/review/
  feature/settings/
```

Implemented toolchain choices, verified on 2026-09-02:

- Android Studio Quail 4 (`2026.1.4.7`) plus a repository-local Temurin JDK 17 for deterministic command-line builds.
- Gradle wrapper 9.4.1, Android Gradle Plugin 9.2.1, and SDK Build Tools 36.0.0. Use the 9.2.1 patch rather than 9.2.0 because it includes the published 9.2.0 class-loading regression fix.
- Kotlin 2.3.21 with the matching Compose compiler plugin. AGP 9 enables built-in Kotlin; do not also apply `org.jetbrains.kotlin.android`. If the scaffold explicitly overrides AGP's Kotlin Gradle Plugin dependency, pin the override and matching KSP/Compose plugins together.
- `compileSdk = 36`, `targetSdk = 36`, `minSdk = 26`, and Compose BOM `2026.06.00`; API 37 was not available in the installed SDK repository, so the implementation deliberately uses the compatible stable Compose line.
- Install SDK platforms/system images needed to run the API 26 minimum-device suite and API 36 target-device suite, plus Platform Tools/`adb`, Emulator, and a working Windows hypervisor. An API 37 smoke device is recommended when compiling against 37.
- Compose + Material 3, coroutines/Flow, and lifecycle-aware Compose state.
- A hand-written typed OkHttp + Kotlin serialization client generated against the v1 contract.
- Native SQLite for the disposable account-scoped read cache; DataStore for theme preferences; Android Keystore-backed encrypted session storage.
- WorkManager for durable refresh/rescheduling. Use exact alarms only after a separate product/policy decision.
- Custom Tabs and the server-issued single-use mobile bridge for Google, Microsoft, and integration grants.

Architecture rules:

1. One unidirectional state model per screen: `UiState` + user actions + one-shot effects.
2. Repositories own network/cache reconciliation; composables never call HTTP or persistence directly.
3. API DTOs do not leak into UI. Map RFC/problem responses to typed domain failures.
4. Occurrence outcome is dated state. Routine definition is reusable schedule state.
5. Every retryable mutation has a stable idempotency key retained across transport retry.
6. Only the integrator owns root navigation, shared build files, manifest, version catalog, and parity ledger.

The implementation aligned these three shared backend contracts before freezing the Android behavior:

1. Widen the v1 routine-title constraint from 100 to the web's existing 120-character behavior, or make a documented product choice and migrate/reject existing longer routines deliberately. The parity recommendation is to preserve 120.
2. Fix first-login timezone initialization: have v1 consume the device IANA timezone during auth/bootstrap, or require Android to PATCH the detected timezone immediately before loading occurrences, logs, analytics, or reminders.
3. Normalize/migrate legacy localized log dates to ISO `YYYY-MM-DD` and add web↔v1 analytics compatibility tests. v1 date filters must not compare mixed display and ISO strings.

Initial Android bootstrap is a concurrent, independently recoverable fan-out because no bulk v1 bootstrap exists: `/auth/me`, `/categories`, `/routines`, the relevant `/occurrences` range, and the first `/logs` page. Fully paginate only repositories that require complete local data; do not make Today wait for all history pages.

## 7. Multi-agent delivery plan

The project can use four concurrent agents: one integrator plus three workers. Workers receive exclusive module ownership; they must not edit workspace-root files, shared contracts, `apps/mobile` build roots, or `docs/android-parity.json` directly. Each worker returns proposed parity updates and evidence to the integrator.

### Wave -1 — behavior-neutral monorepo migration (completed by integrator)

- Completed the behavior-neutral relocation and root workspace setup described in section 4.3.
- Verified frozen install, workspace discovery, typecheck, all 30 unit-test files/108 tests, the Node-server production build, and the Netlify-preset production build.
- Verified Netlify artifacts at `apps/web/dist` and `apps/web/.netlify/functions-internal` using the root configuration `base = "apps/web"`, `command = "pnpm build"`, and `publish = "dist"`.
- Deferred Playwright runtime parity because `/usr/bin/google-chrome` is not valid on Windows and no `DATABASE_URL` was supplied; a hosted Netlify preview, OAuth providers, and database-backed workflows are likewise not claimed as verified.
- Exit state: structural and local build gates passed. The deferred environment/runtime gates remain required before release, but do not block beginning owner decisions and local Android toolchain setup for Wave 0.

### Wave 0 — contracts and skeleton (completed by integrator)

- The confirmed `applicationId` and namespace are `com.montasim.routempo`; debug uses `com.montasim.routempo.debug`.
- Confirm display name, signing ownership, production/staging base URLs, OAuth redirect/App Link hosts, Play distribution, minimum SDK, and exact-vs-best-effort reminder policy.
- Install and verify Android Studio/JDK/SDK/Platform Tools/emulator plus a working Python 3 interpreter before claiming build or parity-validator evidence.
- Land and contract-test the routine-title, first-login-timezone, and legacy-log-date backend alignments above before generating final Kotlin constraints/fixtures.
- Create the `apps/mobile` Gradle wrapper/modules/version catalog, Android CI entry points, build variants, baseline manifest/security config, root navigation contracts, and test conventions.
- Convert approved logo assets to adaptive/monochrome resources; outline or rasterize the wordmark and visually verify it.
- Freeze API fixtures from OpenAPI and establish `android-parity.json` ownership.
- Barrier: clean debug build, lint, unit test, and empty Compose instrumentation suite on one API 26 and one API 36 target.

### Wave 1 — foundation

| Agent            | Exclusive ownership                                                                               | Capability focus                                                                                                 |
| ---------------- | ------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| A: platform/data | `apps/mobile/core/model`, `database`, `datastore`, `testing`                                      | typed models, saved-timezone clock, Room cache, account invalidation, fakes/fixtures                             |
| B: network/auth  | `apps/mobile/core/network`, `apps/mobile/feature/auth`                                            | envelopes/problems, request IDs, refresh mutex, idempotency, secure session, Google/Microsoft flows, legal entry |
| C: UI foundation | `apps/mobile/core/designsystem`, app-owned feature-neutral components through an agreed interface | theme, adaptive shell components, accessibility primitives, assets, loading/empty/error components               |

Integrator reconciles app wiring only after all three pass module tests. Barrier: authenticated fake-server journey, rotation/process restoration, dark/light screenshots, and no token in logs/backups.

### Wave 2 — core product journeys

| Agent                | Exclusive ownership                                        | Capability focus                                                                                  |
| -------------------- | ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| A: Today/occurrences | `apps/mobile/feature/today`                                | chronological checklist, empty/all-done, complete/skip/revert, weekly summary, notification route |
| B: routines/Plan     | `apps/mobile/feature/routines`, `apps/mobile/feature/plan` | full recurrence form/validation, definition detail, week navigation, past gating, pause/delete    |
| C: Review            | `apps/mobile/feature/review`                               | analytics ranges/charts/accessibility, log summary/filter/cursor pagination/detail/CRUD/CSV       |

Barrier: API mock contract tests for every endpoint used, Compose navigation tests, screenshots at phone/tablet widths, and each assigned parity row at least `implemented` with evidence paths.

### Wave 3 — settings and device capabilities

| Agent                        | Exclusive ownership                                               | Capability focus                                                                                    |
| ---------------------------- | ----------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| A: settings/categories       | `apps/mobile/feature/settings` profile/time/category packages     | profile constraints, IANA search, all offsets, category CRUD/delete guard                           |
| B: files/integrations        | `apps/mobile/feature/settings` transfer/integration packages      | SAF backup/restore/CSV, interoperability warning, OAuth grants, disconnect, batch/partial states    |
| C: notifications/reliability | `apps/mobile/core/notifications` plus agreed settings delivery UI | permission/channels, routine/weekly scheduling, reboot/timezone/update reschedule, offline/stale UI |

Barrier: restore a full fixture without losing occurrences, integration fake-server duplicate/partial tests, notification permission matrix on API 32/33/36, reboot/timezone reschedule tests.

### Wave 4 — independent verification and release

- Agent A: source-to-Android parity audit; search routes/components/API/tests for omitted behavior and reconcile the ledger.
- Agent B: accessibility/adaptive/manual QA on small phone, large phone, tablet, font scale 200%, TalkBack, light/dark, portrait/landscape.
- Agent C: security/reliability/release audit: auth expiry, redaction, backup exclusion, offline/retry/idempotency, deep links, signed release build, baseline profiles and crash-free smoke test.
- Integrator resolves findings, records immutable evidence, runs the parity validator, and is the only party allowed to mark the manifest complete.

### Agent handoff contract

Every worker handoff must include:

```text
Owned capability IDs:
Files changed:
Public contracts consumed/added:
Commands run and exact outcomes:
Screenshots/test reports/artifacts:
Proposed parity-ledger status/evidence changes:
Known limitations or decisions needed:
```

Integration discipline:

- Workspace-root files, `apps/mobile` build roots, application root/navigation, `AndroidManifest.xml`, generated API configuration, and the parity ledger have one owner.
- Agents work only in their assigned directories; shared contract changes are proposed before implementation.
- No wave begins until the prior barrier is green on the integration branch.
- A feature implementer cannot be its final parity reviewer.
- Failed/blocked evidence stays in the ledger; it is never replaced by an unsupported completion claim.

## 8. Verification matrix and definition of done

Required automated layers:

- Pure Kotlin tests: recurrence edge cases, saved-timezone boundaries/DST, analytics rendering models, validation, problem mapping, idempotency retention.
- Repository tests with MockWebServer: every used endpoint, refresh once, 409/429/5xx, cancellation, cursor pagination, duplicate submissions, malformed envelopes.
- DB-backed server contract tests: real auth/session persistence, first-login timezone, ISO log migration, 120-character routine titles, idempotency on every authenticated non-read request, backup replacement, integration mapping/reconnect, and web↔Android data compatibility.
- Room migration/cache/account isolation tests.
- Compose tests: all screens and empty/loading/error/offline states; navigation/back; form validation; confirmations; snackbar Undo; TalkBack semantics.
- Instrumented auth/deep-link/SAF/notification permission/channel/rescheduling tests where platform APIs require a device.
- Screenshot tests for light/dark, compact/expanded widths, large fonts, and key charts/forms.
- End-to-end staging tests for Google and Microsoft sign-in, routine lifecycle, occurrence complete/skip/revert, logs, backup/restore, integrations, and notification taps.

Release is accepted only when:

1. Every web/API/prototype capability has a ledger row and a resolved disposition.
2. Every native/shared/adapted row is `verified` with passing evidence; every not-applicable/deferred row is explicitly justified and closed.
3. `validate_parity_manifest.py docs/android-parity.json` passes and the manifest is marked complete with `source.web_root = apps/web` and `target.android_root = apps/mobile`.
4. Debug and signed release variants compile; unit/lint/instrumentation suites pass; no cleartext production traffic or secret logging exists.
5. Authenticated parity is manually exercised against staging on the supported SDK range.
6. Backup/restore round-trip retains occurrence history and integration-reset behavior is disclosed.
7. TalkBack, 48dp targets, large text, reduced motion, light/dark, and phone/tablet layouts pass the QA matrix.
8. Mobile production configuration is validated at startup/deploy time: redirect allowlist, provider credentials, API base URL, structured request-ID observability, intended CORS policy, and rate-limiting posture are owned and tested.

## 9. Release decisions still requiring project owner input

The implementation and local build gates are complete. Android is distributed independently through GitHub Releases. Version `1.0.0` uses tag `android-v1.0.0`, release title `Routempo Android v1.0.0`, APK `Routempo-android-v1.0.0.apk`, and matching `.sha256` asset. The tag-triggered workflow reads the canonical version from `apps/mobile/version.properties`, rejects mismatched tags, builds and verifies a signed APK, and publishes both assets. These production ownership decisions remain before the first public release:

- GitHub repository ownership, signing/key custody, release-notes ownership, and production OAuth configuration ownership.
- Configure the four `ROUTEMPO_*` signing secrets required by `.github/workflows/android-release.yml`; never commit the keystore or credentials.
- Staging API URL and test accounts for both Google and Microsoft.
- Verified App Link/custom callback domains and whether Microsoft sign-in is enabled at Android launch.
- Promote `ROUTEMPO_MOBILE_REDIRECT_URIS` from the committed development template into each owned deployment configuration. The server requires an exact callback allowlist; the committed development default is `routempo://auth/callback`.
- Reconfirm the implemented `minSdk = 26` support floor in the GitHub Release notes.
- Confirm that WorkManager reminders are explicitly best-effort; exact alarms are not requested by this implementation.
- Confirm the planned disconnect policy with product: preserve existing integration mappings (current server behavior) so reconnect skips prior transfers; contract-test and explain it in the confirmation/help copy.

## 10. Known source issues not to reproduce silently

- Web Today chooses “Up next” by creation order rather than time; Android uses chronological order.
- Legacy web export/import can omit or discard occurrence history; Android uses `/backup` and warns against the unsafe cross-import path.
- Web initial-load failure can look like an empty account; Android has explicit failure/stale states.
- Web does not expose occurrence Undo or integration disconnect, though v1/prototype do; Android includes both.
- Current web insights can recompute history from mutable routine definitions; Android renders server `/analytics` results.
- Manual-log web defaults can use device rather than saved timezone; Android consistently uses the saved timezone.
- Some web/legal/account copy assumes Google despite Microsoft support; Android is provider-neutral.
- Web login always displays both providers even if one is unconfigured; Android must present configuration-aware failure/availability.
- Prototype reminder choices omit 20 and 45 minutes; Android exposes all API-supported values.
- Prototype detail can expose Today-only actions from future Plan rows; Android separates definition and dated-occurrence contexts.
- The previous v1 routine-title mismatch is resolved at 120 characters and covered by schema tests.
- The previous first-login timezone gap is resolved through `X-Routempo-Timezone`, with an Android PATCH fallback for an empty saved value.
- Legacy display-formatted log dates are normalized/repaired at the v1 boundary and covered by analytics compatibility tests.

## 11. Role of `build-android-app-from-web`

Version `0.1.0` is useful here as a parity-planning skill, not as an Android builder. It contributes the capability graph, Android dispositions, agent partitioning rules, evidence requirements, and structural validator used by this plan. It does **not** generate Gradle/Compose/Kotlin code or an APK.

Pin the reviewed `0.1.0` if installing it for later agent sessions, and keep its output under source control. Android Studio/JDK/SDK/emulator setup remains a separate prerequisite.
