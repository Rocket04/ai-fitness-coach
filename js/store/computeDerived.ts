import type {
  Session,
  Checkin,
  SessionPlan,
  ReadinessStatus,
  ManualStatus,
  PhaseType,
  WeeklyTemplate,
  MonthStats,
  TrendPoint,
  RpeTrendPoint,
  WeeklyAverage,
  TrendWarning,
  OvertrainingWarning,
  FitnessLevel,
  FitnessGoal,
  Equipment,
} from '../core/types.js';
import type { CheckinTier } from '../domains/recovery/recoveryScore.js';
import type { WeeklyPlan } from '../core/weeklyPlan.js';
import { calcReadiness, getEffectiveReadiness, detectRecoveryDebt } from '../domains/recovery/readiness.js';
import { calculateRecoveryScore } from '../domains/recovery/recoveryScore.js';
import { getWeeklySummary, getMonthStats, getStreak } from '../core/stats.js';
import { getCoachAdvice } from '../domains/recovery/advice.js';
import {
  getCurrentPhaseAndWeek,
  getAdaptedSessionForDate,
  getVolumeMultiplierFromAdherence,
} from '../core/planning.js';
import {
  getTrendData,
  getRpeTrend,
  detectNegativeTrends,
  getWeeklyAverages,
  getOvertrainingWarning,
  calculateWeeklyCompletionRate,
} from '../core/analytics.js';
import { getAllCorrelations } from '../core/correlations.js';
import { parseLocalDate, formatISO, getAppDateSync, mondayOfWeek, addDays } from '../core/helpers.js';
import { buildWeeklyPlanDays } from '../core/weeklyPlan.js';

export interface DerivedState {
  todayDate: Date;
  tomorrowDate: Date;
  lastCheckin: Checkin | null;
  autoReadiness: ReadinessStatus;
  readiness: ReadinessStatus;
  recoveryDebt: boolean;
  recoveryScore: number;
  scoreLast30DayAvg: number | null;
  phase: PhaseType;
  weekInPhase: number;
  totalWeek: number;
  weekLabel: string;
  sessionPlan: SessionPlan | null;
  tomorrowPlan: SessionPlan | null;
  planModifications: string[];
  weeklyPlan: WeeklyPlan;
  weeklyAdherenceMultiplier: number;
  testHistory: Array<{ date: string; testResults: NonNullable<Session['testResults']> }>;
  monthStats: MonthStats;
  morningDone: boolean;
  eveningDone: boolean;
  trainingDone: boolean;
  streak: number;
  coachAdvice: string[];
  correlations: import('../core/correlations.js').CorrelationResult[];
  trendData7: TrendPoint[];
  trendData30: TrendPoint[];
  rpeTrend7: RpeTrendPoint[];
  rpeTrend30: RpeTrendPoint[];
  weeklyAverages: WeeklyAverage[];
  trendWarnings: TrendWarning[];
  overtrainingWarning: OvertrainingWarning | null;
}

function makeTomorrowDate(todayISO: string, virtualOffset: number = 0): Date {
  const d = parseLocalDate(todayISO) ?? getAppDateSync(virtualOffset);
  d.setDate(d.getDate() + 1);
  return d;
}

