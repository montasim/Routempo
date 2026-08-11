import type { LucideIcon } from "lucide-react"
import type { ReactNode } from "react"

import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  compact = false,
  embedded = false,
}: {
  icon: LucideIcon
  title: string
  description: string
  action?: ReactNode
  compact?: boolean
  embedded?: boolean
}) {
  const Heading = embedded ? "h3" : "h2"

  return (
    <Card
      data-slot="empty-state"
      className={cn(
        "relative overflow-hidden",
        compact ? "p-8" : "px-6 py-12 md:px-10 md:py-14",
        embedded &&
          "rounded-none border-0 bg-transparent shadow-none dark:bg-transparent"
      )}
    >
      <div className="mx-auto max-w-md text-center">
        <div className="mx-auto w-fit rounded-[14px] border border-paper-200 bg-paper-50 p-3 dark:border-[#2b352d] dark:bg-[#202821]">
          <Icon className="size-5 text-signal-600 dark:text-signal-300" />
        </div>
        <div className="mx-auto mt-5 flex w-28 gap-1.5" aria-hidden="true">
          {[0, 1, 2, 3].map((mark) => (
            <span
              key={mark}
              className="h-1.5 flex-1 rounded-full bg-paper-200 dark:bg-[#2b352d]"
            />
          ))}
        </div>
        <Heading className="mt-5 text-xl font-semibold tracking-[-.02em]">
          {title}
        </Heading>
        <p className="mt-2 text-sm leading-6 text-ink-500 dark:text-[#a7b7aa]">
          {description}
        </p>
        {action && <div className="mt-6 flex justify-center">{action}</div>}
      </div>
    </Card>
  )
}
