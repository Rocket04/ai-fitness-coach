# Phase 1 Plan: Exercise Tracking Loop → Plan Adaptation

**Goal:** Close the user's loop: perform workout → record set results → next week's plan adapts automatically.

---

## Current State Assessment

The codebase already has:
- `SetResult` and `ExerciseResult` types in `types.ts` (defined but not connected to Session)
- `Session.apreResults` field stores APRE exercise results (partially implemented)
- `ExerciseCard` component already captures AMRAP set3/set4 reps via `onApreResult` callback → stored in `pendingApreResults` in store
- `handleToggleTraining` saves `pendingApreResults` into `Session.apreResults`
- `loadAdjustments.ts` has `getWeeklyMultiplier()` using readiness status, NOT exercise completion data

**Key gap:** Non-APRE exercises have no set-level tracking. The store tracks APRE results but not generic set completion. The weekly multiplier uses readiness, not actual set completion rate. The plan doesn't adapt based on how many sets/reps the user actually completed.

---

## Tasks

### Task 1: Extend Session type with exercise results field

**File:** `js/core/types.ts`

- Add `exerciseResults?: ExerciseResult[]` to the `Session` interface (after `apreResults` field)
- Add `postSessionFatigue?: number` (1-10) and `postSessionPain?: number` (0-10) to capture how the user felt after training
- Add `plannedTotalSets?: number` (computed at plan generation time) for completion rate calculation

### Task 2: ExerciseCard — add per-set completion checkboxes for non-APRE exercises

**File:** `js/ui/components/ExerciseCard.jsx`

- Add `onSetComplete?: (exName: string, setNumber: number, completedReps: number) => void` prop
- For non-APRE exercises: render one checkbox per planned set (from `ex.s` field)
- Each checkbox shows: set number, planned reps (from `ex.r`), weight (from `ex.w` if present)
- On check: call `onSetComplete(ex.n, setNumber, plannedReps)`
- For APRE exercises: keep existing AMRAP input behavior (already works)

### Task 3: Add `pendingSetResults` to store + `updateSetResult` action

**File:** `js/stores/useAppStore.ts`

**State additions:**
- `pendingSetResults: SetResult[]` — accumulated set completions for the current workout UI session
- `postSessionFatigue: number` — user-reported fatigue after training (default 0)
- `postSessionPain: number` — user-reported pain after training (default 0)

**Action additions:**
- `updateSetResult(result: SetResult)` — upsert into `pendingSetResults` keyed by exercise name + set number
- `setPostSessionFatigue(v: number)` / `setPostSessionPain(v: number)` — form setters

**In `handleToggleTraining`:**
- On save: compute `ExerciseResult[]` from `pendingSetResults`, attach to `Session.exerciseResults`
- Attach `postSessionFatigue` and `postSessionPain` to Session
- Clear `pendingSetResults` after save

### Task 4: Compute completion rate from exercise results

**New file:** `js/core/completionRate.ts`

Pure functions (testable):
- `calculateSessionCompletionRate(session: Session, plan: SessionPlan): number` — ratio of completed sets to planned sets (0.0–1.0)
- `calculateWeeklyCompletionRate(sessions: Session[], plans: SessionPlan[], weekStartISO: string): number` — average completion rate across sessions in a given week

Exports:
```typescript
export { calculateSessionCompletionRate, calculateWeeklyCompletionRate }
```

### Task 5: Volume multiplier based on adherence

**File:** `js/core/planning.ts`

Add function:
- `getVolumeMultiplierFromAdherence(completionRate: number): number`
  - ≥ 0.8 → 1.2 (+20% volume)
  - ≥ 0.6 → 1.0 (maintain)
  - < 0.6 → 0.8 (-20% volume)

Modify `getAdaptedSessionForDate()`:
- Accept optional `volumeMultiplier` parameter (default 1.0)
- Before generating exercises, apply multiplier to total sets:
  - Multiply each exercise's planned sets by the multiplier
  - Round to nearest integer, min 1 set
- OR: pass the multiplier through to `applyMultiplierToExercises()` if adaptable

**Integration in `computeDerived()`:**
- After getting `sessionPlan` for today, also compute `yesterdayPlan` (or last 7 days)
- Calculate `weeklyCompletionRate` from the past week's sessions
- Compute `volumeMultiplier` from completion rate
- Pass `volumeMultiplier` into `getAdaptedSessionForDate()` for tomorrow's plan generation

### Task 6: Unit tests

**New file:** `js/tests/core/completionRate.test.ts`
- `calculateSessionCompletionRate`: 100% when all sets completed, 0% when none, 50% partial
- `calculateWeeklyCompletionRate`: average across sessions, empty array returns 0
- Edge cases: session with no exerciseResults, plan with no exercises

**New file:** `js/tests/core/adherenceMultiplier.test.ts`
- `getVolumeMultiplierFromAdherence(0.85)` → 1.2
- `getVolumeMultiplierFromAdherence(0.8)` → 1.2 (boundary)
- `getVolumeMultiplierFromAdherence(0.6)` → 1.0 (boundary)
- `getVolumeMultiplierFromAdherence(0.59)` → 0.8
- `getVolumeMultiplierFromAdherence(0)` → 0.8
- `getVolumeMultiplierFromAdherence(1.0)` → 1.2

**Modified:** `js/tests/core/apre.test.ts`
- Add integration test: entering `set4Reps` in ExerciseCard logic → `nextWeekRM` changes per APRE tables

---

## File Change Summary

| File | Change |
|------|--------|
| `js/core/types.ts` | Add `exerciseResults`, `postSessionFatigue`, `postSessionPain` to Session |
| `js/ui/components/ExerciseCard.jsx` | Add per-set checkboxes for non-APRE, `onSetComplete` callback |
| `js/stores/useAppStore.ts` | Add `pendingSetResults`, `updateSetResult`, post-session fields, integrate into save |
| `js/core/completionRate.ts` | NEW — pure functions for session/weekly completion rate |
| `js/core/planning.ts` | Add `getVolumeMultiplierFromAdherence`, pass multiplier into session generation |
| `js/tests/core/completionRate.test.ts` | NEW — tests for completion rate functions |
| `js/tests/core/adherenceMultiplier.test.ts` | NEW — tests for volume multiplier |
| `js/tests/core/apre.test.ts` | Add integration test for APRE nextWeekRM |

## Verification

After all tasks:
1. `npm run type-check` — 0 errors
2. `npm test` — new tests pass, all existing still pass
3. Manual: TodayPage shows set checkboxes on non-APRE exercises, checking them and saving a session stores results

## Priority Order

Implement in this order to minimize breakage:
1. Task 1 (types) — no logic change
2. Task 4 (completionRate) — pure functions, testable in isolation
3. Task 6 (tests) — write tests for completionRate + adherenceMultiplier before implementing them
4. Task 5 (planning.ts) — implement `getVolumeMultiplierFromAdherence`
5. Task 3 (store) — add state + actions
6. Task 2 (ExerciseCard) — add UI checkboxes, wire to store
7. Task 6 (apre integration test)
