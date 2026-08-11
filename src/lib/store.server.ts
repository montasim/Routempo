import "@tanstack/react-start/server-only"

import { and, asc, desc, eq, sql } from "drizzle-orm"

import { getDatabase } from "@/db/client.server"
import {
  appSettings,
  categories,
  integrationItems,
  routineLogs,
  routineOccurrences,
  routines,
} from "@/db/schema"
import { applyAppMutation } from "@/lib/app-mutations"
import { categoryList } from "@/lib/categories"
import { createInitialData } from "@/lib/initial-data"
import { dateKeyInTimeZone, validTimeZone } from "@/lib/user-calendar"
import { syncNotificationJobs } from "@/lib/notification-jobs.server"
import type {
  AppData,
  AppMutation,
  LogEntry,
  Routine,
  RoutineDraft,
  RoutineRepeat,
  RoutineStatus,
  Settings,
} from "@/lib/types"
import type {
  IntegrationProvider,
  IntegrationResource,
} from "@/lib/integration-mapping"

function normalizedCategory(name: string) {
  return name.normalize("NFKC").trim().toLocaleLowerCase("en-US")
}

function categoryRow(userId: string, name: string) {
  return {
    id: crypto.randomUUID(),
    userId,
    name: name.trim(),
    normalizedName: normalizedCategory(name),
  }
}

function routineValues(
  userId: string,
  id: string,
  routine: RoutineDraft,
  position: number
) {
  return {
    id,
    userId,
    position,
    time: routine.time,
    title: routine.title,
    note: routine.note,
    category: routine.category.trim(),
    startDate: routine.startDate,
    repeat: routine.repeat,
    repeatOnDay: routine.repeatOnDays?.[0] ?? routine.repeatOnDay ?? null,
    repeatOnDays:
      routine.repeatOnDays ??
      (routine.repeatOnDay === undefined ? null : [routine.repeatOnDay]),
    repeatOnDate: routine.repeatOnDate ?? null,
    repeatOnMonth: routine.repeatOnMonth ?? null,
    endDate: routine.endDate ?? null,
  }
}

function logValues(userId: string, log: LogEntry, routineId?: string) {
  return {
    ...log,
    userId,
    routineId,
    recordedAt: new Date(log.recordedAt),
  }
}

async function initializeUser(
  userId: string,
  name?: string,
  timezone?: string
) {
  const db = getDatabase()
  const existing = await db
    .select({ userId: appSettings.userId, timezone: appSettings.timezone })
    .from(appSettings)
    .where(eq(appSettings.userId, userId))
    .limit(1)
  const detectedTimeZone = validTimeZone(timezone) ? timezone : undefined
  if (existing.length) {
    if (!existing[0]?.timezone && detectedTimeZone)
      await db
        .update(appSettings)
        .set({ timezone: detectedTimeZone, updatedAt: new Date() })
        .where(eq(appSettings.userId, userId))
    return
  }

  const initial = createInitialData(name, detectedTimeZone)
  await db
    .insert(appSettings)
    .values({ userId, ...initial.settings })
    .onConflictDoNothing()
}

