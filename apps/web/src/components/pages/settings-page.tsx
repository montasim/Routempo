import {
  Check,
  CalendarSync,
  ChevronsUpDown,
  Download,
  ListTodo,
  Pencil,
  Plus,
  Tags,
  Trash2,
  Upload,
} from "lucide-react"
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react"
import { toast } from "sonner"

import { useApp } from "@/components/app-provider"
import { EmptyState } from "@/components/empty-state"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { categoryMatches } from "@/lib/categories"
import {
  dataExportSchema,
  downloadDataExport,
  type DataExport,
} from "@/lib/export-data"
import {
  currentPushState,
  disablePushNotifications,
  enablePushNotifications,
  type PushState,
} from "@/lib/push-client"
import type { Settings } from "@/lib/types"
import {
  currentBrowserTimeZone,
  supportedTimeZones,
  timeZoneOffset,
} from "@/lib/user-calendar"
import { cn } from "@/lib/utils"
import { authClient } from "@/lib/auth-client"
import type {
  IntegrationProvider,
  IntegrationResource,
} from "@/lib/integration-mapping"

export function SettingsPage({ email }: { email?: string | null }) {
  const {
    settings,
    saveSettings,
    categories,
    routines,
    logs,
    importData,
    addCategory,
    renameCategory,
    deleteCategory,
  } = useApp()
  const [draft, setDraft] = useState<Settings>(settings)
  const [categoryEditor, setCategoryEditor] = useState<
    string | null | undefined
  >(undefined)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [detectedTimeZone, setDetectedTimeZone] = useState("")
  const [pushState, setPushState] = useState<PushState>("loading")
  const [saving, setSaving] = useState(false)
  const [importing, setImporting] = useState(false)
  const [importCandidate, setImportCandidate] = useState<{
    fileName: string
    payload: DataExport
  } | null>(null)
  const importInput = useRef<HTMLInputElement>(null)
  useEffect(() => setDetectedTimeZone(currentBrowserTimeZone()), [])
  useEffect(() => {
    let active = true
    currentPushState()
      .then((state) => {
        if (active) setPushState(state)
      })
      .catch(() => {
        if (active) setPushState("error")
      })
    return () => {
      active = false
    }
  }, [])
  useEffect(
    () => setDraft(settings),
    [
      settings.name,
      settings.timezone,
      settings.reminder,
      settings.notifications,
      settings.weeklySummary,
    ]
  )
  const update = <K extends keyof Settings>(key: K, value: Settings[K]) =>
    setDraft((current) => ({ ...current, [key]: value }))
  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setSaving(true)
    try {
      if (draft.notifications || draft.weeklySummary) {
        await enablePushNotifications()
        setPushState("subscribed")
      }
      await saveSettings(draft)
      if (!draft.notifications && !draft.weeklySummary) {
        await disablePushNotifications()
        setPushState(await currentPushState())
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not save settings."
      )
    } finally {
      setSaving(false)
    }
  }
  const selectImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0]
    event.currentTarget.value = ""
    if (!file) return
    if (file.size > 10 * 1024 * 1024) {
      toast.error("The import file must be smaller than 10 MB.")
      return
    }
    try {
      const parsed = dataExportSchema.safeParse(JSON.parse(await file.text()))
      if (!parsed.success) throw new Error("Invalid export")
      setImportCandidate({ fileName: file.name, payload: parsed.data })
    } catch {
      toast.error("Select a valid Routempo export file.")
    }
  }
  return (
    <>
      <CategoryNameDialog
        open={categoryEditor !== undefined}
        currentName={categoryEditor ?? undefined}
        categories={categories}
        onOpenChange={(open) => {
          if (!open) setCategoryEditor(undefined)
        }}
        onSave={(name) => {
          if (categoryEditor) renameCategory(categoryEditor, name)
          else addCategory(name)
          setCategoryEditor(undefined)
        }}
      />
      <Dialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null)
        }}
      >
        <DialogContent>
          <DialogTitle>Delete category?</DialogTitle>
          <DialogDescription>
            {deleteTarget
              ? `“${deleteTarget}” will be removed from your category list.`
              : "This category will be removed."}
          </DialogDescription>
          <div className="mt-6 flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                if (deleteTarget) deleteCategory(deleteTarget)
                setDeleteTarget(null)
              }}
            >
              <Trash2 />
              Delete category
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog
        open={Boolean(importCandidate)}
        onOpenChange={(open) => {
          if (!open && !importing) setImportCandidate(null)
        }}
      >
        <DialogContent>
          <DialogTitle>Replace your Routempo data?</DialogTitle>
          <DialogDescription>
            Importing {importCandidate?.fileName ?? "this file"} will replace
            your settings, categories, routines, and behavior logs. Export a
            backup first if you need to keep the current data.
          </DialogDescription>
          <div className="mt-6 flex justify-end gap-2">
            <Button
              variant="ghost"
              disabled={importing}
              onClick={() => setImportCandidate(null)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              disabled={importing}
              onClick={async () => {
                if (!importCandidate) return
                setImporting(true)
                try {
                  await importData(importCandidate.payload)
                  setImportCandidate(null)
                } catch (error) {
                  toast.error(
                    error instanceof Error
                      ? error.message
                      : "Could not import data."
                  )
                } finally {
                  setImporting(false)
                }
              }}
            >
              <Upload />
              {importing ? "Importing…" : "Replace and import"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <div className="w-full px-4 py-8 md:px-8">
        <div>
          <h1 className="text-[1.6rem] font-semibold tracking-[-.025em] md:text-[2rem]">
            Settings
          </h1>
          <p className="max-w-2xl text-base text-ink-500 dark:text-[#a7b7aa]">
            Manage your account, reminders, and interface preferences.
          </p>
        </div>
        <div className="mt-8">
          <div className="grid gap-6 xl:grid-cols-2">
            <Card className="order-1">
              <form onSubmit={submit}>
                <CardHeader>
                  <h2 className="font-semibold">Profile</h2>
                  <p className="mt-1 text-sm text-ink-500 dark:text-[#a7b7aa]">
                    How your account appears.
                  </p>
                </CardHeader>
                <CardContent className="grid gap-5 2xl:grid-cols-2">
                  <Label className="grid content-start gap-2 text-sm leading-normal font-medium">
                    Name
                    <Input
                      value={draft.name}
                      onChange={(event) => update("name", event.target.value)}
                    />
                  </Label>
                  <Label className="grid content-start gap-2 text-sm leading-normal font-medium">
                    Email
                    <Input value={email ?? ""} disabled />
                    <span className="text-xs font-normal text-ink-500 dark:text-[#a7b7aa]">
                      Managed by your Google account.
                    </span>
                  </Label>
                  <div className="grid content-start gap-2 text-sm font-medium">
                    <Label htmlFor="settings-timezone">Timezone</Label>
                    <TimeZonePicker
                      value={draft.timezone}
                      onChange={(value) => update("timezone", value)}
                    />
                    <div className="flex items-center justify-between gap-3 text-xs font-normal text-ink-500 dark:text-[#a7b7aa]">
                      <span>
                        Current device: {detectedTimeZone || "Detecting…"}
                      </span>
                      {detectedTimeZone &&
                        draft.timezone !== detectedTimeZone && (
                          <Button
                            type="button"
                            variant="ghost"
                            className="h-auto p-0 text-xs font-medium text-signal-600 hover:bg-transparent hover:underline dark:text-signal-300 dark:hover:bg-transparent"
                            onClick={() => update("timezone", detectedTimeZone)}
                          >
                            Use current
                          </Button>
                        )}
                    </div>
                  </div>
                  <div className="grid content-start gap-2 text-sm font-medium">
                    <Label htmlFor="settings-reminder">Default reminder</Label>
                    <Select
                      value={draft.reminder}
                      onValueChange={(value) => update("reminder", value)}
                    >
                      <SelectTrigger id="settings-reminder">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">At scheduled time</SelectItem>
                        <SelectItem value="5">5 minutes before</SelectItem>
                        <SelectItem value="10">10 minutes before</SelectItem>
                        <SelectItem value="15">15 minutes before</SelectItem>
                        <SelectItem value="20">20 minutes before</SelectItem>
                        <SelectItem value="30">30 minutes before</SelectItem>
                        <SelectItem value="45">45 minutes before</SelectItem>
                        <SelectItem value="60">1 hour before</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
                <div className="flex justify-end border-t border-paper-200 p-4 dark:border-[#2b352d]">
                  <Button type="submit" disabled={saving}>
                    <Check />
                    {saving ? "Saving…" : "Save changes"}
                  </Button>
                </div>
              </form>
            </Card>
            <Card className="order-3 xl:col-start-1 xl:row-start-2">
              <CardHeader>
                <h2 className="font-semibold">Notifications</h2>
                <p className="mt-1 text-sm text-ink-500 dark:text-[#a7b7aa]">
                  Choose what Routempo sends you.
                </p>
              </CardHeader>
              <SettingSwitch
                label="Routine reminders"
                description="Get notified before scheduled routines."
                checked={draft.notifications}
                onCheckedChange={(checked) => update("notifications", checked)}
              />
              <SettingSwitch
                label="Weekly summary"
                description="Receive a short review every Monday."
                checked={draft.weeklySummary}
                onCheckedChange={(checked) => update("weeklySummary", checked)}
              />
              <NotificationStatus
                state={pushState}
                onEnable={async () => {
                  try {
                    setPushState("loading")
                    await enablePushNotifications()
                    setPushState("subscribed")
                    toast.success("Notifications enabled on this device")
                  } catch (error) {
                    setPushState(
                      await currentPushState().catch((): PushState => "error")
                    )
                    toast.error(
                      error instanceof Error
                        ? error.message
                        : "Could not enable notifications."
                    )
                  }
                }}
              />
            </Card>
            <Card className="order-2">
              <CardHeader className="flex flex-row items-center justify-between gap-4">
                <div>
                  <h2 className="font-semibold">Categories</h2>
                  <p className="mt-1 text-sm text-ink-500 dark:text-[#a7b7aa]">
                    Group routines in a way that makes your plan easier to scan.
                  </p>
                </div>
                <Button size="sm" onClick={() => setCategoryEditor(null)}>
                  <Plus />
                  Add category
                </Button>
              </CardHeader>
              <div
                role="region"
                aria-label="Category list"
                className="max-h-[21rem] overflow-y-auto overscroll-contain"
              >
                {categories.length ? (
                  categories.map((category) => {
                    const usage = routines.filter((routine) =>
                      categoryMatches(routine.category, category)
                    ).length
                    return (
                      <div
                        key={category}
                        className="flex items-center gap-4 border-b border-paper-200 p-5 last:border-0 dark:border-[#2b352d]"
                      >
                        <span className="grid size-10 shrink-0 place-items-center rounded-[10px] bg-signal-50 text-signal-700 dark:bg-[#26382b] dark:text-signal-300">
                          <Tags className="size-4" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-semibold">
                            {category}
                          </span>
                          <span className="mt-1 block text-xs text-ink-500 dark:text-[#a7b7aa]">
                            {usage
                              ? `${usage} ${usage === 1 ? "routine" : "routines"} · Reassign before deleting`
                              : "Not used by a routine"}
                          </span>
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={`Rename ${category}`}
                          title="Rename category"
                          onClick={() => setCategoryEditor(category)}
                        >
                          <Pencil />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          disabled={usage > 0}
                          className="hover:bg-missed-50 disabled:text-ink-300 dark:text-missed-400 text-missed-600 hover:text-missed-700 dark:hover:bg-[#392723]"
                          aria-label={`Delete ${category}`}
                          title={
                            usage
                              ? "Move or delete its routines before deleting this category"
                              : "Delete category"
                          }
                          onClick={() => setDeleteTarget(category)}
                        >
                          <Trash2 />
                        </Button>
                      </div>
                    )
                  })
                ) : (
                  <EmptyState
                    embedded
                    compact
                    icon={Tags}
                    title="No categories yet"
                    description="Add a category to organize your routines, or create one while adding a routine."
                    action={
                      <Button size="sm" onClick={() => setCategoryEditor(null)}>
                        <Plus />
                        Add your first category
                      </Button>
                    }
                  />
                )}
              </div>
            </Card>
            <Card className="order-4 xl:col-start-1 xl:row-start-3">
              <CardHeader>
                <h2 className="font-semibold">Data and account</h2>
                <p className="mt-1 text-sm text-ink-500 dark:text-[#a7b7aa]">
                  Export your routines and auditable behavior history.
                </p>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      downloadDataExport({
                        settings,
                        categories,
                        routines,
                        logs,
                      })
                      toast.success("Data exported")
                    }}
                  >
                    <Download />
                    Export data
                  </Button>
                  <Input
                    ref={importInput}
                    type="file"
                    accept="application/json,.json"
                    className="sr-only"
                    aria-label="Choose Routempo export file"
                    onChange={(event) => void selectImport(event)}
                  />
                  <Button
                    variant="outline"
                    onClick={() => importInput.current?.click()}
                  >
                    <Upload />
                    Import data
                  </Button>
                </div>
              </CardContent>
            </Card>
            <IntegrationsCard />
          </div>
        </div>
      </div>
    </>
  )
}

