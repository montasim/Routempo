import { expect, test } from "@playwright/test"

import { mockAuthenticatedSession } from "./helpers"

const routes = [
  "/today",
  "/plan",
  "/insights",
  "/logs",
  "/settings",
  "/privacy",
  "/terms",
] as const

test.beforeEach(async ({ page }) => mockAuthenticatedSession(page))

for (const route of routes) {
  test(`${route} loads without browser or server errors`, async ({ page }) => {
    const errors: string[] = []
    page.on("pageerror", (error) => errors.push(error.message))
    page.on("response", (response) => {
      if (response.status() >= 500)
        errors.push(`${response.status()} ${response.url()}`)
    })

    const response = await page.goto(route)

    expect(response?.status()).toBeLessThan(500)
    await expect(page.locator("body")).not.toBeEmpty()
    expect(errors).toEqual([])
  })
}
