import "@tanstack/react-start/server-only"

import { and, asc, desc, eq, gte, inArray, lte, sql } from "drizzle-orm"

import { getDatabase } from "@/db/client.server"
import {
  appSettings,
  categories,
  routineLogs,
  routineOccurrences,
  routines,
} from "@/db/schema"
import { createDataExport } from "@/lib/export-data"
import { routineOccursOnDate } from "@/lib/routines"
import { getAppData, mutateAppData, replaceAppData } from "@/lib/store.server"
import type { LogDraft, Routine, RoutineDraft, Settings } from "@/lib/types"
import { addDays, dateKeyInTimeZone } from "@/lib/user-calendar"

import { routineWriteSchema } from "./schemas"

type ApiRoutineWrite = {
  title: string
  note: string
  categoryId: string
  startDate: string
  scheduledTime: string
  recurrenceType: "none" | "daily" | "weekly" | "monthly" | "yearly"
  recurrenceRules: {
    daysOfWeek?: number[]
    dayOfMonth?: number
    month?: number
  }
  endDate?: string | null
  isActive: boolean
}

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

function normalized(value: string) {
  return value.normalize("NFKC").trim().toLocaleLowerCase("en-US")
}

export async function settingsFor(userId: string, name?: string) {
  const data = await getAppData(userId, name)
  return mapSettings(data.settings)
}

export async function updateSettings(
  userId: string,
  patch: {
    name?: string
    timezone?: string
    defaultReminderMinutes?: number
    routineRemindersEnabled?: boolean
    weeklySummaryEnabled?: boolean
  },
  name?: string
) {
  const current = await getAppData(userId, name)
  const settings: Settings = {
    name: patch.name ?? current.settings.name,
    timezone: patch.timezone ?? current.settings.timezone,
    reminder: String(
      patch.defaultReminderMinutes ?? Number(current.settings.reminder)
    ),
    notifications:
      patch.routineRemindersEnabled ?? current.settings.notifications,
    weeklySummary: patch.weeklySummaryEnabled ?? current.settings.weeklySummary,
  }
  await mutateAppData(userId, { action: "settings", settings }, name)
  return mapSettings(settings)
}

function mapSettings(settings: Settings) {
  return {
    name: settings.name,
    timezone: settings.timezone,
    defaultReminderMinutes: Number(settings.reminder),
    routineRemindersEnabled: settings.notifications,
    weeklySummaryEnabled: settings.weeklySummary,
  }
}

export async function listCategories(userId: string) {
  await getAppData(userId)
  const db = getDatabase()
  const [rows, usage] = await Promise.all([
    db
      .select()
      .from(categories)
      .where(eq(categories.userId, userId))
      .orderBy(asc(categories.createdAt)),
    db
      .select({
        category: routines.category,
        count: sql<number>`count(*)::int`,
      })
      .from(routines)
      .where(eq(routines.userId, userId))
      .groupBy(routines.category),
  ])
  const counts = new Map(
    usage.map((item) => [normalized(item.category), item.count])
  )
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    routineCount: counts.get(row.normalizedName) ?? 0,
    createdAt: row.createdAt.toISOString(),
  }))
}

export async function createCategory(userId: string, name: string) {
  await mutateAppData(userId, { action: "category-add", name })
  const values = await listCategories(userId)
  return values.find((item) => normalized(item.name) === normalized(name))!
}

export async function renameCategory(userId: string, id: string, name: string) {
  const db = getDatabase()
  const rows = await db
    .select()
    .from(categories)
    .where(and(eq(categories.userId, userId), eq(categories.id, id)))
    .limit(1)
  const category = rows[0]
  if (!category) return null
  const oldName = category.name
  await mutateAppData(userId, {
    action: "category-rename",
    name: oldName,
    nextName: name,
  })
  await db
    .update(routineLogs)
    .set({ category: name.trim() })
    .where(
      and(
        eq(routineLogs.userId, userId),
        sql`lower(trim(${routineLogs.category})) = ${normalized(oldName)}`
      )
    )
  return (await listCategories(userId)).find((item) => item.id === id) ?? null
}

export async function deleteCategory(userId: string, id: string) {
  const category = (await listCategories(userId)).find((item) => item.id === id)
  if (!category) return { status: "not-found" as const }
  if (category.routineCount) return { status: "in-use" as const }
  await mutateAppData(userId, {
    action: "category-delete",
    name: category.name,
  })
  return { status: "deleted" as const, category }
}

