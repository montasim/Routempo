import * as React from "react"

/** Circular avatar — image src or deterministic colored initials. */
export interface AvatarProps {
  name?: string
  src?: string
  /** Pixel diameter. @default 36 */
  size?: number
  style?: React.CSSProperties
}

export function Avatar(props: AvatarProps): JSX.Element
