# Routempo product prototype v1

Throwaway, single-file prototype aligned with the current Routempo web UI. It answers one question: does the current workflow remain understandable from an empty first-login state through the first recorded routine?

Open `index.html` directly, or serve the repository root and visit:

- `prototypes/v1/?page=login`
- `prototypes/v1/?page=today`
- `prototypes/v1/?page=plan`
- `prototypes/v1/?page=insights`
- `prototypes/v1/?page=logs`
- `prototypes/v1/?page=settings`

The retired `variant` parameter is removed automatically. The floating A/B/C prototype switcher is no longer part of v1.

## What is interactive

- Google sign-in simulation and account-menu sign-out confirmation
- empty first-login states with guided calls to action
- adding, completing, skipping, pausing, and scheduling routines
- Today, Plan, Insights, Logs, and Settings navigation
- categories, notification preferences, device timezone, and default reminder
- Routempo JSON export and replace-with-confirmation import
- light and dark themes

State is intentionally kept in memory and resets on reload. No production APIs, authentication, database, or notification service are used.

## Current product alignment

- 255.2px desktop sidebar with progress anchored at the bottom
- account avatar and menu in the top navigation
- full-width page content with matching 32px desktop gutters
- no seeded routines, categories, insights, or behavior logs
- current page names, headings, empty-state guidance, confirmation dialogs, and settings cards
- Manrope interface type, DM Mono measured values, Routempo green-gray tokens, 10px controls, and 14px panels

This is prototype code. It is intentionally separate from the production application.
