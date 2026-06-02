# Vigor Phase 4 — AI Food Scanner

## Goal

Add a camera-based food scanner to the Nutrition screen. Users can photograph a meal (Claude identifies macros) or scan a barcode (Open Food Facts looks up the product). Both paths land on a shared confirmation form before logging.

## Architecture

Five independent units: `apiKeyStore` (persistence), `claudeVision` (photo API), `openFoodFacts` (barcode API), scanner UI components (sheet + two camera screens + confirm modal), and wiring changes to nutrition.tsx and settings.tsx.

## File Map

| File | Role |
|---|---|
| `stores/apiKeyStore.ts` | New — load/save Anthropic API key from MMKV |
| `lib/scanTypes.ts` | New — `ScanResult` type and `ScanError` class shared across scanner |
| `lib/claudeVision.ts` | New — base64 image → Claude API → `ScanResult` |
| `lib/openFoodFacts.ts` | New — barcode string → Open Food Facts → `ScanResult` |
| `components/scanner/ScannerSheet.tsx` | New — bottom modal: Photo vs Barcode choice |
| `components/scanner/PhotoScanner.tsx` | New — full-screen camera, capture, Claude call |
| `components/scanner/BarcodeScanner.tsx` | New — full-screen camera, live barcode detection, OFF call |
| `components/scanner/ScanConfirmModal.tsx` | New — pre-filled confirmation form shared by both paths |
| `__tests__/apiKeyStore.test.ts` | New — unit tests for key persistence |
| `__tests__/claudeVision.test.ts` | New — unit tests for photo API parsing |
| `__tests__/openFoodFacts.test.ts` | New — unit tests for barcode API parsing |
| `app/(tabs)/nutrition.tsx` | Modify — camera button in action row, wire scanner flow |
| `app/settings.tsx` | Modify — new AI section with API key field |

---

## Shared Type

```ts
// used in lib/claudeVision.ts, lib/openFoodFacts.ts, components/scanner/*
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
  }
}
```

Define `ScanResult` and `ScanError` in `lib/scanTypes.ts` so all consumers import from one place.

---

## Subsystem 1: API Key Store

MMKV id `'api-keys'`, key `'anthropic'`. Lazy-init pattern (same as other stores).

```ts
// stores/apiKeyStore.ts
export function loadApiKey(): string   // returns '' when unset
export function saveApiKey(key: string): void
```

---

## Subsystem 2: Claude Vision

```ts
// lib/claudeVision.ts
export async function claudeVision(base64Jpeg: string, apiKey: string): Promise<ScanResult>
```

Uses `fetch` directly (no SDK — avoids React Native polyfill issues).

**Request:**
- POST `https://api.anthropic.com/v1/messages`
- Headers: `x-api-key: {apiKey}`, `anthropic-version: 2023-06-01`, `content-type: application/json`
- Model: `claude-haiku-4-5-20251001`
- System: `"You are a nutrition analysis assistant. Respond with only a JSON object: { name, calories, protein, carbs, fat }. Estimate for a single typical serving. Use integers only."`
- User message: image content block (`type: "image"`, `source.type: "base64"`, `source.media_type: "image/jpeg"`) + text `"What food is this and what are its macros?"`

**Response parsing:**
- Extract the first `{...}` block from `content[0].text` using a regex
- `JSON.parse` the block; validate all five fields are numbers
- If parsing fails → `throw new ScanError('parse_failed')`
- If response status is not 2xx → `throw new ScanError('api_error')`
- If fetch rejects → `throw new ScanError('network_error')`

---

## Subsystem 3: Open Food Facts

```ts
// lib/openFoodFacts.ts
export async function openFoodFacts(barcode: string): Promise<ScanResult>
```

GET `https://world.openfoodfacts.org/api/v0/product/{barcode}.json`

**Response parsing:**
- If `response.status === 0` → `throw new ScanError('not_found')`
- Extract from `product.nutriments`: `energy-kcal_100g`, `proteins_100g`, `carbohydrates_100g`, `fat_100g`
- Serving size: use `product.serving_quantity` (grams) if present, otherwise 100g
- Scale all values: `Math.round(value_per_100g * servingGrams / 100)`
- Product name: `product.product_name` (fallback to `product.generic_name` if empty)
- If fetch rejects → `throw new ScanError('network_error')`

---

## Subsystem 4: Scanner UI Components

### ScannerSheet

Bottom modal. Same visual style as `AddMealModal` (surface background, rounded top corners, padding).

- Title: "Add from Scanner"
- Two full-width ghost buttons: "📷  Take Photo" and "⬛  Scan Barcode"
- "Cancel" text button below
- Props: `visible`, `onPhoto`, `onBarcode`, `onClose`

### PhotoScanner

Full-screen modal. Uses `expo-camera` (`CameraView`).

- Live camera viewfinder fills screen
- Top-left: "✕" cancel button
- Bottom bar: large circular capture button (centered)
- States:
  - **idle** — capture button active
  - **processing** — button replaced with `ActivityIndicator`, label "Identifying food…"
  - **error** — red banner below viewfinder with message + "Try Again" button
