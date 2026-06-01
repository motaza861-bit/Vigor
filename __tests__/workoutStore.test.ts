const mockGet = jest.fn()
const mockSet = jest.fn()

jest.mock('react-native-mmkv', () => ({
  MMKV: jest.fn(() => ({ getString: mockGet, set: mockSet })),
}))

import { loadWorkoutLog, saveWorkoutLog, loadWorkoutLogs, WorkoutLog } from '../stores/workoutStore'

const SAMPLE_LOG: WorkoutLog = {
  id: 'log-1',
  date: '2026-06-01',
  splitName: 'Push Day',
  exercises: [
    {
      id: 'ex-1',
      name: 'Bench Press',
      sets: [{ id: 's-1', reps: 8, weight: 80, completed: true }],
    },
  ],
}

describe('workoutStore', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGet.mockReturnValue(undefined)
  })

  it('loadWorkoutLog returns null when key is absent', () => {
    expect(loadWorkoutLog('2026-06-01')).toBeNull()
    expect(mockGet).toHaveBeenCalledWith('workout:2026-06-01')
  })

  it('loadWorkoutLog parses stored JSON', () => {
    mockGet.mockReturnValue(JSON.stringify(SAMPLE_LOG))
    expect(loadWorkoutLog('2026-06-01')).toEqual(SAMPLE_LOG)
  })

  it('saveWorkoutLog writes JSON to correct key', () => {
    saveWorkoutLog(SAMPLE_LOG)
    expect(mockSet).toHaveBeenCalledWith('workout:2026-06-01', JSON.stringify(SAMPLE_LOG))
  })

  it('loadWorkoutLogs maps dates to nullable logs', () => {
    mockGet
      .mockReturnValueOnce(JSON.stringify(SAMPLE_LOG))
      .mockReturnValueOnce(undefined)
    const result = loadWorkoutLogs(['2026-06-01', '2026-06-02'])
    expect(result).toHaveLength(2)
    expect(result[0]).toEqual(SAMPLE_LOG)
    expect(result[1]).toBeNull()
  })
})
