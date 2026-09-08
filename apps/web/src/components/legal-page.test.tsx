import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { LegalPage } from "@/components/legal-page"

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

describe("LegalPage", () => {
  it("renders the terms with legal navigation and an effective date", () => {
    render(<LegalPage kind="terms" />)

    expect(
      screen.getByRole("heading", { name: "Terms of service", level: 1 })
    ).toBeVisible()
    expect(screen.getByText("Using Routempo")).toBeVisible()
    expect(screen.getAllByText("Effective August 10, 2026")).not.toHaveLength(0)
    expect(document.querySelector('[data-slot="legal-header"]')).toHaveClass(
      "sticky",
      "top-0",
      "z-40"
    )
    expect(
      screen.getByRole("link", { name: "Privacy notice" })
    ).toHaveAttribute("href", "/privacy")
  })

  it("renders the privacy notice and current data practices", () => {
    render(<LegalPage kind="privacy" />)

    expect(
      screen.getByRole("heading", { name: "Privacy notice", level: 1 })
    ).toBeVisible()
    expect(screen.getByText("Information Routempo handles")).toBeVisible()
    expect(screen.getByText(/Routempo does not sell/)).toBeVisible()
    expect(
      screen.getByRole("link", { name: "Back to sign in" })
    ).toHaveAttribute("href", "/login")
  })
})
