import { describe, it, expect } from 'vitest';
import {
  applyApre,
  roundToNearestStep,
  calcApreSets,
  calcNextWeekRM,
  isStrengthExercise,
  annotateExercisesWithApre,
  inferApreProtocol,
} from '../../core/apre/engine.js';

// ── applyApre ──────────────────────────────────────────────────────────────

describe('applyApre — APRE_6 (кг)', () => {
  it('≤2 повтора → set4: -5, nextWeek: -5', () => {
    expect(applyApre('APRE_6', 2)).toEqual({ set4Adjust: -5, nextWeekAdjust: -5 });
    expect(applyApre('APRE_6', 1)).toEqual({ set4Adjust: -5, nextWeekAdjust: -5 });
  });

  it('3-4 повтора → set4: -2.5, nextWeek: 0', () => {
    expect(applyApre('APRE_6', 3)).toEqual({ set4Adjust: -2.5, nextWeekAdjust: 0 });
    expect(applyApre('APRE_6', 4)).toEqual({ set4Adjust: -2.5, nextWeekAdjust: 0 });
  });

  it('5-7 повторов → set4: 0, nextWeek: 2.5', () => {
    expect(applyApre('APRE_6', 7)).toEqual({ set4Adjust: 0, nextWeekAdjust: 2.5 });
  });

  it('8-12 повторов → set4: 2.5, nextWeek: 5', () => {
    expect(applyApre('APRE_6', 10)).toEqual({ set4Adjust: 2.5, nextWeekAdjust: 5 });
  });

  it('>12 повторов → set4: 5, nextWeek: 7.5', () => {
    expect(applyApre('APRE_6', 15)).toEqual({ set4Adjust: 5, nextWeekAdjust: 7.5 });
  });
});

describe('applyApre — APRE_3 (кг)', () => {
  it('≤2 повтора → set4: -5, nextWeek: -2.5', () => {
    expect(applyApre('APRE_3', 2)).toEqual({ set4Adjust: -5, nextWeekAdjust: -2.5 });
  });

  it('5-6 повторов → set4: 5, nextWeek: 5', () => {
    expect(applyApre('APRE_3', 6)).toEqual({ set4Adjust: 5, nextWeekAdjust: 5 });
  });

  it('>6 повторов → set4: 10, nextWeek: 7.5', () => {
    expect(applyApre('APRE_3', 8)).toEqual({ set4Adjust: 10, nextWeekAdjust: 7.5 });
  });
});

describe('applyApre — APRE_10 (кг)', () => {
  it('≤6 повторов → set4: -5, nextWeek: -5', () => {
    expect(applyApre('APRE_10', 5)).toEqual({ set4Adjust: -5, nextWeekAdjust: -5 });
  });

  it('7-8 повторов → set4: -2.5, nextWeek: 0', () => {
    expect(applyApre('APRE_10', 8)).toEqual({ set4Adjust: -2.5, nextWeekAdjust: 0 });
  });

  it('9-11 повторов → set4: 0, nextWeek: 2.5', () => {
    expect(applyApre('APRE_10', 11)).toEqual({ set4Adjust: 0, nextWeekAdjust: 2.5 });
  });
});

describe('applyApre — lbs конвертация', () => {
  it('APRE_6 ≤2 повтора lbs → set4: -10, nextWeek: -10', () => {
    expect(applyApre('APRE_6', 2, 'lbs')).toEqual({ set4Adjust: -10, nextWeekAdjust: -10 });
  });

  it('APRE_6 >12 повторов lbs → set4: 10, nextWeek: 15', () => {
    expect(applyApre('APRE_6', 15, 'lbs')).toEqual({ set4Adjust: 10, nextWeekAdjust: 15 });
  });

  it('APRE_3 >6 повторов lbs → set4: 20, nextWeek: 15', () => {
    expect(applyApre('APRE_3', 8, 'lbs')).toEqual({ set4Adjust: 20, nextWeekAdjust: 15 });
  });
});

describe('applyApre — граничные случаи', () => {
  it('несуществующий протокол → 0, 0', () => {
    expect(applyApre('APRE_INVALID' as never, 5)).toEqual({ set4Adjust: 0, nextWeekAdjust: 0 });
  });

  it('NaN повторений → 0, 0', () => {
    expect(applyApre('APRE_6', NaN)).toEqual({ set4Adjust: 0, nextWeekAdjust: 0 });
  });

  it('null повторений → 0, 0', () => {
    expect(applyApre('APRE_6', null as never)).toEqual({ set4Adjust: 0, nextWeekAdjust: 0 });
  });

  it('0 повторений → находит первую строку (≤2)', () => {
    expect(applyApre('APRE_6', 0)).toEqual({ set4Adjust: -5, nextWeekAdjust: -5 });
  });
});

