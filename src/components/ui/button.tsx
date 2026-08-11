import { Slot } from "radix-ui"
import { cva, type VariantProps } from "class-variance-authority"
import type * as React from "react"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-[10px] text-sm font-medium whitespace-nowrap transition-[color,background-color,border-color,transform] duration-150 outline-none focus-visible:ring-3 focus-visible:ring-signal-600/25 active:scale-[.98] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-signal-600 text-white hover:bg-signal-700",
        secondary:
          "bg-paper-100 text-ink-800 hover:bg-paper-200 dark:bg-[#202821] dark:text-[#e2e9e3] dark:hover:bg-[#2b352d]",
        outline:
          "border border-paper-300 bg-paper-0 text-ink-800 hover:bg-paper-50 dark:border-[#3a463d] dark:bg-[#171d18] dark:text-[#e2e9e3] dark:hover:bg-[#202821]",
        ghost:
          "text-ink-700 hover:bg-paper-100 dark:text-[#cad4cc] dark:hover:bg-[#202821]",
        danger: "bg-missed-600 text-white hover:bg-missed-700",
      },
      size: {
        default: "h-10 px-4",
        sm: "h-9 rounded-lg px-3 text-xs",
        lg: "h-12 px-5",
        icon: "size-10 p-0",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "button"
  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  )
}

export { Button, buttonVariants }
