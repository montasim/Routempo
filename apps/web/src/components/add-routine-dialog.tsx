import { CalendarDays, Check, ChevronsUpDown, Clock3, Plus } from "lucide-react"
import { useEffect, useRef, useState } from "react"

import { useApp } from "@/components/app-provider"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  dateKey,
  displayTime,
  monthName,
  parseDateKey,
  timeValue,
  weekdayName,
} from "@/lib/routines"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import type { Routine, RoutineDraft, RoutineRepeat } from "@/lib/types"
import { cn } from "@/lib/utils"
import { dateKeyInTimeZone } from "@/lib/user-calendar"

export function AddRoutineDialog({
  open,
  onOpenChange,
  defaultStartDate,
  routine,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultStartDate?: string
  routine?: Routine | null
}) {
  const { addRoutine, updateRoutine, categories, settings } = useApp()
  const today = dateKeyInTimeZone(settings?.timezone)
  const requestedStartDate = routine?.startDate ?? defaultStartDate ?? today
  const initialStartDate =
    !routine && requestedStartDate < today ? today : requestedStartDate
  const [title, setTitle] = useState(routine?.title ?? "")
  const [startDate, setStartDate] = useState(initialStartDate)
  const [time, setTime] = useState(routine ? timeValue(routine.time) : "08:00")
  const [repeat, setRepeat] = useState<RoutineRepeat>(routine?.repeat ?? "none")
  const [repeatOnDay, setRepeatOnDay] = useState(
    () => routine?.repeatOnDay ?? parseDateKey(initialStartDate).getDay()
  )
  const [repeatOnDays, setRepeatOnDays] = useState<number[]>(() =>
    routine?.repeatOnDays?.length
      ? routine.repeatOnDays
      : [routine?.repeatOnDay ?? parseDateKey(initialStartDate).getDay()]
  )
  const [repeatOnDate, setRepeatOnDate] = useState(
    () => routine?.repeatOnDate ?? parseDateKey(initialStartDate).getDate()
  )
  const [repeatOnMonth, setRepeatOnMonth] = useState(
    () =>
      routine?.repeatOnMonth ?? parseDateKey(initialStartDate).getMonth() + 1
  )
  const [endDate, setEndDate] = useState(routine?.endDate ?? "")
  const [note, setNote] = useState(routine?.note ?? "10 minutes")
  const [category, setCategory] = useState(
    routine?.category ?? categories[0] ?? ""
  )
  const editing = Boolean(routine)

  useEffect(() => {
    if (!open) return
    const requestedDate = routine?.startDate ?? defaultStartDate ?? today
    const nextStartDate =
      !routine && requestedDate < today ? today : requestedDate
    const initialDate = parseDateKey(nextStartDate)
    setTitle(routine?.title ?? "")
    setStartDate(nextStartDate)
    setTime(routine ? timeValue(routine.time) : "08:00")
    setRepeat(routine?.repeat ?? "none")
    setRepeatOnDay(routine?.repeatOnDay ?? initialDate.getDay())
    setRepeatOnDays(
      routine?.repeatOnDays?.length
        ? routine.repeatOnDays
        : [routine?.repeatOnDay ?? initialDate.getDay()]
    )
    setRepeatOnDate(routine?.repeatOnDate ?? initialDate.getDate())
    setRepeatOnMonth(routine?.repeatOnMonth ?? initialDate.getMonth() + 1)
    setEndDate(routine?.endDate ?? "")
    setNote(routine?.note ?? "10 minutes")
    setCategory(routine?.category ?? categories[0] ?? "")
  }, [defaultStartDate, open, routine, today])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] max-w-xl overflow-y-auto">
        <DialogTitle className="text-2xl font-semibold tracking-[-.025em]">
          {editing ? "Edit routine" : "Add a routine"}
        </DialogTitle>
        <DialogDescription>
          {editing
            ? "Adjust its schedule, category, or cue."
            : "Schedule it once or make it part of your rhythm."}
        </DialogDescription>
        <form
          className="mt-6 grid gap-4"
          onSubmit={(event) => {
            event.preventDefault()
            if (
              !title.trim() ||
              !category.trim() ||
              (!routine && startDate < today)
            )
              return
            const draft: RoutineDraft = {
              title: title.trim(),
              startDate,
              time: displayTime(time),
              repeat,
              repeatOnDay: repeat === "weekly" ? repeatOnDays[0] : undefined,
              repeatOnDays: repeat === "weekly" ? repeatOnDays : undefined,
              repeatOnDate:
                repeat === "monthly" || repeat === "yearly"
                  ? repeatOnDate
                  : undefined,
              repeatOnMonth: repeat === "yearly" ? repeatOnMonth : undefined,
              endDate: repeat === "none" || !endDate ? undefined : endDate,
              note: note.trim(),
              category: category.trim(),
            }
            if (routine) updateRoutine(routine.id, draft)
            else addRoutine(draft)
            onOpenChange(false)
          }}
        >
          <Field label="Routine name" htmlFor="routine-title" required>
            <Input
              id="routine-title"
              autoFocus
              required
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Drink a glass of water"
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Start date" htmlFor="routine-start-date" required>
              <DatePicker
                id="routine-start-date"
                required
                value={startDate}
                minDate={
                  routine && routine.startDate < today
                    ? routine.startDate
                    : today
                }
                onChange={(next) => {
                  setStartDate(next)
                  const selectedDate = parseDateKey(next)
                  setRepeatOnDay(selectedDate.getDay())
                  setRepeatOnDays([selectedDate.getDay()])
                  setRepeatOnDate(selectedDate.getDate())
                  setRepeatOnMonth(selectedDate.getMonth() + 1)
                  if (endDate && endDate < next) setEndDate("")
                }}
              />
            </Field>
            <Field label="Time" htmlFor="routine-time" required>
              <TimePicker
                id="routine-time"
                value={time}
                onChange={setTime}
                required
              />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Repeat" htmlFor="routine-repeat" required>
              <FormSelect
                id="routine-repeat"
                value={repeat}
                onValueChange={(next) => {
                  setRepeat(next as RoutineRepeat)
                  if (next === "none") setEndDate("")
                }}
                options={[
                  { value: "none", label: "Does not repeat" },
                  { value: "daily", label: "Every day" },
                  { value: "weekly", label: "Weekly" },
                  { value: "monthly", label: "Monthly" },
                  { value: "yearly", label: "Yearly" },
                ]}
                required
              />
            </Field>
            {repeat !== "none" && (
              <Field
                htmlFor="routine-end-date"
                label={
                  <>
                    Ends{" "}
                    <span className="font-normal text-ink-400">(optional)</span>
                  </>
                }
              >
                <DatePicker
                  id="routine-end-date"
                  value={endDate}
                  minDate={startDate}
                  onChange={setEndDate}
                  clearable
                />
              </Field>
            )}
          </div>

          {repeat === "weekly" && (
            <WeeklyDayPicker
              value={repeatOnDays}
              onChange={(days) => {
                setRepeatOnDays(days)
                setRepeatOnDay(days[0] ?? repeatOnDay)
              }}
            />
          )}

          {repeat === "monthly" && (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Day of month"
                htmlFor="routine-repeat-date"
                required
              >
                <FormSelect
                  id="routine-repeat-date"
                  value={String(repeatOnDate)}
                  onValueChange={(value) => setRepeatOnDate(Number(value))}
                  options={numberOptions(31)}
                  required
                />
              </Field>
            </div>
          )}

          {repeat === "yearly" && (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Month" htmlFor="routine-repeat-month" required>
                <FormSelect
                  id="routine-repeat-month"
                  value={String(repeatOnMonth)}
                  onValueChange={(value) => {
                    const month = Number(value)
                    setRepeatOnMonth(month)
                    setRepeatOnDate((day) => Math.min(day, daysInMonth(month)))
                  }}
                  options={Array.from({ length: 12 }, (_, index) => ({
                    value: String(index + 1),
                    label: monthName(index + 1),
                  }))}
                  required
                />
              </Field>
              <Field label="Date" htmlFor="routine-repeat-date" required>
                <FormSelect
                  id="routine-repeat-date"
                  value={String(repeatOnDate)}
                  onValueChange={(value) => setRepeatOnDate(Number(value))}
                  options={numberOptions(daysInMonth(repeatOnMonth))}
                  required
                />
              </Field>
            </div>
          )}

          <Field label="Category" htmlFor="routine-category" required>
            <CategoryCombobox
              categories={categories}
              value={category}
              onChange={setCategory}
              required
            />
            <span className="text-xs font-normal text-ink-500 dark:text-[#a7b7aa]">
              Choose an existing category or type to create one.
            </span>
          </Field>

          <Field label="Note" htmlFor="routine-note">
            <Textarea
              id="routine-note"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Add a useful cue"
              maxLength={160}
              rows={3}
            />
          </Field>

          <div className="mt-2 flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!routine && startDate < today}>
              {editing ? <Check /> : <Plus />}
              {editing ? "Save changes" : "Add routine"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function Field({
  label,
  htmlFor,
  children,
  required = false,
}: {
  label: React.ReactNode
  htmlFor: string
  children: React.ReactNode
  required?: boolean
}) {
  return (
    <div className="grid gap-2 text-sm font-medium">
      <Label htmlFor={htmlFor}>
        {label}
        {required && (
          <span aria-hidden="true" className="ml-1 text-missed-600">
            *
          </span>
        )}
      </Label>
      {children}
    </div>
  )
}

function WeeklyDayPicker({
  value,
  onChange,
}: {
  value: number[]
  onChange: (days: number[]) => void
}) {
  const selectedDays = new Set(value)

  return (
    <Field label="Days of week" htmlFor="days-of-week" required>
      <div className="grid grid-cols-7 gap-1.5">
        {Array.from({ length: 7 }, (_, day) => {
          const selected = selectedDays.has(day)
          return (
            <Button
              key={day}
              type="button"
              variant="outline"
              size="sm"
              aria-label={weekdayName(day)}
              aria-pressed={selected}
              aria-disabled={selected && value.length === 1}
              className={cn(
                "h-10 px-0 font-mono text-xs",
                selected &&
                  "dark:border-signal-400 border-signal-600 bg-signal-100 text-signal-700 hover:bg-signal-200 dark:bg-[#26382b] dark:text-signal-300"
              )}
              onClick={() => {
                if (selected && value.length === 1) return
                const next = selected
                  ? value.filter((item) => item !== day)
                  : [...value, day]
                onChange(next.sort((a, b) => a - b))
              }}
            >
              {weekdayName(day).slice(0, 2)}
            </Button>
          )
        })}
      </div>
    </Field>
  )
}

function FormSelect({
  id,
  value,
  onValueChange,
  options,
  required = false,
}: {
  id: string
  value: string
  onValueChange: (value: string) => void
  options: Array<{ value: string; label: string }>
  required?: boolean
}) {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger id={id} aria-required={required}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

function DatePicker({
  id,
  value,
  minDate,
  onChange,
  clearable = false,
  required = false,
}: {
  id: string
  value: string
  minDate: string
  onChange: (value: string) => void
  clearable?: boolean
  required?: boolean
}) {
  const [open, setOpen] = useState(false)
  const selected = value ? parseDateKey(value) : undefined
  const earliest = parseDateKey(minDate)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          aria-required={required}
          className={cn(
            "h-11 w-full justify-between px-3 font-normal",
            !value && "text-ink-400"
          )}
        >
          <span>{value ? formatDateValue(value) : "Choose a date"}</span>
          <CalendarDays className="text-ink-500 dark:text-[#a7b7aa]" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-0">
        <Calendar
          mode="single"
          defaultMonth={selected ?? earliest}
          selected={selected}
          disabled={{ before: earliest }}
          onSelect={(next) => {
            if (!next) return
            onChange(dateKey(next))
            setOpen(false)
          }}
        />
        {clearable && value && (
          <div className="border-t border-paper-200 p-2 dark:border-[#3a463d]">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="w-full"
              onClick={() => {
                onChange("")
                setOpen(false)
              }}
            >
              Clear date
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}

function TimePicker({
  id,
  value,
  onChange,
  required = false,
}: {
  id: string
  value: string
  onChange: (value: string) => void
  required?: boolean
}) {
  const [open, setOpen] = useState(false)
  const [rawHours = 8, rawMinutes = 0] = value.split(":").map(Number)
  const period = rawHours >= 12 ? "PM" : "AM"
  const hour = rawHours % 12 || 12

  const update = (nextHour: number, nextMinute: number, nextPeriod: string) => {
    const hours24 = nextPeriod === "PM" ? (nextHour % 12) + 12 : nextHour % 12
    onChange(
      `${String(hours24).padStart(2, "0")}:${String(nextMinute).padStart(2, "0")}`
    )
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          aria-required={required}
          className="h-11 w-full justify-between px-3 font-normal"
        >
          <span>{displayTime(value)}</span>
          <Clock3 className="text-ink-500 dark:text-[#a7b7aa]" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-[var(--radix-popover-trigger-width)] min-w-64 p-0"
      >
        <div className="grid grid-cols-3 gap-1 p-2">
          <TimeColumn
            label="Hour"
            values={Array.from({ length: 12 }, (_, index) => index + 1)}
            selected={hour}
            format={(item) => String(item).padStart(2, "0")}
            onSelect={(item) => update(item, rawMinutes, period)}
          />
          <TimeColumn
            label="Minute"
            values={Array.from({ length: 60 }, (_, index) => index)}
            selected={rawMinutes}
            format={(item) => String(item).padStart(2, "0")}
            onSelect={(item) => update(hour, item, period)}
          />
          <TimeColumn
            label="Period"
            values={["AM", "PM"]}
            selected={period}
            format={(item) => item}
            onSelect={(item) => update(hour, rawMinutes, item)}
          />
        </div>
        <div className="border-t border-paper-200 p-2 dark:border-[#3a463d]">
          <Button
            type="button"
            size="sm"
            className="w-full"
            onClick={() => setOpen(false)}
          >
            Done
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}

function TimeColumn<T extends string | number>({
  label,
  values,
  selected,
  format,
  onSelect,
}: {
  label: string
  values: T[]
  selected: T
  format: (value: T) => string
  onSelect: (value: T) => void
}) {
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    listRef.current
      ?.querySelector('[aria-selected="true"]')
      ?.scrollIntoView({ block: "center" })
  }, [selected])

  return (
    <div>
      <p className="px-2 py-1.5 text-center text-[11px] font-semibold tracking-[.06em] text-ink-400 uppercase">
        {label}
      </p>
      <div
        ref={listRef}
        role="listbox"
        aria-label={label}
        className="max-h-44 space-y-0.5 overflow-y-auto"
      >
        {values.map((item) => (
          <Button
            key={item}
            type="button"
            variant="ghost"
            size="sm"
            role="option"
            aria-selected={selected === item}
            className={cn(
              "grid h-9 w-full place-items-center rounded-lg p-0 font-mono text-sm outline-none hover:bg-paper-100 focus-visible:ring-3 focus-visible:ring-signal-600/20 dark:hover:bg-[#2b352d]",
              selected === item &&
                "bg-signal-100 font-medium text-signal-700 hover:bg-signal-200 dark:bg-[#26382b] dark:text-signal-300 dark:hover:bg-[#315039]"
            )}
            onClick={() => onSelect(item)}
          >
            {format(item)}
          </Button>
        ))}
      </div>
    </div>
  )
}

function formatDateValue(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
  }).format(parseDateKey(value))
}

function numberOptions(count: number) {
  return Array.from({ length: count }, (_, index) => ({
    value: String(index + 1),
    label: String(index + 1),
  }))
}

function daysInMonth(month: number) {
  return new Date(2000, month, 0).getDate()
}

function CategoryCombobox({
  categories,
  value,
  onChange,
  required = false,
}: {
  categories: string[]
  value: string
  onChange: (category: string) => void
  required?: boolean
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const normalized = query.trim().toLocaleLowerCase()
  const matches = categories.filter((category) =>
    category.toLocaleLowerCase().includes(normalized)
  )
  const exactMatch = categories.some(
    (category) => category.toLocaleLowerCase() === normalized
  )

  const choose = (category: string) => {
    onChange(category)
    setQuery("")
    setOpen(false)
  }

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) setQuery("")
      }}
    >
      <PopoverTrigger asChild>
        <Button
          id="routine-category"
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-required={required}
          className="h-11 w-full justify-between px-3 font-normal"
        >
          <span className="truncate">{value || "Select a category"}</span>
          <ChevronsUpDown className="text-ink-400" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-[var(--radix-popover-trigger-width)] p-0"
      >
        <Command shouldFilter={false}>
          <CommandInput
            autoFocus
            value={query}
            onValueChange={setQuery}
            placeholder="Search or add a category…"
          />
          <CommandList>
            {!matches.length && !normalized && (
              <CommandEmpty>No categories found.</CommandEmpty>
            )}
            {matches.map((category) => (
              <CommandItem
                key={category}
                value={category}
                className={cn(
                  value === category &&
                    "bg-signal-100 font-medium text-signal-700 data-[selected=true]:bg-signal-100 dark:bg-[#26382b] dark:text-signal-300 dark:data-[selected=true]:bg-[#26382b]"
                )}
                onSelect={() => choose(category)}
              >
                <Check
                  className={cn(
                    "text-signal-700 dark:text-signal-300",
                    value === category ? "opacity-100" : "opacity-0"
                  )}
                />
                {category}
              </CommandItem>
            ))}
            {normalized && !exactMatch && (
              <>
                <CommandSeparator />
                <CommandItem
                  value={`create-${query.trim()}`}
                  className="font-medium text-signal-700 dark:text-signal-300"
                  onSelect={() => choose(query.trim())}
                >
                  <Plus />
                  Add “{query.trim()}”
                </CommandItem>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
