import "@tanstack/react-start/server-only"

import { and, desc, eq } from "drizzle-orm"

import { getDatabase } from "@/db/client.server"
import { routineLogs } from "@/db/schema"
import { addDays, dateKeyInTimeZone } from "@/lib/user-calendar"

import { listOccurrences, settingsFor } from "./data.server"
import { toApiTime, toStoredTime, variance } from "./time"

type ApiLogWrite = {
  routineId?: string | null
  date: string
  eventTime: string
  title: string
  category: string
  scheduledTime: string
  actualTime?: string | null
  status: "completed" | "skipped" | "missed"
  note: string
}

export async function listLogs(userId: string, finalizeMissed = true) {
  if (finalizeMissed) {
    const settings = await settingsFor(userId)
    const today = dateKeyInTimeZone(settings.timezone)
    await listOccurrences(userId, addDays(today, -92), today)
  }
  const rows = await getDatabase()
    .select()
    .from(routineLogs)
    .where(eq(routineLogs.userId, userId))
    .orderBy(desc(routineLogs.recordedAt))
  return rows.map(mapLog)
}

export async function createLog(
  userId: string,
  input: ApiLogWrite,
  actor: string
) {
  const settings = await settingsFor(userId)
  const now = new Date()
  const id = crypto.randomUUID()
  await getDatabase()
    .insert(routineLogs)
    .values({
      id,
      userId,
      routineId: input.routineId ?? null,
      date: input.date,
      eventTime: toStoredTime(input.eventTime),
      title: input.title,
      category: input.category,
      scheduled: toStoredTime(input.scheduledTime),
      actual: input.actualTime ? toStoredTime(input.actualTime) : "",
      variance:
        input.status === "completed" && input.actualTime
          ? variance(input.scheduledTime, input.actualTime)
          : "Manually recorded",
      status: input.status,
      recordedAt: now,
      actor,
      source: "Routempo Android",
      timezone: settings.timezone,
      snapshot: input.note,
    })
  return (await listLogs(userId, false)).find((log) => log.id === id)!
}

export async function updateLog(
  userId: string,
  id: string,
  patch: Partial<ApiLogWrite>
) {
  const existing = (await listLogs(userId)).find((log) => log.id === id)
  if (!existing) return null
  const merged: ApiLogWrite = {
    routineId:
      patch.routineId === undefined ? existing.routineId : patch.routineId,
    date: patch.date ?? existing.date,
    eventTime: patch.eventTime ?? existing.eventTime,
    title: patch.title ?? existing.title,
    category: patch.category ?? existing.category,
    scheduledTime: patch.scheduledTime ?? existing.scheduledTime,
    actualTime:
      patch.actualTime === undefined ? existing.actualTime : patch.actualTime,
    status: patch.status ?? existing.status,
    note: patch.note ?? existing.note,
  }
  await getDatabase()
    .update(routineLogs)
    .set({
      routineId: merged.routineId ?? null,
      date: merged.date,
      eventTime: toStoredTime(merged.eventTime),
      title: merged.title,
      category: merged.category,
      scheduled: toStoredTime(merged.scheduledTime),
      actual: merged.actualTime ? toStoredTime(merged.actualTime) : "",
      variance:
        merged.status === "completed" && merged.actualTime
          ? variance(merged.scheduledTime, merged.actualTime)
          : "Manually recorded",
      status: merged.status,
      snapshot: merged.note,
    })
    .where(and(eq(routineLogs.userId, userId), eq(routineLogs.id, id)))
  return (await listLogs(userId, false)).find((log) => log.id === id)!
}

export async function deleteLog(userId: string, id: string) {
  const existing = (await listLogs(userId)).find((log) => log.id === id)
  if (!existing) return null
  await getDatabase()
    .delete(routineLogs)
    .where(and(eq(routineLogs.userId, userId), eq(routineLogs.id, id)))
  return existing
}

function mapLog(log: typeof routineLogs.$inferSelect) {
  return {
    id: log.id,
    routineId: log.routineId,
    date: log.date,
    eventTime: toApiTime(log.eventTime),
    title: log.title,
    category: log.category,
    scheduledTime: toApiTime(log.scheduled),
    actualTime: log.actual ? toApiTime(log.actual) : null,
    variance: log.variance,
    status: log.status as ApiLogWrite["status"],
    recordedAt: log.recordedAt.toISOString(),
    actor: log.actor,
    source: log.source,
    timezone: log.timezone,
    note: log.snapshot,
  }
}

export async function logsCsv(
  userId: string,
  startDate?: string,
  endDate?: string
) {
  const logs = (await listLogs(userId)).filter(
    (log) =>
      (!startDate || log.date >= startDate) && (!endDate || log.date <= endDate)
  )
  const header = [
    "date",
    "eventTime",
    "routine",
    "category",
    "scheduledTime",
    "actualTime",
    "status",
    "timezone",
    "note",
  ]
  return [
    header.join(","),
    ...logs.map((log) =>
      [
        log.date,
        log.eventTime,
        log.title,
        log.category,
        log.scheduledTime,
        log.actualTime ?? "",
        log.status,
        log.timezone,
        log.note,
      ]
        .map(csvCell)
        .join(",")
    ),
  ].join("\n")
}

function csvCell(value: string) {
  return /[",\n]/.test(value) ? `"${value.replaceAll('"', '""')}"` : value
}
