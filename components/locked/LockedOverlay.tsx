import React from 'react'
import { View, Text } from 'react-native'
import { useTheme } from '../../contexts/ThemeContext'
import { UserTier } from '../../contexts/UserTierContext'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { spacing, fontSize, radius } from '../../theme/tokens'

type LockedOverlayProps = {
  variant: 'upgrade' | 'coming-soon'
  requiredTier: UserTier
}

export function LockedOverlay({ variant, requiredTier }: LockedOverlayProps) {
  const { theme } = useTheme()

  if (variant === 'coming-soon') {
    return (
      <View
        style={{
          backgroundColor: theme.surface,
          borderRadius: radius.lg,
          padding: spacing.lg,
          alignItems: 'center',
          gap: spacing.sm,
        }}
      >
        <Badge label="COMING SOON" variant="coming-soon" />
        <Text style={{ color: theme.textMuted, fontSize: fontSize.sm, textAlign: 'center', marginTop: spacing.xs }}>
          AI-powered features are on their way
        </Text>
      </View>
    )
  }

  return (
    <View
      style={{
        backgroundColor: theme.surface,
        borderRadius: radius.lg,
        padding: spacing.lg,
        alignItems: 'center',
        gap: spacing.sm,
      }}
    >
      <Badge label={requiredTier.toUpperCase()} variant="accent" />
      <Text style={{ color: theme.text, fontSize: fontSize.md, fontWeight: '700', marginTop: spacing.xs }}>
        This feature is locked
      </Text>
      <Text style={{ color: theme.textMuted, fontSize: fontSize.sm, textAlign: 'center' }}>
        This feature is available on the {requiredTier} plan
      </Text>
      <Button label="Upgrade" variant="primary" style={{ marginTop: spacing.sm }} onPress={() => {}} />
    </View>
  )
}