// ── roundToNearestStep ────────────────────────────────────────────────────

describe('roundToNearestStep', () => {
  it('кг: 101 → 100 (ближайшие 2.5)', () => {
    expect(roundToNearestStep(101, 'kg')).toBe(100);
  });

  it('кг: 102.5 → 102.5', () => {
    expect(roundToNearestStep(102.5, 'kg')).toBe(102.5);
  });

  it('кг: 103 → 102.5', () => {
    expect(roundToNearestStep(103, 'kg')).toBe(102.5);
  });

  it('кг: 104 → 105', () => {
    expect(roundToNearestStep(104, 'kg')).toBe(105);
  });

  it('lbs: 101 → 100', () => {
    expect(roundToNearestStep(101, 'lbs')).toBe(100);
  });

  it('lbs: 103 → 105', () => {
    expect(roundToNearestStep(103, 'lbs')).toBe(105);
  });

  it('NaN → 0', () => {
    expect(roundToNearestStep(NaN)).toBe(0);
  });

  it('дефолт unit = кг', () => {
    expect(roundToNearestStep(100)).toBe(100);
  });
});

// ── calcApreSets ──────────────────────────────────────────────────────────

describe('calcApreSets — базовый расчёт (кг)', () => {
  it('возвращает null для невалидного RM', () => {
    expect(calcApreSets({ protocol: 'APRE_6', currentRM: 0 })).toBeNull();
    expect(calcApreSets({ protocol: 'APRE_6', currentRM: -10 })).toBeNull();
  });

  it('set1: 50% от RM, set2: 75%', () => {
    const result = calcApreSets({ protocol: 'APRE_6', currentRM: 100 });
    expect(result?.set1.weight).toBe(50);
    expect(result?.set2.weight).toBe(75);
  });

  it('set1 и set2 — readonly', () => {
    const result = calcApreSets({ protocol: 'APRE_6', currentRM: 100 });
    expect(result?.set1.readonly).toBe(true);
    expect(result?.set2.readonly).toBe(true);
  });

  it('set3 — AMRAP, не readonly', () => {
    const result = calcApreSets({ protocol: 'APRE_6', currentRM: 100 });
    expect(result?.set3.readonly).toBe(false);
    expect(result?.set3.reps).toBe('AMRAP');
  });

  it('set4 disabled до заполнения set3', () => {
    const result = calcApreSets({ protocol: 'APRE_6', currentRM: 100 });
    expect(result?.set4.disabled).toBe(true);
    expect(result?.set4.weight).toBeNull();
  });

  it('set4 рассчитывается после set3Reps', () => {
    const result = calcApreSets({ protocol: 'APRE_6', currentRM: 100, set3Reps: 10 });
    expect(result?.set4.disabled).toBe(false);
    // APRE_6, 10 повторений → set4Adjust = +2.5 → 100 + 2.5 = 102.5
    expect(result?.set4.weight).toBe(102.5);
  });
});

describe('calcApreSets — recovery score', () => {
  it('recoveryScore < 40 → effectiveRM снижается на ~10%', () => {
    const result = calcApreSets({ protocol: 'APRE_6', currentRM: 100, recoveryScore: 30 });
    expect(result?.effectiveRM).toBeLessThan(100);
    expect(result?.recoveryReduction).toBeGreaterThan(0);
  });

  it('recoveryScore >= 40 → effectiveRM не изменяется', () => {
    const result = calcApreSets({ protocol: 'APRE_6', currentRM: 100, recoveryScore: 50 });
    expect(result?.effectiveRM).toBe(100);
    expect(result?.recoveryReduction).toBe(0);
  });
});

describe('calcApreSets — lbs', () => {
  it('веса округляются до ближайших 5 lbs', () => {
    const result = calcApreSets({ protocol: 'APRE_6', currentRM: 100, unit: 'lbs' });
    expect(result?.set1.weight).toBe(50);
    expect(result?.set2.weight).toBe(75);
  });
});

// ── calcNextWeekRM ────────────────────────────────────────────────────────

