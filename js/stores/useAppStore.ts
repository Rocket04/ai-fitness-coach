// js/stores/useAppStore.ts
// Central Zustand store: data + derived state + actions (replaces AppContext)

import { create } from 'zustand';
import type {
  Session,
  Checkin,
  SessionPlan,
  ReadinessStatus,
  ManualStatus,
  BreathingStatus,
  ToastType,
  MonthStats,
  TrendPoint,
  RpeTrendPoint,
  WeeklyAverage,
  TrendWarning,
  OvertrainingWarning,
  ApreExerciseResult,
  WeeklyTemplate,
  PhaseType,
} from '../core/types.js';
import type { CheckinTier } from '../core/recoveryScore.js';
import {
  init,
  saveSession,
  deleteSession,
  saveCheckin,
  getCheckin,
  getLatestTestResults,
  exportAllData,
  importAllData,
  clearAllData,
  getAllSessions,
  getAllCheckins,
  getSettings,
  saveSettings,
  saveSetting,
  getManualStatus,
  saveManualStatus,
  activateDemoData,
  deactivateDemoData,
  getActiveDatabase,
} from '../core/storage.js';
import { markOnboardingCompleted } from '../core/onboardingStorage.js';
import { calcReadiness, getEffectiveReadiness, detectRecoveryDebt } from '../core/readiness.js';
import { calculateRecoveryScore } from '../core/recoveryScore.js';
import { calculateSessionLoad } from '../core/sessionLoad.js';
import { getWeeklySummary, getMonthStats, getStreak } from '../core/stats.js';
import { checkAchievements } from '../core/achievements.js';
import {
  getCurrentPhaseAndWeek,
  getAdaptedSessionForDate,
} from '../core/planning.js';
import { getCoachAdvice } from '../core/advice.js';
import {
  getTrendData,
  getRpeTrend,
  detectNegativeTrends,
  getWeeklyAverages,
  getOvertrainingWarning,
} from '../core/analytics.js';
import { getAllCorrelations } from '../core/correlations.js';
import { parseLocalDate, formatISO, getAppDateSync, setVirtualTodayOffset } from '../core/helpers.js';

// ─── helpers ─────────────────────────────────────────────────────────────────

function makeTodayISO(virtualOffset: number = 0) {
  return formatISO(getAppDateSync(virtualOffset));
}

function makeTomorrowDate(todayISO: string, virtualOffset: number = 0): Date {
  const d = parseLocalDate(todayISO) ?? getAppDateSync(virtualOffset);
  d.setDate(d.getDate() + 1);
  return d;
}

// ─── derived computation ──────────────────────────────────────────────────────

