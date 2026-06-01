import { MMKV } from 'react-native-mmkv'

let storage: MMKV | undefined

function getStorage() {
  if (!storage) {
    storage = new MMKV({ id: 'workout' })
  }
  return storage
}

export type SetEntry = {
  id: string
  reps: number
  weight: number
  completed: boolean
}

export type ExerciseEntry = {
  id: string
  name: string
  sets: SetEntry[]
}

export type WorkoutLog = {
  id: string
  date: string
  splitName: string
  exercises: ExerciseEntry[]
}

const key = (date: string) => `workout:${date}`

export function loadWorkoutLog(date: string): WorkoutLog | null {
  const raw = getStorage().getString(key(date))
  return raw ? (JSON.parse(raw) as WorkoutLog) : null
}

export function saveWorkoutLog(log: WorkoutLog): void {
  getStorage().set(key(log.date), JSON.stringify(log))
}

export function loadWorkoutLogs(dates: string[]): Array<WorkoutLog | null> {
  return dates.map(loadWorkoutLog)
}
