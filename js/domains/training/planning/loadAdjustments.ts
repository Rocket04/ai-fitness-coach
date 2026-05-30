// js/core/loadAdjustments.ts
// Множители нагрузки и APRE-корректировки

import type { Session, Exercise, SessionMode, WeeklySummary } from '../../../core/types.js';

/**
 * Недельный множитель на основе сводки за прошлую неделю.
 * Каждая 4-я неделя — разгрузочная (deload) с пониженной нагрузкой.
 */
export function getWeeklyMultiplier(weeklySummary: WeeklySummary, dayOfWeek = 1, weekNumber = 1): number {
  if (dayOfWeek !== 1) return 1.0;

  // Deload week: every 4th week reduces load by 40%
  if (weekNumber % 4 === 0) {
    return 0.6;
  }

  if (weeklySummary.completed >= 3 &&
      weeklySummary.dominantStatus === 'green' &&
      weeklySummary.red === 0 &&
      weeklySummary.yellow <= 1) {
    return 1.1;
  }

  if (weeklySummary.red >= 2 || weeklySummary.yellow >= 3) {
    return 0.9;
  }

  return 1.0;
}

/**
 * Множитель на основе динамики тестов.
 */
export function getTestMultiplier(sessions: Session[], currentWeek: number): number {
  const testWeeks = [1, 3, 5, 7, 9, 11];
  if (!testWeeks.includes(currentWeek - 1)) return 1.0;

  const tests = sessions
    .filter(s => s.testResults)
    .sort((a, b) => (b.date || '').localeCompare(a.date || ''));

  if (tests.length < 2) return 1.0;

  const latest = tests[0]?.testResults;
  const prev = tests[1]?.testResults;
  if (!latest || !prev) return 1.0;

  const improvements = [];
  if (typeof latest.pullUps === 'number' && typeof prev.pullUps === 'number')
    improvements.push(latest.pullUps - prev.pullUps);
  if (typeof latest.pushUps === 'number' && typeof prev.pushUps === 'number')
    improvements.push(latest.pushUps - prev.pushUps);
  if (typeof latest.plankSec === 'number' && typeof prev.plankSec === 'number')
    improvements.push(latest.plankSec - prev.plankSec);

  if (improvements.length === 0) return 1.0;

  const avgDiff = improvements.reduce((a, b) => a + b, 0) / improvements.length;

  if (avgDiff >= 2) return 1.2;
  if (avgDiff <= -2) return 0.8;
  return 1.0;
}

/**
 * Умножает числовые значения в строках повторений на множитель.
 */
export function applyMultiplierToExercises(exercises: Exercise[], multiplier: number): Exercise[] {
  if (multiplier === 1.0) return exercises;

  return exercises.map(ex => {
    if (ex.isTest) return ex;

    // Scale sets
    const sets = parseInt(ex.s, 10);
    const newSets = isNaN(sets) ? ex.s : String(Math.max(1, Math.round(sets * multiplier)));

    // Scale reps
    let newR = ex.r;
    if (ex.r) {
      const match = ex.r.match(/^(\d+)/);
      if (match) {
        const num = parseInt(match[1], 10);
        const newNum = Math.max(1, Math.round(num * multiplier));
        newR = ex.r.replace(/^\d+/, String(newNum));
      }
    }

    return { ...ex, s: newSets, r: newR };
  });
}

/**
 * APRE-подобная корректировка повторений на основе RPE последней сессии.
 */
export function applyApreAdjustment(exercises: Exercise[], lastSession: Session | null): Exercise[] {
  if (!lastSession || !lastSession.rpe) return exercises;

  const rpe = Number(lastSession.rpe);
  if (isNaN(rpe)) return exercises;

  return exercises.map(ex => {
    if (!ex.r || ex.isTest) return ex;

    const match = ex.r.match(/^(\d+)/);
    if (!match) return ex;

    const num = parseInt(match[1], 10);
    let newNum = num;

    if (rpe <= 4 && num > 3) newNum = num + 1;
    else if (rpe >= 8 && num > 2) newNum = num - 1;

    if (newNum !== num) {
      const newR = ex.r.replace(/^\d+/, String(newNum));
      return { ...ex, r: newR };
    }
    return ex;
  });
}

/**
 * Корректирует список упражнений в зависимости от режима тренировки.
 */
const FALLBACK_RECOVERY_EXERCISES: Exercise[] = [
  { n: 'Мобильность ТБС (восстановление)', s: '2', r: '10–12', w: 'лёгкие движения без боли' },
  { n: 'Дыхательная гимнастика', s: '3', r: '10 вдохов', w: '4-7-8 техника' },
];

export function adjustExercisesForMode(exercises: Exercise[], mode: SessionMode): Exercise[] {
  if (mode === 'minimum') {
    const filtered = exercises
      .filter(e => !e.isTest && e.n && (
        e.n.toLowerCase().includes('мобильн') ||
        e.n.toLowerCase().includes('растяж') ||
        e.n.toLowerCase().includes('дыхан')
      ))
      .slice(0, 2);
    // Fallback: если в плане нет восстановительных упражнений, использовать стандартный набор
    return filtered.length > 0 ? filtered : FALLBACK_RECOVERY_EXERCISES;
  }

  if (mode === 'yellow') {
    return exercises.map(e => {
      if (e.isTest) return e;
      const sets = parseInt(e.s, 10);
      if (isNaN(sets)) return e;
      const newSets = sets > 1 ? sets - 1 : sets;
      return { ...e, s: String(newSets) };
    });
  }

  // Deload week: reduce volume by ~40% (rounded down, minimum 1 set)
  if (mode === 'deload') {
    return exercises.map(e => {
      if (e.isTest) return e;
      const sets = parseInt(e.s, 10);
      if (isNaN(sets)) return e;
      // Reduce by 40% (multiply by 0.6), round up to ensure at least 1 set
      const newSets = Math.max(1, Math.ceil(sets * 0.6));
      return { ...e, s: String(newSets), w: `${e.w || ''} (разгрузка)`.trim() };
    });
  }

  return [...exercises];
}
