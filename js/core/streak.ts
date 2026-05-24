// js/core/streak.ts
// Streak tracking engine: consecutive check-ins, training days, and green readiness days

import type { Checkin, Session, ReadinessStatus } from './types.js';
import { addDays, formatISO, parseLocalDate } from './helpers.js';

export interface StreakInfo {
  checkinStreak: number;
  trainingStreak: number;
  greenStreak: number;
}

/**
 * Calculate consecutive check-in streak (days with any check-in)
 * Counts backwards from today (or reference date), breaking on first missing day
 */
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

/**
 * Calculate consecutive training days streak
 * Counts backwards from today (or reference date), looking for completed workouts (A/B/C sessions)
 * Only counts days that are configured training days
 */
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
  
  // Walk backwards from today
  for (let i = 0; i <= 365; i++) {
    const d = addDays(today, -i);
    const dateStr = formatISO(d);
    const dayOfWeek = d.getDay() || 7; // Convert to 1-7 (Mon-Sun)
    
    // Only count if it's a training day
    if (trainDays.includes(dayOfWeek)) {
      if (trainingDates.has(dateStr)) {
        streak++;
      } else {
        // Missing a training day, break the streak
        break;
      }
    }
  }
  
  return streak;
}

/**
 * Calculate consecutive green readiness days
 * Counts backwards from today (or reference date), looking for check-ins with green readiness
 */
export function getGreenStreak(checkins: Checkin[], referenceDate?: Date): number {
  if (!checkins || checkins.length === 0) return 0;
  
  // Build a map of date -> readiness
  const readinessByDate: Record<string, ReadinessStatus> = {};
  for (const c of checkins) {
    readinessByDate[c.date] = c.readiness || 'green'; // Default to green if not set
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

/**
 * Get all streak information in one call
 */
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

/**
 * Award bonus progress for each full week of streaks
 * Used for achievements
 */
export function getStreakBonus(streak: number): number {
  return Math.floor(streak / 7);
}

/**
 * Find the longest streak in the historical data
 * Useful for "best streak" achievements
 */
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