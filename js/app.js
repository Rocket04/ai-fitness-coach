// js/app.js
import React, { useState, useEffect, useMemo, lazy, Suspense } from 'react';
import { init, db, saveSession, saveCheckin, getLatestTestResults } from '../core/storage.js';
import {
  calcReadiness,
  detectRecoveryDebt,
  calculateRecoveryScore,
  getWeeklySummary,
  getCoachAdvice,
  adjustExercisesForMode,
  applyMultiplierToExercises,
  applyApreAdjustment,
  getTestMultiplier,
  buildSessionFromMonth,
  checkAchievements
} from '../core/engine.js';
import { MONTHS, ZONES, HRV_GUIDE, NUTRITION, MORNING_ROUTINE, EVENING_ROUTINE } from '../config/constants.js';

// Lazy load pages
const TodayPage = lazy(() => import('../ui/pages/TodayPage.js'));
const RehabPage = lazy(() => import('../ui/pages/RehabPage.js'));
const LogPage = lazy(() => import('../ui/pages/LogPage.js'));
const InfoPage = lazy(() => import('../ui/pages/InfoPage.js'));
const NutritionPage = lazy(() => import('../ui/pages/NutritionPage.js'));

function App() {
  // --- Состояние приложения ---
  const [startDate, setStartDate] = useState(''); // ISO string of plan start
  const [trainDays, setTrainDays] = useState(0); // total days in plan
  const [weight, setWeight] = useState(0);
  const [restHR, setRestHR] = useState(0);
  const [hrv, setHrv] = useState(0);
  const [sleepHours, setSleepHours] = useState(0);
  const [hipPain, setHipPain] = useState(0);
  const [shoulderPain, setShoulderPain] = useState(0);
  const [breathing, setBreathing] = useState('good');
  const [notes, setNotes] = useState('');
  const [manualStatus, setManualStatus] = useState(null); // optional override readiness
  const [sessions, setSessions] = useState([]);
  const [checkins, setCheckins] = useState([]);
  const [rpe, setRpe] = useState(0);
  const [sessionNote, setSessionNote] = useState('');
  const [testPullUps, setTestPullUps] = useState(0);
  const [testPushUps, setTestPushUps] = useState(0);
  const [testPlank, setTestPlank] = useState(0);
  const [activeTab, setActiveTab] = useState(0); // 0: Today, 1: Rehab, 2: Log, 3: Info, 4: Nutrition

  // --- Загрузка данных из IndexedDB при монтировании ---
  useEffect(() => {
    async function loadData() {
      try {
        await init();
        const [allSessions, allCheckins] = await Promise.all([
          db.sessions.toArray(),
          db.checkins.toArray()
        ]);
        setSessions(allSessions);
        setCheckins(allCheckins);
        // Если стартовая дата не задана, берём самую раннюю сессию или сегодня
        if (!startDate && allSessions.length > 0) {
          const dates = allSessions.map(s => s.date);
          const earliest = Math.min(...dates);
          setStartDate(earliest);
        } else if (!startDate) {
          setStartDate(new Date().toISOString().slice(0, 10));
        }
      } catch (err) {
        console.error('Failed to load data from IndexedDB:', err);
      }
    }
    loadData();
  }, [startDate]);

  // --- Текущая дата и расчёт дня в плане ---
  const todayISO = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const dayIndex = useMemo(() => {
    if (!startDate) return 0;
    const start = new Date(startDate);
    const today = new Date(todayISO);
    const diffTime = today - start;
    return Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));
  }, [startDate, todayISO]);

  // --- Готовность и восстановление ---
  const readiness = useMemo(() => {
    if (manualStatus !== null) return manualStatus;
    const latestCheckin = checkins
      .slice()
      .sort((a, b) => new Date(b.date) - new Date(a.date))[0];
    return latestCheckin ? calcReadiness(latestCheckin) : 'green';
  }, [checkins, manualStatus]);

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

  // --- Тестовые результаты ---
  const testHistory = useMemo(() => {
    return sessions
      .filter(s => s.testResults)
      .map(s => ({
        date: s.date,
        testResults: s.testResults
      }));
  }, [sessions]);

  const testMultiplier = useMemo(() => getTestMultiplier(sessions, 0), [sessions]);

  // --- Последняя сессия того же типа (для APRE) ---
  const lastSessionByType = useMemo(() => {
    if (!sessions.length) return null;
    // Мы будем определять тип тренировки позже, после получения sessionPlan
    return null;
  }, [sessions]);

  // --- План тренировки на сегодня ---
  const sessionPlan = useMemo(() => {
    if (!MONTHS.length) return [];
    const monthIndex = Math.floor(dayIndex / 30) % MONTHS.length;
    const dayInMonth = dayIndex % 30;
    const weekIndex = Math.floor(dayInMonth / 7);
    const dayInWeek = dayInMonth % 7;
    return buildSessionFromMonth(
      monthIndex,
      dayInWeek, // упрощённо: день внутри недели
      readiness,
      recoveryDebt,
      testMultiplier,
      null // apreSession – можно улучшить позже
    );
  }, [dayIndex, readiness, recoveryDebt, testMultiplier, MONTHS]);

  // --- Тип тренировки (например, A/B/C) ---
  const trainType = useMemo(() => {
    // Простейшее определение по первому упражнению или по дню недели
    if (!sessionPlan.length) return 'rest';
    // Можно взять из констант, но пока вернём placeholder
    return sessionPlan[0].type ?? 'A';
  }, [sessionPlan]);

  // --- Недельная сводка ---
  const weeklySummary = useMemo(() => getWeeklySummary(sessions, checkins, todayISO), [sessions, checkins, todayISO]);

  // --- Месячная статистика (упрощённо) ---
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
      { label: 'Средний RPE', value: monthSessions.length ? (monthSessions.reduce((sum, s) => sum + (s.rpe || 0), 0) / monthSessions.length).toFixed(1) : '-' }
    ];
  }, [sessions, todayISO]);

  // --- Обработчики сохранения ---
  const handleSaveSession = async () => {
    const session = {
      key: `${todayISO}_${trainType}`,
      date: todayISO,
      type: trainType,
      completed: rpe > 0,
      readiness,
      rpe,
      hipPain,
      shoulderPain,
      notes: sessionNote,
      testResults: { pullUps: testPullUps, pushUps: testPushUps, plankSec: testPlank },
      mode: readiness === 'red' ? 'minimum' : readiness === 'yellow' ? 'yellow' : 'full',
      updatedAt: Date.now()
    };
    try {
      await saveSession(session);
      setSessions(prev => [...prev, session]);
      // Сброс формы
      setRpe(0);
      setSessionNote('');
      setTestPullUps(0);
      setTestPushUps(0);
      setTestPlank(0);
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
      qualityOfSleep: 0, // placeholder
      muscleSoreness: 0,
      motivation: 0,
      ts: Date.now()
    };
    try {
      await saveCheckin(checkin);
      setCheckins(prev => [...prev, checkin]);
    } catch (err) {
      console.error('Failed to save checkin:', err);
    }
  };

  // --- Советы тренера ---
  const coachAdvice = useMemo(() => {
    const latestCheckin = checkins
      .slice()
      .sort((a, b) => new Date(b.date) - new Date(a.date))[0];
    return getCoachAdvice(recoveryScore, latestCheckin || {}, testHistory, weeklySummary);
  }, [recoveryScore, checkins, testHistory, weeklySummary]);

  // --- Рендер таббар и страниц ---
  return (
    <>
      <div className="tabbar">
        <button
          className={activeTab === 0 ? 'tab active' : 'tab'}
          onClick={() => setActiveTab(0)}
        >
          Сегодня
        </button>
        <button
          className={activeTab === 1 ? 'tab active' : 'tab'}
          onClick={() => setActiveTab(1)}
        >
          Реабил
        </button>
        <button
          className={activeTab === 2 ? 'tab active' : 'tab'}
          onClick={() => setActiveTab(2)}
        >
          Дневник
        </button>
        <button
          className={activeTab === 3 ? 'tab active' : 'tab'}
          onClick={() => setActiveTab(3)}
        >
          Справка
        </button>
        <button
          className={activeTab === 4 ? 'tab active' : 'tab'}
          onClick={() => setActiveTab(4)}
        >
          Питание
        </button>
      </div>

      <Suspense fallback={<div>Загрузка...</div>}>
        {activeTab === 0 && (
          <TodayPage
            sessionPlan={sessionPlan}
            sessionToday={null}
            trainType={trainType}
            readiness={readiness}
            recoveryDebt={recoveryDebt}
            recoveryScore={recoveryScore}
            todayISO={todayISO}
            tomorrowPlan={null}
            tomorrowType={null}
            rpe={rpe}
            setRpe={setRpe}
            sessionNote={sessionNote}
            setSessionNote={setSessionNote}
            testPullUps={testPullUps}
            setTestPullUps={setTestPullUps}
            testPushUps={testPushUps}
            setTestPushUps={setTestPushUps}
            testPlank={testPlank}
            setTestPlank={setTestPlank}
            markSession={handleSaveSession}
            startDate={startDate}
            inPlan={!!startDate}
            weekLabel={`Неделя ${Math.floor(dayIndex / 7) + 1}`}
          />
        )}
        {activeTab === 1 && (
          <RehabPage
            morningDone={false}
            eveningDone={false}
            markMorning={() => {}}
            markEvening={() => {}}
            MORNING_ROUTINE={MORNING_ROUTINE}
            EVENING_ROUTINE={EVENING_ROUTINE}
          />
        )}
        {activeTab === 2 && (
          <LogPage
            weight={weight}
            setWeight={setWeight}
            restHR={restHR}
            setRestHR={setRestHR}
            hrv={hrv}
            setHrv={setHrv}
            sleepHours={sleepHours}
            setSleepHours={setSleepHours}
            hipPain={hipPain}
            setHipPain={setHipPain}
            shoulderPain={shoulderPain}
            setShoulderPain={setShoulderPain}
            breathing={breathing}
            setBreathing={setBreathing}
            notes={notes}
            setNotes={setNotes}
            monthStats={monthStats}
            weeklySummary={weeklySummary}
            testHistory={testHistory}
            sessions={sessions}
            exportData={() => {}}
            importData={() => {}}
            resetAll={() => {}}
          />
        )}
        {activeTab === 3 && (
          <InfoPage
            showReadiness={false}
            setShowReadiness={() => {}}
            ZONES={ZONES}
            HRV_GUIDE={HRV_GUIDE}
          />
        )}
        {activeTab === 4 && (
          <NutritionPage
            NUTRITION={NUTRITION}
          />
        )}
      </Suspense>
    </>
  );
}

export default App;
