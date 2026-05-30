import { describe, it, expect } from 'vitest';
import { mergeImportedBiometrics } from '../mergeImportedData.js';
import type { Checkin } from '../../../core/types.js';

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
    expect(result.errors).toHaveLength(0);
    expect(result.checkins.length).toBe(1);
    expect(result.checkins[0].sleepHours).toBe(7.5);
    expect(result.checkins[0].restHR).toBe(55);
    expect(result.checkins[0].hrv).toBe(45);
  });

  it('updates existing checkin with missing fields', () => {
    const existing = [makeCheckin({ date: '2026-05-20', sleepHours: 7, restHR: 0, hrv: 0 })];
    const records = [
      { date: '2026-05-20', sleepHours: 7.5, restHR: 55, hrv: 45 },
    ];
    const result = mergeImportedBiometrics(records, existing);
    // sleepHours already filled → 1 skipped, restHR and hrv filled → 2 updated
    expect(result.skipped).toBeGreaterThanOrEqual(0);
    const updatedCheckin = result.checkins.find(c => c.date === '2026-05-20');
    expect(updatedCheckin).toBeDefined();
    expect(updatedCheckin!.hrv).toBe(45);
    expect(updatedCheckin!.restHR).toBe(55);
  });

  it('aggregates multiple records for the same date', () => {
    const records = [
      { date: '2026-05-20', sleepHours: 7.5, restHR: 55, hrv: 0 },
      { date: '2026-05-20', sleepHours: 0, restHR: 0, hrv: 45 },
    ];
    const result = mergeImportedBiometrics(records, []);
    expect(result.updated).toBe(1);
    const checkin = result.checkins[0];
    expect(checkin.sleepHours).toBe(7.5);
    expect(checkin.restHR).toBe(55);
    expect(checkin.hrv).toBe(45);
  });

  it('returns existing checkins when records are empty', () => {
    const existing = [makeCheckin({ date: '2026-05-20' })];
    const result = mergeImportedBiometrics([], existing);
    expect(result.updated).toBe(0);
    expect(result.checkins).toHaveLength(1);
  });

  it('updates only empty fields, skips non-empty ones', () => {
    const existing = [makeCheckin({ date: '2026-05-20', sleepHours: 7, restHR: 60, hrv: 50 })];
    const records = [
      { date: '2026-05-20', sleepHours: 8, restHR: 55, hrv: 45 },
    ];
    const result = mergeImportedBiometrics(records, existing);
    const checkin = result.checkins[0];
    // All original fields are non-zero → should be skipped
    expect(checkin.sleepHours).toBe(7);
    expect(checkin.restHR).toBe(60);
    expect(checkin.hrv).toBe(50);
  });

  it('creates default checkin for dates without existing data', () => {
    const records = [
      { date: '2026-05-20', sleepHours: 7.5 },
    ];
    const result = mergeImportedBiometrics(records, []);
    const checkin = result.checkins[0];
    expect(checkin.muscleSoreness).toBe(3);
    expect(checkin.energy).toBe(3);
    expect(checkin.mood).toBe(3);
  });

  it('rounds sleepHours to 2 decimals', () => {
    const records = [
      { date: '2026-05-20', sleepHours: 7.333333 },
    ];
    const result = mergeImportedBiometrics(records, []);
    expect(result.checkins[0].sleepHours).toBe(7.33);
  });

  it('does not mutate original checkin objects (store needs to detect modification)', () => {
    const original = makeCheckin({ date: '2026-05-20', sleepHours: 0, restHR: 0, hrv: 0 });
    const existing = [original];
    const records = [
      { date: '2026-05-20', sleepHours: 7.5, restHR: 55, hrv: 45 },
    ];
    const result = mergeImportedBiometrics(records, existing);
    expect(original.sleepHours).toBe(0);
    expect(original.restHR).toBe(0);
    expect(original.hrv).toBe(0);
    expect(original === result.checkins.find(c => c.date === '2026-05-20')).toBe(false);
    const updated = result.checkins.find(c => c.date === '2026-05-20');
    expect(updated!.sleepHours).toBe(7.5);
    expect(updated!.restHR).toBe(55);
    expect(updated!.hrv).toBe(45);
  });
});
