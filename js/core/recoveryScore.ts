// js/core/recoveryScore.ts
// Recovery Score 0–100 на основе HRV, сна, пульса и субъективных метрик

import { RECOVERY_WEIGHTS } from '../config/constants.js';
import { formatISO, addDays, parseLocalDate } from './helpers.js';
import type { Checkin } from './types.js';

/**
 * Recovery Score 0–100 на основе HRV, сна, пульса и субъективных метрик.
 * Взвешенная z-score модель: HRV 40%, сон 30%, пульс 10%, субъективные 20%.
 */
export function calculateRecoveryScore(checkin: Checkin, allCheckins: Checkin[]): number {
  const sleep = Number(checkin.sleepHours) || 8;
  const hrv = Number(checkin.hrv) || 70;
  const hr = Number(checkin.restHR) || 63;

  const soreness = Number(checkin.muscleSoreness || 0);
  const energy = Number(checkin.energy || 0);
  const mood = Number(checkin.mood || 0);

  const todayStr = checkin.date || formatISO(new Date());
  const today = parseLocalDate(todayStr) || new Date();
  const fourteenDaysAgo = addDays(today, -14);

  const inLast14 = allCheckins.filter(c => {
    if (!c || !c.date) return false;
    const cDate = parseLocalDate(c.date);
    return cDate && cDate >= fourteenDaysAgo && cDate <= today;
  });

  const hrvValues = inLast14.map(c => Number(c.hrv)).filter(v => v > 0);
  const rhrValues = inLast14.map(c => Number(c.restHR)).filter(v => v > 0);

  function getBaseline(values: number[]) {
    const n = values.length;
    if (n < 3) return null;
    const mean = values.reduce((a, b) => a + b, 0) / n;
    const variance = values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / n;
    const std = Math.sqrt(variance) || 1;
    return { mean, std };
  }

  function zScoreToScore(z: number, invert = false) {
    if (invert) z = -z;
    const score = 5 + z * 2.5;
    return Math.min(10, Math.max(0, score));
  }

  let hrvScore;
  const hrvBaseline = getBaseline(hrvValues);
  if (hrvBaseline) {
    const z = (hrv - hrvBaseline.mean) / hrvBaseline.std;
    hrvScore = zScoreToScore(z, false);
  } else {
    hrvScore = hrv >= 70 ? 10 : hrv >= 55 ? 7 : hrv >= 40 ? 4 : 1;
  }

  const sleepScore = Math.min(10, Math.max(0, (sleep / 8) * 10));

  let rhrScore;
  const rhrBaseline = getBaseline(rhrValues);
  if (rhrBaseline) {
    const z = (hr - rhrBaseline.mean) / rhrBaseline.std;
    rhrScore = zScoreToScore(z, true);
  } else {
    rhrScore = hr <= 60 ? 10 : hr <= 70 ? 7 : hr <= 76 ? 4 : 1;
  }

  const subjectiveRaw = (energy + mood + (5 - soreness)) / 3;
  const subjectiveScore = Math.min(10, Math.max(0, subjectiveRaw * 2));

  const { hrv: wHrv, sleep: wSleep, rhr: wRhr, subjective: wSubjective } = RECOVERY_WEIGHTS;
  const total = (hrvScore * wHrv + sleepScore * wSleep + rhrScore * wRhr + subjectiveScore * wSubjective) * 10;
  return Math.round(total);
}
