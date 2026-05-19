// js/core/planning.js
// Определение тренировки по дате и построение сессии

import { MONTHS, TRAIN_ORDER } from '../config/constants.js';
import { parseLocalDate, formatISO, addDays } from './helpers.js';
import { applyMultiplierToExercises, applyApreAdjustment, adjustExercisesForMode } from './loadAdjustments.js';

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
  if (trainType === 'A') dayIndex = 0;
  else if (trainType === 'B') dayIndex = 2;
  else dayIndex = 4;

  return { month, dayIndex };
}

/**
 * Собирает тренировку из месячного плана со всеми корректировками.
 * @param {Object} month — объект месяца из MONTHS
 * @param {number} dayIndex — индекс дня (0=ПН, 2=СР, 4=ПТ)
 * @param {'green'|'yellow'|'red'} readiness
 * @param {boolean} debt — флаг усталости
 * @param {number} multiplier — итоговый множитель (weekly * test)
 * @param {Object|null} apreSession — последняя сессия того же типа для APRE
 * @returns {Object|null}
 */
export function buildSessionFromMonth(month, dayIndex, readiness, debt, multiplier = 1.0, apreSession = null) {
  if (!month) return null;

  const dayPlan = month.days[dayIndex];
  if (!dayPlan) return null;

  const mode = readiness === 'red'
    ? 'minimum'
    : (readiness === 'yellow' || debt ? 'yellow' : 'full');

  let exercises = dayPlan.exercises;

  exercises = applyMultiplierToExercises(exercises, multiplier);

  if (apreSession && mode === 'full') {
    exercises = applyApreAdjustment(exercises, apreSession);
  }

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
 * @returns {Object|null}
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
