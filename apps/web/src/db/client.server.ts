import "@tanstack/react-start/server-only"

import { drizzle } from "drizzle-orm/neon-http"

import * as schema from "@/db/schema"

function connectionString() {
  const url = process.env.DATABASE_URL
  if (!url)
    throw new Error(
      "DATABASE_URL is required. Add the pooled Neon connection string to your environment."
    )
  return url
}

function createDatabase() {
  return drizzle(connectionString(), { schema })
}

let database: ReturnType<typeof createDatabase> | undefined

export function getDatabase() {
  database ??= createDatabase()
  return database
}
