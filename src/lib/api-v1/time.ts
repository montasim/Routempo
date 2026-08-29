export function toApiTime(value: string) {
  if (/^([01]\d|2[0-3]):[0-5]\d$/.test(value)) return value
  const match = value.match(/^(\d{1,2}):([0-5]\d)\s+(AM|PM)$/i)
  if (!match) return value
  const hours = Number(match[1])
  const period = match[3]?.toUpperCase()
  const hour24 = period === "PM" ? (hours % 12) + 12 : hours % 12
  return `${String(hour24).padStart(2, "0")}:${match[2]}`
}

export function toStoredTime(value: string) {
  const normalized = toApiTime(value)
  const [hours = 0, minutes = 0] = normalized.split(":").map(Number)
  const period = hours >= 12 ? "PM" : "AM"
  return `${hours % 12 || 12}:${String(minutes).padStart(2, "0")} ${period}`
}

export function timeInZone(timezone: string, date: Date) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: timezone,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date)
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "00"
  return `${value("hour")}:${value("minute")}`
}

export function variance(scheduled: string, actual: string) {
  const minutes = (value: string) => {
    const [hour = 0, minute = 0] = value.split(":").map(Number)
    return hour * 60 + minute
  }
  const difference = minutes(actual) - minutes(scheduled)
  if (!difference) return "On time"
  return difference > 0
    ? `${difference} min late`
    : `${Math.abs(difference)} min early`
}
