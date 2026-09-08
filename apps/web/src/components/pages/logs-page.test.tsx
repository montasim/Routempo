import { fireEvent, render, screen, within } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { LogsPage } from "@/components/pages/logs-page"
import type { LogEntry } from "@/lib/types"

const addLog = vi.fn()
const updateLog = vi.fn()
const deleteLog = vi.fn()
let logs: LogEntry[] = []

vi.mock("@/components/app-provider", () => ({
  useApp: () => ({
    logs,
    categories: ["Personal", "Movement"],
    addLog,
    updateLog,
    deleteLog,
  }),
}))

const existing: LogEntry = {
  id: "event-one",
  date: "Aug 10, 2026",
  eventTime: "7:42 AM",
  title: "Morning stretch",
  category: "Movement",
  scheduled: "7:30 AM",
  actual: "7:42 AM",
  variance: "+12 min",
  status: "completed",
  recordedAt: "2026-08-10T01:42:00.000Z",
  actor: "Montasim",
  source: "Web app",
  timezone: "Asia/Dhaka",
  snapshot: "Morning stretch · 10 minutes",
}

describe("LogsPage management", () => {
  beforeEach(() => {
    logs = [existing]
    addLog.mockClear()
    updateLog.mockClear()
    deleteLog.mockClear()
  })

  it("adds a manual log", () => {
    render(<LogsPage />)
    fireEvent.click(screen.getByRole("button", { name: "Add log" }))

    const dialog = screen.getByRole("dialog", { name: "Add a log" })
    fireEvent.change(within(dialog).getByLabelText(/Routine name/), {
      target: { value: "Evening walk" },
    })
    fireEvent.change(within(dialog).getByLabelText(/Event time/), {
      target: { value: "7:15 PM" },
    })
    fireEvent.change(within(dialog).getByLabelText(/Category/), {
      target: { value: "Movement" },
    })
    fireEvent.change(within(dialog).getByLabelText(/Scheduled time/), {
      target: { value: "7:00 PM" },
    })
    fireEvent.click(within(dialog).getByRole("button", { name: "Add log" }))

    expect(addLog).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Evening walk",
        eventTime: "7:15 PM",
        category: "Movement",
        scheduled: "7:00 PM",
      })
    )
  })

  it("edits an existing log", () => {
    render(<LogsPage />)
    fireEvent.click(
      screen.getByRole("button", { name: "Edit Morning stretch log" })
    )

    const dialog = screen.getByRole("dialog", { name: "Edit log" })
    const title = within(dialog).getByLabelText(/Routine name/)
    expect(title).toHaveValue("Morning stretch")
    fireEvent.change(title, { target: { value: "Morning mobility" } })
    fireEvent.click(
      within(dialog).getByRole("button", { name: "Save changes" })
    )

    expect(updateLog).toHaveBeenCalledWith(
      "event-one",
      expect.objectContaining({ title: "Morning mobility" })
    )
  })

  it("confirms deletion", () => {
    render(<LogsPage />)
    fireEvent.click(
      screen.getByRole("button", { name: "Delete Morning stretch log" })
    )
    fireEvent.click(screen.getByRole("button", { name: "Delete log" }))
    expect(deleteLog).toHaveBeenCalledWith("event-one")
  })

  it("keeps the empty state inside the recorded events card", () => {
    logs = []
    render(<LogsPage />)

    const empty = screen.getByText("No logs yet").closest("div")
    expect(empty).toBeVisible()
    expect(
      screen.getByRole("button", { name: "Add your first log" })
    ).toBeVisible()
    expect(
      screen.getByRole("heading", { name: "Recorded events", level: 2 })
    ).toBeVisible()
  })
})
