// SettingsScreen — timezone, reminders, profile. Mirrors user_settings.
;(function () {
  const { Card, Avatar, Select, Switch, Button, Badge } =
    window.RoutineFlowDesignSystem_4781a2

  function Row({ label, sub, control, last }) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 14,
          padding: "14px 0",
          borderBottom: last ? "none" : "1px solid var(--border-subtle)",
        }}
      >
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: "var(--text-md)", fontWeight: 500 }}>
            {label}
          </div>
          {sub && (
            <div
              style={{
                fontSize: "var(--text-xs)",
                color: "var(--text-muted)",
                marginTop: 2,
              }}
            >
              {sub}
            </div>
          )}
        </div>
        <div style={{ flex: "none" }}>{control}</div>
      </div>
    )
  }

  function GroupLabel({ children }) {
    return (
      <div
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "var(--text-2xs)",
          textTransform: "uppercase",
          letterSpacing: "var(--tracking-caps)",
          color: "var(--text-muted)",
          margin: "20px 2px 8px",
        }}
      >
        {children}
      </div>
    )
  }

  function SettingsScreen() {
    const U = window.RF_DATA.user
    const [useGlobal, setUseGlobal] = React.useState(true)
    const [notif, setNotif] = React.useState(true)
    const [skipBreaks, setSkipBreaks] = React.useState(false)

    return (
      <div style={{ padding: "0 20px 24px" }}>
        <header style={{ padding: "8px 0 8px" }}>
          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "var(--text-3xl)",
              fontWeight: 700,
              letterSpacing: "-0.02em",
              margin: 0,
            }}
          >
            Settings
          </h1>
        </header>

        <Card
          padding="md"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            marginTop: 8,
          }}
        >
          <Avatar name={U.name} size={48} />
          <div style={{ flex: 1 }}>
            <div
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "var(--text-lg)",
                fontWeight: 600,
              }}
            >
              {U.name}
            </div>
            <div
              style={{
                fontSize: "var(--text-sm)",
                color: "var(--text-secondary)",
              }}
            >
              {U.email}
            </div>
          </div>
          <Badge tone="signal" mono>
            PRO
          </Badge>
        </Card>

        <GroupLabel>Time</GroupLabel>
        <Card padding="md">
          <Row
            label="Timezone"
            sub="All scheduling is interpreted here"
            control={
              <Select
                fullWidth={false}
                defaultValue="Asia/Dhaka"
                options={[
                  "Asia/Dhaka",
                  "Europe/London",
                  "America/New_York",
                  "Asia/Dubai",
                ]}
                style={{ width: 168 }}
              />
            }
            last
          />
        </Card>

        <GroupLabel>Reminders</GroupLabel>
        <Card padding="md">
          <Row
            label="Notifications"
            sub="Fire even when the app is closed"
            control={
              <Switch
                checked={notif}
                onChange={setNotif}
                ariaLabel="Notifications"
              />
            }
          />
          <Row
            label="Use global reminder"
            sub="Apply one offset to every routine"
            control={
              <Switch
                checked={useGlobal}
                onChange={setUseGlobal}
                ariaLabel="Use global reminder"
              />
            }
          />
          <Row
            label="Reminder offset"
            sub="Minutes before scheduled time"
            control={
              <Select
                fullWidth={false}
                defaultValue="15"
                options={[
                  { value: "5", label: "5 min" },
                  { value: "10", label: "10 min" },
                  { value: "15", label: "15 min" },
                  { value: "30", label: "30 min" },
                ]}
                style={{ width: 120 }}
              />
            }
            last
          />
        </Card>

        <GroupLabel>Streaks</GroupLabel>
        <Card padding="md">
          <Row
            label="Skip breaks streak"
            sub="Off — a skip pauses, it won't reset"
            control={
              <Switch
                checked={skipBreaks}
                onChange={setSkipBreaks}
                ariaLabel="Skip breaks streak"
              />
            }
            last
          />
        </Card>

        <div
          style={{
            marginTop: 22,
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          <Button variant="secondary" fullWidth>
            Export data (.xlsx)
          </Button>
          <Button
            variant="ghost"
            fullWidth
            style={{ color: "var(--missed-600)" }}
          >
            Sign out
          </Button>
        </div>
      </div>
    )
  }

  window.SettingsScreen = SettingsScreen
})()
