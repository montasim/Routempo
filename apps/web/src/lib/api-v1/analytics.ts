import { addDays } from "@/lib/user-calendar"

import { normalizeLogDate } from "./log-date"
import { normalizeName } from "./normalize"

type Outcome = "completed" | "skipped" | "missed"

type AnalyticsLog = {
  date: string
  category: string
  status: Outcome
}

type AnalyticsCategory = {
  name: string
  routineCount: number
}

type AnalyticsOccurrence = {
  date: string
  category: string
}

type Totals = Record<Outcome, number>

const emptyTotals = (): Totals => ({ completed: 0, skipped: 0, missed: 0 })

function withSummary(values: Totals, scheduled: number) {
  const recorded = values.completed + values.skipped + values.missed
  const total = Math.max(scheduled, recorded)
  return {
    ...values,
    unrecorded: total - recorded,
    total,
    completionPercentage: total
      ? Math.round((values.completed / total) * 100)
      : 0,
  }
}

export function buildAnalytics(
  logs: AnalyticsLog[],
  categories: AnalyticsCategory[],
  occurrences: AnalyticsOccurrence[],
  startDate: string,
  endDate: string,
  now = new Date()
) {
  const normalizedLogs = logs.map((log) => ({
    ...log,
    date: normalizeLogDate(log.date) ?? log.date,
  }))
  const days = new Map<string, Totals>()
  for (let date = startDate; date <= endDate; date = addDays(date, 1))
    days.set(date, emptyTotals())
  const scheduledDays = new Map([...days.keys()].map((date) => [date, 0]))

  const currentCategories = categories.filter((item) => item.routineCount > 0)
  const categoryTotals = new Map(
    currentCategories.map((item) => [normalizeName(item.name), emptyTotals()])
  )
  const scheduledCategories = new Map(
    currentCategories.map((item) => [normalizeName(item.name), 0])
  )

  for (const occurrence of occurrences) {
    const scheduledDay = scheduledDays.get(occurrence.date)
    if (scheduledDay !== undefined)
      scheduledDays.set(occurrence.date, scheduledDay + 1)

    const category = normalizeName(occurrence.category)
    const scheduledCategory = scheduledCategories.get(category)
    if (scheduledCategory !== undefined)
      scheduledCategories.set(category, scheduledCategory + 1)
  }

  for (const log of normalizedLogs) {
    const day = days.get(log.date)
    if (day) day[log.status] += 1
    const category = categoryTotals.get(normalizeName(log.category))
    if (category) category[log.status] += 1
  }

  const outcomes = normalizedLogs.reduce<Totals>((totals, log) => {
    totals[log.status] += 1
    return totals
  }, emptyTotals())
  const summary = withSummary(outcomes, occurrences.length)

  return {
    startDate,
    endDate,
    completionPercentage: summary.completionPercentage,
    outcomes: summary,
    series: [...days].map(([date, totals]) => ({
      date,
      ...withSummary(totals, scheduledDays.get(date) ?? 0),
    })),
    categories: currentCategories.map((category) => ({
      category: category.name,
      routineCount: category.routineCount,
      ...withSummary(
        categoryTotals.get(normalizeName(category.name))!,
        scheduledCategories.get(normalizeName(category.name)) ?? 0
      ),
    })),
    generatedAt: now.toISOString(),
  }
}
