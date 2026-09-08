import { describe, expect, it } from "vitest"

import { mobileCallbackRedirect } from "./mobile-redirect"

describe("mobileCallbackRedirect", () => {
  it("returns the one-time code to the registered Android custom scheme", () => {
    const response = mobileCallbackRedirect("routempo://auth/callback", {
      code: "one-time-code",
    })

    expect(response.status).toBe(302)
    expect(response.headers.get("location")).toBe(
      "routempo://auth/callback?code=one-time-code"
    )
    expect(response.headers.get("cache-control")).toBe("no-store")
  })

  it("preserves existing callback parameters", () => {
    const response = mobileCallbackRedirect(
      "routempo://auth/callback?source=google",
      { code: "one-time-code" }
    )

    expect(response.headers.get("location")).toBe(
      "routempo://auth/callback?source=google&code=one-time-code"
    )
  })
})
