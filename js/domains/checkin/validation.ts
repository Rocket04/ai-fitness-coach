export interface CheckinFields {
  sleepHours: number;
  restHR: number;
  hrv: number;
  weight: number;
  muscleSoreness: number;
  energy: number;
  mood: number;
  sleepQuality: number;
  stress: number;
}

export function validate(fields: CheckinFields): string | null {
  const { sleepHours, restHR, hrv, weight, muscleSoreness, energy, mood, sleepQuality, stress } = fields;
  const hasData = sleepHours > 0 || restHR > 0 || hrv > 0 || weight > 0 ||
    muscleSoreness > 0 || energy > 0 || mood > 0 || sleepQuality > 0 || stress > 0;
  if (!hasData) return 'Заполните хотя бы одно поле чтобы сохранить чек-ин';
  if (sleepHours > 0 && (sleepHours < 1 || sleepHours > 16)) return 'Сон: введите значение от 1 до 16 часов';
  if (restHR > 0 && (restHR < 30 || restHR > 120)) return 'ЧСС покоя: введите значение 30–120';
  if (hrv > 0 && (hrv < 10 || hrv > 200)) return 'HRV: введите значение 10–200 мс';
  if (hrv > 0 && hrv < 20) return 'HRV ниже 20 — проверьте измерение (обычно 40-100 мс)';
  if (weight > 0 && (weight < 30 || weight > 300)) return 'Вес: реалистичный диапазон 30–300 кг';
  if (muscleSoreness > 0 && (muscleSoreness < 1 || muscleSoreness > 5)) return 'Мышечная боль: оценка от 1 до 5';
  if (energy > 0 && (energy < 1 || energy > 5)) return 'Энергия: оценка от 1 до 5';
  if (mood > 0 && (mood < 1 || mood > 5)) return 'Настроение: оценка от 1 до 5';
  if (sleepQuality > 0 && (sleepQuality < 1 || sleepQuality > 5)) return 'Качество сна: оценка от 1 до 5';
  if (stress > 0 && (stress < 1 || stress > 5)) return 'Стресс: оценка от 1 до 5';
  return null;
}
