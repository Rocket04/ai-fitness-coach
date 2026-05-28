import { describe, it, expect } from 'vitest';
import { filterStretchingForRehab } from '../../core/exerciseDatabase.js';
import type { Exercise } from '../../core/types.js';

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
      makeEx('Stanovaya tyaga', 'deadlift'),
      makeEx('Mobilnost sheynogo otdela'),
    ];
    const result = filterStretchingForRehab(exs, ['back']);
    expect(result).toHaveLength(1);
    expect(result[0].n).toBe('Mobilnost sheynogo otdela');
  });

  it('returns safe fallback when all exercises filtered out', () => {
    const exs = [makeEx('Stanovaya tyaga', 'deadlift')];
    const result = filterStretchingForRehab(exs, ['back']);
    expect(result.length).toBeGreaterThan(0);
    expect(result[0].n).toBe('Mobilnost (bezopasnaya)');
  });
});
