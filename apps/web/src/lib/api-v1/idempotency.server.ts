import "@tanstack/react-start/server-only"

import { and, eq, lt } from "drizzle-orm"

import { getDatabase } from "@/db/client.server"
import { apiIdempotency } from "@/db/schema"

import { ApiError } from "./errors"
import { idempotencyFingerprint } from "./idempotency"

const retentionMilliseconds = 24 * 60 * 60 * 1000

function validKey(key: string) {
  return key.length >= 8 && key.length <= 200 && /^[\x21-\x7e]+$/.test(key)
}

export async function executeIdempotent(
  request: Request,
  userId: string,
  operation: () => Promise<Response>
) {
  const key = request.headers.get("idempotency-key")
  if (!key || ["GET", "HEAD", "OPTIONS"].includes(request.method))
    return operation()
  if (!validKey(key)) throw new ApiError("IDEMPOTENCY_KEY_INVALID")

  const db = getDatabase()
  const now = new Date()
  await db.delete(apiIdempotency).where(lt(apiIdempotency.expiresAt, now))
  const requestHash = await idempotencyFingerprint(request)
  const inserted = await db
    .insert(apiIdempotency)
    .values({
      userId,
      key,
      requestHash,
      expiresAt: new Date(now.getTime() + retentionMilliseconds),
    })
    .onConflictDoNothing()
    .returning({ key: apiIdempotency.key })

  if (!inserted.length) {
    const rows = await db
      .select()
      .from(apiIdempotency)
      .where(
        and(eq(apiIdempotency.userId, userId), eq(apiIdempotency.key, key))
      )
      .limit(1)
    const existing = rows[0]
    if (!existing || existing.requestHash !== requestHash)
      throw new ApiError("IDEMPOTENCY_KEY_REUSED")
    if (existing.responseStatus === null || existing.responseBody === null)
      throw new ApiError("IDEMPOTENCY_IN_PROGRESS")
    return new Response(existing.responseBody, {
      status: existing.responseStatus,
      headers: {
        "content-type": existing.responseContentType ?? "application/json",
        "cache-control": "no-store",
        "x-api-version": "v1",
        "x-idempotent-replayed": "true",
      },
    })
  }

  try {
    const response = await operation()
    if (response.status >= 500) {
      await db
        .delete(apiIdempotency)
        .where(
          and(eq(apiIdempotency.userId, userId), eq(apiIdempotency.key, key))
        )
      return response
    }
    await db
      .update(apiIdempotency)
      .set({
        responseStatus: response.status,
        responseBody: await response.clone().text(),
        responseContentType: response.headers.get("content-type"),
        updatedAt: new Date(),
      })
      .where(
        and(eq(apiIdempotency.userId, userId), eq(apiIdempotency.key, key))
      )
    return response
  } catch (error) {
    await db
      .delete(apiIdempotency)
      .where(
        and(eq(apiIdempotency.userId, userId), eq(apiIdempotency.key, key))
      )
    throw error
  }
}
