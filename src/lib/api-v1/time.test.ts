import { describe, expect, it } from "vitest"

import { toApiTime, toStoredTime } from "./time"

describe("mobile time boundary", () => {
  it("normalizes stored display times to sortable 24-hour values", () => {
    expect(toApiTime("4:55 AM")).toBe("04:55")
    expect(toApiTime("6:55 PM")).toBe("18:55")
    expect(toApiTime("21:30")).toBe("21:30")
  })

  it("keeps web persistence in its display-time convention", () => {
    expect(toStoredTime("21:30")).toBe("9:30 PM")
  })
})
