import { Link } from "@tanstack/react-router"
import {
  BarChart3,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Home,
  LogOut,
  ScrollText,
  Settings as SettingsIcon,
} from "lucide-react"
import { useState, type ReactNode } from "react"

import { authClient } from "@/lib/auth-client"
import type { PageName } from "@/lib/types"
import { cn } from "@/lib/utils"
import { Brand } from "@/components/brand"
import { ThemeButton } from "@/components/theme-button"
import { useApp } from "@/components/app-provider"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { routinesForDate } from "@/lib/routines"
import { dateForTimeZone } from "@/lib/greeting"
import { dateKeyInTimeZone } from "@/lib/user-calendar"

const pages: Array<{ page: PageName; label: string; icon: typeof Home }> = [
  { page: "today", label: "Today", icon: Home },
  { page: "plan", label: "Plan", icon: CalendarDays },
  { page: "insights", label: "Insights", icon: BarChart3 },
  { page: "logs", label: "Logs", icon: ScrollText },
  { page: "settings", label: "Settings", icon: SettingsIcon },
]

export function AppShell({
  page,
  children,
  user,
  loading = false,
}: {
  page: PageName
  children: ReactNode
  user?: {
    name?: string | null
    email?: string | null
    image?: string | null
  }
  loading?: boolean
}) {
  const { routines, settings } = useApp()
  const [signOutOpen, setSignOutOpen] = useState(false)
  const [signingOut, setSigningOut] = useState(false)
  const routinesToday = routinesForDate(
    routines,
    dateKeyInTimeZone(settings.timezone)
  )
  const completed = routinesToday.filter(
    (routine) => routine.status === "completed"
  ).length
  const todayLabel = dateForTimeZone(settings.timezone)
  const name = user?.name ?? settings.name
  const email = user?.email ?? ""
  const image = user?.image

  return (
    <div className="min-h-dvh bg-paper-50 font-sans text-ink-900 antialiased dark:bg-[#101511] dark:text-[#f2f6f2]">
      <div className="flex min-h-dvh w-full">
        <aside className="sticky top-0 hidden h-dvh w-[255.2px] shrink-0 flex-col border-r border-paper-200 bg-paper-0 px-4 py-6 lg:flex dark:border-[#2b352d] dark:bg-[#171d18]">
          <div className="px-2">
            <Brand />
          </div>
          <nav className="mt-9 space-y-1" aria-label="Primary navigation">
            {pages.map(({ page: destination, label, icon: Icon }) => (
              <Link
                key={destination}
                to={`/${destination}`}
                className={cn(
                  "flex w-full items-center gap-3 rounded-[10px] px-3 py-2.5 text-sm font-medium transition-colors outline-none focus-visible:ring-3 focus-visible:ring-signal-600/25",
                  page === destination
                    ? "bg-signal-50 text-signal-700 dark:bg-[#26382b] dark:text-signal-300"
                    : "text-ink-700 hover:bg-paper-100 dark:text-[#cad4cc] dark:hover:bg-[#202821]"
                )}
              >
                <Icon className="size-[18px]" />
                {label}
              </Link>
            ))}
          </nav>
          <div className="mt-auto px-3">
            <div className="flex items-baseline gap-2">
              <p className="text-xs font-semibold text-ink-400 dark:text-[#839187]">
                Today
              </p>
            </div>
            {loading ? (
              <div className="mt-3" aria-label="Loading today’s progress">
                <div className="flex gap-1.5">
                  {Array.from({ length: 4 }, (_, index) => (
                    <Skeleton
                      key={index}
                      className="h-1.5 flex-1 rounded-full"
                    />
                  ))}
                </div>
                <Skeleton className="mt-2 h-3 w-24" />
              </div>
            ) : routinesToday.length ? (
              <>
                <div
                  className="mt-3 flex gap-1.5"
                  aria-label={`${completed} of ${routinesToday.length} routines completed`}
                >
                  {routinesToday.map((routine) => (
                    <span
                      key={routine.id}
                      className={cn(
                        "h-1.5 flex-1 rounded-full",
                        routine.status === "completed"
                          ? "bg-completed-500"
                          : routine.status === "skipped"
                            ? "bg-skipped-500"
                            : "bg-paper-200 dark:bg-[#2b352d]"
                      )}
                    />
                  ))}
                </div>
                <p className="mt-2 font-mono text-xs text-ink-500 dark:text-[#a7b7aa]">
                  {completed} of {routinesToday.length} complete
                </p>
              </>
            ) : (
              <p className="mt-2 text-xs text-ink-500 dark:text-[#a7b7aa]">
                No routines scheduled
              </p>
            )}
          </div>
        </aside>

        <section className="min-w-0 flex-1">
          <header className="sticky top-0 z-20 border-b border-paper-200 bg-paper-0/95 backdrop-blur dark:border-[#2b352d] dark:bg-[#171d18]/95">
            <div className="flex min-h-[72px] flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3 md:px-8">
              <div className="lg:hidden">
                <Brand />
              </div>
              <p className="hidden text-sm font-medium text-ink-500 lg:block dark:text-[#a7b7aa]">
                {todayLabel}
              </p>
              <div className="relative ml-auto flex items-center gap-2">
                <ThemeButton />
                {loading ? (
                  <Skeleton className="size-10 rounded-full" />
                ) : (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="grid size-10 place-items-center rounded-full p-0"
                        aria-label="Open account menu"
                      >
                        <UserAvatar
                          name={name}
                          image={image}
                          className="size-10"
                        />
                      </Button>
                    </DropdownMenuTrigger>
                    <AccountMenu
                      name={name}
                      email={email}
                      onSignOut={() => setSignOutOpen(true)}
                    />
                  </DropdownMenu>
                )}
              </div>
              <nav
                className="order-3 flex w-full gap-1 overflow-x-auto lg:hidden"
                aria-label="Primary navigation"
              >
                {pages.map(({ page: destination, label }) => (
                  <Link
                    key={destination}
                    to={`/${destination}`}
                    className={cn(
                      "shrink-0 rounded-lg px-3 py-2 text-xs font-medium",
                      page === destination
                        ? "bg-signal-50 text-signal-700 dark:bg-[#26382b] dark:text-signal-300"
                        : "text-ink-500 dark:text-[#a7b7aa]"
                    )}
                  >
                    {label}
                  </Link>
                ))}
              </nav>
            </div>
          </header>
          {children}
        </section>
      </div>
      <Dialog
        open={signOutOpen}
        onOpenChange={(open) => !signingOut && setSignOutOpen(open)}
      >
        <DialogContent>
          <DialogTitle>Sign out of Routempo?</DialogTitle>
          <DialogDescription>
            You’ll need to sign in with Google again to access your routines.
          </DialogDescription>
          <div className="mt-6 flex justify-end gap-2">
            <Button
              variant="ghost"
              disabled={signingOut}
              onClick={() => setSignOutOpen(false)}
            >
              Stay signed in
            </Button>
            <Button
              variant="danger"
              disabled={signingOut}
              onClick={() => {
                setSigningOut(true)
                void Promise.resolve(
                  authClient.signOut({
                    fetchOptions: {
                      onSuccess: () => {
                        window.location.href = "/login"
                      },
                    },
                  })
                ).finally(() => setSigningOut(false))
              }}
            >
              {signingOut ? "Signing out…" : "Sign out"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function UserAvatar({
  name,
  image,
  className,
}: {
  name: string
  image?: string | null
  className?: string
}) {
  const initials = name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()

  return (
    <Avatar
      className={cn(
        "bg-signal-100 text-xs font-semibold text-signal-700 dark:bg-[#26382b] dark:text-signal-300",
        className
      )}
    >
      {image && (
        <AvatarImage
          src={image}
          alt={`${name} profile`}
          referrerPolicy="no-referrer"
        />
      )}
      <AvatarFallback>{initials}</AvatarFallback>
    </Avatar>
  )
}

function AccountMenu({
  name,
  email,
  onSignOut,
}: {
  name: string
  email: string
  onSignOut: () => void
}) {
  return (
    <DropdownMenuContent
      align="end"
      className="w-60"
      onCloseAutoFocus={(event) => event.preventDefault()}
    >
      <DropdownMenuLabel>
        <p className="text-sm font-semibold">{name}</p>
        {email && (
          <p className="mt-0.5 truncate text-xs text-ink-500 dark:text-[#a7b7aa]">
            {email}
          </p>
        )}
      </DropdownMenuLabel>
      <DropdownMenuSeparator />
      <DropdownMenuItem asChild>
        <Link to="/settings">
          <SettingsIcon />
          Settings
        </Link>
      </DropdownMenuItem>
      <DropdownMenuItem onSelect={onSignOut}>
        <LogOut className="size-4" />
        Sign out
      </DropdownMenuItem>
    </DropdownMenuContent>
  )
}
