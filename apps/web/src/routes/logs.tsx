import { createFileRoute } from "@tanstack/react-router"
import { AppScreen } from "@/components/app-screen"
import { appSearchSchema } from "@/lib/search"
export const Route = createFileRoute("/logs")({
  validateSearch: appSearchSchema,
  component: Page,
})
function Page() {
  const search = Route.useSearch()
  return <AppScreen page="logs" demo={search.demo} />
}
