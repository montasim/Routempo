# RoutineFlow — Mobile app UI kit (primary)

Interactive recreation of the primary React Native + Expo app, framed in an
iPhone. Open `index.html`.

## Screens

- **home.jsx** — `HomeScreen`: today's occurrences grouped by morning / evening.
  Pending rows have working Complete (green) + Skip actions that update state.
  Summary strip shows a completion ring + streak.
- **calendar.jsx** — `CalendarScreen`: month grid colored by completion
  (ink = today, green ramp = consistency, red tint = missed), tap a day to see
  its log.
- **analytics.jsx** — `AnalyticsScreen`: Daily / Weekly / Monthly / Yearly tabs
  over MetricTiles, a completion-trend bar chart, per-routine consistency bars,
  a discipline ring, and the yearly heatmap.
- **settings.jsx** — `SettingsScreen`: timezone, global + per-routine reminders,
  streak rules, export, sign out.

## Composition

Each screen file is an IIFE that reads components from
`window.RoutineFlowDesignSystem_4781a2` and assigns its screen to `window`.
`data.js` (`window.RF_DATA`) holds the shared mock dataset (modelled on what the
real app derives from `routine_logs`). `index.html` provides the phone frame,
status bar, bottom tab bar + FAB, and tab routing. Icons via Lucide CDN.
