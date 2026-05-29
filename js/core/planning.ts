// js/core/planning.ts
// Periodized multi-sport training plan engine
// 4-phase model: base → build → peak → deload (4-week cycles)

import type { Session, ReadinessStatus, SessionPlan, PhaseType, SportPlanModule, WeeklyTemplate, FitnessLevel, FitnessGoal, Equipment } from './types.js';
import { RunningPlanModule } from '../plans/running.js';
import { StrengthGymPlanModule } from '../plans/strength.js';
import { CyclingPlanModule } from '../plans/cycling.js';
import { SwimmingPlanModule } from '../plans/swimming.js';
import { CalisthenicsPlanModule } from '../plans/calisthenics.js';
import { YogaPlanModule } from '../plans/yoga.js';
import { StretchingPlanModule } from '../plans/stretching.js';
import { WalkingPlanModule } from '../plans/walking.js';
import { applyMultiplierToExercises, adjustExercisesForMode } from './loadAdjustments.js';
import { annotateExercisesWithApre } from './apre/engine.js';
import { filterExercisesForRehab, filterStretchingForRehab } from './exerciseDatabase.js';
import { getRehabPreWorkoutExercises } from './rehabProtocol.js';
import { parseLocalDate, getAppDateSync } from './helpers.js';

// Sport module registry
const SPORT_MODULES: Record<string, SportPlanModule> = {
  'running': RunningPlanModule,
  'strength_gym': StrengthGymPlanModule,
  'cycling': CyclingPlanModule,
  'swimming': SwimmingPlanModule,
  'calisthenics': CalisthenicsPlanModule,
  'yoga': YogaPlanModule,
  'stretching': StretchingPlanModule,
  'walking': WalkingPlanModule,
};

// Helper: get base sets range from fitness level
function getSetsForLevel(level: FitnessLevel): [number, number] {
  switch (level) {
    case 'beginner': return [2, 3];
    case 'intermediate': return [3, 4];
    case 'advanced': return [4, 5];
    default: return [3, 4];
  }
}

// Helper: get rep range from fitness goal
function getRepsForGoal(goal: FitnessGoal): [number, number] {
  switch (goal) {
    case 'hypertrophy': return [8, 12];
    case 'strength': return [3, 6];
    case 'endurance': return [15, 20];
    case 'rehabilitation': return [10, 15];
    default: return [8, 12];
  }
}

// Helper: check if exercise equipment is available
function isEquipmentAvailable(exercise: string, equipment: Equipment): boolean {
  const exLower = exercise.toLowerCase();
  // Barbell exercises
  if (exLower.includes('shtang') || exLower.includes('barbell') || exLower.includes('zhim') || exLower.includes('tyaga')) {
    if (equipment.barbell) return true;
    if (equipment.dumbbells_max_kg && equipment.dumbbells_max_kg >= 10) return true; // can substitute
    if (equipment.resistance_bands) return true; // can substitute
    return false;
  }
  // Pull-up bar exercises
  if (exLower.includes('podtyag') || exLower.includes('pull-up') || exLower.includes('avstraliy')) {
    if (equipment.pullup_bar) return true;
    if (equipment.resistance_bands) return true; // assisted
    return false;
  }
  // Dip exercises
  if (exLower.includes('brys') || exLower.includes('dip')) {
    if (equipment.dip_bars) return true;
    return false;
  }
  // Kettlebell
  if (exLower.includes('gire') || exLower.includes('kettlebell')) {
    if (equipment.kettlebell) return true;
    if (equipment.dumbbells_max_kg) return true; // can substitute
    return false;
  }
  return true; // bodyweight / no equipment needed
}

// Helper: adapt reps/sets based on profile
function adaptExerciseForProfile(
  exercise: { n: string; s: string; r: string; w?: string },
  level: FitnessLevel,
  goals: FitnessGoal[],
  equipment: Equipment
): { n: string; s: string; r: string; w?: string } | null {
  // Check equipment
  if (!isEquipmentAvailable(exercise.n, equipment)) {
    return null; // Will be filtered out
  }

  const [minSets, maxSets] = getSetsForLevel(level);
  const primaryGoal = goals[0] || 'hypertrophy';
  const [minReps, maxReps] = getRepsForGoal(primaryGoal);

  // Parse existing values
  const sets = exercise.s === '-' ? '3' : exercise.s;
  let setsNum = parseInt(sets, 10);
  if (isNaN(setsNum)) setsNum = 3;
  setsNum = Math.max(minSets, Math.min(maxSets, setsNum));

  // For rehabilitation, reduce intensity
  const isRehab = primaryGoal === 'rehabilitation';
  const weightMod = isRehab ? ' (legkiy ves)' : '';

  return {
    ...exercise,
    s: String(setsNum),
    r: `${minReps}-${maxReps}`,
    w: (exercise.w || '') + weightMod,
  };
}