function computeDerived(
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
  profileLevel: import('../core/types.js').FitnessLevel = 'intermediate',
  profileGoals: import('../core/types.js').FitnessGoal[] = [],
  profileEquipment: import('../core/types.js').Equipment = {}
) {
  const todayDate = parseLocalDate(todayISO) ?? getAppDateSync(virtualTodayOffset);
  const tomorrowDate = makeTomorrowDate(todayISO, virtualTodayOffset);

  // Readiness
  const sorted = [...checkins].sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  const lastCheckin: Checkin | null = sorted[0] ?? null;
  const autoReadiness: ReadinessStatus = lastCheckin ? calcReadiness(lastCheckin) : 'green';
  const readiness: ReadinessStatus = getEffectiveReadiness(autoReadiness, manualOverride);
  const recoveryDebt = detectRecoveryDebt(sorted.slice(0, 3));
  const recoveryScore = lastCheckin ? calculateRecoveryScore(lastCheckin, checkins, checkinTier) : 0;

  // Phase and Week calculation (NEW)
  const { phase, weekInPhase, totalWeek } = startDate
    ? getCurrentPhaseAndWeek(startDate, virtualTodayOffset)
    : { phase: 'base' as PhaseType, weekInPhase: 1, totalWeek: 1 };

  // Weekly template (use provided or default)
  const template: WeeklyTemplate = weeklyTemplate || {
    days: ['running', 'strength', null, 'running', 'strength', null, 'running'],
    sportOrder: selectedSports.length > 0 ? selectedSports : ['running']
  };

  // Get adapted session for today (with readiness + rehab filtering)
  const sessionPlan = getAdaptedSessionForDate(
    todayISO, selectedSports, startDate, template,
    readiness, recoveryDebt, totalWeek, 1.0, null,
    rehabIssues, rehabExercises, virtualTodayOffset,
    profileLevel, profileGoals, profileEquipment
  );

  // Tomorrow's plan
  const tomorrowISO = formatISO(makeTomorrowDate(todayISO, virtualTodayOffset));
  const tomorrowPlan = getAdaptedSessionForDate(
    tomorrowISO, selectedSports, startDate, template,
    readiness, recoveryDebt, totalWeek, 1.0, null,
    rehabIssues, rehabExercises, 0
  );

  // Stats (keep existing calculations for backward compatibility)
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
  const coachAdvice = getCoachAdvice(recoveryScore, lastCheckin || {}, testHistory, weeklySummary);
  const correlations = getAllCorrelations(checkins);

  // Analytics
  const trendData7 = getTrendData(checkins, checkins, 7);
  const trendData30 = getTrendData(checkins, checkins, 30);
  const rpeTrend7 = getRpeTrend(sessions, 7);
  const rpeTrend30 = getRpeTrend(sessions, 30);
  const weeklyAverages = getWeeklyAverages(trendData30);
  const trendWarnings = detectNegativeTrends(trendData30);
  const overtrainingWarning = getOvertrainingWarning(trendData30, weeklyAverages, weeklySummary);
    return {
      // Dates
      todayDate,
      tomorrowDate,
      // Readiness
      lastCheckin,
      autoReadiness,
      readiness,
      recoveryDebt,
      recoveryScore,
      // Plan (NEW)
      phase,
      weekInPhase,
      totalWeek,
      weekLabel: `Неделя ${totalWeek}`,
      sessionPlan,
      tomorrowPlan,
      // Stats
      testHistory,
      monthStats,
      morningDone,
      eveningDone,
      trainingDone,
      streak,
      coachAdvice,
      // Analytics
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

// ─── store interface ──────────────────────────────────────────────────────────

interface AppStore {
  // ── Raw data ──
  sessions: Session[];
  checkins: Checkin[];
  dataLoaded: boolean;
  todayISO: string;

  // ── Settings ──
  startDate: string | null;
  trainDays: number[];
  checkinTier: CheckinTier;
  selectedGadgets: string[];
  selectedSports: string[];
  virtualTodayOffset: number;
  demoMode: boolean;
  showSettings: boolean;
  showResetConfirm: boolean;
  editStartDate: string;
  editTrainDays: number[];
  rehabIssues: string[];
  rehabExercises: string[];
  profileLevel: import('../core/types.js').FitnessLevel;
  profileGoals: import('../core/types.js').FitnessGoal[];
  profileEquipment: import('../core/types.js').Equipment;

  // ── Checkin form ──
  weight: number;
  restHR: number;
  hrv: number;
  sleepHours: number;
  hipPain: number;
  shoulderPain: number;
  breathing: BreathingStatus;
  notes: string;
  muscleSoreness: number;
  energy: number;
  mood: number;
  sleepQuality: number;
  stress: number;

  // ── Session form ──
  rpe: number;
  sessionNote: string;
  durationMinutes: number;
  testPullUps: number;
  testPushUps: number;
  testPlank: number;
  /** Накопленные APRE-результаты текущей тренировки, ещё не сохранённые в Dexie */
  pendingApreResults: ApreExerciseResult[];

  // ── UI ──
  activeTab: number;
  showReadiness: boolean;
  manualOverride: ManualStatus;
  toast: { message: string; type: ToastType; visible: boolean };
  weeklyTemplate: WeeklyTemplate;

  // ── Derived (recomputed on data change) ──
  todayDate: Date;
  tomorrowDate: Date;
  lastCheckin: Checkin | null;
  autoReadiness: ReadinessStatus;
  readiness: ReadinessStatus;
  recoveryDebt: boolean;
  recoveryScore: number;
  // Plan (NEW)
  phase: PhaseType;
  weekInPhase: number;
  totalWeek: number;
  weekLabel: string;
  sessionPlan: SessionPlan | null;
  tomorrowPlan: SessionPlan | null;
  // Stats
  testHistory: Array<{ date: string; testResults: NonNullable<Session['testResults']> }>;
  monthStats: MonthStats;
  morningDone: boolean;
  eveningDone: boolean;
  trainingDone: boolean;
  streak: number;
  coachAdvice: string[];
  correlations: import('../core/correlations.js').CorrelationResult[];
  // Analytics
  trendData7: TrendPoint[];
  trendData30: TrendPoint[];
  rpeTrend7: RpeTrendPoint[];
  rpeTrend30: RpeTrendPoint[];
  weeklyAverages: WeeklyAverage[];
  trendWarnings: TrendWarning[];
  overtrainingWarning: OvertrainingWarning | null;

  // ── Achievement notification ──
  pendingAchievement: { key: string; name: string; tier: string; icon: string } | null;

  // ── Actions ──
  initApp: () => Promise<void>;
  setWeight: (v: number) => void;
  setRestHR: (v: number) => void;
  setHrv: (v: number) => void;
  setSleepHours: (v: number) => void;
  setHipPain: (v: number) => void;
  setShoulderPain: (v: number) => void;
  setBreathing: (v: BreathingStatus) => void;
  setNotes: (v: string) => void;
  setMuscleSoreness: (v: number) => void;
  setEnergy: (v: number) => void;
  setMood: (v: number) => void;
  setSleepQuality: (v: number) => void;
  setStress: (v: number) => void;
  setRpe: (v: number) => void;
  setSessionNote: (v: string) => void;
  setDurationMinutes: (v: number) => void;
  setTestPullUps: (v: number) => void;
  setTestPushUps: (v: number) => void;
  setTestPlank: (v: number) => void;
  setActiveTab: (v: number) => void;
  setShowReadiness: (v: boolean) => void;
  setShowSettings: (v: boolean) => void;
  setShowResetConfirm: (v: boolean) => void;
  setEditStartDate: (v: string) => void;
  setEditTrainDays: (v: number[]) => void;
  setCheckinTier: (v: CheckinTier) => Promise<void>;
  setVirtualTodayOffset: (v: number) => Promise<void>;
  activateDemoMode: () => Promise<void>;
  deactivateDemoMode: () => Promise<void>;
  setSelectedGadgets: (v: string[]) => Promise<void>;
  setSelectedSports: (v: string[]) => Promise<void>;
  setRehabIssues: (v: string[]) => Promise<void>;
  setRehabExercises: (v: string[]) => Promise<void>;
  setProfileLevel: (v: any) => Promise<void>;
  setProfileGoals: (v: any) => Promise<void>;
  setProfileEquipment: (v: any) => Promise<void>;
  showToast: (message: string, type?: ToastType, duration?: number) => void;
  openSettings: () => void;
  toggleDay: (day: number) => void;
  handleSaveSettings: () => Promise<void>;
  handleSaveCheckin: () => Promise<void>;
  handleManualOverrideChange: (status: ManualStatus) => Promise<void>;
  handleMarkMorning: () => Promise<void>;
  handleMarkEvening: () => Promise<void>;
  handleToggleTraining: () => Promise<void>;
  updateApreResult: (result: ApreExerciseResult) => void;
  handleExportData: () => Promise<void>;
  handleImportData: (file: File) => Promise<void>;
  handleResetAll: () => void;
  confirmResetData: () => Promise<void>;

  // ── Onboarding ──
  completeOnboarding: (data: { trainDays: number[]; selectedGoal?: string; apreProtocol?: string; checkinTier?: CheckinTier; selectedGadgets?: string[]; selectedSports?: string[] }) => Promise<void>;

  // ── Achievement notification ──
  clearPendingAchievement: () => void;

  // ── Internal ──
  _recompute: () => void;
}

// ─── initial derived snapshot ─────────────────────────────────────────────────

const todayISO0 = makeTodayISO();
const initialDerived = computeDerived([], [], null, [1, 3, 5], 'unknown', todayISO0, 'medium', 0, [], {
  days: ['running', 'strength', null, 'running', 'strength', null, 'running'] as (string | null)[],
  sportOrder: ['running'] as string[],
}, [], [], 'intermediate', [], {});
// ─── store ────────────────────────────────────────────────────────────────────

export const useAppStore = create<AppStore>((set, get) => ({
  // Raw data
  sessions: [],
  checkins: [],
  dataLoaded: false,
  todayISO: todayISO0,

  // Settings
  startDate: null,
  trainDays: [1, 3, 5],
  checkinTier: 'medium',
  selectedGadgets: [],
  selectedSports: [],
  virtualTodayOffset: 0,
  demoMode: false,
  showSettings: false,
  showResetConfirm: false,
  editStartDate: '',
  editTrainDays: [1, 3, 5],
  rehabIssues: [],
  rehabExercises: [],
  profileLevel: 'intermediate',
  profileGoals: [],
  profileEquipment: {},

  // Checkin form
  weight: 0,
  restHR: 0,
  hrv: 0,
  sleepHours: 0,
  hipPain: 0,
  shoulderPain: 0,
  breathing: 'good',
  notes: '',
  muscleSoreness: 0,
  energy: 0,
  mood: 0,
  sleepQuality: 0,
  stress: 0,

  // Session form
  rpe: 0,
  sessionNote: '',
  durationMinutes: 45,
  testPullUps: 0,
  testPushUps: 0,
  testPlank: 0,
  pendingApreResults: [],

  // ── Achievement notification ──
  pendingAchievement: null,

  // ── updateApreResult ──
  updateApreResult: (result: ApreExerciseResult) => {
    const { pendingApreResults } = get();
    const updated = [
      ...pendingApreResults.filter(r => r.exerciseName !== result.exerciseName),
      result,
    ];
    set({ pendingApreResults: updated });
  },

  // UI
  activeTab: 0,
  showReadiness: false,
  manualOverride: 'unknown',
  toast: { message: '', type: 'success', visible: false },

  // Derived
  ...initialDerived,

  // Weekly template (NEW)
  weeklyTemplate: {
    days: ['running', 'strength', null, 'running', 'strength', null, 'running'] as (string | null)[],
    sportOrder: ['running'] as string[],
  },

  // ── Internal recompute ──
  _recompute: () => {
    const s = get();
    const derived = computeDerived(
      s.sessions,
      s.checkins,
      s.startDate,
      s.trainDays,
      s.manualOverride,
      s.todayISO,
      s.checkinTier,
      s.virtualTodayOffset,
      s.selectedSports,
      s.weeklyTemplate,
      s.rehabIssues,
      s.rehabExercises,
      s.profileLevel,
      s.profileGoals,
      s.profileEquipment
    );
    set(derived);
  },

  // ── App init ──
  initApp: async () => {
    const todayISO = makeTodayISO();
    try {
      await init();
      const [allSessions, allCheckins, rawSettings] = await Promise.all([
        getAllSessions(),
        getAllCheckins(),
        getSettings(),
      ]);

      const settings = rawSettings as any;
      const sd = (settings.startDate as string | null) || todayISO;
      const td = (settings.trainDays as number[] | null) || [1, 3, 5];
      const ct = (settings.checkinTier as CheckinTier | null) || 'medium';
      const sg = (settings.selectedGadgets as string[] | null) || [];
      const ss = (settings.selectedSports as string[] | null) || [];
      const ri = (settings.rehabIssues as string[] | null) || [];
      const re = (settings.rehabExercises as string[] | null) || [];

      if (!settings.startDate || !settings.trainDays) {
        await saveSettings({ startDate: sd, trainDays: td });
      }

      const tc = await getCheckin(todayISO);
      const ms = await getManualStatus(todayISO);
      const lt = await getLatestTestResults();

      const vto = ((settings as any).virtualTodayOffset as number | null) || 0;
      const weeklyTemplateFromSettings = (settings as any).weeklyTemplate as WeeklyTemplate | null;
      const weeklyTemplate = weeklyTemplateFromSettings || {
        days: ['running', 'strength', null, 'running', 'strength', null, 'running'] as (string | null)[],
        sportOrder: ss.length > 0 ? ss : ['running'],
      };
      const manualStatus = (ms || 'unknown') as ManualStatus;
      const derived = computeDerived(allSessions, allCheckins, sd, td, manualStatus, todayISO, ct, vto, ss, weeklyTemplate, ri, re, (settings.level as any) || 'intermediate', (settings.goals as any) || [], settings.equipment ? JSON.parse(settings.equipment as string) : {});

      set({
        todayISO,
        sessions: allSessions,
        checkins: allCheckins,
        startDate: sd,
        trainDays: td,
        checkinTier: ct,
        selectedGadgets: sg,
        selectedSports: ss,
        rehabIssues: ri,
        rehabExercises: re,
        profileLevel: (settings.level as any) || 'intermediate',
        profileGoals: (settings.goals as any) || [],
        profileEquipment: settings.equipment ? JSON.parse(settings.equipment as string) : {},
        virtualTodayOffset: vto,
        manualOverride: manualStatus,
        weight: tc?.weight ?? 0,
        restHR: tc?.restHR ?? 0,
        hrv: tc?.hrv ?? 0,
        sleepHours: tc?.sleepHours ?? 0,
        hipPain: tc?.hipPain ?? 0,
        shoulderPain: tc?.shoulderPain ?? 0,
        breathing: (tc?.breathing ?? 'good') as BreathingStatus,
        notes: tc?.notes ?? '',
        muscleSoreness: tc?.muscleSoreness ?? 0,
        energy: tc?.energy ?? 0,
        mood: tc?.mood ?? 0,
        sleepQuality: tc?.sleepQuality ?? 0,
        stress: tc?.stress ?? 0,
        testPullUps: lt?.pullUps ?? 0,
        testPushUps: lt?.pushUps ?? 0,
        testPlank: lt?.plankSec ?? 0,
        ...derived,
        weeklyTemplate,
        dataLoaded: true,
      });
      setVirtualTodayOffset(vto);
    } catch (err) {
      console.error('Failed to load data:', err);
      set({ dataLoaded: true, todayISO });
    }
  },

  // ── Form setters ──
  setWeight: v => set({ weight: v }),
  setRestHR: v => set({ restHR: v }),
  setHrv: v => set({ hrv: v }),
  setSleepHours: v => set({ sleepHours: v }),
  setHipPain: v => set({ hipPain: v }),
  setShoulderPain: v => set({ shoulderPain: v }),
  setBreathing: v => set({ breathing: v }),
  setNotes: v => set({ notes: v }),
  setMuscleSoreness: v => set({ muscleSoreness: v }),
  setEnergy: v => set({ energy: v }),
  setMood: v => set({ mood: v }),
  setSleepQuality: v => set({ sleepQuality: v }),
  setStress: v => set({ stress: v }),
  setRpe: v => set({ rpe: v }),
  setSessionNote: v => set({ sessionNote: v }),
  setDurationMinutes: v => set({ durationMinutes: v }),
  setTestPullUps: v => set({ testPullUps: v }),
  setTestPushUps: v => set({ testPushUps: v }),
  setTestPlank: v => set({ testPlank: v }),

  // ── UI setters ──
  setActiveTab: v => set({ activeTab: v }),
  setShowReadiness: v => set({ showReadiness: v }),
  setShowSettings: v => set({ showSettings: v }),
  setShowResetConfirm: v => set({ showResetConfirm: v }),
  setEditStartDate: v => set({ editStartDate: v }),
  setEditTrainDays: v => set({ editTrainDays: v }),
  setVirtualTodayOffset: async (v: number) => {
    const s = get();
    await saveSetting('virtualTodayOffset', v);
    setVirtualTodayOffset(v);
    const derived = computeDerived(s.sessions, s.checkins, s.startDate, s.trainDays, s.manualOverride, s.todayISO, s.checkinTier, v, s.selectedSports, s.weeklyTemplate, s.rehabIssues, s.rehabExercises, s.profileLevel, s.profileGoals, s.profileEquipment);
    set({ virtualTodayOffset: v, ...derived });
  },

  setCheckinTier: async (v) => {
    const s = get();
    await saveSetting('checkinTier', v);
    const derived = computeDerived(s.sessions, s.checkins, s.startDate, s.trainDays, s.manualOverride, s.todayISO, v, s.virtualTodayOffset, s.selectedSports, s.weeklyTemplate, s.rehabIssues, s.rehabExercises, s.profileLevel, s.profileGoals, s.profileEquipment);
    set({ checkinTier: v, ...derived });
  },
  setSelectedGadgets: async (v) => {
    await saveSetting('selectedGadgets', v);
    set({ selectedGadgets: v });
  },
  setSelectedSports: async (v) => {
    await saveSetting('selectedSports', v);
    set({ selectedSports: v });
  },
  setRehabIssues: async (v) => {
    await saveSetting('rehabIssues', v);
    set({ rehabIssues: v });
  },
  setRehabExercises: async (v) => {
    await saveSetting('rehabExercises', v);
    set({ rehabExercises: v });
  },
  setProfileLevel: async (v) => {
    await saveSetting('level', v);
    set({ profileLevel: v });
  },
  setProfileGoals: async (v) => {
    await saveSetting('goals', v);
    set({ profileGoals: v });
  },
  setProfileEquipment: async (v) => {
    await saveSetting('equipment', JSON.stringify(v));
    set({ profileEquipment: v });
  },

  showToast: (message, type = 'success', duration = 2000) => {
    set({ toast: { message, type, visible: true } });
    setTimeout(() => set({ toast: { message: '', type: 'success', visible: false } }), duration);
  },

  // ── Achievement notification ──
  clearPendingAchievement: () => set({ pendingAchievement: null }),

  openSettings: () => {
    const { startDate, trainDays, todayISO } = get();
    set({ editStartDate: startDate || todayISO, editTrainDays: trainDays, showSettings: true });
  },

  toggleDay: day => {
    const { editTrainDays } = get();
    set({
      editTrainDays: editTrainDays.includes(day)
        ? editTrainDays.filter(d => d !== day)
        : [...editTrainDays, day].sort((a, b) => a - b),
    });
  },

  // ── Async actions ──
  handleSaveSettings: async () => {
    const { editStartDate, editTrainDays, showToast: toast, sessions, checkins, manualOverride, todayISO, checkinTier, selectedSports, weeklyTemplate, rehabIssues, rehabExercises } = get();
    try {
      await saveSettings({ startDate: editStartDate, trainDays: editTrainDays });
      const derived = computeDerived(sessions, checkins, editStartDate, editTrainDays, manualOverride, todayISO, checkinTier, 0, selectedSports, weeklyTemplate, rehabIssues, rehabExercises, get().profileLevel, get().profileGoals, get().profileEquipment);
      set({ startDate: editStartDate, trainDays: editTrainDays, showSettings: false, ...derived });
      toast('Настройки сохранены');
    } catch (err) {
      console.error('Failed to save settings:', err);
      toast('Ошибка при сохранении настроек', 'error');
    }
  },

  handleSaveCheckin: async () => {
    const s = get();
    const checkin: Checkin = {
      date: s.todayISO,
      sleepHours: s.sleepHours,
      restHR: s.restHR,
      hrv: s.hrv,
      hipPain: s.hipPain,
      shoulderPain: s.shoulderPain,
      breathing: s.breathing,
      weight: s.weight,
      notes: s.notes,
      muscleSoreness: s.muscleSoreness,
      energy: s.energy,
      mood: s.mood,
      sleepQuality: s.sleepQuality,
      stress: s.stress,
      readiness: s.autoReadiness,
      ts: Date.now(),
    };
    try {
      await saveCheckin(checkin);
      const newCheckins = [...s.checkins.filter(c => c.date !== s.todayISO), checkin];

      // Check for newly unlocked achievements
      const newAchievements = await checkAchievements(
        s.sessions,
        newCheckins,
        s.trainDays,
        s.startDate
      );

      const derived = computeDerived(s.sessions, newCheckins, s.startDate, s.trainDays, s.manualOverride, s.todayISO, s.checkinTier, s.virtualTodayOffset, s.selectedSports, s.weeklyTemplate, s.rehabIssues, s.rehabExercises, s.profileLevel, s.profileGoals, s.profileEquipment);

      // Show achievement toast for the first new achievement
      if (newAchievements.length > 0) {
        set({
          checkins: newCheckins,
          ...derived,
          pendingAchievement: {
            key: newAchievements[0].key,
            name: newAchievements[0].name,
            tier: newAchievements[0].tier,
            icon: newAchievements[0].icon,
          }
        });
      } else {
        set({ checkins: newCheckins, ...derived });
      }

      s.showToast('Чек-ин сохранён');
    } catch (err) {
      console.error('Failed to save checkin:', err);
      s.showToast('Ошибка при сохранении чек-ина', 'error');
    }
  },

  handleManualOverrideChange: async status => {
    const { todayISO, sessions, checkins, startDate, trainDays, checkinTier, selectedSports, weeklyTemplate, rehabIssues, rehabExercises } = get();
    await saveManualStatus(todayISO, status);
    const derived = computeDerived(sessions, checkins, startDate, trainDays, status, todayISO, checkinTier, 0, selectedSports, weeklyTemplate, rehabIssues, rehabExercises, get().profileLevel, get().profileGoals, get().profileEquipment);
    set({ manualOverride: status, ...derived });
  },

  handleMarkMorning: async () => {
    const { todayISO, sessions, checkins, startDate, trainDays, manualOverride, autoReadiness, checkinTier, selectedSports } = get();
    const key = `${todayISO}_morning`;
    const existing = sessions.find(s => s.key === key);
    let newSessions: Session[];
    if (existing) {
      await deleteSession(key);
      newSessions = sessions.filter(s => s.key !== key);
    } else {
      const session: Session = { key, date: todayISO, type: 'morning', completed: true, readiness: autoReadiness, rpe: 0, notes: '', updatedAt: Date.now() };
      await saveSession(session);
      newSessions = [...sessions.filter(s => s.key !== key), session];
    }
      const derived = computeDerived(newSessions, checkins, startDate, trainDays, manualOverride, todayISO, checkinTier, 0, selectedSports, get().weeklyTemplate, get().rehabIssues, get().rehabExercises, get().profileLevel, get().profileGoals, get().profileEquipment);
    set({ sessions: newSessions, ...derived });
  },

  handleMarkEvening: async () => {
    const { todayISO, sessions, checkins, startDate, trainDays, manualOverride, autoReadiness, checkinTier, selectedSports } = get();
    const key = `${todayISO}_evening`;
    const existing = sessions.find(s => s.key === key);
    let newSessions: Session[];
    if (existing) {
      await deleteSession(key);
      newSessions = sessions.filter(s => s.key !== key);
    } else {
      const session: Session = { key, date: todayISO, type: 'evening', completed: true, readiness: autoReadiness, rpe: 0, notes: '', updatedAt: Date.now() };
      await saveSession(session);
      newSessions = [...sessions.filter(s => s.key !== key), session];
    }
    const derived = computeDerived(newSessions, checkins, startDate, trainDays, manualOverride, todayISO, checkinTier, 0, selectedSports, get().weeklyTemplate, get().rehabIssues, get().rehabExercises, get().profileLevel, get().profileGoals, get().profileEquipment);
    set({ sessions: newSessions, ...derived });
  },

  handleToggleTraining: async () => {
    const s = get();
    const key = `${s.todayISO}_${s.sessionPlan?.sport || s.sessionPlan?.sessionType || 'unknown'}`;
    const existing = s.sessions.find(sess => sess.key === key);
    let newSessions: Session[];
    if (existing && existing.completed) {
      await deleteSession(key);
      newSessions = s.sessions.filter(sess => sess.key !== key);
      s.showToast('Тренировка отменена');
    } else {
      const sessionLoad = calculateSessionLoad(s.rpe, s.durationMinutes);
      const session: Session = {
        key,
        date: s.todayISO,
        type: s.sessionPlan?.sport as Session['type'] || s.sessionPlan?.sessionType as Session['type'] || 'unknown',
        completed: true,
        readiness: s.autoReadiness,
        rpe: s.rpe,
        durationMinutes: s.durationMinutes,
        sessionLoad,
        hipPain: s.hipPain,
        shoulderPain: s.shoulderPain,
        notes: s.sessionNote,
        testResults: { pullUps: s.testPullUps, pushUps: s.testPushUps, plankSec: s.testPlank },
        mode: s.sessionPlan?.mode || 'full',
        updatedAt: Date.now(),
        ...(s.pendingApreResults.length > 0 && { apreResults: s.pendingApreResults }),
      };
      await saveSession(session);
      newSessions = [...s.sessions.filter(sess => sess.key !== key), session];
      s.showToast('Тренировка сохранена');
    }

    // Check for newly unlocked achievements
    const newAchievements = await checkAchievements(
      newSessions,
      s.checkins,
      s.trainDays,
      s.startDate
    );

    const derived = computeDerived(newSessions, s.checkins, s.startDate, s.trainDays, s.manualOverride, s.todayISO, s.checkinTier, s.virtualTodayOffset, s.selectedSports, s.weeklyTemplate, s.rehabIssues, s.rehabExercises, s.profileLevel, s.profileGoals, s.profileEquipment);

    if (newAchievements.length > 0) {
      set({
        sessions: newSessions,
        rpe: 0,
        sessionNote: '',
        durationMinutes: 45,
        pendingApreResults: [],
        ...derived,
        pendingAchievement: {
          key: newAchievements[0].key,
          name: newAchievements[0].name,
          tier: newAchievements[0].tier,
          icon: newAchievements[0].icon,
        }
      });
    } else {
      set({ sessions: newSessions, rpe: 0, sessionNote: '', durationMinutes: 45, pendingApreResults: [], ...derived });
    }
  },

  handleExportData: async () => {
    const { todayISO, showToast: toast, sessions, checkins } = get();
    try {
      const data = await exportAllData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `fitness-export-${todayISO}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast(`Экспортировано: ${sessions.length} тренировок, ${checkins.length} чек-инов`);
    } catch (err) {
      console.error('Export failed:', err);
      toast('Ошибка при экспорте данных', 'error');
    }
  },

  handleImportData: async (file: File) => {
    const { showToast: toast, startDate, trainDays, manualOverride, todayISO, checkinTier, sessions: currentSessions, checkins: currentCheckins } = get();
    try {
      // File size check (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('Файл слишком большой (макс. 5 МБ)');
      }
      // File type check
      if (!file.name.endsWith('.json') && file.type !== 'application/json') {
        throw new Error('Ожидается файл JSON');
      }

      const text = await file.text();
      if (!text.trim()) {
        throw new Error('Файл пуст');
      }

      let data: any;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error('Невалидный JSON: проверьте синтаксис файла');
      }

      // Validate data structure
      if (!data || typeof data !== 'object' || Array.isArray(data)) {
        throw new Error('Некорректный формат: ожидался объект с данными');
      }

      // Check version compatibility
      if (data.version && typeof data.version === 'number' && data.version > 3) {
        throw new Error(`Неподдерживаемая версия экспорта: ${data.version}. Обновите приложение.`);
      }

      // Warn if replacing existing data
      const hasExistingData = (currentSessions && currentSessions.length > 0) || (currentCheckins && currentCheckins.length > 0);
      if (hasExistingData) {
        // Create backup before import
        try {
          const backup = await exportAllData();
          const backupKey = `fitness-backup-before-import-${Date.now()}`;
          localStorage.setItem(backupKey, JSON.stringify(backup));
          // Keep only last 5 backups
          const backupKeys = Object.keys(localStorage).filter(k => k.startsWith('fitness-backup-')).sort();
          while (backupKeys.length > 5) {
            localStorage.removeItem(backupKeys.shift()!);
          }
        } catch (backupErr) {
          console.warn('Failed to create backup before import:', backupErr);
        }
      }

      await importAllData(data);
      const [allSessions, allCheckins] = await Promise.all([getAllSessions(), getAllCheckins()]);
      const derived = computeDerived(allSessions, allCheckins, startDate, trainDays, manualOverride, todayISO, checkinTier, 0, get().selectedSports, get().weeklyTemplate, get().rehabIssues, get().rehabExercises, get().profileLevel, get().profileGoals, get().profileEquipment);
      set({ sessions: allSessions, checkins: allCheckins, ...derived });
      toast(`Данные импортированы: ${allSessions.length} тренировок, ${allCheckins.length} чек-инов`);
    } catch (err) {
      console.error('Import failed:', err);
      const msg = err instanceof Error ? err.message : 'Не удалось импортировать файл. Проверьте формат JSON.';
      toast(msg, 'error');
      throw err; // Re-throw so caller can handle
    }
  },

  handleResetAll: () => {
    set({ showResetConfirm: true });
  },

confirmResetData: async () => {
    const { todayISO, showToast, selectedSports } = get();
    try {
      await clearAllData();
      await saveSettings({ startDate: todayISO, trainDays: [1, 3, 5] });
       const derived = computeDerived([], [], todayISO, [1, 3, 5], 'unknown', todayISO, 'medium', 0, selectedSports, get().weeklyTemplate, [], [], 'intermediate', [], {});
      set({
        sessions: [],
        checkins: [],
        rpe: 0,
        sessionNote: '',
        startDate: todayISO,
        trainDays: [1, 3, 5],
        showResetConfirm: false,
        pendingAchievement: null,
        ...derived,
      });
      showToast('Все данные удалены');
    } catch (err) {
      console.error('Reset failed:', err);
      showToast('Ошибка при сбросе данных', 'error');
    }
  },

// ── Demo Mode ──
  activateDemoMode: async () => {
    const { showToast, sessions: currentSessions, checkins: currentCheckins } = get();

    // Backup existing data before activating demo
    const hasExistingData = (currentSessions && currentSessions.length > 0) || (currentCheckins && currentCheckins.length > 0);
    if (hasExistingData) {
      try {
        const backup = await exportAllData();
        const backupKey = `fitness-backup-before-demo-${Date.now()}`;
        localStorage.setItem(backupKey, JSON.stringify(backup));
        // Keep only last 5 backups
        const backupKeys = Object.keys(localStorage).filter(k => k.startsWith('fitness-backup-')).sort();
        while (backupKeys.length > 5) {
          localStorage.removeItem(backupKeys.shift()!);
        }
        showToast('Резервная копия создана перед активацией демо');
      } catch (backupErr) {
        console.warn('Failed to create backup before demo:', backupErr);
      }
    }

    const { generateDemoData } = await import('../core/demoData.js');
    const demoData = generateDemoData();
    await activateDemoData(demoData);
    // Reload all data from demo DB
    const [allSessions, allCheckins] = await Promise.all([
      getActiveDatabase().sessions.toArray() as any,
      getActiveDatabase().checkins.toArray() as any,
    ]);
    // Set offset to -15 (midpoint of 30-day demo data) so first day of demo is shown
    const demoOffset = -15;
    // Use 'running' as default sport for demo data
    const selectedSports = ['running'];
      const derived = computeDerived(allSessions, allCheckins, allSessions.length > 0 ? allSessions[0].date : null, [1, 3, 5], 'unknown', allCheckins.length > 0 ? allCheckins[allCheckins.length - 1].date : formatISO(new Date()), 'medium', demoOffset, selectedSports, {
        days: ['running', 'strength', null, 'running', 'strength', null, 'running'],
        sportOrder: ['running'],
      }, [], [], 'intermediate', [], {});
    setVirtualTodayOffset(demoOffset);
    set({ ...derived, demoMode: true, dataLoaded: true, trainDays: [1, 3, 5], selectedSports, startDate: allSessions.length > 0 ? allSessions[0].date : formatISO(new Date()), virtualTodayOffset: demoOffset });
  },

deactivateDemoMode: async () => {
    await deactivateDemoData();
    setVirtualTodayOffset(0);
    set({ demoMode: false, dataLoaded: true, sessions: [], checkins: [], virtualTodayOffset: 0 });
  },

  // ── Onboarding ──
  completeOnboarding: async data => {
    const { todayISO, showToast } = get();
    try {
      // Save training days + tier + gadgets + sports to settings DB
      const tier = data.checkinTier || 'medium';
      await saveSettings({
        startDate: todayISO,
        trainDays: data.trainDays,
        checkinTier: tier,
        selectedGadgets: data.selectedGadgets || [],
        selectedSports: data.selectedSports || [],
      });

      // Save goal and APRE protocol preference to localStorage for future use
      if (data.selectedGoal) {
        localStorage.setItem('fitness-tracker-goal', data.selectedGoal);
      }
      if (data.apreProtocol) {
        localStorage.setItem('fitness-tracker-apre-protocol', data.apreProtocol);
      }

      // Update store state
      const allCheckins = await getAllCheckins();
      const derived = computeDerived(
        get().sessions,
        allCheckins,
        todayISO,
        data.trainDays,
        'unknown',
        todayISO,
        tier,
        0,
        data.selectedSports || [],
        get().weeklyTemplate,
        get().rehabIssues,
        get().rehabExercises,
        'intermediate',
        [],
        {},
      );

      set({
        trainDays: data.trainDays,
        startDate: todayISO,
        editTrainDays: data.trainDays,
        editStartDate: todayISO,
        checkinTier: tier,
        selectedGadgets: data.selectedGadgets || [],
        selectedSports: data.selectedSports || [],
        checkins: allCheckins,
        ...derived,
      });

      // Mark onboarding as completed in localStorage (persists across app remounts)
      markOnboardingCompleted();

      showToast('Настройка завершена!');
    } catch (err) {
      console.error('Onboarding completion failed:', err);
      showToast('Ошибка при сохранении настроек', 'error');
    }
  },
}));
