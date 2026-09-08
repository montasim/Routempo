import { Check, Clock3, LockKeyhole, ShieldCheck } from "lucide-react"
import { Link } from "@tanstack/react-router"
import { useEffect, useState } from "react"
import { toast } from "sonner"

import { Brand } from "@/components/brand"
import { ThemeButton } from "@/components/theme-button"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { authClient } from "@/lib/auth-client"

export function LoginScreen() {
  const signIn = async (provider: "google" | "microsoft") => {
    const result =
      provider === "google"
        ? await authClient.signIn.social({
            provider: "google",
            callbackURL: "/today",
          })
        : await authClient.signIn.oauth2({
            providerId: "microsoft-entra-id",
            callbackURL: "/today",
          })
    if (result.error)
      toast.error(
        result.error.message ||
          `${provider === "google" ? "Google" : "Microsoft"} sign-in could not start`
      )
  }
  return (
    <main className="min-h-dvh bg-paper-0 font-sans text-ink-900 antialiased dark:bg-[#171d18] dark:text-[#f2f6f2]">
      <div
        data-slot="login-layout"
        className="grid min-h-dvh w-full bg-paper-0 lg:grid-cols-2 dark:bg-[#171d18]"
      >
        <LivingRoutinePreview />
        <section className="relative flex min-h-[620px] flex-col px-5 py-6 sm:px-10 sm:py-9 lg:px-14 xl:px-20">
          <div className="flex items-center justify-between">
            <div className="lg:hidden">
              <Brand />
            </div>
            <div className="ml-auto">
              <ThemeButton />
            </div>
          </div>
          <div className="my-auto w-full max-w-[420px] self-center py-10">
            <div className="grid size-11 place-items-center rounded-[10px] bg-signal-50 text-signal-600 dark:bg-[#26382b] dark:text-signal-300">
              <ShieldCheck className="size-5" />
            </div>
            <p className="mt-6 text-sm font-medium text-signal-600 dark:text-signal-300">
              Welcome to Routempo
            </p>
            <h1 className="mt-3 text-[1.6rem] font-semibold tracking-[-.02em]">
              Sign in to continue
            </h1>
            <p className="mt-3 text-sm leading-6 text-ink-500 dark:text-[#a7b7aa]">
              Use your Google or Microsoft account to securely access today’s
              routines, plan, and progress.
            </p>
            <Button
              variant="outline"
              size="lg"
              className="mt-8 w-full"
              onClick={() => void signIn("google")}
            >
              <GoogleIcon />
              Continue with Google
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="mt-3 w-full"
              onClick={() => void signIn("microsoft")}
            >
              <MicrosoftIcon />
              Continue with Microsoft
            </Button>
            <div className="mt-6 flex items-start gap-3 rounded-[10px] bg-paper-50 p-4 dark:bg-[#202821]">
              <LockKeyhole className="mt-0.5 size-4 shrink-0 text-signal-600 dark:text-signal-300" />
              <p className="text-xs leading-5 text-ink-500 dark:text-[#a7b7aa]">
                Routempo uses your chosen provider only to verify your identity.
                Calendar and task access is requested separately in Settings.
              </p>
            </div>
          </div>
          <p className="text-center text-xs leading-5 text-ink-400">
            By continuing, you agree to the{" "}
            <Link
              to="/terms"
              className="hover:text-ink-600 rounded-sm underline decoration-paper-300 underline-offset-3 outline-none focus-visible:ring-2 focus-visible:ring-signal-600/25 dark:decoration-[#526055] dark:hover:text-[#cad4cc]"
            >
              terms
            </Link>{" "}
            and{" "}
            <Link
              to="/privacy"
              className="hover:text-ink-600 rounded-sm underline decoration-paper-300 underline-offset-3 outline-none focus-visible:ring-2 focus-visible:ring-signal-600/25 dark:decoration-[#526055] dark:hover:text-[#cad4cc]"
            >
              privacy notice
            </Link>
            .
          </p>
        </section>
      </div>
    </main>
  )
}

const previewStages = [
  {
    label: "Plan",
    heading: "Plan what comes next.",
    description:
      "Give each routine a clear time, then let the rest of the day stay quiet.",
    signal: "Start with one useful action and a realistic time.",
  },
  {
    label: "Record",
    heading: "Record what actually happened.",
    description:
      "Complete, skip, or adjust without rewriting the story of your day.",
    signal: "Each outcome comes from something you actually record.",
  },
  {
    label: "Learn",
    heading: "Notice your rhythm over time.",
    description:
      "See useful patterns without turning everyday life into a scorecard.",
    signal: "Patterns appear only after your own history takes shape.",
  },
] as const

const previewRoutines = [
  { time: "01", title: "Choose one routine", category: "Start small" },
  { time: "02", title: "Give it a useful time", category: "Keep it realistic" },
  { time: "03", title: "Record the outcome", category: "Learn from real days" },
] as const

