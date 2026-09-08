import "@tanstack/react-start/server-only"

import { and, asc, eq, gte, inArray, lte, sql } from "drizzle-orm"

import { getDatabase } from "@/db/client.server"
import {
  appSettings,
  categories,
  routineLogs,
  routineOccurrences,
  routines,
} from "@/db/schema"
import { routineOccursOnDate } from "@/lib/routines"
import { getAppData, mutateAppData } from "@/lib/store.server"
import type { Routine, RoutineDraft, Settings } from "@/lib/types"
import { addDays, dateKeyInTimeZone, validTimeZone } from "@/lib/user-calendar"

import { ApiError } from "./errors"
import { normalizeName } from "./normalize"
import {
  occurrenceId,
  parseOccurrenceId,
  resolveOccurrenceWindow,
} from "./occurrences"
import { routineWriteSchema } from "./schemas"
import { timeInZone, toApiTime, toStoredTime, variance } from "./time"

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

export async function bootstrapDeviceTimeZone(
  userId: string,
  name: string | undefined,
  timezone: string
) {
  const detectedTimeZone = timezone.trim()
  if (!validTimeZone(detectedTimeZone)) return false

  await getAppData(userId, name, detectedTimeZone)
  await getDatabase()
    .update(appSettings)
    .set({ timezone: detectedTimeZone, updatedAt: new Date() })
    .where(and(eq(appSettings.userId, userId), eq(appSettings.timezone, "")))
  return true
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
    usage.map((item) => [normalizeName(item.category), item.count])
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
  return values.find(
    (item) => normalizeName(item.name) === normalizeName(name)
  )!
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
        sql`lower(trim(${routineLogs.category})) = ${normalizeName(oldName)}`
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
      mapRoutine(routine, categoryIds.get(normalizeName(routine.category)))
    )
    .sort((left, right) =>
      left.scheduledTime.localeCompare(right.scheduledTime)
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
  try {
    await mutateAppData(
      userId,
      { action: "add", routine: { ...draft, enabled: input.isActive } },
      name
    )
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "Routines cannot be added to past days"
    )
      throw new ApiError("PAST_START_DATE")
    throw error
  }
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
  if (!validated.success) throw new ApiError("INVALID_ROUTINE_PATCH")
  const draft = {
    ...(await routineDraft(userId, validated.data)),
    enabled: merged.isActive,
  }
  await mutateAppData(userId, { action: "update", id, routine: draft }, name)
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
  if (!category) throw new ApiError("CATEGORY_NOT_FOUND")
  return {
    time: toStoredTime(input.scheduledTime),
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
    scheduledTime: toApiTime(routine.time),
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

export async function listOccurrences(
  userId: string,
  startDate: string,
  endDate: string,
  status?: string
) {
  if (endDate < startDate) throw new ApiError("INVALID_DATE_RANGE")
  const dates: string[] = []
  for (
    let date = startDate;
    date <= endDate && dates.length < 93;
    date = addDays(date, 1)
  )
    dates.push(date)
  if (dates.at(-1) !== endDate) throw new ApiError("DATE_RANGE_TOO_LARGE")
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
  const today = dateKeyInTimeZone(settings.timezone)
  const resolved = resolveOccurrenceWindow(
    routineData.routines,
    stored,
    settings.timezone,
    startDate,
    endDate,
    today
  )
  if (resolved.toFinalize.length) {
    const now = new Date()
    await getDatabase().batch([
      getDatabase()
        .insert(routineOccurrences)
        .values(
          resolved.toFinalize.map((item) => ({
            userId,
            routineId: item.routineId,
            occurrenceDate: item.date,
            status: "missed",
            resolvedAt: now,
            updatedAt: now,
          }))
        )
        .onConflictDoNothing(),
      getDatabase()
        .insert(routineLogs)
        .values(
          resolved.toFinalize.map((item) => ({
            id: `missed:${item.routineId}:${item.date}`,
            userId,
            routineId: item.routineId,
            date: item.date,
            eventTime: toStoredTime(item.scheduledTime),
            title: item.title,
            category: item.category,
            scheduled: toStoredTime(item.scheduledTime),
            actual: "",
            variance: "Not completed",
            status: "missed",
            recordedAt: now,
            actor: settings.name,
            source: "Routempo Android",
            timezone: settings.timezone,
            snapshot: "Automatically marked missed",
          }))
        )
        .onConflictDoNothing(),
    ])
  }
  return resolved.occurrences.filter(
    (occurrence) => !status || occurrence.status === status
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
  if (!parsed) throw new ApiError("OCCURRENCE_NOT_FOUND")
  const settings = await settingsFor(userId)
  if (parsed.date !== dateKeyInTimeZone(settings.timezone))
    throw new ApiError("OCCURRENCE_NOT_TODAY")
  const data = await getAppData(userId)
  const routine = data.routines.find(
    (item) =>
      item.id === parsed.routineId &&
      item.enabled &&
      routineOccursOnDate(item, parsed.date)
  )
  if (!routine) throw new ApiError("OCCURRENCE_NOT_FOUND")
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
    throw new ApiError("OCCURRENCE_ALREADY_RESOLVED")
  const now = new Date()
  const eventTime = actualTime ?? timeInZone(settings.timezone, now)
  const scheduledTime = toApiTime(routine.time)
  const log = {
    id: crypto.randomUUID(),
    userId,
    routineId: routine.id,
    date: parsed.date,
    eventTime: toStoredTime(eventTime),
    title: routine.title,
    category: routine.category,
    scheduled: routine.time,
    actual: status === "completed" ? toStoredTime(eventTime) : "",
    variance:
      status === "completed"
        ? variance(scheduledTime, eventTime)
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
  const settings = await settingsFor(userId)
  if (parsed.date !== dateKeyInTimeZone(settings.timezone))
    throw new ApiError("OCCURRENCE_NOT_TODAY")
  const current = (
    await listOccurrences(userId, parsed.date, parsed.date)
  ).find((item) => item.id === id)
  if (!current) return null
  const stored = await getDatabase()
    .select({ status: routineOccurrences.status })
    .from(routineOccurrences)
    .where(
      and(
        eq(routineOccurrences.userId, userId),
        eq(routineOccurrences.routineId, parsed.routineId),
        eq(routineOccurrences.occurrenceDate, parsed.date)
      )
    )
    .limit(1)
  if (!stored[0] || !["completed", "skipped"].includes(stored[0].status))
    throw new ApiError("OCCURRENCE_NOT_RESOLVED")
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
