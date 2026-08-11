import React from "react"

/**
 * Surface container. The base panel for everything in RoutineFlow.
 */
export function Card({
  children,
  padding = "md",
  elevation = "hairline",
  interactive = false,
  onClick,
  style = {},
  ...rest
}) {
  const pads = {
    none: 0,
    sm: "var(--space-5)",
    md: "var(--space-6)",
    lg: "var(--space-8)",
  }
  const shadows = {
    flat: "var(--ring-hairline)",
    hairline: "var(--ring-hairline)",
    sm: "var(--shadow-sm)",
    md: "var(--shadow-md)",
    lg: "var(--shadow-lg)",
  }

  return (
    <div
      onClick={onClick}
      style={{
        background: "var(--surface-card)",
        borderRadius: "var(--radius-lg)",
        padding: pads[padding] ?? pads.md,
        boxShadow: shadows[elevation] ?? shadows.hairline,
        cursor: interactive ? "pointer" : "default",
        transition:
          "transform var(--duration-fast) var(--ease-standard), box-shadow var(--duration-fast) var(--ease-standard)",
        ...style,
      }}
      onMouseEnter={(e) => {
        if (interactive) {
          e.currentTarget.style.transform = "translateY(-1px)"
          e.currentTarget.style.boxShadow = "var(--shadow-md)"
        }
      }}
      onMouseLeave={(e) => {
        if (interactive) {
          e.currentTarget.style.transform = "translateY(0)"
          e.currentTarget.style.boxShadow =
            shadows[elevation] ?? shadows.hairline
        }
      }}
      {...rest}
    >
      {children}
    </div>
  )
}
