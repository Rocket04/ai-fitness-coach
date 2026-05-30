// js/domains/analytics/stats.ts
// Недельная и месячная статистика

import { parseLocalDate, formatISO, addDays } from '../../shared/helpers.js';
import type { Session, Checkin } from '../../shared/types.js';

export function getStreak(checkins: Checkin[]): number {
  if (!checkins || checkins.length === 0) return 0;

  const today = new Date();
  const dates = new Set(checkins.map(c => c.date));
  let streak = 0;

  for (let i = 0; i <= 365; i++) {
    const d = addDays(today, -i);
    const dateStr = formatISO(d);
    if (dates.has(dateStr)) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

export function getWeeklySummary(sessions: Session[], _checkins: Checkin[], today: string | Date): { completed: number; avgRPE: number | null; green: number; yellow: number; red: number; dominantStatus: string } {
  const todayDate = typeof today === 'string' ? parseLocalDate(today) || new Date() : new Date(today);
  const weekStart = addDays(todayDate, -6);

  const startStr = formatISO(weekStart);
  const endStr = formatISO(todayDate);

  let completed = 0;
  let rpeSum = 0;
  let rpeCount = 0;
  let green = 0;
  let yellow = 0;
  let red = 0;

  for (const s of sessions) {
    if (!s || !s.date) continue;
    if (s.date >= startStr && s.date <= endStr && s.completed &&
        s.type !== 'mobility' && s.type !== 'morning' && s.type !== 'evening') {
      completed++;
      if (s.readiness === 'green') green++;
      else if (s.readiness === 'yellow') yellow++;
      else if (s.readiness === 'red') red++;
      if (s.rpe) { rpeSum += Number(s.rpe); rpeCount++; }
    }
  }

  let dominantStatus = 'green';
  if (red > green && red > yellow) dominantStatus = 'red';
  else if (yellow > green) dominantStatus = 'yellow';

  return {
    completed,
    avgRPE: rpeCount ? Number((rpeSum / rpeCount).toFixed(1)) : null,
    green,
    yellow,
    red,
    dominantStatus,
  };
}

export function getMonthStats(sessions: Session[], yearMonth: string): { completed: number; green: number; yellow: number; red: number } {
  let completed = 0;
  let green = 0;
  let yellow = 0;
  let red = 0;

  for (const s of sessions) {
    if (!s || !s.date) continue;
    if (s.date.startsWith(yearMonth) && s.completed &&
        s.type !== 'mobility' && s.type !== 'morning' && s.type !== 'evening') {
      completed++;
      if (s.readiness === 'green') green++;
      else if (s.readiness === 'yellow') yellow++;
      else if (s.readiness === 'red') red++;
    }
  }

  return { completed, green, yellow, red };
}
