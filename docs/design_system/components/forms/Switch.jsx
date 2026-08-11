import React from "react"

/**
 * On/off toggle. Controlled via `checked` + `onChange(next)`.
 */
export function Switch({
  checked = false,
  disabled = false,
  size = "md",
  onChange,
  ariaLabel,
  style = {},
}) {
  const dims = size === "sm" ? { w: 36, h: 20, k: 14 } : { w: 44, h: 26, k: 20 }
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={() => !disabled && onChange && onChange(!checked)}
      style={{
        position: "relative",
        width: dims.w,
        height: dims.h,
        flex: "none",
        padding: 0,
        border: "none",
        borderRadius: "var(--radius-pill)",
        background: checked ? "var(--interactive)" : "var(--paper-300)",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
        transition: "background var(--duration-base) var(--ease-standard)",
        WebkitTapHighlightColor: "transparent",
        ...style,
      }}
    >
      <span
        style={{
          position: "absolute",
          top: "50%",
          left: checked ? dims.w - dims.k - 3 : 3,
          width: dims.k,
          height: dims.k,
          transform: "translateY(-50%)",
          background: "#fff",
          borderRadius: "var(--radius-pill)",
          boxShadow: "var(--shadow-sm)",
          transition: "left var(--duration-base) var(--ease-standard)",
        }}
      />
    </button>
  )
}
