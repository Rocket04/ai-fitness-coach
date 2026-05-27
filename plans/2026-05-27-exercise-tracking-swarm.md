# Swarm: Exercise Tracking & Plan Adaptation

**Created:** 2026-05-27 14:05  
**Updated:** 2026-05-27 15:08  
**Model target:** Kimi K2.6 (code tasks), SWE 1.6 Fast (routine fixes), Claude Opus 4.7 Think (complex architecture)  
**Subtask count:** 6  
**Scope statement:** Add per-exercise completion tracking, weekly plan adaptation based on completion rate, rehab-aware stretching with Russian translations, daily 100% achievement, and achievements list page. All changes comply with AGENTS.md rules: add tests for core functions, update domain docs, run type-check + test before completion.

---

## Subtask 1 — Exercise Completion Tracking
- **Scope:** `js/ui/components/ExerciseCard.jsx`, `js/core/types.ts`, `js/stores/useAppStore.ts`
- **Acceptance:** 
  1. `ExerciseResult` type added to `types.ts`: `{ exerciseName: string, plannedSets: number, completedSets: number, repsPerSet: number[], completed: boolean }`
  2. `ExerciseCard.jsx` shows checkboxes for each set + reps input for non-APRE exercises
  3. `useAppStore.ts` saves `exerciseResults: ExerciseResult[]` to `Session` in `handleToggleTraining`
  4. TypeScript compiles without errors
  5. Test added: `js/tests/core/exerciseTracking.test.ts` validates `exerciseResults` structure
- **Dependencies:** None
- **Status:** [ ] pending

## Subtask 2 — Weekly Plan Adaptation
- **Scope:** `js/core/analytics.ts`, `js/core/planning.ts`
- **Acceptance:**
  1. `calculateWeeklyCompletionRate(sessions: Session[], plannedWorkouts: PlannedWorkout[], weekStart: Date): number` returns 0-1 based on `exerciseResults` vs planned sets
  2. `adaptNextWeekPlan(currentPlan: Plan, completionRate: number, plannedWorkouts: PlannedWorkout[]): Plan` adjusts volume:
     - ≥80%: volume +20%
     - 60-80%: keep same
     - <60%: volume -20%
  3. TypeScript compiles without errors
  4. Tests added: `js/tests/core/analytics.test.ts` covers completion rate and plan adaptation
- **Dependencies:** Subtask 1 (for `exerciseResults` structure)
- **Status:** [ ] pending

## Subtask 3 — Rehab-aware Stretching
- **Scope:** `js/plans/stretching.ts`, `js/core/exerciseDatabase.ts`, `js/stores/useAppStore.ts`
- **Acceptance:**
  1. `exerciseDatabase.ts` adds `rehabFor: string[]` and `avoidIf: string[]` tags to stretching exercises
  2. `stretching.ts` phase generators accept `rehabIssues: string[]` from user profile (retrieved via `useAppStore.getState().profile.rehabIssues`)
  3. Filter logic:
     - `hips`: include 90/90, cat-cow, clamshells; exclude deep forward folds
     - `shoulder`: include wall slides, scapular pull-ups; exclude overhead stretches
     - `back`: include cat-cow, bird-dog; exclude loaded flexion
  4. TypeScript compiles without errors
  5. Tests added: `js/tests/core/stretching.test.ts` validates filtering
- **Dependencies:** None
- **Status:** [ ] pending

## Subtask 4 — Stretching Translations
- **Scope:** `js/plans/stretching.ts`, `js/i18n/locales/ru.json`, `js/i18n/locales/en.json`
- **Acceptance:**
  1. All transliterated names replaced with proper Russian/English:
     - "Plevoy sustav" → "Плечевой сустав" (ru) / "Shoulder mobility" (en)
     - "Zapyastya" → "Запястья" (ru) / "Wrist stretches" (en)
     - "Raztyazhka Vsyo telo" → "Растяжка всего тела" (ru) / "Full body stretch" (en)
  2. i18n keys added to `ru.json` and `en.json` for all stretching exercise names
  3. `stretching.ts` uses i18n keys instead of hardcoded strings
  4. TypeScript compiles without errors
  5. No transliteration artifacts remain
- **Dependencies:** Subtask 3 (same file, different concerns: Subtask3 adds tags, Subtask4 updates names/i18n)
- **Status:** [ ] pending

## Subtask 5 — Daily 100% Achievement
- **Scope:** `js/core/achievements.ts`, `js/i18n/locales/ru.json`, `js/i18n/locales/en.json`
- **Acceptance:**
  1. New achievement `daily_100_percent` added:
     - Tier: bronze
     - Name: "Идеальный день" (ru) / "Perfect Day" (en)
     - Description: "Выполнил все упражнения тренировки на 100%" (ru) / "Completed 100% of planned exercises" (en)
  2. `checkAchievements()` updated to verify `exerciseResults` (from Subtask1) has all exercises with `completedSets === plannedSets`
  3. Unlocks via toast notification, persists in `unlockedAchievements`
  4. i18n keys added to `ru.json` and `en.json`
  5. TypeScript compiles without errors
  6. Test added: `js/tests/core/achievements.test.ts` validates unlock condition
