// js/core/analytics.ts
// Предиктивная аналитика и детекция трендов — чистые функции без побочных эффектов

import { calculateRecoveryScore } from './recoveryScore.js';
import { parseLocalDate, formatISO, addDays } from './helpers.js';
import type { Checkin, Session, TrendPoint, TrendWarning, WeeklyAverage, WeeklySummary, OvertrainingWarning } from './types.js';

/**
 * Строит массив данных трендов из чек-инов за последние N дней.
 * Каждая точка содержит: date, recoveryScore, hrv, restHR, sleepHours.
 */
export function getTrendData(checkins: Checkin[], allCheckins: Checkin[], days = 30): Array<{date: string, recoveryScore: number, hrv: number, restHR: number, sleepHours: number}> {
  const today = new Date();
  const startDate = addDays(today, -(days - 1));
  const startStr = formatISO(startDate);
  const endStr = formatISO(today);

  const inRange = checkins
    .filter(c => c.date >= startStr && c.date <= endStr)
    .sort((a, b) => a.date.localeCompare(b.date));

  return inRange.map(c => ({
    date: c.date,
    hrv: Number(c.hrv) || 0,
    restHR: Number(c.restHR) || 0,
    sleepHours: Number(c.sleepHours) || 0,
    recoveryScore: calculateRecoveryScore(c, allCheckins),
  }));
}

/**
 * Строит массив RPE по тренировкам за последние N дней.
 */
export function getRpeTrend(sessions: Session[], days = 30): Array<{date: string, rpe: number, type: string}> {
  const today = new Date();
  const startDate = addDays(today, -(days - 1));
  const startStr = formatISO(startDate);

  return sessions
    .filter(s =>
      s.date >= startStr &&
      s.completed &&
      s.type !== 'morning' &&
      s.type !== 'evening' &&
      s.type !== 'mobility'
    )
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(s => ({
      date: s.date,
      rpe: Number(s.rpe) || 0,
      type: s.type,
    }));
}

/**
 * Детектирует негативные тренды в данных восстановления.
 * Проверяет: падение Recovery Score 3+ дня, падение HRV 3+ дня, рост ЧСС покоя 3+ дня.
 */
export function detectNegativeTrends(trendData: TrendPoint[]): TrendWarning[] {
  const warnings: TrendWarning[] = [];

  if (trendData.length < 3) return warnings;

  // ── Recovery Score: 3+ дней падения ──
  let scoreDecline = 0;
  for (let i = trendData.length - 1; i >= 1; i--) {
    const curr = trendData[i].recoveryScore;
    const prev = trendData[i - 1].recoveryScore;
    if (curr < prev) {
      scoreDecline++;
    } else {
      break;
    }
  }
  if (scoreDecline >= 3) {
    const lastVal = trendData[trendData.length - 1].recoveryScore;
    warnings.push({
      type: 'recovery_score_decline',
      severity: 'high',
      metric: 'Recovery Score',
      consecutiveDays: scoreDecline,
      currentValue: lastVal,
      message: `Recovery Score снижается ${scoreDecline} дня подряд (${lastVal})`,
      recommendation: 'Рекомендуется разгрузочный день или снижение объёма тренировки на 30%. '
        + 'Добавь 1 дополнительный день отдыха на этой неделе.',
      apreAction: 'Авторегуляция: режим "жёлтый" — уменьшение подходов на 1 во всех упражнениях.',
    });
  }

  // ── HRV: 3+ дней падения ──
  let hrvDecline = 0;
  for (let i = trendData.length - 1; i >= 1; i--) {
    const curr = trendData[i].hrv;
    const prev = trendData[i - 1].hrv;
    if (curr > 0 && prev > 0 && curr < prev) {
      hrvDecline++;
    } else {
      break;
    }
  }
  if (hrvDecline >= 3) {
    const lastVal = trendData[trendData.length - 1].hrv;
    warnings.push({
      type: 'hrv_decline',
      severity: 'high',
      metric: 'HRV',
      consecutiveDays: hrvDecline,
      currentValue: lastVal,
      message: `HRV снижается ${hrvDecline} дня подряд (${lastVal} мс)`,
      recommendation: 'Снизь нагрузку: только Zone 1–2 бег, силовые −30%. '
        + 'Удели внимание вечерней рутине для восстановления ЦНС.',
      apreAction: 'Авторегуляция: режим "жёлтый" — снижение объёма, бег только Z1–Z2.',
    });
  }

  // ── ЧСС покоя: 3+ дней роста ──
  let hrRise = 0;
  for (let i = trendData.length - 1; i >= 1; i--) {
    const curr = trendData[i].restHR;
    const prev = trendData[i - 1].restHR;
    if (curr > 0 && prev > 0 && curr > prev) {
      hrRise++;
    } else {
      break;
    }
  }
  if (hrRise >= 3) {
    const lastVal = trendData[trendData.length - 1].restHR;
    warnings.push({
      type: 'hr_rise',
      severity: 'medium',
      metric: 'ЧСС покоя',
      consecutiveDays: hrRise,
      currentValue: lastVal,
      message: `ЧСС покоя растёт ${hrRise} дня подряд (${lastVal} уд/мин)`,
      recommendation: 'Приоритет — восстановление: сон ≥8 ч, вечерняя рутина (box breathing 5–8 мин), '
        + 'снижение стресса. Рассмотри дополнительный день отдыха.',
      apreAction: 'Авторегуляция: мониторинг — при сохранении тренда будет применён режим "жёлтый".',
    });
  }

  return warnings;
}

