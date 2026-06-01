import React, { useState, useEffect } from 'react'
import { View, Text, ScrollView, Pressable, TextInput } from 'react-native'
import Animated from 'react-native-reanimated'
import { useTheme } from '../../contexts/ThemeContext'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { TierGate } from '../../components/ui/TierGate'
import { useFadeSlideIn } from '../../hooks/useFadeSlideIn'
import { spacing, fontSize, radius } from '../../theme/tokens'
import { ThemeTokens } from '../../theme/themes'

type SetRow = { id: string; reps: string; weight: string; completed: boolean }
type Exercise = { id: string; name: string; sets: SetRow[] }

const INITIAL_EXERCISES: Exercise[] = [
  { id: 'ex-1', name: 'Bench Press', sets: [{ id: 's-1', reps: '8', weight: '80', completed: false }] },
  { id: 'ex-2', name: 'Overhead Press', sets: [{ id: 's-1', reps: '8', weight: '50', completed: false }] },
]

export default function WorkoutScreen() {
  const { theme } = useTheme()
  const [exercises, setExercises] = useState<Exercise[]>(INITIAL_EXERCISES)
  const [sessionSeconds, setSessionSeconds] = useState(0)
  const nextIdRef = React.useRef(3)
  const nextSetIdRef = React.useRef(2)

  useEffect(() => {
    const id = setInterval(() => setSessionSeconds((s) => s + 1), 1000)
    return () => clearInterval(id)
  }, [])

  const addSet = (exerciseIndex: number) => {
    const id = `s-${nextSetIdRef.current++}`
    setExercises((prev) =>
      prev.map((ex, i) =>
        i === exerciseIndex
          ? { ...ex, sets: [...ex.sets, { id, reps: '', weight: '', completed: false }] }
          : ex
      )
    )
  }

  const toggleSet = (exerciseIndex: number, setIndex: number) => {
    setExercises((prev) =>
      prev.map((ex, i) =>
        i === exerciseIndex
          ? {
              ...ex,
              sets: ex.sets.map((s, j) =>
                j === setIndex ? { ...s, completed: !s.completed } : s
              ),
            }
          : ex
      )
    )
  }

  const updateSet = (exerciseIndex: number, setIndex: number, field: 'reps' | 'weight', value: string) => {
    setExercises((prev) =>
      prev.map((ex, i) =>
        i === exerciseIndex
          ? { ...ex, sets: ex.sets.map((s, j) => (j === setIndex ? { ...s, [field]: value } : s)) }
          : ex
      )
    )
  }

  const addExercise = () => {
    const id = `ex-${nextIdRef.current++}`
    const setId = `s-${nextSetIdRef.current++}`
    setExercises((prev) => [
      ...prev,
      { id, name: 'New Exercise', sets: [{ id: setId, reps: '', weight: '', completed: false }] },
    ])
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.bg }}
      contentContainerStyle={{ padding: spacing.lg, paddingTop: spacing.xxl, paddingBottom: 120 }}
      showsVerticalScrollIndicator={false}
    >
      <SessionHeader theme={theme} seconds={sessionSeconds} />

      {exercises.map((exercise, i) => (
        <ExerciseCard
          key={exercise.id}
          exercise={exercise}
          index={i}
          theme={theme}
          onAddSet={() => addSet(i)}
          onToggleSet={(setIdx) => toggleSet(i, setIdx)}
          onUpdateSet={(setIdx, field, val) => updateSet(i, setIdx, field, val)}
        />
      ))}

      <AddExerciseButton index={exercises.length + 1} onPress={addExercise} />
      <VolumeTrendBlock  index={exercises.length + 2} />
    </ScrollView>
  )
}

function SessionHeader({ theme, seconds }: { theme: ThemeTokens; seconds: number }) {
  const { animatedStyle } = useFadeSlideIn(0)
  const mins = String(Math.floor(seconds / 60)).padStart(2, '0')
  const secs = String(seconds % 60).padStart(2, '0')

  return (
    <Animated.View style={[{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xl }, animatedStyle]}>
      <View style={{ flex: 1 }}>
        <Text style={{ color: theme.textMuted, fontSize: fontSize.sm, fontWeight: '600', letterSpacing: 0.8, marginBottom: 4 }}>
          ACTIVE SESSION
        </Text>
        <Text style={{ color: theme.text, fontSize: fontSize.xxl, fontWeight: '900' }}>
          Push Day
        </Text>
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <Text style={{ color: theme.textMuted, fontSize: fontSize.xs, letterSpacing: 0.6 }}>ELAPSED</Text>
        <Text style={{ color: theme.accent, fontSize: fontSize.xl, fontWeight: '700' }}>
          {mins}:{secs}
        </Text>
      </View>
    </Animated.View>
  )
}

