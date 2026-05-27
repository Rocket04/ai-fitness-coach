# 2026-05-26 — Playwright E2E Phase 5 (Secondary Flow Tests)

## Goal

Implement Phase 5 of the Playwright E2E test suite: secondary flow tests covering Analytics, Profile, Guest, and Navigation.

## What was done

- Created `e2e/tests/analytics.spec.ts` with 5 tests:
  - `Analytics — empty state → shows when insufficient data`
  - `Analytics — trend chart → renders with 7-day data`
  - `Analytics — toggle 30-day → updates chart`
  - `Analytics — weekly summary → displays completed sessions`
  - `Analytics — warnings → display when negative trends detected`
- Created `e2e/tests/profile.spec.ts` with 4 tests:
  - `Profile — tier selector → change persists`
  - `Profile — achievements → display unlocked badges`
  - `Profile — exercise config → modal opens and saves`
  - `Profile — language switcher → changes UI language`
- Created `e2e/tests/guest.spec.ts` with 4 tests:
  - `Guest — badge → displays in guest mode`
  - `Guest — start tracking → triggers onboarding`
  - `Guest — data persists → in sessionStorage`
  - `Guest — onboarding completion → transitions to tracked mode`
- Created `e2e/tests/navigation.spec.ts` with 4 tests:
  - `Navigation — bottom nav → switches between Today/Log/Analytics/Profile`
  - `Navigation — active tab → highlighted`
  - `Navigation — page transitions → render correctly`
  - `Navigation — methodology → accessible from profile`

## Design decisions

- Since e2e infrastructure (fixtures, page objects, playwright config) from Subtasks 1–2 does not yet exist, each spec file includes inline helper functions for:
  - `clearAllData(page)` — clears localStorage, sessionStorage, and IndexedDB
  - `visitProfile(page)` / `visitAnalytics(page)` — navigation via bottom nav
  - `completeOnboardingIfShown(page)` — handles the onboarding wizard if it appears
  - `seedCheckinHistory(page, days)` / `seedWorkoutSessions(page, count)` — seeds Dexie DB via `page.evaluate()`
- All tests follow the requested naming pattern: `[page] — [action] — [expected outcome]`
- All tests use `test.step()` for logical grouping
- Tests use existing class/CSS selectors where possible (`.bottom-nav`, `.profile-section__header`, `.guest-badge`, `.trend-chart-wrapper`, etc.)
- `test.skip()` is used with comments for assertions that strictly depend on `data-testid` attributes added in Subtask 6
- `npm run type-check` passes (exit 0); e2e files are outside `tsconfig.json` `include` so they do not affect the build

## What remains

- These tests require Subtask 1 (Playwright config + install) and Subtask 2 (fixtures + page objects) to actually run
- Subtask 6 (`data-testid` attributes) will remove the need for several `test.skip()` calls
- Subtask 2 `seedData.ts` should replace the inline `page.evaluate()` seeding once available