- On capture: take photo as base64 JPEG (`quality: 0.6` to reduce payload) → call `claudeVision`
- On success: call `onResult(scanResult)` → parent closes PhotoScanner, opens ScanConfirmModal
- Requires `CAMERA` permission; if denied, shows permission prompt instead of viewfinder
- No API key set: shows "Add your Anthropic API key in Settings" error state immediately (before opening camera)
- Props: `visible`, `apiKey`, `onResult`, `onClose`

### BarcodeScanner

Full-screen modal. Uses `expo-camera` (`CameraView`) with `barcodeScannerSettings`.

- Live viewfinder fills screen
- Overlay: thin rectangular targeting frame centered (visual guide only, no crop logic)
- Label below frame: "Point at a barcode"
- Top-left: "✕" cancel button
- Bottom-right: "📷 Take Photo instead" — closes BarcodeScanner, opens PhotoScanner
- States:
  - **scanning** — live detection active
  - **fetching** — detection paused, spinner + "Looking up product…"
  - **error** — inline error message below frame + "Try Again" button (re-enables detection)
- On barcode detected: pause detection (to prevent double-fire), call `openFoodFacts(barcode)`
- On success: call `onResult(scanResult)`
- Not found: show "Product not found — add manually" with dismiss; re-enable detection
- Props: `visible`, `onResult`, `onPhotoFallback`, `onClose`

### ScanConfirmModal

Bottom modal. Visually identical to `AddMealModal`.

- Title: "Confirm Meal"
- Pre-filled fields: Name (text), Calories (numeric), Protein (numeric), Carbs (numeric), Fat (numeric)
- Button row: "Retake / Rescan" (ghost) + "Save" (primary)
- "Retake / Rescan" calls `onRetake()` → parent re-opens ScannerSheet
- "Save" calls `onSave(entry)` — same `Omit<FoodEntry, 'id'>` shape as AddMealModal
- Props: `visible`, `result`, `onSave`, `onRetake`

---

## Subsystem 5: Screen Integration

### nutrition.tsx changes

`AddMealButtonSection` becomes a two-button row:
```tsx
<View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm }}>
  <View style={{ flex: 1 }}>
    <Button label="+ Add Meal" variant="primary" fullWidth onPress={onAddMeal} />
  </View>
  <TierGate requiredTier="Premium_AI" variant="coming-soon">
    <Pressable
      onPress={onScan}
      style={{
        width: 48, height: 48, borderRadius: radius.md,
        borderWidth: 1, borderColor: theme.border,
        alignItems: 'center', justifyContent: 'center',
      }}
    >
      <Text style={{ fontSize: 20 }}>📷</Text>
    </Pressable>
  </TierGate>
</View>
```

Scanner state managed in `NutritionScreen`:
```ts
const [showScanner, setShowScanner] = useState(false)
const [showPhoto, setShowPhoto] = useState(false)
const [showBarcode, setShowBarcode] = useState(false)
const [scanResult, setScanResult] = useState<ScanResult | null>(null)
const apiKey = loadApiKey()
```

Flow:
1. Camera button → `setShowScanner(true)`
2. "Take Photo" → `setShowScanner(false); setShowPhoto(true)`
3. "Scan Barcode" → `setShowScanner(false); setShowBarcode(true)`
4. Scanner result → `setShowPhoto/Barcode(false); setScanResult(result)`
5. `scanResult !== null` → `ScanConfirmModal` visible
6. Confirm Save → `handleAddEntry(entry); setScanResult(null)`
7. Retake → `setScanResult(null); setShowScanner(true)`

Remove the existing "AI MEAL SUGGESTION" placeholder card (`AISuggestionSection`).

### settings.tsx changes

New section "AI" inserted between Profile and Appearance:
- Section label: "AI"
- API key field: password-style `TextInput` (secureTextEntry)
- Show/hide toggle: eye icon Pressable to toggle `secureTextEntry`
- Saves on blur via `saveApiKey(value.trim())`
- Muted note below: "Required for photo food scanning"

State:
```ts
const [apiKey, setApiKey] = useState(() => loadApiKey())
const [showKey, setShowKey] = useState(false)
```

---

## New Package

```bash
npx expo install expo-camera
```

No other new packages. `expo-camera` handles both photo capture and barcode scanning. Plain `fetch` for both APIs.

---

## Testing

### apiKeyStore tests
- `loadApiKey` returns `''` when unset
- `saveApiKey` / `loadApiKey` round-trip

### claudeVision tests (mock fetch)
- Happy path: valid JSON in response text → returns `ScanResult`
- Parse failure: malformed response text → throws `ScanError('parse_failed')`
- API error: fetch returns 401 → throws `ScanError('api_error')`
- Network error: fetch rejects → throws `ScanError('network_error')`

### openFoodFacts tests (mock fetch)
- Happy path with `serving_quantity`: scales macros correctly
- Happy path without `serving_quantity`: defaults to 100g
- Not found (`status: 0`) → throws `ScanError('not_found')`
- Network error: fetch rejects → throws `ScanError('network_error')`

No camera component tests (require native modules unavailable in Jest).

---

## Non-Goals

- Meal history / scan history log
- Portion size slider (user edits the number directly in confirm modal)
- Multiple items in one photo
- Offline barcode database
