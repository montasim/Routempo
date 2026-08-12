import { createFileRoute } from "@tanstack/react-router"

import { handleApiV1 } from "@/lib/api-v1/handler.server"

async function handler({ request }: { request: Request }) {
  return handleApiV1(request)
}

export const Route = createFileRoute("/api/v1/$")({
  server: {
    handlers: {
      GET: handler,
      POST: handler,
      PUT: handler,
      PATCH: handler,
      DELETE: handler,
      OPTIONS: handler,
    },
  },
})
