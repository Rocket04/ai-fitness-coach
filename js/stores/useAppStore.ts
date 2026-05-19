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
  WeeklySummary,
  MonthStats,
  TrendPoint,
  RpeTrendPoint,
  WeeklyAverage,
  TrendWarning,
  OvertrainingWarning,
} from '../core/types.js';
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
  getManualStatus,
  saveManualStatus,
} from '../core/storage.js';
import { calcReadiness, getEffectiveReadiness, detectRecoveryDebt } from '../core/readiness.js';
import { calculateRecoveryScore } from '../core/recoveryScore.js';
import { calculateSessionLoad } from '../core/sessionLoad.js';
import { getWeeklySummary, getMonthStats, getStreak } from '../core/stats.js';
import {
  getWorkoutType,
  getMonthAndDayIndex,
  buildSessionFromMonth,
  getLastSessionByType,
  maybeAddTestExercises,
} from '../core/planning.js';
import { getWeeklyMultiplier, getTestMultiplier } from '../core/loadAdjustments.js';
import { getCoachAdvice, getApreExplanation } from '../core/advice.js';
import {
  getTrendData,
  getRpeTrend,
  detectNegativeTrends,
  getWeeklyAverages,
  getOvertrainingWarning,
} from '../core/analytics.js';
import { parseLocalDate, formatISO } from '../core/helpers.js';

// ─── helpers ─────────────────────────────────────────────────────────────────

function makeTodayISO() {
  return formatISO(new Date());
}

function makeTomorrowDate(todayISO: string): Date {
  const d = parseLocalDate(todayISO) ?? new Date();
  d.setDate(d.getDate() + 1);
  return d;
}

// ─── derived computation ──────────────────────────────────────────────────────

