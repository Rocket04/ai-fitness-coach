# Phase 1 Implementation Plan: Exercise Tracking Loop → Plan Adaptation

**Goal:** Close the user's loop: perform workout → record set results → next week's plan adapts automatically.
**Approach:** TDD — write failing test first, then minimal implementation. Fresh subagent per task with 2-stage review.

---

## Task 1: Extend Session type + SetResult with exerciseName

**File:** `js/core/types.ts`

### Step 1: Write failing test (if one exists for types) — skip, types have no tests
### Step 2: Implement

In `Session` interface (after `apreResults` line), add:
```typescript
exerciseResults?: ExerciseResult[];
postSessionFatigue?: number;
postSessionPain?: number;
plannedTotalSets?: number;
```

In `SetResult` interface, add optional field:
```typescript
exerciseName?: string;
```

In `AppDispatch` interface, add:
```typescript
updateSetResult: (result: SetResult) => void;
setPostSessionFatigue: (v: number) => void;
setPostSessionPain: (v: number) => void;
```

### Step 3: Verify
```powershell
cd C:\Projects\fitness-tracker; npm run type-check
```

### Subagent prompt:
```
TASK: Extend Session type in js/core/types.ts

Working directory: C:\Projects\fitness-tracker

Add the following to js/core/types.ts:

1. In the Session interface (after apreResults field), add:
   - exerciseResults?: ExerciseResult[]
   - postSessionFatigue?: number
   - postSessionPain?: number
   - plannedTotalSets?: number

2. In the SetResult interface, add:
   - exerciseName?: string

3. In the AppDispatch interface, add:
   - updateSetResult: (result: SetResult) => void
   - setPostSessionFatigue: (v: number) => void
   - setPostSessionPain: (v: number) => void

Do NOT modify any other files.
After changes, run: cd C:\Projects\fitness-tracker; npm run type-check
Report: what you changed and type-check result.
```

---

## Task 2: completionRate.ts module (TDD)

**Files:** `js/core/completionRate.ts` (new), `js/tests/core/completionRate.test.ts` (new)

### TDD Cycle:

**RED — Write test first** in `js/tests/core/completionRate.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import { calculateSessionCompletionRate, calculateWeeklyCompletionRate } from '../core/planning.js';
// Actually from completionRate.ts: import from '../core/completionRate.js'

describe('calculateSessionCompletionRate', () => {
  it('returns 0 when no exerciseResults', () => { ... });
  it('returns 0 when plan has no exercises', () => { ... });
  it('returns 1.0 when all sets completed', () => { ... });
  it('returns 0.5 for half completion', () => { ... });
  it('returns 0 for empty exerciseResults array', () => { ... });
});

describe('calculateWeeklyCompletionRate', () => {
  it('returns 0 for empty sessions', () => { ... });
  it('returns average across sessions in week', () => { ... });
  it('filters sessions outside week range', () => { ... });
});
```

**RED — Verify test fails:**
```powershell
cd C:\Projects\fitness-tracker; npm test -- js/tests/core/completionRate.test.ts -v
```
Should fail with "Cannot find module" or similar.

**GREEN — Write minimal implementation** in `js/core/completionRate.ts`:
```typescript
import type { Session, SessionPlan, ExerciseResult } from './types.js';

export function calculateSessionCompletionRate(session: Session, plan: SessionPlan): number {
  if (!session.exerciseResults || session.exerciseResults.length === 0) return 0;
  const completed = session.exerciseResults.reduce((sum, er) => sum + er.completedSets, 0);
  let planned = 0;
  for (const ex of plan.exercises) {
    const match = ex.s?.match(/(\d+)/);
    planned += match ? parseInt(match[1], 10) : 3;
  }
  if (planned === 0) return 0;
  return Math.min(1.0, completed / planned);
}

export function calculateWeeklyCompletionRate(sessions: Session[], plans: SessionPlan[], weekStartISO: string): number {
  if (sessions.length === 0) return 0;
  const weekEnd = new Date(weekStartISO);
  weekEnd.setDate(weekEnd.getDate() + 7);
  const weekEndISO = weekEnd.toISOString().slice(0, 10);
  const inWeek = sessions.filter(s => s.date >= weekStartISO && s.date < weekEndISO);
  if (inWeek.length === 0) return 0;
  const rates = inWeek.map(s => {
    const plan = plans.find(p => p.sessionId === s.key || p.date === s.date);
    return plan ? calculateSessionCompletionRate(s, plan) : 0;
  }).filter(r => r > 0);
  return rates.length > 0 ? rates.reduce((a, b) => a + b, 0) / rates.length : 0;
}
```

