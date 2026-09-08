import type * as React from "react"

import { cn } from "@/lib/utils"

export function Input({ className, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      className={cn(
        "h-11 w-full rounded-[10px] border border-paper-300 bg-paper-0 px-3 text-sm text-ink-900 outline-none placeholder:text-ink-400 focus:border-signal-600 focus:ring-3 focus:ring-signal-600/15 disabled:cursor-not-allowed disabled:bg-paper-50 disabled:text-ink-500 dark:border-[#3a463d] dark:bg-[#202821] dark:text-[#f2f6f2]",
        className
      )}
      {...props}
    />
  )
}
