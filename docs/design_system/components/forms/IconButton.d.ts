import * as React from "react"

/** Square icon-only button (nav, toolbars, row actions). */
export interface IconButtonProps {
  children?: React.ReactNode
  /** @default "ghost" */
  variant?: "ghost" | "outline" | "solid"
  /** @default "md" */
  size?: "sm" | "md" | "lg"
  disabled?: boolean
  /** Required for accessibility. */
  ariaLabel?: string
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void
  style?: React.CSSProperties
}

export function IconButton(props: IconButtonProps): JSX.Element
