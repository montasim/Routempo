import * as React from "react"

export type SelectOption = string | { value: string; label: string }

/** Native select styled to match Input, with a custom chevron. */
export interface SelectProps {
  label?: string
  value?: string
  defaultValue?: string
  options?: SelectOption[]
  disabled?: boolean
  fullWidth?: boolean
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void
  style?: React.CSSProperties
}

export function Select(props: SelectProps): JSX.Element
