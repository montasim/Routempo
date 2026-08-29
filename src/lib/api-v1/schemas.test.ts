import { describe, expect, it } from "vitest"

import {
  analyticsQuerySchema,
  logWriteSchema,
  routinePatchSchema,
  routineWriteSchema,
  settingsPatchSchema,
} from "./schemas"

describe("API v1 request schemas", () => {
  it("accepts only supported analytics ranges", () => {
    expect(analyticsQuerySchema.safeParse({ range: "30" }).success).toBe(true)
    expect(analyticsQuerySchema.safeParse({ range: "14" }).success).toBe(false)
  })

  it("accepts partial routine updates without injecting create defaults", () => {
    expect(routinePatchSchema.parse({ title: "Read" })).toEqual({
      title: "Read",
    })
  })

  it("requires recurrence fields for new recurring routines", () => {
    const result = routineWriteSchema.safeParse({
      title: "Read",
      categoryId: "learning",
      startDate: "2026-08-12",
      scheduledTime: "20:00",
      recurrenceType: "weekly",
      recurrenceRules: {},
    })
    expect(result.success).toBe(false)
  })

  it("accepts Android settings fields", () => {
    expect(
      settingsPatchSchema.parse({
        timezone: "Asia/Dhaka",
        defaultReminderMinutes: 15,
        routineRemindersEnabled: true,
      })
    ).toMatchObject({ timezone: "Asia/Dhaka" })
  })

  it("normalizes optional manual log fields", () => {
    expect(
      logWriteSchema.parse({
        date: "2026-08-12",
        eventTime: "10:00",
        title: "Read",
        category: "Learning",
        scheduledTime: "09:30",
        status: "completed",
      })
    ).toMatchObject({ note: "", status: "completed" })
  })
})
