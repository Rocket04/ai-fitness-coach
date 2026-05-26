---
name: static-pwa-development
description: Skills for auditing, fixing, and enhancing PWAs built with React/Dexie/importmap. Covers package.json repair, CSS audits, PWA enhancements, onboarding wizard, tiered features, adaptive recovery score, guided tours, virtual date offset system, weekly overview, demo mode with isolated IndexedDB, integration placeholders, and Windows CDP development workflows (process management, line ending normalization, production build testing). Emphasizes backward compatibility, zero-error policy, and TDD-first development.
category: software-development
version: 2.0
---

## Description
Skills for auditing, fixing, and enhancing static Progressive Web Applications (PWAs) built with React, Dexie (IndexedDB), and served via `npx serve`. Covers package.json repair, CSS audits, PWA-specific enhancements, gamification, onboarding wizard enhancement, and implementing tiered/configurable features. Includes patterns for implementing tiered data collection systems based on user availability. The skill emphasizes clear documentation, incremental updates, backward compatibility, and TDD-first development.

## When to Use
- You have a React+Dexie PWA with an importmap in index.html.
- The project lacks a build step and is intended to be served statically.
- You need to audit the codebase, fix bugs, and raise the application to premium level.
- You are implementing adaptive user interfaces that change based on user preferences or available hardware.
- You need to add new steps to an existing onboarding wizard or guided tour.

## Steps

### 1. Verify and Fix package.json
1. Check that package.json contains valid JSON (single object with dependencies, devDependencies, scripts).
2. If you see multiple JSON objects or syntax errors, combine them into a single valid JSON.
   - Example: Merge devDependencies and dependencies sections under one root.
3. Ensure required dependencies are listed: react, react-dom, dexie.
4. Add useful scripts if missing (e.g., `"serve": "serve"` or keep reliance on npx serve directly).

### 2. Run the PWA Locally
1. Start a static server: `npx serve -l 5000` (or any port).
2. Open `http://localhost:<port>` in a browser.
3. Verify the service worker registers (check console for registration log).
4. Test offline capabilities if needed.

### 3. Audit Core Files
[Files to audit with status tracking]

### 4. Enhance Onboarding Wizard / Guided Tours
When adding new steps to an existing wizard or guided tour:
1. Define the config/component first, then add types, update store, update UI, write tests, verify.
2. Ensure tour init calls the store action directly via onClick — don't rely solely on hashchange listeners.
3. Use tour step boolean flags (demoData, pulseTarget, highlightBorder, softDrop, noScroll) for data-driven behavior.
4. Add pulse/highlight CSS animations to css/styles.css.

### 5. Implement Tiered/Configurable Features
Pattern for features that adapt based on user preferences:
1. Define config → add types → update store → update UI → write tests → verify.
2. Default values must preserve backward compatibility.

### 6. Write Tests (TDD-First)
1. ALWAYS write the test first, see it fail, then implement minimal code.
2. Run `npx tsc --noEmit` after every code change — zero-error policy.
3. Run `npm test` after every code change — all existing tests must stay green.

### 7. Verify with Chrome DevTools MCP
1. Navigate to app URL, take snapshots, interact via refs.
2. Check console for errors.
3. Run Lighthouse audit after major changes.
4. Note: Vite HMR WebSocket may fail through CDP — if code is correct on disk (tests pass, TS clean) but browser shows stale behavior, instruct user to hard reload.

### 8. Test Critical User Flows
[Key flows to verify]

### 9. Verify PWA Qualities
[Lighthouse, manifest, SW, offline]

## Windows CDP Workflows

When developing on Windows with Vite + Chrome DevTools CDP:

- **Process management**: `kill -9` via MSYS bash does NOT reliably kill Node.js processes. Use `powershell -Command "Stop-Process -Name node -Force"` or `taskkill /PID <pid> /F`. Verify with `netstat -ano | findstr "<port>"`.
- **Production build testing**: Vite HMR WebSocket does NOT work through CDP. Build with `npx vite build`, serve with `npx serve -s dist/ -l <port>`. Unregister old service workers before testing: `navigator.serviceWorker.getRegistrations().then(regs => Promise.all(regs.map(r => r.unregister())))`.
- **Line ending normalization**: `write_file` and `patch` tools produce LF on Windows. Normalize to CRLF after editing. See `references/windows-crlf-encoding-pattern.md`.
- **JSX vs TSX**: Type annotations (`: string`, `as const`, `interface`) are only valid in `.tsx`. See pitfall "JSX files cannot use TypeScript syntax" and the conversion checklist below.
- **Lighthouse via CDP**: Use `mcp_chrome_devtools_lighthouse_audit` with `mode: 'navigation'`, `device: 'mobile'`. Works correctly with production builds.
- **act() incompatibility**: Component tests using `@testing-library/react` `render()` fail with production React builds. Core module tests are unaffected.

## Pitfalls

- **Multiple JSON objects in package.json**
- **Assuming a build step**: May rely on importmap; don't run build unless configured.
- **Overlooking service worker scope**: Ensure sw.js is scoped correctly.
- **Mutating Dexie objects directly**: Always spread or create new objects.
- **Ignoring lazy-loading fallbacks**: Prefer skeleton UI.
- **Mixing React.createElement and JSX**: Causes silent rendering failures.
- **Truncating shared config files**: Verify all expected exports after editing. Before writing, `wc -l` the file. After writing, `grep -r "from.*config/constants" js/` to verify importers.
- **Lucide icon imports in importmap projects**: Additional Lucide React icons beyond the initial set may render as zero-width/invisible SVGs. Use emoji characters instead of Lucide icons in `.jsx` files using importmap.
- **Store action not called on navigation-triggered flows**: When a UI button sets a hash/flag, always call the corresponding Zustand store action directly (e.g. `useTourStore.getState().startTour()`). Don't rely solely on hashchange listeners.
- **`React.useEffect()` vs `useEffect()` crash**: In `.jsx` files, calling `React.useEffect()` instead of the destructured `useEffect()` causes "Cannot read properties of null" crash. Destructure at top: `import React, { useEffect, useState } from 'react'`.
- **Tour cross-component communication via CustomEvent**: Use `window.dispatchEvent(new CustomEvent('tour-demo-data', { detail }}))` / `window.addEventListener('tour-demo-data', handler)` to decouple tour from page internals.
- **Tour scroll behavior**: Use `element.scrollIntoView({ behavior: 'smooth', block: 'nearest' })` — prevents unwanted scroll jumps.
- **Virtual date offset pattern**: Store `virtualTodayOffset` in Zustand (persisted), module-level `let _virtualTodayOffset` in helpers.ts, `getAppDate()` uses it, `computeDerived` accepts offset param. Components use `getAppDate()` not `new Date()`.
- **Weekly strip day navigation**: Build 7-day array from virtual date's Monday. Each card has pre-computed `offset` (days from real today). Tap calls `setVirtualTodayOffset(d.offset)`. Do NOT compute `d.date - new Date().getDate()` inline (breaks month boundaries).
- **Developer control panel**: Collapsible ProfileSection with -7/-1/Today/+1/+7 buttons. Directly calls `useAppStore.getState().setVirtualTodayOffset(n)`.
- **Demo Mode isolated Dexie**: Separate `new Dexie('SmartFitnessCoachDemo')` instance. Module-level `_demoMode`/`_demoDb` flags. `_db()` routes to active DB. Generate deterministic data with seeded mulberry32 RNG (seed 42). `activateDemoMode` action must await `activateDemoData(demoData)` before reading back.
- **Demo Mode `let` declaration order**: Module-level `let` declarations (`_demoMode`, `_demoDb`) must be ABOVE all functions referencing them (TDZ). If `getActiveDb()` uses `_demoMode` but it's declared after, module crashes.
- **Vite HMR WebSocket failure through CDP**: Browser shows stale bundle even though code on disk is correct. Verify: (1) grep code on disk, (2) `npx tsc --noEmit`, (3) `npm test`. If all pass → instruct user to hard reload (Ctrl+Shift+R).
- **Stale bundle + new schema = Dexie crash**: When browser runs stale JS bundle but DB schema upgraded, Dexie openCursor fails. Wrap new table operations in try-catch for backward compatibility.
- **Integration buttons must NOT be disabled**: Remove `disabled: true` from "Подключить" buttons. The button must be clickable to open the modal.
- **Multi-file bulk edits**: Use execute_code with Python's open/read/replace/write loop for same-pattern changes across many files.
- **Importing separate `.css` files causes TS2882**: This project has no CSS module type declarations in `global.d.ts`. All CSS must go into `css/styles.css`. When restoring files from git that have `import './Foo.css'`, remove those imports and append the CSS rules to `css/styles.css` instead.
- **Achievements section belongs in ProfilePage, NOT a bottom nav tab**: Gamification (achievements list, streak display) is integrated as a collapsible `ProfileSection` titled "🏆 Достижения" within ProfilePage.jsx. Do not add a separate bottom navigation tab for achievements.
- **AchievementToast renders globally in app.tsx**: Import `AchievementToast` from `./ui/components/AchievementToast.jsx` and render it at the top level of AppContent (alongside GuidedTour). It reads `pendingAchievement` from the store and auto-dismisses after 4s. The store must have `pendingAchievement: null` state and `clearPendingAchievement: () => void` action.
- **Achievement unlock flow**: After saving a check-in (`handleSaveCheckin`) or completing a training (`handleToggleTraining`), call `checkAchievements(sessions, checkins, trainDays, startDate)`. If newly unlocked, set `pendingAchievement: { key, name, tier, icon }` in the store. The toast picks it up on next render.
- **Batch TS error resolution after syntax fixes**: Fixing one syntax error (e.g., unclosed paren) can expose 40+ new TS errors that were previously hidden. After each syntax fix, re-run `npx tsc --noEmit` and batch-fix by category. See `references/batch-ts-error-resolution.md`.
- **Restoring deleted files from git**: Use `git show <good-commit>:<path> > <path>` to restore files deleted in a cleanup commit. After restoring, adapt to current codebase patterns (CSS consolidation, type alignment, import path fixes). Run `npx tsc --noEmit` to find type mismatches between restored code and current type definitions.
- **Restored test files may have stale type assumptions**: Tests restored from git may mock types that have since been tightened (e.g., `Checkin.notes` changed from `string | undefined` to `string`). Add missing required fields like `notes: ''` to mock objects.
- **Optional vs required fields in types.ts affect many tests**: When TS reports ~10 errors like "Type 'string | undefined' is not assignable to type 'string'" across test files, the fix is often to make the field optional in the interface (`notes?: string`) rather than updating all test factories. Check the interface definition first.
- **Helper function signature mismatches in plan templates**: When `ex()` (or similar helpers) are called with more arguments than the definition accepts (e.g., 6 args vs 3-5 param definition), update the definition to accept all used args. See `references/ex-helper-signature-mismatch.md`.
- **achievement.progress() signature vs call site**: The `Achievement` config objects define `progress` as `(_, checkins) => ({ current, target })` (2 args), but call sites in achievements.ts may pass 5 individual arguments. Fix by updating the call site to match the config's actual signature. Check `js/config/achievements.js` for the real signature before editing call sites.
- **computeDerived() called with undefined variable**: When `computeDerived(...)` is called with `weeklyTemplate` as a parameter but the variable isn't destructured from the store's `get()`, add it to the destructuring or pass a default value. Check all call sites of `computeDerived` for variables that might be `undefined`.
- **WeeklyTemplate type mismatch between config and store**: The `WeeklyTemplate` interface expects `days: (string | null)[]` but inline objects may type `days` as `string[]`. Use explicit type assertion `as (string | null)[]` when creating weeklyTemplate objects inline.
- **Unclosed parenthesis in large React.createElement files**: When TS reports TS1128/TS1005 at what looks like the correct end of file, the real issue is often a missing `)` deep inside a large ternary or nested call. See `references/paren-mismatch-debug.md` for the diagnostic technique.
- **patch tool converts CRLF to LF on Windows**: The Hermes `patch` tool writes replacement text with Unix LF line endings, even when the file uses Windows CRLF. After patching a CRLF file, normalize line endings: read as bytes, `.replace(b'\\r\\n', b'\\n').replace(b'\\n', b'\\r\\n')`, write back. Or use `write_file` on the full file content instead of `patch` for CRLF files.
- **Component references to removed store properties**: When the store interface is refactored (e.g., `trainType` removed, `weekNumber` replaced by `totalWeek`), components that destructure these properties will fail at runtime with "Cannot read properties of undefined" — even though TSC may not catch it if the component file isn't recompiled. After any store interface change, grep all `.jsx`/`.tsx` files for the old property name: `grep -r "trainType\|weekNumber" js/ui/`. Derive removed properties from remaining ones (e.g., `const trainType = sessionPlan?.sessionType || null`).
- **Sport plan sport key naming convention**: Each sport plan file (js/plans/{sport}.ts) must export {SportKey}PlanModule where the export name matches the sport property string value. E.g., cycling.ts exports CyclingPlanModule with sport: 'cycling'. The planning.ts SPORT_MODULES registry maps '{sport}': {SportKey}PlanModule. When adding a new sport: (1) create js/plans/{sport}.ts with proper export, (2) add import to planning.ts, (3) add to SPORT_MODULES registry, (4) extend SessionPlan.sport union type in types.ts.
- **SessionPlan sport/sessionType union type updates**: When adding new sports or session types, BOTH union types in types.ts SessionPlan interface must be extended. Forgetting either one causes TS2322 in the new plan file.
- **Sport plan template pattern**: Each sport plan (js/plans/{sport}.ts) exports {SportKey}PlanModule with 4 phase functions. Extend SessionPlan.sport union type.
- **Rehab exercise filtering**: Store rehabIssues/rehabExercises in IndexedDB. Filter in applyReadinessToSession(). Show adaptation indicator.
- **getAdaptedSessionForDate**: Combines getSessionForDate + applyReadinessToSession + rehab filtering.
- **Profile-based exercise adaptation**: FitnessLevel (beginner/intermediate/advanced) controls sets range (2-3/3-4/4-5). FitnessGoal (hypertrophy/strength/endurance/rehabilitation) controls rep range (8-12/3-6/15-20/10-15). Equipment availability filters out exercises requiring unavailable equipment. Applied in adaptExerciseForProfile().
- **Exercise database pattern**: Exercise library with avoidIf/rehabFor metadata per exercise. FilterExercisesForRehab() replaces contraindicated exercises with rehab alternatives. Store in js/core/exerciseDatabase.ts.
- **Store computeDerived() extension pattern**: When adding new params to computeDerived(): (1) add to function signature with defaults, (2) add to interface, (3) add to initial state, (4) update initApp loading, (5) update ALL call sites — use Python script for bulk replacement since there are 10+ call sites. Missing call sites cause TS2554 (wrong arg count).
- **UserProfileEditor pattern**: Profile editor with level (radio), goals (multi-select), equipment (checkboxes + number input). Each field calls saveSetting() directly + store action. Store has setProfileLevel/Goals/Equipment async actions extending setSelected* pattern.
- **write_file tool produces LF line endings on Windows**: The Hermes write_file tool writes files with Unix LF line endings. This project uses Windows CRLF. After writing .ts/.tsx files, normalize line endings to CRLF or TSC may report spurious syntax errors. For files > 2KB or containing Cyrillic, use a Python script with CRLF normalization. The patch tool also converts CRLF to LF — normalize after patching.
- **computeDerived() extension pattern**: When adding params to computeDerived(), must update: signature, AppStore interface, initial state, initApp loading, and ALL 10+ call sites. Use Python script for bulk replacement. See `references/computeDerived-extension-pattern.md`.
- **Profile-based exercise adaptation**: FitnessLevel (beginner/intermediate/advanced) controls sets range (2-3/3-4/4-5). FitnessGoal controls rep range (hypertrophy: 8-12, strength: 3-6, endurance: 15-20, rehabilitation: 10-15). Equipment availability filters exercises. Applied in adaptExerciseForProfile() within applyReadinessToSession().
- **Exercise database with rehab metadata**: Exercise library (js/core/exerciseDatabase.ts) with avoidIf[] and rehabFor[] per exercise. filterExercisesForRehab() replaces contraindicated exercises with rehab alternatives. Store rehabIssues/rehabExercises in IndexedDB via saveSetting/getSetting.
- **UserProfileEditor component pattern**: Profile editor with level (radio), goals (multi-select), equipment (checkboxes + number input). Each field calls saveSetting() directly + matching store action (setProfileLevel/Goals/Equipment). Store actions follow setSelected* async pattern.
- **Test mocks must match current store shape**: When the AppStore interface changes (properties added/removed/renamed), test mocks that return inline objects become stale. The mock must include all properties the component destructures. Run tests after store changes and update mocks to match. When replacing a removed property with a derived one (e.g., `weekNumber` → `totalWeek`), update both the mock and the assertion: `expect(state.totalWeek).toBe(1)` instead of `expect(state.weekNumber).toBe(1)`.
- **Store-derived computed labels**: The store computes `weekLabel: 'Неделя ${totalWeek}'` inline in `computeDerived()`. Components should NOT maintain a separate `weekLabel` state — it's always derived. If tests inject a custom `weekLabel` via `useAppStore.setState({ weekLabel: '...' })`, this works because `setState` merges, but `computeDerived` will overwrite it on next recompute.
- **Defensive guards for store-derived state in components**: When a component destructures computed/derived properties from the Zustand store (e.g., `weeklySummary`, `monthStats`, `sessionPlan`), add a `dataLoaded` guard for early return with a loading indicator, and wrap derived values with fallback defaults. Pattern: (1) destructure `dataLoaded` from store, (2) `if (!dataLoaded) return <LoadingUI/>`, (3) `const safeWeekly = weeklySummary || { completed: 0, avgRPE: null, green: 0, yellow: 0, red: 0, dominantStatus: '' }`, (4) use `safeWeekly` in JSX. This prevents "Cannot read properties of undefined" crashes during the brief window before `initApp()` completes. See `references/store-derived-state-guards.md`.
- **Per-page ErrorBoundary wrapping**: Wrap each lazy-loaded page component in its own `ErrorBoundary` in `app.tsx` so one tab crashing doesn't kill the whole app. Use `key={activeTab}` to force remount on tab switch. The fallback should be a `function` (not arrow) accepting `{ retry?: () => void }` to avoid implicit `any` in `.tsx` files. See `references/error-boundary-architecture.md`.
- **ErrorBoundary retry vs reload**: Never use `window.location.reload()` as the only recovery option. The ErrorBoundary should provide a retry button that calls `this.setState({ hasError: false })` to re-render the component tree. Page reload should be a secondary option. Include collapsible error details (`<details><summary>`) for development debugging.
- **Three-tier state pattern (loading/empty/error)**: Every page that reads from the store must handle: (1) `!dataLoaded` → Skeleton/spinner, (2) data loaded but empty → EmptyState component with icon + subtitle, (3) render crash → ErrorBoundary. For async data (e.g., achievements), also add inline error state with retry button. See `references/error-boundary-architecture.md`.
- **Division by zero in progress indicators**: When computing percentage widths for progress bars (`(value / total) * 100`), always guard against `total === 0`: `total > 0 ? (value / total) * 100 : 0`. This applies to achievement progress bars, completion percentages, and any ratio-based UI.
- **EmptyState for "no data yet" vs "error" distinction**: Use EmptyState for legitimate empty states (user hasn't created data yet). Use error display (red text + retry button) for actual failures. Don't show an error message when the user simply hasn't done anything yet — show an encouraging EmptyState with a call-to-action.
- **Vite manifest.json stale hash in dist/assets/**: After updating `public/manifest.json`, the hashed copy in `dist/assets/manifest-*.json` may retain old content even after `rm -rf dist && npx vite build`. Vite's internal cache (`node_modules/.vite`) preserves the old hash. Fix: `rm -rf dist node_modules/.vite && npx vite build`. Always verify the hashed copy content, not just `dist/manifest.json`. See `references/sw-update-pattern.md`.
- **SW update detection requires both reg.waiting check AND updatefound listener**: The `useServiceWorkerUpdate` hook must check `reg.waiting` on mount (for SWs already waiting) AND listen for `updatefound` → `statechange` events (for SWs that arrive later). Missing either check means updates go undetected.
- **OnlineStatus indicator z-index must be below update banner**: Place the online/offline pill at z-index 1500, below the update banner (z-index 3000) and demo badge (z-index 2000). Otherwise the network status hides behind the banner.
- **Windows process kill requires PowerShell on Git Bash**: `kill -9 <PID>` in Git Bash/MSYS may leave the process running (especially for Node.js processes). Use `powershell -Command "Stop-Process -Id <PID> -Force"` as a reliable alternative. Verify with `netstat -ano | findstr "<port>"`.
- **Stale SW intercepts production builds**: When testing a production build (`npx serve -s dist/`), the browser may still serve the old Vite dev content because a service worker registered by the dev server intercepts ALL requests to that origin+port. Before testing production: (1) navigate browser to the URL, (2) run `navigator.serviceWorker.getRegistrations().then(regs => Promise.all(regs.map(r => r.unregister())))`, (3) hard reload (Ctrl+Shift+R), (4) navigate again. Alternatively, test on a different port.
- **Lighthouse audit through CDP**: Works correctly with production builds. Use `mcp_chrome_devtools_lighthouse_audit` with `mode: 'navigation'` and `device: 'mobile'`. For PWA-specific audits, check `categories` scores and individual audit results. A score of 0 in `label-content-name-mismatch` or `llms-txt` is acceptable (pre-existing / trivial).
- **ErrorBoundary fallback function typing in .tsx**: When using a function expression as ErrorBoundary fallback in `.tsx`, type the parameter explicitly: `fallback={function (props: { retry?: () => void }) { return (...); }}`. Arrow function destructuring `({ retry })` causes TS7031 (implicit any) in strict mode.
- **WCAG 2.5.3 Label in Name — aria-label must contain visible text**: When a button contains visible text in child elements, the `aria-label` must include ALL visible text. Block-level children create newlines that don't match space-separated aria-labels. Fix: (1) use inline `<span>` elements, (2) add `' '` text node between them, (3) match aria-label exactly, (4) add `aria-hidden="true"` to decorative icons. Using `aria-labelledby` does NOT fix this — the same newline-vs-space mismatch occurs. See `references/wcag-label-in-name.md`.
- **Focus trap for modals**: When building custom modals, implement a `useFocusTrap` hook that: (1) auto-focuses the close button on open, (2) queries all focusable elements, (3) wraps Tab from last to first element, (4) cleans up on unmount. Always add `role="dialog"`, `aria-modal="true"`, and `aria-label` to the modal container.
- **`.sr-only` utility for screen-reader-only text**: Add to design-tokens.css. Use for text visible to screen readers but not sighted users. Always pair with `aria-hidden="true"` on decorative icons.
- **`:focus-visible` for keyboard-only focus rings**: Add `:focus-visible { outline: 2px solid var(--blue); outline-offset: 2px; }` and `:focus:not(:focus-visible) { outline: none; }` to design-tokens.css.
- **JSX files cannot use TypeScript syntax**: Interfaces, type annotations, and generic type parameters require `.tsx` extension. When adding TypeScript types to a `.jsx` component, rename to `.tsx` and update all imports.
- **TrendChart multi-metric + legend pattern**: See `references/trendchart-pattern.md`.
- **Interactive simulator pattern**: See `references/simulator-pattern.md`.
- **Auto-backup before import/demo**: When importing data or activating demo mode, always create a backup of current data first. Pattern: check for existing data → call `exportAllData()` → store in localStorage with key `fitness-backup-<reason>-<timestamp>` → keep only last 5 backups → show toast. Non-blocking (wrap in try-catch). See `references/data-export-import-pattern.md`.
- **Windows `rm -rf dist` "Device or resource busy"**: Kill the serve process first: `powershell -Command "Stop-Process -Name serve -Force -ErrorAction SilentlyContinue"`. Verify port is free: `netstat -ano | findstr "<port>"`.
- **`aria-labelledby` does NOT fix label-content-name-mismatch for multi-line text**: The ONLY reliable fix is inline spans + space text node + matching aria-label. See `references/wcag-label-in-name.md`.
- **Agentic browsing CSP `frame-ancestors` ignored in meta tag**: The `frame-ancestors` directive only works via HTTP headers, not `<meta http-equiv="Content-Security-Policy">`. Remove it from meta CSP to pass Lighthouse agentic browsing audit. See `references/agentic-browsing-audit.md`.

## Test Environment Notes

- **Component tests fail with `act()` in production builds**: All React component tests using `@testing-library/react`'s `render()` fail with "act(...) is not supported in production builds of React" when the test environment uses a production React build. This affects ALL component tests (including pre-existing ones like EmptyState, ScaleSelector, Skeleton, StatBox). The test logic is correct — the issue is the test configuration. To fix: ensure vitest uses React development build or configure `react: 'development'` in vitest config.

## References
- `references/package-json-fix.md` — repairing malformed package.json
- `references/modal-escape-pattern.js` — escape key handlers
- `references/react-createelement-consistency.md` — createElement vs JSX
- `references/localstorage-util-pattern.ts` — localStorage utilities
- `references/indexeddb-test-mocking.md` — mocking Dexie in vitest
- `references/achievements-testing.md` — achievement test signatures
- `references/post-build-verification.md` — CDP browser verification checklist after Vite build
- `references/achievements-testing.md` — achievement test signatures
- `references/tiered-checkin-pattern.md` — tiered check-in with adaptive recovery
- `references/tour-demo-data-pattern.md` — tour demo data via CustomEvent
- `references/lucide-icon-importmap-pitfall.md` — Lucide icon rendering issues, use emoji
- `references/virtual-date-offset-pattern.md` — virtual date offset architecture
- `references/demo-mode-pattern.md` — demo mode with isolated Dexie
- `references/demo-data-pattern.md` — synthetic data generation (seeded RNG, recovery cycles)
- `references/vite-hmr-cdp-pitfall.md` — HMR WebSocket failure diagnosis and workaround
- `references/paren-mismatch-debug.md` — debugging unclosed parenthesis in large createElement files
- `references/ex-helper-signature-mismatch.md` — helper function signature mismatches in plan templates
- `references/windows-crlf-encoding-pattern.md` — Windows CRLF encoding: write_file produces LF, use Python for large files
- `references/store-derived-state-guards.md` — defensive guards for store-derived state in components
- `references/error-boundary-architecture.md` — ErrorBoundary retry pattern, per-page wrapping, three-tier state checklist
- `references/sw-update-pattern.md` — SW update detection, Vite manifest caching quirk, online/offline indicator pattern
- `references/wcag-label-in-name.md` — WCAG 2.5.3 Label in Name fix pattern (inline spans, space text node, aria-labelledby doesn't work)
- `references/data-export-import-pattern.md` — export/import validation, auto-backup before import/demo
- `references/agentic-browsing-audit.md` — passing Lighthouse agentic browsing audit (llms.txt, CSP meta tag pitfalls)
- `references/simulator-pattern.md` — interactive what-if simulator pattern (sliders + real engine functions + color-coded results)

## Templates
- `templates/pwa-manifest.json` — baseline manifest
- `templates/streak-engine.ts` — streak calculation template

## Scripts
- `scripts/lighthouse-audit.sh` — Lighthouse CI locally