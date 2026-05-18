// js/core/engine.js
// Бизнес-логика фитнес-трекера — чистые функции без побочных эффектов

import { MONTHS, TRAIN_ORDER } from '../config/constants.js';
import { formatISO, addDays, parseLocalDate } from './helpers.js';

/* =================================================================
 * 1. ГОТОВНОСТЬ (READINESS) И ВОССТАНОВЛЕНИЕ
 * ================================================================= */

/**
 * Определяет готовность (readiness) на основе показателей чек-ина.
 * Пороговая логика из MVP: red если хотя бы один критический порог превышен.
 * @param {Object} checkin — { sleepHours, restHR, hrv, hipPain, shoulderPain, breathing,
 *   muscleSoreness, energy, mood, sleepQuality, stress }
 * @returns {'green'|'yellow'|'red'}
 */
export function calcReadiness(checkin) {
  const sleep = Number(checkin.sleepHours || 0);
  const hr = Number(checkin.restHR || 0);
  const hrv = Number(checkin.hrv || 0);
  const hip = Number(checkin.hipPain || 0);
  const sh = Number(checkin.shoulderPain || 0);
  const breath = checkin.breathing || 'ok';

  // Субъективные метрики
  const soreness = Number(checkin.muscleSoreness || 0);
  const energy = Number(checkin.energy || 0);
  const mood = Number(checkin.mood || 0);
  const sleepQ = Number(checkin.sleepQuality || 0);
  const stress = Number(checkin.stress || 0);

  const red =
    (sleep > 0 && sleep < 6) ||
    (hr > 0 && hr >= 76) ||
    (hrv > 0 && hrv < 40) ||
    hip >= 5 || sh >= 5 ||
    breath === 'bad' ||
    soreness >= 5 ||
    (energy > 0 && energy <= 1) ||
    (mood > 0 && mood <= 1) ||
    (sleepQ > 0 && sleepQ <= 1) ||
    stress >= 5;

  const yellow =
    (sleep > 0 && sleep < 7) ||
    (hr > 0 && hr >= 71) ||
    (hrv > 0 && hrv < 55) ||
    hip >= 3 || sh >= 3 ||
    breath !== 'ok' ||
    soreness >= 4 ||
    (energy > 0 && energy <= 2) ||
    (mood > 0 && mood <= 2) ||
    (sleepQ > 0 && sleepQ <= 2) ||
    stress >= 4;

  if (red) return 'red';
  if (yellow) return 'yellow';
  return 'green';
}

/**
 * Учитывает ручной override готовности.
 * Если manualStatus равен 'unknown' — возвращает autoReadiness, иначе manualStatus.
 * @param {'green'|'yellow'|'red'} autoReadiness
 * @param {string} manualStatus — 'green', 'yellow', 'red' или 'unknown'
 * @returns {'green'|'yellow'|'red'}
 */
export function getEffectiveReadiness(autoReadiness, manualStatus) {
  if (manualStatus === 'unknown') return autoReadiness;
  return manualStatus;
}

/**
 * Определяет накопленную усталость (recovery debt) по трём последним чекинам.
 * @param {Array<Object|null>} recentCheckins — массив из 3 чекинов (самый свежий первый).
 * @returns {boolean}
 */
export function detectRecoveryDebt(recentCheckins) {
  const days = recentCheckins.slice(0, 3);
  if (!days.length) return false;
  let points = 0;

  for (const d of days) {
    if (!d) continue;
    const sleep = Number(d.sleepHours || 0);
    const hr = Number(d.restHR || 0);
    const hrv = Number(d.hrv || 0);
    const hip = Number(d.hipPain || 0);
    const sh = Number(d.shoulderPain || 0);
    const breath = d.breathing || 'ok';

    // Субъективные метрики
    const soreness = Number(d.muscleSoreness || 0);
    const energy = Number(d.energy || 0);
    const mood = Number(d.mood || 0);
    const sleepQ = Number(d.sleepQuality || 0);
    const stress = Number(d.stress || 0);

    // сон
    if (sleep > 0 && sleep < 6.5) points += 2;
    else if (sleep > 0 && sleep < 7) points += 1;

    // HRV
    if (hrv > 0 && hrv < 40) points += 2;
    else if (hrv > 0 && hrv < 55) points += 1;

    // пульс
    if (hr > 0 && hr >= 76) points += 2;
    else if (hr > 0 && hr >= 71) points += 1;

    // боль
    if (hip >= 3 || sh >= 3) points += 1;
    if (hip >= 5 || sh >= 5) points += 2;

    // дыхание
    if (breath === 'mild') points += 1;
    if (breath === 'bad') points += 2;

    // мышечная болезненность
    if (soreness >= 4) points += 2;
    else if (soreness >= 3) points += 1;

    // энергия
    if (energy > 0 && energy <= 1) points += 2;
    else if (energy > 0 && energy <= 2) points += 1;

    // настроение
    if (mood > 0 && mood <= 1) points += 2;
    else if (mood > 0 && mood <= 2) points += 1;

    // качество сна
    if (sleepQ > 0 && sleepQ <= 1) points += 2;
    else if (sleepQ > 0 && sleepQ <= 2) points += 1;

    // стресс
    if (stress >= 5) points += 2;
    else if (stress >= 4) points += 1;
  }

  return points >= 4;
}

