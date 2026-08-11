import React from "react"

/**
 * Styled native select with a chevron. Options: [{value, label}] or strings.
 */
export function Select({
  label,
  value,
  defaultValue,
  options = [],
  disabled = false,
  fullWidth = true,
  onChange,
  style = {},
  ...rest
}) {
  const [focused, setFocused] = React.useState(false)
  const opts = options.map((o) =>
    typeof o === "string" ? { value: o, label: o } : o
  )

  return (
    <label
      style={{ display: "block", width: fullWidth ? "100%" : "auto", ...style }}
    >
      {label && (
        <span
          style={{
            display: "block",
            fontFamily: "var(--font-text)",
            fontSize: "var(--text-sm)",
            fontWeight: "var(--weight-medium)",
            color: "var(--text-secondary)",
            marginBottom: "var(--space-3)",
          }}
        >
          {label}
        </span>
      )}
      <span
        style={{
          position: "relative",
          display: "flex",
          alignItems: "center",
          height: 42,
          background: disabled
            ? "var(--surface-sunken)"
            : "var(--surface-card)",
          border: `1px solid ${focused ? "var(--interactive)" : "var(--border-default)"}`,
          borderRadius: "var(--radius-md)",
          boxShadow: focused ? "var(--ring-focus)" : "none",
          transition:
            "border-color var(--duration-fast) var(--ease-standard), box-shadow var(--duration-fast) var(--ease-standard)",
        }}
      >
        <select
          value={value}
          defaultValue={defaultValue}
          disabled={disabled}
          onChange={onChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            appearance: "none",
            WebkitAppearance: "none",
            flex: 1,
            height: "100%",
            padding: "0 36px 0 12px",
            border: "none",
            outline: "none",
            background: "transparent",
            fontFamily: "var(--font-text)",
            fontSize: "var(--text-md)",
            color: "var(--text-primary)",
            cursor: disabled ? "not-allowed" : "pointer",
          }}
          {...rest}
        >
          {opts.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          style={{
            position: "absolute",
            right: 12,
            pointerEvents: "none",
            color: "var(--text-muted)",
          }}
        >
          <path
            d="M6 9l6 6 6-6"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    </label>
  )
}
