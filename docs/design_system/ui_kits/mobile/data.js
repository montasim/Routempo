// RoutineFlow — shared mock dataset for the mobile + web UI kits.
// Everything here mimics what would be DERIVED from routine_logs.
window.RF_DATA = (function () {
  const user = {
    name: "Demo User",
    timezone: "Asia/Dhaka",
    email: "demo@example.com",
  }

  // Today's occurrences (status drives the Home screen)
  const today = [
    {
      id: "o1",
      time: "06:30",
      title: "Wake & hydrate",
      category: "Health",
      status: "Completed",
      delay: -2,
    },
    {
      id: "o2",
      time: "07:00",
      title: "Morning Gym",
      category: "Fitness",
      status: "Completed",
      delay: 4,
    },
    {
      id: "o3",
      time: "08:15",
      title: "Vitamins",
      category: "Health",
      status: "Completed",
      delay: 0,
    },
    {
      id: "o4",
      time: "09:30",
      title: "Deep work block",
      category: "Work",
      status: "Pending",
      delay: null,
    },
    {
      id: "o5",
      time: "13:00",
      title: "Walk after lunch",
      category: "Fitness",
      status: "Pending",
      delay: null,
    },
    {
      id: "o6",
      time: "18:00",
      title: "Language practice",
      category: "Mind",
      status: "Pending",
      delay: null,
    },
    {
      id: "o7",
      time: "22:30",
      title: "Read 20 minutes",
      category: "Mind",
      status: "Pending",
      delay: null,
    },
  ]

  const routines = [
    {
      id: "r1",
      title: "Morning Gym",
      category: "Fitness",
      time: "07:00",
      recurrence: "Daily",
      streak: 28,
      best: 31,
      consistency: 0.92,
      active: true,
    },
    {
      id: "r2",
      title: "Vitamins",
      category: "Health",
      time: "08:15",
      recurrence: "Daily",
      streak: 54,
      best: 54,
      consistency: 0.98,
      active: true,
    },
    {
      id: "r3",
      title: "Deep work block",
      category: "Work",
      time: "09:30",
      recurrence: "Weekly",
      streak: 6,
      best: 12,
      consistency: 0.74,
      active: true,
    },
    {
      id: "r4",
      title: "Language practice",
      category: "Mind",
      time: "18:00",
      recurrence: "Daily",
      streak: 0,
      best: 19,
      consistency: 0.61,
      active: true,
    },
    {
      id: "r5",
      title: "Read 20 minutes",
      category: "Mind",
      time: "22:30",
      recurrence: "Daily",
      streak: 11,
      best: 22,
      consistency: 0.83,
      active: true,
    },
  ]

  // Weekly completion trend (last 7 days, % complete)
  const weekTrend = [
    { day: "Mon", rate: 0.86 },
    { day: "Tue", rate: 1.0 },
    { day: "Wed", rate: 0.71 },
    { day: "Thu", rate: 0.86 },
    { day: "Fri", rate: 0.57 },
    { day: "Sat", rate: 1.0 },
    { day: "Sun", rate: 0.71 },
  ]

  // Yearly heatmap — 53 weeks x 7 days of completion rate (deterministic-ish)
  const year = Array.from({ length: 53 }, (_, w) =>
    Array.from({ length: 7 }, (_, d) => {
      const seed = w * 7 + d
      const r = ((seed * 53) % 100) / 100
      // create some empty + some perfect runs
      const v = seed % 11 === 0 ? 0 : Math.min(1, 0.25 + r * 0.85)
      return { rate: w > 50 && d > 3 ? null : v } // future days empty
    })
  )

  // Calendar month — status per day for the current month
  const month = Array.from({ length: 30 }, (_, i) => {
    const day = i + 1
    const r = ((day * 37) % 100) / 100
    let status = "mixed"
    if (day > 20) status = day === 21 ? "today" : "future"
    else if (r > 0.8) status = "perfect"
    else if (r < 0.18) status = "missed"
    return { day, status, rate: r }
  })

  const metrics = {
    daily: {
      completion: 71,
      missed: 1,
      avgDelay: 6,
      best: "Vitamins",
      worst: "Deep work",
    },
    weekly: {
      completion: 82,
      missed: 4,
      avgDelay: 7,
      stability: 86,
      variation: 11,
    },
    monthly: {
      completion: 84,
      missed: 14,
      avgDelay: 8,
      topRoutine: "Vitamins",
    },
    yearly: { discipline: 86, completion: 81, drift: "+3", activeDays: 312 },
  }

  return { user, today, routines, weekTrend, year, month, metrics }
})()
