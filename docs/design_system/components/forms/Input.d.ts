import * as React from "react"

/** Labelled text input with leading/trailing slots, hint, and error states. */
export interface InputProps {
  label?: string
  value?: string
  defaultValue?: string
  placeholder?: string
  type?: string
  leading?: React.ReactNode
  trailing?: React.ReactNode
  hint?: string
  error?: string
  disabled?: boolean
  fullWidth?: boolean
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
  style?: React.CSSProperties
}

export function Input(props: InputProps): JSX.Element
