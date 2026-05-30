import { describe, it, expect } from 'vitest';
import { parseHealthSyncCSV } from '../../core/import/csvParser.js';

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

  it('skips rows with unparseable dates', () => {
    const csv = 'date,sleepHours,restHR,hrv\n2026-05-20,7.5,55,45\ninvalid,8,52,48\n2026-05-22,6.5,58,42';
    const result = parseHealthSyncCSV(csv);
    expect(result).toHaveLength(2);
    expect(result[0].date).toBe('2026-05-20');
    expect(result[1].date).toBe('2026-05-22');
  });

  it('auto-detects comma delimiter', () => {
    const csv = 'date,sleepHours,restHR\n2026-05-20,7.5,55';
    const result = parseHealthSyncCSV(csv);
    expect(result).toHaveLength(1);
    expect(result[0].sleepHours).toBe(7.5);
  });

  it('auto-detects semicolon delimiter', () => {
    const csv = 'date;sleepHours;restHR\n2026-05-20;7.5;55';
    const result = parseHealthSyncCSV(csv);
    expect(result).toHaveLength(1);
    expect(result[0].sleepHours).toBe(7.5);
    expect(result[0].restHR).toBe(55);
  });

  it('auto-detects tab delimiter', () => {
    const csv = 'date\tsleepHours\trestHR\n2026-05-20\t7.5\t55';
    const result = parseHealthSyncCSV(csv);
    expect(result).toHaveLength(1);
    expect(result[0].sleepHours).toBe(7.5);
    expect(result[0].restHR).toBe(55);
  });

  it('parses YYYY.MM.DD date format (Russian Health Connect)', () => {
    const csv = 'Дата,Время,изменчивость сердечного ритма\n2026.05.05 03:10:33,03:10:33,19.0';
    const result = parseHealthSyncCSV(csv);
    expect(result).toHaveLength(1);
    expect(result[0].date).toBe('2026-05-05');
    expect(result[0].hrv).toBe(19);
  });

  it('parses resting HR from Russian Health Connect CSV', () => {
    const csv = 'Дата,Время,Частота сердечных сокращений в покое,Источник \n2026.04.26 00:00:00,00:00:00,61,nl.appyhapps.healthsync';
    const result = parseHealthSyncCSV(csv);
    expect(result).toHaveLength(1);
    expect(result[0].date).toBe('2026-04-26');
    expect(result[0].restHR).toBe(61);
  });

  it('parses sleep from Russian Huawei Health CSV (seconds → hours)', () => {
    const csv = 'Дата,Время,Продолжительность в секундах,Стадия сна\n2026.05.29 14:52:00,14:52:00,1680,light\n2026.05.29 15:20:00,15:20:00,960,deep';
    const result = parseHealthSyncCSV(csv);
    expect(result).toHaveLength(2);
    expect(result[0].date).toBe('2026-05-29');
    expect(result[0].sleepHours).toBeCloseTo(0.467, 2);
    expect(result[1].sleepHours).toBeCloseTo(0.267, 2);
  });

  it('converts sleep minutes to hours when value > 24', () => {
    const csv = 'date,sleepDurationMinutes,restHR\n2026-05-20,480,55';
    const result = parseHealthSyncCSV(csv);
    expect(result).toHaveLength(1);
    expect(result[0].sleepHours).toBe(8);
  });

  it('keeps sleep hours when value <= 24', () => {
    const csv = 'date,sleepHours,restHR\n2026-05-20,7.5,55';
    const result = parseHealthSyncCSV(csv);
    expect(result).toHaveLength(1);
    expect(result[0].sleepHours).toBe(7.5);
  });

  it('handles BOM character', () => {
    const csv = '\uFEFFdate,sleepHours,restHR,hrv\n2026-05-20,7.5,55,45';
    const result = parseHealthSyncCSV(csv);
    expect(result).toHaveLength(1);
    expect(result[0].sleepHours).toBe(7.5);
  });

  it('handles quoted fields', () => {
    const csv = 'date,sleepHours,restHR,hrv\n"2026-05-20",7.5,"55",45';
    const result = parseHealthSyncCSV(csv);
    expect(result).toHaveLength(1);
    expect(result[0].date).toBe('2026-05-20');
    expect(result[0].restHR).toBe(55);
  });

  it('handles quoted field with embedded comma', () => {
    const csv = 'date,sleepHours,restHR,note\n2026-05-20,7.5,55,"some, note"';
    const result = parseHealthSyncCSV(csv);
    expect(result).toHaveLength(1);
    expect(result[0].sleepHours).toBe(7.5);
  });

  it('parses DD.MM.YYYY date format', () => {
    const csv = 'date,sleepHours\n20.05.2026,7.5\n21.05.2026,8.0';
    const result = parseHealthSyncCSV(csv);
    expect(result).toHaveLength(2);
    expect(result[0].date).toBe('2026-05-20');
    expect(result[1].date).toBe('2026-05-21');
  });

  it('parses MM/DD/YYYY date format', () => {
    const csv = 'date,sleepHours\n05/20/2026,7.5\n05/21/2026,8.0';
    const result = parseHealthSyncCSV(csv);
    expect(result).toHaveLength(2);
    expect(result[0].date).toBe('2026-05-20');
    expect(result[1].date).toBe('2026-05-21');
  });

  it('returns empty array for headers-only file', () => {
    const csv = 'date,sleepHours,restHR';
    const result = parseHealthSyncCSV(csv);
    expect(result).toHaveLength(0);
  });

  it('returns empty array when no date column found', () => {
    const csv = 'foo,bar,baz\n2026-05-20,7.5,55';
    const result = parseHealthSyncCSV(csv);
    expect(result).toHaveLength(0);
  });

  it('ignores non-biometric CSV files (training data)', () => {
    const csv = 'Исходное приложение,Тип деятельности,Дата,Время,Расстояние (км)\nHealth Sync,RUNNING,2026.05.02 18:05:49,18:05:49,1.35';
    const result = parseHealthSyncCSV(csv);
    // Has date column but no biometric columns
    expect(result).toHaveLength(0);
  });

  it('parses HRV with Russian header (изменчивость сердечного ритма)', () => {
    const csv = 'Дата,Время,изменчивость сердечного ритма\n2026.05.05 03:10:33,03:10:33,19.0\n2026.05.05 04:16:33,04:16:33,17.0';
    const result = parseHealthSyncCSV(csv);
    expect(result).toHaveLength(2);
    expect(result[0].hrv).toBe(19);
    expect(result[1].hrv).toBe(17);
  });

  it('parses general heart rate (Пульс) as restHR fallback', () => {
    const csv = 'Дата,Время,Пульс,Источник \n2026.05.29 00:06:00,00:06:00,82,\n2026.05.29 00:07:00,00:07:00,75,';
    const result = parseHealthSyncCSV(csv);
    expect(result).toHaveLength(2);
    expect(result[0].restHR).toBe(82);
    expect(result[1].restHR).toBe(75);
  });

  it('handles comma as decimal separator with semicolon delimiter', () => {
    const csv = 'date;sleepHours\n2026-05-20;7,5\n2026-05-21;8,0';
    const result = parseHealthSyncCSV(csv);
    expect(result).toHaveLength(2);
    expect(result[0].sleepHours).toBe(7.5);
    expect(result[1].sleepHours).toBe(8);
  });

  it('handles CRLF line endings', () => {
    const csv = 'date,sleepHours,restHR\r\n2026-05-20,7.5,55\r\n2026-05-21,8.0,52';
    const result = parseHealthSyncCSV(csv);
    expect(result).toHaveLength(2);
  });
});
