# MASTER PLAN — Smart Fitness Coach

**Generated:** 2026-05-24  
**Scope:** Complete APEI cycle — Analyze, Plan, Execute, Iterate  
**Phase Status:** Phase 3 ✅ 100% — Virtual date offset system complete. Weekly strip complete. Phase 4 planned.

---

## 1. CURRENT STATE ASSESSMENT

### 1.1 Architecture (Confirmed Working)

| Layer | File | Status |
|-------|------|--------|
| Entry | `index.html` | ✅ App shell, critical CSS inline, SW registration |
| Entry | `js/app.tsx` | ✅ React 18 root, lazy pages, i18n, ErrorBoundary, OnboardingWizard |
| Store | `js/stores/useAppStore.ts` | ⚠️ Tier fields added but incomplete test mock |
| Storage | `js/core/storage.ts` | ✅ Extended with checkinTier/gadgets/sports persistence |
| Core | `js/core/types.ts` | ✅ Complete type definitions |
| Core | `js/core/readiness.ts` | ✅ calcReadiness, getEffectiveReadiness, detectRecoveryDebt |
| Core | `js/core/recoveryScore.ts` | ✅ Tiered weights (full/medium/light), z-score model |
| Core | `js/core/planning.ts` | ✅ Workout type, session building, deload weeks |
| Core | `js/core/apre/engine.js` | ✅ Mann tables, 56 tests |
| Core | `js/core/analytics.ts` | ✅ Trend detection, weekly averages, overtraining warnings |
| Core | `js/core/stats.ts` | ✅ Weekly/monthly stats, streak |
| Core | `js/core/advice.ts` | ✅ Coach advice engine |
| Core | `js/core/helpers.ts` | ✅ Date utilities |
| Config | `js/config/constants.js` | ✅ MONTHS, APRE_TABLES, SPORT_CATEGORIES, GADGETS, deriveTierFromGadgets |
| UI | `js/ui/components/OnboardingWizard.jsx` | ✅ 5-step wizard (Value→Goal→Sports→Gadgets→Recovery) |
| UI | `js/ui/pages/CheckinForm.jsx` | ⚠️ Always shows all fields (no tier adaptation) |
| UI | `js/ui/pages/ProfilePage.jsx` | ⚠️ No checkinTier selector |
| CSS | `css/styles.css` | ✅ ~70KB, dark theme, onboarding styles |
| PWA | `public/manifest.json` | ⚠️ Wrong path (index.html references root) |
| PWA | `public/sw.js` | ✅ Cache-first SW |
| Tests | `js/tests/` (11 files, 153 tests) | ✅ All passing |
| Docs | `README.md` | ⚠️ References non-existent files |
| Docs | `PROJECT_CONTEXT.md` | ⚠️ Outdated (references old 3-step wizard) |
| Docs | `docs/ANALYSIS_REPORT.md` | ⚠️ Outdated test counts, feature status |
| Docs | `docs/audit-report.md` | ⚠️ Lists deleted files as present |

### 1.2 What's Broken

1. **`app.tsx:185`** — TypeScript error: `checkinTier` is `string` but `completeOnboarding` expects `CheckinTier`
   - Root cause: Wizard `onComplete` callback has implicit `string` type for `checkinTier`
2. **`manifest.json` path** — `index.html` line 7: `<link rel="manifest" href="manifest.json">` but file is at `public/manifest.json`
3. **Store test mock** — `js/tests/stores/useAppStore.test.ts` mocks `storage.ts` but doesn't include `saveSetting` export
   - Will cause: `Cannot read properties of undefined` when `setCheckinTier` is called in tests

### 1.3 What's Missing (Phase 2 → 100%)

1. **Modular plan templates** — `js/plans/running.ts` and `js/plans/strength.ts` don't exist (empty dir)
2. **CheckinForm tier adaptation** — HRV field should be hidden/disabled for medium/light tiers; RHR for light tier
3. **ProfilePage tier selector** — No UI to change checkinTier after onboarding
4. **English i18n UI activation** — `changeLanguage()` exists in `js/i18n/index.ts` but no language switcher in ProfilePage

### 1.4 What's Missing (Phase 3 Roadmap)

1. **Adaptive Recovery Score auto-detection** — Auto-adjust tier based on which metrics user actually fills in over time
2. **Extended analytics** — Correlation charts, period-over-period comparison
3. **Chart interactivity** — Hover tooltips on SVG trend charts

### 1.5 Dead Code (From Audit, Still Present)

