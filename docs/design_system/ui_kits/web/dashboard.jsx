// RoutineFlow web dashboard — chart + logs table pieces.
;(function () {
  const { Card, StatusPill, MetricTile, ProgressRing, HeatmapCell } =
    window.RoutineFlowDesignSystem_4781a2

  function TrendChart({ data }) {
    const max = 1
    return (
      <Card padding="lg">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
            marginBottom: 20,
          }}
        >
          <div
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "var(--text-xl)",
              fontWeight: 600,
            }}
          >
            Completion trend
          </div>
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "var(--text-xs)",
              color: "var(--text-muted)",
            }}
          >
            last 7 days · %
          </div>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            gap: 18,
            height: 200,
          }}
        >
          {data.map((d, i) => (
            <div
              key={i}
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 8,
                height: "100%",
                justifyContent: "flex-end",
              }}
            >
              <div
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "var(--text-xs)",
                  color: "var(--text-secondary)",
                }}
              >
                {Math.round(d.rate * 100)}
              </div>
              <div
                style={{
                  width: "100%",
                  maxWidth: 56,
                  height: (d.rate / max) * 150 + "px",
                  minHeight: 6,
                  background:
                    d.rate >= 0.85
                      ? "var(--completed-600)"
                      : d.rate >= 0.6
                        ? "var(--ramp-3)"
                        : "var(--skipped-500)",
                  borderRadius: "var(--radius-md) var(--radius-md) 4px 4px",
                  transition: "height var(--duration-slow) var(--ease-out)",
                }}
              />
              <div
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "var(--text-xs)",
                  color: "var(--text-faint)",
                }}
              >
                {d.day}
              </div>
            </div>
          ))}
        </div>
      </Card>
    )
  }

  function DisciplinePanel({ m }) {
    return (
      <Card
        padding="lg"
        style={{ display: "flex", flexDirection: "column", gap: 18 }}
      >
        <div
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "var(--text-xl)",
            fontWeight: 600,
          }}
        >
          Discipline score
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 22 }}>
          <ProgressRing value={m.discipline} size={120} thickness={10} />
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              gap: 10,
            }}
          >
            <Factor label="Completion rate" weight="40%" val={0.86} />
            <Factor label="Consistency" weight="30%" val={0.81} />
            <Factor label="Delay penalty" weight="20%" val={0.74} />
            <Factor label="Streak bonus" weight="10%" val={0.9} />
          </div>
        </div>
      </Card>
    )
  }

  function Factor({ label, weight, val }) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span
          style={{
            width: 120,
            fontSize: "var(--text-sm)",
            color: "var(--text-secondary)",
          }}
        >
          {label}
        </span>
        <div
          style={{
            flex: 1,
            height: 6,
            background: "var(--surface-sunken)",
            borderRadius: "var(--radius-pill)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: val * 100 + "%",
              height: "100%",
              background: "var(--interactive)",
              borderRadius: "var(--radius-pill)",
            }}
          />
        </div>
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "var(--text-2xs)",
            color: "var(--text-faint)",
            width: 30,
            textAlign: "right",
          }}
        >
          {weight}
        </span>
      </div>
    )
  }

  const LOGS = [
    {
      date: "2026-06-21",
      routine: "Morning Gym",
      sched: "07:00",
      done: "07:04",
      delay: 4,
      status: "Completed",
    },
    {
      date: "2026-06-21",
      routine: "Vitamins",
      sched: "08:15",
      done: "08:15",
      delay: 0,
      status: "Completed",
    },
    {
      date: "2026-06-21",
      routine: "Deep work block",
      sched: "09:30",
      done: null,
      delay: null,
      status: "Missed",
    },
    {
      date: "2026-06-21",
      routine: "Read 20 minutes",
      sched: "22:30",
      done: null,
      delay: null,
      status: "Skipped",
    },
    {
      date: "2026-06-20",
      routine: "Morning Gym",
      sched: "07:00",
      done: "06:58",
      delay: -2,
      status: "Completed",
    },
    {
      date: "2026-06-20",
      routine: "Language practice",
      sched: "18:00",
      done: "18:41",
      delay: 41,
      status: "Completed",
    },
  ]

  function LogsTable() {
    const cols = [
      "Date",
      "Routine",
      "Scheduled",
      "Completed",
      "Delay",
      "Status",
      "Timezone",
    ]
    return (
      <Card padding="none" style={{ overflow: "hidden" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "20px 24px",
            borderBottom: "1px solid var(--border-subtle)",
          }}
        >
          <div
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "var(--text-xl)",
              fontWeight: 600,
            }}
          >
            routine_logs
          </div>
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "var(--text-2xs)",
              color: "var(--text-muted)",
            }}
          >
            source of truth · all times Asia/Dhaka
          </div>
        </div>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: "var(--text-sm)",
          }}
        >
          <thead>
            <tr>
              {cols.map((c) => (
                <th
                  key={c}
                  style={{
                    textAlign:
                      c === "Routine" || c === "Date" ? "left" : "left",
                    padding: "12px 24px",
                    fontFamily: "var(--font-mono)",
                    fontSize: "var(--text-2xs)",
                    textTransform: "uppercase",
                    letterSpacing: "var(--tracking-caps)",
                    color: "var(--text-muted)",
                    fontWeight: 600,
                    borderBottom: "1px solid var(--border-subtle)",
                  }}
                >
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {LOGS.map((l, i) => (
              <tr
                key={i}
                style={{
                  borderBottom:
                    i < LOGS.length - 1
                      ? "1px solid var(--border-subtle)"
                      : "none",
                }}
              >
                <td style={cell("mono", "var(--text-secondary)")}>{l.date}</td>
                <td style={cell("text", "var(--text-primary)", 600)}>
                  {l.routine}
                </td>
                <td style={cell("mono")}>{l.sched}</td>
                <td style={cell("mono")}>{l.done || "—"}</td>
                <td
                  style={{
                    ...cell("mono"),
                    color:
                      l.delay == null
                        ? "var(--text-faint)"
                        : l.delay > 0
                          ? "var(--missed-600)"
                          : l.delay < 0
                            ? "var(--completed-600)"
                            : "var(--text-secondary)",
                  }}
                >
                  {l.delay == null
                    ? "—"
                    : (l.delay > 0 ? "+" : "") + l.delay + "m"}
                </td>
                <td style={{ padding: "12px 24px" }}>
                  <StatusPill status={l.status} />
                </td>
                <td style={cell("mono", "var(--text-faint)")}>Asia/Dhaka</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    )
  }

  function cell(font, color = "var(--text-secondary)", weight = 400) {
    return {
      padding: "12px 24px",
      fontFamily: font === "mono" ? "var(--font-mono)" : "var(--font-text)",
      color,
      fontWeight: weight,
      whiteSpace: "nowrap",
    }
  }

  Object.assign(window, {
    RFTrendChart: TrendChart,
    RFDisciplinePanel: DisciplinePanel,
    RFLogsTable: LogsTable,
  })
})()
