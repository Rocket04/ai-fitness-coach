import { describe, it, expect } from 'vitest';
import {
  sleepToRecovery,
  sleepQualityToHrv,
  stressToRecovery,
  energyToRecovery,
  hrvToReadiness,
  weightTrend,
  getAllCorrelations,
} from '../../core/correlations.js';
import type { Checkin } from '../../core/types.js';

function makeCheckin(overrides: Partial<Checkin> = {}): Checkin {
  return {
    date: '2025-01-06',
    sleepHours: 7,
    restHR: 60,
    hrv: 70,
    hipPain: 1,
    shoulderPain: 1,
    breathing: 'good',
    weight: 75,
    notes: '',
    muscleSoreness: 1,
    energy: 4,
    mood: 4,
    sleepQuality: 4,
    stress: 2,
    readiness: 'green',
    ...overrides,
  };
}

describe('correlations', () => {
  it('sleepToRecovery: higher sleep yields higher recovery', () => {
    const checkins: Checkin[] = [
      makeCheckin({ date: '2025-01-01', sleepHours: 5, hrv: 50, restHR: 70, energy: 2, mood: 2, muscleSoreness: 4 }),
      makeCheckin({ date: '2025-01-02', sleepHours: 5, hrv: 55, restHR: 68, energy: 2, mood: 2, muscleSoreness: 4 }),
      makeCheckin({ date: '2025-01-03', sleepHours: 8, hrv: 80, restHR: 55, energy: 4, mood: 4, muscleSoreness: 1 }),
      makeCheckin({ date: '2025-01-04', sleepHours: 8, hrv: 85, restHR: 54, energy: 4, mood: 4, muscleSoreness: 1 }),
    ];
    const r = sleepToRecovery(checkins);
    expect(r.sampleSize).toBe(4);
    expect(r.deltaPercent).toBeGreaterThan(0);
    expect(r.insight).toContain('выше');
  });

  it('sleepQualityToHrv: higher quality yields higher hrv', () => {
    const checkins: Checkin[] = [
      makeCheckin({ date: '2025-01-01', sleepQuality: 2, hrv: 50 }),
      makeCheckin({ date: '2025-01-02', sleepQuality: 3, hrv: 55 }),
      makeCheckin({ date: '2025-01-03', sleepQuality: 5, hrv: 80 }),
      makeCheckin({ date: '2025-01-04', sleepQuality: 5, hrv: 85 }),
    ];
    const r = sleepQualityToHrv(checkins);
    expect(r.sampleSize).toBe(4);
    expect(r.deltaPercent).toBeGreaterThan(0);
    expect(r.insight).toContain('выше');
  });

  it('stressToRecovery: low stress yields higher recovery', () => {
    const checkins: Checkin[] = [
      makeCheckin({ date: '2025-01-01', stress: 1, energy: 4, mood: 4, muscleSoreness: 1 }),
      makeCheckin({ date: '2025-01-02', stress: 2, energy: 4, mood: 4, muscleSoreness: 1 }),
      makeCheckin({ date: '2025-01-03', stress: 5, energy: 1, mood: 1, muscleSoreness: 5 }),
      makeCheckin({ date: '2025-01-04', stress: 5, energy: 1, mood: 1, muscleSoreness: 5 }),
    ];
    const r = stressToRecovery(checkins);
    expect(r.sampleSize).toBe(4);
    expect(r.deltaPercent).toBeGreaterThan(0);
    expect(r.insight).toContain('выше');
  });

  it('energyToRecovery: high energy yields higher recovery', () => {
    const checkins: Checkin[] = [
      makeCheckin({ date: '2025-01-01', energy: 2, mood: 2, muscleSoreness: 4, hrv: 50, restHR: 70 }),
      makeCheckin({ date: '2025-01-02', energy: 2, mood: 2, muscleSoreness: 4, hrv: 55, restHR: 68 }),
      makeCheckin({ date: '2025-01-03', energy: 5, mood: 5, muscleSoreness: 1, hrv: 80, restHR: 55 }),
      makeCheckin({ date: '2025-01-04', energy: 5, mood: 5, muscleSoreness: 1, hrv: 85, restHR: 54 }),
    ];
    const r = energyToRecovery(checkins);
    expect(r.sampleSize).toBe(4);
    expect(r.deltaPercent).toBeGreaterThan(0);
    expect(r.insight).toContain('выше');
  });

  it('hrvToReadiness: higher hrv correlates with more green readiness', () => {
    const checkins: Checkin[] = [
      makeCheckin({ date: '2025-01-01', hrv: 50, readiness: 'yellow' }),
      makeCheckin({ date: '2025-01-02', hrv: 55, readiness: 'yellow' }),
      makeCheckin({ date: '2025-01-03', hrv: 80, readiness: 'green' }),
      makeCheckin({ date: '2025-01-04', hrv: 85, readiness: 'green' }),
    ];
    const r = hrvToReadiness(checkins);
    expect(r.sampleSize).toBe(4);
    expect(r.deltaPercent).toBeGreaterThan(0);
    expect(r.insight).toContain('больше');
  });

  it('weightTrend: detects weight trend', () => {
    const checkins: Checkin[] = [
      makeCheckin({ date: '2025-01-01', weight: 75 }),
      makeCheckin({ date: '2025-01-02', weight: 75.2 }),
      makeCheckin({ date: '2025-01-03', weight: 75.5 }),
      makeCheckin({ date: '2025-01-04', weight: 75.8 }),
    ];
    const r = weightTrend(checkins);
    expect(r.sampleSize).toBe(4);
    expect(r.insight).toContain('рост');
  });

  it('getAllCorrelations returns 6 results', () => {
    const checkins: Checkin[] = [
      makeCheckin({ date: '2025-01-01' }),
      makeCheckin({ date: '2025-01-02' }),
      makeCheckin({ date: '2025-01-03' }),
      makeCheckin({ date: '2025-01-04' }),
    ];
    const all = getAllCorrelations(checkins);
    expect(all).toHaveLength(6);
    all.forEach(r => {
      expect(r.title).toBeTruthy();
      expect(r.icon).toBeTruthy();
      expect(r.insight).toBeTruthy();
    });
  });
});
