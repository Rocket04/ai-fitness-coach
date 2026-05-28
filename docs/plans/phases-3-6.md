# Phases 3-6 Implementation Plan

**Goal:** Complete all remaining deep-research-report phases.
**Approach:** TDD for pure functions, subagent-per-task with 2-stage review.

---

## Phase 3: Rehab-Aware Stretching + i18n Cleanup

### Task 3A: Rehab-aware stretching filter (TDD)
**Files:** `js/core/exerciseDatabase.ts` (modify), `js/tests/core/exerciseDatabase.test.ts` (new)

Add `filterStretchingForRehab(exercises: Exercise[], rehabIssues: string[]): Exercise[]` to exerciseDatabase.ts.
- Reads existing `exerciseLibrary` for `avoidIf` tags
- Filters out exercises whose `avoidIf` overlaps with user's `rehabIssues`
- If all exercises filtered out, return safe fallback (gentle mobility)

Apply filter in stretching.ts phase functions (basePhase, buildPhase, peakPhase, deloadPhase) before returning exercises.

### Task 3B: i18n transliteration cleanup
**Files:** `js/plans/stretching.ts`, `js/i18n/locales/ru.json`

Russian exercise names in stretching.ts use Latin transliteration (e.g., "Raztyazhka Vsyo telo", "Plevoy sustav", "Skrutki lezha"). These should be proper Cyrillic with i18n keys.

Scope: Convert exercise names in stretching.ts to use Cyrillic directly (they're internal names, not user-facing in a way that needs i18n). The names appear in the SessionPlan which shows in TodayPage — so they should be readable Russian.

Convert:
- "Raztyazhka Vsyo telo" → "Растяжка всего тела"
- "Plevoy sustav" → "Плечевой сустав"
- "Skrutki lezha" → "Скрутки лёжа"
- "Zadnyaya tsep" → "Задняя цепь"
- "Kvadritsep" → "Квадрицепс"
- "Ikronnye" → "Икры"
- "Zapyastya" → "Запястья"
- "90/90" → "90/90" (keep, it's a standard term)
- "Bedra" → "Бёдра"
- "Nogi" → "Ноги"
- "Poyasnitsa" → "Поясница"
- "Sheya i plechi" → "Шея и плечи"

---

## Phase 5: Test Backfill (TDD)

### Task 5A: loadAdjustments.test.ts
**File:** `js/tests/core/loadAdjustments.test.ts` (new)

Tests for:
- `getWeeklyMultiplier`: week 4 → 0.6 (deload), week 1 → 1.0, green week → 1.1, red week → 0.9
- `applyApreAdjustment`: no lastSession → returns exercises unchanged, RPE≤4 → +1 rep, RPE≥8 → -1 rep
- `adjustExercisesForMode`: 'minimum' returns only recovery/mobility exercises, 'yellow' reduces sets by 1, 'deload' reduces by ~40%
- `applyMultiplierToExercises`: multiplier 1.0 → no change, 1.2 → reps increased

### Task 5B: advice.test.ts expansion
**File:** `js/tests/core/advice.test.ts` (modify, add tests)

Add tests for:
- `getCoachAdvice(85, {})` → returns training advice (array length > 0)
- `getCoachAdvice(35, {})` → returns recovery advice
- `getCoachAdvice(70, { sleepHours: 5 })` → includes sleep warning
- `getCoachAdvice(70, { hrv: 30 })` → includes HRV warning

---

## Phase 4: Store Split + TodayPage Refactor

### Task 4A: Zustand slices
**Files:** `js/stores/slices/checkinSlice.ts`, `sessionSlice.ts`, `uiSlice.ts`, `dataSlice.ts`, `demoSlice.ts` (all new)

Split useAppStore.ts into slices:
- checkinSlice: weight, restHR, hrv, sleepHours, hipPain, shoulderPain, breathing, notes, muscleSoreness, energy, mood, sleepQuality, stress + setters + handleSaveCheckin
- sessionSlice: rpe, sessionNote, durationMinutes, testPullUps, testPushUps, testPlank, pendingApreResults, pendingSetResults, postSessionFatigue, postSessionPain + setters + updateApreResult + updateSetResult + handleToggleTraining
- uiSlice: activeTab, showReadiness, manualOverride, showSettings, showResetConfirm, editStartDate, editTrainDays, toast + setters
- dataSlice: sessions, checkins, dataLoaded, startDate, trainDays, checkinTier, selectedGadgets, selectedSports, virtualTodayOffset, selectedSports, weeklyTemplate, rehabIssues, rehabExercises, profileLevel, profileGoals, profileEquipment + initApp, handleExportData, handleImportData, handleResetAll, confirmResetData
- demoSlice: demoMode, guestMode, showGuestModal + activateDemoMode, deactivateDemoMode, setShowGuestModal, startTracking, completeGuestModeOnboarding

useAppStore.ts becomes thin orchestrator importing all slices + computeDerived.

### Task 4B: TodayPage component extraction
**Files:** `js/ui/components/today/HeroRing.tsx`, `ExerciseList.tsx`, `WeeklyStrip.tsx` (new)

Extract from TodayPage.jsx into components, converting React.createElement to JSX.
TodayPage becomes thin container (~150 lines).

---

## Phase 6: Documentation Sync

### Task 6A: Update README.md
- Fix TypeScript version (6 → actual from package.json)
- Update feature list to match current state
- Update test counts

### Task 6B: Update AGENTS.md
- Remove references to deleted files
- Add new core files (completionRate.ts, csvParser.ts, import/)
- Update architecture section

### Task 6C: Commit discipline rule
- Add to AGENTS.md: "Documentation is part of the commit — every commit changing API or architecture must update relevant README/docs"
