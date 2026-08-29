import { describe, expect, it } from "vitest"

import { resolveOccurrenceWindow } from "./occurrences"

const routine = {
  id: "morning-walk",
  title: "Morning walk",
  category: "Personal",
  time: "07:30",
  startDate: "2026-08-10",
  repeat: "daily" as const,
  status: "pending" as const,
  note: "",
  enabled: true,
}

describe("occurrence window", () => {
  it("identifies unresolved past occurrences that must be finalized", () => {
    const result = resolveOccurrenceWindow(
      [routine],
      [],
      "UTC",
      "2026-08-11",
      "2026-08-13",
      "2026-08-13"
    )

    expect(result.toFinalize.map((item) => item.date)).toEqual([
      "2026-08-11",
      "2026-08-12",
    ])
    expect(result.occurrences.map((item) => item.status)).toEqual([
      "missed",
      "missed",
      "pending",
    ])
  })
})
