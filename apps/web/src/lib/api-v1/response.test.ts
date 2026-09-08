import { describe, expect, it } from "vitest"

import { page, pagination, problem } from "./response"

describe("API v1 transport helpers", () => {
  it("bounds list pagination and returns the next cursor", () => {
    const url = new URL("https://example.test/api/v1/logs?limit=2&cursor=1")
    const input = ["a", "b", "c", "d"]
    const query = pagination(url)
    expect(page(input, query.limit, query.offset)).toEqual({
      values: ["b", "c"],
      total: 4,
      nextCursor: "3",
    })
  })

  it("uses RFC 9457-style problem details", async () => {
    const request = new Request("https://example.test/api/v1/routines")
    const response = problem(
      request,
      "request-1",
      401,
      "UNAUTHORIZED",
      "A valid session is required"
    )
    expect(response.status).toBe(401)
    expect(response.headers.get("content-type")).toContain(
      "application/problem+json"
    )
    await expect(response.json()).resolves.toMatchObject({
      status: 401,
      code: "UNAUTHORIZED",
      instance: "/api/v1/routines",
      requestId: "request-1",
    })
  })
})