type IntegrationState = Record<
  IntegrationProvider,
  { configured: boolean; connected: boolean; ready: boolean }
>

const emptyIntegrationState: IntegrationState = {
  google: { configured: false, connected: false, ready: false },
  microsoft: { configured: false, connected: false, ready: false },
}

function IntegrationsCard() {
  const [providers, setProviders] = useState(emptyIntegrationState)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState("")

  const refresh = async () => {
    try {
      const response = await fetch("/api/integrations")
      if (response.ok) {
        const data = (await response.json()) as { providers: IntegrationState }
        setProviders(data.providers)
      }
    } catch {
      // Keep integrations unavailable when connection status cannot be loaded.
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void refresh()
  }, [])

  const connect = async (provider: IntegrationProvider) => {
    const result =
      provider === "google"
        ? await authClient.linkSocial({
            provider: "google",
            callbackURL: "/settings",
            scopes: [
              "https://www.googleapis.com/auth/calendar.events",
              "https://www.googleapis.com/auth/tasks",
            ],
          })
        : await authClient.oauth2.link({
            providerId: "microsoft-entra-id",
            callbackURL: "/settings",
            scopes: [
              "offline_access",
              "Calendars.ReadWrite",
              "Tasks.ReadWrite",
            ],
          })
    if (result.error)
      toast.error(result.error.message || "Account connection could not start")
  }

  const sync = async (
    action: "import" | "export",
    provider: IntegrationProvider,
    resource: IntegrationResource
  ) => {
    const key = `${provider}-${resource}-${action}`
    setBusy(key)
    try {
      const response = await fetch("/api/integrations", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action, provider, resource }),
      })
      const result = (await response.json()) as {
        imported?: number
        exported?: number
        failures?: string[]
        error?: string
      }
      if (!response.ok) throw new Error(result.error || "Sync failed")
      const count = action === "import" ? result.imported : result.exported
      if (result.failures?.length)
        toast.warning(
          `${count ?? 0} exported; ${result.failures.length} could not be exported`
        )
      else
        toast.success(
          `${count ?? 0} ${resource === "calendar" ? "calendar items" : "tasks"} ${action === "import" ? "imported" : "exported"}`
        )
      if (action === "import") window.location.reload()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Sync failed")
    } finally {
      setBusy("")
    }
  }

  return (
    <Card className="order-5 xl:col-start-2 xl:row-span-2 xl:row-start-2">
      <CardHeader>
        <h2 className="font-semibold">Calendar and task integrations</h2>
        <p className="mt-1 text-sm text-ink-500 dark:text-[#a7b7aa]">
          Bring upcoming events and open tasks into Routempo, or send enabled
          routines to your provider. Existing sync records prevent duplicates.
        </p>
      </CardHeader>
      <div className="grid border-t border-paper-200 dark:border-[#2b352d]">
        {(["google", "microsoft"] as const).map((provider, index) => {
          const state = providers[provider]
          const label = provider === "google" ? "Google" : "Microsoft"
          return (
            <section
              key={provider}
              aria-label={`${label} integration`}
              className={cn(
                "p-5",
                index > 0 && "border-t border-paper-200 dark:border-[#2b352d]"
              )}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-sm font-semibold">{label}</h3>
                  <p className="mt-1 text-xs text-ink-500 dark:text-[#a7b7aa]">
                    {loading
                      ? "Checking connection…"
                      : !state.configured
                        ? "Provider credentials are not configured."
                        : state.ready
                          ? "Calendar and task access connected."
                          : state.connected
                            ? "Connected for sign-in; grant sync access."
                            : "Not connected."}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant={state.ready ? "outline" : "default"}
                  disabled={loading || !state.configured}
                  onClick={() => void connect(provider)}
                >
                  {state.ready
                    ? "Reconnect"
                    : state.connected
                      ? "Grant access"
                      : "Connect"}
                </Button>
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <SyncControls
                  icon={<CalendarSync />}
                  label="Calendar"
                  disabled={!state.ready}
                  busy={busy}
                  provider={provider}
                  resource="calendar"
                  onSync={sync}
                />
                <SyncControls
                  icon={<ListTodo />}
                  label="Tasks"
                  disabled={!state.ready}
                  busy={busy}
                  provider={provider}
                  resource="tasks"
                  onSync={sync}
                />
              </div>
            </section>
          )
        })}
      </div>
    </Card>
  )
}

