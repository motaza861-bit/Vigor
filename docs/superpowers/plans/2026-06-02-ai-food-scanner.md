# AI Food Scanner Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a camera-based food scanner to the Nutrition screen — photo mode sends an image to Claude for macro estimation, barcode mode looks up the product in Open Food Facts; both paths land on a shared confirmation form before logging.

**Architecture:** Ten tasks in dependency order: shared types → pure API clients (testable) → UI components (not unit-tested) → screen wiring. Each task is independently committable. `lib/` files have full test coverage; camera components are not unit-tested (native modules).

**Tech Stack:** React Native / Expo SDK 56, expo-camera (new install), plain `fetch` for Anthropic API and Open Food Facts, react-native-mmkv (existing), TypeScript strict.

---

## File Map

| File | Action |
|---|---|
| `lib/scanTypes.ts` | Create — `ScanResult` type and `ScanError` class |
| `stores/apiKeyStore.ts` | Create — load/save Anthropic API key |
| `lib/openFoodFacts.ts` | Create — barcode → Open Food Facts → `ScanResult` |
| `lib/claudeVision.ts` | Create — base64 image → Claude API → `ScanResult` |
| `components/scanner/ScanConfirmModal.tsx` | Create — pre-filled confirmation form |
| `components/scanner/ScannerSheet.tsx` | Create — Photo vs Barcode choice sheet |
| `components/scanner/PhotoScanner.tsx` | Create — full-screen camera + capture + Claude call |
| `components/scanner/BarcodeScanner.tsx` | Create — full-screen camera + live barcode detection |
| `__tests__/apiKeyStore.test.ts` | Create |
| `__tests__/openFoodFacts.test.ts` | Create |
| `__tests__/claudeVision.test.ts` | Create |
| `app/settings.tsx` | Modify — add AI section with API key field |
| `app/(tabs)/nutrition.tsx` | Modify — camera button, wire all scanner components |

---

### Task 1: Shared Scan Types

**Files:**
- Create: `lib/scanTypes.ts`

- [ ] **Step 1: Create `lib/scanTypes.ts`**

```ts
export type ScanResult = {
  name: string
  calories: number
  protein: number
  carbs: number
  fat: number
}

export class ScanError extends Error {
  constructor(public code: 'parse_failed' | 'api_error' | 'not_found' | 'network_error') {
    super(code)
    this.name = 'ScanError'
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/scanTypes.ts
git commit -m "feat: add ScanResult type and ScanError class"
```

---

### Task 2: API Key Store

**Files:**
- Create: `stores/apiKeyStore.ts`
- Test: `__tests__/apiKeyStore.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `__tests__/apiKeyStore.test.ts`:

```ts
import { loadApiKey, saveApiKey } from '../stores/apiKeyStore'

const store: Record<string, string> = {}

jest.mock('react-native-mmkv', () => ({
  MMKV: jest.fn().mockImplementation(() => ({
    getString: jest.fn((key: string) => store[key]),
    set: jest.fn((key: string, value: string) => { store[key] = value }),
  })),
}))

