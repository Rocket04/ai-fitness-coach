# Periodized Multi-Sport Training Architecture Plan

**Date:** 2026-05-24  
**Status:** Implementation-Ready  
**Goal:** Fix TodayPage empty workout bug + implement flexible periodized multi-sport training system.

---

## 1. PROBLEM ANALYSIS (Root Causes)

### Current Bugs
1. **TodayPage shows no workout** → `sessionPlan` is `null` because:
   - `computeDerived()` doesn't pass `sport` to `getMonthAndDayIndex()`
   - Day index mapping (`A→0, B→2, C→4`) only works for `MONTHS` structure
   - Modular plans (running/strength) have different day ordering

2. **Date-tap doesn't change plan** → `setVirtualTodayOffset` passes stale `s.virtualTodayOffset` instead of new value `v` (partially fixed in progress.md)

### Architectural Gaps
- Single 12-week plan with hardcoded `trainDays` array
- No periodization (base/build/peak/deload phases)
- No multi-sport weekly template system
- `SessionPlan` type doesn't support new architecture

---

## 2. NEW DATA MODEL (types.ts)

### 2.1 Update SessionPlan Type
Replace existing `SessionPlan` (line 153-161 in types.ts):

```typescript
export type PhaseType = 'base' | 'build' | 'peak' | 'deload';

export interface SessionPlan {
  sessionId: string;                    // e.g., "2026-05-24_running_endurance"
  date: string;                          // ISO date
  sport: 'running' | 'strength' | 'cycling' | 'mobility';
  sessionType: 'endurance' | 'tempo' | 'intervals' | 'hypertrophy' | 'strength' | 'power' | 'recovery';
  name: string;                          // e.g., "Лёгкая пробежка 5 км"
  description: string;                    // e.g., "Zone 2, 30 min"
  defaultParameters: Record<string, number>; // { duration: 30, distance: 5, sets: 3, reps: 8 }
  exercises: Exercise[];                   // Full exercise list with APRE metadata
  mode: SessionMode;                     // 'full' | 'yellow' | 'minimum' | 'deload'
  isDeload: boolean;
  isRestDay: boolean;
  apreRule?: {
    type: 'scalar' | 'reps' | 'load';
    scaleBy: string;                       // e.g., "weight", "distance"
    modifiers: { green: number; yellow: number; red: number };
  };
  alternativeForCrossTraining?: string;    // e.g., "mobility" if running is rained out
}
```

### 2.2 Add SportPlanModule Interface
```typescript
export interface SportPlanModule {
  sport: string;
  phases: {
    base: (weekInPhase: number) => Omit<SessionPlan, 'date' | 'sessionId'>[];
    build: (weekInPhase: number) => Omit<SessionPlan, 'date' | 'sessionId'>[];
    peak: (weekInPhase: number) => Omit<SessionPlan, 'date' | 'sessionId'>[];
    deload: (weekInPhase: number) => Omit<SessionPlan, 'date' | 'sessionId'>[];
  };
}
```

### 2.3 Add WeeklyTemplate Interface
```typescript
export interface WeeklyTemplate {
  days: (string | null)[];  // ["running", "strength", null, "running", "strength", null, "running"]
  sportOrder: string[];       // ["running", "strength"]
}
```

---

## 3. PERIODIZATION ENGINE (planning.ts rewrite)

### 3.1 Phase Calculation
```typescript
export function getCurrentPhaseAndWeek(
  startDate: string,
  virtualTodayOffset: number = 0
): { phase: PhaseType; weekInPhase: number; totalWeek: number } {
  const start = parseLocalDate(startDate);
  const today = getAppDateSync(virtualTodayOffset);
  const diffMs = today.getTime() - start.getTime();
  const totalWeek = Math.floor(Math.max(0, diffMs) / 604800000) + 1;
  
  const weekInCycle = ((totalWeek - 1) % 4) + 1;  // 1-4 within each 4-week cycle
  const cycleNumber = Math.floor((totalWeek - 1) / 4); // 0-based cycle
  
  // Every 4th week is deload
  if (weekInCycle === 4) {
    return { phase: 'deload', weekInPhase: 4, totalWeek };
  }
  
  // Cycles: 0=Base, 1=Build, 2=Peak, 3=Base (repeat)
  const phaseMap: PhaseType[] = ['base', 'build', 'peak', 'base'];
  const phase = phaseMap[cycleNumber % 4];
  return { phase, weekInPhase: weekInCycle, totalWeek };
}
```

### 3.2 Sport Module Registry
```typescript
import { RunningPlanModule } from '../plans/running.js';
import { StrengthPlanModule } from '../plans/strength.js';

const SPORT_MODULES: Record<string, SportPlanModule> = {
  'running': RunningPlanModule,
  'strength': StrengthPlanModule,
};

export function getActiveModules(selectedSports: string[]): SportPlanModule[] {
  return selectedSports
    .map(sport => SPORT_MODULES[sport])
    .filter(Boolean);
}
```

