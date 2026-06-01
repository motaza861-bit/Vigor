# Vigor Phase 3 — Foundational Polish

## Goal

Add user profile with auto-calculated TDEE, swipe-based day navigation across Nutrition and Workout screens, and full workout quality-of-life controls (rename, delete, drag-to-reorder exercises and sets).

## Architecture

Three independent subsystems. Profile feeds into nutrition targets. Day navigation is shared via a hook. Workout QoL is isolated to the Workout screen.

## File Map

| File | Role |
|---|---|
| `stores/profileStore.ts` | New — UserProfile type, load/save, calculateTargets |
| `hooks/useDayNavigator.ts` | New — swipe gesture, selected date, dot data |
| `__tests__/profileStore.test.ts` | New — unit tests for profile CRUD and TDEE calc |
| `__tests__/useDayNavigator.test.ts` | New — unit tests for date navigation logic |
| `stores/nutritionStore.ts` | Modify — getDefaultTargets() uses profile when set |
| `app/settings.tsx` | Modify — add Profile section |
| `app/(tabs)/nutrition.tsx` | Modify — wire useDayNavigator, load by selected date |
| `app/(tabs)/workout.tsx` | Modify — wire useDayNavigator, rename/delete/reorder |

---

## Subsystem 1: User Profile + TDEE

### Data Model

```ts
// stores/profileStore.ts
type Sex = 'male' | 'female'
type Goal = 'cut' | 'maintain' | 'bulk'

type UserProfile = {
  name?: string
  age?: number      // years
  weight?: number   // kg
  height?: number   // cm
  sex?: Sex
  goal?: Goal
}
```

MMKV key: `profile:user`. Lazy initialisation pattern (same as other stores).

### TDEE Calculation

Uses **Mifflin-St Jeor** formula at moderate activity (×1.55):

```
BMR (male)   = 10 × weight + 6.25 × height − 5 × age + 5
BMR (female) = 10 × weight + 6.25 × height − 5 × age − 161
TDEE = BMR × 1.55
```

Goal adjustments applied to TDEE:
- `cut`: −500 kcal
- `maintain`: ±0
- `bulk`: +300 kcal

Macro split from final calorie target:
- Protein: `Math.round(weight_kg × 2.2)` g
- Fat: `Math.round((calories × 0.25) / 9)` g
- Carbs: `Math.round((calories − protein × 4 − fat × 9) / 4)` g

`calculateTargets(profile: UserProfile): MacroTotals | null` — returns null if any of age, weight, height, sex, or goal is missing.

### Exported functions

```ts
export function loadProfile(): UserProfile
export function saveProfile(profile: UserProfile): void
export function calculateTargets(profile: UserProfile): MacroTotals | null
```

### nutritionStore change

Replace the hardcoded `DEFAULT_TARGETS` constant with a `getDefaultTargets()` function:

```ts
function getDefaultTargets(): MacroTotals {
  const profile = loadProfile()
  const calculated = profile ? calculateTargets(profile) : null
  return calculated ?? { calories: 2400, protein: 180, carbs: 240, fat: 60 }
}
```

`loadDayLog` calls `getDefaultTargets()` when no stored log exists. Public API is unchanged.

### Settings Profile Section

New section in `app/settings.tsx`, inserted between Appearance and the dev tier switcher. Fields:

- **Name** — single-line TextInput
- **Sex** — two-button toggle: Male / Female
- **Goal** — three-button toggle: Cut / Maintain / Bulk
- **Age / Weight (kg) / Height (cm)** — three numeric TextInputs in a row

Each field saves immediately on change via `saveProfile({ ...loadProfile(), [field]: value })`. No explicit Save button. Calculated targets display as a read-only summary line below the inputs: e.g. "~2 340 kcal · 176P · 195C · 65F" — updates reactively as fields change.

---

## Subsystem 2: Day Navigation

### Hook

```ts
// hooks/useDayNavigator.ts
export function useDayNavigator(getHasData: (date: string) => boolean): {
  selectedDate: string      // YYYY-MM-DD
  dayOffset: number         // 0 = today, −1 = yesterday, …
  formattedLabel: string    // "Today" | "Yesterday" | "Jun 3"
  gesture: PanGesture
  dotDates: string[]        // last 7 dates, oldest first, newest last
}
```

