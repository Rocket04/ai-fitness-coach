// js/core/apre/engine.js
// APRE (Autoregulatory Progressive Resistance Exercise) вычислительный движок.
// Все функции чистые (pure), без React/Dexie-зависимостей.
// Источник методологии: Mann J.B. et al. (2010).

import { APRE_TABLES, CALISTHENICS_PROGRESSIONS } from '../../config/constants.js';

/**
 * Маппинг шагов корректировок из кг в lbs.
 * 2.5 кг → 5 lbs | 5 кг → 10 lbs | 7.5 кг → 15 lbs | 10 кг → 20 lbs
 */
const KG_TO_LBS_STEP_MAP = new Map([
  [-10,  -20],
  [-7.5, -15],
  [-5,   -10],
  [-2.5,  -5],
  [0,      0],
  [2.5,    5],
  [5,     10],
  [7.5,   15],
  [10,    20],
]);

/**
 * Конвертирует шаг корректировки из кг в lbs по стандартному маппингу.
 * Если значение не входит в маппинг — умножает на 2 как fallback.
 * @param {number} kgStep
 * @returns {number}
 */
function kgStepToLbs(kgStep) {
  if (KG_TO_LBS_STEP_MAP.has(kgStep)) {
    return KG_TO_LBS_STEP_MAP.get(kgStep);
  }
  return kgStep * 2;
}

/**
 * Находит строку корректировки из таблицы протокола по количеству повторений.
 * @param {import('../../config/constants.js').ApreProtocol} protocol
 * @param {number} actualReps
 * @returns {{ set4: number, nextWeek: number }}
 */
function findAdjustment(protocol, actualReps) {
  if (!protocol || !protocol.adjustments) {
    return { set4: 0, nextWeek: 0 };
  }
  const reps = Math.max(0, Math.floor(actualReps));
  for (const row of protocol.adjustments) {
    if (reps <= row.maxReps) {
      return { set4: row.set4, nextWeek: row.nextWeek };
    }
  }
  // fallback: последняя строка (Infinity)
  const last = protocol.adjustments[protocol.adjustments.length - 1];
  return { set4: last.set4, nextWeek: last.nextWeek };
}

/**
 * Вычисляет корректировки веса для Сета 4 и следующей недели.
 *
 * Методология Манна:
 *   - Сет 3 (AMRAP) → set4Adjust: скорректировать вес Сета 4
 *   - Сет 4 (AMRAP) → nextWeekAdjust: скорректировать currentRM для следующей недели
 *
 * @param {import('../../config/constants.js').ApreProtocolKey} protocolKey
 * @param {number} actualReps — реальные повторения AMRAP-сета
 * @param {'kg'|'lbs'} [unit='kg']
 * @returns {{ set4Adjust: number, nextWeekAdjust: number }}
 */
export function applyApre(protocolKey, actualReps, unit = 'kg') {
  const protocol = APRE_TABLES[protocolKey];
  if (!protocol) {
    return { set4Adjust: 0, nextWeekAdjust: 0 };
  }
  if (actualReps === null || actualReps === undefined || isNaN(actualReps)) {
    return { set4Adjust: 0, nextWeekAdjust: 0 };
  }

  const adj = findAdjustment(protocol, actualReps);

  if (unit === 'lbs') {
    return {
      set4Adjust: kgStepToLbs(adj.set4),
      nextWeekAdjust: kgStepToLbs(adj.nextWeek),
    };
  }

  return {
    set4Adjust: adj.set4,
    nextWeekAdjust: adj.nextWeek,
  };
}

/**
 * Округляет вес до ближайшего допустимого шага.
 * кг  → шаг 2.5
 * lbs → шаг 5
 *
 * @param {number} weight
 * @param {'kg'|'lbs'} [unit='kg']
 * @returns {number}
 */
export function roundToNearestStep(weight, unit = 'kg') {
  if (isNaN(weight) || weight === null || weight === undefined) return 0;
  const step = unit === 'lbs' ? 5 : 2.5;
  return Math.round(weight / step) * step;
}

