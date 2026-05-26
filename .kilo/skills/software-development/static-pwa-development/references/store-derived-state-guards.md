# Store-Derived State Guards Pattern

## Problem
Components that destructure computed/derived properties from the Zustand store (e.g., `weeklySummary`, `monthStats`, `sessionPlan`) can crash with "Cannot read properties of undefined (reading 'X')" during the brief window before `initApp()` completes and `computeDerived()` populates the derived state.

This manifests as a runtime crash at the first property access (e.g., `weeklySummary.completed`).

## When to Apply
- Any new page/component that destructures derived state from `useAppStore()`
- Existing components that crash during initial load or after store reset
- Components that access nested properties of derived objects (e.g., `sessionPlan.exercises`)

## The Pattern

```jsx
export default function MyPage() {
  const { t } = useTranslation();
  const state = useAppStore();

  // 1. Null guard for store itself (paranoia)
  if (!state) {
    return React.createElement('div', { className: 'card' }, 'Загрузка контекста...');
  }

  const {
    // ... other fields ...
    weeklySummary,
    monthStats,
    dataLoaded,          // ← always include this
  } = state;

  // 2. Loading guard — early return before accessing derived state
  if (!dataLoaded) {
    return React.createElement(
      'div',
      { className: 'card fade-in-up' },
      React.createElement('p', { className: 'text-muted font-body text-sm' }, 'Загрузка данных...')
    );
  }

  // 3. Safe defaults — fallback objects matching the TS interface
  const safeWeekly = weeklySummary || {
    completed: 0, avgRPE: null, green: 0,
    yellow: 0, red: 0, dominantStatus: '',
  };
  const safeMonth = monthStats || {
    completed: 0, green: 0, yellow: 0, red: 0,
  };

  // 4. Use safeWeekly / safeMonth (not raw weeklySummary / monthStats) in JSX
  // ...
}
```

## Applied In
- `js/ui/pages/LogPage.jsx` — fixed crash at `weeklySummary.completed` (line 130) by adding `dataLoaded` guard + `safeWeekly`/`safeMonth` fallbacks.
- `js/ui/pages/AnalyticsPage.jsx` — same safe defaults for `weeklySummary`/`monthStats`.
- `js/ui/pages/TodayPage.jsx` — `sessionPlan` null guard with navigation to profile.
- `js/ui/pages/AchievementsPage.jsx` — Skeleton loading, error display + retry, EmptyState for no data.
- `js/ui/pages/MethodologyPage.jsx` — dataLoaded guard + no-data hint banner.
- All pages wrapped in per-page `ErrorBoundary` in `app.tsx`.

## Related Pitfalls
- `computeDerived()` called with undefined variable — ensure all params are destructured from `get()`
- Component references to removed store properties — grep all `.jsx`/`.tsx` after store interface changes
- Test mocks must match current store shape — update mocks when AppStore interface changes
- See `references/error-boundary-architecture.md` for ErrorBoundary + per-page error state patterns
