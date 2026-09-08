import { createFileRoute } from "@tanstack/react-router"

import { LegalPage } from "@/components/legal-page"

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [{ title: "Terms of service — Routempo" }],
  }),
  component: () => <LegalPage kind="terms" />,
})
