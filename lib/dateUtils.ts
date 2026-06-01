function localDateISO(d: Date): string {
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function todayISO(): string {
  return localDateISO(new Date())
}

export function last7Days(): string[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    return localDateISO(d)
  })
}

export function last90Days(): string[] {
  return Array.from({ length: 90 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (89 - i))
    return localDateISO(d)
  })
}

// Returns 0 for Monday through 6 for Sunday
export function todayDayIndex(): number {
  const jsDay = new Date().getDay() // 0=Sun, 1=Mon...6=Sat
  return (jsDay + 6) % 7
}
