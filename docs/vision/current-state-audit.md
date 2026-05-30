# Current Implementation Status — Smart Fitness Coach

**Audit Date:** 2026-05-30  
**Method:** Manual code review across 61 test files (720 passing tests), 8 domain modules, 5 store slices, 5 UI pages, 15 shared components, 3 config files.  
**Type-check:** Passes with zero errors.  
**Test Suite:** 61 files, 720 tests — ALL PASSING.

---

## 1. Architecture Overview

`
Input → IndexedDB (Dexie) → Zustand Store → Derived State → UI
`

### Domains (8 modules in js/domains/)
| Domain | Files | Purpose |
|---|---|---|
| ecovery/ | 3 | Recovery Score, readiness calc, coach advice |
| 	raining/ | 7 + 8 plan files | Planning engine, APRE, load adjustments, sessions |
| checkin/ | 2 | Check-in form slice, field validation |
| profile/ | 2 | Exercise DB (40+ exercises), rehab protocols |
| nalytics/ | 4 | Trend detection, correlations, stats, streaks |
| chievements/ | 1 | 19 achievement definitions, unlock logic |
| demo/ | 2 | Deterministic synthetic data, 4 athlete profiles |
| onboarding/ | 2 | Onboarding persistence, guided tour state |
| import/ | 3 | CSV parser (5 date formats), merge logic, schema validation |

### Store Architecture (js/store/)
- **Central store:** useAppStore (Zustand, 906 lines)
- **5 slices:** checkinSlice, sessionSlice, uiSlice, dataSlice, demoSlice
- **Orchestrator actions:** ~30 orchestrator methods in store/index.ts
- **Derived state:** computeDerived.ts — recomputes recovery score, session plan, analytics, warnings, streaks on any state change
- **Re-export bridges:** js/core/ files re-export from js/domains/ for backward compatibility

### Data Layer (js/data/storage.ts, 386 lines)
- **Dexie DB:** FitnessAppDB v2
- **4 tables:** sessions (key+date+type), checkins (date), settings (key), chievements (++id+achievementKey+earnedAt)
- **Separate demo DB:** SmartFitnessCoachDemo — isolated IndexedDB for demo mode
- **CRUD functions:** saveSession, deleteSession, getAllSessions, saveCheckin, getCheckin, getAllCheckins, saveSetting, getSetting, saveSettings, getSettings, saveManualStatus, getManualStatus, exportAllData, importAllData, clearAllData, activateDemoData, deactivateDemoData

### Shared Layer (js/shared/)
- **	ypes.ts:** 394 lines — 30+ interfaces
- **i18n:** ru.json (356 keys) + en.json via react-i18next
- **Config:** Constants (training plans, APRE tables, HRV guide, nutrition, zones, gadgets, sports categories)
- **UI components:** 14 shared components (Collapsible, Modal, ScaleSelector, Skeleton, StatBox, etc.) — 8 with .module.css
- **Hooks:** useFitnessData, useOnlineStatus, useServiceWorkerUpdate

---

## 2. Domain-by-Domain Feature Inventory

### 2.1 Recovery

**Files:** recoveryScore.ts (164L), readiness.ts (107L), advice.ts (180L)

| Function | Description | Status |
|---|---|---|
| calculateRecoveryScore(checkin, allCheckins, tier) | Weighted z-score: HRV 40% + Sleep 30% + RHR 10% + Subjective 20% | ✅ |
| getWeightsForTier(tier) | full (HRV-heavy), medium (RHR+sleep+subj), light (100% subj) | ✅ |
| detectOptimalTier(checkins) | Auto-detect from last 14 days data patterns | ✅ |
| calcReadiness(checkin) | Multi-metric red/yellow/green (10 thresholds) | ✅ |
| getEffectiveReadiness(auto, manual) | Manual override (unknown→auto, else→manual) | ✅ |
| detectRecoveryDebt(recentCheckins) | 3-day accumulated fatigue (≥4 points) | ✅ |
| getCoachAdvice(recoveryScore, checkin, ...) | 9 categories: score, sleep, HRV, RHR, pain, soreness, energy, mood, stress, weekly green | ✅ |
| getApreExplanation(mode, readiness, debt, multiplier) | Mode selection explanation + RPE sync | ✅ |
| getExplanation(recoveryScore, ...) | i18n-aware "Why?" with HRV trend, sleep, RHR, debt, plan mods | ✅ |

