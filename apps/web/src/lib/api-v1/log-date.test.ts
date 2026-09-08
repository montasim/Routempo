import { describe, expect, it } from "vitest"

import { normalizeLogDate, resolveStoredLogDate } from "./log-date"

describe("API v1 log date compatibility", () => {
  it("normalizes ISO and legacy en-US web dates", () => {
    expect(normalizeLogDate("2026-08-11")).toBe("2026-08-11")
    expect(normalizeLogDate("Aug 11, 2026")).toBe("2026-08-11")
    expect(normalizeLogDate("August 1, 2026")).toBe("2026-08-01")
    expect(normalizeLogDate("Feb 29, 2024")).toBe("2024-02-29")
  })

  it("rejects impossible dates instead of persisting an invented repair", () => {
    expect(normalizeLogDate("2026-02-29")).toBeNull()
    expect(normalizeLogDate("Feb 30, 2026")).toBeNull()

    expect(
      resolveStoredLogDate(
        "not-a-date",
        new Date("2026-08-11T23:30:00.000Z"),
        "Asia/Dhaka"
      )
    ).toEqual({ date: "2026-08-12", repair: null, invalid: true })
  })

  it("marks only recognized non-canonical values for storage repair", () => {
    const recordedAt = new Date("2026-08-11T12:00:00.000Z")
    expect(resolveStoredLogDate("Aug 11, 2026", recordedAt, "UTC")).toEqual({
      date: "2026-08-11",
      repair: "2026-08-11",
      invalid: false,
    })
    expect(resolveStoredLogDate("2026-08-11", recordedAt, "UTC")).toEqual({
      date: "2026-08-11",
      repair: null,
      invalid: false,
    })
  })
})
