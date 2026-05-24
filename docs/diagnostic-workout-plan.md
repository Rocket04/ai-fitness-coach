# Workout Plan Not Showing - Diagnostic Report

## Problem Statement
TodayPage does not display any workout plan when dates are tapped or when demo mode is active.

---

## Data Flow Analysis

### 1. getPlanForSport() in js/core/planning.ts

**Location:** `js/core/planning.ts:14-18`

```typescript
function getPlanForSport(sport?: string | null) {
  if (sport === 'running') return RUNNING_PLAN;
  if (sport === 'strength') return STRENGTH_PLAN;
  return MONTHS; // default
}
```

**Finding:** `getPlanForSport()` is called correctly when provided a sport parameter. However, in the main data flow (see below), `sport` is never passed, so it defaults to `MONTHS`.

---

### 2. buildSessionFromMonth() in js/core/planning.ts

**Location:** `js/core/planning.ts:60-104`

```typescript
export function buildSessionFromMonth(
  month: any,
  dayIndex: number | null,
  readiness: ReadinessStatus,
  debt: boolean,
  multiplier = 1.0,
  apreSession: Session | null = null,
  weekNumber = 1
): SessionPlan | null {
  if (!month || dayIndex === null) return null;
  const dayPlan = month.days[dayIndex];
  if (!dayPlan) return null;
  // ...
}
```

**Finding:** `buildSessionFromMonth()` returns `null` when `month` is `null` or when `dayIndex` is `null`. The `dayIndex` is determined by `getMonthAndDayIndex()`.

---

### 3. computeDerived() in js/stores/useAppStore.ts

**Location:** `js/stores/useAppStore.ts:115-130`

```typescript
const trainType = getWorkoutType(todayDate, trainDays);
const tomorrowType = getWorkoutType(tomorrowDate, trainDays);
const { month, dayIndex } = getMonthAndDayIndex(weekNumber, trainType);  // NO SPORT PARAMETER!

let sessionPlan: SessionPlan | null = null;
if (trainType && month) {
  const plan = buildSessionFromMonth(month, dayIndex, readiness, recoveryDebt, totalMultiplier, apreSession, weekNumber);
  sessionPlan = maybeAddTestExercises(plan, trainType, weekNumber, readiness);
}
```

**Finding:** `getMonthAndDayIndex()` is called with only 2 parameters: `weekNumber` and `trainType`. The third parameter `sport` is omitted, so `sport === undefined` in the function.

---

### 4. getMonthAndDayIndex() Analysis

**Location:** `js/core/planning.ts:40-54`

```typescript
export function getMonthAndDayIndex(weekNumber: number, trainType: WorkoutType | null, sport?: string | null): { month: any; dayIndex: number | null } {
  if (!weekNumber || !trainType) return { month: null, dayIndex: null };

  const planMonths = getPlanForSport(sport);  // sport is undefined, returns MONTHS
  const monthIndex = weekNumber <= 4 ? 0 : weekNumber <= 8 ? 1 : 2;
  const month = planMonths[monthIndex];
  if (!month) return { month: null, dayIndex: null };

  let dayIndex: number;
  if (trainType === 'A') dayIndex = 0;
  else if (trainType === 'B') dayIndex = 2;
  else dayIndex = 4;

  return { month, dayIndex };
}
```

**Finding:** When `sport` is undefined, it returns `MONTHS` from constants.js. This works for MONTHS but fails for modular plans.

---

### 5. Month Plan Structure Mismatch

**MONTHS (js/config/constants.js:99-238)** has 7 days per month:
- days[0] = Monday (ПН)
- days[2] = Wednesday (СР) 
- days[4] = Friday (ПТ)

**RUNNING_PLAN (js/plans/running.ts:27-126)** has varying days per month:
- month1: 5 days (ПН, СР, ПТ, СБ) - indices 0,1,2,3
- month2: 4 days (ПН, СР, ПТ, СБ) - indices 0,1,2,3
- month3: 4 days (ПН, СР, ПТ, СБ) - indices 0,1,2,3

**STRENGTH_PLAN (js/plans/strength.ts:26-114)** has even fewer:
- month1: 3 days (ПН, СР, ПТ) - indices 0,1,2
- month2: 3 days (ПН, СР, ПТ) - indices 0,1,2
- month3: 3 days (ПН, СР, ПТ) - indices 0,1,2

**Critical Issue:** The dayIndex mapping assumes:
- 'A' type → dayIndex 0 ✓ (works for all plans)
- 'B' type → dayIndex 2 ✗ (fails - index 2 is Friday, not Wednesday!)
- 'C' type → dayIndex 4 ✗ (fails - index 4 is Saturday, not Friday!)

