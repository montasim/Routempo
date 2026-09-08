import { Switch as SwitchPrimitive } from "radix-ui"
import type * as React from "react"

import { cn } from "@/lib/utils"

export function Switch({
  className,
  ...props
}: React.ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      className={cn(
        "inline-flex h-7 w-12 shrink-0 items-center rounded-full bg-paper-300 p-1 transition-colors outline-none focus-visible:ring-3 focus-visible:ring-signal-600/25 data-[state=checked]:bg-signal-600 dark:bg-[#3a463d]",
        className
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb className="block size-5 rounded-full bg-white shadow-sm transition-transform data-[state=checked]:translate-x-5" />
    </SwitchPrimitive.Root>
  )
}
