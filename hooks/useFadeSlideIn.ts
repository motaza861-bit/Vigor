import { useEffect } from 'react'
import {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withSpring,
} from 'react-native-reanimated'

const STAGGER_MS = 80
const SPRING_CONFIG = { damping: 18, stiffness: 120 }

export function useFadeSlideIn(index: number) {
  const opacity = useSharedValue(0)
  const translateY = useSharedValue(20)

  useEffect(() => {
    const delay = index * STAGGER_MS
    opacity.value = withDelay(delay, withSpring(1, SPRING_CONFIG))
    translateY.value = withDelay(delay, withSpring(0, SPRING_CONFIG))
  }, [index])

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }))

  return { animatedStyle }
}
