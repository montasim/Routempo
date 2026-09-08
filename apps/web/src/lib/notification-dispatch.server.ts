import "@tanstack/react-start/server-only"

import { and, asc, eq, gte, lte, or, sql } from "drizzle-orm"
import webpush from "web-push"

import { getDatabase } from "@/db/client.server"
import {
  notificationDeliveries,
  notificationJobs,
  pushSubscriptions,
  routineLogs,
} from "@/db/schema"
import { addDays } from "@/lib/user-calendar"
import { pushConfig } from "@/lib/push-config.server"

const maximumAttempts = 5
const maximumLateness = 60 * 60_000

export async function dispatchDueNotifications(now = new Date()) {
  const config = pushConfig()
  if (!config) throw new Error("Push notifications are not configured")
  webpush.setVapidDetails(config.subject, config.publicKey, config.privateKey)

  const db = getDatabase()
  const due = await db
    .select()
    .from(notificationJobs)
    .where(
      and(
        lte(notificationJobs.scheduledFor, now),
        or(
          eq(notificationJobs.status, "pending"),
          and(
            eq(notificationJobs.status, "processing"),
            lte(notificationJobs.leaseUntil, now)
          )
        )
      )
    )
    .orderBy(asc(notificationJobs.scheduledFor))
    .limit(100)

  let sent = 0
  let failed = 0
  let skipped = 0

  for (const candidate of due) {
    const claimed = await db
      .update(notificationJobs)
      .set({
        status: "processing",
        attempts: sql`${notificationJobs.attempts} + 1`,
        leaseUntil: new Date(now.getTime() + 5 * 60_000),
        updatedAt: now,
      })
      .where(
        and(
          eq(notificationJobs.id, candidate.id),
          or(
            eq(notificationJobs.status, "pending"),
            and(
              eq(notificationJobs.status, "processing"),
              lte(notificationJobs.leaseUntil, now)
            )
          )
        )
      )
      .returning()
    const job = claimed[0]
    if (!job) {
      skipped += 1
      continue
    }

    if (now.getTime() - job.scheduledFor.getTime() > maximumLateness) {
      await finishJob(job.id, "failed", "Notification expired before delivery")
      failed += 1
      continue
    }

    const subscriptions = await db
      .select()
      .from(pushSubscriptions)
      .where(eq(pushSubscriptions.userId, job.userId))
    if (!subscriptions.length) {
      await finishJob(job.id, "failed", "No active push subscription")
      failed += 1
      continue
    }

    const body = job.kind === "weekly" ? await weeklySummaryBody(job) : job.body
    let transientFailure = false
    let delivered = 0
    for (const subscription of subscriptions) {
      const delivery = await db
        .insert(notificationDeliveries)
        .values({
          subscriptionId: subscription.id,
          deliveryKey: job.deliveryKey,
          userId: job.userId,
        })
        .onConflictDoNothing()
        .returning({ deliveryKey: notificationDeliveries.deliveryKey })
      if (!delivery.length) {
        delivered += 1
        continue
      }

      try {
        await webpush.sendNotification(
          {
            endpoint: subscription.endpoint,
            expirationTime: subscription.expiresAt?.getTime() ?? null,
            keys: { p256dh: subscription.p256dh, auth: subscription.auth },
          },
          JSON.stringify({
            deliveryKey: job.deliveryKey,
            title: job.title,
            body,
            url: job.url,
          }),
          { TTL: 60 * 60, urgency: job.kind === "routine" ? "high" : "normal" }
        )
        delivered += 1
      } catch (error) {
        const statusCode = pushStatusCode(error)
        await db
          .delete(notificationDeliveries)
          .where(
            and(
              eq(notificationDeliveries.subscriptionId, subscription.id),
              eq(notificationDeliveries.deliveryKey, job.deliveryKey)
            )
          )
        if (statusCode === 404 || statusCode === 410) {
          await db
            .delete(pushSubscriptions)
            .where(eq(pushSubscriptions.id, subscription.id))
        } else {
          transientFailure = true
        }
      }
    }

    if (transientFailure && job.attempts < maximumAttempts) {
      await db
        .update(notificationJobs)
        .set({
          status: "pending",
          leaseUntil: null,
          lastError: "Push provider request failed; retry scheduled",
          updatedAt: new Date(),
        })
        .where(eq(notificationJobs.id, job.id))
      failed += 1
    } else if (delivered) {
      await finishJob(job.id, "sent", null)
      sent += 1
    } else {
      await finishJob(job.id, "failed", "No subscription accepted the push")
      failed += 1
    }
  }

  return { processed: due.length, sent, failed, skipped }
}

async function weeklySummaryBody(job: typeof notificationJobs.$inferSelect) {
  const monday = job.deliveryKey.slice(-10)
  const firstDay = addDays(monday, -7)
  const lastDay = addDays(monday, -1)
  const [counts] = await getDatabase()
    .select({
      total: sql<number>`count(*)::int`,
      completed: sql<number>`count(*) filter (where ${routineLogs.status} = 'completed')::int`,
    })
    .from(routineLogs)
    .where(
      and(
        eq(routineLogs.userId, job.userId),
        gte(routineLogs.date, firstDay),
        lte(routineLogs.date, lastDay)
      )
    )
  const total = counts?.total ?? 0
  const completed = counts?.completed ?? 0
  return total
    ? `${completed} of ${total} routines completed last week.`
    : "You had no recorded routines last week. Start fresh today."
}

function finishJob(
  id: string,
  status: "sent" | "failed",
  lastError: string | null
) {
  return getDatabase()
    .update(notificationJobs)
    .set({ status, leaseUntil: null, lastError, updatedAt: new Date() })
    .where(eq(notificationJobs.id, id))
}

function pushStatusCode(error: unknown) {
  return typeof error === "object" && error && "statusCode" in error
    ? Number(error.statusCode)
    : undefined
}
