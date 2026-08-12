import "@tanstack/react-start/server-only"

import { and, eq, gt } from "drizzle-orm"

import { getDatabase } from "@/db/client.server"
import { session, user, verification } from "@/db/schema"
import { getAuth } from "@/lib/auth.server"
import { currentUser } from "@/lib/current-user.server"

const sessionSeconds = 60 * 60 * 24 * 7
const exchangePrefix = "mobile-social:"
const integrationPrefix = "mobile-integration:"

function baseUrl(request: Request) {
  return process.env.BETTER_AUTH_URL || new URL(request.url).origin
}

function allowedRedirects() {
  return new Set(
    (process.env.ROUTEMPO_MOBILE_REDIRECT_URIS || "routempo://auth/callback")
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean)
  )
}

export function validMobileRedirect(value: string) {
  return allowedRedirects().has(value)
}

export async function authenticatedUser(request: Request) {
  return currentUser(request)
}

export async function authSession(request: Request) {
  return (await getAuth()).api.getSession({ headers: request.headers })
}

export async function googleTokenSignIn(
  request: Request,
  idToken: string,
  nonce?: string
) {
  const result = await (
    await getAuth()
  ).api.signInSocial({
    headers: request.headers,
    body: {
      provider: "google",
      disableRedirect: true,
      idToken: { token: idToken, ...(nonce ? { nonce } : {}) },
    },
  })
  if (!("token" in result) || !result.token || !result.user)
    throw new Error("Google did not create a mobile session")
  return {
    session: {
      token: result.token,
      expiresAt: new Date(Date.now() + sessionSeconds * 1000).toISOString(),
    },
    user: result.user,
  }
}

export async function socialAuthorizationResponse(
  request: Request,
  provider: "google" | "microsoft",
  redirectUri: string
) {
  if (!validMobileRedirect(redirectUri)) throw new Error("INVALID_REDIRECT_URI")
  const callback = new URL("/api/v1/auth/social/callback", baseUrl(request))
  callback.searchParams.set("redirectUri", redirectUri)
  const auth = await getAuth()
  const response =
    provider === "google"
      ? await auth.api.signInSocial({
          headers: request.headers,
          body: {
            provider: "google",
            callbackURL: callback.toString(),
            disableRedirect: true,
          },
          asResponse: true,
        })
      : await auth.api.signInWithOAuth2({
          headers: request.headers,
          body: {
            providerId: "microsoft-entra-id",
            callbackURL: callback.toString(),
            disableRedirect: true,
          },
          asResponse: true,
        })
  if (!response.ok) return response
  const body = (await response.json()) as { url?: string }
  if (!body.url) throw new Error(`${provider} sign-in is not configured`)
  const redirect = new Response(null, {
    status: 302,
    headers: { location: body.url },
  })
  copySetCookies(response.headers, redirect.headers)
  return redirect
}

export async function createSocialExchangeCode(
  request: Request,
  redirectUri: string
) {
  if (!validMobileRedirect(redirectUri)) throw new Error("INVALID_REDIRECT_URI")
  const identity = await authSession(request)
  if (!identity) return null
  const code = randomToken()
  await getDatabase()
    .insert(verification)
    .values({
      id: crypto.randomUUID(),
      identifier: `${exchangePrefix}${code}`,
      value: JSON.stringify({ userId: identity.user.id, redirectUri }),
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    })
  return code
}

export async function exchangeSocialCode(code: string, redirectUri: string) {
  if (!validMobileRedirect(redirectUri)) throw new Error("INVALID_REDIRECT_URI")
  const db = getDatabase()
  const rows = await db
    .select()
    .from(verification)
    .where(
      and(
        eq(verification.identifier, `${exchangePrefix}${code}`),
        gt(verification.expiresAt, new Date())
      )
    )
    .limit(1)
  const record = rows[0]
  if (!record) return null
  const value = JSON.parse(record.value) as {
    userId?: string
    redirectUri?: string
  }
  if (!value.userId || value.redirectUri !== redirectUri) return null
  const users = await db
    .select()
    .from(user)
    .where(eq(user.id, value.userId))
    .limit(1)
  const account = users[0]
  if (!account) return null
  await db.delete(verification).where(eq(verification.id, record.id))
  const created = await createSession(account.id)
  return { session: created, user: account }
}

export async function refreshMobileSession(request: Request) {
  const identity = await authSession(request)
  if (!identity) return null
  const expiresAt = new Date(Date.now() + sessionSeconds * 1000)
  await getDatabase()
    .update(session)
    .set({ expiresAt, updatedAt: new Date() })
    .where(eq(session.id, identity.session.id))
  return {
    session: {
      token: identity.session.token,
      expiresAt: expiresAt.toISOString(),
    },
    user: identity.user,
  }
}

