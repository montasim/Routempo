import { render, screen } from "@testing-library/react"
import { Tags } from "lucide-react"
import { describe, expect, it } from "vitest"

import { EmptyState } from "@/components/empty-state"

describe("EmptyState", () => {
  it("embeds guided empty content without adding another card border", () => {
    render(
      <EmptyState
        embedded
        compact
        icon={Tags}
        title="No categories yet"
        description="Add a category to organize your routines."
        action={<button>Add your first category</button>}
      />
    )

    expect(
      screen.getByRole("heading", { level: 3, name: "No categories yet" })
    ).toBeVisible()
    expect(
      screen.getByText("Add a category to organize your routines.")
    ).toBeVisible()
    expect(
      screen.getByRole("button", { name: "Add your first category" })
    ).toBeVisible()
    expect(
      screen.getByText("No categories yet").closest("[data-slot=empty-state]")
    ).toHaveClass("border-0", "bg-transparent")
  })
})
