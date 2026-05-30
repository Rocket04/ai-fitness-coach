# ErrorBoundary + Per-Page Error State Architecture

## ErrorBoundary Design Principles

### Retry, Don't Reload
Default React ErrorBoundary examples always show "Reload page" — this is wrong for SPA tab navigation. The correct pattern:

```jsx
// ErrorBoundary.jsx — retry resets state, doesn't reload
class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return typeof this.props.fallback === 'function'
          ? this.props.fallback({ retry: this.handleRetry })
          : this.props.fallback;
      }
      // Default: show error + retry button (+ page reload as last resort)
    }
    return this.props.children;
  }
}
```

### Per-Page ErrorBoundary Wrapping (app.tsx)
Wrap each lazy-loaded page in its own ErrorBoundary so one crashing tab doesn't kill the whole app:

```jsx
{pages.map((p, i) => (
  <div key={p.key} hidden={activeTab !== i}>
    <ErrorBoundary
      key={activeTab}
      fallback={function (props: { retry?: () => void }) {
        return (
          <div className="card" style={{ textAlign: 'center' }}>
            <p>Ошибка отображения раздела</p>
            <button className="btn btn-accent" onClick={() => props.retry?.()}>
              <RefreshCw size={16} /> Повторить
            </button>
          </div>
        );
      }}
    >
      <p.component />
    </ErrorBoundary>
  </div>
))}
```

Key: `key={activeTab}` forces remount on tab switch (clears stale error). Use `function` not arrow for fallback in `.tsx` to avoid implicit `any`.

## Three-Tier State Pattern (Every Page Needs This)

1. **Loading** (`!dataLoaded`) → Skeleton or spinner
2. **Empty** (data loaded but no content) → EmptyState component  
3. **Error** (render crash) → ErrorBoundary catches it

### Implementation Checklist

```jsx
const { dataLoaded, items, derivedStats } = useAppStore();

// 1. LOADING — early return before touching derived state
if (!dataLoaded) {
  return React.createElement('div', { className: 'card' }, 'Загрузка...');
}

// 2. ERROR — inline error with retry
if (error) {
  return React.createElement('div', { className: 'card' },
    React.createElement('p', null, error),
    React.createElement('button', { onClick: retry }, 'Повторить')
  );
}

// 3. EMPTY — EmptyState with icon + subtitle
if (!items || items.length === 0) {
  return React.createElement(EmptyState, {
    icon: React.createElement(Inbox, { size: 20 }),
    title: 'Нет данных',
    subtitle: 'Данные появятся после первых тренировок.',
  });
}

// 4. SAFE DERIVED — fallback objects matching TS interfaces
const safeStats = derivedStats || { completed: 0, avgRPE: null, green: 0, yellow: 0, red: 0, dominantStatus: '' };

// 5. MAIN RENDER — use safe* values
```

## Applied In (2026-05-28)

| Page | Loading | Empty | Error | Safe Defaults |
|------|---------|-------|-------|---------------|
| TodayPage | dataLoaded guard | sessionPlan null → navigate to profile | ErrorBoundary | — |
| LogPage | dataLoaded guard | — | ErrorBoundary | weeklySummary, monthStats |
| AnalyticsPage | dataLoaded guard | EmptyState + Skeletons | ErrorBoundary | weeklySummary, monthStats |
| AchievementsPage | SkeletonCard | EmptyState (no achievements) | Inline error + retry | — |
| MethodologyPage | dataLoaded guard | No-data hint banner | ErrorBoundary | — |
| ProfilePage | — (sync) | — (sections handle own) | ErrorBoundary | — |
| SessionLogger | — (sync) | EmptyState (no sessions/tests) | ErrorBoundary | — |
