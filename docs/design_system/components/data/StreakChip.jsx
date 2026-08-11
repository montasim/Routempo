import React from "react"

/**
 * Streak chip — a flame glyph + consecutive-day count. Goes muted at 0.
 */
export function StreakChip({ days = 0, best = null, size = "md", style = {} }) {
  const active = days > 0
  const isRecord = best != null && days >= best && days > 0
  const dims =
    size === "sm"
      ? { h: 24, fs: "var(--text-xs)", icon: 13 }
      : { h: 30, fs: "var(--text-md)", icon: 16 }

  const fg = active ? "var(--skipped-600)" : "var(--text-faint)"
  const bg = active ? "var(--skipped-100)" : "var(--surface-sunken)"

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        height: dims.h,
        padding: "0 10px",
        background: bg,
        color: fg,
        borderRadius: "var(--radius-pill)",
        ...style,
      }}
    >
      <svg
        width={dims.icon}
        height={dims.icon}
        viewBox="0 0 24 24"
        fill={active ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="1.8"
      >
        <path
          d="M12 2c1 3 4 4.5 4 8a4 4 0 1 1-8 0c0-1.2.4-2 1-2.8C9.5 8 12 6 12 2z"
          strokeLinejoin="round"
        />
      </svg>
      <span
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: dims.fs,
          fontWeight: "var(--weight-semibold)",
        }}
      >
        {days}d
      </span>
      {isRecord && (
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "var(--text-2xs)",
            opacity: 0.8,
          }}
        >
          PB
        </span>
      )}
    </span>
  )
}
