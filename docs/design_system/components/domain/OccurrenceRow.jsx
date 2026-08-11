import React from "react"
import { StatusPill } from "../data/StatusPill.jsx"

const CATEGORY_COLORS = {
  Health: "var(--completed-600)",
  Fitness: "var(--signal-500)",
  Mind: "var(--skipped-600)",
  Work: "var(--ink-700)",
  Faith: "var(--ramp-3)",
}

/**
 * The core list item: one occurrence for the day. Shows time, title,
 * category accent, status. Pending rows expose Complete / Skip actions.
 */
export function OccurrenceRow({
  time = "07:00",
  title = "Routine",
  category,
  status = "Pending",
  delay = null,
  onComplete,
  onSkip,
  style = {},
}) {
  const accent = CATEGORY_COLORS[category] || "var(--border-strong)"
  const isPending = status === "Pending"
  const dimmed = status === "Missed" || status === "Skipped"

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "var(--space-5)",
        padding: "var(--space-5)",
        background: "var(--surface-card)",
        borderRadius: "var(--radius-lg)",
        boxShadow: "var(--ring-hairline)",
        opacity: dimmed ? 0.72 : 1,
        ...style,
      }}
    >
      <span
        style={{
          width: 4,
          alignSelf: "stretch",
          borderRadius: "var(--radius-pill)",
          background: accent,
          flex: "none",
        }}
      />
      <div style={{ width: 56, flex: "none" }}>
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "var(--text-lg)",
            fontWeight: "var(--weight-medium)",
            color: "var(--text-primary)",
            lineHeight: 1.1,
          }}
        >
          {time}
        </div>
        {category && (
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "var(--text-2xs)",
              textTransform: "uppercase",
              letterSpacing: "var(--tracking-caps)",
              color: "var(--text-muted)",
              marginTop: 2,
            }}
          >
            {category}
          </div>
        )}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontFamily: "var(--font-text)",
            fontSize: "var(--text-lg)",
            fontWeight: "var(--weight-semibold)",
            color: "var(--text-primary)",
            textDecoration: status === "Completed" ? "none" : "none",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {title}
        </div>
      </div>

      {isPending ? (
        <div style={{ display: "flex", gap: "var(--space-3)", flex: "none" }}>
          <button
            type="button"
            onClick={onSkip}
            aria-label="Skip"
            style={skipBtn}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path
                d="M7 5v14M17 5v14"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
          <button
            type="button"
            onClick={onComplete}
            aria-label="Complete"
            style={completeBtn}
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
              <path
                d="M5 12.5l4.5 4.5L19 7"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      ) : (
        <StatusPill status={status} delay={delay} />
      )}
    </div>
  )
}

const skipBtn = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: 38,
  height: 38,
  flex: "none",
  background: "var(--surface-card)",
  color: "var(--text-secondary)",
  border: "1px solid var(--border-default)",
  borderRadius: "var(--radius-md)",
  cursor: "pointer",
}
const completeBtn = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: 38,
  height: 38,
  flex: "none",
  background: "var(--completed-600)",
  color: "#fff",
  border: "1px solid transparent",
  borderRadius: "var(--radius-md)",
  cursor: "pointer",
  boxShadow: "var(--shadow-xs)",
}
