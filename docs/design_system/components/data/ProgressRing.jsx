import React from "react"

/**
 * Circular progress ring with centered value. Used for discipline score
 * and completion percentages.
 */
export function ProgressRing({
  value = 0,
  max = 100,
  size = 96,
  thickness = 8,
  color = "var(--interactive)",
  trackColor = "var(--surface-sunken)",
  label,
  centerLabel,
  style = {},
}) {
  const pct = Math.max(0, Math.min(1, value / max))
  const r = (size - thickness) / 2
  const c = 2 * Math.PI * r
  const offset = c * (1 - pct)

  return (
    <div
      style={{
        display: "inline-flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "var(--space-3)",
        ...style,
      }}
    >
      <div style={{ position: "relative", width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={trackColor}
            strokeWidth={thickness}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={color}
            strokeWidth={thickness}
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={offset}
            style={{
              transition:
                "stroke-dashoffset var(--duration-slow) var(--ease-out)",
            }}
          />
        </svg>
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <span
            style={{
              fontFamily: "var(--font-display)",
              fontSize: size * 0.3,
              fontWeight: "var(--weight-bold)",
              letterSpacing: "var(--tracking-tight)",
              color: "var(--text-primary)",
              lineHeight: 1,
            }}
          >
            {centerLabel ?? Math.round(pct * 100)}
          </span>
          {centerLabel == null && (
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: size * 0.12,
                color: "var(--text-muted)",
              }}
            >
              /100
            </span>
          )}
        </div>
      </div>
      {label && (
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "var(--text-xs)",
            textTransform: "uppercase",
            letterSpacing: "var(--tracking-caps)",
            color: "var(--text-muted)",
          }}
        >
          {label}
        </span>
      )}
    </div>
  )
}
