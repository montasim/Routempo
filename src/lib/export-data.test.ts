import { describe, expect, it } from "vitest"

import { createDataExport, dataExportSchema } from "@/lib/export-data"
import { createInitialData } from "@/lib/initial-data"

describe("createDataExport", () => {
  it("includes versioned app data and a stable export timestamp", () => {
    const data = createInitialData()
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
})