function SyncControls({
  icon,
  label,
  disabled,
  busy,
  provider,
  resource,
  onSync,
}: {
  icon: ReactNode
  label: string
  disabled: boolean
  busy: string
  provider: IntegrationProvider
  resource: IntegrationResource
  onSync: (
    action: "import" | "export",
    provider: IntegrationProvider,
    resource: IntegrationResource
  ) => Promise<void>
}) {
  return (
    <div className="rounded-[10px] border border-paper-200 p-3 dark:border-[#3a463d]">
      <div className="flex items-center gap-2 text-sm font-medium">
        <span className="text-signal-600 dark:text-signal-300">{icon}</span>
        {label}
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {(["import", "export"] as const).map((action) => {
          const key = `${provider}-${resource}-${action}`
          return (
            <Button
              key={action}
              size="sm"
              variant="outline"
              disabled={disabled || Boolean(busy)}
              onClick={() => void onSync(action, provider, resource)}
            >
              {busy === key
                ? "Working…"
                : `${action === "import" ? "Import" : "Export"}`}
            </Button>
          )
        })}
      </div>
    </div>
  )
}

function TimeZonePicker({
  value,
  onChange,
}: {
  value: string
  onChange: (timeZone: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [timeZones, setTimeZones] = useState(() => [value || "UTC"])

  useEffect(
    () =>
      setTimeZones([
        ...new Set([...(value ? [value] : []), ...supportedTimeZones()]),
      ]),
    [value]
  )

  const normalized = query.trim().toLocaleLowerCase()
  const options = useMemo(
    () =>
      timeZones.map((timeZone) => ({
        timeZone,
        offset: timeZoneOffset(timeZone),
      })),
    [timeZones]
  )
  const matches = options.filter(({ timeZone, offset }) =>
    `${timeZone} ${timeZone.replaceAll("_", " ")} ${offset}`
      .toLocaleLowerCase()
      .includes(normalized)
  )

  const choose = (timeZone: string) => {
    onChange(timeZone)
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
          id="settings-timezone"
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="h-11 w-full justify-between px-3 font-normal"
        >
          <span className="truncate">{value || "Detecting timezone…"}</span>
          <span className="flex shrink-0 items-center gap-2">
            {value && (
              <span className="font-mono text-xs text-ink-400">
                {timeZoneOffset(value)}
              </span>
            )}
            <ChevronsUpDown className="text-ink-400" />
          </span>
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
            placeholder="Search timezones…"
          />
          <CommandList className="max-h-72">
            {!matches.length && (
              <CommandEmpty>No timezones found.</CommandEmpty>
            )}
            {matches.map(({ timeZone, offset }) => (
              <CommandItem
                key={timeZone}
                value={timeZone}
                className={cn(
                  value === timeZone &&
                    "bg-signal-100 font-medium text-signal-700 data-[selected=true]:bg-signal-100 dark:bg-[#26382b] dark:text-signal-300 dark:data-[selected=true]:bg-[#26382b]"
                )}
                onSelect={() => choose(timeZone)}
              >
                <Check
                  className={cn(
                    "text-signal-700 dark:text-signal-300",
                    value === timeZone ? "opacity-100" : "opacity-0"
                  )}
                />
                <span className="min-w-0 flex-1 truncate">{timeZone}</span>
                <span className="shrink-0 font-mono text-xs text-ink-400">
                  {offset}
                </span>
              </CommandItem>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

function CategoryNameDialog({
  open,
  currentName,
  categories,
  onOpenChange,
  onSave,
}: {
  open: boolean
  currentName?: string
  categories: string[]
  onOpenChange: (open: boolean) => void
  onSave: (name: string) => void
}) {
  const [name, setName] = useState(currentName ?? "")
  useEffect(() => {
    if (open) setName(currentName ?? "")
  }, [currentName, open])

  const trimmed = name.trim()
  const duplicate = categories.some(
    (category) =>
      !categoryMatches(category, currentName ?? "") &&
      categoryMatches(category, trimmed)
  )
  const unchanged = Boolean(
    currentName && categoryMatches(currentName, trimmed)
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogTitle>
          {currentName ? "Rename category" : "Add category"}
        </DialogTitle>
        <DialogDescription>
          {currentName
            ? "The new name will update every routine in this category."
            : "Create a reusable category for your routines."}
        </DialogDescription>
        <form
          className="mt-6 grid gap-5"
          onSubmit={(event) => {
            event.preventDefault()
            if (!trimmed || duplicate || unchanged) return
            onSave(trimmed)
          }}
        >
          <Label className="grid gap-2 text-sm leading-normal font-medium">
            Category name
            <Input
              autoFocus
              required
              maxLength={60}
              value={name}
              aria-invalid={duplicate}
              onChange={(event) => setName(event.target.value)}
              placeholder="e.g. Work"
            />
            {duplicate && (
              <span className="text-xs font-normal text-missed-600">
                A category with this name already exists.
              </span>
            )}
          </Label>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!trimmed || duplicate || unchanged}>
              {currentName ? <Check /> : <Plus />}
              {currentName ? "Save changes" : "Add category"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function SettingSwitch({
  label,
  description,
  checked,
  onCheckedChange,
}: {
  label: string
  description: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
}) {
  return (
    <div className="flex items-center gap-4 border-b border-paper-200 p-5 last:border-0 dark:border-[#2b352d]">
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold">{label}</span>
        <span className="mt-1 block text-sm text-ink-500 dark:text-[#a7b7aa]">
          {description}
        </span>
      </span>
      <Switch
        checked={checked}
        onCheckedChange={onCheckedChange}
        aria-label={`Toggle ${label}`}
      />
    </div>
  )
}

function NotificationStatus({
  state,
  onEnable,
}: {
  state: PushState
  onEnable: () => void
}) {
  const content: Record<PushState, { label: string; detail: string }> = {
    loading: {
      label: "Checking this device…",
      detail: "Confirming browser notification support.",
    },
    subscribed: {
      label: "Enabled on this device",
      detail: "Routempo can deliver reminders while the app is closed.",
    },
    available: {
      label: "Not enabled on this device",
      detail: "Allow notifications to receive reminders in this browser.",
    },
    denied: {
      label: "Blocked by this browser",
      detail: "Allow notifications for this site in your browser settings.",
    },
    unsupported: {
      label: "Not supported on this device",
      detail: "Use a browser that supports service-worker push notifications.",
    },
    unconfigured: {
      label: "Not configured on this server",
      detail: "Add the VAPID environment variables before enabling reminders.",
    },
    error: {
      label: "Status unavailable",
      detail: "Check your connection and try again.",
    },
  }
  const current = content[state]
  const canEnable = state === "available" || state === "error"

  return (
    <div className="flex items-center gap-4 p-5" aria-live="polite">
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold">Browser delivery</span>
        <span className="mt-1 block text-sm text-ink-500 dark:text-[#a7b7aa]">
          {current.label}. {current.detail}
        </span>
      </span>
      {canEnable && (
        <Button type="button" size="sm" variant="outline" onClick={onEnable}>
          Enable
        </Button>
      )}
    </div>
  )
}
