import { renderHook, act } from '@testing-library/react-native'
import { useDayNavigator } from '../hooks/useDayNavigator'
import { todayISO } from '../lib/dateUtils'

// Gesture handler is not available in test env — mock it
jest.mock('react-native-gesture-handler', () => ({
  Gesture: {
    Pan: () => ({
      activeOffsetX: () => ({
        failOffsetY: () => ({
          onEnd: () => ({ runOnJS: () => ({}) }),
        }),
      }),
    }),
  },
  GestureDetector: ({ children }: { children: React.ReactNode }) => children,
}))

const noData = () => false

describe('useDayNavigator', () => {
  it('initial selectedDate equals todayISO()', () => {
    const { result } = renderHook(() => useDayNavigator(noData))
    expect(result.current.selectedDate).toBe(todayISO())
  })

  it('initial dayOffset is 0', () => {
    const { result } = renderHook(() => useDayNavigator(noData))
    expect(result.current.dayOffset).toBe(0)
  })

  it('goBack decrements dayOffset', () => {
    const { result } = renderHook(() => useDayNavigator(noData))
    act(() => { result.current._goBack() })
    expect(result.current.dayOffset).toBe(-1)
  })

  it('goForward increments dayOffset, clamped at 0', () => {
    const { result } = renderHook(() => useDayNavigator(noData))
    act(() => { result.current._goBack() })
    act(() => { result.current._goForward() })
    expect(result.current.dayOffset).toBe(0)
    // already at 0, cannot go forward
    act(() => { result.current._goForward() })
    expect(result.current.dayOffset).toBe(0)
  })

  it('dayOffset clamped at -89', () => {
    const { result } = renderHook(() => useDayNavigator(noData))
    for (let i = 0; i < 100; i++) {
      act(() => { result.current._goBack() })
    }
    expect(result.current.dayOffset).toBe(-89)
  })

  it('formattedLabel returns "Today" at offset 0', () => {
    const { result } = renderHook(() => useDayNavigator(noData))
    expect(result.current.formattedLabel).toBe('Today')
  })

  it('formattedLabel returns "Yesterday" at offset -1', () => {
    const { result } = renderHook(() => useDayNavigator(noData))
    act(() => { result.current._goBack() })
    expect(result.current.formattedLabel).toBe('Yesterday')
  })

  it('dotDates has length 7 and last entry is todayISO()', () => {
    const { result } = renderHook(() => useDayNavigator(noData))
    expect(result.current.dotDates).toHaveLength(7)
    expect(result.current.dotDates[6]).toBe(todayISO())
  })

  it('selectedDate moves with dayOffset', () => {
    const { result } = renderHook(() => useDayNavigator(noData))
    act(() => { result.current._goBack() })
    // selectedDate should be yesterday
    const d = new Date()
    d.setDate(d.getDate() - 1)
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    expect(result.current.selectedDate).toBe(`${year}-${month}-${day}`)
  })
})
