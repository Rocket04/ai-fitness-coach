# Core Domain — Set Tracking & Exercise Results

## Data Flow

```
ExerciseCard (checkboxes + reps input)
  → onSetComplete(exName, setNum, completed, repsDone, rpe)
  → store.updateSetResult(SetResult) → pendingSetResults[]
  → handleToggleTraining() → build ExerciseResult[] from pendingSetResults
  → saveSession(Session { exerciseResults })
  → clear pendingSetResults, pendingApreResults
```

## Types

### SetResult (`js/core/types.ts`)
Per-set tracking for both APRE and non-APRE exercises:
- `setNumber: number` — 1-based set index
- `completed: boolean` — whether the user marked the set done
- `repsDone?: number` — actual reps performed (user-editable input)
- `weight?: number` — weight used (optional, for future use)
- `exerciseName?: string` — which exercise this set belongs to
- `rpe?: number` — RPE for this set (1-10)

### ExerciseResult (`js/core/types.ts`)
Aggregated result for one exercise:
- `exerciseName: string`
- `plannedSets: number` — from SessionPlan exercises `s` field
- `completedSets: number` — count of `SetResult` with `completed: true`
- `sets: SetResult[]` — all per-set data
- `completed: boolean` — true if at least one set completed

Stored in `Session.exerciseResults?: ExerciseResult[]`.

## Store Integration

In `useAppStore.ts`:

1. `pendingSetResults: SetResult[]` — accumulates set-tracking events during a workout UI session
2. `updateSetResult(result: SetResult)` — replaces or appends a set result by `exerciseName + setNumber`
3. `handleToggleTraining()` — builds `ExerciseResult[]` by grouping `pendingSetResults` by `exerciseName`, computes `plannedSets` from `sessionPlan.exercises`, saves to `Session.exerciseResults`
4. After save: clears `pendingSetResults`, `pendingApreResults`, resets form fields

## UI Components

**ExerciseCard.jsx** (non-APRE exercises):
- Each set row: checkbox + reps input (pre-filled from planned reps) + RPE slider (shown after check)
- Checkbox toggle calls `onSetComplete(exName, setNum, completed, repsDone, rpe)`
- Unchecking a set sends `completed: false` to clear the store entry
- Reps input is editable after checking

**TodayPage.jsx** (progress indicator):
- Computes `{ total, completed }` from `sessionPlan.exercises` × `pendingSetResults`
- Shows progress bar: "Выполнено подходов: X из Y" with color (green=all done, yellow=partial)

## Test Coverage

- `js/tests/core/exerciseTracking.test.ts` — 9 tests covering SetResult structure, ExerciseResult structure, Session integration
- Existing store tests verify `updateSetResult` accumulation and `pendingSetResults` lifecycle
- `completionRate` tests use `sets` field (updated from old `repsPerSet` format)
