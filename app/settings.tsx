import { View, Text, Pressable, ScrollView } from 'react-native'
import { router } from 'expo-router'
import { useTheme } from '../contexts/ThemeContext'
import { useUserTier, UserTier } from '../contexts/UserTierContext'
import { ThemeKey } from '../theme/themes'
import { spacing, fontSize, radius } from '../theme/tokens'

const THEME_OPTIONS: { key: ThemeKey; label: string }[] = [
  { key: 'DarkAthleticRed', label: 'Dark — Athletic Red' },
  { key: 'DarkVolt', label: 'Dark — Volt' },
  { key: 'LightMinimal', label: 'Light — Minimal' },
]

const TIER_OPTIONS: UserTier[] = ['Free', 'Base', 'Premium_AI']

export default function SettingsModal() {
  const { theme, themeKey, setTheme } = useTheme()
  const { tier, setTier } = useUserTier()

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.bg }}
      contentContainerStyle={{ padding: spacing.lg, paddingTop: spacing.xxl }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xl }}>
        <Text style={{ color: theme.text, fontSize: fontSize.xl, fontWeight: '700', flex: 1 }}>
          Settings
        </Text>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text style={{ color: theme.accent, fontSize: fontSize.md, fontWeight: '600' }}>Done</Text>
        </Pressable>
      </View>

      <SectionLabel label="APPEARANCE" theme={theme} />
      {THEME_OPTIONS.map(({ key, label }) => (
        <OptionRow
          key={key}
          label={label}
          selected={themeKey === key}
          onPress={() => setTheme(key)}
          theme={theme}
        />
      ))}

      {__DEV__ && (
        <>
          <SectionLabel label="DEV — SUBSCRIPTION TIER" theme={theme} />
          {TIER_OPTIONS.map((t) => (
            <OptionRow
              key={t}
              label={t}
              selected={tier === t}
              onPress={() => setTier(t)}
              theme={theme}
            />
          ))}
        </>
      )}
    </ScrollView>
  )
}

function SectionLabel({ label, theme }: { label: string; theme: any }) {
  return (
    <Text
      style={{
        color: theme.textMuted,
        fontSize: fontSize.xs,
        fontWeight: '600',
        letterSpacing: 1.2,
        marginTop: spacing.lg,
        marginBottom: spacing.sm,
      }}
    >
      {label}
    </Text>
  )
}

function OptionRow({
  label,
  selected,
  onPress,
  theme,
}: {
  label: string
  selected: boolean
  onPress: () => void
  theme: any
}) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.surface,
        borderRadius: radius.md,
        padding: spacing.md,
        marginBottom: spacing.sm,
        borderWidth: selected ? 1 : 0,
        borderColor: selected ? theme.accent : 'transparent',
      }}
    >
      <Text style={{ color: theme.text, fontSize: fontSize.md, flex: 1 }}>{label}</Text>
      {selected && (
        <Text style={{ color: theme.accent, fontSize: fontSize.md, fontWeight: '700' }}>✓</Text>
      )}
    </Pressable>
  )
}
