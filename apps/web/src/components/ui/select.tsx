import { Check, ChevronDown } from "lucide-react"
import { Select as SelectPrimitive } from "radix-ui"
import type * as React from "react"

import { cn } from "@/lib/utils"

export const Select = SelectPrimitive.Root
export const SelectValue = SelectPrimitive.Value

export function SelectTrigger({
  className,
  children,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Trigger>) {
  return (
    <SelectPrimitive.Trigger
      className={cn(
        "flex h-11 w-full items-center justify-between gap-2 rounded-[10px] border border-paper-300 bg-paper-0 px-3 text-sm text-ink-900 outline-none focus:border-signal-600 focus:ring-3 focus:ring-signal-600/15 data-[placeholder]:text-ink-400 dark:border-[#3a463d] dark:bg-[#202821] dark:text-[#f2f6f2]",
        className
      )}
      {...props}
    >
      <span className="min-w-0 truncate">{children}</span>
      <SelectPrimitive.Icon asChild>
        <ChevronDown className="size-4 shrink-0 text-ink-500 dark:text-[#a7b7aa]" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  )
}

export function SelectContent({
  className,
  children,
  position = "popper",
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Content>) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        position={position}
        sideOffset={6}
        className={cn(
          "z-[60] max-h-72 min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-[10px] border border-paper-200 bg-paper-0 text-ink-900 shadow-float data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 dark:border-[#3a463d] dark:bg-[#202821] dark:text-[#f2f6f2]",
          className
        )}
        {...props}
      >
        <SelectPrimitive.Viewport className="p-1.5">
          {children}
        </SelectPrimitive.Viewport>
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  )
}

export function SelectItem({
  className,
  children,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Item>) {
  return (
    <SelectPrimitive.Item
      className={cn(
        "relative flex cursor-default items-center rounded-lg py-2 pr-3 pl-8 text-sm outline-none select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-40 data-[highlighted]:bg-signal-50 data-[highlighted]:text-signal-700 data-[state=checked]:bg-signal-100 data-[state=checked]:font-medium data-[state=checked]:text-signal-700 dark:data-[highlighted]:bg-[#26382b] dark:data-[highlighted]:text-signal-300 dark:data-[state=checked]:bg-[#26382b] dark:data-[state=checked]:text-signal-300",
        className
      )}
      {...props}
    >
      <span className="absolute left-2.5 grid size-4 place-items-center text-signal-600 dark:text-signal-300">
        <SelectPrimitive.ItemIndicator>
          <Check className="size-4" />
        </SelectPrimitive.ItemIndicator>
      </span>
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  )
}