describe('apiKeyStore', () => {
  it('returns empty string when key is not set', () => {
    expect(loadApiKey()).toBe('')
  })

  it('saves and loads the API key', () => {
    saveApiKey('sk-ant-test-key')
    expect(loadApiKey()).toBe('sk-ant-test-key')
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx jest __tests__/apiKeyStore.test.ts --no-coverage
```

Expected: FAIL — `Cannot find module '../stores/apiKeyStore'`

- [ ] **Step 3: Create `stores/apiKeyStore.ts`**

```ts
import { MMKV } from 'react-native-mmkv'

let storage: MMKV | undefined

function getStorage() {
  if (!storage) {
    storage = new MMKV({ id: 'api-keys' })
  }
  return storage
}

export function loadApiKey(): string {
  return getStorage().getString('anthropic') ?? ''
}

export function saveApiKey(key: string): void {
  getStorage().set('anthropic', key)
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx jest __tests__/apiKeyStore.test.ts --no-coverage
```

Expected: PASS — 2 tests

- [ ] **Step 5: Commit**

```bash
git add stores/apiKeyStore.ts __tests__/apiKeyStore.test.ts
git commit -m "feat: add apiKeyStore for Anthropic API key persistence"
```

---

### Task 3: Open Food Facts Client

**Files:**
- Create: `lib/openFoodFacts.ts`
- Test: `__tests__/openFoodFacts.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `__tests__/openFoodFacts.test.ts`:

```ts
import { openFoodFacts } from '../lib/openFoodFacts'
import { ScanError } from '../lib/scanTypes'

describe('openFoodFacts', () => {
  beforeEach(() => {
    global.fetch = jest.fn()
  })

  it('returns macros scaled to serving_quantity', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      json: async () => ({
        status: 1,
        product: {
          product_name: 'Banana',
          serving_quantity: '120',
          nutriments: {
            'energy-kcal_100g': 89,
            'proteins_100g': 1.1,
            'carbohydrates_100g': 23,
            'fat_100g': 0.3,
          },
        },
      }),
    })
    const result = await openFoodFacts('1234567890')
    expect(result.name).toBe('Banana')
    expect(result.calories).toBe(107) // Math.round(89 * 1.2)
    expect(result.carbs).toBe(28)     // Math.round(23 * 1.2)
    expect(result.protein).toBe(1)    // Math.round(1.1 * 1.2)
  })

  it('defaults to 100g when serving_quantity is absent', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      json: async () => ({
        status: 1,
        product: {
          product_name: 'Apple',
          nutriments: {
            'energy-kcal_100g': 52,
            'proteins_100g': 0.3,
            'carbohydrates_100g': 14,
            'fat_100g': 0.2,
          },
        },
      }),
    })
    const result = await openFoodFacts('9876543210')
    expect(result.calories).toBe(52)
    expect(result.carbs).toBe(14)
  })

  it('falls back to generic_name when product_name is empty', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      json: async () => ({
        status: 1,
        product: {
          product_name: '',
          generic_name: 'Whole Milk',
          nutriments: { 'energy-kcal_100g': 61, 'proteins_100g': 3.2, 'carbohydrates_100g': 4.8, 'fat_100g': 3.2 },
        },
      }),
    })
    const result = await openFoodFacts('9999999999')
    expect(result.name).toBe('Whole Milk')
  })

  it('throws ScanError not_found when product is missing', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      json: async () => ({ status: 0 }),
    })
    await expect(openFoodFacts('0000000000')).rejects.toMatchObject({ code: 'not_found' })
  })

  it('throws ScanError network_error when fetch rejects', async () => {
    ;(global.fetch as jest.Mock).mockRejectedValueOnce(new Error('network'))
    await expect(openFoodFacts('1234567890')).rejects.toMatchObject({ code: 'network_error' })
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx jest __tests__/openFoodFacts.test.ts --no-coverage
```

Expected: FAIL — `Cannot find module '../lib/openFoodFacts'`

- [ ] **Step 3: Create `lib/openFoodFacts.ts`**

```ts
import { ScanResult, ScanError } from './scanTypes'

export async function openFoodFacts(barcode: string): Promise<ScanResult> {
  let response: Response
  try {
    response = await fetch(
      `https://world.openfoodfacts.org/api/v0/product/${barcode}.json`
    )
  } catch {
    throw new ScanError('network_error')
  }

  const data = await response.json()

  if (data.status === 0) {
    throw new ScanError('not_found')
  }

  const { product } = data
  const n = product.nutriments
  const servingGrams = product.serving_quantity
    ? parseFloat(product.serving_quantity)
    : 100
  const scale = servingGrams / 100

  return {
    name: product.product_name || product.generic_name || 'Unknown Product',
    calories: Math.round((n['energy-kcal_100g'] ?? 0) * scale),
    protein: Math.round((n['proteins_100g'] ?? 0) * scale),
    carbs: Math.round((n['carbohydrates_100g'] ?? 0) * scale),
    fat: Math.round((n['fat_100g'] ?? 0) * scale),
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx jest __tests__/openFoodFacts.test.ts --no-coverage
```

Expected: PASS — 5 tests

- [ ] **Step 5: Commit**

```bash
git add lib/openFoodFacts.ts __tests__/openFoodFacts.test.ts
git commit -m "feat: add Open Food Facts client with barcode lookup"
```

---

### Task 4: Claude Vision Client

**Files:**
- Create: `lib/claudeVision.ts`
- Test: `__tests__/claudeVision.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `__tests__/claudeVision.test.ts`:

```ts
import { claudeVision } from '../lib/claudeVision'
import { ScanError } from '../lib/scanTypes'

describe('claudeVision', () => {
  beforeEach(() => {
    global.fetch = jest.fn()
  })

  it('parses a valid JSON response from Claude', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        content: [{ text: '{ "name": "Oatmeal", "calories": 300, "protein": 10, "carbs": 54, "fat": 5 }' }],
      }),
    })
    const result = await claudeVision('base64string', 'sk-ant-test')
    expect(result.name).toBe('Oatmeal')
    expect(result.calories).toBe(300)
    expect(result.protein).toBe(10)
    expect(result.carbs).toBe(54)
    expect(result.fat).toBe(5)
  })

  it('extracts JSON when Claude wraps it in prose', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        content: [{ text: 'Here is the nutrition info: { "name": "Banana", "calories": 105, "protein": 1, "carbs": 27, "fat": 0 }' }],
      }),
    })
    const result = await claudeVision('base64string', 'sk-ant-test')
    expect(result.name).toBe('Banana')
    expect(result.calories).toBe(105)
  })

  it('throws ScanError parse_failed when response has no JSON', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ content: [{ text: 'I cannot identify this food.' }] }),
    })
    await expect(claudeVision('base64string', 'sk-ant-test')).rejects.toMatchObject({ code: 'parse_failed' })
  })

  it('throws ScanError api_error when response is not ok', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({ ok: false })
    await expect(claudeVision('base64string', 'sk-ant-test')).rejects.toMatchObject({ code: 'api_error' })
  })

  it('throws ScanError network_error when fetch rejects', async () => {
    ;(global.fetch as jest.Mock).mockRejectedValueOnce(new Error('network'))
    await expect(claudeVision('base64string', 'sk-ant-test')).rejects.toMatchObject({ code: 'network_error' })
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx jest __tests__/claudeVision.test.ts --no-coverage
```

Expected: FAIL — `Cannot find module '../lib/claudeVision'`

- [ ] **Step 3: Create `lib/claudeVision.ts`**

```ts
import { ScanResult, ScanError } from './scanTypes'

export async function claudeVision(base64Jpeg: string, apiKey: string): Promise<ScanResult> {
  let response: Response
  try {
    response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 256,
        system:
          'You are a nutrition analysis assistant. Respond with only a JSON object: { "name": string, "calories": number, "protein": number, "carbs": number, "fat": number }. Estimate for a single typical serving. Use integers only.',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: 'image/jpeg',
                  data: base64Jpeg,
                },
              },
              { type: 'text', text: 'What food is this and what are its macros?' },
            ],
          },
        ],
      }),
    })
  } catch {
    throw new ScanError('network_error')
  }

  if (!response.ok) {
    throw new ScanError('api_error')
  }

  const data = await response.json()
  const text: string = data?.content?.[0]?.text ?? ''
  const match = text.match(/\{[\s\S]*\}/)
  if (!match) throw new ScanError('parse_failed')

  let parsed: unknown
  try {
    parsed = JSON.parse(match[0])
  } catch {
    throw new ScanError('parse_failed')
  }

  if (
    typeof parsed !== 'object' ||
    parsed === null ||
    typeof (parsed as Record<string, unknown>).name !== 'string' ||
    typeof (parsed as Record<string, unknown>).calories !== 'number'
  ) {
    throw new ScanError('parse_failed')
  }

  const p = parsed as Record<string, unknown>
  return {
    name: p.name as string,
    calories: p.calories as number,
    protein: typeof p.protein === 'number' ? p.protein : 0,
    carbs: typeof p.carbs === 'number' ? p.carbs : 0,
    fat: typeof p.fat === 'number' ? p.fat : 0,
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx jest __tests__/claudeVision.test.ts --no-coverage
```

Expected: PASS — 5 tests

- [ ] **Step 5: Run full test suite**

```bash
npx jest --no-coverage
```

Expected: All tests pass (previously passing tests still pass)

- [ ] **Step 6: Commit**

```bash
git add lib/claudeVision.ts __tests__/claudeVision.test.ts
git commit -m "feat: add Claude vision client for photo food identification"
```

---

### Task 5: ScanConfirmModal

**Files:**
- Create: `components/scanner/ScanConfirmModal.tsx`

No unit tests — UI component with no extractable logic.

- [ ] **Step 1: Create `components/scanner/ScanConfirmModal.tsx`**

```tsx
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
}

export function ScanConfirmModal({ visible, result, onSave, onRetake }: Props) {
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
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onRetake}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' }} onPress={onRetake} />
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
```

- [ ] **Step 2: Commit**

```bash
git add components/scanner/ScanConfirmModal.tsx
git commit -m "feat: add ScanConfirmModal for reviewing scanned food before logging"
```

---

### Task 6: ScannerSheet

**Files:**
- Create: `components/scanner/ScannerSheet.tsx`

- [ ] **Step 1: Create `components/scanner/ScannerSheet.tsx`**

```tsx
import React from 'react'
import { View, Text, Modal, Pressable } from 'react-native'
import { useTheme } from '../../contexts/ThemeContext'
import { Button } from '../ui/Button'
import { spacing, fontSize, radius } from '../../theme/tokens'

type Props = {
  visible: boolean
  onPhoto: () => void
  onBarcode: () => void
  onClose: () => void
}

export function ScannerSheet({ visible, onPhoto, onBarcode, onClose }: Props) {
  const { theme } = useTheme()
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' }}
        onPress={onClose}
      />
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
          Add from Scanner
        </Text>
        <Button label="📷  Take Photo" variant="ghost" fullWidth onPress={onPhoto} />
        <View style={{ height: spacing.sm }} />
        <Button label="⬛  Scan Barcode" variant="ghost" fullWidth onPress={onBarcode} />
        <View style={{ height: spacing.lg }} />
        <Button label="Cancel" variant="ghost" fullWidth onPress={onClose} />
      </View>
    </Modal>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/scanner/ScannerSheet.tsx
git commit -m "feat: add ScannerSheet bottom modal for photo/barcode choice"
```

---

### Task 7: Install expo-camera + PhotoScanner

**Files:**
- Create: `components/scanner/PhotoScanner.tsx`

- [ ] **Step 1: Install expo-camera**

```bash
npx expo install expo-camera
```

Expected: `expo-camera` added to `package.json` dependencies with the SDK-56-compatible version (e.g. `~15.x.x`).

- [ ] **Step 2: Create `components/scanner/PhotoScanner.tsx`**

```tsx
import React, { useRef, useState } from 'react'
import {
  View, Text, Modal, Pressable,
  ActivityIndicator, StyleSheet,
} from 'react-native'
import { CameraView, useCameraPermissions } from 'expo-camera'
import { useTheme } from '../../contexts/ThemeContext'
import { spacing, fontSize, radius } from '../../theme/tokens'
import { claudeVision } from '../../lib/claudeVision'
import { ScanResult, ScanError } from '../../lib/scanTypes'

type Props = {
  visible: boolean
  apiKey: string
  onResult: (result: ScanResult) => void
  onClose: () => void
}

type State = 'idle' | 'processing' | 'error'

export function PhotoScanner({ visible, apiKey, onResult, onClose }: Props) {
  const { theme } = useTheme()
  const [permission, requestPermission] = useCameraPermissions()
  const [state, setState] = useState<State>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const cameraRef = useRef<CameraView>(null)

  if (!apiKey) {
    return (
      <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
        <View style={[styles.fullscreen, { backgroundColor: theme.bg }]}>
          <Pressable onPress={onClose} style={styles.closeButton}>
            <Text style={{ color: theme.text, fontSize: fontSize.lg }}>✕</Text>
          </Pressable>
          <View style={styles.centeredMessage}>
            <Text
              style={{ color: theme.textMuted, fontSize: fontSize.md, textAlign: 'center' }}
            >
              Add your Anthropic API key in Settings to use photo scanning.
            </Text>
          </View>
        </View>
      </Modal>
    )
  }

  if (!permission?.granted) {
    return (
      <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
        <View style={[styles.fullscreen, { backgroundColor: theme.bg }]}>
          <Pressable onPress={onClose} style={styles.closeButton}>
            <Text style={{ color: theme.text, fontSize: fontSize.lg }}>✕</Text>
          </Pressable>
          <View style={styles.centeredMessage}>
            <Text
              style={{
                color: theme.textMuted, fontSize: fontSize.md,
                textAlign: 'center', marginBottom: spacing.lg,
              }}
            >
              Camera access is required for photo scanning.
            </Text>
            <Pressable
              onPress={requestPermission}
              style={{
                backgroundColor: theme.accent,
                borderRadius: radius.md,
                paddingHorizontal: spacing.lg,
                paddingVertical: spacing.md,
              }}
            >
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: fontSize.md }}>
                Allow Camera
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    )
  }

  const capture = async () => {
    if (!cameraRef.current || state === 'processing') return
    setState('processing')
    try {
      const photo = await cameraRef.current.takePictureAsync({ base64: true, quality: 0.6 })
      const result = await claudeVision(photo.base64!, apiKey)
      onResult(result)
      setState('idle')
    } catch (e) {
      const code = e instanceof ScanError ? e.code : 'api_error'
      setErrorMsg(
        code === 'network_error'
          ? 'No internet connection.'
          : "Couldn't identify this food. Try again."
      )
      setState('error')
    }
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.fullscreen}>
        <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} />
        <Pressable onPress={onClose} style={styles.closeButton}>
          <Text style={{ color: '#fff', fontSize: fontSize.lg }}>✕</Text>
        </Pressable>
        {state === 'error' && (
          <View style={styles.errorBanner}>
            <Text style={{ color: '#fff', fontSize: fontSize.sm, textAlign: 'center' }}>
              {errorMsg}
            </Text>
            <Pressable onPress={() => setState('idle')} style={{ marginTop: 6 }}>
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: fontSize.sm }}>
                Try Again
              </Text>
            </Pressable>
          </View>
        )}
        <View style={styles.bottomBar}>
          {state === 'processing' ? (
            <>
              <ActivityIndicator color="#fff" size="large" />
              <Text style={{ color: '#fff', fontSize: fontSize.sm, marginTop: 8 }}>
                Identifying food…
              </Text>
            </>
          ) : (
            <Pressable onPress={capture} style={styles.captureButton} />
          )}
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  fullscreen: { flex: 1, backgroundColor: '#000' },
  closeButton: { position: 'absolute', top: 56, left: 20, zIndex: 10, padding: 8 },
  centeredMessage: {
    flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32,
  },
  errorBanner: {
    position: 'absolute', bottom: 140, left: 20, right: 20,
    backgroundColor: 'rgba(220,38,38,0.85)', borderRadius: 8,
    padding: 12, alignItems: 'center',
  },
  bottomBar: {
    position: 'absolute', bottom: 48, left: 0, right: 0,
    alignItems: 'center', justifyContent: 'center',
  },
  captureButton: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: '#fff', borderWidth: 4, borderColor: 'rgba(255,255,255,0.5)',
  },
})
```

- [ ] **Step 3: Commit**

```bash
git add package.json components/scanner/PhotoScanner.tsx
git commit -m "feat: add PhotoScanner with live camera capture and Claude vision"
```

---

### Task 8: BarcodeScanner

**Files:**
- Create: `components/scanner/BarcodeScanner.tsx`

- [ ] **Step 1: Create `components/scanner/BarcodeScanner.tsx`**

```tsx
import React, { useRef, useState } from 'react'
import {
  View, Text, Modal, Pressable,
  ActivityIndicator, StyleSheet,
} from 'react-native'
import { CameraView, useCameraPermissions, BarcodeScanningResult } from 'expo-camera'
import { useTheme } from '../../contexts/ThemeContext'
import { spacing, fontSize, radius } from '../../theme/tokens'
import { openFoodFacts } from '../../lib/openFoodFacts'
import { ScanResult, ScanError } from '../../lib/scanTypes'

type Props = {
  visible: boolean
  onResult: (result: ScanResult) => void
  onPhotoFallback: () => void
  onClose: () => void
}

type State = 'scanning' | 'fetching' | 'error'

export function BarcodeScanner({ visible, onResult, onPhotoFallback, onClose }: Props) {
  const { theme } = useTheme()
  const [permission, requestPermission] = useCameraPermissions()
  const [state, setState] = useState<State>('scanning')
  const [errorMsg, setErrorMsg] = useState('')
  const isHandlingRef = useRef(false)

  if (!permission?.granted) {
    return (
      <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
        <View style={[styles.fullscreen, { backgroundColor: theme.bg }]}>
          <Pressable onPress={onClose} style={styles.closeButton}>
            <Text style={{ color: theme.text, fontSize: fontSize.lg }}>✕</Text>
          </Pressable>
          <View style={styles.centeredMessage}>
            <Text
              style={{
                color: theme.textMuted, fontSize: fontSize.md,
                textAlign: 'center', marginBottom: spacing.lg,
              }}
            >
              Camera access is required for barcode scanning.
            </Text>
            <Pressable
              onPress={requestPermission}
              style={{
                backgroundColor: theme.accent,
                borderRadius: radius.md,
                paddingHorizontal: spacing.lg,
                paddingVertical: spacing.md,
              }}
            >
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: fontSize.md }}>
                Allow Camera
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    )
  }

  const handleBarcode = async ({ data }: BarcodeScanningResult) => {
    if (isHandlingRef.current || state !== 'scanning') return
    isHandlingRef.current = true
    setState('fetching')
    try {
      const result = await openFoodFacts(data)
      onResult(result)
      setState('scanning')
      isHandlingRef.current = false
    } catch (e) {
      const code = e instanceof ScanError ? e.code : 'network_error'
      setErrorMsg(
        code === 'not_found'
          ? 'Product not found — add manually.'
          : 'Could not reach product database.'
      )
      setState('error')
      isHandlingRef.current = false
    }
  }

  const retry = () => {
    setState('scanning')
    isHandlingRef.current = false
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.fullscreen}>
        <CameraView
          style={StyleSheet.absoluteFill}
          onBarcodeScanned={state === 'scanning' ? handleBarcode : undefined}
          barcodeScannerSettings={{
            barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'qr'],
          }}
        />
        <Pressable onPress={onClose} style={styles.closeButton}>
          <Text style={{ color: '#fff', fontSize: fontSize.lg }}>✕</Text>
        </Pressable>
        <View style={styles.frameContainer}>
          <View style={styles.targetFrame} />
          {state === 'fetching' ? (
            <>
              <ActivityIndicator color="#fff" size="small" style={{ marginTop: 16 }} />
              <Text style={{ color: '#fff', fontSize: fontSize.sm, marginTop: 8 }}>
                Looking up product…
              </Text>
            </>
          ) : state === 'error' ? (
            <View style={styles.errorBox}>
              <Text style={{ color: '#fff', fontSize: fontSize.sm, textAlign: 'center' }}>
                {errorMsg}
              </Text>
              <Pressable onPress={retry} style={{ marginTop: 8 }}>
                <Text style={{ color: '#fff', fontWeight: '700', fontSize: fontSize.sm }}>
                  Try Again
                </Text>
              </Pressable>
            </View>
          ) : (
            <Text style={{ color: '#fff', fontSize: fontSize.sm, marginTop: 16 }}>
              Point at a barcode
            </Text>
          )}
        </View>
        <Pressable onPress={onPhotoFallback} style={styles.photoFallback}>
          <Text style={{ color: '#fff', fontSize: fontSize.sm }}>📷 Take Photo instead</Text>
        </Pressable>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  fullscreen: { flex: 1, backgroundColor: '#000' },
  closeButton: { position: 'absolute', top: 56, left: 20, zIndex: 10, padding: 8 },
  centeredMessage: {
    flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32,
  },
  frameContainer: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    alignItems: 'center', justifyContent: 'center',
  },
  targetFrame: {
    width: 260, height: 160, borderWidth: 2, borderColor: '#fff', borderRadius: 8,
  },
  errorBox: {
    marginTop: 16, backgroundColor: 'rgba(220,38,38,0.85)', borderRadius: 8,
    padding: 12, alignItems: 'center', marginHorizontal: 32,
  },
  photoFallback: { position: 'absolute', bottom: 48, right: 24, padding: 8 },
})
```

- [ ] **Step 2: Commit**

```bash
git add components/scanner/BarcodeScanner.tsx
git commit -m "feat: add BarcodeScanner with live detection and Open Food Facts lookup"
```

---

### Task 9: Settings AI Section

**Files:**
- Modify: `app/settings.tsx`

- [ ] **Step 1: Add `apiKeyStore` import and state to `SettingsModal`**

In `app/settings.tsx`, add to the import block at line 8:

```ts
import { loadApiKey, saveApiKey } from '../stores/apiKeyStore'
```

Inside `SettingsModal`, after the existing state declarations (after line 22), add:

```ts
const [apiKey, setApiKey] = useState(() => loadApiKey())
const [showKey, setShowKey] = useState(false)
```

- [ ] **Step 2: Insert AI section before `<SectionLabel label="APPEARANCE" …/>` (currently line 135)**

Replace:

```tsx
      <SectionLabel label="APPEARANCE" theme={theme} />
```

With:

```tsx
      <SectionLabel label="AI" theme={theme} />
      <ApiKeyInput
        value={apiKey}
        showKey={showKey}
        onToggleShow={() => setShowKey((v) => !v)}
        onBlur={(v) => { setApiKey(v); saveApiKey(v.trim()) }}
        theme={theme}
      />
      <Text
        style={{ color: theme.textMuted, fontSize: fontSize.xs, marginBottom: spacing.lg }}
      >
        Required for photo food scanning
      </Text>

      <SectionLabel label="APPEARANCE" theme={theme} />
```

- [ ] **Step 3: Add `ApiKeyInput` component** at the bottom of `app/settings.tsx`, after the last existing component function:

```tsx
function ApiKeyInput({
  value,
  showKey,
  onToggleShow,
  onBlur,
  theme,
}: {
  value: string
  showKey: boolean
  onToggleShow: () => void
  onBlur: (v: string) => void
  theme: ThemeTokens
}) {
  const [localValue, setLocalValue] = useState(value)
  return (
    <View style={{ marginBottom: spacing.sm }}>
      <Text
        style={{
          color: theme.textMuted, fontSize: fontSize.xs,
          fontWeight: '600', marginBottom: 4,
        }}
      >
        ANTHROPIC API KEY
      </Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
        <TextInput
          style={{
            flex: 1,
            backgroundColor: theme.border,
            color: theme.text,
            fontSize: fontSize.sm,
            borderRadius: radius.md,
            paddingHorizontal: spacing.md,
            paddingVertical: 10,
          }}
          value={localValue}
          onChangeText={setLocalValue}
          onBlur={() => onBlur(localValue)}
          secureTextEntry={!showKey}
          placeholder="sk-ant-..."
          placeholderTextColor={theme.textMuted}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <Pressable onPress={onToggleShow} hitSlop={12}>
          <Text style={{ color: theme.textMuted, fontSize: 16 }}>
            {showKey ? '🙈' : '👁'}
          </Text>
        </Pressable>
      </View>
    </View>
  )
}
```

- [ ] **Step 4: Run tests to verify no regressions**

```bash
npx jest --no-coverage
```

Expected: All tests pass

- [ ] **Step 5: Commit**

```bash
git add app/settings.tsx
git commit -m "feat: add AI section with Anthropic API key field to Settings"
```

---

### Task 10: Nutrition Screen Wiring

**Files:**
- Modify: `app/(tabs)/nutrition.tsx`

- [ ] **Step 1: Add scanner imports**

At the top of `app/(tabs)/nutrition.tsx`, add after the existing imports:

```ts
import { ScannerSheet } from '../../components/scanner/ScannerSheet'
import { PhotoScanner } from '../../components/scanner/PhotoScanner'
import { BarcodeScanner } from '../../components/scanner/BarcodeScanner'
import { ScanConfirmModal } from '../../components/scanner/ScanConfirmModal'
import { loadApiKey } from '../../stores/apiKeyStore'
import { ScanResult } from '../../lib/scanTypes'
```

- [ ] **Step 2: Add scanner state to `NutritionScreen`**

Inside `NutritionScreen`, after `const [showAddMeal, setShowAddMeal] = useState(false)` (line 45), add:

```ts
const [showScanner, setShowScanner] = useState(false)
const [showPhoto, setShowPhoto] = useState(false)
const [showBarcode, setShowBarcode] = useState(false)
const [scanResult, setScanResult] = useState<ScanResult | null>(null)
const apiKey = loadApiKey()
```

- [ ] **Step 3: Update `AddMealButtonSection` call in the JSX**

Inside `NutritionScreen`'s return, replace:

```tsx
        <AddMealButtonSection onPress={() => setShowAddMeal(true)} />
        <AISuggestionSection />
```

With:

```tsx
        <AddMealButtonSection
          onAddMeal={() => setShowAddMeal(true)}
          onScan={() => setShowScanner(true)}
        />
```

- [ ] **Step 4: Add scanner modals to the return fragment**

In `NutritionScreen`'s return, after the existing `<AddMealModal ... />` block, add:

```tsx
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
        onSave={(entry) => { handleAddEntry(entry); setScanResult(null) }}
        onRetake={() => { setScanResult(null); setShowScanner(true) }}
      />
```

- [ ] **Step 5: Rewrite `AddMealButtonSection` to include the camera button**

Replace the entire `AddMealButtonSection` function (currently lines 279–286):

```tsx
function AddMealButtonSection({
  onAddMeal,
  onScan,
}: {
  onAddMeal: () => void
  onScan: () => void
}) {
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
```

- [ ] **Step 6: Remove `AISuggestionSection`**

Delete the entire `AISuggestionSection` function (currently lines 288–302):

```tsx
function AISuggestionSection() {
  const { theme } = useTheme()
  const { animatedStyle } = useFadeSlideIn(6)
  return (
    <Animated.View style={[{ marginTop: spacing.lg }, animatedStyle]}>
      <TierGate requiredTier="Premium_AI">
        <Card>
          <Text style={{ color: theme.textMuted, fontSize: fontSize.xs, fontWeight: '600', letterSpacing: 0.8 }}>
            AI MEAL SUGGESTION
          </Text>
        </Card>
      </TierGate>
    </Animated.View>
  )
}
```

Also remove the unused `Card` import if it's no longer referenced anywhere else in nutrition.tsx. Check by searching for other `<Card` usages — if `MacroBarsSection` and `EntryListSection` still use it, keep the import.

`AISuggestionSection` used `useFadeSlideIn(6)`. After removing it, `useFadeSlideIn` is still used by other sections so keep that import. The `TierGate` import is still used by the camera button in `AddMealButtonSection`, so keep it too.

- [ ] **Step 7: Run full test suite**

```bash
npx jest --no-coverage
```

Expected: All tests pass

- [ ] **Step 8: Commit**

```bash
git add app/(tabs)/nutrition.tsx
git commit -m "feat: wire AI food scanner into Nutrition screen"
```
