import { describe, expect, it } from "vitest"

import {
  addDays,
  centeredDateKeys,
  dateKeyInTimeZone,
  formatDateKey,
  resolvedTimeZone,
  supportedTimeZones,
  timeZoneOffset,
  weekdayAbbreviation,
  weekDateKeys,
} from "@/lib/user-calendar"

describe("user calendar", () => {
  it("uses the user's timezone at day boundaries", () => {
    const instant = new Date("2026-08-10T01:00:00.000Z")
    expect(dateKeyInTimeZone("Asia/Dhaka", instant)).toBe("2026-08-10")
    expect(dateKeyInTimeZone("America/Los_Angeles", instant)).toBe("2026-08-09")
  })

  it("builds Monday-first weeks from the user's calendar date", () => {
    const instant = new Date("2026-08-10T01:00:00.000Z")
    expect(weekDateKeys("America/Los_Angeles", instant)).toEqual([
      "2026-08-03",
      "2026-08-04",
      "2026-08-05",
      "2026-08-06",
      "2026-08-07",
      "2026-08-08",
      "2026-08-09",
    ])
  })

  it("builds seven-day windows with the current day in the center", () => {
    const instant = new Date("2026-08-11T12:00:00.000Z")
    expect(centeredDateKeys("UTC", instant)).toEqual([
      "2026-08-08",
      "2026-08-09",
      "2026-08-10",
      "2026-08-11",
      "2026-08-12",
      "2026-08-13",
      "2026-08-14",
    ])
  })

  it("handles calendar arithmetic independently of the host timezone", () => {
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01")
    expect(formatDateKey("2026-08-10", { weekday: "long" })).toBe("Monday")
    expect(resolvedTimeZone("not/a-zone")).toBe("UTC")
  })

  it("uses unambiguous two-character weekday labels", () => {
    expect(
      [
        "2026-08-10",
        "2026-08-11",
        "2026-08-12",
        "2026-08-13",
        "2026-08-14",
        "2026-08-15",
        "2026-08-16",
      ].map(weekdayAbbreviation)
    ).toEqual(["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"])
  })

  it("lists IANA zones and displays their UTC difference", () => {
    expect(supportedTimeZones()).toContain("Asia/Dhaka")
    expect(timeZoneOffset("Asia/Dhaka", new Date("2026-08-10T00:00:00Z"))).toBe(
      "UTC+06:00"
    )
    expect(timeZoneOffset("UTC")).toBe("UTC+00:00")
  })
})
