import {
  expect,
  test,
  type APIRequestContext,
  type Page,
} from "@playwright/test"

import { mockAuthenticatedSession } from "./helpers"

type AppData = {
  routines: Array<{ id: string }>
  categories: string[]
  logs: Array<{ id: string }>
  settings: {
    name: string
    timezone: string
    reminder: string
    notifications: boolean
    weeklySummary: boolean
  }
}

async function appData(request: APIRequestContext) {
  const response = await request.get("/api/app", {
    headers: { "x-routempo-timezone": "Asia/Dhaka" },
  })
  expect(response.ok()).toBeTruthy()
  return (await response.json()) as AppData
}

async function mutate(request: APIRequestContext, body: unknown) {
  const response = await request.post("/api/app", { data: body })
  expect(response.ok(), await response.text()).toBeTruthy()
}

async function resetDemoAccount(request: APIRequestContext) {
  const data = await appData(request)
  for (const log of data.logs)
    await mutate(request, { action: "log-delete", id: log.id })
  for (const routine of data.routines)
    await mutate(request, { action: "delete", id: routine.id })
  for (const category of data.categories)
    await mutate(request, { action: "category-delete", name: category })
  await mutate(request, {
    action: "settings",
    settings: {
      name: "Montasim Ahmed",
      timezone: "Asia/Dhaka",
      reminder: "10",
      notifications: false,
      weeklySummary: false,
    },
  })
}

function todayInDhaka() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Dhaka",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts()
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((item) => item.type === type)?.value
  return `${part("year")}-${part("month")}-${part("day")}`
}

async function seedRoutine(request: APIRequestContext, title = "QA routine") {
  await mutate(request, {
    action: "add",
    routine: {
      title,
      note: "Created by the E2E audit",
      category: "QA",
      startDate: todayInDhaka(),
      time: "8:00 AM",
      repeat: "daily",
    },
  })
}

async function addRoutineThroughUi(page: Page, title: string) {
  await page.getByRole("button", { name: "Add routine", exact: true }).click()
  const dialog = page.getByRole("dialog", { name: "Add a routine" })
  await dialog.getByLabel(/Routine name/).fill(title)
  await dialog.getByRole("combobox", { name: /Category/ }).click()
  await page.getByPlaceholder("Search or add a category…").fill("QA")
  await page.getByRole("option", { name: "Add “QA”" }).click()
  const saved = page.waitForResponse(
    (response) =>
      response.url().endsWith("/api/app") && response.request().method() === "POST"
  )
  await dialog.getByRole("button", { name: "Add routine" }).click()
  await expect(dialog).toBeHidden()
  await saved
}

test.beforeEach(async ({ page, request }) => {
  await mockAuthenticatedSession(page)
  await resetDemoAccount(request)
})
test.afterAll(async ({ request }) => resetDemoAccount(request))

test("shell navigation, account menu, legal pages, and 404 actions work", async ({
  page,
}) => {
  await page.goto("/today")
  await page.getByRole("link", { name: "Plan", exact: true }).click()
  await expect(page).toHaveURL(/\/plan$/)
  await page.getByRole("link", { name: "Insights", exact: true }).click()
  await expect(page).toHaveURL(/\/insights$/)
  await page.getByRole("link", { name: "Logs", exact: true }).click()
  await expect(page).toHaveURL(/\/logs$/)
  await page.getByRole("link", { name: "Settings", exact: true }).click()
  await expect(page).toHaveURL(/\/settings$/)

  await page.getByRole("button", { name: "Open account menu" }).click()
  await page.getByRole("menuitem", { name: "Sign out" }).click()
  await expect(
    page.getByRole("dialog", { name: "Sign out of Routempo?" })
  ).toBeVisible()
  await page.getByRole("button", { name: "Stay signed in" }).click()

  await page.goto("/terms")
  await page.getByRole("link", { name: "Privacy notice" }).click()
  await expect(page).toHaveURL(/\/privacy$/)
  await page.getByRole("link", { name: "Back to sign in" }).click()
  await expect(page).toHaveURL(/\/login$/)

  await page.goto("/not-a-real-page")
  await page.getByRole("link", { name: "Return to today" }).click()
  await expect(page).toHaveURL(/\/today$/)
})

