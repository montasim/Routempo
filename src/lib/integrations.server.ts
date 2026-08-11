import "@tanstack/react-start/server-only"

import { and, eq } from "drizzle-orm"

import { getDatabase } from "@/db/client.server"
import { account } from "@/db/schema"
import { getAuth } from "@/lib/auth.server"
import {
  addMinutes,
  type ExternalItem,
  type IntegrationProvider,
  type IntegrationResource,
  routineDateTime,
} from "@/lib/integration-mapping"
import type { Routine } from "@/lib/types"

type JsonObject = Record<string, unknown>

export const integrationScopes = {
  google: [
    "https://www.googleapis.com/auth/calendar.events",
    "https://www.googleapis.com/auth/tasks",
  ],
  microsoft: ["offline_access", "Calendars.ReadWrite", "Tasks.ReadWrite"],
} satisfies Record<IntegrationProvider, string[]>

export async function connectedProviders(userId: string) {
  const rows = await getDatabase()
    .select({ providerId: account.providerId, scope: account.scope })
    .from(account)
    .where(eq(account.userId, userId))
  return {
    google: connectionState(rows, "google", integrationScopes.google),
    microsoft: connectionState(
      rows,
      "microsoft-entra-id",
      integrationScopes.microsoft.filter((scope) => scope !== "offline_access")
    ),
  }
}

function connectionState(
  rows: Array<{ providerId: string; scope: string | null }>,
  providerId: string,
  requiredScopes: string[]
) {
  const row = rows.find((item) => item.providerId === providerId)
  const granted = new Set((row?.scope ?? "").split(/[ ,]+/).filter(Boolean))
  return {
    connected: Boolean(row),
    ready: Boolean(row) && requiredScopes.every((scope) => granted.has(scope)),
  }
}

export async function getProviderToken(
  request: Request,
  userId: string,
  provider: IntegrationProvider
) {
  const providerId = provider === "google" ? "google" : "microsoft-entra-id"
  try {
    const result = await (
      await getAuth()
    ).api.getAccessToken({
      body: { providerId },
      headers: request.headers,
    })
    if (result.accessToken) return result.accessToken
  } catch (error) {
    if (provider !== "microsoft") throw error
  }

  if (provider === "microsoft") return refreshMicrosoftToken(userId, providerId)
  throw new Error(`No usable ${provider} access token is available`)
}

async function refreshMicrosoftToken(userId: string, providerId: string) {
  const db = getDatabase()
  const rows = await db
    .select()
    .from(account)
    .where(and(eq(account.userId, userId), eq(account.providerId, providerId)))
    .limit(1)
  const linked = rows[0]
  if (!linked?.refreshToken) throw new Error("Reconnect Microsoft to continue")
  const clientId = process.env.MICROSOFT_CLIENT_ID
  const clientSecret = process.env.MICROSOFT_CLIENT_SECRET
  if (!clientId || !clientSecret) throw new Error("Microsoft is not configured")

  const tenant = process.env.MICROSOFT_TENANT_ID || "common"
  const response = await fetch(
    `https://login.microsoftonline.com/${encodeURIComponent(tenant)}/oauth2/v2.0/token`,
    {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: "refresh_token",
        refresh_token: linked.refreshToken,
        scope: [
          "openid",
          "profile",
          "email",
          ...integrationScopes.microsoft,
        ].join(" "),
      }),
    }
  )
  const payload = (await response.json()) as {
    access_token?: string
    refresh_token?: string
    expires_in?: number
    error_description?: string
  }
  if (!response.ok || !payload.access_token)
    throw new Error(
      payload.error_description || "Microsoft token refresh failed"
    )
  await db
    .update(account)
    .set({
      accessToken: payload.access_token,
      refreshToken: payload.refresh_token ?? linked.refreshToken,
      accessTokenExpiresAt: new Date(
        Date.now() + (payload.expires_in ?? 3600) * 1000
      ),
      updatedAt: new Date(),
    })
    .where(eq(account.id, linked.id))
  return payload.access_token
}

export async function fetchExternalItems(
  provider: IntegrationProvider,
  resource: IntegrationResource,
  token: string,
  now = new Date()
): Promise<ExternalItem[]> {
  return provider === "google"
    ? fetchGoogleItems(resource, token, now)
    : fetchMicrosoftItems(resource, token, now)
}

async function fetchGoogleItems(
  resource: IntegrationResource,
  token: string,
  now: Date
) {
  if (resource === "calendar") {
    const until = new Date(now)
    until.setUTCDate(until.getUTCDate() + 90)
    const url = new URL(
      "https://www.googleapis.com/calendar/v3/calendars/primary/events"
    )
    url.search = new URLSearchParams({
      timeMin: now.toISOString(),
      timeMax: until.toISOString(),
      singleEvents: "true",
      orderBy: "startTime",
      maxResults: "250",
    }).toString()
    const data = await providerJson<{ items?: GoogleEvent[] }>(url, token)
    return (data.items ?? [])
      .filter((item) => item.status !== "cancelled")
      .map((item) => ({
        id: item.id,
        title: item.summary || "Untitled event",
        note: item.description,
        date: item.start?.date,
        dateTime: item.start?.dateTime,
      }))
  }

  const lists = await providerJson<{ items?: Array<{ id: string }> }>(
    "https://tasks.googleapis.com/tasks/v1/users/@me/lists?maxResults=100",
    token
  )
  const items: ExternalItem[] = []
  for (const list of (lists.items ?? []).slice(0, 20)) {
    const tasks = await providerJson<{ items?: GoogleTask[] }>(
      `https://tasks.googleapis.com/tasks/v1/lists/${encodeURIComponent(list.id)}/tasks?showCompleted=false&showHidden=false&maxResults=100`,
      token
    )
    for (const task of tasks.items ?? [])
      if (task.status !== "completed" && !task.deleted)
        items.push({
          id: `${list.id}:${task.id}`,
          title: task.title || "Untitled task",
          note: task.notes,
          dateTime: task.due,
        })
  }
  return items
}

