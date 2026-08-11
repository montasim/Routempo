export type RoutineStatus = "pending" | "completed" | "skipped"
export type RoutineRepeat = "none" | "daily" | "weekly" | "monthly" | "yearly"
export type PageName = "today" | "plan" | "insights" | "logs" | "settings"

export type Routine = {
  id: string
  time: string
  title: string
  note: string
  category: string
  startDate: string
  repeat: RoutineRepeat
  repeatOnDay?: number
  repeatOnDays?: number[]
  repeatOnDate?: number
  repeatOnMonth?: number
  endDate?: string
  status: RoutineStatus
  enabled: boolean
}

export type RoutineDraft = Pick<
  Routine,
  | "time"
  | "title"
  | "note"
  | "category"
  | "startDate"
  | "repeat"
  | "repeatOnDay"
  | "repeatOnDays"
  | "repeatOnDate"
  | "repeatOnMonth"
  | "endDate"
>

export type Settings = {
  name: string
  timezone: string
  reminder: string
  notifications: boolean
  weeklySummary: boolean
}

export type LogEntry = {
  id: string
  date: string
  eventTime: string
  title: string
  category: string
  scheduled: string
  actual: string
  variance: string
  status: Exclude<RoutineStatus, "pending"> | "missed"
  recordedAt: string
  actor: string
  source: string
  timezone: string
  snapshot: string
}

export type LogDraft = Pick<
  LogEntry,
  | "eventTime"
  | "title"
  | "category"
  | "scheduled"
  | "actual"
  | "status"
  | "snapshot"
> & { date: string }

export type AppData = {
  routines: Routine[]
  categories: string[]
  settings: Settings
  logs: LogEntry[]
}

export type AppMutation =
  | { action: "complete" | "skip" | "toggle"; id: string }
  | { action: "add"; routine: RoutineDraft }
  | { action: "update"; id: string; routine: RoutineDraft }
  | { action: "delete"; id: string }
  | { action: "category-add"; name: string }
  | { action: "category-rename"; name: string; nextName: string }
  | { action: "category-delete"; name: string }
  | { action: "log-add"; log: LogDraft }
  | { action: "log-update"; id: string; log: LogDraft }
  | { action: "log-delete"; id: string }
  | { action: "settings"; settings: Settings }
