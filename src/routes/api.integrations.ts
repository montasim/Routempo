import { createFileRoute } from "@tanstack/react-router"
import { z } from "zod"

import { getAuth } from "@/lib/auth.server"
import { externalItemToRoutine } from "@/lib/integration-mapping"
import {
  connectedProviders,
  exportRoutine,
  fetchExternalItems,
  getProviderToken,
} from "@/lib/integrations.server"
import {
  exportableRoutines,
  getAppData,
  recordExportedRoutine,
  saveImportedRoutines,
} from "@/lib/store.server"
import { dateKeyInTimeZone } from "@/lib/user-calendar"

const syncSchema = z.object({
  action: z.enum(["import", "export"]),
  provider: z.enum(["google", "microsoft"]),
  resource: z.enum(["calendar", "tasks"]),
})

async function identity(request: Request) {
  const session = await (
    await getAuth()
  ).api.getSession({ headers: request.headers })
  if (session) return { id: session.user.id }
  if (process.env.NODE_ENV !== "production") return { id: "development-demo" }
  return null
}

export const Route = createFileRoute("/api/integrations")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const user = await identity(request)
        if (!user)
          return Response.json({ error: "Unauthorized" }, { status: 401 })
        const providers = await connectedProviders(user.id)
        return Response.json({
          providers: {
            google: {
              ...providers.google,
              configured: Boolean(
                process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
              ),
            },
            microsoft: {
              ...providers.microsoft,
              configured: Boolean(
                process.env.MICROSOFT_CLIENT_ID &&
                process.env.MICROSOFT_CLIENT_SECRET
              ),
            },
          },
        })
      },
      POST: async ({ request }) => {
        const parsed = syncSchema.safeParse(await request.json())
        if (!parsed.success)
          return Response.json(
            { error: "Invalid sync request" },
            { status: 400 }
          )
        const user = await identity(request)
        if (!user)
          return Response.json({ error: "Unauthorized" }, { status: 401 })

        try {
          const { action, provider, resource } = parsed.data
          const token = await getProviderToken(request, user.id, provider)
          if (action === "import") {
            const external = await fetchExternalItems(provider, resource, token)
            const current = await getAppData(user.id)
            const fallbackDate = dateKeyInTimeZone(current.settings.timezone)
            const imported = await saveImportedRoutines(
              user.id,
              provider,
              resource,
              external.flatMap((item) => {
                const routine = externalItemToRoutine(
                  item,
                  provider,
                  resource,
                  fallbackDate
                )
                return routine ? [{ externalId: item.id, routine }] : []
              })
            )
            return Response.json({
              imported,
              skipped: external.length - imported,
            })
          }

          const batch = await exportableRoutines(user.id, provider, resource)
          let exported = 0
          const failures: string[] = []
          for (const routine of batch.routines.slice(0, 250)) {
            try {
              const externalId = await exportRoutine(
                provider,
                resource,
                token,
                routine,
                batch.timezone
              )
              await recordExportedRoutine(
                user.id,
                provider,
                resource,
                routine.id,
                externalId
              )
              exported += 1
            } catch {
              failures.push(routine.title)
            }
          }
          return Response.json({
            exported,
            skipped: Math.max(0, batch.routines.length - 250),
            failures,
          })
        } catch (error) {
          return Response.json(
            { error: error instanceof Error ? error.message : "Sync failed" },
            { status: 502 }
          )
        }
      },
    },
  },
})
