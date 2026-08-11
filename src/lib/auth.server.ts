import "@tanstack/react-start/server-only"

import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { genericOAuth, microsoftEntraId } from "better-auth/plugins"

import { getDatabase } from "@/db/client.server"
import * as schema from "@/db/schema"

async function createAuthInstance() {
  const microsoftConfigured = Boolean(
    process.env.MICROSOFT_CLIENT_ID && process.env.MICROSOFT_CLIENT_SECRET
  )

  return betterAuth({
    appName: "Routempo",
    database: drizzleAdapter(getDatabase(), { provider: "pg", schema }),
    baseURL: process.env.BETTER_AUTH_URL,
    secret: process.env.BETTER_AUTH_SECRET,
    advanced: { cookiePrefix: "routempo" },
    emailAndPassword: { enabled: false },
    socialProviders:
      process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
        ? {
            google: {
              clientId: process.env.GOOGLE_CLIENT_ID,
              clientSecret: process.env.GOOGLE_CLIENT_SECRET,
              accessType: "offline",
              prompt: "select_account consent",
            },
          }
        : {},
    plugins: microsoftConfigured
      ? [
          genericOAuth({
            config: [
              microsoftEntraId({
                clientId: process.env.MICROSOFT_CLIENT_ID!,
                clientSecret: process.env.MICROSOFT_CLIENT_SECRET!,
                tenantId: process.env.MICROSOFT_TENANT_ID || "common",
                scopes: ["openid", "profile", "email", "offline_access"],
              }),
            ],
          }),
        ]
      : [],
    session: { expiresIn: 60 * 60 * 24 * 7, updateAge: 60 * 60 * 24 },
  })
}

let authPromise: ReturnType<typeof createAuthInstance> | undefined

export function getAuth(): ReturnType<typeof createAuthInstance> {
  authPromise ??= createAuthInstance()
  return authPromise
}
