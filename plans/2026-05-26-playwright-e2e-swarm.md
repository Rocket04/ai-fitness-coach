# Swarm: Playwright E2E Test Suite Implementation

**Created:** 2026-05-26 16:09
**Model target:** Kimi K2 (check picker for current promo multiplier)
**Subtask count:** 6
**Scope statement:** Implement comprehensive Playwright E2E test suite covering 10 critical user flows with test infrastructure, CI integration, and documentation.

---

## Subtask 1 — Playwright Setup & Configuration
- **Scope:** `c:\Projects\fitness-tracker\playwright.config.ts`, `c:\Projects\fitness-tracker\package.json`, `c:\Projects\fitness-tracker\.gitignore`
- **Acceptance:** Playwright installed, playwright.config.ts created with Chromium/Firefox/mobile projects, package.json has test:e2e scripts, .gitignore excludes test-results/
- **Pane:** 1 (top-left)
- **Status:** [ ] pending

### Prompt for Pane 1 (paste verbatim)

You are implementing Phase 1 of the Playwright E2E test suite for Smart Fitness Coach.

**Read first:** `c:\Projects\fitness-tracker\AGENTS.md` for project context and tech stack.

**Files to create/modify:**

1. **Install Playwright** — Run in PowerShell at project root `c:\Projects\fitness-tracker`:
   ```powershell
   npm install -D @playwright/test
   npx playwright install chromium firefox
   ```
   Before running npm, you MUST check AGENTS.md for instructions.

2. **Create `playwright.config.ts`** at repo root with:
   - Base URL: `http://localhost:3000`
   - Projects: Chromium desktop, Firefox desktop, Mobile viewport (375x812)
   - Timeout: 30s per test, 60s per suite
   - Retry: 1 on failure (CI only)
   - Workers: 4 (local), sharded (CI)
   - Output: `test-results/` with screenshots on failure
   - Video: `retain-on-failure` for CI
   - Test directory: `e2e/tests/`

3. **Modify `package.json`** — Add scripts:
   ```json
   "test:e2e": "playwright test",
   "test:e2e:ui": "playwright test --ui",
   "test:e2e:debug": "playwright test --debug",
   "test:e2e:headed": "playwright test --headed"
   ```

4. **Modify `.gitignore`** — Add:
   ```
   test-results/
   playwright-report/
   playwright/.cache/
   ```

**Verify:** Run `npx playwright --version` and confirm config syntax is valid.

---

