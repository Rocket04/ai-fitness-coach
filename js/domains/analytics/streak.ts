// js/domains/analytics/streak.ts
// Streak tracking engine: consecutive check-ins, training days, and green readiness days

import type { Checkin, Session, ReadinessStatus } from '../../shared/types.js';
import { addDays, formatISO, parseLocalDate } from '../../shared/helpers.js';

export interface StreakInfo {
  checkinStreak: number;
  trainingStreak: number;
  greenStreak: number;
}

export function getCheckinStreak(checkins: Checkin[], referenceDate?: Date): number {
  if (!checkins || checkins.length === 0) return 0;

  const dates = new Set(checkins.map(c => c.date));
  const today = referenceDate || new Date();
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

export function getTrainingStreak(
  sessions: Session[],
  trainDays: number[],
  _startDate: string | null,
  referenceDate?: Date
): number {
  if (!sessions || sessions.length === 0) return 0;

  const today = referenceDate || new Date();
  const trainingDates = new Set(
    sessions
      .filter(s => s.completed && s.type !== 'morning' && s.type !== 'evening' && s.type !== 'rest')
      .map(s => s.date)
  );

  let streak = 0;

  for (let i = 0; i <= 365; i++) {
    const d = addDays(today, -i);
    const dateStr = formatISO(d);
    const dayOfWeek = d.getDay() || 7;

    if (trainDays.includes(dayOfWeek)) {
      if (trainingDates.has(dateStr)) {
        streak++;
      } else {
        break;
      }
    }
  }

  return streak;
}

export function getGreenStreak(checkins: Checkin[], referenceDate?: Date): number {
  if (!checkins || checkins.length === 0) return 0;

  const readinessByDate: Record<string, ReadinessStatus> = {};
  for (const c of checkins) {
    readinessByDate[c.date] = c.readiness || 'green';
  }

  const today = referenceDate || new Date();
  let streak = 0;

  for (let i = 0; i <= 365; i++) {
    const d = addDays(today, -i);
    const dateStr = formatISO(d);

    if (readinessByDate[dateStr] === 'green') {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}

export function getAllStreaks(
  checkins: Checkin[],
  sessions: Session[],
  trainDays: number[],
  startDate: string | null,
  referenceDate?: Date
): StreakInfo {
  return {
    checkinStreak: getCheckinStreak(checkins, referenceDate),
    trainingStreak: getTrainingStreak(sessions, trainDays, startDate, referenceDate),
    greenStreak: getGreenStreak(checkins, referenceDate),
  };
}

export function getStreakBonus(streak: number): number {
  return Math.floor(streak / 7);
}

export function getLongestStreak(checkins: Checkin[]): number {
  if (!checkins || checkins.length === 0) return 0;

  const dates = new Set(checkins.map(c => c.date));
  const sortedDates = [...dates].sort();

  let maxStreak = 0;
  let currentStreak = 0;
  let prevDate: Date | null = null;

  for (const dateStr of sortedDates) {
    const currentDate = parseLocalDate(dateStr);
    if (!currentDate) continue;

    if (prevDate) {
      const diffDays = Math.round((currentDate.getTime() - prevDate.getTime()) / 86400000);
      if (diffDays === 1) {
        currentStreak++;
      } else {
        maxStreak = Math.max(maxStreak, currentStreak);
        currentStreak = 1;
      }
    } else {
      currentStreak = 1;
    }
    prevDate = currentDate;
  }

  return Math.max(maxStreak, currentStreak);
}