export async function listRoutines(userId: string, includeInactive = true) {
  await getAppData(userId)
  const db = getDatabase()
  const [rows, categoryRows] = await Promise.all([
    db
      .select()
      .from(routines)
      .where(eq(routines.userId, userId))
      .orderBy(asc(routines.time), asc(routines.position)),
    db.select().from(categories).where(eq(categories.userId, userId)),
  ])
  const categoryIds = new Map(
    categoryRows.map((category) => [category.normalizedName, category.id])
  )
  return rows
    .filter((routine) => includeInactive || routine.enabled)
    .map((routine) =>
      mapRoutine(routine, categoryIds.get(normalized(routine.category)))
    )
}

export async function createRoutine(
  userId: string,
  input: ApiRoutineWrite,
  name?: string
) {
  const before = new Set(
    (await listRoutines(userId)).map((routine) => routine.id)
  )
  const draft = await routineDraft(userId, input)
  await mutateAppData(userId, { action: "add", routine: draft }, name)
  return (await listRoutines(userId)).find(
    (routine) => !before.has(routine.id)
  )!
}

export async function updateRoutine(
  userId: string,
  id: string,
  patch: Partial<ApiRoutineWrite>,
  name?: string
) {
  const existing = (await listRoutines(userId)).find(
    (routine) => routine.id === id
  )
  if (!existing) return null
  const merged: ApiRoutineWrite = {
    title: patch.title ?? existing.title,
    note: patch.note ?? existing.note,
    categoryId: patch.categoryId ?? existing.categoryId,
    startDate: patch.startDate ?? existing.startDate,
    scheduledTime: patch.scheduledTime ?? existing.scheduledTime,
    recurrenceType: patch.recurrenceType ?? existing.recurrenceType,
    recurrenceRules: patch.recurrenceRules ?? existing.recurrenceRules,
    endDate: patch.endDate === undefined ? existing.endDate : patch.endDate,
    isActive: patch.isActive ?? existing.isActive,
  }
  const validated = routineWriteSchema.safeParse(merged)
  if (!validated.success) throw new Error("INVALID_ROUTINE_PATCH")
  const draft = await routineDraft(userId, validated.data)
  await mutateAppData(userId, { action: "update", id, routine: draft }, name)
  if (merged.isActive !== existing.isActive)
    await getDatabase()
      .update(routines)
      .set({ enabled: merged.isActive, updatedAt: new Date() })
      .where(and(eq(routines.userId, userId), eq(routines.id, id)))
  return (
    (await listRoutines(userId)).find((routine) => routine.id === id) ?? null
  )
}

export async function deleteRoutine(userId: string, id: string) {
  const existing = (await listRoutines(userId)).find(
    (routine) => routine.id === id
  )
  if (!existing) return null
  await mutateAppData(userId, { action: "delete", id })
  return existing
}

async function routineDraft(
  userId: string,
  input: ApiRoutineWrite
): Promise<RoutineDraft> {
  const category = (await listCategories(userId)).find(
    (item) => item.id === input.categoryId
  )
  if (!category) throw new Error("CATEGORY_NOT_FOUND")
  return {
    time: input.scheduledTime,
    title: input.title,
    note: input.note,
    category: category.name,
    startDate: input.startDate,
    repeat: input.recurrenceType,
    ...(input.recurrenceRules.daysOfWeek
      ? { repeatOnDays: input.recurrenceRules.daysOfWeek }
      : {}),
    ...(input.recurrenceRules.dayOfMonth
      ? { repeatOnDate: input.recurrenceRules.dayOfMonth }
      : {}),
    ...(input.recurrenceRules.month
      ? { repeatOnMonth: input.recurrenceRules.month }
      : {}),
    ...(input.endDate ? { endDate: input.endDate } : {}),
  }
}

