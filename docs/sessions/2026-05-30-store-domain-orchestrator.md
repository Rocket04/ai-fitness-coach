# Session Log: Store Domain Orchestrator Migration

**Date:** 2026-05-30

## Goal

Decompose the last monolith `js/stores/useAppStore.ts` (1365 lines) into a clean domain-based orchestrator at `js/store/index.ts`.

## Done

1. **Created `js/store/computeDerived.ts`** — extracted the pure `computeDerived` function and `DerivedState` interface from the old store. All domain function calls now reference their NEW locations (`js/domains/recovery/readiness.js`, etc.).

2. **Created `js/store/slices/`** — moved the 3 unmigrated slice files from `js/stores/slices/`:
   - `sessionSlice.ts` — session form state + pending result tracking
   - `uiSlice.ts` — UI state (activeTab, settings modal, etc.)
   - `dataSlice.ts` — raw data + profile/settings state (initial values only)

3. **Created `js/store/index.ts`** — new orchestrator store that:
   - Imports `createCheckinSlice` from `js/domains/checkin/checkinSlice.ts`
   - Imports `createDemoSlice` from `js/domains/demo/demoSlice.ts`
   - Imports `createSessionSlice`, `createUiSlice`, `createDataSlice` from local `./slices/`
   - Combines all 5 slices via Zustand's `create(...)`
   - Contains all orchestrator actions (initApp, handleSaveCheckin, handleToggleTraining, etc.)
   - Uses `computeDerived` from `./computeDerived.ts`

4. **Updated imports:**
   - `js/app.tsx` → `'./store/index.js'`
   - `js/tests/stores/useAppStore.test.ts` → `'../../store/index.js'`
   - `js/tests/stores/useAppStore.offset.test.ts` → `'../../store/index.js'`
   - `js/ui/components/AchievementToast.tsx` → `'../../store/index.js'`

5. **Deleted old `js/stores/` directory** entirely.

## Verification

- `npm run type-check`: pass
- `npm test`: all tests pass (including 41 useAppStore tests + 4 offset tests)

## Architecture

```
Input → IndexedDB → js/store/index.ts (orchestrator) → Derived → UI
                    ├── computeDerived.ts (pure logic)
                    ├── slices/sessionSlice.ts
                    ├── slices/uiSlice.ts
                    ├── slices/dataSlice.ts
                    ├── (imported) domains/checkin/checkinSlice.ts
                    └── (imported) domains/demo/demoSlice.ts
```
