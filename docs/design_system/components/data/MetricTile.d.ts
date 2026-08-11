import * as React from "react"

/**
 * KPI tile — big numeric value, mono label, optional delta.
 *
 * @startingPoint section="Data" subtitle="Analytics KPI tile" viewport="360x160"
 */
export interface MetricTileProps {
  label: string
  value: string | number
  unit?: string
  /** Change indicator text, e.g. "+12%". */
  delta?: string | null
  /** @default "up" */
  deltaDirection?: "up" | "down"
  /** @default "default" */
  tone?: "default" | "signal" | "completed" | "missed"
  style?: React.CSSProperties
}

export function MetricTile(props: MetricTileProps): JSX.Element
