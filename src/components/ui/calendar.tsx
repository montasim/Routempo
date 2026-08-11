import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp } from "lucide-react"
import {
  DayFlag,
  DayPicker,
  SelectionState,
  UI,
  type DayPickerProps,
} from "react-day-picker"

import { cn } from "@/lib/utils"

export function Calendar({
  className,
  classNames,
  components,
  ...props
}: DayPickerProps) {
  return (
    <DayPicker
      className={cn("relative w-fit p-3", className)}
      classNames={{
        [UI.Months]: "flex flex-col",
        [UI.Month]: "space-y-3",
        [UI.MonthCaption]: "relative flex h-9 items-center justify-center",
        [UI.CaptionLabel]: "text-sm font-semibold",
        [UI.Nav]: "absolute inset-x-3 top-3 flex items-center justify-between",
        [UI.PreviousMonthButton]:
          "grid size-9 place-items-center rounded-lg text-ink-500 outline-none hover:bg-paper-100 focus-visible:ring-3 focus-visible:ring-signal-600/20 disabled:opacity-35 dark:text-[#a7b7aa] dark:hover:bg-[#2b352d]",
        [UI.NextMonthButton]:
          "grid size-9 place-items-center rounded-lg text-ink-500 outline-none hover:bg-paper-100 focus-visible:ring-3 focus-visible:ring-signal-600/20 disabled:opacity-35 dark:text-[#a7b7aa] dark:hover:bg-[#2b352d]",
        [UI.MonthGrid]: "w-full border-collapse",
        [UI.Weekdays]: "flex",
        [UI.Weekday]:
          "w-9 py-1 text-center text-[11px] font-semibold text-ink-400",
        [UI.Weeks]: "block",
        [UI.Week]: "mt-1 flex",
        [UI.Day]: "relative size-9 p-0 text-center",
        [UI.DayButton]:
          "grid size-9 place-items-center rounded-lg text-sm outline-none transition-colors hover:bg-signal-50 hover:text-signal-700 focus-visible:ring-3 focus-visible:ring-signal-600/20 dark:hover:bg-[#26382b] dark:hover:text-signal-300",
        [SelectionState.selected]:
          "[&>button]:bg-signal-100 [&>button]:font-semibold [&>button]:text-signal-700 [&>button]:hover:bg-signal-200 [&>button]:hover:text-signal-700 dark:[&>button]:bg-[#26382b] dark:[&>button]:text-signal-300 dark:[&>button]:hover:bg-[#315039]",
        [DayFlag.today]: "[&>button]:ring-1 [&>button]:ring-signal-600/35",
        [DayFlag.outside]: "[&>button]:text-ink-400 [&>button]:opacity-45",
        [DayFlag.disabled]:
          "[&>button]:pointer-events-none [&>button]:text-ink-400 [&>button]:opacity-30",
        [DayFlag.hidden]: "invisible",
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation, className: chevronClassName }) => {
          const Icon =
            orientation === "left"
              ? ChevronLeft
              : orientation === "right"
                ? ChevronRight
                : orientation === "up"
                  ? ChevronUp
                  : ChevronDown
          return <Icon className={cn("size-4", chevronClassName)} />
        },
        ...components,
      }}
      {...props}
    />
  )
}
