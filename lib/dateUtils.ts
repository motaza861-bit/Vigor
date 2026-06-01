export function todayISO(): string {
  return new Date().toISOString().slice(0, 10)
}

export function last7Days(): string[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    return d.toISOString().slice(0, 10)
  })
}

export function last90Days(): string[] {
  return Array.from({ length: 90 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (89 - i))
    return d.toISOString().slice(0, 10)
  })
}

// Returns 0 for Monday through 6 for Sunday
export function todayDayIndex(): 0 | 1 | 2 | 3 | 4 | 5 | 6 {
  const jsDay = new Date().getDay() // 0=Sun, 1=Mon...6=Sat
  return ((jsDay + 6) % 7) as 0 | 1 | 2 | 3 | 4 | 5 | 6
}