function computeDerived(
  sessions: Session[],
  checkins: Checkin[],
  startDate: string | null,
  trainDays: number[],
  manualOverride: ManualStatus,
  todayISO: string
) {
  const todayDate = parseLocalDate(todayISO) ?? new Date();
  const tomorrowDate = makeTomorrowDate(todayISO);

  // Readiness
  const sorted = [...checkins].sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  const lastCheckin: Checkin | null = sorted[0] ?? null;
  const autoReadiness: ReadinessStatus = lastCheckin ? calcReadiness(lastCheckin) : 'green';
  const readiness: ReadinessStatus = getEffectiveReadiness(autoReadiness, manualOverride);
  const recoveryDebt = detectRecoveryDebt(sorted.slice(0, 3));
  const recoveryScore = lastCheckin ? calculateRecoveryScore(lastCheckin, checkins) : 0;

  // Week
  let weekNumber = 1;
  if (startDate) {
    const start = parseLocalDate(startDate);
    if (start) {
      const diffMs = todayDate.getTime() - start.getTime();
      const dayIdx = Math.max(0, Math.floor(diffMs / 86400000));
      weekNumber = Math.floor(dayIdx / 7) + 1;
    }
  }

  const trainType = getWorkoutType(todayDate, trainDays);
  const tomorrowType = getWorkoutType(tomorrowDate, trainDays);
  const { month, dayIndex } = getMonthAndDayIndex(weekNumber, trainType);
  const weeklySummary = getWeeklySummary(sessions, checkins, todayISO);

  const weeklyMultiplier = getWeeklyMultiplier(weeklySummary, todayDate.getDay());
  const testMult = getTestMultiplier(sessions, weekNumber);
  const totalMultiplier = weeklyMultiplier * testMult;

  const apreSession = trainType ? getLastSessionByType(sessions, trainType) : null;

  let sessionPlan: SessionPlan | null = null;
  if (trainType && month) {
    const plan = buildSessionFromMonth(month, dayIndex, readiness, recoveryDebt, totalMultiplier, apreSession);
    sessionPlan = maybeAddTestExercises(plan, trainType, weekNumber, readiness);
  }

  // Tomorrow's plan
  let tomorrowPlan: SessionPlan | null = null;
  if (tomorrowType) {
    let tw = 1;
    if (startDate) {
      const start = parseLocalDate(startDate);
      if (start) {
        const diffMs = tomorrowDate.getTime() - start.getTime();
        const dayIdx2 = Math.max(0, Math.floor(diffMs / 86400000));
        tw = Math.floor(dayIdx2 / 7) + 1;
      }
    }
    const tm = getMonthAndDayIndex(tw, tomorrowType);
    if (tm.month) {
      tomorrowPlan = buildSessionFromMonth(tm.month, tm.dayIndex, readiness, recoveryDebt, 1.0, null);
    }
  }

  // Stats
  const testHistory = sessions
    .filter(s => s.testResults)
    .map(s => ({ date: s.date, testResults: s.testResults! }));
  const monthStats = getMonthStats(sessions, todayISO.slice(0, 7));
  const morningDone = sessions.some(s => s.date === todayISO && s.type === 'morning' && s.completed);
  const eveningDone = sessions.some(s => s.date === todayISO && s.type === 'evening' && s.completed);
  const trainingDone = trainType
    ? sessions.some(s => s.date === todayISO && s.type === trainType && s.completed)
    : false;
  const streak = getStreak(checkins);
  const coachAdvice = getCoachAdvice(recoveryScore, lastCheckin || {}, testHistory, weeklySummary);
  const apreReasons = getApreExplanation(
    sessionPlan?.mode || 'full',
    readiness,
    recoveryDebt,
    totalMultiplier,
    apreSession
  );

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
    // Plan
    weekNumber,
    weekLabel: `Неделя ${weekNumber}`,
    trainType,
    tomorrowType,
    month,
    dayIndex,
    weeklySummary,
    sessionPlan,
    tomorrowPlan,
    totalMultiplier,
    apreSession,
    apreReasons,
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
  showSettings: boolean;
  editStartDate: string;
  editTrainDays: number[];

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

  // ── UI ──
  activeTab: number;
  showReadiness: boolean;
  manualOverride: ManualStatus;
  toast: { message: string; type: ToastType; visible: boolean };

  // ── Derived (recomputed on data change) ──
  todayDate: Date;
  tomorrowDate: Date;
  lastCheckin: Checkin | null;
  autoReadiness: ReadinessStatus;
  readiness: ReadinessStatus;
  recoveryDebt: boolean;
  recoveryScore: number;
  weekNumber: number;
  weekLabel: string;
  trainType: 'A' | 'B' | 'C' | null;
  tomorrowType: 'A' | 'B' | 'C' | null;
  month: unknown;
  dayIndex: number | null;
  weeklySummary: WeeklySummary;
  sessionPlan: SessionPlan | null;
  tomorrowPlan: SessionPlan | null;
  totalMultiplier: number;
  apreSession: Session | null;
  apreReasons: string[];
  testHistory: Array<{ date: string; testResults: NonNullable<Session['testResults']> }>;
  monthStats: MonthStats;
  morningDone: boolean;
  eveningDone: boolean;
  trainingDone: boolean;
  streak: number;
  coachAdvice: string[];
  trendData7: TrendPoint[];
  trendData30: TrendPoint[];
  rpeTrend7: RpeTrendPoint[];
  rpeTrend30: RpeTrendPoint[];
  weeklyAverages: WeeklyAverage[];
  trendWarnings: TrendWarning[];
  overtrainingWarning: OvertrainingWarning | null;

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
  setEditStartDate: (v: string) => void;
  setEditTrainDays: (v: number[]) => void;
  showToast: (message: string, type?: ToastType, duration?: number) => void;
  openSettings: () => void;
  toggleDay: (day: number) => void;
  handleSaveSettings: () => Promise<void>;
  handleSaveCheckin: () => Promise<void>;
  handleManualOverrideChange: (status: ManualStatus) => Promise<void>;
  handleMarkMorning: () => Promise<void>;
  handleMarkEvening: () => Promise<void>;
  handleToggleTraining: () => Promise<void>;
  handleExportData: () => Promise<void>;
  handleImportData: (file: File) => Promise<void>;
  handleResetAll: () => Promise<void>;

  // ── Internal ──
  _recompute: () => void;
}

// ─── initial derived snapshot ─────────────────────────────────────────────────

