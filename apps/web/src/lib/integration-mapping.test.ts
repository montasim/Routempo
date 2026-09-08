import { describe, expect, it } from "vitest"

import {
  addMinutes,
  externalItemToRoutine,
  routineDateTime,
} from "@/lib/integration-mapping"

describe("integration mapping", () => {
  it("maps a timed Google event to a one-off routine", () => {
    expect(
      externalItemToRoutine(
        {
          id: "event-1",
          title: "Project review",
          note: "Bring notes",
          dateTime: "2026-08-15T14:30:00+06:00",
        },
        "google",
        "calendar",
        "2026-08-10"
      )
    ).toEqual({
      title: "Project review",
      note: "Bring notes",
      category: "Google Calendar",
      startDate: "2026-08-15",
      time: "2:30 PM",
      repeat: "none",
    })
  })

  it("uses today and a predictable time for tasks without a due date", () => {
    expect(
      externalItemToRoutine(
        {
          id: "task-1",
          title: "Buy tea",
          dateTime: "2026-08-20T00:00:00.000Z",
        },
        "microsoft",
        "tasks",
        "2026-08-10"
      )
    ).toMatchObject({
      category: "Microsoft Tasks",
      startDate: "2026-08-20",
      time: "8:00 AM",
    })
  })

  it("converts display times and computes a calendar end time", () => {
    const start = routineDateTime({
      id: "routine-1",
      title: "Read",
      note: "",
      category: "Mind",
      startDate: "2026-08-10",
      time: "11:45 PM",
      repeat: "none",
      status: "pending",
      enabled: true,
    })
    expect(start).toBe("2026-08-10T23:45:00")
    expect(addMinutes(start, 30)).toBe("2026-08-11T00:15:00")
  })
})
