import { describe, it, expect } from 'vitest';
import { validate } from '../validation.js';

const empty = { sleepHours: 0, restHR: 0, hrv: 0, weight: 0, muscleSoreness: 0, energy: 0, mood: 0, sleepQuality: 0, stress: 0 };

describe('validate', () => {
  it('returns error when all fields are zero', () => {
    expect(validate(empty)).toBe('Заполните хотя бы одно поле чтобы сохранить чек-ин');
  });

  it('returns null when at least one field is non-zero', () => {
    expect(validate({ ...empty, sleepHours: 7 })).toBeNull();
    expect(validate({ ...empty, energy: 3 })).toBeNull();
    expect(validate({ ...empty, weight: 75 })).toBeNull();
  });

  it('rejects sleep hours outside 1–16 range', () => {
    expect(validate({ ...empty, sleepHours: 0.5 })).toMatch(/Сон/);
    expect(validate({ ...empty, sleepHours: 17 })).toMatch(/Сон/);
    expect(validate({ ...empty, sleepHours: 7 })).toBeNull();
    expect(validate({ ...empty, sleepHours: 1 })).toBeNull();
    expect(validate({ ...empty, sleepHours: 16 })).toBeNull();
  });

  it('rejects restHR outside 30–120 range', () => {
    expect(validate({ ...empty, restHR: 20 })).toMatch(/ЧСС/);
    expect(validate({ ...empty, restHR: 130 })).toMatch(/ЧСС/);
    expect(validate({ ...empty, restHR: 60 })).toBeNull();
  });

  it('rejects HRV outside 10–200 range', () => {
    expect(validate({ ...empty, hrv: 5 })).toMatch(/HRV/);
    expect(validate({ ...empty, hrv: 250 })).toMatch(/HRV/);
    expect(validate({ ...empty, hrv: 65 })).toBeNull();
  });

  it('warns on very low HRV (< 20)', () => {
    expect(validate({ ...empty, hrv: 15 })).toMatch(/проверьте измерение/);
    expect(validate({ ...empty, hrv: 25 })).toBeNull();
  });

  it('rejects weight outside 30–300 range', () => {
    expect(validate({ ...empty, weight: 20 })).toMatch(/Вес/);
    expect(validate({ ...empty, weight: 350 })).toMatch(/Вес/);
    expect(validate({ ...empty, weight: 70 })).toBeNull();
  });

  it('rejects scale values outside 1–5 range', () => {
    expect(validate({ ...empty, muscleSoreness: 6 })).toMatch(/Мышечная боль/);
    expect(validate({ ...empty, energy: 6 })).toMatch(/Энергия/);
    expect(validate({ ...empty, mood: 6 })).toMatch(/Настроение/);
    expect(validate({ ...empty, sleepQuality: 6 })).toMatch(/Качество сна/);
    expect(validate({ ...empty, stress: 6 })).toMatch(/Стресс/);
    expect(validate({ ...empty, energy: 3, mood: 3, muscleSoreness: 3, sleepQuality: 3, stress: 3 })).toBeNull();
  });

  it('ignores zero values (not measured)', () => {
    expect(validate({ ...empty, sleepHours: 7, restHR: 0, hrv: 0 })).toBeNull();
  });
});