**GREEN — Verify test passes:**
```powershell
cd C:\Projects\fitness-tracker; npm test -- js/tests/core/completionRate.test.ts -v
```

### Subagent prompt:
```
TASK: Create completionRate.ts module + tests using strict TDD

Working directory: C:\Projects\fitness-tracker

Follow the test-development skill strictly:
1. Write tests FIRST in js/tests/core/completionRate.test.ts
2. Run tests to verify they FAIL (import from '../core/completionRate.js')
3. Create js/core/completionRate.ts with minimal implementation
4. Run tests to verify they PASS

Existing types from js/core/types.ts: SetResult, ExerciseResult, Session, SessionPlan

Functions to implement:
- calculateSessionCompletionRate(session: Session, plan: SessionPlan): number
  - 0 when no exerciseResults or empty
  - Sum completedSets from exerciseResults
  - Sum planned sets from plan.exercises (parse ex.s field, default 3)
  - Return completed/planned clamped [0,1], or 0 if planned=0

- calculateWeeklyCompletionRate(sessions: Session[], plans: SessionPlan[], weekStartISO: string): number
  - Filter sessions within 7 days from weekStartISO
  - For each, find matching plan, call calculateSessionCompletionRate
  - Return average of non-zero rates, or 0

After implementation, run: cd C:\Projects\fitness-tracker; npm run type-check; npm test
Report: test results and type-check result.
```

---

## Task 3: adherenceMultiplier in planning.ts (TDD)

**Files:** `js/core/planning.ts` (modify), `js/tests/core/adherenceMultiplier.test.ts` (new)

### TDD Cycle:

**RED — Write test first:**
```typescript
import { describe, it, expect } from 'vitest';
import { getVolumeMultiplierFromAdherence } from '../core/planning.js';

describe('getVolumeMultiplierFromAdherence', () => {
  it('returns 1.2 for rate >= 0.8', () => { expect(getVolumeMultiplierFromAdherence(0.85)).toBe(1.2); });
  it('returns 1.2 at boundary 0.8', () => { expect(getVolumeMultiplierFromAdherence(0.8)).toBe(1.2); });
  it('returns 1.0 at boundary 0.6', () => { expect(getVolumeMultiplierFromAdherence(0.6)).toBe(1.0); });
  it('returns 0.8 for rate < 0.6', () => { expect(getVolumeMultiplierFromAdherence(0.59)).toBe(0.8); });
  it('returns 0.8 for rate 0', () => { expect(getVolumeMultiplierFromAdherence(0)).toBe(0.8); });
  it('returns 1.2 for rate 1.0', () => { expect(getVolumeMultiplierFromAdherence(1.0)).toBe(1.2); });
});
```

**GREEN — Implement in planning.ts:**
```typescript
export function getVolumeMultiplierFromAdherence(completionRate: number): number {
  if (completionRate >= 0.8) return 1.2;
  if (completionRate >= 0.6) return 1.0;
  return 0.8;
}
```

Also modify `getAdaptedSessionForDate` signature to accept `volumeMultiplier: number = 1.0` and apply it.

### Subagent prompt:
```
TASK: Add getVolumeMultiplierFromAdherence to planning.ts using strict TDD

Working directory: C:\Projects\fitness-tracker

1. Create js/tests/core/adherenceMultiplier.test.ts with failing tests for getVolumeMultiplierFromAdherence:
   - >= 0.8 → 1.2
   - >= 0.6 → 1.0
   - < 0.6 → 0.8
   Import from '../core/planning.js'

2. Run tests to verify they FAIL

3. Add to js/core/planning.ts:
   - New exported function getVolumeMultiplierFromAdherence(completionRate: number): number
   - Modify getAdaptedSessionForDate() to accept optional volumeMultiplier parameter (default 1.0)
   - Inside the function, apply volumeMultiplier to exercise sets (multiply, Math.round, min 1)
   - Track modification in modifications array

4. Run tests to verify they PASS
5. Verify existing tests still pass (especially planning.test.ts)

After: cd C:\Projects\fitness-tracker; npm run type-check; npm test
Report: all test results.
```

---

## Task 4: Store — pendingSetResults + actions

**File:** `js/stores/useAppStore.ts`

No TDD needed for store changes — integration verified by final test run.

### Changes:

**State** (in AppStore interface + initial values):
- `pendingSetResults: SetResult[]` (initial: [])
- `postSessionFatigue: number` (initial: 0)
- `postSessionPain: number` (initial: 0)

**Actions:**
- `updateSetResult(result: SetResult)` — upsert by exerciseName+setNumber
- `setPostSessionFatigue(v: number)` — simple setter
- `setPostSessionPain(v: number)` — simple setter

**In handleToggleTraining** (save branch):
- Compute `ExerciseResult[]` from `pendingSetResults`
- Attach to session object
- Clear after save

### Subagent prompt:
```
TASK: Add pendingSetResults tracking to useAppStore

Working directory: C:\Projects\fitness-tracker

Modify js/stores/useAppStore.ts:

1. Add to AppStore interface:
   - pendingSetResults: SetResult[]
   - postSessionFatigue: number
   - postSessionPain: number
   - updateSetResult: (result: SetResult) => void
   - setPostSessionFatigue: (v: number) => void
   - setPostSessionPain: (v: number) => void

2. Add initial values in store creator:
   - pendingSetResults: []
   - postSessionFatigue: 0
   - postSessionPain: 0

3. Add action implementations:
   - updateSetResult: upsert into pendingSetResults by exerciseName+setNumber
   - setPostSessionFatigue/setPostSessionPain: simple setters

4. In handleToggleTraining (save branch, inside the session creation):
   Before saving, compute ExerciseResult[] from pendingSetResults by grouping on exerciseName.
   Include in session object: exerciseResults, postSessionFatigue, postSessionPain.
   After save, clear: pendingSetResults: [], postSessionFatigue: 0, postSessionPain: 0.

import SetResult from '../core/types.js' (check existing imports first).
Do NOT modify any other files.
After: cd C:\Projects\fitness-tracker; npm run type-check
```

---

## Task 5: ExerciseCard per-set checkboxes

**File:** `js/ui/components/ExerciseCard.jsx`

No TDD — UI component, verified by type-check only.

### Subagent prompt:
```
TASK: Add per-set completion checkboxes to ExerciseCard for non-APRE exercises

Working directory: C:\Projects\fitness-tracker

Modify js/ui/components/ExerciseCard.jsx:

1. Add onSetComplete prop to component signature (last param):
   onSetComplete?: (exName: string, setNumber: number, completedReps: number) => void

2. Add local state: const [completedSets, setCompletedSets] = useState([])

3. For non-APRE exercises (in the block handling !isApre || !sets):
   Replace the current simple rendering with per-set checkboxes:
   - Parse number of sets from ex.s (default 3)
   - Render one checkbox per set showing: "Подход N: X повт."
   - On check: add set number to completedSets, call onSetComplete(ex.n, setNum, parseInt(ex.r, 10))
   - On uncheck: remove from completedSets
   - Style checked sets with green border/background

4. For APRE exercises: keep existing behavior EXACTLY as-is (no changes)

CRITICAL: Follow existing React.createElement style — do NOT convert to JSX.
Do NOT modify any other files.
After: cd C:\Projects\fitness-tracker; npm run type-check
```

---

## Task 6: TodayPage wire-up + fatigue/pain UI

**Files:** `js/ui/pages/TodayPage.jsx`

### Subagent prompt:
```
TASK: Wire ExerciseCard onSetComplete + add fatigue/pain inputs in TodayPage

Working directory: C:\Projects\fitness-tracker

Modify js/ui/pages/TodayPage.jsx:

1. Destructure new store values:
   - updateSetResult, postSessionFatigue, postSessionPain, setPostSessionFatigue, setPostSessionPain

2. Pass onSetComplete to ExerciseCard:
   Find the React.createElement(ExerciseCard, {...}) call.
   Add prop: onSetComplete: (exName, setNum, reps) => {
     updateSetResult({ exerciseName: exName, setNumber: setNum, completed: reps > 0, repsDone: reps });
   }

3. After the exercise list section, add a collapsible "Самочувствие после тренировки" section
   with two range inputs (1-10 fatigue, 0-10 pain) wired to setPostSessionFatigue/setPostSessionPain.
   Use existing Collapsible component. Follow existing React.createElement style.

Do NOT modify any other files.
After: cd C:\Projects\fitness-tracker; npm run type-check
```

---

## Task 7: Final verification

```powershell
cd C:\Projects\fitness-tracker; npm run type-check; npm test
```

All 250+ existing tests + new completionRate and adherenceMultiplier tests must pass.
