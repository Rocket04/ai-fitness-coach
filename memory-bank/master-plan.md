# MASTER PLAN — Smart Fitness Coach

**Last verified:** 2026-05-26  
**Current status:** Local-first prototype with APRE, tiered check-in, multi-sport templates, and basic analytics.  
**Primary objective:** make the daily training recommendation reliable, explainable, and testable.

## 1. Verified Current State

### Working or mostly working

| Area | Status |
|---|---|
| React/Vite app | Working |
| Zustand store | Working, central state |
| Dexie / IndexedDB | Working |
| Manual check-in | Working |
| Tiered Recovery Score | Implemented |
| Readiness status | Implemented with threshold logic |
| APRE engine | Implemented |
| 8 sport plan modules | Present |
| Profile: sports, gadgets, rehab, equipment | Partially implemented |
| Analytics charts | Present |
| Demo mode / virtual date | Present |
| i18n ru/en | Present |

### Known technical state

- `npm run type-check` passes.
- `npm test` currently fails.
- Latest observed test status: `297 passed / 33 failed`, `10 failed files`.

### Known test failure categories

- `MiniSparkline`: `React is not defined`.
- `TrendChart`: `ResizeObserver is not defined` in tests.
- `TodayPage.weekly`: expected `.weekly-strip` not rendered.
- Additional component/UI test failures require triage.

## 2. Product Truth

### This project is currently

A local-first adaptive training planner with manual data entry and transparent APRE-based strength autoregulation.

### This project is not yet

- a wearable-connected health platform;
- a clinical safety system;
- a complete health OS;
- a personalized nutrition coach;
- a validated recovery model;
- a full annual periodization engine.

## 3. Priority Roadmap

## Phase 0 — Stabilization

**Goal:** make the current product honest and shippable.

### Required tasks

1. Fix all failing tests.
2. Remove or relabel fake integrations as "planned".
3. Align docs with actual code.
4. Add visible non-medical disclaimer.
5. Add recommendation explanation block:
   - input signals;
   - decision;
   - plan changes;
   - confidence.

### Exit criteria

- `npm run type-check` green.
- `npm test` green.
- Docs no longer claim missing features.
- User can understand why today is green/yellow/red.

## Phase 1 — Better Session Logging

**Goal:** make training results useful for adaptation.

### Tasks

1. Add set-level data model:
   - exerciseId;
   - setIndex;
   - target reps;
   - actual reps;
   - weight;
   - RPE;
   - pain;
   - completed.
2. Persist set logs in IndexedDB.
3. Connect set logs to APRE.
4. Add live workout autosave.
5. Add post-session pain and fatigue feedback.

### Exit criteria

- A completed workout contains enough data to adapt the next workout.
- APRE uses actual set results, not only generic session RPE.

## Phase 2 — Explanation and Safety

**Goal:** earn trust.

### Tasks

1. Add PAR-Q+ inspired safety questionnaire.
2. Add red-flag rules:
   - acute pain;
   - chest symptoms;
   - abnormal breathing;
   - severe fatigue;
   - high pain trend.
3. Add pain-aware substitutions:
   - pain location;
   - movement pattern;
   - contraindicated exercises;
   - replacement;
   - reduced dose.
4. Show explanations:
   - "why readiness changed";
   - "what was changed in the plan";
   - "what to watch next".

### Exit criteria

- The app can explain every training reduction.
- Pain no longer only filters strings; it changes movement selection.

## Phase 3 — Load Model

**Goal:** move beyond simple readiness.

### Tasks

1. Keep sRPE session load.
2. Add weekly acute/chronic load approximation.
3. Decide whether to implement ACWR or explicitly reject it.
4. Add CTL/ATL/TSB-inspired metrics or simpler transparent alternative.
5. Add sport-specific load units.

### Exit criteria

- The app can detect load spikes and undertraining.
- Warnings are based on both recovery and load.

## Phase 4 — Periodized Planning

**Goal:** move from repeating weekly templates to goal-based planning.

### Tasks

1. Add goal date or event.
2. Add mesocycles.
3. Add deload scheduling.
4. Add test/retest weeks.
5. Add taper/off-season.
6. Add annual overview.

### Exit criteria

- User can plan 3-12 months.
- The plan adapts when sessions are missed or recovery is poor.

## Phase 5 — Data Ingestion

**Goal:** reduce manual input.

### Tasks

1. Define integration strategy:
   - Apple Health / HealthKit;
   - Health Connect Android;
   - Garmin / Strava import;
   - CSV import fallback.
2. Add source metadata per metric.
3. Add permissions and privacy UI.
4. Add baseline confidence scoring.
5. Add failure states for missing or stale data.

### Exit criteria

- At least one real data source imports HRV/RHR/sleep.
- The app can distinguish manual vs imported data.
- User can revoke access.

## Phase 6 — Optional Health Layer

**Goal:** only after training core is trustworthy.

### Tasks

1. Sleep trend recommendations.
2. Nutrition target calculator by goal and body weight.
3. Supplement education with safety disclaimers.
4. Lab marker tracking as manual fields.
5. Optional encrypted sync.

### Exit criteria

- Advice is personalized from actual data.
- No medical claims without evidence and disclaimer.

## 4. Non-goals

For now, do not prioritize:

- social feed;
- leaderboards;
- PDF export as core feature;
- generic AI chat;
- community exercise library without moderation;
- "Health OS" branding.

## 5. Documentation Rules

Docs must classify every feature as:

- implemented;
- partial;
- planned;
- removed.

No document may claim "0 failures" unless verified in the same session.
