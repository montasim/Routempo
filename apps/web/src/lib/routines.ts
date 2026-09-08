import type { Routine, RoutineRepeat } from "@/lib/types"

export function dateKey(date = new Date()) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

export function parseDateKey(value: string) {
  const [year = 0, month = 1, day = 1] = value.split("-").map(Number)
  return new Date(year, month - 1, day)
}

export function routineOccursOnDate(
  routine: Pick<
    Routine,
    | "startDate"
    | "repeat"
    | "repeatOnDay"
    | "repeatOnDays"
    | "repeatOnDate"
    | "repeatOnMonth"
    | "endDate"
  >,
  targetDate: string
) {
  const startDate = routine.startDate || "1970-01-01"
  const repeat = (routine.repeat as string | undefined) || "daily"
  if (
    targetDate < startDate ||
    (routine.endDate && targetDate > routine.endDate)
  )
    return false
  if (repeat === "none") return targetDate === startDate

  const target = parseDateKey(targetDate)
  if (repeat === "weekdays") {
    const day = target.getDay()
    return day !== 0 && day !== 6
  }
  if (repeat === "weekly") {
    return weeklyDays(routine, startDate).includes(target.getDay())
  }
  if (repeat === "monthly")
    return (
      target.getDate() ===
      (routine.repeatOnDate ?? parseDateKey(startDate).getDate())
    )
  if (repeat === "yearly") {
    const start = parseDateKey(startDate)
    return (
      target.getMonth() + 1 ===
        (routine.repeatOnMonth ?? start.getMonth() + 1) &&
      target.getDate() === (routine.repeatOnDate ?? start.getDate())
    )
  }
  return true
}

export function routinesForDate(routines: Routine[], targetDate: string) {
  return routines.filter(
    (routine) => routine.enabled && routineOccursOnDate(routine, targetDate)
  )
}

export function getWeek(date: Date) {
  const monday = new Date(date)
  const day = monday.getDay()
  monday.setDate(monday.getDate() - (day === 0 ? 6 : day - 1))
  return Array.from({ length: 7 }, (_, index) => {
    const next = new Date(monday)
    next.setDate(monday.getDate() + index)
    return next
  })
}

export function repeatLabel(repeat: RoutineRepeat | undefined) {
  return {
    none: "Does not repeat",
    daily: "Every day",
    weekly: "Weekly",
    monthly: "Monthly",
    yearly: "Yearly",
  }[repeat ?? "daily"]
}

export function routineRepeatLabel(routine: Routine) {
  const repeat = (routine.repeat as string | undefined) ?? "daily"
  const startDate = routine.startDate || "1970-01-01"
  if (repeat === "weekdays") return "Weekdays"
  if (repeat === "weekly")
    return `Every ${formatWeekdays(weeklyDays(routine, startDate))}`
  if (repeat === "monthly")
    return `Monthly on day ${routine.repeatOnDate ?? parseDateKey(startDate).getDate()}`
  if (repeat === "yearly") {
    const start = parseDateKey(startDate)
    const month = routine.repeatOnMonth ?? start.getMonth() + 1
    const day = routine.repeatOnDate ?? start.getDate()
    return `Every ${monthName(month)} ${day}`
  }
  return repeatLabel(repeat as RoutineRepeat)
}

export function weekdayName(day: number) {
  return (
    [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ][day] ?? "day"
  )
}

function weeklyDays(
  routine: Pick<Routine, "repeatOnDay" | "repeatOnDays">,
  startDate: string
) {
  return routine.repeatOnDays?.length
    ? routine.repeatOnDays
    : [routine.repeatOnDay ?? parseDateKey(startDate).getDay()]
}

function formatWeekdays(days: number[]) {
  const names = [...new Set(days)].sort((a, b) => a - b).map(weekdayName)
  if (names.length <= 1) return names[0] ?? "day"
  if (names.length === 2) return names.join(" and ")
  return `${names.slice(0, -1).join(", ")}, and ${names.at(-1)}`
}

export function monthName(month: number) {
  return new Intl.DateTimeFormat("en-US", { month: "long" }).format(
    new Date(2000, month - 1, 1)
  )
}

export function displayTime(value: string) {
  const [hours = 0, minutes = 0] = value.split(":").map(Number)
  const period = hours >= 12 ? "PM" : "AM"
  const displayHours = hours % 12 || 12
  return `${displayHours}:${String(minutes).padStart(2, "0")} ${period}`
}

export function timeValue(value: string) {
  const match = value.match(/^(\d{1,2}):(\d{2})\s+(AM|PM)$/i)
  if (!match) return "08:00"
  const [, rawHours = "8", minutes = "00", rawPeriod = "AM"] = match
  const hours = Number(rawHours)
  const period = rawPeriod.toUpperCase()
  const hours24 = period === "PM" ? (hours % 12) + 12 : hours % 12
  return `${String(hours24).padStart(2, "0")}:${minutes}`
}
