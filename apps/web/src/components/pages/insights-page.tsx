import {
  BarChart3,
  Check,
  ClipboardList,
  Plus,
  SkipForward,
  Target,
} from "lucide-react"
import { useMemo, useState } from "react"

import { AddRoutineDialog } from "@/components/add-routine-dialog"
import { EmptyState } from "@/components/empty-state"
import { useApp } from "@/components/app-provider"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import type { LogEntry, Routine } from "@/lib/types"
import { routinesForDate } from "@/lib/routines"
import { cn } from "@/lib/utils"
import {
  addDays,
  centeredDateKeys,
  dateKeyInTimeZone,
  weekdayAbbreviation,
} from "@/lib/user-calendar"

export function InsightsPage() {
  const { routines, logs, settings } = useApp()
  const [range, setRange] = useState("7")
  const [addOpen, setAddOpen] = useState(false)
  const days = Number(range)
  const visibleLogs = useMemo(
    () => logsInRange(logs, days, settings.timezone),
    [days, logs, settings.timezone]
  )

  return (
    <>
      <AddRoutineDialog open={addOpen} onOpenChange={setAddOpen} />
      <div className="w-full px-4 py-8 md:px-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-[1.6rem] font-semibold tracking-[-.025em] md:text-[2rem]">
              Insights
            </h1>
            <p className="max-w-2xl text-base text-ink-500 dark:text-[#a7b7aa]">
              Notice patterns without turning your routines into a scorecard.
            </p>
          </div>
          {(routines.length > 0 || logs.length > 0) && (
            <RangePicker range={range} onChange={setRange} />
          )}
        </div>

        {!routines.length && !logs.length ? (
          <div className="mt-8">
            <EmptyState
              icon={BarChart3}
              title="Your patterns will appear here"
              description="Add a routine and record what happens. Routempo will turn those real outcomes into a useful review."
              action={
                <Button onClick={() => setAddOpen(true)}>
                  <Plus />
                  Add your first routine
                </Button>
              }
            />
          </div>
        ) : !routines.length && !visibleLogs.length ? (
          <div className="mt-8">
            <EmptyState
              icon={BarChart3}
              title={`No outcomes in the last ${days} days`}
              description="Choose a wider range or keep recording your routines to build a current picture."
              action={
                range !== "90" ? (
                  <Button variant="outline" onClick={() => setRange("90")}>
                    Show 90 days
                  </Button>
                ) : undefined
              }
            />
          </div>
        ) : (
          <InsightReport
            logs={visibleLogs}
            days={days}
            timeZone={settings.timezone}
          />
        )}
      </div>
    </>
  )
}

function RangePicker({
  range,
  onChange,
}: {
  range: string
  onChange: (range: string) => void
}) {
  return (
    <div className="flex rounded-[10px] bg-paper-100 p-1 dark:bg-[#202821]">
      {[
        { value: "7", label: "7 days" },
        { value: "30", label: "30 days" },
        { value: "90", label: "90 days" },
      ].map(({ value, label }) => (
        <Button
          key={value}
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onChange(value)}
          className={cn(
            "rounded-lg px-3 py-2 text-xs font-medium",
            range === value
              ? "bg-paper-0 shadow-sm dark:bg-[#171d18]"
              : "text-ink-500 dark:text-[#a7b7aa]"
          )}
        >
          {label}
        </Button>
      ))}
    </div>
  )
}