export function computeDerived(
  sessions: Session[],
  checkins: Checkin[],
  startDate: string | null,
  _trainDays: number[],
  manualOverride: ManualStatus,
  todayISO: string,
  checkinTier: CheckinTier = 'medium',
  virtualTodayOffset: number = 0,
  selectedSports: string[] = [],
  weeklyTemplate?: WeeklyTemplate,
  rehabIssues: string[] = [],
  rehabExercises: string[] = [],
  profileLevel: FitnessLevel = 'intermediate',
  profileGoals: FitnessGoal[] = [],
  profileEquipment: Equipment = {}
): DerivedState {
  const todayDate = parseLocalDate(todayISO) ?? getAppDateSync(virtualTodayOffset);
  const tomorrowDate = makeTomorrowDate(todayISO, virtualTodayOffset);

  const sorted = [...checkins].sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  const lastCheckin: Checkin | null = sorted[0] ?? null;
  const autoReadiness: ReadinessStatus = lastCheckin ? calcReadiness(lastCheckin) : 'green';
  const readiness: ReadinessStatus = getEffectiveReadiness(autoReadiness, manualOverride);
  const recoveryDebt = detectRecoveryDebt(sorted.slice(0, 3));
  const recoveryScore = lastCheckin ? calculateRecoveryScore(lastCheckin, checkins, checkinTier) : 0;

  const thirtyDaysAgo = new Date(todayDate);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const thirtyDaysAgoStr = formatISO(thirtyDaysAgo);
  const last30Checkins = sorted.filter(c => c.date >= thirtyDaysAgoStr);
  let scoreLast30DayAvg: number | null = null;
  if (last30Checkins.length >= 14) {
    const sum = last30Checkins.reduce((acc, c) => acc + calculateRecoveryScore(c, checkins, checkinTier), 0);
    scoreLast30DayAvg = Math.round(sum / last30Checkins.length);
  }

  const { phase, weekInPhase, totalWeek } = startDate
    ? getCurrentPhaseAndWeek(startDate, virtualTodayOffset)
    : { phase: 'base' as PhaseType, weekInPhase: 1, totalWeek: 1 };

  const template: WeeklyTemplate = weeklyTemplate || {
    days: ['running', 'strength', null, 'running', 'strength', null, 'running'],
    sportOrder: selectedSports.length > 0 ? selectedSports : ['running']
  };

  const currentMonday = mondayOfWeek(parseLocalDate(todayISO) ?? getAppDateSync(virtualTodayOffset));
  const lastMonday = addDays(currentMonday, -7);
  const lastMondayStr = formatISO(lastMonday);
  const currentMondayStr = formatISO(currentMonday);
  const lastWeekSessions = sessions.filter(s => s.date >= lastMondayStr && s.date < currentMondayStr);
  let weeklyAdherenceMultiplier = 1.0;
  if (lastWeekSessions.length > 0) {
    const completionRate = calculateWeeklyCompletionRate(sessions, lastMonday);
    if (completionRate > 0) {
      weeklyAdherenceMultiplier = getVolumeMultiplierFromAdherence(completionRate);
    }
  }

  const adaptedToday = getAdaptedSessionForDate(
    todayISO, selectedSports, startDate, template,
    readiness, recoveryDebt, totalWeek, 1.0, null,
    rehabIssues, rehabExercises, virtualTodayOffset,
    profileLevel, profileGoals, profileEquipment
  );
  const sessionPlan = adaptedToday?.session ?? null;
  const planModifications = adaptedToday?.modifications ?? [];

  const tomorrowISO = formatISO(makeTomorrowDate(todayISO, virtualTodayOffset));
  const tomorrowAdapted = getAdaptedSessionForDate(
    tomorrowISO, selectedSports, startDate, template,
    readiness, recoveryDebt, totalWeek, weeklyAdherenceMultiplier, null,
    rehabIssues, rehabExercises, 0
  );
  const tomorrowPlan = tomorrowAdapted?.session ?? null;

  const weeklySummary = getWeeklySummary(sessions, checkins, todayISO);
  const testHistory = sessions
    .filter(s => s.testResults)
    .map(s => ({ date: s.date, testResults: s.testResults! }));
  const monthStats = getMonthStats(sessions, todayISO.slice(0, 7));
  const morningDone = sessions.some(s => s.date === todayISO && s.type === 'morning' && s.completed);
  const eveningDone = sessions.some(s => s.date === todayISO && s.type === 'evening' && s.completed);
  const trainingDone = sessionPlan !== null
    ? sessions.some(s => s.date === todayISO && s.completed && s.type !== 'morning' && s.type !== 'evening')
    : false;

  const streak = getStreak(checkins);
  const coachAdvice = getCoachAdvice(recoveryScore, lastCheckin || {}, [], weeklySummary);
  const correlations = getAllCorrelations(checkins);

  const trendData7 = getTrendData(checkins, checkins, 7);
  const trendData30 = getTrendData(checkins, checkins, 30);
  const rpeTrend7 = getRpeTrend(sessions, 7);
  const rpeTrend30 = getRpeTrend(sessions, 30);
  const weeklyAverages = getWeeklyAverages(trendData30);
  const trendWarnings = detectNegativeTrends(trendData30);
  const overtrainingWarning = getOvertrainingWarning(trendData30, weeklyAverages, weeklySummary);

  const weeklyPlan = buildWeeklyPlanDays(
    formatISO(mondayOfWeek(parseLocalDate(todayISO) ?? new Date())),
    selectedSports, startDate, template, virtualTodayOffset,
    readiness, recoveryDebt, totalWeek, weeklyAdherenceMultiplier, null,
    rehabIssues, rehabExercises,
    profileLevel, profileGoals, profileEquipment
  );

  return {
    todayDate,
    tomorrowDate,
    lastCheckin,
    autoReadiness,
    readiness,
    recoveryDebt,
    recoveryScore,
    scoreLast30DayAvg,
    phase,
    weekInPhase,
    totalWeek,
    weekLabel: `Неделя ${totalWeek}`,
    sessionPlan,
    tomorrowPlan,
    planModifications,
    weeklyPlan,
    weeklyAdherenceMultiplier,
    testHistory,
    monthStats,
    morningDone,
    eveningDone,
    trainingDone,
    streak,
    coachAdvice,
    trendData7,
    trendData30,
    rpeTrend7,
    rpeTrend30,
    weeklyAverages,
    trendWarnings,
    overtrainingWarning,
    correlations,
  };
}
