import { describe, it, expect } from 'vitest';
import { calcReadiness, getEffectiveReadiness, detectRecoveryDebt } from '../../domains/recovery/readiness.js';
import type { Checkin } from '../../core/types.js';

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

describe('calcReadiness', () => {
  it('returns green for ideal checkin', () => {
    expect(calcReadiness(makeCheckin())).toBe('green');
  });

  it('returns red for critically low sleep', () => {
    expect(calcReadiness(makeCheckin({ sleepHours: 5 }))).toBe('red');
  });

  it('returns red for very low HRV', () => {
    expect(calcReadiness(makeCheckin({ hrv: 35 }))).toBe('red');
  });

  it('returns red for high resting HR', () => {
    expect(calcReadiness(makeCheckin({ restHR: 80 }))).toBe('red');
  });

  it('returns red for bad breathing', () => {
    expect(calcReadiness(makeCheckin({ breathing: 'bad' }))).toBe('red');
  });

  it('returns red for severe pain', () => {
    expect(calcReadiness(makeCheckin({ hipPain: 5 }))).toBe('red');
  });

  it('returns yellow for borderline sleep (6.5h)', () => {
    expect(calcReadiness(makeCheckin({ sleepHours: 6.5 }))).toBe('yellow');
  });

  it('returns yellow for mild breathing', () => {
    expect(calcReadiness(makeCheckin({ breathing: 'mild' }))).toBe('yellow');
  });

  it('returns yellow for moderate HRV (50)', () => {
    expect(calcReadiness(makeCheckin({ hrv: 50 }))).toBe('yellow');
  });

  it('ignores zero values (not measured)', () => {
    expect(calcReadiness(makeCheckin({ hrv: 0, restHR: 0, sleepHours: 0 }))).toBe('green');
  });
});

describe('getEffectiveReadiness', () => {
  it('returns autoReadiness when manualStatus is unknown', () => {
    expect(getEffectiveReadiness('green', 'unknown')).toBe('green');
    expect(getEffectiveReadiness('red', 'unknown')).toBe('red');
  });

  it('overrides with manual status when set', () => {
    expect(getEffectiveReadiness('red', 'green')).toBe('green');
    expect(getEffectiveReadiness('green', 'red')).toBe('red');
    expect(getEffectiveReadiness('green', 'yellow')).toBe('yellow');
  });
});

describe('detectRecoveryDebt', () => {
  it('returns false for empty array', () => {
    expect(detectRecoveryDebt([])).toBe(false);
  });

  it('returns false for healthy checkins', () => {
    const c = makeCheckin();
    expect(detectRecoveryDebt([c, c, c])).toBe(false);
  });

  it('returns true when points accumulate >= 4', () => {
    const bad = makeCheckin({ sleepHours: 5.5, hrv: 38 });
    expect(detectRecoveryDebt([bad])).toBe(true);
  });

  it('returns true for consistently poor sleep across 3 days', () => {
    const c = makeCheckin({ sleepHours: 6.2 });
    expect(detectRecoveryDebt([c, c, c])).toBe(true);
  });

  it('handles null entries gracefully', () => {
    const c = makeCheckin();
    expect(detectRecoveryDebt([c, null, c])).toBe(false);
  });
});
