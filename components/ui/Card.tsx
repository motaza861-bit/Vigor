import React from 'react'
import { View, ViewProps } from 'react-native'
import { useTheme } from '../../contexts/ThemeContext'
import { radius, spacing } from '../../theme/tokens'

type CardProps = ViewProps & {
  padded?: boolean
  accent?: boolean
}

export function Card({ padded = true, accent = false, style, children, ...props }: CardProps) {
  const { theme } = useTheme()
  return (
    <View
      style={[
        {
          backgroundColor: theme.surface,
          borderRadius: radius.lg,
          borderWidth: accent ? 1 : 0,
          borderColor: accent ? theme.accent : 'transparent',
          padding: padded ? spacing.md : 0,
          overflow: 'hidden',
        },
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  )
}
