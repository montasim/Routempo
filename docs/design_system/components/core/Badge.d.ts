import * as React from "react"

/** Pill label for categories, counts, and inline status. */
export interface BadgeProps {
  children?: React.ReactNode
  /** @default "neutral" */
  tone?: "neutral" | "signal" | "completed" | "pending" | "missed" | "skipped"
  /** Leading status dot. */
  dot?: boolean
  /** Use mono font (for counts / numerics). */
  mono?: boolean
  style?: React.CSSProperties
}

export function Badge(props: BadgeProps): JSX.Element
