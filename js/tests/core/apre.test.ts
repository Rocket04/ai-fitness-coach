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

describe('applyApre — APRE_6 (kg)', () => {
  it('reduces weight after weak performance (≤2 reps)', () => {
    expect(applyApre('APRE_6', 2)).toEqual({ set4Adjust: -5, nextWeekAdjust: -5 });
    expect(applyApre('APRE_6', 1)).toEqual({ set4Adjust: -5, nextWeekAdjust: -5 });
  });

  it('makes small adjustments after moderate performance (3-4 reps)', () => {
    expect(applyApre('APRE_6', 3)).toEqual({ set4Adjust: -2.5, nextWeekAdjust: 0 });
    expect(applyApre('APRE_6', 4)).toEqual({ set4Adjust: -2.5, nextWeekAdjust: 0 });
  });

  it('increases weight after solid performance (5-7 reps)', () => {
    expect(applyApre('APRE_6', 7)).toEqual({ set4Adjust: 0, nextWeekAdjust: 2.5 });
  });

  it('increases weight more after good performance (8-12 reps)', () => {
    expect(applyApre('APRE_6', 10)).toEqual({ set4Adjust: 2.5, nextWeekAdjust: 5 });
  });

  it('increases weight most after strong performance (>12 reps)', () => {
    expect(applyApre('APRE_6', 15)).toEqual({ set4Adjust: 5, nextWeekAdjust: 7.5 });
  });
});

describe('applyApre — APRE_3 (kg)', () => {
  it('reduces weight after weak performance (≤2 reps)', () => {
    expect(applyApre('APRE_3', 2)).toEqual({ set4Adjust: -5, nextWeekAdjust: -2.5 });
  });

  it('increases weight after solid performance (5-6 reps)', () => {
    expect(applyApre('APRE_3', 6)).toEqual({ set4Adjust: 5, nextWeekAdjust: 5 });
  });

  it('increases weight most after strong performance (>6 reps)', () => {
    expect(applyApre('APRE_3', 8)).toEqual({ set4Adjust: 10, nextWeekAdjust: 7.5 });
  });
});

describe('applyApre — APRE_10 (kg)', () => {
  it('reduces weight after weak performance (≤6 reps)', () => {
    expect(applyApre('APRE_10', 5)).toEqual({ set4Adjust: -5, nextWeekAdjust: -5 });
  });

  it('makes small adjustments after moderate performance (7-8 reps)', () => {
    expect(applyApre('APRE_10', 8)).toEqual({ set4Adjust: -2.5, nextWeekAdjust: 0 });
  });

  it('maintains weight after solid performance (9-11 reps)', () => {
    expect(applyApre('APRE_10', 11)).toEqual({ set4Adjust: 0, nextWeekAdjust: 2.5 });
  });
});

describe('applyApre — lbs conversion', () => {
  it('doubles kg adjustments for lbs unit', () => {
    expect(applyApre('APRE_6', 2, 'lbs')).toEqual({ set4Adjust: -10, nextWeekAdjust: -10 });
  });

  it('scales large adjustments correctly for lbs', () => {
    expect(applyApre('APRE_6', 15, 'lbs')).toEqual({ set4Adjust: 10, nextWeekAdjust: 15 });
  });

  it('applies lbs-specific rounding for APRE_3', () => {
    expect(applyApre('APRE_3', 8, 'lbs')).toEqual({ set4Adjust: 20, nextWeekAdjust: 15 });
  });
});

describe('applyApre — edge cases', () => {
  it('returns zero adjustments for unknown protocol', () => {
    expect(applyApre('APRE_INVALID' as never, 5)).toEqual({ set4Adjust: 0, nextWeekAdjust: 0 });
  });

  it('returns zero adjustments for invalid rep count (NaN)', () => {
    expect(applyApre('APRE_6', NaN)).toEqual({ set4Adjust: 0, nextWeekAdjust: 0 });
  });

  it('returns zero adjustments for null rep count', () => {
    expect(applyApre('APRE_6', null as never)).toEqual({ set4Adjust: 0, nextWeekAdjust: 0 });
  });

  it('falls back to weakest adjustment band for zero reps', () => {
    expect(applyApre('APRE_6', 0)).toEqual({ set4Adjust: -5, nextWeekAdjust: -5 });
  });
});

