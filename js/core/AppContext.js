// js/core/AppContext.js
// React Context для глобального состояния приложения

import React, { useState, useEffect, useMemo, useCallback, createContext } from 'react';
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
} from './storage.js';
import {
  calcReadiness,
  getEffectiveReadiness,
  detectRecoveryDebt,
} from './readiness.js';
import { calculateRecoveryScore } from './recoveryScore.js';
import { calculateSessionLoad } from './sessionLoad.js';
import { getWeeklySummary, getMonthStats } from './stats.js';
import {
  getWorkoutType,
  getMonthAndDayIndex,
  buildSessionFromMonth,
  getLastSessionByType,
  maybeAddTestExercises,
} from './planning.js';
import { getWeeklyMultiplier, getTestMultiplier } from './loadAdjustments.js';
import { getCoachAdvice, getApreExplanation } from './advice.js';
import {
  getTrendData,
  getRpeTrend,
  detectNegativeTrends,
  getWeeklyAverages,
  getOvertrainingWarning,
} from './analytics.js';
import { parseLocalDate, formatISO } from './helpers.js';
import { MONTHS, DAYS } from '../config/constants.js';

export const AppStateContext = createContext(null);
export const AppDispatchContext = createContext(null);

export function AppProvider({ children }) {
  // ── Core data ──
  const [sessions, setSessions] = useState([]);
  const [checkins, setCheckins] = useState([]);
  const [dataLoaded, setDataLoaded] = useState(false);

  // ── Settings ──
  const [startDate, setStartDate] = useState(null);
  const [trainDays, setTrainDays] = useState([1, 3, 5]);

  // ── Check-in form fields ──
  const [weight, setWeight] = useState(0);
  const [restHR, setRestHR] = useState(0);
  const [hrv, setHrv] = useState(0);
  const [sleepHours, setSleepHours] = useState(0);
  const [hipPain, setHipPain] = useState(0);
  const [shoulderPain, setShoulderPain] = useState(0);
  const [breathing, setBreathing] = useState('good');
  const [notes, setNotes] = useState('');

  // ── Subjective metrics ──
  const [muscleSoreness, setMuscleSoreness] = useState(0);
  const [energy, setEnergy] = useState(0);
  const [mood, setMood] = useState(0);
  const [sleepQuality, setSleepQuality] = useState(0);
  const [stress, setStress] = useState(0);

  // ── Session form ──
  const [rpe, setRpe] = useState(0);
  const [sessionNote, setSessionNote] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(45);
  const [testPullUps, setTestPullUps] = useState(0);
  const [testPushUps, setTestPushUps] = useState(0);
  const [testPlank, setTestPlank] = useState(0);

  // ── UI state ──
  const [activeTab, setActiveTab] = useState(0);
  const [showReadiness, setShowReadiness] = useState(false);
  const [manualOverride, setManualOverride] = useState('unknown');

  // ── Settings modal ──
  const [showSettings, setShowSettings] = useState(false);
  const [editStartDate, setEditStartDate] = useState('');
  const [editTrainDays, setEditTrainDays] = useState([1, 3, 5]);

  // ── Toast notification ──
  const [toast, setToast] = useState({ message: '', type: 'success', visible: false });

  // ── Today's dates ──
  const todayISO = useMemo(() => formatISO(new Date()), []);
  const todayDate = useMemo(() => parseLocalDate(todayISO), [todayISO]);
  const tomorrowDate = useMemo(() => {
    const d = parseLocalDate(todayISO);
    d.setDate(d.getDate() + 1);
    return d;
  }, [todayISO]);

  // ════════════════════════════════════════════════════════════
  // INIT — load all data from storage
  // ════════════════════════════════════════════════════════════
  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      try {
        await init();

        const [allSessions, allCheckins, settings] = await Promise.all([
          getAllSessions(),
          getAllCheckins(),
          getSettings(),
        ]);

        if (cancelled) return;

        setSessions(allSessions);
        setCheckins(allCheckins);

        // Settings
        const sd = settings.startDate || todayISO;
        const td = settings.trainDays || [1, 3, 5];
        setStartDate(sd);
        setTrainDays(td);

        // Persist settings if first time
        if (!settings.startDate || !settings.trainDays) {
          await saveSettings({ startDate: sd, trainDays: td });
        }

        // Today's checkin
        const tc = await getCheckin(todayISO);
        if (tc) {
          setWeight(tc.weight ?? 0);
          setRestHR(tc.restHR ?? 0);
          setHrv(tc.hrv ?? 0);
          setSleepHours(tc.sleepHours ?? 0);
          setHipPain(tc.hipPain ?? 0);
          setShoulderPain(tc.shoulderPain ?? 0);
          setBreathing(tc.breathing ?? 'good');
          setNotes(tc.notes ?? '');
          // Subjective metrics
          setMuscleSoreness(tc.muscleSoreness ?? 0);
          setEnergy(tc.energy ?? 0);
          setMood(tc.mood ?? 0);
          setSleepQuality(tc.sleepQuality ?? 0);
          setStress(tc.stress ?? 0);
        }

        // Manual override for today
        const ms = await getManualStatus(todayISO);
        if (ms) setManualOverride(ms);

        // Latest test results
        const lt = await getLatestTestResults();
        if (lt) {
          setTestPullUps(lt.pullUps ?? 0);
          setTestPushUps(lt.pushUps ?? 0);
          setTestPlank(lt.plankSec ?? 0);
        }
      } catch (err) {
        console.error('Failed to load data:', err);
      } finally {
        if (!cancelled) setDataLoaded(true);
      }
    }

    loadData();
    return () => { cancelled = true; };
  }, [todayISO]);

  // ════════════════════════════════════════════════════════════
  // DERIVED: Readiness & Recovery
  // ════════════════════════════════════════════════════════════

  const lastCheckin = useMemo(() => {
    if (!checkins.length) return null;
    return [...checkins].sort((a, b) => (b.date || '').localeCompare(a.date || ''))[0];
  }, [checkins]);

  const autoReadiness = useMemo(
    () => lastCheckin ? calcReadiness(lastCheckin) : 'green',
    [lastCheckin]
  );

  const readiness = useMemo(
    () => getEffectiveReadiness(autoReadiness, manualOverride),
    [autoReadiness, manualOverride]
  );

  const recoveryDebt = useMemo(() => {
    const recent = [...checkins]
      .sort((a, b) => (b.date || '').localeCompare(a.date || ''))
      .slice(0, 3);
    return detectRecoveryDebt(recent);
  }, [checkins]);

  const recoveryScore = useMemo(
    () => lastCheckin ? calculateRecoveryScore(lastCheckin, checkins) : 0,
    [lastCheckin, checkins]
  );

  // ════════════════════════════════════════════════════════════
  // DERIVED: Training plan
  // ════════════════════════════════════════════════════════════

  const weekNumber = useMemo(() => {
    if (!startDate) return 1;
    const start = parseLocalDate(startDate);
    if (!start) return 1;
    const diffMs = todayDate - start;
    const dayIndex = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
    return Math.floor(dayIndex / 7) + 1;
  }, [startDate, todayDate]);

  const trainType = useMemo(
    () => getWorkoutType(todayDate, trainDays),
    [todayDate, trainDays]
  );
  const tomorrowType = useMemo(
    () => getWorkoutType(tomorrowDate, trainDays),
    [tomorrowDate, trainDays]
  );

  const { month, dayIndex } = useMemo(
    () => getMonthAndDayIndex(weekNumber, trainType),
    [weekNumber, trainType]
  );

  const weeklySummary = useMemo(
    () => getWeeklySummary(sessions, checkins, todayISO),
    [sessions, checkins, todayISO]
  );

  const weeklyMultiplier = useMemo(
    () => getWeeklyMultiplier(weeklySummary, todayDate.getDay()),
    [weeklySummary, todayDate]
  );
  const testMult = useMemo(
    () => getTestMultiplier(sessions, weekNumber),
    [sessions, weekNumber]
  );
  const totalMultiplier = weeklyMultiplier * testMult;

  const apreSession = useMemo(
    () => getLastSessionByType(sessions, trainType),
    [sessions, trainType]
  );

  const sessionPlan = useMemo(() => {
    if (!trainType || !month) return null;
    const plan = buildSessionFromMonth(
      month, dayIndex, readiness, recoveryDebt, totalMultiplier, apreSession
    );
    return maybeAddTestExercises(plan, trainType, weekNumber, readiness);
  }, [month, dayIndex, readiness, recoveryDebt, totalMultiplier, apreSession, trainType, weekNumber]);

  // Tomorrow's plan
  const tomorrowPlan = useMemo(() => {
    if (!tomorrowType) return null;
    const tw = Math.max(1, (() => {
      if (!startDate) return 1;
      const start = parseLocalDate(startDate);
      if (!start) return 1;
      const diffMs = tomorrowDate - start;
      const dayIdx = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
      return Math.floor(dayIdx / 7) + 1;
    })());
    const tm = getMonthAndDayIndex(tw, tomorrowType);
    if (!tm.month) return null;
    return buildSessionFromMonth(tm.month, tm.dayIndex, readiness, recoveryDebt, 1.0, null);
  }, [tomorrowType, tomorrowDate, startDate, readiness, recoveryDebt]);

  // ════════════════════════════════════════════════════════════
  // DERIVED: Stats
  // ════════════════════════════════════════════════════════════

  const testHistory = useMemo(
    () => sessions.filter(s => s.testResults).map(s => ({ date: s.date, testResults: s.testResults })),
    [sessions]
  );

  const monthStats = useMemo(
    () => getMonthStats(sessions, todayISO.slice(0, 7)),
    [sessions, todayISO]
  );

  const morningDone = useMemo(
    () => sessions.some(s => s.date === todayISO && s.type === 'morning' && s.completed),
    [sessions, todayISO]
  );
  const eveningDone = useMemo(
    () => sessions.some(s => s.date === todayISO && s.type === 'evening' && s.completed),
    [sessions, todayISO]
  );

  const trainingDone = useMemo(
    () => trainType ? sessions.some(s => s.date === todayISO && s.type === trainType && s.completed) : false,
    [sessions, todayISO, trainType]
  );

  const coachAdvice = useMemo(
    () => getCoachAdvice(recoveryScore, lastCheckin || {}, testHistory, weeklySummary),
    [recoveryScore, lastCheckin, testHistory, weeklySummary]
  );

  const apreReasons = useMemo(
    () => getApreExplanation(
      sessionPlan?.mode || 'full',
      readiness,
      recoveryDebt,
      totalMultiplier,
      apreSession
    ),
    [sessionPlan, readiness, recoveryDebt, totalMultiplier, apreSession]
  );

  // ════════════════════════════════════════════════════════════
  // DERIVED: Analytics & Trends
  // ════════════════════════════════════════════════════════════

  const trendData7 = useMemo(
    () => getTrendData(checkins, checkins, 7),
    [checkins]
  );
  const trendData30 = useMemo(
    () => getTrendData(checkins, checkins, 30),
    [checkins]
  );
  const rpeTrend7 = useMemo(
    () => getRpeTrend(sessions, 7),
    [sessions]
  );
  const rpeTrend30 = useMemo(
    () => getRpeTrend(sessions, 30),
    [sessions]
  );
  const weeklyAverages = useMemo(
    () => getWeeklyAverages(trendData30),
    [trendData30]
  );
  const trendWarnings = useMemo(
    () => detectNegativeTrends(trendData30),
    [trendData30]
  );
  const overtrainingWarning = useMemo(
    () => getOvertrainingWarning(trendData30, weeklyAverages, weeklySummary),
    [trendData30, weeklyAverages, weeklySummary]
  );

  // ════════════════════════════════════════════════════════════
  // HANDLERS
  // ════════════════════════════════════════════════════════════

  const showToast = useCallback((message, type = 'success', duration = 2000) => {
    setToast({ message, type, visible: true });
    setTimeout(() => setToast(prev => ({ ...prev, visible: false })), duration);
  }, []);

  const openSettings = useCallback(() => {
    setEditStartDate(startDate || todayISO);
    setEditTrainDays(trainDays);
    setShowSettings(true);
  }, [startDate, trainDays, todayISO]);

  const toggleDay = useCallback(day => {
    setEditTrainDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day].sort((a, b) => a - b)
    );
  }, []);

  const handleSaveSettings = useCallback(async () => {
    try {
      setStartDate(editStartDate);
      setTrainDays(editTrainDays);
      await saveSettings({ startDate: editStartDate, trainDays: editTrainDays });
      setShowSettings(false);
      showToast('Настройки сохранены');
    } catch (err) {
      console.error('Failed to save settings:', err);
      showToast('Ошибка при сохранении настроек', 'error');
    }
  }, [editStartDate, editTrainDays, showToast]);

  const upsertSession = useCallback(async session => {
    await saveSession(session);
    setSessions(prev => [...prev.filter(s => s.key !== session.key), session]);
  }, []);

  const handleSaveCheckin = useCallback(async () => {
    const checkin = {
      date: todayISO,
      sleepHours, restHR, hrv, hipPain, shoulderPain, breathing, weight, notes,
      muscleSoreness, energy, mood, sleepQuality, stress,
      readiness: autoReadiness,
      ts: Date.now(),
    };
    try {
      await saveCheckin(checkin);
      setCheckins(prev => [...prev.filter(c => c.date !== todayISO), checkin]);
      showToast('Чек-ин сохранён');
    } catch (err) {
      console.error('Failed to save checkin:', err);
      showToast('Ошибка при сохранении чек-ина', 'error');
    }
  }, [todayISO, sleepHours, restHR, hrv, hipPain, shoulderPain, breathing, weight, notes,
    muscleSoreness, energy, mood, sleepQuality, stress, autoReadiness, showToast]);

  const handleManualOverrideChange = useCallback(async status => {
    setManualOverride(status);
    await saveManualStatus(todayISO, status);
  }, [todayISO]);

  const handleMarkMorning = useCallback(async () => {
    const key = `${todayISO}_morning`;
    const existing = sessions.find(s => s.key === key);
    if (existing) {
      await deleteSession(key);
      setSessions(prev => prev.filter(s => s.key !== key));
    } else {
      const session = {
        key,
        date: todayISO,
        type: 'morning',
        completed: true,
        readiness: autoReadiness,
        rpe: 0,
        notes: '',
        updatedAt: Date.now(),
      };
      await saveSession(session);
      setSessions(prev => [...prev.filter(s => s.key !== key), session]);
    }
  }, [todayISO, sessions, autoReadiness]);

  const handleMarkEvening = useCallback(async () => {
    const key = `${todayISO}_evening`;
    const existing = sessions.find(s => s.key === key);
    if (existing) {
      await deleteSession(key);
      setSessions(prev => prev.filter(s => s.key !== key));
    } else {
      const session = {
        key,
        date: todayISO,
        type: 'evening',
        completed: true,
        readiness: autoReadiness,
        rpe: 0,
        notes: '',
        updatedAt: Date.now(),
      };
      await saveSession(session);
      setSessions(prev => [...prev.filter(s => s.key !== key), session]);
    }
  }, [todayISO, sessions, autoReadiness]);

  const handleToggleTraining = useCallback(async () => {
    const key = `${todayISO}_${trainType}`;
    const existing = sessions.find(s => s.key === key);
    if (existing && existing.completed) {
      await deleteSession(key);
      setSessions(prev => prev.filter(s => s.key !== key));
      showToast('Тренировка отменена');
    } else {
      const sessionLoad = calculateSessionLoad(rpe, durationMinutes);
      const session = {
        key,
        date: todayISO,
        type: trainType,
        completed: true,
        readiness: autoReadiness,
        rpe,
        durationMinutes,
        sessionLoad,
        hipPain,
        shoulderPain,
        notes: sessionNote,
        testResults: { pullUps: testPullUps, pushUps: testPushUps, plankSec: testPlank },
        mode: sessionPlan?.mode || 'full',
        updatedAt: Date.now(),
      };
      await saveSession(session);
      setSessions(prev => [...prev.filter(s => s.key !== key), session]);
      setRpe(0);
      setSessionNote('');
      setDurationMinutes(45);
      showToast('Тренировка сохранена');
    }
  }, [todayISO, trainType, sessions, autoReadiness, rpe, durationMinutes, hipPain, shoulderPain,
    sessionNote, testPullUps, testPushUps, testPlank, sessionPlan, showToast]);

  const handleExportData = useCallback(async () => {
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
  }, [todayISO]);

  const handleImportData = useCallback(async file => {
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      await importAllData(data);
      const [allSessions, allCheckins] = await Promise.all([
        getAllSessions(),
        getAllCheckins(),
      ]);
      setSessions(allSessions);
      setCheckins(allCheckins);
      showToast('Данные импортированы');
    } catch (err) {
      console.error('Import failed:', err);
      showToast(err?.message || 'Не удалось импортировать файл. Проверьте формат JSON.', 'error');
    }
  }, [showToast]);

  const handleResetAll = useCallback(async () => {
    if (!window.confirm('Удалить все данные? Это действие нельзя отменить.')) return;
    try {
      await clearAllData();
      setSessions([]);
      setCheckins([]);
      setRpe(0);
      setSessionNote('');
      setStartDate(todayISO);
      setTrainDays([1, 3, 5]);
      await saveSettings({ startDate: todayISO, trainDays: [1, 3, 5] });
    } catch (err) {
      console.error('Reset failed:', err);
    }
  }, [todayISO]);

  // ════════════════════════════════════════════════════════════
  // CONTEXT VALUES
  // ════════════════════════════════════════════════════════════

  const weekLabel = `Неделя ${weekNumber}`;

  const state = useMemo(() => ({
    // Core data
    sessions, checkins, dataLoaded,
    // Settings
    startDate, trainDays,
    // Checkin form
    weight, restHR, hrv, sleepHours, hipPain, shoulderPain, breathing, notes,
    muscleSoreness, energy, mood, sleepQuality, stress,
    // Session form
    rpe, sessionNote, durationMinutes, testPullUps, testPushUps, testPlank,
    // UI
    activeTab, showReadiness, manualOverride,
    showSettings, editStartDate, editTrainDays, toast,
    // Dates
    todayISO, todayDate, tomorrowDate,
    // Derived: readiness
    lastCheckin, autoReadiness, readiness, recoveryDebt, recoveryScore,
    // Derived: plan
    weekNumber, weekLabel, trainType, tomorrowType,
    month, dayIndex, weeklySummary, sessionPlan, tomorrowPlan,
    totalMultiplier, apreSession, apreReasons,
    // Derived: stats
    testHistory, monthStats, morningDone, eveningDone, trainingDone, coachAdvice,
    // Derived: analytics
    trendData7, trendData30, rpeTrend7, rpeTrend30,
    weeklyAverages, trendWarnings, overtrainingWarning,
  }), [
    sessions, checkins, dataLoaded, startDate, trainDays,
    weight, restHR, hrv, sleepHours, hipPain, shoulderPain, breathing, notes,
    muscleSoreness, energy, mood, sleepQuality, stress,
    rpe, sessionNote, durationMinutes, testPullUps, testPushUps, testPlank,
    activeTab, showReadiness, manualOverride,
    showSettings, editStartDate, editTrainDays, toast,
    todayISO, todayDate, tomorrowDate,
    lastCheckin, autoReadiness, readiness, recoveryDebt, recoveryScore,
    weekNumber, weekLabel, trainType, tomorrowType,
    month, dayIndex, weeklySummary, sessionPlan, tomorrowPlan,
    totalMultiplier, apreSession, apreReasons,
    testHistory, monthStats, morningDone, eveningDone, trainingDone, coachAdvice,
    trendData7, trendData30, rpeTrend7, rpeTrend30,
    weeklyAverages, trendWarnings, overtrainingWarning,
  ]);

  const dispatch = useMemo(() => ({
    // Checkin setters
    setWeight, setRestHR, setHrv, setSleepHours,
    setHipPain, setShoulderPain, setBreathing, setNotes,
    setMuscleSoreness, setEnergy, setMood, setSleepQuality, setStress,
    // Session setters
    setRpe, setSessionNote, setDurationMinutes, setTestPullUps, setTestPushUps, setTestPlank,
    // UI setters
    setActiveTab, setShowReadiness, setShowSettings,
    setEditStartDate, setEditTrainDays,
    // Actions
    showToast, openSettings, toggleDay,
    handleSaveSettings, handleSaveCheckin,
    handleManualOverrideChange, handleMarkMorning, handleMarkEvening,
    handleToggleTraining, handleExportData, handleImportData, handleResetAll,
  }), [
    showToast, openSettings, toggleDay,
    handleSaveSettings, handleSaveCheckin,
    handleManualOverrideChange, handleMarkMorning, handleMarkEvening,
    handleToggleTraining, handleExportData, handleImportData, handleResetAll,
  ]);

  return React.createElement(
    AppStateContext.Provider,
    { value: state },
    React.createElement(
      AppDispatchContext.Provider,
      { value: dispatch },
      children
    )
  );
}
