import { todayISO, last7Days, last90Days, todayDayIndex } from '../lib/dateUtils'

describe('dateUtils', () => {
  it('todayISO returns YYYY-MM-DD string', () => {
    expect(todayISO()).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it('last7Days returns 7 dates ending today', () => {
    const days = last7Days()
    expect(days).toHaveLength(7)
    expect(days[6]).toBe(todayISO())
  })

  it('last7Days dates are consecutive and ascending', () => {
    const days = last7Days()
    for (let i = 1; i < days.length; i++) {
      expect(new Date(days[i]).getTime()).toBeGreaterThan(new Date(days[i - 1]).getTime())
    }
  })

  it('last90Days returns 90 dates ending today', () => {
    const days = last90Days()
    expect(days).toHaveLength(90)
    expect(days[89]).toBe(todayISO())
  })

  it('todayDayIndex is 0-6', () => {
    const idx = todayDayIndex()
    expect(idx).toBeGreaterThanOrEqual(0)
    expect(idx).toBeLessThanOrEqual(6)
  })

  it('todayISO returns local calendar date, not UTC', () => {
    const now = new Date()
    const expected = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
    expect(todayISO()).toBe(expected)
  })
})
