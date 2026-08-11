import { createFileRoute } from "@tanstack/react-router"
import { z } from "zod"

import { currentUser } from "@/lib/current-user.server"
import { dataExportSchema } from "@/lib/export-data"
import { getAppData, mutateAppData, replaceAppData } from "@/lib/store.server"
import { dateKeyInTimeZone, validTimeZone } from "@/lib/user-calendar"
import { syncNotificationJobs } from "@/lib/notification-jobs.server"

const settingsSchema = z.object({
  name: z.string().min(1).max(80),
  timezone: z.string().refine(validTimeZone, "Invalid timezone"),
  reminder: z.enum(["0", "5", "10", "15", "20", "30", "45", "60"]),
  notifications: z.boolean(),
  weeklySummary: z.boolean(),
})
const routineSchema = z
  .object({
    time: z.string().min(1),
    title: z.string().min(1).max(120),
    note: z.string().max(160),
    category: z.string().min(1).max(60),
    startDate: z.iso.date(),
    repeat: z.enum(["none", "daily", "weekly", "monthly", "yearly"]),
    repeatOnDay: z.number().int().min(0).max(6).optional(),
    repeatOnDays: z
      .array(z.number().int().min(0).max(6))
      .min(1)
      .max(7)
      .refine((days) => new Set(days).size === days.length, "Duplicate weekday")
      .optional(),
    repeatOnDate: z.number().int().min(1).max(31).optional(),
    repeatOnMonth: z.number().int().min(1).max(12).optional(),
    endDate: z.iso.date().optional(),
  })
  .superRefine((routine, context) => {
    if (
      routine.repeat === "weekly" &&
      routine.repeatOnDay === undefined &&
      !routine.repeatOnDays?.length
    )
      context.addIssue({
        code: "custom",
        path: ["repeatOnDays"],
        message: "Weekly routines require at least one weekday",
      })
    if (
      ["monthly", "yearly"].includes(routine.repeat) &&
      routine.repeatOnDate === undefined
    )
      context.addIssue({
        code: "custom",
        path: ["repeatOnDate"],
        message: "This recurrence requires a day of the month",
      })
    if (routine.repeat === "yearly" && routine.repeatOnMonth === undefined)
      context.addIssue({
        code: "custom",
        path: ["repeatOnMonth"],
        message: "Yearly routines require a month",
      })
  })
const mutationSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.enum(["complete", "skip", "toggle"]),
    id: z.string().min(1),
  }),
  z.object({
    action: z.literal("add"),
    routine: routineSchema,
  }),
  z.object({
    action: z.literal("update"),
    id: z.string().min(1),
    routine: routineSchema,
  }),
  z.object({ action: z.literal("delete"), id: z.string().min(1) }),
  z.object({
    action: z.literal("category-add"),
    name: z.string().trim().min(1).max(60),
  }),
  z.object({
    action: z.literal("category-rename"),
    name: z.string().trim().min(1).max(60),
    nextName: z.string().trim().min(1).max(60),
  }),
  z.object({
    action: z.literal("category-delete"),
    name: z.string().trim().min(1).max(60),
  }),
  z.object({
    action: z.literal("log-add"),
    log: z.object({
      date: z.iso.date(),
      eventTime: z.string().trim().min(1).max(30),
      title: z.string().trim().min(1).max(100),
      category: z.string().trim().min(1).max(60),
      scheduled: z.string().trim().min(1).max(30),
      actual: z.string().trim().max(30),
      status: z.enum(["completed", "skipped", "missed"]),
      snapshot: z.string().trim().max(240),
    }),
  }),
  z.object({
    action: z.literal("log-update"),
    id: z.string().min(1),
    log: z.object({
      date: z.iso.date(),
      eventTime: z.string().trim().min(1).max(30),
      title: z.string().trim().min(1).max(100),
      category: z.string().trim().min(1).max(60),
      scheduled: z.string().trim().min(1).max(30),
      actual: z.string().trim().max(30),
      status: z.enum(["completed", "skipped", "missed"]),
      snapshot: z.string().trim().max(240),
    }),
  }),
  z.object({ action: z.literal("log-delete"), id: z.string().min(1) }),
  z.object({ action: z.literal("settings"), settings: settingsSchema }),
])

const importSchema = z.object({
  action: z.literal("import"),
  payload: dataExportSchema,
})

export const Route = createFileRoute("/api/app")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const user = await currentUser(request)
        if (!user)
          return Response.json({ error: "Unauthorized" }, { status: 401 })
        const data = await getAppData(
          user.id,
          user.name,
          request.headers.get("x-routempo-timezone") ?? undefined
        )
        await syncNotificationJobs(user.id, new Date(), false)
        return Response.json(data)
      },
      POST: async ({ request }) => {
        const body: unknown = await request.json()
        const imported = importSchema.safeParse(body)
        if (imported.success) {
          const user = await currentUser(request)
          if (!user)
            return Response.json({ error: "Unauthorized" }, { status: 401 })
          return Response.json(
            await replaceAppData(user.id, imported.data.payload.data, user.name)
          )
        }

        const parsed = mutationSchema.safeParse(body)
        if (!parsed.success)
          return Response.json(
            { error: "Invalid request", issues: parsed.error.issues },
            { status: 400 }
          )
        const user = await currentUser(request)
        if (!user)
          return Response.json({ error: "Unauthorized" }, { status: 401 })
        if (parsed.data.action === "add") {
          const current = await getAppData(user.id, user.name)
          if (
            parsed.data.routine.startDate <
            dateKeyInTimeZone(current.settings.timezone)
          )
            return Response.json(
              { error: "Routines cannot be added to past days" },
              { status: 400 }
            )
        }
        return Response.json(
          await mutateAppData(user.id, parsed.data, user.name)
        )
      },
    },
  },
})
