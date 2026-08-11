import * as React from "react"

/**
 * RoutineFlow primary action button.
 *
 * @startingPoint section="Forms" subtitle="Primary / secondary / ghost / danger button" viewport="700x120"
 */
export interface ButtonProps {
  children?: React.ReactNode
  /** Visual intent. @default "primary" */
  variant?: "primary" | "secondary" | "ghost" | "danger"
  /** @default "md" */
  size?: "sm" | "md" | "lg"
  iconLeft?: React.ReactNode
  iconRight?: React.ReactNode
  fullWidth?: boolean
  disabled?: boolean
  type?: "button" | "submit" | "reset"
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void
  style?: React.CSSProperties
}

export function Button(props: ButtonProps): JSX.Element