export async function getAppData(
  userId: string,
  name?: string,
  timezone?: string
): Promise<AppData> {
  await initializeUser(userId, name, timezone)
  const db = getDatabase()
  const settingsRows = await db
    .select()
    .from(appSettings)
    .where(eq(appSettings.userId, userId))
    .limit(1)
  const settingsRow = settingsRows[0]
  if (!settingsRow)
    throw new Error(`App settings were not initialized for user ${userId}`)
  const today = dateKeyInTimeZone(settingsRow.timezone)

  const [categoryRows, routineRows, occurrenceRows, logRows] =
    await Promise.all([
      db
        .select()
        .from(categories)
        .where(eq(categories.userId, userId))
        .orderBy(asc(categories.createdAt)),
      db
        .select()
        .from(routines)
        .where(eq(routines.userId, userId))
        .orderBy(asc(routines.position), asc(routines.createdAt)),
      db
        .select()
        .from(routineOccurrences)
        .where(
          and(
            eq(routineOccurrences.userId, userId),
            eq(routineOccurrences.occurrenceDate, today)
          )
        ),
      db
        .select()
        .from(routineLogs)
        .where(eq(routineLogs.userId, userId))
        .orderBy(desc(routineLogs.recordedAt)),
    ])

  const statusByRoutine = new Map(
    occurrenceRows.map((row) => [row.routineId, row.status as RoutineStatus])
  )
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
    status: statusByRoutine.get(routine.id) ?? "pending",
    enabled: routine.enabled,
  }))

  return {
    routines: mappedRoutines,
    categories: categoryList(
      categoryRows.map((category) => category.name),
      mappedRoutines
    ),
    settings: {
      name: settingsRow.name,
      timezone: settingsRow.timezone,
      reminder: settingsRow.reminder,
      notifications: settingsRow.notifications,
      weeklySummary: settingsRow.weeklySummary,
    },
    logs: logRows.map((log) => ({
      id: log.id,
      date: log.date,
      eventTime: log.eventTime,
      title: log.title,
      category: log.category,
      scheduled: log.scheduled,
      actual: log.actual,
      variance: log.variance,
      status: log.status as LogEntry["status"],
      recordedAt: log.recordedAt.toISOString(),
      actor: log.actor,
      source: log.source,
      timezone: log.timezone,
      snapshot: log.snapshot,
    })),
  }
}

export async function replaceAppData(
  userId: string,
  data: AppData,
  name?: string
) {
  await initializeUser(userId, name)
  const db = getDatabase()
  const now = new Date()
  const categoryNames = categoryList(data.categories, data.routines)
  const resolvedRoutines = data.routines.filter(
    (routine) => routine.status !== "pending"
  )
  const today = dateKeyInTimeZone(data.settings.timezone, now)

  await db.batch([
    db.delete(integrationItems).where(eq(integrationItems.userId, userId)),
    db.delete(routineOccurrences).where(eq(routineOccurrences.userId, userId)),
    db.delete(routineLogs).where(eq(routineLogs.userId, userId)),
    db.delete(routines).where(eq(routines.userId, userId)),
    db.delete(categories).where(eq(categories.userId, userId)),
    db
      .insert(appSettings)
      .values({ userId, ...data.settings, updatedAt: now })
      .onConflictDoUpdate({
        target: appSettings.userId,
        set: { ...data.settings, updatedAt: now },
      }),
    categoryNames.length
      ? db
          .insert(categories)
          .values(
            categoryNames.map((category) => categoryRow(userId, category))
          )
      : db.execute(sql`select 1`),
    data.routines.length
      ? db.insert(routines).values(
          data.routines.map((routine, position) => ({
            ...routineValues(userId, routine.id, routine, position),
            enabled: routine.enabled,
            updatedAt: now,
          }))
        )
      : db.execute(sql`select 1`),
    data.logs.length
      ? db
          .insert(routineLogs)
          .values(data.logs.map((log) => logValues(userId, log)))
      : db.execute(sql`select 1`),
    resolvedRoutines.length
      ? db.insert(routineOccurrences).values(
          resolvedRoutines.map((routine) => ({
            userId,
            routineId: routine.id,
            occurrenceDate: today,
            status: routine.status,
            resolvedAt: now,
            updatedAt: now,
          }))
        )
      : db.execute(sql`select 1`),
  ])

  await syncNotificationJobs(userId)
  return getAppData(userId, name)
}

function saveCategory(userId: string, name: string) {
  return getDatabase()
    .insert(categories)
    .values(categoryRow(userId, name))
    .onConflictDoNothing({
      target: [categories.userId, categories.normalizedName],
    })
}

async function saveSettings(userId: string, settings: Settings) {
  return getDatabase()
    .insert(appSettings)
    .values({ userId, ...settings, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: appSettings.userId,
      set: { ...settings, updatedAt: new Date() },
    })
}

