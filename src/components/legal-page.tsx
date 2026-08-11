import { ArrowLeft } from "lucide-react"
import { Link } from "@tanstack/react-router"

import { Brand } from "@/components/brand"
import { ThemeButton } from "@/components/theme-button"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

type LegalKind = "terms" | "privacy"

const legalDocuments = {
  terms: {
    eyebrow: "Terms",
    title: "Terms of service",
    summary:
      "The rules for using Routempo to plan routines, record outcomes, and review your rhythm.",
    sections: [
      {
        title: "Using Routempo",
        paragraphs: [
          "By accessing or using Routempo, you agree to these terms. If you do not agree, do not use the service.",
          "You must be able to enter into a binding agreement in your location and provide accurate account information through Google sign-in.",
        ],
      },
      {
        title: "What the service provides",
        paragraphs: [
          "Routempo helps you schedule routines, organize categories, record completed or skipped activities, adjust preferences, and review activity history.",
          "Features may change as the service develops. Reminders and schedules are organizational aids; they are not guaranteed alarms, emergency notifications, or professional advice.",
        ],
      },
      {
        title: "Your account",
        paragraphs: [
          "Access is provided through Google authentication. You are responsible for protecting your Google account and for activity performed through your Routempo session.",
          "Tell the operator of your Routempo deployment if you believe your account or session has been used without permission.",
        ],
      },
      {
        title: "Your content",
        paragraphs: [
          "You retain ownership of the routine names, notes, categories, settings, and other content you enter. You grant Routempo permission to store, process, and display that content only as needed to operate and improve the service.",
          "You are responsible for ensuring that your content is lawful and that you have the right to provide it.",
        ],
      },
      {
        title: "Acceptable use",
        paragraphs: ["You may not:"],
        bullets: [
          "use Routempo for unlawful, harmful, or fraudulent activity;",
          "attempt to access another person’s account or data;",
          "interfere with the service, bypass security controls, or probe it for vulnerabilities without permission;",
          "automate requests in a way that disrupts the service or other users.",
        ],
      },
      {
        title: "Third-party services",
        paragraphs: [
          "Routempo relies on Google for sign-in and may rely on infrastructure providers for hosting and data storage. Your use of those services may also be governed by their own terms and policies.",
        ],
      },
      {
        title: "Availability and termination",
        paragraphs: [
          "The service may be interrupted for maintenance, security, or reasons outside Routempo’s control. Access may be limited or suspended when necessary to protect the service, comply with law, or address a violation of these terms.",
          "You may stop using Routempo at any time. Data retention after access ends is described in the privacy notice.",
        ],
      },
      {
        title: "Disclaimers and liability",
        paragraphs: [
          "Routempo is provided on an “as is” and “as available” basis to the extent permitted by law. It does not provide medical, mental-health, legal, or other professional advice.",
          "To the extent permitted by law, Routempo and its operator are not liable for indirect, incidental, special, consequential, or punitive damages, or for losses caused by missed reminders, unavailable service, or decisions based on the service.",
        ],
      },
      {
        title: "Changes and questions",
        paragraphs: [
          "These terms may be updated when the service or legal requirements change. The effective date below identifies the current version. Continued use after an update means you accept the revised terms where permitted by law.",
          "For questions, use the support channel associated with the Routempo deployment you use.",
        ],
      },
    ],
  },
  privacy: {
    eyebrow: "Privacy",
    title: "Privacy notice",
    summary:
      "How Routempo handles account information, routines, settings, and activity history.",
    sections: [
      {
        title: "Information Routempo handles",
        paragraphs: ["Routempo may process the following information:"],
        bullets: [
          "Google account details used for sign-in, such as your name, email address, profile image, and provider account identifier;",
          "session and security information, including session tokens, expiration times, IP address, and browser user agent;",
          "content you create, including routines, times, recurrence rules, notes, categories, completion or skip history, and settings such as timezone and reminders;",
          "technical information needed to operate, secure, and diagnose the service.",
        ],
      },
      {
        title: "How information is used",
        paragraphs: ["Routempo uses this information to:"],
        bullets: [
          "authenticate you and maintain your session;",
          "store, display, and update your routines, categories, settings, and logs;",
          "provide planning, completion, history, and insight features;",
          "protect the service, prevent abuse, and investigate technical problems;",
          "comply with applicable legal obligations.",
        ],
      },
      {
        title: "Google sign-in",
        paragraphs: [
          "Routempo uses Google only as an authentication provider. Routempo does not ask you to create a separate password. Google’s handling of information during sign-in is governed by Google’s own policies.",
        ],
      },
      {
        title: "Cookies and sessions",
        paragraphs: [
          "Routempo uses essential session cookies to keep you signed in and protect authenticated requests. These cookies are necessary for the service to function and are not used by Routempo for advertising.",
        ],
      },
      {
        title: "Storage and sharing",
        paragraphs: [
          "Information is stored in the database and systems used by the Routempo deployment you access. It may be processed by service providers that supply authentication, hosting, database, security, or operational infrastructure.",
          "Routempo does not sell your personal information. Information may be disclosed when required by law, to protect users or the service, or as part of a business transfer subject to appropriate safeguards.",
        ],
      },
      {
        title: "Retention",
        paragraphs: [
          "Account and app information is generally retained while your account is active and for as long as needed to operate the service, maintain security and audit records, resolve disputes, or meet legal obligations.",
          "Routine logs may remain after a routine is deleted so that your activity history stays accurate.",
        ],
      },
      {
        title: "Your choices",
        paragraphs: [
          "You can update routines, categories, profile settings, reminder preferences, and notification preferences within Routempo. You can sign out to end the active browser session.",
          "For access, correction, deletion, or other privacy requests not available in the interface, use the support channel associated with your Routempo deployment. Some information may be retained where required by law or necessary for security and audit purposes.",
        ],
      },
      {
        title: "Security and children",
        paragraphs: [
          "Routempo uses reasonable technical and organizational safeguards, but no internet service can guarantee absolute security.",
          "Routempo is not directed to children under 13, or a higher minimum age where local law requires it, and should not be used by children without appropriate authorization.",
        ],
      },
      {
        title: "Changes and questions",
        paragraphs: [
          "This notice may be updated as the service and its data practices change. The effective date below identifies the current version.",
          "For privacy questions, use the support channel associated with the Routempo deployment you use.",
        ],
      },
    ],
  },
} as const