describe('calcNextWeekRM', () => {
  it('APRE_6, 10 повторений → currentRM + 5', () => {
    expect(calcNextWeekRM('APRE_6', 100, 10)).toBe(105);
  });

  it('APRE_6, 15 повторений → currentRM + 7.5', () => {
    expect(calcNextWeekRM('APRE_6', 100, 15)).toBe(107.5);
  });

  it('APRE_6, 2 повторения → currentRM - 5', () => {
    expect(calcNextWeekRM('APRE_6', 100, 2)).toBe(95);
  });

  it('не может стать отрицательным', () => {
    expect(calcNextWeekRM('APRE_6', 5, 1)).toBeGreaterThanOrEqual(0);
  });

  it('калистеника: прогрессия ограничена [1, 5]', () => {
    expect(calcNextWeekRM('APRE_6', 5, 15, 'kg', true)).toBe(5);
    expect(calcNextWeekRM('APRE_6', 1, 2, 'kg', true)).toBe(1);
  });
});

// ── isStrengthExercise ────────────────────────────────────────────────────

describe('isStrengthExercise', () => {
  it('подтягивания с 3 подходами и числовыми повторениями → true', () => {
    expect(isStrengthExercise({ n: 'Подтягивания', s: '3', r: '6–8' })).toBe(true);
  });

  it('отжимания 3×8 → true', () => {
    expect(isStrengthExercise({ n: 'Отжимания темп 3-0-1', s: '3', r: '6–8' })).toBe(true);
  });

  it('бег Zone 2 → false', () => {
    expect(isStrengthExercise({ n: 'Бег Zone 2', s: '—', r: '12–15 мин · 125–140 bpm' })).toBe(false);
  });

  it('ходьба разминка → false', () => {
    expect(isStrengthExercise({ n: 'Ходьба разминка', s: '—', r: '7–8 мин' })).toBe(false);
  });

  it('планка (изометрия с сек) → false', () => {
    expect(isStrengthExercise({ n: 'Планка на локтях', s: '3', r: '25–35 сек' })).toBe(false);
  });

  it('тестовое упражнение → false', () => {
    expect(isStrengthExercise({ n: 'Тест: подтягивания', s: '1', r: 'макс', isTest: true })).toBe(false);
  });

  it('1 подход → false (слишком мало)', () => {
    expect(isStrengthExercise({ n: 'Подтягивания', s: '1', r: '5' })).toBe(false);
  });

  it('null упражнение → false', () => {
    expect(isStrengthExercise(null as never)).toBe(false);
  });
});

// ── annotateExercisesWithApre ─────────────────────────────────────────────

describe('annotateExercisesWithApre', () => {
  const exercises = [
    { n: 'Подтягивания параллельным хватом', s: '3', r: '5–6' },
    { n: 'Бег Zone 2', s: '—', r: '12–15 мин' },
    { n: 'Отжимания темп 3-0-1', s: '3', r: '6–8' },
  ];

  it('помечает силовые, пропускает кардио/мобильность', () => {
    const result = annotateExercisesWithApre(exercises);
    expect(result[0].isApre).toBe(true);
    expect(result[1].isApre).toBeUndefined();
    expect(result[2].isApre).toBe(true);
  });

  it('использует defaultLevel=2 без предыдущих результатов', () => {
    const result = annotateExercisesWithApre(exercises);
    expect(result[0].currentRM).toBe(2);
  });

  it('применяет nextRM из предыдущих результатов', () => {
    const prev = [{ exerciseName: 'Подтягивания параллельным хватом', nextRM: 4, protocol: 'APRE_6' as const, unit: 'kg' as const, isCalisthenics: true, lastSet3Reps: 8, lastSet4Reps: 8 }];
    const result = annotateExercisesWithApre(exercises, prev);
    expect(result[0].currentRM).toBe(4);
  });

  it('не мутирует исходный массив', () => {
    const original = exercises.map(e => ({ ...e }));
    annotateExercisesWithApre(exercises);
    expect(exercises[0]).toEqual(original[0]);
  });
});

// ── inferApreProtocol ─────────────────────────────────────────────────────

describe('inferApreProtocol', () => {
  it('5 повторений → APRE_3', () => {
    expect(inferApreProtocol('Жим', '5')).toBe('APRE_3');
  });

  it('6 повторений → APRE_6', () => {
    expect(inferApreProtocol('Присед', '6–8')).toBe('APRE_6');
  });

  it('10 повторений → APRE_10', () => {
    expect(inferApreProtocol('Тяга', '10')).toBe('APRE_10');
  });

  it('нет числа → APRE_6 (fallback)', () => {
    expect(inferApreProtocol('Упражнение', 'макс')).toBe('APRE_6');
  });
});
