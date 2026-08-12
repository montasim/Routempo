# Routempo Android v1 implementation specification

This document is the functional handoff for building the native Routempo Android app from [`index.html`](./index.html). The HTML prototype is the visual and interaction reference. The Android app must preserve the behaviors described here while reusing the existing Routempo API.

## Product goal

Routempo helps a user plan recurring routines, act on today's schedule, and review recorded outcomes with minimal effort. The app should make the next useful action obvious without hiding schedule management or history.

## Native Android target

- Kotlin and Jetpack Compose.
- Material 3 components and theming.
- Single-activity navigation.
- ViewModels for screen state.
- Repository layer for the existing Routempo API.
- API-backed persistence rather than the prototype's in-memory JavaScript state.
- Light and dark themes.
- Phone-first portrait layout with tablet-safe responsive behavior.
- App mark from [`logo.svg`](./logo.svg), converted to suitable Android launcher, notification, and in-app resources.
- Full brand lockup from [`wordmark.svg`](./wordmark.svg), available for launch, authentication, or branding surfaces that have enough horizontal space. The current prototype app bar intentionally uses the compact mark.

Do not ship the HTML prototype inside a WebView. Recreate it as native Compose UI.

## Included handoff files

The `v1` folder is self-contained for prototype review and AI-agent upload:

- [`index.html`](./index.html): complete interactive visual and behavior reference.
- [`README.md`](./README.md): native Android functionality and acceptance specification.
- [`logo.svg`](./logo.svg): square Routempo app mark used by the prototype app bar.
- [`wordmark.svg`](./wordmark.svg): horizontal Routempo mark and name lockup.

Asset rules for Android:

- Preserve the SVG geometry and brand colors.
- Use the square mark for the launcher icon source, app bar, notifications, and compact branded surfaces.
- Create Android adaptive-icon foreground and background resources from the square mark rather than placing the SVG file directly in a launcher slot.
- Create a monochrome notification icon because Android status-bar icons must not use the full-color app mark.
- Use the wordmark only where it remains legible and does not duplicate a visible `Routempo` title.
- Provide density-appropriate fallbacks if the build system cannot consume the SVG as a vector drawable without conversion.
- Do not fetch either brand asset from the original web repository or a remote URL at runtime.

The prototype still loads Manrope, DM Mono, Tailwind CSS, and Lucide from CDNs. Those are prototype implementation dependencies, not missing Android assets. Use native Compose typography, Material 3 layout primitives, and one Android-compatible icon family in the generated app.

## Prototype-only behavior

The following exists only to demonstrate the prototype and should not become product functionality unless separately requested:

- The query parameters `page` and `variant`.
- The desktop variant switcher and keyboard arrow shortcuts.
- The fixed date of August 11, 2026.
- Fixture routines, logs, profile values, and insight percentages.
- State resetting when the browser refreshes.
- Toasts that simulate API, authentication, import, and export success.

The Android app must use the device date, selected timezone, authenticated user, persisted settings, and real API results.

## Navigation and global shell

The bottom navigation contains five destinations or actions in this order:

1. **Today**
2. **Plan**
3. **Add** as a larger central action
4. **Review**
5. **Settings**

Global behavior:

- The app bar displays the Routempo logo and current destination title.
- Today also displays the current localized date below its title.
- The selected navigation item uses the brand indicator treatment.
- Add opens the routine creation bottom sheet from any normal destination.
- When Plan is displaying a past selected date, Add is disabled and explains that routines cannot be added to past days.
- Opening a bottom sheet hides the bottom navigation.
- Bottom sheets may be dismissed with the close action, the system back action, or a tap on the scrim when safe.
- Destructive actions require confirmation.
- Successful mutations display brief snackbar feedback.
- Completing, skipping, or reverting a routine provides an Undo snackbar action.
- Navigation, tabs, calendar controls, selectors, and page headers remain fixed where shown. Only the designated content region scrolls.

## Today

Today is the daily execution surface. It includes enabled routines only.

### Recommended Checklist experience

The production app should use variant A, **Checklist**, as the default Today experience.

