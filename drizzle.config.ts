import { defineConfig } from "drizzle-kit"
import { loadEnv } from "vite"

const fileEnv = loadEnv(
  process.env.NODE_ENV ?? "development",
  process.cwd(),
  ""
)

const url = process.env.DATABASE_URL ?? fileEnv.DATABASE_URL

if (!url) throw new Error("DATABASE_URL is required to run Drizzle Kit.")

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dbCredentials: { url },
  strict: true,
  verbose: true,
})
