import { createFileRoute } from "@tanstack/react-router"

import {
  getIntegrations,
  syncIntegrations,
} from "@/lib/integrations-api.server"

export const Route = createFileRoute("/api/integrations")({
  server: {
    handlers: {
      GET: ({ request }) => getIntegrations(request),
      POST: ({ request }) => syncIntegrations(request),
    },
  },
})
