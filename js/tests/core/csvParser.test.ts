import { describe, it, expect } from 'vitest';
import { parseHealthSyncCSV, mergeImportedBiometrics } from '../../core/import/csvParser.js';
import type { Checkin } from '../../core/types.js';

describe('parseHealthSyncCSV', () => {
  it('parses valid CSV with standard headers', () => {
    const csv = 'date,sleepHours,restHR,hrv\n2026-05-20,7.5,55,45\n2026-05-21,8.0,52,48';
    const result = parseHealthSyncCSV(csv);
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ date: '2026-05-20', sleepHours: 7.5, restHR: 55, hrv: 45 });
    expect(result[1]).toEqual({ date: '2026-05-21', sleepHours: 8.0, restHR: 52, hrv: 48 });
  });

  it('parses with flexible headers', () => {
    const csv = 'Date,Sleep Duration (hrs),Resting HR,HRV (ms)\n2026-05-20,7.5,55,45';
    const result = parseHealthSyncCSV(csv);
    expect(result).toHaveLength(1);
    expect(result[0].sleepHours).toBe(7.5);
    expect(result[0].restHR).toBe(55);
    expect(result[0].hrv).toBe(45);
  });

  it('returns empty array for empty string', () => {
    expect(parseHealthSyncCSV('')).toEqual([]);
    expect(parseHealthSyncCSV('   ')).toEqual([]);
  });

  it('handles missing values gracefully', () => {
    const csv = 'date,sleepHours,restHR,hrv\n2026-05-20,,55,\n2026-05-21,7.5,,48';
    const result = parseHealthSyncCSV(csv);
    expect(result).toHaveLength(2);
    expect(result[0].sleepHours).toBeUndefined();
    expect(result[0].restHR).toBe(55);
    expect(result[0].hrv).toBeUndefined();
    expect(result[1].sleepHours).toBe(7.5);
    expect(result[1].restHR).toBeUndefined();
    expect(result[1].hrv).toBe(48);
  });

  it('skips malformed rows but keeps valid ones', () => {
    const csv = 'date,sleepHours,restHR,hrv\n2026-05-20,7.5,55,45\ninvalid-date,8,52,48\n2026-05-22,6.5,58,42';
    const result = parseHealthSyncCSV(csv);
    expect(result).toHaveLength(2);
    expect(result[0].date).toBe('2026-05-20');
    expect(result[1].date).toBe('2026-05-22');
  });
});

describe('mergeImportedBiometrics', () => {
  it('fills missing fields in existing checkins', () => {
    const records = [
      { date: '2026-05-20', sleepHours: 7.5, restHR: 55, hrv: 45 },
    ];
    const checkins: Checkin[] = [
      { date: '2026-05-20', sleepHours: 0, restHR: 0, hrv: 0, muscleSoreness: 3, energy: 3, mood: 3, sleepQuality: 3, stress: 3 } as Checkin,
    ];
    const result = mergeImportedBiometrics(records, checkins);
    expect(result.merged).toBe(3);
    expect(result.skipped).toBe(0);
    expect(result.checkins[0].sleepHours).toBe(7.5);
    expect(result.checkins[0].restHR).toBe(55);
    expect(result.checkins[0].hrv).toBe(45);
  });

  it('skips fields already filled', () => {
    const records = [
      { date: '2026-05-20', sleepHours: 7.5, restHR: 55, hrv: 45 },
    ];
    const checkins: Checkin[] = [
      { date: '2026-05-20', sleepHours: 8, restHR: 0, hrv: 0, muscleSoreness: 3, energy: 3, mood: 3, sleepQuality: 3, stress: 3 } as Checkin,
    ];
    const result = mergeImportedBiometrics(records, checkins);
    expect(result.merged).toBe(2);
    expect(result.skipped).toBe(1);
    expect(result.checkins[0].sleepHours).toBe(8);
    expect(result.checkins[0].restHR).toBe(55);
  });

  it('returns zeros for empty arrays', () => {
    const result = mergeImportedBiometrics([], []);
    expect(result.merged).toBe(0);
    expect(result.skipped).toBe(0);
    expect(result.checkins).toEqual([]);
  });
});
