import type { Checkin } from '../../core/types.js';
import type { ParsedBiometrics } from './csvParser.js';

export interface MergeResult {
  updated: number;
  skipped: number;
  errors: string[];
  checkins: Checkin[];
}

function createDefaultCheckin(date: string): Checkin {
  return {
    date,
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
  };
}

interface AggregatedRecord {
  date: string;
  sleepHours: number;
  restHR: number;
  hrv: number;
  count: number;
}

function aggregateByDate(records: ParsedBiometrics[]): Map<string, AggregatedRecord> {
  const byDate = new Map<string, AggregatedRecord>();
  for (const rec of records) {
    const existing = byDate.get(rec.date);
    if (existing) {
      if (rec.sleepHours !== undefined) existing.sleepHours += rec.sleepHours;
      if (rec.restHR !== undefined && existing.restHR === 0) existing.restHR = rec.restHR;
      if (rec.hrv !== undefined && existing.hrv === 0) existing.hrv = rec.hrv;
      existing.count++;
    } else {
      byDate.set(rec.date, {
        date: rec.date,
        sleepHours: rec.sleepHours ?? 0,
        restHR: rec.restHR ?? 0,
        hrv: rec.hrv ?? 0,
        count: 1,
      });
    }
  }
  return byDate;
}

export function mergeImportedBiometrics(
  records: ParsedBiometrics[],
  existingCheckins: Checkin[]
): MergeResult {
  let updated = 0;
  let skipped = 0;
  const errors: string[] = [];

  if (records.length === 0) {
    return { updated: 0, skipped: 0, errors: [], checkins: [...existingCheckins] };
  }

  const aggregated = aggregateByDate(records);
  const existingMap = new Map<string, Checkin>();
  for (const c of existingCheckins) {
    existingMap.set(c.date, c);
  }

  for (const [, agg] of aggregated) {
    const existing = existingMap.get(agg.date);
    if (existing) {
      let wasModified = false;
      const updatedCheckin = { ...existing };
      if (agg.sleepHours > 0 && (!updatedCheckin.sleepHours || updatedCheckin.sleepHours === 0)) {
        updatedCheckin.sleepHours = parseFloat(agg.sleepHours.toFixed(2));
        wasModified = true;
        updated++;
      } else if (agg.sleepHours > 0) {
        skipped++;
      }
      if (agg.restHR > 0 && (!updatedCheckin.restHR || updatedCheckin.restHR === 0)) {
        updatedCheckin.restHR = agg.restHR;
        wasModified = true;
        updated++;
      } else if (agg.restHR > 0) {
        skipped++;
      }
      if (agg.hrv > 0 && (!updatedCheckin.hrv || updatedCheckin.hrv === 0)) {
        updatedCheckin.hrv = agg.hrv;
        wasModified = true;
        updated++;
      } else if (agg.hrv > 0) {
        skipped++;
      }
      if (wasModified) {
        existingMap.set(agg.date, updatedCheckin);
      }
    } else {
      const checkin = createDefaultCheckin(agg.date);
      if (agg.sleepHours > 0) checkin.sleepHours = parseFloat(agg.sleepHours.toFixed(2));
      if (agg.restHR > 0) checkin.restHR = agg.restHR;
      if (agg.hrv > 0) checkin.hrv = agg.hrv;
      existingMap.set(agg.date, checkin);
      updated++;
    }
  }

  return { updated, skipped, errors, checkins: Array.from(existingMap.values()) };
}
