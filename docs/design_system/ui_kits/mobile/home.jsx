// HomeScreen — today's occurrences with Complete / Skip. The app's core loop.
;(function () {
  const { OccurrenceRow, ProgressRing, StreakChip, Card } =
    window.RoutineFlowDesignSystem_4781a2

  function SummaryStrip({ occ }) {
    const done = occ.filter((o) => o.status === "Completed").length
    const total = occ.length
    const pct = Math.round((done / total) * 100)
    return (
      <Card
        padding="md"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 18,
          marginBottom: 20,
        }}
      >
        <ProgressRing
          value={pct}
          size={76}
          thickness={7}
          centerLabel={pct + "%"}
        />
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "var(--text-lg)",
              fontWeight: 700,
              letterSpacing: "-0.02em",
            }}
          >
            {done} of {total} done
          </div>
          <div
            style={{
              color: "var(--text-secondary)",
              fontSize: "var(--text-sm)",
              marginTop: 2,
            }}
          >
            {total - done} still pending today
          </div>
          <div style={{ marginTop: 10 }}>
            <StreakChip days={28} best={31} size="sm" />
          </div>
        </div>
      </Card>
    )
  }

  function Section({ label, children }) {
    return (
      <div style={{ marginBottom: 18 }}>
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
          {label}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {children}
        </div>
      </div>
    )
  }

  function HomeScreen() {
    const [occ, setOcc] = React.useState(window.RF_DATA.today)
    const setStatus = (id, status, delay = null) =>
      setOcc((list) =>
        list.map((o) => (o.id === id ? { ...o, status, delay } : o))
      )

    const morning = occ.filter((o) => o.time < "12:00")
    const afternoon = occ.filter((o) => o.time >= "12:00")

    const renderRow = (o) => (
      <OccurrenceRow
        key={o.id}
        time={o.time}
        title={o.title}
        category={o.category}
        status={o.status}
        delay={o.delay}
        onComplete={() => setStatus(o.id, "Completed", 2)}
        onSkip={() => setStatus(o.id, "Skipped")}
      />
    )

    return (
      <div style={{ padding: "0 20px 24px" }}>
        <header
          style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            padding: "8px 0 18px",
          }}
        >
          <div>
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "var(--text-2xs)",
                textTransform: "uppercase",
                letterSpacing: "var(--tracking-caps)",
                color: "var(--text-muted)",
              }}
            >
              Saturday · 21 June
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
              Today
            </h1>
          </div>
        </header>

        <SummaryStrip occ={occ} />
        <Section label="Morning">{morning.map(renderRow)}</Section>
        <Section label="Afternoon & evening">
          {afternoon.map(renderRow)}
        </Section>
      </div>
    )
  }

  window.HomeScreen = HomeScreen
})()