- `js/ui/components/MiniChart.jsx` — stub returning null
- `js/ui/components/ReadinessRing.jsx` — stub returning null  
- `js/ui/components/RecoveryBar.jsx` — stub returning null
- `js/ui/pages/InfoPage.jsx` — 14KB, never loaded
- `js/ui/pages/NutritionPage.jsx` — 6KB, never loaded
- `js/ui/pages/QuickStats.jsx` — 869B, never loaded
- `ui/` root directory — 8 legacy files (Collapsible, Modal, Pill, MiniChart, InfoPage, LogPage, NutritionPage, RehabPage)
- Root stubs: `constants.js`, `engine.js`, `fitness-tracker` (empty files)

---

## 2. IMMEDIATE ACTIONS — Phase 2 → 100%

### Task I1: Fix Critical TypeScript Error in `app.tsx`

**File:** `js/app.tsx` line 184-185  
**Problem:** `checkinTier` in wizard `onComplete` data is `string`, store expects `CheckinTier`  
**Fix:** Type the callback parameter:
```tsx
onComplete={(data: { trainDays: number[]; selectedGoal?: string; apreProtocol?: string; checkinTier?: 'full' | 'medium' | 'light'; selectedGadgets?: string[]; selectedSports?: string[] }) => {
```
**Verification:** `npx tsc --noEmit` — zero errors  
**Tests:** `npm test` — all 153 pass

### Task I2: Fix `manifest.json` Path

**File:** `index.html` line 7  
**Problem:** References `manifest.json` at root, but file is at `public/manifest.json`  
**Fix:** Move `public/manifest.json` to root `manifest.json` OR change href to `public/manifest.json`  
**Decision:** Move to root since `sw.js` is also loaded from root (`/sw.js` in index.html line 204)  
**Verification:** Browser loads manifest, PWA installable  
**Tests:** No code tests needed — visual browser check

### Task I3: Fix Store Test Mock

**File:** `js/tests/stores/useAppStore.test.ts` line 7-23  
**Problem:** Mock doesn't include `saveSetting` export  
**Fix:** Add `saveSetting: vi.fn().mockResolvedValue(undefined)` to the mock  
**Verification:** `npm test` — all 153 pass  
**Tests:** Specifically verify `handleSaveCheckin` still works after adding saveSetting mock

### Task I4: Create Modular Plan Templates

**Files to create:**
- `js/plans/running.ts` — Running-specific plan data (distance-based progression)
- `js/plans/strength.ts` — Strength-specific plan data (weight-based progression)

**Approach:**
1. Extract relevant exercise subsets from `MONTHS` in `constants.js` (running exercises → `running.ts`, strength exercises → `strength.ts`)
2. Export typed plan objects with same shape as `MONTHS[index].days`
3. Keep the existing 12-week structure but sport-specific exercises

**Verification:** `npx tsc --noEmit`  
**Tests:** `js/tests/core/planning.test.ts` — add tests for sport-specific plan loading

### Task I5: Connect Modular Plans to `planning.ts`

**File:** `js/core/planning.ts`  
**Changes:**
1. Import from `js/plans/running.ts` and `js/plans/strength.ts`
2. Extend `buildSessionFromMonth` to accept optional `sport` parameter
3. Select plan based on sport (default: current MONTHS for backward compatibility)

**Verification:** `npx tsc --noEmit`, `npm test`

### Task I6: Add CheckinTier Selector to ProfilePage

**File:** `js/ui/pages/ProfilePage.jsx`  
**Changes:**
1. Import `checkinTier` and `setCheckinTier` from `useAppStore`
2. Add a collapsible "Настройки чек-ина" section with three radio buttons: Full / Medium / Light
3. Show description of what each tier collects
4. On change, call `setCheckinTier(value)`

**Verification:** `npx tsc --noEmit`, visual browser check  
**Tests:** Add component test for tier selector rendering and interaction

### Task I7: Adapt CheckinForm to Tier

**File:** `js/ui/pages/CheckinForm.jsx`  
**Changes:**
1. Import `checkinTier` from `useAppStore`
2. When tier is `light`: hide HRV and RHR rows, show only sleep + subjective
3. When tier is `medium`: hide HRV row, show RHR + sleep + subjective
4. When tier is `full`: show all fields (current behavior)
5. Add subtle tier indicator: "Уровень: Лёгкий/Средний/Полный" near save button

**Verification:** `npx tsc --noEmit`, visual browser check  
**Tests:** Update `validation.test.ts` — validation should adapt to tier (HRV validation skipped for medium/light)

