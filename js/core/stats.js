// js/core/stats.js
// Недельная и месячная статистика

import { parseLocalDate, formatISO, addDays } from './helpers.js';

/**
 * Формирует недельный итог по массиву сессий.
 * @param {Array<Object>} sessions
 * @param {Array<Object>} checkins — не используется, оставлен для API-совместимости
 * @param {string|Date} today
 * @returns {{ completed, avgRPE, green, yellow, red, dominantStatus }}
 */
export function getWeeklySummary(sessions, checkins, today) {
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

/**
 * Статистика за календарный месяц.
 * @param {Array<Object>} sessions
 * @param {string} yearMonth — префикс "YYYY-MM"
 * @returns {{ completed, green, yellow, red }}
 */
export function getMonthStats(sessions, yearMonth) {
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
