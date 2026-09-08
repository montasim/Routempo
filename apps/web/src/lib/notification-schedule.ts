import { fromZonedTime } from "date-fns-tz"

import { routineOccursOnDate, timeValue } from "@/lib/routines"
import type { Routine, Settings } from "@/lib/types"
import {
  addDays,
  dateKeyInTimeZone,
  resolvedTimeZone,
} from "@/lib/user-calendar"

const minute = 60_000

export type ScheduledNotification = {
  deliveryKey: string
  title: string
  body: string
  url: string
  scheduledFor: Date
  routineId?: string
  occurrenceDate?: string
}

export function dueRoutineNotifications(
  routines: Routine[],
  settings: Settings,
  now = new Date(),
  graceMinutes = 10
) {
  const windowStart = new Date(now.getTime() - graceMinutes * minute)
  return routineNotificationsForWindow(
    routines,
    settings,
    windowStart,
    2
  ).filter((notification) =>
    isDue(notification.scheduledFor, now, graceMinutes)
  )
}

export function routineNotificationsForWindow(
  routines: Routine[],
  settings: Settings,
  now = new Date(),
  days = 7
) {
  if (!settings.notifications) return []

  const timezone = resolvedTimeZone(settings.timezone)
  const today = dateKeyInTimeZone(timezone, now)
  const reminderMinutes = normalizedReminder(settings.reminder)
  const dates = Array.from({ length: days + 1 }, (_, index) =>
    addDays(today, index)
  )

  return dates.flatMap((date) =>
    routines.flatMap((routine): ScheduledNotification[] => {
      if (!routine.enabled || !routineOccursOnDate(routine, date)) return []

      const scheduledFor = fromZonedTime(
        `${date}T${timeValue(routine.time)}:00`,
        timezone
      )
      const reminderAt = new Date(
        scheduledFor.getTime() - reminderMinutes * minute
      )
      if (reminderAt.getTime() < now.getTime()) return []

      return [
        {
          deliveryKey: `routine:${routine.id}:${date}`,
          title: routine.title,
          body:
            reminderMinutes === 0
              ? `Scheduled for ${routine.time}.`
              : `Starts in ${reminderMinutes} minutes at ${routine.time}.`,
          url: "/today",
          scheduledFor: reminderAt,
          routineId: routine.id,
          occurrenceDate: date,
        },
      ]
    })
  )
}

export function dueWeeklySummary(
  settings: Settings,
  completed: number,
  total: number,
  now = new Date(),
  graceMinutes = 10
): ScheduledNotification | null {
  if (!settings.weeklySummary) return null

  const timezone = resolvedTimeZone(settings.timezone)
  const today = dateKeyInTimeZone(timezone, now)
  const mondayAtNine = fromZonedTime(`${today}T09:00:00`, timezone)
  const localWeekday = weekdayInTimeZone(timezone, now)

  if (localWeekday !== 1 || !isDue(mondayAtNine, now, graceMinutes)) return null

  return {
    deliveryKey: `weekly:${today}`,
    title: "Your weekly Routempo summary",
    body: total
      ? `${completed} of ${total} routines completed last week.`
      : "You had no recorded routines last week. Start fresh today.",
    url: "/insights",
    scheduledFor: mondayAtNine,
  }
}

export function nextWeeklySummaryNotification(
  settings: Settings,
  now = new Date()
): ScheduledNotification | null {
  if (!settings.weeklySummary) return null

  const timezone = resolvedTimeZone(settings.timezone)
  const today = dateKeyInTimeZone(timezone, now)
  const weekday = weekdayInTimeZone(timezone, now)
  let date = addDays(today, (8 - weekday) % 7)
  let scheduledFor = fromZonedTime(`${date}T09:00:00`, timezone)
  if (scheduledFor.getTime() <= now.getTime()) {
    date = addDays(date, 7)
    scheduledFor = fromZonedTime(`${date}T09:00:00`, timezone)
  }

  return {
    deliveryKey: `weekly:${date}`,
    title: "Your weekly Routempo summary",
    body: "See how your routines went last week.",
    url: "/insights",
    scheduledFor,
  }
}

function normalizedReminder(value: string) {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed >= 0 ? Math.min(parsed, 24 * 60) : 0
}

function isDue(target: Date, now: Date, graceMinutes: number) {
  const difference = now.getTime() - target.getTime()
  return difference >= 0 && difference < graceMinutes * minute
}

function weekdayInTimeZone(timezone: string, instant: Date) {
  const label = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    weekday: "short",
  }).format(instant)
  return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(label)
}
