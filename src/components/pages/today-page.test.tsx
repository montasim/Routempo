import { fireEvent, render, screen } from "@testing-library/react"
import type { ReactNode } from "react"
import { describe, expect, it, vi } from "vitest"

import { TodayPage } from "@/components/pages/today-page"

const skipRoutine = vi.fn()

vi.mock("@tanstack/react-router", () => ({
  Link: ({ children }: { children: ReactNode }) => <a href="#">{children}</a>,
}))

vi.mock("@/components/app-provider", () => ({
  useApp: () => ({
    routines: [
      {
        id: "fajr",
        title: "Fajr salah",
        time: "4:55 AM",
        note: "10 minutes",
        category: "Faith",
        startDate: "2020-01-01",
        repeat: "daily",
        status: "completed",
        enabled: true,
      },
      {
        id: "maghrib",
        title: "Magrib salah",
        time: "6:55 PM",
        note: "10 minutes",
        category: "Faith",
        startDate: "2020-01-01",
        repeat: "daily",
        status: "pending",
        enabled: true,
      },
      {
        id: "esha",
        title: "Esha salah",
        time: "8:45 PM",
        note: "10 minutes",
        category: "Faith",
        startDate: "2020-01-01",
        repeat: "daily",
        status: "pending",
        enabled: true,
      },
    ],
    logs: [],
    categories: ["Faith"],
    settings: {
      name: "Amina",
      timezone: "UTC",
      reminder: "10",
      notifications: true,
      weeklySummary: true,
    },
    completeRoutine: vi.fn(),
    skipRoutine,
    addRoutine: vi.fn(),
    updateRoutine: vi.fn(),
  }),
}))

describe("Today routine actions", () => {
  it("uses all tasks scheduled today for the weekly summary rate", () => {
    render(<TodayPage />)

    expect(screen.getByText("1 of 3 tasks completed today.")).toBeVisible()
    expect(screen.getByText("33%")).toBeVisible()
  })

  it("places a skip action before complete and confirms it", () => {
    render(<TodayPage />)

    const skip = screen.getByRole("button", { name: "Skip Esha salah today" })
    const complete = screen.getByRole("button", {
      name: "Mark Esha salah complete",
    })
    expect(
      skip.compareDocumentPosition(complete) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy()

    fireEvent.click(skip)
    expect(
      screen.getByRole("heading", { name: "Skip this routine today?" })
    ).toBeVisible()
    fireEvent.click(screen.getByRole("button", { name: "Skip today" }))
    expect(skipRoutine).toHaveBeenCalledWith("esha")
  })
})
