import type * as React from "react"

import { cn } from "@/lib/utils"

export function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      aria-hidden="true"
      className={cn(
        "rounded-md bg-paper-200 motion-safe:animate-pulse dark:bg-[#2b352d]",
        className
      )}
      {...props}
    />
  )
}
