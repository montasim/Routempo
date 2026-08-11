import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { SystemStatusPage } from "@/components/system-status-page"

vi.mock("@tanstack/react-router", () => ({
  Link: ({ to, ...props }: { to: string } & React.ComponentProps<"a">) => (
    <a href={to} {...props} />
  ),
}))

vi.mock("@/components/brand", () => ({
  Brand: () => <span>Routempo</span>,
}))

vi.mock("@/components/theme-button", () => ({
  ThemeButton: () => <button type="button">Theme</button>,
}))

describe("SystemStatusPage", () => {
  it("gives a missing route a clear path back to today", () => {
    render(<SystemStatusPage status="404" />)

    expect(
      screen.getByRole("heading", {
        name: "This page isn’t on today’s plan.",
      })
    ).toBeVisible()
    expect(
      screen.getByRole("link", { name: "Return to today" })
    ).toHaveAttribute("href", "/today")
    expect(document.querySelector('[data-slot="status-404"]')).toHaveClass(
      "min-h-dvh"
    )
  })

  it("lets a failed route retry without leaving the page", () => {
    const onRetry = vi.fn()
    render(<SystemStatusPage status="500" onRetry={onRetry} />)

    expect(
      screen.getByRole("heading", {
        name: "Routempo lost the rhythm for a moment.",
      })
    ).toBeVisible()
    fireEvent.click(screen.getByRole("button", { name: "Try again" }))
    expect(onRetry).toHaveBeenCalledOnce()
    expect(
      screen.getByText("Your saved routines and history are unaffected.")
    ).toBeVisible()
  })
})