function ExerciseCard({
  exercise,
  index,
  theme,
  onAddSet,
  onToggleSet,
  onUpdateSet,
}: {
  exercise: Exercise
  index: number
  theme: ThemeTokens
  onAddSet: () => void
  onToggleSet: (i: number) => void
  onUpdateSet: (i: number, field: 'reps' | 'weight', val: string) => void
}) {
  const { animatedStyle } = useFadeSlideIn(index + 1)

  return (
    <Animated.View style={[{ marginBottom: spacing.md }, animatedStyle]}>
      <Card>
        <Text style={{ color: theme.text, fontSize: fontSize.lg, fontWeight: '700', marginBottom: spacing.md }}>
          {exercise.name}
        </Text>

        <View style={{ flexDirection: 'row', marginBottom: spacing.sm }}>
          <Text style={{ color: theme.textMuted, fontSize: fontSize.xs, fontWeight: '600', width: 32, textAlign: 'center' }}>SET</Text>
          <Text style={{ color: theme.textMuted, fontSize: fontSize.xs, fontWeight: '600', flex: 1, textAlign: 'center' }}>REPS</Text>
          <Text style={{ color: theme.textMuted, fontSize: fontSize.xs, fontWeight: '600', flex: 1, textAlign: 'center' }}>KG</Text>
          <View style={{ width: 36 }} />
        </View>

        {exercise.sets.map((set, i) => (
          <SetRowView
            key={set.id}
            set={set}
            setNumber={i + 1}
            theme={theme}
            onToggle={() => onToggleSet(i)}
            onChangeReps={(v) => onUpdateSet(i, 'reps', v)}
            onChangeWeight={(v) => onUpdateSet(i, 'weight', v)}
          />
        ))}

        <Pressable
          onPress={onAddSet}
          style={({ pressed }) => ({
            marginTop: spacing.sm,
            padding: spacing.sm,
            alignItems: 'center',
            borderRadius: radius.md,
            borderWidth: 1,
            borderColor: theme.border,
            borderStyle: 'dashed',
            opacity: pressed ? 0.6 : 1,
          })}
        >
          <Text style={{ color: theme.textMuted, fontSize: fontSize.sm, fontWeight: '600' }}>+ Add Set</Text>
        </Pressable>
      </Card>
    </Animated.View>
  )
}

function SetRowView({
  set,
  setNumber,
  theme,
  onToggle,
  onChangeReps,
  onChangeWeight,
}: {
  set: SetRow
  setNumber: number
  theme: ThemeTokens
  onToggle: () => void
  onChangeReps: (v: string) => void
  onChangeWeight: (v: string) => void
}) {
  const inputStyle = {
    flex: 1,
    color: theme.text,
    fontSize: fontSize.md,
    fontWeight: '700' as const,
    textAlign: 'center' as const,
    backgroundColor: theme.border,
    borderRadius: radius.sm,
    paddingVertical: 6,
    marginHorizontal: 4,
  }

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm }}>
      <Text style={{ color: theme.textMuted, fontSize: fontSize.sm, width: 32, textAlign: 'center' }}>
        {setNumber}
      </Text>
      <TextInput
        style={inputStyle}
        value={set.reps}
        onChangeText={onChangeReps}
        keyboardType="numeric"
        placeholder="—"
        placeholderTextColor={theme.textMuted}
      />
      <TextInput
        style={inputStyle}
        value={set.weight}
        onChangeText={onChangeWeight}
        keyboardType="decimal-pad"
        placeholder="—"
        placeholderTextColor={theme.textMuted}
      />
      <Pressable onPress={onToggle} style={{ width: 36, alignItems: 'center' }}>
        <View
          style={{
            width: 24,
            height: 24,
            borderRadius: radius.sm,
            backgroundColor: set.completed ? theme.accent : theme.border,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {set.completed && <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>✓</Text>}
        </View>
      </Pressable>
    </View>
  )
}

function AddExerciseButton({ index, onPress }: { index: number; onPress: () => void }) {
  const { animatedStyle } = useFadeSlideIn(index)
  return (
    <Animated.View style={[{ marginTop: spacing.sm }, animatedStyle]}>
      <Button label="+ Add Exercise" variant="outline" fullWidth onPress={onPress} />
    </Animated.View>
  )
}

function VolumeTrendBlock({ index }: { index: number }) {
  const { animatedStyle } = useFadeSlideIn(index)
  return (
    <Animated.View style={[{ marginTop: spacing.lg }, animatedStyle]}>
      <TierGate requiredTier="Base">
        <VolumeTrendContent />
      </TierGate>
    </Animated.View>
  )
}

function VolumeTrendContent() {
  const { theme } = useTheme()
  const mockVolumes = [3200, 3600, 3100, 3900]
  const maxV = Math.max(...mockVolumes)

  return (
    <Card>
      <Text style={{ color: theme.textMuted, fontSize: fontSize.xs, fontWeight: '600', letterSpacing: 0.8, marginBottom: spacing.md }}>
        VOLUME TREND — PUSH DAY
      </Text>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm, height: 60 }}>
        {mockVolumes.map((v, i) => {
          const barHeight = (v / maxV) * 60
          return (
            <View key={i} style={{ flex: 1, alignItems: 'center', gap: 4 }}>
              <View style={{ width: '100%', height: barHeight, backgroundColor: theme.accent, borderRadius: radius.sm }} />
              <Text style={{ color: theme.textMuted, fontSize: fontSize.xs }}>W{i + 1}</Text>
            </View>
          )
        })}
      </View>
    </Card>
  )
}
