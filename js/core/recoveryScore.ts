// js/core/recoveryScore.ts
// Recovery Score 0–100 на основе HRV, сна, пульса и субъективных метрик
// Поддержка трёх уровней (tiered): full, medium, light

import { formatISO, addDays, parseLocalDate } from './helpers.js';
import type { Checkin } from './types.js';

/** Тип уровня чек-ина */
export type CheckinTier = 'full' | 'medium' | 'light';

/** Веса для уровня Full (HRV + RHR + Sleep + Subjective) */
const WEIGHTS_FULL = { hrv: 0.4, sleep: 0.3, rhr: 0.1, subjective: 0.2 };

/** Веса для уровня Medium (RHR + Sleep + Subjective — без HRV) */
const WEIGHTS_MEDIUM = { hrv: 0, sleep: 0.3, rhr: 0.3, subjective: 0.4 };

/** Веса для уровня Light (только субъективные) */
const WEIGHTS_LIGHT = { hrv: 0, sleep: 0, rhr: 0, subjective: 1.0 };

/** Получить веса для уровня */
export function getWeightsForTier(tier: CheckinTier) {
  if (tier === 'full') return WEIGHTS_FULL;
  if (tier === 'medium') return WEIGHTS_MEDIUM;
  return WEIGHTS_LIGHT;
}

/**
 * Recovery Score 0–100 на основе HRV, сна, пульса и субъективных метрик.
 * Взвешенная z-score модель с адаптивными весами в зависимости от уровня чек-ина.
 *
 * @param checkin  — данные чек-ина
 * @param allCheckins — все чек-ины для расчёта baseline
 * @param tier — уровень чек-ина ('full' | 'medium' | 'light'), по умолчанию 'full'
 */
export function calculateRecoveryScore(
  checkin: Checkin,
  allCheckins: Checkin[],
  tier: CheckinTier = 'full'
): number {
  const weights = getWeightsForTier(tier);

  let sleep = Number(checkin.sleepHours) || 0;
  const hrv = Number(checkin.hrv) || 0;
  let hr = Number(checkin.restHR) || 0;

  const soreness = Number(checkin.muscleSoreness || 0);
  const energy = Number(checkin.energy || 0);
  const mood = Number(checkin.mood || 0);

  // Subjective score (always available)
  const subjectiveRaw = (energy + mood + (5 - soreness)) / 3;
  const subjectiveScore = Math.min(10, Math.max(0, subjectiveRaw * 2));

  // Light tier: subjective only
  if (tier === 'light') {
    return Math.round(subjectiveScore * 10);
  }

  const todayStr = checkin.date || formatISO(new Date());
  const today = parseLocalDate(todayStr) || new Date();
  const fourteenDaysAgo = addDays(today, -14);  // today already uses virtual date

  const inLast14 = allCheckins.filter(c => {
    if (!c || !c.date) return false;
    const cDate = parseLocalDate(c.date);
    return cDate && cDate >= fourteenDaysAgo && cDate <= today;
  });

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

  // HRV score (full tier only)
  let hrvScore = 0;
  if (tier === 'full' && weights.hrv > 0 && hrv > 0) {
    const hrvValues = inLast14.map(c => Number(c.hrv)).filter(v => v > 0);
    const hrvBaseline = getBaseline(hrvValues);
    if (hrvBaseline) {
      const z = (hrv - hrvBaseline.mean) / hrvBaseline.std;
      hrvScore = zScoreToScore(z, false);
    } else {
      hrvScore = hrv >= 70 ? 10 : hrv >= 55 ? 7 : hrv >= 40 ? 4 : 1;
    }
  }

  // Sleep score (full and medium tiers)
  let sleepScore = 0;
  if (weights.sleep > 0 && sleep > 0) {
    sleepScore = Math.min(10, Math.max(0, (sleep / 8) * 10));
  } else if (weights.sleep > 0) {
    sleep = 8; // default baseline if not provided
    sleepScore = 10;
  }

  // RHR score (full and medium tiers)
  let rhrScore = 0;
  if (weights.rhr > 0 && hr > 0) {
    const rhrValues = inLast14.map(c => Number(c.restHR)).filter(v => v > 0);
    const rhrBaseline = getBaseline(rhrValues);
    if (rhrBaseline) {
      const z = (hr - rhrBaseline.mean) / rhrBaseline.std;
      rhrScore = zScoreToScore(z, true);
    } else {
      rhrScore = hr <= 60 ? 10 : hr <= 70 ? 7 : hr <= 76 ? 4 : 1;
    }
  } else if (weights.rhr > 0) {
    hr = 63; // default baseline
    rhrScore = 7;
  }

  // Weighted total — normalize by actual weight sum
  const weightSum = weights.hrv + weights.sleep + weights.rhr + weights.subjective;
  const total = (
    hrvScore * weights.hrv +
    sleepScore * weights.sleep +
    rhrScore * weights.rhr +
    subjectiveScore * weights.subjective
  ) / weightSum * 10;

  return Math.round(Math.min(100, Math.max(0, total)));
}

/**
 * Auto-detect optimal check-in tier based on user's actual check-in patterns.
 * Analyzes recent check-ins to see which biometric metrics the user consistently provides.
 *
 * @param checkins — array of all check-ins (will analyze last 14 days)
 * @returns suggested tier ('full' | 'medium' | 'light') or null if insufficient data
 */
export function detectOptimalTier(checkins: Checkin[]): 'full' | 'medium' | 'light' | null {
  if (!checkins || checkins.length < 3) return null;

  // Analyze last 14 days of check-ins
  const now = new Date();
  const cutoff = new Date(now);
  cutoff.setDate(cutoff.getDate() - 14);
  const cutoffStr = cutoff.toISOString().slice(0, 10);

  const recent = checkins
    .filter(c => c.date >= cutoffStr)
    .sort((a, b) => a.date.localeCompare(b.date));

  if (recent.length < 3) return null;

  // Count how many have HRV and RHR
  const withHRV = recent.filter(c => Number(c.hrv) > 0).length;
  const withRHR = recent.filter(c => Number(c.restHR) > 0).length;
  const total = recent.length;

  const hrvRatio = withHRV / total;
  const rhrRatio = withRHR / total;

  // Thresholds: >=70% = consistently provided
  if (hrvRatio >= 0.7 && rhrRatio >= 0.7) return 'full';
  if (rhrRatio >= 0.7) return 'medium';
  return 'light';
}
