import * as React from "react"

/** Circular progress ring with centered value — discipline score, completion %. */
export interface ProgressRingProps {
  value?: number
  /** @default 100 */
  max?: number
  /** Pixel diameter. @default 96 */
  size?: number
  /** @default 8 */
  thickness?: number
  /** Arc color. @default signal */
  color?: string
  trackColor?: string
  /** Mono caption under the ring. */
  label?: string
  /** Override the centered number (else shows rounded percent). */
  centerLabel?: string
  style?: React.CSSProperties
}

export function ProgressRing(props: ProgressRingProps): JSX.Element
