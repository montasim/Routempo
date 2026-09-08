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
      [],
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

  it("counts legacy web display dates in the matching v1 ISO day", () => {
    const result = buildAnalytics(
      [
        {
          date: "Aug 12, 2026",
          category: "Prayer",
          status: "completed",
        },
      ],
      [{ name: "Prayer", routineCount: 1 }],
      [],
      "2026-08-12",
      "2026-08-12",
      new Date("2026-08-12T12:00:00.000Z")
    )

    expect(result.outcomes).toMatchObject({ completed: 1, total: 1 })
    expect(result.series[0]).toMatchObject({
      date: "2026-08-12",
      completed: 1,
      total: 1,
    })
  })

  it("counts scheduled occurrences with no logs as unrecorded at every scope", () => {
    const result = buildAnalytics(
      [
        {
          date: "2026-08-12",
          category: "Prayer",
          status: "completed",
        },
      ],
      [
        { name: "Prayer", routineCount: 1 },
        { name: "Learning", routineCount: 1 },
      ],
      [
        { date: "2026-08-11", category: "Prayer" },
        { date: "2026-08-12", category: "Prayer" },
        { date: "2026-08-12", category: "Learning" },
        { date: "2026-08-13", category: "Learning" },
      ],
      "2026-08-11",
      "2026-08-13",
      new Date("2026-08-13T12:00:00.000Z")
    )

    expect(result.completionPercentage).toBe(25)
    expect(result.outcomes).toEqual({
      completed: 1,
      skipped: 0,
      missed: 0,
      unrecorded: 3,
      total: 4,
      completionPercentage: 25,
    })
    expect(result.series).toEqual([
      {
        date: "2026-08-11",
        completed: 0,
        skipped: 0,
        missed: 0,
        unrecorded: 1,
        total: 1,
        completionPercentage: 0,
      },
      {
        date: "2026-08-12",
        completed: 1,
        skipped: 0,
        missed: 0,
        unrecorded: 1,
        total: 2,
        completionPercentage: 50,
      },
      {
        date: "2026-08-13",
        completed: 0,
        skipped: 0,
        missed: 0,
        unrecorded: 1,
        total: 1,
        completionPercentage: 0,
      },
    ])
    expect(result.categories).toEqual([
      {
        category: "Prayer",
        routineCount: 1,
        completed: 1,
        skipped: 0,
        missed: 0,
        unrecorded: 1,
        total: 2,
        completionPercentage: 50,
      },
      {
        category: "Learning",
        routineCount: 1,
        completed: 0,
        skipped: 0,
        missed: 0,
        unrecorded: 2,
        total: 2,
        completionPercentage: 0,
      },
    ])
  })

  it("keeps recorded-only outcomes when logs exceed the occurrence schedule", () => {
    const result = buildAnalytics(
      [
        {
          date: "2026-08-12",
          category: "Prayer",
          status: "completed",
        },
        {
          date: "2026-08-12",
          category: "Prayer",
          status: "skipped",
        },
      ],
      [{ name: "Prayer", routineCount: 1 }],
      [{ date: "2026-08-12", category: "Prayer" }],
      "2026-08-12",
      "2026-08-12",
      new Date("2026-08-12T12:00:00.000Z")
    )

    expect(result.outcomes).toEqual({
      completed: 1,
      skipped: 1,
      missed: 0,
      unrecorded: 0,
      total: 2,
      completionPercentage: 50,
    })
    expect(result.series[0]).toMatchObject({
      completed: 1,
      skipped: 1,
      unrecorded: 0,
      total: 2,
      completionPercentage: 50,
    })
    expect(result.categories[0]).toMatchObject({
      category: "Prayer",
      completed: 1,
      skipped: 1,
      unrecorded: 0,
      total: 2,
      completionPercentage: 50,
    })
  })
})
