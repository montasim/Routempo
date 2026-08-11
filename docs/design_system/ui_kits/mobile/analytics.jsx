// AnalyticsScreen — period tabs over metrics derived from logs.
;(function () {
  const { Tabs, MetricTile, ProgressRing, HeatmapCell, Card } =
    window.RoutineFlowDesignSystem_4781a2

  function TrendBars({ data }) {
    return (
      <Card padding="md">
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "var(--text-2xs)",
            textTransform: "uppercase",
            letterSpacing: "var(--tracking-caps)",
            color: "var(--text-muted)",
            marginBottom: 14,
          }}
        >
          Completion trend
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            gap: 10,
            height: 120,
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
                gap: 6,
                height: "100%",
                justifyContent: "flex-end",
              }}
            >
              <div
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "var(--text-2xs)",
                  color: "var(--text-muted)",
                }}
              >
                {Math.round(d.rate * 100)}
              </div>
              <div
                style={{
                  width: "100%",
                  height: d.rate * 90 + "%",
                  minHeight: 4,
                  background:
                    d.rate >= 0.85
                      ? "var(--completed-600)"
                      : d.rate >= 0.6
                        ? "var(--ramp-3)"
                        : "var(--skipped-500)",
                  borderRadius: "var(--radius-sm)",
                }}
              />
              <div
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "var(--text-2xs)",
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

  function YearHeatmap({ year }) {
    return (
      <Card padding="md">
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "var(--text-2xs)",
            textTransform: "uppercase",
            letterSpacing: "var(--tracking-caps)",
            color: "var(--text-muted)",
            marginBottom: 14,
          }}
        >
          Discipline heatmap · 2026
        </div>
        <div
          style={{
            display: "flex",
            gap: 3,
            overflowX: "auto",
            paddingBottom: 4,
          }}
        >
          {year.map((wk, i) => (
            <div
              key={i}
              style={{ display: "flex", flexDirection: "column", gap: 3 }}
            >
              {wk.map((d, j) => (
                <HeatmapCell
                  key={j}
                  rate={d.rate == null ? 0 : d.rate}
                  level={d.rate == null ? 0 : undefined}
                  size={11}
                />
              ))}
            </div>
          ))}
        </div>
      </Card>
    )
  }

  function AnalyticsScreen() {
    const D = window.RF_DATA
    const [tab, setTab] = React.useState("week")

    return (
      <div style={{ padding: "0 20px 24px" }}>
        <header style={{ padding: "8px 0 16px" }}>
          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "var(--text-3xl)",
              fontWeight: 700,
              letterSpacing: "-0.02em",
              margin: 0,
            }}
          >
            Analytics
          </h1>
        </header>

        <div style={{ marginBottom: 18 }}>
          <Tabs
            value={tab}
            onChange={setTab}
            items={[
              { value: "day", label: "Daily" },
              { value: "week", label: "Weekly" },
              { value: "month", label: "Monthly" },
              { value: "year", label: "Yearly" },
            ]}
          />
        </div>

        {tab === "day" && (
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}
          >
            <MetricTile
              label="Completion"
              value={D.metrics.daily.completion}
              unit="%"
            />
            <MetricTile
              label="Missed"
              value={D.metrics.daily.missed}
              tone="missed"
            />
            <MetricTile
              label="Avg delay"
              value={D.metrics.daily.avgDelay}
              unit="min"
              tone="completed"
            />
            <MetricTile
              label="Best routine"
              value="Vitamins"
              style={{ gridColumn: "span 1" }}
            />
          </div>
        )}

        {tab === "week" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr",
                gap: 12,
              }}
            >
              <MetricTile
                label="Completion"
                value={D.metrics.weekly.completion}
                unit="%"
                delta="+4%"
                deltaDirection="up"
              />
              <MetricTile
                label="Stability"
                value={D.metrics.weekly.stability}
                unit="%"
              />
              <MetricTile
                label="Avg delay"
                value={D.metrics.weekly.avgDelay}
                unit="m"
                delta="2m"
                deltaDirection="down"
                tone="completed"
              />
            </div>
            <TrendBars data={D.weekTrend} />
          </div>
        )}

        {tab === "month" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 12,
              }}
            >
              <MetricTile
                label="Completion"
                value={D.metrics.monthly.completion}
                unit="%"
                delta="+2%"
                deltaDirection="up"
              />
              <MetricTile
                label="Missed"
                value={D.metrics.monthly.missed}
                tone="missed"
                delta="3"
                deltaDirection="down"
              />
            </div>
            <Card padding="md">
              <div
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "var(--text-2xs)",
                  textTransform: "uppercase",
                  letterSpacing: "var(--tracking-caps)",
                  color: "var(--text-muted)",
                  marginBottom: 12,
                }}
              >
                Consistency by routine
              </div>
              <div
                style={{ display: "flex", flexDirection: "column", gap: 12 }}
              >
                {D.routines.map((r) => (
                  <div
                    key={r.id}
                    style={{ display: "flex", alignItems: "center", gap: 12 }}
                  >
                    <span
                      style={{
                        width: 110,
                        fontSize: "var(--text-sm)",
                        fontWeight: 500,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {r.title}
                    </span>
                    <div
                      style={{
                        flex: 1,
                        height: 8,
                        background: "var(--surface-sunken)",
                        borderRadius: "var(--radius-pill)",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          width: r.consistency * 100 + "%",
                          height: "100%",
                          background: "var(--completed-600)",
                          borderRadius: "var(--radius-pill)",
                        }}
                      />
                    </div>
                    <span
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "var(--text-xs)",
                        color: "var(--text-secondary)",
                        width: 34,
                        textAlign: "right",
                      }}
                    >
                      {Math.round(r.consistency * 100)}%
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {tab === "year" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <Card
              padding="md"
              style={{ display: "flex", alignItems: "center", gap: 18 }}
            >
              <ProgressRing
                value={D.metrics.yearly.discipline}
                size={92}
                label="Discipline"
              />
              <div
                style={{
                  flex: 1,
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 14,
                }}
              >
                <Stat
                  label="Completion"
                  value={D.metrics.yearly.completion + "%"}
                />
                <Stat label="Active days" value={D.metrics.yearly.activeDays} />
                <Stat
                  label="Drift 30d"
                  value={D.metrics.yearly.drift}
                  tone="completed"
                />
                <Stat label="Best streak" value="54d" />
              </div>
            </Card>
            <YearHeatmap year={D.year} />
          </div>
        )}
      </div>
    )
  }

  function Stat({ label, value, tone }) {
    return (
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
          {label}
        </div>
        <div
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "var(--text-xl)",
            fontWeight: 700,
            color:
              tone === "completed"
                ? "var(--completed-600)"
                : "var(--text-primary)",
            marginTop: 2,
          }}
        >
          {value}
        </div>
      </div>
    )
  }

  window.AnalyticsScreen = AnalyticsScreen
})()
