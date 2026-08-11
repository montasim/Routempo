import * as React from "react"

/** Checkbox with optional inline label (recurrence day pickers, filters). */
export interface CheckboxProps {
  checked?: boolean
  label?: string
  disabled?: boolean
  onChange?: (next: boolean) => void
  style?: React.CSSProperties
}

export function Checkbox(props: CheckboxProps): JSX.Element