export async function mutateAppData(
  userId: string,
  mutation: AppMutation,
  name?: string
) {
  await initializeUser(userId, name)
  const db = getDatabase()

  switch (mutation.action) {
    case "complete":
    case "skip": {
      const current = await getAppData(userId, name)
      const routine = current.routines.find((item) => item.id === mutation.id)
      if (!routine) break
      const now = new Date()
      applyAppMutation(current, mutation, name, now)
      const log = current.logs[0]
      if (!log) break
      const status = mutation.action === "complete" ? "completed" : "skipped"
      await db.batch([
        db
          .insert(routineOccurrences)
          .values({
            userId,
            routineId: routine.id,
            occurrenceDate: dateKeyInTimeZone(current.settings.timezone, now),
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
        db.insert(routineLogs).values(logValues(userId, log, routine.id)),
      ])
      break
    }
    case "toggle":
      await db
        .update(routines)
        .set({ enabled: sql`not ${routines.enabled}`, updatedAt: new Date() })
        .where(and(eq(routines.userId, userId), eq(routines.id, mutation.id)))
      break
    case "add": {
      const current = await getAppData(userId, name)
      if (
        mutation.routine.startDate <
        dateKeyInTimeZone(current.settings.timezone)
      )
        throw new Error("Routines cannot be added to past days")
      const positions = await db
        .select({ position: routines.position })
        .from(routines)
        .where(eq(routines.userId, userId))
      const position = Math.max(-1, ...positions.map((row) => row.position)) + 1
      await db.batch([
        saveCategory(userId, mutation.routine.category),
        db
          .insert(routines)
          .values(
            routineValues(
              userId,
              crypto.randomUUID(),
              mutation.routine,
              position
            )
          ),
      ])
      break
    }
    case "update": {
      const values = routineValues(userId, mutation.id, mutation.routine, 0)
      await db.batch([
        saveCategory(userId, mutation.routine.category),
        db
          .update(routines)
          .set({
            time: values.time,
            title: values.title,
            note: values.note,
            category: values.category,
            startDate: values.startDate,
            repeat: values.repeat,
            repeatOnDay: values.repeatOnDay,
            repeatOnDays: values.repeatOnDays,
            repeatOnDate: values.repeatOnDate,
            repeatOnMonth: values.repeatOnMonth,
            endDate: values.endDate,
            updatedAt: new Date(),
          })
          .where(
            and(eq(routines.userId, userId), eq(routines.id, mutation.id))
          ),
      ])
      break
    }
    case "delete":
      await db.batch([
        db
          .delete(integrationItems)
          .where(
            and(
              eq(integrationItems.userId, userId),
              eq(integrationItems.routineId, mutation.id)
            )
          ),
        db
          .delete(routineOccurrences)
          .where(
            and(
              eq(routineOccurrences.userId, userId),
              eq(routineOccurrences.routineId, mutation.id)
            )
          ),
        db
          .delete(routines)
          .where(
            and(eq(routines.userId, userId), eq(routines.id, mutation.id))
          ),
      ])
      break
    case "category-add":
      await saveCategory(userId, mutation.name)
      break
    case "category-rename": {
      const sourceName = normalizedCategory(mutation.name)
      const nextName = normalizedCategory(mutation.nextName)
      const [source, target] = await Promise.all([
        db
          .select()
          .from(categories)
          .where(
            and(
              eq(categories.userId, userId),
              eq(categories.normalizedName, sourceName)
            )
          )
          .limit(1),
        db
          .select()
          .from(categories)
          .where(
            and(
              eq(categories.userId, userId),
              eq(categories.normalizedName, nextName)
            )
          )
          .limit(1),
      ])
      const sourceRow = source[0]
      if (!sourceRow || (target.length && sourceName !== nextName)) break
      await db.batch([
        db
          .update(categories)
          .set({ name: mutation.nextName.trim(), normalizedName: nextName })
          .where(
            and(eq(categories.userId, userId), eq(categories.id, sourceRow.id))
          ),
        db
          .update(routines)
          .set({ category: mutation.nextName.trim(), updatedAt: new Date() })
          .where(
            and(
              eq(routines.userId, userId),
              sql`lower(${routines.category}) = ${sourceName}`
            )
          ),
      ])
      break
    }
    case "category-delete": {
      const normalized = normalizedCategory(mutation.name)
      const inUse = await db
        .select({ id: routines.id })
        .from(routines)
        .where(
          and(
            eq(routines.userId, userId),
            sql`lower(${routines.category}) = ${normalized}`
          )
        )
        .limit(1)
      if (!inUse.length)
        await db
          .delete(categories)
          .where(
            and(
              eq(categories.userId, userId),
              eq(categories.normalizedName, normalized)
            )
          )
      break
    }
    case "log-add": {
      const current = await getAppData(userId, name)
      applyAppMutation(current, mutation, name)
      const log = current.logs[0]
      if (log) await db.insert(routineLogs).values(logValues(userId, log))
      break
    }
    case "log-update": {
      if (!mutation.id) break
      const current = await getAppData(userId, name)
      applyAppMutation(current, mutation, name)
      const log = current.logs.find((entry) => entry.id === mutation.id)
      if (!log) break
      await db
        .update(routineLogs)
        .set({
          date: log.date,
          eventTime: log.eventTime,
          title: log.title,
          category: log.category,
          scheduled: log.scheduled,
          actual: log.actual,
          variance: log.variance,
          status: log.status,
          source: log.source,
          timezone: log.timezone,
          snapshot: log.snapshot,
        })
        .where(
          and(eq(routineLogs.userId, userId), eq(routineLogs.id, mutation.id))
        )
      break
    }
    case "log-delete":
      await db
        .delete(routineLogs)
        .where(
          and(eq(routineLogs.userId, userId), eq(routineLogs.id, mutation.id))
        )
      break
    case "settings":
      await saveSettings(userId, mutation.settings)
      break
  }

  await syncNotificationJobs(userId)

  return getAppData(userId, name)
}

export async function saveImportedRoutines(
  userId: string,
  provider: IntegrationProvider,
  resource: IntegrationResource,
  items: Array<{ externalId: string; routine: RoutineDraft }>
) {
  const db = getDatabase()
  const current = await getAppData(userId)
  const today = dateKeyInTimeZone(current.settings.timezone)
  const linked = await db
    .select({ externalId: integrationItems.externalId })
    .from(integrationItems)
    .where(
      and(
        eq(integrationItems.userId, userId),
        eq(integrationItems.provider, provider),
        eq(integrationItems.resource, resource)
      )
    )
  const existing = new Set(linked.map((item) => item.externalId))
  const positions = await db
    .select({ position: routines.position })
    .from(routines)
    .where(eq(routines.userId, userId))
  let position = Math.max(-1, ...positions.map((row) => row.position)) + 1
  let imported = 0

  for (const item of items.slice(0, 250)) {
    if (existing.has(item.externalId) || item.routine.startDate < today)
      continue
    const routineId = crypto.randomUUID()
    await saveCategory(userId, item.routine.category)
    await db
      .insert(routines)
      .values(routineValues(userId, routineId, item.routine, position++))
    await db.insert(integrationItems).values({
      userId,
      provider,
      resource,
      externalId: item.externalId,
      routineId,
      direction: "import",
    })
    imported += 1
  }
  return imported
}

export async function exportableRoutines(
  userId: string,
  provider: IntegrationProvider,
  resource: IntegrationResource
) {
  const data = await getAppData(userId)
  const linked = await getDatabase()
    .select({ routineId: integrationItems.routineId })
    .from(integrationItems)
    .where(
      and(
        eq(integrationItems.userId, userId),
        eq(integrationItems.provider, provider),
        eq(integrationItems.resource, resource)
      )
    )
  const existing = new Set(linked.map((item) => item.routineId))
  return {
    routines: data.routines.filter(
      (routine) => routine.enabled && !existing.has(routine.id)
    ),
    timezone: data.settings.timezone,
  }
}

export async function recordExportedRoutine(
  userId: string,
  provider: IntegrationProvider,
  resource: IntegrationResource,
  routineId: string,
  externalId: string
) {
  await getDatabase()
    .insert(integrationItems)
    .values({
      userId,
      provider,
      resource,
      externalId,
      routineId,
      direction: "export",
    })
    .onConflictDoNothing()
}