/**
 * Recovery Score 0–100 на основе HRV, сна, пульса, боли, дыхания и субъективных метрик.
 * MVP-формула: старт со 100, вычеты по порогам.
 * @param {Object} checkin — текущий чек-ин
 * @param {Array<Object>} allCheckins — массив всех чек-инов (для 7-дневного среднего HRV)
 * @returns {number} 0–100
 */
export function calculateRecoveryScore(checkin, allCheckins) {
  const sleep = Number(checkin.sleepHours) || 8;
  const hrv = Number(checkin.hrv) || 70;
  const hr = Number(checkin.restHR) || 63;
  const hip = Number(checkin.hipPain) || 0;
  const sh = Number(checkin.shoulderPain) || 0;
  const breath = checkin.breathing || 'ok';

  // Субъективные метрики
  const soreness = Number(checkin.muscleSoreness || 0);
  const energy = Number(checkin.energy || 0);
  const mood = Number(checkin.mood || 0);
  const sleepQ = Number(checkin.sleepQuality || 0);
  const stress = Number(checkin.stress || 0);

  // Средний HRV за последние 7 дней
  const todayStr = checkin.date || formatISO(new Date());
  const today = parseLocalDate(todayStr) || new Date();
  const sevenDaysAgo = addDays(today, -7);

  const inLast7 = allCheckins.filter(c => {
    if (!c || !c.hrv) return false;
    const cDate = parseLocalDate(c.date);
    return cDate && cDate >= sevenDaysAgo && cDate <= today;
  });

  const hrvValues = inLast7.map(c => Number(c.hrv)).filter(v => v > 0);
  let avgHrv = 70;

  if (hrvValues.length >= 3) {
    avgHrv = hrvValues.reduce((sum, v) => sum + v, 0) / hrvValues.length;
  } else if (hrvValues.length === 2) {
    avgHrv = (hrvValues[0] + hrvValues[1]) / 2;
  } else if (hrvValues.length === 1) {
    avgHrv = hrvValues[0];
  }

  let score = 100;

  // HRV (50% веса в штрафах)
  if (hrv > 0) {
    const ratio = hrv / (avgHrv || 70);
    if (ratio >= 1.1) score -= 0;
    else if (ratio >= 0.9) score -= 10;
    else if (ratio >= 0.7) score -= 25;
    else score -= 40;
  }

  // Сон (30% веса)
  if (sleep > 0) {
    if (sleep >= 8) score -= 0;
    else if (sleep >= 7) score -= 10;
    else if (sleep >= 6) score -= 25;
    else score -= 40;
  }

  // Пульс покоя (20% веса)
  if (hr > 0) {
    if (hr <= 63) score -= 0;
    else if (hr <= 70) score -= 10;
    else if (hr <= 76) score -= 20;
    else score -= 35;
  }

  // Штрафы за боль
  if (hip >= 5 || sh >= 5) score -= 20;
  else if (hip >= 3 || sh >= 3) score -= 10;

  // Штрафы за дыхание
  if (breath === 'bad') score -= 20;
  else if (breath === 'mild') score -= 10;

  // Штрафы за мышечную болезненность
  if (soreness >= 4) score -= 15;
  else if (soreness >= 3) score -= 8;

  // Штрафы за низкую энергию
  if (energy > 0 && energy <= 2) score -= 15;
  else if (energy > 0 && energy <= 3) score -= 5;

  // Штрафы за настроение
  if (mood > 0 && mood <= 2) score -= 10;
  else if (mood > 0 && mood <= 3) score -= 5;

  // Штрафы за качество сна
  if (sleepQ > 0 && sleepQ <= 2) score -= 10;
  else if (sleepQ > 0 && sleepQ <= 3) score -= 5;

  // Штрафы за стресс
  if (stress >= 5) score -= 15;
  else if (stress >= 4) score -= 8;

  return Math.max(0, Math.min(100, score));
}

