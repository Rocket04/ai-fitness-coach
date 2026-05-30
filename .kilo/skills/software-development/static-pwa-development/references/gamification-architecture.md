# Gamification System — Architecture & Restoration Notes

## Where Gamification Lives

| Concern | File | UI Location |
|---------|------|-------------|
| Achievement definitions (15 achievements, 6 categories, 3 tiers) | `js/config/achievements.js` | — |
| Achievement evaluation + storage | `js/core/achievements.ts` | — |
| Streak engine (check-in, training, green streaks) | `js/core/streak.ts` | — |
| Achievements list UI | `js/ui/pages/AchievementsPage.jsx` | Standalone page (if nav added) |
| Achievements section in profile | `js/ui/pages/ProfilePage.jsx` → `ProfileSection("🏆 Достижения")` | ProfilePage collapsible section |
| Streak badge component | `js/ui/components/StreakBadge.tsx` | Used inline in TodayPage |
| Achievement unlock toast | `js/ui/components/AchievementToast.tsx` | Rendered globally in app.tsx |
| Store: `pendingAchievement` state + `clearPendingAchievement` action | `js/stores/useAppStore.ts` | — |
| Store: achievement checking in `handleSaveCheckin` / `handleToggleTraining` | `js/stores/useAppStore.ts` | — |

## Achievement Unlock Flow

1. User completes check-in → `handleSaveCheckin()` → calls `checkAchievements(sessions, newCheckins, trainDays, startDate)`
2. User completes training → `handleToggleTraining()` → calls `checkAchievements(newSessions, checkins, trainDays, startDate)`
3. If newly unlocked achievements exist, store sets `pendingAchievement: { key, name, tier, icon }`
4. `AchievementToast` (rendered in app.tsx) detects `pendingAchievement` via store subscription, shows animated toast for 4s, then calls `clearPendingAchievement()`

## ProfilePage Achievements Section

The section shows:
- Unlocked count (e.g. "3 разблокировано")
- Badges for each unlocked achievement (emoji + key)
- Empty state message when none unlocked
- Current streak with flame icon

State is loaded via `getUnlockedAchievements()` from `achievements.ts`, with a `useEffect` that re-fetches when `sessions`, `checkins`, `trainDays`, or `startDate` change.

## Streak Badge on TodayPage

TodayPage already has an inline streak badge (not using StreakBadge component):
```jsx
streak >= 2 && React.createElement('span', { className: 'streak-badge' },
  React.createElement(Flame, { size: 20 }), ` ${streak}`)
```

## CSS Pattern

All achievement-related CSS lives in `css/styles.css` (appended at end). No separate CSS files — the project has no CSS module type declarations.

## Common Restoration Issues

When restoring gamification files from git after accidental deletion:

1. **CSS imports**: Remove `import './Foo.css'` from TSX files, append CSS to `css/styles.css`
2. **Type mismatches**: `Checkin.notes` may be `string` (not `string | undefined`) in current types — add `notes: ''` to test mocks
3. **Session type**: `Session.type` is `'A' | 'B' | 'C' | undefined` — `'morning'` is not valid in test mocks for workout achievements
4. **`progress()` signature**: Achievement `progress` functions take `(sessions, checkins, streak)` — but `getAchievementStatus` was passing 5 args. The `progress` call in `getAchievementStatus` must match the actual signature used in `achievements.js` definitions.
5. **Unused imports**: `achievements.ts` imports `ACHIEVEMENT_CATEGORIES` and `ACHIEVEMENT_TIERS` but may not use them — remove unused imports to satisfy `tsc --noEmit`