function mapRoutine(routine: typeof routines.$inferSelect, categoryId = "") {
  return {
    id: routine.id,
    title: routine.title,
    note: routine.note,
    categoryId,
    categoryName: routine.category,
    startDate: routine.startDate,
    scheduledTime: routine.time,
    recurrenceType: routine.repeat as ApiRoutineWrite["recurrenceType"],
    recurrenceRules: {
      ...(routine.repeatOnDays?.length
        ? { daysOfWeek: routine.repeatOnDays }
        : routine.repeatOnDay === null
          ? {}
          : { daysOfWeek: [routine.repeatOnDay] }),
      ...(routine.repeatOnDate === null
        ? {}
        : { dayOfMonth: routine.repeatOnDate }),
      ...(routine.repeatOnMonth === null
        ? {}
        : { month: routine.repeatOnMonth }),
    },
    endDate: routine.endDate,
    isActive: routine.enabled,
    createdAt: routine.createdAt.toISOString(),
    updatedAt: routine.updatedAt.toISOString(),
  }
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

export async function listOccurrences(
  userId: string,
  startDate: string,
  endDate: string,
  status?: string
) {
  if (endDate < startDate) throw new Error("INVALID_DATE_RANGE")
  const dates: string[] = []
  for (
    let date = startDate;
    date <= endDate && dates.length < 93;
    date = addDays(date, 1)
  )
    dates.push(date)
  if (dates.at(-1) !== endDate) throw new Error("DATE_RANGE_TOO_LARGE")
  const [routineData, stored, settings] = await Promise.all([
    getAppData(userId),
    getDatabase()
      .select()
      .from(routineOccurrences)
      .where(
        and(
          eq(routineOccurrences.userId, userId),
          gte(routineOccurrences.occurrenceDate, startDate),
          lte(routineOccurrences.occurrenceDate, endDate)
        )
      ),
    settingsFor(userId),
  ])
  const state = new Map(
    stored.map((item) => [
      occurrenceId(item.routineId, item.occurrenceDate),
      item,
    ])
  )
  const today = dateKeyInTimeZone(settings.timezone)
  return dates.flatMap((date) =>
    routineData.routines
      .filter(
        (routine) => routine.enabled && routineOccursOnDate(routine, date)
      )
      .map((routine) => {
        const id = occurrenceId(routine.id, date)
        const storedOccurrence = state.get(id)
        const occurrenceStatus =
          storedOccurrence?.status ?? (date < today ? "missed" : "pending")
        return {
          id,
          routineId: routine.id,
          title: routine.title,
          category: routine.category,
          date,
          scheduledTime: routine.time,
          timezone: settings.timezone,
          status: occurrenceStatus,
          resolvedAt: storedOccurrence?.resolvedAt?.toISOString() ?? null,
          updatedAt:
            storedOccurrence?.updatedAt.toISOString() ??
            `${date}T00:00:00.000Z`,
        }
      })
      .filter((occurrence) => !status || occurrence.status === status)
  )
}

export async function resolveOccurrence(
  userId: string,
  id: string,
  status: "completed" | "skipped",
  actor: string,
  actualTime?: string,
  note = ""
) {
  const parsed = parseOccurrenceId(id)
  if (!parsed) throw new Error("OCCURRENCE_NOT_FOUND")
  const settings = await settingsFor(userId)
  if (parsed.date !== dateKeyInTimeZone(settings.timezone))
    throw new Error("OCCURRENCE_NOT_TODAY")
  const data = await getAppData(userId)
  const routine = data.routines.find(
    (item) =>
      item.id === parsed.routineId &&
      item.enabled &&
      routineOccursOnDate(item, parsed.date)
  )
  if (!routine) throw new Error("OCCURRENCE_NOT_FOUND")
  const existing = await getDatabase()
    .select()
    .from(routineOccurrences)
    .where(
      and(
        eq(routineOccurrences.userId, userId),
        eq(routineOccurrences.routineId, routine.id),
        eq(routineOccurrences.occurrenceDate, parsed.date)
      )
    )
    .limit(1)
  if (existing[0]?.status === status)
    return (await listOccurrences(userId, parsed.date, parsed.date)).find(
      (item) => item.id === id
    )!
  if (existing[0] && existing[0].status !== "pending")
    throw new Error("OCCURRENCE_ALREADY_RESOLVED")
  const now = new Date()
  const eventTime = actualTime ?? timeInZone(settings.timezone, now)
  const log = {
    id: crypto.randomUUID(),
    userId,
    routineId: routine.id,
    date: parsed.date,
    eventTime,
    title: routine.title,
    category: routine.category,
    scheduled: routine.time,
    actual: status === "completed" ? eventTime : "",
    variance:
      status === "completed"
        ? variance(routine.time, eventTime)
        : "Not completed",
    status,
    recordedAt: now,
    actor,
    source: "Routempo Android",
    timezone: settings.timezone,
    snapshot: note,
  }
  await getDatabase().batch([
    getDatabase()
      .insert(routineOccurrences)
      .values({
        userId,
        routineId: routine.id,
        occurrenceDate: parsed.date,
        status,
        resolvedAt: now,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: [
          routineOccurrences.userId,
          routineOccurrences.routineId,
          routineOccurrences.occurrenceDate,
        ],
        set: { status, resolvedAt: now, updatedAt: now },
      }),
    getDatabase().insert(routineLogs).values(log),
  ])
  return (await listOccurrences(userId, parsed.date, parsed.date)).find(
    (item) => item.id === id
  )!
}

export async function revertOccurrence(userId: string, id: string) {
  const parsed = parseOccurrenceId(id)
  if (!parsed) return null
  const current = (
    await listOccurrences(userId, parsed.date, parsed.date)
  ).find((item) => item.id === id)
  if (!current) return null
  await getDatabase().batch([
    getDatabase()
      .delete(routineOccurrences)
      .where(
        and(
          eq(routineOccurrences.userId, userId),
          eq(routineOccurrences.routineId, parsed.routineId),
          eq(routineOccurrences.occurrenceDate, parsed.date)
        )
      ),
    getDatabase()
      .delete(routineLogs)
      .where(
        and(
          eq(routineLogs.userId, userId),
          eq(routineLogs.routineId, parsed.routineId),
          eq(routineLogs.date, parsed.date),
          inArray(routineLogs.source, ["Routempo", "Routempo Android"])
        )
      ),
  ])
  return { ...current, status: "pending", resolvedAt: null }
}

export async function listLogs(userId: string) {
  await getAppData(userId)
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
      eventTime: input.eventTime,
      title: input.title,
      category: input.category,
      scheduled: input.scheduledTime,
      actual: input.actualTime ?? "",
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
  return (await listLogs(userId)).find((log) => log.id === id)!
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
      eventTime: merged.eventTime,
      title: merged.title,
      category: merged.category,
      scheduled: merged.scheduledTime,
      actual: merged.actualTime ?? "",
      variance:
        merged.status === "completed" && merged.actualTime
          ? variance(merged.scheduledTime, merged.actualTime)
          : "Manually recorded",
      status: merged.status,
      snapshot: merged.note,
    })
    .where(and(eq(routineLogs.userId, userId), eq(routineLogs.id, id)))
  return (await listLogs(userId)).find((log) => log.id === id)!
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
    eventTime: log.eventTime,
    title: log.title,
    category: log.category,
    scheduledTime: log.scheduled,
    actualTime: log.actual || null,
    variance: log.variance,
    status: log.status as ApiLogWrite["status"],
    recordedAt: log.recordedAt.toISOString(),
    actor: log.actor,
    source: log.source,
    timezone: log.timezone,
    note: log.snapshot,
  }
}

