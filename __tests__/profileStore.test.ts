const mockGet = jest.fn()
const mockSet = jest.fn()

jest.mock('react-native-mmkv', () => ({
  MMKV: jest.fn(() => ({ getString: mockGet, set: mockSet })),
}))

import { loadProfile, saveProfile, calculateTargets, UserProfile } from '../stores/profileStore'

describe('profileStore', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGet.mockReturnValue(undefined)
  })

  it('loadProfile returns empty object when no data', () => {
    expect(loadProfile()).toEqual({})
  })

  it('saveProfile / loadProfile round-trip', () => {
    const profile: UserProfile = { name: 'Alex', age: 25, weight: 80, height: 180, sex: 'male', goal: 'maintain' }
    mockGet.mockReturnValue(JSON.stringify(profile))
    expect(loadProfile()).toEqual(profile)
    saveProfile(profile)
    expect(mockSet).toHaveBeenCalledWith('profile:user', JSON.stringify(profile))
  })

  it('calculateTargets returns null when fields are missing', () => {
    expect(calculateTargets({ age: 25, weight: 80 })).toBeNull()
    expect(calculateTargets({ age: 25, weight: 80, height: 180, sex: 'male' })).toBeNull() // goal missing
  })

  it('calculateTargets returns correct macros for known input', () => {
    // male, 80kg, 180cm, 25yo, maintain
    // BMR = 10*80 + 6.25*180 - 5*25 + 5 = 800 + 1125 - 125 + 5 = 1805
    // TDEE = 1805 * 1.55 = 2797.75 → Math.round = 2798
    // goal = maintain → calories = 2798
    // protein = Math.round(80 * 2.2) = 176
    // fat = Math.round((2798 * 0.25) / 9) = Math.round(699.5 / 9) = Math.round(77.7) = 78
    // carbs = Math.round((2798 - 176*4 - 78*9) / 4) = Math.round((2798 - 704 - 702) / 4) = Math.round(1392/4) = 348
    const result = calculateTargets({ age: 25, weight: 80, height: 180, sex: 'male', goal: 'maintain' })
    expect(result).not.toBeNull()
    expect(result!.calories).toBe(2798)
    expect(result!.protein).toBe(176)
    expect(result!.fat).toBe(78)
    expect(result!.carbs).toBe(348)
  })

  it('calculateTargets applies cut adjustment (-500 kcal)', () => {
    const maintain = calculateTargets({ age: 25, weight: 80, height: 180, sex: 'male', goal: 'maintain' })!
    const cut = calculateTargets({ age: 25, weight: 80, height: 180, sex: 'male', goal: 'cut' })!
    expect(cut.calories).toBe(maintain.calories - 500)
  })

  it('calculateTargets applies bulk adjustment (+300 kcal)', () => {
    const maintain = calculateTargets({ age: 25, weight: 80, height: 180, sex: 'male', goal: 'maintain' })!
    const bulk = calculateTargets({ age: 25, weight: 80, height: 180, sex: 'male', goal: 'bulk' })!
    expect(bulk.calories).toBe(maintain.calories + 300)
  })

  it('calculateTargets uses female BMR formula', () => {
    // female, 60kg, 165cm, 30yo, maintain
    // BMR = 10*60 + 6.25*165 - 5*30 - 161 = 600 + 1031.25 - 150 - 161 = 1320.25
    // TDEE = Math.round(1320.25 * 1.55) = Math.round(2046.39) = 2046
    const result = calculateTargets({ age: 30, weight: 60, height: 165, sex: 'female', goal: 'maintain' })
    expect(result).not.toBeNull()
    expect(result!.calories).toBe(2046)
  })
})
