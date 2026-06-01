const mockGet = jest.fn()
const mockSet = jest.fn()

jest.mock('react-native-mmkv', () => ({
  MMKV: jest.fn(() => ({ getString: mockGet, set: mockSet })),
}))

import { loadSchedule, saveSchedule, updateDaySchedule, WeekSchedule } from '../stores/scheduleStore'

describe('scheduleStore', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGet.mockReturnValue(undefined)
  })

  it('loadSchedule returns default when key is absent', () => {
    const schedule = loadSchedule()
    expect(schedule[0]).toBe('Push Day')   // Monday default
    expect(schedule[6]).toBe('Rest')       // Sunday default
  })

  it('loadSchedule parses stored JSON', () => {
    const stored: WeekSchedule = { 0: 'Leg Day', 1: 'Rest', 2: 'Push Day', 3: 'Rest', 4: 'Pull Day', 5: 'Rest', 6: 'Rest' }
    mockGet.mockReturnValue(JSON.stringify(stored))
    expect(loadSchedule()).toEqual(stored)
  })

  it('saveSchedule writes JSON to schedule:week key', () => {
    const schedule: WeekSchedule = { 0: 'A', 1: 'B', 2: 'C', 3: 'D', 4: 'E', 5: 'F', 6: 'G' }
    saveSchedule(schedule)
    expect(mockSet).toHaveBeenCalledWith('schedule:week', JSON.stringify(schedule))
  })

  it('updateDaySchedule changes one day and saves', () => {
    const base: WeekSchedule = { 0: 'Push Day', 1: 'Pull Day', 2: 'Leg Day', 3: 'Rest', 4: 'Push Day', 5: 'Pull Day', 6: 'Rest' }
    mockGet.mockReturnValue(JSON.stringify(base))
    const updated = updateDaySchedule(2, 'Rest')
    expect(updated[2]).toBe('Rest')
    expect(updated[0]).toBe('Push Day')
    expect(mockSet).toHaveBeenCalled()
  })
})
