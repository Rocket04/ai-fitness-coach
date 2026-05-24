// js/tests/core/streak.test.ts
import { describe, it, expect } from 'vitest';
import { 
  getCheckinStreak, 
  getTrainingStreak, 
  getGreenStreak,
  getAllStreaks,
} from '../../core/streak.js';
import type { Checkin, Session } from '../../core/types.js';

function makeCheckin(date: string, overrides: Partial<Checkin> = {}): Checkin {
  return {
    date,
    sleepHours: 7,
    restHR: 60,
    hrv: 50,
    hipPain: 0,
    shoulderPain: 0,
    breathing: 'good',
    weight: 70,
    muscleSoreness: 0,
    energy: 5,
    mood: 5,
    sleepQuality: 5,
    stress: 3,
    readiness: 'green',
    ts: Date.now(),
    ...overrides,
  };
}

function makeSession(date: string, type: 'A' | 'B' | 'C' | 'morning' | 'evening' = 'A', completed = true): Session {
  return {
    key: `${date}_${type}`,
    date,
    type,
    completed,
    readiness: 'green',
    rpe: 7,
    notes: '',
    updatedAt: Date.now(),
  };
}

// Reference date for testing - 2025-01-10
const TEST_DATE = new Date('2025-01-10T12:00:00');

describe('getCheckinStreak', () => {
  it('returns 0 for empty checkins array', () => {
    expect(getCheckinStreak([])).toBe(0);
  });

  it('returns 1 for a single checkin on reference date', () => {
    const checkins = [makeCheckin('2025-01-10')];
    expect(getCheckinStreak(checkins, TEST_DATE)).toBe(1);
  });

  it('counts consecutive days correctly', () => {
    const checkins = [
      makeCheckin('2025-01-10'),
      makeCheckin('2025-01-09'),
      makeCheckin('2025-01-08'),
    ];
    expect(getCheckinStreak(checkins, TEST_DATE)).toBe(3);
  });

  it('stops at gap in dates', () => {
    const checkins = [
      makeCheckin('2025-01-10'),
      makeCheckin('2025-01-09'),
      makeCheckin('2025-01-07'), // Gap - missing 2025-01-08
    ];
    expect(getCheckinStreak(checkins, TEST_DATE)).toBe(2);
  });
});

describe('getTrainingStreak', () => {
  it('returns 0 for empty sessions array', () => {
    expect(getTrainingStreak([], [1, 3, 5], '2025-01-01')).toBe(0);
  });

  it('counts consecutive training days', () => {
    const sessions = [
      makeSession('2025-01-10', 'A'),
      makeSession('2025-01-09', 'B'),
      makeSession('2025-01-08', 'C'),
    ];
    // Jan 10, 2025 is Friday (day 5), Jan 9 is Thursday (day 4), Jan 8 is Wednesday (day 3)
    expect(getTrainingStreak(sessions, [3, 4, 5], '2025-01-01', TEST_DATE)).toBe(3);
  });

  it('excludes morning and evening sessions', () => {
    const sessions = [
      makeSession('2025-01-10', 'morning'),
      makeSession('2025-01-09', 'evening'),
    ];
    expect(getTrainingStreak(sessions, [5, 4, 3], '2025-01-01', TEST_DATE)).toBe(0);
  });

  it('handles no training sessions', () => {
    const sessions = [makeSession('2025-01-10', 'morning')];
    expect(getTrainingStreak(sessions, [5, 4, 3], '2025-01-01', TEST_DATE)).toBe(0);
  });
});

describe('getGreenStreak', () => {
  it('returns 0 for empty checkins', () => {
    expect(getGreenStreak([])).toBe(0);
  });

  it('counts only green readiness days', () => {
    const checkins = [
      makeCheckin('2025-01-10', { readiness: 'green' }),
      makeCheckin('2025-01-09', { readiness: 'green' }),
      makeCheckin('2025-01-08', { readiness: 'yellow' }),
    ];
    expect(getGreenStreak(checkins, TEST_DATE)).toBe(2);
  });

  it('resets on non-green readiness', () => {
    const checkins = [
      makeCheckin('2025-01-10', { readiness: 'green' }),
      makeCheckin('2025-01-09', { readiness: 'red' }),
      makeCheckin('2025-01-08', { readiness: 'green' }),
    ];
    expect(getGreenStreak(checkins, TEST_DATE)).toBe(1);
  });
});

describe('getAllStreaks', () => {
  it('returns all streak types', () => {
    const checkins = [
      makeCheckin('2025-01-10'),  // green (default)
      makeCheckin('2025-01-09'),   // green (default)
      makeCheckin('2025-01-08', { readiness: 'yellow' }),  // yellow
    ];
    const sessions = [
      makeSession('2025-01-10', 'A'),
      makeSession('2025-01-09', 'B'),
    ];
    
    const result = getAllStreaks(checkins, sessions, [3, 4, 5], '2025-01-01', TEST_DATE);
    
    expect(result.checkinStreak).toBe(3);
    expect(result.trainingStreak).toBeGreaterThanOrEqual(1);
    // Green streak: 10 and 09 are green, 08 is yellow -> so streak is 2 (10 and 09)
    expect(result.greenStreak).toBe(2);
  });
});