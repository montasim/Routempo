import * as React from "react"

/** Consecutive-day streak chip (flame + day count); muted at 0, "PB" at personal best. */
export interface StreakChipProps {
  /** Current streak length in days. */
  days?: number
  /** Personal-best streak — shows a PB marker when matched/exceeded. */
  best?: number | null
  /** @default "md" */
  size?: "sm" | "md"
  style?: React.CSSProperties
}

export function StreakChip(props: StreakChipProps): JSX.Element
