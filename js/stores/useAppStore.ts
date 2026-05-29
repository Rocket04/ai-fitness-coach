// js/stores/useAppStore.ts
// Central Zustand store: data + derived state + actions (replaces AppContext)
// Orchestrator: combines 5 slice files, keeps computeDerived/_recompute/initApp

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
  SetResult,
  WeeklyTemplate,
  PhaseType,
} from '../core/types.js';
import type { CheckinTier } from '../core/recoveryScore.js';
import type { WeeklyPlan } from '../core/weeklyPlan.js';
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
import { markOnboardingCompleted, isOnboardingCompleted } from '../core/onboardingStorage.js';
import { generateDemoData } from '../core/demoData.js';
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
import { parseLocalDate, formatISO, getAppDateSync, setVirtualTodayOffset as setVirtualTodayOffsetHelper, mondayOfWeek } from '../core/helpers.js';
import { buildWeeklyPlanDays } from '../core/weeklyPlan.js';

import { createCheckinSlice } from './slices/checkinSlice.js';
import { createSessionSlice } from './slices/sessionSlice.js';
import { createUiSlice } from './slices/uiSlice.js';
import { createDataSlice } from './slices/dataSlice.js';
import { createDemoSlice } from './slices/demoSlice.js';

// ─── helpers ─────────────────────────────────────────────────────────────────

function makeTodayISO(virtualOffset: number = 0) {
  return formatISO(getAppDateSync(virtualOffset));
}

function makeTomorrowDate(todayISO: string, virtualOffset: number = 0): Date {
  const d = parseLocalDate(todayISO) ?? getAppDateSync(virtualOffset);
  d.setDate(d.getDate() + 1);
  return d;
}

// ─── guest mode sessionStorage helpers ───────────────────────────────────────

const GUEST_SESSIONS_KEY = 'fitness-tracker-guest-sessions';
const GUEST_CHECKINS_KEY = 'fitness-tracker-guest-checkins';
const GUEST_SETTINGS_KEY = 'fitness-tracker-guest-settings';

function saveGuestSessions(sessions: Session[]) {
  try { sessionStorage.setItem(GUEST_SESSIONS_KEY, JSON.stringify(sessions)); } catch { /* ignore */ }
}

function getGuestSessions(): Session[] {
  try { const raw = sessionStorage.getItem(GUEST_SESSIONS_KEY); return raw ? JSON.parse(raw) : []; } catch { return []; }
}

function saveGuestCheckins(checkins: Checkin[]) {
  try { sessionStorage.setItem(GUEST_CHECKINS_KEY, JSON.stringify(checkins)); } catch { /* ignore */ }
}

function getGuestCheckins(): Checkin[] {
  try { const raw = sessionStorage.getItem(GUEST_CHECKINS_KEY); return raw ? JSON.parse(raw) : []; } catch { return []; }
}

function saveGuestSettings(settings: Record<string, unknown>) {
  try { sessionStorage.setItem(GUEST_SETTINGS_KEY, JSON.stringify(settings)); } catch { /* ignore */ }
}

