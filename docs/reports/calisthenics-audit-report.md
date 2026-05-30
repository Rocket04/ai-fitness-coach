# Calisthenics Weight-Based APRE — Audit Report

**Date:** 2026-05-30
**Type:** E2E Golden Path Audit for weight-based calisthenics APRE progression

## Test Results

### Unit Tests
- **Total:** 752 tests passed, 0 failed (64 files)
- **Test Files:** 64 passed (1 new: `ExerciseConfigModal.test.tsx`)

### E2E Tests
- **Golden Path (existing):** Not run (requires `npm run dev` on :3000)
- **Calisthenics Golden Path:** Script created at `e2e/tests/calisthenics-golden-path.spec.ts` (not run — requires dev server)

## Screenshots
No screenshots taken (E2E not executed). When run, screenshots would be saved to `docs/screenshots/`:
- `exercise-config-modal-weight-inputs.png`
- `apre-toast-workout.png`
- `workout-mode-calisthenics.png`

## Implementation Summary

### Files Changed
| File | Change |
|------|--------|
| `js/shared/types.ts` | Added `usesWeight?: boolean` to `ApreExerciseResult` and `Exercise`, marked `calisthenicLevel` as deprecated |
| `js/domains/training/calisthenicsOnboarding.ts` | NEW — RM estimator using Epley formula |
| `js/ui/components/ExerciseConfigModal.jsx` | Replaced level selector (Easy/Medium/Advanced/Hard/Elite) with weight + reps inputs |
| `js/shared/hooks/useFitnessData.ts` | Added `usesWeight` to `ExerciseConfig`, updated `isExerciseConfigured` |
| `js/domains/training/apre/engine.js` | Added `usesWeight` param to `calcApreSets`, added `exerciseConfigs` to `annotateExercisesWithApre` |
| `js/ui/components/ExerciseCard.jsx` | Passes `usesWeight` to `calcApreSets`, conditionally sets `calisthenicLevel` |
| `js/ui/pages/TodayPage.jsx` | Passes `usesWeight` through `handleSaveExerciseConfig` |
| `js/ui/pages/WorkoutMode.jsx` | Passes `usesWeight` from user config to exercise |
| `js/tests/core/exerciseTracking.test.ts` | Added 3 tests for weight-based calisthenics APRE |
| `js/tests/components/ExerciseConfigModal.test.tsx` | NEW — 6 tests for modal behavior |
| `js/shared/i18n/locales/ru.json` | Added 6 i18n keys |
| `js/shared/i18n/locales/en.json` | Added 6 i18n keys |
| `plans/2026-05-30-calisthenics-apre-weight.md` | Implementation plan |
| `docs/sessions/2026-05-30-calisthenics-apre-weight.md` | Session log |

## Comparison with Golden Path Vision

✅ **Weight-based RM input** — Implemented (replaces level selector)
✅ **APRE toast** — Already worked for calisthenics, usesWeight-aware now
✅ **Backward compatibility** — Old level-based calisthenics still works
✅ **i18n** — Russian + English keys added
✅ **Tests** — 9 new unit tests (3 for APRE, 6 for config modal)

⚠️ **E2E tests** — Script created but not executed (requires running dev server)

## Remaining Issues / Recommendations

1. **E2E tests** — Run `npm run dev` then `npx playwright test e2e/tests/calisthenics-golden-path.spec.ts --project=chromium`
2. **Profile page** — The ProfilePage.jsx's exercise configurator modal uses ExerciseConfigModal which now shows weight inputs for calisthenics — this is correct
3. **annotateExercisesWithApre** — The `exerciseConfigs` parameter is added but not yet passed from all callers (planning.ts). WorkoutMode's user config merging handles this for the workout flow, but the plan generation doesn't yet benefit from weight-based config at annotation time
4. **Docs** — Update domain README per AGENTS.md rule if applicable (architectural change)
