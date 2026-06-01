import React, { useState } from 'react'
import { View, Text, ScrollView, Pressable, Modal } from 'react-native'
import Animated from 'react-native-reanimated'
import { useTheme } from '../../contexts/ThemeContext'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { useFadeSlideIn } from '../../hooks/useFadeSlideIn'
import { spacing, fontSize, radius } from '../../theme/tokens'
import { ThemeTokens } from '../../theme/themes'
import { loadSchedule, updateDaySchedule, WeekSchedule, DayIndex } from '../../stores/scheduleStore'
import { todayDayIndex } from '../../lib/dateUtils'

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const

const SPLIT_OPTIONS = [
  'Push Day',
  'Pull Day',
  'Leg Day',
  'Upper Body',
  'Lower Body',
  'Full Body',
  'Cardio',
  'Rest',
]

export default function ScheduleScreen() {
  const { theme } = useTheme()
  const [schedule, setSchedule] = useState<WeekSchedule>(() => loadSchedule())
  const [editingDay, setEditingDay] = useState<DayIndex | null>(null)
  const todayIdx = todayDayIndex()

  const handleSelect = (splitName: string) => {
    if (editingDay === null) return
    const updated = updateDaySchedule(editingDay, splitName)
    setSchedule(updated)
    setEditingDay(null)
  }

  return (
    <>
      <ScrollView
        style={{ flex: 1, backgroundColor: theme.bg }}
        contentContainerStyle={{ padding: spacing.lg, paddingTop: spacing.xxl }}
        showsVerticalScrollIndicator={false}
      >
        <ScheduleHeader theme={theme} />
        <WeekGrid
          theme={theme}
          schedule={schedule}
          todayIdx={todayIdx}
          onPressDay={(i) => setEditingDay(i as DayIndex)}
        />
        <HowToUseCard theme={theme} />
      </ScrollView>

      <SplitPickerModal
        visible={editingDay !== null}
        dayLabel={editingDay !== null ? DAY_LABELS[editingDay] : ''}
        current={editingDay !== null ? schedule[editingDay] : ''}
        theme={theme}
        options={SPLIT_OPTIONS}
        onSelect={handleSelect}
        onClose={() => setEditingDay(null)}
      />
    </>
  )
}

function ScheduleHeader({ theme }: { theme: ThemeTokens }) {
  const { animatedStyle } = useFadeSlideIn(0)
  return (
    <Animated.View style={[{ marginBottom: spacing.xl }, animatedStyle]}>
      <Text style={{ color: theme.textMuted, fontSize: fontSize.sm, fontWeight: '600', letterSpacing: 0.8, marginBottom: 4 }}>
        WEEKLY
      </Text>
      <Text style={{ color: theme.text, fontSize: fontSize.display, fontWeight: '900', lineHeight: fontSize.display + 4 }}>
        Schedule
      </Text>
    </Animated.View>
  )
}

function WeekGrid({
  theme,
  schedule,
  todayIdx,
  onPressDay,
}: {
  theme: ThemeTokens
  schedule: WeekSchedule
  todayIdx: number
  onPressDay: (i: number) => void
}) {
  const { animatedStyle } = useFadeSlideIn(1)
  return (
    <Animated.View style={[{ flexDirection: 'row', gap: spacing.xs }, animatedStyle]}>
      {DAY_LABELS.map((label, i) => {
        const isToday = i === todayIdx
        const splitName = schedule[i as DayIndex]
        const isRest = splitName === 'Rest'
        return (
          <Pressable
            key={label}
            onPress={() => onPressDay(i)}
            style={({ pressed }) => ({
              flex: 1,
              backgroundColor: isToday ? theme.accentDim : theme.surface,
              borderRadius: radius.md,
              padding: spacing.sm,
              alignItems: 'center',
              borderWidth: isToday ? 1 : 0,
              borderColor: isToday ? theme.accent : 'transparent',
              opacity: pressed ? 0.7 : 1,
              minHeight: 90,
              justifyContent: 'space-between',
            })}
          >
            <Text style={{ color: isToday ? theme.accent : theme.textMuted, fontSize: fontSize.xs, fontWeight: '700' }}>
              {label}
            </Text>
            <Text
              style={{
                color: isRest ? theme.textMuted : theme.text,
                fontSize: 9,
                fontWeight: '600',
                textAlign: 'center',
                marginTop: 4,
              }}
              numberOfLines={3}
            >
              {splitName}
            </Text>
          </Pressable>
        )
      })}
    </Animated.View>
  )
}

function HowToUseCard({ theme }: { theme: ThemeTokens }) {
  const { animatedStyle } = useFadeSlideIn(2)
  return (
    <Animated.View style={[{ marginTop: spacing.lg }, animatedStyle]}>
      <Card>
        <Text style={{ color: theme.textMuted, fontSize: fontSize.xs, fontWeight: '600', letterSpacing: 0.8, marginBottom: spacing.sm }}>
          HOW TO USE
        </Text>
        <Text style={{ color: theme.textMuted, fontSize: fontSize.sm, lineHeight: 20 }}>
          Tap any day to assign a training split. The Workout screen reads today's split automatically.
        </Text>
      </Card>
    </Animated.View>
  )
}

function SplitPickerModal({
  visible,
  dayLabel,
  current,
  theme,
  options,
  onSelect,
  onClose,
}: {
  visible: boolean
  dayLabel: string
  current: string
  theme: ThemeTokens
  options: string[]
  onSelect: (name: string) => void
  onClose: () => void
}) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' }} onPress={onClose} />
      <View
        style={{
          backgroundColor: theme.surface,
          borderTopLeftRadius: radius.lg,
          borderTopRightRadius: radius.lg,
          padding: spacing.lg,
          paddingBottom: spacing.xxl,
        }}
      >
        <Text style={{ color: theme.text, fontSize: fontSize.lg, fontWeight: '700', marginBottom: spacing.lg }}>
          {dayLabel}
        </Text>
        {options.map((opt) => (
          <Pressable
            key={opt}
            onPress={() => onSelect(opt)}
            style={({ pressed }) => ({
              flexDirection: 'row',
              alignItems: 'center',
              paddingVertical: spacing.md,
              borderBottomWidth: 1,
              borderBottomColor: theme.border,
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <View
              style={{
                width: 20,
                height: 20,
                borderRadius: 10,
                borderWidth: 2,
                borderColor: opt === current ? theme.accent : theme.textMuted,
                backgroundColor: opt === current ? theme.accent : 'transparent',
                marginRight: spacing.md,
              }}
            />
            <Text style={{ color: opt === current ? theme.accent : theme.text, fontSize: fontSize.md, fontWeight: opt === current ? '700' : '400' }}>
              {opt}
            </Text>
          </Pressable>
        ))}
        <View style={{ marginTop: spacing.lg }}>
          <Button label="Cancel" variant="ghost" fullWidth onPress={onClose} />
        </View>
      </View>
    </Modal>
  )
}
