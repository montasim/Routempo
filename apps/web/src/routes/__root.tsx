import {
  createRootRoute,
  HeadContent,
  Outlet,
  Scripts,
  type ErrorComponentProps,
} from "@tanstack/react-router"
import { useEffect, type ReactNode } from "react"
import { Toaster } from "sonner"

import { AppProvider } from "@/components/app-provider"
import { SystemStatusPage } from "@/components/system-status-page"
import appCss from "@/styles.css?url"

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Routempo — A calmer daily rhythm" },
      {
        name: "description",
        content:
          "Plan simple routines, act on time, and learn from what actually happened.",
      },
      { name: "theme-color", content: "#176b3a" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/logo.svg" },
      { rel: "manifest", href: "/manifest.webmanifest" },
    ],
  }),
  shellComponent: RootDocument,
  component: RootComponent,
  errorComponent: ServerErrorPage,
  notFoundComponent: NotFoundPage,
})

function NotFoundPage() {
  return <SystemStatusPage status="404" />
}

function ServerErrorPage({ reset }: ErrorComponentProps) {
  return <SystemStatusPage status="500" onRetry={reset} />
}

function RootComponent() {
  return <Outlet />
}

function RootDocument({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body>
        <LegacySearchCleanup />
        <AppProvider>
          {children}
          <Toaster richColors position="top-center" />
        </AppProvider>
        <script
          src="https://www.supportkori.com/widget.js"
          data-id="montasim"
          data-message="Support"
          data-color="#15803d"
          data-position="right"
        ></script>
        <Scripts />
      </body>
    </html>
  )
}

function LegacySearchCleanup() {
  useEffect(() => {
    const url = new URL(window.location.href)
    if (!url.searchParams.has("variant")) return

    url.searchParams.delete("variant")
    window.history.replaceState(window.history.state, "", url)
  }, [])

  return null
}
