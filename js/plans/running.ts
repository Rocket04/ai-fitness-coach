// js/plans/running.ts
// Running-focused periodized training plan module
// 4-phase model: base → build → peak → deload (4-week cycles)
// Upper/Lower split to avoid interference with strength training

import type { SportPlanModule, SessionPlan, Exercise, ApreProtocolKey } from '../core/types.js';

const ex = (n: string, s: string, r: string, w?: string, protocol?: ApreProtocolKey, currentRM?: number): Exercise => ({
  n, s, r, ...(w && { w }), ...(protocol && { isApre: true, protocol }), ...(currentRM ? { currentRM } : {}),
});

// Helper: Create session plan object
const session = (
  sessionType: SessionPlan['sessionType'],
  name: string,
  description: string,
  defaultParams: Record<string, number>,
  exercises: Exercise[],
  apreRule?: SessionPlan['apreRule']
): Omit<SessionPlan, 'date' | 'sessionId'> => ({
  sport: 'running',
  sessionType,
  name,
  description,
  defaultParameters: defaultParams,
  exercises,
  mode: 'full',
  isDeload: false,
  isRestDay: false,
  ...(apreRule && { apreRule }),
});

// Base Phase (Weeks 1-4): 80% Zone 2, volume +5%/week
function basePhase(weekInPhase: number): Omit<SessionPlan, 'date' | 'sessionId'>[] {
  const distance = 5 + (weekInPhase - 1) * 0.5; // 5, 5.5, 6, 6.5
  const duration = 30 + (weekInPhase - 1) * 5; // 30, 35, 40, 45

  return [
    // Monday: Endurance
    session(
      'endurance',
      `Лёгкая пробежка ${distance} км`,
      `Zone 2, ${duration} мин`,
      { distance, duration },
      [
        ex("Разминка ходьба", "—", "8-10 мин", "Прогрев бронхов"),
        ex("Бег Zone 2", "—", `${distance} км`, `Пульс 125-140 bpm, ${duration} мин`),
        ex("Заминка ходьба", "—", "5-7 мин", "Профилактика бронхоспазма"),
      ]
    ),
    // Tuesday: Strength Upper (integrated)
    session(
      'strength',
      "Силовая: Верх тела",
      "Подтягивания + Жим",
      { sets: 3, reps: 8 },
      [
        ex("Подтягивания", "3", "6-8", "Параллельный хват", "APRE_6", 0),
        ex("Отжимания", "3", "8-10", "Темп 3-0-1", "APRE_6", 0),
        ex("Жим гантелей сидя", "3", "8-10", "Плечевой сустав"),
      ]
    ),
    // Wednesday: Rest
    null,
    // Thursday: Tempo/Intervals
    session(
      'tempo',
      `Темповая ${distance + 1} км`,
      `Zone 3, ${duration + 10} мин`,
      { distance: distance + 1, duration: duration + 10 },
      [
        ex("Разминка", "—", "10 мин", "Протокол астма"),
        ex("Бег Zone 3", "—", `${distance + 1} км`, `Пульс 136-154 bpm, ${duration + 10} мин`),
        ex("Заминка", "—", "8-10 мин", "Обязательно"),
      ]
    ),
    // Friday: Strength Lower
    session(
      'strength',
      "Силовая: Низ тела",
      "Приседания + Ягодичные",
      { sets: 3, reps: 8 },
      [
        ex("Приседания", "3", "6-8", "Полная амплитуда", "APRE_3", 0),
        ex("Ягодичный мост", "3", "15", "Пауза 2 сек вверху"),
        ex("Планка", "3", "30-40 сек", "Антигравитационный кор"),
      ]
    ),
    // Saturday: Long Run
    session(
      'endurance',
      `Длинная пробежка ${distance + 2} км`,
      `Zone 2, ${duration + 15} мин`,
      { distance: distance + 2, duration: duration + 15 },
      [
        ex("Разминка", "—", "10 мин", "Самая длинная пробежка"),
        ex("Бег Zone 2", "—", `${distance + 2} км`, `Основной аэробный объём, ${duration + 15} мин`),
        ex("Заминка", "—", "8-10 мин", "Профилактика"),
      ]
    ),
    // Sunday: Recovery
    session(
      'recovery',
      "Восстановительный бег",
      "Zone 1, 20 мин",
      { distance: 3, duration: 20 },
      [
        ex("Прогулка/лёгкий бег", "—", "20-30 мин", "Zone 1, лимфодренаж"),
        ex("Мобильность", "—", "15 мин", "Поддержание"),
      ]
    ),
  ].filter((s): s is NonNullable<typeof s> => s !== null);
}

