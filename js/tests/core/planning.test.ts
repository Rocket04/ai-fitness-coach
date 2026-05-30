import { describe, it, expect } from 'vitest';
import { getWorkoutType, getLastSessionByType, getMonthAndDayIndex, buildSessionFromMonth, maybeAddTestExercises, getVolumeMultiplierFromAdherence } from '../../core/planning.js';
import type { Session } from '../../core/types.js';

function makeSession(overrides: Partial<Session> = {}): Session {
  return {
    key: '2025-01-01_A',
    date: '2025-01-01',
    type: 'A',
    completed: true,
    readiness: 'green',
    rpe: 7,
    notes: '',
    updatedAt: Date.now(),
    ...overrides,
  };
}

describe('getWorkoutType', () => {
  const trainDays = [1, 3, 5]; // Mon, Wed, Fri

  it('returns A for first training day (Monday=1)', () => {
    const monday = new Date('2025-01-06'); // Monday
    expect(getWorkoutType(monday, trainDays)).toBe('A');
  });

  it('returns B for second training day (Wednesday=3)', () => {
    const wednesday = new Date('2025-01-08'); // Wednesday
    expect(getWorkoutType(wednesday, trainDays)).toBe('B');
  });

  it('returns C for third training day (Friday=5)', () => {
    const friday = new Date('2025-01-10'); // Friday
    expect(getWorkoutType(friday, trainDays)).toBe('C');
  });

  it('returns null for non-training day', () => {
    const sunday = new Date('2025-01-05'); // Sunday
    expect(getWorkoutType(sunday, trainDays)).toBeNull();
  });

  it('cycles back to A for 4th training day', () => {
    const days4 = [1, 2, 3, 4];
    const thursday = new Date('2025-01-09'); // Thursday=4
    expect(getWorkoutType(thursday, days4)).toBe('A'); // 4th → idx 3 → 3 % 3 === 0 → A
  });

  it('handles empty trainDays array', () => {
    const monday = new Date('2025-01-06');
    expect(getWorkoutType(monday, [])).toBeNull();
  });

  it('handles single training day', () => {
    const days = [1];
    const monday = new Date('2025-01-06');
    expect(getWorkoutType(monday, days)).toBe('A');
  });
});

describe('getLastSessionByType', () => {
  it('returns null for empty array', () => {
    expect(getLastSessionByType([], 'A')).toBeNull();
  });

  it('returns null if no completed sessions of that type', () => {
    const s = makeSession({ type: 'A', completed: false });
    expect(getLastSessionByType([s], 'A')).toBeNull();
  });

  it('returns the most recent completed session of given type', () => {
    const older = makeSession({ date: '2025-01-01', key: '2025-01-01_A' });
    const newer = makeSession({ date: '2025-01-15', key: '2025-01-15_A' });
    expect(getLastSessionByType([older, newer], 'A')?.date).toBe('2025-01-15');
  });

  it('ignores sessions of different type', () => {
    const a = makeSession({ type: 'A' });
    const b = makeSession({ type: 'B', key: '2025-01-01_B' });
    expect(getLastSessionByType([a, b], 'B')).not.toBeNull();
    expect(getLastSessionByType([b], 'A')).toBeNull();
  });

  it('returns null for null type', () => {
    expect(getLastSessionByType([makeSession()], null as any)).toBeNull();
  });
});

describe('getMonthAndDayIndex', () => {
  it('returns nulls for weekNumber=0', () => {
    const r = getMonthAndDayIndex(0, 'A');
    expect(r.month).toBeNull();
    expect(r.dayIndex).toBeNull();
  });

  it('returns nulls for null trainType', () => {
    const r = getMonthAndDayIndex(1, null);
    expect(r.month).toBeNull();
    expect(r.dayIndex).toBeNull();
  });

  // Note: getMonthAndDayIndex is deprecated and returns null for backward compatibility.
  // Tests for specific dayIndex/month values removed — use getSessionForDate instead.
});

describe('buildSessionFromMonth (deprecated)', () => {
  it('returns null (deprecated function)', () => {
    const result = buildSessionFromMonth(null, 0, 'green', false, 1.0, null, 1);
    expect(result).toBeNull();
  });

  it('returns null with various inputs', () => {
    expect(buildSessionFromMonth({}, 1, 'red', true, 0.8, { key: 'test' } as any, 2)).toBeNull();
  });
});

describe('maybeAddTestExercises', () => {
  it('returns the plan unchanged (deprecated function)', () => {
    const plan = { date: '2025-01-01', type: 'A', exercises: [], warmup: [], cooldown: [] } as any;
    const result = maybeAddTestExercises(plan);
    expect(result).toEqual(plan);
  });

  it('returns null if plan is null', () => {
    const result = maybeAddTestExercises(null);
    expect(result).toBeNull();
  });
});

describe('getVolumeMultiplierFromAdherence', () => {
  it('returns 1.2 for completionRate 0.85', () => {
    expect(getVolumeMultiplierFromAdherence(0.85)).toBe(1.2);
  });

  it('returns 1.2 at boundary 0.8', () => {
    expect(getVolumeMultiplierFromAdherence(0.8)).toBe(1.2);
  });

  it('returns 1.0 at boundary 0.6', () => {
    expect(getVolumeMultiplierFromAdherence(0.6)).toBe(1.0);
  });

  it('returns 0.8 for completionRate 0.4', () => {
    expect(getVolumeMultiplierFromAdherence(0.4)).toBe(0.8);
  });

  it('returns 0.8 for completionRate 0', () => {
    expect(getVolumeMultiplierFromAdherence(0)).toBe(0.8);
  });
});
