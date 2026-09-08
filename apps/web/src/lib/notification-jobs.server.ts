import "@tanstack/react-start/server-only"

import { and, eq, gte, inArray, lt } from "drizzle-orm"

import { getDatabase } from "@/db/client.server"
import {
  appSettings,
  notificationDeliveries,
  notificationJobs,
  routineOccurrences,
  routines,
} from "@/db/schema"
import {
  nextWeeklySummaryNotification,
  routineNotificationsForWindow,
} from "@/lib/notification-schedule"
import type { Routine, RoutineRepeat, Settings } from "@/lib/types"
import { dateKeyInTimeZone } from "@/lib/user-calendar"

export async function syncNotificationJobs(
  userId: string,
  now = new Date(),
  replacePending = true
) {
  const db = getDatabase()
  const settingsRows = await db
    .select()
    .from(appSettings)
    .where(eq(appSettings.userId, userId))
    .limit(1)
  const row = settingsRows[0]
  if (!row) return
  const today = dateKeyInTimeZone(row.timezone, now)
  const [routineRows, occurrenceRows] = await Promise.all([
    db.select().from(routines).where(eq(routines.userId, userId)),
    db
      .select({
        routineId: routineOccurrences.routineId,
        occurrenceDate: routineOccurrences.occurrenceDate,
      })
      .from(routineOccurrences)
      .where(
        and(
          eq(routineOccurrences.userId, userId),
          gte(routineOccurrences.occurrenceDate, today)
        )
      ),
  ])

  const settings: Settings = {
    name: row.name,
    timezone: row.timezone,
    reminder: row.reminder,
    notifications: row.notifications,
    weeklySummary: row.weeklySummary,
  }
  const mappedRoutines: Routine[] = routineRows.map((routine) => ({
    id: routine.id,
    time: routine.time,
    title: routine.title,
    note: routine.note,
    category: routine.category,
    startDate: routine.startDate,
    repeat: routine.repeat as RoutineRepeat,
    ...(routine.repeatOnDay === null
      ? {}
      : { repeatOnDay: routine.repeatOnDay }),
    ...(routine.repeatOnDays?.length
      ? { repeatOnDays: routine.repeatOnDays }
      : routine.repeatOnDay === null
        ? {}
        : { repeatOnDays: [routine.repeatOnDay] }),
    ...(routine.repeatOnDate === null
      ? {}
      : { repeatOnDate: routine.repeatOnDate }),
    ...(routine.repeatOnMonth === null
      ? {}
      : { repeatOnMonth: routine.repeatOnMonth }),
    ...(routine.endDate === null ? {} : { endDate: routine.endDate }),
    status: "pending",
    enabled: routine.enabled,
  }))

  if (replacePending)
    await db
      .delete(notificationJobs)
      .where(
        and(
          eq(notificationJobs.userId, userId),
          inArray(notificationJobs.status, ["pending", "processing", "failed"])
        )
      )

  const resolved = new Set(
    occurrenceRows.map(
      (occurrence) => `${occurrence.routineId}:${occurrence.occurrenceDate}`
    )
  )
  const routineJobs = routineNotificationsForWindow(
    mappedRoutines,
    settings,
    now
  ).filter((job) => !resolved.has(`${job.routineId}:${job.occurrenceDate}`))
  const weeklyJob = nextWeeklySummaryNotification(settings, now)
  const jobs = [...routineJobs, ...(weeklyJob ? [weeklyJob] : [])]
  if (!jobs.length) return

  await db
    .insert(notificationJobs)
    .values(
      jobs.map((job) => ({
        id: crypto.randomUUID(),
        deliveryKey: `${userId}:${job.deliveryKey}`,
        userId,
        kind: job.deliveryKey.startsWith("weekly:") ? "weekly" : "routine",
        routineId: job.routineId ?? null,
        scheduledFor: job.scheduledFor,
        title: job.title,
        body: job.body,
        url: job.url,
      }))
    )
    .onConflictDoNothing({ target: notificationJobs.deliveryKey })
}

export async function ensureNotificationJobs(now = new Date()) {
  const db = getDatabase()
  const cutoff = new Date(now.getTime() - 30 * 24 * 60 * 60_000)
  await db.batch([
    db
      .delete(notificationDeliveries)
      .where(lt(notificationDeliveries.sentAt, cutoff)),
    db
      .delete(notificationJobs)
      .where(
        and(
          inArray(notificationJobs.status, ["sent", "failed"]),
          lt(notificationJobs.updatedAt, cutoff)
        )
      ),
  ])
  const users = await db
    .select({ userId: appSettings.userId })
    .from(appSettings)
  for (const { userId } of users) await syncNotificationJobs(userId, now, false)
}
