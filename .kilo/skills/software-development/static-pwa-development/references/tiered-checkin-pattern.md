# Tiered Check-in System

## Description
Adaptive data collection based on user's available gadgets. Three tiers with different Recovery Score weight profiles.

## Weight Profiles

| Metric | Full | Medium | Light |
|--------|------|--------|-------|
| HRV | 40% | 0% | 0% |
| Sleep | 30% | 30% | 0% |
| RHR | 10% | 30% | 0% |
| Subjective | 20% | 40% | 100% |

**Key insight**: Weights are normalized by dividing by the actual weight sum. This means if HRV weight is 0, the remaining weights still sum to 100% after normalization.

## Implementation (js/core/recoveryScore.ts)

```javascript
const WEIGHTS_FULL    = { hrv: 0.4, sleep: 0.3, rhr: 0.1, subjective: 0.2 };
const WEIGHTS_MEDIUM  = { hrv: 0,   sleep: 0.3, rhr: 0.3, subjective: 0.4 };
const WEIGHTS_LIGHT   = { hrv: 0,   sleep: 0,   rhr: 0,   subjective: 1.0 };

export function calculateRecoveryScore(checkin, allCheckins, tier = 'full') {
  const weights = getWeightsForTier(tier);
  // ... compute individual scores ...
  // Normalize by actual weight sum:
  const weightSum = weights.hrv + weights.sleep + weights.rhr + weights.subjective;
  const total = (hrvScore * weights.hrv + sleepScore * weights.sleep +
                 rhrScore * weights.rhr + subjectiveScore * weights.subjective)
                / weightSum * 10;
  return Math.round(Math.min(100, Math.max(0, total)));
}
```

## Store Integration Pattern

### 1. Add to Store State
```javascript
checkinTier: 'medium',  // default for backward compat
selectedGadgets: [],
selectedSports: [],
```

### 2. Pass Through computeDerived
Every `computeDerived()` call in the store must pass `checkinTier` as the last argument (11+ call sites). Missing any call site causes the tier to silently revert to `'medium'`.

### 3. Persist to IndexedDB
Extend `getSettings()` / `saveSettings()` in `storage.ts` to load/save `checkinTier`, `selectedGadgets`, `selectedSports` as additional key-value pairs.

### 4. Add Setter Actions
```javascript
setCheckinTier: async (v) => {
  await saveSetting('checkinTier', v);
  const s = get();
  const derived = computeDerived(s.sessions, s.checkins, s.startDate, s.trainDays, s.manualOverride, s.todayISO, v);
  set({ checkinTier: v, ...derived });
},
```

## Pitfalls
- **TypeScript union type mismatch**: The wizard passes `checkinTier: string` but store expects `CheckinTier` (`'full' | 'medium' | 'light'`). Fix: derive tier from gadgets using `deriveTierFromGadgets()` which returns the union type directly.
- **Missing computeDerived call sites**: When adding a new `checkinTier` parameter, you MUST update ALL existing `computeDerived()` call sites. Use `grep -n "computeDerived" js/stores/useAppStore.ts` to find them all.
- **Backward compatibility**: Always default to `'medium'` for existing users who have no `checkinTier` in their settings DB.
