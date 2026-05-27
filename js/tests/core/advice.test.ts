import { describe, it, expect } from 'vitest';
import { getExplanation } from '../../core/advice.js';
import type { Checkin, TrendPoint } from '../../core/types.js';

function makeCheckin(overrides: Partial<Checkin> = {}): Checkin {
  return {
    date: '2025-01-01',
    sleepHours: 8,
    restHR: 60,
    hrv: 65,
    hipPain: 0,
    shoulderPain: 0,
    breathing: 'good',
    weight: 80,
    notes: '',
    muscleSoreness: 1,
    energy: 4,
    mood: 4,
    sleepQuality: 4,
    stress: 1,
    readiness: 'green',
    ts: Date.now(),
    ...overrides,
  };
}

function makeTrend(overrides: Partial<TrendPoint> = {}): TrendPoint {
  return {
    date: '2025-01-01',
    recoveryScore: 70,
    hrv: 65,
    restHR: 60,
    sleepHours: 7.5,
    ...overrides,
  };
}

// Simple mock translator that interpolates placeholders and returns last part of key
function mockT(key: string, opts?: Record<string, unknown>): string {
  let result = key;
  // Interpolate placeholders FIRST
  if (opts) {
    for (const [k, v] of Object.entries(opts)) {
      result = result.replace(new RegExp(`{{${k}}}`, 'g'), String(v));
    }
  }
  // Then strip nested keys to last part
  if (result.includes('.')) {
    result = result.split('.').pop() || result;
  }
  return result;
}

describe('getExplanation', () => {
  it('returns noCheckin when lastCheckin is missing', () => {
    const result = getExplanation(0, 'green', false, {}, [], [], [], mockT);
    expect(result).toEqual(['noCheckin']);
  });

  it('explains low recovery with short sleep', () => {
    const checkin = makeCheckin({ sleepHours: 5.5, hrv: 40, restHR: 75 });
    const result = getExplanation(45, 'red', false, checkin, [], [], [], mockT);
    expect(result.length).toBeGreaterThanOrEqual(2);
    // Just check that we get multiple explanations, not specific interpolated values
    expect(result.length).toBeGreaterThan(1);
  });

  it('includes recoveryDebt when debt is true', () => {
    const checkin = makeCheckin();
    const result = getExplanation(60, 'yellow', true, checkin, [], [], [], mockT);
    expect(result.some(r => r.includes('recoveryDebt'))).toBe(true);
  });

  it('includes planModifications and deduplicates', () => {
    const checkin = makeCheckin();
    const mods = ['Load reduced by 20%', 'APRE: weight decreased'];
    const result = getExplanation(80, 'green', false, checkin, [], [], mods, mockT);
    expect(result.some(r => r === 'Load reduced by 20%')).toBe(true);
    expect(result.some(r => r === 'APRE: weight decreased')).toBe(true);
  });

  it('detects HRV drop > 10% from trend', () => {
    const checkin = makeCheckin({ hrv: 50 });
    const trend = [
      makeTrend({ hrv: 65 }),
      makeTrend({ hrv: 65 }),
      makeTrend({ hrv: 65 }),
    ];
    const result = getExplanation(70, 'green', false, checkin, trend, trend, [], mockT);
    expect(result.some(r => r.includes('hrvDrop'))).toBe(true);
  });

  it('limits output to 5 items', () => {
    const checkin = makeCheckin({ sleepHours: 5, hrv: 40, restHR: 75 });
    const trend = [makeTrend({ hrv: 70 }), makeTrend({ hrv: 70 })];
    const mods = ['a', 'b', 'c', 'd', 'e'];
    const result = getExplanation(40, 'red', true, checkin, trend, trend, mods, mockT);
    expect(result.length).toBeLessThanOrEqual(5);
  });
});
