import React, { useState, useEffect, useRef, useMemo } from 'react'
import { View, Text, ScrollView, Pressable, TextInput } from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated'
import { GestureDetector, Gesture } from 'react-native-gesture-handler'
import { useTheme } from '../../contexts/ThemeContext'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { TierGate } from '../../components/ui/TierGate'
import { useFadeSlideIn } from '../../hooks/useFadeSlideIn'
import { useDayNavigator } from '../../hooks/useDayNavigator'
import { spacing, fontSize, radius } from '../../theme/tokens'
import { ThemeTokens } from '../../theme/themes'
import { loadWorkoutLog, saveWorkoutLog, WorkoutLog, ExerciseEntry } from '../../stores/workoutStore'
import { loadSchedule } from '../../stores/scheduleStore'
import { todayISO, todayDayIndex } from '../../lib/dateUtils'

type SetRow = { id: string; reps: string; weight: string; completed: boolean }
type Exercise = { id: string; name: string; sets: SetRow[] }

function toStoreExercises(exercises: Exercise[]): ExerciseEntry[] {
  return exercises.map((ex) => ({
    id: ex.id,
    name: ex.name,
    sets: ex.sets.map((s) => ({
      id: s.id,
      reps: parseFloat(s.reps) || 0,
      weight: parseFloat(s.weight) || 0,
      completed: s.completed,
    })),
  }))
}

function toUIExercises(entries: ExerciseEntry[]): Exercise[] {
  return entries.map((ex) => ({
    id: ex.id,
    name: ex.name,
    sets: ex.sets.map((s) => ({
      id: s.id,
      reps: s.reps.toString(),
      weight: s.weight.toString(),
      completed: s.completed,
    })),
  }))
}

const FALLBACK_EXERCISES: Exercise[] = [
  { id: 'ex-1', name: 'Bench Press', sets: [{ id: 's-1', reps: '8', weight: '80', completed: false }] },
  { id: 'ex-2', name: 'Overhead Press', sets: [{ id: 's-2', reps: '8', weight: '50', completed: false }] },
]

export default function WorkoutScreen() {
  const { theme } = useTheme()

  const { selectedDate, gesture: dayGesture, formattedLabel, dotDates } = useDayNavigator(
    (date) => loadWorkoutLog(date) !== null
  )

  const [splitName] = useState(() => {
    const schedule = loadSchedule()
    return schedule[todayDayIndex()]
  })

  const [exercises, setExercises] = useState<Exercise[]>(() => {
    const log = loadWorkoutLog(selectedDate)
    return log ? toUIExercises(log.exercises) : FALLBACK_EXERCISES
  })
  const [sessionSeconds, setSessionSeconds] = useState(0)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [scrollEnabled, setScrollEnabled] = useState(true)

  const nextIdRef = useRef(100)
  const nextSetIdRef = useRef(100)
  const hasMountedRef = useRef(false)
  const isLoadingRef = useRef(false)

  useEffect(() => {
    const log = loadWorkoutLog(selectedDate)
    isLoadingRef.current = true
    setExercises(log ? toUIExercises(log.exercises) : FALLBACK_EXERCISES)
    hasMountedRef.current = false
  }, [selectedDate])

  useEffect(() => {
    const id = setInterval(() => setSessionSeconds((s) => s + 1), 1000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true
      return
    }
    if (isLoadingRef.current) {
      isLoadingRef.current = false
      return
    }
    const log: WorkoutLog = {
      id: `log-${selectedDate}`,
      date: selectedDate,
      splitName,
      exercises: toStoreExercises(exercises),
    }
    saveWorkoutLog(log)
  }, [exercises, selectedDate, splitName])

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
          ? { ...ex, sets: ex.sets.map((s, j) => (j === setIndex ? { ...s, completed: !s.completed } : s)) }
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

  const removeSet = (exerciseIndex: number, setIndex: number) => {
    setExercises((prev) =>
      prev.map((ex, i) =>
        i === exerciseIndex
          ? { ...ex, sets: ex.sets.filter((_, j) => j !== setIndex) }
          : ex
      )
    )
  }

  const renameExercise = (exerciseIndex: number, name: string) => {
    setExercises((prev) =>
      prev.map((ex, i) => (i === exerciseIndex ? { ...ex, name: name || ex.name } : ex))
    )
  }

  const removeExercise = (exerciseIndex: number) => {
    setExercises((prev) => prev.filter((_, i) => i !== exerciseIndex))
  }

  const moveExercise = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= exercises.length) return
    setExercises((prev) => {
      const arr = [...prev]
      const [item] = arr.splice(fromIndex, 1)
      arr.splice(toIndex, 0, item)
      return arr
    })
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
    <GestureDetector gesture={dayGesture}>
      <ScrollView
        style={{ flex: 1, backgroundColor: theme.bg }}
        contentContainerStyle={{ padding: spacing.lg, paddingTop: spacing.xxl, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
        scrollEnabled={scrollEnabled}
      >
        <DotRow dotDates={dotDates} selectedDate={selectedDate} theme={theme} />
        <SessionHeader theme={theme} seconds={sessionSeconds} splitName={splitName} label={formattedLabel} />

        {exercises.map((exercise, i) => (
          <ExerciseCard
            key={exercise.id}
            exercise={exercise}
            index={i}
            theme={theme}
            isEditing={editingId === exercise.id}
            onStartEdit={() => setEditingId(exercise.id)}
            onRename={(name) => { renameExercise(i, name); setEditingId(null) }}
            onAddSet={() => addSet(i)}
            onToggleSet={(setIdx) => toggleSet(i, setIdx)}
            onUpdateSet={(setIdx, field, val) => updateSet(i, setIdx, field, val)}
            onRemoveSet={(setIdx) => removeSet(i, setIdx)}
            onRemove={() => removeExercise(i)}
            onMoveUp={() => moveExercise(i, i - 1)}
            onMoveDown={() => moveExercise(i, i + 1)}
            onDragStart={() => setScrollEnabled(false)}
            onDragEnd={() => setScrollEnabled(true)}
          />
        ))}

        <AddExerciseButton index={exercises.length + 1} onPress={addExercise} />
        <VolumeTrendBlock index={exercises.length + 2} />
      </ScrollView>
    </GestureDetector>
  )
}

