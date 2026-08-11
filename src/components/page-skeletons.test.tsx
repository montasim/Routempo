import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { AppPageSkeleton } from "@/components/page-skeletons"

describe("AppPageSkeleton", () => {
  it.each(["today", "plan", "insights", "logs", "settings"] as const)(
    "renders a component-shaped %s loading state",
    (page) => {
      render(<AppPageSkeleton page={page} />)

      expect(
        screen.getByRole("status", { name: `Loading ${page}` })
      ).toBeVisible()
      expect(
        document.querySelector(`[data-slot="${page}-skeleton"]`)
      ).toBeVisible()
      expect(
        document.querySelectorAll('[data-slot="skeleton"]').length
      ).toBeGreaterThan(12)
    }
  )

  it("animates only when motion is allowed", () => {
    render(<AppPageSkeleton page="today" />)
    expect(document.querySelector('[data-slot="skeleton"]')).toHaveClass(
      "motion-safe:animate-pulse"
    )
  })

  it("preserves the final responsive page grids", () => {
    const { rerender } = render(<AppPageSkeleton page="today" />)
    expect(
      document.querySelector('[data-slot="today-skeleton"]')
    ).toContainHTML("xl:grid-cols-[minmax(0,7fr)_minmax(0,3fr)]")

    rerender(<AppPageSkeleton page="settings" />)
    expect(
      document.querySelector('[data-slot="settings-skeleton"]')
    ).toContainHTML("xl:grid-cols-2")
  })
})
