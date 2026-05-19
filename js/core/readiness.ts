// js/core/readiness.ts
// Готовность (readiness) и детекция recovery debt

import { SUBJECTIVE_THRESHOLDS } from '../config/constants.js';
import type { Checkin, ReadinessStatus, ManualStatus } from './types.js';

/**
 * Определяет готовность (readiness) на основе показателей чек-ина.
 * Пороговая логика: red если хотя бы один критический порог превышен.
 */
export function calcReadiness(checkin: Checkin): ReadinessStatus {
  const sleep = Number(checkin.sleepHours || 0);
  const hr = Number(checkin.restHR || 0);
  const hrv = Number(checkin.hrv || 0);
  const hip = Number(checkin.hipPain || 0);
  const sh = Number(checkin.shoulderPain || 0);
  const breath = checkin.breathing || 'ok';

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
    soreness > SUBJECTIVE_THRESHOLDS.muscleSorenessHigh ||
    (energy > 0 && energy < SUBJECTIVE_THRESHOLDS.energyLow) ||
    (mood > 0 && mood < SUBJECTIVE_THRESHOLDS.moodLow) ||
    (sleepQ > 0 && sleepQ < SUBJECTIVE_THRESHOLDS.sleepQualityLow) ||
    stress > SUBJECTIVE_THRESHOLDS.stressHigh;

  const yellow =
    (sleep > 0 && sleep < 7) ||
    (hr > 0 && hr >= 71) ||
    (hrv > 0 && hrv < 55) ||
    hip >= 3 || sh >= 3 ||
    breath !== 'good' ||
    soreness >= SUBJECTIVE_THRESHOLDS.muscleSorenessHigh ||
    (energy > 0 && energy <= SUBJECTIVE_THRESHOLDS.energyLow) ||
    (mood > 0 && mood <= SUBJECTIVE_THRESHOLDS.moodLow) ||
    (sleepQ > 0 && sleepQ <= SUBJECTIVE_THRESHOLDS.sleepQualityLow) ||
    stress >= SUBJECTIVE_THRESHOLDS.stressHigh;

  if (red) return 'red';
  if (yellow) return 'yellow';
  return 'green';
}

/**
 * Учитывает ручной override готовности.
 */
export function getEffectiveReadiness(autoReadiness: ReadinessStatus, manualStatus: ManualStatus): ReadinessStatus {
  if (manualStatus === 'unknown') return autoReadiness;
  return manualStatus;
}

/**
 * Определяет накопленную усталость (recovery debt) по трём последним чекинам.
 */
export function detectRecoveryDebt(recentCheckins: (Checkin | null)[]): boolean {
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

    const soreness = Number(d.muscleSoreness || 0);
    const energy = Number(d.energy || 0);
    const mood = Number(d.mood || 0);
    const sleepQ = Number(d.sleepQuality || 0);
    const stress = Number(d.stress || 0);

    if (sleep > 0 && sleep < 6.5) points += 2;
    else if (sleep > 0 && sleep < 7) points += 1;

    if (hrv > 0 && hrv < 40) points += 2;
    else if (hrv > 0 && hrv < 55) points += 1;

    if (hr > 0 && hr >= 76) points += 2;
    else if (hr > 0 && hr >= 71) points += 1;

    if (hip >= 3 || sh >= 3) points += 1;
    if (hip >= 5 || sh >= 5) points += 2;

    if (breath === 'mild') points += 1;
    if (breath === 'bad') points += 2;

    if (soreness > SUBJECTIVE_THRESHOLDS.muscleSorenessHigh) points += 2;
    else if (soreness >= SUBJECTIVE_THRESHOLDS.muscleSorenessHigh) points += 1;

    if (energy > 0 && energy < SUBJECTIVE_THRESHOLDS.energyLow) points += 2;
    else if (energy > 0 && energy <= SUBJECTIVE_THRESHOLDS.energyLow) points += 1;

    if (mood > 0 && mood < SUBJECTIVE_THRESHOLDS.moodLow) points += 2;
    else if (mood > 0 && mood <= SUBJECTIVE_THRESHOLDS.moodLow) points += 1;

    if (sleepQ > 0 && sleepQ < SUBJECTIVE_THRESHOLDS.sleepQualityLow) points += 2;
    else if (sleepQ > 0 && sleepQ <= SUBJECTIVE_THRESHOLDS.sleepQualityLow) points += 1;

    if (stress > SUBJECTIVE_THRESHOLDS.stressHigh) points += 2;
    else if (stress >= SUBJECTIVE_THRESHOLDS.stressHigh) points += 1;
  }

  return points >= 4;
}
