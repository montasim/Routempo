// CalendarScreen — month grid colored by completion, with the selected day's log.
;(function () {
  const { Card, StatusPill } = window.RoutineFlowDesignSystem_4781a2

  const DOW = ["M", "T", "W", "T", "F", "S", "S"]

  function dayColor(d) {
    if (d.status === "future")
      return {
        bg: "transparent",
        fg: "var(--text-faint)",
        ring: "1px solid var(--border-subtle)",
      }
    if (d.status === "today")
      return { bg: "var(--ink-900)", fg: "#fff", ring: "none" }
    if (d.status === "missed")
      return { bg: "var(--missed-100)", fg: "var(--missed-600)", ring: "none" }
    if (d.status === "perfect")
      return { bg: "var(--ramp-4)", fg: "#fff", ring: "none" }
    // mixed → ramp by rate
    const lvl =
      d.rate < 0.4
        ? "var(--ramp-1)"
        : d.rate < 0.7
          ? "var(--ramp-2)"
          : "var(--ramp-3)"
    return { bg: lvl, fg: "var(--ink-900)", ring: "none" }
  }

  function CalendarScreen() {
    const month = window.RF_DATA.month
    const [sel, setSel] = React.useState(21)
    // first of month offset (assume starts Thursday => 3 blanks)
    const offset = 3

    const selLog = [
      {
        time: "06:30",
        title: "Wake & hydrate",
        category: "Health",
        status: "Completed",
        delay: -2,
      },
      {
        time: "07:00",
        title: "Morning Gym",
        category: "Fitness",
        status: "Completed",
        delay: 4,
      },
      {
        time: "09:30",
        title: "Deep work block",
        category: "Work",
        status: "Missed",
        delay: null,
      },
      {
        time: "22:30",
        title: "Read 20 minutes",
        category: "Mind",
        status: "Skipped",
        delay: null,
      },
    ]

    return (
      <div style={{ padding: "0 20px 24px" }}>
        <header style={{ padding: "8px 0 18px" }}>
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "var(--text-2xs)",
              textTransform: "uppercase",
              letterSpacing: "var(--tracking-caps)",
              color: "var(--text-muted)",
            }}
          >
            2026
          </div>
          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "var(--text-3xl)",
              fontWeight: 700,
              letterSpacing: "-0.02em",
              margin: "4px 0 0",
            }}
          >
            June
          </h1>
        </header>

        <Card padding="md" style={{ marginBottom: 18 }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(7,1fr)",
              gap: 6,
              marginBottom: 8,
            }}
          >
            {DOW.map((d, i) => (
              <div
                key={i}
                style={{
                  textAlign: "center",
                  fontFamily: "var(--font-mono)",
                  fontSize: "var(--text-2xs)",
                  color: "var(--text-faint)",
                }}
              >
                {d}
              </div>
            ))}
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(7,1fr)",
              gap: 6,
            }}
          >
            {Array.from({ length: offset }).map((_, i) => (
              <div key={"b" + i} />
            ))}
            {month.map((d) => {
              const c = dayColor(d)
              const isSel = d.day === sel
              return (
                <button
                  key={d.day}
                  onClick={() => setSel(d.day)}
                  style={{
                    aspectRatio: "1",
                    border: c.ring,
                    background: c.bg,
                    color: c.fg,
                    borderRadius: "var(--radius-sm)",
                    cursor: "pointer",
                    fontFamily: "var(--font-mono)",
                    fontSize: "var(--text-sm)",
                    fontWeight: 500,
                    outline: isSel ? "2px solid var(--interactive)" : "none",
                    outlineOffset: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {d.day}
                </button>
              )
            })}
          </div>
        </Card>

        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "var(--text-2xs)",
            textTransform: "uppercase",
            letterSpacing: "var(--tracking-caps)",
            color: "var(--text-muted)",
            margin: "0 0 10px 2px",
          }}
        >
          {sel} June · log
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {selLog.map((l, i) => (
            <Card
              key={i}
              padding="sm"
              style={{ display: "flex", alignItems: "center", gap: 14 }}
            >
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "var(--text-md)",
                  color: "var(--text-primary)",
                  width: 48,
                }}
              >
                {l.time}
              </span>
              <span
                style={{ flex: 1, fontSize: "var(--text-md)", fontWeight: 500 }}
              >
                {l.title}
              </span>
              <StatusPill status={l.status} delay={l.delay} />
            </Card>
          ))}
        </div>
      </div>
    )
  }

  window.CalendarScreen = CalendarScreen
})()
