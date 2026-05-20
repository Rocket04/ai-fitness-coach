// js/config/tooltips.js
// Tooltip content registry for inline help system
// All content uses i18n keys for translation support

/**
 * @typedef {Object} TooltipDefinition
 * @property {string} term - The term/key to identify this tooltip
 * @property {string} i18nTitle - i18n key for the title
 * @property {string} i18nDescription - i18n key for the description
 * @property {string} [icon] - Optional emoji icon
 */

/** @type {Record<string, TooltipDefinition>} */
export const TOOLTIPS = {
  // Recovery & Readiness
  recoveryScore: {
    term: 'Recovery Score',
    i18nTitle: 'tooltips.recoveryScore.title',
    i18nDescription: 'tooltips.recoveryScore.description',
    icon: '💚',
  },
  readiness: {
    term: 'Готовность',
    i18nTitle: 'tooltips.readiness.title',
    i18nDescription: 'tooltips.readiness.description',
    icon: '📊',
  },
  hrv: {
    term: 'HRV',
    i18nTitle: 'tooltips.hrv.title',
    i18nDescription: 'tooltips.hrv.description',
    icon: '💓',
  },
  
  // Training
  apre: {
    term: 'APRE',
    i18nTitle: 'tooltips.apre.title',
    i18nDescription: 'tooltips.apre.description',
    icon: '📈',
  },
  rpe: {
    term: 'RPE',
    i18nTitle: 'tooltips.rpe.title',
    i18nDescription: 'tooltips.rpe.description',
    icon: '⚡',
  },
  deload: {
    term: 'Разгрузка',
    i18nTitle: 'tooltips.deload.title',
    i18nDescription: 'tooltips.deload.description',
    icon: '🔄',
  },
  
  // Check-in metrics
  sleepHours: {
    term: 'Сон',
    i18nTitle: 'tooltips.sleep.title',
    i18nDescription: 'tooltips.sleep.description',
    icon: '😴',
  },
  restingHR: {
    term: 'ЧСС покоя',
    i18nTitle: 'tooltips.restingHR.title',
    i18nDescription: 'tooltips.restingHR.description',
    icon: '❤️',
  },
  
  // Exercise
  exerciseCard: {
    term: 'Упражнение',
    i18nTitle: 'tooltips.exercise.title',
    i18nDescription: 'tooltips.exercise.description',
    icon: '🏋️',
  },
  
  // Trends
  sparkline: {
    term: 'Тренд',
    i18nTitle: 'tooltips.sparkline.title',
    i18nDescription: 'tooltips.sparkline.description',
    icon: '📉',
  },
  
  // Streak
  streak: {
    term: 'Серия',
    i18nTitle: 'tooltips.streak.title',
    i18nDescription: 'tooltips.streak.description',
    icon: '🔥',
  },
};

/**
 * Get tooltip definition by key
 * @param {string} key - The tooltip key
 * @returns {TooltipDefinition | undefined}
 */
export function getTooltip(key) {
  return TOOLTIPS[key];
}

/**
 * Get all tooltip keys
 * @returns {string[]}
 */
export function getTooltipKeys() {
  return Object.keys(TOOLTIPS);
}

export default TOOLTIPS;