- **Dependencies:** Subtask 1 (requires `plannedSets` in `exerciseResults`)
- **Status:** [ ] pending

## Subtask 6 — Achievements List Page
- **Scope:** `js/ui/pages/AchievementsPage.jsx` (new), `js/app.jsx` (add route), `js/ui/pages/ProfilePage.jsx` (add link)
- **Acceptance:**
  1. New page at `/achievements` displays grid of all achievements from `js/core/achievements.ts`
  2. Locked: grayed out with lock icon; Unlocked: colored with unlock date; Progress bars for tiered achievements
  3. Back button to Profile page
  4. Link added to ProfilePage
  5. No 404 on refresh (proper React Router setup, check existing `app.jsx` for router type)
  6. Uses `useAppStore` to fetch achievement state
  7. TypeScript compiles without errors
  8. Test added: `js/tests/components/AchievementsPage.test.tsx` validates rendering
- **Dependencies:** Subtask 5 (achievement definitions)
- **Status:** [ ] pending

---

## Disjointness Audit
| Subtask | Primary path | Overlaps with | Resolution |
|---|---|---|---|
| 1 | `types.ts`, `ExerciseCard.jsx`, `useAppStore.ts` | — | — |
| 2 | `analytics.ts`, `planning.ts` | — | — |
| 3 | `stretching.ts` (filter logic), `exerciseDatabase.ts` | Subtask4 | Subtask3 adds `rehabFor`/`avoidIf` tags; Subtask4 updates display names/i18n keys |
| 4 | `stretching.ts` (names), `i18n/` | Subtask3 | Same as above |
| 5 | `achievements.ts`, `i18n/` | — | — |
| 6 | `AchievementsPage.jsx`, `app.jsx`, `ProfilePage.jsx` | — | — |

**Merge Order:** 3 → 4 (same file, non-conflicting changes); others independent.

---

## Launch Order (Kilo Workflow)
1. Use `agent_manager` tool to create 6 worktree sessions (mode: worktree) for parallel execution, or use `task` tool for subagents
2. For each session, select model per AGENTS.md:
   - Subtasks 1,3,5,6: Kimi K2.6 (code tasks)
   - Subtasks 2,4: SWE 1.6 Fast (routine fixes)
   - Complex issues: Escalate to Claude Opus 4.7 Think
3. Paste the updated per-pane prompts (below) into each session
4. Monitor progress; all agents must run `npm run type-check && npm test` before declaring completion

**IMPORTANT:** All agents must `cd` to project root before running npm commands: `Set-Location -Path 'c:\Projects\fitness-tracker'`

---

## Per-Pane Launch Plan
```
Pane 1 (top-left):     Subtask 1 — Exercise Completion Tracking → types.ts, ExerciseCard.jsx, useAppStore.ts
Pane 2 (top-middle):   Subtask 2 — Weekly Plan Adaptation → analytics.ts, planning.ts
Pane 3 (top-right):    Subtask 3 — Rehab-aware Stretching → stretching.ts, exerciseDatabase.ts
Pane 4 (bottom-left):  Subtask 4 — Stretching Translations → stretching.ts, i18n/
Pane 5 (bottom-middle):Subtask 5 — Daily 100% Achievement → achievements.ts, i18n/
Pane 6 (bottom-right): Subtask 6 — Achievements List Page → AchievementsPage.jsx, app.jsx, ProfilePage.jsx
```

---

## Documentation Update Requirements (per AGENTS.md)
Each subtask must update the relevant domain doc:
- Subtasks 1,2,5: Update `docs/domains/core/README.md` (types, analytics, achievements)
- Subtask 3,4: Update `docs/domains/plans/README.md` (stretching, exercise database)
- Subtask 6: Update `docs/domains/ui/README.md` (pages, routing)

---

## Updated Subtask Prompts (copy-paste ready)

### Pane 1
```
Implement per-exercise completion tracking in Smart Fitness Coach.

Files to modify:
- js/core/types.ts: Add ExerciseResult type { exerciseName: string, plannedSets: number, completedSets: number, repsPerSet: number[], completed: boolean }
- js/ui/components/ExerciseCard.jsx: For non-APRE exercises, show checkboxes for each set + input for reps done
- js/stores/useAppStore.ts: In handleToggleTraining, save exerciseResults: ExerciseResult[] to Session

Acceptance:
1. ExerciseCard shows "Подход 1 [✓] Повторения [__]" for each set
2. User can check off completed sets and enter reps
3. Session saves {exerciseResults: ExerciseResult[]} with plannedSets included
4. TypeScript compiles without errors
5. Add test: js/tests/core/exerciseTracking.test.ts validates exerciseResults structure
6. Update docs/domains/core/README.md with new ExerciseResult type

Read AGENTS.md first. Run: Set-Location -Path 'c:\Projects\fitness-tracker'; npm run type-check; npm test
```

