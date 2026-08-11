import * as React from "react"

/**
 * The core Home-screen list item: one daily occurrence. Pending rows show
 * Complete / Skip actions; resolved rows show a StatusPill.
 *
 * @startingPoint section="Domain" subtitle="Daily occurrence list row" viewport="480x96"
 */
export interface OccurrenceRowProps {
  /** Local HH:mm string. */
  time?: string
  title?: string
  category?: "Health" | "Fitness" | "Mind" | "Work" | "Faith" | string
  /** @default "Pending" */
  status?: "Completed" | "Pending" | "Missed" | "Skipped"
  /** Delay minutes (Completed only). */
  delay?: number | null
  onComplete?: () => void
  onSkip?: () => void
  style?: React.CSSProperties
}

export function OccurrenceRow(props: OccurrenceRowProps): JSX.Element
