# Routempo workflow prototype v2

Throwaway HTML prototype for evaluating a simpler Routempo workflow. It is intentionally separate from the production application.

Open `index.html` directly, or serve the repository root and visit:

- `prototypes/v2/index.html?variant=A` for Clear checklist (recommended)
- `prototypes/v2/index.html?variant=B` for Now and next
- `prototypes/v2/index.html?variant=C` for Daypart groups

Use the floating switcher or the left and right arrow keys to compare variants. The selected variant is stored in the URL. Do not use the arrow shortcuts while typing in a field.

## Design question

Which Today workflow makes the next action obvious while keeping planning, review, and account management easy to find?

All three variants share the same simplified information architecture:

1. **Today** - complete or skip what is scheduled now.
2. **Routines** - review the seven-day schedule and manage recurring routines.
3. **Review** - understand outcomes and open detailed history only when needed.
4. **Settings** - preferences, integrations, import/export, and account controls.

## Workflow audit of v1

- **Five primary destinations create avoidable overlap.** Plan and Logs are useful, but their names do not explain the user goal. V2 merges Plan and routine management under Routines, then places Insights and history under Review.
- **Today presents multiple competing workflows.** A hero task plus a later list makes users learn two action patterns. V2 tests one checklist, one focus queue, and daypart grouping as separate alternatives.
- **Reversible actions ask for too much confirmation.** Completing and skipping are frequent actions. V2 applies them immediately and offers Undo. Destructive deletion still requires confirmation.
- **Recorded outcomes are not the same as scheduled work.** Completion rates must use all scheduled occurrences as the denominator. V2 always shows completed, skipped, and not recorded.
- **Adding a routine exposes recurrence complexity too early.** V2 starts with name, date, and time. Repeat controls appear only when the user turns on repeating.
- **Provider integrations compete with everyday settings.** V2 keeps Google and Microsoft inside a clearly named Integrations section with one connection state and explicit Import/Export actions.
- **Past dates can look actionable.** V2 labels past days and disables Add routine for them.
- **Status-only icons are ambiguous.** V2 pairs icons with text and keeps one semantic color per status.

## Recommended direction

Start with **Variant A: Clear checklist**. It gives every scheduled routine the same row structure, keeps chronological order, and makes completion progress understandable without hiding the rest of the day. Borrow Variant B only if user testing shows a strong need for a single-task focus mode.

## Prototype behavior

- Complete and Skip update all visible totals and expose Undo.
- Add routine uses progressive disclosure for repeat settings.
- Routines supports a centered seven-day schedule and an All routines view.
- Review uses scheduled routines as the denominator and includes history as a secondary tab.
- Settings includes notification controls and Google/Microsoft integration states.
- Theme, navigation, tabs, day selection, provider connection, and responsive layouts are interactive.
- State is held in memory and resets on refresh.
