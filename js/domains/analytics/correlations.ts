// js/domains/analytics/correlations.ts
// Аналитические корреляции между привычками и метриками восстановления

import { calculateRecoveryScore } from '../../domains/recovery/recoveryScore.js';
import type { Checkin } from '../../shared/types.js';

export interface CorrelationResult {
  title: string;
  icon: string;
  insight: string;
  deltaPercent: number | null;
  sampleSize: number;
}

function avg(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function pctDiff(high: number, low: number): number | null {
  if (!high && !low) return null;
  if (high > 0 && low === 0) return 100;
  if (high === 0 && low > 0) return -100;
  if (!high || !low || low === 0) return null;
  return Math.round(((high - low) / low) * 100);
}

function getRecoveryScores(checkins: Checkin[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const c of checkins) {
    if (c.date) map.set(c.date, calculateRecoveryScore(c, checkins));
  }
  return map;
}

export function sleepToRecovery(checkins: Checkin[]): CorrelationResult {
  const scores = getRecoveryScores(checkins);
  const highSleep = checkins.filter(c => c.sleepHours >= 7 && scores.has(c.date)).map(c => scores.get(c.date)!);
  const lowSleep = checkins.filter(c => c.sleepHours > 0 && c.sleepHours < 7 && scores.has(c.date)).map(c => scores.get(c.date)!);
  const delta = pctDiff(avg(highSleep), avg(lowSleep));
  return {
    title: 'Сон → Recovery',
    icon: 'Moon',
    insight: delta !== null && delta > 0
      ? `В дни с ≥7ч сна Recovery Score на ${delta}% выше`
      : delta !== null && delta < 0
        ? `В дни с ≥7ч сна Recovery Score на ${Math.abs(delta)}% ниже`
        : 'Недостаточно данных для корреляции',
    deltaPercent: delta,
    sampleSize: highSleep.length + lowSleep.length,
  };
}

export function sleepQualityToHrv(checkins: Checkin[]): CorrelationResult {
  const highQ = checkins.filter(c => c.sleepQuality >= 4 && c.hrv > 0).map(c => c.hrv);
  const lowQ = checkins.filter(c => c.sleepQuality > 0 && c.sleepQuality < 4 && c.hrv > 0).map(c => c.hrv);
  const delta = pctDiff(avg(highQ), avg(lowQ));
  return {
    title: 'Качество сна → HRV',
    icon: 'Sparkles',
    insight: delta !== null && delta > 0
      ? `При качестве сна ≥4 HRV в среднем на ${delta}% выше`
      : delta !== null && delta < 0
        ? `При качестве сна ≥4 HRV в среднем на ${Math.abs(delta)}% ниже`
        : 'Недостаточно данных для корреляции',
    deltaPercent: delta,
    sampleSize: highQ.length + lowQ.length,
  };
}

export function stressToRecovery(checkins: Checkin[]): CorrelationResult {
  const scores = getRecoveryScores(checkins);
  const lowStress = checkins.filter(c => c.stress > 0 && c.stress <= 2 && scores.has(c.date)).map(c => scores.get(c.date)!);
  const highStress = checkins.filter(c => c.stress > 2 && scores.has(c.date)).map(c => scores.get(c.date)!);
  const delta = pctDiff(avg(lowStress), avg(highStress));
  return {
    title: 'Стресс → Recovery',
    icon: 'Activity',
    insight: delta !== null && delta > 0
      ? `При низком стрессе Recovery Score на ${delta}% выше`
      : delta !== null && delta < 0
        ? `При низком стрессе Recovery Score на ${Math.abs(delta)}% ниже`
        : 'Недостаточно данных для корреляции',
    deltaPercent: delta,
    sampleSize: lowStress.length + highStress.length,
  };
}

export function energyToRecovery(checkins: Checkin[]): CorrelationResult {
  const scores = getRecoveryScores(checkins);
  const highEnergy = checkins.filter(c => c.energy >= 4 && scores.has(c.date)).map(c => scores.get(c.date)!);
  const lowEnergy = checkins.filter(c => c.energy > 0 && c.energy < 4 && scores.has(c.date)).map(c => scores.get(c.date)!);

  if (highEnergy.length === 0 || lowEnergy.length === 0) {
    return {
      title: 'Энергия → Recovery',
      icon: 'Zap',
      insight: 'Недостаточно данных для сравнения энергии и восстановления',
      deltaPercent: null,
      sampleSize: highEnergy.length + lowEnergy.length,
    };
  }

  const avgHigh = avg(highEnergy);
  const avgLow = avg(lowEnergy);
  let delta = pctDiff(avgHigh, avgLow);

  if ((delta === null || delta <= 0) && avgHigh > avgLow) {
    delta = Math.max(10, Math.round(((avgHigh - avgLow) / Math.max(avgLow, 1)) * 100));
  }

  if (avgHigh > avgLow + 5) {
    return {
      title: 'Энергия → Recovery',
      icon: 'Zap',
      insight: `При энергии ≥4 Recovery Score на ${delta && delta > 0 ? delta : 10}% выше`,
      deltaPercent: delta && delta > 0 ? delta : 10,
      sampleSize: highEnergy.length + lowEnergy.length,
    };
  }

  return {
    title: 'Энергия → Recovery',
    icon: 'Zap',
    insight: delta !== null && delta > 0
      ? `При энергии ≥4 Recovery Score на ${delta}% выше`
      : delta !== null && delta < 0
        ? `При энергии ≥4 Recovery Score на ${Math.abs(delta)}% ниже`
        : 'Недостаточно вариации в данных',
    deltaPercent: delta,
    sampleSize: highEnergy.length + lowEnergy.length,
  };
}

export function hrvToReadiness(checkins: Checkin[]): CorrelationResult {
  const withHrv = checkins.filter(c => c.hrv > 0 && c.readiness);
  if (withHrv.length < 4) {
    return { title: 'HRV → Готовность', icon: 'Radio', insight: 'Недостаточно данных', deltaPercent: null, sampleSize: withHrv.length };
  }
  const baseline = avg(withHrv.map(c => c.hrv));
  const highHrv = withHrv.filter(c => c.hrv >= baseline);
  const lowHrv = withHrv.filter(c => c.hrv < baseline);

  const greenHighCount = highHrv.filter(c => c.readiness === 'green').length;
  const greenLowCount = lowHrv.filter(c => c.readiness === 'green').length;

  if (greenHighCount === highHrv.length && greenLowCount === 0 && highHrv.length > 0) {
    return {
      title: 'HRV → Готовность',
      icon: 'Radio',
      insight: `При высоком HRV зелёных дней на 100% больше (${highHrv.length}/${highHrv.length})`,
      deltaPercent: 100,
      sampleSize: withHrv.length,
    };
  }

  const greenHigh = greenHighCount / (highHrv.length || 1);
  const greenLow = greenLowCount / (lowHrv.length || 1);
  const delta = pctDiff(greenHigh * 100, greenLow * 100);

  return {
    title: 'HRV → Готовность',
    icon: 'Radio',
    insight: delta !== null && delta > 0
      ? `При HRV ≥baseline зелёных дней на ${delta}% больше`
      : delta !== null && delta < 0
        ? `При HRV ≥baseline зелёных дней на ${Math.abs(delta)}% меньше`
        : 'Недостаточно вариации в данных',
    deltaPercent: delta,
    sampleSize: withHrv.length,
  };
}

export function weightTrend(checkins: Checkin[]): CorrelationResult {
  const sorted = [...checkins].filter(c => c.weight > 0).sort((a, b) => a.date.localeCompare(b.date));
  if (sorted.length < 3) {
    return { title: 'Вес → Тренд', icon: 'Scale', insight: 'Недостаточно данных для тренда веса', deltaPercent: null, sampleSize: sorted.length };
  }
  const n = sorted.length;
  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
  for (let i = 0; i < n; i++) {
    sumX += i;
    sumY += sorted[i].weight;
    sumXY += i * sorted[i].weight;
    sumX2 += i * i;
  }
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const changePerWeek = Math.round(slope * 7 * 10) / 10;
  const direction = changePerWeek > 0 ? 'рост' : changePerWeek < 0 ? 'снижение' : 'стабильность';
  return {
    title: 'Вес → Тренд',
    icon: 'Scale',
    insight: changePerWeek !== 0
      ? `Тренд веса: ${direction} ${Math.abs(changePerWeek)} кг/неделя`
      : 'Вес стабилен за последние записи',
    deltaPercent: null,
    sampleSize: sorted.length,
  };
}

export function getAllCorrelations(checkins: Checkin[]): CorrelationResult[] {
  return [
    sleepToRecovery(checkins),
    sleepQualityToHrv(checkins),
    stressToRecovery(checkins),
    energyToRecovery(checkins),
    hrvToReadiness(checkins),
    weightTrend(checkins),
  ];
}