export async function revokeMobileSession(request: Request) {
  const identity = await authSession(request)
  if (!identity) return false
  await getDatabase().delete(session).where(eq(session.id, identity.session.id))
  return true
}

export async function createIntegrationConnect(
  request: Request,
  userId: string,
  provider: "google" | "microsoft",
  redirectUri: string
) {
  if (!validMobileRedirect(redirectUri)) throw new Error("INVALID_REDIRECT_URI")
  const code = randomToken()
  await getDatabase()
    .insert(verification)
    .values({
      id: crypto.randomUUID(),
      identifier: `${integrationPrefix}${code}`,
      value: JSON.stringify({ userId, provider, redirectUri }),
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    })
  const browserUrl = new URL(
    "/api/v1/integrations/connect/start",
    baseUrl(request)
  )
  browserUrl.searchParams.set("code", code)
  return { browserUrl: browserUrl.toString(), expiresInSeconds: 300 }
}

export async function startIntegrationConnect(request: Request, code: string) {
  const db = getDatabase()
  const rows = await db
    .select()
    .from(verification)
    .where(
      and(
        eq(verification.identifier, `${integrationPrefix}${code}`),
        gt(verification.expiresAt, new Date())
      )
    )
    .limit(1)
  const record = rows[0]
  if (!record) return null
  const value = JSON.parse(record.value) as {
    userId?: string
    provider?: "google" | "microsoft"
    redirectUri?: string
  }
  if (
    !value.userId ||
    !value.provider ||
    !value.redirectUri ||
    !validMobileRedirect(value.redirectUri)
  )
    return null
  await db.delete(verification).where(eq(verification.id, record.id))
  const mobileSession = await createSession(value.userId)
  const headers = new Headers(request.headers)
  headers.set("authorization", `Bearer ${mobileSession.token}`)
  const callback = new URL("/api/v1/integrations/callback", baseUrl(request))
  callback.searchParams.set("redirectUri", value.redirectUri)
  callback.searchParams.set("provider", value.provider)
  const auth = await getAuth()
  const response =
    value.provider === "google"
      ? await auth.api.linkSocialAccount({
          headers,
          body: {
            provider: "google",
            callbackURL: callback.toString(),
            disableRedirect: true,
            scopes: [
              "https://www.googleapis.com/auth/calendar.events",
              "https://www.googleapis.com/auth/tasks",
            ],
          },
          asResponse: true,
        })
      : await auth.api.oAuth2LinkAccount({
          headers,
          body: {
            providerId: "microsoft-entra-id",
            callbackURL: callback.toString(),
            scopes: [
              "offline_access",
              "Calendars.ReadWrite",
              "Tasks.ReadWrite",
            ],
          },
          asResponse: true,
        })
  if (!response.ok) return response
  const body = (await response.json()) as { url?: string }
  if (!body.url)
    throw new Error("Integration authorization URL was not created")
  const redirect = new Response(null, {
    status: 302,
    headers: { location: body.url },
  })
  copySetCookies(response.headers, redirect.headers)
  return redirect
}

export async function integrationCallback(
  request: Request,
  redirectUri: string
) {
  if (!validMobileRedirect(redirectUri)) throw new Error("INVALID_REDIRECT_URI")
  if (!(await authSession(request))) return null
  return redirectUri
}

export async function disconnectIntegration(
  request: Request,
  provider: "google" | "microsoft"
) {
  const result = await (
    await getAuth()
  ).api.unlinkAccount({
    headers: request.headers,
    body: {
      providerId: provider === "google" ? "google" : "microsoft-entra-id",
    },
  })
  return result.status
}

async function createSession(userId: string) {
  const token = randomToken()
  const expiresAt = new Date(Date.now() + sessionSeconds * 1000)
  await getDatabase().insert(session).values({
    id: crypto.randomUUID(),
    token,
    userId,
    expiresAt,
  })
  return { token, expiresAt: expiresAt.toISOString() }
}

function randomToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(32))
  return Buffer.from(bytes).toString("base64url")
}

function copySetCookies(source: Headers, target: Headers) {
  const values =
    "getSetCookie" in source && typeof source.getSetCookie === "function"
      ? source.getSetCookie()
      : [source.get("set-cookie")].filter((value): value is string =>
          Boolean(value)
        )
  for (const value of values) target.append("set-cookie", value)
}
