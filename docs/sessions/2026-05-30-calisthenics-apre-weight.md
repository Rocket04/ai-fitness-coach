# Session: APRE Weight-Based Progression for Calisthenics

**Date:** 2026-05-30
**Goal:** Replace calisthenics difficulty levels (1-5) with weight-based RM input, allowing users to use real weights (backpack, weight belt, dumbbells) and measure progression in kilograms.

## Summary

### Completed
- Phase 0: Created plan file at `plans/2026-05-30-calisthenics-apre-weight.md`
- Phase 1: Researched codebase and updated plan with detailed implementation steps
- Phase 2 A: Updated `types.ts` — added `usesWeight?: boolean` to `ApreExerciseResult` and `Exercise`, deprecated comments on `calisthenicLevel`
- Phase 2 B: Created `js/domains/training/calisthenicsOnboarding.ts` — `estimateCalisthenicsRM()` using Epley formula
- Phase 2 C: Modified `ExerciseConfigModal.jsx` — replaced level selector (5 buttons) with weight (kg) + reps inputs, calculated RM display
- Phase 2 D: Updated `useFitnessData.ts` — added `usesWeight` to `ExerciseConfig`, updated `isExerciseConfigured`
- Phase 2 E: Updated APRE engine — added `usesWeight` param to `calcApreSets`, added `exerciseConfigs` to `annotateExercisesWithApre`
- Phase 2 F: Updated `ExerciseCard.jsx` — passes `usesWeight` to `calcApreSets`, conditionally sets `calisthenicLevel`
- Phase 2 G: Added 9 new tests (3 for weight-based calisthenics APRE in exerciseTracking, 6 for ExerciseConfigModal)
- Phase 2 H: Added 6 i18n keys per locale (ru/en)
- Phase 3 I: Created E2E audit script at `e2e/tests/calisthenics-golden-path.spec.ts`
- Phase 3 J: Created audit report at `docs/reports/calisthenics-audit-report.md`

### Final Status
- **type-check:** pass (0 errors)
- **Unit tests:** 752 passed, 0 failed (64 files, +1 new, +9 new tests)
- **E2E Golden Path:** Not run (Playwright timeout with dev server)
- **E2E Calisthenics:** Script created, not run

### Decisions
- usesWeight is added as optional flag for backward compatibility
- DEPRECATED calisthenicLevel retained but not set for weight-based exercises
- Epley formula used for RM estimation from working weight + reps
- APRE engine already handled weight-based calisthenics — annotateExercisesWithApre was the key update needed
