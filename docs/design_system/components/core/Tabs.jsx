import React from "react"

/**
 * Underline tab bar. items: [{value, label, count?}]. Controlled.
 */
export function Tabs({ items = [], value, onChange, style = {} }) {
  return (
    <div
      role="tablist"
      style={{
        display: "flex",
        gap: "var(--space-6)",
        borderBottom: "1px solid var(--border-subtle)",
        ...style,
      }}
    >
      {items.map((it) => {
        const active = it.value === value
        return (
          <button
            key={it.value}
            role="tab"
            aria-selected={active}
            onClick={() => onChange && onChange(it.value)}
            style={{
              position: "relative",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "0 0 12px",
              border: "none",
              background: "transparent",
              cursor: "pointer",
              fontFamily: "var(--font-text)",
              fontSize: "var(--text-md)",
              fontWeight: active
                ? "var(--weight-semibold)"
                : "var(--weight-medium)",
              color: active ? "var(--text-primary)" : "var(--text-muted)",
              transition: "color var(--duration-fast) var(--ease-standard)",
            }}
            onMouseEnter={(e) => {
              if (!active) e.currentTarget.style.color = "var(--text-secondary)"
            }}
            onMouseLeave={(e) => {
              if (!active) e.currentTarget.style.color = "var(--text-muted)"
            }}
          >
            {it.label}
            {it.count != null && (
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "var(--text-2xs)",
                  color: active ? "var(--interactive)" : "var(--text-faint)",
                }}
              >
                {it.count}
              </span>
            )}
            <span
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                bottom: -1,
                height: 2,
                borderRadius: "var(--radius-pill)",
                background: active ? "var(--interactive)" : "transparent",
                transition:
                  "background var(--duration-fast) var(--ease-standard)",
              }}
            />
          </button>
        )
      })}
    </div>
  )
}
