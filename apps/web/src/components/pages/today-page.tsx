import {
  ArrowRight,
  CalendarDays,
  Check,
  Clock3,
  Plus,
  SkipForward,
  Sparkles,
} from "lucide-react"
import { useState } from "react"
import { Link } from "@tanstack/react-router"

import { AddRoutineDialog } from "@/components/add-routine-dialog"
import { EmptyState } from "@/components/empty-state"
import { useApp } from "@/components/app-provider"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog"
import { routinesForDate } from "@/lib/routines"
import { greetingForTimeZone } from "@/lib/greeting"
import {
  dateKeyInTimeZone,
  weekdayAbbreviation,
  weekDateKeys,
} from "@/lib/user-calendar"
import type { LogEntry, Routine } from "@/lib/types"

export function TodayPage() {
  const { routines, logs, completeRoutine, skipRoutine, settings } = useApp()
  const [addOpen, setAddOpen] = useState(false)
  const [skipTarget, setSkipTarget] = useState<Routine | null>(null)
  const routinesToday = routinesForDate(
    routines,
    dateKeyInTimeZone(settings.timezone)
  )
  const pending = routinesToday.filter(
    (routine) => routine.status === "pending"
  )
  const next = pending[0]

  return (
    <>
      <AddRoutineDialog open={addOpen} onOpenChange={setAddOpen} />
      <Dialog
        open={Boolean(skipTarget)}
        onOpenChange={(open) => !open && setSkipTarget(null)}
      >
        <DialogContent>
          <DialogTitle>Skip this routine today?</DialogTitle>
          <DialogDescription>
            {skipTarget?.title} will stay in your plan. Today’s occurrence will
            be recorded as skipped.
          </DialogDescription>
          <div className="mt-6 flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setSkipTarget(null)}>
              Keep it
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                if (skipTarget) skipRoutine(skipTarget.id)
                setSkipTarget(null)
              }}
            >
              Skip today
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="w-full px-4 py-8 md:px-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-ink-500 dark:text-[#a7b7aa]">
              {greetingForTimeZone(settings.timezone, settings.name)}
            </p>
            <h1 className="mt-2 text-[1.6rem] font-semibold tracking-[-.02em] md:text-[1.9125rem]">
              {routines.length
                ? "Here is what needs your attention."
                : "Build a rhythm that fits your day."}
            </h1>
          </div>
          <Button
            className="self-start sm:self-auto"
            onClick={() => setAddOpen(true)}
          >
            <Plus />
            Add routine
          </Button>
        </div>

        {!routines.length ? (
          <div className="mt-8">
            <EmptyState
              icon={CalendarDays}
              title="Start with one routine"
              description="Choose one useful thing and give it a realistic time. You can add more after the first one feels right."
              action={
                <Button onClick={() => setAddOpen(true)}>
                  <Plus />
                  Add your first routine
                </Button>
              }
            />
          </div>
        ) : !routinesToday.length ? (
          <div className="mt-8">
            <EmptyState
              icon={CalendarDays}
              title="Nothing is planned for today"
              description="Your routines are safe in the plan. Add something for today only if it would make the day easier."
              action={
                <Button onClick={() => setAddOpen(true)}>
                  <Plus />
                  Add for today
                </Button>
              }
            />
          </div>
        ) : (
          <>
            {next ? (
              <section className="mt-8 overflow-hidden rounded-[14px] bg-signal-800 text-white shadow-soft dark:bg-[#dfeee2] dark:text-[#17261c]">
                <div className="grid gap-7 p-6 md:grid-cols-[1fr_auto] md:items-end md:p-8">
                  <div>
                    <div className="flex items-center gap-2 font-mono text-sm font-medium opacity-70">
                      <Clock3 className="size-4" />
                      Up next at {next.time}
                    </div>
                    <h2 className="mt-4 text-3xl font-semibold tracking-[-.03em] md:text-4xl">
                      {next.title}
                    </h2>
                    {next.note && (
                      <p className="mt-2 text-sm opacity-70">{next.note}</p>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      className="border-current/25 bg-transparent text-current hover:bg-current/10"
                      onClick={() => setSkipTarget(next)}
                    >
                      Skip today
                    </Button>
                    <Button onClick={() => completeRoutine(next.id)}>
                      <Check />
                      Mark complete
                    </Button>
                  </div>
                </div>
              </section>
            ) : (
              <AllDone />
            )}

            <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,7fr)_minmax(0,3fr)]">
              <section>
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-lg font-semibold">Later today</h2>
                  <Button
                    asChild
                    variant="ghost"
                    size="sm"
                    className="text-signal-600 dark:text-signal-300"
                  >
                    <Link to="/plan">View plans</Link>
                  </Button>
                </div>
                <Card className="overflow-hidden">
                  {pending.slice(1).length ? (
                    pending
                      .slice(1)
                      .map((routine) => (
                        <RoutineRow
                          key={routine.id}
                          routine={routine}
                          onComplete={completeRoutine}
                          onSkip={setSkipTarget}
                        />
                      ))
                  ) : (
                    <p className="p-6 text-sm text-ink-500 dark:text-[#a7b7aa]">
                      No other routines need attention today.
                    </p>
                  )}
                </Card>
              </section>
              <WeekSummary
                routines={routines}
                logs={logs}
                timeZone={settings.timezone}
              />
            </div>
          </>
        )}
      </div>
    </>
  )
}