/* =================================================================
 * 2. НЕДЕЛЬНАЯ / МЕСЯЧНАЯ СТАТИСТИКА
 * ================================================================= */

/**
 * Формирует недельный итог по массиву сессий.
 * @param {Array<Object>} sessions — массив сессий
 * @param {Array<Object>} checkins — массив чек-инов (не используется, оставлен для API-совместимости)
 * @param {string|Date} today — ISO-дата или объект Date
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
 * @param {Array<Object>} sessions — массив сессий
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

/* =================================================================
 * 3. ОПРЕДЕЛЕНИЕ ТРЕНИРОВКИ ПО ДАТЕ
 * ================================================================= */

/**
 * Определяет тип тренировки (A/B/C) на основе дня недели и расписания.
 * @param {Date} date
 * @param {number[]} trainDays — массив дней недели (1=Пн … 0=Вс), отсортированный
 * @returns {string|null} 'A', 'B', 'C' или null для отдыха
 */
export function getWorkoutType(date, trainDays) {
  const dow = date.getDay();
  const sorted = trainDays.slice().sort((a, b) => a - b);
  const idx = sorted.indexOf(dow);
  if (idx < 0) return null;
  return TRAIN_ORDER[idx % TRAIN_ORDER.length];
}

/**
 * Маппит номер недели и тип тренировки на объект месяца и индекс дня.
 * @param {number} weekNumber — 1–12
 * @param {string|null} trainType — 'A'|'B'|'C'|null
 * @returns {{ month: Object|null, dayIndex: number|null }}
 */
export function getMonthAndDayIndex(weekNumber, trainType) {
  if (!weekNumber || !trainType) return { month: null, dayIndex: null };

  const monthIndex = weekNumber <= 4 ? 0 : weekNumber <= 8 ? 1 : 2;
  const month = MONTHS[monthIndex];
  if (!month) return { month: null, dayIndex: null };

  let dayIndex;
  if (trainType === 'A') dayIndex = 0;       // ПН
  else if (trainType === 'B') dayIndex = 2;  // СР
  else dayIndex = 4;                          // ПТ

  return { month, dayIndex };
}

/* =================================================================
 * 4. МНОЖИТЕЛИ НАГРУЗКИ (АВТОРЕГУЛЯЦИЯ)
 * ================================================================= */

/**
 * Недельный множитель на основе сводки за прошлую неделю.
 * Применяется только в начале недели (по умолчанию ПН = день 1).
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
 * Сравнивает два последних теста, даёт 1.2 при росте, 0.8 при снижении.
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

/* =================================================================
 * 5. КОРРЕКТИРОВКА УПРАЖНЕНИЙ
 * ================================================================= */

/**
 * Умножает числовые значения в строках повторений (поле r) на множитель.
 * Работает с полем `r` (строка вида "6-8", "10" или "10–12").
 * @param {Array<Object>} exercises
 * @param {number} multiplier
 * @returns {Array<Object>}
 */
