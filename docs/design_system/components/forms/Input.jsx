import React from "react"

/**
 * Text input with optional label, leading element, and error state.
 */
export function Input({
  label,
  value,
  defaultValue,
  placeholder,
  type = "text",
  leading = null,
  trailing = null,
  hint,
  error,
  disabled = false,
  fullWidth = true,
  onChange,
  style = {},
  ...rest
}) {
  const [focused, setFocused] = React.useState(false)
  const borderColor = error
    ? "var(--status-missed)"
    : focused
      ? "var(--interactive)"
      : "var(--border-default)"

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
          display: "flex",
          alignItems: "center",
          gap: "var(--space-3)",
          height: 42,
          padding: "0 12px",
          background: disabled
            ? "var(--surface-sunken)"
            : "var(--surface-card)",
          border: `1px solid ${borderColor}`,
          borderRadius: "var(--radius-md)",
          boxShadow: focused ? "var(--ring-focus)" : "none",
          transition:
            "border-color var(--duration-fast) var(--ease-standard), box-shadow var(--duration-fast) var(--ease-standard)",
        }}
      >
        {leading && (
          <span style={{ display: "inline-flex", color: "var(--text-muted)" }}>
            {leading}
          </span>
        )}
        <input
          type={type}
          value={value}
          defaultValue={defaultValue}
          placeholder={placeholder}
          disabled={disabled}
          onChange={onChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            flex: 1,
            minWidth: 0,
            border: "none",
            outline: "none",
            background: "transparent",
            fontFamily: "var(--font-text)",
            fontSize: "var(--text-md)",
            color: "var(--text-primary)",
          }}
          {...rest}
        />
        {trailing && (
          <span style={{ display: "inline-flex", color: "var(--text-muted)" }}>
            {trailing}
          </span>
        )}
      </span>
      {(hint || error) && (
        <span
          style={{
            display: "block",
            fontFamily: "var(--font-text)",
            fontSize: "var(--text-xs)",
            color: error ? "var(--status-missed)" : "var(--text-muted)",
            marginTop: "var(--space-2)",
          }}
        >
          {error || hint}
        </span>
      )}
    </label>
  )
}
