import React, { useState, useEffect } from 'react'
import {
  View, Text, Modal, KeyboardAvoidingView,
  Pressable, TextInput, Platform,
} from 'react-native'
import { useTheme } from '../../contexts/ThemeContext'
import { Button } from '../ui/Button'
import { spacing, fontSize, radius } from '../../theme/tokens'
import { ThemeTokens } from '../../theme/themes'
import { FoodEntry } from '../../stores/nutritionStore'
import { ScanResult } from '../../lib/scanTypes'

type Props = {
  visible: boolean
  result: ScanResult | null
  onSave: (entry: Omit<FoodEntry, 'id'>) => void
  onRetake: () => void
  onClose?: () => void
}

export function ScanConfirmModal({ visible, result, onSave, onRetake, onClose }: Props) {
  const { theme } = useTheme()
  const [name, setName] = useState('')
  const [calories, setCalories] = useState('')
  const [protein, setProtein] = useState('')
  const [carbs, setCarbs] = useState('')
  const [fat, setFat] = useState('')

  useEffect(() => {
    if (result) {
      setName(result.name)
      setCalories(result.calories.toString())
      setProtein(result.protein.toString())
      setCarbs(result.carbs.toString())
      setFat(result.fat.toString())
    } else {
      setName('')
      setCalories('')
      setProtein('')
      setCarbs('')
      setFat('')
    }
  }, [result])

  const handleSave = () => {
    if (!name.trim() || !calories) return
    onSave({
      name: name.trim(),
      calories: parseFloat(calories) || 0,
      protein: parseFloat(protein) || 0,
      carbs: parseFloat(carbs) || 0,
      fat: parseFloat(fat) || 0,
    })
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose ?? onRetake}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' }} onPress={onClose ?? onRetake} />
        <View
          style={{
            backgroundColor: theme.surface,
            borderTopLeftRadius: radius.lg,
            borderTopRightRadius: radius.lg,
            padding: spacing.lg,
            paddingBottom: spacing.xxl,
          }}
        >
          <Text
            style={{ color: theme.text, fontSize: fontSize.lg, fontWeight: '700', marginBottom: spacing.lg }}
          >
            Confirm Meal
          </Text>
          <ConfirmInput label="Name" value={name} onChangeText={setName} theme={theme} placeholder="Food name" />
          <ConfirmInput label="Calories" value={calories} onChangeText={setCalories} theme={theme} placeholder="0" numeric />
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            <View style={{ flex: 1 }}>
              <ConfirmInput label="Protein (g)" value={protein} onChangeText={setProtein} theme={theme} placeholder="0" numeric />
            </View>
            <View style={{ flex: 1 }}>
              <ConfirmInput label="Carbs (g)" value={carbs} onChangeText={setCarbs} theme={theme} placeholder="0" numeric />
            </View>
            <View style={{ flex: 1 }}>
              <ConfirmInput label="Fat (g)" value={fat} onChangeText={setFat} theme={theme} placeholder="0" numeric />
            </View>
          </View>
          <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg }}>
            <View style={{ flex: 1 }}>
              <Button label="Retake / Rescan" variant="ghost" fullWidth onPress={onRetake} />
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

function ConfirmInput({
  label, value, onChangeText, theme, placeholder, numeric = false,
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
      <Text style={{ color: theme.textMuted, fontSize: fontSize.xs, fontWeight: '600', marginBottom: 4 }}>
        {label}
      </Text>
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