function clearGuestData() {
  sessionStorage.removeItem(GUEST_SESSIONS_KEY);
  sessionStorage.removeItem(GUEST_CHECKINS_KEY);
  sessionStorage.removeItem(GUEST_SETTINGS_KEY);
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
  const adaptedToday = getAdaptedSessionForDate(
    todayISO, selectedSports, startDate, template,
    readiness, recoveryDebt, totalWeek, 1.0, null,
    rehabIssues, rehabExercises, virtualTodayOffset,
    profileLevel, profileGoals, profileEquipment
  );
  const sessionPlan = adaptedToday?.session ?? null;
  const planModifications = adaptedToday?.modifications ?? [];

  // Tomorrow's plan
  const tomorrowISO = formatISO(makeTomorrowDate(todayISO, virtualTodayOffset));
  const tomorrowAdapted = getAdaptedSessionForDate(
    tomorrowISO, selectedSports, startDate, template,
    readiness, recoveryDebt, totalWeek, 1.0, null,
    rehabIssues, rehabExercises, 0
  );
  const tomorrowPlan = tomorrowAdapted?.session ?? null;

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

  // Weekly plan for 7-day view
  const weeklyPlan = buildWeeklyPlanDays(
    formatISO(mondayOfWeek(parseLocalDate(todayISO) ?? new Date())),
    selectedSports, startDate, template, virtualTodayOffset,
    readiness, recoveryDebt, totalWeek, 1.0, null,
    rehabIssues, rehabExercises,
    profileLevel, profileGoals, profileEquipment
  );

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
      planModifications,
      weeklyPlan,
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
  guestMode: boolean;
  showGuestModal: boolean;
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
  /** Accumulated set completions during current workout UI session, not yet saved to Dexie */
  pendingSetResults: SetResult[];
  /** User-reported fatigue after training (1-10) */
  postSessionFatigue: number;
  /** User-reported pain after training (0-10) */
  postSessionPain: number;

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
  planModifications: string[];
  weeklyPlan: WeeklyPlan;
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
  updateSetResult: (result: SetResult) => void;
  setPostSessionFatigue: (v: number) => void;
  setPostSessionPain: (v: number) => void;
  handleExportData: () => Promise<void>;
  handleImportData: (file: File) => Promise<void>;
  handleResetAll: () => void;
  confirmResetData: () => Promise<void>;

  // ── Onboarding ──
  completeOnboarding: (data: { trainDays: number[]; selectedGoal?: string; apreProtocol?: string; checkinTier?: CheckinTier; selectedGadgets?: string[]; selectedSports?: string[] }) => Promise<void>;

  // ── Guest Mode ──
  setShowGuestModal: (v: boolean) => void;
  startTracking: () => void;
  completeGuestModeOnboarding: (data: { trainDays: number[]; selectedGoal?: string; apreProtocol?: string; checkinTier?: CheckinTier; selectedGadgets?: string[]; selectedSports?: string[] }) => Promise<void>;

  // ── Achievement notification ──
  clearPendingAchievement: () => void;

  // ── Internal ──
  _recompute: () => void;
}

// ─── initial derived snapshot ─────────────────────────────────────────────────

const todayISO0 = makeTodayISO();
const initialDerived = computeDerived([], [], null, [1, 2, 3, 4, 5, 6], 'unknown', todayISO0, 'medium', 0, ['calisthenics', 'walking', 'stretching'], {
  days: ['calisthenics', 'walking', 'stretching', 'calisthenics', 'walking', 'stretching', null] as (string | null)[],
  sportOrder: ['calisthenics', 'walking', 'stretching'] as string[],
}, ['hips', 'shoulder', 'back'], [], 'beginner', ['rehabilitation'], { pullup_bar: true, dumbbells_max_kg: 4 });

// ─── store ────────────────────────────────────────────────────────────────────

