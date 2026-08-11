import React from "react"

/**
 * Single metric tile. Big numeric value + label, optional delta + unit.
 */
export function MetricTile({
  label,
  value,
  unit,
  delta = null,
  deltaDirection = "up",
  tone = "default",
  style = {},
}) {
  const valueColor =
    {
      default: "var(--text-primary)",
      signal: "var(--interactive)",
      completed: "var(--completed-600)",
      missed: "var(--missed-600)",
    }[tone] || "var(--text-primary)"

  const good = deltaDirection === "up"
  const deltaColor =
    delta == null
      ? "transparent"
      : good
        ? "var(--completed-600)"
        : "var(--missed-600)"

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "var(--space-3)",
        padding: "var(--space-6)",
        background: "var(--surface-card)",
        borderRadius: "var(--radius-lg)",
        boxShadow: "var(--ring-hairline)",
        ...style,
      }}
    >
      <span
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "var(--text-2xs)",
          textTransform: "uppercase",
          letterSpacing: "var(--tracking-caps)",
          color: "var(--text-muted)",
        }}
      >
        {label}
      </span>
      <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
        <span
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "var(--text-3xl)",
            fontWeight: "var(--weight-bold)",
            letterSpacing: "var(--tracking-tight)",
            lineHeight: 1,
            color: valueColor,
          }}
        >
          {value}
        </span>
        {unit && (
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "var(--text-sm)",
              color: "var(--text-muted)",
            }}
          >
            {unit}
          </span>
        )}
      </div>
      {delta != null && (
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 3,
            fontFamily: "var(--font-mono)",
            fontSize: "var(--text-xs)",
            fontWeight: "var(--weight-medium)",
            color: deltaColor,
          }}
        >
          <svg
            width="11"
            height="11"
            viewBox="0 0 24 24"
            fill="none"
            style={{ transform: good ? "none" : "rotate(180deg)" }}
          >
            <path
              d="M12 19V5M5 12l7-7 7 7"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          {delta}
        </span>
      )}
    </div>
  )
}
