import { describe, expect, it } from "vitest"

import { categoryList, categoryMatches } from "@/lib/categories"
import type { Routine } from "@/lib/types"

const routine = {
  id: "one",
  title: "Deep work",
  time: "8:00 AM",
  note: "",
  category: "Work",
  startDate: "2026-08-10",
  repeat: "daily",
  status: "pending",
  enabled: true,
} satisfies Routine

describe("categories", () => {
  it("derives missing category lists from real routines", () => {
    expect(categoryList(undefined, [routine])).toEqual(["Work"])
  })

  it("deduplicates names without treating case as distinct", () => {
    expect(categoryList(["Work", "work", " Personal "], [])).toEqual([
      "Work",
      "Personal",
    ])
    expect(categoryMatches("Movement", "movement")).toBe(true)
  })
})
