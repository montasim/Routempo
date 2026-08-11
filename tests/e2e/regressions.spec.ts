import { expect, test, type APIRequestContext } from "@playwright/test"
import { readFile } from "node:fs/promises"

import { mockAuthenticatedSession } from "./helpers"

function exportPayload(withData = false) {
  return {
    format: "routempo-data-export",
    version: 1,
    exportedAt: "2026-08-11T08:30:00.000Z",
    data: {
      settings: {
        name: withData ? "Imported User" : "Montasim Ahmed",
        timezone: "Asia/Dhaka",
        reminder: "10",
        notifications: false,
        weeklySummary: false,
      },
      categories: withData ? ["Imported category"] : [],
      routines: withData
        ? [
            {
              id: "imported-routine",
              time: "8:00 AM",
              title: "Imported routine",
              note: "Restored from export",
              category: "Imported category",
              startDate: "2026-08-11",
              repeat: "daily",
              status: "completed",
              enabled: true,
            },
          ]
        : [],
      logs: withData
        ? [
            {
              id: "imported-log",
              date: "Aug 11, 2026",
              eventTime: "8:05 AM",
              title: "Imported routine",
              category: "Imported category",
              scheduled: "8:00 AM",
              actual: "8:05 AM",
              variance: "+5 min",
              status: "completed",
              recordedAt: "2026-08-11T02:05:00.000Z",
              actor: "Imported User",
              source: "Web app",
              timezone: "Asia/Dhaka",
              snapshot: "Imported routine · Restored from export · 8:00 AM",
            },
          ]
        : [],
    },
  }
}

async function replaceDemoData(request: APIRequestContext, withData = false) {
  const response = await request.post("/api/app", {
    data: { action: "import", payload: exportPayload(withData) },
  })
  expect(response.ok(), await response.text()).toBeTruthy()
}

test.beforeEach(async ({ page, request }) => {
  await mockAuthenticatedSession(page)
  await replaceDemoData(request)
})
test.afterAll(async ({ request }) => replaceDemoData(request))

test("export data downloads the user's data", async ({ page }) => {
  const appLoaded = page.waitForResponse(
    (response) =>
      response.url().endsWith("/api/app") &&
      response.request().method() === "GET"
  )
  await page.goto("/settings")
  await appLoaded

  const download = page.waitForEvent("download", { timeout: 3_000 })
  await page.getByRole("button", { name: "Export data" }).click()
  const file = await download
  expect(file.suggestedFilename()).toMatch(
    /^routempo-export-\d{4}-\d{2}-\d{2}\.json$/
  )
  const path = await file.path()
  expect(path).not.toBeNull()
  const exported = JSON.parse(await readFile(path!, "utf8")) as {
    format: string
    version: number
    exportedAt: string
    data: { routines: unknown[]; categories: unknown[]; logs: unknown[] }
  }
  expect(exported).toMatchObject({
    format: "routempo-data-export",
    version: 1,
    data: {
      routines: expect.any(Array),
      categories: expect.any(Array),
      logs: expect.any(Array),
    },
  })
  expect(Number.isNaN(Date.parse(exported.exportedAt))).toBe(false)
})

test("a failed mutation is reported and rolled back", async ({ page }) => {
  await page.route("**/api/app", async (route) => {
    if (route.request().method() === "POST") {
      await route.fulfill({
        status: 503,
        json: { error: "Database unavailable" },
      })
      return
    }
    await route.continue()
  })

  await page.goto("/settings")
  await page.getByRole("button", { name: "Add category" }).click()
  await page.getByLabel("Category name").fill("QA failed category")
  await page.getByRole("button", { name: "Add category" }).click()

  await expect(page.getByText("Database unavailable")).toBeVisible()
  await expect(
    page.getByText("QA failed category", { exact: true })
  ).toBeHidden()
})

test("an exported file can replace and restore all app data", async ({
  page,
  request,
}) => {
  await replaceDemoData(request, true)
  await page.goto("/settings")

  const download = page.waitForEvent("download")
  await page.getByRole("button", { name: "Export data" }).click()
  const exportedFile = await download
  const exportedPath = await exportedFile.path()
  expect(exportedPath).not.toBeNull()

  await replaceDemoData(request)
  await page.reload()
  await expect(
    page.getByRole("textbox", { name: "Name", exact: true })
  ).toHaveValue("Montasim Ahmed")

  await page.getByLabel("Choose Routempo export file").setInputFiles({
    name: exportedFile.suggestedFilename(),
    mimeType: "application/json",
    buffer: await readFile(exportedPath!),
  })
  const confirmation = page.getByRole("dialog", {
    name: "Replace your Routempo data?",
  })
  await expect(confirmation).toContainText(exportedFile.suggestedFilename())
  await confirmation.getByRole("button", { name: "Replace and import" }).click()
  await expect(page.getByText("Data imported")).toBeVisible()
  await expect(
    page.getByRole("textbox", { name: "Name", exact: true })
  ).toHaveValue("Imported User")

  await page.goto("/plan")
  await page.getByRole("tab", { name: "Manage routines" }).click()
  await expect(
    page.getByText("Imported routine", { exact: true })
  ).toBeVisible()
  await page.goto("/logs")
  await expect(
    page.getByText("Imported routine", { exact: true })
  ).toBeVisible()
})

test("invalid import files are rejected before confirmation", async ({
  page,
}) => {
  await page.goto("/settings")
  await page.getByLabel("Choose Routempo export file").setInputFiles({
    name: "not-routempo.json",
    mimeType: "application/json",
    buffer: Buffer.from('{"hello":"world"}'),
  })
  await expect(
    page.getByText("Select a valid Routempo export file.")
  ).toBeVisible()
  await expect(
    page.getByRole("dialog", { name: "Replace your Routempo data?" })
  ).toBeHidden()
})
