import { dateKeyInTimeZone } from "@/lib/user-calendar"

const monthNumbers = new Map<string, number>([
  ["jan", 1],
  ["january", 1],
  ["feb", 2],
  ["february", 2],
  ["mar", 3],
  ["march", 3],
  ["apr", 4],
  ["april", 4],
  ["may", 5],
  ["jun", 6],
  ["june", 6],
  ["jul", 7],
  ["july", 7],
  ["aug", 8],
  ["august", 8],
  ["sep", 9],
  ["september", 9],
  ["oct", 10],
  ["october", 10],
  ["nov", 11],
  ["november", 11],
  ["dec", 12],
  ["december", 12],
] as const)

export function normalizeLogDate(value: string) {
  const normalized = value.normalize("NFKC").trim()
  const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(normalized)
  if (iso) return dateKey(Number(iso[1]), Number(iso[2]), Number(iso[3]))

  const legacy = /^([A-Za-z]+)\s+(\d{1,2}),\s*(\d{4})$/.exec(normalized)
  if (!legacy) return null
  const month = monthNumbers.get(legacy[1]!.toLocaleLowerCase("en-US"))
  if (!month) return null
  return dateKey(Number(legacy[3]), month, Number(legacy[2]))
}

export function resolveStoredLogDate(
  value: string,
  recordedAt: Date,
  timezone: string
) {
  const normalized = normalizeLogDate(value)
  return {
    date: normalized ?? dateKeyInTimeZone(timezone, recordedAt),
    repair: normalized && normalized !== value ? normalized : null,
    invalid: normalized === null,
  }
}

function dateKey(year: number, month: number, day: number) {
  if (
    !Number.isInteger(year) ||
    year < 1 ||
    !Number.isInteger(month) ||
    month < 1 ||
    month > 12 ||
    !Number.isInteger(day) ||
    day < 1 ||
    day > daysInMonth(year, month)
  )
    return null
  return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`
}

function daysInMonth(year: number, month: number) {
  if (month === 2)
    return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0) ? 29 : 28
  return [4, 6, 9, 11].includes(month) ? 30 : 31
}
