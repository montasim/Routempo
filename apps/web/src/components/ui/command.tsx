import { Command as CommandPrimitive } from "cmdk"
import { Search } from "lucide-react"
import type * as React from "react"

import { cn } from "@/lib/utils"

export function Command({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive>) {
  return (
    <CommandPrimitive
      className={cn(
        "flex h-full w-full flex-col overflow-hidden rounded-[10px] bg-paper-0 text-ink-900 dark:bg-[#202821] dark:text-[#f2f6f2]",
        className
      )}
      {...props}
    />
  )
}

export function CommandInput({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Input>) {
  return (
    <div className="flex h-11 items-center gap-2 border-b border-paper-200 px-3 dark:border-[#3a463d]">
      <Search className="size-4 shrink-0 text-ink-400" />
      <CommandPrimitive.Input
        className={cn(
          "h-full min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-ink-400",
          className
        )}
        {...props}
      />
    </div>
  )
}

export function CommandList({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.List>) {
  return (
    <CommandPrimitive.List
      className={cn(
        "max-h-56 overflow-x-hidden overflow-y-auto p-1.5",
        className
      )}
      {...props}
    />
  )
}

export function CommandEmpty(
  props: React.ComponentProps<typeof CommandPrimitive.Empty>
) {
  return (
    <CommandPrimitive.Empty
      className="py-6 text-center text-sm text-ink-500 dark:text-[#a7b7aa]"
      {...props}
    />
  )
}

export function CommandItem({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Item>) {
  return (
    <CommandPrimitive.Item
      className={cn(
        "relative flex cursor-default items-center gap-2 rounded-lg px-2.5 py-2 text-sm outline-none select-none data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50 data-[selected=true]:bg-signal-50 data-[selected=true]:text-signal-700 dark:data-[selected=true]:bg-[#26382b] dark:data-[selected=true]:text-signal-300",
        className
      )}
      {...props}
    />
  )
}

export function CommandSeparator({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Separator>) {
  return (
    <CommandPrimitive.Separator
      className={cn(
        "-mx-1 my-1 h-px bg-paper-200 dark:bg-[#3a463d]",
        className
      )}
      {...props}
    />
  )
}
