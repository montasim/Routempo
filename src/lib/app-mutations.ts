import { categoryList, categoryMatches } from "@/lib/categories"
import type { AppData, AppMutation, LogDraft, LogEntry } from "@/lib/types"
import { resolvedTimeZone } from "@/lib/user-calendar"

export function applyAppMutation(
  data: AppData,
  mutation: AppMutation,
  name?: string,
  now = new Date()
) {
  switch (mutation.action) {
    case "complete":
    case "skip": {
      const routine = data.routines.find((item) => item.id === mutation.id)
      if (routine) {
        const timeZone = resolvedTimeZone(data.settings.timezone)
        routine.status =
          mutation.action === "complete" ? "completed" : "skipped"
        const event: LogEntry = {
          id: `evt_${now.getTime().toString(36).toUpperCase()}`,
          date: new Intl.DateTimeFormat("en-US", {
            timeZone,
            month: "short",
            day: "numeric",
            year: "numeric",
          }).format(now),
          eventTime: new Intl.DateTimeFormat("en-US", {
            timeZone,
            hour: "numeric",
            minute: "2-digit",
          }).format(now),
          title: routine.title,
          category: routine.category,
          scheduled: routine.time,
          actual: mutation.action === "complete" ? "Just now" : "—",
          variance: "—",
          status: routine.status,
          recordedAt: now.toISOString(),
          actor: name ?? "Routempo user",
          source: "Web app",
          timezone: data.settings.timezone,
          snapshot: `${routine.title} · ${routine.note} · ${routine.time}`,
        }
        data.logs.unshift(event)
      }
      break
    }
    case "toggle": {
      const routine = data.routines.find((item) => item.id === mutation.id)
      if (routine) routine.enabled = !routine.enabled
      break
    }
    case "add":
      data.routines.push({
        ...mutation.routine,
        id: crypto.randomUUID(),
        status: "pending",
        enabled: true,
      })
      data.categories = categoryList(
        [...data.categories, mutation.routine.category],
        data.routines
      )
      break
    case "update": {
      const index = data.routines.findIndex((item) => item.id === mutation.id)
      const routine = data.routines[index]
      if (routine) {
        data.routines[index] = { ...routine, ...mutation.routine }
        data.categories = categoryList(
          [...data.categories, mutation.routine.category],
          data.routines
        )
      }
      break
    }
    case "delete":
      data.routines = data.routines.filter(
        (routine) => routine.id !== mutation.id
      )
      break
    case "category-add":
      data.categories = categoryList(
        [...data.categories, mutation.name.trim()],
        data.routines
      )
      break
    case "category-rename":
      if (
        !data.categories.some(
          (category) =>
            !categoryMatches(category, mutation.name) &&
            categoryMatches(category, mutation.nextName)
        )
      ) {
        data.categories = data.categories.map((category) =>
          categoryMatches(category, mutation.name)
            ? mutation.nextName.trim()
            : category
        )
        data.routines = data.routines.map((routine) =>
          categoryMatches(routine.category, mutation.name)
            ? { ...routine, category: mutation.nextName.trim() }
            : routine
        )
      }
      break
    case "category-delete":
      if (
        !data.routines.some((routine) =>
          categoryMatches(routine.category, mutation.name)
        )
      )
        data.categories = data.categories.filter(
          (category) => !categoryMatches(category, mutation.name)
        )
      break
    case "log-add":
      data.logs.unshift(createManualLog(mutation.log, data, name, now))
      break
    case "log-update": {
      const index = data.logs.findIndex((log) => log.id === mutation.id)
      const current = data.logs[index]
      if (current)
        data.logs[index] = {
          ...current,
          ...manualLogFields(mutation.log, data),
          source: "Manual edit",
        }
      break
    }
    case "log-delete":
      data.logs = data.logs.filter((log) => log.id !== mutation.id)
      break
    case "settings":
      data.settings = mutation.settings
      break
  }

  return data
}

function manualLogFields(log: LogDraft, data: AppData) {
  const date = new Date(`${log.date}T12:00:00`)
  return {
    date: Number.isNaN(date.getTime())
      ? log.date
      : new Intl.DateTimeFormat("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        }).format(date),
    eventTime: log.eventTime.trim(),
    title: log.title.trim(),
    category: log.category.trim(),
    scheduled: log.scheduled.trim(),
    actual: log.actual.trim() || "—",
    variance: "Manual entry",
    status: log.status,
    timezone: data.settings.timezone,
    snapshot:
      log.snapshot.trim() || `${log.title.trim()} · ${log.scheduled.trim()}`,
  }
}

function createManualLog(
  log: LogDraft,
  data: AppData,
  name: string | undefined,
  now: Date
): LogEntry {
  return {
    id: `evt_${crypto.randomUUID()}`,
    ...manualLogFields(log, data),
    recordedAt: now.toISOString(),
    actor: name ?? data.settings.name,
    source: "Manual entry",
  }
}