/**
 * Вычисляет веса для всех 4 сетов APRE.
 *
 * Сет 1: 50% от effectiveRM (readonly)
 * Сет 2: 75% от effectiveRM (readonly)
 * Сет 3: 100% от effectiveRM (AMRAP — пользователь вводит actualReps)
 * Сет 4: 100% + set4Adjust на основе результата Сета 3 (AMRAP)
 *
 * Для калистеники: вместо кг используется calisthenicLevel [1, 5],
 * изменяемый через Math.max/Math.min.
 *
 * @param {object} params
 * @param {import('../../config/constants.js').ApreProtocolKey} params.protocol
 * @param {number} params.currentRM — текущий тренировочный максимум
 * @param {'kg'|'lbs'} [params.unit='kg']
 * @param {boolean} [params.isCalisthenics=false]
 * @param {number|null} [params.set3Reps=null] — повторения Сета 3 (для расчёта Сета 4)
 * @param {number} [params.recoveryScore=100] — используется для снижения effectiveRM
 * @returns {{
 *   set1: { weight: number, reps: number, readonly: true },
 *   set2: { weight: number, reps: number, readonly: true },
 *   set3: { weight: number, reps: string, readonly: false },
 *   set4: { weight: number|null, reps: string, disabled: boolean, adjustmentReason?: string },
 *   effectiveRM: number,
 *   recoveryReduction: number
 * }}
 */
export function calcApreSets({ protocol, currentRM, unit = 'kg', isCalisthenics = false, set3Reps = null, recoveryScore = 100 }) {
  const protocolDef = APRE_TABLES[protocol];
  if (!protocolDef || !currentRM || currentRM <= 0) {
    return null;
  }

  // Recovery-коррекция: только для расчёта текущей тренировки, не мутирует базовый RM
  let recoveryReduction = 0;
  let effectiveRM = currentRM;
  if (recoveryScore < 40) {
    recoveryReduction = roundToNearestStep(currentRM * 0.10, unit);
    effectiveRM = roundToNearestStep(currentRM - recoveryReduction, unit);
  }

  if (isCalisthenics) {
    const lvl = Math.max(1, Math.min(5, currentRM));
    const set4Level = set3Reps !== null
      ? Math.max(1, Math.min(5, lvl + (set3Reps >= protocolDef[75].reps ? 1 : -1)))
      : null;
    return {
      set1: { weight: lvl, reps: protocolDef[50].reps, readonly: true },
      set2: { weight: lvl, reps: protocolDef[75].reps, readonly: true },
      set3: { weight: lvl, reps: 'AMRAP', readonly: false },
      set4: {
        weight: set4Level,
        reps: 'AMRAP',
        disabled: set3Reps === null,
      },
      effectiveRM: lvl,
      recoveryReduction: 0,
    };
  }

  const set1Weight = roundToNearestStep(effectiveRM * 0.50, unit);
  const set2Weight = roundToNearestStep(effectiveRM * 0.75, unit);
  const set3Weight = effectiveRM;

  let set4Weight = null;
  let set4AdjustmentReason = '';
  if (set3Reps !== null) {
    const { set4Adjust } = applyApre(protocol, set3Reps, unit);
    set4Weight = roundToNearestStep(effectiveRM + set4Adjust, unit);
    set4Weight = Math.max(0, set4Weight);
    // Build adjustment reason annotation (e.g., "+2.5 кг (10 повт. в Сете 3)")
    if (set4Adjust !== 0) {
      const sign = set4Adjust > 0 ? '+' : '';
      const unitLabel = unit === 'lbs' ? 'lbs' : 'кг';
      set4AdjustmentReason = `(${sign}${set4Adjust} ${unitLabel} за ${set3Reps} повт.)`;
    }
  }

  return {
    set1: { weight: set1Weight, reps: protocolDef[50].reps, readonly: true },
    set2: { weight: set2Weight, reps: protocolDef[75].reps, readonly: true },
    set3: { weight: set3Weight, reps: 'AMRAP', readonly: false },
    set4: {
      weight: set4Weight,
      reps: 'AMRAP',
      disabled: set3Reps === null,
      adjustmentReason: set4AdjustmentReason,
    },
    effectiveRM,
    recoveryReduction,
  };
}

/**
 * Рассчитывает новый currentRM для следующей недели.
 * Использует результат Сета 4 (AMRAP) по методологии Манна.
 *
 * @param {import('../../config/constants.js').ApreProtocolKey} protocolKey
 * @param {number} currentRM
 * @param {number} set4Reps — реальные повторения Сета 4
 * @param {'kg'|'lbs'} [unit='kg']
 * @param {boolean} [isCalisthenics=false]
 * @returns {number} — новый RM (округлённый)
 */
