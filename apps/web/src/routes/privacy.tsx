import { createFileRoute } from "@tanstack/react-router"

import { LegalPage } from "@/components/legal-page"

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [{ title: "Privacy notice — Routempo" }],
  }),
  component: () => <LegalPage kind="privacy" />,
})