- Show a compact **Your week** summary above the routine list.
- Show today's completed count, enabled-routine count, and completion percentage.
- Show seven weekday cells with historical percentages, a completed indicator, or an empty future state.
- Sort all routines by scheduled time ascending.
- Group routines into **Incomplete** and **Completed**.
- Show count labels as `N remaining` and `N completed`.
- A skipped routine belongs to Incomplete because it is not completed.
- Each row displays status control, routine title, time, category, and details affordance.
- Completed rows use a completed indicator and subdued text.
- Skipped rows use a skipped indicator and subdued text.
- Pending rows use an empty status indicator.
- Tapping a pending status control marks the occurrence completed.
- Tapping a completed or skipped status control marks it pending again.
- Tapping the row content opens the routine detail sheet.
- Empty groups show a clear `No incomplete routines` or `No completed routines` state.
- The weekly summary stays outside the vertically scrolling routine region.

### Status side effects

Marking an occurrence completed:

- Changes its Today status to `completed`.
- Adds a completed behavior log with routine, category, scheduled time, actual time, actor, source, timezone snapshot, and completion note.
- Updates Today progress and Review values.
- Shows a completion snackbar with Undo.

Skipping an occurrence:

- Requires confirmation from the routine detail sheet.
- Changes its Today status to `skipped`.
- Adds a skipped behavior log with no actual completion time.
- Updates Today progress and Review values.
- Shows a skipped snackbar with Undo.

Marking an occurrence as not done:

- Changes its status to `pending`.
- Shows feedback with Undo.

Undo restores the previous routine status and removes the newly created log when the original action created one.

### Explored Today variants

These variants remain documented for design history but are not required as user-selectable production modes:

- **Variant B, Next up:** presents the earliest pending routine as the primary task, exposes Mark complete, lists up to four later routines, shows a completed state when nothing is pending, and places the weekly summary below the later list.
- **Variant C, Day sections:** shows completed and pending counts, groups routines into Morning, Afternoon, and Evening, and places the weekly summary after the groups.

## Routine detail sheet

Opening a routine displays:

- Routine title.
- Scheduled time and category.
- Recurrence label: Once, Daily, Weekly, Monthly, or Yearly.
- Start date and optional end date.
- Optional note.
- Recurrence icon and compact schedule summary.

Action hierarchy:

- Pending enabled occurrence: primary **Mark complete** action.
- Completed enabled occurrence: outlined **Mark as not done** action.
- Enabled non-skipped occurrence: secondary **Skip today** action with confirmation.
- All routines: secondary **Edit routine** action.
- Enabled routine: **Pause routine** under Routine settings.
- Paused routine: **Resume routine** under Routine settings.
- All routines: **Delete routine** under Routine settings with confirmation.

Pausing removes the routine from Today and dated schedules without deleting its configuration or history. Deleting removes the routine but preserves existing behavior logs.

## Add and edit routine

The same bottom-sheet form supports creation and editing.

Fields:

- **Routine name:** required, maximum 100 characters.
- **Start date:** required. New routines cannot start in the past. When opened from Plan, default to the selected Plan date.
- **Time:** required.
- **Repeat:** required selection with values Once, Daily, Weekly, Monthly, and Yearly.
- **Days of week:** visible for Weekly and supports multiple selected weekdays.
- **Day of month:** visible for Monthly, range 1 through 31.
- **Month and date:** visible for Yearly.
- **Ends:** optional for repeating routines and hidden for Once.
- **Category:** required. Select an existing category or enter a new one.
- **Note:** optional, maximum 160 characters.

Save behavior:

- New routines start enabled with a pending occurrence state.
- Editing updates the existing routine rather than creating a copy.
- A newly entered category is added to the category collection.
- The schedule recalculates immediately after saving.
- Show `<routine name> added` or `<routine name> updated` feedback.

### Recurrence rules

- Disabled routines never occur in schedules.
- A routine does not occur before its start date.
- A routine does not occur after its optional end date.
- Once occurs only on its start date.
- Daily occurs every day within its date bounds.
- Weekly occurs only on selected weekdays.
- Monthly occurs when the calendar day equals its configured day of month.
- Yearly occurs when month and day equal its configured values.
- Production behavior for invalid calendar dates, daylight-saving changes, and timezone transitions must be deterministic and covered by tests.

## Plan

Plan owns schedule browsing and routine management. Its tab row remains fixed while tab content scrolls as needed.

