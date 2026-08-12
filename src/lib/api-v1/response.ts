export type ApiMeta = {
  requestId: string
  apiVersion: "v1"
  serverTime: string
  total?: number
  nextCursor?: string
}

export function requestId(request: Request) {
  return (
    request.headers.get("x-request-id")?.slice(0, 128) || crypto.randomUUID()
  )
}

export function ok(
  data: unknown,
  id: string,
  init: ResponseInit = {},
  pagination?: Pick<ApiMeta, "total" | "nextCursor">
) {
  return Response.json(
    {
      data,
      meta: {
        requestId: id,
        apiVersion: "v1",
        serverTime: new Date().toISOString(),
        ...pagination,
      } satisfies ApiMeta,
    },
    init
  )
}

const titles: Record<number, string> = {
  400: "Bad request",
  401: "Unauthorized",
  403: "Forbidden",
  404: "Not found",
  409: "Conflict",
  422: "Validation failed",
  429: "Too many requests",
  500: "Internal server error",
  502: "Upstream service error",
}

export function problem(
  request: Request,
  id: string,
  status: number,
  code: string,
  detail: string,
  errors?: Array<{ path: string; message: string }>
) {
  return Response.json(
    {
      type: `https://routempo.app/problems/${code.toLowerCase()}`,
      title: titles[status] ?? "Request failed",
      status,
      detail,
      instance: new URL(request.url).pathname,
      code,
      requestId: id,
      ...(errors?.length ? { errors } : {}),
    },
    {
      status,
      headers: { "content-type": "application/problem+json" },
    }
  )
}

export function methodNotAllowed(
  request: Request,
  id: string,
  allow: string[]
) {
  const response = problem(
    request,
    id,
    405,
    "METHOD_NOT_ALLOWED",
    `Use one of: ${allow.join(", ")}`
  )
  response.headers.set("allow", allow.join(", "))
  return response
}

export async function jsonBody(request: Request) {
  const type = request.headers.get("content-type")?.split(";", 1)[0]
  if (type !== "application/json") throw new Error("JSON_REQUIRED")
  return (await request.json()) as unknown
}

export function pagination(url: URL) {
  const limitValue = Number(url.searchParams.get("limit") ?? 50)
  const limit = Number.isInteger(limitValue)
    ? Math.min(200, Math.max(1, limitValue))
    : 50
  const cursorValue = Number(url.searchParams.get("cursor") ?? 0)
  const offset =
    Number.isInteger(cursorValue) && cursorValue >= 0 ? cursorValue : 0
  return { limit, offset }
}

export function page<T>(items: T[], limit: number, offset: number) {
  const values = items.slice(offset, offset + limit)
  const nextOffset = offset + values.length
  return {
    values,
    total: items.length,
    nextCursor: nextOffset < items.length ? String(nextOffset) : undefined,
  }
}
