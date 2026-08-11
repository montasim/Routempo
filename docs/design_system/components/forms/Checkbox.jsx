import React from "react"

/**
 * Checkbox with optional label. Controlled via `checked` + `onChange(next)`.
 */
export function Checkbox({
  checked = false,
  label,
  disabled = false,
  onChange,
  style = {},
}) {
  return (
    <label
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "var(--space-3)",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
        ...style,
      }}
    >
      <button
        type="button"
        role="checkbox"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onChange && onChange(!checked)}
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: 20,
          height: 20,
          flex: "none",
          padding: 0,
          background: checked ? "var(--interactive)" : "var(--surface-card)",
          border: `1px solid ${checked ? "var(--interactive)" : "var(--border-strong)"}`,
          borderRadius: "var(--radius-xs)",
          cursor: "inherit",
          transition:
            "background var(--duration-fast) var(--ease-standard), border-color var(--duration-fast) var(--ease-standard)",
        }}
      >
        {checked && (
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
            <path
              d="M5 12.5l4.5 4.5L19 7"
              stroke="#fff"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </button>
      {label && (
        <span
          style={{
            fontFamily: "var(--font-text)",
            fontSize: "var(--text-md)",
            color: "var(--text-primary)",
          }}
        >
          {label}
        </span>
      )}
    </label>
  )
}
