import { jsonBody, problem } from "./response"

export function matchResource(path: string, resource: string) {
  const match = path.match(new RegExp(`^/${resource}/([^/]+)$`))
  return match?.[1] ? decodeURIComponent(match[1]) : null
}

export function matchOccurrenceAction(path: string) {
  const match = path.match(/^\/occurrences\/(.+)\/(complete|skip|revert)$/)
  return match?.[1] && match[2]
    ? {
        id: decodeURIComponent(match[1]),
        action: match[2] as "complete" | "skip" | "revert",
      }
    : null
}

export async function optionalJson(request: Request) {
  return request.headers.get("content-length") === "0" ||
    !request.headers.get("content-type")
    ? {}
    : jsonBody(request)
}

export function validationResponse(
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
