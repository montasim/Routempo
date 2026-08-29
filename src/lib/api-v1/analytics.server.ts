import "@tanstack/react-start/server-only"

import { buildAnalytics } from "./analytics"
import { listCategories, listOccurrences } from "./data.server"
import { listLogs } from "./logs.server"

export async function analytics(
  userId: string,
  startDate: string,
  endDate: string
) {
  await listOccurrences(userId, startDate, endDate)
  const logs = (await listLogs(userId, false)).filter(
    (log) => log.date >= startDate && log.date <= endDate
  )
  return buildAnalytics(logs, await listCategories(userId), startDate, endDate)
}
