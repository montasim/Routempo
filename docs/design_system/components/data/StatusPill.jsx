import React from "react"

const STATUS = {
  Completed: {
    fg: "var(--completed-600)",
    bg: "var(--completed-100)",
    icon: "M5 12.5l4.5 4.5L19 7",
  },
  Pending: { fg: "var(--pending-600)", bg: "var(--pending-100)", icon: null },
  Missed: {
    fg: "var(--missed-600)",
    bg: "var(--missed-100)",
    icon: "M6 6l12 12M18 6L6 18",
  },
  Skipped: {
    fg: "var(--skipped-600)",
    bg: "var(--skipped-100)",
    icon: "M7 5v14M17 5v14",
  },
}

/**
 * Canonical occurrence-status pill. One of the four system states.
 */
export function StatusPill({ status = "Pending", delay = null, style = {} }) {
  const s = STATUS[status] || STATUS.Pending
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        height: 24,
        padding: "0 10px 0 8px",
        background: s.bg,
        color: s.fg,
        borderRadius: "var(--radius-pill)",
        fontFamily: "var(--font-text)",
        fontSize: "var(--text-xs)",
        fontWeight: "var(--weight-semibold)",
        whiteSpace: "nowrap",
        ...style,
      }}
    >
      {s.icon ? (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
          <path
            d={s.icon}
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ) : (
        <span
          style={{
            width: 7,
            height: 7,
            borderRadius: "50%",
            border: "2px solid currentColor",
          }}
        />
      )}
      {status}
      {status === "Completed" && delay != null && (
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "var(--text-2xs)",
            opacity: 0.85,
          }}
        >
          {delay > 0 ? `+${delay}m` : delay < 0 ? `${delay}m` : "on time"}
        </span>
      )}
    </span>
  )
}