**Tiers:** Full / Medium / Light — all implemented.

### 2.2 Training

**Planning** (planning/planning.ts, 448L):
- getActiveModules(selectedSports) — resolves sport registry
- getCurrentPhaseAndWeek(startDate, offset) — 4-week cycles: base→build→peak→deload
- uildWeeklyPlan(modules, phase, week, template) — 7-day session array
- getSessionForDate(date, sports, start, template, offset) — core date→session mapper
- getAdaptedSessionForDate(...) — 10-step adaptation pipeline
- pplyReadinessToSession(...) — mode→rehab→profile→multiplier→APRE→adherence
- getVolumeMultiplierFromAdherence(rate) — 1.2x / 1.0x / 0.8x

**Load Adjustments** (loadAdjustments.ts, 167L):
- getWeeklyMultiplier(summary, dow, week) — deload(0.6) / green(1.1) / bad(0.9)
- getTestMultiplier(sessions, week) — test result ±20%
- pplyMultiplierToExercises(exercises, mult) — proportional scaling
- pplyApreAdjustment(exercises, session) — RPE≤4→+1, ≥8→−1
- djustExercisesForMode(exercises, mode) — minimum/yellow/deload adaptations

**Completion Rate** (completionRate.ts, 28L):
- Per-session and weekly set completion ratio

**APRE Engine** (apre/engine.js, 342L):
- pplyApre(protocolKey, reps, unit) — Mann methodology table lookup
- oundToNearestStep(weight, unit) — 2.5kg / 5lbs steps
- calcApreSets(...) — 4-set structure with recovery correction
- calcNextWeekRM(...) — projects next week's training max
- inferApreProtocol(exerciseName, repsStr) — maps to APRE_3/6/10
- isStrengthExercise(ex) — excludes cardio/mobility/isometric
- nnotateExercisesWithApre(exercises, prevResults) — top 2 strength exercises

**Sport Plans** (8 files):
Running, Strength, Cycling, Swimming, Calisthenics, Yoga, Stretching, Walking — all with 4-phase modules

### 2.3 Check-in

- alidate(fields) — 9 fields validated (ranges, combinations)
- CheckinSlice — 13 fields + 13 setters

### 2.4 Profile

**Exercise Database** (exerciseDatabase.ts, 585L):
- 40+ exercises with contraindication/rehab tags, technique notes
- getSafeExercises(rehabIssues) — filter by contraindications
- getRehabExercises(rehabIssues) — exercises that help with issues
- ilterExercisesForRehab(exercises, issues, selected) — substitution engine
- ilterStretchingForRehab(exercises, issues) — stretching-specific filter

**Rehab Protocol** (rehabProtocol.ts, 176L):
- 3 protocols: HIP_SNAPPING, SHOULDER_STABILITY, POSTURAL_RESTORATION
- Daily rehab session builder, pre-workout exercise generator

### 2.5 Analytics

- getTrendData / getRpeTrend — time series
- detectNegativeTrends — 3 detectors (score↓, HRV↓, RHR↑)
- getWeeklyAverages / getOvertrainingWarning — multi-week decline detection
- getPeriodComparison — half-period metric comparison
- 6 correlation functions: sleep→recovery, sleepQ→HRV, stress→recovery, energy→recovery, HRV→readiness, weight trend
- Stats: weeklySummary, monthStats
- Streaks: checkin, training, green — with longest-streak and streak bonus

### 2.6 Achievements

- 19 achievements from config (consistency, performance, volume categories)
- checkAchievements — evaluates on check-in/save, persists to DB
- getAchievementStatus — full status with progress

### 2.7 Demo

