// core/engine.js
import ACHIEVEMENTS from '../config/achievements.js';
import MONTHS from '../config/constants.js';

/**
 * Определяет готовность (readiness) на основе показателей чек‑ина.
 * @param {Object} checkin - объект чек‑ина с полями sleepHours, restHR, hrv, hipPain, shoulderPain, breathing.
 * @returns {'green'|'yellow'|'red'}
 */
export function calcReadiness(checkin) {
  const { sleepHours, restHR, hrv, hipPain, shoulderPain, breathing } = checkin;
  let score = 0;

  // сон
  if (sleepHours <= 6.5) score += 2;
  else if (sleepHours === 7) score += 1;

  // HRV
  if (hrv <= 40) score += 2;
  else if (hrv === 55) score += 1;

  // пульс покоя
  if (restHR >= 76) score += 2;
  else if (restHR === 71) score += 1;

  // боль (боль в бедре или плече)
  const pain = Math.max(hipPain || 0, shoulderPain || 0);
  if (pain >= 3) score += 1;
  if (pain >= 5) score += 2;

  // дыхание
  if (breathing === 'mild') score += 1;
  else if (breathing === 'bad') score += 2;

  if (score >= 4) return 'red';
  if (score >= 2) return 'yellow';
  return 'green';
}

/**
 * Определяет наличие накопленной усталости (recovery debt) по трём последним чекинам.
 * @param {Array<Object>} recentCheckins - массив из 3 последних чекинов (самый первый – самый свежий).
 * @returns {boolean} true если долг восстановления >= 4 баллов.
 */
export function detectRecoveryDebt(recentCheckins) {
  let total = 0;
  for (const c of recentCheckins) {
    const { sleepHours, restHR, hrv, hipPain, shoulderPain, breathing } = c;
    // сон
    if (sleepHours <= 6.5) total += 2;
    else if (sleepHours === 7) total += 1;
    // HRV
    if (hrv <= 40) total += 2;
    else if (hrv === 55) total += 1;
    // пульс
    if (restHR >= 76) total += 2;
    else if (restHR === 71) total += 1;
    // боль
    const pain = Math.max(hipHR || 0, shoulderPain || 0);
    if (pain >= 3) total += 1;
    if (pain >= 5) total += 2;
    // дыхание
    if (breathing === 'mild') total += 1;
    else if (breathing === 'bad') total += 2;
  }
  return total >= 4;
}

/**
 * Вычисляет восстановительный балл (0‑100) на основе HRV, сна, пульса и штрафов за боль/дыхание.
 * @param {Object} checkin - текущий чек‑ин.
 * @param {Array<Object>} allCheckins - массив всех чекинов (для расчёта 7‑дневного среднего HRV).
 * @returns {number} балл от 0 до 100.
 */
export function calculateRecoveryScore(checkin, allCheckins) {
  const { hrv, sleepHours, qualityOfSleep, restHR, hipPain, shoulderPain, breathing } = checkin;

  // ----- HRV (50%) -----
  const recentHRV = allCheckins
    .slice(-7)
    .map(c => c.hrv)
    .filter(v => typeof v === 'number');
  const avgHRV = recentHRV.length ? recentHRV.reduce((a, b) => a + b, 0) / recentHRV.length : hrv;
  let hrvScore = (hrv / avgHRV) * 100;
  hrvScore = Math.min(Math.max(hrvScore, 0), 100); // clamp

  // ----- Сон (30%) -----
  const idealSleep = 8;
  let sleepScore = (sleepHours / idealSleep) * 100;
  if (qualityOfSleep !== undefined) {
    // предполагаем qualityOfSleep по шкале 0‑10
    sleepScore *= (qualityOfSleep / 10);
  }
  sleepScore = Math.min(Math.max(sleepScore, 0), 100);

  // ----- Пульс покоя (20%) -----
  const idealHR = 60; // идеальный пульс
  let hrScore = (idealHR / restHR) * 100;
  hrScore = Math.min(Math.max(hrScore, 0), 100);

  // Итоговый балл до штрафов
  let score = hrvScore * 0.5 + sleepScore * 0.3 + hrScore * 0.2;

  // ----- Штрафы за боль и дыхание -----
  const pain = Math.max(hipPain || 0, shoulderPain || 0);
  score -= pain * 5; // каждое очко боли уменьшает на 5
  if (breathing === 'mild') score -= 10;
  else if (breathing === 'bad') score -= 20;

  return Math.min(Math.max(Math.round(score), 0), 100);
}

/**
 * Формирует недельный итог по тренировкам и чекинам.
 * @param {Array<Object>} sessions - массив сессий.
 * @param {Array<Object>} checkins - массив чекинов.
 * @param {string|Date} today - текущая дата (ISO строка или Date).
 * @returns {Object} {completed, avgRPE, green, yellow, red, dominantStatus}
 */
