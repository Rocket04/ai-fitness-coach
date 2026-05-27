# Repository Audit Report: fitness-tracker

**Date:** 2026-05-23
**Scope:** All `.js`, `.jsx`, `.ts`, `.tsx`, `.css` files excluding `node_modules/`, `.git/`, `.kilo/skills/`

---

## 1. Executive Summary

The repository contains significant dead code from a migration from a flat `ui/` directory structure to `js/ui/`. The old `ui/` directory at the root level is completely disconnected from the current codebase. Additionally, there are numerous unused components, pages, stores, and config files within `js/` itself.

**Total files that can be safely deleted: 30+ files (~200KB)**

---

## 2. Old `ui/` Directory — Completely Dead

The entire root-level `ui/` directory contains legacy code from before the migration to `js/ui/`. Zero files in the current codebase import from this directory. The old versions use `@radix-ui/*` packages while the new versions use `@base-ui/react/*`.

### Files to delete:

| File | Size | Notes |
|------|------|-------|
| `ui/components/Collapsible.js` | 759 B | Old Radix-based version; replaced by `js/ui/components/Collapsible.jsx` |
| `ui/components/MiniChart.js` | 871 B | Old version; replaced by `js/ui/components/MixiChart.jsx` (stub) |
| `ui/components/Modal.js` | 1,089 B | Old Radix-based version; replaced by `js/ui/components/Modal.jsx` |
| `ui/components/Pill.js` | 351 B | Simple component, not imported anywhere |
| `ui/pages/InfoPage.js` | 3,162 B | Old page; imports from `../components/Pill.js` and `../components/Collapsible.js` |
| `ui/pages/LogPage.js` | 12,131 B | Old page; imports from `../components/Pill.js` and `../components/MiniChart.js` |
| `ui/pages/NutritionPage.js` | 1,930 B | Old page; standalone but never imported |
| `ui/pages/RehabPage.js` | 2,318 B | Old page; imports from `../components/Collapsible.js` |

**Action:** Delete the entire `ui/` directory (8 files, ~22.5 KB)

---

## 3. Unused Files Within `js/`

### 3.1. Unused UI Components (`js/ui/components/`)

| File | Size | Notes |
|------|------|-------|
| `js/ui/components/MiniChart.jsx` | 122 B | Stub — returns `null`, never imported |
| `js/ui/components/ReadinessRing.jsx` | 185 B | Stub — returns `null`, never imported |
| `js/ui/components/RecoveryBar.jsx` | 176 B | Stub — returns `null`, never imported |
| `js/ui/components/SVGRing.jsx` | 2,294 B | Full implementation, never imported |
| `js/ui/components/TomorrowPreview.jsx` | 2,675 B | Full implementation, never imported |
| `js/ui/components/Tooltip.jsx` | 1,571 B | Full implementation, never imported |

**Total: 6 files, ~7 KB**

### 3.2. Unused UI Pages (`js/ui/pages/`)

These are page-level components that are never loaded by `app.tsx` and never imported by any other file:

| File | Size | Notes |
|------|------|-------|
| `js/ui/pages/InfoPage.jsx` | 14,513 B | Full page, never loaded in `app.tsx` |
| `js/ui/pages/NutritionPage.jsx` | 5,963 B | Full page, never loaded in `app.tsx` |
| `js/ui/pages/QuickStats.jsx` | 869 B | Full page, never loaded in `app.tsx` |
| `js/ui/pages/RecoveryScoreCard.jsx` | 8,020 B | Full page, never loaded in `app.tsx` |
| `js/ui/pages/RehabPage.jsx` | 2,665 B | Full page, never loaded in `app.tsx` |
| `js/ui/pages/SessionPlan.jsx` | 3,986 B | Full page, never loaded in `app.tsx` |
| `js/ui/pages/CoachAdvice.jsx` | 17,685 B | Full page, never loaded; actual advice logic is in `js/core/advice.ts` |

**Total: 7 files, ~53.7 KB**

### 3.3. Unused Zustand Stores (`js/stores/`)

| File | Size | Notes |
|------|------|-------|
| `js/stores/useSettingsStore.ts` | 1,510 B | Store created but never imported by any component |
| `js/stores/useCheckinStore.ts` | 2,374 B | Store created but never imported by any component |
| `js/stores/useUIStore.ts` | 1,493 B | Store created but never imported by any component |

**Total: 3 files, ~5.4 KB**

### 3.4. Unused Config Files (`js/config/`)

| File | Size | Notes |
|------|------|-------|
| `js/config/achievements.js` | 1,225 B | Never imported anywhere |
| `js/config/constants.d.ts` | 2,168 B | Type declaration file, never directly imported |

**Total: 2 files, ~3.4 KB**

### 3.5. Orphaned Type Declaration Files

These `.d.ts` files have no corresponding imports:

| File | Size | Notes |
|------|------|-------|
| `js/ui/components/ErrorBoundary.d.ts` | 41 B | Never imported |
| `js/ui/components/Modal.d.ts` | 41 B | Never imported |
| `js/ui/components/Skeleton.jsx.d.ts` | 257 B | Never imported |
| `js/ui/pages/AnalyticsPage.d.ts` | 41 B | Never imported |
| `js/ui/pages/LogPage.d.ts` | 41 B | Never imported |
| `js/ui/pages/MethodologyPage.d.ts` | 41 B | Never imported |
| `js/ui/pages/ProfilePage.d.ts` | 41 B | Never imported |
| `js/ui/pages/TodayPage.d.ts` | 41 B | Never imported |

**Total: 8 files, ~543 B**

---

## 4. Zero-Byte / Empty Files at Root

These files are completely empty (0 bytes) and serve no purpose:

| File | Notes |
|------|-------|
| `constants.js` | Empty — actual constants are in `js/config/constants.js` |
| `engine.js` | Empty — actual engine logic is in `js/core/` |
| `fitness-tracker` | Empty file with no extension |
| `core/engine.js` | Empty — actual engine logic is in `js/core/` |
| `core/storage.js` | Empty — actual storage logic is in `js/core/storage.ts` |

**Total: 5 files, 0 B**

---

## 5. Temporary / Junk Files at Root

| File | Size | Notes |
|------|------|-------|
| `.aider.chat.history.md` | 1,291,972 B | Aider chat history — should not be in repo |
| `.aider.input.history` | 57,619 B | Aider input history — should not be in repo |

**Total: 2 files, ~1.35 MB**

---

## 6. Summary of All Deletable Files

### Safe to Delete (confirmed unused):

| Category | Files | Total Size |
|----------|-------|------------|
| Old `ui/` directory | 8 | ~22.5 KB |
| Unused components in `js/ui/components/` | 6 | ~7 KB |
| Unused pages in `js/ui/pages/` | 7 | ~53.7 KB |
| Unused stores in `js/stores/` | 3 | ~5.4 KB |
| Unused config files in `js/config/` | 2 | ~3.4 KB |
| Orphaned `.d.ts` files | 8 | ~543 B |
| Zero-byte files | 5 | 0 B |
| **Subtotal (code)** | **39** | **~92.5 KB** |

### Temporary/Junk Files:

| Category | Files | Total Size |
|----------|-------|------------|
| Aider history files | 2 | ~1.35 MB |
| **Subtotal (junk)** | **2** | **~1.35 MB** |

### Grand Total: 41 files, ~1.44 MB

---

## 7. Files That Look Suspicious But ARE Used

These files might appear unused at first glance but are actually imported:

| File | Imported By |
|------|-------------|
| `js/core/types.ts` | 18 files (stores, core modules, tests) |
| `js/config/tooltips.js` | `js/ui/components/Tooltip.jsx` |
| `js/config/tour-steps.js` | `js/ui/components/GuidedTour.jsx` |
| `js/ui/components/MiniSparkline.jsx` | `js/ui/pages/CheckinForm.jsx` |
| `js/ui/components/TrendIndicator.jsx` | `js/ui/pages/CheckinForm.jsx` |
| `js/ui/components/HeatmapGrid.jsx` | `js/ui/pages/LogPage.jsx` |
| `js/ui/components/CorrelationCard.jsx` | `js/ui/pages/LogPage.jsx` |
| `js/ui/components/RecoveryVsSleepChart.jsx` | `js/ui/pages/LogPage.jsx` |
| `js/ui/components/CheckinHistory.jsx` | `js/ui/pages/LogPage.jsx` |
| `js/ui/pages/TrendChart.jsx` | `js/ui/pages/AnalyticsPage.jsx` |
| `js/ui/pages/WarningsList.jsx` | `js/ui/pages/AnalyticsPage.jsx` |
| `js/ui/pages/WeeklySummary.jsx` | `js/ui/pages/AnalyticsPage.jsx` |
| `js/ui/pages/CheckinForm.jsx` | `js/ui/pages/LogPage.jsx` |
| `js/ui/pages/SessionLogger.jsx` | `js/ui/pages/LogPage.jsx` |
| `js/core/engine.test.js` | Standalone test runner (not imported, but executable) |

---

## 8. Notes

1. **No broken imports found** — all import paths in the codebase resolve to existing files.

2. **The `js/plans/` directory** exists but is inaccessible (permission denied). It may contain additional dead code.

3. **The `reports/` directory** is also inaccessible and may contain stale reports.

4. **The `dist/` directory** contains a production build and should typically be in `.gitignore`, but this is a build artifact rather than source code.

5. **Test coverage gaps** — several core components have no tests (OnboardingWizard, ExerciseCard, GuidedTour, etc.), though this is not part of the dead code audit.

6. **The `js/core/engine.test.js`** file uses `require('assert')` and dynamic `import()` — it's a standalone Node.js test runner, not a vitest test. It's not referenced by any test configuration.
