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
import { GestureDetector } from 'react-native-gesture-handler'
import { useTheme } from '../../contexts/ThemeContext'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { ProgressRing } from '../../components/ui/ProgressRing'
import { TierGate } from '../../components/ui/TierGate'
import { useFadeSlideIn } from '../../hooks/useFadeSlideIn'
import { useDayNavigator } from '../../hooks/useDayNavigator'
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
import { ScannerSheet } from '../../components/scanner/ScannerSheet'
import { PhotoScanner } from '../../components/scanner/PhotoScanner'
import { BarcodeScanner } from '../../components/scanner/BarcodeScanner'
import { ScanConfirmModal } from '../../components/scanner/ScanConfirmModal'
import { loadApiKey } from '../../stores/apiKeyStore'
import { ScanResult } from '../../lib/scanTypes'

export default function NutritionScreen() {
  const { theme } = useTheme()

  const { selectedDate, gesture, formattedLabel, dotDates } = useDayNavigator(
    (date) => loadDayLog(date).entries.length > 0
  )

  const [dayLog, setDayLog] = useState<DayLog>(() => loadDayLog(selectedDate))
  const [showAddMeal, setShowAddMeal] = useState(false)
  const [showScanner, setShowScanner] = useState(false)
  const [showPhoto, setShowPhoto] = useState(false)
  const [showBarcode, setShowBarcode] = useState(false)
  const [scanResult, setScanResult] = useState<ScanResult | null>(null)
  const apiKey = loadApiKey()

  useEffect(() => {
    setDayLog(loadDayLog(selectedDate))
  }, [selectedDate])

  const totals = computeTotals(dayLog.entries)
  const calorieProgress = dayLog.targets.calories > 0 ? Math.min(totals.calories / dayLog.targets.calories, 1) : 0
  const caloriesRemaining = dayLog.targets.calories - totals.calories

  const handleAddEntry = (entry: Omit<FoodEntry, 'id'>) => {
    const newEntry: FoodEntry = { ...entry, id: `food-${Date.now()}` }
    const updated: DayLog = { ...dayLog, entries: [...dayLog.entries, newEntry] }
    setDayLog(updated)
    saveDayLog(updated)
    setShowAddMeal(false)
    setScanResult(null)
  }

  return (
    <>
      <GestureDetector gesture={gesture}>
        <ScrollView
          style={{ flex: 1, backgroundColor: theme.bg }}
          contentContainerStyle={{ padding: spacing.lg, paddingTop: spacing.xxl, paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
        >
          <DotRow dotDates={dotDates} selectedDate={selectedDate} theme={theme} />
          <NutritionHeader theme={theme} label={formattedLabel} />
        <CalorieRingSection
          theme={theme}
          progress={calorieProgress}
          remaining={caloriesRemaining}
          totals={totals}
          targets={dayLog.targets}
        />
        <MacroBarsSection theme={theme} totals={totals} targets={dayLog.targets} />
        <EntryListSection theme={theme} entries={dayLog.entries} label={formattedLabel} />
        <AddMealButtonSection onAddMeal={() => setShowAddMeal(true)} onScan={() => setShowScanner(true)} />
        </ScrollView>
      </GestureDetector>
      <AddMealModal
        visible={showAddMeal}
        theme={theme}
        onSave={handleAddEntry}
        onClose={() => setShowAddMeal(false)}
      />
      <ScannerSheet
        visible={showScanner}
        onPhoto={() => { setShowScanner(false); setShowPhoto(true) }}
        onBarcode={() => { setShowScanner(false); setShowBarcode(true) }}
        onClose={() => setShowScanner(false)}
      />
      <PhotoScanner
        visible={showPhoto}
        apiKey={apiKey}
        onResult={(result) => { setShowPhoto(false); setScanResult(result) }}
        onClose={() => setShowPhoto(false)}
      />
      <BarcodeScanner
        visible={showBarcode}
        onResult={(result) => { setShowBarcode(false); setScanResult(result) }}
        onPhotoFallback={() => { setShowBarcode(false); setShowPhoto(true) }}
        onClose={() => setShowBarcode(false)}
      />
      <ScanConfirmModal
        visible={scanResult !== null}
        result={scanResult}
        onSave={handleAddEntry}
        onRetake={() => { setScanResult(null); setShowScanner(true) }}
      />
    </>
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

function NutritionHeader({ theme, label }: { theme: ThemeTokens; label: string }) {
  const { animatedStyle } = useFadeSlideIn(0)
  return (
    <Animated.View style={[{ marginBottom: spacing.xl }, animatedStyle]}>
      <Text style={{ color: theme.textMuted, fontSize: fontSize.sm, fontWeight: '600', letterSpacing: 0.8, marginBottom: 4 }}>
        {label.toUpperCase()}
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

function EntryListSection({ theme, entries, label }: { theme: ThemeTokens; entries: FoodEntry[]; label: string }) {
  const { animatedStyle } = useFadeSlideIn(3)
  return (
    <Animated.View style={[{ marginBottom: spacing.lg }, animatedStyle]}>
      <Text style={{ color: theme.textMuted, fontSize: fontSize.xs, fontWeight: '600', letterSpacing: 0.8, marginBottom: spacing.sm }}>
        {label.toUpperCase()}'S MEALS
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

function AddMealButtonSection({ onAddMeal, onScan }: { onAddMeal: () => void; onScan: () => void }) {
  const { theme } = useTheme()
  const { animatedStyle } = useFadeSlideIn(5)
  return (
    <Animated.View style={[{ marginTop: spacing.sm }, animatedStyle]}>
      <View style={{ flexDirection: 'row', gap: spacing.sm }}>
        <View style={{ flex: 1 }}>
          <Button label="+ Add Meal" variant="primary" fullWidth onPress={onAddMeal} />
        </View>
        <TierGate requiredTier="Premium_AI" variant="coming-soon">
          <Pressable
            onPress={onScan}
            style={{
              width: 48,
              height: 48,
              borderRadius: radius.md,
              borderWidth: 1,
              borderColor: theme.border,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ fontSize: 20 }}>📷</Text>
          </Pressable>
        </TierGate>
      </View>
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
