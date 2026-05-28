import type { Checkin } from '../types.js';

export interface ParsedBiometrics {
  date: string;
  sleepHours?: number;
  restHR?: number;
  hrv?: number;
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function normalizeHeader(h: string): string {
  const s = h.toLowerCase().trim();
  if (s.includes('sleep') || s.includes('duration')) return 'sleepHours';
  if (s.includes('hrv')) return 'hrv';
  if (s.includes('rest') || s.includes('rhr') || (s.includes('hr') && !s.includes('hrv'))) return 'restHR';
  if (s.includes('date')) return 'date';
  return s;
}

export function parseHealthSyncCSV(csvContent: string): ParsedBiometrics[] {
  if (!csvContent || !csvContent.trim()) return [];
  const lines = csvContent.split('\n').map(l => l.trim()).filter(Boolean);
  if (lines.length < 2) return [];
  const delim = lines[0].includes(',') ? ',' : ',';
  const headers = lines[0].split(delim).map(normalizeHeader);
  const results: ParsedBiometrics[] = [];
  for (let i = 1; i < lines.length; i++) {
    const vals = lines[i].split(delim).map(v => v.trim());
    const date = vals[headers.indexOf('date')] || '';
    if (!DATE_RE.test(date)) continue;
    const entry: ParsedBiometrics = { date };
    const sleepIdx = headers.indexOf('sleepHours');
    const rhrIdx = headers.indexOf('restHR');
    const hrvIdx = headers.indexOf('hrv');
    if (sleepIdx >= 0 && vals[sleepIdx]) {
      const n = parseFloat(vals[sleepIdx]);
      if (!isNaN(n) && n > 0) entry.sleepHours = n;
    }
    if (rhrIdx >= 0 && vals[rhrIdx]) {
      const n = parseFloat(vals[rhrIdx]);
      if (!isNaN(n) && n > 0) entry.restHR = Math.round(n);
    }
    if (hrvIdx >= 0 && vals[hrvIdx]) {
      const n = parseFloat(vals[hrvIdx]);
      if (!isNaN(n) && n > 0) entry.hrv = Math.round(n);
    }
    results.push(entry);
  }
  return results;
}

export function mergeImportedBiometrics(
  records: ParsedBiometrics[],
  allCheckins: Checkin[]
): { merged: number; skipped: number; checkins: Checkin[] } {
  let merged = 0, skipped = 0;
  const updated = allCheckins.map(c => ({ ...c }));
  for (const rec of records) {
    const ci = updated.findIndex(c => c.date === rec.date);
    if (ci < 0) continue;
    const c = updated[ci];
    if (rec.sleepHours !== undefined && (!c.sleepHours || c.sleepHours === 0)) { c.sleepHours = rec.sleepHours; merged++; } else if (rec.sleepHours !== undefined) { skipped++; }
    if (rec.restHR !== undefined && (!c.restHR || c.restHR === 0)) { c.restHR = rec.restHR; merged++; } else if (rec.restHR !== undefined) { skipped++; }
    if (rec.hrv !== undefined && (!c.hrv || c.hrv === 0)) { c.hrv = rec.hrv; merged++; } else if (rec.hrv !== undefined) { skipped++; }
  }
  return { merged, skipped, checkins: updated };
}
