import { describe, it, expect } from 'vitest';
import { parseHealthSyncCSV } from '../csvParser.js';

describe('parseHealthSyncCSV', () => {
  it('parses standard English headers (ISO date)', () => {
    const csv = 'date,sleepHours,restHR,hrv\n2026-05-20,7.5,55,45\n2026-05-21,8.0,52,48';
    const result = parseHealthSyncCSV(csv);
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ date: '2026-05-20', sleepHours: 7.5, restHR: 55, hrv: 45 });
    expect(result[1]).toEqual({ date: '2026-05-21', sleepHours: 8.0, restHR: 52, hrv: 48 });
  });

  it('handles flexible English headers', () => {
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

  it('converts sleep from minutes to hours', () => {
    const csv = 'date,Sleep Duration (minutes),restHR,hrv\n2026-05-20,450,55,45';
    const result = parseHealthSyncCSV(csv);
    expect(result[0].sleepHours).toBe(7.5);
  });

  it('converts sleep from seconds to hours', () => {
    const csv = 'date,Sleep (seconds),restHR,hrv\n2026-05-20,28800,55,45';
    const result = parseHealthSyncCSV(csv);
    expect(result[0].sleepHours).toBe(8);
  });

  it('handles Russian headers', () => {
    const csv = 'дата,сон,чсс покоя,вср\n2026-05-20,7.5,55,45';
    const result = parseHealthSyncCSV(csv);
    expect(result).toHaveLength(1);
    expect(result[0].sleepHours).toBe(7.5);
    expect(result[0].restHR).toBe(55);
    expect(result[0].hrv).toBe(45);
  });

  it('handles semicolon delimiter', () => {
    const csv = 'date;sleepHours;restHR;hrv\n2026-05-20;7.5;55;45';
    const result = parseHealthSyncCSV(csv);
    expect(result).toHaveLength(1);
    expect(result[0].sleepHours).toBe(7.5);
  });

  it('handles BOM marker', () => {
    const csv = '\uFEFFdate,sleepHours,restHR,hrv\n2026-05-20,7.5,55,45';
    const result = parseHealthSyncCSV(csv);
    expect(result).toHaveLength(1);
  });

  it('handles quoted fields', () => {
    const csv = 'date,sleepHours,restHR,hrv\n2026-05-20,"7.5",55,45';
    const result = parseHealthSyncCSV(csv);
    expect(result).toHaveLength(1);
    expect(result[0].sleepHours).toBe(7.5);
  });

  it('handles DD.MM.YYYY date format', () => {
    const csv = 'date,sleepHours,restHR,hrv\n20.05.2026,7.5,55,45';
    const result = parseHealthSyncCSV(csv);
    expect(result).toHaveLength(1);
    expect(result[0].date).toBe('2026-05-20');
  });

  it('handles MM/DD/YYYY date format', () => {
    const csv = 'date,sleepHours,restHR,hrv\n05/20/2026,7.5,55,45';
    const result = parseHealthSyncCSV(csv);
    expect(result).toHaveLength(1);
    expect(result[0].date).toBe('2026-05-20');
  });

  it('handles YYYYMMDD compact date format', () => {
    const csv = 'date,sleepHours,restHR,hrv\n20260520,7.5,55,45';
    const result = parseHealthSyncCSV(csv);
    expect(result).toHaveLength(1);
    expect(result[0].date).toBe('2026-05-20');
  });

  it('handles integer RHR and HRV values', () => {
    const csv = 'date,sleepHours,restHR,hrv\n2026-05-20,7.5,55,45';
    const result = parseHealthSyncCSV(csv);
    expect(result[0].restHR).toBe(55);
    expect(result[0].hrv).toBe(45);
  });

  it('skips lines with unparseable dates', () => {
    const csv = 'date,sleepHours,restHR,hrv\nnot-a-date,7.5,55,45\n2026-05-21,8.0,52,48';
    const result = parseHealthSyncCSV(csv);
    expect(result).toHaveLength(1);
    expect(result[0].date).toBe('2026-05-21');
  });

  it('returns empty array for single line (no data rows)', () => {
    expect(parseHealthSyncCSV('date,sleepHours,restHR,hrv')).toEqual([]);
  });

  it('handles tab delimiter', () => {
    const csv = 'date\tsleepHours\trestHR\thrv\n2026-05-20\t7.5\t55\t45';
    const result = parseHealthSyncCSV(csv);
    expect(result).toHaveLength(1);
    expect(result[0].sleepHours).toBe(7.5);
  });

  it('handles date with time component', () => {
    const csv = 'date,sleepHours,restHR,hrv\n2026-05-20T10:00:00,7.5,55,45';
    const result = parseHealthSyncCSV(csv);
    expect(result).toHaveLength(1);
    expect(result[0].date).toBe('2026-05-20');
  });

  it('handles YYYY.MM.DD date format', () => {
    const csv = 'date,sleepHours,restHR,hrv\n2026.05.20,7.5,55,45';
    const result = parseHealthSyncCSV(csv);
    expect(result).toHaveLength(1);
    expect(result[0].date).toBe('2026-05-20');
  });
});
