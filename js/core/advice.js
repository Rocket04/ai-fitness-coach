// js/core/advice.js
// Советы тренера и объяснения авторегуляции (APRE)

/**
 * Генерирует советы тренера на основе Recovery Score и текущего состояния.
 * @param {number} recoveryScore — 0–100
 * @param {Object} [checkin]
 * @param {Array<Object>} [testHistory]
 * @param {Object} [weeklySummary]
 * @returns {string[]}
 */
export function getCoachAdvice(recoveryScore, checkin = {}, testHistory = [], weeklySummary = {}) {
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
 * @param {'full'|'yellow'|'minimum'} mode
 * @param {'green'|'yellow'|'red'} readiness
 * @param {boolean} debt
 * @param {number} multiplier
 * @param {Object|null} apreSession
 * @returns {string[]}
 */
export function getApreExplanation(mode, readiness, debt, multiplier = 1.0, apreSession = null) {
  const reasons = [];

  if (mode === 'minimum') {
    reasons.push('🔴 Режим «Минимальный»: только восстановительные упражнения (мобильность, растяжка, дыхание). Причина: красный readiness.');
  } else if (mode === 'yellow') {
    const cause = readiness === 'yellow'
      ? 'жёлтый readiness — организм не полностью восстановился'
      : 'накопленная усталость (recovery debt) за последние 3 дня';
    reasons.push(`🟡 Режим «Облегчённый»: подходов уменьшено на 1. Причина: ${cause}.`);
  } else {
    reasons.push('🟢 Полный режим: готовность зелёная, признаков усталости нет.');
  }

  if (multiplier > 1.05) {
    reasons.push(`📈 Множитель нагрузки ×${multiplier.toFixed(1)}: отличные результаты прошлой недели — повторения увеличены.`);
  } else if (multiplier < 0.95) {
    reasons.push(`📉 Множитель нагрузки ×${multiplier.toFixed(1)}: тяжёлая неделя — повторения снижены для профилактики.`);
  }

  if (apreSession && mode === 'full') {
    const rpe = Number(apreSession.rpe);
    if (rpe <= 4 && rpe > 0) {
      reasons.push(`🔄 APRE: RPE последней тренировки ${rpe} (легко) → +1 повтор к упражнениям.`);
    } else if (rpe >= 8) {
      reasons.push(`🔄 APRE: RPE последней тренировки ${rpe} (тяжело) → −1 повтор к упражнениям.`);
    } else if (rpe > 0) {
      reasons.push(`🔄 APRE: RPE последней тренировки ${rpe} — оптимальная нагрузка, изменений не требуется.`);
    }
  }

  return reasons;
}
