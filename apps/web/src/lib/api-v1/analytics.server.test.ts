import { beforeEach, describe, expect, it, vi } from "vitest"

const dependencies = vi.hoisted(() => ({
  listCategories: vi.fn(),
  listLogs: vi.fn(),
  listOccurrences: vi.fn(),
}))

vi.mock("./data.server", () => ({
  listCategories: dependencies.listCategories,
  listOccurrences: dependencies.listOccurrences,
}))
vi.mock("./logs.server", () => ({ listLogs: dependencies.listLogs }))

import { analytics } from "./analytics.server"

describe("analytics server", () => {
  beforeEach(() => vi.clearAllMocks())

  it("uses the occurrence schedule to return scheduled and unrecorded totals", async () => {
    dependencies.listOccurrences.mockResolvedValue([
      { date: "2026-08-11", category: "Prayer" },
      { date: "2026-08-12", category: "Prayer" },
    ])
    dependencies.listLogs.mockResolvedValue([
      {
        date: "2026-08-11",
        category: "Prayer",
        status: "completed",
      },
      {
        date: "2026-08-13",
        category: "Prayer",
        status: "completed",
      },
    ])
    dependencies.listCategories.mockResolvedValue([
      { name: "Prayer", routineCount: 1 },
    ])

    const result = await analytics("user-1", "2026-08-11", "2026-08-12")

    expect(dependencies.listOccurrences).toHaveBeenCalledWith(
      "user-1",
      "2026-08-11",
      "2026-08-12"
    )
    expect(dependencies.listLogs).toHaveBeenCalledWith("user-1", false)
    expect(
      dependencies.listOccurrences.mock.invocationCallOrder[0]
    ).toBeLessThan(dependencies.listLogs.mock.invocationCallOrder[0]!)
    expect(result.outcomes).toMatchObject({
      completed: 1,
      unrecorded: 1,
      total: 2,
      completionPercentage: 50,
    })
    expect(result.series[1]).toMatchObject({
      date: "2026-08-12",
      unrecorded: 1,
      total: 1,
    })
  })
})