### 3.3 Weekly Plan Builder
```typescript
export function buildWeeklyPlan(
  modules: SportPlanModule[],
  phase: PhaseType,
  weekInPhase: number,
  weeklyTemplate: WeeklyTemplate
): Omit<SessionPlan, 'date' | 'sessionId'>[] {
  const sessions: Omit<SessionPlan, 'date' | 'sessionId'>[] = [];
    
  weeklyTemplate.days.forEach((sport, dayIndex) => {
    if (!sport) return; // Rest day
    
    const module = modules.find(m => m.sport === sport);
    if (!module) return;
    
    const phaseGenerator = module.phases[phase];
    const sportSessions = phaseGenerator(weekInPhase);
    const daySession = sportSessions[dayIndex % sportSessions.length];
    
    if (daySession) {
      sessions.push({
        ...daySession,
        sport,
      });
    }
  });
    
  return sessions;
}
```

### 3.4 Date-to-Session Lookup (Critical Fix)
```typescript
export function getSessionForDate(
  date: string,
  selectedSports: string[],
  startDate: string | null,
  weeklyTemplate: WeeklyTemplate
): SessionPlan | null {
  if (!startDate) return null;
    
  const modules = getActiveModules(selectedSports);
  if (modules.length === 0) return null;
    
  const { phase, weekInPhase } = getCurrentPhaseAndWeek(startDate, 0);
  const weekSessions = buildWeeklyPlan(modules, phase, weekInPhase, weeklyTemplate);
    
  const dateObj = parseLocalDate(date);
  const startObj = parseLocalDate(startDate);
  const dayOffset = Math.floor((dateObj.getTime() - startObj.getTime()) / 86400000);
  const dayIndex = ((dayOffset % 7) + 7) % 7; // 0-6 (Mon-Sun)
    
  return weekSessions[dayIndex] || null;
}
```

---

## 4. PLAN GENERATORS (running.ts & strength.ts rewrite)

### 4.1 RunningPlanModule (running.ts)
```typescript
export const RunningPlanModule: SportPlanModule = {
  sport: 'running',
  phases: {
    base: (weekInPhase) => {
      // 80% Zone 2, volume +5%/week
      const baseDistance = 5 + (weekInPhase - 1) * 0.25; // 5, 5.25, 5.5, 5.75
      return [
        { sessionType: 'endurance', name: `Лёгкая пробежка ${baseDistance} км`, 
          description: 'Zone 2, 30 min', defaultParameters: { distance: baseDistance, duration: 30 } } as any,
        { sessionType: 'endurance', name: `Средняя пробежка ${baseDistance + 1} км`,
          description: 'Zone 2, 35 min', defaultParameters: { distance: baseDistance + 1, duration: 35 } } as any,
        null, // Wednesday rest
        { sessionType: 'intervals', name: 'Интервалы 5×800м',
          description: 'Zone 3, 45 min', defaultParameters: { repeats: 5, distance: 0.8 } } as any,
        { sessionType: 'tempo', name: `Темповая ${baseDistance + 2} км`,
          description: 'Zone 3, 40 min', defaultParameters: { distance: baseDistance + 2, duration: 40 } } as any,
        null, // Saturday rest
        { sessionType: 'recovery', name: 'Восстановительный бег',
          description: 'Zone 1, 20 min', defaultParameters: { distance: 3, duration: 20 } } as any,
      ].filter(Boolean);
    },
    // build, peak, deload similarly...
  }
};
```

### 4.2 StrengthPlanModule (strength.ts)
Split into Upper/Lower to avoid interference:
- Monday: Upper Body (Push/Pull)
- Tuesday: Lower Body (Squat/Hinge)
- Thursday: Upper Body (Accessory)
- Saturday: Lower Body (Accessory)

Each phase returns `SessionPlan[]` with APRE-integrated exercises.

---

## 5. STORE INTEGRATION (useAppStore.ts)

### 5.1 Add to computeDerived()
```typescript
// Replace old trainType/month/dayIndex logic (lines 105-133)
const { phase, weekInPhase, totalWeek } = getCurrentPhaseAndWeek(
  startDate, 
  virtualTodayOffset
);

const weeklyTemplate: WeeklyTemplate = {
  days: ['running', 'strength', null, 'running', 'strength', null, 'running'],
  sportOrder: selectedSports.length > 0 ? selectedSports : ['running']
};

const sessionPlan = getSessionForDate(
  todayISO,
  selectedSports,
  startDate,
  weeklyTemplate
);

// Tomorrow's plan
const tomorrowISO = formatISO(makeTomorrowDate(todayISO, virtualTodayOffset));
const tomorrowPlan = getSessionForDate(
  tomorrowISO,
  selectedSports,
  startDate,
  weeklyTemplate
);
```

