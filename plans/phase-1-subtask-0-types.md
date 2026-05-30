# SUBTASK 0 — Extend Session type (PREREQUISITE, run first)

**Working directory:** `C:\Projects\fitness-tracker`

## Task

Modify `js/core/types.ts` to add fields to the `Session` interface for exercise-level result tracking.

## Changes

1. In the `Session` interface (after `apreResults` field, around line 166), add:
```typescript
/** Results of non-APRE exercises (set completion tracking) */
exerciseResults?: ExerciseResult[];
/** User-reported fatigue after training (1-10 scale, optional) */
postSessionFatigue?: number;
/** User-reported pain after training (0-10 scale, optional) */
postSessionPain?: number;
/** Total planned sets for this session (computed at plan generation, used for completion rate) */
plannedTotalSets?: number;
```

2. In the `AppDispatch` interface (add after the last existing action declaration), add:
```typescript
updateSetResult: (result: SetResult) => void;
setPostSessionFatigue: (v: number) => void;
setPostSessionPain: (v: number) => void;
```

## Important rules
- Do NOT add any other changes
- Do NOT modify any other files
- `SetResult` type already exists in types.ts (line 118)
- `ExerciseResult` type already exists in types.ts (line 125)

## Verification
Run from project root:
```powershell
cd C:\Projects\fitness-tracker; npm run type-check
```
Must pass with 0 errors.
