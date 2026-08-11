import "@tanstack/react-start/server-only"

import { getAuth } from "@/lib/auth.server"

export async function currentUser(request: Request) {
  const session = await (
    await getAuth()
  ).api.getSession({ headers: request.headers })
  if (session)
    return {
      id: session.user.id,
      name: session.user.name,
      email: session.user.email,
    }
  if (process.env.NODE_ENV !== "production")
    return {
      id: "development-demo",
      name: "Montasim Ahmed",
      email: "development@example.com",
    }
  return null
}
