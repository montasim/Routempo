import { addDays } from "@/lib/user-calendar"

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

type Totals = Record<Outcome, number>

const emptyTotals = (): Totals => ({ completed: 0, skipped: 0, missed: 0 })

function withSummary(values: Totals) {
  const total = values.completed + values.skipped + values.missed
  return {
    ...values,
    total,
    completionPercentage: total
      ? Math.round((values.completed / total) * 100)
      : 0,
  }
}

export function buildAnalytics(
  logs: AnalyticsLog[],
  categories: AnalyticsCategory[],
  startDate: string,
  endDate: string,
  now = new Date()
) {
  const days = new Map<string, Totals>()
  for (let date = startDate; date <= endDate; date = addDays(date, 1))
    days.set(date, emptyTotals())

  const currentCategories = categories.filter((item) => item.routineCount > 0)
  const categoryTotals = new Map(
    currentCategories.map((item) => [normalizeName(item.name), emptyTotals()])
  )

  for (const log of logs) {
    const day = days.get(log.date)
    if (day) day[log.status] += 1
    const category = categoryTotals.get(normalizeName(log.category))
    if (category) category[log.status] += 1
  }

  const outcomes = logs.reduce<Totals>((totals, log) => {
    totals[log.status] += 1
    return totals
  }, emptyTotals())

  return {
    startDate,
    endDate,
    completionPercentage: withSummary(outcomes).completionPercentage,
    outcomes: withSummary(outcomes),
    series: [...days].map(([date, totals]) => ({
      date,
      ...withSummary(totals),
    })),
    categories: currentCategories.map((category) => ({
      category: category.name,
      routineCount: category.routineCount,
      ...withSummary(categoryTotals.get(normalizeName(category.name))!),
    })),
    generatedAt: now.toISOString(),
  }
}
