import * as React from "react"

export interface TabItem {
  value: string
  label: string
  count?: number
}

/** Underline tab bar for switching analytics periods / views. */
export interface TabsProps {
  items: TabItem[]
  value: string
  onChange?: (value: string) => void
  style?: React.CSSProperties
}

export function Tabs(props: TabsProps): JSX.Element
