import { create } from 'zustand';
import type {
  Session,
  Checkin,
  ManualStatus,
  BreathingStatus,
  ToastType,
  WeeklyTemplate,
} from '../core/types.js';
import type { CheckinTier } from '../domains/recovery/recoveryScore.js';
import { cancelDailyReminder } from '../domains/notifications/notifications.js';
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
  getBackups,
  restoreFromBackup,
} from '../data/storage.js';
import type { BackupRecord } from '../data/storage.js';
import { markOnboardingCompleted, isOnboardingCompleted } from '../core/onboardingStorage.js';
import { generateDemoData } from '../core/demoData.js';
import { calculateSessionLoad } from '../core/sessionLoad.js';
import { checkAchievements } from '../core/achievements.js';
import { formatISO, getAppDateSync, setVirtualTodayOffset as setVirtualTodayOffsetHelper } from '../core/helpers.js';
import { parseHealthSyncCSV } from '../core/import/csvParser.js';
import { mergeImportedBiometrics } from '../core/import/mergeImportedData.js';

import { createCheckinSlice, type CheckinSlice } from '../domains/checkin/checkinSlice.js';
import { createDemoSlice, type DemoSlice } from '../domains/demo/demoSlice.js';
import { createSessionSlice, type SessionSlice } from './slices/sessionSlice.js';
import { createUiSlice, type UiSlice } from './slices/uiSlice.js';
import { createDataSlice, type DataSlice } from './slices/dataSlice.js';
import { computeDerived, type DerivedState } from './computeDerived.js';

function makeTodayISO(virtualOffset: number = 0) {
  return formatISO(getAppDateSync(virtualOffset));
}

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

type OrchestratorActions = {
  todayISO: string;
  pendingAchievement: { key: string; name: string; tier: string; icon: string } | null;
  backupList: BackupRecord[];
  _recompute: () => void;
  initApp: () => Promise<void>;
  setCheckinTier: (v: CheckinTier) => Promise<void>;
  setVirtualTodayOffset: (v: number) => Promise<void>;
  setSelectedGadgets: (v: string[]) => Promise<void>;
  setSelectedSports: (v: string[]) => Promise<void>;
  setRehabIssues: (v: string[]) => Promise<void>;
  setRehabExercises: (v: string[]) => Promise<void>;
  setProfileLevel: (v: any) => Promise<void>;
  setProfileGoals: (v: any) => Promise<void>;
  setProfileEquipment: (v: any) => Promise<void>;
  showToast: (message: string, type?: ToastType, duration?: number) => void;
  clearPendingAchievement: () => void;
  openSettings: () => void;
  closeSettings: () => void;
  toggleDay: (day: number) => void;
  handleSaveSettings: () => Promise<void>;
  handleSaveCheckin: () => Promise<void>;
  handleManualOverrideChange: (status: ManualStatus) => Promise<void>;
  handleToggleTraining: () => Promise<void>;
  handleExportData: () => Promise<void>;
  handleImportData: (file: File) => Promise<void>;
  handleImportHealthSyncCSV: (csvContent: string) => Promise<void>;
  handleResetAll: () => void;
  closeResetConfirm: () => void;
  confirmResetData: () => Promise<void>;
  refreshBackupList: () => Promise<void>;
  handleRestoreBackup: (backupId: number) => Promise<void>;
  completeOnboarding: (data: {
    trainDays: number[];
    selectedGoal?: string;
    apreProtocol?: string;
    checkinTier?: CheckinTier;
    selectedGadgets?: string[];
    selectedSports?: string[];
  }) => Promise<void>;
  setShowGuestModal: (v: boolean) => void;
  setGuestMode: (v: boolean) => void;
  startTracking: () => void;
  completeGuestModeOnboarding: (data: {
    trainDays: number[];
    selectedGoal?: string;
    apreProtocol?: string;
    checkinTier?: CheckinTier;
    selectedGadgets?: string[];
    selectedSports?: string[];
  }) => Promise<void>;
  activateDemoMode: () => Promise<void>;
  deactivateDemoMode: () => Promise<void>;
  setDemoMode: (v: boolean) => void;
  activateDemoModeWithProfile: (profile: any) => Promise<void>;
};

