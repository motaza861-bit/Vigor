const mockGet = jest.fn()
const mockSet = jest.fn()

jest.mock('react-native-mmkv', () => ({
  MMKV: jest.fn(() => ({ getString: mockGet, set: mockSet })),
}))

import { loadDayLog, saveDayLog, computeTotals, DayLog, FoodEntry } from '../stores/nutritionStore'

const SAMPLE_ENTRY: FoodEntry = {
  id: 'food-1',
  name: 'Oatmeal',
  calories: 300,
  protein: 10,
  carbs: 45,
  fat: 6,
}

const SAMPLE_LOG: DayLog = {
  date: '2026-06-01',
  entries: [SAMPLE_ENTRY],
  targets: { calories: 2400, protein: 180, carbs: 240, fat: 60 },
}

describe('nutritionStore', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGet.mockReturnValue(undefined)
  })

  it('loadDayLog returns default log when key is absent', () => {
    const log = loadDayLog('2026-06-01')
    expect(log.date).toBe('2026-06-01')
    expect(log.entries).toHaveLength(0)
    expect(log.targets.calories).toBe(2400)
  })

  it('loadDayLog parses stored JSON', () => {
    mockGet.mockReturnValue(JSON.stringify(SAMPLE_LOG))
    expect(loadDayLog('2026-06-01')).toEqual(SAMPLE_LOG)
  })

  it('saveDayLog writes JSON to correct key', () => {
    saveDayLog(SAMPLE_LOG)
    expect(mockSet).toHaveBeenCalledWith('nutrition:2026-06-01', JSON.stringify(SAMPLE_LOG))
  })

  it('computeTotals sums entry macros', () => {
    const second: FoodEntry = { id: 'food-2', name: 'Chicken', calories: 400, protein: 80, carbs: 0, fat: 8 }
    const totals = computeTotals([SAMPLE_ENTRY, second])
    expect(totals).toEqual({ calories: 700, protein: 90, carbs: 45, fat: 14 })
  })

  it('computeTotals returns zeros for empty list', () => {
    expect(computeTotals([])).toEqual({ calories: 0, protein: 0, carbs: 0, fat: 0 })
  })
})