For RUNNING_PLAN, index 2 is Friday, not Wednesday.  
For STRENGTH_PLAN, index 2 is Friday, and there is no index 4!

---

### 6. Demo Mode Activation Issue

**Location:** `js/stores/useAppStore.ts:839-853`

```typescript
activateDemoMode: async () => {
  const { generateDemoData } = await import('../core/demoData.js');
  const demoData = generateDemoData();
  await activateDemoData(demoData);
  // ...
  const derived = computeDerived(allSessions, allCheckins, 
    allSessions.length > 0 ? allSessions[0].date : null,  // startDate from first session
    [1, 3, 5], 'unknown', 
    allCheckins.length > 0 ? allCheckins[allCheckins.length - 1].date : formatISO(new Date()), 
    'medium', demoOffset);
  // ...
}
```

**Finding:** The demo data uses `trainDays: [1, 3, 5]` (Mon/Wed/Fri), but:
1. The demo data generator sets `selectedSports: ['running']` but this isn't used in `computeDerived`
2. `getMonthAndDayIndex()` is called without sport parameter
3. `startDate` is from the first session's date, but weekNumber calculation depends on this

---

### 7. WeekNumber Calculation Issue

**Location:** `js/stores/useAppStore.ts:105-113`

```typescript
let weekNumber = 1;
if (startDate) {
  const start = parseLocalDate(startDate);
  if (start) {
    const diffMs = todayDate.getTime() - start.getTime();
    const dayIdx = Math.max(0, Math.floor(diffMs / 86400000));
    weekNumber = Math.floor(dayIdx / 7) + 1;
  }
}
```

**Finding:** If `startDate` is `null` (no sessions yet), `weekNumber` stays at 1, which is correct. But if startDate is from a different date than expected, the weekNumber could be off.

---

### 8. TodayPage.jsx Rendering

**Location:** `js/ui/pages/TodayPage.jsx:560-565`

```jsx
isRestDay
  ? React.createElement('div', { className: 'card rest-day-card ...' }, ...)
  : React.createElement('div', { className: 'card ...' },
      // render training session
    )
```

**Finding:** `isRestDay` is `true` when `!trainType || !sessionPlan`. Since `sessionPlan` is `null`, the rest day card is shown.

---

## Root Causes Summary

### Primary Issues:

1. **Missing sport parameter in computeDerived()** - `getMonthAndDayIndex()` is called without sport, so modular plans (RUNNING_PLAN, STRENGTH_PLAN) are never used.

2. **Wrong dayIndex mapping** - The mapping `A→0, B→2, C→4` only works for MONTHS structure where Wednesday is index 2 and Friday is index 4. RUNNING_PLAN and STRENGTH_PLAN have different day ordering.

3. **Modular plans have incomplete week structure** - 
   - STRENGTH_PLAN has only 3 training days (Mon/Wed/Fri) but uses indices 0,1,2
   - RUNNING_PLAN has 4-5 days but includes Saturday/Sunday
   - The dayIndex logic assumes all 7 days exist

### Secondary Issues:

4. **Demo mode doesn't pass selectedSports to computeDerived** - The demo data has `selectedSports: ['running']` but this isn't used.

5. **getActiveDatabase() doesn't return demo database** - In storage.ts:437, `getActiveDatabase()` always returns `db`, not the demo database when in demo mode.

---

## Fixes Applied

### 1. Fixed getMonthAndDayIndex() (js/core/planning.ts)
- Added `getDefaultDayIndex()` helper for MONTHS structure (A→0, B→2, C→4)
- Modified `getMonthAndDayIndex()` to detect modular plans (`running` or `strength`) and use sequential indexing (A→0, B→1, C→2) for those plans

### 2. Fixed computeDerived() (js/stores/useAppStore.ts)
- Added `selectedSports` parameter to `computeDerived()` function signature
- Added logic to derive `sport` from `selectedSports` (prioritizes 'running' or 'strength')
- Passed `sport` to `getMonthAndDayIndex()` calls
- Updated all 16 call sites of `computeDerived()` to include `selectedSports` parameter

### 3. Fixed getActiveDatabase() (js/core/storage.ts)
- Changed to return `_demoDb` when `_demoMode` is true, otherwise returns `db`

### 4. Fixed activateDemoMode() (js/stores/useAppStore.ts)
- Added `selectedSports: ['running']` to state when demo mode activates
- Ensure demo database is used for data retrieval

---

## Remaining Pre-existing TypeScript Errors
(Not introduced by these fixes)

The following errors existed before the fixes and are unrelated to the workout plan issue:
- `js/core/achievements.ts(108,75)` - Wrong number of arguments
- `js/core/streak.ts(44,3)` - Unused variable
- `js/tests/core/achievements.test.ts` - Test file type errors
- `js/tests/core/streak.test.ts` - Test file type errors