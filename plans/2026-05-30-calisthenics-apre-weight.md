# APRE Weight-Based Progression for Calisthenics

## Problem

The current calisthenics APRE configuration uses 1-5 difficulty levels (Easy/Medium/Advanced/Hard/Elite). The user wants to use real weights (backpack, weight belt, dumbbells) and measure progression in kilograms. The current onboarding and config UI needs to be replaced.

## Goals

1. Replace "Level of difficulty" selector in ExerciseConfigModal with weight-based RM input
2. Add an initial calisthenics strength assessment during exercise configuration to determine starting weight
3. Update the APRE engine to support weight-based calisthenics
4. Ensure the APRE toast fires correctly for calisthenics exercises
5. Write comprehensive unit tests for the new flow

## Files to modify

- `js/shared/types.ts`
- `js/domains/training/calisthenicsOnboarding.ts` (NEW)
- `js/ui/components/ExerciseConfigModal.jsx`
- `js/shared/hooks/useFitnessData.ts`
- `js/domains/training/apre/engine.js`
- `js/ui/components/ExerciseCard.jsx`
- `js/tests/core/exerciseTracking.test.ts`
- `js/tests/components/ExerciseConfigModal.test.tsx` (NEW)
- `js/shared/i18n/locales/ru.json`
- `js/shared/i18n/locales/en.json`

## Implementation Steps

### Step A: Update types.ts
**File:** `js/shared/types.ts`
- Line 113-114: Add DEPRECATED comment before `calisthenicLevel:`
  ```
  /** @deprecated Use usesWeight + currentRM instead for weight-based calisthenics */
  calisthenicLevel?: number;
  ```
- After line 114, add: `usesWeight?: boolean;`
- Line 151-152: Add DEPRECATED comment to Exercise interface's calisthenicLevel
- After line 152, add: `usesWeight?: boolean;`

### Step B: Create calisthenicsOnboarding.ts
**File:** `js/domains/training/calisthenicsOnboarding.ts` (NEW)
- Export interface `CalisthenicsAssessment` with:
  - `exerciseName: string`
  - `reps: number`
  - `addedWeightKg: number`
- Export function `estimateCalisthenicsRM(reps: number, addedWeightKg: number): number`
  - Formula: `Math.round(addedWeightKg * (1 + reps / 30) * 10) / 10`

### Step C: Modify ExerciseConfigModal.jsx
**File:** `js/ui/components/ExerciseConfigModal.jsx`
- Line 7: Add import: `import { estimateCalisthenicsRM } from '../../domains/training/calisthenicsOnboarding.ts';`
- Lines 93-105: Replace calisthenics section:
  - New local state: weight (string), reps (string)
  - useEffect to reset these when exercise changes
  - Remove level state, keep protocol and error
  - Replace level selector with:
    - Label: "Рабочий вес и повторения"
    - Description: "Сколько повторений ты можешь сделать с дополнительным весом?"
    - Weight input: type=number, step=0.5, placeholder="Вес (кг)"
    - Reps input: type=number, step=1, placeholder="Повторений"
    - Calculated RM display: `estimateCalisthenicsRM(parseFloat(reps), parseFloat(weight))`
    - Example note
- Lines 38-58: Update handleSave:
  - When isCalisthenics: validate weight and reps, calculate RM, save with currentRM=R, usesWeight=true, NOT calisticLevel
  - Keep backward compat: if calisthenics config uses old flow, calisthenicLevel stays

### Step D: Update useFitnessData.ts
**File:** `js/shared/hooks/useFitnessData.ts`
- Line 14: Add `usesWeight?: boolean;` to ExerciseConfig interface
- Lines 79-84: Update isExerciseConfigured:
  - When isCalisthenics && usesWeight: check currentRM !== null && currentRM > 0
  - When isCalisthenics && !usesWeight: keep old check (currentLevel !== null)

### Step E: Update APRE engine
**File:** `js/domains/training/apre/engine.js`
- Lines 136-219: calcApreSets already handles weight-based calisthenics correctly (currentRM = added weight in kg). The isCalisthenics branch uses currentRM directly. Only issue: the `currentLevel` mapping (`Math.max(1, Math.min(5, Math.round(currentRM / 2.5)))`) is for display only. Add `usesWeight` param to skip level mapping.
- Lines 312-340: annotateExercisesWithApre — when usesWeight flag is available, set currentRM from config's currentRM instead of defaultAddedWeight=0. Don't set calisthenicLevel when usesWeight=true.
- Make handleSaveExerciseConfig in TodayPage pass usesWeight to updateExerciseById

### Step F: Update ExerciseCard.jsx
**File:** `js/ui/components/ExerciseCard.jsx`
- Line 269-279: weightLabel function — when ex.usesWeight is true, use the kg-based display already implemented (lines 272-278 show the weight in kg)
- Line 140-146: onApreResult callback — conditionally pass calisthenicLevel only when NOT usesWeight

### Step G: Update tests
**File:** `js/tests/core/exerciseTracking.test.ts`
- Add test: 'stores weight-based calisthenics APRE result with usesWeight flag'
- Add test: 'APRE toast delta computed correctly for weight calisthenics'

**File:** `js/tests/components/ExerciseConfigModal.test.tsx` (NEW)
- Test: 'renders weight inputs for calisthenics exercises'
- Test: 'calculates RM from weight and reps'
- Test: 'does NOT render level selector for weight-based calisthenics'

### Step H: i18n
**File:** `js/shared/i18n/locales/ru.json`
- Add under exercise section:
  - "calisthenics.weightLabel": "Рабочий вес и повторения"
  - "calisthenics.weightDescription": "Сколько повторений ты можешь сделать с дополнительным весом?"
  - "calisthenics.weightPlaceholder": "Вес (кг)"
  - "calisthenics.repsPlaceholder": "Повторений"
  - "calisthenics.estimatedRM": "Расчётный максимум: ~ {{rm}} кг"
  - "calisthenics.weightExample": "Например: подтягиваюсь 6 раз с рюкзаком +5 кг → введи вес 5, повторений 6"

**File:** `js/shared/i18n/locales/en.json`
- Add:
  - "calisthenics.weightLabel": "Working Weight & Reps"
  - "calisthenics.weightDescription": "How many reps can you do with added weight?"
  - "calisthenics.weightPlaceholder": "Weight (kg)"
  - "calisthenics.repsPlaceholder": "Reps"
  - "calisthenics.estimatedRM": "Estimated RM: ~ {{rm}} kg"
  - "calisthenics.weightExample": "Example: 6 pull-ups with +5 kg backpack → enter weight 5, reps 6"
