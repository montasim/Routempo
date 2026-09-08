import { timingSafeEqual } from "node:crypto"

import { createFileRoute } from "@tanstack/react-router"

import { dispatchDueNotifications } from "@/lib/notification-dispatch.server"
import { ensureNotificationJobs } from "@/lib/notification-jobs.server"

function authorized(request: Request) {
  const secret = process.env.CRON_SECRET
  const value = request.headers.get("authorization")
  if (!secret || !value?.startsWith("Bearer ")) return false
  const supplied = Buffer.from(value.slice(7))
  const expected = Buffer.from(secret)
  return (
    supplied.length === expected.length && timingSafeEqual(supplied, expected)
  )
}

export const Route = createFileRoute("/api/notifications/run")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (!authorized(request))
          return Response.json({ error: "Unauthorized" }, { status: 401 })
        try {
          await ensureNotificationJobs()
          return Response.json(await dispatchDueNotifications())
        } catch (error) {
          const message =
            error instanceof Error
              ? error.message
              : "Notification dispatch failed"
          return Response.json({ error: message }, { status: 503 })
        }
      },
    },
  },
})