/**
 * Get active sport modules based on user's selected sports
 */
export function getActiveModules(selectedSports: string[]): SportPlanModule[] {
  return selectedSports
    .map(sport => SPORT_MODULES[sport])
    .filter((m): m is SportPlanModule => Boolean(m));
}

/**
 * Calculate current phase and week in phase based on start date
 * 4-week cycles: weeks 1-4=base, 5-8=build, 9-12=peak, every 4th week=deload
 */
export function getCurrentPhaseAndWeek(
  startDate: string,
  virtualTodayOffset: number = 0
): { phase: PhaseType; weekInPhase: number; totalWeek: number } {
  const start = parseLocalDate(startDate);
  if (!start) return { phase: 'base', weekInPhase: 1, totalWeek: 1 };

  const today = getAppDateSync(virtualTodayOffset);
  const diffMs = today.getTime() - start.getTime();
  const totalWeek = Math.max(1, Math.floor(diffMs / 604800000) + 1);

  const weekInCycle = ((totalWeek - 1) % 4) + 1; // 1-4 within each 4-week cycle
  const cycleNumber = Math.floor((totalWeek - 1) / 4); // 0-based cycle

  // Every 4th week is deload
  if (weekInCycle === 4) {
    return { phase: 'deload', weekInPhase: 4, totalWeek };
  }

  // Cycles: 0=Base, 1=Build, 2=Peak, 3=Base (repeat)
  const phaseMap: PhaseType[] = ['base', 'build', 'peak', 'base'];
  const phase = phaseMap[cycleNumber % 4] || 'base';
  return { phase, weekInPhase: weekInCycle, totalWeek };
}

/**
 * Build weekly plan from active modules for a specific phase
 */
export function buildWeeklyPlan(
  modules: SportPlanModule[],
  phase: PhaseType,
  weekInPhase: number,
  weeklyTemplate: WeeklyTemplate
): Array<Omit<SessionPlan, 'date' | 'sessionId'> & { sport: string }> {
  const sessions: Array<Omit<SessionPlan, 'date' | 'sessionId'> & { sport: string }> = [];

  weeklyTemplate.days.forEach((sport, dayIndex) => {
    if (!sport) {
      sessions.push({
        sport: 'rest',
        sessionType: 'recovery',
        name: 'День отдыха',
        description: 'Восстановление',
        defaultParameters: {},
        exercises: [],
        mode: 'full',
        isDeload: false,
        isRestDay: true,
      } as any);
      return;
    }

    const module = modules.find(m => m.sport === sport);
    if (!module) return;

    const phaseGenerator = module.phases[phase];
    if (!phaseGenerator) return;

    const sportSessions = phaseGenerator(weekInPhase);
    const daySession = sportSessions[dayIndex % sportSessions.length];

    if (daySession) {
      sessions.push({
        ...daySession,
        sport,
      } as any);
    }
  });

  return sessions;
}

/**
 * Get session for a specific date
 * Critical fix: returns the correct workout for any given date
 */
export function getSessionForDate(
  date: string,
  selectedSports: string[],
  startDate: string | null,
  weeklyTemplate: WeeklyTemplate,
  virtualTodayOffset: number = 0
): SessionPlan | null {
  if (!startDate) return null;

  const modules = getActiveModules(selectedSports);
  if (modules.length === 0) return null;

  const { phase, weekInPhase } = getCurrentPhaseAndWeek(startDate, virtualTodayOffset);
  const weekSessions = buildWeeklyPlan(modules, phase, weekInPhase, weeklyTemplate);

  const dateObj = parseLocalDate(date);
  const startObj = parseLocalDate(startDate);
  if (!dateObj || !startObj) return null;

  const dayOffset = Math.floor((dateObj.getTime() - startObj.getTime()) / 86400000);
  const dayIndex = ((dayOffset % 7) + 7) % 7; // 0-6 (Mon-Sun)

  const session = weekSessions[dayIndex];
  if (!session) return null;

  // Add date and sessionId
  const sessionId = `${date}_${session.sport}_${session.sessionType}`;
  return {
    ...session,
    date,
    sessionId,
  } as SessionPlan;
}

