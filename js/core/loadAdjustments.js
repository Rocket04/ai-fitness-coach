// js/core/loadAdjustments.js
// Множители нагрузки и APRE-корректировки

/**
 * Недельный множитель на основе сводки за прошлую неделю.
 * @param {{ completed, dominantStatus, green, yellow, red }} weeklySummary
 * @param {number} dayOfWeek — 0=Вс, 1=Пн … 6=Сб
 * @returns {number}
 */
export function getWeeklyMultiplier(weeklySummary, dayOfWeek = 1) {
  if (dayOfWeek !== 1) return 1.0;

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
 * @param {Array<Object>} sessions — массив сессий (с testResults)
 * @param {number} currentWeek — номер недели
 * @returns {number}
 */
export function getTestMultiplier(sessions, currentWeek) {
  const testWeeks = [1, 3, 5, 7, 9, 11];
  if (!testWeeks.includes(currentWeek - 1)) return 1.0;

  const tests = sessions
    .filter(s => s.testResults)
    .sort((a, b) => (b.date || '').localeCompare(a.date || ''));

  if (tests.length < 2) return 1.0;

  const latest = tests[0].testResults;
  const prev = tests[1].testResults;

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
 * @param {Array<Object>} exercises
 * @param {number} multiplier
 * @returns {Array<Object>}
 */
export function applyMultiplierToExercises(exercises, multiplier) {
  if (multiplier === 1.0) return exercises;

  return exercises.map(ex => {
    if (!ex.r || ex.isTest) return ex;

    const match = ex.r.match(/^(\d+)/);
    if (!match) return ex;

    const num = parseInt(match[1], 10);
    const newNum = Math.max(Math.round(num * multiplier), 1);
    const newR = ex.r.replace(/^\d+/, String(newNum));
    return { ...ex, r: newR };
  });
}

/**
 * APRE-подобная корректировка повторений на основе RPE последней сессии.
 * @param {Array<Object>} exercises
 * @param {Object|null} lastSession — { rpe }
 * @returns {Array<Object>}
 */
export function applyApreAdjustment(exercises, lastSession) {
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
 * @param {Array<Object>} exercises
 * @param {'full'|'yellow'|'minimum'|'red'} mode
 * @returns {Array<Object>}
 */
export function adjustExercisesForMode(exercises, mode) {
  if (mode === 'red' || mode === 'minimum') {
    return exercises
      .filter(e => !e.isTest && e.n && (
        e.n.toLowerCase().includes('мобильн') ||
        e.n.toLowerCase().includes('растяж') ||
        e.n.toLowerCase().includes('дыхан')
      ))
      .slice(0, 2);
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

  return [...exercises];
}
