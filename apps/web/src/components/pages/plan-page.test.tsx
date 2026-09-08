import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { PlanPage } from "@/components/pages/plan-page"

const deleteRoutine = vi.fn()
const updateRoutine = vi.fn()

vi.mock("@/components/app-provider", () => ({
  useApp: () => ({
    categories: ["Personal", "Movement"],
    routines: [
      {
        id: "breakfast",
        title: "Breakfast",
        startDate: "2026-08-10",
        time: "6:30 AM",
        repeat: "daily",
        category: "Personal",
        note: "15 minutes",
        status: "pending",
        enabled: true,
      },
      {
        id: "walk",
        title: "Morning walk",
        startDate: "2026-08-10",
        time: "7:30 AM",
        repeat: "daily",
        category: "Movement",
        note: "20 minutes",
        status: "pending",
        enabled: true,
      },
    ],
    addRoutine: vi.fn(),
    updateRoutine,
    deleteRoutine,
    toggleRoutine: vi.fn(),
    settings: { timezone: "UTC" },
  }),
}))

describe("Plan routine management", () => {
  it("sorts the selected day's routines by time", () => {
    render(<PlanPage />)

    const breakfast = screen.getByText("Breakfast")
    const walk = screen.getByText("Morning walk")
    expect(
      breakfast.compareDocumentPosition(walk) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy()
  })

  it("selects the current day when the weekly plan opens", () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-08-11T12:00:00.000Z"))
    try {
      render(<PlanPage />)
      expect(
        screen.getByRole("button", { name: "Tuesday, August 11" })
      ).toHaveAttribute("aria-pressed", "true")
      const days = screen.getAllByRole("button", {
        name: /August (8|9|10|11|12|13|14)/,
      })
      expect(days).toHaveLength(7)
      expect(days[3]).toHaveAccessibleName("Tuesday, August 11")

      fireEvent.click(screen.getByRole("button", { name: "Monday, August 10" }))
      expect(screen.getByRole("button", { name: "Add one" })).toBeDisabled()
    } finally {
      vi.useRealTimers()
    }
  })

  it("opens a routine for editing from Manage routines", () => {
    render(<PlanPage />)
    fireEvent.click(screen.getByRole("tab", { name: "Manage routines" }))
    fireEvent.click(screen.getByRole("button", { name: "Edit Morning walk" }))

    expect(screen.getByRole("heading", { name: "Edit routine" })).toBeVisible()
    expect(screen.getByLabelText(/Routine name/)).toHaveValue("Morning walk")
  })

  it("confirms routine deletion and keeps history explicit", () => {
    deleteRoutine.mockClear()
    render(<PlanPage />)
    fireEvent.click(screen.getByRole("tab", { name: "Manage routines" }))
    fireEvent.click(screen.getByRole("button", { name: "Delete Morning walk" }))

    expect(screen.getByText(/Existing history will stay in Logs/)).toBeVisible()
    fireEvent.click(screen.getByRole("button", { name: "Delete routine" }))
    expect(deleteRoutine).toHaveBeenCalledWith("walk")
  })
})
