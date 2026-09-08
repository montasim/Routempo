import { Navigate } from "@tanstack/react-router"

import { AppShell } from "@/components/app-shell"
import { useApp } from "@/components/app-provider"
import { AppPageSkeleton } from "@/components/page-skeletons"
import { InsightsPage } from "@/components/pages/insights-page"
import { LogsPage } from "@/components/pages/logs-page"
import { PlanPage } from "@/components/pages/plan-page"
import { SettingsPage } from "@/components/pages/settings-page"
import { TodayPage } from "@/components/pages/today-page"
import { authClient } from "@/lib/auth-client"
import type { PageName } from "@/lib/types"

export function AppScreen({
  page,
  demo = false,
}: {
  page: PageName
  demo?: boolean
}) {
  const session = authClient.useSession()
  const { isLoading: appIsLoading } = useApp()
  const allowDemo = import.meta.env.DEV && demo
  const isLoading = !allowDemo && (session.isPending || appIsLoading)
  if (!session.data && !allowDemo && !isLoading) return <Navigate to="/login" />
  const content = isLoading ? (
    <AppPageSkeleton page={page} />
  ) : page === "today" ? (
    <TodayPage />
  ) : page === "plan" ? (
    <PlanPage />
  ) : page === "insights" ? (
    <InsightsPage />
  ) : page === "logs" ? (
    <LogsPage />
  ) : (
    <SettingsPage email={session.data?.user.email} />
  )
  return (
    <AppShell page={page} user={session.data?.user} loading={isLoading}>
      {content}
    </AppShell>
  )
}