### Schedule tab

- Display a bordered weekly calendar card below the tabs.
- Show the localized week range.
- Provide previous-week and next-week controls.
- Keep all seven dates visible at once.
- Reset selection to the same weekday position when changing weeks, matching the prototype behavior.
- Allow selection of any displayed date.
- Use a compact filled circle for the selected date.
- Show the selected localized date and scheduled-routine count.
- Resolve recurrence rules for the selected date.
- Exclude paused routines.
- Sort the resulting schedule by time ascending.
- Each row shows time, title, category, and a details affordance.
- Tapping a row opens the routine detail sheet.
- When no routines occur, show the **This day is open** empty state and an **Add one** action.
- Add one opens routine creation with the selected date as its start-date default.

### All routines tab

- Sort routines by scheduled time ascending.
- Group them into **Active** and **Paused**.
- Display a routine count for each group.
- Each row shows enabled or paused state, title, recurrence label, and time.
- Tapping a row opens the routine detail sheet.
- Hide the Paused group when there are no paused routines.
- Support an empty-state message for a group with no routines.

## Review

Review contains two fixed tabs: **Insights** and **Logs**.

### Insights tab

The fixed range selector supports:

- 7 days
- 30 days
- 90 days

Changing the range refreshes all insight data from the corresponding API period.

Insight content:

- Period label and overall completion percentage.
- Completed outcome count and total recorded outcome count.
- Seven-point recent daily-completion chart with weekday labels.
- Outcome totals for Completed, Skipped, and Missed.
- Category breakdown with category name, routine count, and completion percentage.
- Categories unused by any routine are omitted from the breakdown.
- Insight content scrolls below the fixed tabs and range selector.

The prototype derives most totals from its log collection but uses fixture chart and category percentages. The Android app must use real API analytics.

### Logs tab

- Show an **Add log** action in the app bar.
- Provide horizontally scrollable filters: All, Completed, Skipped, and Missed.
- Filter the visible collection immediately when a filter changes.
- Each row displays a semantic outcome icon and color, routine title, event time, category, and details affordance.
- Tapping a row opens log details.
- When a filter has no results, show a contextual empty state and Add log action.

## Behavior log detail

The log detail bottom sheet displays:

- Routine title.
- Event date and event time.
- Outcome.
- Category.
- Scheduled time.
- Actual time or `Not recorded`.
- Actor and source.
- Timezone snapshot.
- Optional note.
- Edit log action.
- Delete log action with confirmation.

Deleting a log removes that record and shows feedback. It must not delete or modify the routine.

## Add and edit behavior log

The same form supports manual creation and correction of an existing log.

Fields:

- **Routine name:** required, maximum 100 characters.
- **Date:** required.
- **Event time:** required.
- **Category:** required. Select or create a category.
- **Outcome:** Completed, Skipped, or Missed.
- **Scheduled:** required time.
- **Actual:** optional time. Store and display `Not recorded` when absent.
- **Note:** optional, maximum 240 characters.

Save behavior:

- A newly entered category is added to the category collection.
- New logs are inserted at the beginning of history.
- Manual records store actor `You`, source `Routempo Android`, current timezone snapshot, and a manually-recorded variance marker.
- Editing updates the selected log only and does not change the routine.
- Show `Log added` or `Log updated` feedback.

## Settings

Settings is a vertically scrolling page with four groups.

### Account and reminders

- **Profile and schedule** opens profile settings.
- **Routine reminders** is an independent on/off switch.
- **Weekly summary** is an independent on/off switch.
- **Appearance** toggles the complete app between light and dark themes.

### Profile and schedule

Fields and behavior:

- Name is required and editable.
- Email is visible but disabled because the authenticated account manages it.
- Timezone choices in the prototype are Asia/Dhaka, Asia/Kolkata, Europe/London, America/New_York, and UTC. Production may load the supported timezone list from the API or platform.
- Default reminder choices are At scheduled time, 5 minutes before, 10 minutes before, 15 minutes before, 30 minutes before, and 1 hour before.
- Save updates name, timezone, and default reminder and shows feedback.

### Organization and categories

The Categories bottom sheet:

