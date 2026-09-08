import { describe, expect, it } from "vitest"

import { createDataExport, dataExportSchema } from "@/lib/export-data"
import { createInitialData } from "@/lib/initial-data"

describe("createDataExport", () => {
  it("includes versioned app data and a stable export timestamp", () => {
    const data = createInitialData("Test user", "UTC")
    const now = new Date("2026-08-11T08:30:00.000Z")

    expect(createDataExport(data, now)).toEqual({
      format: "routempo-data-export",
      version: 1,
      exportedAt: "2026-08-11T08:30:00.000Z",
      data,
    })
  })

  it("rejects files that are not versioned Routempo exports", () => {
    expect(
      dataExportSchema.safeParse({
        format: "some-other-app",
        version: 1,
        exportedAt: "2026-08-11T08:30:00.000Z",
        data: createInitialData(),
      }).success
    ).toBe(false)
  })

  it("includes occurrence history when supplied by the API backup", () => {
    const data = createInitialData("Test user", "UTC")
    const occurrence = {
      routineId: "routine-1",
      date: "2026-08-11",
      status: "missed" as const,
      resolvedAt: "2026-08-12T00:00:00.000Z",
      updatedAt: "2026-08-12T00:00:00.000Z",
    }

    const exported = createDataExport(
      data,
      new Date("2026-08-12T01:00:00.000Z"),
      [occurrence]
    )

    expect(exported.data.occurrences).toEqual([occurrence])
    expect(dataExportSchema.safeParse(exported).success).toBe(true)
  })
})
