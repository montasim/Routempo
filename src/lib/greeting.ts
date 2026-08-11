export function greetingForTimeZone(
  timeZone: string,
  name: string,
  now = new Date()
) {
  let hour: number
  try {
    const hourText = new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      hourCycle: "h23",
      timeZone,
    }).format(now)
    hour = Number(hourText)
  } catch {
    hour = now.getHours()
  }

  const period = hour < 12 ? "morning" : hour < 17 ? "afternoon" : "evening"
  const firstName = name.trim().split(/\s+/)[0] || "there"

  return `Good ${period}, ${firstName.toLocaleUpperCase()}`
}

export function dateForTimeZone(timeZone: string, now = new Date()) {
  try {
    return new Intl.DateTimeFormat("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      timeZone,
    }).format(now)
  } catch {
    return new Intl.DateTimeFormat("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    }).format(now)
  }
}
