---
name: routineflow-design
description: Use this skill to generate well-branded interfaces and assets for RoutineFlow, either for production or throwaway prototypes/mocks/etc. Contains essential design guidelines, colors, type, fonts, assets, and UI kit components for prototyping.
user-invocable: true
---

Read the `readme.md` file within this skill, and explore the other available files.

RoutineFlow is a cross-platform **routine execution tracking system** — a
behavioral measurement system, not a to-do app. Its visual language is precise,
calm, and instrument-grade: warm-paper neutrals, ink type, one cobalt "Signal"
accent, monospace for all measured numbers, and a strict four-state status family
(Completed / Pending / Missed / Skipped).

## What's here

- `styles.css` + `tokens/` — the global stylesheet and design tokens (colors,
  typography, spacing, radius, motion). Link `styles.css` to inherit everything.
- `components/` — React primitives, bundled to `window.RoutineFlowDesignSystem_4781a2`.
  Forms (Button, IconButton, Input, Select, Switch, Checkbox), core (Card, Badge,
  Tabs, Avatar), data (StatusPill, MetricTile, ProgressRing, StreakChip,
  HeatmapCell), domain (OccurrenceRow). Each has a `.prompt.md` with usage.
- `guidelines/` — foundation specimen cards.
- `ui_kits/mobile/` + `ui_kits/web/` — full interactive recreations of the two products.
- `assets/` — `mark.svg`, `wordmark.svg`. Icons: Lucide (CDN).

## How to work

If creating visual artifacts (slides, mocks, throwaway prototypes), copy assets
out and create static HTML files for the user to view. If working on production
code, copy assets and read the rules here to become an expert in designing with
this brand.

If the user invokes this skill without other guidance, ask what they want to
build, ask a few questions, and act as an expert designer who outputs HTML
artifacts _or_ production code, depending on the need.

## Brand rules of thumb

- Sentence case everywhere; the only uppercase is mono micro-labels (eyebrows).
- Address the user as **you**; the system is **the server**. No emoji, no hype.
- Numbers are first-class and always mono. Status is a capitalized noun.
- One accent (Signal) for interactive intent only — never decorative.
- Hairline-first cards (1px border, no shadow); tight low shadows for floats.
- Calm motion: standard easing, no bounce; press = scale 0.97 (shrink).
