import { createFileRoute } from "@tanstack/react-router"

import { LoginScreen } from "@/components/login-screen"
import { appSearchSchema } from "@/lib/search"

export const Route = createFileRoute("/login")({
  validateSearch: appSearchSchema,
  component: LoginRoute,
})

function LoginRoute() {
  return <LoginScreen />
}
