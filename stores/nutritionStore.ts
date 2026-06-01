import { MMKV } from 'react-native-mmkv'

let _storage: MMKV | undefined
function getStorage(): MMKV {
  if (!_storage) _storage = new MMKV({ id: 'nutrition' })
  return _storage
}

export type FoodEntry = {
  id: string
  name: string
  calories: number
  protein: number
  carbs: number
  fat: number
}

export type MacroTotals = {
  calories: number
  protein: number
  carbs: number
  fat: number
}

export type DayLog = {
  date: string
  entries: FoodEntry[]
  targets: MacroTotals
  bodyweight?: number
}

const DEFAULT_TARGETS: MacroTotals = { calories: 2400, protein: 180, carbs: 240, fat: 60 }
const key = (date: string) => `nutrition:${date}`

export function loadDayLog(date: string): DayLog {
  const raw = getStorage().getString(key(date))
  if (!raw) return { date, entries: [], targets: { ...DEFAULT_TARGETS } }
  return JSON.parse(raw) as DayLog
}

export function saveDayLog(log: DayLog): void {
  getStorage().set(key(log.date), JSON.stringify(log))
}

export function computeTotals(entries: FoodEntry[]): MacroTotals {
  return entries.reduce(
    (acc, e) => ({
      calories: acc.calories + e.calories,
      protein: acc.protein + e.protein,
      carbs: acc.carbs + e.carbs,
      fat: acc.fat + e.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  )
}
