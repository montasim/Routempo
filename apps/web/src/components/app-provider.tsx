import {
  createContext,
  use,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react"
import { toast } from "sonner"

import { createInitialData } from "@/lib/initial-data"
import { categoryList, categoryMatches } from "@/lib/categories"
import type { DataExport } from "@/lib/export-data"
import type {
  AppData,
  AppMutation,
  LogDraft,
  RoutineDraft,
  Settings,
} from "@/lib/types"
import { applyAppMutation } from "@/lib/app-mutations"
import { currentBrowserTimeZone } from "@/lib/user-calendar"

type AppContextValue = AppData & {
  isLoading: boolean
  theme: "light" | "dark"
  setTheme: (theme: "light" | "dark") => void
  completeRoutine: (id: string) => void
  skipRoutine: (id: string) => void
  toggleRoutine: (id: string) => void
  addRoutine: (routine: RoutineDraft) => void
  updateRoutine: (id: string, routine: RoutineDraft) => void
  deleteRoutine: (id: string) => void
  addCategory: (name: string) => void
  renameCategory: (name: string, nextName: string) => void
  deleteCategory: (name: string) => void
  addLog: (log: LogDraft) => void
  updateLog: (id: string, log: LogDraft) => void
  deleteLog: (id: string) => void
  importData: (payload: DataExport) => Promise<void>
  saveSettings: (settings: Settings) => Promise<void>
}

const AppContext = createContext<AppContextValue | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(() => createInitialData())
  const dataRef = useRef(data)
  const mutationQueueRef = useRef<Promise<void> | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [theme, setThemeState] = useState<"light" | "dark">("light")

  useEffect(() => {
    const saved = localStorage.getItem("routempo-theme")
    const next =
      saved === "dark" ||
      (!saved && matchMedia("(prefers-color-scheme: dark)").matches)
        ? "dark"
        : "light"
    setThemeState(next)
    document.documentElement.classList.toggle("dark", next === "dark")
    let active = true
    fetch("/api/app", {
      headers: {
        "x-routempo-timezone": currentBrowserTimeZone(),
      },
    })
      .then(async (response) => {
        if (response.ok && active) {
          const next = (await response.json()) as AppData
          dataRef.current = next
          setData(next)
        }
      })
      .catch(() => undefined)
      .finally(() => {
        if (active) setIsLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  const setTheme = useCallback((next: "light" | "dark") => {
    setThemeState(next)
    localStorage.setItem("routempo-theme", next)
    document.documentElement.classList.toggle("dark", next === "dark")
  }, [])

  const enqueueMutation = useCallback((operation: () => Promise<void>) => {
    const task = mutationQueueRef.current
      ? mutationQueueRef.current.then(operation)
      : operation()
    const settled = task
      .catch(() => undefined)
      .finally(() => {
        if (mutationQueueRef.current === settled)
          mutationQueueRef.current = null
      })
    mutationQueueRef.current = settled
    return task
  }, [])

  const mutate = useCallback(
    (
      mutation: AppMutation,
      optimistic: (current: AppData) => AppData,
      onSuccess?: () => void
    ) => {
      const execute = async () => {
        const previous = dataRef.current
        const next = optimistic(previous)
        dataRef.current = next
        setData(next)

        try {
          const response = await fetch("/api/app", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify(mutation),
          })
          if (!response.ok) throw new Error(await appMutationError(response))
          const persisted = (await response.json()) as AppData
          dataRef.current = persisted
          setData(persisted)
          onSuccess?.()
        } catch (error) {
          dataRef.current = previous
          setData(previous)
          toast.error(
            error instanceof Error
              ? error.message
              : "Could not save your changes."
          )
        }
      }

      void enqueueMutation(execute)
    },
    [enqueueMutation]
  )

  const value = useMemo<AppContextValue>(
    () => ({
      ...data,
      isLoading,
      theme,
      setTheme,
      completeRoutine(id) {
        mutate(
          { action: "complete", id },
          (current) => ({
            ...current,
            routines: current.routines.map((routine) =>
              routine.id === id ? { ...routine, status: "completed" } : routine
            ),
          }),
          () => toast.success("Routine marked complete")
        )
      },
      skipRoutine(id) {
        mutate(
          { action: "skip", id },
          (current) => ({
            ...current,
            routines: current.routines.map((routine) =>
              routine.id === id ? { ...routine, status: "skipped" } : routine
            ),
          }),
          () => toast("Routine skipped for today")
        )
      },
      toggleRoutine(id) {
        mutate({ action: "toggle", id }, (current) => ({
          ...current,
          routines: current.routines.map((routine) =>
            routine.id === id
              ? { ...routine, enabled: !routine.enabled }
              : routine
          ),
        }))
      },
      addRoutine(routine) {
        const added = {
          ...routine,
          id: crypto.randomUUID(),
          status: "pending",
          enabled: true,
        } as const
        mutate(
          { action: "add", routine },
          (current) => ({
            ...current,
            categories: categoryList(
              [...current.categories, routine.category],
              current.routines
            ),
            routines: [...current.routines, added],
          }),
          () =>
            toast.success(
              routine.repeat === "none"
                ? "Routine scheduled"
                : "Recurring routine added"
            )
        )
      },
      updateRoutine(id, routine) {
        mutate(
          { action: "update", id, routine },
          (current) => ({
            ...current,
            categories: categoryList(
              [...current.categories, routine.category],
              current.routines
            ),
            routines: current.routines.map((item) =>
              item.id === id ? { ...item, ...routine } : item
            ),
          }),
          () => toast.success("Routine updated")
        )
      },
      deleteRoutine(id) {
        mutate(
          { action: "delete", id },
          (current) => ({
            ...current,
            routines: current.routines.filter((routine) => routine.id !== id),
          }),
          () => toast.success("Routine deleted")
        )
      },
      addCategory(name) {
        mutate(
          { action: "category-add", name },
          (current) => ({
            ...current,
            categories: categoryList(
              [...current.categories, name],
              current.routines
            ),
          }),
          () => toast.success("Category added")
        )
      },
      renameCategory(name, nextName) {
        mutate(
          { action: "category-rename", name, nextName },
          (current) => ({
            ...current,
            categories: current.categories.map((category) =>
              categoryMatches(category, name) ? nextName : category
            ),
            routines: current.routines.map((routine) =>
              categoryMatches(routine.category, name)
                ? { ...routine, category: nextName }
                : routine
            ),
          }),
          () => toast.success("Category renamed")
        )
      },
      deleteCategory(name) {
        mutate(
          { action: "category-delete", name },
          (current) => ({
            ...current,
            categories: current.categories.filter(
              (category) => !categoryMatches(category, name)
            ),
          }),
          () => toast.success("Category deleted")
        )
      },
      addLog(log) {
        mutate(
          { action: "log-add", log },
          (current) =>
            applyAppMutation(
              { ...current, logs: [...current.logs] },
              { action: "log-add", log },
              current.settings.name
            ),
          () => toast.success("Log added")
        )
      },
      updateLog(id, log) {
        mutate(
          { action: "log-update", id, log },
          (current) =>
            applyAppMutation(
              { ...current, logs: [...current.logs] },
              { action: "log-update", id, log },
              current.settings.name
            ),
          () => toast.success("Log updated")
        )
      },
      deleteLog(id) {
        mutate(
          { action: "log-delete", id },
          (current) => ({
            ...current,
            logs: current.logs.filter((log) => log.id !== id),
          }),
          () => toast.success("Log deleted")
        )
      },
      async importData(payload) {
        await enqueueMutation(async () => {
          const response = await fetch("/api/app", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ action: "import", payload }),
          })
          if (!response.ok) throw new Error(await appMutationError(response))
          const persisted = (await response.json()) as AppData
          dataRef.current = persisted
          setData(persisted)
          toast.success("Data imported")
        })
      },
      async saveSettings(settings) {
        await enqueueMutation(async () => {
          const response = await fetch("/api/app", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ action: "settings", settings }),
          })
          if (!response.ok) {
            const body = (await response.json().catch(() => null)) as {
              error?: string
            } | null
            throw new Error(body?.error ?? "Could not save settings.")
          }
          const persisted = (await response.json()) as AppData
          dataRef.current = persisted
          setData(persisted)
          toast.success("Settings saved")
        })
      },
    }),
    [data, enqueueMutation, isLoading, mutate, setTheme, theme]
  )

  return <AppContext value={value}>{children}</AppContext>
}

async function appMutationError(response: Response) {
  const body = (await response.json().catch(() => null)) as {
    error?: string
  } | null
  return body?.error ?? "Could not save your changes."
}

export function useApp() {
  const context = use(AppContext)
  if (!context) throw new Error("useApp must be used within AppProvider")
  return context
}
