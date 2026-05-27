// js/core/advice.ts
// Советы тренера и объяснения авторегуляции (APRE)

import type { Checkin, Session, ReadinessStatus, SessionMode, TrendPoint } from './types.js';

/**
 * Генерирует советы тренера на основе Recovery Score и текущего состояния.
 */
export function getCoachAdvice(recoveryScore: number, checkin: Partial<Checkin> = {}, _testHistory: any[] = [], weeklySummary: any = {}): string[] {
  const advice = [];
  const score = typeof recoveryScore === 'number' ? recoveryScore : 0;

  if (score >= 80) {
    advice.push(`Recovery Score ${score} – отлично, можно полный план`);
  } else if (score >= 60) {
    advice.push(`Recovery Score ${score} – хороший, рекомендован умеренный план`);
  } else {
    advice.push(`Recovery Score ${score} – низкий, рекомендуется лёгкий план или отдых`);
  }

  const sleepHours = checkin?.sleepHours;
  if (typeof sleepHours === 'number' && sleepHours > 0 && sleepHours < 7) {
    advice.push(`Сон ${sleepHours} ч – мало, постарайся лечь пораньше (нужно ≥7 ч)`);
  }

  const hrv = checkin?.hrv;
  if (typeof hrv === 'number' && hrv > 0 && hrv < 45) {
    advice.push(`HRV ${hrv} мс — ниже нормы, снизь нагрузку и добавь сон`);
  }

  const restHR = checkin?.restHR;
  if (typeof restHR === 'number' && restHR > 70) {
    advice.push(`ЧСС покоя ${restHR} уд/мин — выше нормы, возможен недовосстановление`);
  }

  const hipPain = checkin?.hipPain;
  const shoulderPain = checkin?.shoulderPain;
  if ((typeof hipPain === 'number' && hipPain >= 5) || (typeof shoulderPain === 'number' && shoulderPain >= 5)) {
    advice.push('Боль в бедре/плече ≥5 — исключи упражнения на эту область');
  }

  const soreness = checkin?.muscleSoreness;
  if (typeof soreness === 'number' && soreness >= 4) {
    advice.push(`Мышечная болезненность ${soreness}/5 – высокая, добавь лёгкую растяжку и МФР`);
  } else if (typeof soreness === 'number' && soreness >= 3) {
    advice.push(`Мышечная болезненность ${soreness}/5 – умеренная, разомнись перед тренировкой`);
  }

  const energy = checkin?.energy;
  if (typeof energy === 'number' && energy > 0 && energy <= 2) {
    advice.push(`Энергия ${energy}/5 – низкая, рекомендуется снизить нагрузку на 10–15%`);
  } else if (typeof energy === 'number' && energy === 3) {
    advice.push(`Энергия ${energy}/5 – средняя, начни с разминки и оцени самочувствие`);
  }

  const mood = checkin?.mood;
  if (typeof mood === 'number' && mood > 0 && mood <= 2) {
    advice.push(`Настроение ${mood}/5 – низкое, лёгкая активность поможет улучшить состояние`);
  }

  const sleepQ = checkin?.sleepQuality;
  if (typeof sleepQ === 'number' && sleepQ > 0 && sleepQ <= 2) {
    advice.push(`Качество сна ${sleepQ}/5 – низкое, проверь гигиену сна (темнота, тишина, без экрана)`);
  }

  const stress = checkin?.stress;
  if (typeof stress === 'number' && stress >= 4) {
    advice.push(`Стресс ${stress}/5 – высокий, добавь box breathing (5–8 мин) и вечернюю рутину`);
  }

  if ((weeklySummary?.green ?? 0) < 3 && (weeklySummary?.green ?? 0) >= 0) {
    advice.push('На этой неделе мало зелёных дней – сосредоточься на восстановлении');
  }

  return advice;
}

/**
 * Формирует понятные объяснения для авторегуляции (APRE).
 */
