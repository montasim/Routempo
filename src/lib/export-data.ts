import { z } from "zod"

import type { AppData } from "@/lib/types"
import { validTimeZone } from "@/lib/user-calendar"

const settingsSchema = z.object({
  name: z.string().min(1).max(80),
  timezone: z.string().refine(validTimeZone, "Invalid timezone"),
  reminder: z.enum(["0", "5", "10", "15", "20", "30", "45", "60"]),
  notifications: z.boolean(),
  weeklySummary: z.boolean(),
})

const routineSchema = z.object({
  id: z.string().min(1).max(200),
  time: z.string().min(1).max(30),
  title: z.string().min(1).max(120),
  note: z.string().max(160),
  category: z.string().min(1).max(60),
  startDate: z.iso.date(),
  repeat: z.enum(["none", "daily", "weekly", "monthly", "yearly"]),
  repeatOnDay: z.number().int().min(0).max(6).optional(),
  repeatOnDays: z.array(z.number().int().min(0).max(6)).max(7).optional(),
  repeatOnDate: z.number().int().min(1).max(31).optional(),
  repeatOnMonth: z.number().int().min(1).max(12).optional(),
  endDate: z.iso.date().optional(),
  status: z.enum(["pending", "completed", "skipped"]),
  enabled: z.boolean(),
})

const logSchema = z.object({
  id: z.string().min(1).max(200),
  date: z.string().min(1).max(40),
  eventTime: z.string().min(1).max(30),
  title: z.string().min(1).max(100),
  category: z.string().min(1).max(60),
  scheduled: z.string().min(1).max(30),
  actual: z.string().max(30),
  variance: z.string().max(80),
  status: z.enum(["completed", "skipped", "missed"]),
  recordedAt: z.iso.datetime(),
  actor: z.string().min(1).max(120),
  source: z.string().min(1).max(80),
  timezone: z.string().refine(validTimeZone, "Invalid timezone"),
  snapshot: z.string().max(240),
})

const occurrenceSchema = z.object({
  routineId: z.string().min(1).max(200),
  date: z.iso.date(),
  status: z.enum(["completed", "skipped", "missed"]),
  resolvedAt: z.iso.datetime().nullable(),
  updatedAt: z.iso.datetime(),
})

export type ExportOccurrence = z.infer<typeof occurrenceSchema>

export const dataExportSchema = z
  .object({
    format: z.literal("routempo-data-export"),
    version: z.literal(1),
    exportedAt: z.iso.datetime(),
    data: z.object({
      routines: z.array(routineSchema).max(1_000),
      categories: z.array(z.string().min(1).max(60)).max(500),
      settings: settingsSchema,
      logs: z.array(logSchema).max(10_000),
      occurrences: z.array(occurrenceSchema).max(10_000).optional(),
    }),
  })
  .superRefine((exported, context) => {
    for (const [path, values] of [
      ["routines", exported.data.routines],
      ["logs", exported.data.logs],
    ] as const) {
      const ids = new Set<string>()
      values.forEach((value, index) => {
        if (ids.has(value.id))
          context.addIssue({
            code: "custom",
            path: ["data", path, index, "id"],
            message: "Duplicate ID",
          })
        ids.add(value.id)
      })
    }
  })

export type DataExport = z.infer<typeof dataExportSchema>

export function createDataExport(
  data: AppData,
  now = new Date(),
  occurrences?: ExportOccurrence[]
) {
  return {
    format: "routempo-data-export",
    version: 1,
    exportedAt: now.toISOString(),
    data: { ...data, ...(occurrences ? { occurrences } : {}) },
  } as const
}

export function downloadDataExport(data: AppData, now = new Date()) {
  const blob = new Blob(
    [JSON.stringify(createDataExport(data, now), null, 2)],
    {
      type: "application/json",
    }
  )
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = `routempo-export-${now.toISOString().slice(0, 10)}.json`
  document.body.append(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 0)
}