export function LegalPage({ kind }: { kind: LegalKind }) {
  const document = legalDocuments[kind]

  return (
    <main className="min-h-dvh bg-paper-50 text-ink-900 dark:bg-[#101511] dark:text-[#f2f6f2]">
      <header
        data-slot="legal-header"
        className="sticky top-0 z-40 border-b border-paper-200 bg-paper-0 dark:border-[#2b352d] dark:bg-[#171d18]"
      >
        <div className="mx-auto flex h-18 max-w-6xl items-center gap-3 px-4 md:px-8">
          <Brand />
          <div className="ml-auto flex items-center gap-2">
            <ThemeButton />
            <Button variant="outline" asChild>
              <Link to="/login" aria-label="Back to sign in">
                <ArrowLeft />
                <span className="hidden sm:inline">Back to sign in</span>
                <span className="sm:hidden">Sign in</span>
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-10 md:px-8 md:py-16 lg:grid-cols-[13rem_minmax(0,1fr)]">
        <aside className="lg:sticky lg:top-8 lg:self-start">
          <p className="font-mono text-xs font-medium tracking-[.1em] text-ink-400 uppercase">
            Legal
          </p>
          <nav aria-label="Legal documents" className="mt-4 flex gap-2 lg:grid">
            <LegalNavLink to="/terms" active={kind === "terms"}>
              Terms of service
            </LegalNavLink>
            <LegalNavLink to="/privacy" active={kind === "privacy"}>
              Privacy notice
            </LegalNavLink>
          </nav>
          <p className="mt-6 hidden text-xs leading-5 text-ink-400 lg:block">
            Effective August 10, 2026
          </p>
        </aside>

        <article className="max-w-3xl">
          <p className="text-sm font-medium text-signal-600 dark:text-signal-300">
            {document.eyebrow}
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-[-.035em] md:text-5xl">
            {document.title}
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-ink-500 dark:text-[#a7b7aa]">
            {document.summary}
          </p>
          <p className="mt-4 text-xs text-ink-400 lg:hidden">
            Effective August 10, 2026
          </p>

          <Card className="mt-10 px-5 md:px-8">
            {document.sections.map((section) => (
              <section
                key={section.title}
                className="border-b border-paper-200 py-8 last:border-0 dark:border-[#2b352d]"
              >
                <h2 className="text-lg font-semibold tracking-[-.015em]">
                  {section.title}
                </h2>
                <div className="text-ink-600 mt-4 space-y-4 text-sm leading-7 dark:text-[#b8c5ba]">
                  {section.paragraphs.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                  {"bullets" in section && section.bullets && (
                    <ul className="list-disc space-y-2 pl-5 marker:text-signal-600 dark:marker:text-signal-300">
                      {section.bullets.map((bullet) => (
                        <li key={bullet}>{bullet}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </section>
            ))}
          </Card>
        </article>
      </div>
    </main>
  )
}

function LegalNavLink({
  to,
  active,
  children,
}: {
  to: "/terms" | "/privacy"
  active: boolean
  children: React.ReactNode
}) {
  return (
    <Link
      to={to}
      aria-current={active ? "page" : undefined}
      className={cn(
        "rounded-[10px] px-3 py-2 text-sm font-medium transition-colors outline-none focus-visible:ring-3 focus-visible:ring-signal-600/20",
        active
          ? "bg-signal-100 text-signal-700 dark:bg-[#26382b] dark:text-signal-300"
          : "text-ink-500 hover:bg-paper-100 hover:text-ink-900 dark:text-[#a7b7aa] dark:hover:bg-[#202821] dark:hover:text-white"
      )}
    >
      {children}
    </Link>
  )
}
