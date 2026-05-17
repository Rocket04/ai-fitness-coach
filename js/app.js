// js/app.js
import React, { useState, useEffect, useMemo, useCallback, lazy, Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import {
  init,
  db,
  saveSession,
  saveCheckin,
  getCheckin,
  getLatestTestResults,
  exportAllData,
  importAllData,
  clearAllData,
} from '../core/storage.js';
import {
  calcReadiness,
  detectRecoveryDebt,
  calculateRecoveryScore,
  getWeeklySummary,
  getCoachAdvice,
  getTestMultiplier,
  buildSessionFromMonth,
} from '../core/engine.js';
import { MONTHS, ZONES, HRV_GUIDE, NUTRITION, MORNING_ROUTINE, EVENING_ROUTINE } from '../config/constants.js';

const TodayPage = lazy(() => import('../ui/pages/TodayPage.js'));
const RehabPage = lazy(() => import('../ui/pages/RehabPage.js'));
const LogPage = lazy(() => import('../ui/pages/LogPage.js'));
const InfoPage = lazy(() => import('../ui/pages/InfoPage.js'));
const NutritionPage = lazy(() => import('../ui/pages/NutritionPage.js'));

function dayIndexFromStart(startDate, isoDate) {
  if (!startDate) return 0;
  const start = new Date(startDate);
  const target = new Date(isoDate);
  const diffTime = target - start;
  return Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));
}