type AppStore = CheckinSlice & SessionSlice & UiSlice & DataSlice & DemoSlice & DerivedState & OrchestratorActions;

const todayISO0 = makeTodayISO();
const initialDerived = computeDerived([], [], null, [1, 2, 3, 4, 5, 6], 'unknown', todayISO0, 'medium', 0, ['calisthenics', 'walking', 'stretching'], {
  days: ['calisthenics', 'walking', 'stretching', 'calisthenics', 'walking', 'stretching', null] as (string | null)[],
  sportOrder: ['calisthenics', 'walking', 'stretching'] as string[],
}, ['hips', 'shoulder', 'back'], [], 'beginner', ['rehabilitation'], { pullup_bar: true, dumbbells_max_kg: 4 });

export const useAppStore = create<AppStore>((set, get) => {
  const checkin = createCheckinSlice(set, get as any);
  const session = createSessionSlice(set, get as any);
  const ui = createUiSlice(set, get as any);
  const data = createDataSlice();
  const demo = createDemoSlice();

  return {
    ...checkin,
    ...session,
    ...ui,
    ...data,
    ...demo,

    todayISO: todayISO0,
    pendingAchievement: null,
    backupList: [],
    ...initialDerived,

    _recompute: () => {
      const s = get();
      const derived = computeDerived(
        s.sessions, s.checkins, s.startDate, s.trainDays,
        s.manualOverride, s.todayISO, s.checkinTier, s.virtualTodayOffset,
        s.selectedSports, s.weeklyTemplate, s.rehabIssues, s.rehabExercises,
        s.profileLevel, s.profileGoals, s.profileEquipment
      );
      set(derived);
    },

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

        if (!hasExistingData && !onboardingCompleted) {
          isGuestMode = true;
          const guestSessions = getGuestSessions();
          const guestCheckins = getGuestCheckins();

          if (guestSessions.length > 0 || guestCheckins.length > 0) {
            sessions = guestSessions;
            checkins = guestCheckins;
          } else {
            const demoData = generateDemoData();
            sessions = demoData.sessions;
            checkins = demoData.checkins;
            saveGuestSessions(sessions);
            saveGuestCheckins(checkins);
            saveGuestSettings(demoData.settings);
          }
        }

        const derived = computeDerived(
          sessions, checkins, sd, td, manualStatus, todayISO, ct, vto, ss, weeklyTemplate,
          ri, re, (settings.level as any) || 'intermediate', (settings.goals as any) || [],
          settings.equipment ? JSON.parse(settings.equipment as string) : {}
        );

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

    setCheckinTier: async (v) => {
      const s = get();
      await saveSetting('checkinTier', v);
      const derived = computeDerived(
        s.sessions, s.checkins, s.startDate, s.trainDays, s.manualOverride,
        s.todayISO, v, s.virtualTodayOffset, s.selectedSports, s.weeklyTemplate,
        s.rehabIssues, s.rehabExercises, s.profileLevel, s.profileGoals, s.profileEquipment
      );
      set({ checkinTier: v, ...derived });
    },

    setVirtualTodayOffset: async (v) => {
      const s = get();
      await saveSetting('virtualTodayOffset', v);
      setVirtualTodayOffsetHelper(v);
      const derived = computeDerived(
        s.sessions, s.checkins, s.startDate, s.trainDays, s.manualOverride,
        s.todayISO, s.checkinTier, v, s.selectedSports, s.weeklyTemplate,
        s.rehabIssues, s.rehabExercises, s.profileLevel, s.profileGoals, s.profileEquipment
      );
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

    showToast: (message, type = 'success', duration = 2000) => {
      set({ toast: { message, type, visible: true } });
      setTimeout(() => set({ toast: { message: '', type: 'success', visible: false } }), duration);
    },

    clearPendingAchievement: () => set({ pendingAchievement: null }),

    openSettings: () => {
      const { startDate, trainDays, todayISO } = get();
      set({ editStartDate: startDate || todayISO, editTrainDays: trainDays, showSettings: true });
    },

    closeSettings: () => {
      set({ showSettings: false });
    },

    toggleDay: day => {
      const { editTrainDays } = get();
      set({
        editTrainDays: editTrainDays.includes(day)
          ? editTrainDays.filter(d => d !== day)
          : [...editTrainDays, day].sort((a, b) => a - b),
      });
    },

    handleSaveSettings: async () => {
      const s = get();
      const { editStartDate, editTrainDays, sessions, checkins, manualOverride, todayISO, checkinTier, selectedSports, weeklyTemplate, rehabIssues, rehabExercises, guestMode } = s;
      try {
        if (guestMode) {
          saveGuestSettings({ startDate: editStartDate, trainDays: editTrainDays });
          const derived = computeDerived(
            sessions, checkins, editStartDate, editTrainDays, manualOverride, todayISO,
            checkinTier, 0, selectedSports, weeklyTemplate, rehabIssues, rehabExercises,
            s.profileLevel, s.profileGoals, s.profileEquipment
          );
          set({ startDate: editStartDate, trainDays: editTrainDays, showSettings: false, ...derived, showGuestModal: true });
          s.showToast('Настройки сохранены временно');
          return;
        }
        await saveSettings({ startDate: editStartDate, trainDays: editTrainDays });
        const derived = computeDerived(
          sessions, checkins, editStartDate, editTrainDays, manualOverride, todayISO,
          checkinTier, 0, selectedSports, weeklyTemplate, rehabIssues, rehabExercises,
          s.profileLevel, s.profileGoals, s.profileEquipment
        );
        set({ startDate: editStartDate, trainDays: editTrainDays, showSettings: false, ...derived });
        s.showToast('Настройки сохранены');
      } catch (err) {
        console.error('Failed to save settings:', err);
        s.showToast('Ошибка при сохранении настроек', 'error');
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
          const derived = computeDerived(
            s.sessions, newCheckins, s.startDate, s.trainDays, s.manualOverride,
            s.todayISO, s.checkinTier, s.virtualTodayOffset, s.selectedSports,
            s.weeklyTemplate, s.rehabIssues, s.rehabExercises,
            s.profileLevel, s.profileGoals, s.profileEquipment
          );
          set({ checkins: newCheckins, ...derived, showGuestModal: true });
          s.showToast('Чек-ин сохранён временно');
          return;
        }

        await saveCheckin(checkin);
        cancelDailyReminder();

        const newAchievements = await checkAchievements(
          s.sessions, newCheckins, s.trainDays, s.startDate
        );

        const derived = computeDerived(
          s.sessions, newCheckins, s.startDate, s.trainDays, s.manualOverride,
          s.todayISO, s.checkinTier, s.virtualTodayOffset, s.selectedSports,
          s.weeklyTemplate, s.rehabIssues, s.rehabExercises,
          s.profileLevel, s.profileGoals, s.profileEquipment
        );

        if (newAchievements.length > 0) {
          set({
            checkins: newCheckins, ...derived,
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
      const s = get();
      await saveManualStatus(s.todayISO, status);
      const derived = computeDerived(
        s.sessions, s.checkins, s.startDate, s.trainDays, status, s.todayISO,
        s.checkinTier, 0, s.selectedSports, s.weeklyTemplate,
        s.rehabIssues, s.rehabExercises, s.profileLevel, s.profileGoals, s.profileEquipment
      );
      set({ manualOverride: status, ...derived });
    },

  // TODO: Remove if not used elsewhere
  // handleMarkMorning: async () => {
  //   const s = get();
  //   const key = `${s.todayISO}_morning`;
  //   const existing = s.sessions.find(sess => sess.key === key);
  //   let newSessions: Session[];
  //   if (existing) {
  //     if (!s.guestMode) await deleteSession(key);
  //     newSessions = s.sessions.filter(sess => sess.key !== key);
  //   } else {
  //     const session: Session = { key, date: s.todayISO, type: 'morning', completed: true, readiness: s.autoReadiness, rpe: 0, notes: '', updatedAt: Date.now() };
  //     if (!s.guestMode) await saveSession(session);
  //     newSessions = [...s.sessions.filter(sess => sess.key !== key), session];
  //   }
  //   if (s.guestMode) saveGuestSessions(newSessions);
  //   const derived = computeDerived(
  //     newSessions, s.checkins, s.startDate, s.trainDays, s.manualOverride,
  //     s.todayISO, s.checkinTier, 0, s.selectedSports, s.weeklyTemplate,
  //     s.rehabIssues, s.rehabExercises, s.profileLevel, s.profileGoals, s.profileEquipment
  //   );
  //   set({ sessions: newSessions, ...derived, ...(s.guestMode ? { showGuestModal: true } : {}) });
  // },

  // TODO: Remove if not used elsewhere
  // handleMarkEvening: async () => {
  //   const s = get();
  //   const key = `${s.todayISO}_evening`;
  //   const existing = s.sessions.find(sess => sess.key === key);
  //   let newSessions: Session[];
  //   if (existing) {
  //     if (!s.guestMode) await deleteSession(key);
  //     newSessions = s.sessions.filter(sess => sess.key !== key);
  //   } else {
  //     const session: Session = { key, date: s.todayISO, type: 'evening', completed: true, readiness: s.autoReadiness, rpe: 0, notes: '', updatedAt: Date.now() };
  //     if (!s.guestMode) await saveSession(session);
  //     newSessions = [...s.sessions.filter(sess => sess.key !== key), session];
  //   }
  //   if (s.guestMode) saveGuestSessions(newSessions);
  //   const derived = computeDerived(
  //     newSessions, s.checkins, s.startDate, s.trainDays, s.manualOverride,
  //     s.todayISO, s.checkinTier, 0, s.selectedSports, s.weeklyTemplate,
  //     s.rehabIssues, s.rehabExercises, s.profileLevel, s.profileGoals, s.profileEquipment
  //   );
  //   set({ sessions: newSessions, ...derived, ...(s.guestMode ? { showGuestModal: true } : {}) });
  // },

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

        const plannedSetsMap: Record<string, number> = {};
        if (s.sessionPlan?.exercises) {
          for (const ex of s.sessionPlan.exercises) {
            const match = ex.s ? ex.s.match(/(\d+)/) : null;
            const ns = match ? parseInt(match[1], 10) : 3;
            plannedSetsMap[ex.n] = ns;
          }
        }

        const exerciseMap: Record<string, { plannedSets: number; sets: import('../core/types.js').SetResult[] }> = {};
        for (const sr of s.pendingSetResults) {
          const name = sr.exerciseName || 'unknown';
          if (!exerciseMap[name]) {
            exerciseMap[name] = { plannedSets: plannedSetsMap[name] || 0, sets: [] };
          }
          exerciseMap[name].sets.push(sr);
        }
        const exerciseResults: import('../core/types.js').ExerciseResult[] = Object.entries(exerciseMap).map(([exerciseName, data]) => {
          const completedSets = data.sets.filter(st => st.completed).length;
          return { exerciseName, plannedSets: data.plannedSets, completedSets, sets: data.sets, completed: completedSets > 0 };
        });
          const hasTestResults = s.testPullUps > 0 || s.testPushUps > 0 || s.testPlank > 0;
          const session: Session = {
            key, date: s.todayISO, type: s.sessionPlan?.sport as Session['type'] || s.sessionPlan?.sessionType as Session['type'] || 'unknown',
            completed: true, readiness: s.autoReadiness, rpe: s.rpe, durationMinutes: s.durationMinutes,
            sessionLoad, hipPain: s.hipPain, shoulderPain: s.shoulderPain, notes: s.sessionNote,
            ...(hasTestResults && { testResults: { pullUps: s.testPullUps, pushUps: s.testPushUps, plankSec: s.testPlank } }),
            mode: s.sessionPlan?.mode || 'full', updatedAt: Date.now(),
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
        const derived = computeDerived(
          newSessions, s.checkins, s.startDate, s.trainDays, s.manualOverride,
          s.todayISO, s.checkinTier, s.virtualTodayOffset, s.selectedSports,
          s.weeklyTemplate, s.rehabIssues, s.rehabExercises,
          s.profileLevel, s.profileGoals, s.profileEquipment
        );
        set({
          sessions: newSessions, rpe: 0, sessionNote: '', durationMinutes: 45,
          pendingApreResults: [], pendingSetResults: [],
          postSessionFatigue: undefined as any, postSessionPain: undefined as any,
          ...derived, showGuestModal: true
        });
        return;
      }

      const newAchievements = await checkAchievements(newSessions, s.checkins, s.trainDays, s.startDate);
      const derived = computeDerived(
        newSessions, s.checkins, s.startDate, s.trainDays, s.manualOverride,
        s.todayISO, s.checkinTier, s.virtualTodayOffset, s.selectedSports,
        s.weeklyTemplate, s.rehabIssues, s.rehabExercises,
        s.profileLevel, s.profileGoals, s.profileEquipment
      );

      const baseState = {
        sessions: newSessions, rpe: 0, sessionNote: '', durationMinutes: 45,
        pendingApreResults: [], pendingSetResults: [],
        postSessionFatigue: undefined as any, postSessionPain: undefined as any,
      };

      if (newAchievements.length > 0) {
        set({
          ...baseState, ...derived,
          pendingAchievement: {
            key: newAchievements[0].key, name: newAchievements[0].name,
            tier: newAchievements[0].tier, icon: newAchievements[0].icon,
          }
        });
      } else {
        set({ ...baseState, ...derived });
      }
    },

    handleExportData: async () => {
      const s = get();
      try {
        const data = await exportAllData();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `fitness-export-${s.todayISO}.json`;
        a.click();
        URL.revokeObjectURL(url);
        s.showToast(`Экспортировано: ${s.sessions.length} тренировок, ${s.checkins.length} чек-инов`);
      } catch (err) {
        console.error('Export failed:', err);
        s.showToast('Ошибка при экспорте данных', 'error');
      }
    },

    handleImportData: async (file: File) => {
      const s = get();
      try {
        if (file.size > 5 * 1024 * 1024) throw new Error('Файл слишком большой (макс. 5 МБ)');
        if (!file.name.endsWith('.json') && file.type !== 'application/json') throw new Error('Ожидается файл JSON');

        const text = await file.text();
        if (!text.trim()) throw new Error('Файл пуст');

        let data: any;
        try { data = JSON.parse(text); } catch { throw new Error('Невалидный JSON: проверьте синтаксис файла'); }

        if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('Некорректный формат: ожидался объект с данными');

        if (data.version && typeof data.version === 'number' && data.version > 3) throw new Error(`Неподдерживаемая версия экспорта: ${data.version}. Обновите приложение.`);

        const hasExistingData = (s.sessions && s.sessions.length > 0) || (s.checkins && s.checkins.length > 0);
        if (hasExistingData) {
          try {
            const backup = await exportAllData();
            const backupKey = `fitness-backup-before-import-${Date.now()}`;
            localStorage.setItem(backupKey, JSON.stringify(backup));
            const backupKeys = Object.keys(localStorage).filter(k => k.startsWith('fitness-backup-')).sort();
            while (backupKeys.length > 5) { localStorage.removeItem(backupKeys.shift()!); }
          } catch (backupErr) { console.warn('Failed to create backup before import:', backupErr); }
        }

        await importAllData(data);
        const [allSessions, allCheckins] = await Promise.all([getAllSessions(), getAllCheckins()]);
        const derived = computeDerived(
          allSessions, allCheckins, s.startDate, s.trainDays, s.manualOverride, s.todayISO,
          s.checkinTier, 0, s.selectedSports, s.weeklyTemplate,
          s.rehabIssues, s.rehabExercises, s.profileLevel, s.profileGoals, s.profileEquipment
        );
        set({ sessions: allSessions, checkins: allCheckins, ...derived });
        s.showToast(`Данные импортированы: ${allSessions.length} тренировок, ${allCheckins.length} чек-инов`);
      } catch (err) {
        console.error('Import failed:', err);
        const msg = err instanceof Error ? err.message : 'Не удалось импортировать файл. Проверьте формат JSON.';
        s.showToast(msg, 'error');
        throw err;
      }
    },

    handleImportHealthSyncCSV: async (csvContent: string) => {
      const s = get();
      try {
        const records = parseHealthSyncCSV(csvContent);
        if (records.length === 0) {
          s.showToast('CSV файл пуст или не содержит данных для импорта', 'error');
          return;
        }
        const allCheckins = await getAllCheckins();
        const result = mergeImportedBiometrics(records, allCheckins);
        for (const c of result.checkins) {
          const orig = allCheckins.find(oc => oc.date === c.date);
          if (!orig) { await saveCheckin(c); }
          else {
            const wasModified = c.sleepHours !== orig.sleepHours || c.restHR !== orig.restHR || c.hrv !== orig.hrv;
            if (wasModified) await saveCheckin(c);
          }
        }
        const [refreshedCheckins, refreshedSessions] = await Promise.all([getAllCheckins(), getAllSessions()]);
        const derived = computeDerived(
          refreshedSessions, refreshedCheckins, s.startDate, s.trainDays, s.manualOverride,
          s.todayISO, s.checkinTier, s.virtualTodayOffset, s.selectedSports, s.weeklyTemplate,
          s.rehabIssues, s.rehabExercises, s.profileLevel, s.profileGoals, s.profileEquipment
        );
        set({ checkins: refreshedCheckins, sessions: refreshedSessions, ...derived });
        s.showToast(`Импорт завершён: обновлено ${result.updated}, пропущено ${result.skipped}`);
      } catch (err) {
        console.error('Health Sync CSV import failed:', err);
        s.showToast('Ошибка при импорте CSV', 'error');
      }
    },

    handleResetAll: () => { set({ showResetConfirm: true }); },
    closeResetConfirm: () => { set({ showResetConfirm: false }); },

    confirmResetData: async () => {
      const s = get();
      try {
        await clearAllData();
        await saveSettings({ startDate: s.todayISO, trainDays: [1, 3, 5] });
        const derived = computeDerived(
          [], [], s.todayISO, [1, 3, 5], 'unknown', s.todayISO,
          'medium', 0, s.selectedSports, s.weeklyTemplate, [], [],
          'intermediate', [], {}
        );
        set({ sessions: [], checkins: [], rpe: 0, sessionNote: '', startDate: s.todayISO, trainDays: [1, 3, 5], showResetConfirm: false, pendingAchievement: null, ...derived });
        s.showToast('Все данные удалены');
      } catch (err) {
        console.error('Reset failed:', err);
        s.showToast('Ошибка при сбросе данных', 'error');
      }
    },

    refreshBackupList: async () => {
      try {
        const list = await getBackups();
        set({ backupList: list });
      } catch (err) {
        console.warn('Failed to refresh backup list:', err);
      }
    },

    handleRestoreBackup: async (backupId: number) => {
      const s = get();
      try {
        await restoreFromBackup(backupId);
        const [allSessions, allCheckins] = await Promise.all([getAllSessions(), getAllCheckins()]);
        const derived = computeDerived(
          allSessions, allCheckins, s.startDate, s.trainDays, s.manualOverride, s.todayISO,
          s.checkinTier, 0, s.selectedSports, s.weeklyTemplate,
          s.rehabIssues, s.rehabExercises, s.profileLevel, s.profileGoals, s.profileEquipment
        );
        set({ sessions: allSessions, checkins: allCheckins, ...derived });
        await s.refreshBackupList();
        s.showToast('Данные восстановлены из резервной копии');
      } catch (err) {
        console.error('Restore backup failed:', err);
        s.showToast('Ошибка при восстановлении из резервной копии', 'error');
      }
    },

    activateDemoMode: async () => {
      const s = get();
      const hasExistingData = (s.sessions && s.sessions.length > 0) || (s.checkins && s.checkins.length > 0);
      if (hasExistingData) {
        try {
          const backup = await exportAllData();
          const backupKey = `fitness-backup-before-demo-${Date.now()}`;
          localStorage.setItem(backupKey, JSON.stringify(backup));
          const backupKeys = Object.keys(localStorage).filter(k => k.startsWith('fitness-backup-')).sort();
          while (backupKeys.length > 5) { localStorage.removeItem(backupKeys.shift()!); }
          s.showToast('Резервная копия создана перед активацией демо');
        } catch (backupErr) { console.warn('Failed to create backup before demo:', backupErr); }
      }

      const { generateDemoData: generateDemo } = await import('../core/demoData.js');
      const demoData = generateDemo();
      await activateDemoData(demoData);
      const [allSessions, allCheckins] = await Promise.all([
        getActiveDatabase().sessions.toArray() as any,
        getActiveDatabase().checkins.toArray() as any,
      ]);
      const demoOffset = -15;
      const selectedSports = ['running'];
      const derived = computeDerived(
        allSessions, allCheckins, allSessions.length > 0 ? allSessions[0].date : null,
        [1, 3, 5], 'unknown', allCheckins.length > 0 ? allCheckins[allCheckins.length - 1].date : formatISO(new Date()),
        'medium', demoOffset, selectedSports, {
          days: ['running', 'strength', null, 'running', 'strength', null, 'running'],
          sportOrder: ['running'],
        }, [], [], 'intermediate', [], {}
      );
      setVirtualTodayOffsetHelper(demoOffset);
      set({ ...derived, demoMode: true, dataLoaded: true, trainDays: [1, 3, 5], selectedSports, startDate: allSessions.length > 0 ? allSessions[0].date : formatISO(new Date()), virtualTodayOffset: demoOffset });
    },

    deactivateDemoMode: async () => {
      await deactivateDemoData();
      setVirtualTodayOffsetHelper(0);
      set({ demoMode: false, dataLoaded: true, sessions: [], checkins: [], virtualTodayOffset: 0 });
    },

    setDemoMode: (v: boolean) => { set({ demoMode: v }); },

    activateDemoModeWithProfile: async (profile: any) => {
      const s = get();
      const hasExistingData = (s.sessions && s.sessions.length > 0) || (s.checkins && s.checkins.length > 0);
      if (hasExistingData) {
        try {
          const backup = await exportAllData();
          const backupKey = `fitness-backup-before-demo-${profile}-${Date.now()}`;
          localStorage.setItem(backupKey, JSON.stringify(backup));
          const backupKeys = Object.keys(localStorage).filter(k => k.startsWith('fitness-backup-')).sort();
          while (backupKeys.length > 5) { localStorage.removeItem(backupKeys.shift()!); }
        } catch (backupErr) { console.warn('Failed to create backup before demo:', backupErr); }
      }

      const { generateDemoDataForProfile, DEMO_PROFILES } = await import('../core/demoData.js');
      const profileConfig = (DEMO_PROFILES as any)[profile];
      const demoData = generateDemoDataForProfile(profile);
      await activateDemoData(demoData);

      const [allSessions, allCheckins] = await Promise.all([
        getActiveDatabase().sessions.toArray() as any,
        getActiveDatabase().checkins.toArray() as any,
      ]);

      const demoOffset = -15;
      const selectedSports = profileConfig.settings.selectedSports || ['running'];
      const profileLevel = (profileConfig.settings.level || 'intermediate') as any;
      const profileEquipment = profileConfig.settings.equipment ? JSON.parse(profileConfig.settings.equipment) : {};
      const checkinTier = profileConfig.settings.checkinTier || 'medium';

      const derived = computeDerived(
        allSessions, allCheckins, allSessions.length > 0 ? allSessions[0].date : null,
        profileConfig.settings.trainDays || [1, 3, 5], 'unknown',
        allCheckins.length > 0 ? allCheckins[allCheckins.length - 1].date : formatISO(new Date()),
        checkinTier, demoOffset, selectedSports, profileConfig.weeklyTemplate,
        [], [], profileLevel, profileConfig.settings.goals as any || [], profileEquipment
      );

      setVirtualTodayOffsetHelper(demoOffset);
      set({
        ...derived, demoMode: true, dataLoaded: true,
        trainDays: profileConfig.settings.trainDays || [1, 3, 5], selectedSports,
        startDate: allSessions.length > 0 ? allSessions[0].date : formatISO(new Date()),
        virtualTodayOffset: demoOffset, profileLevel, profileGoals: profileConfig.settings.goals as any || [],
        profileEquipment, checkinTier,
      });

      s.showToast(`Демо: ${profileConfig.name} — ${allSessions.length} тренировок, ${allCheckins.length} чек-инов`);
    },

    completeOnboarding: async data => {
      const s = get();
      try {
        const tier = data.checkinTier || 'medium';
        await saveSettings({
          startDate: s.todayISO, trainDays: data.trainDays, checkinTier: tier,
          selectedGadgets: data.selectedGadgets || [], selectedSports: data.selectedSports || [],
        });

        if (data.selectedGoal) localStorage.setItem('fitness-tracker-goal', data.selectedGoal);
        if (data.apreProtocol) localStorage.setItem('fitness-tracker-apre-protocol', data.apreProtocol);

        const allCheckins = await getAllCheckins();
        const derived = computeDerived(
          s.sessions, allCheckins, s.todayISO, data.trainDays, 'unknown', s.todayISO,
          tier, 0, data.selectedSports || [], s.weeklyTemplate,
          s.rehabIssues, s.rehabExercises, 'intermediate', [], {}
        );

        set({
          trainDays: data.trainDays, startDate: s.todayISO, editTrainDays: data.trainDays,
          editStartDate: s.todayISO, checkinTier: tier, selectedGadgets: data.selectedGadgets || [],
          selectedSports: data.selectedSports || [], checkins: allCheckins, ...derived,
        });

        markOnboardingCompleted();
        s.showToast('Настройка завершена!');
      } catch (err) {
        console.error('Onboarding completion failed:', err);
        s.showToast('Ошибка при сохранении настроек', 'error');
      }
    },

    setShowGuestModal: (v: boolean) => set({ showGuestModal: v }),
    setGuestMode: (v: boolean) => set({ guestMode: v }),

    startTracking: () => {
      clearGuestData();
      set({ guestMode: false, sessions: [], checkins: [], showGuestModal: false, startDate: null, trainDays: [1, 3, 5], editStartDate: '', editTrainDays: [1, 3, 5], selectedSports: [], selectedGadgets: [] });
    },

    completeGuestModeOnboarding: async data => {
      const s = get();
      try {
        const tier = data.checkinTier || 'medium';
        const guestSessions = getGuestSessions();
        const guestCheckins = getGuestCheckins();

        for (const session of guestSessions) await saveSession(session);
        for (const checkin of guestCheckins) await saveCheckin(checkin);

        await saveSettings({
          startDate: makeTodayISO(), trainDays: data.trainDays, checkinTier: tier,
          selectedGadgets: data.selectedGadgets || [], selectedSports: data.selectedSports || [],
        });

        if (data.selectedGoal) localStorage.setItem('fitness-tracker-goal', data.selectedGoal);
        if (data.apreProtocol) localStorage.setItem('fitness-tracker-apre-protocol', data.apreProtocol);

        const [allSessions, allCheckins] = await Promise.all([getAllSessions(), getAllCheckins()]);
        const derived = computeDerived(
          allSessions, allCheckins, makeTodayISO(), data.trainDays, 'unknown', makeTodayISO(),
          tier, 0, data.selectedSports || [], s.weeklyTemplate,
          s.rehabIssues, s.rehabExercises, 'intermediate', [], {}
        );

        clearGuestData();
        set({
          sessions: allSessions, checkins: allCheckins, trainDays: data.trainDays,
          startDate: makeTodayISO(), editTrainDays: data.trainDays, editStartDate: makeTodayISO(),
          checkinTier: tier, selectedGadgets: data.selectedGadgets || [],
          selectedSports: data.selectedSports || [], guestMode: false, showGuestModal: false, ...derived,
        });

        markOnboardingCompleted();
        s.showToast('Настройка завершена! Данные сохранены.');
      } catch (err) {
        console.error('Guest mode onboarding completion failed:', err);
        s.showToast('Ошибка при сохранении настроек', 'error');
      }
    },
  };
});