async function fetchMicrosoftItems(
  resource: IntegrationResource,
  token: string,
  now: Date
) {
  if (resource === "calendar") {
    const until = new Date(now)
    until.setUTCDate(until.getUTCDate() + 90)
    const url = new URL("https://graph.microsoft.com/v1.0/me/calendarView")
    url.search = new URLSearchParams({
      startDateTime: now.toISOString(),
      endDateTime: until.toISOString(),
      $top: "250",
      $select: "id,subject,bodyPreview,start,isCancelled",
    }).toString()
    const data = await providerJson<{ value?: MicrosoftEvent[] }>(url, token)
    return (data.value ?? [])
      .filter((item) => !item.isCancelled)
      .map((item) => ({
        id: item.id,
        title: item.subject || "Untitled event",
        note: item.bodyPreview,
        dateTime: item.start?.dateTime,
      }))
  }

  const lists = await providerJson<{ value?: MicrosoftTaskList[] }>(
    "https://graph.microsoft.com/v1.0/me/todo/lists?$top=100",
    token
  )
  const items: ExternalItem[] = []
  for (const list of (lists.value ?? []).slice(0, 20)) {
    const tasks = await providerJson<{ value?: MicrosoftTask[] }>(
      `https://graph.microsoft.com/v1.0/me/todo/lists/${encodeURIComponent(list.id)}/tasks?$top=100`,
      token
    )
    for (const task of tasks.value ?? [])
      if (task.status !== "completed")
        items.push({
          id: `${list.id}:${task.id}`,
          title: task.title || "Untitled task",
          note: task.body?.content,
          dateTime: task.dueDateTime?.dateTime,
        })
  }
  return items
}

export async function exportRoutine(
  provider: IntegrationProvider,
  resource: IntegrationResource,
  token: string,
  routine: Routine,
  timezone: string
) {
  const start = routineDateTime(routine)
  if (provider === "google" && resource === "calendar") {
    const result = await providerJson<{ id: string }>(
      "https://www.googleapis.com/calendar/v3/calendars/primary/events",
      token,
      {
        summary: routine.title,
        description: routine.note,
        start: { dateTime: start, timeZone: timezone },
        end: { dateTime: addMinutes(start, 30), timeZone: timezone },
      }
    )
    return result.id
  }
  if (provider === "google") {
    const result = await providerJson<{ id: string }>(
      "https://tasks.googleapis.com/tasks/v1/lists/@default/tasks",
      token,
      {
        title: routine.title,
        notes: routine.note,
        due: `${routine.startDate}T00:00:00.000Z`,
      }
    )
    return `@default:${result.id}`
  }
  if (resource === "calendar") {
    const result = await providerJson<{ id: string }>(
      "https://graph.microsoft.com/v1.0/me/events",
      token,
      {
        subject: routine.title,
        body: { contentType: "text", content: routine.note },
        start: { dateTime: start, timeZone: timezone },
        end: { dateTime: addMinutes(start, 30), timeZone: timezone },
      }
    )
    return result.id
  }
  const lists = await providerJson<{ value?: MicrosoftTaskList[] }>(
    "https://graph.microsoft.com/v1.0/me/todo/lists?$top=100",
    token
  )
  const list =
    lists.value?.find((item) => item.wellknownListName === "defaultList") ??
    lists.value?.[0]
  if (!list) throw new Error("Microsoft To Do has no available task list")
  const result = await providerJson<{ id: string }>(
    `https://graph.microsoft.com/v1.0/me/todo/lists/${encodeURIComponent(list.id)}/tasks`,
    token,
    {
      title: routine.title,
      body: { contentType: "text", content: routine.note },
      dueDateTime: {
        dateTime: `${routine.startDate}T00:00:00`,
        timeZone: "UTC",
      },
    }
  )
  return `${list.id}:${result.id}`
}

async function providerJson<T>(
  url: string | URL,
  token: string,
  body?: JsonObject
): Promise<T> {
  const response = await fetch(url, {
    method: body ? "POST" : "GET",
    headers: {
      authorization: `Bearer ${token}`,
      accept: "application/json",
      ...(body ? { "content-type": "application/json" } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  })
  if (!response.ok) {
    const payload = (await response.json().catch(() => ({}))) as {
      error?: { message?: string } | string
    }
    const message =
      typeof payload.error === "string"
        ? payload.error
        : payload.error?.message || `${response.status} ${response.statusText}`
    throw new Error(`Provider request failed: ${message}`)
  }
  return (await response.json()) as T
}

type GoogleEvent = {
  id: string
  status?: string
  summary?: string
  description?: string
  start?: { date?: string; dateTime?: string }
}
type GoogleTask = {
  id: string
  title?: string
  notes?: string
  due?: string
  status?: string
  deleted?: boolean
}
type MicrosoftEvent = {
  id: string
  subject?: string
  bodyPreview?: string
  start?: { dateTime?: string }
  isCancelled?: boolean
}
type MicrosoftTaskList = {
  id: string
  wellknownListName?: string
}
type MicrosoftTask = {
  id: string
  title?: string
  status?: string
  body?: { content?: string }
  dueDateTime?: { dateTime?: string }
}