export function getVolumeMultiplierFromAdherence(completionRate: number): number {
  if (completionRate >= 0.8) return 1.2;
  if (completionRate >= 0.6) return 1.0;
  return 0.8;
}

/**
 * Get session for date with full readiness + rehab adaptation
 * This is the main function that should be used by the store
 */
export function getAdaptedSessionForDate(
  date: string,
  selectedSports: string[],
  startDate: string | null,
  weeklyTemplate: WeeklyTemplate,
  readiness: ReadinessStatus,
  recoveryDebt: boolean,
  weekNumber: number,
  totalMultiplier: number = 1.0,
  apreSession: Session | null = null,
  rehabIssues: string[] = [],
  rehabExercises: string[] = [],
  virtualTodayOffset: number = 0,
  profileLevel: FitnessLevel = 'intermediate',
  profileGoals: FitnessGoal[] = [],
  profileEquipment: Equipment = {},
  completionRate: number = 0
): { session: SessionPlan; modifications: string[] } | null {
  const baseSession = getSessionForDate(date, selectedSports, startDate, weeklyTemplate, virtualTodayOffset);
  return applyReadinessToSession(baseSession, readiness, recoveryDebt, totalMultiplier, apreSession, weekNumber, rehabIssues, rehabExercises, profileLevel, profileGoals, profileEquipment, completionRate);
}
export function applyReadinessToSession(
  session: SessionPlan | null,
  readiness: ReadinessStatus,
  recoveryDebt: boolean,
  totalMultiplier: number = 1.0,
  apreSession: Session | null = null,
  weekNumber: number = 1,
  rehabIssues: string[] = [],
  rehabExercises: string[] = [],
  profileLevel: FitnessLevel = 'intermediate',
  profileGoals: FitnessGoal[] = [],
  profileEquipment: Equipment = {},
  completionRate: number = 0
): { session: SessionPlan; modifications: string[] } | null {
  if (!session) return null;

  const modifications: string[] = [];
  const isDeloadWeek = weekNumber > 0 && weekNumber % 4 === 0;
  const mode = isDeloadWeek
    ? 'deload'
    : readiness === 'red'
      ? 'minimum'
      : (readiness === 'yellow' || recoveryDebt ? 'yellow' : 'full');

  if (isDeloadWeek) {
    modifications.push('Неделя разгрузки → объём снижен на 40%');
  }
  if (readiness === 'red') {
    modifications.push('Recovery Score низкий (red readiness) → только восстановительные упражнения');
  } else if (readiness === 'yellow') {
    modifications.push('Recovery Score средний (yellow readiness) → объём снижен (минус 1 подход)');
  }
  if (recoveryDebt && readiness !== 'red') {
    modifications.push('Обнаружен recovery debt → нагрузка адаптирована');
  }

  let exercises = session.exercises || [];
  let wasRehabAdapted = false;

  // Apply rehab filtering BEFORE other adjustments
  if (rehabIssues.length > 0) {
    const filtered = filterExercisesForRehab(exercises, rehabIssues, rehabExercises);
    exercises = filtered.exercises;
    wasRehabAdapted = filtered.wasAdapted;
    if (wasRehabAdapted) {
      modifications.push('Боль в суставах → упражнения адаптированы для реабилитации');
    }

    const preWorkoutExercises = getRehabPreWorkoutExercises(rehabIssues);
    if (preWorkoutExercises.length > 0 && !session.isRestDay) {
      exercises = [...preWorkoutExercises, ...exercises];
      modifications.push('Добавлены разогревающие реабилитационные упражнения перед тренировкой');
    }
  }

  if (session.sport === 'stretching' && rehabIssues.length > 0) {
    exercises = filterStretchingForRehab(exercises, rehabIssues);
  }

  // Apply profile-based exercise adaptation (level, goals, equipment)
  if (exercises.length > 0 && (profileGoals.length > 0 || Object.keys(profileEquipment).length > 0)) {
    const beforeCount = exercises.length;
    const adapted = exercises
      .map(ex => adaptExerciseForProfile(ex, profileLevel, profileGoals, profileEquipment))
      .filter(Boolean);
    if (adapted.length > 0) {
      exercises = adapted as typeof exercises;
      if (adapted.length < beforeCount) {
        modifications.push('Нет оборудования → часть упражнений заменена или удалена');
      }
    }
  }

  // Apply multiplier adjustments
  if (totalMultiplier !== 1.0) {
    exercises = applyMultiplierToExercises(exercises, totalMultiplier);
    modifications.push(`Недельный множитель ×${totalMultiplier.toFixed(1)} → нагрузка адаптирована`);
  }

  // Apply APRE adjustments
  if (apreSession && (mode === 'full' || mode === 'deload')) {
    // APRE adjustment would go here - reusing existing logic
    if (apreSession.rpe >= 8) {
      modifications.push(`APRE: RPE=${apreSession.rpe} в прошлой сессии → корректировка веса/повторений`);
    }
  }

  // Adjust exercises for mode
  const beforeMode = exercises.length;
  exercises = adjustExercisesForMode(exercises, mode);
  if (mode === 'yellow' && exercises.length < beforeMode) {
    modifications.push('Режим yellow → количество упражнений снижено');
  }

  // Annotate with APRE metadata
  const prevApreResults = apreSession?.apreResults ?? [];
  exercises = annotateExercisesWithApre(exercises, prevApreResults);

  if (completionRate > 0) {
    const volumeMultiplier = getVolumeMultiplierFromAdherence(completionRate);
    if (volumeMultiplier !== 1.0) {
      exercises = exercises.map(ex => {
        const sets = parseInt(ex.s, 10);
        if (isNaN(sets)) return ex;
        const newSets = Math.max(1, Math.round(sets * volumeMultiplier));
        return { ...ex, s: String(newSets) };
      });
      modifications.push(`Adherence-based volume: ${volumeMultiplier}x (completion ${(completionRate * 100).toFixed(0)}%)`);
    }
  }

  return {
    session: {
      ...session,
      exercises,
      mode,
      isDeload: isDeloadWeek,
      ...(wasRehabAdapted ? { description: session.description + ' (adapted for rehab)' } : {}),
    },
    modifications,
  };
}

