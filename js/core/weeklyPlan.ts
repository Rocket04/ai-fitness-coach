import type { SessionPlan, WeeklyTemplate, ReadinessStatus, Session, FitnessLevel, FitnessGoal, Equipment } from './types.js';
import { getAdaptedSessionForDate, getCurrentPhaseAndWeek } from './planning.js';
import { parseLocalDate, formatISO, addDays, mondayOfWeek, dateLabel } from './helpers.js';
import { getRehabPreWorkoutExercises } from './rehabProtocol.js';
import type { Exercise } from './types.js';

export interface WeeklyPlanDay {
  date: string;
  iso: string;
  dayLabel: string;
  isToday: boolean;
  session: SessionPlan | null;
  rehabExercises: Exercise[];
  modifications: string[];
  totalExercises: number;
}

export interface WeeklyPlan {
  weekStart: string;
  weekLabel: string;
  days: WeeklyPlanDay[];
}

export function buildWeeklyPlanDays(
  weekStartISO: string,
  selectedSports: string[],
  startDate: string | null,
  weeklyTemplate: WeeklyTemplate,
  virtualTodayOffset: number = 0,
  readiness: ReadinessStatus = 'green',
  recoveryDebt: boolean = false,
  weekNumber: number = 1,
  totalMultiplier: number = 1.0,
  apreSession: Session | null = null,
  rehabIssues: string[] = [],
  rehabExercises: string[] = [],
  profileLevel: FitnessLevel = 'intermediate',
  profileGoals: FitnessGoal[] = [],
  profileEquipment: Equipment = {},
  completionRate: number = 0
): WeeklyPlan {
  const weekStart = parseLocalDate(weekStartISO);
  if (!weekStart) {
    return { weekStart: weekStartISO, weekLabel: '', days: [] };
  }

  const today = new Date();
  const todayISO = formatISO(today);

  const dayLabels: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = addDays(weekStart, i);
    dayLabels.push(dateLabel(d));
  }

  const days: WeeklyPlanDay[] = [];
  for (let i = 0; i < 7; i++) {
    const date = addDays(weekStart, i);
    const iso = formatISO(date);
    const isToday = iso === todayISO;

    const adapted = getAdaptedSessionForDate(
      iso, selectedSports, startDate, weeklyTemplate,
      readiness, recoveryDebt, weekNumber, totalMultiplier,
      apreSession, rehabIssues, rehabExercises, virtualTodayOffset,
      profileLevel, profileGoals, profileEquipment, completionRate
    );

    const session = adapted?.session ?? null;
    const modifications = adapted?.modifications ?? [];

    const preWorkoutRehab = getRehabPreWorkoutExercises(rehabIssues);

    const totalExs = session
      ? (session.exercises?.length || 0) + preWorkoutRehab.length
      : preWorkoutRehab.length;

    days.push({
      date: iso,
      iso,
      dayLabel: dayLabels[i],
      isToday,
      session,
      rehabExercises: preWorkoutRehab,
      modifications,
      totalExercises: totalExs,
    });
  }

  return {
    weekStart: weekStartISO,
    weekLabel: `Неделя ${weekNumber}`,
    days,
  };
}

export function getThisWeekPlan(
  startDate: string | null,
  selectedSports: string[],
  weeklyTemplate: WeeklyTemplate,
  virtualTodayOffset: number = 0,
  rehabIssues: string[] = [],
): WeeklyPlan {
  if (!startDate) {
    return { weekStart: '', weekLabel: '', days: [] };
  }

  const { totalWeek } = getCurrentPhaseAndWeek(startDate, virtualTodayOffset);
  const today = new Date();
  const monday = mondayOfWeek(today);

  return buildWeeklyPlanDays(
    formatISO(monday),
    selectedSports,
    startDate,
    weeklyTemplate,
    virtualTodayOffset,
    'green', false, totalWeek, 1.0, null,
    rehabIssues, []
  );
}