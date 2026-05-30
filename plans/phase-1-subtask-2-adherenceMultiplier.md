# SUBTASK 2 — adherenceMultiplier in planning.ts + tests

**Working directory:** `C:\Projects\fitness-tracker`

**Prerequisite:** Subtask 0 (types.ts changes) must be completed first.

## Task

Add `getVolumeMultiplierFromAdherence()` to `js/core/planning.ts` and modify `getAdaptedSessionForDate()` to accept an optional volume multiplier. Create test file `js/tests/core/adherenceMultiplier.test.ts`.

## File 1: Modify `js/core/planning.ts`

### New function to add (exported):

```typescript
/**
 * Returns a volume multiplier based on the user's weekly exercise completion rate.
 * @param completionRate - 0.0 to 1.0 (ratio of completed sets to planned sets)
 * @returns Multiplier for planned sets: ≥0.8 → 1.2, ≥0.6 → 1.0, <0.6 → 0.8
 */
export function getVolumeMultiplierFromAdherence(completionRate: number): number {
  // implementation
}
```

Logic:
- ≥ 0.8 → return 1.2 (+20% volume)
- ≥ 0.6 → return 1.0 (maintain)
- < 0.6 → return 0.8 (-20% volume)

### Modify `getAdaptedSessionForDate()` signature:

Add optional parameter at the end:
```typescript
volumeMultiplier: number = 1.0
```

Inside the function, after generating the exercises array but before returning, apply the multiplier:
- For each exercise, parse the sets value (`ex.s`)
- Multiply by `volumeMultiplier`, round to nearest integer with `Math.round()`
- Minimum 1 set
- Update `ex.s` with the new value (as a string)
- Track modification reason in the `modifications` array: e.g., `"Adherence-based volume: 1.2x (completion 85%)"`

### Do NOT modify `computeDerived()` in useAppStore.ts — that's a separate subtask.

## File 2: `js/tests/core/adherenceMultiplier.test.ts` (NEW)

Test `getVolumeMultiplierFromAdherence()` with boundary values:
- `0.85` → 1.2
- `0.8` → 1.2 (boundary)
- `0.79` → 1.0
- `0.6` → 1.0 (boundary)
- `0.59` → 0.8
- `0` → 0.8
- `1.0` → 1.2
- `-0.1` → 0.8 (edge case: clamp or handle)
- `1.5` → 1.2 (edge case: clamp or handle)

Import from `'../core/planning.js'` (test file is in `tests/core/`).

## Important rules
- Do NOT modify `useAppStore.ts`
- Do NOT modify `computeDerived()`
- Only add the new function and modify `getAdaptedSessionForDate` signature + body
- Ensure the export is added at planning.ts export level if needed

## Verification
```powershell
cd C:\Projects\fitness-tracker; npm test -- --reporter=verbose 2>&1 | Select-String "adherenceMultiplier"
```
Tests must appear and pass. Also run `npm run type-check` — must be 0 errors.
