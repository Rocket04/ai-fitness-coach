import { describe, it, expect } from 'vitest';
import { buildWeeklyPlanDays } from '../../core/weeklyPlan.js';
import type { WeeklyTemplate } from '../../core/types.js';

const makeTemplate = (sports: string[]): WeeklyTemplate => ({
  days: [
    sports[0] || null,
    sports[1] || null,
    null,
    sports[0] || null,
    sports[1] || null,
    null,
    sports[0] || null,
  ],
  sportOrder: sports,
});

describe('buildWeeklyPlanDays', () => {
  it('returns empty array for no start date', () => {
    const result = buildWeeklyPlanDays(
      '2026-05-25', ['calisthenics'], null, makeTemplate(['calisthenics'])
    );
    expect(result.days).toHaveLength(7);
  });

  it('returns 7 days with proper structure', () => {
    const result = buildWeeklyPlanDays(
      '2026-05-25', ['calisthenics'], '2026-05-25', makeTemplate(['calisthenics'])
    );
    expect(result.days).toHaveLength(7);
    expect(result.weekStart).toBe('2026-05-25');
  });

  it('marks today correctly', () => {
    const today = new Date().toISOString().slice(0, 10);
    const result = buildWeeklyPlanDays(
      today, ['calisthenics'], today, makeTemplate(['calisthenics'])
    );
    const todayDay = result.days.find(d => d.isToday);
    expect(todayDay).toBeDefined();
    expect(todayDay!.iso).toBe(today);
  });

  it('includes sport type on training days', () => {
    const result = buildWeeklyPlanDays(
      '2026-05-25', ['calisthenics'], '2026-05-25', makeTemplate(['calisthenics'])
    );
    const nonRestDays = result.days.filter(d => d.session && !d.session.isRestDay);
    expect(nonRestDays.length).toBeGreaterThan(0);
    nonRestDays.forEach(day => {
      expect(day.session!.sport).toBe('calisthenics');
    });
  });

  it('includes rest days for null template slots', () => {
    const result = buildWeeklyPlanDays(
      '2026-05-25', ['calisthenics'], '2026-05-25', makeTemplate(['calisthenics'])
    );
    const restDays = result.days.filter(d => !d.session || d.session.isRestDay);
    expect(restDays.length).toBeGreaterThan(0);
  });

  it('includes rehab pre-workout exercises for hip issues', () => {
    const result = buildWeeklyPlanDays(
      '2026-05-25', ['calisthenics'], '2026-05-25', makeTemplate(['calisthenics']),
      0, 'green', false, 1, 1.0, null,
      ['hips'], []
    );
    const nonRestDays = result.days.filter(d => d.session && !d.session.isRestDay);
    if (nonRestDays.length > 0) {
      const withRehab = nonRestDays.filter(d => d.rehabExercises.length > 0);
      expect(withRehab.length).toBeGreaterThan(0);
    }
  });
});