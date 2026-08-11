import { describe, expect, it } from "vitest"

import { categoryBreakdown } from "@/components/pages/insights-page"
import type { LogEntry, Routine } from "@/lib/types"

const baseLog: LogEntry = {
  id: "base",
  date: "2026-08-11",
  eventTime: "7:00 AM",
  title: "Morning walk",
  category: "Movement",
  scheduled: "7:00 AM",
  actual: "7:00 AM",
  variance: "On time",
  status: "completed",
  recordedAt: "2026-08-11T01:00:00.000Z",
  actor: "User",
  source: "Routempo",
  timezone: "UTC",
  snapshot: "",
}

const baseRoutine: Routine = {
  id: "walk",
  title: "Morning walk",
  startDate: "2026-08-11",
  time: "7:00 AM",
  repeat: "daily",
  category: "Movement",
  note: "",
  status: "pending",
  enabled: true,
}

describe("category breakdown", () => {
  it("combines routine outcomes within each category", () => {
    const logs: LogEntry[] = [
      baseLog,
      {
        ...baseLog,
        id: "stretch",
        title: "Stretch",
        status: "skipped",
      },
      {
        ...baseLog,
        id: "study",
        title: "Study",
        category: "Learning",
      },
    ]

    const routines: Routine[] = [
      baseRoutine,
      { ...baseRoutine, id: "stretch", title: "Stretch" },
      {
        ...baseRoutine,
        id: "study",
        title: "Study",
        category: "Learning",
      },
    ]

    expect(
      categoryBreakdown(
        routines,
        logs,
        1,
        "UTC",
        new Date("2026-08-11T12:00:00.000Z")
      )
    ).toEqual([
      { name: "Movement", completed: 1, total: 2, rate: 50 },
      { name: "Learning", completed: 1, total: 1, rate: 100 },
    ])
  })
})
