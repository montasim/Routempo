# RoutineFlow workflow prototype v1

Throwaway HTML prototype for answering one question: which daily workflow makes RoutineFlow immediately understandable?

Open `index.html` directly, or serve the repository root and visit:

- `prototypes/v1/index.html?variant=A` for Guided home
- `prototypes/v1/index.html?variant=B` for Day timeline
- `prototypes/v1/index.html?variant=C` for Focus mode
- `prototypes/v1/index.html?variant=A&page=login` for the shared login flow

Use the floating switcher or the left and right arrow keys to compare variants. Routine completion, skipping, adding a routine, theme switching, and responsive layouts are interactive. All state is in memory and resets when the page reloads.

Each variant includes five working, URL-addressable pages:

- `&page=login` for email OTP or Google sign-in
- `&page=today` for completing or skipping today's routines
- `&page=plan` for the weekly schedule and recurring-routine controls
- `&page=insights` for completion patterns and activity history
- `&page=settings` for profile, reminders, notifications, appearance, account controls, and feedback examples

For example: `index.html?variant=A&page=plan`.

The login page includes email validation, a six-digit OTP step, resend behavior, and a simulated Google sign-in. The Settings page includes explicit controls for previewing success and error toasts and a confirmation alert. Confirmation is required before skipping or pausing a routine, changing timezone, signing out, or clearing activity. Frequent and reversible actions stay one-click.

This is prototype code. It is intentionally separate from the production Next.js app.

## Visual system

The prototype follows the repository's RoutineFlow design system:

- Manrope for headings and interface text, with DM Mono reserved for times and measured values
- A balanced green-gray neutral scale for surfaces and readable deep ink text
- An accessible forest-green scale from soft tints through deep action states
- Regular body text, medium controls, and semibold headings instead of heavy bold defaults
- A restrained display scale: 30–36px dashboard headings, 44px page titles, and a 64px maximum in Focus mode
- Completed green, Skipped amber, and Missed red reserved for semantic feedback
- A 4px spacing grid, 10px controls, 14px panels, hairline borders, and restrained shadows
