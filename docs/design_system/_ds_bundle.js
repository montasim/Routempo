/* @ds-bundle: {"format":3,"namespace":"RoutineFlowDesignSystem_4781a2","components":[{"name":"Avatar","sourcePath":"components/core/Avatar.jsx"},{"name":"Badge","sourcePath":"components/core/Badge.jsx"},{"name":"Card","sourcePath":"components/core/Card.jsx"},{"name":"Tabs","sourcePath":"components/core/Tabs.jsx"},{"name":"HeatmapCell","sourcePath":"components/data/HeatmapCell.jsx"},{"name":"MetricTile","sourcePath":"components/data/MetricTile.jsx"},{"name":"ProgressRing","sourcePath":"components/data/ProgressRing.jsx"},{"name":"StatusPill","sourcePath":"components/data/StatusPill.jsx"},{"name":"StreakChip","sourcePath":"components/data/StreakChip.jsx"},{"name":"OccurrenceRow","sourcePath":"components/domain/OccurrenceRow.jsx"},{"name":"Button","sourcePath":"components/forms/Button.jsx"},{"name":"Checkbox","sourcePath":"components/forms/Checkbox.jsx"},{"name":"IconButton","sourcePath":"components/forms/IconButton.jsx"},{"name":"Input","sourcePath":"components/forms/Input.jsx"},{"name":"Select","sourcePath":"components/forms/Select.jsx"},{"name":"Switch","sourcePath":"components/forms/Switch.jsx"}],"sourceHashes":{"components/core/Avatar.jsx":"cbccc8ba1faa","components/core/Badge.jsx":"7ee0b018775c","components/core/Card.jsx":"aa82e0a35a46","components/core/Tabs.jsx":"ed6441b162b8","components/data/HeatmapCell.jsx":"8cb4b0982fc7","components/data/MetricTile.jsx":"f0bf9e1e7935","components/data/ProgressRing.jsx":"cdb8a1e47b89","components/data/StatusPill.jsx":"90ffb300eea6","components/data/StreakChip.jsx":"e730e3497688","components/domain/OccurrenceRow.jsx":"f678ceb494fa","components/forms/Button.jsx":"1f07aafd1eb9","components/forms/Checkbox.jsx":"65e32f6621e9","components/forms/IconButton.jsx":"67f071851de4","components/forms/Input.jsx":"d1e32019639b","components/forms/Select.jsx":"a5e2e85eabbc","components/forms/Switch.jsx":"b71510de5ca8","ui_kits/mobile/analytics.jsx":"ad8fb98b84e1","ui_kits/mobile/calendar.jsx":"a0466fb7aaa6","ui_kits/mobile/data.js":"cb572fce3fb8","ui_kits/mobile/home.jsx":"dd0dba077513","ui_kits/mobile/settings.jsx":"9febd95b6d09","ui_kits/web/dashboard.jsx":"ef2dd636d10c"},"inlinedExternals":[],"unexposedExports":[]} */