function App() {
  const [startDate, setStartDate] = useState(() => localStorage.getItem('startDate') || '');
  const [weight, setWeight] = useState(0);
  const [restHR, setRestHR] = useState(0);
  const [hrv, setHrv] = useState(0);
  const [sleepHours, setSleepHours] = useState(0);
  const [hipPain, setHipPain] = useState(0);
  const [shoulderPain, setShoulderPain] = useState(0);
  const [breathing, setBreathing] = useState('good');
  const [notes, setNotes] = useState('');
  const [sessions, setSessions] = useState([]);
  const [checkins, setCheckins] = useState([]);
  const [rpe, setRpe] = useState(0);
  const [sessionNote, setSessionNote] = useState('');
  const [testPullUps, setTestPullUps] = useState(0);
  const [testPushUps, setTestPushUps] = useState(0);
  const [testPlank, setTestPlank] = useState(0);
  const [activeTab, setActiveTab] = useState(0);
  const [showReadiness, setShowReadiness] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);

  const todayISO = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const dayIndex = useMemo(() => dayIndexFromStart(startDate, todayISO), [startDate, todayISO]);

  const tomorrowISO = useMemo(() => {
    const d = new Date(todayISO);
    d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10);
  }, [todayISO]);

  const tomorrowDayIndex = useMemo(
    () => dayIndexFromStart(startDate, tomorrowISO),
    [startDate, tomorrowISO]
  );

  useEffect(() => {
    async function loadData() {
      try {
        await init();
        const [allSessions, allCheckins] = await Promise.all([
          db.sessions.toArray(),
          db.checkins.toArray(),
        ]);
        setSessions(allSessions);
        setCheckins(allCheckins);

        let stored = localStorage.getItem('startDate');
        if (!stored && allSessions.length > 0) {
          stored = allSessions.map(s => s.date).sort()[0];
        }
        if (!stored) stored = todayISO;
        setStartDate(stored);
        localStorage.setItem('startDate', stored);

        const todayCheckin = await getCheckin(todayISO);
        if (todayCheckin) {
          setWeight(todayCheckin.weight ?? 0);
          setRestHR(todayCheckin.restHR ?? 0);
          setHrv(todayCheckin.hrv ?? 0);
          setSleepHours(todayCheckin.sleepHours ?? 0);
          setHipPain(todayCheckin.hipPain ?? 0);
          setShoulderPain(todayCheckin.shoulderPain ?? 0);
          setBreathing(todayCheckin.breathing ?? 'good');
          setNotes(todayCheckin.notes ?? '');
        }

        const latestTests = await getLatestTestResults();
        if (latestTests) {
          setTestPullUps(latestTests.pullUps ?? 0);
          setTestPushUps(latestTests.pushUps ?? 0);
          setTestPlank(latestTests.plankSec ?? 0);
        }
      } catch (err) {
        console.error('Failed to load data:', err);
      } finally {
        setDataLoaded(true);
      }
    }
    loadData();
  }, [todayISO]);

  const readiness = useMemo(() => {
    const latestCheckin = checkins
      .slice()
      .sort((a, b) => new Date(b.date) - new Date(a.date))[0];
    return latestCheckin ? calcReadiness(latestCheckin) : 'green';
  }, [checkins]);

  const recoveryDebt = useMemo(() => {
    const recent = checkins
      .slice()
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 3);
    return detectRecoveryDebt(recent);
  }, [checkins]);

  const recoveryScore = useMemo(() => {
    const latestCheckin = checkins
      .slice()
      .sort((a, b) => new Date(b.date) - new Date(a.date))[0];
    if (!latestCheckin) return 0;
    return calculateRecoveryScore(latestCheckin, checkins);
  }, [checkins]);

  const testHistory = useMemo(
    () =>
      sessions
        .filter(s => s.testResults)
        .map(s => ({ date: s.date, testResults: s.testResults })),
    [sessions]
  );

  const testMultiplier = useMemo(() => getTestMultiplier(sessions, 0), [sessions]);

  const buildPlanForDay = useCallback(
    (targetDayIndex, apreSession = null) => {
      if (!MONTHS.length) return [];
      const monthIndex = Math.floor(targetDayIndex / 30) % MONTHS.length;
      const dayInMonth = targetDayIndex % 30;
      return buildSessionFromMonth(
        monthIndex,
        dayInMonth,
        readiness,
        recoveryDebt,
        testMultiplier,
        apreSession
      );
    },
    [readiness, recoveryDebt, testMultiplier]
  );

  const lastSessionByType = useMemo(() => {
    if (!sessions.length) return null;
    const trainTypeGuess = sessions[sessions.length - 1]?.type;
    return (
      sessions
        .filter(s => s.type === trainTypeGuess && s.completed)
        .sort((a, b) => new Date(b.date) - new Date(a.date))[0] ?? null
    );
  }, [sessions]);

  const sessionPlan = useMemo(
    () => buildPlanForDay(dayIndex, lastSessionByType),
    [buildPlanForDay, dayIndex, lastSessionByType]
  );

  const tomorrowPlan = useMemo(
    () => buildPlanForDay(tomorrowDayIndex),
    [buildPlanForDay, tomorrowDayIndex]
  );

  const trainType = useMemo(() => {
    if (!sessionPlan.length) return 'rest';
    return sessionPlan[0].type ?? 'A';
  }, [sessionPlan]);

  const tomorrowType = useMemo(() => {
    if (!tomorrowPlan?.length) return null;
    return tomorrowPlan[0].type ?? 'rest';
  }, [tomorrowPlan]);

  const weeklySummary = useMemo(
    () => getWeeklySummary(sessions, checkins, todayISO),
    [sessions, checkins, todayISO]
  );

  const monthStats = useMemo(() => {
    const startOfMonth = new Date(todayISO);
    startOfMonth.setDate(1);
    const endOfMonth = new Date(todayISO);
    endOfMonth.setMonth(endOfMonth.getMonth() + 1, 0);
    const monthSessions = sessions.filter(s => {
      const d = new Date(s.date);
      return d >= startOfMonth && d <= endOfMonth;
    });
    const completed = monthSessions.filter(s => s.completed).length;
    return [
      { label: 'Тренировок', value: completed },
      {
        label: 'Средний RPE',
        value: monthSessions.length
          ? (
              monthSessions.reduce((sum, s) => sum + (s.rpe || 0), 0) / monthSessions.length
            ).toFixed(1)
          : '-',
      },
    ];
  }, [sessions, todayISO]);

  const morningDone = useMemo(
    () => sessions.some(s => s.date === todayISO && s.type === 'morning' && s.completed),
    [sessions, todayISO]
  );

  const eveningDone = useMemo(
    () => sessions.some(s => s.date === todayISO && s.type === 'evening' && s.completed),
    [sessions, todayISO]
  );

  const coachAdvice = useMemo(() => {
    const latestCheckin = checkins
      .slice()
      .sort((a, b) => new Date(b.date) - new Date(a.date))[0];
    return getCoachAdvice(recoveryScore, latestCheckin || {}, testHistory, weeklySummary);
  }, [recoveryScore, checkins, testHistory, weeklySummary]);

  const upsertSession = useCallback(async session => {
    await saveSession(session);
    setSessions(prev => [...prev.filter(s => s.key !== session.key), session]);
  }, []);

  const handleSaveSession = async () => {
    const session = {
      key: `${todayISO}_${trainType}`,
      date: todayISO,
      type: trainType,
      completed: true,
      readiness,
      rpe,
      hipPain,
      shoulderPain,
      notes: sessionNote,
      testResults: { pullUps: testPullUps, pushUps: testPushUps, plankSec: testPlank },
      mode: readiness === 'red' ? 'minimum' : readiness === 'yellow' ? 'yellow' : 'full',
      updatedAt: Date.now(),
    };
    try {
      await upsertSession(session);
      setRpe(0);
      setSessionNote('');
    } catch (err) {
      console.error('Failed to save session:', err);
    }
  };

  const handleSaveCheckin = async () => {
    const checkin = {
      date: todayISO,
      sleepHours,
      restHR,
      hrv,
      hipPain,
      shoulderPain,
      breathing,
      weight,
      notes,
      readiness,
      qualityOfSleep: 0,
      muscleSoreness: 0,
      motivation: 0,
      ts: Date.now(),
    };
    try {
      await saveCheckin(checkin);
      setCheckins(prev => [...prev.filter(c => c.date !== todayISO), checkin]);
    } catch (err) {
      console.error('Failed to save checkin:', err);
    }
  };

  const handleMarkMorning = async () => {
    await upsertSession({
      key: `${todayISO}_morning`,
      date: todayISO,
      type: 'morning',
      completed: true,
      readiness,
      rpe: 0,
      notes: '',
      updatedAt: Date.now(),
    });
  };

  const handleMarkEvening = async () => {
    await upsertSession({
      key: `${todayISO}_evening`,
      date: todayISO,
      type: 'evening',
      completed: true,
      readiness,
      rpe: 0,
      notes: '',
      updatedAt: Date.now(),
    });
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
        db.sessions.toArray(),
        db.checkins.toArray(),
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
      localStorage.removeItem('startDate');
      setStartDate(todayISO);
      localStorage.setItem('startDate', todayISO);
    } catch (err) {
      console.error('Reset failed:', err);
    }
  };

  if (!dataLoaded) {
    return React.createElement('div', { className: 'card' }, 'Загрузка...');
  }

  return React.createElement(
    React.Fragment,
    null,
    React.createElement(
      'div',
      { className: 'tabbar' },
      React.createElement('button', {
        className: activeTab === 0 ? 'tab active' : 'tab',
        onClick: () => setActiveTab(0),
      }, 'Сегодня'),
      React.createElement('button', {
        className: activeTab === 1 ? 'tab active' : 'tab',
        onClick: () => setActiveTab(1),
      }, 'Реабил'),
      React.createElement('button', {
        className: activeTab === 2 ? 'tab active' : 'tab',
        onClick: () => setActiveTab(2),
      }, 'Дневник'),
      React.createElement('button', {
        className: activeTab === 3 ? 'tab active' : 'tab',
        onClick: () => setActiveTab(3),
      }, 'Справка'),
      React.createElement('button', {
        className: activeTab === 4 ? 'tab active' : 'tab',
        onClick: () => setActiveTab(4),
      }, 'Питание')
    ),
    React.createElement(
      Suspense,
      { fallback: React.createElement('div', { className: 'card' }, 'Загрузка...') },
      activeTab === 0 &&
        React.createElement(TodayPage, {
          sessionPlan,
          trainType,
          readiness,
          recoveryDebt,
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
          markSession: handleSaveSession,
          weekLabel: `Неделя ${Math.floor(dayIndex / 7) + 1}`,
          tomorrowPlan,
          tomorrowType,
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
          weight,
          setWeight,
          restHR,
          setRestHR,
          hrv,
          setHrv,
          sleepHours,
          setSleepHours,
          hipPain,
          setHipPain,
          shoulderPain,
          setShoulderPain,
          breathing,
          setBreathing,
          notes,
          setNotes,
          monthStats,
          weeklySummary,
          testHistory,
          sessions,
          onSaveCheckin: handleSaveCheckin,
          exportData: handleExportData,
          importData: handleImportData,
          resetAll: handleResetAll,
        }),
      activeTab === 3 &&
        React.createElement(InfoPage, {
          showReadiness,
          setShowReadiness,
          ZONES,
          HRV_GUIDE,
        }),
      activeTab === 4 &&
        React.createElement(NutritionPage, { NUTRITION })
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
