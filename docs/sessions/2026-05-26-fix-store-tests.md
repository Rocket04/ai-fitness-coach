# Session: Fix Store/Utility Test Files

**Date:** 2026-05-26  
**Goal:** Fix all 3 store/utility test files so they pass.

## Scope
- `js/tests/deriveTier.test.ts`
- `js/tests/stores/useAppStore.test.ts`
- `js/tests/stores/useAppStore.offset.test.ts`

## Findings

### deriveTier.test.ts
- **Status:** Already passing (8/8 tests)
- **No changes needed**

### useAppStore.test.ts
- **Status:** Already passing (9/9 tests)
- **No changes needed**

### useAppStore.offset.test.ts
- **Status:** Failing with timeout error
- **Root cause:** Recursive call in `setVirtualTodayOffset` store action (line 652 of useAppStore.ts) called itself instead of the helper function from `helpers.js`
- **Secondary issue:** State pollution between test files when run together

## Changes Made

### 1. Fixed vite.config.ts
- Removed corrupted `pool` and `poolOptions` configuration (lines 10-15)
- Vitest 4 deprecated `poolOptions`, removed to fix config parse error

### 2. Fixed useAppStore.ts
- Renamed import: `setVirtualTodayOffset as setVirtualTodayOffsetHelper` to avoid name collision
- Fixed 4 locations where `setVirtualTodayOffset` was called recursively:
  - Line 652: In `setVirtualTodayOffset` action
  - Line 614: In `initApp` action
  - Line 1063: In `activateDemoMode` action
  - Line 1069: In `deactivateDemoMode` action
  - Line 1122: In `activateDemoModeWithProfile` action

### 3. Fixed useAppStore.offset.test.ts
- Added state reset in `beforeEach` to prevent pollution between test files
- Reset all store state to initial values before each test

## Verification

```bash
npm run type-check  # PASS
npm test -- js/tests/deriveTier.test.ts js/tests/stores/useAppStore.test.ts js/tests/stores/useAppStore.offset.test.ts  # 21/21 PASS
```

## Decisions

- Used minimal changes to fix the recursive call bug
- Added comprehensive state reset in test to ensure isolation
- Kept test structure unchanged, only added beforeEach cleanup

## Remaining Work

None. All 3 test files pass.
