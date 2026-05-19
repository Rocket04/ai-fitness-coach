// js/core/sessionLoad.js
// Расчёт тренировочной нагрузки по методу Фостера

/**
 * Рассчитывает тренировочную нагрузку сессии по методу Фостера (2001).
 * sessionLoad = rpe × durationMinutes.
 * @param {number} rpe — субъективная интенсивность 0–10
 * @param {number} [durationMinutes=45]
 * @returns {number}
 */
export function calculateSessionLoad(rpe, durationMinutes = 45) {
  return Math.round(Number(rpe || 0) * Math.max(0, Number(durationMinutes) || 45));
}
