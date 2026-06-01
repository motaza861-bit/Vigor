import React from 'react'
import { View, Text, ScrollView, Pressable } from 'react-native'
import Animated from 'react-native-reanimated'
import { router } from 'expo-router'
import { useTheme } from '../../contexts/ThemeContext'
import { ProgressRing } from '../../components/ui/ProgressRing'
import { Card } from '../../components/ui/Card'
import { TierGate } from '../../components/ui/TierGate'
import { useFadeSlideIn } from '../../hooks/useFadeSlideIn'
import { spacing, fontSize, radius } from '../../theme/tokens'
import { ThemeTokens } from '../../theme/themes'
import { loadDayLog, computeTotals } from '../../stores/nutritionStore'
import { loadWorkoutLogs, WorkoutLog } from '../../stores/workoutStore'
import { loadSchedule } from '../../stores/scheduleStore'
import { todayISO, last7Days, todayDayIndex } from '../../lib/dateUtils'

export default function HomeScreen() {
  const { theme } = useTheme()
  const today = todayISO()

  const dayLog = loadDayLog(today)
  const totals = computeTotals(dayLog.entries)
  const remaining = dayLog.targets.calories - totals.calories
  const progress = Math.min(totals.calories / dayLog.targets.calories, 1)

  const schedule = loadSchedule()
  const todaySplit = schedule[todayDayIndex()]

  const weekLogs = loadWorkoutLogs(last7Days())

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.bg }}
      contentContainerStyle={{ padding: spacing.lg, paddingTop: spacing.xxl }}
      showsVerticalScrollIndicator={false}
    >
      <Header theme={theme} todaySplit={todaySplit} />
      <RingSection theme={theme} progress={progress} remaining={remaining} totals={totals} />
      <QuickActions theme={theme} />
      <ConsistencyBlock weekLogs={weekLogs} />
    </ScrollView>
  )
}

function Header({ theme, todaySplit }: { theme: ThemeTokens; todaySplit: string }) {
  const { animatedStyle } = useFadeSlideIn(0)
  return (
    <Animated.View style={[{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: spacing.xl }, animatedStyle]}>
      <View style={{ flex: 1 }}>
        <Text style={{ color: theme.textMuted, fontSize: fontSize.sm, fontWeight: '600', letterSpacing: 0.8, marginBottom: 4 }}>
          TODAY
        </Text>
        <Text style={{ color: theme.text, fontSize: fontSize.display, fontWeight: '900', lineHeight: fontSize.display + 4 }}>
          {todaySplit}
        </Text>
      </View>
      <Pressable
        onPress={() => router.push('/settings')}
        style={{ padding: spacing.sm }}
        hitSlop={12}
      >
        <Text style={{ color: theme.textMuted, fontSize: 20 }}>⚙</Text>
      </Pressable>
    </Animated.View>
  )
}

function RingSection({
  theme,
  progress,
  remaining,
  totals,
}: {
  theme: ThemeTokens
  progress: number
  remaining: number
  totals: { protein: number; carbs: number; fat: number }
}) {
  const { animatedStyle } = useFadeSlideIn(1)
  return (
    <Animated.View style={[{ alignItems: 'center', marginBottom: spacing.xl }, animatedStyle]}>
      <ProgressRing
        size={200}
        strokeWidth={16}
        progress={progress}
        centerLabel={`${Math.max(remaining, 0)}`}
        subLabel="kcal remaining"
      />
      <View style={{ flexDirection: 'row', gap: spacing.lg, marginTop: spacing.lg }}>
        <MacroChip label="Protein" value={`${totals.protein}g`} theme={theme} />
        <MacroChip label="Carbs" value={`${totals.carbs}g`} theme={theme} />
        <MacroChip label="Fat" value={`${totals.fat}g`} theme={theme} />
      </View>
    </Animated.View>
  )
}

function MacroChip({ label, value, theme }: { label: string; value: string; theme: ThemeTokens }) {
  return (
    <View style={{ alignItems: 'center' }}>
      <Text style={{ color: theme.text, fontSize: fontSize.md, fontWeight: '700' }}>{value}</Text>
      <Text style={{ color: theme.textMuted, fontSize: fontSize.xs, marginTop: 2 }}>{label}</Text>
    </View>
  )
}

function QuickActions({ theme }: { theme: ThemeTokens }) {
  const { animatedStyle } = useFadeSlideIn(2)
  const actions = [
    { label: 'Log Meal', icon: '＋', onPress: () => router.push('/(tabs)/nutrition') },
    { label: 'Log Set', icon: '◈', onPress: () => router.push('/(tabs)/workout') },
    { label: 'Log Weight', icon: '▲', onPress: () => router.push('/(tabs)/nutrition') },
  ]
  return (
    <Animated.View style={[{ flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.xl }, animatedStyle]}>
      {actions.map((a) => (
        <Pressable
          key={a.label}
          onPress={a.onPress}
          style={({ pressed }) => ({
            flex: 1,
            backgroundColor: theme.surface,
            borderRadius: radius.md,
            padding: spacing.md,
            alignItems: 'center',
            borderWidth: 1,
            borderColor: theme.border,
            opacity: pressed ? 0.7 : 1,
          })}
        >
          <Text style={{ color: theme.accent, fontSize: 20, marginBottom: 4 }}>{a.icon}</Text>
          <Text style={{ color: theme.text, fontSize: fontSize.xs, fontWeight: '600' }}>{a.label}</Text>
        </Pressable>
      ))}
    </Animated.View>
  )
}

function ConsistencyBlock({ weekLogs }: { weekLogs: Array<WorkoutLog | null> }) {
  const { animatedStyle } = useFadeSlideIn(3)
  return (
    <Animated.View style={animatedStyle}>
      <TierGate requiredTier="Base">
        <ConsistencyGrid weekLogs={weekLogs} />
      </TierGate>
    </Animated.View>
  )
}

function ConsistencyGrid({ weekLogs }: { weekLogs: Array<WorkoutLog | null> }) {
  const { theme } = useTheme()
  const days = ['M', 'Tu', 'W', 'Th', 'F', 'Sa', 'Su']
  const completed = weekLogs.map((log) => log !== null)

  return (
    <Card>
      <Text style={{ color: theme.textMuted, fontSize: fontSize.xs, fontWeight: '600', letterSpacing: 0.8, marginBottom: spacing.sm }}>
        WEEKLY CONSISTENCY
      </Text>
      <View style={{ flexDirection: 'row', gap: spacing.sm }}>
        {days.map((d, i) => (
          <View key={d} style={{ flex: 1, alignItems: 'center', gap: 4 }}>
            <View
              style={{
                width: 32,
                height: 32,
                borderRadius: radius.sm,
                backgroundColor: completed[i] ? theme.accent : theme.border,
              }}
            />
            <Text style={{ color: theme.textMuted, fontSize: fontSize.xs }}>{d}</Text>
          </View>
        ))}
      </View>
    </Card>
  )
}
