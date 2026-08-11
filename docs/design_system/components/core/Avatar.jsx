import React from "react"

const PALETTE = [
  "var(--signal-500)",
  "var(--completed-600)",
  "var(--skipped-600)",
  "var(--ink-700)",
  "var(--missed-500)",
]

function initials(name = "") {
  const parts = name.trim().split(/\s+/)
  return ((parts[0]?.[0] || "") + (parts[1]?.[0] || "")).toUpperCase() || "?"
}

/**
 * User avatar — image or colored initials fallback.
 */
export function Avatar({ name = "", src, size = 36, style = {} }) {
  const color = PALETTE[(name.charCodeAt(0) || 0) % PALETTE.length]
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: size,
        height: size,
        flex: "none",
        borderRadius: "var(--radius-pill)",
        overflow: "hidden",
        background: src ? "var(--surface-sunken)" : color,
        color: "#fff",
        fontFamily: "var(--font-display)",
        fontSize: Math.round(size * 0.4),
        fontWeight: "var(--weight-semibold)",
        letterSpacing: "0.01em",
        userSelect: "none",
        ...style,
      }}
    >
      {src ? (
        <img
          src={src}
          alt={name}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      ) : (
        initials(name)
      )}
    </span>
  )
}
