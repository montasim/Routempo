import "@tanstack/react-start/server-only"

import { dataExportSchema } from "@/lib/export-data"
import {
  getIntegrations,
  syncIntegrations,
} from "@/lib/integrations-api.server"
import { addDays, dateKeyInTimeZone } from "@/lib/user-calendar"

import {
  authSession,
  authenticatedUser,
  createIntegrationConnect,
  createSocialExchangeCode,
  disconnectIntegration,
  exchangeSocialCode,
  googleTokenSignIn,
  integrationCallback,
  refreshMobileSession,
  revokeMobileSession,
  socialAuthorizationResponse,
  startIntegrationConnect,
} from "./auth.server"
import {
  analytics,
  backup,
  createCategory,
  createLog,
  createRoutine,
  deleteCategory,
  deleteLog,
  deleteRoutine,
  listCategories,
  listLogs,
  listOccurrences,
  listRoutines,
  logsCsv,
  renameCategory,
  resolveOccurrence,
  restoreBackup,
  revertOccurrence,
  settingsFor,
  updateLog,
  updateRoutine,
  updateSettings,
} from "./data.server"
import {
  jsonBody,
  methodNotAllowed,
  ok,
  page,
  pagination,
  problem,
  requestId,
} from "./response"
import {
  categoryPatchSchema,
  categoryWriteSchema,
  googleTokenSchema,
  issues,
  logPatchSchema,
  logWriteSchema,
  occurrenceResolutionSchema,
  routinePatchSchema,
  routineWriteSchema,
  settingsPatchSchema,
  socialExchangeSchema,
  socialStartSchema,
} from "./schemas"

type Identity = NonNullable<Awaited<ReturnType<typeof authenticatedUser>>>

export async function handleApiV1(request: Request) {
  const id = requestId(request)
  try {
    if (request.method === "OPTIONS") return optionsResponse()
    const url = new URL(request.url)
    const path =
      url.pathname.replace(/^\/api\/v1\/?/, "/").replace(/\/$/, "") || "/"

    const publicAuth = await handlePublicAuth(request, path, id)
    if (publicAuth) return withApiHeaders(publicAuth, id)

    const identity = await authenticatedUser(request)
    if (!identity)
      return withApiHeaders(
        problem(
          request,
          id,
          401,
          "UNAUTHORIZED",
          "A valid session is required"
        ),
        id
      )

    const response = await handleAuthenticated(request, url, path, id, identity)
    return withApiHeaders(response, id)
  } catch (error) {
    return withApiHeaders(mapError(request, id, error), id)
  }
}

