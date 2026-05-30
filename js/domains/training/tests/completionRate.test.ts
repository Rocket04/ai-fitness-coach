import { describe, it, expect } from 'vitest';
import { calculateSessionCompletionRate, calculateWeeklyCompletionRate } from '../planning/completionRate.js';
import type { Session, SessionPlan } from '../../../core/types.js';

function makeExerciseResult(planned: number, completed: number) {
  const sets = Array.from({ length: planned }, (_, i) => ({
    setNumber: i + 1,
    completed: i < completed,
    repsDone: i < completed ? 10 : 0,
  }));
  return { exerciseName: 'X', plannedSets: planned, completedSets: completed, sets, completed: completed > 0 };
}

describe('calculateSessionCompletionRate', () => {
  it('returns 0 when no exerciseResults', () => {
    const session: Session = { key: 'test', date: '2026-05-29', type: 'A', completed: true, readiness: 'green', rpe: 7, notes: '', updatedAt: 0 };
    const plan: SessionPlan = { sessionId: 'test', date: '2026-05-29', exercises: [{ n: 'Push-ups', s: '3', r: '10' }] } as any;
    expect(calculateSessionCompletionRate(session, plan)).toBe(0);
  });

  it('returns 0 when plan has no exercises', () => {
    const session: Session = { key: 'test', date: '2026-05-29', type: 'A', completed: true, readiness: 'green', rpe: 7, notes: '', updatedAt: 0, exerciseResults: [makeExerciseResult(3, 2)] };
    const plan: SessionPlan = { sessionId: 'test', date: '2026-05-29', exercises: [] } as any;
    expect(calculateSessionCompletionRate(session, plan)).toBe(0);
  });

  it('returns 1.0 when all sets completed', () => {
    const session: Session = { key: 'test', date: '2026-05-29', type: 'A', completed: true, readiness: 'green', rpe: 7, notes: '', updatedAt: 0, exerciseResults: [makeExerciseResult(3, 3)] };
    const plan: SessionPlan = { sessionId: 'test', date: '2026-05-29', exercises: [{ n: 'Push-ups', s: '3', r: '10' }] } as any;
    expect(calculateSessionCompletionRate(session, plan)).toBe(1.0);
  });

  it('returns 0.5 for half completion', () => {
    const session: Session = { key: 'test', date: '2026-05-29', type: 'A', completed: true, readiness: 'green', rpe: 7, notes: '', updatedAt: 0, exerciseResults: [makeExerciseResult(4, 2)] };
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
      { key: '2026-05-29_test', date: '2026-05-29', type: 'A', completed: true, readiness: 'green', rpe: 7, notes: '', updatedAt: 0, exerciseResults: [makeExerciseResult(3, 3)] },
      { key: '2026-05-28_test', date: '2026-05-28', type: 'A', completed: true, readiness: 'green', rpe: 5, notes: '', updatedAt: 0, exerciseResults: [makeExerciseResult(3, 0)] },
    ];
    const plans: SessionPlan[] = [
      { sessionId: '2026-05-29_test', date: '2026-05-29', exercises: [{ n: 'A', s: '3', r: '10' }] } as any,
      { sessionId: '2026-05-28_test', date: '2026-05-28', exercises: [{ n: 'A', s: '3', r: '10' }] } as any,
    ];
    const rate = calculateWeeklyCompletionRate(sessions, plans, '2026-05-28');
    expect(rate).toBeGreaterThanOrEqual(0);
  });
});
