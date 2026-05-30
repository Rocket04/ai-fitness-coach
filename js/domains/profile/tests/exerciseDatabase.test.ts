import { describe, it, expect } from 'vitest';
import { filterStretchingForRehab, filterExercisesForRehab } from '../exerciseDatabase.js';
import type { Exercise } from '../../../core/types.js';

const makeEx = (n: string, id?: string): Exercise => {
  const ex: Exercise = { n, s: '2', r: '10 min' };
  if (id) (ex as any).id = id;
  return ex;
};

describe('filterStretchingForRehab', () => {
  it('returns all exercises when no rehab issues', () => {
    const exs = [makeEx('Neck stretch'), makeEx('Shoulder stretch')];
    const result = filterStretchingForRehab(exs, []);
    expect(result).toHaveLength(2);
  });

  it('filters out exercises contraindicated for user issues', () => {
    const exs = [
      makeEx('Становая тяга', 'deadlift'),
      makeEx('Mobilnost sheynogo otdela'),
    ];
    const result = filterStretchingForRehab(exs, ['back']);
    expect(result).toHaveLength(1);
    expect(result[0].n).toBe('Mobilnost sheynogo otdela');
  });

  it('returns safe fallback when all exercises filtered out', () => {
    const exs = [makeEx('Становая тяга', 'deadlift')];
    const result = filterStretchingForRehab(exs, ['back']);
    expect(result.length).toBeGreaterThan(0);
    expect(result[0].n).toBe('Mobilnost (bezopasnaya)');
  });
});

describe('filterExercisesForRehab', () => {
  it('returns original exercises when no rehab issues', () => {
    const exs = [makeEx('Bench press'), makeEx('Squat')];
    const result = filterExercisesForRehab(exs, [], []);
    expect(result.exercises).toHaveLength(2);
    expect(result.wasAdapted).toBe(false);
  });

  it('replaces pull-up with modified variants for shoulder issues', () => {
    const exs = [{ n: 'Подтягивания', s: '3', r: '8' }];
    const result = filterExercisesForRehab(exs, ['shoulder'], []);
    expect(result.wasAdapted).toBe(true);
    const names = result.exercises.map(e => e.n);
    expect(names.some(n => n.includes('Подтягивания модифицированные'))).toBe(true);
  });

  it('replaces conventional exercises with generic rehab alternatives', () => {
    const exs = [{ n: 'Жим лежа', s: '3', r: '10' }];
    const result = filterExercisesForRehab(exs, ['shoulder'], []);
    expect(result.wasAdapted).toBe(true);
    expect(result.exercises.length).toBeGreaterThan(0);
  });

  it('returns exercise unchanged if not in library', () => {
    const exs = [{ n: 'Nekotoe unikalnoe uprazhnenie', s: '3', r: '10' }];
    const result = filterExercisesForRehab(exs, ['shoulder'], []);
    expect(result.wasAdapted).toBe(false);
    expect(result.exercises).toHaveLength(1);
    expect(result.exercises[0].n).toBe('Nekotoe unikalnoe uprazhnenie');
  });
});