### 5.2 Update TodayPage.jsx
- Read `sessionPlan` from store (already done)
- Render new `SessionPlan` fields: `name`, `description`, `sport`, `sessionType`
- Show "День отдыха" when `sessionPlan.isRestDay === true`
- 30-day strip: call `setVirtualTodayOffset(d.offset)` on tap (already fixed in progress.md)

---

## 6. TEST STRATEGY (TDD)

### 6.1 Test Files to Create/Update
| File | Tests | Coverage |
|------|-------|----------|
| `js/tests/core/planning.test.ts` | 20+ | Phase calc, getSessionForDate, sport modules |
| `js/tests/core/periodization.test.ts` | 15+ | 4-phase model, deload weeks |
| `js/tests/plans/running.test.ts` | 10+ | RunningPlanModule output structure |
| `js/tests/plans/strength.test.ts` | 10+ | StrengthPlanModule, upper/lower split |
| `js/tests/stores/useAppStore.periodization.test.ts` | 8+ | computeDerived with new architecture |

### 6.2 Test First Approach
1. Write test for `getCurrentPhaseAndWeek()` → implement
2. Write test for `getSessionForDate()` → implement
3. Write test for `buildWeeklyPlan()` → implement
4. Update component tests for TodayPage rendering

---

## 7. IMPLEMENTATION ORDER

### Step 1: Types (types.ts)
- [ ] Add `PhaseType`, update `SessionPlan`, add `SportPlanModule`, `WeeklyTemplate`
- [ ] Run `npx tsc --noEmit` → 0 errors

### Step 2: Plan Generators (running.ts, strength.ts)
- [ ] Rewrite `running.ts` with `RunningPlanModule` export
- [ ] Rewrite `strength.ts` with `StrengthPlanModule` export (upper/lower split)
- [ ] Write tests in `js/tests/plans/`
- [ ] Run `npm test` → all pass

### Step 3: Planning Engine (planning.ts)
- [ ] Remove `getWorkoutType()`, `getMonthAndDayIndex()`, `buildSessionFromMonth()`
- [ ] Implement `getCurrentPhaseAndWeek()`, `getActiveModules()`, `buildWeeklyPlan()`, `getSessionForDate()`
- [ ] Write tests in `js/tests/core/`
- [ ] Run `npm test` → all pass

### Step 4: Store Integration (useAppStore.ts)
- [ ] Update `computeDerived()` to use new planning functions
- [ ] Add `weeklyTemplate` to store state
- [ ] Update all `computeDerived()` call sites
- [ ] Write tests in `js/tests/stores/`
- [ ] Run `npm test` → all pass

### Step 5: Fix TodayPage (TodayPage.jsx)
- [ ] Update rendering to use new `SessionPlan` fields
- [ ] Show rest day message when `isRestDay`
- [ ] Verify 30-day strip tap updates plan (already fixed)
- [ ] Write tests in `js/tests/ui/`
- [ ] Run `npm test` → all pass

### Step 6: Demo Mode (demoData.ts)
- [ ] Update `generateDemoData()` to use `buildWeeklyPlan()`
- [ ] Generate 30 days of sessions with varied RPE (5-9)
- [ ] Write tests for demo data structure
- [ ] Run `npm test` → all pass

### Step 7: Validation
- [ ] `npx tsc --noEmit` → 0 errors
- [ ] `npm test` → 225+ tests pass (update count)
- [ ] CDP verification at http://localhost:3000/:
  - [ ] Tap dates in 30-day strip → workout changes
  - [ ] Activate demo mode → 30 days of sessions populate
  - [ ] Navigate weeks → each day shows correct workout

---

## 8. DOCUMENTATION UPDATES

After implementation, update:
- [ ] `README.md` - New architecture, test counts
- [ ] `memory-bank/progress.md` - New features, bug fixes, test counts
- [ ] `memory-bank/master-plan.md` - Phase status, feature inventory
- [ ] `PROJECT_CONTEXT.md` - Technical details, new data model
- [ ] `docs/ANALYSIS_REPORT.md` - Architecture details, test counts

---

## 9. RISKS & MITIGATIONS

| Risk | Impact | Mitigation |
|------|--------|------------|
| Breaking existing user data | High | Keep backward compatibility: old `Session` type still works, new fields optional |
| APRE integration complexity | Medium | Reuse existing `apre/engine.js`, add `apreRule` to `SessionPlan` |
| Performance (generating 30-day strip) | Low | Memoize `getSessionForDate()`, generate on-demand |
| Test count regression | High | Run `npm test` after each step, fix immediately |

---

## 10. SUCCESS CRITERIA

1. ✅ TodayPage shows workout immediately after onboarding
2. ✅ Tapping date in 30-day strip changes the displayed workout
3. ✅ Demo mode shows 30 days of varied sessions
4. ✅ `npx tsc --noEmit` → 0 errors
5. ✅ `npm test` → 225+ tests pass
6. ✅ Multi-sport support (running + strength simultaneously)
7. ✅ Periodized training (base → build → peak → deload cycles)