function InsightReport({
  logs,
  days,
  timeZone,
}: {
  logs: LogEntry[]
  days: number
  timeZone: string
}) {
  const completed = logs.filter((entry) => entry.status === "completed").length
  const skipped = logs.filter((entry) => entry.status === "skipped").length
  const missed = logs.filter((entry) => entry.status === "missed").length
  const { routines } = useApp()
  const scheduled = scheduledRoutineCount(routines, days, timeZone)
  const total = Math.max(scheduled, logs.length)
  const rate = total ? Math.round((completed / total) * 100) : 0
  const unrecorded = Math.max(total - completed - skipped - missed, 0)
  const breakdown = categoryBreakdown(routines, logs, days, timeZone)
  const activity = recentActivity(logs, routines, timeZone)

  return (
    <>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric icon={Target} value={`${rate}%`} label="Completion rate" />
        <Metric
          icon={ClipboardList}
          value={String(total)}
          label="Routines scheduled"
        />
        <Metric icon={Check} value={String(completed)} label="Completed" />
        <Metric
          icon={SkipForward}
          value={String(skipped + missed)}
          label="Skipped or missed"
        />
      </div>

      <Card className="mt-6 overflow-hidden">
        <div className="grid lg:grid-cols-[minmax(0,1fr)_280px]">
          <div className="p-5 md:p-6">
            <h2 className="font-semibold">Recent daily completion</h2>
            <p className="mt-1 text-sm text-ink-500 dark:text-[#a7b7aa]">
              Seven days centered on today.
            </p>
            <div className="mt-8 flex h-52 items-end gap-3 border-b border-paper-200 px-2 dark:border-[#2b352d]">
              {activity.map((day) => (
                <div
                  key={day.key}
                  className="flex h-full flex-1 flex-col justify-end gap-2"
                >
                  <div
                    className="min-h-1 rounded-t-lg bg-signal-200 dark:bg-[#345b3e]"
                    style={{ height: `${Math.max(day.rate, 2)}%` }}
                    title={`${day.rate}% completed`}
                  />
                  <span className="pb-3 text-center font-mono text-[11px] text-ink-400">
                    {day.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <OutcomePie
            completed={completed}
            skipped={skipped + missed}
            unrecorded={unrecorded}
            total={total}
          />
        </div>
      </Card>

      <Card className="mt-6 overflow-hidden">
        <div className="border-b border-paper-200 p-5 dark:border-[#2b352d]">
          <h2 className="font-semibold">Category breakdown</h2>
          <p className="mt-1 text-sm text-ink-500 dark:text-[#a7b7aa]">
            Completion by category from recorded outcomes in this range.
          </p>
        </div>
        {breakdown.map((category) => (
          <div
            key={category.name}
            className="grid gap-3 border-b border-paper-200 p-4 last:border-0 sm:grid-cols-[1fr_100px_2fr_60px] sm:items-center dark:border-[#2b352d]"
          >
            <p className="text-sm font-semibold">{category.name}</p>
            <span className="text-xs text-ink-500 dark:text-[#a7b7aa]">
              {category.completed} of {category.total}
            </span>
            <div className="h-2 overflow-hidden rounded-full bg-paper-100 dark:bg-[#202821]">
              <div
                className="h-full rounded-full bg-completed-500"
                style={{ width: `${category.rate}%` }}
              />
            </div>
            <span className="font-mono text-sm font-medium">
              {category.rate}%
            </span>
          </div>
        ))}
      </Card>
    </>
  )
}

function Metric({
  icon: Icon,
  value,
  label,
}: {
  icon: typeof Target
  value: string
  label: string
}) {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <span className="grid size-9 place-items-center rounded-[10px] bg-paper-100 text-ink-500 dark:bg-[#202821] dark:text-[#a7b7aa]">
          <Icon className="size-4" />
        </span>
        <span className="font-mono text-2xl font-medium">{value}</span>
      </div>
      <p className="mt-4 text-sm font-semibold">{label}</p>
    </Card>
  )
}

function OutcomePie({
  completed,
  skipped,
  unrecorded,
  total,
}: {
  completed: number
  skipped: number
  unrecorded: number
  total: number
}) {
  const completedEnd = total ? (completed / total) * 100 : 0
  const skippedEnd = total ? ((completed + skipped) / total) * 100 : 0
  const background = `conic-gradient(var(--color-completed-500) 0 ${completedEnd}%, var(--color-skipped-500) ${completedEnd}% ${skippedEnd}%, var(--color-paper-200) ${skippedEnd}% 100%)`
  const items = [
    { label: "Completed", value: completed, color: "bg-completed-500" },
    { label: "Skipped / missed", value: skipped, color: "bg-skipped-500" },
    { label: "Not recorded", value: unrecorded, color: "bg-paper-200" },
  ]

  return (
    <div className="border-t border-paper-200 p-5 md:p-6 lg:border-t-0 lg:border-l dark:border-[#2b352d]">
      <h3 className="font-semibold">Outcome distribution</h3>
      <p className="mt-1 text-sm text-ink-500 dark:text-[#a7b7aa]">
        Across {total} scheduled routines.
      </p>
      <div className="mt-6 flex items-center gap-6 lg:flex-col">
        <div
          role="img"
          aria-label={`${completed} completed, ${skipped} skipped or missed, ${unrecorded} not recorded`}
          className="aspect-square w-32 shrink-0 rounded-full shadow-[inset_0_0_0_1px_rgba(0,0,0,.04)]"
          style={{ background }}
        />
        <div className="grid flex-1 gap-3 self-stretch">
          {items.map((item) => (
            <div
              key={item.label}
              className="flex items-center justify-between gap-3 text-xs"
            >
              <span className="flex items-center gap-2 text-ink-500 dark:text-[#a7b7aa]">
                <span className={`size-2.5 rounded-full ${item.color}`} />
                {item.label}
              </span>
              <span className="font-mono font-medium">{item.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function logsInRange(logs: LogEntry[], days: number, timeZone: string) {
  const today = dateKeyInTimeZone(timeZone)
  const start = addDays(today, -days + 1)
  return logs.filter((entry) => {
    const recorded = new Date(entry.recordedAt)
    return (
      !Number.isNaN(recorded.getTime()) &&
      dateKeyInTimeZone(timeZone, recorded) >= start &&
      dateKeyInTimeZone(timeZone, recorded) <= today
    )
  })
}

function recentActivity(
  logs: LogEntry[],
  routines: Routine[],
  timeZone: string
) {
  return centeredDateKeys(timeZone).map((key) => {
    const events = logs.filter(
      (entry) => dateKeyInTimeZone(timeZone, new Date(entry.recordedAt)) === key
    )
    const completed = events.filter(
      (entry) => entry.status === "completed"
    ).length
    const scheduled = routinesForDate(routines, key).length
    const total = Math.max(scheduled, events.length)
    return {
      key,
      label: weekdayAbbreviation(key),
      rate: total ? Math.round((completed / total) * 100) : 0,
    }
  })
}

function scheduledRoutineCount(
  routines: Routine[],
  days: number,
  timeZone: string,
  instant = new Date()
) {
  const today = dateKeyInTimeZone(timeZone, instant)
  const start = addDays(today, -days + 1)
  let total = 0
  for (let index = 0; index < days; index += 1) {
    total += routinesForDate(routines, addDays(start, index)).length
  }
  return total
}

export function categoryBreakdown(
  routines: Routine[],
  logs: LogEntry[],
  days: number,
  timeZone: string,
  instant = new Date()
) {
  const groups = new Map<
    string,
    { name: string; completed: number; outcomes: number; scheduled: number }
  >()
  const today = dateKeyInTimeZone(timeZone, instant)
  const start = addDays(today, -days + 1)
  for (let index = 0; index < days; index += 1) {
    for (const routine of routinesForDate(routines, addDays(start, index))) {
      const group = groups.get(routine.category) ?? {
        name: routine.category,
        completed: 0,
        outcomes: 0,
        scheduled: 0,
      }
      group.scheduled += 1
      groups.set(routine.category, group)
    }
  }
  for (const entry of logs) {
    const group = groups.get(entry.category) ?? {
      name: entry.category,
      completed: 0,
      outcomes: 0,
      scheduled: 0,
    }
    group.outcomes += 1
    if (entry.status === "completed") group.completed += 1
    groups.set(entry.category, group)
  }
  return [...groups.values()]
    .map((group) => {
      const total = Math.max(group.scheduled, group.outcomes)
      return {
        name: group.name,
        completed: group.completed,
        total,
        rate: total ? Math.round((group.completed / total) * 100) : 0,
      }
    })
    .sort(
      (left, right) =>
        right.total - left.total || left.name.localeCompare(right.name)
    )
}
