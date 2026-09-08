import { describe, expect, it } from "vitest"

import { countLogOutcomes } from "./log-outcomes"

describe("log outcome counts", () => {
  it("counts the unfiltered log scope in one pass", () => {
    expect(
      countLogOutcomes([
        { status: "completed" },
        { status: "completed" },
        { status: "skipped" },
        { status: "missed" },
      ])
    ).toEqual({ total: 4, completed: 2, skipped: 1, missed: 1 })
  })
})
