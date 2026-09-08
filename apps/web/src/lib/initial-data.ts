import type { AppData } from "@/lib/types"

export function createInitialData(
  name = "Routempo user",
  timezone = ""
): AppData {
  return {
    categories: [],
    routines: [],
    settings: {
      name,
      timezone,
      reminder: "10",
      notifications: false,
      weeklySummary: false,
    },
    logs: [],
  }
}
