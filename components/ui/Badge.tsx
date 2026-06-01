import React from 'react'
import { View, Text } from 'react-native'
import { useTheme } from '../../contexts/ThemeContext'
import { radius, spacing, fontSize } from '../../theme/tokens'

type BadgeVariant = 'accent' | 'muted' | 'coming-soon'

type BadgeProps = {
  label: string
  variant?: BadgeVariant
}

export function Badge({ label, variant = 'accent' }: BadgeProps) {
  const { theme } = useTheme()

  const bgColor =
    variant === 'accent' ? theme.accentDim
    : variant === 'coming-soon' ? '#2A1A00'
    : theme.surface

  const textColor =
    variant === 'accent' ? theme.accent
    : variant === 'coming-soon' ? '#FF9500'
    : theme.textMuted

  return (
    <View
      style={{
        backgroundColor: bgColor,
        borderRadius: radius.full,
        paddingHorizontal: spacing.sm,
        paddingVertical: 3,
        alignSelf: 'flex-start',
      }}
    >
      <Text style={{ color: textColor, fontSize: fontSize.xs, fontWeight: '700', letterSpacing: 0.5 }}>
        {label}
      </Text>
    </View>
  )
}