export async function analytics(
  userId: string,
  startDate: string,
  endDate: string
) {
  const logs = (await listLogs(userId)).filter(
    (log) => log.date >= startDate && log.date <= endDate
  )
  const categories = new Map<
    string,
    { category: string; completed: number; skipped: number; missed: number }
  >()
  const days = new Map<
    string,
    { completed: number; skipped: number; missed: number }
  >()
  for (const log of logs) {
    const category = categories.get(log.category) ?? {
      category: log.category,
      completed: 0,
      skipped: 0,
      missed: 0,
    }
    const day = days.get(log.date) ?? { completed: 0, skipped: 0, missed: 0 }
    category[log.status] += 1
    day[log.status] += 1
    categories.set(log.category, category)
    days.set(log.date, day)
  }
  const completed = logs.filter((log) => log.status === "completed").length
  const skipped = logs.filter((log) => log.status === "skipped").length
  const missed = logs.filter((log) => log.status === "missed").length
  return {
    startDate,
    endDate,
    completionPercentage: logs.length
      ? Math.round((completed / logs.length) * 100)
      : 0,
    outcomes: { completed, skipped, missed, total: logs.length },
    series: [...days.entries()]
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([date, values]) => ({
        date,
        ...values,
        total: values.completed + values.skipped + values.missed,
        completionPercentage:
          values.completed + values.skipped + values.missed
            ? Math.round(
                (values.completed /
                  (values.completed + values.skipped + values.missed)) *
                  100
              )
            : 0,
      })),
    categories: [...categories.values()].map((category) => {
      const total = category.completed + category.skipped + category.missed
      return {
        ...category,
        total,
        completionPercentage: total
          ? Math.round((category.completed / total) * 100)
          : 0,
      }
    }),
    generatedAt: new Date().toISOString(),
  }
}

export async function backup(userId: string, name?: string) {
  return createDataExport(await getAppData(userId, name))
}

export async function restoreBackup(
  userId: string,
  data: Parameters<typeof replaceAppData>[1],
  name?: string
) {
  return replaceAppData(userId, data, name)
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

function timeInZone(timezone: string, date: Date) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: timezone,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date)
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "00"
  return `${value("hour")}:${value("minute")}`
}

function variance(scheduled: string, actual: string) {
  const minutes = (value: string) => {
    const [hour = 0, minute = 0] = value.split(":").map(Number)
    return hour * 60 + minute
  }
  const difference = minutes(actual) - minutes(scheduled)
  if (!difference) return "On time"
  return difference > 0
    ? `${difference} min late`
    : `${Math.abs(difference)} min early`
}
