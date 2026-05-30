// js/shared/hooks/useFitnessData.ts
// Управление конфигурацией упражнений в localStorage

import { useState, useEffect, useCallback } from 'react';

export type ApreProtocol = '3' | '6' | '10';
export type CalisthenicLevel = 1 | 2 | 3 | 4 | 5;

export interface ExerciseConfig {
  id: string;
  name: string;
  isCalisthenics: boolean;
  protocol: ApreProtocol;
  currentLevel: CalisthenicLevel | null; // для калистеники (DEPRECATED for weight-based)
  currentRM: number | null; // для железа (кг или lbs) или для weight-based калистеники
  unit: 'kg' | 'lbs';
  usesWeight?: boolean; // true = калистеника с весом (кг) вместо уровня сложности
}

const STORAGE_KEY = 'fitness_exercises_config';

// Дефолтный список упражнений приложения
export const DEFAULT_EXERCISES: ExerciseConfig[] = [
  // Силовые (железо)
  { id: 'squat', name: 'Приседания со штангой', isCalisthenics: false, protocol: '6', currentLevel: null, currentRM: null, unit: 'kg' },
  { id: 'deadlift', name: 'Становая тяга', isCalisthenics: false, protocol: '6', currentRM: null, currentLevel: null, unit: 'kg' },
  { id: 'bench_press', name: 'Жим лёжа', isCalisthenics: false, protocol: '6', currentRM: null, currentLevel: null, unit: 'kg' },
  { id: 'overhead_press', name: 'Жим стоя', isCalisthenics: false, protocol: '6', currentRM: null, currentLevel: null, unit: 'kg' },
  { id: 'barbell_row', name: 'Тяга штанги в наклоне', isCalisthenics: false, protocol: '6', currentRM: null, currentLevel: null, unit: 'kg' },
  { id: 'front_squat', name: 'Фронтальные приседания', isCalisthenics: false, protocol: '6', currentRM: null, currentLevel: null, unit: 'kg' },
  // Калистеника
  { id: 'push_ups', name: 'Отжимания', isCalisthenics: true, protocol: '6', currentLevel: null, currentRM: null, unit: 'kg' },
  { id: 'pull_ups', name: 'Подтягивания', isCalisthenics: true, protocol: '6', currentLevel: null, currentRM: null, unit: 'kg' },
  { id: 'dips', name: 'Отжимания на брусьях', isCalisthenics: true, protocol: '6', currentLevel: null, currentRM: null, unit: 'kg' },
  { id: 'pistol_squat', name: 'Пистолет (одноногие приседы)', isCalisthenics: true, protocol: '6', currentLevel: null, currentRM: null, unit: 'kg' },
  { id: 'inverted_row', name: 'Горизонтальные подтягивания', isCalisthenics: true, protocol: '6', currentLevel: null, currentRM: null, unit: 'kg' },
  { id: 'handstand_pushup', name: 'Отжимания в стойке', isCalisthenics: true, protocol: '6', currentLevel: null, currentRM: null, unit: 'kg' },
];

export function loadExerciseConfig(): ExerciseConfig[] {
  if (typeof window === 'undefined') return DEFAULT_EXERCISES;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return DEFAULT_EXERCISES;
    const parsed = JSON.parse(stored) as ExerciseConfig[];
    // Мержим с дефолтными, чтобы добавить новые упражнения если появились
    const merged = DEFAULT_EXERCISES.map(defaultEx => {
      const storedEx = parsed.find(p => p.id === defaultEx.id);
      return storedEx ? { ...defaultEx, ...storedEx } : defaultEx;
    });
    return merged;
  } catch {
    return DEFAULT_EXERCISES;
  }
}

export function saveExerciseConfig(configs: ExerciseConfig[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(configs));
  } catch (err) {
    console.error('Failed to save exercise config:', err);
  }
}

export function getExerciseById(id: string): ExerciseConfig | undefined {
  const configs = loadExerciseConfig();
  return configs.find(c => c.id === id);
}

export function updateExercise(id: string, updates: Partial<ExerciseConfig>): ExerciseConfig[] {
  const configs = loadExerciseConfig();
  const index = configs.findIndex(c => c.id === id);
  if (index === -1) return configs;
  configs[index] = { ...configs[index], ...updates };
  saveExerciseConfig(configs);
  return [...configs];
}

export function isExerciseConfigured(ex: ExerciseConfig): boolean {
  if (ex.isCalisthenics && ex.usesWeight) {
    return ex.currentRM !== null && ex.currentRM > 0;
  }
  if (ex.isCalisthenics) {
    return ex.currentLevel !== null && ex.currentLevel >= 1 && ex.currentLevel <= 5;
  }
  return ex.currentRM !== null && ex.currentRM > 0;
}

// React hook
export function useFitnessData() {
  const [exercises, setExercises] = useState<ExerciseConfig[]>(DEFAULT_EXERCISES);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const configs = loadExerciseConfig();
    setExercises(configs);
    setLoaded(true);
  }, []);

  const updateExerciseById = useCallback((id: string, updates: Partial<ExerciseConfig>) => {
    const newConfigs = updateExercise(id, updates);
    setExercises(newConfigs);
    return newConfigs;
  }, []);

  const getConfigForExercise = useCallback((id: string) => {
    return exercises.find(e => e.id === id);
  }, [exercises]);

  const resetAllConfigs = useCallback(() => {
    const reset = DEFAULT_EXERCISES.map(e => ({
      ...e,
      currentRM: null,
      currentLevel: null,
    }));
    saveExerciseConfig(reset);
    setExercises(reset);
  }, []);

  return {
    exercises,
    loaded,
    updateExerciseById,
    getConfigForExercise,
    resetAllConfigs,
    isExerciseConfigured,
  };
}