// Build Phase (Weeks 5-8): Introduce threshold/tempo, 90-100% peak volume
function buildPhase(weekInPhase: number): Omit<SessionPlan, 'date' | 'sessionId'>[] {
  const distance = 7 + (weekInPhase - 1) * 0.5; // 7, 7.5, 8, 8.5
  const duration = 45 + (weekInPhase - 1) * 5; // 45, 50, 55, 60

  return [
    session(
      'intervals',
      `Интервалы 5×800м`,
      `Zone 3/4, ${duration} мин`,
      { repeats: 5, distance: 0.8, duration },
      [
        ex("Разминка", "—", "10 мин", "Протокол астма"),
        ex("Интервалы", "5", "800м", `Zone 3/4: 136-154 bpm, отдых 2 мин шаг`),
        ex("Заминка", "—", "10 мин", "Критично"),
      ]
    ),
    session(
      'strength',
      "Силовая: Тяга + Жим",
      "Upper body power",
      { sets: 4, reps: 6 },
      [
        ex("Подтягивания", "4", "6-8", "Прогрессия", "APRE_6", 0),
        ex("Жим лёжа", "4", "6-8", "Контроль грифа", "APRE_3", 0),
        ex("Отжимания алмазные", "3", "6-8", "Трицепс"),
      ]
    ),
    null, // Rest
    session(
      'tempo',
      `Темповая ${distance} км`,
      `Zone 3, ${duration} мин`,
      { distance, duration },
      [
        ex("Разминка", "—", "10 мин", "Протокол"),
        ex("Бег Zone 3", "—", `${distance} км`, `Пульс 136-150 bpm, ${duration} мин`),
        ex("Заминка", "—", "10 мин", "После темпового"),
      ]
    ),
    session(
      'strength',
      "Силовая: Ноги + Ягодицы",
      "Lower body strength",
      { sets: 4, reps: 6 },
      [
        ex("Приседания со штангой", "4", "6-8", "Базовое движение", "APRE_3", 0),
        ex("Румынская тяга", "3", "8-10", "Растяжение задней цепи"),
        ex("Ягодичный мост одноногий", "3", "10 / сторону", "Унилатеральный"),
      ]
    ),
    session(
      'endurance',
      `Длинный Z2 ${distance + 2} км`,
      `Zone 2, ${duration + 15} мин`,
      { distance: distance + 2, duration: duration + 15 },
      [
        ex("Разминка", "—", "10 мин", "Основной объём"),
        ex("Бег Zone 2", "—", `${distance + 2} км`, `VO2max рост, ${duration + 15} мин`),
        ex("Заминка", "—", "10 мин", "Дольше"),
      ]
    ),
    session(
      'recovery',
      "Активное восстановление",
      "Zone 1, 30 мин",
      { distance: 4, duration: 30 },
      [
        ex("Прогулка", "—", "30-40 мин", "Zone 1"),
        ex("Мобильность", "—", "20 мин", "Полная"),
      ]
    ),
  ].filter((s): s is NonNullable<typeof s> => s !== null);
}

