import React from "react"

/**
 * RoutineFlow primary action button.
 * Variants: primary (signal), secondary (ink outline), ghost, danger.
 */
export function Button({
  children,
  variant = "primary",
  size = "md",
  iconLeft = null,
  iconRight = null,
  fullWidth = false,
  disabled = false,
  type = "button",
  onClick,
  style = {},
  ...rest
}) {
  const sizes = {
    sm: {
      height: 32,
      padding: "0 12px",
      font: "var(--text-sm)",
      radius: "var(--radius-sm)",
      gap: 6,
    },
    md: {
      height: 40,
      padding: "0 16px",
      font: "var(--text-md)",
      radius: "var(--radius-md)",
      gap: 8,
    },
    lg: {
      height: 48,
      padding: "0 22px",
      font: "var(--text-lg)",
      radius: "var(--radius-md)",
      gap: 8,
    },
  }
  const s = sizes[size] || sizes.md

  const variants = {
    primary: {
      background: "var(--interactive)",
      color: "#fff",
      border: "1px solid transparent",
    },
    secondary: {
      background: "var(--surface-card)",
      color: "var(--text-primary)",
      border: "1px solid var(--border-default)",
    },
    ghost: {
      background: "transparent",
      color: "var(--text-primary)",
      border: "1px solid transparent",
    },
    danger: {
      background: "var(--status-missed)",
      color: "#fff",
      border: "1px solid transparent",
    },
  }
  const v = variants[variant] || variants.primary

  const base = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: s.gap,
    height: s.height,
    padding: s.padding,
    width: fullWidth ? "100%" : "auto",
    fontFamily: "var(--font-text)",
    fontSize: s.font,
    fontWeight: "var(--weight-semibold)",
    letterSpacing: "0.01em",
    lineHeight: 1,
    borderRadius: s.radius,
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.45 : 1,
    boxShadow:
      variant === "primary" || variant === "danger"
        ? "var(--shadow-xs)"
        : "none",
    transition:
      "transform var(--duration-fast) var(--ease-standard), background var(--duration-fast) var(--ease-standard), border-color var(--duration-fast) var(--ease-standard)",
    WebkitTapHighlightColor: "transparent",
    ...v,
    ...style,
  }

  const hoverBg = {
    primary: "var(--interactive-hover)",
    secondary: "var(--surface-sunken)",
    ghost: "var(--surface-sunken)",
    danger: "var(--missed-600)",
  }

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      style={base}
      onMouseEnter={(e) => {
        if (!disabled) e.currentTarget.style.background = hoverBg[variant]
      }}
      onMouseLeave={(e) => {
        if (!disabled) e.currentTarget.style.background = v.background
      }}
      onMouseDown={(e) => {
        if (!disabled) e.currentTarget.style.transform = "scale(0.97)"
      }}
      onMouseUp={(e) => {
        e.currentTarget.style.transform = "scale(1)"
      }}
      {...rest}
    >
      {iconLeft}
      {children}
      {iconRight}
    </button>
  )
}
