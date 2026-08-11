import type { Page } from "@playwright/test"

export async function mockAuthenticatedSession(page: Page) {
  await page.route("**/api/auth/get-session", async (route) => {
    const now = new Date()
    await route.fulfill({
      json: {
        session: {
          id: "e2e-session",
          userId: "development-demo",
          expiresAt: new Date(now.getTime() + 60_000).toISOString(),
          token: "e2e-token",
          createdAt: now.toISOString(),
          updatedAt: now.toISOString(),
        },
        user: {
          id: "development-demo",
          name: "Montasim Ahmed",
          email: "development@example.com",
          emailVerified: true,
          image: null,
          createdAt: now.toISOString(),
          updatedAt: now.toISOString(),
        },
      },
    })
  })
}