// ── roundToNearestStep ────────────────────────────────────────────────────

describe('roundToNearestStep', () => {
  it('rounds kg down to nearest 2.5 increment', () => {
    expect(roundToNearestStep(101, 'kg')).toBe(100);
  });

  it('preserves exact kg step values', () => {
    expect(roundToNearestStep(102.5, 'kg')).toBe(102.5);
  });

  it('rounds kg to nearest 2.5 increment (down)', () => {
    expect(roundToNearestStep(103, 'kg')).toBe(102.5);
  });

  it('rounds kg to nearest 2.5 increment (up)', () => {
    expect(roundToNearestStep(104, 'kg')).toBe(105);
  });

  it('rounds lbs down to nearest 5 increment', () => {
    expect(roundToNearestStep(101, 'lbs')).toBe(100);
  });

  it('rounds lbs up to nearest 5 increment', () => {
    expect(roundToNearestStep(103, 'lbs')).toBe(105);
  });

  it('returns 0 for NaN input', () => {
    expect(roundToNearestStep(NaN)).toBe(0);
  });

  it('defaults to kg when unit is omitted', () => {
    expect(roundToNearestStep(100)).toBe(100);
  });
});

// ── calcApreSets ──────────────────────────────────────────────────────────

describe('calcApreSets — basic calculation (kg)', () => {
  it('returns null for invalid RM values', () => {
    expect(calcApreSets({ protocol: 'APRE_6', currentRM: 0 })).toBeNull();
    expect(calcApreSets({ protocol: 'APRE_6', currentRM: -10 })).toBeNull();
  });

  it('starts warmup sets light and builds to working weight', () => {
    const result = calcApreSets({ protocol: 'APRE_6', currentRM: 100 });
    expect(result?.set1.weight).toBe(50);
    expect(result?.set2.weight).toBe(75);
  });

  it('locks warmup sets from editing', () => {
    const result = calcApreSets({ protocol: 'APRE_6', currentRM: 100 });
    expect(result?.set1.readonly).toBe(true);
    expect(result?.set2.readonly).toBe(true);
  });

  it('marks set3 as AMRAP and editable', () => {
    const result = calcApreSets({ protocol: 'APRE_6', currentRM: 100 });
    expect(result?.set3.readonly).toBe(false);
    expect(result?.set3.reps).toBe('AMRAP');
  });

  it('disables set4 until AMRAP reps are entered', () => {
    const result = calcApreSets({ protocol: 'APRE_6', currentRM: 100 });
    expect(result?.set4.disabled).toBe(true);
    expect(result?.set4.weight).toBeNull();
  });

  it('calculates set4 weight based on AMRAP performance', () => {
    const result = calcApreSets({ protocol: 'APRE_6', currentRM: 100, set3Reps: 10 });
    expect(result?.set4.disabled).toBe(false);
    expect(result?.set4.weight).toBe(102.5);
  });
});

describe('calcApreSets — recovery score', () => {
  it('adjusts working weight down when recovery is poor', () => {
    const result = calcApreSets({ protocol: 'APRE_6', currentRM: 100, recoveryScore: 30 });
    expect(result?.effectiveRM).toBeLessThan(100);
    expect(result?.recoveryReduction).toBeGreaterThan(0);
  });

  it('keeps working weight unchanged when recovery is adequate', () => {
    const result = calcApreSets({ protocol: 'APRE_6', currentRM: 100, recoveryScore: 50 });
    expect(result?.effectiveRM).toBe(100);
    expect(result?.recoveryReduction).toBe(0);
  });
});

describe('calcApreSets — lbs', () => {
  it('rounds weights to nearest 5 lbs', () => {
    const result = calcApreSets({ protocol: 'APRE_6', currentRM: 100, unit: 'lbs' });
    expect(result?.set1.weight).toBe(50);
    expect(result?.set2.weight).toBe(75);
  });
});

// ── calcNextWeekRM ────────────────────────────────────────────────────────

