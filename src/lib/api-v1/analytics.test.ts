import { describe, expect, it } from "vitest"

import { buildAnalytics } from "./analytics"

describe("mobile analytics response", () => {
  it("returns every requested day and current category routine counts", () => {
    const result = buildAnalytics(
      [
        {
          date: "2026-08-12",
          category: "Prayer",
          status: "completed",
        },
      ],
      [
        { name: "Prayer", routineCount: 4 },
        { name: "Learning", routineCount: 2 },
        { name: "Unused", routineCount: 0 },
      ],
      "2026-08-11",
      "2026-08-13",
      new Date("2026-08-13T12:00:00.000Z")
    )

    expect(result.series.map((day) => day.date)).toEqual([
      "2026-08-11",
      "2026-08-12",
      "2026-08-13",
    ])
    expect(result.categories).toEqual([
      expect.objectContaining({
        category: "Prayer",
        routineCount: 4,
        total: 1,
      }),
      expect.objectContaining({
        category: "Learning",
        routineCount: 2,
        total: 0,
      }),
    ])
  })
})
