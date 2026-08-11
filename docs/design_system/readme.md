# RoutineFlow — Design System

> Discipline, measured. RoutineFlow is a cross-platform **routine execution
> tracking system** — not a to-do app, but a _behavioral measurement system_.
> Every routine generates daily occurrences; every occurrence produces a log;
> all analytics derive from logs only. This design system gives that idea a
> visual language: precise, calm, instrument-grade.

---

## 1. Product context

RoutineFlow records scheduled behaviors, captures real execution times, and
produces structured behavioral analytics. The product surfaces are:

- **Mobile app (primary)** — iOS + Android (React Native + Expo). Home (today's
  occurrences with Complete / Skip), Calendar, Analytics, Routine CRUD, Settings.
- **Web app (secondary)** — Next.js analytics + management dashboard. Historical
  analysis, export tools, settings.

The conceptual spine (drives every visual decision):

- **Four occurrence states** — `Completed · Pending · Missed · Skipped`. These
  are the most important semantic colors in the system.
- **Time is the medium** — scheduled local times, UTC completion timestamps,
  delay in minutes, timezone snapshots per log. All of this is rendered in
  **monospace** with tabular numerics.
- **`routine_logs` is the single source of truth** — streaks, discipline score,
  heatmaps, and exports are all _computed_, never stored. The UI reflects that
  honesty: it shows measured data, not motivational fluff.

### Sources

There was **no attached codebase, Figma file, or existing brand**. The only
input was the RoutineFlow Business Requirements Document (BRD v1.1). This design
system is therefore an **original brand direction** derived from that spec —
see CAVEATS at the end. If a real brand/codebase exists, re-attach it and this
system should be reconciled against it.

---

## 2. Content fundamentals — how RoutineFlow writes

**Voice: a precise instrument, not a cheerleader.** The product measures; it
does not nag or congratulate. Copy is calm, factual, and quietly confident.

- **Person.** Address the user as **you**; the system refers to itself as **the
  server / RoutineFlow**, never "we". Example: _"You only ever complete or skip
  — the analytics build themselves."_
- **Casing.** Sentence case everywhere (buttons, headings, labels). The only
  uppercase is the **mono micro-label** (`SCHEDULED · LOCAL`, `DISCIPLINE`) used
  as eyebrows on metrics — tracked out at `--tracking-caps`.
- **Numbers are first-class.** Prefer a measured number to an adjective: "+4m
  late", "86 discipline", "28d streak", "3 missed this week". Never "great job!"
- **Status words are capitalized nouns** — Completed, Pending, Missed, Skipped —
  because they are system states, not moods.
- **Tone words to use:** measured, recorded, generated, consistency, delay,
  occurrence, log, on time. **Avoid:** crush it, smash your goals, you're on
  fire, gamified hype, exclamation marks.
- **No emoji.** Status is communicated by the four-state color+glyph system, not
  by 🔥/✅. (The streak flame is a drawn glyph inside `StreakChip`, not an emoji.)
- **Microcopy examples.**
  - Empty state: _"No occurrences today. Your next routine generates at 23:00."_
  - Missed: _"Marked missed at end of day (00:05 Asia/Dhaka)."_
  - Skip confirm: _"Skip logged. Your streak pauses — it won't break."_

---

## 3. Visual foundations

**Overall vibe.** Instrument-grade. Warm-paper ground, ink type, one confident
accent, crisp hairlines, tight low shadows. It should feel like a precise
measuring tool — closer to a lab instrument or a well-set table of figures than
a playful habit tracker.

### Color

- **Warm paper neutrals**, not cold grays — app background `--paper-50 #FAF9F6`,
  white cards, `--paper-200` hairlines. This warmth is deliberate and ownable.
- **Ink** `--ink-900 #16181D` for primary text and the wordmark (a warm near-black).
- **One accent — "Signal"** `--signal-500 #3E63FF`, a cobalt-azure used _only_
  for interactive intent: primary buttons, links, focus rings, active tab
  underline, the discipline ring. Never decorative.
- **The status family is sacred:** Completed = green `#1F9D5B`, Pending = slate,
  Missed = red `#E5484D`, Skipped = amber `#E8A13A`. Each pairs a 600 foreground
  with a 100 tint background. Use `StatusPill` — don't hand-roll status colors.
- **Discipline ramp** — a 5-step green ramp (`--ramp-0…4`) for the yearly heatmap.
- No purple/indigo gradients, no neon, no dark mode in V1.

### Type

- **Display — Space Grotesk** (700/600): screen titles, card titles, big metric
  numerics. Tracked tight (`-0.02em`).