// ─── Backward Compatibility (for existing code) ───────────────────────────

/**
 * @deprecated Use getSessionForDate() instead
 * Determine workout type (A/B/C) based on day of week and training schedule
 */
export function getWorkoutType(date: Date, trainDays: number[]): 'A' | 'B' | 'C' | null {
  const dow = date.getDay();
  const sorted = trainDays.slice().sort((a, b) => a - b);
  const idx = sorted.indexOf(dow);
  if (idx < 0) return null;
  return ['A', 'B', 'C'][idx % 3] as 'A' | 'B' | 'C';
}

/**
 * @deprecated Use getSessionForDate() instead
 * Map day type to index within a month's days array
 */
export function getMonthAndDayIndex(
  weekNumber: number,
  trainType: 'A' | 'B' | 'C' | null,
  _sport?: string | null
): { month: unknown; dayIndex: number | null } {
  if (!weekNumber || !trainType) return { month: null, dayIndex: null };

  // For backward compatibility, return null month
  return { month: null, dayIndex: null };
}

/**
 * @deprecated Use getSessionForDate() instead
 * Build session from month plan
 */
export function buildSessionFromMonth(
  _month: unknown,
  _dayIndex: number | null,
  _readiness: ReadinessStatus,
  _debt: boolean,
  _multiplier = 1.0,
  _apreSession: Session | null = null,
  _weekNumber = 1
): SessionPlan | null {
  return null; // Use getSessionForDate() instead
}

export function getLastSessionByType(sessions: Session[], type: string): Session | null {
  const filtered = sessions
    .filter(s => s.type === type && s.completed)
    .sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  return filtered.length ? filtered[0] : null;
}

export function maybeAddTestExercises(plan: SessionPlan | null): SessionPlan | null {
  return plan; // Test exercises handled elsewhere now
}
