import type { PageName } from "@/lib/types"

import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export function AppPageSkeleton({ page }: { page: PageName }) {
  return (
    <div role="status" aria-label={`Loading ${page}`} aria-live="polite">
      {page === "today" ? (
        <TodaySkeleton />
      ) : page === "plan" ? (
        <PlanSkeleton />
      ) : page === "insights" ? (
        <InsightsSkeleton />
      ) : page === "logs" ? (
        <LogsSkeleton />
      ) : (
        <SettingsSkeleton />
      )}
      <span className="sr-only">Loading Routempo data…</span>
    </div>
  )
}

function PageHeading({ action = false }: { action?: boolean }) {
  return (
    <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <Skeleton className="h-9 w-44" />
        <Skeleton className="mt-3 h-4 w-[min(32rem,78vw)]" />
      </div>
      {action && <Skeleton className="h-10 w-32 self-start sm:self-auto" />}
    </div>
  )
}

function CardHeading({ action = false }: { action?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-paper-200 p-5 dark:border-[#2b352d]">
      <div className="min-w-0 flex-1">
        <Skeleton className="h-4 w-36" />
        <Skeleton className="mt-2 h-3 w-64 max-w-full" />
      </div>
      {action && <Skeleton className="h-9 w-28" />}
    </div>
  )
}

function MetricSkeleton() {
  return (
    <Card className="p-4 md:p-5">
      <div className="flex items-center justify-between">
        <Skeleton className="size-9 rounded-[10px]" />
        <Skeleton className="h-7 w-14" />
      </div>
      <Skeleton className="mt-4 h-4 w-28" />
      <Skeleton className="mt-2 h-3 w-24" />
    </Card>
  )
}

function RoutineRowSkeleton({ icon = false }: { icon?: boolean }) {
  return (
    <div className="flex items-center gap-4 border-b border-paper-200 p-4 last:border-0 dark:border-[#2b352d]">
      <Skeleton
        className={icon ? "size-10 shrink-0 rounded-[10px]" : "h-4 w-[72px]"}
      />
      <div className="min-w-0 flex-1">
        <Skeleton className="h-4 w-36" />
        <Skeleton className="mt-2 h-3 w-52 max-w-full" />
      </div>
      <Skeleton className="size-9 shrink-0 rounded-[10px]" />
    </div>
  )
}

function TodaySkeleton() {
  return (
    <div data-slot="today-skeleton" className="w-full px-4 py-8 md:px-8">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Skeleton className="h-4 w-32" />
          <Skeleton className="mt-3 h-9 w-[min(30rem,80vw)]" />
        </div>
        <Skeleton className="h-10 w-32 self-start sm:self-auto" />
      </div>

      <section className="mt-8 overflow-hidden rounded-[14px] bg-signal-800 p-6 md:p-8 dark:bg-[#dfeee2]">
        <div className="grid gap-7 md:grid-cols-[1fr_auto] md:items-end">
          <div>
            <Skeleton className="h-4 w-36 bg-white/20 dark:bg-signal-800/15" />
            <Skeleton className="mt-5 h-10 w-72 max-w-full bg-white/25 dark:bg-signal-800/20" />
            <Skeleton className="mt-3 h-3 w-80 max-w-full bg-white/20 dark:bg-signal-800/15" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-10 w-24 bg-white/20 dark:bg-signal-800/15" />
            <Skeleton className="h-10 w-36 bg-white/25 dark:bg-signal-800/20" />
          </div>
        </div>
      </section>

      <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,7fr)_minmax(0,3fr)]">
        <section>
          <div className="mb-3 flex items-center justify-between">
            <Skeleton className="h-6 w-28" />
            <Skeleton className="h-8 w-20" />
          </div>
          <Card className="overflow-hidden">
            <RoutineRowSkeleton />
            <RoutineRowSkeleton />
          </Card>
        </section>
        <WeekCardSkeleton />
      </div>
    </div>
  )
}

function WeekCardSkeleton() {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="mt-2 h-3 w-44 max-w-full" />
        </div>
        <Skeleton className="h-7 w-12" />
      </div>
      <div className="mt-6 grid grid-cols-7 gap-2">
        {Array.from({ length: 7 }, (_, index) => (
          <div key={index} className="grid justify-items-center gap-2">
            <Skeleton className="h-3 w-3" />
            <Skeleton className="size-7 rounded-lg" />
          </div>
        ))}
      </div>
      <Skeleton className="mt-6 h-4 w-36" />
    </Card>
  )
}