export function calcNextWeekRM(protocolKey, currentRM, set4Reps, unit = 'kg', isCalisthenics = false) {
  if (isCalisthenics) {
    const lvl = Math.max(1, Math.min(5, currentRM));
    const { nextWeekAdjust } = applyApre(protocolKey, set4Reps, unit);
    return Math.max(1, Math.min(5, lvl + (nextWeekAdjust > 0 ? 1 : nextWeekAdjust < 0 ? -1 : 0)));
  }
  const { nextWeekAdjust } = applyApre(protocolKey, set4Reps, unit);
  return Math.max(0, roundToNearestStep(currentRM + nextWeekAdjust, unit));
}

/**
 * Определяет подходящий протокол APRE для упражнения по названию.
 * Алгоритм: упражнения с «максимум» / «тест» → исключить; силовые с 3-5 повторений → APRE_3;
 * 6-8 → APRE_6; 9+ → APRE_10; калистеника по умолчанию → APRE_6.
 *
 * @param {string} exerciseName
 * @param {string} repsStr — строка повторений из плана (ex.r)
 * @returns {import('../../config/constants.js').ApreProtocolKey}
 */
export function inferApreProtocol(exerciseName, repsStr) {
  const match = (repsStr || '').match(/^(\d+)/);
  if (!match) return 'APRE_6';
  const reps = parseInt(match[1], 10);
  if (reps <= 5) return 'APRE_3';
  if (reps <= 8) return 'APRE_6';
  return 'APRE_10';
}

/**
 * Определяет, является ли упражнение силовым (подходящим для APRE).
 * Исключает: бег, ходьбу, разминку, заминку, мобильность, растяжку,
 * дыхание, тестовые упражнения, отдых, планку (изометрия, не счетные повторения).
 *
 * @param {{ n: string, r: string, s: string, isTest?: boolean }} ex
 * @returns {boolean}
 */
export function isStrengthExercise(ex) {
  if (!ex || !ex.n) return false;
  if (ex.isTest) return false;

  const name = ex.n.toLowerCase();
  const reps = (ex.r || '').toLowerCase();

  // Исключаемые паттерны
  const excluded = [
    'бег', 'ходьба', 'ход', 'разминка', 'заминка', 'прогулка',
    'мобильн', 'растяж', 'дыхан', 'breathing', 'box breath',
    'отдых', 'восстановлен', 'mobility', 'stretch',
    'zone 1', 'zone 2', 'zone 3', 'z1', 'z2', 'z3', 'интервал',
    'пробежка', 'фартлек бег', 'темповый бег',
    'планка', 'hollow body', 'arch rock', 'bird-dog', 'dead bug',
    'wall slide', 'мфр', 'pigeon', 'clamshell',
  ];
  if (excluded.some(kw => name.includes(kw))) return false;

  // Упражнения с «сек» / «мин» / «мин» в повторениях — изометрия/кардио
  if (/сек|мин|bpm|мс|zone/i.test(reps)) return false;

  // Должны быть числовые повторения
  if (!/\d/.test(reps)) return false;

  // Сетов должно быть минимум 2 (исключаем одиночные подходы)
  const setsNum = parseInt(ex.s, 10);
  if (isNaN(setsNum) || setsNum < 2) return false;

  return true;
}

/**
 * Помечает подходящие силовые упражнения из плана как APRE.
 * Не мутирует исходный массив; возвращает новый.
 * Загружает APRE-данные из последней завершённой сессии (previousApreResults),
 * если они доступны.
 *
 * @param {Array<import('../../core/types.js').Exercise>} exercises
 * @param {import('../../core/types.js').ApreExerciseResult[]} [previousApreResults=[]]
 * @returns {Array<import('../../core/types.js').Exercise>}
 */
export function annotateExercisesWithApre(exercises, previousApreResults = []) {
  if (!exercises) return [];

  return exercises.map(ex => {
    if (!isStrengthExercise(ex)) return ex;

    // Ищем предыдущий результат для этого упражнения
    const prev = previousApreResults.find(r => r.exerciseName === ex.n);

    const protocol = inferApreProtocol(ex.n, ex.r);
    const defaultLevel = 2; // Medium — стартовый уровень калистеники

    return {
      ...ex,
      isApre: true,
      protocol,
      isCalisthenics: true, // в текущем плане — только калистеника
      unit: 'kg',
      currentRM: prev ? prev.nextRM : defaultLevel,
      calisthenicLevel: prev ? (prev.calisthenicLevel ?? defaultLevel) : defaultLevel,
    };
  });
}

export { CALISTHENICS_PROGRESSIONS };