- Explains that categories organize routines across Today, Plan, Insights, and Logs.
- Displays Search and Add category actions side by side.
- Search expands a labeled text field, focuses it, and filters category names case-insensitively as the user types.
- Closing Search clears the query and restores the full list.
- A no-match search displays a dedicated empty state.
- Each category displays its name and routine usage count.
- Each category can be renamed.
- A category can be deleted only when no routine uses it.
- Delete controls are disabled for categories in use.

Category mutation behavior:

- Category name is required and limited to 60 characters.
- Duplicate category creation does not create a second item.
- Renaming a category updates every routine and log using the old name.
- Successful add, rename, and delete operations show feedback.

### Calendar and task integrations

Providers:

- Google Calendar and Google Tasks.
- Microsoft Calendar and Microsoft To Do.

Provider behavior:

- Show connected state as Manage and disconnected state as Connect.
- A disconnected provider sheet explains the required access and offers Connect.
- A connected provider sheet exposes separate Calendar and Tasks or To Do groups.
- Each resource supports Import and Export.
- Import upcoming items into Routempo.
- Export enabled Routempo routines without creating duplicates.
- Connected providers can be disconnected.
- Connection and sync results display feedback.

The prototype only toggles local state and simulates success. The Android app must implement the real OAuth, permissions, API calls, duplicate prevention, cancellation, loading, and failure states supported by the backend.

### Data and account

- **Export data** starts a Routempo data export and reports completion.
- **Import data** requires confirmation because it replaces settings, categories, routines, and behavior logs.
- **Sign out** requires confirmation and then clears the authenticated session according to the API authentication contract.

## Dialogs, confirmations, and feedback

Use modal bottom sheets for details and forms.

Confirmation sheets required for:

- Skip routine occurrence.
- Delete routine.
- Delete category.
- Delete behavior log.
- Replace data through import.
- Sign out.

Confirmation sheets contain a clear title, consequence message, destructive confirmation action, and Cancel action.

Snackbar behavior:

- Routine add, update, pause, resume, and delete.
- Routine completion, skip, and mark-not-done with Undo.
- Category add, rename, and delete.
- Profile save.
- Provider connect, disconnect, import, and export.
- Data import and export.
- Log add, update, and delete.
- Sign out.

## Domain model represented by the prototype

### Routine

```text
id
title
startDate
time
category
status: pending | completed | skipped
enabled
repeat: none | daily | weekly | monthly | yearly
repeatDays: weekday indexes for weekly recurrence
repeatDate: day of month for monthly or yearly recurrence
repeatMonth: month number for yearly recurrence
endDate: optional
note: optional
```

In a production API, occurrence status should be modeled separately from the reusable routine definition when possible. A recurring routine should not have one global status shared across all dates.

### Behavior log

```text
id
date
eventTime
title
category
scheduled
actual or Not recorded
variance
status: completed | skipped | missed
actor
source
timezone
snapshot: optional note
```

### Settings

```text
name
email
timezone
default reminder
routine reminders enabled
weekly summary enabled
theme
Google connection state
Microsoft connection state
```

### Category

```text
name
routine usage count derived from routines
```

## Sorting and counting rules

- Routine times are compared as minutes since midnight, not as display strings.
- Today and Plan routine collections are ascending by scheduled time.
- Today percentage is completed enabled routines divided by all enabled routines, rounded to a whole percent.
- A skipped routine is not counted as completed.
- Paused routines are excluded from Today totals and dated schedules.
- Category usage counts all routines assigned to that category, including paused routines.
- Review outcome totals are derived from behavior logs.

## Visual and interaction requirements

- Use the HTML prototype as the visual source of truth.
- Preserve the forest-green brand palette and semantic green, amber, and red outcome colors.
- Support complete light and dark themes with equivalent hierarchy and contrast.
- Use 16 dp horizontal screen gutters.
- Follow a 4 dp spacing scale: 8 dp for tightly related elements, 12 dp for inline gaps, 16 dp for related groups, 20 dp inside sheets, and 24 dp between major sections.
- Use approximately 16 dp corners for cards, 12 dp corners for buttons and fields, full circles for status controls, and a larger top radius for bottom sheets.
- Use at least 48 by 48 dp touch targets.
- Use 72 dp rich rows and 64 dp compact rows where the prototype does.
- Keep primary actions 52 dp tall.
- Use meaningful labels with icons. Do not rely on icon-only meaning for important actions.
- Provide selected, pressed, disabled, focus, loading, success, empty, and error states.
- Support TalkBack labels, logical traversal order, scalable text, keyboard navigation where relevant, and sufficient color contrast.
- Do not require swipe gestures for any workflow.
- Respect Android system back behavior.
- Respect system safe areas and on-screen keyboard insets.
- Avoid whole-window vertical scrolling on Today and Plan. Keep controls fixed and scroll their designated lists.

