import { expect, test } from "@playwright/test"

test("login preview controls and provider actions work", async ({ page }) => {
  const authRequests: Array<{ url: string; body: unknown }> = []
  await page.route("**/api/auth/sign-in/**", async (route) => {
    authRequests.push({
      url: route.request().url(),
      body: route.request().postDataJSON(),
    })
    await route.fulfill({ json: { redirect: false, url: null } })
  })

  const appLoaded = page.waitForResponse(
    (response) =>
      response.url().endsWith("/api/app") &&
      response.request().method() === "GET"
  )
  await page.goto("/login")
  await appLoaded
  await page.getByRole("button", { name: "Show Record preview" }).click()
  await expect(
    page.getByRole("heading", { name: "Record what actually happened." })
  ).toBeVisible()
  await page.getByRole("button", { name: "Show Learn preview" }).click()
  await expect(
    page.getByRole("heading", { name: "Notice your rhythm over time." })
  ).toBeVisible()

  await page.getByRole("button", { name: "Continue with Google" }).click()
  await expect.poll(() => authRequests.length).toBe(1)
  expect(authRequests[0]).toMatchObject({
    url: expect.stringContaining("/api/auth/sign-in/social"),
    body: { provider: "google", callbackURL: "/today" },
  })

  await page.getByRole("button", { name: "Continue with Microsoft" }).click()
  await expect.poll(() => authRequests.length).toBe(2)
  expect(authRequests[1]).toMatchObject({
    url: expect.stringContaining("/api/auth/sign-in/oauth2"),
    body: { providerId: "microsoft-entra-id", callbackURL: "/today" },
  })
})