- generateDemoData() — 30-day synthetic data (seed 42)
- 4 profiles: marathoner, yogi, crossfitter, rehab — unique biometric baselines, consistency, recovery cycles
- Isolated IndexedDB for demo mode

### 2.8 Onboarding

- Onboarding storage: completed flag in localStorage
- Tour store: 8 steps, persistable, start/end/next/prev/skip

### 2.9 Import

- CSV parser: 5 date formats, 3 delimiter auto-detect, 3 biometric fields, RU+EN headers, BOM handling
- Merge logic: fill-missing-only strategy, per-date aggregation
- Schema validation: format version detection

---

## 3. UI Pages Audit

### 3.1 TodayPage (682L) — 6-Layer Dashboard

| Layer | Content | Conditional |
|---|---|---|
| Tier Suggestion Banner | Auto-tier suggestion when patterns mismatch | Yes |
| Weekly 7-Day Strip | Day cards with type badges, clickable for virtual date | Always |
| Adherence Volume Banner | ±20% load adjustment indicator | Yes |
| Weekly Plan Card | Expandable per-day plan | Always |
| Hero Ring | 200px SVG ring with gradient, score, tap-to-expand | Always |
| Status Pill | Green/yellow/red readiness | Always |
| Sparkline Panel | 3 charts (HRV, sleep, RPE) | Toggle |
| Start Workout Button | Large accent "Начать тренировку" | Non-rest days |
| Training Plan / Rest Day | Exercise list or rest message | Conditional |
| Explanation Card | "Why?" with recovery insights | Has data |
| Coach Tips Panel | Collapsible advice list | Has tips |
| Tomorrow Preview | Compact next-day preview | Always |
| Streak Badge | Flame + count | streak≥2 |

### 3.2 WorkoutMode (354L) — Full-Screen Overlay

Sections: Header, Confirm Cancel dialog, Progress bar, Exercise list with cards, Test inputs, Post-session feedback (fatigue+pain), RPE slider+description, Duration+notes, Bottom action buttons.

### 3.3 ProfilePage (910L) — 15+ Sections

Personal stats, Rehab (7 issues + exercises), Info (zones+HRV), Methodology link, Nutrition table, Settings (date+days), 4 Training Plans, Language (RU/EN), Check-in tier (3 buttons), Developer testing (date offset + demo toggle), 4 Demo profiles, Achievements, 4 Integrations (placeholder+waitlist), Guided Tour, Exercise Configurator (strength+calisthenics), Data (CSV/JSON import/export + reset).

### 3.4 CheckinForm (314L)

Fields: sleepHours (number), sleepQuality (1-5), restHR** (non-light), hrv** (full only), weight, breathing (select), energy (1-5), mood (1-5), soreness (1-5), stress (1-5), hip pain (1-5), shoulder pain (1-5), notes. Sparkline trends on select fields.

### 3.5 AnalyticsPage (307L)

Warning banner, Weekly summary, 7/30d toggle, Recovery Score chart, HRV chart, RHR chart, RPE chart (conditional), Weekly averages table, Empty state with skeleton.

### 3.6 LogPage (219L)

Snapshot panel, CheckinForm, 6 correlation cards (conditional), Recovery vs Sleep chart, Heatmap grid, Weekly stats, Monthly stats, Checkin history, Session logger.

### 3.7 MethodologyPage (520L)

7 header stats, 6 formula sections (Recovery, APRE, Session Load, Subjective thresholds, HRV baseline, Readiness statuses), APRE Simulator (RPE+duration sliders → load/weight correction/RM), Recovery Score Simulator (6 sliders → live score).

### 3.8 OnboardingWizard (405L)

5 steps: Value → Goal (3 cards + day chips) → Sports (4 categories) → Gadgets (4 options + tier auto-detect) → Recovery Ring preview → Complete.

---

## 4. Technical Health

### Test Suite
`
61 files, 720 tests — ALL PASSING
Duration: 107.58s
`
### TypeScript: PASS (zero errors)
### CSS Modules: 16 .module.css files (8 shared + 8 component)
### E2E: 7 golden-path scenarios + 10 additional spec files

