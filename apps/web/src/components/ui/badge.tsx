import { Slot } from "radix-ui"
import { cva, type VariantProps } from "class-variance-authority"
import type * as React from "react"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex w-fit shrink-0 items-center justify-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium whitespace-nowrap [&_svg]:pointer-events-none [&_svg]:size-3.5",
  {
    variants: {
      variant: {
        default:
          "bg-signal-100 text-signal-700 dark:bg-signal-900/60 dark:text-signal-300",
        secondary:
          "bg-paper-100 text-ink-500 dark:bg-[#202821] dark:text-[#a7b7aa]",
        outline:
          "border border-paper-200 text-ink-700 dark:border-[#3a463d] dark:text-[#cad4cc]",
      },
    },
    defaultVariants: { variant: "default" },
  }
)

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "span"
  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
