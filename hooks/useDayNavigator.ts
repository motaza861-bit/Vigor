import { useState, useMemo } from 'react'
import { Gesture } from 'react-native-gesture-handler'
import { last7Days } from '../lib/dateUtils'

function localDateISO(d: Date): string {
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function offsetToDate(offset: number): Date {
  const d = new Date()
  d.setDate(d.getDate() + offset)
  return d
}

function formatLabel(offset: number): string {
  if (offset === 0) return 'Today'
  if (offset === -1) return 'Yesterday'
  const d = offsetToDate(offset)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export type DayNavigatorResult = {
  selectedDate: string
  dayOffset: number
  formattedLabel: string
  gesture: ReturnType<typeof Gesture.Pan>
  dotDates: string[]
  _goBack: () => void
  _goForward: () => void
}

export function useDayNavigator(_getHasData: (date: string) => boolean): DayNavigatorResult {
  const [dayOffset, setDayOffset] = useState(0)

  const goBack = () => setDayOffset((o) => Math.max(o - 1, -89))
  const goForward = () => setDayOffset((o) => Math.min(o + 1, 0))

  const gesture = useMemo(
    () =>
      Gesture.Pan()
        .onEnd((e) => {
          if (e.translationX < -50) goBack()
          else if (e.translationX > 50) goForward()
        })
        .runOnJS(true),
    [] // safe: goBack/goForward use functional updaters, never close over dayOffset
  )

  const selectedDate = localDateISO(offsetToDate(dayOffset))
  const formattedLabel = formatLabel(dayOffset)
  const dotDates = last7Days()

  return {
    selectedDate,
    dayOffset,
    formattedLabel,
    gesture,
    dotDates,
    _goBack: goBack,
    _goForward: goForward,
  }
}