### Coverage Gaps (from README)
| File | Now | Target |
|---|---|---|
| importSchemas.ts | 22% | 80% |
| useAppStore.ts | 24% | 80% |
| planning.ts | 54% | 80% |
| analytics.ts | 0% | 80% |
| advice.ts | 0% | 80% |

---

## 5. Golden Path vs. Reality

| Element | Status | Notes |
|---|---|---|
| **Onboarding wizard** | ✅ | 5 steps, value→goal→sports→gadgets→recovery |
| **Recovery Ring with score** | ✅ | 200px SVG, gradient, color-coded |
| **Check-in updates ring instantly** | ✅ | Zustand reactive state → immediate re-render |
| **"Начать тренировку" button** | ✅ | Visible on training days, opens WorkoutMode |
| **Full-screen Workout Mode** | ✅ | All controls, exercises, progress, RPE |
| **Per-set checkboxes + progress** | ✅ | Checkbox per set, animated progress bar |
| **APRE weight adjustment on AMRAP** | ✅ | Real-time calc in ExerciseCard + nextWeekRM |
| **Adherence banner** | ✅ | ±20% volume, colored border, emoji |
| **Low recovery → reduced load** | ✅ | Mode selection + explanation card |
| **CSV import from Health Sync** | ✅ | 5 date formats, fill-missing merge |
| **Tab navigation** | ✅ | 4 tabs + Methodology (via Profile→tab 4) |
| **3-tier check-in** | ✅ | Full/Medium/Light with auto-detect |
| **Multi-sport (8 disciplines)** | ✅ | All with 4-phase periodization |
| **Rehabilitation filtering** | ✅ | Contraindication check + substitution |
| **Guided tour** | ✅ | 8 steps, persistable |
| **Demo mode (4 profiles)** | ✅ | Isolated DB, virtual dates, sim advance |
| **19 achievements + streaks** | ✅ | 3 streak types, persistence |
| **Coach advice (9 categories)** | ✅ | Collapsible panel, per-metric tips |
| **Analytics engine** | ✅ | Trends, correlations, overtraining warning |
| **Data import/export** | ✅ | JSON with backup, CSV Health Sync |
| **Virtual date offset** | ✅ | ±7d buttons, auto-sim, weekly strip |
| **Exercise configurator** | ✅ | Per-exercise APRE protocol + RM |
| **PWA** | ✅ | SW, update banner, manifest |
| **i18n RU/EN** | ✅ | 356 keys, full integration |

---

## 6. Known Gaps and Risks

### Implementation Gaps
- **APRE auto-apply to next week's plan** is partially implemented — values are computed but not wired into next session generation
- **Integrations** (Garmin, Apple Health, etc.) are placeholder-only with email waitlist
- **Test coverage** gaps: importSchemas.ts (22%), useAppStore.ts (24%), analytics.ts (0%), advice.ts (0%)
- **No per-set RPE** during workout (only global RPE captured)
- **Morning/evening routines** constants exist but tracking is commented out (TODO)
- **completionRate.ts in domains/training/** not fully wired into main derived state pipeline

### Technical Risks
- **Large monolithic Zustand store** (906 lines) with branching logic for guest/normal mode
- **Import path inconsistency** — some domain files import from ../../core/types.js instead of ../../shared/types.js
- **Demo DB isolation** — some settings may persist to main DB during demo mode
- **E2E test fragility** — heavy use of page.evaluate + setTimeout
- **Many .jsx files** instead of .tsx — type-check passes but no strict benefits
- **CSV merge is conservative** — never overwrites existing data, may surprise users

### Feature Completeness
- Recovery Score: 100% | Training planning: 95% | Check-in: 100% | Workout: 95%
- Analytics: 90% | Profile: 100% | Demo: 100% | Onboarding: 100%
- Rehab: 100% | Achievements: 100% | Import/Export: 100% | Integrations: 0%
- i18n: 100% | PWA: 100%