test("theme changes and persists", async ({ page }) => {
  const appLoaded = page.waitForResponse(
    (response) =>
      response.url().endsWith("/api/app") &&
      response.request().method() === "GET"
  )
  await page.goto("/settings")
  await appLoaded
  await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible()
  await page.getByRole("button", { name: "Use dark theme" }).click()
  await expect(page.locator("html")).toHaveClass(/dark/)
  await page.reload()
  await expect(page.locator("html")).toHaveClass(/dark/)
})

test("routine creation, completion, plan editing, pausing, and deletion persist", async ({
  page,
}) => {
  const browserErrors: string[] = []
  page.on("pageerror", (error) => browserErrors.push(error.message))
  await page.goto("/today")
  await addRoutineThroughUi(page, "QA morning walk")
  await expect(page.getByText("QA morning walk", { exact: true })).toBeVisible()
  await page.reload()
  await expect(page.getByText("QA morning walk", { exact: true })).toBeVisible()

  await page.getByRole("button", { name: "Mark complete" }).click()
  await expect(page.getByText("You are done for today.")).toBeVisible()
  await page.goto("/logs")
  await expect(page.getByText("QA morning walk", { exact: true })).toBeVisible()

  await page.goto("/plan")
  await page.getByRole("tab", { name: "Manage routines" }).click()
  await page.getByRole("switch", { name: "Pause QA morning walk" }).click()
  await page.reload()
  await page.getByRole("tab", { name: "Manage routines" }).click()
  await expect(
    page.getByRole("switch", { name: "Resume QA morning walk" })
  ).toBeVisible()

  await page.getByRole("button", { name: "Edit QA morning walk" }).click()
  const edit = page.getByRole("dialog", { name: "Edit routine" })
  await edit.getByLabel(/Routine name/).fill("QA edited walk")
  await edit.getByRole("button", { name: "Save changes" }).click()
  await page.reload()
  await page.getByRole("tab", { name: "Manage routines" }).click()
  await expect(page.getByText("QA edited walk", { exact: true })).toBeVisible()

  await page.getByRole("button", { name: "Delete QA edited walk" }).click()
  await page.getByRole("button", { name: "Delete routine" }).click()
  await page.reload()
  await expect(
    page.getByText("Your plan is ready for a first routine")
  ).toBeVisible()
  expect(browserErrors).toEqual([])
})

test("skipping a routine supports cancellation and records the outcome", async ({
  page,
}) => {
  await page.goto("/today")
  await addRoutineThroughUi(page, "QA skipped walk")

  await page.getByRole("button", { name: "Skip today" }).click()
  const confirmation = page.getByRole("dialog", {
    name: "Skip this routine today?",
  })
  await confirmation.getByRole("button", { name: "Keep it" }).click()
  await expect(page.getByRole("button", { name: "Mark complete" })).toBeVisible()

  await page.getByRole("button", { name: "Skip today" }).click()
  const saved = page.waitForResponse(
    (response) =>
      response.url().endsWith("/api/app") && response.request().method() === "POST"
  )
  await confirmation.getByRole("button", { name: "Skip today" }).click()
  await saved
  await page.goto("/logs")
  const row = page.locator("article").filter({ hasText: "QA skipped walk" })
  await expect(row.getByText("Skipped", { exact: true })).toBeVisible()
})

