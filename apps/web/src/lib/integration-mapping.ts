import type { Routine, RoutineDraft } from "@/lib/types"

export type IntegrationProvider = "google" | "microsoft"
export type IntegrationResource = "calendar" | "tasks"

export type ExternalItem = {
  id: string
  title: string
  note?: string
  date?: string
  dateTime?: string
}

export function externalItemToRoutine(
  item: ExternalItem,
  provider: IntegrationProvider,
  resource: IntegrationResource,
  fallbackDate: string
): RoutineDraft | null {
  const startDate = item.date ?? item.dateTime?.slice(0, 10) ?? fallbackDate
  if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate) || !item.title.trim()) return null

  return {
    title: item.title.trim().slice(0, 120),
    note: (item.note ?? "").trim().slice(0, 160),
    category: `${provider === "google" ? "Google" : "Microsoft"} ${resource === "calendar" ? "Calendar" : "Tasks"}`,
    startDate,
    time:
      resource === "calendar" && item.dateTime
        ? displayTime(item.dateTime.slice(11, 16))
        : "8:00 AM",
    repeat: "none",
  }
}

export function routineDateTime(routine: Routine) {
  const match = routine.time.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i)
  if (!match) return `${routine.startDate}T08:00:00`
  const [, rawHour = "8", minute = "00", rawPeriod = "AM"] = match
  const period = rawPeriod.toUpperCase()
  let hour = Number(rawHour) % 12
  if (period === "PM") hour += 12
  return `${routine.startDate}T${String(hour).padStart(2, "0")}:${minute}:00`
}

export function addMinutes(dateTime: string, minutes: number) {
  const [date = "", time = ""] = dateTime.split("T")
  const [year, month, day] = date.split("-").map(Number)
  const [hour, minute] = time.split(":").map(Number)
  const value = new Date(Date.UTC(year!, month! - 1, day!, hour, minute))
  value.setUTCMinutes(value.getUTCMinutes() + minutes)
  return value.toISOString().slice(0, 19)
}

function displayTime(value: string) {
  const [rawHour = 8, minute = 0] = value.split(":").map(Number)
  const period = rawHour >= 12 ? "PM" : "AM"
  return `${rawHour % 12 || 12}:${String(minute).padStart(2, "0")} ${period}`
}
