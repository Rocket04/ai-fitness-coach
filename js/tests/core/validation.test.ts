import { describe, it, expect } from 'vitest';

function validate(fields: {
  sleepHours: number; restHR: number; hrv: number; weight: number;
  muscleSoreness: number; energy: number; mood: number; sleepQuality: number; stress: number;
}): string | null {
  const { sleepHours, restHR, hrv, weight, muscleSoreness, energy, mood, sleepQuality, stress } = fields;
  const hasData = sleepHours > 0 || restHR > 0 || hrv > 0 || weight > 0 ||
    muscleSoreness > 0 || energy > 0 || mood > 0 || sleepQuality > 0 || stress > 0;
  if (!hasData) return 'Заполните хотя бы одно поле чтобы сохранить чек-ин';
  if (sleepHours > 0 && (sleepHours < 1 || sleepHours > 16)) return 'Сон: введите значение от 1 до 16 часов';
  if (restHR > 0 && (restHR < 30 || restHR > 120)) return 'ЧСС покоя: введите значение 30–120';
  if (hrv > 0 && (hrv < 10 || hrv > 200)) return 'HRV: введите значение 10–200 мс';
  return null;
}

const empty = { sleepHours: 0, restHR: 0, hrv: 0, weight: 0, muscleSoreness: 0, energy: 0, mood: 0, sleepQuality: 0, stress: 0 };

describe('CheckinForm validate', () => {
  it('returns error when all fields are zero', () => {
    expect(validate(empty)).toBeTruthy();
  });

  it('returns null when at least one field is non-zero', () => {
    expect(validate({ ...empty, sleepHours: 7 })).toBeNull();
    expect(validate({ ...empty, energy: 3 })).toBeNull();
    expect(validate({ ...empty, weight: 75 })).toBeNull();
  });

  it('validates sleep hours range', () => {
    expect(validate({ ...empty, sleepHours: 0.5 })).toMatch(/Сон/);
    expect(validate({ ...empty, sleepHours: 17 })).toMatch(/Сон/);
    expect(validate({ ...empty, sleepHours: 7 })).toBeNull();
    expect(validate({ ...empty, sleepHours: 1 })).toBeNull();
    expect(validate({ ...empty, sleepHours: 16 })).toBeNull();
  });

  it('validates restHR range', () => {
    expect(validate({ ...empty, restHR: 20 })).toMatch(/ЧСС/);
    expect(validate({ ...empty, restHR: 130 })).toMatch(/ЧСС/);
    expect(validate({ ...empty, restHR: 60 })).toBeNull();
  });

  it('validates HRV range', () => {
    expect(validate({ ...empty, hrv: 5 })).toMatch(/HRV/);
    expect(validate({ ...empty, hrv: 250 })).toMatch(/HRV/);
    expect(validate({ ...empty, hrv: 65 })).toBeNull();
  });

  it('does not validate zero values (not measured)', () => {
    expect(validate({ ...empty, sleepHours: 7, restHR: 0, hrv: 0 })).toBeNull();
  });
});
