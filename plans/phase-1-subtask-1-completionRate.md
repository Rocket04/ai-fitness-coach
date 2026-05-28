# SUBTASK 1 — completionRate.ts module + tests

**Working directory:** `C:\Projects\fitness-tracker`

**Prerequisite:** Subtask 0 (types.ts changes) must be completed first.

## Task

Create a new pure-function module `js/core/completionRate.ts` and its test file `js/tests/core/completionRate.test.ts`.

## File 1: `js/core/completionRate.ts` (NEW)

Import types: `Session`, `SessionPlan`, `ExerciseResult`, `SetResult` from `./types.js`.

Export two pure functions:

### `calculateSessionCompletionRate(session: Session, plan: SessionPlan): number`

Calculates the ratio of completed sets to planned sets for a single session.

Logic:
1. If `session.exerciseResults` is empty or undefined → return 0
2. Sum `completedSets` across all entries in `session.exerciseResults`
3. Sum planned sets across all exercises in `plan.exercises`:
   - Parse `ex.s` field: it can be "3", "4", "3-4", "3 × 10", etc.
   - For range "X-Y", use the max value (Y)
   - For "N × M" format, extract N (number of sets)
   - Default to 3 if unparseable
4. Return `completed / planned`, clamped to [0.0, 1.0]
5. If planned is 0 → return 0

### `calculateWeeklyCompletionRate(sessions: Session[], plans: SessionPlan[], weekStartISO: string): number`

Calculates average completion rate across sessions in a given week.

Logic:
1. Filter sessions where `session.date` is within the 7 days starting from `weekStartISO`
2. For each session, find the matching plan (by `session.key` containing `plan.sessionId` or by date match)
3. Call `calculateSessionCompletionRate(session, plan)` for each
4. Return the average of all non-zero rates, or 0 if no sessions

## File 2: `js/tests/core/completionRate.test.ts` (NEW)

Use Vitest (`import { describe, it, expect } from 'vitest'`). Test both functions:

### calculateSessionCompletionRate tests:
- 100% when all sets completed: session has exerciseResults with completedSets summing to planned count
- 0% when no exerciseResults
- 50% partial completion
- Returns 0 when plan has no exercises
- Returns 0 when session has empty exerciseResults array

### calculateWeeklyCompletionRate tests:
- Average across multiple sessions in a week
- Returns 0 for empty sessions array
- Returns 0 when no sessions fall in the week range
- Filters out sessions outside the week range

## Important rules
- Pure functions only — no side effects, no imports from storage/store
- Use existing types from `types.ts` — `ExerciseResult`, `SetResult`, `Session`, `SessionPlan` already exist
- Do NOT modify any existing files other than creating these two new files
- Import from `'./types.js'` not `'../core/types.js'` (the test file is in tests/core/)

## Verification
```powershell
cd C:\Projects\fitness-tracker; npm test -- --reporter=verbose 2>&1 | Select-String "completionRate"
```
Tests must appear and pass. Also run `npm run type-check` — must be 0 errors.