export const useAppStore = create<AppStore>((set, get) => {
  // Create slices — each returns its state + actions
  const checkin = createCheckinSlice(set, get as any);
  const session = createSessionSlice(set, get as any);
  const ui = createUiSlice(set, get as any);
  const data = createDataSlice();
  const demo = createDemoSlice();

  return {
    // ── Spread slice initial state ──
    ...checkin,
    ...session,
    ...ui,
    ...data,
    ...demo,

    // todayISO (orchestrator-managed)
    todayISO: todayISO0,

    // ── Achievement notification ──
    pendingAchievement: null,

    // ── Derived ──
    ...initialDerived,

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
        const td = (settings.trainDays as number[] | null) || [1, 2, 3, 4, 5, 6];
        const ct = (settings.checkinTier as CheckinTier | null) || 'medium';
        const sg = (settings.selectedGadgets as string[] | null) || [];
        const ss = (settings.selectedSports as string[] | null) || ['calisthenics', 'walking', 'stretching'];
        const ri = (settings.rehabIssues as string[] | null) || ['hips', 'shoulder', 'back'];
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
          days: ['calisthenics', 'walking', 'stretching', 'calisthenics', 'walking', 'stretching', null] as (string | null)[],
          sportOrder: ss,
        };
        const manualStatus = (ms || 'unknown') as ManualStatus;

        const hasExistingData = allSessions.length > 0 || allCheckins.length > 0;
        const onboardingCompleted = isOnboardingCompleted();

        let sessions = allSessions;
        let checkins = allCheckins;
        let isGuestMode = false;

        // Guest Mode: no data + onboarding not done → show demo data
        if (!hasExistingData && !onboardingCompleted) {
          isGuestMode = true;
          // Check if guest data exists in sessionStorage (user refreshed page in guest mode)
          const guestSessions = getGuestSessions();
          const guestCheckins = getGuestCheckins();

          if (guestSessions.length > 0 || guestCheckins.length > 0) {
            // Restore guest session data
            sessions = guestSessions;
            checkins = guestCheckins;
          } else {
            // Generate fresh demo data
            const demoData = generateDemoData();
            sessions = demoData.sessions;
            checkins = demoData.checkins;
            // Save to sessionStorage for persistence within the session
            saveGuestSessions(sessions);
            saveGuestCheckins(checkins);
            saveGuestSettings(demoData.settings);
          }
        }

        const derived = computeDerived(sessions, checkins, sd, td, manualStatus, todayISO, ct, vto, ss, weeklyTemplate, ri, re, (settings.level as any) || 'intermediate', (settings.goals as any) || [], settings.equipment ? JSON.parse(settings.equipment as string) : {});

        set({
          todayISO,
          sessions,
          checkins,
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
          guestMode: isGuestMode,
        });
        setVirtualTodayOffsetHelper(vto);
      } catch (err) {
        console.error('Failed to load data:', err);
        set({ dataLoaded: true, todayISO });
      }
    },

    // ── Async settings actions (orchestrator — need _recompute) ──
    setCheckinTier: async (v) => {
      const s = get();
      await saveSetting('checkinTier', v);
      const derived = computeDerived(s.sessions, s.checkins, s.startDate, s.trainDays, s.manualOverride, s.todayISO, v, s.virtualTodayOffset, s.selectedSports, s.weeklyTemplate, s.rehabIssues, s.rehabExercises, s.profileLevel, s.profileGoals, s.profileEquipment);
      set({ checkinTier: v, ...derived });
    },
    setVirtualTodayOffset: async (v) => {
      const s = get();
      await saveSetting('virtualTodayOffset', v);
      setVirtualTodayOffsetHelper(v);
      const derived = computeDerived(s.sessions, s.checkins, s.startDate, s.trainDays, s.manualOverride, s.todayISO, s.checkinTier, v, s.selectedSports, s.weeklyTemplate, s.rehabIssues, s.rehabExercises, s.profileLevel, s.profileGoals, s.profileEquipment);
      set({ virtualTodayOffset: v, ...derived });
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

    // ── Toast ──
    showToast: (message, type = 'success', duration = 2000) => {
      set({ toast: { message, type, visible: true } });
      setTimeout(() => set({ toast: { message: '', type: 'success', visible: false } }), duration);
    },

    // ── Achievement notification ──
    clearPendingAchievement: () => set({ pendingAchievement: null }),

    // ── UI helpers ──
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
      const { editStartDate, editTrainDays, showToast: toast, sessions, checkins, manualOverride, todayISO, checkinTier, selectedSports, weeklyTemplate, rehabIssues, rehabExercises, guestMode } = get();
      try {
        if (guestMode) {
          saveGuestSettings({ startDate: editStartDate, trainDays: editTrainDays });
          const derived = computeDerived(sessions, checkins, editStartDate, editTrainDays, manualOverride, todayISO, checkinTier, 0, selectedSports, weeklyTemplate, rehabIssues, rehabExercises, get().profileLevel, get().profileGoals, get().profileEquipment);
          set({ startDate: editStartDate, trainDays: editTrainDays, showSettings: false, ...derived, showGuestModal: true });
          toast('Настройки сохранены временно');
          return;
        }
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
        const newCheckins = [...s.checkins.filter(c => c.date !== s.todayISO), checkin];

        if (s.guestMode) {
          saveGuestCheckins(newCheckins);
          const derived = computeDerived(s.sessions, newCheckins, s.startDate, s.trainDays, s.manualOverride, s.todayISO, s.checkinTier, s.virtualTodayOffset, s.selectedSports, s.weeklyTemplate, s.rehabIssues, s.rehabExercises, s.profileLevel, s.profileGoals, s.profileEquipment);
          set({ checkins: newCheckins, ...derived, showGuestModal: true });
          s.showToast('Чек-ин сохранён временно');
          return;
        }

        await saveCheckin(checkin);

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
      const { todayISO, sessions, checkins, startDate, trainDays, manualOverride, autoReadiness, checkinTier, selectedSports, guestMode } = get();
      const key = `${todayISO}_morning`;
      const existing = sessions.find(s => s.key === key);
      let newSessions: Session[];
      if (existing) {
        if (!guestMode) await deleteSession(key);
        newSessions = sessions.filter(s => s.key !== key);
      } else {
        const session: Session = { key, date: todayISO, type: 'morning', completed: true, readiness: autoReadiness, rpe: 0, notes: '', updatedAt: Date.now() };
        if (!guestMode) await saveSession(session);
        newSessions = [...sessions.filter(s => s.key !== key), session];
      }
      if (guestMode) saveGuestSessions(newSessions);
      const derived = computeDerived(newSessions, checkins, startDate, trainDays, manualOverride, todayISO, checkinTier, 0, selectedSports, get().weeklyTemplate, get().rehabIssues, get().rehabExercises, get().profileLevel, get().profileGoals, get().profileEquipment);
      set({ sessions: newSessions, ...derived, ...(guestMode ? { showGuestModal: true } : {}) });
    },

    handleMarkEvening: async () => {
      const { todayISO, sessions, checkins, startDate, trainDays, manualOverride, autoReadiness, checkinTier, selectedSports, guestMode } = get();
      const key = `${todayISO}_evening`;
      const existing = sessions.find(s => s.key === key);
      let newSessions: Session[];
      if (existing) {
        if (!guestMode) await deleteSession(key);
        newSessions = sessions.filter(s => s.key !== key);
      } else {
        const session: Session = { key, date: todayISO, type: 'evening', completed: true, readiness: autoReadiness, rpe: 0, notes: '', updatedAt: Date.now() };
        if (!guestMode) await saveSession(session);
        newSessions = [...sessions.filter(s => s.key !== key), session];
      }
      if (guestMode) saveGuestSessions(newSessions);
      const derived = computeDerived(newSessions, checkins, startDate, trainDays, manualOverride, todayISO, checkinTier, 0, selectedSports, get().weeklyTemplate, get().rehabIssues, get().rehabExercises, get().profileLevel, get().profileGoals, get().profileEquipment);
      set({ sessions: newSessions, ...derived, ...(guestMode ? { showGuestModal: true } : {}) });
    },

    handleToggleTraining: async () => {
      const s = get();
      const key = `${s.todayISO}_${s.sessionPlan?.sport || s.sessionPlan?.sessionType || 'unknown'}`;
      const existing = s.sessions.find(sess => sess.key === key);
      let newSessions: Session[];
      if (existing && existing.completed) {
        if (!s.guestMode) await deleteSession(key);
        newSessions = s.sessions.filter(sess => sess.key !== key);
        s.showToast('Тренировка отменена');
      } else {
        const sessionLoad = calculateSessionLoad(s.rpe, s.durationMinutes);
        const exerciseMap: Record<string, { completedSets: number; repsPerSet: number[]; rpePerSet: number[] }> = {};
        for (const sr of s.pendingSetResults) {
          const name = sr.exerciseName || 'unknown';
          if (!exerciseMap[name]) exerciseMap[name] = { completedSets: 0, repsPerSet: [], rpePerSet: [] };
          if (sr.completed) {
            exerciseMap[name].completedSets += 1;
            exerciseMap[name].repsPerSet.push(sr.repsDone);
            exerciseMap[name].rpePerSet.push(sr.rpe ?? 0);
          }
        }
        const exerciseResults = Object.entries(exerciseMap).map(([exerciseName, data]) => ({
          exerciseName,
          plannedSets: 0,
          completedSets: data.completedSets,
          repsPerSet: data.repsPerSet,
          rpePerSet: data.rpePerSet,
          completed: data.completedSets > 0,
        }));
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
          ...(exerciseResults.length > 0 && { exerciseResults }),
          ...(s.postSessionFatigue !== undefined && { postSessionFatigue: s.postSessionFatigue }),
          ...(s.postSessionPain !== undefined && { postSessionPain: s.postSessionPain }),
        };
        if (!s.guestMode) await saveSession(session);
        newSessions = [...s.sessions.filter(sess => sess.key !== key), session];
        s.showToast('Тренировка сохранена');
      }

      if (s.guestMode) {
        saveGuestSessions(newSessions);
        const derived = computeDerived(newSessions, s.checkins, s.startDate, s.trainDays, s.manualOverride, s.todayISO, s.checkinTier, s.virtualTodayOffset, s.selectedSports, s.weeklyTemplate, s.rehabIssues, s.rehabExercises, s.profileLevel, s.profileGoals, s.profileEquipment);
        set({ sessions: newSessions, rpe: 0, sessionNote: '', durationMinutes: 45, pendingApreResults: [], pendingSetResults: [], postSessionFatigue: undefined, postSessionPain: undefined, ...derived, showGuestModal: true });
        return;
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
          pendingSetResults: [],
          postSessionFatigue: undefined,
          postSessionPain: undefined,
          ...derived,
          pendingAchievement: {
            key: newAchievements[0].key,
            name: newAchievements[0].name,
            tier: newAchievements[0].tier,
            icon: newAchievements[0].icon,
          }
        });
      } else {
        set({ sessions: newSessions, rpe: 0, sessionNote: '', durationMinutes: 45, pendingApreResults: [], pendingSetResults: [], postSessionFatigue: undefined, postSessionPain: undefined, ...derived });
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
      setVirtualTodayOffsetHelper(demoOffset);
      set({ ...derived, demoMode: true, dataLoaded: true, trainDays: [1, 3, 5], selectedSports, startDate: allSessions.length > 0 ? allSessions[0].date : formatISO(new Date()), virtualTodayOffset: demoOffset });
    },

    deactivateDemoMode: async () => {
      await deactivateDemoData();
      setVirtualTodayOffsetHelper(0);
      set({ demoMode: false, dataLoaded: true, sessions: [], checkins: [], virtualTodayOffset: 0 });
    },

    // ── Demo Mode with Profile ──
    activateDemoModeWithProfile: async (profile: import('../core/demoData.js').DemoProfile) => {
      const { showToast, sessions: currentSessions, checkins: currentCheckins } = get();

      // Backup existing data
      const hasExistingData = (currentSessions && currentSessions.length > 0) || (currentCheckins && currentCheckins.length > 0);
      if (hasExistingData) {
        try {
          const backup = await exportAllData();
          const backupKey = `fitness-backup-before-demo-${profile}-${Date.now()}`;
          localStorage.setItem(backupKey, JSON.stringify(backup));
          const backupKeys = Object.keys(localStorage).filter(k => k.startsWith('fitness-backup-')).sort();
          while (backupKeys.length > 5) {
            localStorage.removeItem(backupKeys.shift()!);
          }
        } catch (backupErr) {
          console.warn('Failed to create backup before demo:', backupErr);
        }
      }

      const { generateDemoDataForProfile, DEMO_PROFILES } = await import('../core/demoData.js');
      const profileConfig = DEMO_PROFILES[profile];
      const demoData = generateDemoDataForProfile(profile);
      await activateDemoData(demoData);

      const [allSessions, allCheckins] = await Promise.all([
        getActiveDatabase().sessions.toArray() as any,
        getActiveDatabase().checkins.toArray() as any,
      ]);

      const demoOffset = -15;
      const selectedSports = profileConfig.settings.selectedSports || ['running'];
      const profileLevel = (profileConfig.settings.level || 'intermediate') as import('../core/types.js').FitnessLevel;
      const profileEquipment = profileConfig.settings.equipment ? JSON.parse(profileConfig.settings.equipment) : {};
      const checkinTier = profileConfig.settings.checkinTier || 'medium';

      const derived = computeDerived(
        allSessions, allCheckins,
        allSessions.length > 0 ? allSessions[0].date : null,
        profileConfig.settings.trainDays || [1, 3, 5],
        'unknown',
        allCheckins.length > 0 ? allCheckins[allCheckins.length - 1].date : formatISO(new Date()),
        checkinTier,
        demoOffset,
        selectedSports,
        profileConfig.weeklyTemplate,
        [], [], profileLevel, profileConfig.settings.goals as import('../core/types.js').FitnessGoal[] || [], profileEquipment
      );

      setVirtualTodayOffsetHelper(demoOffset);
      set({
        ...derived,
        demoMode: true,
        dataLoaded: true,
        trainDays: profileConfig.settings.trainDays || [1, 3, 5],
        selectedSports,
        startDate: allSessions.length > 0 ? allSessions[0].date : formatISO(new Date()),
        virtualTodayOffset: demoOffset,
        profileLevel,
        profileGoals: profileConfig.settings.goals as import('../core/types.js').FitnessGoal[] || [],
        profileEquipment,
        checkinTier,
      });

      showToast(`Демо: ${profileConfig.name} — ${allSessions.length} тренировок, ${allCheckins.length} чек-инов`);
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

    // ── Guest Mode ──
    setShowGuestModal: (v: boolean) => set({ showGuestModal: v }),

    startTracking: () => {
      clearGuestData();
      set({
        guestMode: false,
        sessions: [],
        checkins: [],
        showGuestModal: false,
        startDate: null,
        trainDays: [1, 3, 5],
        editStartDate: '',
        editTrainDays: [1, 3, 5],
        selectedSports: [],
        selectedGadgets: [],
      });
    },

    completeGuestModeOnboarding: async data => {
      const { showToast } = get();
      try {
        const tier = data.checkinTier || 'medium';
        // Migrate guest sessionStorage data to real IndexedDB
        const guestSessions = getGuestSessions();
        const guestCheckins = getGuestCheckins();

        // Save all guest sessions to IndexedDB
        for (const session of guestSessions) {
          await saveSession(session);
        }
        // Save all guest checkins to IndexedDB
        for (const checkin of guestCheckins) {
          await saveCheckin(checkin);
        }

        await saveSettings({
          startDate: makeTodayISO(),
          trainDays: data.trainDays,
          checkinTier: tier,
          selectedGadgets: data.selectedGadgets || [],
          selectedSports: data.selectedSports || [],
        });

        if (data.selectedGoal) {
          localStorage.setItem('fitness-tracker-goal', data.selectedGoal);
        }
        if (data.apreProtocol) {
          localStorage.setItem('fitness-tracker-apre-protocol', data.apreProtocol);
        }

        // Reload real data
        const [allSessions, allCheckins] = await Promise.all([
          getAllSessions(),
          getAllCheckins(),
        ]);
        const derived = computeDerived(
          allSessions,
          allCheckins,
          makeTodayISO(),
          data.trainDays,
          'unknown',
          makeTodayISO(),
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

        clearGuestData();

        set({
          sessions: allSessions,
          checkins: allCheckins,
          trainDays: data.trainDays,
          startDate: makeTodayISO(),
          editTrainDays: data.trainDays,
          editStartDate: makeTodayISO(),
          checkinTier: tier,
          selectedGadgets: data.selectedGadgets || [],
          selectedSports: data.selectedSports || [],
          guestMode: false,
          showGuestModal: false,
          ...derived,
        });

        markOnboardingCompleted();
        showToast('Настройка завершена! Данные сохранены.');
      } catch (err) {
        console.error('Guest mode onboarding completion failed:', err);
        showToast('Ошибка при сохранении настроек', 'error');
      }
    },
  };
});
