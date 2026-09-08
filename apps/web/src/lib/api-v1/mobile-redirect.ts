export function mobileCallbackRedirect(
  redirectUri: string,
  parameters: Record<string, string>
) {
  const destination = new URL(redirectUri)
  for (const [name, value] of Object.entries(parameters)) {
    destination.searchParams.set(name, value)
  }
  return new Response(null, {
    status: 302,
    headers: {
      location: destination.toString(),
      "cache-control": "no-store",
    },
  })
}
