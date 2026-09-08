import { Link } from "@tanstack/react-router"

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <Link
      to="/today"
      className="inline-flex items-center gap-2.5 rounded-[10px] outline-none focus-visible:ring-3 focus-visible:ring-signal-600/25"
      aria-label="Routempo home"
    >
      <img src="/logo.svg" alt="" className="size-8" />
      {!compact && (
        <span className="text-[18px] font-semibold tracking-[-.02em] text-ink-900 dark:text-[#f2f6f2]">
          Rou<span className="text-signal-600 dark:text-signal-300">tempo</span>
        </span>
      )}
    </Link>
  )
}
