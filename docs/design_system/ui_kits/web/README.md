# RoutineFlow — Web dashboard UI kit (secondary)

Recreation of the secondary Next.js analytics + management dashboard. Open
`index.html`.

## Layout

- **Sidebar** — brand lockup + nav (Overview, Routines, Logs, Exports, Settings).
- **Topbar** — page title, timezone chip, Export `.xlsx` action, avatar.
- **Content** — period tabs, a KPI row of `MetricTile`s, a completion-trend
  chart, the discipline-score breakdown panel (the 40/30/20/10 weighting from the
  BRD), and the `routine_logs` table (Sheet 2 of the Excel export: Date · Routine
  · Scheduled · Completed · Delay · Status · Timezone).

## Composition

`dashboard.jsx` factors the chart, discipline panel, and logs table onto `window`
(`RFTrendChart`, `RFDisciplinePanel`, `RFLogsTable`); `index.html` assembles the
shell and reads primitives from `window.RoutineFlowDesignSystem_4781a2`. Shares
`window.RF_DATA` with the mobile kit (`../mobile/data.js`). Icons via Lucide CDN.
