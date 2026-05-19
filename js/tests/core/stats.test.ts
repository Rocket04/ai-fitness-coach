import { describe, it, expect } from 'vitest';
import { getWeeklySummary, getMonthStats } from '../../core/stats.js';
import type { Session } from '../../core/types.js';

function makeSession(overrides: Partial<Session> = {}): Session {
  return {
    key: '2025-01-06_A',
    date: '2025-01-06',
    type: 'A',
    completed: true,
    readiness: 'green',
    rpe: 7,
    notes: '',
    updatedAt: Date.now(),
    ...overrides,
  };
}

describe('getWeeklySummary', () => {
  const today = '2025-01-10';

  it('returns zeros for empty sessions', () => {
    const r = getWeeklySummary([], [], today);
    expect(r.completed).toBe(0);
    expect(r.avgRPE).toBeNull();
  });

  it('counts completed sessions in the last 7 days', () => {
    const s1 = makeSession({ date: '2025-01-06', key: '2025-01-06_A' });
    const s2 = makeSession({ date: '2025-01-08', key: '2025-01-08_B', type: 'B' });
    const r = getWeeklySummary([s1, s2], [], today);
    expect(r.completed).toBe(2);
  });

  it('excludes sessions outside the 7-day window', () => {
    const old = makeSession({ date: '2025-01-01', key: '2025-01-01_A' });
    const r = getWeeklySummary([old], [], today);
    expect(r.completed).toBe(0);
  });

  it('excludes uncompleted sessions', () => {
    const s = makeSession({ completed: false });
    const r = getWeeklySummary([s], [], today);
    expect(r.completed).toBe(0);
  });

  it('excludes morning/evening type sessions', () => {
    const morning = makeSession({ type: 'morning', key: '2025-01-06_morning' });
    const evening = makeSession({ type: 'evening', key: '2025-01-06_evening' });
    const r = getWeeklySummary([morning, evening], [], today);
    expect(r.completed).toBe(0);
  });

  it('calculates avgRPE correctly', () => {
    const s1 = makeSession({ rpe: 6, date: '2025-01-06', key: '2025-01-06_A' });
    const s2 = makeSession({ rpe: 8, date: '2025-01-07', key: '2025-01-07_B', type: 'B' });
    const r = getWeeklySummary([s1, s2], [], today);
    expect(r.avgRPE).toBe(7);
  });

  it('counts readiness status correctly', () => {
    const g = makeSession({ readiness: 'green', date: '2025-01-06', key: '2025-01-06_A' });
    const y = makeSession({ readiness: 'yellow', date: '2025-01-07', key: '2025-01-07_B', type: 'B' });
    const r2 = makeSession({ readiness: 'red', date: '2025-01-08', key: '2025-01-08_C', type: 'C' });
    const r = getWeeklySummary([g, y, r2], [], today);
    expect(r.green).toBe(1);
    expect(r.yellow).toBe(1);
    expect(r.red).toBe(1);
  });

  it('returns correct dominantStatus', () => {
    const r1 = makeSession({ readiness: 'red', date: '2025-01-06', key: '1' });
    const r2 = makeSession({ readiness: 'red', date: '2025-01-07', key: '2', type: 'B' });
    const g = makeSession({ readiness: 'green', date: '2025-01-08', key: '3', type: 'C' });
    const r = getWeeklySummary([r1, r2, g], [], today);
    expect(r.dominantStatus).toBe('red');
  });
});

describe('getMonthStats', () => {
  it('returns zeros for empty sessions', () => {
    const r = getMonthStats([], '2025-01');
    expect(r.completed).toBe(0);
  });

  it('counts only sessions matching yearMonth', () => {
    const jan = makeSession({ date: '2025-01-06' });
    const feb = makeSession({ date: '2025-02-06', key: '2025-02-06_A' });
    const r = getMonthStats([jan, feb], '2025-01');
    expect(r.completed).toBe(1);
  });

  it('excludes uncompleted sessions', () => {
    const s = makeSession({ completed: false });
    expect(getMonthStats([s], '2025-01').completed).toBe(0);
  });

  it('excludes morning/evening sessions', () => {
    const m = makeSession({ type: 'morning', key: '2025-01-06_morning' });
    expect(getMonthStats([m], '2025-01').completed).toBe(0);
  });
});
