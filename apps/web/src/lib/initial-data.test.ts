import { describe, expect, it } from "vitest"

import { createInitialData } from "@/lib/initial-data"

describe("Routempo initial data", () => {
  it("leaves timezone unset until the first device is detected", () => {
    expect(createInitialData().settings.timezone).toBe("")
  })

  it("starts without prototype records", () => {
    const data = createInitialData("Amina", "Africa/Cairo")
    expect(data.categories).toEqual([])
    expect(data.routines).toEqual([])
    expect(data.logs).toEqual([])
    expect(data.settings).toMatchObject({
      name: "Amina",
      timezone: "Africa/Cairo",
      notifications: false,
      weeklySummary: false,
    })
  })
})
