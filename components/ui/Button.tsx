import React from 'react'
import { Pressable, Text, PressableProps, ActivityIndicator } from 'react-native'
import { useTheme } from '../../contexts/ThemeContext'
import { radius, spacing, fontSize } from '../../theme/tokens'

type ButtonVariant = 'primary' | 'ghost' | 'outline'

type ButtonProps = PressableProps & {
  label: string
  variant?: ButtonVariant
  loading?: boolean
  fullWidth?: boolean
}

export function Button({
  label,
  variant = 'primary',
  loading = false,
  fullWidth = false,
  disabled,
  style,
  ...props
}: ButtonProps) {
  const { theme } = useTheme()

  const bgColor =
    variant === 'primary' ? theme.accent
    : variant === 'outline' ? 'transparent'
    : 'transparent'

  const borderColor = variant === 'outline' ? theme.accent : 'transparent'
  const textColor = variant === 'primary' ? '#FFFFFF' : theme.accent

  return (
    <Pressable
      disabled={disabled || loading}
      style={({ pressed }) => [
        {
          backgroundColor: bgColor,
          borderRadius: radius.md,
          borderWidth: 1,
          borderColor,
          paddingVertical: spacing.sm + 2,
          paddingHorizontal: spacing.lg,
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'row',
          opacity: pressed || disabled ? 0.7 : 1,
          alignSelf: fullWidth ? 'stretch' : 'flex-start',
        },
        style as any,
      ]}
      {...props}
    >
      {loading ? (
        <ActivityIndicator size="small" color={textColor} />
      ) : (
        <Text style={{ color: textColor, fontSize: fontSize.md, fontWeight: '700' }}>{label}</Text>
      )}
    </Pressable>
  )
}
