import { MMKV } from 'react-native-mmkv'

let _storage: MMKV | undefined
function getStorage(): MMKV {
  if (!_storage) _storage = new MMKV({ id: 'schedule' })
  return _storage
}

export type DayIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6  // 0 = Monday, 6 = Sunday
export type WeekSchedule = Record<DayIndex, string>

const SCHEDULE_KEY = 'schedule:week'

const DEFAULT_SCHEDULE: WeekSchedule = {
  0: 'Push Day',
  1: 'Pull Day',
  2: 'Leg Day',
  3: 'Rest',
  4: 'Push Day',
  5: 'Pull Day',
  6: 'Rest',
}

export function loadSchedule(): WeekSchedule {
  const raw = getStorage().getString(SCHEDULE_KEY)
  return raw ? (JSON.parse(raw) as WeekSchedule) : { ...DEFAULT_SCHEDULE }
}

export function saveSchedule(schedule: WeekSchedule): void {
  getStorage().set(SCHEDULE_KEY, JSON.stringify(schedule))
}

export function updateDaySchedule(dayIndex: DayIndex, splitName: string): WeekSchedule {
  const current = loadSchedule()
  const updated: WeekSchedule = { ...current, [dayIndex]: splitName }
  saveSchedule(updated)
  return updated
}
