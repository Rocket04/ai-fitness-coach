# Session: 2026-05-30 — Exercise Set Tracking Implementation

## Цель
Implement Subtask 1 from the exercise-tracking swarm plan: per-set completion tracking with best-practice UX (checkboxes, reps input, progress bar).

## Что сделано

### Phase 1 — Audit
Traced the full workout flow: TodayPage → ExerciseCard → updateSetResult → handleToggleTraining → saveSession.
Identified 6 gaps: plannedSets hardcoded to 0, no reps input, uncheck doesn't update store, etc.

### Phase 2 — UX Design
Designed the set-tracking interaction modeled after Strong/Hevy:
- One row per set with checkbox + reps input + RPE slider
- Progress bar at top of exercise list
- APRE exercises keep their 4-set AMRAP layout unchanged

### Phase 3 — Implementation
- **types.ts**: Updated `SetResult` (repsDone optional, added weight) and `ExerciseResult` (sets: SetResult[] replacing repsPerSet/rpePerSet arrays)
- **ExerciseCard.jsx**: Added reps input per set, fixed uncheck to call onSetComplete with completed:false, added reps input field
- **useAppStore.ts**: Fixed plannedSets:0 → counts from sessionPlan.exercises, updated ExerciseResult building to use new sets format
- **TodayPage.jsx**: Added progress indicator bar, updated onSetComplete callback signature, added pendingSetResults destructure
- **completionRate.test.ts**: Updated test objects to use new ExerciseResult format
- **TodayPage.test.tsx**: Added pendingSetResults/updateSetResult/postSessionFatigue/pain to mock
- **New test**: `js/tests/core/exerciseTracking.test.ts` (9 tests for SetResult, ExerciseResult, Session structure)
- **Docs**: Created `docs/domains/core/README.md` with data flow documentation

### Phase 4 — Verification
- type-check: pass (0 errors)
- tests: 427 passed, 0 failed (39 files)

## Решения
- Kept `pendingSetResults` as flat array with replace-by-key semantics (exerciseName + setNumber)
- `ExerciseResult.sets` replaces the old `repsPerSet` + `rpePerSet` format for cleaner data model
- onSetComplete callback signature changed to `(exName, setNum, completed, repsDone, rpe?)`

---

## Subtask 2 — Weekly Plan Adaptation (2026-05-30)

### Changes
- **analytics.ts**: Added `calculateWeeklyCompletionRate(sessions, weekStart)` — filters sessions by 7-day window, sums plannedSets/completedSets from exerciseResults, returns 0-1 ratio. Handles empty arrays, missing exerciseResults, division by zero.
- **analytics.test.ts**: Added 5 tests for `calculateWeeklyCompletionRate` — empty sessions, no exerciseResults, 100% completion, 50% completion, date boundary filtering.
- **planning.test.ts**: Added 5 tests for existing `getVolumeMultiplierFromAdherence` — 0.85→1.2, 0.8→1.2, 0.6→1.0, 0.4→0.8, 0→0.8.

### Verification
- type-check: pass (0 errors)
- tests: 437 passed, 0 failed (39 files)
