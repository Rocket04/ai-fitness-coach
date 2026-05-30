// js/core/sessionLoad.ts
// Расчёт тренировочной нагрузки по методу Фостера

/**
 * Рассчитывает тренировочную нагрузку сессии по методу Фостера (2001).
 * sessionLoad = rpe × durationMinutes.
 */
export function calculateSessionLoad(rpe: number, durationMinutes = 45): number {
  return Math.round(Number(rpe || 0) * Math.max(0, Number(durationMinutes) || 45));
}