describe('calcNextWeekRM', () => {
  it('increases RM after solid performance', () => {
    expect(calcNextWeekRM('APRE_6', 100, 10)).toBe(105);
  });

  it('increases RM more after strong performance', () => {
    expect(calcNextWeekRM('APRE_6', 100, 15)).toBe(107.5);
  });

  it('decreases RM after weak performance', () => {
    expect(calcNextWeekRM('APRE_6', 100, 2)).toBe(95);
  });

  it('never drops below zero', () => {
    expect(calcNextWeekRM('APRE_6', 5, 1)).toBeGreaterThanOrEqual(0);
  });

  it('limits weight progression for bodyweight exercises', () => {
    expect(calcNextWeekRM('APRE_6', 5, 15, 'kg', true)).toBe(5);
    expect(calcNextWeekRM('APRE_6', 1, 2, 'kg', true)).toBe(1);
  });
});

// ── isStrengthExercise ────────────────────────────────────────────────────

describe('isStrengthExercise', () => {
  it('recognises multi-set resistance exercises as strength', () => {
    expect(isStrengthExercise({ n: 'Подтягивания', s: '3', r: '6–8' })).toBe(true);
  });

  it('recognises tempo resistance exercises as strength', () => {
    expect(isStrengthExercise({ n: 'Отжимания темп 3-0-1', s: '3', r: '6–8' })).toBe(true);
  });

  it('excludes cardio zones from strength classification', () => {
    expect(isStrengthExercise({ n: 'Бег Zone 2', s: '—', r: '12–15 мин · 125–140 bpm' })).toBe(false);
  });

  it('excludes mobility work from strength classification', () => {
    expect(isStrengthExercise({ n: 'Ходьба разминка', s: '—', r: '7–8 мин' })).toBe(false);
  });

  it('excludes isometric holds from strength classification', () => {
    expect(isStrengthExercise({ n: 'Планка на локтях', s: '3', r: '25–35 сек' })).toBe(false);
  });

  it('excludes test exercises from strength classification', () => {
    expect(isStrengthExercise({ n: 'Тест: подтягивания', s: '1', r: 'макс', isTest: true })).toBe(false);
  });

  it('exercises with only 1 set are not strength', () => {
    expect(isStrengthExercise({ n: 'Подтягивания', s: '1', r: '5' })).toBe(false);
  });

  it('handles null exercise safely', () => {
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

  it('tags strength exercises for APRE and skips cardio', () => {
    const result = annotateExercisesWithApre(exercises);
    expect(result[0].isApre).toBe(true);
    expect(result[1].isApre).toBeUndefined();
    expect(result[2].isApre).toBe(true);
  });

  it('uses default RM of 2 when no prior results exist', () => {
    const result = annotateExercisesWithApre(exercises);
    expect(result[0].currentRM).toBe(2);
  });

  it('applies next RM from previous session results', () => {
    const prev = [{ exerciseName: 'Подтягивания параллельным хватом', nextRM: 4, protocol: 'APRE_6' as const, unit: 'kg' as const, isCalisthenics: true, lastSet3Reps: 8, lastSet4Reps: 8 }];
    const result = annotateExercisesWithApre(exercises, prev);
    expect(result[0].currentRM).toBe(4);
  });

  it('does not mutate the original array', () => {
    const original = exercises.map(e => ({ ...e }));
    annotateExercisesWithApre(exercises);
    expect(exercises[0]).toEqual(original[0]);
  });
});

// ── inferApreProtocol ─────────────────────────────────────────────────────

describe('inferApreProtocol', () => {
  it('selects APRE_3 for low-rep ranges', () => {
    expect(inferApreProtocol('Жим', '5')).toBe('APRE_3');
  });

  it('selects APRE_6 for moderate-rep ranges', () => {
    expect(inferApreProtocol('Присед', '6–8')).toBe('APRE_6');
  });

  it('selects APRE_10 for high-rep ranges', () => {
    expect(inferApreProtocol('Тяга', '10')).toBe('APRE_10');
  });

  it('falls back to APRE_6 when rep count is not numeric', () => {
    expect(inferApreProtocol('Упражнение', 'макс')).toBe('APRE_6');
  });
});
