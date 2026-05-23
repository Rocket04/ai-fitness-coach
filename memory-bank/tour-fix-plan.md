# Guided Tour UX Fix Plan

## Issues to Fix

### Step 1: Recovery Score Ring (tooltip overlaps ring)
- Current: tooltip positioned at 'bottom' of .card--hero, overlaps the ring
- Fix: Change to 'top' position so tooltip appears above the ring
- Add pulse animation to the ring element via CSS

### Step 2: 7-day trends (empty chart, no animation)
- Current: .sparkline-card targets empty trendData7 (no checkins yet)
- Fix: Inject demo/mock data when real data is empty for tour display
- Add soft-drop animation CSS for trend bars
- Add highlight border via tour-highlight class

### Step 3: Today's workout plan (empty)
- Current: .training-header targets empty sessionPlan
- Fix: Inject demo session data for tour display

### Step 6: Quick actions (scroll issue)
- Current: scrollIntoView uses block: 'center' which causes jump
- Fix: Change to block: 'nearest' to prevent scroll disruption
- Ensure tooltip positions correctly after scroll

### Demo Data Strategy
Create a `getDemoData()` function that provides realistic sample data for tour display without polluting the real store. This data is only shown during the tour.

## Files to Modify
1. js/config/tour-steps.js — add demoData flag to steps
2. js/ui/components/GuidedTour.jsx — position fixes, scroll fix, demo data injection
3. css/styles.css — add tour animations and highlight styles
4. js/ui/pages/TodayPage.jsx — inject demo data during tour
5. js/ui/pages/AnalyticsPage.jsx — inject demo data during tour