;(() => {
  const __ds_ns = (window.RoutineFlowDesignSystem_4781a2 =
    window.RoutineFlowDesignSystem_4781a2 || {})

  const __ds_scope = {}

  __ds_ns.__errors = __ds_ns.__errors || []

  // components/core/Avatar.jsx
  try {
    ;(() => {
      const PALETTE = [
        "var(--signal-500)",
        "var(--completed-600)",
        "var(--skipped-600)",
        "var(--ink-700)",
        "var(--missed-500)",
      ]
      function initials(name = "") {
        const parts = name.trim().split(/\s+/)
        return (
          ((parts[0]?.[0] || "") + (parts[1]?.[0] || "")).toUpperCase() || "?"
        )
      }

      /**
       * User avatar — image or colored initials fallback.
       */
      function Avatar({ name = "", src, size = 36, style = {} }) {
        const color = PALETTE[(name.charCodeAt(0) || 0) % PALETTE.length]
        return /*#__PURE__*/ React.createElement(
          "span",
          {
            style: {
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
            },
          },
          src
            ? /*#__PURE__*/ React.createElement("img", {
                src: src,
                alt: name,
                style: {
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                },
              })
            : initials(name)
        )
      }
      Object.assign(__ds_scope, { Avatar })
    })()
  } catch (e) {
    __ds_ns.__errors.push({
      path: "components/core/Avatar.jsx",
      error: String((e && e.message) || e),
    })
  }

  // components/core/Badge.jsx
  try {
    ;(() => {
      const TONES = {
        neutral: {
          fg: "var(--ink-700)",
          bg: "var(--paper-100)",
          dot: "var(--ink-400)",
        },
        signal: {
          fg: "var(--signal-700)",
          bg: "var(--signal-50)",
          dot: "var(--signal-500)",
        },
        completed: {
          fg: "var(--completed-600)",
          bg: "var(--completed-100)",
          dot: "var(--completed-600)",
        },
        pending: {
          fg: "var(--pending-600)",
          bg: "var(--pending-100)",
          dot: "var(--pending-600)",
        },
        missed: {
          fg: "var(--missed-600)",
          bg: "var(--missed-100)",
          dot: "var(--missed-600)",
        },
        skipped: {
          fg: "var(--skipped-600)",
          bg: "var(--skipped-100)",
          dot: "var(--skipped-600)",
        },
      }

      /**
       * Small status / category label. Set `dot` for a leading status dot.
       */
      function Badge({
        children,
        tone = "neutral",
        dot = false,
        mono = false,
        style = {},
      }) {
        const t = TONES[tone] || TONES.neutral
        return /*#__PURE__*/ React.createElement(
          "span",
          {
            style: {
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              height: 22,
              padding: "0 9px",
              background: t.bg,
              color: t.fg,
              fontFamily: mono ? "var(--font-mono)" : "var(--font-text)",
              fontSize: "var(--text-xs)",
              fontWeight: "var(--weight-semibold)",
              letterSpacing: mono ? "var(--tracking-mono)" : "0.01em",
              borderRadius: "var(--radius-pill)",
              whiteSpace: "nowrap",
              ...style,
            },
          },
          dot &&
            /*#__PURE__*/ React.createElement("span", {
              style: {
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: t.dot,
                flex: "none",
              },
            }),
          children
        )
      }
      Object.assign(__ds_scope, { Badge })
    })()
  } catch (e) {
    __ds_ns.__errors.push({
      path: "components/core/Badge.jsx",
      error: String((e && e.message) || e),
    })
  }

  // components/core/Card.jsx
  try {
    ;(() => {
      function _extends() {
        return (
          (_extends = Object.assign
            ? Object.assign.bind()
            : function (n) {
                for (var e = 1; e < arguments.length; e++) {
                  var t = arguments[e]
                  for (var r in t)
                    ({}).hasOwnProperty.call(t, r) && (n[r] = t[r])
                }
                return n
              }),
          _extends.apply(null, arguments)
        )
      }
      /**
       * Surface container. The base panel for everything in RoutineFlow.
       */
      function Card({
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
        return /*#__PURE__*/ React.createElement(
          "div",
          _extends(
            {
              onClick: onClick,
              style: {
                background: "var(--surface-card)",
                borderRadius: "var(--radius-lg)",
                padding: pads[padding] ?? pads.md,
                boxShadow: shadows[elevation] ?? shadows.hairline,
                cursor: interactive ? "pointer" : "default",
                transition:
                  "transform var(--duration-fast) var(--ease-standard), box-shadow var(--duration-fast) var(--ease-standard)",
                ...style,
              },
              onMouseEnter: (e) => {
                if (interactive) {
                  e.currentTarget.style.transform = "translateY(-1px)"
                  e.currentTarget.style.boxShadow = "var(--shadow-md)"
                }
              },
              onMouseLeave: (e) => {
                if (interactive) {
                  e.currentTarget.style.transform = "translateY(0)"
                  e.currentTarget.style.boxShadow =
                    shadows[elevation] ?? shadows.hairline
                }
              },
            },
            rest
          ),
          children
        )
      }
      Object.assign(__ds_scope, { Card })
    })()
  } catch (e) {
    __ds_ns.__errors.push({
      path: "components/core/Card.jsx",
      error: String((e && e.message) || e),
    })
  }

  // components/core/Tabs.jsx
  try {
    ;(() => {
      /**
       * Underline tab bar. items: [{value, label, count?}]. Controlled.
       */
      function Tabs({ items = [], value, onChange, style = {} }) {
        return /*#__PURE__*/ React.createElement(
          "div",
          {
            role: "tablist",
            style: {
              display: "flex",
              gap: "var(--space-6)",
              borderBottom: "1px solid var(--border-subtle)",
              ...style,
            },
          },
          items.map((it) => {
            const active = it.value === value
            return /*#__PURE__*/ React.createElement(
              "button",
              {
                key: it.value,
                role: "tab",
                "aria-selected": active,
                onClick: () => onChange && onChange(it.value),
                style: {
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
                },
                onMouseEnter: (e) => {
                  if (!active)
                    e.currentTarget.style.color = "var(--text-secondary)"
                },
                onMouseLeave: (e) => {
                  if (!active) e.currentTarget.style.color = "var(--text-muted)"
                },
              },
              it.label,
              it.count != null &&
                /*#__PURE__*/ React.createElement(
                  "span",
                  {
                    style: {
                      fontFamily: "var(--font-mono)",
                      fontSize: "var(--text-2xs)",
                      color: active
                        ? "var(--interactive)"
                        : "var(--text-faint)",
                    },
                  },
                  it.count
                ),
              /*#__PURE__*/ React.createElement("span", {
                style: {
                  position: "absolute",
                  left: 0,
                  right: 0,
                  bottom: -1,
                  height: 2,
                  borderRadius: "var(--radius-pill)",
                  background: active ? "var(--interactive)" : "transparent",
                  transition:
                    "background var(--duration-fast) var(--ease-standard)",
                },
              })
            )
          })
        )
      }
      Object.assign(__ds_scope, { Tabs })
    })()
  } catch (e) {
    __ds_ns.__errors.push({
      path: "components/core/Tabs.jsx",
      error: String((e && e.message) || e),
    })
  }

  // components/data/HeatmapCell.jsx
  try {
    ;(() => {
      const RAMP = [
        "var(--ramp-0)",
        "var(--ramp-1)",
        "var(--ramp-2)",
        "var(--ramp-3)",
        "var(--ramp-4)",
      ]

      /**
       * Single day cell for the yearly completion heatmap. `level` 0–4, or pass
       * `rate` (0–1) to bucket automatically.
       */
      function HeatmapCell({
        level,
        rate = null,
        size = 13,
        title,
        style = {},
      }) {
        let lvl = level
        if (lvl == null && rate != null) {
          lvl =
            rate <= 0
              ? 0
              : rate < 0.25
                ? 1
                : rate < 0.5
                  ? 2
                  : rate < 0.85
                    ? 3
                    : 4
        }
        lvl = Math.max(0, Math.min(4, lvl ?? 0))
        return /*#__PURE__*/ React.createElement("span", {
          title: title,
          style: {
            display: "inline-block",
            width: size,
            height: size,
            borderRadius: Math.max(2, size * 0.22),
            background: RAMP[lvl],
            boxShadow:
              lvl === 0 ? "inset 0 0 0 1px var(--border-subtle)" : "none",
            ...style,
          },
        })
      }
      Object.assign(__ds_scope, { HeatmapCell })
    })()
  } catch (e) {
    __ds_ns.__errors.push({
      path: "components/data/HeatmapCell.jsx",
      error: String((e && e.message) || e),
    })
  }

  // components/data/MetricTile.jsx
  try {
    ;(() => {
      /**
       * Single metric tile. Big numeric value + label, optional delta + unit.
       */
      function MetricTile({
        label,
        value,
        unit,
        delta = null,
        deltaDirection = "up",
        tone = "default",
        style = {},
      }) {
        const valueColor =
          {
            default: "var(--text-primary)",
            signal: "var(--interactive)",
            completed: "var(--completed-600)",
            missed: "var(--missed-600)",
          }[tone] || "var(--text-primary)"
        const good = deltaDirection === "up"
        const deltaColor =
          delta == null
            ? "transparent"
            : good
              ? "var(--completed-600)"
              : "var(--missed-600)"
        return /*#__PURE__*/ React.createElement(
          "div",
          {
            style: {
              display: "flex",
              flexDirection: "column",
              gap: "var(--space-3)",
              padding: "var(--space-6)",
              background: "var(--surface-card)",
              borderRadius: "var(--radius-lg)",
              boxShadow: "var(--ring-hairline)",
              ...style,
            },
          },
          /*#__PURE__*/ React.createElement(
            "span",
            {
              style: {
                fontFamily: "var(--font-mono)",
                fontSize: "var(--text-2xs)",
                textTransform: "uppercase",
                letterSpacing: "var(--tracking-caps)",
                color: "var(--text-muted)",
              },
            },
            label
          ),
          /*#__PURE__*/ React.createElement(
            "div",
            {
              style: {
                display: "flex",
                alignItems: "baseline",
                gap: 6,
              },
            },
            /*#__PURE__*/ React.createElement(
              "span",
              {
                style: {
                  fontFamily: "var(--font-display)",
                  fontSize: "var(--text-3xl)",
                  fontWeight: "var(--weight-bold)",
                  letterSpacing: "var(--tracking-tight)",
                  lineHeight: 1,
                  color: valueColor,
                },
              },
              value
            ),
            unit &&
              /*#__PURE__*/ React.createElement(
                "span",
                {
                  style: {
                    fontFamily: "var(--font-mono)",
                    fontSize: "var(--text-sm)",
                    color: "var(--text-muted)",
                  },
                },
                unit
              )
          ),
          delta != null &&
            /*#__PURE__*/ React.createElement(
              "span",
              {
                style: {
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 3,
                  fontFamily: "var(--font-mono)",
                  fontSize: "var(--text-xs)",
                  fontWeight: "var(--weight-medium)",
                  color: deltaColor,
                },
              },
              /*#__PURE__*/ React.createElement(
                "svg",
                {
                  width: "11",
                  height: "11",
                  viewBox: "0 0 24 24",
                  fill: "none",
                  style: {
                    transform: good ? "none" : "rotate(180deg)",
                  },
                },
                /*#__PURE__*/ React.createElement("path", {
                  d: "M12 19V5M5 12l7-7 7 7",
                  stroke: "currentColor",
                  strokeWidth: "2.5",
                  strokeLinecap: "round",
                  strokeLinejoin: "round",
                })
              ),
              delta
            )
        )
      }
      Object.assign(__ds_scope, { MetricTile })
    })()
  } catch (e) {
    __ds_ns.__errors.push({
      path: "components/data/MetricTile.jsx",
      error: String((e && e.message) || e),
    })
  }

  // components/data/ProgressRing.jsx
  try {
    ;(() => {
      /**
       * Circular progress ring with centered value. Used for discipline score
       * and completion percentages.
       */
      function ProgressRing({
        value = 0,
        max = 100,
        size = 96,
        thickness = 8,
        color = "var(--interactive)",
        trackColor = "var(--surface-sunken)",
        label,
        centerLabel,
        style = {},
      }) {
        const pct = Math.max(0, Math.min(1, value / max))
        const r = (size - thickness) / 2
        const c = 2 * Math.PI * r
        const offset = c * (1 - pct)
        return /*#__PURE__*/ React.createElement(
          "div",
          {
            style: {
              display: "inline-flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "var(--space-3)",
              ...style,
            },
          },
          /*#__PURE__*/ React.createElement(
            "div",
            {
              style: {
                position: "relative",
                width: size,
                height: size,
              },
            },
            /*#__PURE__*/ React.createElement(
              "svg",
              {
                width: size,
                height: size,
                style: {
                  transform: "rotate(-90deg)",
                },
              },
              /*#__PURE__*/ React.createElement("circle", {
                cx: size / 2,
                cy: size / 2,
                r: r,
                fill: "none",
                stroke: trackColor,
                strokeWidth: thickness,
              }),
              /*#__PURE__*/ React.createElement("circle", {
                cx: size / 2,
                cy: size / 2,
                r: r,
                fill: "none",
                stroke: color,
                strokeWidth: thickness,
                strokeLinecap: "round",
                strokeDasharray: c,
                strokeDashoffset: offset,
                style: {
                  transition:
                    "stroke-dashoffset var(--duration-slow) var(--ease-out)",
                },
              })
            ),
            /*#__PURE__*/ React.createElement(
              "div",
              {
                style: {
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                },
              },
              /*#__PURE__*/ React.createElement(
                "span",
                {
                  style: {
                    fontFamily: "var(--font-display)",
                    fontSize: size * 0.3,
                    fontWeight: "var(--weight-bold)",
                    letterSpacing: "var(--tracking-tight)",
                    color: "var(--text-primary)",
                    lineHeight: 1,
                  },
                },
                centerLabel ?? Math.round(pct * 100)
              ),
              centerLabel == null &&
                /*#__PURE__*/ React.createElement(
                  "span",
                  {
                    style: {
                      fontFamily: "var(--font-mono)",
                      fontSize: size * 0.12,
                      color: "var(--text-muted)",
                    },
                  },
                  "/100"
                )
            )
          ),
          label &&
            /*#__PURE__*/ React.createElement(
              "span",
              {
                style: {
                  fontFamily: "var(--font-mono)",
                  fontSize: "var(--text-xs)",
                  textTransform: "uppercase",
                  letterSpacing: "var(--tracking-caps)",
                  color: "var(--text-muted)",
                },
              },
              label
            )
        )
      }
      Object.assign(__ds_scope, { ProgressRing })
    })()
  } catch (e) {
    __ds_ns.__errors.push({
      path: "components/data/ProgressRing.jsx",
      error: String((e && e.message) || e),
    })
  }

  // components/data/StatusPill.jsx
  try {
    ;(() => {
      const STATUS = {
        Completed: {
          fg: "var(--completed-600)",
          bg: "var(--completed-100)",
          icon: "M5 12.5l4.5 4.5L19 7",
        },
        Pending: {
          fg: "var(--pending-600)",
          bg: "var(--pending-100)",
          icon: null,
        },
        Missed: {
          fg: "var(--missed-600)",
          bg: "var(--missed-100)",
          icon: "M6 6l12 12M18 6L6 18",
        },
        Skipped: {
          fg: "var(--skipped-600)",
          bg: "var(--skipped-100)",
          icon: "M7 5v14M17 5v14",
        },
      }

      /**
       * Canonical occurrence-status pill. One of the four system states.
       */
      function StatusPill({ status = "Pending", delay = null, style = {} }) {
        const s = STATUS[status] || STATUS.Pending
        return /*#__PURE__*/ React.createElement(
          "span",
          {
            style: {
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              height: 24,
              padding: "0 10px 0 8px",
              background: s.bg,
              color: s.fg,
              borderRadius: "var(--radius-pill)",
              fontFamily: "var(--font-text)",
              fontSize: "var(--text-xs)",
              fontWeight: "var(--weight-semibold)",
              whiteSpace: "nowrap",
              ...style,
            },
          },
          s.icon
            ? /*#__PURE__*/ React.createElement(
                "svg",
                {
                  width: "13",
                  height: "13",
                  viewBox: "0 0 24 24",
                  fill: "none",
                },
                /*#__PURE__*/ React.createElement("path", {
                  d: s.icon,
                  stroke: "currentColor",
                  strokeWidth: "2.4",
                  strokeLinecap: "round",
                  strokeLinejoin: "round",
                })
              )
            : /*#__PURE__*/ React.createElement("span", {
                style: {
                  width: 7,
                  height: 7,
                  borderRadius: "50%",
                  border: "2px solid currentColor",
                },
              }),
          status,
          status === "Completed" &&
            delay != null &&
            /*#__PURE__*/ React.createElement(
              "span",
              {
                style: {
                  fontFamily: "var(--font-mono)",
                  fontSize: "var(--text-2xs)",
                  opacity: 0.85,
                },
              },
              delay > 0 ? `+${delay}m` : delay < 0 ? `${delay}m` : "on time"
            )
        )
      }
      Object.assign(__ds_scope, { StatusPill })
    })()
  } catch (e) {
    __ds_ns.__errors.push({
      path: "components/data/StatusPill.jsx",
      error: String((e && e.message) || e),
    })
  }

  // components/data/StreakChip.jsx
  try {
    ;(() => {
      /**
       * Streak chip — a flame glyph + consecutive-day count. Goes muted at 0.
       */
      function StreakChip({ days = 0, best = null, size = "md", style = {} }) {
        const active = days > 0
        const isRecord = best != null && days >= best && days > 0
        const dims =
          size === "sm"
            ? {
                h: 24,
                fs: "var(--text-xs)",
                icon: 13,
              }
            : {
                h: 30,
                fs: "var(--text-md)",
                icon: 16,
              }
        const fg = active ? "var(--skipped-600)" : "var(--text-faint)"
        const bg = active ? "var(--skipped-100)" : "var(--surface-sunken)"
        return /*#__PURE__*/ React.createElement(
          "span",
          {
            style: {
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              height: dims.h,
              padding: "0 10px",
              background: bg,
              color: fg,
              borderRadius: "var(--radius-pill)",
              ...style,
            },
          },
          /*#__PURE__*/ React.createElement(
            "svg",
            {
              width: dims.icon,
              height: dims.icon,
              viewBox: "0 0 24 24",
              fill: active ? "currentColor" : "none",
              stroke: "currentColor",
              strokeWidth: "1.8",
            },
            /*#__PURE__*/ React.createElement("path", {
              d: "M12 2c1 3 4 4.5 4 8a4 4 0 1 1-8 0c0-1.2.4-2 1-2.8C9.5 8 12 6 12 2z",
              strokeLinejoin: "round",
            })
          ),
          /*#__PURE__*/ React.createElement(
            "span",
            {
              style: {
                fontFamily: "var(--font-mono)",
                fontSize: dims.fs,
                fontWeight: "var(--weight-semibold)",
              },
            },
            days,
            "d"
          ),
          isRecord &&
            /*#__PURE__*/ React.createElement(
              "span",
              {
                style: {
                  fontFamily: "var(--font-mono)",
                  fontSize: "var(--text-2xs)",
                  opacity: 0.8,
                },
              },
              "PB"
            )
        )
      }
      Object.assign(__ds_scope, { StreakChip })
    })()
  } catch (e) {
    __ds_ns.__errors.push({
      path: "components/data/StreakChip.jsx",
      error: String((e && e.message) || e),
    })
  }

  // components/domain/OccurrenceRow.jsx
  try {
    ;(() => {
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
      function OccurrenceRow({
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
        return /*#__PURE__*/ React.createElement(
          "div",
          {
            style: {
              display: "flex",
              alignItems: "center",
              gap: "var(--space-5)",
              padding: "var(--space-5)",
              background: "var(--surface-card)",
              borderRadius: "var(--radius-lg)",
              boxShadow: "var(--ring-hairline)",
              opacity: dimmed ? 0.72 : 1,
              ...style,
            },
          },
          /*#__PURE__*/ React.createElement("span", {
            style: {
              width: 4,
              alignSelf: "stretch",
              borderRadius: "var(--radius-pill)",
              background: accent,
              flex: "none",
            },
          }),
          /*#__PURE__*/ React.createElement(
            "div",
            {
              style: {
                width: 56,
                flex: "none",
              },
            },
            /*#__PURE__*/ React.createElement(
              "div",
              {
                style: {
                  fontFamily: "var(--font-mono)",
                  fontSize: "var(--text-lg)",
                  fontWeight: "var(--weight-medium)",
                  color: "var(--text-primary)",
                  lineHeight: 1.1,
                },
              },
              time
            ),
            category &&
              /*#__PURE__*/ React.createElement(
                "div",
                {
                  style: {
                    fontFamily: "var(--font-mono)",
                    fontSize: "var(--text-2xs)",
                    textTransform: "uppercase",
                    letterSpacing: "var(--tracking-caps)",
                    color: "var(--text-muted)",
                    marginTop: 2,
                  },
                },
                category
              )
          ),
          /*#__PURE__*/ React.createElement(
            "div",
            {
              style: {
                flex: 1,
                minWidth: 0,
              },
            },
            /*#__PURE__*/ React.createElement(
              "div",
              {
                style: {
                  fontFamily: "var(--font-text)",
                  fontSize: "var(--text-lg)",
                  fontWeight: "var(--weight-semibold)",
                  color: "var(--text-primary)",
                  textDecoration: status === "Completed" ? "none" : "none",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                },
              },
              title
            )
          ),
          isPending
            ? /*#__PURE__*/ React.createElement(
                "div",
                {
                  style: {
                    display: "flex",
                    gap: "var(--space-3)",
                    flex: "none",
                  },
                },
                /*#__PURE__*/ React.createElement(
                  "button",
                  {
                    type: "button",
                    onClick: onSkip,
                    "aria-label": "Skip",
                    style: skipBtn,
                  },
                  /*#__PURE__*/ React.createElement(
                    "svg",
                    {
                      width: "16",
                      height: "16",
                      viewBox: "0 0 24 24",
                      fill: "none",
                    },
                    /*#__PURE__*/ React.createElement("path", {
                      d: "M7 5v14M17 5v14",
                      stroke: "currentColor",
                      strokeWidth: "2",
                      strokeLinecap: "round",
                    })
                  )
                ),
                /*#__PURE__*/ React.createElement(
                  "button",
                  {
                    type: "button",
                    onClick: onComplete,
                    "aria-label": "Complete",
                    style: completeBtn,
                  },
                  /*#__PURE__*/ React.createElement(
                    "svg",
                    {
                      width: "17",
                      height: "17",
                      viewBox: "0 0 24 24",
                      fill: "none",
                    },
                    /*#__PURE__*/ React.createElement("path", {
                      d: "M5 12.5l4.5 4.5L19 7",
                      stroke: "currentColor",
                      strokeWidth: "2.4",
                      strokeLinecap: "round",
                      strokeLinejoin: "round",
                    })
                  )
                )
              )
            : /*#__PURE__*/ React.createElement(__ds_scope.StatusPill, {
                status: status,
                delay: delay,
              })
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
      Object.assign(__ds_scope, { OccurrenceRow })
    })()
  } catch (e) {
    __ds_ns.__errors.push({
      path: "components/domain/OccurrenceRow.jsx",
      error: String((e && e.message) || e),
    })
  }

  // components/forms/Button.jsx
  try {
    ;(() => {
      function _extends() {
        return (
          (_extends = Object.assign
            ? Object.assign.bind()
            : function (n) {
                for (var e = 1; e < arguments.length; e++) {
                  var t = arguments[e]
                  for (var r in t)
                    ({}).hasOwnProperty.call(t, r) && (n[r] = t[r])
                }
                return n
              }),
          _extends.apply(null, arguments)
        )
      }
      /**
       * RoutineFlow primary action button.
       * Variants: primary (signal), secondary (ink outline), ghost, danger.
       */
      function Button({
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
        return /*#__PURE__*/ React.createElement(
          "button",
          _extends(
            {
              type: type,
              disabled: disabled,
              onClick: onClick,
              style: base,
              onMouseEnter: (e) => {
                if (!disabled)
                  e.currentTarget.style.background = hoverBg[variant]
              },
              onMouseLeave: (e) => {
                if (!disabled) e.currentTarget.style.background = v.background
              },
              onMouseDown: (e) => {
                if (!disabled) e.currentTarget.style.transform = "scale(0.97)"
              },
              onMouseUp: (e) => {
                e.currentTarget.style.transform = "scale(1)"
              },
            },
            rest
          ),
          iconLeft,
          children,
          iconRight
        )
      }
      Object.assign(__ds_scope, { Button })
    })()
  } catch (e) {
    __ds_ns.__errors.push({
      path: "components/forms/Button.jsx",
      error: String((e && e.message) || e),
    })
  }

  // components/forms/Checkbox.jsx
  try {
    ;(() => {
      /**
       * Checkbox with optional label. Controlled via `checked` + `onChange(next)`.
       */
      function Checkbox({
        checked = false,
        label,
        disabled = false,
        onChange,
        style = {},
      }) {
        return /*#__PURE__*/ React.createElement(
          "label",
          {
            style: {
              display: "inline-flex",
              alignItems: "center",
              gap: "var(--space-3)",
              cursor: disabled ? "not-allowed" : "pointer",
              opacity: disabled ? 0.5 : 1,
              ...style,
            },
          },
          /*#__PURE__*/ React.createElement(
            "button",
            {
              type: "button",
              role: "checkbox",
              "aria-checked": checked,
              disabled: disabled,
              onClick: () => !disabled && onChange && onChange(!checked),
              style: {
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: 20,
                height: 20,
                flex: "none",
                padding: 0,
                background: checked
                  ? "var(--interactive)"
                  : "var(--surface-card)",
                border: `1px solid ${checked ? "var(--interactive)" : "var(--border-strong)"}`,
                borderRadius: "var(--radius-xs)",
                cursor: "inherit",
                transition:
                  "background var(--duration-fast) var(--ease-standard), border-color var(--duration-fast) var(--ease-standard)",
              },
            },
            checked &&
              /*#__PURE__*/ React.createElement(
                "svg",
                {
                  width: "13",
                  height: "13",
                  viewBox: "0 0 24 24",
                  fill: "none",
                },
                /*#__PURE__*/ React.createElement("path", {
                  d: "M5 12.5l4.5 4.5L19 7",
                  stroke: "#fff",
                  strokeWidth: "2.5",
                  strokeLinecap: "round",
                  strokeLinejoin: "round",
                })
              )
          ),
          label &&
            /*#__PURE__*/ React.createElement(
              "span",
              {
                style: {
                  fontFamily: "var(--font-text)",
                  fontSize: "var(--text-md)",
                  color: "var(--text-primary)",
                },
              },
              label
            )
        )
      }
      Object.assign(__ds_scope, { Checkbox })
    })()
  } catch (e) {
    __ds_ns.__errors.push({
      path: "components/forms/Checkbox.jsx",
      error: String((e && e.message) || e),
    })
  }

  // components/forms/IconButton.jsx
  try {
    ;(() => {
      function _extends() {
        return (
          (_extends = Object.assign
            ? Object.assign.bind()
            : function (n) {
                for (var e = 1; e < arguments.length; e++) {
                  var t = arguments[e]
                  for (var r in t)
                    ({}).hasOwnProperty.call(t, r) && (n[r] = t[r])
                }
                return n
              }),
          _extends.apply(null, arguments)
        )
      }
      /**
       * Square icon-only button. Pass a Lucide <i data-lucide> or SVG as children.
       */
      function IconButton({
        children,
        variant = "ghost",
        size = "md",
        disabled = false,
        ariaLabel,
        onClick,
        style = {},
        ...rest
      }) {
        const sizes = {
          sm: 30,
          md: 38,
          lg: 44,
        }
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
        return /*#__PURE__*/ React.createElement(
          "button",
          _extends(
            {
              type: "button",
              "aria-label": ariaLabel,
              disabled: disabled,
              onClick: onClick,
              style: {
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
              },
              onMouseEnter: (e) => {
                if (!disabled && variant !== "solid")
                  e.currentTarget.style.background = "var(--surface-sunken)"
              },
              onMouseLeave: (e) => {
                if (!disabled) e.currentTarget.style.background = v.background
              },
              onMouseDown: (e) => {
                if (!disabled) e.currentTarget.style.transform = "scale(0.94)"
              },
              onMouseUp: (e) => {
                e.currentTarget.style.transform = "scale(1)"
              },
            },
            rest
          ),
          children
        )
      }
      Object.assign(__ds_scope, { IconButton })
    })()
  } catch (e) {
    __ds_ns.__errors.push({
      path: "components/forms/IconButton.jsx",
      error: String((e && e.message) || e),
    })
  }

  // components/forms/Input.jsx
  try {
    ;(() => {
      function _extends() {
        return (
          (_extends = Object.assign
            ? Object.assign.bind()
            : function (n) {
                for (var e = 1; e < arguments.length; e++) {
                  var t = arguments[e]
                  for (var r in t)
                    ({}).hasOwnProperty.call(t, r) && (n[r] = t[r])
                }
                return n
              }),
          _extends.apply(null, arguments)
        )
      }
      /**
       * Text input with optional label, leading element, and error state.
       */
      function Input({
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
        return /*#__PURE__*/ React.createElement(
          "label",
          {
            style: {
              display: "block",
              width: fullWidth ? "100%" : "auto",
              ...style,
            },
          },
          label &&
            /*#__PURE__*/ React.createElement(
              "span",
              {
                style: {
                  display: "block",
                  fontFamily: "var(--font-text)",
                  fontSize: "var(--text-sm)",
                  fontWeight: "var(--weight-medium)",
                  color: "var(--text-secondary)",
                  marginBottom: "var(--space-3)",
                },
              },
              label
            ),
          /*#__PURE__*/ React.createElement(
            "span",
            {
              style: {
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
              },
            },
            leading &&
              /*#__PURE__*/ React.createElement(
                "span",
                {
                  style: {
                    display: "inline-flex",
                    color: "var(--text-muted)",
                  },
                },
                leading
              ),
            /*#__PURE__*/ React.createElement(
              "input",
              _extends(
                {
                  type: type,
                  value: value,
                  defaultValue: defaultValue,
                  placeholder: placeholder,
                  disabled: disabled,
                  onChange: onChange,
                  onFocus: () => setFocused(true),
                  onBlur: () => setFocused(false),
                  style: {
                    flex: 1,
                    minWidth: 0,
                    border: "none",
                    outline: "none",
                    background: "transparent",
                    fontFamily: "var(--font-text)",
                    fontSize: "var(--text-md)",
                    color: "var(--text-primary)",
                  },
                },
                rest
              )
            ),
            trailing &&
              /*#__PURE__*/ React.createElement(
                "span",
                {
                  style: {
                    display: "inline-flex",
                    color: "var(--text-muted)",
                  },
                },
                trailing
              )
          ),
          (hint || error) &&
            /*#__PURE__*/ React.createElement(
              "span",
              {
                style: {
                  display: "block",
                  fontFamily: "var(--font-text)",
                  fontSize: "var(--text-xs)",
                  color: error ? "var(--status-missed)" : "var(--text-muted)",
                  marginTop: "var(--space-2)",
                },
              },
              error || hint
            )
        )
      }
      Object.assign(__ds_scope, { Input })
    })()
  } catch (e) {
    __ds_ns.__errors.push({
      path: "components/forms/Input.jsx",
      error: String((e && e.message) || e),
    })
  }

  // components/forms/Select.jsx
  try {
    ;(() => {
      function _extends() {
        return (
          (_extends = Object.assign
            ? Object.assign.bind()
            : function (n) {
                for (var e = 1; e < arguments.length; e++) {
                  var t = arguments[e]
                  for (var r in t)
                    ({}).hasOwnProperty.call(t, r) && (n[r] = t[r])
                }
                return n
              }),
          _extends.apply(null, arguments)
        )
      }
      /**
       * Styled native select with a chevron. Options: [{value, label}] or strings.
       */
      function Select({
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
          typeof o === "string"
            ? {
                value: o,
                label: o,
              }
            : o
        )
        return /*#__PURE__*/ React.createElement(
          "label",
          {
            style: {
              display: "block",
              width: fullWidth ? "100%" : "auto",
              ...style,
            },
          },
          label &&
            /*#__PURE__*/ React.createElement(
              "span",
              {
                style: {
                  display: "block",
                  fontFamily: "var(--font-text)",
                  fontSize: "var(--text-sm)",
                  fontWeight: "var(--weight-medium)",
                  color: "var(--text-secondary)",
                  marginBottom: "var(--space-3)",
                },
              },
              label
            ),
          /*#__PURE__*/ React.createElement(
            "span",
            {
              style: {
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
              },
            },
            /*#__PURE__*/ React.createElement(
              "select",
              _extends(
                {
                  value: value,
                  defaultValue: defaultValue,
                  disabled: disabled,
                  onChange: onChange,
                  onFocus: () => setFocused(true),
                  onBlur: () => setFocused(false),
                  style: {
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
                  },
                },
                rest
              ),
              opts.map((o) =>
                /*#__PURE__*/ React.createElement(
                  "option",
                  {
                    key: o.value,
                    value: o.value,
                  },
                  o.label
                )
              )
            ),
            /*#__PURE__*/ React.createElement(
              "svg",
              {
                width: "16",
                height: "16",
                viewBox: "0 0 24 24",
                fill: "none",
                style: {
                  position: "absolute",
                  right: 12,
                  pointerEvents: "none",
                  color: "var(--text-muted)",
                },
              },
              /*#__PURE__*/ React.createElement("path", {
                d: "M6 9l6 6 6-6",
                stroke: "currentColor",
                strokeWidth: "2",
                strokeLinecap: "round",
                strokeLinejoin: "round",
              })
            )
          )
        )
      }
      Object.assign(__ds_scope, { Select })
    })()
  } catch (e) {
    __ds_ns.__errors.push({
      path: "components/forms/Select.jsx",
      error: String((e && e.message) || e),
    })
  }

  // components/forms/Switch.jsx
  try {
    ;(() => {
      /**
       * On/off toggle. Controlled via `checked` + `onChange(next)`.
       */
      function Switch({
        checked = false,
        disabled = false,
        size = "md",
        onChange,
        ariaLabel,
        style = {},
      }) {
        const dims =
          size === "sm"
            ? {
                w: 36,
                h: 20,
                k: 14,
              }
            : {
                w: 44,
                h: 26,
                k: 20,
              }
        return /*#__PURE__*/ React.createElement(
          "button",
          {
            type: "button",
            role: "switch",
            "aria-checked": checked,
            "aria-label": ariaLabel,
            disabled: disabled,
            onClick: () => !disabled && onChange && onChange(!checked),
            style: {
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
              transition:
                "background var(--duration-base) var(--ease-standard)",
              WebkitTapHighlightColor: "transparent",
              ...style,
            },
          },
          /*#__PURE__*/ React.createElement("span", {
            style: {
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
            },
          })
        )
      }
      Object.assign(__ds_scope, { Switch })
    })()
  } catch (e) {
    __ds_ns.__errors.push({
      path: "components/forms/Switch.jsx",
      error: String((e && e.message) || e),
    })
  }

  // ui_kits/mobile/analytics.jsx
  try {
    ;(() => {
      // AnalyticsScreen — period tabs over metrics derived from logs.
      ;(function () {
        const { Tabs, MetricTile, ProgressRing, HeatmapCell, Card } =
          window.RoutineFlowDesignSystem_4781a2
        function TrendBars({ data }) {
          return /*#__PURE__*/ React.createElement(
            Card,
            {
              padding: "md",
            },
            /*#__PURE__*/ React.createElement(
              "div",
              {
                style: {
                  fontFamily: "var(--font-mono)",
                  fontSize: "var(--text-2xs)",
                  textTransform: "uppercase",
                  letterSpacing: "var(--tracking-caps)",
                  color: "var(--text-muted)",
                  marginBottom: 14,
                },
              },
              "Completion trend"
            ),
            /*#__PURE__*/ React.createElement(
              "div",
              {
                style: {
                  display: "flex",
                  alignItems: "flex-end",
                  gap: 10,
                  height: 120,
                },
              },
              data.map((d, i) =>
                /*#__PURE__*/ React.createElement(
                  "div",
                  {
                    key: i,
                    style: {
                      flex: 1,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 6,
                      height: "100%",
                      justifyContent: "flex-end",
                    },
                  },
                  /*#__PURE__*/ React.createElement(
                    "div",
                    {
                      style: {
                        fontFamily: "var(--font-mono)",
                        fontSize: "var(--text-2xs)",
                        color: "var(--text-muted)",
                      },
                    },
                    Math.round(d.rate * 100)
                  ),
                  /*#__PURE__*/ React.createElement("div", {
                    style: {
                      width: "100%",
                      height: d.rate * 90 + "%",
                      minHeight: 4,
                      background:
                        d.rate >= 0.85
                          ? "var(--completed-600)"
                          : d.rate >= 0.6
                            ? "var(--ramp-3)"
                            : "var(--skipped-500)",
                      borderRadius: "var(--radius-sm)",
                    },
                  }),
                  /*#__PURE__*/ React.createElement(
                    "div",
                    {
                      style: {
                        fontFamily: "var(--font-mono)",
                        fontSize: "var(--text-2xs)",
                        color: "var(--text-faint)",
                      },
                    },
                    d.day
                  )
                )
              )
            )
          )
        }
        function YearHeatmap({ year }) {
          return /*#__PURE__*/ React.createElement(
            Card,
            {
              padding: "md",
            },
            /*#__PURE__*/ React.createElement(
              "div",
              {
                style: {
                  fontFamily: "var(--font-mono)",
                  fontSize: "var(--text-2xs)",
                  textTransform: "uppercase",
                  letterSpacing: "var(--tracking-caps)",
                  color: "var(--text-muted)",
                  marginBottom: 14,
                },
              },
              "Discipline heatmap \xB7 2026"
            ),
            /*#__PURE__*/ React.createElement(
              "div",
              {
                style: {
                  display: "flex",
                  gap: 3,
                  overflowX: "auto",
                  paddingBottom: 4,
                },
              },
              year.map((wk, i) =>
                /*#__PURE__*/ React.createElement(
                  "div",
                  {
                    key: i,
                    style: {
                      display: "flex",
                      flexDirection: "column",
                      gap: 3,
                    },
                  },
                  wk.map((d, j) =>
                    /*#__PURE__*/ React.createElement(HeatmapCell, {
                      key: j,
                      rate: d.rate == null ? 0 : d.rate,
                      level: d.rate == null ? 0 : undefined,
                      size: 11,
                    })
                  )
                )
              )
            )
          )
        }
        function AnalyticsScreen() {
          const D = window.RF_DATA
          const [tab, setTab] = React.useState("week")
          return /*#__PURE__*/ React.createElement(
            "div",
            {
              style: {
                padding: "0 20px 24px",
              },
            },
            /*#__PURE__*/ React.createElement(
              "header",
              {
                style: {
                  padding: "8px 0 16px",
                },
              },
              /*#__PURE__*/ React.createElement(
                "h1",
                {
                  style: {
                    fontFamily: "var(--font-display)",
                    fontSize: "var(--text-3xl)",
                    fontWeight: 700,
                    letterSpacing: "-0.02em",
                    margin: 0,
                  },
                },
                "Analytics"
              )
            ),
            /*#__PURE__*/ React.createElement(
              "div",
              {
                style: {
                  marginBottom: 18,
                },
              },
              /*#__PURE__*/ React.createElement(Tabs, {
                value: tab,
                onChange: setTab,
                items: [
                  {
                    value: "day",
                    label: "Daily",
                  },
                  {
                    value: "week",
                    label: "Weekly",
                  },
                  {
                    value: "month",
                    label: "Monthly",
                  },
                  {
                    value: "year",
                    label: "Yearly",
                  },
                ],
              })
            ),
            tab === "day" &&
              /*#__PURE__*/ React.createElement(
                "div",
                {
                  style: {
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 12,
                  },
                },
                /*#__PURE__*/ React.createElement(MetricTile, {
                  label: "Completion",
                  value: D.metrics.daily.completion,
                  unit: "%",
                }),
                /*#__PURE__*/ React.createElement(MetricTile, {
                  label: "Missed",
                  value: D.metrics.daily.missed,
                  tone: "missed",
                }),
                /*#__PURE__*/ React.createElement(MetricTile, {
                  label: "Avg delay",
                  value: D.metrics.daily.avgDelay,
                  unit: "min",
                  tone: "completed",
                }),
                /*#__PURE__*/ React.createElement(MetricTile, {
                  label: "Best routine",
                  value: "Vitamins",
                  style: {
                    gridColumn: "span 1",
                  },
                })
              ),
            tab === "week" &&
              /*#__PURE__*/ React.createElement(
                "div",
                {
                  style: {
                    display: "flex",
                    flexDirection: "column",
                    gap: 12,
                  },
                },
                /*#__PURE__*/ React.createElement(
                  "div",
                  {
                    style: {
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr 1fr",
                      gap: 12,
                    },
                  },
                  /*#__PURE__*/ React.createElement(MetricTile, {
                    label: "Completion",
                    value: D.metrics.weekly.completion,
                    unit: "%",
                    delta: "+4%",
                    deltaDirection: "up",
                  }),
                  /*#__PURE__*/ React.createElement(MetricTile, {
                    label: "Stability",
                    value: D.metrics.weekly.stability,
                    unit: "%",
                  }),
                  /*#__PURE__*/ React.createElement(MetricTile, {
                    label: "Avg delay",
                    value: D.metrics.weekly.avgDelay,
                    unit: "m",
                    delta: "2m",
                    deltaDirection: "down",
                    tone: "completed",
                  })
                ),
                /*#__PURE__*/ React.createElement(TrendBars, {
                  data: D.weekTrend,
                })
              ),
            tab === "month" &&
              /*#__PURE__*/ React.createElement(
                "div",
                {
                  style: {
                    display: "flex",
                    flexDirection: "column",
                    gap: 12,
                  },
                },
                /*#__PURE__*/ React.createElement(
                  "div",
                  {
                    style: {
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: 12,
                    },
                  },
                  /*#__PURE__*/ React.createElement(MetricTile, {
                    label: "Completion",
                    value: D.metrics.monthly.completion,
                    unit: "%",
                    delta: "+2%",
                    deltaDirection: "up",
                  }),
                  /*#__PURE__*/ React.createElement(MetricTile, {
                    label: "Missed",
                    value: D.metrics.monthly.missed,
                    tone: "missed",
                    delta: "3",
                    deltaDirection: "down",
                  })
                ),
                /*#__PURE__*/ React.createElement(
                  Card,
                  {
                    padding: "md",
                  },
                  /*#__PURE__*/ React.createElement(
                    "div",
                    {
                      style: {
                        fontFamily: "var(--font-mono)",
                        fontSize: "var(--text-2xs)",
                        textTransform: "uppercase",
                        letterSpacing: "var(--tracking-caps)",
                        color: "var(--text-muted)",
                        marginBottom: 12,
                      },
                    },
                    "Consistency by routine"
                  ),
                  /*#__PURE__*/ React.createElement(
                    "div",
                    {
                      style: {
                        display: "flex",
                        flexDirection: "column",
                        gap: 12,
                      },
                    },
                    D.routines.map((r) =>
                      /*#__PURE__*/ React.createElement(
                        "div",
                        {
                          key: r.id,
                          style: {
                            display: "flex",
                            alignItems: "center",
                            gap: 12,
                          },
                        },
                        /*#__PURE__*/ React.createElement(
                          "span",
                          {
                            style: {
                              width: 110,
                              fontSize: "var(--text-sm)",
                              fontWeight: 500,
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            },
                          },
                          r.title
                        ),
                        /*#__PURE__*/ React.createElement(
                          "div",
                          {
                            style: {
                              flex: 1,
                              height: 8,
                              background: "var(--surface-sunken)",
                              borderRadius: "var(--radius-pill)",
                              overflow: "hidden",
                            },
                          },
                          /*#__PURE__*/ React.createElement("div", {
                            style: {
                              width: r.consistency * 100 + "%",
                              height: "100%",
                              background: "var(--completed-600)",
                              borderRadius: "var(--radius-pill)",
                            },
                          })
                        ),
                        /*#__PURE__*/ React.createElement(
                          "span",
                          {
                            style: {
                              fontFamily: "var(--font-mono)",
                              fontSize: "var(--text-xs)",
                              color: "var(--text-secondary)",
                              width: 34,
                              textAlign: "right",
                            },
                          },
                          Math.round(r.consistency * 100),
                          "%"
                        )
                      )
                    )
                  )
                )
              ),
            tab === "year" &&
              /*#__PURE__*/ React.createElement(
                "div",
                {
                  style: {
                    display: "flex",
                    flexDirection: "column",
                    gap: 12,
                  },
                },
                /*#__PURE__*/ React.createElement(
                  Card,
                  {
                    padding: "md",
                    style: {
                      display: "flex",
                      alignItems: "center",
                      gap: 18,
                    },
                  },
                  /*#__PURE__*/ React.createElement(ProgressRing, {
                    value: D.metrics.yearly.discipline,
                    size: 92,
                    label: "Discipline",
                  }),
                  /*#__PURE__*/ React.createElement(
                    "div",
                    {
                      style: {
                        flex: 1,
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: 14,
                      },
                    },
                    /*#__PURE__*/ React.createElement(Stat, {
                      label: "Completion",
                      value: D.metrics.yearly.completion + "%",
                    }),
                    /*#__PURE__*/ React.createElement(Stat, {
                      label: "Active days",
                      value: D.metrics.yearly.activeDays,
                    }),
                    /*#__PURE__*/ React.createElement(Stat, {
                      label: "Drift 30d",
                      value: D.metrics.yearly.drift,
                      tone: "completed",
                    }),
                    /*#__PURE__*/ React.createElement(Stat, {
                      label: "Best streak",
                      value: "54d",
                    })
                  )
                ),
                /*#__PURE__*/ React.createElement(YearHeatmap, {
                  year: D.year,
                })
              )
          )
        }
        function Stat({ label, value, tone }) {
          return /*#__PURE__*/ React.createElement(
            "div",
            null,
            /*#__PURE__*/ React.createElement(
              "div",
              {
                style: {
                  fontFamily: "var(--font-mono)",
                  fontSize: "var(--text-2xs)",
                  textTransform: "uppercase",
                  letterSpacing: "var(--tracking-caps)",
                  color: "var(--text-muted)",
                },
              },
              label
            ),
            /*#__PURE__*/ React.createElement(
              "div",
              {
                style: {
                  fontFamily: "var(--font-display)",
                  fontSize: "var(--text-xl)",
                  fontWeight: 700,
                  color:
                    tone === "completed"
                      ? "var(--completed-600)"
                      : "var(--text-primary)",
                  marginTop: 2,
                },
              },
              value
            )
          )
        }
        window.AnalyticsScreen = AnalyticsScreen
      })()
    })()
  } catch (e) {
    __ds_ns.__errors.push({
      path: "ui_kits/mobile/analytics.jsx",
      error: String((e && e.message) || e),
    })
  }

  // ui_kits/mobile/calendar.jsx
  try {
    ;(() => {
      // CalendarScreen — month grid colored by completion, with the selected day's log.
      ;(function () {
        const { Card, StatusPill } = window.RoutineFlowDesignSystem_4781a2
        const DOW = ["M", "T", "W", "T", "F", "S", "S"]
        function dayColor(d) {
          if (d.status === "future")
            return {
              bg: "transparent",
              fg: "var(--text-faint)",
              ring: "1px solid var(--border-subtle)",
            }
          if (d.status === "today")
            return {
              bg: "var(--ink-900)",
              fg: "#fff",
              ring: "none",
            }
          if (d.status === "missed")
            return {
              bg: "var(--missed-100)",
              fg: "var(--missed-600)",
              ring: "none",
            }
          if (d.status === "perfect")
            return {
              bg: "var(--ramp-4)",
              fg: "#fff",
              ring: "none",
            }
          // mixed → ramp by rate
          const lvl =
            d.rate < 0.4
              ? "var(--ramp-1)"
              : d.rate < 0.7
                ? "var(--ramp-2)"
                : "var(--ramp-3)"
          return {
            bg: lvl,
            fg: "var(--ink-900)",
            ring: "none",
          }
        }
        function CalendarScreen() {
          const month = window.RF_DATA.month
          const [sel, setSel] = React.useState(21)
          // first of month offset (assume starts Thursday => 3 blanks)
          const offset = 3
          const selLog = [
            {
              time: "06:30",
              title: "Wake & hydrate",
              category: "Health",
              status: "Completed",
              delay: -2,
            },
            {
              time: "07:00",
              title: "Morning Gym",
              category: "Fitness",
              status: "Completed",
              delay: 4,
            },
            {
              time: "09:30",
              title: "Deep work block",
              category: "Work",
              status: "Missed",
              delay: null,
            },
            {
              time: "22:30",
              title: "Read 20 minutes",
              category: "Mind",
              status: "Skipped",
              delay: null,
            },
          ]
          return /*#__PURE__*/ React.createElement(
            "div",
            {
              style: {
                padding: "0 20px 24px",
              },
            },
            /*#__PURE__*/ React.createElement(
              "header",
              {
                style: {
                  padding: "8px 0 18px",
                },
              },
              /*#__PURE__*/ React.createElement(
                "div",
                {
                  style: {
                    fontFamily: "var(--font-mono)",
                    fontSize: "var(--text-2xs)",
                    textTransform: "uppercase",
                    letterSpacing: "var(--tracking-caps)",
                    color: "var(--text-muted)",
                  },
                },
                "2026"
              ),
              /*#__PURE__*/ React.createElement(
                "h1",
                {
                  style: {
                    fontFamily: "var(--font-display)",
                    fontSize: "var(--text-3xl)",
                    fontWeight: 700,
                    letterSpacing: "-0.02em",
                    margin: "4px 0 0",
                  },
                },
                "June"
              )
            ),
            /*#__PURE__*/ React.createElement(
              Card,
              {
                padding: "md",
                style: {
                  marginBottom: 18,
                },
              },
              /*#__PURE__*/ React.createElement(
                "div",
                {
                  style: {
                    display: "grid",
                    gridTemplateColumns: "repeat(7,1fr)",
                    gap: 6,
                    marginBottom: 8,
                  },
                },
                DOW.map((d, i) =>
                  /*#__PURE__*/ React.createElement(
                    "div",
                    {
                      key: i,
                      style: {
                        textAlign: "center",
                        fontFamily: "var(--font-mono)",
                        fontSize: "var(--text-2xs)",
                        color: "var(--text-faint)",
                      },
                    },
                    d
                  )
                )
              ),
              /*#__PURE__*/ React.createElement(
                "div",
                {
                  style: {
                    display: "grid",
                    gridTemplateColumns: "repeat(7,1fr)",
                    gap: 6,
                  },
                },
                Array.from({
                  length: offset,
                }).map((_, i) =>
                  /*#__PURE__*/ React.createElement("div", {
                    key: "b" + i,
                  })
                ),
                month.map((d) => {
                  const c = dayColor(d)
                  const isSel = d.day === sel
                  return /*#__PURE__*/ React.createElement(
                    "button",
                    {
                      key: d.day,
                      onClick: () => setSel(d.day),
                      style: {
                        aspectRatio: "1",
                        border: c.ring,
                        background: c.bg,
                        color: c.fg,
                        borderRadius: "var(--radius-sm)",
                        cursor: "pointer",
                        fontFamily: "var(--font-mono)",
                        fontSize: "var(--text-sm)",
                        fontWeight: 500,
                        outline: isSel
                          ? "2px solid var(--interactive)"
                          : "none",
                        outlineOffset: 1,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      },
                    },
                    d.day
                  )
                })
              )
            ),
            /*#__PURE__*/ React.createElement(
              "div",
              {
                style: {
                  fontFamily: "var(--font-mono)",
                  fontSize: "var(--text-2xs)",
                  textTransform: "uppercase",
                  letterSpacing: "var(--tracking-caps)",
                  color: "var(--text-muted)",
                  margin: "0 0 10px 2px",
                },
              },
              sel,
              " June \xB7 log"
            ),
            /*#__PURE__*/ React.createElement(
              "div",
              {
                style: {
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                },
              },
              selLog.map((l, i) =>
                /*#__PURE__*/ React.createElement(
                  Card,
                  {
                    key: i,
                    padding: "sm",
                    style: {
                      display: "flex",
                      alignItems: "center",
                      gap: 14,
                    },
                  },
                  /*#__PURE__*/ React.createElement(
                    "span",
                    {
                      style: {
                        fontFamily: "var(--font-mono)",
                        fontSize: "var(--text-md)",
                        color: "var(--text-primary)",
                        width: 48,
                      },
                    },
                    l.time
                  ),
                  /*#__PURE__*/ React.createElement(
                    "span",
                    {
                      style: {
                        flex: 1,
                        fontSize: "var(--text-md)",
                        fontWeight: 500,
                      },
                    },
                    l.title
                  ),
                  /*#__PURE__*/ React.createElement(StatusPill, {
                    status: l.status,
                    delay: l.delay,
                  })
                )
              )
            )
          )
        }
        window.CalendarScreen = CalendarScreen
      })()
    })()
  } catch (e) {
    __ds_ns.__errors.push({
      path: "ui_kits/mobile/calendar.jsx",
      error: String((e && e.message) || e),
    })
  }

  // ui_kits/mobile/data.js
  try {
    ;(() => {
      // RoutineFlow — shared mock dataset for the mobile + web UI kits.
      // Everything here mimics what would be DERIVED from routine_logs.
      window.RF_DATA = (function () {
        const user = {
          name: "Demo User",
          timezone: "Asia/Dhaka",
          email: "demo@example.com",
        }

        // Today's occurrences (status drives the Home screen)
        const today = [
          {
            id: "o1",
            time: "06:30",
            title: "Wake & hydrate",
            category: "Health",
            status: "Completed",
            delay: -2,
          },
          {
            id: "o2",
            time: "07:00",
            title: "Morning Gym",
            category: "Fitness",
            status: "Completed",
            delay: 4,
          },
          {
            id: "o3",
            time: "08:15",
            title: "Vitamins",
            category: "Health",
            status: "Completed",
            delay: 0,
          },
          {
            id: "o4",
            time: "09:30",
            title: "Deep work block",
            category: "Work",
            status: "Pending",
            delay: null,
          },
          {
            id: "o5",
            time: "13:00",
            title: "Walk after lunch",
            category: "Fitness",
            status: "Pending",
            delay: null,
          },
          {
            id: "o6",
            time: "18:00",
            title: "Language practice",
            category: "Mind",
            status: "Pending",
            delay: null,
          },
          {
            id: "o7",
            time: "22:30",
            title: "Read 20 minutes",
            category: "Mind",
            status: "Pending",
            delay: null,
          },
        ]
        const routines = [
          {
            id: "r1",
            title: "Morning Gym",
            category: "Fitness",
            time: "07:00",
            recurrence: "Daily",
            streak: 28,
            best: 31,
            consistency: 0.92,
            active: true,
          },
          {
            id: "r2",
            title: "Vitamins",
            category: "Health",
            time: "08:15",
            recurrence: "Daily",
            streak: 54,
            best: 54,
            consistency: 0.98,
            active: true,
          },
          {
            id: "r3",
            title: "Deep work block",
            category: "Work",
            time: "09:30",
            recurrence: "Weekly",
            streak: 6,
            best: 12,
            consistency: 0.74,
            active: true,
          },
          {
            id: "r4",
            title: "Language practice",
            category: "Mind",
            time: "18:00",
            recurrence: "Daily",
            streak: 0,
            best: 19,
            consistency: 0.61,
            active: true,
          },
          {
            id: "r5",
            title: "Read 20 minutes",
            category: "Mind",
            time: "22:30",
            recurrence: "Daily",
            streak: 11,
            best: 22,
            consistency: 0.83,
            active: true,
          },
        ]

        // Weekly completion trend (last 7 days, % complete)
        const weekTrend = [
          {
            day: "Mon",
            rate: 0.86,
          },
          {
            day: "Tue",
            rate: 1.0,
          },
          {
            day: "Wed",
            rate: 0.71,
          },
          {
            day: "Thu",
            rate: 0.86,
          },
          {
            day: "Fri",
            rate: 0.57,
          },
          {
            day: "Sat",
            rate: 1.0,
          },
          {
            day: "Sun",
            rate: 0.71,
          },
        ]

        // Yearly heatmap — 53 weeks x 7 days of completion rate (deterministic-ish)
        const year = Array.from(
          {
            length: 53,
          },
          (_, w) =>
            Array.from(
              {
                length: 7,
              },
              (_, d) => {
                const seed = w * 7 + d
                const r = ((seed * 53) % 100) / 100
                // create some empty + some perfect runs
                const v = seed % 11 === 0 ? 0 : Math.min(1, 0.25 + r * 0.85)
                return {
                  rate: w > 50 && d > 3 ? null : v,
                } // future days empty
              }
            )
        )

        // Calendar month — status per day for the current month
        const month = Array.from(
          {
            length: 30,
          },
          (_, i) => {
            const day = i + 1
            const r = ((day * 37) % 100) / 100
            let status = "mixed"
            if (day > 20) status = day === 21 ? "today" : "future"
            else if (r > 0.8) status = "perfect"
            else if (r < 0.18) status = "missed"
            return {
              day,
              status,
              rate: r,
            }
          }
        )
        const metrics = {
          daily: {
            completion: 71,
            missed: 1,
            avgDelay: 6,
            best: "Vitamins",
            worst: "Deep work",
          },
          weekly: {
            completion: 82,
            missed: 4,
            avgDelay: 7,
            stability: 86,
            variation: 11,
          },
          monthly: {
            completion: 84,
            missed: 14,
            avgDelay: 8,
            topRoutine: "Vitamins",
          },
          yearly: {
            discipline: 86,
            completion: 81,
            drift: "+3",
            activeDays: 312,
          },
        }
        return {
          user,
          today,
          routines,
          weekTrend,
          year,
          month,
          metrics,
        }
      })()
    })()
  } catch (e) {
    __ds_ns.__errors.push({
      path: "ui_kits/mobile/data.js",
      error: String((e && e.message) || e),
    })
  }

  // ui_kits/mobile/home.jsx
  try {
    ;(() => {
      // HomeScreen — today's occurrences with Complete / Skip. The app's core loop.
      ;(function () {
        const { OccurrenceRow, ProgressRing, StreakChip, Card } =
          window.RoutineFlowDesignSystem_4781a2
        function SummaryStrip({ occ }) {
          const done = occ.filter((o) => o.status === "Completed").length
          const total = occ.length
          const pct = Math.round((done / total) * 100)
          return /*#__PURE__*/ React.createElement(
            Card,
            {
              padding: "md",
              style: {
                display: "flex",
                alignItems: "center",
                gap: 18,
                marginBottom: 20,
              },
            },
            /*#__PURE__*/ React.createElement(ProgressRing, {
              value: pct,
              size: 76,
              thickness: 7,
              centerLabel: pct + "%",
            }),
            /*#__PURE__*/ React.createElement(
              "div",
              {
                style: {
                  flex: 1,
                },
              },
              /*#__PURE__*/ React.createElement(
                "div",
                {
                  style: {
                    fontFamily: "var(--font-display)",
                    fontSize: "var(--text-lg)",
                    fontWeight: 700,
                    letterSpacing: "-0.02em",
                  },
                },
                done,
                " of ",
                total,
                " done"
              ),
              /*#__PURE__*/ React.createElement(
                "div",
                {
                  style: {
                    color: "var(--text-secondary)",
                    fontSize: "var(--text-sm)",
                    marginTop: 2,
                  },
                },
                total - done,
                " still pending today"
              ),
              /*#__PURE__*/ React.createElement(
                "div",
                {
                  style: {
                    marginTop: 10,
                  },
                },
                /*#__PURE__*/ React.createElement(StreakChip, {
                  days: 28,
                  best: 31,
                  size: "sm",
                })
              )
            )
          )
        }
        function Section({ label, children }) {
          return /*#__PURE__*/ React.createElement(
            "div",
            {
              style: {
                marginBottom: 18,
              },
            },
            /*#__PURE__*/ React.createElement(
              "div",
              {
                style: {
                  fontFamily: "var(--font-mono)",
                  fontSize: "var(--text-2xs)",
                  textTransform: "uppercase",
                  letterSpacing: "var(--tracking-caps)",
                  color: "var(--text-muted)",
                  margin: "0 0 10px 2px",
                },
              },
              label
            ),
            /*#__PURE__*/ React.createElement(
              "div",
              {
                style: {
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                },
              },
              children
            )
          )
        }
        function HomeScreen() {
          const [occ, setOcc] = React.useState(window.RF_DATA.today)
          const setStatus = (id, status, delay = null) =>
            setOcc((list) =>
              list.map((o) =>
                o.id === id
                  ? {
                      ...o,
                      status,
                      delay,
                    }
                  : o
              )
            )
          const morning = occ.filter((o) => o.time < "12:00")
          const afternoon = occ.filter((o) => o.time >= "12:00")
          const renderRow = (o) =>
            /*#__PURE__*/ React.createElement(OccurrenceRow, {
              key: o.id,
              time: o.time,
              title: o.title,
              category: o.category,
              status: o.status,
              delay: o.delay,
              onComplete: () => setStatus(o.id, "Completed", 2),
              onSkip: () => setStatus(o.id, "Skipped"),
            })
          return /*#__PURE__*/ React.createElement(
            "div",
            {
              style: {
                padding: "0 20px 24px",
              },
            },
            /*#__PURE__*/ React.createElement(
              "header",
              {
                style: {
                  display: "flex",
                  alignItems: "flex-end",
                  justifyContent: "space-between",
                  padding: "8px 0 18px",
                },
              },
              /*#__PURE__*/ React.createElement(
                "div",
                null,
                /*#__PURE__*/ React.createElement(
                  "div",
                  {
                    style: {
                      fontFamily: "var(--font-mono)",
                      fontSize: "var(--text-2xs)",
                      textTransform: "uppercase",
                      letterSpacing: "var(--tracking-caps)",
                      color: "var(--text-muted)",
                    },
                  },
                  "Saturday \xB7 21 June"
                ),
                /*#__PURE__*/ React.createElement(
                  "h1",
                  {
                    style: {
                      fontFamily: "var(--font-display)",
                      fontSize: "var(--text-3xl)",
                      fontWeight: 700,
                      letterSpacing: "-0.02em",
                      margin: "4px 0 0",
                    },
                  },
                  "Today"
                )
              )
            ),
            /*#__PURE__*/ React.createElement(SummaryStrip, {
              occ: occ,
            }),
            /*#__PURE__*/ React.createElement(
              Section,
              {
                label: "Morning",
              },
              morning.map(renderRow)
            ),
            /*#__PURE__*/ React.createElement(
              Section,
              {
                label: "Afternoon & evening",
              },
              afternoon.map(renderRow)
            )
          )
        }
        window.HomeScreen = HomeScreen
      })()
    })()
  } catch (e) {
    __ds_ns.__errors.push({
      path: "ui_kits/mobile/home.jsx",
      error: String((e && e.message) || e),
    })
  }

  // ui_kits/mobile/settings.jsx
  try {
    ;(() => {
      // SettingsScreen — timezone, reminders, profile. Mirrors user_settings.
      ;(function () {
        const { Card, Avatar, Select, Switch, Button, Badge } =
          window.RoutineFlowDesignSystem_4781a2
        function Row({ label, sub, control, last }) {
          return /*#__PURE__*/ React.createElement(
            "div",
            {
              style: {
                display: "flex",
                alignItems: "center",
                gap: 14,
                padding: "14px 0",
                borderBottom: last ? "none" : "1px solid var(--border-subtle)",
              },
            },
            /*#__PURE__*/ React.createElement(
              "div",
              {
                style: {
                  flex: 1,
                },
              },
              /*#__PURE__*/ React.createElement(
                "div",
                {
                  style: {
                    fontSize: "var(--text-md)",
                    fontWeight: 500,
                  },
                },
                label
              ),
              sub &&
                /*#__PURE__*/ React.createElement(
                  "div",
                  {
                    style: {
                      fontSize: "var(--text-xs)",
                      color: "var(--text-muted)",
                      marginTop: 2,
                    },
                  },
                  sub
                )
            ),
            /*#__PURE__*/ React.createElement(
              "div",
              {
                style: {
                  flex: "none",
                },
              },
              control
            )
          )
        }
        function GroupLabel({ children }) {
          return /*#__PURE__*/ React.createElement(
            "div",
            {
              style: {
                fontFamily: "var(--font-mono)",
                fontSize: "var(--text-2xs)",
                textTransform: "uppercase",
                letterSpacing: "var(--tracking-caps)",
                color: "var(--text-muted)",
                margin: "20px 2px 8px",
              },
            },
            children
          )
        }
        function SettingsScreen() {
          const U = window.RF_DATA.user
          const [useGlobal, setUseGlobal] = React.useState(true)
          const [notif, setNotif] = React.useState(true)
          const [skipBreaks, setSkipBreaks] = React.useState(false)
          return /*#__PURE__*/ React.createElement(
            "div",
            {
              style: {
                padding: "0 20px 24px",
              },
            },
            /*#__PURE__*/ React.createElement(
              "header",
              {
                style: {
                  padding: "8px 0 8px",
                },
              },
              /*#__PURE__*/ React.createElement(
                "h1",
                {
                  style: {
                    fontFamily: "var(--font-display)",
                    fontSize: "var(--text-3xl)",
                    fontWeight: 700,
                    letterSpacing: "-0.02em",
                    margin: 0,
                  },
                },
                "Settings"
              )
            ),
            /*#__PURE__*/ React.createElement(
              Card,
              {
                padding: "md",
                style: {
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  marginTop: 8,
                },
              },
              /*#__PURE__*/ React.createElement(Avatar, {
                name: U.name,
                size: 48,
              }),
              /*#__PURE__*/ React.createElement(
                "div",
                {
                  style: {
                    flex: 1,
                  },
                },
                /*#__PURE__*/ React.createElement(
                  "div",
                  {
                    style: {
                      fontFamily: "var(--font-display)",
                      fontSize: "var(--text-lg)",
                      fontWeight: 600,
                    },
                  },
                  U.name
                ),
                /*#__PURE__*/ React.createElement(
                  "div",
                  {
                    style: {
                      fontSize: "var(--text-sm)",
                      color: "var(--text-secondary)",
                    },
                  },
                  U.email
                )
              ),
              /*#__PURE__*/ React.createElement(
                Badge,
                {
                  tone: "signal",
                  mono: true,
                },
                "PRO"
              )
            ),
            /*#__PURE__*/ React.createElement(GroupLabel, null, "Time"),
            /*#__PURE__*/ React.createElement(
              Card,
              {
                padding: "md",
              },
              /*#__PURE__*/ React.createElement(Row, {
                label: "Timezone",
                sub: "All scheduling is interpreted here",
                control: /*#__PURE__*/ React.createElement(Select, {
                  fullWidth: false,
                  defaultValue: "Asia/Dhaka",
                  options: [
                    "Asia/Dhaka",
                    "Europe/London",
                    "America/New_York",
                    "Asia/Dubai",
                  ],
                  style: {
                    width: 168,
                  },
                }),
                last: true,
              })
            ),
            /*#__PURE__*/ React.createElement(GroupLabel, null, "Reminders"),
            /*#__PURE__*/ React.createElement(
              Card,
              {
                padding: "md",
              },
              /*#__PURE__*/ React.createElement(Row, {
                label: "Notifications",
                sub: "Fire even when the app is closed",
                control: /*#__PURE__*/ React.createElement(Switch, {
                  checked: notif,
                  onChange: setNotif,
                  ariaLabel: "Notifications",
                }),
              }),
              /*#__PURE__*/ React.createElement(Row, {
                label: "Use global reminder",
                sub: "Apply one offset to every routine",
                control: /*#__PURE__*/ React.createElement(Switch, {
                  checked: useGlobal,
                  onChange: setUseGlobal,
                  ariaLabel: "Use global reminder",
                }),
              }),
              /*#__PURE__*/ React.createElement(Row, {
                label: "Reminder offset",
                sub: "Minutes before scheduled time",
                control: /*#__PURE__*/ React.createElement(Select, {
                  fullWidth: false,
                  defaultValue: "15",
                  options: [
                    {
                      value: "5",
                      label: "5 min",
                    },
                    {
                      value: "10",
                      label: "10 min",
                    },
                    {
                      value: "15",
                      label: "15 min",
                    },
                    {
                      value: "30",
                      label: "30 min",
                    },
                  ],
                  style: {
                    width: 120,
                  },
                }),
                last: true,
              })
            ),
            /*#__PURE__*/ React.createElement(GroupLabel, null, "Streaks"),
            /*#__PURE__*/ React.createElement(
              Card,
              {
                padding: "md",
              },
              /*#__PURE__*/ React.createElement(Row, {
                label: "Skip breaks streak",
                sub: "Off \u2014 a skip pauses, it won't reset",
                control: /*#__PURE__*/ React.createElement(Switch, {
                  checked: skipBreaks,
                  onChange: setSkipBreaks,
                  ariaLabel: "Skip breaks streak",
                }),
                last: true,
              })
            ),
            /*#__PURE__*/ React.createElement(
              "div",
              {
                style: {
                  marginTop: 22,
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                },
              },
              /*#__PURE__*/ React.createElement(
                Button,
                {
                  variant: "secondary",
                  fullWidth: true,
                },
                "Export data (.xlsx)"
              ),
              /*#__PURE__*/ React.createElement(
                Button,
                {
                  variant: "ghost",
                  fullWidth: true,
                  style: {
                    color: "var(--missed-600)",
                  },
                },
                "Sign out"
              )
            )
          )
        }
        window.SettingsScreen = SettingsScreen
      })()
    })()
  } catch (e) {
    __ds_ns.__errors.push({
      path: "ui_kits/mobile/settings.jsx",
      error: String((e && e.message) || e),
    })
  }

  // ui_kits/web/dashboard.jsx
  try {
    ;(() => {
      // RoutineFlow web dashboard — chart + logs table pieces.
      ;(function () {
        const { Card, StatusPill, MetricTile, ProgressRing, HeatmapCell } =
          window.RoutineFlowDesignSystem_4781a2
        function TrendChart({ data }) {
          const max = 1
          return /*#__PURE__*/ React.createElement(
            Card,
            {
              padding: "lg",
            },
            /*#__PURE__*/ React.createElement(
              "div",
              {
                style: {
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "baseline",
                  marginBottom: 20,
                },
              },
              /*#__PURE__*/ React.createElement(
                "div",
                {
                  style: {
                    fontFamily: "var(--font-display)",
                    fontSize: "var(--text-xl)",
                    fontWeight: 600,
                  },
                },
                "Completion trend"
              ),
              /*#__PURE__*/ React.createElement(
                "div",
                {
                  style: {
                    fontFamily: "var(--font-mono)",
                    fontSize: "var(--text-xs)",
                    color: "var(--text-muted)",
                  },
                },
                "last 7 days \xB7 %"
              )
            ),
            /*#__PURE__*/ React.createElement(
              "div",
              {
                style: {
                  display: "flex",
                  alignItems: "flex-end",
                  gap: 18,
                  height: 200,
                },
              },
              data.map((d, i) =>
                /*#__PURE__*/ React.createElement(
                  "div",
                  {
                    key: i,
                    style: {
                      flex: 1,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 8,
                      height: "100%",
                      justifyContent: "flex-end",
                    },
                  },
                  /*#__PURE__*/ React.createElement(
                    "div",
                    {
                      style: {
                        fontFamily: "var(--font-mono)",
                        fontSize: "var(--text-xs)",
                        color: "var(--text-secondary)",
                      },
                    },
                    Math.round(d.rate * 100)
                  ),
                  /*#__PURE__*/ React.createElement("div", {
                    style: {
                      width: "100%",
                      maxWidth: 56,
                      height: (d.rate / max) * 150 + "px",
                      minHeight: 6,
                      background:
                        d.rate >= 0.85
                          ? "var(--completed-600)"
                          : d.rate >= 0.6
                            ? "var(--ramp-3)"
                            : "var(--skipped-500)",
                      borderRadius: "var(--radius-md) var(--radius-md) 4px 4px",
                      transition: "height var(--duration-slow) var(--ease-out)",
                    },
                  }),
                  /*#__PURE__*/ React.createElement(
                    "div",
                    {
                      style: {
                        fontFamily: "var(--font-mono)",
                        fontSize: "var(--text-xs)",
                        color: "var(--text-faint)",
                      },
                    },
                    d.day
                  )
                )
              )
            )
          )
        }
        function DisciplinePanel({ m }) {
          return /*#__PURE__*/ React.createElement(
            Card,
            {
              padding: "lg",
              style: {
                display: "flex",
                flexDirection: "column",
                gap: 18,
              },
            },
            /*#__PURE__*/ React.createElement(
              "div",
              {
                style: {
                  fontFamily: "var(--font-display)",
                  fontSize: "var(--text-xl)",
                  fontWeight: 600,
                },
              },
              "Discipline score"
            ),
            /*#__PURE__*/ React.createElement(
              "div",
              {
                style: {
                  display: "flex",
                  alignItems: "center",
                  gap: 22,
                },
              },
              /*#__PURE__*/ React.createElement(ProgressRing, {
                value: m.discipline,
                size: 120,
                thickness: 10,
              }),
              /*#__PURE__*/ React.createElement(
                "div",
                {
                  style: {
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    gap: 10,
                  },
                },
                /*#__PURE__*/ React.createElement(Factor, {
                  label: "Completion rate",
                  weight: "40%",
                  val: 0.86,
                }),
                /*#__PURE__*/ React.createElement(Factor, {
                  label: "Consistency",
                  weight: "30%",
                  val: 0.81,
                }),
                /*#__PURE__*/ React.createElement(Factor, {
                  label: "Delay penalty",
                  weight: "20%",
                  val: 0.74,
                }),
                /*#__PURE__*/ React.createElement(Factor, {
                  label: "Streak bonus",
                  weight: "10%",
                  val: 0.9,
                })
              )
            )
          )
        }
        function Factor({ label, weight, val }) {
          return /*#__PURE__*/ React.createElement(
            "div",
            {
              style: {
                display: "flex",
                alignItems: "center",
                gap: 10,
              },
            },
            /*#__PURE__*/ React.createElement(
              "span",
              {
                style: {
                  width: 120,
                  fontSize: "var(--text-sm)",
                  color: "var(--text-secondary)",
                },
              },
              label
            ),
            /*#__PURE__*/ React.createElement(
              "div",
              {
                style: {
                  flex: 1,
                  height: 6,
                  background: "var(--surface-sunken)",
                  borderRadius: "var(--radius-pill)",
                  overflow: "hidden",
                },
              },
              /*#__PURE__*/ React.createElement("div", {
                style: {
                  width: val * 100 + "%",
                  height: "100%",
                  background: "var(--interactive)",
                  borderRadius: "var(--radius-pill)",
                },
              })
            ),
            /*#__PURE__*/ React.createElement(
              "span",
              {
                style: {
                  fontFamily: "var(--font-mono)",
                  fontSize: "var(--text-2xs)",
                  color: "var(--text-faint)",
                  width: 30,
                  textAlign: "right",
                },
              },
              weight
            )
          )
        }
        const LOGS = [
          {
            date: "2026-06-21",
            routine: "Morning Gym",
            sched: "07:00",
            done: "07:04",
            delay: 4,
            status: "Completed",
          },
          {
            date: "2026-06-21",
            routine: "Vitamins",
            sched: "08:15",
            done: "08:15",
            delay: 0,
            status: "Completed",
          },
          {
            date: "2026-06-21",
            routine: "Deep work block",
            sched: "09:30",
            done: null,
            delay: null,
            status: "Missed",
          },
          {
            date: "2026-06-21",
            routine: "Read 20 minutes",
            sched: "22:30",
            done: null,
            delay: null,
            status: "Skipped",
          },
          {
            date: "2026-06-20",
            routine: "Morning Gym",
            sched: "07:00",
            done: "06:58",
            delay: -2,
            status: "Completed",
          },
          {
            date: "2026-06-20",
            routine: "Language practice",
            sched: "18:00",
            done: "18:41",
            delay: 41,
            status: "Completed",
          },
        ]
        function LogsTable() {
          const cols = [
            "Date",
            "Routine",
            "Scheduled",
            "Completed",
            "Delay",
            "Status",
            "Timezone",
          ]
          return /*#__PURE__*/ React.createElement(
            Card,
            {
              padding: "none",
              style: {
                overflow: "hidden",
              },
            },
            /*#__PURE__*/ React.createElement(
              "div",
              {
                style: {
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "20px 24px",
                  borderBottom: "1px solid var(--border-subtle)",
                },
              },
              /*#__PURE__*/ React.createElement(
                "div",
                {
                  style: {
                    fontFamily: "var(--font-display)",
                    fontSize: "var(--text-xl)",
                    fontWeight: 600,
                  },
                },
                "routine_logs"
              ),
              /*#__PURE__*/ React.createElement(
                "div",
                {
                  style: {
                    fontFamily: "var(--font-mono)",
                    fontSize: "var(--text-2xs)",
                    color: "var(--text-muted)",
                  },
                },
                "source of truth \xB7 all times Asia/Dhaka"
              )
            ),
            /*#__PURE__*/ React.createElement(
              "table",
              {
                style: {
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: "var(--text-sm)",
                },
              },
              /*#__PURE__*/ React.createElement(
                "thead",
                null,
                /*#__PURE__*/ React.createElement(
                  "tr",
                  null,
                  cols.map((c) =>
                    /*#__PURE__*/ React.createElement(
                      "th",
                      {
                        key: c,
                        style: {
                          textAlign:
                            c === "Routine" || c === "Date" ? "left" : "left",
                          padding: "12px 24px",
                          fontFamily: "var(--font-mono)",
                          fontSize: "var(--text-2xs)",
                          textTransform: "uppercase",
                          letterSpacing: "var(--tracking-caps)",
                          color: "var(--text-muted)",
                          fontWeight: 600,
                          borderBottom: "1px solid var(--border-subtle)",
                        },
                      },
                      c
                    )
                  )
                )
              ),
              /*#__PURE__*/ React.createElement(
                "tbody",
                null,
                LOGS.map((l, i) =>
                  /*#__PURE__*/ React.createElement(
                    "tr",
                    {
                      key: i,
                      style: {
                        borderBottom:
                          i < LOGS.length - 1
                            ? "1px solid var(--border-subtle)"
                            : "none",
                      },
                    },
                    /*#__PURE__*/ React.createElement(
                      "td",
                      {
                        style: cell("mono", "var(--text-secondary)"),
                      },
                      l.date
                    ),
                    /*#__PURE__*/ React.createElement(
                      "td",
                      {
                        style: cell("text", "var(--text-primary)", 600),
                      },
                      l.routine
                    ),
                    /*#__PURE__*/ React.createElement(
                      "td",
                      {
                        style: cell("mono"),
                      },
                      l.sched
                    ),
                    /*#__PURE__*/ React.createElement(
                      "td",
                      {
                        style: cell("mono"),
                      },
                      l.done || "—"
                    ),
                    /*#__PURE__*/ React.createElement(
                      "td",
                      {
                        style: {
                          ...cell("mono"),
                          color:
                            l.delay == null
                              ? "var(--text-faint)"
                              : l.delay > 0
                                ? "var(--missed-600)"
                                : l.delay < 0
                                  ? "var(--completed-600)"
                                  : "var(--text-secondary)",
                        },
                      },
                      l.delay == null
                        ? "—"
                        : (l.delay > 0 ? "+" : "") + l.delay + "m"
                    ),
                    /*#__PURE__*/ React.createElement(
                      "td",
                      {
                        style: {
                          padding: "12px 24px",
                        },
                      },
                      /*#__PURE__*/ React.createElement(StatusPill, {
                        status: l.status,
                      })
                    ),
                    /*#__PURE__*/ React.createElement(
                      "td",
                      {
                        style: cell("mono", "var(--text-faint)"),
                      },
                      "Asia/Dhaka"
                    )
                  )
                )
              )
            )
          )
        }
        function cell(font, color = "var(--text-secondary)", weight = 400) {
          return {
            padding: "12px 24px",
            fontFamily:
              font === "mono" ? "var(--font-mono)" : "var(--font-text)",
            color,
            fontWeight: weight,
            whiteSpace: "nowrap",
          }
        }
        Object.assign(window, {
          RFTrendChart: TrendChart,
          RFDisciplinePanel: DisciplinePanel,
          RFLogsTable: LogsTable,
        })
      })()
    })()
  } catch (e) {
    __ds_ns.__errors.push({
      path: "ui_kits/web/dashboard.jsx",
      error: String((e && e.message) || e),
    })
  }

  __ds_ns.Avatar = __ds_scope.Avatar

  __ds_ns.Badge = __ds_scope.Badge

  __ds_ns.Card = __ds_scope.Card

  __ds_ns.Tabs = __ds_scope.Tabs

  __ds_ns.HeatmapCell = __ds_scope.HeatmapCell

  __ds_ns.MetricTile = __ds_scope.MetricTile

  __ds_ns.ProgressRing = __ds_scope.ProgressRing

  __ds_ns.StatusPill = __ds_scope.StatusPill

  __ds_ns.StreakChip = __ds_scope.StreakChip

  __ds_ns.OccurrenceRow = __ds_scope.OccurrenceRow

  __ds_ns.Button = __ds_scope.Button

  __ds_ns.Checkbox = __ds_scope.Checkbox

  __ds_ns.IconButton = __ds_scope.IconButton

  __ds_ns.Input = __ds_scope.Input

  __ds_ns.Select = __ds_scope.Select

  __ds_ns.Switch = __ds_scope.Switch
})()
