import { act, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { LoginScreen } from "@/components/login-screen"

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

vi.mock("@/lib/auth-client", () => ({
  authClient: {
    signIn: {
      social: vi.fn().mockResolvedValue({ error: null }),
      oauth2: vi.fn().mockResolvedValue({ error: null }),
    },
  },
}))

describe("LoginScreen product preview", () => {
  beforeEach(() => {
    vi.useFakeTimers()
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: vi.fn().mockReturnValue({
        matches: false,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }),
    })
  })

  afterEach(() => vi.useRealTimers())

  it("moves through the living routine preview automatically", () => {
    render(<LoginScreen />)
    expect(
      screen.getByRole("heading", { name: "Plan what comes next." })
    ).toBeVisible()

    act(() => vi.advanceTimersByTime(5000))

    expect(
      screen.getByRole("heading", {
        name: "Record what actually happened.",
      })
    ).toBeVisible()
    expect(
      screen.getByText("Each outcome comes from something you actually record.")
    ).toBeVisible()
  })

  it("lets people choose a preview stage directly", () => {
    render(<LoginScreen />)
    fireEvent.click(screen.getByRole("button", { name: "Show Learn preview" }))

    expect(
      screen.getByRole("heading", { name: "Notice your rhythm over time." })
    ).toBeVisible()
    expect(screen.getByText("3 of 3")).toBeVisible()
  })

  it("uses the Google brand mark for Google sign-in", () => {
    render(<LoginScreen />)

    const button = screen.getByRole("button", { name: "Continue with Google" })
    expect(button.querySelector('[data-slot="google-icon"]')).toBeVisible()
    expect(screen.getByRole("link", { name: "terms" })).toHaveAttribute(
      "href",
      "/terms"
    )
    expect(
      screen.getByRole("link", { name: "privacy notice" })
    ).toHaveAttribute("href", "/privacy")
  })

  it("offers Microsoft sign-in with the Microsoft brand mark", () => {
    render(<LoginScreen />)

    const button = screen.getByRole("button", {
      name: "Continue with Microsoft",
    })
    expect(button.querySelector('[data-slot="microsoft-icon"]')).toBeVisible()
  })

  it("uses an edge-to-edge equal split layout on desktop", () => {
    render(<LoginScreen />)

    expect(document.querySelector('[data-slot="login-layout"]')).toHaveClass(
      "min-h-dvh",
      "w-full",
      "lg:grid-cols-2"
    )
  })

  it("does not auto-advance when reduced motion is preferred", () => {
    vi.mocked(window.matchMedia).mockReturnValue({
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    } as unknown as MediaQueryList)
    render(<LoginScreen />)

    act(() => vi.advanceTimersByTime(10000))

    expect(
      screen.getByRole("heading", { name: "Plan what comes next." })
    ).toBeVisible()
  })
})
