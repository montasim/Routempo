import React from "react"

const TONES = {
  neutral: {
    fg: "var(--ink-700)",
    bg: "var(--paper-100)",
    dot: "var(--ink-400)",
  },
  signal: {
    fg: "var(--signal-700)",
    bg: "var(--signal-50)",
    dot: "var(--signal-500)",
  },
  completed: {
    fg: "var(--completed-600)",
    bg: "var(--completed-100)",
    dot: "var(--completed-600)",
  },
  pending: {
    fg: "var(--pending-600)",
    bg: "var(--pending-100)",
    dot: "var(--pending-600)",
  },
  missed: {
    fg: "var(--missed-600)",
    bg: "var(--missed-100)",
    dot: "var(--missed-600)",
  },
  skipped: {
    fg: "var(--skipped-600)",
    bg: "var(--skipped-100)",
    dot: "var(--skipped-600)",
  },
}

/**
 * Small status / category label. Set `dot` for a leading status dot.
 */
export function Badge({
  children,
  tone = "neutral",
  dot = false,
  mono = false,
  style = {},
}) {
  const t = TONES[tone] || TONES.neutral
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        height: 22,
        padding: "0 9px",
        background: t.bg,
        color: t.fg,
        fontFamily: mono ? "var(--font-mono)" : "var(--font-text)",
        fontSize: "var(--text-xs)",
        fontWeight: "var(--weight-semibold)",
        letterSpacing: mono ? "var(--tracking-mono)" : "0.01em",
        borderRadius: "var(--radius-pill)",
        whiteSpace: "nowrap",
        ...style,
      }}
    >
      {dot && (
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: t.dot,
            flex: "none",
          }}
        />
      )}
      {children}
    </span>
  )
}