/**
 * Агрегирует данные трендов по неделям (среднее за неделю).
 */
export function getWeeklyAverages(trendData: TrendPoint[]): WeeklyAverage[] {
  if (!trendData.length) return [];

  const weeks: Record<string, {scores: number[], hrv: number[], restHR: number[]}> = {};
  for (const d of trendData) {
    const date = parseLocalDate(d.date);
    if (!date) continue;
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(date.getFullYear(), date.getMonth(), diff, 12, 0, 0, 0);
    const weekKey = formatISO(monday);

    if (!weeks[weekKey]) {
      weeks[weekKey] = { scores: [], hrv: [], restHR: [] };
    }
    weeks[weekKey].scores.push(d.recoveryScore);
    if (d.hrv > 0) weeks[weekKey].hrv.push(d.hrv);
    if (d.restHR > 0) weeks[weekKey].restHR.push(d.restHR);
  }

  return Object.entries(weeks)
    .map(([weekStart, data]) => ({
      weekStart,
      avgRecoveryScore: data.scores.length
        ? Math.round(data.scores.reduce((a, b) => a + b, 0) / data.scores.length)
        : 0,
      avgHrv: data.hrv.length
        ? Math.round(data.hrv.reduce((a, b) => a + b, 0) / data.hrv.length)
        : 0,
      avgRestHR: data.restHR.length
        ? Math.round(data.restHR.reduce((a, b) => a + b, 0) / data.restHR.length)
        : 0,
    }))
    .sort((a, b) => a.weekStart.localeCompare(b.weekStart));
}

/**
 * Генерирует комплексное предупреждение о перетренированности на основе трендов.
 * Если тренд идёт несколько недель подряд — даёт APRE-связанную рекомендацию.
 */
export function getOvertrainingWarning(trendData: TrendPoint[], weeklyAverages: WeeklyAverage[], weeklySummary: WeeklySummary): OvertrainingWarning | null {
  const warnings = detectNegativeTrends(trendData);
  if (!warnings.length) return null;

  // Проверяем межнедельный тренд (3+ недели падения Recovery Score)
  if (weeklyAverages.length >= 3) {
    const last3 = weeklyAverages.slice(-3);
    const scoreTrend = last3.map(w => w.avgRecoveryScore);
    const isMultiWeekDecline =
      scoreTrend[0] > scoreTrend[1] && scoreTrend[1] > scoreTrend[2];

    if (isMultiWeekDecline && scoreTrend[0] - scoreTrend[2] >= 10) {
      return {
        severity: 'critical',
        title: 'Критический тренд: риск перетренированности',
        message: `Твой Recovery Score снижается третью неделю подряд: `
          + `${scoreTrend[0]} → ${scoreTrend[1]} → ${scoreTrend[2]}. `
          + `Это признак накопленной усталости и недостаточного восстановления.`,
        recommendation: 'Рекомендую снизить нагрузку на 30% на этой неделе, '
          + 'пока не восстановишься. Добавь 1 дополнительный день отдыха '
          + 'и увеличь время сна на 30–60 мин.',
        apreOverride: 'Авторегуляция принудительно переведена в режим "жёлтый" — '
          + 'уменьшение подходов на 1 во всех упражнениях. '
          + 'Бег только Zone 1–2, без интервалов и темповых отрезков.',
      };
    }
  }

  // Одиночные предупреждения с контекстом APRE
  const primary = warnings[0];
  const weekGreen = (weeklySummary && typeof weeklySummary.green === 'number') ? weeklySummary.green : -1;

  let apreContext = '';
  if (primary.type === 'recovery_score_decline') {
    if (weekGreen >= 0 && weekGreen < 2) {
      apreContext = 'На этой неделе мало "зелёных" дней — авторегуляция уже '
        + 'применила или применит облегчённый режим.';
    } else {
      apreContext = 'Авторегуляция: если тренд сохранится, режим будет переведён в "жёлтый".';
    }
  }

  return {
    severity: primary.severity === 'high' ? 'warning' : 'info',
    title: `Обнаружен негативный тренд: ${primary.metric}`,
    message: `${primary.message}. ${apreContext}`,
    recommendation: primary.recommendation,
    apreOverride: primary.apreAction,
  };
}

