export async function idempotencyFingerprint(request: Request) {
  const url = new URL(request.url)
  const body = ["GET", "HEAD"].includes(request.method)
    ? ""
    : await request.clone().text()
  const value = `${request.method.toUpperCase()}\n${url.pathname}${url.search}\n${body}`
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(value)
  )
  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("")
}
