import * as React from "react"

/**
 * Canonical occurrence-status pill — the four system states with status-specific glyph.
 *
 * @startingPoint section="Data" subtitle="Occurrence status pill (4 states)" viewport="700x100"
 */
export interface StatusPillProps {
  /** @default "Pending" */
  status?: "Completed" | "Pending" | "Missed" | "Skipped"
  /** Delay in minutes (shown only when Completed). Negative = early. */
  delay?: number | null
  style?: React.CSSProperties
}

export function StatusPill(props: StatusPillProps): JSX.Element