function WeekSummary({
  routines,
  logs,
  timeZone,
}: {
  routines: Routine[]
  logs: LogEntry[]
  timeZone: string
}) {
  const week = weekDateKeys(timeZone)
  const today = dateKeyInTimeZone(timeZone)
  const todayRoutines = routinesForDate(routines, today)
  const completedToday = todayRoutines.filter(
    (routine) => routine.status === "completed"
  ).length
  const events = logs.filter((entry) => {
    const recorded = new Date(entry.recordedAt)
    return (
      !Number.isNaN(recorded.getTime()) &&
      week.includes(dateKeyInTimeZone(timeZone, recorded))
    )
  })
  const completedEvents = events.filter((entry) => entry.status === "completed")
  const rate = todayRoutines.length
    ? Math.round((completedToday / todayRoutines.length) * 100)
    : null

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold">Your week</p>
          <p className="mt-1 text-sm text-ink-500 dark:text-[#a7b7aa]">
            {todayRoutines.length
              ? `${completedToday} of ${todayRoutines.length} tasks completed today.`
              : "No routines scheduled today."}
          </p>
        </div>
        {rate !== null && (
          <span className="font-mono text-2xl font-medium text-completed-600">
            {rate}%
          </span>
        )}
      </div>
      <div className="mt-6 grid grid-cols-7 gap-2 text-center">
        {week.map((key) => {
          const dayEvents = events.filter(
            (entry) =>
              dateKeyInTimeZone(timeZone, new Date(entry.recordedAt)) === key
          )
          const scheduled = routinesForDate(routines, key).length
          const completed =
            key === today
              ? completedToday
              : dayEvents.filter((entry) => entry.status === "completed").length
          const total = Math.max(scheduled, dayEvents.length)
          const done = total > 0 && completed >= total
          return (
            <div key={key}>
              <span className="font-mono text-[11px] text-ink-400">
                {weekdayAbbreviation(key)}
              </span>
              <span
                className={`mx-auto mt-2 grid size-9 place-items-center rounded-[10px] text-xs ${done ? "bg-completed-100 text-completed-600" : "bg-paper-100 text-ink-400 dark:bg-[#202821]"}`}
              >
                {done ? (
                  <Check className="size-4" />
                ) : completed > 0 ? (
                  <span className="font-mono text-[10px]">
                    {completed}/{total}
                  </span>
                ) : null}
              </span>
            </div>
          )
        })}
      </div>
      <Button
        asChild
        variant="ghost"
        size="sm"
        className="mt-5 px-0 text-signal-600 dark:text-signal-300"
      >
        <Link to={events.length ? "/insights" : "/plan"}>
          {events.length ? "Review your patterns" : "Shape your first week"}
          <ArrowRight />
        </Link>
      </Button>
    </Card>
  )
}

function RoutineRow({
  routine,
  onComplete,
  onSkip,
}: {
  routine: Routine
  onComplete: (id: string) => void
  onSkip: (routine: Routine) => void
}) {
  return (
    <div className="flex items-center gap-4 border-b border-paper-200 p-4 last:border-0 dark:border-[#2b352d]">
      <span className="w-[72px] shrink-0 font-mono text-sm text-ink-500 dark:text-[#a7b7aa]">
        {routine.time}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold">
          {routine.title}
        </span>
        {routine.note && (
          <span className="mt-0.5 block text-xs text-ink-500 dark:text-[#a7b7aa]">
            {routine.note}
          </span>
        )}
      </span>
      <span className="flex shrink-0 items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          className="size-9 text-ink-400 hover:border-skipped-500 hover:bg-skipped-100 hover:text-skipped-600 dark:hover:bg-[#3b2d18]"
          onClick={() => onSkip(routine)}
          aria-label={`Skip ${routine.title} today`}
          title="Skip today"
        >
          <SkipForward />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="size-9 text-ink-400 hover:border-completed-500 hover:bg-completed-100 hover:text-completed-600"
          onClick={() => onComplete(routine.id)}
          aria-label={`Mark ${routine.title} complete`}
          title="Mark complete"
        >
          <Check />
        </Button>
      </span>
    </div>
  )
}

function AllDone() {
  return (
    <section className="mt-8">
      <div className="rounded-[14px] bg-completed-100 p-8 text-completed-600 dark:bg-[#173528] dark:text-[#55ce8d]">
        <div className="grid size-12 place-items-center rounded-[14px] bg-white/70 dark:bg-[#202821]">
          <Sparkles className="size-6" />
        </div>
        <h2 className="mt-5 text-3xl font-semibold tracking-[-.03em]">
          You are done for today.
        </h2>
        <p className="mt-2 text-sm opacity-75">
          Everything scheduled has been recorded.
        </p>
      </div>
    </section>
  )
}
