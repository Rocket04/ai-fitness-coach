# SUBTASK 3 — Store: pendingSetResults + actions

**Working directory:** `C:\Projects\fitness-tracker`

**Prerequisite:** Subtask 0 (types.ts changes) must be completed first.

## Task

Modify `js/stores/useAppStore.ts` to add state and actions for tracking per-set exercise completion during a workout session.

## Changes to `js/stores/useAppStore.ts`

### 1. Add to `AppStore` interface (after existing fields):

In the **Session form** section (after `pendingApreResults`):
```typescript
/** Accumulated set completions during current workout UI session, not yet saved to Dexie */
pendingSetResults: SetResult[];
/** User-reported fatigue after training (1-10) */
postSessionFatigue: number;
/** User-reported pain after training (0-10) */
postSessionPain: number;
```

In the **Actions** section (after `updateApreResult`):
```typescript
updateSetResult: (result: SetResult) => void;
setPostSessionFatigue: (v: number) => void;
setPostSessionPain: (v: number) => void;
```

### 2. Add initial values in the store creator (after `pendingApreResults: []`):
```typescript
pendingSetResults: [],
postSessionFatigue: 0,
postSessionPain: 0,
```

### 3. Add action implementations (after `updateApreResult` action):

```typescript
updateSetResult: (result: SetResult) => {
  const { pendingSetResults } = get();
  // Build a composite key from exerciseName (stored in a wrapper) or use a separate lookup
  // Since SetResult doesn't have exerciseName, we need to add it or use a different approach.
  // SIMPLEST APPROACH: pendingSetResults is just an array, and the UI component
  // manages per-exercise state. When onSetComplete fires, push a SetResult + we
  // also need exerciseName. So change the approach:
  // Instead, use a different structure. See below.
  const updated = [...pendingSetResults, result];
  set({ pendingSetResults: updated });
},
setPostSessionFatigue: (v: number) => set({ postSessionFatigue: v }),
setPostSessionPain: (v: number) => set({ postSessionPain: v }),
```

**IMPORTANT NOTE on design:** The `SetResult` type has `setNumber`, `completed`, `repsDone` but NO `exerciseName` field. Since `updateSetResult` receives a `SetResult` and the store needs to know which exercise it belongs to, the callback from ExerciseCard should include exerciseName. You have two options:

**Option A (preferred):** Add `exerciseName?: string` as an optional field to `SetResult` interface in types.ts (this means types.ts needs this small addition — if Subtask 0 already ran and didn't add it, add it here as a small additive change that won't conflict).

**Option B:** Create a wrapper type for the store: `pendingSetResults: Array<{ exerciseName: string; sets: SetResult[] }>`.

Use **Option A** — it's simpler and avoids restructuring. Add `exerciseName?: string` to the `SetResult` interface inline here.

### 4. Modify `updateSetResult` to upsert by exerciseName + setNumber:
```typescript
updateSetResult: (result: SetResult) => {
  const { pendingSetResults } = get();
  const existing = pendingSetResults.findIndex(
    r => r.exerciseName === result.exerciseName && r.setNumber === result.setNumber
  );
  if (existing >= 0) {
    const updated = [...pendingSetResults];
    updated[existing] = result;
    set({ pendingSetResults: updated });
  } else {
    set({ pendingSetResults: [...pendingSetResults, result] });
  }
},
```

### 5. Modify `handleToggleTraining` action:

In the save branch (when creating the session object), add logic to compute `ExerciseResult[]` from `pendingSetResults`:

Inside `handleToggleTraining`, after the session object is built, before saving:

```typescript
// Group pendingSetResults by exerciseName to build ExerciseResult[]
const exerciseResultMap: Record<string, { completedSets: number; repsPerSet: number[] }> = {};
for (const sr of s.pendingSetResults) {
  const name = sr.exerciseName || 'unknown';
  if (!exerciseResultMap[name]) {
    exerciseResultMap[name] = { completedSets: 0, repsPerSet: [] };
  }
  if (sr.completed) {
    exerciseResultMap[name].completedSets += 1;
    exerciseResultMap[name].repsPerSet.push(sr.repsDone);
  }
}
const exerciseResults: typeof import('../core/types.js').ExerciseResult[] = Object.entries(exerciseResultMap).map(([exerciseName, data]) => ({
  exerciseName,
  plannedSets: 0,  // Will be filled from plan lookup if available, else 0
  completedSets: data.completedSets,
  repsPerSet: data.repsPerSet,
  completed: data.completedSets > 0,
}));
```

Then include in the session object:
```typescript
...(exerciseResults.length > 0 && { exerciseResults }),
...(s.postSessionFatigue > 0 && { postSessionFatigue: s.postSessionFatigue }),
...(s.postSessionPain > 0 && { postSessionPain: s.postSessionPain }),
```

After save, clear:
```typescript
pendingSetResults: [],
postSessionFatigue: 0,
postSessionPain: 0,
```

## Important rules
- Do NOT touch types.ts if Subtask 0 already added exerciseName to SetResult
- If types.ts does NOT have exerciseName on SetResult, add `exerciseName?: string` to the SetResult interface in types.ts as part of this subtask
- Do NOT modify any other files
- Import `SetResult` from `../core/types.js` (already imported if `ApreExerciseResult` is imported — check existing imports)

## Verification
```powershell
cd C:\Projects\fitness-tracker; npm run type-check
```
Must pass with 0 errors.
