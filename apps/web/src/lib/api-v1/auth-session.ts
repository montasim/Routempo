const refreshGraceMilliseconds = 30 * 24 * 60 * 60 * 1000

export function bearerToken(headers: Headers) {
  const authorization = headers.get("authorization")
  const match = authorization?.match(/^Bearer\s+(.+)$/i)
  return match?.[1]?.trim() || null
}

export function refreshableUntil(expiresAt: Date) {
  return new Date(expiresAt.getTime() + refreshGraceMilliseconds)
}