### Task I8: Activate English Language Switcher

**File:** `js/ui/pages/ProfilePage.jsx`  
**Changes:**
1. Import `getCurrentLanguage` and `changeLanguage` from `../../i18n/index.js`
2. Add language toggle button (ru/en) in ProfilePage settings section
3. Persist selection (i18next localStorage detector handles this automatically)

**Verification:** `npx tsc --noEmit`, visual browser check

---

## 3. PHASE 3 DETAILED ROADMAP (TDD-First)

### Task P3-1: Adaptive Recovery Score Auto-Detection

**Goal:** If user consistently skips HRV for 7+ days, auto-suggest switching to Medium tier  
**TDD approach:**
1. Write test first in `js/tests/core/recoveryScore.test.ts`:
   - `detectOptimalTier(checkins: Checkin[]): CheckinTier` 
   - If HRV present in <30% of last 7 checkins → suggest medium
   - If HRV+RHR present in <30% of last 7 checkins → suggest light
2. Implement `detectOptimalTier` in `js/core/recoveryScore.ts`
3. Add suggestion UI in TodayPage: "Совет: переключите уровень чек-ина на Средний"
4. Run tests → green

### Task P3-2: Enhanced Analytics — Period Comparison

**Goal:** Week-over-week and month-over-month comparison in AnalyticsPage  
**TDD approach:**
1. Write tests for `getPeriodComparison()` in `js/tests/core/analytics.test.ts`
2. Implement in `js/core/analytics.ts`
3. Add comparison cards to AnalyticsPage
4. Run tests → green

### Task P3-3: Chart Interactivity — SVG Tooltips

**Goal:** Hover tooltips on trend charts  
**TDD approach:**
1. Write test for tooltip component
2. Implement `<TrendTooltip>` component
3. Wire into existing `TrendChart.jsx`
4. Run tests → green

---

## 4. PHASE 4 VISION

### Demo Mode (Phase 4 Enhancement)
- Create isolated IndexedDB instance with synthetic data
- Pre-populate with 30 days of realistic check-ins, sessions, and achievements
- Allow users to explore the app's full functionality without entering real data
- Toggle between Demo Mode and Real Mode in developer panel
- Useful for onboarding, testing, and showcasing features

### Apple Health / Google Fit Integration
- Create `js/core/healthConnect.ts` abstraction
- Platform detection + OAuth flow
- Import HRV, RHR, sleep data automatically
- **TDD:** Mock health platform API, write integration tests

### PDF Report Export
- Use `jspdf` or similar client-side PDF library
- Generate monthly summary PDF with charts
- **TDD:** Test PDF generation with mock data

---

## 5. TDD INTEGRATION PLAN

### 5.1 Test Audit

| Test File | Tests | Coverage | Needs Update? |
|-----------|-------|----------|---------------|
| `js/tests/core/apre.test.ts` | 56 | APRE engine — Mann tables, calisthenics | No |
| `js/tests/core/readiness.test.ts` | 17 | calcReadiness, recoveryDebt | Add: tier-aware readiness tests |
| `js/tests/core/planning.test.ts` | 16 | Workout type, session building | Add: sport-specific plan tests |
| `js/tests/core/stats.test.ts` | 12 | Weekly/monthly stats, streak | No |
| `js/tests/core/validation.test.ts` | 6 | Checkin validation | Add: tier-adaptive validation |
| `js/tests/core/correlations.test.ts` | 7 | Metric correlations | No |
| `js/tests/components/EmptyState.test.tsx` | 8 | EmptyState rendering | No (fixed this session) |
| `js/tests/components/StatBox.test.tsx` | 8 | StatBox rendering | No |
| `js/tests/components/ScaleSelector.test.tsx` | 7 | ScaleSelector interaction | No |
| `js/tests/components/Skeleton.test.tsx` | 7 | Skeleton loading | No |
| `js/tests/stores/useAppStore.test.ts` | 9 | Store critical path | Yes: add saveSetting mock + tier tests |

### 5.2 New Test Files Needed

1. `js/tests/core/recoveryScore.test.ts` — Tiered score calculation (full/medium/light with various data combinations)
2. `js/tests/core/analytics.test.ts` — Trend detection, period comparison
3. `js/tests/ui/OnboardingWizard.test.tsx` — 5-step wizard flow
4. `js/tests/ui/CheckinForm.test.tsx` — Tier-adaptive field rendering
5. `js/tests/ui/ProfilePage.test.tsx` — Tier selector, language switcher
6. `js/tests/plans/running.test.ts` — Running plan structure validation
7. `js/tests/plans/strength.test.ts` — Strength plan structure validation

