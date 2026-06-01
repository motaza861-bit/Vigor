import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated'
import { useTheme } from '../../contexts/ThemeContext'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { ProgressRing } from '../../components/ui/ProgressRing'
import { TierGate } from '../../components/ui/TierGate'
import { useFadeSlideIn } from '../../hooks/useFadeSlideIn'
import { spacing, fontSize, radius } from '../../theme/tokens'
import { ThemeTokens } from '../../theme/themes'
import {
  loadDayLog,
  saveDayLog,
  computeTotals,
  DayLog,
  FoodEntry,
  MacroTotals,
} from '../../stores/nutritionStore'
import { todayISO } from '../../lib/dateUtils'

export default function NutritionScreen() {
  const { theme } = useTheme()
  const today = todayISO()

  const [dayLog, setDayLog] = useState<DayLog>(() => loadDayLog(today))
  const [showAddMeal, setShowAddMeal] = useState(false)

  const totals = computeTotals(dayLog.entries)
  const calorieProgress = dayLog.targets.calories > 0 ? Math.min(totals.calories / dayLog.targets.calories, 1) : 0
  const caloriesRemaining = dayLog.targets.calories - totals.calories

  const handleAddEntry = (entry: Omit<FoodEntry, 'id'>) => {
    const newEntry: FoodEntry = { ...entry, id: `food-${Date.now()}` }
    const updated: DayLog = { ...dayLog, entries: [...dayLog.entries, newEntry] }
    setDayLog(updated)
    saveDayLog(updated)
    setShowAddMeal(false)
  }

  return (
    <>
      <ScrollView
        style={{ flex: 1, backgroundColor: theme.bg }}
        contentContainerStyle={{ padding: spacing.lg, paddingTop: spacing.xxl, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        <NutritionHeader theme={theme} />
        <CalorieRingSection
          theme={theme}
          progress={calorieProgress}
          remaining={caloriesRemaining}
          totals={totals}
          targets={dayLog.targets}
        />
        <MacroBarsSection theme={theme} totals={totals} targets={dayLog.targets} />
        <EntryListSection theme={theme} entries={dayLog.entries} />
        <Animated.View style={[{ marginTop: spacing.sm }, useFadeSlideIn(5).animatedStyle]}>
          <Button label="+ Add Meal" variant="primary" fullWidth onPress={() => setShowAddMeal(true)} />
        </Animated.View>
        <AISuggestionSection />
      </ScrollView>
      <AddMealModal
        visible={showAddMeal}
        theme={theme}
        onSave={handleAddEntry}
        onClose={() => setShowAddMeal(false)}
      />
    </>
  )
}

function NutritionHeader({ theme }: { theme: ThemeTokens }) {
  const { animatedStyle } = useFadeSlideIn(0)
  return (
    <Animated.View style={[{ marginBottom: spacing.xl }, animatedStyle]}>
      <Text style={{ color: theme.textMuted, fontSize: fontSize.sm, fontWeight: '600', letterSpacing: 0.8, marginBottom: 4 }}>
        TODAY
      </Text>
      <Text style={{ color: theme.text, fontSize: fontSize.display, fontWeight: '900', lineHeight: fontSize.display + 4 }}>
        Nutrition
      </Text>
    </Animated.View>
  )
}

function CalorieRingSection({
  theme,
  progress,
  remaining,
  totals,
  targets,
}: {
  theme: ThemeTokens
  progress: number
  remaining: number
  totals: MacroTotals
  targets: MacroTotals
}) {
  const { animatedStyle } = useFadeSlideIn(1)
  return (
    <Animated.View style={[{ alignItems: 'center', marginBottom: spacing.xl }, animatedStyle]}>
      <ProgressRing
        size={180}
        strokeWidth={14}
        progress={progress}
        centerLabel={`${Math.max(remaining, 0)}`}
        subLabel="kcal remaining"
      />
      <View style={{ flexDirection: 'row', gap: spacing.xl, marginTop: spacing.lg }}>
        <View style={{ alignItems: 'center' }}>
          <Text style={{ color: theme.text, fontSize: fontSize.md, fontWeight: '700' }}>{totals.calories}</Text>
          <Text style={{ color: theme.textMuted, fontSize: fontSize.xs }}>eaten</Text>
        </View>
        <View style={{ alignItems: 'center' }}>
          <Text style={{ color: theme.text, fontSize: fontSize.md, fontWeight: '700' }}>{targets.calories}</Text>
          <Text style={{ color: theme.textMuted, fontSize: fontSize.xs }}>goal</Text>
        </View>
      </View>
    </Animated.View>
  )
}

function MacroBarsSection({
  theme,
  totals,
  targets,
}: {
  theme: ThemeTokens
  totals: MacroTotals
  targets: MacroTotals
}) {
  const { animatedStyle } = useFadeSlideIn(2)
  const macros = [
    { label: 'Protein', current: totals.protein, target: targets.protein, color: theme.accent },
    { label: 'Carbs', current: totals.carbs, target: targets.carbs, color: '#4A9EFF' },
    { label: 'Fat', current: totals.fat, target: targets.fat, color: '#FF9500' },
  ]
  return (
    <Animated.View style={[{ marginBottom: spacing.xl }, animatedStyle]}>
      <Card>
        <Text style={{ color: theme.textMuted, fontSize: fontSize.xs, fontWeight: '600', letterSpacing: 0.8, marginBottom: spacing.md }}>
          MACROS
        </Text>
        {macros.map((m, i) => (
          <MacroBar key={m.label} {...m} theme={theme} isLast={i === macros.length - 1} />
        ))}
      </Card>
    </Animated.View>
  )
}

function MacroBar({
  label,
  current,
  target,
  color,
  theme,
  isLast,
}: {
  label: string
  current: number
  target: number
  color: string
  theme: ThemeTokens
  isLast: boolean
}) {
  const progress = Math.min(current / Math.max(target, 1), 1)
  const width = useSharedValue(0)

  useEffect(() => {
    width.value = withTiming(progress, { duration: 900, easing: Easing.out(Easing.cubic) })
  }, [progress, width])

  const animatedStyle = useAnimatedStyle(() => ({
    width: `${width.value * 100}%`,
  }))

  return (
    <View style={{ marginBottom: isLast ? 0 : spacing.md }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
        <Text style={{ color: theme.text, fontSize: fontSize.sm, fontWeight: '600' }}>{label}</Text>
        <Text style={{ color: theme.textMuted, fontSize: fontSize.sm }}>{current}g / {target}g</Text>
      </View>
      <View style={{ height: 8, backgroundColor: theme.border, borderRadius: 4, overflow: 'hidden' }}>
        <Animated.View
          style={[{ height: 8, backgroundColor: color, borderRadius: 4 }, animatedStyle]}
        />
      </View>
    </View>
  )
}

function EntryListSection({ theme, entries }: { theme: ThemeTokens; entries: FoodEntry[] }) {
  const { animatedStyle } = useFadeSlideIn(3)
  return (
    <Animated.View style={[{ marginBottom: spacing.lg }, animatedStyle]}>
      <Text style={{ color: theme.textMuted, fontSize: fontSize.xs, fontWeight: '600', letterSpacing: 0.8, marginBottom: spacing.sm }}>
        TODAY'S MEALS
      </Text>
      {entries.length === 0 ? (
        <Card>
          <Text style={{ color: theme.textMuted, fontSize: fontSize.sm, textAlign: 'center', paddingVertical: spacing.sm }}>
            No meals logged yet
          </Text>
        </Card>
      ) : (
        entries.map((entry) => (
          <Card key={entry.id} style={{ marginBottom: spacing.sm }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Text style={{ color: theme.text, fontSize: fontSize.md, fontWeight: '600', flex: 1 }}>{entry.name}</Text>
              <Text style={{ color: theme.accent, fontSize: fontSize.md, fontWeight: '700' }}>{entry.calories} kcal</Text>
            </View>
            <Text style={{ color: theme.textMuted, fontSize: fontSize.xs, marginTop: 4 }}>
              P: {entry.protein}g · C: {entry.carbs}g · F: {entry.fat}g
            </Text>
          </Card>
        ))
      )}
    </Animated.View>
  )
}

function AISuggestionSection() {
  const { animatedStyle } = useFadeSlideIn(6)
  return (
    <Animated.View style={[{ marginTop: spacing.lg }, animatedStyle]}>
      <TierGate requiredTier="Premium_AI">
        <Card>
          <Text style={{ color: useTheme().theme.textMuted, fontSize: fontSize.xs, fontWeight: '600', letterSpacing: 0.8 }}>
            AI MEAL SUGGESTION
          </Text>
        </Card>
      </TierGate>
    </Animated.View>
  )
}

function AddMealModal({
  visible,
  theme,
  onSave,
  onClose,
}: {
  visible: boolean
  theme: ThemeTokens
  onSave: (entry: Omit<FoodEntry, 'id'>) => void
  onClose: () => void
}) {
  const [name, setName] = useState('')
  const [calories, setCalories] = useState('')
  const [protein, setProtein] = useState('')
  const [carbs, setCarbs] = useState('')
  const [fat, setFat] = useState('')

  const reset = () => {
    setName('')
    setCalories('')
    setProtein('')
    setCarbs('')
    setFat('')
  }

  const handleSave = () => {
    if (!name.trim() || !calories) return
    onSave({
      name: name.trim(),
      calories: parseFloat(calories) || 0,
      protein: parseFloat(protein) || 0,
      carbs: parseFloat(carbs) || 0,
      fat: parseFloat(fat) || 0,
    })
    reset()
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' }} onPress={handleClose} />
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
            Add Meal
          </Text>
          <ModalInput label="Name" value={name} onChangeText={setName} theme={theme} placeholder="e.g. Oatmeal" />
          <ModalInput label="Calories" value={calories} onChangeText={setCalories} theme={theme} placeholder="300" numeric />
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            <View style={{ flex: 1 }}>
              <ModalInput label="Protein (g)" value={protein} onChangeText={setProtein} theme={theme} placeholder="0" numeric />
            </View>
            <View style={{ flex: 1 }}>
              <ModalInput label="Carbs (g)" value={carbs} onChangeText={setCarbs} theme={theme} placeholder="0" numeric />
            </View>
            <View style={{ flex: 1 }}>
              <ModalInput label="Fat (g)" value={fat} onChangeText={setFat} theme={theme} placeholder="0" numeric />
            </View>
          </View>
          <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg }}>
            <View style={{ flex: 1 }}>
              <Button label="Cancel" variant="ghost" fullWidth onPress={handleClose} />
            </View>
            <View style={{ flex: 1 }}>
              <Button label="Save" variant="primary" fullWidth onPress={handleSave} />
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  )
}

function ModalInput({
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
    <View style={{ marginBottom: spacing.md }}>
      <Text style={{ color: theme.textMuted, fontSize: fontSize.xs, fontWeight: '600', marginBottom: 4 }}>{label}</Text>
      <TextInput
        style={{
          backgroundColor: theme.border,
          color: theme.text,
          fontSize: fontSize.md,
          borderRadius: radius.md,
          paddingHorizontal: spacing.md,
          paddingVertical: 10,
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
