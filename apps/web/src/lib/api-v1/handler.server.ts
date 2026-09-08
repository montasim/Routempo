import "@tanstack/react-start/server-only"

import { dataExportSchema } from "@/lib/export-data"
import {
  getIntegrations,
  syncIntegrations,
} from "@/lib/integrations-api.server"
import { addDays, dateKeyInTimeZone, validTimeZone } from "@/lib/user-calendar"

import { analytics } from "./analytics.server"
import {
  authSession,
  authenticatedUser,
  createIntegrationConnect,
  disconnectIntegration,
  revokeMobileSession,
} from "./auth.server"
import { handlePublicAuthRoute } from "./auth-routes.server"
import { backup, restoreBackup } from "./backup.server"
import {
  bootstrapDeviceTimeZone,
  createCategory,
  createRoutine,
  deleteCategory,
  deleteRoutine,
  listCategories,
  listOccurrences,
  listRoutines,
  renameCategory,
  resolveOccurrence,
  revertOccurrence,
  settingsFor,
  updateRoutine,
  updateSettings,
} from "./data.server"
import { ApiError } from "./errors"
import { executeIdempotent } from "./idempotency.server"
import {
  createLog,
  deleteLog,
  listLogs,
  logsCsv,
  updateLog,
} from "./logs.server"
import { normalizeName } from "./normalize"
import {
  matchOccurrenceAction,
  matchResource,
  optionalJson,
  validationResponse,
} from "./route-utils"
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
  analyticsQuerySchema,
  issues,
  logPatchSchema,
  logWriteSchema,
  occurrenceResolutionSchema,
  routinePatchSchema,
  routineWriteSchema,
  settingsPatchSchema,
} from "./schemas"

type Identity = NonNullable<Awaited<ReturnType<typeof authenticatedUser>>>

type DeviceTimeZoneInitializer = (
  userId: string,
  name: string | undefined,
  timezone: string
) => Promise<unknown>

type ApiRuntime = {
  publicAuth: typeof handlePublicAuthRoute
  authenticate: typeof authenticatedUser
  authenticated: typeof handleAuthenticated
  idempotent: typeof executeIdempotent
}

export function createApiV1Handler(overrides: Partial<ApiRuntime> = {}) {
  const runtime: ApiRuntime = {
    publicAuth: handlePublicAuthRoute,
    authenticate: authenticatedUser,
    authenticated: handleAuthenticated,
    idempotent: executeIdempotent,
    ...overrides,
  }
  return async (request: Request) => {
    const id = requestId(request)
    try {
      if (request.method === "OPTIONS") return optionsResponse()
      const url = new URL(request.url)
      const path =
        url.pathname.replace(/^\/api\/v1\/?/, "/").replace(/\/$/, "") || "/"

      const publicAuth = await runtime.publicAuth(request, path, id)
      if (publicAuth) return withApiHeaders(publicAuth, id)

      const identity = await runtime.authenticate(request)
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

      return runtime.idempotent(request, identity.id, async () =>
        withApiHeaders(
          await runtime.authenticated(request, url, path, id, identity),
          id
        )
      )
    } catch (error) {
      return withApiHeaders(mapError(request, id, error), id)
    }
  }
}

export const handleApiV1 = createApiV1Handler()

async function handleAuthenticated(
  request: Request,
  url: URL,
  path: string,
  id: string,
  identity: Identity
) {
  await bootstrapRequestTimeZone(request, identity)

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
  if (path === "/auth/logout" && request.method === "POST")
    return ok({ revoked: await revokeMobileSession(request) }, id)

  if (path === "/settings") {
    if (request.method === "GET")
      return ok({ settings: await settingsFor(identity.id, identity.name) }, id)
    if (request.method === "PATCH") {
      const parsed = settingsPatchSchema.safeParse(await jsonBody(request))
      if (!parsed.success) return validationResponse(request, id, parsed.error)
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
      if (!parsed.success) return validationResponse(request, id, parsed.error)
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
      if (!parsed.success) return validationResponse(request, id, parsed.error)
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
      if (!parsed.success) return validationResponse(request, id, parsed.error)
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
      if (!parsed.success) return validationResponse(request, id, parsed.error)
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
    if (!parsed.success) return validationResponse(request, id, parsed.error)
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
          (!category ||
            normalizeName(log.category) === normalizeName(category)) &&
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
      if (!parsed.success) return validationResponse(request, id, parsed.error)
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
      if (!parsed.success) return validationResponse(request, id, parsed.error)
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
    const query = analyticsQuerySchema.safeParse({
      range: url.searchParams.get("range") ?? undefined,
      startDate: url.searchParams.get("startDate") ?? undefined,
      endDate: url.searchParams.get("endDate") ?? undefined,
    })
    if (!query.success) return validationResponse(request, id, query.error)
    const endDate = query.data.endDate ?? dateKeyInTimeZone(settings.timezone)
    const startDate =
      query.data.startDate ?? addDays(endDate, -(query.data.range - 1))
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
      if (!parsed.success) return validationResponse(request, id, parsed.error)
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

export async function bootstrapRequestTimeZone(
  request: Request,
  identity: Pick<Identity, "id" | "name">,
  initialize: DeviceTimeZoneInitializer = bootstrapDeviceTimeZone
) {
  const timezone = request.headers.get("x-routempo-timezone")?.trim()
  if (!timezone || !validTimeZone(timezone)) return false
  await initialize(identity.id, identity.name, timezone)
  return true
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

function mapError(request: Request, id: string, error: unknown) {
  if (error instanceof ApiError)
    return problem(request, id, error.status, error.code, error.detail)
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