export function getWeeklySummary(sessions, checkins, today) {
  const todayDate = typeof today === 'string' ? new Date(today) : today;
  const weekStart = new Date(todayDate);
  weekStart.setDate(todayDate.getDate() - 6); // включительно 7 дней

  const inWeek = (item) => {
    const d = typeof item.date === 'string' ? new Date(item.date) : item.date;
    return d >= weekStart && d <= todayDate;
  };

  const weekSessions = sessions.filter(inWeek);
  const weekCheckins = checkins.filter(inWeek);

  const completed = weekSessions.filter(s => s.completed).length;
  const rpeValues = weekSessions
    .filter(s => s.completed && typeof s.rpe === 'number')
    .map(s => s.rpe);
  const avgRPE = rpeValues.length
    ? rpeValues.reduce((a, b) => a + b, 0) / rpeValues.length
    : 0;

  const statusCounts = { green: 0, yellow: 0, red: 0 };
  weekCheckins.forEach(c => {
    const readiness = c.readiness || calcReadiness(c);
    if (readiness in statusCounts) statusCounts[readiness]++;
  });

  let dominantStatus = 'green';
  let maxCount = -1;
  for (const [key, val] of Object.entries(statusCounts)) {
    if (val > maxCount) {
      maxCount = val;
      dominantStatus = key;
    }
  }

  return {
    completed,
    avgRPE: Number(avgRPE.toFixed(1)),
    green: statusCounts.green,
    yellow: statusCounts.yellow,
    red: statusCounts.red,
    dominantStatus
  };
}

/**
 * Генерирует советы тренера на основе восстановления, чек‑ина, истории тестов и недельного итога.
 * @param {number} recoveryScore - балл восстановления 0‑100.
 * @param {Object} checkin - текущий чек‑ин.
 * @param {Array<Object>} testHistory - массив сессий с testResults.
 * @param {Object} weeklySummary - результат getWeeklySummary.
 * @returns {Array<string>} советы на русском языке.
 */
export function getCoachAdvice(recoveryScore, checkin, testHistory, weeklySummary) {
  const advice = [];

  // Совет по восстановлению
  if (recoveryScore >= 80) {
    advice.push(`Recovery Score ${recoveryScore} – отлично, полный план`);
  } else if (recoveryScore >= 60) {
    advice.push(`Recovery Score ${recoveryScore} – хороший, можно умеренный план`);
  } else {
    advice.push(`Recovery Score ${recoveryScore} – низкий, рекомендуется лёгкий план или отдых`);
  }

  // Совет по сну
  if (checkin.sleepHours < 7) {
    advice.push(`Ты спал всего ${checkin.sleepHours} ч – постарайся лечь сегодня пораньше`);
  }

  // Совет по HRV (сравнение с 7‑дневным средним, если есть история)
  if (testHistory.length >= 2) {
    const recentHRV = testHistory.slice(-2).map(s => s.testResults?.hrv).filter(v => typeof v === 'number');
    if (recentHRV.length === 2) {
      const [prev, cur] = recentHRV;
      if (cur < prev * 0.9) {
        advice.push(`HRV упал – обрати внимание на восстановление`);
      }
    }
  }

  // Совет по недельной динамике готовности
  if (weeklySummary.green < 3) {
    advice.push(`На этой неделе мало зелёных дней – сосредоточься на восстановлении`);
  }

  return advice;
}

/**
 * Корректирует список упражнений в зависимости от режима тренировки.
 * @param {Array<Object>} exercises - массив упражнений {name, sets, reps?, isTest?}.
 * @param {'full'|'yellow'|'minimum'} mode - режим тренировки.
 * @returns {Array<Object>} новый массив упражнений.
 */
export function adjustExercisesForMode(exercises, mode) {
  if (mode === 'minimum' || mode === 'red') {
    // Оставляем только первые два упражнения (мобильность/дыхание)
    return exercises.slice(0, 2);
  }
  if (mode === 'yellow') {
    return exercises.map(ex => ({
      ...ex,
      sets: ex.sets > 1 ? ex.sets - 1 : ex.sets
    }));
  }
  // full – без изменений
  return [...exercises];
}

/**
 * Умножает числовые значения в строках повторов на заданный множитель.
 * @param {Array<Object>} exercises - массив упражнений с полем reps (строка вида "6-8" или "10").
 * @param {number} multiplier - множитель (например 1.1).
 * @returns {Array<Object>} новый массив с обновлёнными повторениями.
 */
export function applyMultiplierToExercises(exercises, multiplier) {
  return exercises.map(ex => {
    if (!ex.reps) return ex;
    const match = ex.reps.match(/^(\d+)-(\d+)$/);
    if (match) {
      const low = Math.round(parseInt(match[1], 10) * multiplier);
      const high = Math.round(parseInt(match[2], 10) * multiplier);
      return { ...ex, reps: `${Math.max(low, 1)}-${Math.max(high, 1)}` };
    }
    const single = ex.reps.match(/^(\d+)$/);
    if (single) {
      const val = Math.round(parseInt(single[1], 10) * multiplier);
      return { ...ex, reps: `${Math.max(val, 1)}` };
    }
    return ex;
  });
}

/**
 * Корректирует повторения на основе RPE последней сессии того же типа (APRE‑подобная логика).
 * @param {Array<Object>} exercises - массив упражнений.
 * @param {Object} lastSession - последняя сессия {rpe, type?}.
 * @returns {Array<Object>} новый массив упражнений.
 */
