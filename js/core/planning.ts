// js/core/planning.js
// Определение тренировки по дате и построение сессии

import { MONTHS, TRAIN_ORDER } from '../config/constants.js';
import type { Session, ReadinessStatus, SessionPlan } from './types.js';
import { applyMultiplierToExercises, applyApreAdjustment, adjustExercisesForMode } from './loadAdjustments.js';
import { annotateExercisesWithApre } from './apre/engine.js';

type WorkoutType = 'A' | 'B' | 'C';

/**
 * Определяет тип тренировки (A/B/C) на основе дня недели и расписания.
 * @param date
 * @param trainDays — массив дней недели (1=Пн … 0=Вс), отсортированный
 * @returns 'A', 'B', 'C' или null для отдыха
 */
export function getWorkoutType(date: Date, trainDays: number[]): WorkoutType | null {
  const dow = date.getDay();
  const sorted = trainDays.slice().sort((a, b) => a - b);
  const idx = sorted.indexOf(dow);
  if (idx < 0) return null;
  return TRAIN_ORDER[idx % TRAIN_ORDER.length] as WorkoutType;
}

/**
 * Маппит номер недели и тип тренировки на объект месяца и индекс дня.
 * @param {number} weekNumber — 1–12
 * @param {string|null} trainType — 'A'|'B'|'C'|null
 * @returns {{ month: Object|null, dayIndex: number|null }}
 */
export function getMonthAndDayIndex(weekNumber: number, trainType: WorkoutType | null): { month: any; dayIndex: number | null } {
  if (!weekNumber || !trainType) return { month: null, dayIndex: null };

  const monthIndex = weekNumber <= 4 ? 0 : weekNumber <= 8 ? 1 : 2;
  const month = MONTHS[monthIndex];
  if (!month) return { month: null, dayIndex: null };

  let dayIndex: number;
  if (trainType === 'A') dayIndex = 0;
  else if (trainType === 'B') dayIndex = 2;
  else dayIndex = 4;

  return { month, dayIndex };
}

/**
 * Собирает тренировку из месячного плана со всеми корректировками.
 * Каждая 4-я неделя (4, 8, 12) — разгрузочная (deload) с пониженной нагрузкой.
 */
export function buildSessionFromMonth(
  month: any,
  dayIndex: number | null,
  readiness: ReadinessStatus,
  debt: boolean,
  multiplier = 1.0,
  apreSession: Session | null = null,
  weekNumber = 1
): SessionPlan | null {
  if (!month || dayIndex === null) return null;

  const dayPlan = month.days[dayIndex];
  if (!dayPlan) return null;

  // Deload week: every 4th week overrides other modes
  const isDeloadWeek = weekNumber > 0 && weekNumber % 4 === 0;
  const mode: import('./types.js').SessionMode = isDeloadWeek
    ? 'deload'
    : readiness === 'red'
      ? 'minimum'
      : (readiness === 'yellow' || debt ? 'yellow' : 'full');

  let exercises = dayPlan.exercises;

  exercises = applyMultiplierToExercises(exercises, multiplier);

  if (apreSession && (mode === 'full' || mode === 'deload')) {
    exercises = applyApreAdjustment(exercises, apreSession);
  }

  exercises = adjustExercisesForMode(exercises, mode);

  // Аннотируем силовые упражнения APRE-метаданными.
  // В режиме minimum/yellow/deload тоже аннотируем (UI-карточка сама снизит нагрузку через recoveryScore).
  const prevApreResults = apreSession?.apreResults ?? [];
  exercises = annotateExercisesWithApre(exercises, prevApreResults);

  return {
    ...dayPlan,
    exercises,
    mode,
    monthColor: month.color,
    isDeload: isDeloadWeek,
  };
}

/**
 * Возвращает последнюю завершённую сессию указанного типа.
 */
export function getLastSessionByType(sessions: Session[], type: string): Session | null {
  const filtered = sessions
    .filter(s => s.type === type && s.completed)
    .sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  return filtered.length ? filtered[0] : null;
}

/**
 * Добавляет тестовые упражнения в план, если сегодня тестовый день.
 */
export function maybeAddTestExercises(plan: SessionPlan | null, trainType: WorkoutType, weekNumber: number, readiness: ReadinessStatus): SessionPlan | null {
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
