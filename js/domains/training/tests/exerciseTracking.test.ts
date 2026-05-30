// js/tests/core/exerciseTracking.test.ts
// TDD: Exercise result structure and set tracking validation

import { describe, it, expect } from 'vitest';
import type { SetResult, ExerciseResult, Session } from '../../../core/types.js';

describe('SetResult structure', () => {
  it('stores completed set with reps', () => {
    const set: SetResult = { setNumber: 1, completed: true, repsDone: 10 };
    expect(set.setNumber).toBe(1);
    expect(set.completed).toBe(true);
    expect(set.repsDone).toBe(10);
  });

  it('stores incomplete set without reps', () => {
    const set: SetResult = { setNumber: 2, completed: false };
    expect(set.setNumber).toBe(2);
    expect(set.completed).toBe(false);
    expect(set.repsDone).toBeUndefined();
  });

  it('stores set with optional weight and RPE', () => {
    const set: SetResult = { setNumber: 3, completed: true, repsDone: 8, weight: 60, rpe: 7 };
    expect(set.weight).toBe(60);
    expect(set.rpe).toBe(7);
  });

  it('stores set with exerciseName', () => {
    const set: SetResult = { setNumber: 1, completed: true, exerciseName: 'Жим лёжа' };
    expect(set.exerciseName).toBe('Жим лёжа');
  });
});

describe('ExerciseResult structure', () => {
  it('stores exercise with sets and completion status', () => {
    const sets: SetResult[] = [
      { setNumber: 1, completed: true, repsDone: 10 },
      { setNumber: 2, completed: true, repsDone: 8 },
      { setNumber: 3, completed: false },
    ];
    const result: ExerciseResult = {
      exerciseName: 'Подтягивания',
      plannedSets: 3,
      completedSets: 2,
      sets,
      completed: true,
    };
    expect(result.exerciseName).toBe('Подтягивания');
    expect(result.plannedSets).toBe(3);
    expect(result.completedSets).toBe(2);
    expect(result.sets).toHaveLength(3);
    expect(result.completed).toBe(true);
  });

  it('marks exercise as not completed when no sets done', () => {
    const sets: SetResult[] = [
      { setNumber: 1, completed: false },
      { setNumber: 2, completed: false },
    ];
    const result: ExerciseResult = {
      exerciseName: 'Приседания',
      plannedSets: 2,
      completedSets: 0,
      sets,
      completed: false,
    };
    expect(result.completed).toBe(false);
  });

  it('all sets have correct exerciseName reference', () => {
    const name = 'Отжимания';
    const sets: SetResult[] = [
      { setNumber: 1, completed: true, exerciseName: name, repsDone: 15 },
      { setNumber: 2, completed: true, exerciseName: name, repsDone: 12 },
    ];
    for (const s of sets) {
      expect(s.exerciseName).toBe(name);
    }
  });
});

describe('Session exerciseResults field', () => {
  it('stores exerciseResults in a Session object', () => {
    const sets: SetResult[] = [
      { setNumber: 1, completed: true, repsDone: 10, exerciseName: 'Подтягивания' },
      { setNumber: 2, completed: true, repsDone: 8, exerciseName: 'Подтягивания' },
    ];
    const session: Session = {
      key: '2026-05-30_A',
      date: '2026-05-30',
      type: 'A',
      completed: true,
      readiness: 'green',
      rpe: 7,
      notes: '',
      updatedAt: Date.now(),
      exerciseResults: [{
        exerciseName: 'Подтягивания',
        plannedSets: 3,
        completedSets: 2,
        sets,
        completed: true,
      }],
    };
    expect(session.exerciseResults).toHaveLength(1);
    expect(session.exerciseResults![0].completedSets).toBe(2);
    expect(session.exerciseResults![0].plannedSets).toBe(3);
  });

  it('handles session without exerciseResults', () => {
    const session: Session = {
      key: '2026-05-30_B',
      date: '2026-05-30',
      type: 'B',
      completed: false,
      readiness: 'red',
      rpe: 0,
      notes: '',
      updatedAt: Date.now(),
    };
    expect(session.exerciseResults).toBeUndefined();
  });
});
