# Session: Refactor 7 Core Domain Tests to TDD Principles

## Goal
Rewrite all 7 core domain test files to eliminate implementation-detail tests and verify behavior through public APIs only, with test names describing WHAT the system does rather than HOW.

## Files changed
- `js/tests/core/achievements.test.ts` — major refactor: mocked db.achievements, removed existence/shape/internal-method tests, added behavior-driven tests for checkAchievements, getAchievementStatus, groupByTier, groupByCategory
- `js/tests/core/adaptiveTier.test.ts` — removed "should export detectOptimalTier" existence test
- `js/tests/core/analytics.test.ts` — removed "should export getPeriodComparison" existence test
- `js/tests/core/apre.test.ts` — renamed all ~56 tests from implementation-detail (HOW) to behavior descriptions (WHAT)
- `js/tests/core/correlations.test.ts` — renamed one test: "getAllCorrelations returns 6 results" → "aggregates all habit-recovery correlations into insights"
- `js/tests/core/demoData.test.ts` — removed export existence test, rewrote shape test to behavior description
- `js/tests/core/advice.test.ts` — no changes (already TDD-aligned per plan)

## Verification
- `npm run type-check` — passed
- `npm test -- <7 files>` — 94 tests passed, 0 failed
- Full suite `npm test` — 241 passed, 3 failed (pre-existing `storage.demo.test.ts` IndexedDB API missing errors, unrelated to this change)

## Decisions
- Used `vi.mock` for `db.achievements` in achievements.test.ts to isolate behavior from IndexedDB
- Used `(workoutTrio as any).progress` to bypass pre-existing type mismatch where `getAchievementStatus` returns `progress` but `Achievement` interface omits it
- Kept apre.test.ts test logic identical; only renamed test descriptions since the exported engine functions ARE the public API