### 5.3 Enforcement Strategy

- **Invariant:** `tsc --noEmit` + `npm test` must always be green
- **Before any code change:** write or update the relevant test
- **After any code change:** run full test suite
- **Coverage target:** >80% line coverage on core logic modules

---

## 6. SKILL USAGE PLAN

| Skill | Task | When |
|-------|------|------|
| `static-pwa-development` | PWA audit, manifest/SW verification | Phase 2 cleanup, Phase 3 |
| `systematic-debugging` | Root-cause TS errors, test failures | Throughout |
| `test-driven-development` | All new features (Phase 3+) | Phase 3+ |
| `subagent-driven-development` | Complex UI components (tier selector, analytics) | Phase 2 cleanup |
| `writing-plans` | Before executing any multi-step task | Throughout |
| `spike` | Quick experiments (chart tooltip approach) | Phase 3 |
| `requesting-code-review` | Before merging major features | Phase 3 |

---

## 7. DOCUMENTATION UPDATE PLAN

### 7.1 Files Requiring Updates

| File | What to Update | Priority |
|------|----------------|----------|
| `README.md` | Fix manifest.json path reference; update Phase 2 status to 100% when done; fix modular plans references | High |
| `PROJECT_CONTEXT.md` | Update Phase 2 status; update data model section with checkinTier/gadgets/sports fields | High |
| `docs/ANALYSIS_REPORT.md` | Update test count (153 all passing); update feature inventory; fix phase status | Medium |
| `docs/rnd-report.md` | Add "What's Been Implemented Since" section | Medium |
| `CONVENTIONS.md` | Add section on tiered feature development guidelines | Low |
| `docs/audit-report.md` | Remove references to files already deleted, or mark as historical | Low |

### 7.2 Documentation Rules

- Every feature must have test file reference in docs
- README must accurately reflect file structure
- Phase status in all docs must be synchronized
- All code examples in docs must match actual API

---

## 8. RISK REGISTER

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Tiered recovery score changes break existing user data | Medium | High | Default to 'medium' tier for all existing users; weight normalization |
| Empty `js/plans/` causes import errors | High | High | Create stub files immediately (Task I4) before any import attempts |
| `manifest.json` path breaks PWA installability | High | Medium | Fix in Task I2 before testing PWA |
| Store test mock missing `saveSetting` causes silent test failures | High | Medium | Fix in Task I3 before any store test changes |
| `app.tsx` TS error blocks compilation | High | High | Fix in Task I1 — blocks everything else |
| Onboarding wizard changes break first-time user flow | Medium | Medium | Test wizard flow in isolated browser context after changes |

---

## 9. EXECUTION ORDER

1. **Task I1** — Fix `app.tsx` TS error (blocks compilation)
2. **Task I2** — Fix `manifest.json` path (blocks PWA)
3. **Task I3** — Fix store test mock (blocks test accuracy)
4. **Task I4** — Create modular plan stubs (blocks import errors)
5. **Task I5** — Connect plans to `planning.ts`
6. **Task I6** — ProfilePage tier selector
7. **Task I7** — CheckinForm tier adaptation
8. **Task I8** — Language switcher
9. **Docs update** — Synchronize all documentation
10. **Phase 3 kickoff** — Adaptive Recovery Score (TDD-first)

---

## 10. TRACEABILITY

| Plan Item | File | Verification |
|-----------|------|--------------|
| I1 | `js/app.tsx:184-185` | `npx tsc --noEmit` |
| I2 | `index.html:7` + `manifest.json` | Browser loads manifest |
| I3 | `js/tests/stores/useAppStore.test.ts:7-23` | `npm test` green |
| I4 | `js/plans/running.ts`, `js/plans/strength.ts` | `npx tsc --noEmit` |
| I5 | `js/core/planning.ts` | `npm test` green |
| I6 | `js/ui/pages/ProfilePage.jsx` | Visual + component test |
| I7 | `js/ui/pages/CheckinForm.jsx` | Visual + validation test |
| I8 | `js/ui/pages/ProfilePage.jsx` | Visual + i18n test |
| Docs | `README.md`, `PROJECT_CONTEXT.md`, `docs/ANALYSIS_REPORT.md` | Manual review |
| Phase 3 | `js/core/recoveryScore.ts` + new tests | TDD cycle |

---

*Plan version 1.0 — Generated after full-file audit of 90+ source files, 11 test files, 6 docs, and 10 skills.*
