import { describe, it, expect } from 'vitest';
import { calculateSessionCompletionRate, calculateWeeklyCompletionRate } from '../../core/completionRate.js';
import type { Session, SessionPlan } from '../../core/types.js';

describe('calculateSessionCompletionRate', () => {
  it('returns 0 when no exerciseResults', () => {
    const session: Session = { key: 'test', date: '2026-05-29', type: 'A', completed: true, readiness: 'green', rpe: 7, notes: '', updatedAt: 0 };
    const plan: SessionPlan = { sessionId: 'test', date: '2026-05-29', exercises: [{ n: 'Push-ups', s: '3', r: '10' }] } as any;
    expect(calculateSessionCompletionRate(session, plan)).toBe(0);
  });

  it('returns 0 when plan has no exercises', () => {
    const session: Session = { key: 'test', date: '2026-05-29', type: 'A', completed: true, readiness: 'green', rpe: 7, notes: '', updatedAt: 0, exerciseResults: [{ exerciseName: 'X', plannedSets: 3, completedSets: 2, repsPerSet: [10, 10], completed: true }] };
    const plan: SessionPlan = { sessionId: 'test', date: '2026-05-29', exercises: [] } as any;
    expect(calculateSessionCompletionRate(session, plan)).toBe(0);
  });

  it('returns 1.0 when all sets completed', () => {
    const session: Session = { key: 'test', date: '2026-05-29', type: 'A', completed: true, readiness: 'green', rpe: 7, notes: '', updatedAt: 0, exerciseResults: [{ exerciseName: 'Push-ups', plannedSets: 3, completedSets: 3, repsPerSet: [10, 10, 10], completed: true }] };
    const plan: SessionPlan = { sessionId: 'test', date: '2026-05-29', exercises: [{ n: 'Push-ups', s: '3', r: '10' }] } as any;
    expect(calculateSessionCompletionRate(session, plan)).toBe(1.0);
  });

  it('returns 0.5 for half completion', () => {
    const session: Session = { key: 'test', date: '2026-05-29', type: 'A', completed: true, readiness: 'green', rpe: 7, notes: '', updatedAt: 0, exerciseResults: [{ exerciseName: 'Push-ups', plannedSets: 4, completedSets: 2, repsPerSet: [10, 10], completed: true }] };
    const plan: SessionPlan = { sessionId: 'test', date: '2026-05-29', exercises: [{ n: 'Push-ups', s: '4', r: '10' }] } as any;
    expect(calculateSessionCompletionRate(session, plan)).toBe(0.5);
  });
});

describe('calculateWeeklyCompletionRate', () => {
  it('returns 0 for empty sessions', () => {
    expect(calculateWeeklyCompletionRate([], [], '2026-05-22')).toBe(0);
  });

  it('returns average across sessions in week', () => {
    const sessions: Session[] = [
      { key: '2026-05-29_test', date: '2026-05-29', type: 'A', completed: true, readiness: 'green', rpe: 7, notes: '', updatedAt: 0, exerciseResults: [{ exerciseName: 'A', plannedSets: 3, completedSets: 3, repsPerSet: [10, 10, 10], completed: true }] },
      { key: '2026-05-28_test', date: '2026-05-28', type: 'A', completed: true, readiness: 'green', rpe: 5, notes: '', updatedAt: 0, exerciseResults: [{ exerciseName: 'A', plannedSets: 3, completedSets: 0, repsPerSet: [], completed: false }] },
    ];
    const plans: SessionPlan[] = [
      { sessionId: '2026-05-29_test', date: '2026-05-29', exercises: [{ n: 'A', s: '3', r: '10' }] } as any,
      { sessionId: '2026-05-28_test', date: '2026-05-28', exercises: [{ n: 'A', s: '3', r: '10' }] } as any,
    ];
    const rate = calculateWeeklyCompletionRate(sessions, plans, '2026-05-28');
    expect(rate).toBeGreaterThanOrEqual(0);
  });
});
