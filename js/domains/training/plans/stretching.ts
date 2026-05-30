// js/domains/training/plans/stretching.ts
// Stretching & mobility training plan module

import type { SportPlanModule, SessionPlan, Exercise } from '../../../core/types.js';

const ex = (n: string, s: string, r: string, w?: string): Exercise => ({ n, s, r, ...(w && { w }) });

const session = (
  sessionType: SessionPlan['sessionType'], name: string, description: string,
  defaultParams: Record<string, number>, exercises: Exercise[],
): Omit<SessionPlan, 'date' | 'sessionId'> => ({
  sport: 'stretching', sessionType, name, description,
  defaultParameters: defaultParams, exercises, mode: 'full', isDeload: false, isRestDay: false,
});

function basePhase(w: number): Omit<SessionPlan, 'date' | 'sessionId'>[] {
  const d = 15 + w;
  return [
    session('mobility', 'Растяжка всего тела', 'Растяжка всего тела ' + d + ' мин', { duration: d }, [
      ex('Шея и плечи', '-', '3 мин'), ex('Поясница', '-', '3 мин'), ex('Бёдра', '-', '4 мин'), ex('Ноги', '-', '3 мин'),
    ]),
    session('mobility', 'Растяжка низа тела', 'Растяжка ног и бёдер ' + d + ' мин', { duration: d }, [
      ex('Задняя цепь', '-', '3 мин'), ex('Квадрицепс', '-', '3 мин'), ex('Икры', '-', '2 мин'),
    ]),
    session('mobility', 'Растяжка верха тела', 'Растяжка плеч и рук ' + d + ' мин', { duration: d }, [
      ex('Плечевой сустав', '-', '4 мин'), ex('Запястья', '-', '2 мин'),
    ]),
    session('mobility', 'Растяжка ТБС', 'Подвижность таза ' + d + ' мин', { duration: d }, [
      ex('90/90', '2', '3 мин / сторона'), ex('Скрутки лёжа', '2', '3 мин / сторона'),
    ]),
    session('mobility', 'Растяжка всего тела', 'Растяжка всего тела ' + d + ' мин', { duration: d }, [
      ex('Растяжка', '-', (d - 6) + ' мин'), ex('Расслабление', '-', '3 мин'),
    ]),
    session('recovery', 'Активное восстановление', 'Мягкая растяжка ' + (d - 5) + ' мин', { duration: d - 5 }, [
      ex('Мягкие движения', '-', (d - 5) + ' мин'),
    ]),
    null,
  ].filter((s): s is NonNullable<typeof s> => s !== null);
}

function buildPhase(w: number): Omit<SessionPlan, 'date' | 'sessionId'>[] {
  const d = 18 + w;
  return [
    session('mobility', 'Растяжка глубокая', 'Глубокая растяжка ' + d + ' мин', { duration: d }, [
      ex('Глубокая растяжка ног', '-', '7 мин'), ex('Верх тела', '-', '6 мин'), ex('Шавасана', '-', '3 мин'),
    ]),
    session('mobility', 'Растяжка ПНФ', 'ПНФ-растяжка ' + d + ' мин', { duration: d }, [
      ex('Ноги ПНФ', '-', '6 мин'), ex('Руки ПНФ', '-', '6 мин'),
    ]),
    session('mobility', 'Растяжка поток', 'Подвижностной поток ' + d + ' мин', { duration: d }, [
      ex('Поток ТБС', '-', '8 мин'), ex('Поток плеч', '-', '8 мин'), ex('Заминка', '-', '3 мин'),
    ]),
    session('mobility', 'Растяжка ин-стиль', 'Длительная растяжка ' + (d + 5) + ' мин', { duration: d + 5 }, [
      ex('Долгие асаны', '4', '5 мин / поза'),
    ]),
    session('mobility', 'Активная подвижность', 'Контролируемая подвижность ' + d + ' мин', { duration: d }, [
      ex('CARs Плечи', '1', '5 мин'), ex('CARs ТБС', '1', '5 мин'), ex('CARs Позвоночник', '1', '5 мин'),
    ]),
    session('recovery', 'Растяжка восстановление', 'Мягкая растяжка ' + (d - 5) + ' мин', { duration: d - 5 }, [
      ex('Интуитивная растяжка', '-', (d - 5) + ' мин'),
    ]),
    null,
  ].filter((s): s is NonNullable<typeof s> => s !== null);
}

function peakPhase(w: number): Omit<SessionPlan, 'date' | 'sessionId'>[] {
  const d = 20 + w;
  return [
    session('mobility', 'Максимальная растяжка', 'Максимальная растяжка ' + d + ' мин', { duration: d }, [
      ex('Разогрев', '-', '5 мин'), ex('Максимальная растяжка', '-', (d - 10) + ' мин'), ex('Дыхание', '-', '5 мин'),
    ]),
    session('mobility', 'Растяжка ПНФ интенсив', 'ПНФ-растяжка ' + d + ' мин', { duration: d }, [
      ex('Ноги ПНФ', '-', (d / 2) + ' мин'), ex('Руки ПНФ', '-', (d / 2) + ' мин'),
    ]),
    session('mobility', 'Поток подвижности', 'Подвижностной поток ' + d + ' мин', { duration: d }, [
      ex('Поток ТБС', '-', '8 мин'), ex('Поток плеч', '-', '8 мин'), ex('Заминка', '-', '3 мин'),
    ]),
    session('mobility', 'Глубокий ин', 'Глубокий ин ' + (d + 5) + ' мин', { duration: d + 5 }, [
      ex('Долгие асаны', '4', '5 мин / поза'),
    ]),
    session('recovery', 'Активное восстановление', 'Лёгкая подвижность ' + (d - 10) + ' мин', { duration: d - 10 }, [
      ex('Лёгкие движения', '-', (d - 10) + ' мин'),
    ]),
    session('mobility', 'Полная практика', 'Полная практика ' + d + ' мин', { duration: d }, [
      ex('Разминка', '-', '5 мин'), ex('Основная часть', '-', (d - 10) + ' мин'), ex('Заминка', '-', '5 мин'),
    ]),
    null,
  ].filter((s): s is NonNullable<typeof s> => s !== null);
}

function deloadPhase(): Omit<SessionPlan, 'date' | 'sessionId'>[] {
  return [
    session('recovery', 'Лёгкая растяжка', 'Лёгкая растяжка 10 мин', { duration: 10 }, [
      ex('Мягкие движения', '-', '10 мин'),
    ]),
    null,
    session('recovery', 'Лёгкая растяжка', 'Лёгкая растяжка 10 мин', { duration: 10 }, [
      ex('Мягкие движения', '-', '10 мин'),
    ]),
    null,
    session('recovery', 'Лёгкая растяжка', 'Лёгкая растяжка 10 мин', { duration: 10 }, [
      ex('Мягкие движения', '-', '10 мин'),
    ]),
    null, null,
  ].filter((s): s is NonNullable<typeof s> => s !== null);
}

export const StretchingPlanModule: SportPlanModule = {
  sport: 'stretching',
  phases: { base: basePhase, build: buildPhase, peak: peakPhase, deload: deloadPhase },
};
