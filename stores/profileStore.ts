import { MMKV } from 'react-native-mmkv'

let _storage: MMKV | undefined
function getStorage(): MMKV {
  if (!_storage) _storage = new MMKV({ id: 'profile' })
  return _storage
}

export type Sex = 'male' | 'female'
export type Goal = 'cut' | 'maintain' | 'bulk'

export type UserProfile = {
  name?: string
  age?: number
  weight?: number   // kg
  height?: number   // cm
  sex?: Sex
  goal?: Goal
}

export type MacroResult = { calories: number; protein: number; carbs: number; fat: number }

const PROFILE_KEY = 'profile:user'

export function loadProfile(): UserProfile {
  const raw = getStorage().getString(PROFILE_KEY)
  return raw ? (JSON.parse(raw) as UserProfile) : {}
}

export function saveProfile(profile: UserProfile): void {
  getStorage().set(PROFILE_KEY, JSON.stringify(profile))
}

export function calculateTargets(profile: UserProfile): MacroResult | null {
  const { age, weight, height, sex, goal } = profile
  if (age == null || weight == null || height == null || !sex || !goal) return null

  const bmr = sex === 'male'
    ? 10 * weight + 6.25 * height - 5 * age + 5
    : 10 * weight + 6.25 * height - 5 * age - 161

  const tdee = bmr * 1.55
  const goalAdjustment = goal === 'cut' ? -500 : goal === 'bulk' ? 300 : 0
  const calories = Math.round(tdee + goalAdjustment)

  const protein = Math.round(weight * 2.2)
  const fat = Math.round((calories * 0.25) / 9)
  const carbs = Math.round((calories - protein * 4 - fat * 9) / 4)

  return { calories, protein, fat, carbs }
}