- **Text — IBM Plex Sans** (400–600): all UI and body.
- **Mono — IBM Plex Mono** (400–500): the "measurement DNA" — every time, delay,
  timestamp, count, timezone, and micro-label. If it's a number that was
  _measured_, it's mono. Tabular by default.
- Minimum UI size 11px (mono micro-labels only); base body 15px.

### Spacing & layout

- **4px base grid.** Tight, measured rhythm (`--space-*`). Mobile side gutter 20px,
  web 32px.
- Cards group related figures; whitespace separates concerns. Dense but never cramped.

### Shape, border, elevation

- **Corner radius:** inputs/buttons 10px (`--radius-md`), cards 14px
  (`--radius-lg`), sheets 20px, pills full.
- **Hairline-first.** The default card is a flat white panel with a **1px
  `--paper-200` inset border** (`--ring-hairline`) and _no_ shadow. Elevation is
  reserved for things that truly float (menus, sheets, hover) and is **tight and
  low-spread** — `--shadow-sm/md/lg` lift only a few px with soft, slightly cool
  umbra. No big diffuse glows.
- **No colored left-border-accent cards** except the deliberate category accent
  bar on `OccurrenceRow` (a 4px pill, not a border).

### Motion

- **Calm and precise. No bounce, no overshoot.** Standard easing
  `cubic-bezier(.2,0,0,1)`; durations 140/220/320ms. Entrances are short fades
  or 1px lifts; the discipline ring sweeps in on the slow ease-out.
- **Hover** = card lifts `-1px` + shadow steps up; ghost/secondary surfaces go to
  `--surface-sunken`. **Press** = scale `0.97` (shrink, never grow).

### Imagery & transparency

- Minimal photography. The "imagery" of RoutineFlow is **its own data**:
  heatmaps, rings, status pills, delay numerics. Lean on data viz over stock photos.
- Transparency/blur used sparingly — only for modal scrims (ink at ~40%). No
  glassmorphism on content surfaces.

---

## 4. Iconography

- **Lucide** (https://lucide.dev) is the icon system — its 1.8–2px rounded-stroke
  geometry matches the precise, calm tone. Linked from CDN in the UI kits
  (`<script src="https://unpkg.com/lucide@latest">` + `lucide.createIcons()`),
  used inline as `<i data-lucide="check"></i>`.
- A few **status glyphs are drawn into components** (check / hollow-dot / cross /
  pause-bars inside `StatusPill`, the streak flame inside `StreakChip`) so status
  reads without color alone and never depends on an icon-font load.
- **No emoji, no unicode dingbats** as icons. Common icons: `check`, `x`,
  `skip-forward`, `clock`, `calendar`, `flame`, `bar-chart-3`, `settings`, `plus`,
  `bell`, `chevron-right`, `download`, `globe` (timezone).
- _Substitution flag:_ Lucide is a substitute chosen for fit, not an inherited
  brand asset (there was no source icon set).

---

## 5. Index / manifest

**Root**

- `styles.css` — the one file consumers link (imports-only).
- `tokens/` — `fonts.css`, `colors.css`, `typography.css`, `spacing.css`,
  `radius.css`, `motion.css`.
- `assets/` — `mark.svg` (app mark), `wordmark.svg` (logo lockup).
- `readme.md` (this file), `SKILL.md` (portable Agent Skill).

**Components** (`window.RoutineFlowDesignSystem_4781a2.*`)

- `components/forms/` — Button, IconButton, Input, Select, Switch, Checkbox
- `components/core/` — Card, Badge, Tabs, Avatar
- `components/data/` — StatusPill, MetricTile, ProgressRing, StreakChip, HeatmapCell
- `components/domain/` — OccurrenceRow

**Foundation cards** (`guidelines/`) — Colors, Type, Spacing, Brand specimens
shown in the Design System tab.

**UI kits**

- `ui_kits/mobile/` — the primary app: Home, Calendar, Analytics, Settings,
  interactive `index.html` in an iPhone frame.
- `ui_kits/web/` — the secondary analytics dashboard.

---

## 6. Caveats

- **Original brand.** No codebase, Figma, or brand assets were provided — colors,
  type pairing, logo, and voice were derived from the BRD. Treat as a v1 proposal.
- **Fonts are CDN-linked** (Google Fonts) since no binaries were supplied. To
  self-host, replace the `@import` in `tokens/fonts.css` with local `@font-face`.
- **Lucide** icons are a fit-based substitution, not an inherited set.
