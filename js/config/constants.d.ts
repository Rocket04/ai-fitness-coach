// Type declarations for js/config/constants.js

export interface Exercise {
  n: string;
  s: string;
  r: string;
  c?: string;
  w?: string;
  isTest?: boolean;
}

export interface TrainingDay {
  day: string;
  label: string;
  exercises: Exercise[];
}

export interface TrainingMonth {
  title: string;
  full: string;
  subtitle: string;
  weeks: string;
  color: string;
  days: TrainingDay[];
}

export interface Zone {
  zone: string;
  name: string;
  bpm: string;
  pace: string;
  color: string;
  desc: string;
  use: string;
}

export interface HrvGuideEntry {
  range: string;
  label: string;
  color: string;
  action: string;
  why: string;
}

export interface RoutineEntry {
  name: string;
  reps: string;
  why: string;
}

export interface NutritionEntry {
  label: string;
  val: string;
  note: string;
}

export declare const DAYS: string[];
export declare const DAYS_TO_DOW: number[];
export declare const DOW_TO_DAYS_INDEX: number[];
export declare const TRAIN_ORDER: string[];
export declare const RECOVERY_WEIGHTS: {
  hrv: number;
  sleep: number;
  rhr: number;
  subjective: number;
};
export declare const SUBJECTIVE_THRESHOLDS: {
  muscleSorenessHigh: number;
  energyLow: number;
  moodLow: number;
  stressHigh: number;
  sleepQualityLow: number;
};
export declare const ZONES: Zone[];
export declare const HRV_GUIDE: HrvGuideEntry[];
export declare const MORNING_ROUTINE: RoutineEntry[];
export declare const EVENING_ROUTINE: RoutineEntry[];
export declare const NUTRITION: NutritionEntry[];
export declare const MONTHS: TrainingMonth[];

export interface ApreAdjustment {
  maxReps: number;
  set4: number;
  nextWeek: number;
}

export interface ApreProtocol {
  50: { reps: number };
  75: { reps: number };
  adjustments: ApreAdjustment[];
}

export interface ApreTables {
  APRE_3: ApreProtocol;
  APRE_6: ApreProtocol;
  APRE_10: ApreProtocol;
}

export type ApreProtocolKey = 'APRE_3' | 'APRE_6' | 'APRE_10';
export type ApreUnit = 'kg' | 'lbs';
export type CalisthenicLevel = 1 | 2 | 3 | 4 | 5;

export declare const APRE_TABLES: ApreTables;
export declare const CALISTHENICS_PROGRESSIONS: Record<CalisthenicLevel, string>;
