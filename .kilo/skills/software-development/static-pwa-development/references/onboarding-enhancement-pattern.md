# Onboarding Enhancement Pattern

## Purpose
Add new steps to an existing React-based onboarding wizard for a PWA. Covers state, UI, CSS, and store wiring.

## Current Flow (5-step)
```
VALUE (0) → GOAL (1) → SPORTS (2) → GADGETS (3) → RECOVERY (4)
```

### Step Details
| Step | Component | State | Validation |
|------|-----------|-------|------------|
| VALUE | `ValueStep` | none | Always proceed |
| GOAL | `GoalStep` | `selectedGoal`, `trainDays` | goal selected AND ≥1 day |
| SPORTS | `SportsStep` | `selectedSports` | ≥1 sport selected |
| GADGETS | `GadgetsStep` | `selectedGadgets`, `derivedTier` | ≥1 gadget selected |
| RECOVERY | `RecoveryStep` | none | Always proceed (finish) |

## Updated Steps

### 1. Define Constants in `js/config/constants.js`
```javascript
export const SPORT_CATEGORIES = [
  { key: 'cardio', label: 'Кардио', emoji: '🏃', sports: [
    { key: 'running', label: 'Бег' },
    { key: 'cycling', label: 'Велосипед' },
    // ...
  ]},
  // ...
];

export const GADGETS = [
  { key: 'manual', label: 'Ручной ввод', tier: 'light', exclusive: true },
  { key: 'smart_watch', label: 'Смарт-часы', tier: 'medium' },
  { key: 'hrv_monitor', label: 'HRV-монитор', tier: 'full' },
];

export function deriveTierFromGadgets(gadgets) {
  if (gadgets.includes('manual')) return 'light';
  if (gadgets.includes('hrv_monitor')) return 'full';
  if (gadgets.includes('smart_watch') || gadgets.includes('heart_rate_monitor')) return 'medium';
  return 'light';
}
```

### 2. Sport Selection Step
Multi-category chip selection using checkbox pattern:
- Group sports by SPORT_CATEGORIES
- Each category shows emoji header + sport name chips
- Toggle via `onToggleSport(sportKey)` — adds/removes from `selectedSports` array

### 3. Gadget Selection Step
Card-based selection with exclusive "manual" option:
- Manual gadget is exclusive — selecting it deselects all others, and vice versa
- Non-exclusive gadgets can be combined
- Show tier recommendation that auto-updates based on selections

```javascript
const handleToggleGadget = (gadgetKey) => {
  setSelectedGadgets(prev => {
    const gadget = GADGETS.find(g => g.key === gadgetKey);
    if (gadget?.exclusive) {
      return prev.includes(gadgetKey) ? [] : [gadgetKey];
    }
    const withoutManual = prev.filter(g => g !== 'manual');
    if (withoutManual.includes(gadgetKey)) {
      return withoutManual.filter(g => g !== gadgetKey);
    }
    return [...withoutManual, gadgetKey];
  });
};

// Derive tier from current selection (call in render, not in state)
const derivedTier = deriveTierFromGadgets(selectedGadgets);
```

### 4. TypeScript Union Type PITFALL ⚠️
The wizard's `onComplete` callback passes `checkinTier` as a plain `string`, but the store's `completeOnboarding` parameter type expects the `CheckinTier` union type (`'full' | 'medium' | 'light'`). This causes TS error TS2345 at the call site in `app.tsx`.

**Fix:** Cast the derived tier or define the wizard's callback payload type explicitly:
```javascript
// In the wizard's handleFinish:
onComplete({
  // ...
  checkinTier: derivedTier as CheckinTier,  // or use the type from recoveryScore.js
});
```

Or better: import and use the `CheckinTier` type in the wizard file.

### 5. CSS Classes Needed
```css
/* Sports */
.onboarding-sports-categories { flex-direction: column; }
.onboarding-sports-category__header { emoji + label }
.onboarding-sport-chip / --selected

/* Gadgets */
.onboarding-gadgets-list { flex-direction: column; }
.onboarding-gadget-card / --selected
.onboarding-gadget-label, .onboarding-gadget-desc
.onboarding-tier-recommendation
```

### 6. Wire into Wizard Flow
```javascript
const STEPS = { VALUE: 0, GOAL: 1, SPORTS: 2, GADGETS: 3, RECOVERY: 4 };
const totalSteps = 5;

// In render:
step === STEPS.SPORTS && React.createElement(SportsStep, {
  selectedSports, onToggleSport: handleToggleSport,
  onNext: () => setStep(STEPS.GADGETS),
  onBack: () => setStep(STEPS.GOAL),
}),
step === STEPS.GADGETS && React.createElement(GadgetsStep, {
  selectedGadgets, onToggleGadget: handleToggleGadget, derivedTier,
  onNext: () => setStep(STEPS.RECOVERY),
  onBack: () => setStep(STEPS.SPORTS),
}),
```

### 7. Store Handler Update
Extend `completeOnboarding` to handle new fields:
```javascript
completeOnboarding: async (data) => {
  const tier = data.checkinTier || 'medium';
  await saveSettings({
    startDate: todayISO,
    trainDays: data.trainDays,
    checkinTier: tier,
    selectedGadgets: data.selectedGadgets || [],
    selectedSports: data.selectedSports || [],
  });
  // ... set store state
}
```

### 8. Storage Layer Update
`getSettings()` and `saveSettings()` in `js/core/storage.js` must be extended to load/save `checkinTier`, `selectedGadgets`, `selectedSports`.

`saveSettings` signature:
```javascript
export async function saveSettings(settings: Partial<Settings> & {
  checkinTier?: string;
  selectedGadgets?: string[];
  selectedSports?: string[];
}): Promise<void>
```

### 9. Verify
1. Open the app fresh (localStorage cleared) to trigger onboarding
2. Step through all 5 steps, test back/forward navigation
3. Verify gadget selection auto-derives tier (HRV→full, watch→medium, manual→light)
4. Verify exclusive "manual" gadget logic
5. Complete onboarding, verify settings persist across page refresh
6. Run `npm test` — all existing tests must still pass
7. Use Chrome DevTools MCP to verify visually
