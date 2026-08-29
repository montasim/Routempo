import { z } from "zod"

import { validTimeZone } from "@/lib/user-calendar"

export const settingsPatchSchema = z
  .object({
    name: z.string().trim().min(1).max(80).optional(),
    timezone: z.string().refine(validTimeZone, "Invalid timezone").optional(),
    defaultReminderMinutes: z
      .number()
      .int()
      .refine((value) => [0, 5, 10, 15, 20, 30, 45, 60].includes(value))
      .optional(),
    routineRemindersEnabled: z.boolean().optional(),
    weeklySummaryEnabled: z.boolean().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, "No settings supplied")

export const analyticsQuerySchema = z.object({
  range: z
    .string()
    .default("7")
    .transform(Number)
    .pipe(z.union([z.literal(7), z.literal(30), z.literal(90)])),
  startDate: z.iso.date().optional(),
  endDate: z.iso.date().optional(),
})

export const categoryWriteSchema = z.object({
  name: z.string().trim().min(1).max(60),
})

export const categoryPatchSchema = categoryWriteSchema
  .partial()
  .refine(
    (value) => Object.keys(value).length > 0,
    "No category fields supplied"
  )

const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/)

const routineBaseSchema = z.object({
  title: z.string().trim().min(1).max(100),
  note: z.string().trim().max(160).optional(),
  categoryId: z.string().min(1),
  startDate: z.iso.date(),
  scheduledTime: time,
  recurrenceType: z.enum(["none", "daily", "weekly", "monthly", "yearly"]),
  recurrenceRules: z
    .object({
      daysOfWeek: z
        .array(z.number().int().min(0).max(6))
        .min(1)
        .max(7)
        .refine((days) => new Set(days).size === days.length)
        .optional(),
      dayOfMonth: z.number().int().min(1).max(31).optional(),
      month: z.number().int().min(1).max(12).optional(),
    })
    .optional(),
  endDate: z.iso.date().nullable().optional(),
  isActive: z.boolean().optional(),
})

function validateRoutine(
  routine: z.infer<typeof routineBaseSchema>,
  context: z.RefinementCtx
) {
  if (routine.endDate && routine.endDate < routine.startDate)
    context.addIssue({
      code: "custom",
      path: ["endDate"],
      message: "End date cannot precede start date",
    })
  if (
    routine.recurrenceType === "weekly" &&
    !routine.recurrenceRules?.daysOfWeek?.length
  )
    context.addIssue({
      code: "custom",
      path: ["recurrenceRules", "daysOfWeek"],
      message: "Weekly routines require at least one weekday",
    })
  if (
    ["monthly", "yearly"].includes(routine.recurrenceType) &&
    !routine.recurrenceRules?.dayOfMonth
  )
    context.addIssue({
      code: "custom",
      path: ["recurrenceRules", "dayOfMonth"],
      message: "This recurrence requires a day of the month",
    })
  if (routine.recurrenceType === "yearly" && !routine.recurrenceRules?.month)
    context.addIssue({
      code: "custom",
      path: ["recurrenceRules", "month"],
      message: "Yearly routines require a month",
    })
}

export const routineWriteSchema = routineBaseSchema
  .superRefine(validateRoutine)
  .transform((routine) => ({
    ...routine,
    note: routine.note ?? "",
    recurrenceRules: routine.recurrenceRules ?? {},
    isActive: routine.isActive ?? true,
  }))

export const routinePatchSchema = routineBaseSchema
  .partial()
  .refine(
    (value) => Object.keys(value).length > 0,
    "No routine fields supplied"
  )

export const occurrenceResolutionSchema = z.object({
  actualTime: time.optional(),
  note: z.string().trim().max(240).default(""),
})

export const logWriteSchema = z.object({
  routineId: z.string().min(1).nullable().optional(),
  date: z.iso.date(),
  eventTime: time,
  title: z.string().trim().min(1).max(100),
  category: z.string().trim().min(1).max(60),
  scheduledTime: time,
  actualTime: time.nullable().optional(),
  status: z.enum(["completed", "skipped", "missed"]),
  note: z.string().trim().max(240).default(""),
})

export const logPatchSchema = logWriteSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, "No log fields supplied")

export const googleTokenSchema = z.object({
  idToken: z.string().min(20),
  nonce: z.string().min(1).optional(),
})

export const socialStartSchema = z.object({
  provider: z.enum(["google", "microsoft"]),
  redirectUri: z.string().min(1),
})

export const socialExchangeSchema = z.object({
  code: z.string().min(20),
  redirectUri: z.string().min(1),
})

export function issues(error: z.ZodError) {
  return error.issues.map((issue) => ({
    path: issue.path.join("."),
    message: issue.message,
  }))
}
