import React, { useEffect } from 'react'
import { View, Text } from 'react-native'
import Svg, { Circle } from 'react-native-svg'
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  Easing,
} from 'react-native-reanimated'
import { useTheme } from '../../contexts/ThemeContext'
import { fontSize } from '../../theme/tokens'

const AnimatedCircle = Animated.createAnimatedComponent(Circle)

type ProgressRingProps = {
  size?: number
  strokeWidth?: number
  progress: number
  centerLabel: string
  subLabel?: string
}

export function ProgressRing({
  size = 180,
  strokeWidth = 14,
  progress,
  centerLabel,
  subLabel,
}: ProgressRingProps) {
  const { theme } = useTheme()
  const r = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * r
  const animatedProgress = useSharedValue(0)

  useEffect(() => {
    animatedProgress.value = withTiming(Math.min(Math.max(progress, 0), 1), {
      duration: 900,
      easing: Easing.out(Easing.cubic),
    })
  }, [progress])

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - animatedProgress.value),
  }))

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={theme.border}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={theme.accent}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          animatedProps={animatedProps}
          strokeLinecap="round"
          rotation="-90"
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      <Text style={{ color: theme.text, fontSize: fontSize.xxl, fontWeight: '900', lineHeight: fontSize.xxl + 4 }}>
        {centerLabel}
      </Text>
      {subLabel && (
        <Text style={{ color: theme.textMuted, fontSize: fontSize.sm, marginTop: 2 }}>
          {subLabel}
        </Text>
      )}
    </View>
  )
}
