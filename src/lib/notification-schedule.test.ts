import { describe, expect, it } from "vitest"

import {
  dueRoutineNotifications,
  dueWeeklySummary,
} from "@/lib/notification-schedule"
import type { Routine, Settings } from "@/lib/types"

const routine: Routine = {
  id: "morning-walk",
  title: "Morning walk",
  note: "20 minutes",
  category: "Movement",
  startDate: "2026-08-01",
  time: "9:00 AM",
  repeat: "daily",
  status: "pending",
  enabled: true,
}

const settings: Settings = {
  name: "Montasim",
  timezone: "Asia/Dhaka",
  reminder: "10",
  notifications: true,
  weeklySummary: true,
}

describe("notification scheduling", () => {
  it("applies the default reminder in the user's saved timezone", () => {
    const due = dueRoutineNotifications(
      [routine],
      settings,
      new Date("2026-08-11T02:50:00.000Z")
    )

    expect(due).toHaveLength(1)
    expect(due[0]).toMatchObject({
      deliveryKey: "routine:morning-walk:2026-08-11",
      body: "Starts in 10 minutes at 9:00 AM.",
    })
  })

  it("schedules a next-day routine when its reminder falls before midnight", () => {
    const due = dueRoutineNotifications(
      [{ ...routine, id: "midnight", time: "12:05 AM" }],
      { ...settings, reminder: "30" },
      new Date("2026-08-11T17:35:00.000Z")
    )

    expect(due[0]?.deliveryKey).toBe("routine:midnight:2026-08-12")
  })

  it("uses the timezone's current DST offset", () => {
    const due = dueRoutineNotifications(
      [{ ...routine, startDate: "2026-01-01" }],
      { ...settings, timezone: "America/New_York" },
      new Date("2026-03-09T12:50:00.000Z")
    )

    expect(due[0]?.deliveryKey).toBe("routine:morning-walk:2026-03-09")
    expect(due[0]?.scheduledFor.toISOString()).toBe("2026-03-09T12:50:00.000Z")
  })

  it("does not schedule disabled notifications or inactive routines", () => {
    expect(
      dueRoutineNotifications(
        [routine],
        { ...settings, notifications: false },
        new Date("2026-08-11T02:50:00.000Z")
      )
    ).toEqual([])
    expect(
      dueRoutineNotifications(
        [{ ...routine, enabled: false }],
        settings,
        new Date("2026-08-11T02:50:00.000Z")
      )
    ).toEqual([])
  })

  it("creates the weekly summary at 9 AM Monday in the saved timezone", () => {
    const summary = dueWeeklySummary(
      settings,
      5,
      7,
      new Date("2026-08-10T03:00:00.000Z")
    )

    expect(summary).toMatchObject({
      deliveryKey: "weekly:2026-08-10",
      body: "5 of 7 routines completed last week.",
    })
  })
})