### Pane 2
```
Implement weekly plan adaptation based on completion rate.

Files to modify:
- js/core/analytics.ts: Add calculateWeeklyCompletionRate(sessions, plannedWorkouts, weekStart) → 0-1
- js/core/planning.ts: Add adaptNextWeekPlan(currentPlan, completionRate, plannedWorkouts) → adjustedPlan

Logic (aligned with acceptance criteria):
- completionRate >= 0.8: volume +20%
- completionRate 0.6-0.8: keep same
- completionRate < 0.6: volume -20%

Acceptance:
1. Function returns correct completion rate from exerciseResults (plannedSets vs completedSets)
2. Next week's plan is adjusted based on rate
3. TypeScript compiles without errors
4. Add test: js/tests/core/analytics.test.ts covers completion rate and adaptation
5. Update docs/domains/core/README.md with new analytics functions

Read AGENTS.md first. Run: Set-Location -Path 'c:\Projects\fitness-tracker'; npm run type-check; npm test
```

### Pane 3
```
Implement rehab-aware stretching generation.

Files to modify:
- js/plans/stretching.ts: Modify basePhase/buildPhase/peakPhase to accept rehabIssues[] from useAppStore.getState().profile.rehabIssues
- js/core/exerciseDatabase.ts: Add rehabFor: string[] and avoidIf: string[] tags to stretching exercises

Logic:
- rehabIssues=['hips']: include 90/90, cat-cow, clamshells; exclude deep forward folds
- rehabIssues=['shoulder']: include wall slides, scapular pull-ups; exclude overhead stretches
- rehabIssues=['back']: include cat-cow, bird-dog; exclude loaded flexion

Acceptance:
1. Stretching sessions dynamically generated based on active rehab zones
2. Contraindicated stretches excluded via tags
3. TypeScript compiles without errors
4. Add test: js/tests/core/stretching.test.ts validates filtering
5. Update docs/domains/plans/README.md with rehab-aware stretching logic

Read AGENTS.md first. Run: Set-Location -Path 'c:\Projects\fitness-tracker'; npm run type-check; npm test
```

### Pane 4
```
Fix stretching exercise translations.

Files to modify:
- js/plans/stretching.ts: Replace transliterated names with proper Russian/English, use i18n keys
- js/i18n/locales/ru.json: Add keys for all stretching exercise names
- js/i18n/locales/en.json: Add keys for all stretching exercise names

Current → Target:
- "Plevoy sustav" → "Плечевой сустав" (ru) / "Shoulder mobility" (en)
- "Zapyastya" → "Запястья" (ru) / "Wrist stretches" (en)
- "Raztyazhka Vsyo telo" → "Растяжка всего тела" (ru) / "Full body stretch" (en)

Acceptance:
1. All stretching exercise names are human-readable via i18n
2. No transliteration artifacts remain
3. TypeScript compiles without errors
4. Update docs/domains/plans/README.md with i18n integration

Read AGENTS.md first. Run: Set-Location -Path 'c:\Projects\fitness-tracker'; npm run type-check; npm test
```

### Pane 5
```
Add daily 100% completion achievement.

Files to modify:
- js/core/achievements.ts: Add new achievement definition, update checkAchievements() to verify exerciseResults
- js/i18n/locales/ru.json: Add i18n keys for achievement
- js/i18n/locales/en.json: Add i18n keys for achievement

Achievement details:
- key: 'daily_100_percent'
- name: 'Идеальный день' (ru) / 'Perfect Day' (en)
- description: 'Выполнил все упражнения тренировки на 100%' (ru) / 'Completed 100% of planned exercises' (en)
- tier: 'bronze'

Logic:
- Check if all exerciseResults have completedSets === plannedSets
- Unlock via toast notification, persist in unlockedAchievements

Acceptance:
1. Achievement unlocks when all exercises 100% completed
2. Shows in toast notification
3. Persists across sessions
4. TypeScript compiles without errors
5. Add test: js/tests/core/achievements.test.ts validates unlock condition
6. Update docs/domains/core/README.md with new achievement

Read AGENTS.md first. Run: Set-Location -Path 'c:\Projects\fitness-tracker'; npm run type-check; npm test
```

### Pane 6
```
Create achievements list page.

Files to create:
- js/ui/pages/AchievementsPage.jsx: New page component

Files to modify:
- js/app.jsx: Add route /achievements (check existing router setup)
- js/ui/pages/ProfilePage.jsx: Add link to achievements
- js/core/achievements.ts: Export achievement list for page use

Page requirements:
- Grid layout of all achievements from js/core/achievements.ts
- Locked: grayed out with lock icon
- Unlocked: colored with unlock date
- Progress bars for tiered achievements
- Back button to profile
- Uses useAppStore to fetch achievement state

Acceptance:
1. Page displays at /achievements without 404 on refresh
2. Shows all achievements with correct locked/unlocked state
3. TypeScript compiles without errors
4. Add test: js/tests/components/AchievementsPage.test.tsx validates rendering
5. Update docs/domains/ui/README.md with new page

Read AGENTS.md first. Run: Set-Location -Path 'c:\Projects\fitness-tracker'; npm run type-check; npm test
```

(End of file)