## Subtask 2 — Test Infrastructure (Fixtures, Pages, Utils)
- **Scope:** `c:\Projects\fitness-tracker\e2e\fixtures\`, `c:\Projects\fitness-tracker\e2e\pages\`, `c:\Projects\fitness-tracker\e2e\utils\`
- **Acceptance:** seedData.ts and auth.ts fixtures created, 5 page objects with locators, selectors.ts and assertions.ts utilities created
- **Pane:** 2 (top-middle)
- **Status:** [ ] pending

### Prompt for Pane 2 (paste verbatim)

You are implementing Phase 2 (test infrastructure) of the Playwright E2E test suite for Smart Fitness Coach.

**Read first:** `c:\Projects\fitness-tracker\AGENTS.md` for project context. Read `c:\Projects\fitness-tracker\js\stores\useAppStore.ts` and Dexie DB setup to understand data model. Read existing UI pages (`js/ui/pages/TodayPage.jsx`, `CheckinForm.jsx`, etc.) to identify selectors.

**Files to create (all new, no conflicts):**

1. **`e2e/fixtures/seedData.ts`** — Data seeding utilities:
   - `clearAllData()` — clears IndexedDB (all Dexie stores) + localStorage + sessionStorage
   - `seedCheckinHistory(count: number)` — creates N days of check-in records in IndexedDB
   - `seedWorkoutSessions(count: number)` — creates N workout sessions in IndexedDB
   - `seedDemoScenario(name: string)` — pre-defined scenarios: `'fresh-install'` (no data), `'week-of-checkins'` (7 days), `'active-training'` (7 checkins + 3 sessions)
   - Use Dexie API directly; import db instance from app code

2. **`e2e/fixtures/auth.ts`** — Guest mode helpers:
   - `enterGuestMode(page)` — clicks guest mode entry
   - `isGuestMode(page)` — checks for guest badge
   - `exitGuestMode(page)` — triggers onboarding from guest

3. **`e2e/pages/TodayPage.ts`** — Page object for TodayPage:
   - Locators: recovery ring, check-in button, metrics panel, workout card
   - Methods: `getRecoveryScore()`, `clickCheckin()`, `expandMetrics()`, `getWorkoutType()`

4. **`e2e/pages/CheckinPage.ts`** — Page object for CheckinForm:
   - Locators: weight input, RHR input, HRV input, subjective sliders, submit button, tier selector
   - Methods: `submitFullTier(weight, rhr, hrv, sleep, soreness)`, `submitMediumTier(weight, rhr, soreness)`, `submitLightTier(weight, soreness)`, `getValidationErrors()`

5. **`e2e/pages/OnboardingPage.ts`** — Page object for OnboardingWizard:
   - Locators: step containers, goal options, training days toggle, sport selector, gadget selector, complete button
   - Methods: `completeOnboarding(goal, days, sport, gadgets)`, `getCurrentStep()`, `canAdvance()`

6. **`e2e/pages/AnalyticsPage.ts`** — Page object for AnalyticsPage:
   - Locators: trend chart, 7/30 day toggle, weekly summary, warnings list
   - Methods: `switchTo7Day()`, `switchTo30Day()`, `getWarningCount()`

7. **`e2e/pages/ProfilePage.ts`** — Page object for ProfilePage:
   - Locators: tier selector, achievement list, exercise config button, language switcher
   - Methods: `selectTier(tier)`, `getUnlockedAchievements()`, `openExerciseConfig()`

8. **`e2e/utils/selectors.ts`** — Reusable selectors (data-testid values as constants):
   ```ts
   export const SELECTORS = {
     RECOVERY_RING: '[data-testid="recovery-ring"]',
     CHECKIN_FORM: '[data-testid="checkin-form"]',
     NAV_TODAY: '[data-testid="nav-today"]',
     // ... etc
   };
   ```

9. **`e2e/utils/assertions.ts`** — Custom matchers:
   - `expectRecoveryColor(page, color)` — asserts ring color (green/yellow/red)
   - `expectIndexedDBEmpty(page)` — asserts no user data in IndexedDB

**All page objects must use `data-testid` selectors where possible.** If a `data-testid` does not yet exist on a component, note it in a comment with the expected attribute name.

---

## Subtask 3 — Core Flow Tests (Onboarding, Check-in, Recovery)
- **Scope:** `c:\Projects\fitness-tracker\e2e\tests\onboarding.spec.ts`, `c:\Projects\fitness-tracker\e2e\tests\checkin.spec.ts`, `c:\Projects\fitness-tracker\e2e\tests\recovery.spec.ts`
- **Acceptance:** 13 tests across 3 files pass locally on Chromium; tests use page objects from e2e/pages/ and fixtures from e2e/fixtures/
- **Pane:** 3 (top-right)
- **Status:** [ ] pending

### Prompt for Pane 3 (paste verbatim)

You are implementing Phase 3 (core flow tests) of the Playwright E2E test suite for Smart Fitness Coach.

**Read first:** `c:\Projects\fitness-tracker\AGENTS.md`. Read existing UI code (`js/ui/components/OnboardingWizard.jsx`, `js/ui/pages/CheckinForm.jsx`, `js/ui/pages/TodayPage.jsx`) to understand flows.

**Files to create (all new):**

1. **`e2e/tests/onboarding.spec.ts`** — 4 tests:
   - `Onboarding — complete 5-step flow → app initializes with selected settings`
     - Start from fresh state (use seedData clear), complete each step, verify onboarding closes
   - `Onboarding — close wizard → returns to landing state`
     - Click close/exit at step 2, verify landing page visible
   - `Onboarding — step validation → cannot advance without required selection`
     - Try to advance without selecting goal, expect button disabled or error
   - `Onboarding — gadget selection → auto-detects correct tier`
     - Select specific gadget combo, verify tier auto-selected

2. **`e2e/tests/checkin.spec.ts`** — 5 tests:
   - `Checkin — full tier submission → recovery score updates`
     - Fill weight + RHR + HRV + sleep + soreness, submit, verify score appears
   - `Checkin — medium tier submission → recovery score updates`
     - Fill weight + RHR + soreness, submit, verify score
   - `Checkin — light tier submission → recovery score updates`
     - Fill weight + soreness, submit, verify score
   - `Checkin — empty submission → validation error`
     - Submit with no data, expect validation message
   - `Checkin — trend indicators → display when historical data exists`
     - Seed 3 days of check-ins, submit new one, verify trend arrows show

3. **`e2e/tests/recovery.spec.ts`** — 4 tests:
   - `Recovery — empty state → shows dash and "Заполните чек-ин" prompt`
     - Clear all data, visit today page, expect placeholder text
   - `Recovery — score display → color matches threshold (green ≥70, yellow ≥40, red <40)`
     - Seed check-ins with specific scores, verify ring color classes
   - `Recovery — ring click → expands metrics panel`
     - Click recovery ring, verify metrics panel visible
   - `Recovery — adaptive tier banner → appears when data suggests change`
     - Seed data suggesting tier change, verify banner visible

**Pattern:** Each test uses `test.step()` for logical grouping. Use page objects from `e2e/pages/`. Use `seedData` fixture helpers. Use `data-testid` selectors exclusively. Test names follow `[page] — [action] — [expected outcome]`.

**Note:** Some `data-testid` attributes may not exist yet (added by Subtask 6). Use the attribute names defined in `e2e/utils/selectors.ts`. If a test fails because a `data-testid` is missing, add a `test.skip()` with a comment referencing the missing attribute.

---

## Subtask 4 — Core Flow Tests (Workout, Settings, Data)
- **Scope:** `c:\Projects\fitness-tracker\e2e\tests\workout.spec.ts`, `c:\Projects\fitness-tracker\e2e\tests\settings.spec.ts`, `c:\Projects\fitness-tracker\e2e\tests\data.spec.ts`
- **Acceptance:** 12 tests across 3 files pass locally on Chromium
- **Pane:** 4 (bottom-left)
- **Status:** [ ] pending

### Prompt for Pane 4 (paste verbatim)

You are implementing Phase 4 (core flow tests) of the Playwright E2E test suite for Smart Fitness Coach.

**Read first:** `c:\Projects\fitness-tracker\AGENTS.md`. Read UI code (`js/ui/pages/SessionLogger.jsx`, `js/ui/components/ExerciseCard.jsx`, `js/ui/components/Modal.jsx`) to understand workout/settings flows. Read `js/stores/useAppStore.ts` for data export/import logic.

**Files to create (all new):**

1. **`e2e/tests/workout.spec.ts`** — 4 tests:
   - `Workout — rest day → displays "День отдыха" card`
     - Seed a rest day in plan, visit today page, verify rest card
   - `Workout — training day → displays session plan with sport type`
     - Seed a training day, verify session card shows correct sport
   - `Workout — exercise cards → render with sets/reps/duration`
     - Verify exercise cards contain sets/reps text
   - `Workout — APRE autoregulation → displays reasons when applicable`
     - Seed data triggering APRE adjustment, verify reason text visible

2. **`e2e/tests/settings.spec.ts`** — 4 tests:
   - `Settings — change training days → saves and persists`
     - Open settings, toggle training days, save, reload, verify persisted
   - `Settings — change start date → saves and persists`
     - Change start date, save, reload, verify new date
   - `Settings — cancel → discards unsaved changes`
     - Toggle a setting, click cancel, reopen, verify old value
   - `Settings — modal → opens and closes correctly`
     - Click settings trigger, verify modal open; click close/X, verify closed

3. **`e2e/tests/data.spec.ts`** — 4 tests:
   - `Data — export → produces valid JSON file`
     - Seed some data, click export, verify downloaded JSON is valid and contains data
   - `Data — import valid JSON → restores data`
     - Export, clear all data, import same file, verify data restored
   - `Data — import invalid JSON → shows error`
     - Import malformed JSON, verify error message
   - `Data — reset all → clears IndexedDB and localStorage`
     - Seed data, click reset, confirm, verify IndexedDB and localStorage empty

**Pattern:** Use page objects. Use `test.step()`. Use `data-testid` selectors. Name tests `[page] — [action] — [expected outcome]`.

**Note:** If `data-testid` attributes are missing (added by Subtask 6), add `test.skip()` with a comment.

---

## Subtask 5 — Secondary Flow Tests (Analytics, Profile, Guest, Navigation)
- **Scope:** `c:\Projects\fitness-tracker\e2e\tests\analytics.spec.ts`, `c:\Projects\fitness-tracker\e2e\tests\profile.spec.ts`, `c:\Projects\fitness-tracker\e2e\tests\guest.spec.ts`, `c:\Projects\fitness-tracker\e2e\tests\navigation.spec.ts`
- **Acceptance:** 17 tests across 4 files pass locally on Chromium
- **Pane:** 5 (bottom-middle)
- **Status:** [ ] pending

### Prompt for Pane 5 (paste verbatim)

You are implementing Phase 5 (secondary flow tests) of the Playwright E2E test suite for Smart Fitness Coach.

**Read first:** `c:\Projects\fitness-tracker\AGENTS.md`. Read `js/ui/pages/AnalyticsPage.jsx`, `js/ui/pages/ProfilePage.jsx`, `js/ui/pages/TrendChart.tsx`, `js/app.tsx` for nav structure.

**Files to create (all new):**

1. **`e2e/tests/analytics.spec.ts`** — 5 tests:
   - `Analytics — empty state → shows when insufficient data`
     - Clear data, visit analytics, expect empty state message
   - `Analytics — trend chart → renders with 7-day data`
     - Seed 7 days of check-ins, visit analytics, verify chart canvas visible
   - `Analytics — toggle 30-day → updates chart`
     - Seed 30 days, click 30-day toggle, verify chart updates
   - `Analytics — weekly summary → displays completed sessions`
     - Seed sessions, verify summary card shows count
   - `Analytics — warnings → display when negative trends detected`
     - Seed declining trend data, verify warning list items

2. **`e2e/tests/profile.spec.ts`** — 4 tests:
   - `Profile — tier selector → change persists`
     - Change check-in tier, reload, verify selection kept
   - `Profile — achievements → display unlocked badges`
     - Seed achievement-unlocking data, visit profile, verify unlocked badges
   - `Profile — exercise config → modal opens and saves`
     - Click exercise config, change a value, save, verify persisted
   - `Profile — language switcher → changes UI language`
     - Switch language, verify UI text changes (e.g., "Today" → Russian equivalent)

3. **`e2e/tests/guest.spec.ts`** — 4 tests:
   - `Guest — badge → displays in guest mode`
     - Enter guest mode, verify guest badge visible
   - `Guest — start tracking → triggers onboarding`
     - Click "Начать трекинг", verify onboarding wizard opens
   - `Guest — data persists → in sessionStorage`
     - Add data as guest, verify stored in sessionStorage (not localStorage/IndexedDB)
   - `Guest — onboarding completion → transitions to tracked mode`
     - Complete onboarding from guest, verify badge disappears

4. **`e2e/tests/navigation.spec.ts`** — 4 tests:
   - `Navigation — bottom nav → switches between Today/Log/Analytics/Profile`
     - Click each nav tab, verify correct page visible
   - `Navigation — active tab → highlighted`
     - Click nav item, verify active class/state
   - `Navigation — page transitions → render correctly`
     - Switch between tabs rapidly, verify no blank pages
   - `Navigation — methodology → accessible from profile`
     - Click methodology link in profile, verify methodology page renders

**Pattern:** Use page objects. Use `test.step()`. Use `data-testid` selectors. Name tests `[page] — [action] — [expected outcome]`.

**Note:** If `data-testid` attributes are missing (added by Subtask 6), add `test.skip()` with a comment.

---

## Subtask 6 — UI Test Attributes, CI Integration & Documentation
- **Scope:** `c:\Projects\fitness-tracker\js\ui\pages\TodayPage.jsx`, `c:\Projects\fitness-tracker\js\ui\pages\CheckinForm.jsx`, `c:\Projects\fitness-tracker\js\ui\components\OnboardingWizard.jsx`, `c:\Projects\fitness-tracker\js\ui\pages\AnalyticsPage.jsx`, `c:\Projects\fitness-tracker\js\ui\pages\ProfilePage.jsx`, `c:\Projects\fitness-tracker\js\app.tsx`, `c:\Projects\fitness-tracker\.github\workflows\e2e.yml`, `c:\Projects\fitness-tracker\.github\workflows\ci.yml`, `c:\Projects\fitness-tracker\docs\testing\e2e.md`
- **Acceptance:** data-testid attributes added to 6 UI files, e2e.yml workflow created, ci.yml updated with E2E job, docs/testing/e2e.md complete
- **Pane:** 6 (bottom-right)
- **Status:** [ ] pending

### Prompt for Pane 6 (paste verbatim)

You are implementing Phase 6 (UI test attributes + CI + docs) of the Playwright E2E test suite for Smart Fitness Coach.

**Read first:** `c:\Projects\fitness-tracker\AGENTS.md`. Read `e2e/utils/selectors.ts` (created by Subtask 2) to know which `data-testid` values are expected.

**Files to modify (add data-testid attributes):**

Add the following `data-testid` attributes. Do NOT change any other logic or styling — only add attributes.

1. **`js/ui/pages/TodayPage.jsx`**:
   - Hero recovery ring wrapper: `data-testid="recovery-ring"`
   - Check-in trigger button: `data-testid="checkin-trigger"`
   - Metrics expansion panel: `data-testid="metrics-panel"`
   - Workout/rest day card: `data-testid="workout-card"`
   - Adaptive tier banner: `data-testid="tier-banner"`

2. **`js/ui/pages/CheckinForm.jsx`**:
   - Form container: `data-testid="checkin-form"`
   - Weight input: `data-testid="checkin-weight"`
   - RHR input: `data-testid="checkin-rhr"`
   - HRV input: `data-testid="checkin-hrv"`
   - Sleep slider: `data-testid="checkin-sleep"`
   - Soreness slider: `data-testid="checkin-soreness"`
   - Submit button: `data-testid="checkin-submit"`
   - Tier selector: `data-testid="tier-selector"`
   - Validation error container: `data-testid="checkin-errors"`

3. **`js/ui/components/OnboardingWizard.jsx`**:
   - Step 1 container: `data-testid="onboarding-step-1"`
   - Step 2 container: `data-testid="onboarding-step-2"`
   - Step 3 container: `data-testid="onboarding-step-3"`
   - Step 4 container: `data-testid="onboarding-step-4"`
   - Step 5 container: `data-testid="onboarding-step-5"`
   - Goal option buttons: `data-testid="goal-option"`
   - Training days toggle: `data-testid="training-days-toggle"`
   - Sport selector: `data-testid="sport-selector"`
   - Gadget selector: `data-testid="gadget-selector"`
   - Complete button: `data-testid="onboarding-complete"`
   - Close/exit button: `data-testid="onboarding-close"`

4. **`js/ui/pages/AnalyticsPage.jsx`**:
   - Trend chart container: `data-testid="trend-chart"`
   - 7-day toggle button: `data-testid="toggle-7d"`
   - 30-day toggle button: `data-testid="toggle-30d"`
   - Weekly summary card: `data-testid="weekly-summary"`
   - Warnings list: `data-testid="warnings-list"`
   - Empty state message: `data-testid="analytics-empty"`

5. **`js/ui/pages/ProfilePage.jsx`**:
   - Tier selector dropdown: `data-testid="profile-tier-selector"`
   - Achievement list: `data-testid="achievement-list"`
   - Exercise config trigger: `data-testid="exercise-config-trigger"`
   - Language switcher: `data-testid="language-switcher"`

6. **`js/app.tsx`**:
   - Bottom nav Today tab: `data-testid="nav-today"`
   - Bottom nav Log tab: `data-testid="nav-log"`
   - Bottom nav Analytics tab: `data-testid="nav-analytics"`
   - Bottom nav Profile tab: `data-testid="nav-profile"`

**Files to create:**

7. **`.github/workflows/e2e.yml`** — New E2E CI workflow:
   - Trigger: push, pull_request
   - Node 20 setup, install deps, install Playwright browsers
   - Start dev server: `npm run dev &`
   - Wait for port: `npx wait-on http://localhost:3000 --timeout 60000`
   - Run: `npm run test:e2e -- --shard=${{ matrix.shardIndex }}/${{ matrix.shardTotal }}`
   - Matrix: 2 shards
   - Upload artifacts: test-results, playwright-report
   - fail-fast: false

