import { describe, expect, it } from "vitest"

import { dateForTimeZone, greetingForTimeZone } from "@/lib/greeting"

describe("greetingForTimeZone", () => {
  it.each([
    ["2026-08-10T03:00:00.000Z", "Good morning, MONTASIM"],
    ["2026-08-10T07:00:00.000Z", "Good afternoon, MONTASIM"],
    ["2026-08-10T13:00:00.000Z", "Good evening, MONTASIM"],
  ])("uses the user's timezone at %s", (now, expected) => {
    expect(
      greetingForTimeZone("Asia/Dhaka", "Montasim Ahmed", new Date(now))
    ).toBe(expected)
  })

  it("falls back to the local clock for an invalid timezone", () => {
    const now = new Date(2026, 7, 10, 8)
    expect(greetingForTimeZone("Invalid/Timezone", "Montasim", now)).toBe(
      "Good morning, MONTASIM"
    )
  })

  it("formats the navigation date in the user's timezone", () => {
    expect(
      dateForTimeZone("Pacific/Auckland", new Date("2026-08-09T13:00:00.000Z"))
    ).toBe("Monday, August 10")
  })
})
