// js/tests/core/adaptiveTier.test.ts
// TDD: Adaptive Recovery Score — auto-detect optimal tier from user's actual check-in patterns

import { describe, it, expect } from 'vitest';
import type { Checkin } from '../../core/types.js';

function makeCheckin(overrides: Partial<Checkin> = {}): Checkin {
  return {
    date: '2026-05-24',
    sleepHours: 7,
    restHR: 60,
    hrv: 55,
    hipPain: 0, shoulderPain: 0,
    breathing: 'good' as const,
    weight: 80, notes: '',
    muscleSoreness: 2, energy: 4, mood: 4,
    sleepQuality: 4, stress: 2,
    ts: Date.now(),
    ...overrides,
  };
}

function makeHistory(days: number, fillHRV: boolean = true, fillRHR: boolean = true): Checkin[] {
  const history: Checkin[] = [];
  for (let i = days; i >= 1; i--) {
    const d = new Date(2026, 4, 24 - i);
    const dateStr = d.toISOString().slice(0, 10);
    history.push(makeCheckin({
      date: dateStr,
      hrv: fillHRV ? 55 + Math.random() * 10 : 0,
      restHR: fillRHR ? 60 + Math.random() * 5 : 0,
    }));
  }
  return history;
}

describe('detectOptimalTier (Phase 3)', () => {
  // TDD Step 1: Write the function signature first
  // The function should analyze recent check-ins and suggest optimal tier

  it('should export detectOptimalTier from recoveryScore module', async () => {
    const mod = await import('../../core/recoveryScore.js');
    expect(mod.detectOptimalTier).toBeDefined();
    expect(typeof mod.detectOptimalTier).toBe('function');
  });

  it('returns "full" when HRV is consistently provided in recent checkins', async () => {
    const { detectOptimalTier } = await import('../../core/recoveryScore.js');
    const checkins = makeHistory(7, true, true); // 7 days with HRV+RHR
    const suggestion = detectOptimalTier(checkins);
    expect(suggestion).toBe('full');
  });

  it('suggests "medium" when HRV is missing but RHR is provided', async () => {
    const { detectOptimalTier } = await import('../../core/recoveryScore.js');
    const checkins = makeHistory(7, false, true); // 7 days with RHR but no HRV
    const suggestion = detectOptimalTier(checkins);
    expect(suggestion).toBe('medium');
  });

  it('suggests "light" when neither HRV nor RHR is consistently provided', async () => {
    const { detectOptimalTier } = await import('../../core/recoveryScore.js');
    const checkins = makeHistory(7, false, false); // 7 days with no biometrics
    const suggestion = detectOptimalTier(checkins);
    expect(suggestion).toBe('light');
  });

  it('returns null when insufficient data (less than 3 checkins)', async () => {
    const { detectOptimalTier } = await import('../../core/recoveryScore.js');
    const checkins = makeHistory(2, true, true);
    const suggestion = detectOptimalTier(checkins);
    expect(suggestion).toBeNull();
  });

  it('handles empty checkins array', async () => {
    const { detectOptimalTier } = await import('../../core/recoveryScore.js');
    const suggestion = detectOptimalTier([]);
    expect(suggestion).toBeNull();
  });

  it('suggests "full" when HRV is present in >=70% of recent checkins', async () => {
    const { detectOptimalTier } = await import('../../core/recoveryScore.js');
    // 5 out of 7 with HRV = ~71%
    const checkins = [
      ...makeHistory(5, true, true),
      ...makeCheckinsWithoutHRV(2),
    ];
    const suggestion = detectOptimalTier(checkins);
    expect(suggestion).toBe('full');
  });
});

function makeCheckinsWithoutHRV(count: number): Checkin[] {
  const checkins: Checkin[] = [];
  for (let i = 0; i < count; i++) {
    checkins.push(makeCheckin({ date: `2026-05-${15 + i}`, hrv: 0, restHR: 60 }));
  }
  return checkins;
}
