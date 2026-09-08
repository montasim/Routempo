import "@tanstack/react-start/server-only"

import {
  createSocialExchangeCode,
  exchangeSocialCode,
  googleTokenSignIn,
  integrationCallback,
  refreshMobileSession,
  socialAuthorizationResponse,
  startIntegrationConnect,
} from "./auth.server"
import { jsonBody, methodNotAllowed, ok, problem } from "./response"
import { validationResponse } from "./route-utils"
import {
  googleTokenSchema,
  socialExchangeSchema,
  socialStartSchema,
} from "./schemas"

export async function handlePublicAuthRoute(
  request: Request,
  path: string,
  id: string
) {
  if (path === "/auth/refresh") {
    if (request.method !== "POST")
      return methodNotAllowed(request, id, ["POST"])
    const refreshed = await refreshMobileSession(request)
    return refreshed
      ? ok(refreshed, id)
      : problem(request, id, 401, "SESSION_EXPIRED", "The session has expired")
  }

  if (path === "/integrations/connect/start" && request.method === "GET") {
    const code = new URL(request.url).searchParams.get("code") ?? ""
    const response = await startIntegrationConnect(request, code)
    return (
      response ??
      problem(
        request,
        id,
        401,
        "INVALID_CONNECT_CODE",
        "The integration connection code is invalid, expired, or already used"
      )
    )
  }

  if (path === "/integrations/callback" && request.method === "GET") {
    const url = new URL(request.url)
    const redirectUri = url.searchParams.get("redirectUri") ?? ""
    const provider = url.searchParams.get("provider") ?? ""
    const redirect = await integrationCallback(request, redirectUri)
    if (!redirect)
      return problem(
        request,
        id,
        401,
        "INTEGRATION_CALLBACK_UNAUTHORIZED",
        "The integration session was not found"
      )
    const destination = new URL(redirect)
    destination.searchParams.set("integration", provider)
    destination.searchParams.set("connected", "true")
    return Response.redirect(destination, 302)
  }

  if (path === "/auth/google" && request.method === "POST") {
    const parsed = googleTokenSchema.safeParse(await jsonBody(request))
    if (!parsed.success) return validationResponse(request, id, parsed.error)
    return ok(
      await googleTokenSignIn(request, parsed.data.idToken, parsed.data.nonce),
      id
    )
  }

  if (path === "/auth/social/start") {
    if (request.method !== "GET") return methodNotAllowed(request, id, ["GET"])
    const url = new URL(request.url)
    const parsed = socialStartSchema.safeParse({
      provider: url.searchParams.get("provider"),
      redirectUri: url.searchParams.get("redirectUri"),
    })
    if (!parsed.success) return validationResponse(request, id, parsed.error)
    return socialAuthorizationResponse(
      request,
      parsed.data.provider,
      parsed.data.redirectUri
    )
  }

  if (path === "/auth/social/callback" && request.method === "GET") {
    const redirectUri =
      new URL(request.url).searchParams.get("redirectUri") ?? ""
    const code = await createSocialExchangeCode(request, redirectUri)
    if (!code)
      return problem(
        request,
        id,
        401,
        "SOCIAL_CALLBACK_UNAUTHORIZED",
        "The social sign-in session was not found"
      )
    const redirect = new URL(redirectUri)
    redirect.searchParams.set("code", code)
    return Response.redirect(redirect, 302)
  }

  if (path === "/auth/social/exchange" && request.method === "POST") {
    const parsed = socialExchangeSchema.safeParse(await jsonBody(request))
    if (!parsed.success) return validationResponse(request, id, parsed.error)
    const result = await exchangeSocialCode(
      parsed.data.code,
      parsed.data.redirectUri
    )
    return result
      ? ok(result, id)
      : problem(
          request,
          id,
          401,
          "INVALID_EXCHANGE_CODE",
          "The exchange code is invalid, expired, or already used"
        )
  }

  return null
}
