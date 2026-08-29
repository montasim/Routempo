import { describe, expect, it } from "vitest"

import { bearerToken, refreshableUntil } from "./auth-session"

describe("mobile session refresh", () => {
  it("accepts a bearer token only from the authorization header", () => {
    expect(
      bearerToken(new Headers({ authorization: "Bearer session-token" }))
    ).toBe("session-token")
    expect(bearerToken(new Headers({ authorization: "Basic abc" }))).toBeNull()
  })

  it("limits refresh to the documented expiry grace period", () => {
    expect(
      refreshableUntil(new Date("2026-08-01T00:00:00.000Z")).toISOString()
    ).toBe("2026-08-31T00:00:00.000Z")
  })
})
