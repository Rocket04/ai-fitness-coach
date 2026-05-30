// Streak Engine Template
// For counting consecutive days: checkins, training sessions, green readiness

import type { Checkin, Session } from './types.js';

export interface StreakData {
  checkinStreak: number;
  trainingStreak: number;
  greenStreak: number;
}

/**
 * Calculate streaks from checkins and sessions.
 * @param checkins - Array of daily check-ins
 * @param sessions - Array of workout sessions
 * @param trainDays - Array of training day numbers [0-6]
 * @param referenceDate - Date string for "today" (ISO format) - useful for tests
 */
export function getAllStreaks(
  checkins: Checkin[],
  sessions: Session[],
  trainDays: number[],
  referenceDate?: string
): StreakData {
  const today = referenceDate || new Date().toISOString().split('T')[0];
  
  // Build lookup sets for O(1) date checks
  const checkinDates = new Set(checkins.map(c => c.date));
  const sessionDates = new Set(
    sessions
      .filter(s => s.completed && s.type !== 'morning' && s.type !== 'evening')
      .map(s => s.date)
  );
  const greenDates = new Set(
    checkins.filter(c => c.readiness === 'green').map(c => c.date)
  );
  
  // Count backwards from today
  let checkinStreak = 0;
  let trainingStreak = 0;
  let greenStreak = 0;
  
  const todayDate = new Date(today);
  
  for (let i = 0; i < 365; i++) {
    const checkDate = new Date(todayDate.getTime() - i * 86400000);
    const dateStr = checkDate.toISOString().split('T')[0];
    
    if (checkinDates.has(dateStr)) checkinStreak++;
    else break;
    
    if (sessionDates.has(dateStr)) trainingStreak++;
    if (greenDates.has(dateStr)) greenStreak++;
  }
  
  return { checkinStreak, trainingStreak, greenStreak };
}

export function getStreakBonus(streak: number): number {
  return Math.floor(streak / 7) * 5; // 5% bonus per full week
}

export function getLongestStreak(checkins: Checkin[]): number {
  if (checkins.length === 0) return 0;
  
  const sorted = [...checkins].sort((a, b) => b.date.localeCompare(a.date));
  const dates = new Set(sorted.map(c => c.date));
  
  let max = 0, current = 0;
  const today = new Date();
  
  for (let i = 0; i < 365; i++) {
    const d = new Date(today.getTime() - i * 86400000);
    const dateStr = d.toISOString().split('T')[0];
    if (dates.has(dateStr)) {
      current++;
      max = Math.max(max, current);
    } else {
      current = 0;
    }
  }
  
  return max;
}