async function handlePublicAuth(request: Request, path: string, id: string) {
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
    if (!parsed.success) return validation(request, id, parsed.error)
    return ok(
      await googleTokenSignIn(request, parsed.data.idToken, parsed.data.nonce),
      id
    )
  }

  if (path === "/auth/social/start") {
    if (request.method !== "GET") return methodNotAllowed(request, id, ["GET"])
    const input = {
      provider: new URL(request.url).searchParams.get("provider"),
      redirectUri: new URL(request.url).searchParams.get("redirectUri"),
    }
    const parsed = socialStartSchema.safeParse(input)
    if (!parsed.success) return validation(request, id, parsed.error)
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
    if (!parsed.success) return validation(request, id, parsed.error)
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

async function handleAuthenticated(
  request: Request,
  url: URL,
  path: string,
  id: string,
  identity: Identity
) {
  if (path === "/auth/me" && request.method === "GET") {
    const session = await authSession(request)
    return ok(
      {
        user: {
          id: identity.id,
          name: identity.name,
          email: identity.email,
          image: session?.user.image ?? null,
        },
        settings: await settingsFor(identity.id, identity.name),
      },
      id
    )
  }
  if (path === "/auth/refresh" && request.method === "POST") {
    const refreshed = await refreshMobileSession(request)
    return refreshed
      ? ok(refreshed, id)
      : problem(request, id, 401, "SESSION_EXPIRED", "The session has expired")
  }
  if (path === "/auth/logout" && request.method === "POST")
    return ok({ revoked: await revokeMobileSession(request) }, id)

  if (path === "/settings") {
    if (request.method === "GET")
      return ok({ settings: await settingsFor(identity.id, identity.name) }, id)
    if (request.method === "PATCH") {
      const parsed = settingsPatchSchema.safeParse(await jsonBody(request))
      if (!parsed.success) return validation(request, id, parsed.error)
      return ok(
        {
          settings: await updateSettings(
            identity.id,
            parsed.data,
            identity.name
          ),
        },
        id
      )
    }
    return methodNotAllowed(request, id, ["GET", "PATCH"])
  }

  if (path === "/categories") {
    if (request.method === "GET") {
      const items = await listCategories(identity.id)
      const result = page(items, pagination(url).limit, pagination(url).offset)
      return ok(
        { categories: result.values },
        id,
        {},
        { total: result.total, nextCursor: result.nextCursor }
      )
    }
    if (request.method === "POST") {
      const parsed = categoryWriteSchema.safeParse(await jsonBody(request))
      if (!parsed.success) return validation(request, id, parsed.error)
      return ok(
        { category: await createCategory(identity.id, parsed.data.name) },
        id,
        { status: 201 }
      )
    }
    return methodNotAllowed(request, id, ["GET", "POST"])
  }

  const categoryId = matchResource(path, "categories")
  if (categoryId) {
    if (request.method === "PATCH") {
      const parsed = categoryPatchSchema.safeParse(await jsonBody(request))
      if (!parsed.success) return validation(request, id, parsed.error)
      const category = parsed.data.name
        ? await renameCategory(identity.id, categoryId, parsed.data.name)
        : null
      return category
        ? ok({ category }, id)
        : problem(request, id, 404, "CATEGORY_NOT_FOUND", "Category not found")
    }
    if (request.method === "DELETE") {
      const result = await deleteCategory(identity.id, categoryId)
      if (result.status === "not-found")
        return problem(
          request,
          id,
          404,
          "CATEGORY_NOT_FOUND",
          "Category not found"
        )
      if (result.status === "in-use")
        return problem(
          request,
          id,
          409,
          "CATEGORY_IN_USE",
          "Pause or delete routines using this category before deleting it"
        )
      return ok({ deleted: true, category: result.category }, id)
    }
    return methodNotAllowed(request, id, ["PATCH", "DELETE"])
  }

  if (path === "/routines") {
    if (request.method === "GET") {
      const includeInactive =
        url.searchParams.get("includeInactive") !== "false"
      let items = await listRoutines(identity.id, includeInactive)
      const categoryId = url.searchParams.get("categoryId")
      if (categoryId)
        items = items.filter((routine) => routine.categoryId === categoryId)
      const result = page(items, pagination(url).limit, pagination(url).offset)
      return ok(
        { routines: result.values },
        id,
        {},
        { total: result.total, nextCursor: result.nextCursor }
      )
    }
    if (request.method === "POST") {
      const parsed = routineWriteSchema.safeParse(await jsonBody(request))
      if (!parsed.success) return validation(request, id, parsed.error)
      return ok(
        {
          routine: await createRoutine(identity.id, parsed.data, identity.name),
        },
        id,
        { status: 201 }
      )
    }
    return methodNotAllowed(request, id, ["GET", "POST"])
  }

  const routineId = matchResource(path, "routines")
  if (routineId) {
    if (request.method === "PATCH") {
      const parsed = routinePatchSchema.safeParse(await jsonBody(request))
      if (!parsed.success) return validation(request, id, parsed.error)
      const routine = await updateRoutine(
        identity.id,
        routineId,
        parsed.data,
        identity.name
      )
      return routine
        ? ok({ routine }, id)
        : problem(request, id, 404, "ROUTINE_NOT_FOUND", "Routine not found")
    }
    if (request.method === "DELETE") {
      const routine = await deleteRoutine(identity.id, routineId)
      return routine
        ? ok({ deleted: true, routine }, id)
        : problem(request, id, 404, "ROUTINE_NOT_FOUND", "Routine not found")
    }
    return methodNotAllowed(request, id, ["PATCH", "DELETE"])
  }

  if (path === "/occurrences") {
    if (request.method !== "GET") return methodNotAllowed(request, id, ["GET"])
    const settings = await settingsFor(identity.id, identity.name)
    const date = url.searchParams.get("date")
    const startDate =
      date ??
      url.searchParams.get("startDate") ??
      dateKeyInTimeZone(settings.timezone)
    const endDate = date ?? url.searchParams.get("endDate") ?? startDate
    const items = await listOccurrences(
      identity.id,
      startDate,
      endDate,
      url.searchParams.get("status") ?? undefined
    )
    const result = page(items, pagination(url).limit, pagination(url).offset)
    return ok(
      { occurrences: result.values },
      id,
      {},
      { total: result.total, nextCursor: result.nextCursor }
    )
  }

  if (path === "/occurrences/generate" && request.method === "POST") {
    const settings = await settingsFor(identity.id, identity.name)
    const startDate = dateKeyInTimeZone(settings.timezone)
    const occurrences = await listOccurrences(
      identity.id,
      startDate,
      addDays(startDate, 6)
    )
    return ok(
      {
        generated: occurrences.length,
        startDate,
        endDate: addDays(startDate, 6),
      },
      id
    )
  }

  const occurrenceAction = matchOccurrenceAction(path)
  if (occurrenceAction) {
    if (request.method !== "POST")
      return methodNotAllowed(request, id, ["POST"])
    if (occurrenceAction.action === "revert") {
      const occurrence = await revertOccurrence(
        identity.id,
        occurrenceAction.id
      )
      return occurrence
        ? ok({ occurrence }, id)
        : problem(
            request,
            id,
            404,
            "OCCURRENCE_NOT_FOUND",
            "Occurrence not found"
          )
    }
    const parsed = occurrenceResolutionSchema.safeParse(
      await optionalJson(request)
    )
    if (!parsed.success) return validation(request, id, parsed.error)
    const occurrence = await resolveOccurrence(
      identity.id,
      occurrenceAction.id,
      occurrenceAction.action === "complete" ? "completed" : "skipped",
      identity.name,
      parsed.data.actualTime,
      parsed.data.note
    )
    return ok({ occurrence }, id)
  }

  if (path === "/logs") {
    if (request.method === "GET") {
      let items = await listLogs(identity.id)
      const startDate = url.searchParams.get("startDate")
      const endDate = url.searchParams.get("endDate")
      const routineId = url.searchParams.get("routineId")
      const category = url.searchParams.get("category")
      const status = url.searchParams.get("status")
      items = items.filter(
        (log) =>
          (!startDate || log.date >= startDate) &&
          (!endDate || log.date <= endDate) &&
          (!routineId || log.routineId === routineId) &&
          (!category || normalized(log.category) === normalized(category)) &&
          (!status || log.status === status.toLowerCase())
      )
      const result = page(items, pagination(url).limit, pagination(url).offset)
      return ok(
        { logs: result.values },
        id,
        {},
        { total: result.total, nextCursor: result.nextCursor }
      )
    }
    if (request.method === "POST") {
      const parsed = logWriteSchema.safeParse(await jsonBody(request))
      if (!parsed.success) return validation(request, id, parsed.error)
      return ok(
        { log: await createLog(identity.id, parsed.data, identity.name) },
        id,
        { status: 201 }
      )
    }
    return methodNotAllowed(request, id, ["GET", "POST"])
  }

  const logId = matchResource(path, "logs")
  if (logId) {
    if (request.method === "PATCH") {
      const parsed = logPatchSchema.safeParse(await jsonBody(request))
      if (!parsed.success) return validation(request, id, parsed.error)
      const log = await updateLog(identity.id, logId, parsed.data)
      return log
        ? ok({ log }, id)
        : problem(request, id, 404, "LOG_NOT_FOUND", "Log not found")
    }
    if (request.method === "DELETE") {
      const log = await deleteLog(identity.id, logId)
      return log
        ? ok({ deleted: true, log }, id)
        : problem(request, id, 404, "LOG_NOT_FOUND", "Log not found")
    }
    return methodNotAllowed(request, id, ["PATCH", "DELETE"])
  }

  if (path === "/analytics" && request.method === "GET") {
    const settings = await settingsFor(identity.id, identity.name)
    const endDate =
      url.searchParams.get("endDate") ?? dateKeyInTimeZone(settings.timezone)
    const days = Number(url.searchParams.get("range") ?? 7)
    const startDate =
      url.searchParams.get("startDate") ??
      addDays(endDate, -(days === 30 || days === 90 ? days - 1 : 6))
    return ok(
      { analytics: await analytics(identity.id, startDate, endDate) },
      id
    )
  }

  if (path === "/backup") {
    if (request.method === "GET")
      return ok({ backup: await backup(identity.id, identity.name) }, id)
    if (request.method === "PUT") {
      const parsed = dataExportSchema.safeParse(await jsonBody(request))
      if (!parsed.success) return validation(request, id, parsed.error)
      await restoreBackup(identity.id, parsed.data.data, identity.name)
      return ok({ restored: true }, id)
    }
    return methodNotAllowed(request, id, ["GET", "PUT"])
  }

  if (path === "/export" && request.method === "GET") {
    const csv = await logsCsv(
      identity.id,
      url.searchParams.get("startDate") ?? undefined,
      url.searchParams.get("endDate") ?? undefined
    )
    return new Response(csv, {
      headers: {
        "content-type": "text/csv; charset=utf-8",
        "content-disposition": `attachment; filename="routempo-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    })
  }

  if (path === "/integrations") {
    if (request.method === "GET")
      return envelopeLegacy(request, await getIntegrations(request), id)
    if (request.method === "POST")
      return envelopeLegacy(request, await syncIntegrations(request), id)
    return methodNotAllowed(request, id, ["GET", "POST"])
  }

  const integrationProvider = path.match(
    /^\/integrations\/(google|microsoft)\/(connect)$/
  )
  if (integrationProvider?.[1]) {
    if (request.method !== "POST")
      return methodNotAllowed(request, id, ["POST"])
    const body = (await jsonBody(request)) as { redirectUri?: unknown }
    if (typeof body.redirectUri !== "string")
      return problem(
        request,
        id,
        422,
        "VALIDATION_ERROR",
        "redirectUri is required"
      )
    return ok(
      await createIntegrationConnect(
        request,
        identity.id,
        integrationProvider[1] as "google" | "microsoft",
        body.redirectUri
      ),
      id,
      { status: 201 }
    )
  }

  const disconnectProvider = path.match(/^\/integrations\/(google|microsoft)$/)
  if (disconnectProvider?.[1]) {
    if (request.method !== "DELETE")
      return methodNotAllowed(request, id, ["DELETE"])
    return ok(
      {
        disconnected: await disconnectIntegration(
          request,
          disconnectProvider[1] as "google" | "microsoft"
        ),
      },
      id
    )
  }

  return problem(request, id, 404, "ROUTE_NOT_FOUND", "API route not found")
}

async function envelopeLegacy(
  request: Request,
  response: Response,
  id: string
) {
  const data = (await response.json()) as { error?: string }
  return response.ok
    ? ok(data, id, { status: response.status })
    : problem(
        request,
        id,
        response.status,
        response.status === 401 ? "UNAUTHORIZED" : "INTEGRATION_ERROR",
        data.error || "The integration request failed"
      )
}

function matchResource(path: string, resource: string) {
  const match = path.match(new RegExp(`^/${resource}/([^/]+)$`))
  return match?.[1] ? decodeURIComponent(match[1]) : null
}

function matchOccurrenceAction(path: string) {
  const match = path.match(/^\/occurrences\/(.+)\/(complete|skip|revert)$/)
  if (!match?.[1] || !match[2]) return null
  return {
    id: decodeURIComponent(match[1]),
    action: match[2] as "complete" | "skip" | "revert",
  }
}

async function optionalJson(request: Request) {
  return request.headers.get("content-length") === "0" ||
    !request.headers.get("content-type")
    ? {}
    : jsonBody(request)
}

function validation(
  request: Request,
  id: string,
  error: { issues: readonly { path: PropertyKey[]; message: string }[] }
) {
  return problem(
    request,
    id,
    422,
    "VALIDATION_ERROR",
    "One or more fields are invalid",
    error.issues.map((issue) => ({
      path: issue.path.map(String).join("."),
      message: issue.message,
    }))
  )
}

function mapError(request: Request, id: string, error: unknown) {
  const message =
    error instanceof Error ? error.message : "Unexpected API error"
  const known: Record<string, [number, string, string]> = {
    JSON_REQUIRED: [
      400,
      "JSON_REQUIRED",
      "Content-Type application/json is required",
    ],
    CATEGORY_NOT_FOUND: [
      422,
      "CATEGORY_NOT_FOUND",
      "The selected category does not exist",
    ],
    INVALID_DATE_RANGE: [
      422,
      "INVALID_DATE_RANGE",
      "End date must not precede start date",
    ],
    DATE_RANGE_TOO_LARGE: [
      422,
      "DATE_RANGE_TOO_LARGE",
      "Occurrence ranges cannot exceed 93 days",
    ],
    OCCURRENCE_NOT_FOUND: [404, "OCCURRENCE_NOT_FOUND", "Occurrence not found"],
    OCCURRENCE_NOT_TODAY: [
      409,
      "OCCURRENCE_NOT_TODAY",
      "Only today's occurrence can be resolved",
    ],
    OCCURRENCE_ALREADY_RESOLVED: [
      409,
      "OCCURRENCE_ALREADY_RESOLVED",
      "Revert the current outcome before changing it",
    ],
    INVALID_ROUTINE_PATCH: [
      422,
      "INVALID_ROUTINE_PATCH",
      "The combined routine schedule is invalid",
    ],
    INVALID_REDIRECT_URI: [
      400,
      "INVALID_REDIRECT_URI",
      "The mobile redirect URI is not allowed",
    ],
  }
  const mapped = known[message]
  if (mapped) return problem(request, id, mapped[0], mapped[1], mapped[2])
  if (message === "Routines cannot be added to past days")
    return problem(request, id, 422, "PAST_START_DATE", message)
  console.error("API v1 request failed", { requestId: id, error })
  return problem(
    request,
    id,
    500,
    "INTERNAL_ERROR",
    "The request could not be completed"
  )
}

function optionsResponse() {
  return new Response(null, {
    status: 204,
    headers: {
      allow: "GET, POST, PUT, PATCH, DELETE, OPTIONS",
      "access-control-allow-methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
      "access-control-allow-headers":
        "authorization, content-type, idempotency-key, x-request-id, x-routempo-timezone",
      "access-control-max-age": "86400",
    },
  })
}

function withApiHeaders(response: Response, id: string) {
  response.headers.set("x-api-version", "v1")
  response.headers.set("x-request-id", id)
  response.headers.set("cache-control", "no-store")
  return response
}

function normalized(value: string) {
  return value.normalize("NFKC").trim().toLocaleLowerCase("en-US")
}
