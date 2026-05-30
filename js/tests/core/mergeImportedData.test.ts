import { describe, it, expect } from 'vitest';
import { mergeImportedBiometrics } from '../../core/import/mergeImportedData.js';
import type { Checkin } from '../../core/types.js';

function makeCheckin(overrides: Partial<Checkin> & { date: string }): Checkin {
  return {
    sleepHours: 0,
    restHR: 0,
    hrv: 0,
    hipPain: 0,
    shoulderPain: 0,
    breathing: 'good',
    weight: 0,
    muscleSoreness: 3,
    energy: 3,
    mood: 3,
    sleepQuality: 3,
    stress: 3,
    ...overrides,
  };
}

describe('mergeImportedBiometrics', () => {
  it('no existing checkins → all records are new', () => {
    const records = [
      { date: '2026-05-20', sleepHours: 7.5, restHR: 55, hrv: 45 },
    ];
    const result = mergeImportedBiometrics(records, []);
    expect(result.updated).toBe(1);
    expect(result.skipped).toBe(0);
    expect(result.errors).toEqual([]);
    expect(result.checkins).toHaveLength(1);
    expect(result.checkins[0].sleepHours).toBe(7.5);
    expect(result.checkins[0].restHR).toBe(55);
    expect(result.checkins[0].hrv).toBe(45);
  });

  it('existing checkin missing sleep → sleep is filled in', () => {
    const records = [
      { date: '2026-05-20', sleepHours: 7.5 },
    ];
    const checkins = [makeCheckin({ date: '2026-05-20', restHR: 60, hrv: 40 })];
    const result = mergeImportedBiometrics(records, checkins);
    expect(result.updated).toBe(1);
    expect(result.skipped).toBe(0);
    expect(result.checkins[0].sleepHours).toBe(7.5);
    expect(result.checkins[0].restHR).toBe(60);
    expect(result.checkins[0].hrv).toBe(40);
  });

  it('existing checkin has all data → skipped', () => {
    const records = [
      { date: '2026-05-20', sleepHours: 7.5, restHR: 55, hrv: 45 },
    ];
    const checkins = [makeCheckin({ date: '2026-05-20', sleepHours: 8, restHR: 55, hrv: 45 })];
    const result = mergeImportedBiometrics(records, checkins);
    expect(result.updated).toBe(0);
    expect(result.skipped).toBe(3);
    expect(result.checkins[0].sleepHours).toBe(8);
  });

  it('existing checkin has partial data → fill missing, skip existing', () => {
    const records = [
      { date: '2026-05-20', sleepHours: 7.5, restHR: 55 },
    ];
    const checkins = [makeCheckin({ date: '2026-05-20', sleepHours: 8, hrv: 40 })];
    const result = mergeImportedBiometrics(records, checkins);
    expect(result.updated).toBe(1);
    expect(result.skipped).toBe(1);
    expect(result.checkins[0].sleepHours).toBe(8);
    expect(result.checkins[0].restHR).toBe(55);
    expect(result.checkins[0].hrv).toBe(40);
  });

  it('aggregates duplicate records by date (sleep segments)', () => {
    const records = [
      { date: '2026-05-29', sleepHours: 0.467 },
      { date: '2026-05-29', sleepHours: 0.267 },
    ];
    const result = mergeImportedBiometrics(records, []);
    expect(result.updated).toBe(1);
    expect(result.checkins).toHaveLength(1);
    expect(result.checkins[0].sleepHours).toBeCloseTo(0.73, 1);
  });

  it('mixed scenario with updates and skips', () => {
    const records = [
      { date: '2026-05-20', sleepHours: 7.5, restHR: 55 },
      { date: '2026-05-21', sleepHours: 8.0, restHR: 52, hrv: 48 },
    ];
    const checkins = [
      makeCheckin({ date: '2026-05-20', sleepHours: 7.0, restHR: 55 }),
      makeCheckin({ date: '2026-05-22', sleepHours: 6.5 }),
    ];
    const result = mergeImportedBiometrics(records, checkins);
    expect(result.updated).toBe(1);
    expect(result.skipped).toBe(2);
    expect(result.checkins).toHaveLength(3);
  });

  it('returns empty result for empty records', () => {
    const result = mergeImportedBiometrics([], []);
    expect(result.updated).toBe(0);
    expect(result.skipped).toBe(0);
    expect(result.checkins).toEqual([]);
  });

  it('preserves existing checkin fields not in imported data', () => {
    const records = [
      { date: '2026-05-20', sleepHours: 7.5 },
    ];
    const checkins = [makeCheckin({ date: '2026-05-20', muscleSoreness: 5, energy: 4, mood: 3, sleepQuality: 4, stress: 2 })];
    const result = mergeImportedBiometrics(records, checkins);
    expect(result.checkins[0].muscleSoreness).toBe(5);
    expect(result.checkins[0].energy).toBe(4);
    expect(result.checkins[0].mood).toBe(3);
  });
});
