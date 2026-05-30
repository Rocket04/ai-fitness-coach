import { describe, it, expect } from 'vitest';
import { getBestLiftDelta, getPreviousWeekAvgScore } from '../weekReview.js';
import type { Session, TrendPoint } from '../../../shared/types.js';

describe('getBestLiftDelta', () => {
  it('returns null when no sessions provided', () => {
    const result = getBestLiftDelta([]);
    expect(result).toBeNull();
  });

  it('returns null when sessions have no apreResults', () => {
    const sessions: Session[] = [
      {
        key: 's1', date: '2026-05-28', type: 'A', completed: true, readiness: 'green',
        rpe: 7, notes: '', updatedAt: Date.now(),
      },
    ];
    const result = getBestLiftDelta(sessions);
    expect(result).toBeNull();
  });

  it('returns best lift delta from apreResults in current week', () => {
    const sessions: Session[] = [
      {
        key: 's1', date: '2026-05-28', type: 'A', completed: true, readiness: 'green',
        rpe: 7, notes: '', updatedAt: Date.now(),
        apreResults: [
          { exerciseName: 'Жим лёжа', protocol: 'APRE_6', nextRM: 85, unit: 'kg', isCalisthenics: false, lastSet3Reps: 6, lastSet4Reps: 8 },
        ],
      },
      {
        key: 's2', date: '2026-05-21', type: 'A', completed: true, readiness: 'green',
        rpe: 7, notes: '', updatedAt: Date.now(),
        apreResults: [
          { exerciseName: 'Жим лёжа', protocol: 'APRE_6', nextRM: 80, unit: 'kg', isCalisthenics: false, lastSet3Reps: 6, lastSet4Reps: 6 },
        ],
      },
    ];
    const result = getBestLiftDelta(sessions);
    expect(result).not.toBeNull();
    expect(result!.exerciseName).toBe('Жим лёжа');
    expect(result!.currentWeight).toBe(85);
    expect(result!.previousWeight).toBe(80);
    expect(result!.unit).toBe('kg');
  });

  it('picks the exercise with highest delta when multiple exercises exist', () => {
    const sessions: Session[] = [
      {
        key: 's1', date: '2026-05-28', type: 'A', completed: true, readiness: 'green',
        rpe: 7, notes: '', updatedAt: Date.now(),
        apreResults: [
          { exerciseName: 'Жим лёжа', protocol: 'APRE_6', nextRM: 85, unit: 'kg', isCalisthenics: false, lastSet3Reps: 6, lastSet4Reps: 8 },
          { exerciseName: 'Присед', protocol: 'APRE_6', nextRM: 120, unit: 'kg', isCalisthenics: false, lastSet3Reps: 5, lastSet4Reps: 6 },
        ],
      },
      {
        key: 's2', date: '2026-05-21', type: 'A', completed: true, readiness: 'green',
        rpe: 7, notes: '', updatedAt: Date.now(),
        apreResults: [
          { exerciseName: 'Жим лёжа', protocol: 'APRE_6', nextRM: 80, unit: 'kg', isCalisthenics: false, lastSet3Reps: 6, lastSet4Reps: 6 },
          { exerciseName: 'Присед', protocol: 'APRE_6', nextRM: 100, unit: 'kg', isCalisthenics: false, lastSet3Reps: 5, lastSet4Reps: 5 },
        ],
      },
    ];
    const result = getBestLiftDelta(sessions);
    expect(result).not.toBeNull();
    expect(result!.exerciseName).toBe('Присед');
    expect(result!.currentWeight).toBe(120);
    expect(result!.previousWeight).toBe(100);
  });

  it('returns delta even when zero (maintained weight)', () => {
    const sessions: Session[] = [
      {
        key: 's1', date: '2026-05-28', type: 'A', completed: true, readiness: 'green',
        rpe: 7, notes: '', updatedAt: Date.now(),
        apreResults: [
          { exerciseName: 'Жим лёжа', protocol: 'APRE_6', nextRM: 80, unit: 'kg', isCalisthenics: false, lastSet3Reps: 6, lastSet4Reps: 6 },
        ],
      },
      {
        key: 's2', date: '2026-05-21', type: 'A', completed: true, readiness: 'green',
        rpe: 7, notes: '', updatedAt: Date.now(),
        apreResults: [
          { exerciseName: 'Жим лёжа', protocol: 'APRE_6', nextRM: 80, unit: 'kg', isCalisthenics: false, lastSet3Reps: 6, lastSet4Reps: 6 },
        ],
      },
    ];
    const result = getBestLiftDelta(sessions);
    expect(result).not.toBeNull();
    expect(result!.exerciseName).toBe('Жим лёжа');
    expect(result!.currentWeight).toBe(80);
    expect(result!.previousWeight).toBe(80);
  });

  it('returns null when all sessions are within the same week', () => {
    const sessions: Session[] = [
      {
        key: 's1', date: '2026-05-28', type: 'A', completed: true, readiness: 'green',
        rpe: 7, notes: '', updatedAt: Date.now(),
        apreResults: [
          { exerciseName: 'Жим лёжа', protocol: 'APRE_6', nextRM: 85, unit: 'kg', isCalisthenics: false, lastSet3Reps: 6, lastSet4Reps: 8 },
        ],
      },
      {
        key: 's2', date: '2026-05-27', type: 'A', completed: true, readiness: 'green',
        rpe: 7, notes: '', updatedAt: Date.now(),
        apreResults: [
          { exerciseName: 'Жим лёжа', protocol: 'APRE_6', nextRM: 80, unit: 'kg', isCalisthenics: false, lastSet3Reps: 6, lastSet4Reps: 6 },
        ],
      },
    ];
    const result = getBestLiftDelta(sessions);
    expect(result).toBeNull();
  });
});

describe('getPreviousWeekAvgScore', () => {
  it('returns null when trendData30 is empty', () => {
    expect(getPreviousWeekAvgScore([])).toBeNull();
  });

  it('returns null when trendData30 has fewer than 14 days', () => {
    const data: TrendPoint[] = [
      { date: '2026-05-28', recoveryScore: 80, hrv: 55, restHR: 62, sleepHours: 7 },
    ];
    expect(getPreviousWeekAvgScore(data)).toBeNull();
  });

  it('computes current and previous week averages from 14 days of data', () => {
    const data: TrendPoint[] = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date('2026-05-30');
      d.setDate(d.getDate() - i);
      data.push({
        date: d.toISOString().slice(0, 10),
        recoveryScore: i < 7 ? 80 : 70,
        hrv: 55, restHR: 62, sleepHours: 7,
      });
    }
    const result = getPreviousWeekAvgScore(data);
    expect(result).not.toBeNull();
    expect(result!.currentAvg).toBe(80);
    expect(result!.previousAvg).toBe(70);
  });
});
