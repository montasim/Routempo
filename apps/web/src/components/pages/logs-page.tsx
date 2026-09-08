import {
  Check,
  ChevronDown,
  ChevronUp,
  CircleAlert,
  Clock3,
  Pencil,
  Plus,
  ShieldCheck,
  SkipForward,
  Trash2,
} from "lucide-react"
import { useEffect, useState, type FormEvent, type ReactNode } from "react"

import { useApp } from "@/components/app-provider"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import type { LogDraft, LogEntry } from "@/lib/types"
import { cn } from "@/lib/utils"

type Filter = "all" | LogEntry["status"]

export function LogsPage() {
  const { logs, categories, addLog, updateLog, deleteLog } = useApp()
  const [filter, setFilter] = useState<Filter>("all")
  const [expanded, setExpanded] = useState<string | null>(null)
  const [editor, setEditor] = useState<LogEntry | null | undefined>(undefined)
  const [deleteTarget, setDeleteTarget] = useState<LogEntry | null>(null)
  const visible =
    filter === "all" ? logs : logs.filter((entry) => entry.status === filter)
  const count = (status: LogEntry["status"]) =>
    logs.filter((entry) => entry.status === status).length
  return (
    <>
      <LogEditorDialog
        open={editor !== undefined}
        log={editor ?? undefined}
        categories={categories}
        onOpenChange={(open) => {
          if (!open) setEditor(undefined)
        }}
        onSave={(draft) => {
          if (editor) updateLog(editor.id, draft)
          else addLog(draft)
          setEditor(undefined)
        }}
      />
      <Dialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null)
        }}
      >
        <DialogContent>
          <DialogTitle>Delete log?</DialogTitle>
          <DialogDescription>
            {deleteTarget
              ? `“${deleteTarget.title}” will be permanently removed from your behavior history.`
              : "This log will be permanently removed."}
          </DialogDescription>
          <div className="mt-6 flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                if (deleteTarget) deleteLog(deleteTarget.id)
                setDeleteTarget(null)
              }}
            >
              <Trash2 />
              Delete log
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <div className="w-full px-4 py-8 md:px-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-[1.6rem] font-semibold tracking-[-.025em] md:text-[2rem]">
              Behavior logs
            </h1>
            <p className="max-w-2xl text-base text-ink-500 dark:text-[#a7b7aa]">
              Review routine outcomes or add context that was recorded
              elsewhere.
            </p>
          </div>
          <Button
            className="self-start sm:self-auto"
            onClick={() => setEditor(null)}
          >
            <Plus />
            Add log
          </Button>
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <AuditMetric
            icon={ShieldCheck}
            value={String(logs.length)}
            label="Recorded events"
            note="Saved outcomes"
          />
          <AuditMetric
            icon={Check}
            value={String(count("completed"))}
            label="Completed"
            note="Confirmed by you"
            tone="completed"
          />
          <AuditMetric
            icon={SkipForward}
            value={String(count("skipped"))}
            label="Skipped"
            note="Intentionally deferred"
            tone="skipped"
          />
          <AuditMetric
            icon={CircleAlert}
            value={String(count("missed"))}
            label="Missed"
            note="Closed by scheduler"
            tone="missed"
          />
        </div>
        <Card className="mt-6 overflow-hidden">
          <div className="flex flex-col gap-4 border-b border-paper-200 p-4 sm:flex-row sm:items-center sm:justify-between md:p-5 dark:border-[#2b352d]">
            <div>
              <h2 className="font-semibold">Recorded events</h2>
              <p className="mt-1 text-sm text-ink-500 dark:text-[#a7b7aa]">
                Newest first. Times reflect the timezone captured with each
                event.
              </p>
            </div>
            <div
              className="flex flex-wrap gap-1 rounded-[10px] bg-paper-100 p-1 dark:bg-[#202821]"
              role="tablist"
            >
              {(["all", "completed", "skipped", "missed"] as Filter[]).map(
                (status) => (
                  <Button
                    key={status}
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setFilter(status)}
                    className={cn(
                      "rounded-lg px-3 py-2 text-xs font-medium capitalize",
                      filter === status
                        ? "bg-paper-0 text-ink-900 shadow-sm dark:bg-[#171d18] dark:text-[#f2f6f2]"
                        : "text-ink-500 dark:text-[#a7b7aa]"
                    )}
                    role="tab"
                    aria-selected={filter === status}
                  >
                    {status}
                  </Button>
                )
              )}
            </div>
          </div>
          {visible.length ? (
            visible.map((entry) => (
              <LogRow
                key={entry.id}
                entry={entry}
                expanded={expanded === entry.id}
                onToggle={() =>
                  setExpanded(expanded === entry.id ? null : entry.id)
                }
                onEdit={() => setEditor(entry)}
                onDelete={() => setDeleteTarget(entry)}
              />
            ))
          ) : (
            <div className="grid min-h-72 place-items-center p-8 text-center">
              <div>
                <h3 className="font-semibold">
                  {logs.length ? `No ${filter} records` : "No logs yet"}
                </h3>
                <p className="mt-1 text-sm text-ink-500 dark:text-[#a7b7aa]">
                  {logs.length
                    ? "No recorded outcomes match this filter."
                    : "Add a log here or complete a routine to record an outcome."}
                </p>
                {filter !== "all" ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-4 text-signal-600 dark:text-signal-300"
                    onClick={() => setFilter("all")}
                  >
                    Show all outcomes
                  </Button>
                ) : (
                  <Button className="mt-5" onClick={() => setEditor(null)}>
                    <Plus />
                    Add your first log
                  </Button>
                )}
              </div>
            </div>
          )}
        </Card>
      </div>
    </>
  )
}

