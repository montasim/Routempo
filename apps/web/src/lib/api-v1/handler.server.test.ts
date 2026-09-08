import { describe, expect, it, vi } from "vitest"

import { bootstrapRequestTimeZone, createApiV1Handler } from "./handler.server"
import { ok } from "./response"

describe("/api/v1 HTTP seam", () => {
  it("authenticates and runs protected mutations through idempotency", async () => {
    const authenticated = vi.fn(
      async (_request: Request, _url: URL, path: string, id: string) =>
        ok({ path }, id, { status: 201 })
    )
    const idempotent = vi.fn(
      async (
        _request: Request,
        _userId: string,
        operation: () => Promise<Response>
      ) => operation()
    )
    const handler = createApiV1Handler({
      publicAuth: async () => null,
      authenticate: async () => ({
        id: "user-1",
        name: "Test user",
        email: "test@example.com",
      }),
      authenticated,
      idempotent,
    })

    const response = await handler(
      new Request("https://example.test/api/v1/routines", { method: "POST" })
    )

    expect(response.status).toBe(201)
    expect(await response.json()).toMatchObject({ data: { path: "/routines" } })
    expect(authenticated).toHaveBeenCalledOnce()
    expect(idempotent).toHaveBeenCalledOnce()
  })

  it("rejects protected requests before dispatch when no session exists", async () => {
    const authenticated = vi.fn()
    const handler = createApiV1Handler({
      publicAuth: async () => null,
      authenticate: async () => null,
      authenticated,
    })

    const response = await handler(
      new Request("https://example.test/api/v1/settings")
    )

    expect(response.status).toBe(401)
    expect(authenticated).not.toHaveBeenCalled()
  })

  it("bootstraps a valid device timezone without accepting invalid headers", async () => {
    const initialize = vi.fn(async () => true)
    const identity = { id: "user-1", name: "Test user" }

    await expect(
      bootstrapRequestTimeZone(
        new Request("https://example.test/api/v1/auth/me", {
          headers: { "x-routempo-timezone": "Asia/Dhaka" },
        }),
        identity,
        initialize
      )
    ).resolves.toBe(true)
    expect(initialize).toHaveBeenCalledWith("user-1", "Test user", "Asia/Dhaka")

    await expect(
      bootstrapRequestTimeZone(
        new Request("https://example.test/api/v1/auth/me", {
          headers: { "x-routempo-timezone": "not/a-zone" },
        }),
        identity,
        initialize
      )
    ).resolves.toBe(false)
    expect(initialize).toHaveBeenCalledOnce()
  })
})