test("manual logs support create, filter, expand, edit, and delete", async ({
  page,
}) => {
  await page.goto("/logs")
  await page.getByRole("button", { name: "Add log", exact: true }).click()
  const dialog = page.getByRole("dialog", { name: "Add a log" })
  await dialog.getByLabel(/Routine name/).fill("QA manual log")
  await dialog.getByLabel(/Event time/).fill("8:15 AM")
  await dialog.getByLabel(/Category/).fill("QA")
  await dialog.getByLabel(/Scheduled time/).fill("8:00 AM")
  await dialog.getByLabel("Actual time").fill("8:15 AM")
  await dialog.getByLabel("Note").fill("E2E context")
  await dialog.getByRole("button", { name: "Add log" }).click()
  await page.reload()
  await expect(page.getByText("QA manual log", { exact: true })).toBeVisible()

  await page.getByRole("tab", { name: "Skipped" }).click()
  await expect(page.getByText("No skipped records")).toBeVisible()
  await page.getByRole("button", { name: "Show all outcomes" }).click()
  const row = page.locator("article").filter({ hasText: "QA manual log" })
  await row.getByRole("button").first().click()
  await expect(row.getByText("E2E context")).toBeVisible()

  await page.getByRole("button", { name: "Edit QA manual log log" }).click()
  const edit = page.getByRole("dialog", { name: "Edit log" })
  await edit.getByLabel(/Routine name/).fill("QA corrected log")
  await edit.getByRole("button", { name: "Save changes" }).click()
  await page.reload()
  await expect(
    page.getByText("QA corrected log", { exact: true })
  ).toBeVisible()

  await page
    .getByRole("button", { name: "Delete QA corrected log log" })
    .click()
  await page.getByRole("button", { name: "Delete log" }).click()
  await page.reload()
  await expect(page.getByText("No logs yet")).toBeVisible()
})

test("settings profile, reminder, timezone, and category CRUD persist", async ({
  page,
  request,
}) => {
  await page.goto("/settings")
  await page.getByLabel("Name").fill("QA User")
  await page.getByRole("combobox", { name: "Default reminder" }).click()
  await page.getByRole("option", { name: "30 minutes before" }).click()
  await page.getByRole("combobox", { name: "Timezone" }).click()
  await page.getByPlaceholder("Search timezones…").fill("UTC")
  await page.getByRole("option", { name: /^UTC UTC\+00:00$/ }).click()
  await page.getByRole("button", { name: "Save changes" }).click()
  await expect(page.getByText("Settings saved")).toBeVisible()
  await page.reload()
  await expect(page.getByLabel("Name")).toHaveValue("QA User")
  await expect(
    page.getByRole("combobox", { name: "Default reminder" })
  ).toHaveText("30 minutes before")
  expect((await appData(request)).settings.timezone).toBe("UTC")

  await page.getByRole("button", { name: "Add category" }).click()
  await page.getByLabel("Category name").fill("QA Category")
  await page.getByRole("button", { name: "Add category" }).click()
  await expect(page.getByText("QA Category", { exact: true })).toBeVisible()
  await page.getByRole("button", { name: "Rename QA Category" }).click()
  await page.getByLabel("Category name").fill("QA Renamed")
  await page.getByRole("button", { name: "Save changes" }).click()
  await expect(page.getByText("QA Renamed", { exact: true })).toBeVisible()
  await page.getByRole("button", { name: "Delete QA Renamed" }).click()
  await page.getByRole("button", { name: "Delete category" }).click()
  await expect(page.getByText("QA Renamed", { exact: true })).toBeHidden()
})

test("insight ranges render recorded outcomes", async ({ page, request }) => {
  await seedRoutine(request, "QA insight routine")
  const data = await appData(request)
  await mutate(request, { action: "complete", id: data.routines[0]?.id })

  await page.goto("/insights")
  await expect(page.getByText("Completion rate")).toBeVisible()
  const thirtyDays = page.getByRole("button", { name: "30 days" })
  await thirtyDays.click()
  await expect(thirtyDays).toHaveClass(/bg-paper-0/)
  const ninetyDays = page.getByRole("button", { name: "90 days" })
  await ninetyDays.click()
  await expect(ninetyDays).toHaveClass(/bg-paper-0/)
  await expect(page.getByText("Routines scheduled")).toBeVisible()
  await expect(page.getByText("QA", { exact: true })).toBeVisible()
})
