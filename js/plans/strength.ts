// js/plans/strength.ts
// Strength-focused periodized training plan module
// Upper/Lower split to avoid interference with running
// Phases: base → build → peak → deload (4-week cycles)

import type { SportPlanModule, SessionPlan, Exercise } from '../core/types.js';

const ex = (
  n: string, s: string, r: string,
  w?: string, c?: string,
  apre?: 'APRE_3' | 'APRE_6' | 'APRE_10',
  rm?: number
): Exercise => ({
  n, s, r,
  ...(w && { w }),
  ...(c && { c }),
  ...(apre && { isApre: true, protocol: apre, currentRM: rm ?? 0 }),
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
  sport: 'strength_gym',
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

// Base Phase (Weeks 1-4): 3×10-12 reps, 60-70% 1RM, 3 sets - adaptation
function basePhase(weekInPhase: number): Omit<SessionPlan, 'date' | 'sessionId'>[] {
  const sets = 3;
  const reps = 10 + (weekInPhase - 1); // 10, 11, 12, 13
  const intensity = 60 + (weekInPhase - 1) * 2.5; // 60%, 62.5%, 65%, 67.5%

  return [
    // Monday: Upper Body (Push/Pull)
    session(
      'hypertrophy',
      "Верх тела — Тяга + Жим",
      `${sets}×${reps}, ${intensity}% 1RM`,
      { sets, reps, intensity },
      [
        ex("Подтягивания", `${sets}`, `${reps - 2}`, "НЕ до отказа", "APRE_6"),
        ex("Жим лёжа", `${sets}`, `${reps - 2}`, "Контроль грифа", "APRE_3"),
        ex("Тяга в наклоне", `${sets}`, `${reps}`, "Контроль негативной фазы"),
        ex("Отжимания", `${sets}`, `${reps}`, "Лопатки сведены"),
        ex("W-подъём лёжа", `${sets}`, "10", "Нижние трапеции"),
      ]
    ),
    // Tuesday: Lower Body (Squat/Hinge)
    session(
      'hypertrophy',
      "Низ тела — Квадрицепс",
      `${sets}×${reps}, ${intensity}% 1RM`,
      { sets, reps, intensity },
      [
        ex("Приседания со штангой", `${sets}`, `${reps - 2}`, "Полная амплитуда", "APRE_3"),
        ex("Болгарский сплит-присед", `${sets}`, `${reps}`, "Контролируемая нагрузка"),
        ex("Ягодичный мост", `${sets}`, "15", "Пауза 2 сек вверху"),
        ex("Становая тяга (румынская)", `${sets}`, `${reps}`, "Растяжение задней цепи"),
        ex("Планка", `${sets}`, "30-40 сек", "Антигравитационный кор"),
      ]
    ),
    null, // Wednesday: Rest
    // Thursday: Upper Body (Accessory)
    session(
      'hypertrophy',
      "Верх тела — Жим + Тяга",
      `${sets}×${reps}, ${intensity}% 1RM`,
      { sets, reps, intensity },
      [
        ex("Жим гантелей сидя", `${sets}`, `${reps - 2}`, "Плечевой сустав", "APRE_3"),
        ex("Подтягивания параллельным хватом", `${sets}`, `${reps - 2}`, "Паттерн тяги", "APRE_6"),
        ex("Отжимания с ногами на возвышении", `${sets}`, `${reps}`, "Новый угол"),
        ex("Face pull", `${sets}`, "12", "Задняя дельта"),
        ex("Внешняя ротация плеча", `${sets}`, "10 / сторону", "Инфраспинатус"),
      ]
    ),
    // Friday: Rest (Running day)
    null,
    // Saturday: Lower Body (Accessory)
    session(
      'hypertrophy',
      "Низ тела — Задняя цепь",
      `${sets}×${reps}, ${intensity}% 1RM`,
      { sets, reps, intensity },
      [
        ex("Румынская тяга", `${sets}`, `${reps - 2}`, "Нейтральный позвоночник", "APRE_3"),
        ex("Сплит-присед (короткий шаг)", `${sets}`, `${reps}`, "Без нагрузки на ТБС"),
        ex("Ягодичный мост одноногий", `${sets}`, "10 / сторону", "Унилатеральный"),
        ex("Dead bug", `${sets}`, "5 / сторону", "Глубокий кор"),
        ex("Bicycle crunch", `${sets}`, "10 / сторону", "Ротационный кор"),
      ]
    ),
    // Sunday: Recovery
    session(
      'recovery',
      "Восстановление",
      "15-20 мин мобильности",
      { duration: 20 },
      [
        ex("Мобильность", "—", "20 мин", "Поддержание"),
        ex("Растяжка", "—", "15 мин", "Задняя цепь + плечи"),
      ]
    ),
  ].filter((s): s is NonNullable<typeof s> => s !== null);
}

// Build Phase (Weeks 5-8): 4×6-10 reps, 70-80% 1RM - progression
function buildPhase(weekInPhase: number): Omit<SessionPlan, 'date' | 'sessionId'>[] {
  const sets = 4;
  const reps = 6 + (weekInPhase - 1); // 6, 7, 8, 9
  const intensity = 70 + (weekInPhase - 1) * 2.5; // 70%, 72.5%, 75%, 77.5%

  return [
    session(
      'strength',
      "Верх тела — Тяга макс",
      `${sets}×${reps}, ${intensity}% 1RM`,
      { sets, reps, intensity },
      [
        ex("Подтягивания с паузой", `${sets}`, `${reps}`, "Пауза 2 сек вверху", "APRE_6"),
        ex("Тяга в наклоне", `${sets}`, `${reps}`, "Локти к телу"),
        ex("W+Y подъёмы", `${sets}`, "10 каждая", "Трапеции + нижние лопатки"),
        ex("Face pull", `${sets}`, "12", "Задняя дельта"),
        ex("Hollow body hold", `${sets}`, "15-20 сек", "Гимнастический кор"),
      ]
    ),
    session(
      'strength',
      "Низ тела — Задняя цепь",
      `${sets}×${reps}, ${intensity}% 1RM`,
      { sets, reps, intensity },
      [
        ex("Становая тяга", `${sets}`, `${reps - 2}`, "Нейтральный позвоночник", "APRE_3"),
        ex("Румынская тяга", `${sets}`, `${reps}`, "Растяжение задней цепи"),
        ex("Ягодичный мост одноногий", `${sets}`, "10 / сторону", "Унилатеральный"),
        ex("Bicycle crunch", `${sets}`, "10 / сторону", "Ротационный кор"),
      ]
    ),
    null, // Rest
    session(
      'strength',
      "Верх тела — Жим макс",
      `${sets}×${reps}, ${intensity}% 1RM`,
      { sets, reps, intensity },
      [
        ex("Жим лёжа", `${sets}`, `${reps - 2}`, "Прогрессия веса", "APRE_3"),
        ex("Жим гантелей на наклонной", `${sets}`, `${reps}`, "30° угол"),
        ex("Отжимания с ногами на возвышении", `${sets}`, `${reps}`, "Новый угол"),
        ex("Push-up plus", `${sets}`, "10", "Передняя зубчатая"),
        ex("Pallof press", `${sets}`, "8 / сторону", "Антиротация"),
      ]
    ),
    null, // Rest (Running day)
    session(
      'strength',
      "Низ тела — Макс сила",
      `${sets}×${reps}, ${intensity}% 1RM`,
      { sets, reps, intensity },
      [
        ex("Приседания", `${sets}`, `${reps - 2}`, "Тяжёлые", "APRE_3"),
        ex("Сплит-присед с весом", `${sets}`, "8 / сторону", "Прогрессия"),
        ex("Ягодичный мост", `${sets}`, "15", "Пауза 2 сек"),
        ex("RKC планка", `${sets}`, "12-15 сек", "Макс напряжение"),
      ]
    ),
    session(
      'recovery',
      "Восстановление",
      "20-25 мин мобильности",
      { duration: 25 },
      [
        ex("Мобильность полная", "—", "25 мин", "ТБС"),
        ex("Hollow ↔ Arch rock", "3", "8 циклов", "Полный диапазон"),
      ]
    ),
  ].filter((s): s is NonNullable<typeof s> => s !== null);
}

// Peak Phase (Weeks 9-12): 5×2-5 reps, 85-95% 1RM - peak strength
function peakPhase(weekInPhase: number): Omit<SessionPlan, 'date' | 'sessionId'>[] {
  const sets = 5;
  const reps = 2 + (weekInPhase - 1); // 2, 3, 4, 5
  const intensity = 85 + (weekInPhase - 1) * 2.5; // 85%, 87.5%, 90%, 92.5%

  return [
    session(
      'power',
      "Верх тела — Тяга пик",
      `${sets}×${reps}, ${intensity}% 1RM`,
      { sets, reps, intensity },
      [
        ex("Подтягивания", `${sets}`, `${reps + 3}`, "Макс объём", "APRE_3"),
        ex("Тяга в наклоне тяжёлая", `${sets}`, `${reps}`, "Увеличить вес", "APRE_3"),
        ex("W-подъём с паузой 3 сек", `${sets}`, "8", "Изометрия"),
        ex("Внешняя ротация плеча", `${sets}`, "12 / сторону", "Здоровье плеча"),
        ex("Hollow ↔ Arch rock", `${sets}`, "8 циклов", "Полный диапазон"),
      ]
    ),
    session(
      'power',
      "Низ тела — Макс сила",
      `${sets}×${reps}, ${intensity}% 1RM`,
      { sets, reps, intensity },
      [
        ex("Приседания", `${sets}`, `${reps}`, "Тяжёлые", "APRE_3"),
        ex("Становая тяга", `${sets}`, `${reps - 1}`, "Пиковая нагрузка", "APRE_3"),
        ex("Сплит-присед с весом", `${sets}`, "8 / сторону", "Прогрессия"),
        ex("RKC планка", `${sets}`, "12-15 сек", "Макс напряжение"),
      ]
    ),
    null, // Rest
    session(
      'power',
      "Верх тела — Жим пик",
      `${sets}×${reps}, ${intensity}% 1RM`,
      { sets, reps, intensity },
      [
        ex("Жим лёжа", `${sets}`, `${reps}`, "Тяжёлый", "APRE_3"),
        ex("Жим гантелей тяжёлый", `${sets}`, `${reps}`, "Снижение темпа"),
        ex("Алмазные отжимания", `${sets}`, "8-10", "Трицепс"),
        ex("Push-up plus + Отжимания суперсет", `${sets}`, "8 + 8", "Сила+лопатка"),
        ex("Dead hang", `${sets}`, "макс", "Хват + декомпрессия"),
      ]
    ),
    null, // Rest (Running day)
    session(
      'power',
      "Низ тела — Пиковая нагрузка",
      `${sets}×${reps}, ${intensity}% 1RM`,
      { sets, reps, intensity },
      [
        ex("Приседания", `${sets + 1}`, `${reps}`, "Тяжёлые", "APRE_3"),
        ex("Становая тяга", `${sets}`, `${reps - 1}`, "Пик", "APRE_3"),
        ex("Сплит-присед с весом", `${sets}`, "8 / сторону", "Прогрессия"),
        ex("Dead bug", `${sets}`, "5 / сторону", "Глубокий кор"),
      ]
    ),
    session(
      'recovery',
      "Полный отдых",
      "25-30 мин мобильности",
      { duration: 30 },
      [
        ex("Мобильность полная", "—", "30 мин", "Итог"),
        ex("Прогулка", "—", "20-30 мин", "Лимфодренаж"),
      ]
    ),
  ].filter((s): s is NonNullable<typeof s> => s !== null);
}

// Deload Phase (Every 4th week): 2×10 reps, 50% 1RM - recovery
function deloadPhase(_weekInPhase: number): Omit<SessionPlan, 'date' | 'sessionId'>[] {
  return [
    session(
      'hypertrophy',
      "Верх тела (разгрузка)",
      "2×10, 50% 1RM",
      { sets: 2, reps: 10, intensity: 50 },
      [
        ex("Подтягивания", "2", "8-10", "50% нагрузки", "APRE_6"),
        ex("Отжимания", "2", "10-12", "Лёгкие"),
        ex("W-подъём", "2", "10", "Минимум"),
      ]
    ),
    session(
      'hypertrophy',
      "Низ тела (разгрузка)",
      "2×10, 50% 1RM",
      { sets: 2, reps: 10, intensity: 50 },
      [
        ex("Приседания", "2", "8-10", "50% нагрузки", "APRE_3"),
        ex("Ягодичный мост", "2", "12", "Лёгкая"),
        ex("Планка", "2", "20 сек", "Упрощённая"),
      ]
    ),
    null, // Rest
    session(
      'hypertrophy',
      "Верх тела (разгрузка)",
      "2×10, 50% 1RM",
      { sets: 2, reps: 10, intensity: 50 },
      [
        ex("Жим гантелей", "2", "8-10", "50% нагрузки", "APRE_3"),
        ex("Отжимания", "2", "10-12", "Лёгкие"),
        ex("Face pull", "2", "12", "Задняя дельта"),
      ]
    ),
    null, // Rest (Running day)
    session(
      'hypertrophy',
      "Низ тела (разгрузка)",
      "2×10, 50% 1RM",
      { sets: 2, reps: 10, intensity: 50 },
      [
        ex("Сплит-присед", "2", "8-10", "50% нагрузки"),
        ex("Ягодичный мост одноногий", "2", "8 / сторону", "Упрощённая"),
        ex("Dead bug", "2", "5 / сторону", "Лёгкая"),
      ]
    ),
    session(
      'recovery',
      "Полный отдых",
      "15 мин мобильности",
      { duration: 15 },
      [
        ex("Мобильность", "—", "15 мин", "Суперкомпенсация"),
      ]
    ),
  ].filter((s): s is NonNullable<typeof s> => s !== null);
}

export const StrengthGymPlanModule: SportPlanModule = {
  sport: 'strength_gym',
  phases: {
    base: basePhase,
    build: buildPhase,
    peak: peakPhase,
    deload: deloadPhase,
  },
};
