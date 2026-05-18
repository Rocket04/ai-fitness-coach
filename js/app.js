// js/app.js
import React, { useState, useEffect, useMemo, useCallback, lazy, Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import {
  init,
  db,
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
} from './core/storage.js';
import {
  calcReadiness,
  getEffectiveReadiness,
  detectRecoveryDebt,
  calculateRecoveryScore,
  getWeeklySummary,
  getMonthStats,
  getWorkoutType,
  getMonthAndDayIndex,
  getWeeklyMultiplier,
  getTestMultiplier,
  buildSessionFromMonth,
  getLastSessionByType,
  maybeAddTestExercises,
  getCoachAdvice,
  getApreExplanation,
} from './core/engine.js';
import {
  getTrendData,
  getRpeTrend,
  detectNegativeTrends,
  getWeeklyAverages,
  getOvertrainingWarning,
} from './core/analytics.js';
import { parseLocalDate, formatISO } from './core/helpers.js';
import { MONTHS, ZONES, HRV_GUIDE, NUTRITION, MORNING_ROUTINE, EVENING_ROUTINE, DAYS } from './config/constants.js';
import Modal from './ui/components/Modal.js';

const TodayPage = lazy(() => import('./ui/pages/TodayPage.js'));
const RehabPage = lazy(() => import('./ui/pages/RehabPage.js'));
const LogPage = lazy(() => import('./ui/pages/LogPage.js'));
const InfoPage = lazy(() => import('./ui/pages/InfoPage.js'));
const NutritionPage = lazy(() => import('./ui/pages/NutritionPage.js'));
const AnalyticsPage = lazy(() => import('./ui/pages/AnalyticsPage.js'));

function App() {
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
  const [testPullUps, setTestPullUps] = useState(0);
  const [testPushUps, setTestPushUps] = useState(0);
  const [testPlank, setTestPlank] = useState(0);

  // ── UI state ──
  const [activeTab, setActiveTab] = useState(0);
  const [showReadiness, setShowReadiness] = useState(false);
  const [manualStatus, setManualStatus] = useState('unknown');

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

        // Manual status for today
        const ms = await getManualStatus(todayISO);
        if (ms) setManualStatus(ms);

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
    () => getEffectiveReadiness(autoReadiness, manualStatus),
    [autoReadiness, manualStatus]
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
      const dayIndex = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
      return Math.floor(dayIndex / 7) + 1;
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

  const handleSaveSettings = async () => {
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
  };

  const upsertSession = useCallback(async session => {
    await saveSession(session);
    setSessions(prev => [...prev.filter(s => s.key !== session.key), session]);
  }, []);

  const handleSaveCheckin = async () => {
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
  };

  const handleManualStatusChange = async status => {
    setManualStatus(status);
    await saveManualStatus(todayISO, status);
  };

  const handleMarkMorning = async () => {
    const key = `${todayISO}_morning`;
    const existing = sessions.find(s => s.key === key);
    if (existing) {
      await deleteSession(key);
      setSessions(prev => prev.filter(s => s.key !== key));
    } else {
      await upsertSession({
        key,
        date: todayISO,
        type: 'morning',
        completed: true,
        readiness: autoReadiness,
        rpe: 0,
        notes: '',
        updatedAt: Date.now(),
      });
    }
  };

  const handleMarkEvening = async () => {
    const key = `${todayISO}_evening`;
    const existing = sessions.find(s => s.key === key);
    if (existing) {
      await deleteSession(key);
      setSessions(prev => prev.filter(s => s.key !== key));
    } else {
      await upsertSession({
        key,
        date: todayISO,
        type: 'evening',
        completed: true,
        readiness: autoReadiness,
        rpe: 0,
        notes: '',
        updatedAt: Date.now(),
      });
    }
  };

  const handleToggleTraining = async () => {
    const key = `${todayISO}_${trainType}`;
    const existing = sessions.find(s => s.key === key);
    if (existing && existing.completed) {
      await deleteSession(key);
      setSessions(prev => prev.filter(s => s.key !== key));
      showToast('Тренировка отменена');
    } else {
      const session = {
        key,
        date: todayISO,
        type: trainType,
        completed: true,
        readiness: autoReadiness,
        rpe,
        hipPain,
        shoulderPain,
        notes: sessionNote,
        testResults: { pullUps: testPullUps, pushUps: testPushUps, plankSec: testPlank },
        mode: sessionPlan?.mode || 'full',
        updatedAt: Date.now(),
      };
      await upsertSession(session);
      setRpe(0);
      setSessionNote('');
      showToast('Тренировка сохранена');
    }
  };

  const handleExportData = async () => {
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
  };

  const handleImportData = async file => {
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
    } catch (err) {
      console.error('Import failed:', err);
      alert('Не удалось импортировать файл. Проверьте формат JSON.');
    }
  };

  const handleResetAll = async () => {
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
  };

  // ════════════════════════════════════════════════════════════
  // RENDER
  // ════════════════════════════════════════════════════════════

  if (!dataLoaded) {
    return React.createElement('div', { className: 'card' }, 'Загрузка...');
  }

  const weekLabel = `Неделя ${weekNumber}`;

  return React.createElement(
    React.Fragment,
    null,
    // Tab bar
    React.createElement(
      'div',
      { className: 'tabbar' },
      React.createElement('button', {
        className: activeTab === 0 ? 'tab active' : 'tab',
        onClick: () => setActiveTab(0),
      }, '\uD83C\uDFC3\uFE0F Сегодня'),
      React.createElement('button', {
        className: activeTab === 1 ? 'tab active' : 'tab',
        onClick: () => setActiveTab(1),
      }, '\uD83E\uDDD8\u200D\u2642\uFE0F Реабил'),
      React.createElement('button', {
        className: activeTab === 2 ? 'tab active' : 'tab',
        onClick: () => setActiveTab(2),
      }, '\uD83D\uDCDD Дневник'),
      React.createElement('button', {
        className: activeTab === 3 ? 'tab active' : 'tab',
        onClick: () => setActiveTab(3),
      }, '\uD83D\uDCD6 Справка'),
      React.createElement('button', {
        className: activeTab === 4 ? 'tab active' : 'tab',
        onClick: () => setActiveTab(4),
      }, '\uD83C\uDF7D\uFE0F Питание'),
      React.createElement('button', {
        className: activeTab === 5 ? 'tab active' : 'tab',
        onClick: () => setActiveTab(5),
      }, '\uD83D\uDCCA Аналитика'),
      React.createElement('button', {
        className: 'tab tab-settings',
        onClick: openSettings,
        title: 'Настройки',
      }, '\u2699\uFE0F')
    ),
    // Pages
    React.createElement(
      Suspense,
      { fallback: React.createElement('div', { className: 'card' }, 'Загрузка...') },
      activeTab === 0 &&
        React.createElement(TodayPage, {
          sessionPlan,
          trainType,
          readiness,
          autoReadiness,
          manualStatus,
          onManualStatusChange: handleManualStatusChange,
          recoveryScore,
          coachAdvice,
          rpe,
          setRpe,
          sessionNote,
          setSessionNote,
          testPullUps,
          setTestPullUps,
          testPushUps,
          setTestPushUps,
          testPlank,
          setTestPlank,
          onToggleTraining: handleToggleTraining,
          trainingDone,
          weekLabel,
          tomorrowPlan,
          tomorrowType,
          morningDone,
          eveningDone,
          onMarkMorning: handleMarkMorning,
          onMarkEvening: handleMarkEvening,
          apreReasons,
        }),
      activeTab === 1 &&
        React.createElement(RehabPage, {
          morningDone,
          eveningDone,
          markMorning: handleMarkMorning,
          markEvening: handleMarkEvening,
          MORNING_ROUTINE,
          EVENING_ROUTINE,
        }),
      activeTab === 2 &&
        React.createElement(LogPage, {
          weight, setWeight,
          restHR, setRestHR,
          hrv, setHrv,
          sleepHours, setSleepHours,
          hipPain, setHipPain,
          shoulderPain, setShoulderPain,
          breathing, setBreathing,
          notes, setNotes,
          // Subjective metrics
          muscleSoreness, setMuscleSoreness,
          energy, setEnergy,
          mood, setMood,
          sleepQuality, setSleepQuality,
          stress, setStress,
          monthStats,
          weeklySummary,
          testHistory,
          sessions,
          onSaveCheckin: handleSaveCheckin,
          onExportData: handleExportData,
          onImportData: handleImportData,
          onResetAll: handleResetAll,
        }),
      activeTab === 3 &&
        React.createElement(InfoPage, {
          showReadiness,
          setShowReadiness,
          ZONES,
          HRV_GUIDE,
          checkin: lastCheckin,
          recoveryScore,
          readiness,
          autoReadiness,
          trainType,
          sessionPlan,
          weekNumber,
        }),
      activeTab === 4 &&
        React.createElement(NutritionPage, {
          NUTRITION,
          checkin: lastCheckin,
          recoveryScore,
          readiness,
          trainType,
          sessionPlan,
        }),
      activeTab === 5 &&
        React.createElement(AnalyticsPage, {
          trendData7,
          trendData30,
          rpeTrend7,
          rpeTrend30,
          weeklyAverages,
          trendWarnings,
          overtrainingWarning,
          weeklySummary,
          monthStats,
        })
    ),
    // ── Settings modal ──
    showSettings && React.createElement(Modal, {
      isOpen: true,
      onClose: () => setShowSettings(false),
      title: 'Настройки',
    },
      React.createElement('div', { style: { display: 'flex', flexDirection: 'column', gap: '1rem' } },
        React.createElement('label', { style: { display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.9rem', fontWeight: 500 } },
          React.createElement('span', null, 'Дата старта'),
          React.createElement('input', {
            type: 'date',
            value: editStartDate,
            onChange: e => setEditStartDate(e.target.value),
          })
        ),
        React.createElement('div', null,
          React.createElement('span', { style: { display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 500 } }, 'Дни тренировок'),
          React.createElement('div', { style: { display: 'flex', gap: '0.375rem', flexWrap: 'wrap' } },
            DAYS.map((day, i) =>
              React.createElement('button', {
                key: i,
                className: `chip ${editTrainDays.includes(i) ? 'active' : ''}`,
                onClick: () => toggleDay(i),
              }, day)
            )
          )
        ),
        React.createElement('div', { style: { display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '0.5rem' } },
          React.createElement('button', {
            className: 'btn',
            onClick: () => setShowSettings(false),
          }, 'Отмена'),
          React.createElement('button', {
            className: 'btn btn-accent',
            onClick: handleSaveSettings,
          }, 'Сохранить')
        )
      )
    ),
    // ── Toast notification ──
    toast.visible && React.createElement('div', {
      className: `toast ${toast.type === 'error' ? 'error' : 'success'}`,
    },
      React.createElement('span', { className: 'toast-icon' },
        toast.type === 'error' ? '\u274C' : '\u2705'
      ),
      toast.message
    )
  );
}

export default App;

document.addEventListener('DOMContentLoaded', () => {
  const rootEl = document.getElementById('root');
  if (rootEl) {
    ReactDOM.createRoot(rootEl).render(React.createElement(App, null));
  }
});