function AuditMetric({
  icon: Icon,
  value,
  label,
  note,
  tone = "neutral",
}: {
  icon: typeof ShieldCheck
  value: string
  label: string
  note: string
  tone?: "neutral" | LogEntry["status"]
}) {
  const classes =
    tone === "completed"
      ? "bg-completed-100 text-completed-600 dark:bg-[#173528]"
      : tone === "skipped"
        ? "bg-skipped-100 text-skipped-700 dark:bg-[#3b2d18] dark:text-[#e9aa50]"
        : tone === "missed"
          ? "bg-missed-100 text-missed-700 dark:bg-[#421f24] dark:text-[#ef6468]"
          : "bg-paper-100 text-ink-500 dark:bg-[#202821] dark:text-[#a7b7aa]"
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between gap-3">
        <span
          className={cn(
            "grid size-9 place-items-center rounded-[10px]",
            classes
          )}
        >
          <Icon className="size-4" />
        </span>
        <span className="font-mono text-2xl font-medium">{value}</span>
      </div>
      <p className="mt-4 text-sm font-semibold">{label}</p>
      <p className="mt-1 text-xs text-ink-500 dark:text-[#a7b7aa]">{note}</p>
    </Card>
  )
}

function LogRow({
  entry,
  expanded,
  onToggle,
  onEdit,
  onDelete,
}: {
  entry: LogEntry
  expanded: boolean
  onToggle: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  const meta =
    entry.status === "completed"
      ? {
          icon: Check,
          classes: "bg-completed-100 text-completed-600 dark:bg-[#173528]",
          label: "Completed",
        }
      : entry.status === "skipped"
        ? {
            icon: SkipForward,
            classes:
              "bg-skipped-100 text-skipped-700 dark:bg-[#3b2d18] dark:text-[#e9aa50]",
            label: "Skipped",
          }
        : {
            icon: Clock3,
            classes:
              "bg-missed-100 text-missed-700 dark:bg-[#421f24] dark:text-[#ef6468]",
            label: "Missed",
          }
  const StatusIcon = meta.icon
  return (
    <article className="border-b border-paper-200 last:border-0 dark:border-[#2b352d]">
      <div className="flex items-center">
        <Button
          type="button"
          variant="ghost"
          onClick={onToggle}
          className="grid h-auto min-w-0 flex-1 justify-stretch gap-4 rounded-none p-4 text-left font-normal hover:bg-paper-50 focus-visible:ring-3 focus-visible:ring-signal-600/25 focus-visible:ring-inset md:grid-cols-[140px_minmax(160px,1fr)_100px_110px_112px_20px] md:items-center md:p-5 dark:hover:bg-[#202821]"
          aria-expanded={expanded}
        >
          <span>
            <span className="block font-mono text-xs font-medium">
              {entry.date}
            </span>
            <span className="mt-1 block font-mono text-[11px] text-ink-400">
              {entry.eventTime}
            </span>
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold">
              {entry.title}
            </span>
            <span className="mt-1 block text-xs text-ink-500 dark:text-[#a7b7aa]">
              {entry.category}
            </span>
          </span>
          <span>
            <span className="block text-[11px] text-ink-400 md:hidden">
              Scheduled
            </span>
            <span className="font-mono text-xs">{entry.scheduled}</span>
          </span>
          <span>
            <span className="block text-[11px] text-ink-400 md:hidden">
              Actual
            </span>
            <span className="font-mono text-xs">{entry.actual}</span>
            <span className="mt-1 block text-[11px] text-ink-400">
              {entry.variance}
            </span>
          </span>
          <Badge className={cn("py-1.5 font-semibold", meta.classes)}>
            <StatusIcon className="size-3.5" />
            {meta.label}
          </Badge>
          {expanded ? (
            <ChevronUp className="size-4 text-ink-400" />
          ) : (
            <ChevronDown className="size-4 text-ink-400" />
          )}
        </Button>
        <div className="flex shrink-0 gap-1 pr-3 md:pr-4">
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Edit ${entry.title} log`}
            title="Edit log"
            onClick={onEdit}
          >
            <Pencil />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-missed-600 hover:bg-missed-100 hover:text-missed-700 dark:hover:bg-[#392723]"
            aria-label={`Delete ${entry.title} log`}
            title="Delete log"
            onClick={onDelete}
          >
            <Trash2 />
          </Button>
        </div>
      </div>
      {expanded && (
        <div className="border-t border-paper-200 bg-paper-50 px-4 py-5 md:px-5 dark:border-[#2b352d] dark:bg-[#202821]">
          <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-4">
            <Detail label="Event ID" value={entry.id} mono />
            <Detail label="Recorded at" value={entry.recordedAt} mono />
            <Detail
              label="Actor and source"
              value={`${entry.actor} / ${entry.source}`}
            />
            <Detail label="Timezone snapshot" value={entry.timezone} />
            <div className="sm:col-span-2 lg:col-span-4">
              <Detail label="Routine snapshot" value={entry.snapshot} />
            </div>
          </dl>
        </div>
      )}
    </article>
  )
}

function LogEditorDialog({
  open,
  log,
  categories,
  onOpenChange,
  onSave,
}: {
  open: boolean
  log?: LogEntry
  categories: string[]
  onOpenChange: (open: boolean) => void
  onSave: (log: LogDraft) => void
}) {
  const [draft, setDraft] = useState<LogDraft>(() => logDraft(log))

  useEffect(() => {
    if (open) setDraft(logDraft(log))
  }, [log, open])

  const update = <K extends keyof LogDraft>(key: K, value: LogDraft[K]) =>
    setDraft((current) => ({ ...current, [key]: value }))
  const submit = (event: FormEvent) => {
    event.preventDefault()
    onSave(draft)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogTitle>{log ? "Edit log" : "Add a log"}</DialogTitle>
        <DialogDescription>
          {log
            ? "Correct the recorded outcome without changing its routine."
            : "Record an outcome that happened outside Routempo."}
        </DialogDescription>
        <form className="mt-6 grid gap-5" onSubmit={submit}>
          <LogField label="Routine name" htmlFor="log-title" required>
            <Input
              id="log-title"
              required
              maxLength={100}
              value={draft.title}
              onChange={(event) => update("title", event.target.value)}
              placeholder="Morning walk"
            />
          </LogField>
          <div className="grid gap-4 sm:grid-cols-2">
            <LogField label="Date" htmlFor="log-date" required>
              <Input
                id="log-date"
                type="date"
                required
                value={draft.date}
                onChange={(event) => update("date", event.target.value)}
              />
            </LogField>
            <LogField label="Event time" htmlFor="log-event-time" required>
              <Input
                id="log-event-time"
                required
                maxLength={30}
                value={draft.eventTime}
                onChange={(event) => update("eventTime", event.target.value)}
                placeholder="8:12 AM"
              />
            </LogField>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <LogField label="Category" htmlFor="log-category" required>
              <Input
                id="log-category"
                list="log-categories"
                required
                maxLength={60}
                value={draft.category}
                onChange={(event) => update("category", event.target.value)}
                placeholder="Personal"
              />
              <datalist id="log-categories">
                {categories.map((category) => (
                  <option key={category} value={category} />
                ))}
              </datalist>
            </LogField>
            <LogField label="Outcome" htmlFor="log-status" required>
              <Select
                value={draft.status}
                onValueChange={(value) =>
                  update("status", value as LogEntry["status"])
                }
              >
                <SelectTrigger id="log-status" aria-required="true">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="skipped">Skipped</SelectItem>
                  <SelectItem value="missed">Missed</SelectItem>
                </SelectContent>
              </Select>
            </LogField>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <LogField label="Scheduled time" htmlFor="log-scheduled" required>
              <Input
                id="log-scheduled"
                required
                maxLength={30}
                value={draft.scheduled}
                onChange={(event) => update("scheduled", event.target.value)}
                placeholder="8:00 AM"
              />
            </LogField>
            <LogField label="Actual time" htmlFor="log-actual">
              <Input
                id="log-actual"
                maxLength={30}
                value={draft.actual}
                onChange={(event) => update("actual", event.target.value)}
                placeholder="8:12 AM"
              />
            </LogField>
          </div>
          <LogField label="Note" htmlFor="log-note">
            <Textarea
              id="log-note"
              rows={3}
              maxLength={240}
              value={draft.snapshot}
              onChange={(event) => update("snapshot", event.target.value)}
              placeholder="Add context for this outcome"
            />
          </LogField>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit">
              {log ? <Pencil /> : <Plus />}
              {log ? "Save changes" : "Add log"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function LogField({
  label,
  htmlFor,
  required = false,
  children,
}: {
  label: string
  htmlFor: string
  required?: boolean
  children: ReactNode
}) {
  return (
    <div className="grid content-start gap-2 text-sm font-medium">
      <Label htmlFor={htmlFor}>
        {label}
        {required && <span className="text-missed-600"> *</span>}
      </Label>
      {children}
    </div>
  )
}

function logDraft(log?: LogEntry): LogDraft {
  return {
    date: log ? dateInputValue(log) : localDateInputValue(new Date()),
    eventTime: log?.eventTime ?? "",
    title: log?.title ?? "",
    category: log?.category ?? "",
    scheduled: log?.scheduled ?? "",
    actual: log?.actual === "—" ? "" : (log?.actual ?? ""),
    status: log?.status ?? "completed",
    snapshot: log?.snapshot ?? "",
  }
}

function dateInputValue(log: LogEntry) {
  const parsed = new Date(`${log.date} 12:00:00`)
  return Number.isNaN(parsed.getTime())
    ? log.recordedAt.slice(0, 10)
    : localDateInputValue(parsed)
}

function localDateInputValue(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

function Detail({
  label,
  value,
  mono = false,
}: {
  label: string
  value: string
  mono?: boolean
}) {
  return (
    <div>
      <dt className="text-[11px] font-medium tracking-[.08em] text-ink-400 uppercase">
        {label}
      </dt>
      <dd
        className={cn(
          "mt-1.5 text-xs text-ink-700 dark:text-[#cad4cc]",
          mono && "font-mono"
        )}
      >
        {value}
      </dd>
    </div>
  )
}