/** Metric comparison result for a single metric */
export interface MetricComparison {
  current: number;
  previous: number;
  change: number;
  changePercent: number;
  direction: 'up' | 'down' | 'flat';
}

/** Period comparison result */
export interface PeriodComparison {
  recoveryScore: MetricComparison;
  hrv: MetricComparison;
  restHR: MetricComparison;
  sleepHours: MetricComparison;
  rpe: MetricComparison;
  sessionsCompleted: { current: number; previous: number; change: number };
}

/**
 * Compare current week vs previous week metrics.
 * Splits trend data into two halves and compares averages.
 *
 * @param trendData — array of trend points (sorted by date)
 * @param sessions — array of completed sessions
 * @returns PeriodComparison or null if insufficient data
 */
export function getPeriodComparison(trendData: TrendPoint[], sessions: Session[]): PeriodComparison | null {
  if (!trendData || trendData.length < 4) return null;

  const mid = Math.floor(trendData.length / 2);
  const previousHalf = trendData.slice(0, mid);
  const currentHalf = trendData.slice(mid);

  if (previousHalf.length < 2 || currentHalf.length < 2) return null;

  const now = new Date();
  const twoWeeksAgo = new Date(now); twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
  const oneWeekAgo = new Date(now); oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  const avg = (arr: TrendPoint[], key: string) => {
    const values = arr.map(d => Number(d[key as keyof TrendPoint])).filter(v => v > 0);
    if (!values.length) return 0;
    return values.reduce((a, b) => a + b, 0) / values.length;
  };

  const compareMetric = (key: keyof TrendPoint): MetricComparison => {
    const current = avg(currentHalf, key as string);
    const previous = avg(previousHalf, key as string);
    const change = current - previous;
    const changePercent = previous > 0 ? Math.round((change / previous) * 100) : 0;
    const direction = change > 0.5 ? 'up' as const : change < -0.5 ? 'down' as const : 'flat' as const;
    return { current: Math.round(current), previous: Math.round(previous), change: Math.round(change), changePercent, direction };
  };

  // Compute RPE from sessions for each half
  const avgRpe = (sessions: Session[]): number => {
    const completed = sessions.filter(s => s.completed && s.rpe > 0);
    if (!completed.length) return 0;
    return completed.reduce((sum, s) => sum + s.rpe, 0) / completed.length;
  };

  const prevSessionsList = sessions.filter((s: Session) => {
    const d = s.date;
    return d >= twoWeeksAgo.toISOString().slice(0, 10) && d < oneWeekAgo.toISOString().slice(0, 10);
  });
  const currSessionsList = sessions.filter((s: Session) => {
    const d = s.date;
    return d >= oneWeekAgo.toISOString().slice(0, 10);
  });
  const prevRpe = avgRpe(prevSessionsList);
  const currRpe = avgRpe(currSessionsList);
  const rpeChange = currRpe - prevRpe;
  const rpeChangePercent = prevRpe > 0 ? Math.round((rpeChange / prevRpe) * 100) : 0;
  const rpeDirection = rpeChange > 0.5 ? 'up' as const : rpeChange < -0.5 ? 'down' as const : 'flat' as const;

  const prevSessions = prevSessionsList.length;
  const currSessions = currSessionsList.length;

  return {
    recoveryScore: compareMetric('recoveryScore'),
    hrv: compareMetric('hrv'),
    restHR: compareMetric('restHR'),
    sleepHours: compareMetric('sleepHours'),
    rpe: { current: Math.round(currRpe), previous: Math.round(prevRpe), change: Math.round(rpeChange), changePercent: rpeChangePercent, direction: rpeDirection },
    sessionsCompleted: { current: currSessions, previous: prevSessions, change: currSessions - prevSessions },
  };
}