function DotRow({
  dotDates,
  selectedDate,
  theme,
}: {
  dotDates: string[]
  selectedDate: string
  theme: ThemeTokens
}) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'center', gap: spacing.sm, marginBottom: spacing.md }}>
      {dotDates.map((date) => {
        const isSelected = date === selectedDate
        const isToday = date === dotDates[6]
        return (
          <View
            key={date}
            style={{
              width: isSelected ? 10 : 8,
              height: isSelected ? 10 : 8,
              borderRadius: 5,
              backgroundColor: theme.border,
              borderWidth: isToday ? 1 : 0,
              borderColor: theme.accent,
            }}
          />
        )
      })}
    </View>
  )
}

function SessionHeader({
  theme,
  seconds,
  splitName,
  label,
}: {
  theme: ThemeTokens
  seconds: number
  splitName: string
  label: string
}) {
  const { animatedStyle } = useFadeSlideIn(0)
  const mins = String(Math.floor(seconds / 60)).padStart(2, '0')
  const secs = String(seconds % 60).padStart(2, '0')

  return (
    <Animated.View style={[{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xl }, animatedStyle]}>
      <View style={{ flex: 1 }}>
        <Text style={{ color: theme.textMuted, fontSize: fontSize.sm, fontWeight: '600', letterSpacing: 0.8, marginBottom: 4 }}>
          {label.toUpperCase()}
        </Text>
        <Text style={{ color: theme.text, fontSize: fontSize.xxl, fontWeight: '900' }}>
          {splitName}
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
  isEditing,
  onStartEdit,
  onRename,
  onAddSet,
  onToggleSet,
  onUpdateSet,
  onRemoveSet,
  onRemove,
  onMoveUp,
  onMoveDown,
  onDragStart,
  onDragEnd,
}: {
  exercise: Exercise
  index: number
  theme: ThemeTokens
  isEditing: boolean
  onStartEdit: () => void
  onRename: (name: string) => void
  onAddSet: () => void
  onToggleSet: (i: number) => void
  onUpdateSet: (i: number, field: 'reps' | 'weight', val: string) => void
  onRemoveSet: (i: number) => void
  onRemove: () => void
  onMoveUp: () => void
  onMoveDown: () => void
  onDragStart: () => void
  onDragEnd: () => void
}) {
  const { animatedStyle } = useFadeSlideIn(index + 1)
  const [nameValue, setNameValue] = useState(exercise.name)

  useEffect(() => {
    setNameValue(exercise.name)
  }, [exercise.name])

  const dragScale = useSharedValue(1)
  const dragCardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: dragScale.value }],
  }))

  const onMoveUpRef = useRef(onMoveUp)
  const onMoveDownRef = useRef(onMoveDown)
  const onDragStartRef = useRef(onDragStart)
  const onDragEndRef = useRef(onDragEnd)

  useEffect(() => {
    onMoveUpRef.current = onMoveUp
    onMoveDownRef.current = onMoveDown
    onDragStartRef.current = onDragStart
    onDragEndRef.current = onDragEnd
  })

  const dragGesture = useMemo(
    () =>
      Gesture.Pan()
        .onStart(() => {
          dragScale.value = withSpring(1.02)
          onDragStartRef.current()
        })
        .onEnd((e) => {
          dragScale.value = withSpring(1)
          onDragEndRef.current()
          const CARD_HEIGHT = 160
          const steps = Math.round(e.translationY / CARD_HEIGHT)
          if (steps < 0) {
            for (let k = 0; k < Math.abs(steps); k++) onMoveUpRef.current()
          } else if (steps > 0) {
            for (let k = 0; k < steps; k++) onMoveDownRef.current()
          }
        })
        .onFinalize(() => {
          dragScale.value = withSpring(1)
          onDragEndRef.current()
        })
        .runOnJS(true),
    []
  )

  return (
    <Animated.View style={[{ marginBottom: spacing.md }, animatedStyle]}>
      <Animated.View style={dragCardStyle}>
        <Card>
          {/* Header row: drag handle | name | trash */}
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md }}>
            <GestureDetector gesture={dragGesture}>
              <View style={{ paddingRight: spacing.sm, paddingVertical: 4 }}>
                <Text style={{ color: theme.textMuted, fontSize: fontSize.lg }}>≡</Text>
              </View>
            </GestureDetector>

            {isEditing ? (
              <TextInput
                style={{
                  flex: 1,
                  color: theme.text,
                  fontSize: fontSize.lg,
                  fontWeight: '700',
                  borderBottomWidth: 1,
                  borderBottomColor: theme.accent,
                  paddingVertical: 2,
                }}
                value={nameValue}
                onChangeText={setNameValue}
                onBlur={() => onRename(nameValue)}
                onSubmitEditing={() => onRename(nameValue)}
                autoFocus
              />
            ) : (
              <Pressable onPress={onStartEdit} style={{ flex: 1 }}>
                <Text style={{ color: theme.text, fontSize: fontSize.lg, fontWeight: '700' }}>
                  {exercise.name}
                </Text>
              </Pressable>
            )}

            <Pressable onPress={onRemove} hitSlop={8} style={{ paddingLeft: spacing.sm }}>
              <Text style={{ color: theme.textMuted, fontSize: fontSize.md }}>✕</Text>
            </Pressable>
          </View>

          <View style={{ flexDirection: 'row', marginBottom: spacing.sm }}>
            <Text style={{ color: theme.textMuted, fontSize: fontSize.xs, fontWeight: '600', width: 32, textAlign: 'center' }}>SET</Text>
            <Text style={{ color: theme.textMuted, fontSize: fontSize.xs, fontWeight: '600', flex: 1, textAlign: 'center' }}>REPS</Text>
            <Text style={{ color: theme.textMuted, fontSize: fontSize.xs, fontWeight: '600', flex: 1, textAlign: 'center' }}>KG</Text>
            <View style={{ width: 36 }} />
            <View style={{ width: 28 }} />
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
              onRemove={() => onRemoveSet(i)}
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
  onRemove,
}: {
  set: SetRow
  setNumber: number
  theme: ThemeTokens
  onToggle: () => void
  onChangeReps: (v: string) => void
  onChangeWeight: (v: string) => void
  onRemove: () => void
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
      <Pressable onPress={onRemove} style={{ width: 28, alignItems: 'center' }} hitSlop={6}>
        <Text style={{ color: theme.textMuted, fontSize: fontSize.xs }}>✕</Text>
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
  const today = todayISO()
  const log = loadWorkoutLog(today)
  const mockVolumes = [3200, 3600, 3100, 3900]
  const maxV = Math.max(...mockVolumes)

  return (
    <Card>
      <Text style={{ color: theme.textMuted, fontSize: fontSize.xs, fontWeight: '600', letterSpacing: 0.8, marginBottom: spacing.md }}>
        VOLUME TREND — {log?.splitName ?? 'PUSH DAY'}
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
