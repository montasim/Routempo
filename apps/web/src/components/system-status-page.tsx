import { Link } from "@tanstack/react-router"
import { ArrowLeft, CalendarClock, RefreshCw } from "lucide-react"

import { Brand } from "@/components/brand"
import { ThemeButton } from "@/components/theme-button"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"

type SystemStatusPageProps =
  { status: "404"; onRetry?: never } | { status: "500"; onRetry: () => void }

const content = {
  "404": {
    label: "Route not found",
    title: "This page isn’t on today’s plan.",
    description:
      "The address may be outdated, or the page may have moved. Your routines are still right where you left them.",
    note: "Nothing in your schedule was changed.",
  },
  "500": {
    label: "Unexpected interruption",
    title: "Routempo lost the rhythm for a moment.",
    description:
      "We couldn’t finish loading this page. Try it again, or return to today and continue with your routines.",
    note: "Your saved routines and history are unaffected.",
  },
} as const

export function SystemStatusPage(props: SystemStatusPageProps) {
  const copy = content[props.status]

  return (
    <main
      data-slot={`status-${props.status}`}
      className="min-h-dvh bg-paper-50 text-ink-900 dark:bg-[#101511] dark:text-[#f2f6f2]"
    >
      <header className="border-b border-paper-200 bg-paper-0 dark:border-[#2b352d] dark:bg-[#171d18]">
        <div className="mx-auto flex h-18 max-w-6xl items-center px-4 md:px-8">
          <Brand />
          <div className="ml-auto">
            <ThemeButton />
          </div>
        </div>
      </header>

      <section className="mx-auto grid min-h-[calc(100dvh-4.5rem)] max-w-6xl items-center gap-10 px-4 py-12 md:px-8 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-20">
        <div className="max-w-2xl">
          <Badge className="rounded-full border border-signal-200 bg-signal-50 px-3 py-1.5 font-mono tracking-[.08em] uppercase dark:border-signal-800 dark:bg-signal-900/50">
            <span className="size-1.5 rounded-full bg-signal-500" />
            {copy.label}
          </Badge>
          <p
            aria-hidden="true"
            className="mt-7 font-mono text-[clamp(4.5rem,15vw,9.5rem)] leading-[.82] font-medium tracking-[-.08em] text-paper-300 dark:text-[#344137]"
          >
            {props.status}
          </p>
          <h1 className="mt-8 max-w-xl text-4xl leading-[1.08] font-semibold tracking-[-.045em] text-balance md:text-5xl">
            {copy.title}
          </h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-ink-500 dark:text-[#a7b7aa]">
            {copy.description}
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            {props.status === "500" ? (
              <Button size="lg" onClick={props.onRetry}>
                <RefreshCw />
                Try again
              </Button>
            ) : (
              <Button size="lg" asChild>
                <Link to="/today">
                  <CalendarClock />
                  Return to today
                </Link>
              </Button>
            )}
            {props.status === "500" ? (
              <Button size="lg" variant="outline" asChild>
                <Link to="/today">
                  <CalendarClock />
                  Return to today
                </Link>
              </Button>
            ) : (
              <Button
                size="lg"
                variant="outline"
                onClick={() => window.history.back()}
              >
                <ArrowLeft />
                Go back
              </Button>
            )}
          </div>
        </div>

        <div
          aria-label={copy.note}
          className="relative mx-auto w-full max-w-sm lg:mx-0"
        >
          <Card className="rounded-2xl p-5 shadow-soft dark:border-[#344137]">
            <div className="flex items-center justify-between border-b border-paper-200 pb-4 dark:border-[#2b352d]">
              <div>
                <p className="text-sm font-semibold">Today</p>
                <p className="mt-0.5 text-xs text-ink-400 dark:text-[#87988b]">
                  Your rhythm continues
                </p>
              </div>
              <Badge className="font-mono">Safe</Badge>
            </div>

            <div className="space-y-3 py-5">
              {["Morning", "Afternoon", "Evening"].map((period, index) => (
                <div key={period} className="flex items-center gap-3">
                  <span
                    className={`grid size-8 place-items-center rounded-full ${
                      index === 1
                        ? "bg-signal-100 text-signal-700 dark:bg-signal-900 dark:text-signal-300"
                        : "bg-paper-100 text-ink-400 dark:bg-[#202821] dark:text-[#87988b]"
                    }`}
                  >
                    <span className="size-2 rounded-full bg-current" />
                  </span>
                  <div className="flex-1">
                    <div className="h-2 w-24 rounded-full bg-paper-200 dark:bg-[#344137]" />
                    <div className="mt-2 h-1.5 w-16 rounded-full bg-paper-100 dark:bg-[#273129]" />
                  </div>
                  <span className="font-mono text-[11px] text-ink-400 dark:text-[#87988b]">
                    {period === "Morning"
                      ? "08:00"
                      : period === "Afternoon"
                        ? "13:00"
                        : "19:00"}
                  </span>
                </div>
              ))}
            </div>

            <p className="border-t border-paper-200 pt-4 text-xs leading-5 text-ink-500 dark:border-[#2b352d] dark:text-[#a7b7aa]">
              {copy.note}
            </p>
          </Card>
          <div className="absolute -right-3 -bottom-3 -z-10 h-full w-full rounded-2xl border border-signal-200 bg-signal-100/60 dark:border-signal-900 dark:bg-signal-900/30" />
        </div>
      </section>
    </main>
  )
}