8. **Modify `.github/workflows/ci.yml`** — Add E2E job:
   - Add a job named `e2e` that depends on `build` job
   - Uses the same checkout/setup pattern
   - Runs Playwright tests (sharded on PR, full suite on schedule)

9. **`docs/testing/e2e.md`** — Documentation:
   - How to run tests locally (`npm run test:e2e`)
   - How to debug with Playwright Inspector (`npm run test:e2e:debug`)
   - How to add new tests (page object pattern, naming convention)
   - Page object pattern guide
   - Troubleshooting (flaky tests, port conflicts, IndexedDB cleanup)

**After all changes:** Run `npm run type-check`    Before running npm, you MUST check AGENTS.md for instructions. If any TypeScript errors from your changes, fix them.

---

## Disjointness audit

| Subtask | Primary path | Overlaps with |
|---|---|---|
| 1 | playwright.config.ts, package.json, .gitignore | — |
| 2 | e2e/fixtures/, e2e/pages/, e2e/utils/ | — |
| 3 | e2e/tests/onboarding.spec.ts, checkin.spec.ts, recovery.spec.ts | — |
| 4 | e2e/tests/workout.spec.ts, settings.spec.ts, data.spec.ts | — |
| 5 | e2e/tests/analytics.spec.ts, profile.spec.ts, guest.spec.ts, navigation.spec.ts | — |
| 6 | js/ui/pages/*.jsx, js/ui/components/*.jsx, js/app.tsx, .github/workflows/, docs/testing/ | — |

If any row has a non-empty "Overlaps with" column, STOP and redo the split.

---

## Launch order (per pane)

1. Open 6 Cascade panes (Cmd/Ctrl+\ to split; repeat to get 3×2)
2. In each pane: New Session → pick **Kimi K2** in the model picker
3. Paste the **subtask prompt** (the "Prompt for Pane N" block) into each pane in order (1 → 6)
4. Monitor the grid; re-route any stuck pane to SWE 1.6 Fast or escalate to `@architect`

**IMPORTANT:** If any agent needs to run npm commands (npm run type-check, npm test, etc.), they MUST first check AGENTS.md instructions for how to run tests. The project root is `c:\Projects\fitness-tracker`; running npm from the wrong directory will fail with ENOENT.
