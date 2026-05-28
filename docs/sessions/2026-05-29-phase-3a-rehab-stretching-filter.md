# Session: Phase 3A — Rehab-Aware Stretching Filter

## Goal
Add `filterStretchingForRehab` function using TDD, integrate into planning pipeline.

## Steps
1. Write test file `js/tests/core/exerciseDatabase.test.ts`
2. Add `filterStretchingForRehab` to `js/core/exerciseDatabase.ts`
3. Integrate into `js/core/planning.ts` for stretching sport
4. Run tests and type-check

## Results

- **Tests**: 33 files, 292 passed (3 new tests in exerciseDatabase.test.ts)
- **Type-check**: Clean (pre-existing unused import warning in loadAdjustments.test.ts unrelated to this change)
- **Files changed**:
  1. `js/tests/core/exerciseDatabase.test.ts` — new test file (3 tests)
  2. `js/core/exerciseDatabase.ts` — added `import type { Exercise }`, `FALLBACK_STRETCHING`, `filterStretchingForRehab()`
  3. `js/core/planning.ts` — imported `filterStretchingForRehab`, added stretching-specific filter after existing rehab block

## Key decisions
- `Exercise` type has no `id` field, so `filterStretchingForRehab` reads optional `(ex as any).id` to match against `exerciseLibrary`
- Exercises not found in `exerciseLibrary` are kept (safe default) — only known contraindicated exercises get filtered
- Fallback ensures at least 2 safe exercises when all are filtered out
- Filter applied in `applyReadinessToSession` after the generic `filterExercisesForRehab` block, only when `session.sport === 'stretching'`
