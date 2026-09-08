import { routineOccursOnDate } from "@/lib/routines"
import type { Routine } from "@/lib/types"
import { addDays } from "@/lib/user-calendar"

import { toApiTime } from "./time"

export type StoredOccurrence = {
  routineId: string
  occurrenceDate: string
  status: string
  resolvedAt: Date | null
  updatedAt: Date
}

export function occurrenceId(routineId: string, date: string) {
  return `${routineId}:${date}`
}

export function parseOccurrenceId(id: string) {
  const separator = id.lastIndexOf(":")
  if (separator < 1) return null
  const routineId = id.slice(0, separator)
  const date = id.slice(separator + 1)
  return /^\d{4}-\d{2}-\d{2}$/.test(date) ? { routineId, date } : null
}

export function resolveOccurrenceWindow(
  routines: Routine[],
  stored: StoredOccurrence[],
  timezone: string,
  startDate: string,
  endDate: string,
  today: string
) {
  const state = new Map(
    stored.map((item) => [
      occurrenceId(item.routineId, item.occurrenceDate),
      item,
    ])
  )
  const dates: string[] = []
  for (let date = startDate; date <= endDate; date = addDays(date, 1))
    dates.push(date)

  const occurrences = dates.flatMap((date) =>
    routines
      .filter(
        (routine) => routine.enabled && routineOccursOnDate(routine, date)
      )
      .map((routine) => {
        const id = occurrenceId(routine.id, date)
        const storedOccurrence = state.get(id)
        const status =
          storedOccurrence?.status ?? (date < today ? "missed" : "pending")
        return {
          id,
          routineId: routine.id,
          title: routine.title,
          category: routine.category,
          date,
          scheduledTime: toApiTime(routine.time),
          timezone,
          status,
          resolvedAt: storedOccurrence?.resolvedAt?.toISOString() ?? null,
          updatedAt:
            storedOccurrence?.updatedAt.toISOString() ??
            `${date}T00:00:00.000Z`,
        }
      })
  )

  return {
    occurrences,
    toFinalize: occurrences.filter(
      (item) => item.status === "missed" && !state.has(item.id)
    ),
  }
}
