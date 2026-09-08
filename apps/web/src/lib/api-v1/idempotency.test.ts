import { describe, expect, it } from "vitest"

import { idempotencyFingerprint } from "./idempotency"

describe("idempotency fingerprint", () => {
  it("binds a retry key to the method, path, and body", async () => {
    const first = await idempotencyFingerprint(
      new Request("https://example.test/api/v1/routines", {
        method: "POST",
        body: JSON.stringify({ title: "Read" }),
      })
    )
    const retry = await idempotencyFingerprint(
      new Request("https://example.test/api/v1/routines", {
        method: "POST",
        body: JSON.stringify({ title: "Read" }),
      })
    )
    const different = await idempotencyFingerprint(
      new Request("https://example.test/api/v1/logs", {
        method: "POST",
        body: JSON.stringify({ title: "Read" }),
      })
    )

    expect(retry).toBe(first)
    expect(different).not.toBe(first)
  })
})
