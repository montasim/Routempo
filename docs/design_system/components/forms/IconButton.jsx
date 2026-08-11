import React from "react"

/**
 * Square icon-only button. Pass a Lucide <i data-lucide> or SVG as children.
 */
export function IconButton({
  children,
  variant = "ghost",
  size = "md",
  disabled = false,
  ariaLabel,
  onClick,
  style = {},
  ...rest
}) {
  const sizes = { sm: 30, md: 38, lg: 44 }
  const dim = sizes[size] || sizes.md

  const variants = {
    ghost: {
      background: "transparent",
      color: "var(--text-secondary)",
      border: "1px solid transparent",
    },
    outline: {
      background: "var(--surface-card)",
      color: "var(--text-primary)",
      border: "1px solid var(--border-default)",
    },
    solid: {
      background: "var(--interactive)",
      color: "#fff",
      border: "1px solid transparent",
    },
  }
  const v = variants[variant] || variants.ghost

  return (
    <button
      type="button"
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={onClick}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: dim,
        height: dim,
        borderRadius: "var(--radius-md)",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.4 : 1,
        transition:
          "background var(--duration-fast) var(--ease-standard), transform var(--duration-fast) var(--ease-standard)",
        WebkitTapHighlightColor: "transparent",
        ...v,
        ...style,
      }}
      onMouseEnter={(e) => {
        if (!disabled && variant !== "solid")
          e.currentTarget.style.background = "var(--surface-sunken)"
      }}
      onMouseLeave={(e) => {
        if (!disabled) e.currentTarget.style.background = v.background
      }}
      onMouseDown={(e) => {
        if (!disabled) e.currentTarget.style.transform = "scale(0.94)"
      }}
      onMouseUp={(e) => {
        e.currentTarget.style.transform = "scale(1)"
      }}
      {...rest}
    >
      {children}
    </button>
  )
}
