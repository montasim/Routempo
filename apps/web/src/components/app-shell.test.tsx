import { fireEvent, render, screen } from "@testing-library/react"
import type { ReactNode } from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { AppShell } from "@/components/app-shell"
import { authClient } from "@/lib/auth-client"

vi.mock("@tanstack/react-router", () => ({
  Link: ({ children }: { children: ReactNode }) => <a href="#">{children}</a>,
}))

vi.mock("@/components/app-provider", () => ({
  useApp: () => ({
    routines: [
      { id: "one", status: "completed" },
      { id: "two", status: "pending" },
    ],
    settings: { name: "Montasim", timezone: "UTC" },
  }),
}))

vi.mock("@/components/brand", () => ({
  Brand: () => <span>Routempo</span>,
}))

vi.mock("@/components/theme-button", () => ({
  ThemeButton: () => <button type="button">Theme</button>,
}))

vi.mock("@/lib/auth-client", () => ({
  authClient: { signOut: vi.fn() },
}))

describe("AppShell account menus", () => {
  beforeEach(() => vi.clearAllMocks())

  function openAccountMenu() {
    fireEvent.pointerDown(
      screen.getByRole("button", { name: "Open account menu" }),
      { button: 0, ctrlKey: false, pointerType: "mouse" }
    )
  }

  it("asks for confirmation before signing out", () => {
    render(
      <AppShell
        page="today"
        user={{ name: "Montasim", email: "montasim@example.com" }}
      >
        <main>Content</main>
      </AppShell>
    )

    openAccountMenu()
    fireEvent.click(screen.getByRole("menuitem", { name: "Sign out" }))

    expect(
      screen.getByRole("dialog", { name: "Sign out of Routempo?" })
    ).toBeInTheDocument()
    expect(authClient.signOut).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole("button", { name: "Stay signed in" }))
    expect(
      screen.queryByRole("dialog", { name: "Sign out of Routempo?" })
    ).not.toBeInTheDocument()

    openAccountMenu()
    fireEvent.click(screen.getByRole("menuitem", { name: "Sign out" }))
    fireEvent.click(screen.getByRole("button", { name: "Sign out" }))
    expect(authClient.signOut).toHaveBeenCalledOnce()
  })

  it("shows the Google profile image in the navbar", () => {
    render(
      <AppShell
        page="today"
        user={{
          name: "Montasim",
          email: "montasim@example.com",
          image: "https://lh3.googleusercontent.com/profile-photo",
        }}
      >
        <main>Content</main>
      </AppShell>
    )

    const profileImage = screen.getByRole("img", {
      name: "Montasim profile",
    })
    expect(profileImage).toHaveAttribute(
      "src",
      "https://lh3.googleusercontent.com/profile-photo"
    )
  })

  it("anchors the header avatar menu to the header, not the desktop sidebar", () => {
    render(
      <AppShell
        page="today"
        user={{ name: "Montasim", email: "montasim@example.com" }}
      >
        <main>Content</main>
      </AppShell>
    )

    const desktopSidebar = screen
      .getAllByRole("navigation", { name: "Primary navigation" })[0]
      ?.closest("aside")

    expect(desktopSidebar).not.toBeNull()

    openAccountMenu()

    const signOutItem = screen.getByRole("menuitem", { name: "Sign out" })
    expect(desktopSidebar).not.toContainElement(signOutItem)
  })

  it("uses the bottom of the sidebar for today's summary", () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-08-11T12:00:00.000Z"))
    try {
      render(
        <AppShell page="today">
          <main>Content</main>
        </AppShell>
      )

      const summary = screen.getByText("No routines scheduled").parentElement
      expect(summary).toHaveClass("mt-auto")
      expect(screen.getAllByText("Tuesday, August 11")).toHaveLength(1)
      expect(screen.queryByText("Settings and account")).not.toBeInTheDocument()
    } finally {
      vi.useRealTimers()
    }
  })

  it("skeletonizes only data-bearing shell regions while loading", () => {
    render(
      <AppShell page="today" loading>
        <main>Page skeleton</main>
      </AppShell>
    )

    expect(screen.getByText("Page skeleton")).toBeVisible()
    expect(screen.getByLabelText("Loading today’s progress")).toBeVisible()
    expect(screen.queryByLabelText("Loading account")).not.toBeInTheDocument()
    expect(
      screen.getAllByRole("navigation", { name: "Primary navigation" })
    ).toHaveLength(2)
    expect(
      document.querySelectorAll('[data-slot="skeleton"]').length
    ).toBeGreaterThanOrEqual(5)
  })
})
