import { render, screen } from "@testing-library/react"
import type { ReactNode } from "react"
import { describe, expect, it, vi } from "vitest"

import { InsightsPage } from "@/components/pages/insights-page"
import { LogsPage } from "@/components/pages/logs-page"
import { PlanPage } from "@/components/pages/plan-page"
import { TodayPage } from "@/components/pages/today-page"

vi.mock("@tanstack/react-router", () => ({
  Link: ({ children }: { children: ReactNode }) => <a href="#">{children}</a>,
}))

vi.mock("@/components/app-provider", () => ({
  useApp: () => ({
    routines: [],
    logs: [],
    categories: [],
    settings: {
      name: "Amina",
      timezone: "Africa/Cairo",
      reminder: "10",
      notifications: true,
      weeklySummary: true,
    },
    completeRoutine: vi.fn(),
    skipRoutine: vi.fn(),
    toggleRoutine: vi.fn(),
    addRoutine: vi.fn(),
    updateRoutine: vi.fn(),
    deleteRoutine: vi.fn(),
  }),
}))

describe("first-run page guidance", () => {
  it("guides the user to add a first routine from Today", () => {
    render(<TodayPage />)
    expect(
      screen.getByRole("heading", { name: "Start with one routine" })
    ).toBeVisible()
    expect(
      screen.getByRole("button", { name: "Add your first routine" })
    ).toBeVisible()
  })

  it("explains how to begin from Plan", () => {
    render(<PlanPage />)
    expect(
      screen.getByRole("heading", {
        name: "Your plan is ready for a first routine",
      })
    ).toBeVisible()
  })

  it("explains how insights are created", () => {
    render(<InsightsPage />)
    expect(
      screen.getByRole("heading", { name: "Your patterns will appear here" })
    ).toBeVisible()
  })

  it("keeps log creation available from the empty history", () => {
    render(<LogsPage />)
    expect(
      screen.getByRole("heading", {
        name: "No logs yet",
      })
    ).toBeVisible()
    expect(
      screen.getByRole("button", { name: "Add your first log" })
    ).toBeVisible()
  })
})
