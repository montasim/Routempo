import { describe, expect, it } from "vitest"

import {
  displayTime,
  routineOccursOnDate,
  routineRepeatLabel,
  routinesForDate,
  timeValue,
} from "@/lib/routines"
import type { Routine } from "@/lib/types"

const routine: Routine = {
  id: "routine",
  title: "Read",
  time: "8:00 PM",
  note: "10 minutes",
  category: "Mind",
  startDate: "2026-08-12",
  repeat: "none",
  status: "pending",
  enabled: true,
}

describe("routine schedules", () => {
  it("shows a one-off routine only on its start date", () => {
    expect(routineOccursOnDate(routine, "2026-08-11")).toBe(false)
    expect(routineOccursOnDate(routine, "2026-08-12")).toBe(true)
    expect(routineOccursOnDate(routine, "2026-08-13")).toBe(false)
  })

  it("respects the start and end of a daily schedule", () => {
    const daily = {
      ...routine,
      repeat: "daily" as const,
      endDate: "2026-08-14",
    }
    expect(routineOccursOnDate(daily, "2026-08-11")).toBe(false)
    expect(routineOccursOnDate(daily, "2026-08-13")).toBe(true)
    expect(routineOccursOnDate(daily, "2026-08-15")).toBe(false)
  })

  it("supports weekly recurrence on the selected weekday", () => {
    expect(
      routineOccursOnDate(
        { ...routine, repeat: "weekly", repeatOnDay: 1 },
        "2026-08-17"
      )
    ).toBe(true)
    expect(
      routineOccursOnDate(
        { ...routine, repeat: "weekly", repeatOnDay: 1 },
        "2026-08-18"
      )
    ).toBe(false)
  })

  it("supports weekly recurrence on multiple selected weekdays", () => {
    const weekly = {
      ...routine,
      repeat: "weekly" as const,
      repeatOnDays: [1, 3, 5],
    }
    expect(routineOccursOnDate(weekly, "2026-08-17")).toBe(true)
    expect(routineOccursOnDate(weekly, "2026-08-18")).toBe(false)
    expect(routineOccursOnDate(weekly, "2026-08-19")).toBe(true)
    expect(routineRepeatLabel(weekly)).toBe(
      "Every Monday, Wednesday, and Friday"
    )
  })

  it("supports monthly and yearly recurrence", () => {
    expect(
      routineOccursOnDate(
        { ...routine, repeat: "monthly", repeatOnDate: 15 },
        "2026-09-15"
      )
    ).toBe(true)
    expect(
      routineOccursOnDate(
        { ...routine, repeat: "monthly", repeatOnDate: 15 },
        "2026-09-16"
      )
    ).toBe(false)
    expect(
      routineOccursOnDate(
        {
          ...routine,
          repeat: "yearly",
          repeatOnMonth: 9,
          repeatOnDate: 15,
        },
        "2027-09-15"
      )
    ).toBe(true)
    expect(
      routineOccursOnDate(
        {
          ...routine,
          repeat: "yearly",
          repeatOnMonth: 9,
          repeatOnDate: 15,
        },
        "2027-08-15"
      )
    ).toBe(false)
  })

  it("keeps disabled and future routines out of today's list", () => {
    expect(routinesForDate([routine], "2026-08-10")).toEqual([])
    expect(
      routinesForDate([{ ...routine, enabled: false }], "2026-08-12")
    ).toEqual([])
  })

  it("formats time input values for the existing UI", () => {
    expect(displayTime("08:05")).toBe("8:05 AM")
    expect(displayTime("18:30")).toBe("6:30 PM")
    expect(timeValue("7:30 AM")).toBe("07:30")
    expect(timeValue("12:05 PM")).toBe("12:05")
  })
})
