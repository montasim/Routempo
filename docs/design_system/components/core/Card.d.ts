import * as React from "react"

/**
 * Base surface panel. Hairline border by default; shadows for raised/overlay.
 *
 * @startingPoint section="Layout" subtitle="Surface container panel" viewport="700x200"
 */
export interface CardProps {
  children?: React.ReactNode
  /** @default "md" */
  padding?: "none" | "sm" | "md" | "lg"
  /** @default "hairline" */
  elevation?: "flat" | "hairline" | "sm" | "md" | "lg"
  /** Adds hover lift + pointer cursor. */
  interactive?: boolean
  onClick?: (e: React.MouseEvent<HTMLDivElement>) => void
  style?: React.CSSProperties
}

export function Card(props: CardProps): JSX.Element