function LivingRoutinePreview() {
  const [stage, setStage] = useState(0)
  const [paused, setPaused] = useState(false)
  const [reduceMotion, setReduceMotion] = useState(false)
  const current = previewStages[stage] ?? previewStages[0]

  useEffect(() => {
    const preference = matchMedia("(prefers-reduced-motion: reduce)")
    const update = () => setReduceMotion(preference.matches)
    update()
    preference.addEventListener("change", update)
    return () => preference.removeEventListener("change", update)
  }, [])

  useEffect(() => {
    if (paused || reduceMotion) return
    const timer = window.setInterval(
      () =>
        setStage((currentStage) => (currentStage + 1) % previewStages.length),
      5000
    )
    return () => window.clearInterval(timer)
  }, [paused, reduceMotion])

  return (
    <section
      className="relative hidden overflow-hidden bg-signal-800 p-10 text-white lg:flex lg:flex-col lg:items-center lg:justify-between xl:p-14"
      aria-label="How Routempo works"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <div className="flex w-full max-w-xl items-center gap-2.5">
        <img
          src="/logo.svg"
          alt=""
          className="size-9 rounded-[10px] bg-white p-1.5"
        />
        <span className="text-lg font-semibold">Routempo</span>
      </div>
      <div className="w-full max-w-xl py-10">
        <p className="font-mono text-xs font-medium tracking-[.12em] text-white/65 uppercase">
          A calmer daily rhythm
        </p>
        <div className="mt-5 min-h-40 xl:min-h-44">
          <h1 className="max-w-lg text-4xl font-semibold tracking-[-.03em] text-white motion-safe:transition-opacity xl:text-5xl">
            {current.heading}
          </h1>
          <p className="mt-4 max-w-md text-base leading-7 text-white/70">
            {current.description}
          </p>
        </div>

        <Card className="mt-7 max-w-md overflow-hidden border-white/15 bg-white/[.07] text-white shadow-soft dark:border-white/15 dark:bg-white/[.07] dark:text-white">
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-white">
                Your first rhythm
              </p>
              <p className="mt-0.5 text-xs text-white/55">
                Built from your own routines
              </p>
            </div>
            <Badge className="bg-white/10 font-mono text-white/75 dark:bg-white/10 dark:text-white/75">
              {Math.min(stage + 1, 3)} of 3
            </Badge>
          </div>
          <div className="p-2">
            {previewRoutines.map((routine, index) => {
              const state = routinePreviewState(stage, index)
              return (
                <div
                  key={routine.title}
                  className={`flex items-center gap-3 rounded-[10px] px-3 py-2.5 transition-colors duration-500 motion-reduce:transition-none ${state === "next" ? "bg-white/10" : "bg-transparent"}`}
                >
                  <span
                    className={`grid size-8 shrink-0 place-items-center rounded-full border transition-colors duration-500 motion-reduce:transition-none ${state === "complete" ? "border-white bg-white text-signal-800" : state === "next" ? "border-white/35 bg-white/10 text-white" : "border-white/15 text-white/45"}`}
                  >
                    {state === "complete" ? (
                      <Check className="size-4" />
                    ) : (
                      <Clock3 className="size-3.5" />
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-white">
                      {routine.title}
                    </span>
                    <span className="mt-0.5 block text-xs text-white/55">
                      {routine.category}
                    </span>
                  </span>
                  <span className="font-mono text-xs text-white/65">
                    {routine.time}
                  </span>
                </div>
              )
            })}
          </div>
          <p className="border-t border-white/10 px-4 py-3 text-xs text-white/65">
            {current.signal}
          </p>
        </Card>
      </div>
      <div
        className="grid w-full max-w-xl grid-cols-3 gap-3 border-t border-white/15 pt-5"
        aria-label="Preview stages"
      >
        {previewStages.map((item, index) => (
          <Button
            key={item.label}
            type="button"
            variant="ghost"
            onClick={() => setStage(index)}
            aria-pressed={stage === index}
            aria-label={`Show ${item.label} preview`}
            className={`h-auto justify-start rounded-[10px] px-2 py-2 text-left font-normal transition-colors outline-none focus-visible:ring-2 focus-visible:ring-white/70 motion-reduce:transition-none ${stage === index ? "bg-white/10 text-white" : "text-white/55 hover:bg-white/[.06] hover:text-white/80"}`}
          >
            <span className="block font-mono text-sm font-medium">
              {String(index + 1).padStart(2, "0")}
            </span>
            <span className="mt-1 block text-sm">{item.label}</span>
          </Button>
        ))}
      </div>
    </section>
  )
}

function routinePreviewState(stage: number, index: number) {
  if (index < stage) return "complete"
  if (index === stage) return "next"
  return "later"
}

function GoogleIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      data-slot="google-icon"
      className="size-[18px]"
    >
      <path
        fill="#4285F4"
        d="M21.6 12.23c0-.71-.06-1.39-.18-2.05H12v3.87h5.38a4.6 4.6 0 0 1-2 3.02v2.51h3.24c1.9-1.75 2.98-4.33 2.98-7.35Z"
      />
      <path
        fill="#34A853"
        d="M12 22c2.7 0 4.97-.9 6.62-2.42l-3.24-2.51c-.9.6-2.05.96-3.38.96-2.61 0-4.82-1.76-5.61-4.13H3.05v2.59A10 10 0 0 0 12 22Z"
      />
      <path
        fill="#FBBC05"
        d="M6.39 13.9A6.02 6.02 0 0 1 6.07 12c0-.66.11-1.3.32-1.9V7.51H3.05A10 10 0 0 0 2 12c0 1.61.39 3.14 1.05 4.49l3.34-2.59Z"
      />
      <path
        fill="#EA4335"
        d="M12 5.97c1.47 0 2.79.5 3.82 1.5l2.87-2.87A9.62 9.62 0 0 0 12 2a10 10 0 0 0-8.95 5.51l3.34 2.59C7.18 7.73 9.39 5.97 12 5.97Z"
      />
    </svg>
  )
}

function MicrosoftIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      data-slot="microsoft-icon"
      className="size-[18px]"
    >
      <path fill="#f25022" d="M2 2h9.4v9.4H2z" />
      <path fill="#7fba00" d="M12.6 2H22v9.4h-9.4z" />
      <path fill="#00a4ef" d="M2 12.6h9.4V22H2z" />
      <path fill="#ffb900" d="M12.6 12.6H22V22h-9.4z" />
    </svg>
  )
}