export function applyMultiplierToExercises(exercises, multiplier) {
  if (multiplier === 1.0) return exercises;

  return exercises.map(ex => {
    if (!ex.r || ex.isTest) return ex;

    // ищем первое число в строке
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
 * Работает с полем `r`.
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
 * @param {Array<Object>} exercises — { n, s, r, isTest?, ... }
 * @param {'full'|'yellow'|'minimum'|'red'} mode
 * @returns {Array<Object>}
 */
export function adjustExercisesForMode(exercises, mode) {
  if (mode === 'red' || mode === 'minimum') {
    // Только первые 2 упражнения с ключевыми словами (мобильность / растяжка / дыхание)
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

  // full — без изменений
  return [...exercises];
}

/* =================================================================
 * 6. ПОСТРОЕНИЕ СЕССИИ
 * ================================================================= */

/**
 * Собирает тренировку из месячного плана со всеми корректировками.
 * @param {Object} month — объект месяца из MONTHS
 * @param {number} dayIndex — индекс дня (0=ПН, 2=СР, 4=ПТ)
 * @param {'green'|'yellow'|'red'} readiness
 * @param {boolean} debt — флаг усталости
 * @param {number} multiplier — итоговый множитель (weekly * test)
 * @param {Object|null} apreSession — последняя сессия того же типа для APRE
 * @returns {Object|null} { label, exercises, mode, monthColor, ...dayPlan }
 */
export function buildSessionFromMonth(month, dayIndex, readiness, debt, multiplier = 1.0, apreSession = null) {
  if (!month) return null;

  const dayPlan = month.days[dayIndex];
  if (!dayPlan) return null;

  const mode = readiness === 'red'
    ? 'minimum'
    : (readiness === 'yellow' || debt ? 'yellow' : 'full');

  let exercises = dayPlan.exercises;

  // 1) множитель
  exercises = applyMultiplierToExercises(exercises, multiplier);

  // 2) APRE (только в полном режиме)
  if (apreSession && mode === 'full') {
    exercises = applyApreAdjustment(exercises, apreSession);
  }

  // 3) корректировка под режим
  exercises = adjustExercisesForMode(exercises, mode);

  return {
    ...dayPlan,
    exercises,
    mode,
    monthColor: month.color,
  };
}

/**
 * Возвращает последнюю завершённую сессию указанного типа.
 * @param {Array<Object>} sessions
 * @param {string} type
 * @returns {Object|null}
 */
export function getLastSessionByType(sessions, type) {
  const filtered = sessions
    .filter(s => s.type === type && s.completed)
    .sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  return filtered.length ? filtered[0] : null;
}

/**
 * Добавляет тестовые упражнения в план, если сегодня тестовый день.
 * @param {Object|null} plan — результат buildSessionFromMonth
 * @param {string|null} trainType
 * @param {number} weekNumber
 * @param {('green'|'yellow'|'red')} readiness
 * @returns {Object|null} план с тестами (или без)
 */
export function maybeAddTestExercises(plan, trainType, weekNumber, readiness) {
  if (!plan) return null;

  if (trainType === 'C' && weekNumber % 2 !== 0 && readiness === 'green') {
    return {
      ...plan,
      isTestDay: true,
      exercises: [
        ...plan.exercises,
        { n: "Тест: подтягивания на максимум", s: "1", r: "макс", isTest: true, w: "Только 1 подход" },
        { n: "Тест: отжимания на максимум", s: "1", r: "макс", isTest: true, w: "Чистые повторения" },
        { n: "Тест: планка на максимум", s: "1", r: "макс (сек)", isTest: true, w: "Держать до отказа" },
      ],
    };
  }

  return plan;
}

/* =================================================================
 * 7. ДОПОЛНИТЕЛЬНЫЕ ФУНКЦИИ
 * ================================================================= */

/**
 * Генерирует советы тренера на основе Recovery Score и текущего состояния.
 * Связывает рекомендации с конкретными данными: Recovery Score, RPE и субъективные метрики.
 * @param {number} recoveryScore — 0–100
 * @param {Object} [checkin] — текущий чек-ин
 * @param {Array<Object>} [testHistory] — массив сессий с testResults
 * @param {Object} [weeklySummary] — результат getWeeklySummary
 * @returns {string[]}
 */
export function getCoachAdvice(recoveryScore, checkin = {}, testHistory = [], weeklySummary = {}) {
  const advice = [];
  const score = typeof recoveryScore === 'number' ? recoveryScore : 0;

  if (score >= 80) {
    advice.push(`Recovery Score ${score} – отлично, можно полный план`);
  } else if (score >= 60) {
    advice.push(`Recovery Score ${score} – хороший, рекомендован умеренный план`);
  } else {
    advice.push(`Recovery Score ${score} – низкий, рекомендуется лёгкий план или отдых`);
  }

  // ── Объективные метрики ──

  const sleepHours = checkin?.sleepHours;
  if (typeof sleepHours === 'number' && sleepHours > 0 && sleepHours < 7) {
    advice.push(`Сон ${sleepHours} ч – мало, постарайся лечь пораньше (нужно ≥7 ч)`);
  }

  const hrv = checkin?.hrv;
  if (typeof hrv === 'number' && hrv > 0 && hrv < 45) {
    advice.push(`HRV ${hrv} мс — ниже нормы, снизь нагрузку и добавь сон`);
  }

  const restHR = checkin?.restHR;
  if (typeof restHR === 'number' && restHR > 70) {
    advice.push(`ЧСС покоя ${restHR} уд/мин — выше нормы, возможен недовосстановление`);
  }

  const hipPain = checkin?.hipPain;
  const shoulderPain = checkin?.shoulderPain;
  if ((typeof hipPain === 'number' && hipPain >= 5) || (typeof shoulderPain === 'number' && shoulderPain >= 5)) {
    advice.push('Боль в бедре/плече ≥5 — исключи упражнения на эту область');
  }

  // ── Субъективные метрики ──

  const soreness = checkin?.muscleSoreness;
  if (typeof soreness === 'number' && soreness >= 4) {
    advice.push(`Мышечная болезненность ${soreness}/5 – высокая, добавь лёгкую растяжку и МФР`);
  } else if (typeof soreness === 'number' && soreness >= 3) {
    advice.push(`Мышечная болезненность ${soreness}/5 – умеренная, разомнись перед тренировкой`);
  }

  const energy = checkin?.energy;
  if (typeof energy === 'number' && energy > 0 && energy <= 2) {
    advice.push(`Энергия ${energy}/5 – низкая, рекомендуется снизить нагрузку на 10–15%`);
  } else if (typeof energy === 'number' && energy === 3) {
    advice.push(`Энергия ${energy}/5 – средняя, начни с разминки и оцени самочувствие`);
  }

  const mood = checkin?.mood;
  if (typeof mood === 'number' && mood > 0 && mood <= 2) {
    advice.push(`Настроение ${mood}/5 – низкое, лёгкая активность поможет улучшить состояние`);
  }

  const sleepQ = checkin?.sleepQuality;
  if (typeof sleepQ === 'number' && sleepQ > 0 && sleepQ <= 2) {
    advice.push(`Качество сна ${sleepQ}/5 – низкое, проверь гигиену сна (темнота, тишина, без экрана)`);
  }

  const stress = checkin?.stress;
  if (typeof stress === 'number' && stress >= 4) {
    advice.push(`Стресс ${stress}/5 – высокий, добавь box breathing (5–8 мин) и вечернюю рутину`);
  }

  if ((weeklySummary?.green ?? 0) < 3 && (weeklySummary?.green ?? 0) >= 0) {
    advice.push('На этой неделе мало зелёных дней – сосредоточься на восстановлении');
  }

  return advice;
}

/**
 * Формирует понятные объяснения для авторегуляции (APRE).
 * Показывает пользователю, что именно изменилось в плане и почему.
 * @param {'full'|'yellow'|'minimum'} mode — режим тренировки
 * @param {'green'|'yellow'|'red'} readiness
 * @param {boolean} debt — флаг накопленной усталости
 * @param {number} multiplier — итоговый множитель нагрузки
 * @param {Object|null} apreSession — последняя сессия того же типа (для RPE-коррекции)
 * @returns {string[]}
 */
export function getApreExplanation(mode, readiness, debt, multiplier = 1.0, apreSession = null) {
  const reasons = [];

  // Режим тренировки
  if (mode === 'minimum') {
    reasons.push('🔴 Режим «Минимальный»: только восстановительные упражнения (мобильность, растяжка, дыхание). Причина: красный readiness.');
  } else if (mode === 'yellow') {
    const cause = readiness === 'yellow'
      ? 'жёлтый readiness — организм не完全 восстановился'
      : 'накопленная усталость (recovery debt) за последние 3 дня';
    reasons.push(`🟡 Режим «Облегчённый»: подходов уменьшено на 1. Причина: ${cause}.`);
  } else {
    reasons.push('🟢 Полный режим: готовность зелёная, признаков усталости нет.');
  }

  // Множитель
  if (multiplier > 1.05) {
    reasons.push(`📈 Множитель нагрузки ×${multiplier.toFixed(1)}: отличные результаты прошлой недели — повторения увеличены.`);
  } else if (multiplier < 0.95) {
    reasons.push(`📉 Множитель нагрузки ×${multiplier.toFixed(1)}: тяжёлая неделя — повторения снижены для профилактики.`);
  }

  // APRE (коррекция по RPE последней тренировки того же типа)
  if (apreSession && mode === 'full') {
    const rpe = Number(apreSession.rpe);
    if (rpe <= 4 && rpe > 0) {
      reasons.push(`🔄 APRE: RPE последней тренировки ${rpe} (легко) → +1 повтор к упражнениям.`);
    } else if (rpe >= 8) {
      reasons.push(`🔄 APRE: RPE последней тренировки ${rpe} (тяжело) → −1 повтор к упражнениям.`);
    } else if (rpe > 0) {
      reasons.push(`🔄 APRE: RPE последней тренировки ${rpe} — оптимальная нагрузка, изменений не требуется.`);
    }
  }

  return reasons;
}
