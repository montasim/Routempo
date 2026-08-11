import * as React from "react"

/** One day cell of the yearly completion heatmap. */
export interface HeatmapCellProps {
  /** Explicit ramp step 0–4. */
  level?: number
  /** Completion rate 0–1; auto-buckets to a level if `level` is omitted. */
  rate?: number | null
  /** Pixel size. @default 13 */
  size?: number
  /** Tooltip (date + rate). */
  title?: string
  style?: React.CSSProperties
}

export function HeatmapCell(props: HeatmapCellProps): JSX.Element
