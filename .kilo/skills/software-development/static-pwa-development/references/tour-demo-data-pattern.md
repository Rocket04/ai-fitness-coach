# Tour Demo Data Pattern

## Problem
Guided tour steps target real UI elements (`.sparkline-card`, `.training-header`, etc.) but on first launch these elements are empty because the user has no data yet. The tour should show meaningful content.

## Solution: CustomEvent Bridge

**GuidedTour component** dispatches a custom event when entering a step with `demoData: true`:
```jsx
window.dispatchEvent(new CustomEvent('tour-demo-data', { detail: { step: currentStep } }));
```

**Page component** listens and injects mock data into the Zustand store:
```jsx
useEffect(() => {
  const handler = (e) => {
    const step = e.detail?.step;
    if (step === 1) { // Step 2 (0-indexed): trends
      useAppStore.setState({ trendData7: DEMO_TREND_DATA, rpeTrend7: DEMO_RPE_DATA, ... });
    }
    if (step === 2) { // Step 3: workout plan
      useAppStore.setState({ sessionPlan: DEMO_SESSION, trainType: 'A', ... });
    }
  };
  window.addEventListener('tour-demo-data', handler);
  return () => window.removeEventListener('tour-demo-data', handler);
}, []);
```

## Demo Data Guidelines
- **Trend data**: 7 points with realistic variation (recoveryScore 55-78, hrv 45-60, restHR 58-66, sleep 6-8.5)
- **RPE data**: 4-5 sessions spread across the week
- **Session plan**: 3 exercises with one APRE-enabled, realistic names matching the training plan
- Data should look realistic but clearly be sample data (no need for perfect progression)

## Tour Step Flags
Add these boolean flags to step config in `tour-steps.js`:
- `demoData: true` — triggers mock data injection
- `pulseTarget: true` — adds CSS pulse animation to highlighted element
- `highlightBorder: true` – adds accent outline
- `softDrop: true` — adds staggered enter animation
- `noScroll: true` — skips scrollIntoView to prevent scroll jump
