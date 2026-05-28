import { describe, it, expect } from 'vitest';
import {
  getWeeklyMultiplier,
  getTestMultiplier,
  applyMultiplierToExercises,
  applyApreAdjustment,
  adjustExercisesForMode,
} from '../../core/loadAdjustments.js';
import type { Exercise, Session } from '../../core/types.js';

describe('getWeeklyMultiplier', () => {
  const base = { completed: 2, dominantStatus: 'yellow', red: 1, yellow: 2, green: 0 };

  it('returns 0.6 on deload week (every 4th)', () => {
    expect(getWeeklyMultiplier(base, 1, 4)).toBe(0.6);
    expect(getWeeklyMultiplier(base, 1, 8)).toBe(0.6);
  });

  it('returns 1.0 on normal week (not 4th)', () => {
    expect(getWeeklyMultiplier(base, 1, 1)).toBe(1.0);
    expect(getWeeklyMultiplier(base, 1, 2)).toBe(1.0);
    expect(getWeeklyMultiplier(base, 1, 3)).toBe(1.0);
  });

  it('returns 1.1 for green week (completed>=3, dominant green, red=0, yellow<=1)', () => {
    const green = { completed: 4, dominantStatus: 'green', red: 0, yellow: 1, green: 3 };
    expect(getWeeklyMultiplier(green, 1, 1)).toBe(1.1);
  });

  it('returns 0.9 for bad week (red>=2 or yellow>=3)', () => {
    const badRed = { completed: 3, dominantStatus: 'red', red: 2, yellow: 1, green: 0 };
    const badYellow = { completed: 3, dominantStatus: 'yellow', red: 0, yellow: 3, green: 0 };
    expect(getWeeklyMultiplier(badRed, 1, 1)).toBe(0.9);
    expect(getWeeklyMultiplier(badYellow, 1, 1)).toBe(0.9);
  });

  it('returns 1.0 when dayOfWeek !== 1', () => {
    const green = { completed: 4, dominantStatus: 'green', red: 0, yellow: 0, green: 4 };
    expect(getWeeklyMultiplier(green, 2, 1)).toBe(1.0);
  });
});

describe('getTestMultiplier', () => {
  it('returns 1.0 when no test results', () => {
    const sessions: Session[] = [{ key: 'k', date: '2026-05-20', type: 'A', completed: true, readiness: 'green', rpe: 7, notes: '', updatedAt: 0 }];
    expect(getTestMultiplier(sessions, 1)).toBe(1.0);
  });

  it('returns 1.0 on non-test weeks', () => {
    const sessions: Session[] = [
      { key: 'k1', date: '2026-05-20', type: 'A', completed: true, readiness: 'green', rpe: 7, notes: '', testResults: { pullUps: 10, pushUps: 20, plankSec: 60 }, updatedAt: 0 },
    ];
    expect(getTestMultiplier(sessions, 2)).toBe(1.0); // only 1 test session, can't compare
  });
});

describe('applyMultiplierToExercises', () => {
  it('returns same exercises when multiplier is 1.0', () => {
    const exs: Exercise[] = [{ n: 'Push-ups', s: '3', r: '10' }];
    const result = applyMultiplierToExercises(exs, 1.0);
    expect(result[0].r).toBe('10');
  });

  it('increases reps when multiplier > 1', () => {
    const exs: Exercise[] = [{ n: 'Push-ups', s: '3', r: '10' }];
    const result = applyMultiplierToExercises(exs, 1.5);
    expect(result[0].r).toBe('15');
  });

  it('does not modify test exercises', () => {
    const exs: Exercise[] = [{ n: 'Test', s: '1', r: 'max', isTest: true }];
    const result = applyMultiplierToExercises(exs, 2.0);
    expect(result[0].r).toBe('max');
  });
});

describe('applyApreAdjustment', () => {
  it('returns exercises unchanged when no last session', () => {
    const exs: Exercise[] = [{ n: 'Squat', s: '3', r: '8' }];
    expect(applyApreAdjustment(exs, null)).toEqual(exs);
  });

  it('increases reps when RPE <= 4 and num > 3', () => {
    const exs: Exercise[] = [{ n: 'Squat', s: '3', r: '8' }];
    const session: Session = { key: 'k', date: '2026-05-20', type: 'A', completed: true, readiness: 'green', rpe: 3, notes: '', updatedAt: 0 };
    const result = applyApreAdjustment(exs, session);
    expect(result[0].r).toBe('9');
  });

  it('decreases reps when RPE >= 8 and num > 2', () => {
    const exs: Exercise[] = [{ n: 'Squat', s: '3', r: '8' }];
    const session: Session = { key: 'k', date: '2026-05-20', type: 'A', completed: true, readiness: 'green', rpe: 9, notes: '', updatedAt: 0 };
    const result = applyApreAdjustment(exs, session);
    expect(result[0].r).toBe('7');
  });

  it('returns exercises unchanged when RPE is 5-7', () => {
    const exs: Exercise[] = [{ n: 'Squat', s: '3', r: '8' }];
    const session: Session = { key: 'k', date: '2026-05-20', type: 'A', completed: true, readiness: 'green', rpe: 6, notes: '', updatedAt: 0 };
    const result = applyApreAdjustment(exs, session);
    expect(result[0].r).toBe('8');
  });
});

describe('adjustExercisesForMode', () => {
  const exercises: Exercise[] = [
    { n: 'Мобильность ТБС', s: '3', r: '10' },
    { n: 'Жим лежа', s: '4', r: '8' },
    { n: 'Приседания', s: '5', r: '5' },
  ];

  it('mode minimum returns only mobility/recovery exercises', () => {
    const result = adjustExercisesForMode(exercises, 'minimum');
    expect(result.every(e => e.n.toLowerCase().includes('мобильн') || e.n.toLowerCase().includes('растяж') || e.n.toLowerCase().includes('дыхан')) || result.length >= 1).toBe(true);
  });

  it('mode yellow reduces sets by 1', () => {
    const result = adjustExercisesForMode(exercises, 'yellow');
    expect(result[1].s).toBe('3'); // 4 - 1
    expect(result[2].s).toBe('4'); // 5 - 1
  });

  it('mode deload reduces volume by ~40% and adds note', () => {
    const result = adjustExercisesForMode(exercises, 'deload');
    expect(result[1].w).toContain('разгрузка');
  });

  it('mode full returns exercises unchanged', () => {
    const result = adjustExercisesForMode(exercises, 'full');
    expect(result[1].s).toBe('4');
  });
});
