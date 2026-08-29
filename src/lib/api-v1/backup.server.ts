import "@tanstack/react-start/server-only"

import { eq, sql } from "drizzle-orm"

import { getDatabase } from "@/db/client.server"
import { routineOccurrences } from "@/db/schema"
import {
  createDataExport,
  type DataExport,
  type ExportOccurrence,
} from "@/lib/export-data"
import { getAppData, replaceAppData } from "@/lib/store.server"

export async function backup(userId: string, name?: string) {
  const rows = await getDatabase()
    .select()
    .from(routineOccurrences)
    .where(eq(routineOccurrences.userId, userId))
  const occurrences: ExportOccurrence[] = rows.map((row) => ({
    routineId: row.routineId,
    date: row.occurrenceDate,
    status: row.status as ExportOccurrence["status"],
    resolvedAt: row.resolvedAt?.toISOString() ?? null,
    updatedAt: row.updatedAt.toISOString(),
  }))
  return createDataExport(
    await getAppData(userId, name),
    new Date(),
    occurrences
  )
}

export async function restoreBackup(
  userId: string,
  data: DataExport["data"],
  name?: string
) {
  const { occurrences = [], ...appData } = data
  const restored = await replaceAppData(userId, appData, name)
  if (occurrences.length)
    await getDatabase()
      .insert(routineOccurrences)
      .values(
        occurrences.map((occurrence) => ({
          userId,
          routineId: occurrence.routineId,
          occurrenceDate: occurrence.date,
          status: occurrence.status,
          resolvedAt: occurrence.resolvedAt
            ? new Date(occurrence.resolvedAt)
            : null,
          updatedAt: new Date(occurrence.updatedAt),
        }))
      )
      .onConflictDoUpdate({
        target: [
          routineOccurrences.userId,
          routineOccurrences.routineId,
          routineOccurrences.occurrenceDate,
        ],
        set: {
          status: sql`excluded.status`,
          resolvedAt: sql`excluded.resolved_at`,
          updatedAt: sql`excluded.updated_at`,
        },
      })
  return restored
}
