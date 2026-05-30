# Swarm: Phase 1 — Exercise Tracking Loop → Plan Adaptation

**Created:** 2026-05-29
**Model target:** Check picker for current promo/free model
**Subtask count:** 5 (after prerequisite types change)
**Scope statement:** "Implement the exercise tracking loop: per-set completion checkboxes on non-APRE exercises, store set results, compute completion rate, and adapt next week's plan volume based on adherence"

---

## Prerequisite (do first — touches shared types)

### Subtask 0 — Extend Session type
- **Scope:** `js/core/types.ts`
- **Acceptance:** Session interface has `exerciseResults?: ExerciseResult[]`, `postSessionFatigue?: number`, `postSessionPain?: number`, `plannedTotalSets?: number`. `npm run type-check` passes.
- **Pane:** Sequential prerequisite — run this first, then fan out below.
- **Status:** [ ] pending

After Subtask 0 is done, fan out to 6 parallel panes:

---

## Parallel Subtasks (after Subtask 0 completes)

### Subtask 1 — completionRate.ts module + tests
- **Scope:** `js/core/completionRate.ts` (new) + `js/tests/core/completionRate.test.ts` (new)
- **Acceptance:** Two pure functions exported: `calculateSessionCompletionRate(session, plan): number` and `calculateWeeklyCompletionRate(sessions, plans, weekStartISO): number`. Tests cover: 100%, 0%, 50% completion, empty arrays, no exerciseResults. All tests pass.
- **Pane:** 1 (top-left)
- **Status:** [ ] pending

### Subtask 2 — adherenceMultiplier in planning.ts + tests
- **Scope:** `js/core/planning.ts` + `js/tests/core/adherenceMultiplier.test.ts` (new)
- **Acceptance:** `getVolumeMultiplierFromAdherence(rate): number` added to planning.ts. Logic: ≥0.8→1.2, ≥0.6→1.0, <0.6→0.8. `getAdaptedSessionForDate()` signature updated to accept optional `volumeMultiplier` parameter (default 1.0) and applies it to planned sets (round, min 1). `computeDerived()` in useAppStore.ts is NOT touched — only the planning.ts function signature+body. Tests cover boundary values (0.8→1.2, 0.6→1.0, 0.59→0.8, 0→0.8, 1.0→1.2). All tests pass. `npm run type-check` passes.
- **Pane:** 2 (top-middle)
- **Status:** [ ] pending

### Subtask 3 — Store: pendingSetResults + actions
- **Scope:** `js/stores/useAppStore.ts`
- **Acceptance:** Store has new state: `pendingSetResults: SetResult[]`, `postSessionFatigue: number`, `postSessionPain: number`. New actions: `updateSetResult(result: SetResult)` (upserts by exerciseName+setNumber), `setPostSessionFatigue(v)`, `setPostSessionPain(v)`. In `handleToggleTraining`: on save, computes `ExerciseResult[]` from `pendingSetResults`, attaches to `Session.exerciseResults`, attaches fatigue/pain, clears `pendingSetResults`. Store interface updated. `npm run type-check` passes.
- **Pane:** 3 (top-right)
- **Status:** [ ] pending

### Subtask 4 — ExerciseCard per-set checkboxes
- **Scope:** `js/ui/components/ExerciseCard.jsx`
- **Acceptance:** New prop `onSetComplete?: (exName: string, setNumber: number, completedReps: number) => void`. Non-APRE exercises render one checkbox per planned set (from `ex.s` field parsing). Each checkbox shows set number + planned reps + weight if present. Checking calls `onSetComplete(ex.n, setNumber, parsedReps)`. APRE exercises unchanged. `npm run type-check` passes.
- **Pane:** 4 (bottom-left)
- **Status:** [ ] pending

### Subtask 5 — TodayPage wire-up + fatigue/pain UI
- **Scope:** `js/ui/pages/TodayPage.jsx` + `js/core/types.ts` (add to AppDispatch)
- **Acceptance:** TodayPage passes `onSetComplete` prop to ExerciseCard, wired to store's `updateSetResult`. After training section, add small form: "Усталость после тренировки (1-10)" and "Боль после тренировки (0-10)" sliders/inputs wired to `setPostSessionFatigue`/`setPostSessionPain`. Add `updateSetResult`, `setPostSessionFatigue`, `setPostSessionPain` to `AppDispatch` interface in types.ts. `npm run type-check` passes.
- **Pane:** 5 (bottom-middle)
- **Status:** [ ] pending

### Subtask 6 — Integration verification
- **Scope:** Run from project root: `cd C:\Projects\fitness-tracker`; `npm run type-check`; `npm test`
- **Acceptance:** TypeScript: 0 errors. All tests pass (including new ones). Report test counts and any failures.
- **Pane:** 6 (bottom-right)
- **Status:** [ ] pending

---

## Disjointness audit

| Subtask | Primary path | Overlaps with |
|---|---|---|
| 0 (prereq) | `js/core/types.ts` | — (run first) |
| 1 | `js/core/completionRate.ts` + `js/tests/core/completionRate.test.ts` | — |
| 2 | `js/core/planning.ts` + `js/tests/core/adherenceMultiplier.test.ts` | — |
| 3 | `js/stores/useAppStore.ts` | — |
| 4 | `js/ui/components/ExerciseCard.jsx` | — |
| 5 | `js/ui/pages/TodayPage.jsx` + `js/core/types.ts` (AppDispatch) | types.ts (Subtask 0) — Subtask 5 only ADDS to AppDispatch, doesn't change Session fields |
| 6 | project root (npm commands) | — |

Subtask 5 touches types.ts but only adds to the `AppDispatch` interface (separate additive change). No conflict with Subtask 0's Session changes.

---

## Launch order

### Step 0 — Run prerequisite first:
```
Pane (any): Subtask 0 — Extend Session type → js/core/types.ts
Wait for completion before fanning out.
```

### Step 1 — Fan out to 6 panes (after Subtask 0 done):

```
Pane 1 (top-left):      Subtask 1 — completionRate module + tests → js/core/completionRate.ts
Pane 2 (top-middle):    Subtask 2 — adherenceMultiplier + tests → js/core/planning.ts
Pane 3 (top-right):     Subtask 3 — Store pendingSetResults + actions → js/stores/useAppStore.ts
Pane 4 (bottom-left):   Subtask 4 — ExerciseCard per-set checkboxes → js/ui/components/ExerciseCard.jsx
Pane 5 (bottom-middle): Subtask 5 — TodayPage wire-up + fatigue/pain UI → js/ui/pages/TodayPage.jsx
Pane 6 (bottom-right):  Subtask 6 — Integration verification (npm type-check + npm test)
```

**IMPORTANT:** If any agent needs to run npm commands (npm run type-check, npm test, etc.), they MUST first cd to `C:\Projects\fitness-tracker`. Otherwise npm will fail with ENOENT looking for package.json in the wrong directory.

Each subtask prompt below should be pasted verbatim into its assigned pane.