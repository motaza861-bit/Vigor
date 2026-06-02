import React, { useState } from 'react'
import { View, Text, Pressable, ScrollView, TextInput } from 'react-native'
import { router } from 'expo-router'
import { useTheme } from '../contexts/ThemeContext'
import { useUserTier, UserTier } from '../contexts/UserTierContext'
import { ThemeKey, ThemeTokens } from '../theme/themes'
import { spacing, fontSize, radius } from '../theme/tokens'
import { loadProfile, saveProfile, calculateTargets, UserProfile, Sex, Goal } from '../stores/profileStore'

const THEME_OPTIONS: { key: ThemeKey; label: string }[] = [
  { key: 'DarkAthleticRed', label: 'Dark — Athletic Red' },
  { key: 'DarkVolt', label: 'Dark — Volt' },
  { key: 'LightMinimal', label: 'Light — Minimal' },
]

const TIER_OPTIONS: UserTier[] = ['Free', 'Base', 'Premium_AI']

export default function SettingsModal() {
  const { theme, themeKey, setTheme } = useTheme()
  const { tier, setTier } = useUserTier()
  const [profile, setProfile] = useState<UserProfile>(() => loadProfile())

  const updateProfile = (patch: Partial<UserProfile>) => {
    const updated = { ...profile, ...patch }
    setProfile(updated)
    saveProfile(updated)
  }

  const targets = calculateTargets(profile)

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.bg }}
      contentContainerStyle={{ padding: spacing.lg, paddingTop: spacing.xxl, paddingBottom: spacing.xxl }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xl }}>
        <Text style={{ color: theme.text, fontSize: fontSize.xl, fontWeight: '700', flex: 1 }}>
          Settings
        </Text>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text style={{ color: theme.accent, fontSize: fontSize.md, fontWeight: '600' }}>Done</Text>
        </Pressable>
      </View>

      <SectionLabel label="PROFILE" theme={theme} />

      <ProfileInput
        label="Name"
        value={profile.name ?? ''}
        onChangeText={(v) => updateProfile({ name: v })}
        theme={theme}
        placeholder="Your name"
      />

      <View style={{ flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm }}>
        <View style={{ flex: 1 }}>
          <ProfileInput
            label="Age"
            value={profile.age?.toString() ?? ''}
            onChangeText={(v) => updateProfile({ age: v ? parseInt(v, 10) : undefined })}
            theme={theme}
            placeholder="25"
            numeric
          />
        </View>
        <View style={{ flex: 1 }}>
          <ProfileInput
            label="Weight (kg)"
            value={profile.weight?.toString() ?? ''}
            onChangeText={(v) => updateProfile({ weight: v ? parseFloat(v) : undefined })}
            theme={theme}
            placeholder="75"
            numeric
          />
        </View>
        <View style={{ flex: 1 }}>
          <ProfileInput
            label="Height (cm)"
            value={profile.height?.toString() ?? ''}
            onChangeText={(v) => updateProfile({ height: v ? parseFloat(v) : undefined })}
            theme={theme}
            placeholder="175"
            numeric
          />
        </View>
      </View>

      <Text style={{ color: theme.textMuted, fontSize: fontSize.xs, fontWeight: '600', letterSpacing: 0.8, marginBottom: spacing.xs }}>
        SEX
      </Text>
      <ToggleGroup<Sex>
        options={[{ value: 'male', label: 'Male' }, { value: 'female', label: 'Female' }]}
        selected={profile.sex}
        onSelect={(v) => updateProfile({ sex: v })}
        theme={theme}
      />

      <Text style={{ color: theme.textMuted, fontSize: fontSize.xs, fontWeight: '600', letterSpacing: 0.8, marginBottom: spacing.xs, marginTop: spacing.md }}>
        GOAL
      </Text>
      <ToggleGroup<Goal>
        options={[
          { value: 'cut', label: 'Cut' },
          { value: 'maintain', label: 'Maintain' },
          { value: 'bulk', label: 'Bulk' },
        ]}
        selected={profile.goal}
        onSelect={(v) => updateProfile({ goal: v })}
        theme={theme}
      />

      {targets && (
        <Text style={{ color: theme.textMuted, fontSize: fontSize.sm, marginTop: spacing.md }}>
          ~{targets.calories} kcal · {targets.protein}P · {targets.carbs}C · {targets.fat}F
        </Text>
      )}

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

function SectionLabel({ label, theme }: { label: string; theme: ThemeTokens }) {
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
  theme: ThemeTokens
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

function ProfileInput({
  label,
  value,
  onChangeText,
  theme,
  placeholder,
  numeric = false,
}: {
  label: string
  value: string
  onChangeText: (v: string) => void
  theme: ThemeTokens
  placeholder?: string
  numeric?: boolean
}) {
  return (
    <View style={{ marginBottom: spacing.sm }}>
      <Text style={{ color: theme.textMuted, fontSize: fontSize.xs, fontWeight: '600', marginBottom: 4 }}>{label}</Text>
      <TextInput
        style={{
          backgroundColor: theme.surface,
          color: theme.text,
          fontSize: fontSize.md,
          borderRadius: radius.md,
          paddingHorizontal: spacing.md,
          paddingVertical: 10,
          borderWidth: 1,
          borderColor: theme.border,
        }}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.textMuted}
        keyboardType={numeric ? 'decimal-pad' : 'default'}
      />
    </View>
  )
}

function ToggleGroup<T extends string>({
  options,
  selected,
  onSelect,
  theme,
}: {
  options: { value: T; label: string }[]
  selected: T | undefined
  onSelect: (v: T) => void
  theme: ThemeTokens
}) {
  return (
    <View style={{ flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm }}>
      {options.map((opt) => (
        <Pressable
          key={opt.value}
          onPress={() => onSelect(opt.value)}
          style={{
            flex: 1,
            padding: spacing.sm,
            borderRadius: radius.md,
            borderWidth: 1,
            borderColor: selected === opt.value ? theme.accent : theme.border,
            backgroundColor: selected === opt.value ? theme.accentDim : theme.surface,
            alignItems: 'center',
          }}
        >
          <Text
            style={{
              color: selected === opt.value ? theme.accent : theme.textMuted,
              fontSize: fontSize.sm,
              fontWeight: '600',
            }}
          >
            {opt.label}
          </Text>
        </Pressable>
      ))}
    </View>
  )
}
