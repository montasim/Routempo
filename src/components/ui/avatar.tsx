import { Avatar as AvatarPrimitive } from "radix-ui"
import { useEffect, useState, type ComponentProps } from "react"

import { cn } from "@/lib/utils"

function Avatar({
  className,
  ...props
}: ComponentProps<typeof AvatarPrimitive.Root>) {
  return (
    <AvatarPrimitive.Root
      data-slot="avatar"
      className={cn(
        "relative flex size-8 shrink-0 overflow-hidden rounded-full",
        className
      )}
      {...props}
    />
  )
}

function AvatarImage({
  className,
  src,
  onError,
  ...props
}: ComponentProps<"img">) {
  const [failed, setFailed] = useState(false)
  useEffect(() => setFailed(false), [src])

  if (!src || failed) return null
  return (
    <img
      data-slot="avatar-image"
      className={cn(
        "relative z-10 aspect-square size-full object-cover",
        className
      )}
      src={src}
      onError={(event) => {
        setFailed(true)
        onError?.(event)
      }}
      {...props}
    />
  )
}

function AvatarFallback({
  className,
  ...props
}: ComponentProps<typeof AvatarPrimitive.Fallback>) {
  return (
    <AvatarPrimitive.Fallback
      data-slot="avatar-fallback"
      className={cn(
        "absolute inset-0 flex size-full items-center justify-center rounded-full bg-signal-100 text-xs font-semibold text-signal-700 dark:bg-[#26382b] dark:text-signal-300",
        className
      )}
      {...props}
    />
  )
}

export { Avatar, AvatarFallback, AvatarImage }
