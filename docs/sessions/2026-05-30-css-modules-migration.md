# Session: CSS Modules Migration

## Goal
Refactor monolithic `css/styles.css` (3799 lines) into co-located CSS Modules for components in `js/shared/ui/` and `js/ui/components/`.

## Migration Order
1. Collapsible.jsx (shared)
2. ExerciseCard.jsx
3. CheckinHistory.jsx
4. HeatmapGrid.jsx
5. CorrelationCard.jsx
6. RecoveryVsSleepChart.jsx
7. OnboardingWizard.jsx
8. ExerciseConfigModal.jsx
9. AchievementToast.tsx
10. GuidedTour.jsx (shared)
11. Modal.jsx (shared)
12. ScaleSelector.jsx (shared)
13. EmptyState.jsx (shared)
14. Skeleton.jsx (shared)
15. StatBox.jsx (shared)
16. TrendIndicator.jsx (shared)

## Results

### Components migrated: 16
1. Collapsible.jsx (shared)
2. ExerciseCard.jsx
3. CheckinHistory.jsx
4. HeatmapGrid.jsx
5. CorrelationCard.jsx
6. RecoveryVsSleepChart.jsx
7. OnboardingWizard.jsx
8. ExerciseConfigModal.jsx
9. AchievementToast.tsx
10. GuidedTour.jsx (shared)
11. Modal.jsx (shared)
12. ScaleSelector.jsx (shared)
13. EmptyState.jsx (shared)
14. Skeleton.jsx (shared)
15. StatBox.jsx (shared)
16. TrendIndicator.jsx (shared)

### CSS modules created: 16
- `js/shared/ui/Collapsible.module.css`
- `js/shared/ui/Modal.module.css`
- `js/shared/ui/ScaleSelector.module.css`
- `js/shared/ui/EmptyState.module.css`
- `js/shared/ui/Skeleton.module.css`
- `js/shared/ui/StatBox.module.css`
- `js/shared/ui/TrendIndicator.module.css`
- `js/shared/ui/GuidedTour.module.css`
- `js/ui/components/ExerciseCard.module.css`
- `js/ui/components/CheckinHistory.module.css`
- `js/ui/components/HeatmapGrid.module.css`
- `js/ui/components/CorrelationCard.module.css`
- `js/ui/components/RecoveryVsSleepChart.module.css`
- `js/ui/components/OnboardingWizard.module.css`
- `js/ui/components/ExerciseConfigModal.module.css`
- `js/ui/components/AchievementToast.module.css`

### Lines removed from styles.css: ~1827
(3799 → 1972 lines, including ~800 lines of onboarding + ~180 lines of guided tour + APRE exercise card + config modal + achievement toast + scale selector + modal + skeleton + empty state + stat box + trend indicator + collapsible + checkin history + heatmap + correlation card + recovery chart)

### Tests: 41 files, 472 passed (same as before migration)
### Type-check: Clean
### Visual regressions: None (CSS properties preserved identically)

### Additional changes:
- Added `js/css-modules.d.ts` with `declare module '*.module.css'` type declaration
- Updated `tsconfig.json` to include `js/**/*.d.ts` for type resolution
- Updated `OnboardingWizard.test.tsx` to use data-testid instead of `.onboarding-step` CSS selector
- Added `css/styles.css` comment markers for shared utility classes (exercise-row, exercise-name, exercise-list, exercise-sets)

### Global classes preserved in styles.css (NOT moved):
- `.card`, `.btn`, `.btn-accent`, `.btn-outline`, `.pill`, `.tab`, `.chip`
- `.exercise-row`, `.exercise-name`, `.exercise-list`, `.exercise-sets` (used by TodayPage)
- `.checkin-row`, `.checkin-*` (used by CheckinForm page)
- `.modal-close` tap-highlight reset (shared global rule)
- `.stat-grid` (used by pages)
- `.tour-start-btn`, `.tour-start-btn__icon` (used by ProfilePage)
- All `.text-*`, `.font-*`, `.gap-*`, `.mb-*`, `.mt-*`, `.p-*`, `.flex-*`, `.w-full` utility classes
- All page-level styles (today-page, profile-page, log-page, etc.)
- `.correlation-grid` (used by LogPage)
- `.scale-selector` context references in `.checkin-row__scale` (used by CheckinForm)