// Peak Phase (Weeks 9-12): Race-pace specific, 100% volume
function peakPhase(weekInPhase: number): Omit<SessionPlan, 'date' | 'sessionId'>[] {
  const distance = 9 + (weekInPhase - 1) * 0.5; // 9, 9.5, 10, 10.5
  const duration = 60 + (weekInPhase - 1) * 5; // 60, 65, 70, 75

  return [
    session(
      'intervals',
      `Интервалы продвинутые 6×1000м`,
      `Zone 3/4, ${duration} мин`,
      { repeats: 6, distance: 1.0, duration },
      [
        ex("Разминка", "—", "12 мин", "Протокол"),
        ex("Интервалы", "6", "1000м", `Zone 3/4: 136-154 bpm, отдых 90 сек`),
        ex("Заминка", "—", "10 мин", "Критично"),
      ]
    ),
    session(
      'strength',
      "Силовая: Максимальная сила",
      "Peak strength, 5×5",
      { sets: 5, reps: 5 },
      [
        ex("Жим лёжа", "5", "5-6", "Тяжёлый", "APRE_3", 0),
        ex("Подтягивания с весом", "4", "6-8", "Макс объём", "APRE_3", 0),
        ex("Отжимания на брусьях", "3", "6-8", "Трицепс + грудь"),
      ]
    ),
    null, // Rest
    session(
      'tempo',
      `Фартлек ${distance} км`,
      `Zone 3, ${duration} мин`,
      { distance, duration },
      [
        ex("Разминка", "—", "10 мин", "Протокол"),
        ex("Фартлек", "—", `${distance} км`, `По ощущениям, ${duration} мин`),
        ex("Заминка", "—", "10 мин", "Обязательно"),
      ]
    ),
    session(
      'strength',
      "Силовая: Низ тела макс",
      "Peak lower body",
      { sets: 5, reps: 5 },
      [
        ex("Приседания", "5", "5-6", "Тяжёлые", "APRE_3", 0),
        ex("Становая тяга", "4", "5-6", "Нейтральный позвоночник", "APRE_3", 0),
        ex("RKC планка", "4", "12-15 сек", "Макс напряжение"),
      ]
    ),
    session(
      'endurance',
      `Пиковая длинная ${distance + 3} км`,
      `Zone 2, ${duration + 20} мин`,
      { distance: distance + 3, duration: duration + 20 },
      [
        ex("Разминка", "—", "12 мин", "VO2max рост"),
        ex("Бег Zone 2", "—", `${distance + 3} км`, `Пиковая нагрузка, ${duration + 20} мин`),
        ex("Заминка", "—", "10-12 мин", "Дольше"),
      ]
    ),
    session(
      'recovery',
      "Мобильность + Лёгкий бег",
      "Zone 1, 35 мин",
      { distance: 4, duration: 35 },
      [
        ex("Прогулка/лёгкий бег", "—", "35-40 мин", "Кровоток"),
        ex("Мобильность", "—", "25 мин", "Итог"),
      ]
    ),
  ].filter((s): s is NonNullable<typeof s> => s !== null);
}

// Deload Phase (Every 4th week): Volume × 0.50, intensity maintained
function deloadPhase(_weekInPhase: number): Omit<SessionPlan, 'date' | 'sessionId'>[] {
  return [
    session(
      'endurance',
      "Лёгкая пробежка 3 км",
      "Zone 2, 20 мин (разгрузка)",
      { distance: 3, duration: 20 },
      [
        ex("Разминка", "—", "5-8 мин", "Прогрев"),
        ex("Бег Zone 2", "—", "3 км", "Пульс 125-135 bpm, 20 мин (50% объёма)"),
        ex("Заминка", "—", "5 мин", "Короткая"),
      ]
    ),
    session(
      'strength',
      "Силовая: Лёгкая (разгрузка)",
      "2×10, 50% 1RM",
      { sets: 2, reps: 10 },
      [
        ex("Подтягивания", "2", "8-10", "50% нагрузки", "APRE_6", 0),
        ex("Отжимания", "2", "10-12", "Лёгкие"),
      ]
    ),
    null, // Rest
    session(
      'tempo',
      "Темповая 4 км",
      "Zone 3, 25 мин (разгрузка)",
      { distance: 4, duration: 25 },
      [
        ex("Разминка", "—", "5 мин", "Протокол"),
        ex("Бег Zone 3", "—", "4 км", "Пульс 136-145 bpm, 25 мин (50% объёма)"),
        ex("Заминка", "—", "5 мин", "Короткая"),
      ]
    ),
    session(
      'strength',
      "Силовая: Низ (разгрузка)",
      "2×10, 50% нагрузки",
      { sets: 2, reps: 10 },
      [
        ex("Приседания", "2", "8-10", "50% нагрузки", "APRE_3", 0),
        ex("Ягодичный мост", "2", "12", "Лёгкая"),
      ]
    ),
    session(
      'endurance',
      "Длинная пробежка 5 км",
      "Zone 2, 30 мин (разгрузка)",
      { distance: 5, duration: 30 },
      [
        ex("Разминка", "—", "8 мин", "Разгрузочная"),
        ex("Бег Zone 2", "—", "5 км", "Пульс 125-135 bpm, 30 мин (50% объёма)"),
        ex("Заминка", "—", "5-8 мин", "Короткая"),
      ]
    ),
    session(
      'recovery',
      "Полный отдых",
      "Отдых + мобильность",
      { distance: 0, duration: 15 },
      [
        ex("Мобильность", "—", "15 мин", "Суперкомпенсация"),
      ]
    ),
  ].filter((s): s is NonNullable<typeof s> => s !== null);
}

export const RunningPlanModule: SportPlanModule = {
  sport: 'running',
  phases: {
    base: basePhase,
    build: buildPhase,
    peak: peakPhase,
    deload: deloadPhase,
  },
};
