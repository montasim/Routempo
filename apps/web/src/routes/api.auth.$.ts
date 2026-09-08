import { createFileRoute } from "@tanstack/react-router"

import { getAuth } from "@/lib/auth.server"

async function handler({ request }: { request: Request }) {
  return (await getAuth()).handler(request)
}

export const Route = createFileRoute("/api/auth/$")({
  server: { handlers: { GET: handler, POST: handler } },
})