export function getApreExplanation(mode: SessionMode, readiness: ReadinessStatus, _debt: boolean, multiplier = 1.0, apreSession: Session | null = null): string[] {
  const reasons = [];

  if (mode === 'minimum') {
    reasons.push('[RED] Режим «Минимальный»: только восстановительные упражнения (мобильность, растяжка, дыхание). Причина: красный readiness.');
  } else if (mode === 'yellow') {
    const cause = readiness === 'yellow'
      ? 'жёлтый readiness — организм не полностью восстановился'
      : 'накопленная усталость (recovery debt) за последние 3 дня';
    reasons.push(`[YELLOW] Режим «Облегчённый»: подходов уменьшено на 1. Причина: ${cause}.`);
  } else {
    reasons.push('[GREEN] Полный режим: готовность зелёная, признаков усталости нет.');
  }

  if (multiplier > 1.05) {
    reasons.push(`[UP] Множитель нагрузки ×${multiplier.toFixed(1)}: отличные результаты прошлой недели — повторения увеличены.`);
  } else if (multiplier < 0.95) {
    reasons.push(`[DOWN] Множитель нагрузки ×${multiplier.toFixed(1)}: тяжёлая неделя — повторения снижены для профилактики.`);
  }

  if (apreSession && mode === 'full') {
    const rpe = Number(apreSession.rpe);
    if (rpe <= 4 && rpe > 0) {
      reasons.push(`[SYNC] APRE: RPE последней тренировки ${rpe} (легко) → +1 повтор к упражнениям.`);
    } else if (rpe >= 8) {
      reasons.push(`[SYNC] APRE: RPE последней тренировки ${rpe} (тяжело) → −1 повтор к упражнениям.`);
    } else if (rpe > 0) {
      reasons.push(`[SYNC] APRE: RPE последней тренировки ${rpe} — оптимальная нагрузка, изменений не требуется.`);
    }
  }

  return reasons;
}

/**
 * Генерирует аналитические объяснения ("почему") для пользователя.
 * Принимает t из useTranslation для i18n.
 */
export function getExplanation(
  recoveryScore: number,
  _readiness: ReadinessStatus,
  debt: boolean,
  lastCheckin: Partial<Checkin>,
  hrvTrend: TrendPoint[],
  _sleepTrend: TrendPoint[],
  planModifications: string[],
  t: (key: string, opts?: Record<string, unknown>) => string
): string[] {
  const items: string[] = [];

  if (!lastCheckin || !lastCheckin.date) {
    items.push(t('explanation.noCheckin'));
    return items;
  }

  // Recovery score explanation
  if (recoveryScore >= 80) {
    items.push(t('explanation.recoveryScore', { score: recoveryScore, status: t('recovery.status.green') }));
  } else if (recoveryScore >= 60) {
    items.push(t('explanation.recoveryScore', { score: recoveryScore, status: t('recovery.status.yellow') }));
  } else {
    items.push(t('explanation.recoveryScore', { score: recoveryScore, status: t('recovery.status.red') }));
  }

  // HRV trend
  if (hrvTrend.length >= 2 && lastCheckin.hrv && lastCheckin.hrv > 0) {
    const baseline = hrvTrend.slice(-7);
    const avg = baseline.reduce((sum, d) => sum + (d.hrv || 0), 0) / baseline.length;
    if (avg > 0) {
      const drop = ((avg - lastCheckin.hrv) / avg) * 100;
      if (drop > 10) {
        items.push(t('explanation.hrvDrop', { percent: Math.round(drop) }));
      }
    }
  }

  // Sleep
  if (typeof lastCheckin.sleepHours === 'number' && lastCheckin.sleepHours > 0 && lastCheckin.sleepHours < 7) {
    items.push(t('explanation.sleepShort', { hours: lastCheckin.sleepHours }));
  }

  // RHR
  if (typeof lastCheckin.restHR === 'number' && lastCheckin.restHR > 70) {
    items.push(t('explanation.rhrHigh', { bpm: lastCheckin.restHR }));
  }

  // Recovery debt
  if (debt) {
    items.push(t('explanation.recoveryDebt'));
  }

  // Plan modifications (already human-readable from planning.ts)
  for (const mod of planModifications) {
    if (mod && !items.includes(mod)) {
      items.push(mod);
    }
  }

  return items.slice(0, 5);
}
