# Batch TypeScript Error Resolution Pattern

## Context
After a large feature session, TS may report 40+ errors across many files. Fixing them one-at-a-time is slow. Instead, batch by error category.

## Strategy

### 1. Group by error type
Run `npx tsc --noEmit` and group:
- Unused imports/variables (TS6133) → strip or prefix with `_`
- Signature mismatches (TS2554) → update definition to match all call sites
- Type mismatches (TS2345) → fix the interface or the call site, not both
- Missing properties → add to interface or initial state

### 2. Fix in dependency order
Fix types.ts FIRST (it affects everything downstream), then core modules, then store/tests.

### 3. Common patterns in this project

#### Unused import/variable
```ts
// BEFORE (error TS6133)
import { parseLocalDate } from './helpers.js';

// AFTER: remove entirely
```

#### Unused parameter
```ts
// BEFORE (error TS6133)
export function getTrainingStreak(sessions, trainDays, startDate, referenceDate?) {

// AFTER: prefix with underscore
export function getTrainingStreak(sessions, trainDays, _startDate, referenceDate?) {
```

#### Function called with more args than defined
```ts
// BEFORE: TS2554 "Expected 3-5 arguments, but got 6"
const ex = (n: string, s: string, r: string, w?: string, c?: string): Exercise => ({...});
ex("Name", "3", "8-10", "Notes", "APRE_6", 0);  // 6 args!

// AFTER: update definition
const ex = (n: string, s: string, r: string, w?: string, c?: string, rm?: number): Exercise => ({
  n, s, r, ...(w && { w }), ...(c && { c }), ...(rm && { currentRM: rm }),
});
```

#### Method signature mismatch between config and call site
```ts
// Config defines: progress: (_, checkins) => ({ current, target })
// Call site passes: achievement.progress(a, b, c, d, e)  // 5 args!

// Fix: match the call to the actual definition
achievement.progress(sessions, checkins)
```

#### Optional interface field resolves many test errors
When ~10 tests fail with "Type 'X | undefined' not assignable to type 'X'":
- Check if the field should be optional in the interface
- Changing `notes: string` -> `notes?: string` in types.ts fixes all callers

#### Variable used but not in scope
```ts
// BEFORE: TS2304 "Cannot find name 'weeklyTemplate'"
const derived = computeDerived(..., weeklyTemplate);

// AFTER: destructure from get()
const { editStartDate, editTrainDays, weeklyTemplate /* ... */ } = get();
```

#### Store property removed, component still references it
When the store removes/renames a property (e.g., `trainType` removed, `weekNumber` → `totalWeek`), components that destructure it get `undefined` at runtime. TSC may NOT flag this if the component uses the variable indirectly.

Fix: derive the old property from remaining store properties:
```ts
// BEFORE: const { trainType, weekNumber } = useAppStore();  // undefined!
// AFTER: derive from sessionPlan
const { sessionPlan, totalWeek } = useAppStore();
const trainType = sessionPlan?.sessionType || null;
const weekNum = totalWeek;
```

Also fix test mocks: remove the deleted property from mock objects and update assertions:
```ts
// BEFORE mock: { weekNumber: 3, trainType: 'A' }
// AFTER mock:  { totalWeek: 3 }  (trainType derived, weekNumber gone)
// BEFORE test: expect(state.weekNumber).toBe(1)
// AFTER test:  expect(state.totalWeek).toBe(1)
```

## Verification
After each batch:
```bash
npx tsc --noEmit 2>&1 | wc -l   # should decrease
```
Final target: 0 errors.

## Lessons from 44-error session
- 1 paren fix can expose 44 new TS errors (the file was so broken TS couldn't parse past it)
- Always run `npx tsc --noEmit` after fixing syntax errors to find the next layer
- Fixing types.ts optional fields first cascades to fix ~10 test errors at once
- Helper function signatures in plan templates (`ex()`) are easy to miss — grep all call sites before updating definition
