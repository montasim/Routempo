const fallbackTimeZone = "UTC"

export function validTimeZone(timeZone?: string) {
  if (!timeZone) return false
  try {
    new Intl.DateTimeFormat("en-US", { timeZone }).format()
    return true
  } catch {
    return false
  }
}

export function resolvedTimeZone(timeZone?: string) {
  return validTimeZone(timeZone) ? timeZone! : fallbackTimeZone
}

export function currentBrowserTimeZone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || fallbackTimeZone
}

export function supportedTimeZones() {
  const zones =
    typeof Intl.supportedValuesOf === "function"
      ? Intl.supportedValuesOf("timeZone")
      : [
          "Africa/Cairo",
          "America/Los_Angeles",
          "America/New_York",
          "Asia/Dhaka",
          "Asia/Kolkata",
          "Asia/Tokyo",
          "Australia/Sydney",
          "Europe/London",
          "Europe/Paris",
        ]
  return [
    fallbackTimeZone,
    ...zones.filter((zone) => zone !== fallbackTimeZone),
  ]
}

export function timeZoneOffset(timeZone: string, instant = new Date()) {
  const offset = new Intl.DateTimeFormat("en-US", {
    timeZone: resolvedTimeZone(timeZone),
    timeZoneName: "longOffset",
  })
    .formatToParts(instant)
    .find((part) => part.type === "timeZoneName")?.value
  return offset === "GMT"
    ? "UTC+00:00"
    : (offset?.replace("GMT", "UTC") ?? "UTC+00:00")
}

export function dateKeyInTimeZone(timeZone?: string, instant = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: resolvedTimeZone(timeZone),
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(instant)
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? ""
  return `${value("year")}-${value("month")}-${value("day")}`
}

export function addDays(dateKey: string, days: number) {
  const date = dateKeyAsUtcDate(dateKey)
  date.setUTCDate(date.getUTCDate() + days)
  return utcDateKey(date)
}

export function weekDateKeys(
  timeZone?: string,
  instant = new Date(),
  weekOffset = 0
) {
  const today = dateKeyAsUtcDate(dateKeyInTimeZone(timeZone, instant))
  const day = today.getUTCDay()
  today.setUTCDate(
    today.getUTCDate() - (day === 0 ? 6 : day - 1) + weekOffset * 7
  )
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today)
    date.setUTCDate(today.getUTCDate() + index)
    return utcDateKey(date)
  })
}

export function centeredDateKeys(
  timeZone?: string,
  instant = new Date(),
  windowOffset = 0
) {
  const center = dateKeyInTimeZone(timeZone, instant)
  return Array.from({ length: 7 }, (_, index) =>
    addDays(center, index - 3 + windowOffset * 7)
  )
}

export function formatDateKey(
  dateKey: string,
  options: Intl.DateTimeFormatOptions
) {
  return new Intl.DateTimeFormat("en-US", {
    ...options,
    timeZone: "UTC",
  }).format(dateKeyAsUtcDate(dateKey))
}

export function weekdayAbbreviation(dateKey: string) {
  return formatDateKey(dateKey, { weekday: "short" }).slice(0, 2)
}

function dateKeyAsUtcDate(value: string) {
  const [year = 1970, month = 1, day = 1] = value.split("-").map(Number)
  return new Date(Date.UTC(year, month - 1, day))
}

function utcDateKey(date: Date) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`
}
