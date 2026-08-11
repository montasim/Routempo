import { describe, expect, it } from "vitest"

import { applyAppMutation } from "@/lib/app-mutations"
import { createInitialData } from "@/lib/initial-data"

function dataWithRoutine() {
  const data = createInitialData()
  data.categories = ["Personal", "Movement"]
  data.routines = [
    {
      id: "morning-stretch",
      time: "7:30 AM",
      title: "Morning stretch",
      note: "10 minutes",
      category: "Movement",
      startDate: "2026-08-10",
      repeat: "daily",
      status: "completed",
      enabled: true,
    },
  ]
  data.logs = [
    {
      id: "event-one",
      date: "Aug 10, 2026",
      eventTime: "7:42 AM",
      title: "Morning stretch",
      category: "Movement",
      scheduled: "7:30 AM",
      actual: "7:42 AM",
      variance: "+12 min",
      status: "completed",
      recordedAt: "2026-08-10T01:42:00.000Z",
      actor: "Test user",
      source: "Web app",
      timezone: "UTC",
      snapshot: "Morning stretch",
    },
  ]
  return data
}

describe("app mutations", () => {
  it("updates routine details without replacing runtime state", () => {
    const data = dataWithRoutine()
    const routine = data.routines[0]!
    applyAppMutation(data, {
      action: "update",
      id: routine.id,
      routine: {
        title: "Evening stretch",
        time: "8:00 PM",
        note: "15 minutes",
        category: "Wellbeing",
        startDate: routine.startDate,
        repeat: "daily",
      },
    })

    expect(data.routines[0]).toMatchObject({
      id: routine.id,
      title: "Evening stretch",
      category: "Wellbeing",
      enabled: true,
      status: "completed",
    })
    expect(data.categories).toContain("Wellbeing")
  })

  it("deletes a routine without deleting its audit history", () => {
    const data = dataWithRoutine()
    const logs = [...data.logs]
    applyAppMutation(data, { action: "delete", id: "morning-stretch" })

    expect(
      data.routines.some((routine) => routine.id === "morning-stretch")
    ).toBe(false)
    expect(data.logs).toEqual(logs)
  })

  it("renames categories across routines and protects categories in use", () => {
    const data = dataWithRoutine()
    applyAppMutation(data, {
      action: "category-rename",
      name: "Movement",
      nextName: "Fitness",
    })
    expect(data.categories).toContain("Fitness")
    expect(
      data.routines.filter((routine) => routine.category === "Fitness")
    ).toHaveLength(1)

    applyAppMutation(data, { action: "category-delete", name: "Fitness" })
    expect(data.categories).toContain("Fitness")

    applyAppMutation(data, { action: "category-delete", name: "Personal" })
    expect(data.categories).not.toContain("Personal")
  })

  it("adds, updates, and deletes manual logs", () => {
    const data = dataWithRoutine()
    const draft = {
      date: "2026-08-10",
      eventTime: "8:12 AM",
      title: "Morning walk",
      category: "Movement",
      scheduled: "8:00 AM",
      actual: "8:12 AM",
      status: "completed" as const,
      snapshot: "Walked around the park",
    }

    applyAppMutation(
      data,
      { action: "log-add", log: draft },
      "Test user",
      new Date("2026-08-10T02:12:00.000Z")
    )
    const added = data.logs[0]!
    expect(added).toMatchObject({
      title: "Morning walk",
      date: "Aug 10, 2026",
      source: "Manual entry",
    })

    applyAppMutation(data, {
      action: "log-update",
      id: added.id,
      log: { ...draft, title: "Morning walk outside", status: "skipped" },
    })
    expect(data.logs[0]).toMatchObject({
      title: "Morning walk outside",
      status: "skipped",
      source: "Manual edit",
    })

    applyAppMutation(data, { action: "log-delete", id: added.id })
    expect(data.logs.some((log) => log.id === added.id)).toBe(false)
  })
})
