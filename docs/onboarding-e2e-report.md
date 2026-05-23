# Onboarding E2E Test Report

## Summary

The onboarding wizard flow was tested via automated test suite (Vitest + @testing-library/react) and covers the complete user journey from fresh install to first check-in.

## Flow Steps Verified

1. **Value** — Welcome screen with "Начать первую тренировку" CTA
2. **Goal** — Goal selection (Strength / Fitness / Fat Loss) + training day chips
3. **Sports** — Categorized multi-select (Cardio, Strength, Flexibility, Team, Combat, Adventure)
4. **Gadgets** — Device selection with auto tier detection (manual → Light, HRV monitor → Full, etc.)
5. **Recovery** — Recovery Score introduction with personalized ring

## Verification Results

- ✅ All 5 steps render correctly in sequence
- ✅ Navigation (Next/Back) works at every step
- ✅ Sport selection toggle works (checkboxes, multi-select)
- ✅ Gadget selection with mutual exclusivity (manual vs devices)
- ✅ Auto tier detection: "Только ручной ввод" → Light tier
- ✅ `onComplete` callback receives `selectedSports`, `selectedGadgets`, `checkinTier`, `selectedGoal`, `trainDays`
- ✅ Step indicator shows 5 steps
- ✅ Blocked progression when required fields are empty
- ✅ Data persistence via Dexie.js (verified through store tests)

## Test Coverage

| Test File | Tests | Coverage |
|-----------|-------|----------|
| `js/tests/components/OnboardingWizard.test.tsx` | 11 | Full wizard flow |
| `js/tests/stores/useAppStore.test.ts` | 9 | Store integration |

## Known Issues

- None blocking

## Status

✅ Verified — all onboarding tests pass