## API integration requirements

The Android API is versioned under `https://routempo.netlify.app/api/v1`. During local development, use `/api/v1` on the configured backend origin. The machine-readable contract is [`../../../docs/api/openapi-v1.yaml`](../../../docs/api/openapi-v1.yaml).

Every successful JSON response uses this envelope:

```json
{
  "data": {},
  "meta": {
    "requestId": "uuid",
    "apiVersion": "v1",
    "serverTime": "2026-08-12T10:00:00.000Z",
    "total": 25,
    "nextCursor": "20"
  }
}
```

Errors use `application/problem+json` and include `status`, stable `code`, human-readable `detail`, `instance`, and `requestId`. Validation failures also include field-level `errors`.

### Authentication API

- `POST /auth/google` accepts a Google Credential Manager ID token and returns a Routempo bearer session. Send `{ "idToken": "...", "nonce": "..." }`; `nonce` is optional when the credential did not use one.
- `GET /auth/social/start` starts a Google or Microsoft flow. Open this backend URL directly in a Custom Tab with `provider` and the registered `redirectUri`; its redirect response carries the protected OAuth state cookie.
- `GET /auth/social/callback` is a backend OAuth bridge. It redirects to the Android URI with a single-use five-minute `code`.
- `POST /auth/social/exchange` accepts the `code` and identical `redirectUri`, then returns the bearer session.
- `GET /auth/me` returns the current user and settings.
- `POST /auth/refresh` extends the current session by seven days.
- `POST /auth/logout` revokes the current session.

Store the returned token with Android encrypted storage and send `Authorization: Bearer <token>` on every protected request. On `401`, attempt refresh only when the client still has a current token; otherwise clear local user data and return to authentication. Never place a token in a URL, log, analytics event, backup, or crash report.

The backend accepts only redirect URIs in `ROUTEMPO_MOBILE_REDIRECT_URIS`, a comma-separated deployment variable. The default development value is `routempo://auth/callback`. Prefer a verified HTTPS Android App Link for production.

### Application API map

| Android repository operation      | Method and endpoint                          | Important behavior                                                                                         |
| --------------------------------- | -------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Read/update profile and reminders | `GET/PATCH /settings`                        | Patch only changed fields. Timezone uses an IANA name.                                                     |
| List/create categories            | `GET/POST /categories`                       | List includes `routineCount`; duplicate normalized names do not create duplicates.                         |
| Rename/delete category            | `PATCH/DELETE /categories/{id}`              | Rename propagates to routines and logs. Delete returns `409 CATEGORY_IN_USE` while referenced.             |
| List/create routines              | `GET/POST /routines`                         | Use `includeInactive=true` for Plan → All routines. Create cannot start in the past.                       |
| Edit/pause/resume/delete routine  | `PATCH/DELETE /routines/{id}`                | Set `isActive` to pause or resume. Deletion preserves behavior logs.                                       |
| Load Today or Plan schedule       | `GET /occurrences?date=YYYY-MM-DD`           | Returns recurrence-resolved, time-sortable occurrences. Date ranges up to 93 days are supported.           |
| Warm current schedule window      | `POST /occurrences/generate`                 | Resolves today plus six days and returns a count.                                                          |
| Complete/skip occurrence          | `POST /occurrences/{id}/complete` or `/skip` | Only today's occurrence can be resolved. Both write a behavior log. An empty JSON object is valid.         |
| Mark not done / Undo              | `POST /occurrences/{id}/revert`              | Returns the occurrence to pending and removes its app-created outcome log.                                 |
| List/create behavior logs         | `GET/POST /logs`                             | GET supports date, routine, category, status, cursor, and limit filters.                                   |
| Correct/delete behavior log       | `PATCH/DELETE /logs/{id}`                    | Does not change the routine.                                                                               |
| Load Review insights              | `GET /analytics?range=7`, `30`, or `90`      | Returns outcome totals, completion percentage, daily series, and category breakdown.                       |
| Export/restore complete backup    | `GET/PUT /backup`                            | PUT expects the complete `routempo-data-export` version 1 object and replaces current data. Confirm first. |
| Export logs                       | `GET /export`                                | Returns downloadable CSV; optional `startDate` and `endDate`.                                              |
| Read integration state            | `GET /integrations`                          | Returns Google and Microsoft configured, connected, and ready flags.                                       |
| Connect a provider                | `POST /integrations/{provider}/connect`      | Returns a five-minute `browserUrl`. Open that URL in a Custom Tab; no bearer token is placed in the URL.   |
| Disconnect a provider             | `DELETE /integrations/{provider}`            | Unlinks `google` or `microsoft`; confirm before calling.                                                   |
| Run provider import/export        | `POST /integrations`                         | Body contains `action`, `provider`, and `resource`; duplicate sync records are skipped.                    |

