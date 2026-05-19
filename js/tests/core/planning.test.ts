import { describe, it, expect } from 'vitest';
import { getWorkoutType, getLastSessionByType, getMonthAndDayIndex } from '../../core/planning.js';
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

  it('returns dayIndex 0 for type A', () => {
    const { dayIndex } = getMonthAndDayIndex(1, 'A');
    expect(dayIndex).toBe(0);
  });

  it('returns dayIndex 2 for type B', () => {
    const { dayIndex } = getMonthAndDayIndex(1, 'B');
    expect(dayIndex).toBe(2);
  });

  it('returns dayIndex 4 for type C', () => {
    const { dayIndex } = getMonthAndDayIndex(1, 'C');
    expect(dayIndex).toBe(4);
  });

  it('maps weeks 1-4 to month index 0', () => {
    const r1 = getMonthAndDayIndex(1, 'A');
    const r4 = getMonthAndDayIndex(4, 'A');
    expect(r1.month).toBe(r4.month);
  });

  it('maps weeks 5-8 to month index 1', () => {
    const r5 = getMonthAndDayIndex(5, 'A');
    const r8 = getMonthAndDayIndex(8, 'A');
    expect(r5.month).toBe(r8.month);
    expect(r5.month).not.toBe(getMonthAndDayIndex(4, 'A').month);
  });
});
