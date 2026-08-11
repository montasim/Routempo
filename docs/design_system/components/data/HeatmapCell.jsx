import React from "react"

const RAMP = [
  "var(--ramp-0)",
  "var(--ramp-1)",
  "var(--ramp-2)",
  "var(--ramp-3)",
  "var(--ramp-4)",
]

/**
 * Single day cell for the yearly completion heatmap. `level` 0–4, or pass
 * `rate` (0–1) to bucket automatically.
 */
export function HeatmapCell({
  level,
  rate = null,
  size = 13,
  title,
  style = {},
}) {
  let lvl = level
  if (lvl == null && rate != null) {
    lvl = rate <= 0 ? 0 : rate < 0.25 ? 1 : rate < 0.5 ? 2 : rate < 0.85 ? 3 : 4
  }
  lvl = Math.max(0, Math.min(4, lvl ?? 0))

  return (
    <span
      title={title}
      style={{
        display: "inline-block",
        width: size,
        height: size,
        borderRadius: Math.max(2, size * 0.22),
        background: RAMP[lvl],
        boxShadow: lvl === 0 ? "inset 0 0 0 1px var(--border-subtle)" : "none",
        ...style,
      }}
    />
  )
}