function PlanSkeleton() {
  return (
    <div data-slot="plan-skeleton" className="w-full px-4 py-8 md:px-8">
      <PageHeading action />
      <Skeleton className="mt-8 h-11 w-64 rounded-[10px]" />
      <Card className="mt-6 overflow-hidden">
        <CardHeading action />
        <div className="grid grid-cols-7 border-b border-paper-200 dark:border-[#2b352d]">
          {Array.from({ length: 7 }, (_, index) => (
            <div
              key={index}
              className="grid justify-items-center gap-2 border-r border-paper-200 py-4 last:border-0 dark:border-[#2b352d]"
            >
              <Skeleton className="h-3 w-7" />
              <Skeleton className="size-8 rounded-full" />
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between gap-4 border-b border-paper-200 p-4 dark:border-[#2b352d]">
          <div className="space-y-2">
            <Skeleton className="h-4 w-44" />
            <Skeleton className="h-3 w-24" />
          </div>
          <Skeleton className="h-9 w-20" />
        </div>
        <RoutineRowSkeleton icon />
        <RoutineRowSkeleton icon />
      </Card>
    </div>
  )
}

function InsightsSkeleton() {
  return (
    <div data-slot="insights-skeleton" className="w-full px-4 py-8 md:px-8">
      <PageHeading action />
      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <MetricSkeleton key={index} />
        ))}
      </div>
      <Card className="mt-6 overflow-hidden">
        <div className="grid lg:grid-cols-[minmax(0,1fr)_280px]">
          <div className="p-5 md:p-6">
            <Skeleton className="h-4 w-44" />
            <Skeleton className="mt-2 h-3 w-64 max-w-full" />
            <div className="mt-8 flex h-52 items-end gap-3 border-b border-paper-200 px-2 dark:border-[#2b352d]">
              {[
                "h-[72%]",
                "h-[88%]",
                "h-[55%]",
                "h-[82%]",
                "h-[96%]",
                "h-[77%]",
                "h-[85%]",
              ].map((height, index) => (
                <div
                  key={index}
                  className="flex h-full flex-1 flex-col justify-end gap-2"
                >
                  <Skeleton
                    className={`${height} rounded-t-lg rounded-b-none`}
                  />
                  <Skeleton className="mx-auto mb-3 h-3 w-3" />
                </div>
              ))}
            </div>
          </div>
          <div className="border-t border-paper-200 p-5 md:p-6 lg:border-t-0 lg:border-l dark:border-[#2b352d]">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="mt-2 h-3 w-44" />
            <div className="mt-6 flex flex-col items-center gap-6">
              <Skeleton className="size-32 rounded-full" />
              <div className="grid w-full gap-3">
                {Array.from({ length: 3 }, (_, index) => (
                  <div key={index} className="flex justify-between">
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-3 w-5" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Card>
      <Card className="mt-6 overflow-hidden">
        <CardHeading />
        {Array.from({ length: 4 }, (_, index) => (
          <BreakdownRowSkeleton key={index} />
        ))}
      </Card>
    </div>
  )
}

function BreakdownRowSkeleton() {
  return (
    <div className="grid gap-3 border-b border-paper-200 p-4 last:border-0 sm:grid-cols-[1fr_100px_2fr_60px] sm:items-center dark:border-[#2b352d]">
      <div>
        <Skeleton className="h-4 w-36" />
        <Skeleton className="mt-2 h-3 w-20" />
      </div>
      <Skeleton className="h-3 w-12" />
      <Skeleton className="h-2 w-full rounded-full" />
      <Skeleton className="h-4 w-10" />
    </div>
  )
}

function LogsSkeleton() {
  return (
    <div data-slot="logs-skeleton" className="w-full px-4 py-8 md:px-8">
      <PageHeading action />
      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <MetricSkeleton key={index} />
        ))}
      </div>
      <Card className="mt-6 overflow-hidden">
        <CardHeading action />
        {Array.from({ length: 4 }, (_, index) => (
          <LogRowSkeleton key={index} />
        ))}
      </Card>
    </div>
  )
}

function LogRowSkeleton() {
  return (
    <div className="grid gap-4 border-b border-paper-200 p-5 last:border-0 md:grid-cols-[140px_minmax(160px,1fr)_100px_110px_112px_88px] md:items-center dark:border-[#2b352d]">
      <div className="space-y-2">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-3 w-16" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-36" />
        <Skeleton className="h-3 w-20" />
      </div>
      <Skeleton className="h-3 w-16" />
      <Skeleton className="h-3 w-16" />
      <Skeleton className="h-7 w-24 rounded-lg" />
      <div className="flex gap-2">
        <Skeleton className="size-8 rounded-[10px]" />
        <Skeleton className="size-8 rounded-[10px]" />
      </div>
    </div>
  )
}

function SettingsSkeleton() {
  return (
    <div data-slot="settings-skeleton" className="w-full px-4 py-8 md:px-8">
      <PageHeading />
      <div className="mt-8 grid gap-6 xl:grid-cols-2">
        <SettingsCard kind="form" />
        <SettingsCard kind="categories" />
        <SettingsCard kind="switches" />
        <SettingsCard kind="action" />
      </div>
    </div>
  )
}

function SettingsCard({
  kind,
}: {
  kind: "form" | "categories" | "switches" | "action"
}) {
  return (
    <Card className="overflow-hidden">
      <CardHeading action={kind === "categories"} />
      {kind === "form" ? (
        <div className="grid gap-5 p-5 2xl:grid-cols-2">
          {Array.from({ length: 4 }, (_, index) => (
            <div key={index}>
              <Skeleton className="h-3 w-20" />
              <Skeleton className="mt-2 h-11 w-full rounded-[10px]" />
              {index === 1 && <Skeleton className="mt-2 h-3 w-44" />}
            </div>
          ))}
        </div>
      ) : kind === "categories" ? (
        <div>
          {Array.from({ length: 3 }, (_, index) => (
            <RoutineRowSkeleton key={index} icon />
          ))}
        </div>
      ) : kind === "switches" ? (
        <div>
          {Array.from({ length: 2 }, (_, index) => (
            <div
              key={index}
              className="flex items-center gap-4 border-b border-paper-200 p-5 last:border-0 dark:border-[#2b352d]"
            >
              <div className="flex-1">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="mt-2 h-3 w-56 max-w-full" />
              </div>
              <Skeleton className="h-6 w-11 rounded-full" />
            </div>
          ))}
        </div>
      ) : (
        <div className="p-5">
          <Skeleton className="h-10 w-28 rounded-[10px]" />
        </div>
      )}
    </Card>
  )
}
