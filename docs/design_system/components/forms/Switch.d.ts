import * as React from "react"

/** Binary on/off toggle (settings, per-routine reminder override). */
export interface SwitchProps {
  checked?: boolean
  disabled?: boolean
  /** @default "md" */
  size?: "sm" | "md"
  onChange?: (next: boolean) => void
  ariaLabel?: string
  style?: React.CSSProperties
}

export function Switch(props: SwitchProps): JSX.Element