const todayISO0 = makeTodayISO();
const initialDerived = computeDerived([], [], null, [1, 3, 5], 'unknown', todayISO0);

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
  showSettings: false,
  editStartDate: '',
  editTrainDays: [1, 3, 5],

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

  // UI
  activeTab: 0,
  showReadiness: false,
  manualOverride: 'unknown',
  toast: { message: '', type: 'success', visible: false },

  // Derived
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
      s.todayISO
    );
    set(derived);
  },

  // ── App init ──
  initApp: async () => {
    const todayISO = makeTodayISO();
    try {
      await init();
      const [allSessions, allCheckins, settings] = await Promise.all([
        getAllSessions(),
        getAllCheckins(),
        getSettings(),
      ]);

      const sd = (settings.startDate as string | null) || todayISO;
      const td = (settings.trainDays as number[] | null) || [1, 3, 5];

      if (!settings.startDate || !settings.trainDays) {
        await saveSettings({ startDate: sd, trainDays: td });
      }

      const tc = await getCheckin(todayISO);
      const ms = await getManualStatus(todayISO);
      const lt = await getLatestTestResults();

      const manualStatus = (ms || 'unknown') as ManualStatus;
      const derived = computeDerived(allSessions, allCheckins, sd, td, manualStatus, todayISO);
      set({
        todayISO,
        sessions: allSessions,
        checkins: allCheckins,
        startDate: sd,
        trainDays: td,
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
        dataLoaded: true,
      });
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
  setEditStartDate: v => set({ editStartDate: v }),
  setEditTrainDays: v => set({ editTrainDays: v }),

  showToast: (message, type = 'success', duration = 2000) => {
    set({ toast: { message, type, visible: true } });
    setTimeout(() => set({ toast: { message: '', type: 'success', visible: false } }), duration);
  },

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
    const { editStartDate, editTrainDays, showToast: toast, sessions, checkins, manualOverride, todayISO } = get();
    try {
      await saveSettings({ startDate: editStartDate, trainDays: editTrainDays });
      const derived = computeDerived(sessions, checkins, editStartDate, editTrainDays, manualOverride, todayISO);
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
      const derived = computeDerived(s.sessions, newCheckins, s.startDate, s.trainDays, s.manualOverride, s.todayISO);
      set({ checkins: newCheckins, ...derived });
      s.showToast('Чек-ин сохранён');
    } catch (err) {
      console.error('Failed to save checkin:', err);
      s.showToast('Ошибка при сохранении чек-ина', 'error');
    }
  },

  handleManualOverrideChange: async status => {
    const { todayISO, sessions, checkins, startDate, trainDays } = get();
    await saveManualStatus(todayISO, status);
    const derived = computeDerived(sessions, checkins, startDate, trainDays, status, todayISO);
    set({ manualOverride: status, ...derived });
  },

  handleMarkMorning: async () => {
    const { todayISO, sessions, checkins, startDate, trainDays, manualOverride, autoReadiness } = get();
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
    const derived = computeDerived(newSessions, checkins, startDate, trainDays, manualOverride, todayISO);
    set({ sessions: newSessions, ...derived });
  },

  handleMarkEvening: async () => {
    const { todayISO, sessions, checkins, startDate, trainDays, manualOverride, autoReadiness } = get();
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
    const derived = computeDerived(newSessions, checkins, startDate, trainDays, manualOverride, todayISO);
    set({ sessions: newSessions, ...derived });
  },

  handleToggleTraining: async () => {
    const s = get();
    const key = `${s.todayISO}_${s.trainType}`;
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
        type: s.trainType as Session['type'],
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
      };
      await saveSession(session);
      newSessions = [...s.sessions.filter(sess => sess.key !== key), session];
      s.showToast('Тренировка сохранена');
    }
    const derived = computeDerived(newSessions, s.checkins, s.startDate, s.trainDays, s.manualOverride, s.todayISO);
    set({ sessions: newSessions, rpe: 0, sessionNote: '', durationMinutes: 45, ...derived });
  },

  handleExportData: async () => {
    const { todayISO } = get();
    try {
      const data = await exportAllData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `fitness-export-${todayISO}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed:', err);
    }
  },

  handleImportData: async file => {
    const { showToast: toast, startDate, trainDays, manualOverride, todayISO } = get();
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      await importAllData(data);
      const [allSessions, allCheckins] = await Promise.all([getAllSessions(), getAllCheckins()]);
      const derived = computeDerived(allSessions, allCheckins, startDate, trainDays, manualOverride, todayISO);
      set({ sessions: allSessions, checkins: allCheckins, ...derived });
      toast('Данные импортированы');
    } catch (err) {
      console.error('Import failed:', err);
      const msg = err instanceof Error ? err.message : 'Не удалось импортировать файл. Проверьте формат JSON.';
      toast(msg, 'error');
    }
  },

  handleResetAll: async () => {
    if (!window.confirm('Удалить все данные? Это действие нельзя отменить.')) return;
    const { todayISO } = get();
    try {
      await clearAllData();
      await saveSettings({ startDate: todayISO, trainDays: [1, 3, 5] });
      const derived = computeDerived([], [], todayISO, [1, 3, 5], 'unknown', todayISO);
      set({
        sessions: [],
        checkins: [],
        rpe: 0,
        sessionNote: '',
        startDate: todayISO,
        trainDays: [1, 3, 5],
        ...derived,
      });
    } catch (err) {
      console.error('Reset failed:', err);
    }
  },
}));