List endpoints accept `limit` from 1 through 200 and a numeric `cursor` returned as `meta.nextCursor`. Occurrence IDs are opaque strings; persist and return the exact value supplied by the API rather than constructing one in Android.

The app may schedule user-visible routine reminders locally with WorkManager/AlarmManager from API routine data. The current backend push channel is browser Web Push and must not be treated as Firebase Cloud Messaging.

Do not embed private API keys or server secrets in the Android client. Use HTTPS, the backend authentication contract, secure token storage, and server-side authorization.

## Required asynchronous states

The static prototype demonstrates successful in-memory interactions. The Android app must additionally implement:

- Initial screen loading.
- Pull or explicit retry where appropriate.
- Inline form validation.
- Empty collections.
- API error messages with retry.
- Offline or unavailable-network state.
- Mutation-in-progress state that prevents duplicate submission.
- Authentication expiration and reauthentication.
- Integration permission denial and cancellation.
- Import and export progress and failure.
- Conflict handling for stale edits when required by the API.

## Android build acceptance checklist

- [ ] Today shows the current date and API-backed enabled routines.
- [ ] Checklist routines are sorted by time and grouped into Incomplete and Completed.
- [ ] Completion, skip, mark-not-done, and Undo update occurrences, logs, and progress consistently.
- [ ] Routine details expose the correct actions for pending, completed, skipped, enabled, and paused states.
- [ ] Routine create and edit support every recurrence field and validation rule.
- [ ] Plan week navigation, date selection, recurrence resolution, empty state, and time sorting work.
- [ ] All routines displays Active and Paused groups and supports pause, resume, edit, and delete.
- [ ] Review ranges load matching insight data.
- [ ] Review Logs filters and full log CRUD work.
- [ ] Settings profile, reminder switches, weekly summary, timezone, reminder offset, and theme persist.
- [ ] Category search, add, rename propagation, usage counts, and guarded deletion work.
- [ ] Google and Microsoft connection, import, export, and disconnect flows use real integrations or clearly identified backend endpoints.
- [ ] Data export, replacement import confirmation, and sign-out confirmation work.
- [ ] All destructive operations require confirmation.
- [ ] All network operations expose loading, empty, failure, retry, and success states.
- [ ] Light and dark themes pass visual and accessibility checks.
- [ ] Touch targets are at least 48 dp and content works with TalkBack and large fonts.
- [ ] Phone layouts have no horizontal overflow and designated list scrolling behaves like the prototype.
- [ ] No secrets are shipped in the application package.
- [ ] Tests cover recurrence, timezone boundaries, status-to-log side effects, Undo, category rename propagation, and destructive confirmations.

## Running the visual prototype

Open `index.html` directly or serve the repository root and visit:

- `prototypes/android/v1/index.html?variant=A` for Checklist, the recommended implementation.
- `prototypes/android/v1/index.html?variant=B` for Next up.
- `prototypes/android/v1/index.html?variant=C` for Day sections.

The prototype uses local `logo.svg` and `wordmark.svg` brand assets. Tailwind CSS, Google Fonts, and Lucide icons are loaded through CDNs for prototype rendering only. It is a throwaway visual reference, not production Android code.
