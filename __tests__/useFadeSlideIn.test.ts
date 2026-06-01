import { renderHook } from '@testing-library/react-native'
import { useFadeSlideIn } from '../hooks/useFadeSlideIn'

jest.mock('react-native-reanimated', () =>
  require('react-native-reanimated/mock')
)

describe('useFadeSlideIn', () => {
  it('returns animatedStyle', () => {
    const { result } = renderHook(() => useFadeSlideIn(0))
    expect(result.current.animatedStyle).toBeDefined()
  })

  it('accepts different index values without throwing', () => {
    expect(() => renderHook(() => useFadeSlideIn(3))).not.toThrow()
    expect(() => renderHook(() => useFadeSlideIn(10))).not.toThrow()
  })
})