export function applyApreAdjustment(exercises, lastSession) {
  const rpe = lastSession?.rpe;
  if (typeof rpe !== 'number') return exercises;

  return exercises.map(ex => {
    // Не трогаем тестовые упражнения
    if (ex.isTest) return ex;

    let reps = ex.reps;
    const rangeMatch = reps.match(/^(\d+)-(\d+)$/);
    if (rangeMatch) {
      let low = parseInt(rangeMatch[1], 10);
      let high = parseInt(rangeMatch[2], 10);
      if (rpe === 4) {
        low += 1;
        high += 1;
      } else if (rpe === 8) {
        low = Math.max(low - 1, 2);
        high = Math.max(high - 1, 2);
      }
      return { ...ex, reps: `${low}-${high}` };
    }
    const singleMatch = reps.match(/^(\d+)$/);
    if (singleMatch) {
      let val = parseInt(singleMatch[1], 10);
      if (rpe === 4) val += 1;
      else if (rpe === 8) val = Math.max(val - 1, 2);
      return { ...ex, reps: `${val}` };
    }
    return ex;
  });
}

/**
 * Возвращает множитель теста на основе прогресса в двух последних тестах.
 * @param {Array<Object>} sessions - массив сессий (с testResults).
 * @param {number} currentWeek - номер текущей недели (не используется в расчёте, оставлен для сигнатуры).
 * @returns {number} 1.2, 0.8 или 1.0.
 */
export function getTestMultiplier(sessions, currentWeek) {
  const testSessions = sessions
    .filter(s => s.testResults)
    .sort((a, b) => new Date(b.date) - new Date(a.date)) // newest first
    .slice(0, 2);

  if (testSessions.length < 2) return 1.0;

  const latest = testSessions[0].testResults;
  const previous = testSessions[1].testResults;

  const improvements = [];
  if (typeof latest.pullUps === 'number' && typeof previous.pullUps === 'number')
    improvements.push(latest.pullUps - previous.pullUps);
  if (typeof latest.pushUps === 'number' && typeof previous.pushUps === 'number')
    improvements.push(latest.pushUps - previous.pushUps);
  if (typeof latest.plankSec === 'number' && typeof previous.plankSec === 'number')
    improvements.push(latest.plankSec - previous.plankSec);

  if (improvements.length === 0) return 1.0;
  const avgImprovement = improvements.reduce((a, b) => a + b, 0) / improvements.length;

  if (avgImprovement >= 2) return 1.2;
  if (avgImprovement <= -2) return 0.8;
  return 1.0;
}

/**
 * Собирает тренировку на основе месячного плана, применяя все корректировки.
 * @param {number} monthIndex - индекс месяца в массиве MONTHS.
 * @param {number} dayIndex - индекс дня внутри недели месяца.
 * @param {'green'|'yellow'|'red'} readiness - текущая готовность.
 * @param {boolean} debt - флаг накопленной усталости.
 * @param {number} multiplier - множитель, полученный от getTestMultiplier.
 * @param {Object} apreSession - последняя сессия того же типа (для APRE‑корректировки).
 * @returns {Array<Object>} итоговый список упражнений.
 */
export function buildSessionFromMonth(monthIndex, dayIndex, readiness, debt, multiplier, apreSession) {
  const month = MONTHS[monthIndex];
  if (!month) return [];

  // Предполагаем структуру: month.weeks[weekIndex].days[dayIndex].exercises
  // weekIndex вычисляем как floor(dayIndex / 7) внутри месяца
  const weekIndex = Math.floor(dayIndex / 7);
  const dayInWeek = dayIndex % 7;
  const week = month.weeks?.[weekIndex];
  if (!week) return [];
  const day = week.days?.[dayInWeek];
  if (!day || !day.exercises) return [];

  let exercises = [...day.exercises]; // копируем

  // 1) применяем множитель теста
  exercises = applyMultiplierToExercises(exercises, multiplier);

  // 2) применяем APRE‑корректировку на основе последней сессии
  exercises = applyApreAdjustment(exercises, apreSession);

  // 3) определяем режим тренировки
  let mode = 'full';
  if (readiness === 'red' || debt) {
    mode = 'minimum';
  } else if (readiness === 'yellow') {
    mode = 'yellow';
  }

  // 4) корректируем упражнения под режим
  exercises = adjustExercisesForMode(exercises, mode);

  return exercises;
}

/**
 * Проверяет, какие достижения были разблокированы на основе сессий и чекинов.
 * @param {Array<Object>} sessions - массив сессий.
 * @param {Array<Object>} checkins - массив чекинов.
 * @returns {Array<string>} массив ключей newly unlocked достижений.
 */
export function checkAchievements(sessions, checkins) {
  const newlyUnlocked = [];

  for const achievement of ACHIEVEMENTS) {
    // Предполагаем, что каждый achievement имеет поле key и функцию test(sessions, checkins) => boolean
    if (achievement.test && achievement.test(sessions, checkins)) {
      newlyUnlocked.push(achievement.key);
    }
  }

  return newlyUnlocked;
}
