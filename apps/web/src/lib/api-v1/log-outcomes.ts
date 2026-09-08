type LogOutcome = "completed" | "skipped" | "missed"

export function countLogOutcomes(logs: Array<{ status: string }>) {
  const counts = { total: logs.length, completed: 0, skipped: 0, missed: 0 }
  for (const log of logs) {
    if (isLogOutcome(log.status)) counts[log.status] += 1
  }
  return counts
}

function isLogOutcome(status: string): status is LogOutcome {
  return status === "completed" || status === "skipped" || status === "missed"
}
