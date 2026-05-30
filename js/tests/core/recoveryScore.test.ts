// js/tests/core/recoveryScore.test.ts
// TDD: Tiered Recovery Score calculation — Full, Medium, Light

import { describe, it, expect } from 'vitest';
import { calculateRecoveryScore, getWeightsForTier } from '../../domains/recovery/recoveryScore.js';
import type { Checkin } from '../../core/types.js';

function makeCheckin(overrides: Partial<Checkin> = {}): Checkin {
  return {
    date: '2026-05-24',
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
    ...overrides,
  };
}

function makeHistory(days: number, base?: Partial<Checkin>): Checkin[] {
  const history: Checkin[] = [];
  for (let i = days; i >= 1; i--) {
    const d = new Date(2026, 4, 24 - i);
    const dateStr = d.toISOString().slice(0, 10);
    history.push(makeCheckin({ date: dateStr, ...base }));
  }
  return history;
}

describe('getWeightsForTier', () => {
  it('full tier weights HRV at 0.4, sleep at 0.3, RHR at 0.1, subjective at 0.2', () => {
    const w = getWeightsForTier('full');
    expect(w.hrv).toBe(0.4);
    expect(w.sleep).toBe(0.3);
    expect(w.rhr).toBe(0.1);
    expect(w.subjective).toBe(0.2);
  });

  it('medium tier zeroes HRV and shifts weight to RHR and subjective', () => {
    const w = getWeightsForTier('medium');
    expect(w.hrv).toBe(0);
    expect(w.sleep).toBe(0.3);
    expect(w.rhr).toBe(0.3);
    expect(w.subjective).toBe(0.4);
  });

  it('light tier uses only subjective weight (1.0)', () => {
    const w = getWeightsForTier('light');
    expect(w.hrv).toBe(0);
    expect(w.sleep).toBe(0);
    expect(w.rhr).toBe(0);
    expect(w.subjective).toBe(1);
  });
});

describe('calculateRecoveryScore — tier comparison', () => {
  const history = makeHistory(14);
  const today = makeCheckin();

  it('returns a number between 0 and 100 for each tier', () => {
    for (const tier of ['full', 'medium', 'light'] as const) {
      const score = calculateRecoveryScore(today, history, tier);
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
      expect(typeof score).toBe('number');
    }
  });

  it('light tier returns subjective-only score', () => {
    const score = calculateRecoveryScore(today, [], 'light');
    // With energy=4, mood=4, soreness=1: subjectiveRaw = (4+4+(5-1))/3 = 4, score = 4*2 = 8, *10 = 80
    expect(score).toBe(80);
  });

  it('low energy/mood gives low score on light tier', () => {
    const bad = makeCheckin({ energy: 1, mood: 1, muscleSoreness: 5 });
    const score = calculateRecoveryScore(bad, [], 'light');
    expect(score).toBeLessThan(40);
  });

  it('good metrics give high score on light tier', () => {
    const good = makeCheckin({ energy: 5, mood: 5, muscleSoreness: 1 });
    const score = calculateRecoveryScore(good, [], 'light');
    expect(score).toBeGreaterThan(80);
  });

  it('medium tier scores higher with good RHR than without RHR', () => {
    const withRHR = makeCheckin({ restHR: 55 });
    const noRHR = makeCheckin({ restHR: 0 });
    const scoreWith = calculateRecoveryScore(withRHR, history, 'medium');
    const scoreWithout = calculateRecoveryScore(noRHR, history, 'medium');
    expect(scoreWith).toBeGreaterThan(scoreWithout);
  });

  it('full tier scores higher with good HRV than without HRV', () => {
    const withHRV = makeCheckin({ hrv: 70 });
    const noHRV = makeCheckin({ hrv: 0 });
    const scoreWith = calculateRecoveryScore(withHRV, history, 'full');
    const scoreWithout = calculateRecoveryScore(noHRV, history, 'full');
    expect(scoreWith).toBeGreaterThan(scoreWithout);
  });

  it('returns a valid score with default values and empty history', () => {
    const score = calculateRecoveryScore(makeCheckin(), [], 'medium');
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });

  it('handles missing baseline gracefully (less than 3 history entries)', () => {
    const shortHistory = makeHistory(1);
    const score = calculateRecoveryScore(today, shortHistory, 'full');
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });
});