**Date bounds:** `dayOffset` is clamped to `[−89, 0]` — can't navigate into the future, can't go back more than 90 days (matches the data window used in Progress).

**Swipe logic:**
- Swipe left (negative `translationX` < −50): `dayOffset -= 1` (go to older day)
- Swipe right (positive `translationX` > 50): `dayOffset += 1` (go to newer day, capped at 0)
- Uses `Gesture.Pan().onEnd().runOnJS(true)` from `react-native-gesture-handler`

**`formattedLabel`:**
- offset 0 → "Today"
- offset −1 → "Yesterday"
- all others → formatted as "Jun 3", "May 28", etc. using local date parts

### Dot Row

Rendered in each screen, not in the hook. The hook provides `dotDates` (7 strings). The screen renders:

```
● ○ ● ○ ○ ● ●   ← filled = has data (accent), hollow = no data (border)
                  today's dot has a 1px accent ring; selected date dot is 2px larger
```

### Screen Integration

**Nutrition:**
```ts
const { selectedDate, gesture, formattedLabel, dotDates } = useDayNavigator(
  (date) => loadDayLog(date).entries.length > 0
)
// selectedDate replaces todayISO() everywhere in the screen
```

**Workout:**
```ts
const { selectedDate, gesture, formattedLabel, dotDates } = useDayNavigator(
  (date) => loadWorkoutLog(date) !== null
)
```

Both screens wrap their root `ScrollView` content in `<GestureDetector gesture={gesture}>`. The date label (formattedLabel) and dot row sit above the existing header content.

---

## Subsystem 3: Workout Quality-of-Life

All changes are in `app/(tabs)/workout.tsx`. No new files.

### Rename Exercises

- Add `editingId: string | null` state to `WorkoutScreen`
- In `ExerciseCard`, replace the name `Text` with a `TextInput` when `editingId === exercise.id`
- `onPress` on the name → set `editingId = exercise.id`
- `onBlur` / `onSubmitEditing` → save name, set `editingId = null`
- Empty string on submit → revert to previous name

### Delete Sets

- `SetRowView` gets a trash icon button (`✕`) as a fourth column, always visible
- Tapping it calls a new `removeSet(exerciseIndex, setIndex)` handler
- Removing a set triggers auto-save via the existing `exercises` state effect

### Delete Exercises

- `ExerciseCard` header row gets a trash icon (small, muted, top-right)
- Tapping it calls `removeExercise(exerciseIndex)`
- Immediate deletion, no confirmation dialog

### Drag-to-Reorder Exercises

- Each `ExerciseCard` gets a `≡` drag handle on its left edge
- A `dragState` ref tracks `{ active: boolean; index: number; startY: number; currentY: number }`
- `scrollEnabled` state on the `ScrollView` is set to `false` while dragging
- The dragged card renders at an elevated `zIndex` with a slight scale (1.02) via Reanimated `useSharedValue`
- On drag end, the exercises array is re-sorted: final position determines new index (threshold = half card height, estimated at 80px)
- Uses `Gesture.Pan()` on the drag handle, with `.onStart`, `.onChange`, `.onEnd`

---

## Testing

### profileStore tests
- `loadProfile` returns empty object when no data
- `saveProfile` / `loadProfile` round-trip
- `calculateTargets` returns null when fields missing
- `calculateTargets` returns correct macros for a known input (male, 80kg, 180cm, 25yo, maintain)
- `getDefaultTargets` falls back to 2400/180/240/60 when no profile

### useDayNavigator tests
- Initial `selectedDate` equals `todayISO()`
- Simulated swipe left decrements `dayOffset`
- Simulated swipe right increments `dayOffset`, clamped at 0
- `dayOffset` clamped at −89
- `formattedLabel` returns "Today" at offset 0, "Yesterday" at −1
- `dotDates` has length 7, last entry is today

### nutritionStore tests (additions)
- `loadDayLog` uses profile-derived targets when profile is complete
- `loadDayLog` falls back to hardcoded defaults when profile is missing fields

---

## Non-Goals

- AI-generated meal or workout suggestions (Phase 4)
- Cloud sync or multi-device (not in scope)
- Imperial unit support (metric only)
- Onboarding flow / forced profile setup (profile is optional)
