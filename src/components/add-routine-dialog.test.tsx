import { fireEvent, render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { AddRoutineDialog } from "@/components/add-routine-dialog"

const addRoutine = vi.fn()
const updateRoutine = vi.fn()

vi.mock("@/components/app-provider", () => ({
  useApp: () => ({
    addRoutine,
    updateRoutine,
    categories: ["Personal", "Movement", "Health", "Mind"],
    routines: [{ category: "Movement" }, { category: "Health" }],
  }),
}))

describe("AddRoutineDialog", () => {
  beforeEach(() => {
    addRoutine.mockClear()
    updateRoutine.mockClear()
  })

  it("uses themeable schedule controls and marks required fields", () => {
    render(<AddRoutineDialog open onOpenChange={vi.fn()} />)

    expect(document.querySelector('input[type="date"]')).not.toBeInTheDocument()
    expect(document.querySelector('input[type="time"]')).not.toBeInTheDocument()
    expect(
      document.querySelector('select:not([aria-hidden="true"])')
    ).not.toBeInTheDocument()
    expect(screen.getByLabelText(/Repeat/)).toHaveClass("px-3")
    expect(screen.getByLabelText("Note").tagName).toBe("TEXTAREA")
    expect(screen.getAllByText("*")).toHaveLength(5)

    fireEvent.click(screen.getByLabelText(/Repeat/))
    const selectedRepeat = screen.getByRole("option", {
      name: "Does not repeat",
    })
    expect(selectedRepeat).toHaveClass("data-[state=checked]:bg-signal-100")
    expect(screen.queryByRole("option", { name: "Weekdays" })).toBeNull()
    fireEvent.click(selectedRepeat)

    fireEvent.click(screen.getByLabelText(/Time/))
    const themedSelections = screen
      .getAllByRole("option", { selected: true })
      .filter((option) => option.tagName === "BUTTON")
    expect(themedSelections).toHaveLength(3)
    for (const selected of themedSelections) {
      expect(selected).toHaveClass("bg-signal-100", "text-signal-700")
    }

    fireEvent.click(screen.getByRole("button", { name: "Done" }))
    fireEvent.click(screen.getByLabelText(/Start date/))
    expect(screen.getByRole("gridcell", { selected: true })).toHaveClass(
      "[&>button]:bg-signal-100",
      "[&>button]:text-signal-700"
    )
  })

  it("uses the schedule selection colors for the chosen category", () => {
    render(<AddRoutineDialog open onOpenChange={vi.fn()} />)

    fireEvent.click(screen.getByRole("combobox", { name: /Category/ }))
    const selectedCategory = screen.getByRole("option", { name: "Personal" })

    expect(selectedCategory).toHaveClass(
      "bg-signal-100",
      "text-signal-700",
      "data-[selected=true]:bg-signal-100"
    )
  })

  it("creates a category and submits a future one-off routine", () => {
    render(
      <AddRoutineDialog
        open
        onOpenChange={vi.fn()}
        defaultStartDate="2026-08-12"
      />
    )

    fireEvent.change(screen.getByLabelText(/Routine name/), {
      target: { value: "Deep work" },
    })
    expect(screen.getByLabelText(/Start date/)).toHaveTextContent("08/12/2026")

    fireEvent.click(screen.getByRole("combobox", { name: /Category/ }))
    fireEvent.change(screen.getByPlaceholderText("Search or add a category…"), {
      target: { value: "Work" },
    })
    fireEvent.click(screen.getByText("Add “Work”"))
    fireEvent.click(screen.getByRole("button", { name: "Add routine" }))

    expect(addRoutine).toHaveBeenCalledWith({
      title: "Deep work",
      startDate: "2026-08-12",
      time: "8:00 AM",
      repeat: "none",
      repeatOnDay: undefined,
      repeatOnDays: undefined,
      repeatOnDate: undefined,
      repeatOnMonth: undefined,
      endDate: undefined,
      note: "10 minutes",
      category: "Work",
    })
  })

  it("does not initialize a new routine on a past date", () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-08-11T12:00:00.000Z"))
    try {
      render(
        <AddRoutineDialog
          open
          onOpenChange={vi.fn()}
          defaultStartDate="2026-08-10"
        />
      )

      expect(screen.getByLabelText(/Start date/)).toHaveTextContent(
        "08/11/2026"
      )
    } finally {
      vi.useRealTimers()
    }
  })

  it("reveals the recurrence details required by each repeat type", () => {
    render(<AddRoutineDialog open onOpenChange={vi.fn()} />)

    chooseRepeat("Weekly")
    expect(screen.getByRole("button", { name: "Tuesday" })).toBeVisible()

    chooseRepeat("Monthly")
    expect(screen.getByLabelText(/Day of month/)).toBeInTheDocument()

    chooseRepeat("Yearly")
    expect(screen.getByLabelText(/Month/)).toBeInTheDocument()
    expect(screen.getByLabelText(/^Date/)).toBeInTheDocument()
  })

  it("schedules a weekly routine on multiple weekdays", () => {
    render(
      <AddRoutineDialog
        open
        onOpenChange={vi.fn()}
        defaultStartDate="2026-08-12"
      />
    )

    fireEvent.change(screen.getByLabelText(/Routine name/), {
      target: { value: "Strength training" },
    })
    chooseRepeat("Weekly")
    expect(screen.getByRole("button", { name: "Wednesday" })).toHaveAttribute(
      "aria-pressed",
      "true"
    )
    fireEvent.click(screen.getByRole("button", { name: "Friday" }))
    fireEvent.click(screen.getByRole("button", { name: "Add routine" }))

    expect(addRoutine).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Strength training",
        repeat: "weekly",
        repeatOnDay: 3,
        repeatOnDays: [3, 5],
      })
    )
  })

  it("loads and updates an existing routine", () => {
    render(
      <AddRoutineDialog
        open
        onOpenChange={vi.fn()}
        routine={{
          id: "walk",
          title: "Morning walk",
          startDate: "2026-08-10",
          time: "7:30 AM",
          repeat: "weekly",
          repeatOnDay: 1,
          category: "Movement",
          note: "20 minutes",
          status: "pending",
          enabled: true,
        }}
      />
    )

    expect(screen.getByRole("heading", { name: "Edit routine" })).toBeVisible()
    expect(screen.getByLabelText(/Routine name/)).toHaveValue("Morning walk")
    expect(screen.getByLabelText(/Time/)).toHaveTextContent("7:30 AM")
    fireEvent.change(screen.getByLabelText(/Routine name/), {
      target: { value: "Evening walk" },
    })
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }))

    expect(updateRoutine).toHaveBeenCalledWith(
      "walk",
      expect.objectContaining({ title: "Evening walk", category: "Movement" })
    )
  })
})

function chooseRepeat(label: string) {
  fireEvent.click(screen.getByLabelText(/Repeat/))
  fireEvent.click(screen.getByRole("option", { name: label }))
}
