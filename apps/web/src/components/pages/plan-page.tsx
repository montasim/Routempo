import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react"
import { useEffect, useMemo, useState } from "react"

import { AddRoutineDialog } from "@/components/add-routine-dialog"
import { EmptyState } from "@/components/empty-state"
import { useApp } from "@/components/app-provider"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardHeader } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import {
  routineRepeatLabel,
  routineOccursOnDate,
  timeValue,
} from "@/lib/routines"
import {
  centeredDateKeys,
  dateKeyInTimeZone,
  formatDateKey,
} from "@/lib/user-calendar"
import { cn } from "@/lib/utils"
import type { Routine } from "@/lib/types"

export function PlanPage() {
  const { routines, toggleRoutine, deleteRoutine, settings } = useApp()
  const [view, setView] = useState<"week" | "routines">("week")
  const [selectedDay, setSelectedDay] = useState(3)
  const [weekOffset, setWeekOffset] = useState(0)
  const [addOpen, setAddOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Routine | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Routine | null>(null)
  const week = useMemo(
    () => centeredDateKeys(settings?.timezone, new Date(), weekOffset),
    [settings?.timezone, weekOffset]
  )
  useEffect(() => {
    if (weekOffset !== 0) return
    const todayIndex = week.indexOf(dateKeyInTimeZone(settings?.timezone))
    if (todayIndex >= 0) setSelectedDay(todayIndex)
  }, [settings?.timezone, week, weekOffset])
  const selectedDate = week[selectedDay] ?? week[0] ?? ""
  const today = dateKeyInTimeZone(settings?.timezone)
  const selectedDateIsPast = selectedDate < today
  const scheduled = routines
    .filter(
      (routine) => routine.enabled && routineOccursOnDate(routine, selectedDate)
    )
    .sort(
      (left, right) =>
        timeValue(left.time).localeCompare(timeValue(right.time)) ||
        left.title.localeCompare(right.title)
    )

  return (
    <>
      <AddRoutineDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        defaultStartDate={selectedDateIsPast ? today : selectedDate}
      />
      <AddRoutineDialog
        open={Boolean(editTarget)}
        onOpenChange={(open) => {
          if (!open) setEditTarget(null)
        }}
        routine={editTarget}
      />
      <Dialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null)
        }}
      >
        <DialogContent>
          <DialogTitle>Delete routine?</DialogTitle>
          <DialogDescription>
            {deleteTarget
              ? `“${deleteTarget.title}” will be removed from your schedule. Existing history will stay in Logs.`
              : "This routine will be removed from your schedule."}
          </DialogDescription>
          <div className="mt-6 flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                if (deleteTarget) deleteRoutine(deleteTarget.id)
                setDeleteTarget(null)
              }}
            >
              <Trash2 />
              Delete routine
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <div className="w-full px-4 py-8 md:px-8">
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-[1.6rem] font-semibold tracking-[-.025em] md:text-[2.3375rem]">
              Plan
            </h1>
            <p className="mt-3 max-w-2xl text-base text-ink-500 dark:text-[#a7b7aa]">
              Shape a repeatable week without over-planning every day.
            </p>
          </div>
          <Button onClick={() => setAddOpen(true)}>
            <Plus />
            Add routine
          </Button>
        </div>
        {!routines.length ? (
          <div className="mt-8">
            <EmptyState
              icon={CalendarDays}
              title="Your plan is ready for a first routine"
              description="Start with one repeatable action. Pick a time you can usually keep, then adjust it after a few real days."
              action={
                <Button onClick={() => setAddOpen(true)}>
                  <Plus />
                  Add your first routine
                </Button>
              }
            />
          </div>
        ) : (
          <>
            <div
              className="mt-8 flex w-fit rounded-[10px] bg-paper-100 p-1 dark:bg-[#202821]"
              role="tablist"
            >
              <Button
                type="button"
                variant="ghost"
                onClick={() => setView("week")}
                className={cn(
                  "rounded-lg px-4 py-2 text-sm font-medium",
                  view === "week"
                    ? "bg-paper-0 shadow-sm dark:bg-[#171d18]"
                    : "text-ink-500 dark:text-[#a7b7aa]"
                )}
                role="tab"
                aria-selected={view === "week"}
              >
                Week
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setView("routines")}
                className={cn(
                  "rounded-lg px-4 py-2 text-sm font-medium",
                  view === "routines"
                    ? "bg-paper-0 shadow-sm dark:bg-[#171d18]"
                    : "text-ink-500 dark:text-[#a7b7aa]"
                )}
                role="tab"
                aria-selected={view === "routines"}
              >
                Manage routines
              </Button>
            </div>
            {view === "week" ? (
              <div className="mt-6">
                <Card className="overflow-hidden">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <h2 className="font-semibold">{formatWeekRange(week)}</h2>
                      <p className="mt-1 text-sm text-ink-500 dark:text-[#a7b7aa]">
                        Select a day to review or add what belongs there.
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Previous week"
                        onClick={() => setWeekOffset((value) => value - 1)}
                      >
                        <ChevronLeft />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Next week"
                        onClick={() => setWeekOffset((value) => value + 1)}
                      >
                        <ChevronRight />
                      </Button>
                    </div>
                  </CardHeader>
                  <div className="grid grid-cols-7 border-b border-paper-200 dark:border-[#2b352d]">
                    {week.map((date, index) => (
                      <Button
                        key={date}
                        type="button"
                        variant="ghost"
                        onClick={() => setSelectedDay(index)}
                        className={cn(
                          "grid h-auto gap-1 rounded-none border-r border-paper-200 px-1 py-4 text-center font-normal last:border-0 dark:border-[#2b352d]",
                          selectedDay === index
                            ? "bg-signal-50 dark:bg-[#26382b]"
                            : "hover:bg-paper-50 dark:hover:bg-[#202821]"
                        )}
                        aria-label={formatFullDate(date)}
                        aria-pressed={selectedDay === index}
                      >
                        <span className="text-[11px] font-semibold tracking-[.08em] text-ink-400 uppercase">
                          {formatDateKey(date, { weekday: "short" })}
                        </span>
                        <span
                          className={cn(
                            "mx-auto grid size-8 place-items-center rounded-full font-mono text-sm",
                            selectedDay === index && "bg-signal-600 text-white"
                          )}
                        >
                          {Number(date.slice(-2))}
                        </span>
                      </Button>
                    ))}
                  </div>
                  <div className="flex items-center justify-between gap-4 border-b border-paper-200 p-4 dark:border-[#2b352d]">
                    <div>
                      <h3 className="font-semibold">
                        {formatFullDate(week[selectedDay])}
                      </h3>
                      <p className="mt-1 text-sm text-ink-500 dark:text-[#a7b7aa]">
                        {scheduled.length
                          ? `${scheduled.length} ${scheduled.length === 1 ? "item" : "items"} scheduled`
                          : "No routines scheduled"}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-signal-600 dark:text-signal-300"
                      disabled={selectedDateIsPast}
                      title={
                        selectedDateIsPast
                          ? "Routines cannot be added to past days"
                          : "Add a routine to this day"
                      }
                      onClick={() => setAddOpen(true)}
                    >
                      <Plus />
                      Add one
                    </Button>
                  </div>
                  <div>
                    {scheduled.length ? (
                      scheduled.map((routine) => (
                        <div
                          key={routine.id}
                          className="flex items-center gap-4 border-b border-paper-200 p-4 last:border-0 dark:border-[#2b352d]"
                        >
                          <span className="grid size-10 place-items-center rounded-[10px] bg-paper-100 text-ink-500 dark:bg-[#202821] dark:text-[#a7b7aa]">
                            <Clock3 className="size-4" />
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold">{routine.title}</p>
                            <p className="mt-1 text-sm text-ink-500 dark:text-[#a7b7aa]">
                              {routine.time} · {routineRepeatLabel(routine)} ·{" "}
                              {routine.note}
                            </p>
                          </div>
                          <Badge variant="secondary" className="py-1.5">
                            {routine.category}
                          </Badge>
                        </div>
                      ))
                    ) : (
                      <div className="p-10 text-center">
                        <span className="mx-auto grid size-11 place-items-center rounded-[10px] bg-signal-50 text-signal-600 dark:bg-[#26382b] dark:text-signal-300">
                          <CalendarDays className="size-5" />
                        </span>
                        <h3 className="mt-4 font-semibold">
                          This day is open.
                        </h3>
                        <p className="mt-1 text-sm text-ink-500 dark:text-[#a7b7aa]">
                          Add a routine only if it helps your week.
                        </p>
                      </div>
                    )}
                  </div>
                </Card>
              </div>
            ) : (
              <div className="mt-6 grid gap-4">
                {routines.map((routine) => (
                  <Card
                    key={routine.id}
                    className="flex flex-wrap items-center gap-4 p-5 sm:flex-nowrap"
                  >
                    <span className="grid size-10 place-items-center rounded-[10px] bg-signal-50 text-signal-600 dark:bg-[#26382b] dark:text-signal-300">
                      <CalendarDays className="size-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold">{routine.title}</p>
                      <p className="mt-1 text-sm text-ink-500 dark:text-[#a7b7aa]">
                        {routineRepeatLabel(routine)} at {routine.time} ·{" "}
                        {routine.category}
                      </p>
                    </div>
                    <Switch
                      checked={routine.enabled}
                      onCheckedChange={() => toggleRoutine(routine.id)}
                      aria-label={`${routine.enabled ? "Pause" : "Resume"} ${routine.title}`}
                    />
                    <span className="h-7 w-px bg-paper-200 dark:bg-[#2b352d]" />
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Edit ${routine.title}`}
                        title="Edit routine"
                        onClick={() => setEditTarget(routine)}
                      >
                        <Pencil />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="hover:bg-missed-50 dark:text-missed-400 text-missed-600 hover:text-missed-700 dark:hover:bg-[#392723]"
                        aria-label={`Delete ${routine.title}`}
                        title="Delete routine"
                        onClick={() => setDeleteTarget(routine)}
                      >
                        <Trash2 />
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </>
  )
}

function formatWeekRange(week: string[]) {
  const first = week[0]
  const last = week[6]
  if (!first || !last) return ""
  const firstMonth = formatDateKey(first, { month: "long" })
  const lastMonth = formatDateKey(last, { month: "long" })
  const firstDay = Number(first.slice(-2))
  const lastDay = Number(last.slice(-2))
  const lastYear = last.slice(0, 4)
  return firstMonth === lastMonth
    ? `${firstMonth} ${firstDay}–${lastDay}, ${lastYear}`
    : `${firstMonth} ${firstDay}–${lastMonth} ${lastDay}, ${lastYear}`
}

function formatFullDate(date?: string) {
  return date
    ? formatDateKey(date, {
        weekday: "long",
        month: "long",
        day: "numeric",
      })
    : ""
}
