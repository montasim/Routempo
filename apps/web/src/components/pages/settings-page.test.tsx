import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { SettingsPage } from "@/components/pages/settings-page"

const addCategory = vi.fn()
const renameCategory = vi.fn()
const deleteCategory = vi.fn()
const saveSettings = vi.fn().mockResolvedValue(undefined)

vi.mock("@/lib/auth-client", () => ({
  authClient: {
    linkSocial: vi.fn().mockResolvedValue({ error: null }),
    oauth2: { link: vi.fn().mockResolvedValue({ error: null }) },
  },
}))

vi.mock("@/components/app-provider", () => ({
  useApp: () => ({
    settings: {
      name: "Montasim",
      timezone: "Asia/Dhaka",
      reminder: "10",
      notifications: false,
      weeklySummary: false,
    },
    categories: ["Personal", "Movement", "Health"],
    routines: [{ id: "walk", category: "Movement" }],
    saveSettings,
    addCategory,
    renameCategory,
    deleteCategory,
  }),
}))

describe("Settings category management", () => {
  beforeEach(() => {
    addCategory.mockClear()
    renameCategory.mockClear()
    deleteCategory.mockClear()
    saveSettings.mockClear()
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            providers: {
              google: { configured: true, connected: true, ready: true },
              microsoft: { configured: true, connected: true, ready: true },
            },
          }),
          { status: 200, headers: { "content-type": "application/json" } }
        )
      )
    )
  })

  it("lists every category with usage and guards categories in use", () => {
    render(<SettingsPage />)

    expect(screen.getByText("Personal")).toBeVisible()
    expect(screen.getByText("Movement")).toBeVisible()
    expect(screen.getByText("Health")).toBeVisible()
    expect(
      screen.getByText(/1 routine · Reassign before deleting/)
    ).toBeVisible()
    expect(
      screen.getByRole("button", { name: "Delete Movement" })
    ).toBeDisabled()
    expect(screen.getByRole("region", { name: "Category list" })).toHaveClass(
      "max-h-[21rem]",
      "overflow-y-auto",
      "overscroll-contain"
    )
  })

  it("pairs related settings cards in a responsive two-column grid", () => {
    render(<SettingsPage />)

    const profile = screen
      .getByRole("heading", { name: "Profile" })
      .closest('[data-slot="card"]')
    const categories = screen
      .getByRole("heading", { name: "Categories" })
      .closest('[data-slot="card"]')
    const notifications = screen
      .getByRole("heading", { name: "Notifications" })
      .closest('[data-slot="card"]')
    const data = screen
      .getByRole("heading", { name: "Data and account" })
      .closest('[data-slot="card"]')
    const integrations = screen
      .getByRole("heading", { name: "Calendar and task integrations" })
      .closest('[data-slot="card"]')

    expect(profile?.parentElement).toHaveClass("grid", "xl:grid-cols-2")
    expect(profile).toHaveClass("order-1")
    expect(categories).toHaveClass("order-2")
    expect(notifications).toHaveClass(
      "order-3",
      "xl:col-start-1",
      "xl:row-start-2"
    )
    expect(data).toHaveClass("order-4", "xl:col-start-1", "xl:row-start-3")
    expect(integrations).toHaveClass(
      "order-5",
      "xl:col-start-2",
      "xl:row-start-2",
      "xl:row-span-2"
    )
  })

  it("uses the shared themed select controls", () => {
    render(<SettingsPage />)

    const timezone = screen.getByRole("combobox", { name: "Timezone" })
    const reminder = screen.getByRole("combobox", {
      name: "Default reminder",
    })

    expect(timezone).toHaveClass("h-11", "px-3", "rounded-[10px]")
    expect(reminder).toHaveClass("h-11", "px-3", "rounded-[10px]")
    expect(
      document.querySelectorAll('select:not([aria-hidden="true"])')
    ).toHaveLength(0)
  })

  it("persists the selected default reminder", async () => {
    render(<SettingsPage />)

    fireEvent.click(screen.getByRole("combobox", { name: "Default reminder" }))
    fireEvent.click(screen.getByRole("option", { name: "30 minutes before" }))
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }))

    await waitFor(() =>
      expect(saveSettings).toHaveBeenCalledWith(
        expect.objectContaining({ reminder: "30" })
      )
    )
  })

  it("searches the full timezone list and shows live UTC offsets", () => {
    render(<SettingsPage />)

    fireEvent.click(screen.getByRole("combobox", { name: "Timezone" }))
    expect(screen.getAllByRole("option").length).toBeGreaterThan(100)

    fireEvent.change(screen.getByPlaceholderText("Search timezones…"), {
      target: { value: "New York" },
    })
    const newYork = screen.getByRole("option", {
      name: /America\/New_York UTC-/,
    })
    expect(newYork).toHaveTextContent(/UTC-\d{2}:\d{2}/)
  }, 10_000)

  it("top-aligns profile labels and controls when helper text is present", () => {
    render(<SettingsPage />)

    expect(screen.getByText("Name").closest("label")).toHaveClass(
      "content-start"
    )
    expect(screen.getByText("Email").closest("label")).toHaveClass(
      "content-start"
    )
  })

  it("adds and renames categories", () => {
    render(<SettingsPage />)

    fireEvent.click(screen.getByRole("button", { name: "Add category" }))
    fireEvent.change(screen.getByLabelText("Category name"), {
      target: { value: "Work" },
    })
    fireEvent.click(screen.getByRole("button", { name: "Add category" }))
    expect(addCategory).toHaveBeenCalledWith("Work")

    fireEvent.click(screen.getByRole("button", { name: "Rename Personal" }))
    fireEvent.change(screen.getByLabelText("Category name"), {
      target: { value: "Home" },
    })
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }))
    expect(renameCategory).toHaveBeenCalledWith("Personal", "Home")
  })

  it("confirms deleting an unused category", () => {
    render(<SettingsPage />)
    fireEvent.click(screen.getByRole("button", { name: "Delete Health" }))
    fireEvent.click(screen.getByRole("button", { name: "Delete category" }))
    expect(deleteCategory).toHaveBeenCalledWith("Health")
  })

  it("offers calendar and task import and export for both providers", async () => {
    render(<SettingsPage />)

    expect(
      screen.getByRole("region", { name: "Google integration" })
    ).toBeVisible()
    expect(
      screen.getByRole("region", { name: "Microsoft integration" })
    ).toBeVisible()
    await waitFor(() =>
      expect(screen.getAllByRole("button", { name: "Import" })[0]).toBeEnabled()
    )
    expect(screen.getAllByRole("button", { name: "Import" })).toHaveLength(4)
    expect(screen.getAllByRole("button", { name: "Export" })).toHaveLength(4)
  })
})
