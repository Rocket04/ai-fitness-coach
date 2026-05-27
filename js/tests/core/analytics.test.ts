// js/tests/core/analytics.test.ts
// TDD: Period comparison analytics — getPeriodComparison()

import { describe, it, expect } from 'vitest';

describe('getPeriodComparison (Phase 3)', () => {
  it('returns null when trend data is empty', async () => {
    const { getPeriodComparison } = await import('../../core/analytics.js');
    const result = getPeriodComparison([], []);
    expect(result).toBeNull();
  });

  it('returns null when trend data has fewer than 2 points', async () => {
    const { getPeriodComparison } = await import('../../core/analytics.js');
    const result = getPeriodComparison(
      [{ date: '2026-05-24', recoveryScore: 70, hrv: 55, restHR: 60, sleepHours: 7 }],
      []
    );
    expect(result).toBeNull();
  });

  it('compares current week vs previous week', async () => {
    const { getPeriodComparison } = await import('../../core/analytics.js');
    // 14 days of trend data — 7 current week, 7 previous week
    const trendData = [
      // Previous week (lower scores)
      { date: '2026-05-11', recoveryScore: 50, hrv: 45, restHR: 65, sleepHours: 6 },
      { date: '2026-05-12', recoveryScore: 55, hrv: 48, restHR: 63, sleepHours: 6.5 },
      { date: '2026-05-13', recoveryScore: 52, hrv: 46, restHR: 64, sleepHours: 6 },
      { date: '2026-05-14', recoveryScore: 58, hrv: 50, restHR: 62, sleepHours: 7 },
      { date: '2026-05-15', recoveryScore: 54, hrv: 47, restHR: 63, sleepHours: 6.5 },
      { date: '2026-05-16', recoveryScore: 56, hrv: 49, restHR: 61, sleepHours: 7 },
      { date: '2026-05-17', recoveryScore: 53, hrv: 48, restHR: 62, sleepHours: 6 },
      // Current week (higher scores)
      { date: '2026-05-18', recoveryScore: 70, hrv: 55, restHR: 58, sleepHours: 8 },
      { date: '2026-05-19', recoveryScore: 72, hrv: 57, restHR: 57, sleepHours: 7.5 },
      { date: '2026-05-20', recoveryScore: 68, hrv: 54, restHR: 59, sleepHours: 8 },
      { date: '2026-05-21', recoveryScore: 74, hrv: 58, restHR: 56, sleepHours: 8.5 },
      { date: '2026-05-22', recoveryScore: 71, hrv: 56, restHR: 58, sleepHours: 7 },
      { date: '2026-05-23', recoveryScore: 73, hrv: 57, restHR: 57, sleepHours: 8 },
      { date: '2026-05-24', recoveryScore: 69, hrv: 55, restHR: 58, sleepHours: 7.5 },
    ];
    const result = getPeriodComparison(trendData, []);
    expect(result).toBeDefined();
    expect(result).not.toBeNull();
    expect(result!.recoveryScore.change).toBeGreaterThan(0); // improved
    expect(result!.recoveryScore.direction).toBe('up');
  });

  it('shows down trend when scores decrease', async () => {
    const { getPeriodComparison } = await import('../../core/analytics.js');
    const trendData = [
      // Previous week (higher)
      { date: '2026-05-11', recoveryScore: 80, hrv: 65, restHR: 55, sleepHours: 8 },
      { date: '2026-05-12', recoveryScore: 82, hrv: 67, restHR: 54, sleepHours: 8.5 },
      { date: '2026-05-13', recoveryScore: 78, hrv: 63, restHR: 56, sleepHours: 8 },
      { date: '2026-05-14', recoveryScore: 81, hrv: 66, restHR: 55, sleepHours: 8 },
      { date: '2026-05-15', recoveryScore: 79, hrv: 64, restHR: 56, sleepHours: 7.5 },
      { date: '2026-05-16', recoveryScore: 80, hrv: 65, restHR: 55, sleepHours: 8 },
      { date: '2026-05-17', recoveryScore: 83, hrv: 68, restHR: 54, sleepHours: 9 },
      // Current week (lower)
      { date: '2026-05-18', recoveryScore: 60, hrv: 50, restHR: 62, sleepHours: 6 },
      { date: '2026-05-19', recoveryScore: 58, hrv: 48, restHR: 63, sleepHours: 5.5 },
      { date: '2026-05-20', recoveryScore: 62, hrv: 52, restHR: 61, sleepHours: 6.5 },
      { date: '2026-05-21', recoveryScore: 59, hrv: 49, restHR: 62, sleepHours: 6 },
      { date: '2026-05-22', recoveryScore: 61, hrv: 51, restHR: 61, sleepHours: 6.5 },
      { date: '2026-05-23', recoveryScore: 57, hrv: 47, restHR: 64, sleepHours: 5 },
      { date: '2026-05-24', recoveryScore: 60, hrv: 50, restHR: 62, sleepHours: 6 },
    ];
    const result = getPeriodComparison(trendData, []);
    expect(result).toBeDefined();
    expect(result!.recoveryScore.direction).toBe('down');
    expect(result!.recoveryScore.change).toBeLessThan(0);
  });
});
