import { createFileRoute } from "@tanstack/react-router"
import { and, eq } from "drizzle-orm"
import { z } from "zod"

import { getDatabase } from "@/db/client.server"
import { pushSubscriptions } from "@/db/schema"
import { currentUser } from "@/lib/current-user.server"
import { pushConfig } from "@/lib/push-config.server"
import { syncNotificationJobs } from "@/lib/notification-jobs.server"

const subscriptionSchema = z.object({
  endpoint: z.url(),
  expirationTime: z.number().nullable().optional(),
  keys: z.object({
    p256dh: z.string().min(1),
    auth: z.string().min(1),
  }),
})

async function unauthorized(request: Request) {
  const user = await currentUser(request)
  return user ? null : Response.json({ error: "Unauthorized" }, { status: 401 })
}

export const Route = createFileRoute("/api/push")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const denied = await unauthorized(request)
        if (denied) return denied
        const config = pushConfig()
        return Response.json({
          configured: Boolean(config),
          publicKey: config?.publicKey ?? null,
        })
      },
      POST: async ({ request }) => {
        const user = await currentUser(request)
        if (!user)
          return Response.json({ error: "Unauthorized" }, { status: 401 })
        if (!pushConfig())
          return Response.json(
            { error: "Push notifications are not configured" },
            { status: 503 }
          )

        const parsed = subscriptionSchema.safeParse(await request.json())
        if (!parsed.success)
          return Response.json(
            { error: "Invalid subscription" },
            { status: 400 }
          )

        const subscription = parsed.data
        const now = new Date()
        await getDatabase()
          .insert(pushSubscriptions)
          .values({
            id: crypto.randomUUID(),
            userId: user.id,
            endpoint: subscription.endpoint,
            p256dh: subscription.keys.p256dh,
            auth: subscription.keys.auth,
            expiresAt: subscription.expirationTime
              ? new Date(subscription.expirationTime)
              : null,
            updatedAt: now,
          })
          .onConflictDoUpdate({
            target: pushSubscriptions.endpoint,
            set: {
              userId: user.id,
              p256dh: subscription.keys.p256dh,
              auth: subscription.keys.auth,
              expiresAt: subscription.expirationTime
                ? new Date(subscription.expirationTime)
                : null,
              updatedAt: now,
            },
          })

        await syncNotificationJobs(user.id, new Date(), false)

        return Response.json({ subscribed: true })
      },
      DELETE: async ({ request }) => {
        const user = await currentUser(request)
        if (!user)
          return Response.json({ error: "Unauthorized" }, { status: 401 })
        const endpoint = z
          .object({ endpoint: z.url() })
          .safeParse(await request.json())
        if (!endpoint.success)
          return Response.json(
            { error: "Invalid subscription" },
            { status: 400 }
          )

        await getDatabase()
          .delete(pushSubscriptions)
          .where(
            and(
              eq(pushSubscriptions.userId, user.id),
              eq(pushSubscriptions.endpoint, endpoint.data.endpoint)
            )
          )
        return Response.json({ subscribed: false })
      },
    },
  },
})
