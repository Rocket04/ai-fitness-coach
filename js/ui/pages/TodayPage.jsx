// js/ui/pages/TodayPage.js
// Главная страница «Сегодня» — премиум-дашборд в стиле Whoop/Athlytic
// 6 слоёв прогрессивного раскрытия

import React, { useEffect, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next'; 
import { Flame, Moon, PersonStanding, Lightbulb, Play, CheckCircle, Trash2, Eye } from 'lucide-react';
import { useAppStore } from '../../store/index.js';
import { useFitnessData, isExerciseConfigured } from '../../shared/hooks/useFitnessData.js';
import { detectOptimalTier } from '../../domains/recovery/recoveryScore.js';
import Collapsible from '../components/Collapsible.jsx';
import ExerciseCard from '../components/ExerciseCard.jsx';
import ExerciseConfigModal from '../components/ExerciseConfigModal.jsx';
import HelpIcon from '../components/HelpIcon.jsx';
import WeeklyPlanCard from '../components/WeeklyPlanCard.jsx';
import WeeklyReviewCard from '../components/WeeklyReviewCard.jsx';
import WorkoutMode from './WorkoutMode.jsx';
import { getBestLiftDelta, getPreviousWeekAvgScore } from '../../domains/analytics/weekReview.js';
import { mondayOfWeek, formatISO } from '../../shared/helpers.js';

// i18n usage example (after installing dependencies):
// const { t } = useTranslation();
// t('today.title') → "Сегодня" or "Today" based on language

/* ---------- RPE scale descriptions (i18n) ---------- */
function getRpeDescription(key, t) {
  return t(`today.rpeDescriptions.${key}`);
}

function rpeZone(value, t) {
  if (value <= 3) return { color: 'var(--green)', label: t('today.rpeZones.light') };
  if (value <= 6) return { color: 'var(--yellow)', label: t('today.rpeZones.moderate') };
  return { color: 'var(--red)', label: t('today.rpeZones.high') };
}

function getStatusLabel(readiness, recoveryScore, t) {
  if (readiness === 'green') return { text: t('today.status.ready'), color: 'var(--green)' };
  if (readiness === 'yellow') return { text: t('today.status.average'), color: 'var(--yellow)' };
  return { text: t('today.status.rest'), color: 'var(--red)' };
}

/* ---------- Premium Hero Ring (200px) ---------- */
function HeroRing({ score, onClick, t, testId }) {
  const radius = 90;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 70 ? 'var(--green)' : score >= 40 ? 'var(--yellow)' : 'var(--red)';
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick?.();
    }
  };
  
  // Empty state for first launch (score = 0)
  if (!score) {
    return React.createElement('div', {
      ...(testId ? { 'data-testid': testId } : {}),
      className: 'hero-ring--large hero-ring--empty',
      role: 'button',
      tabIndex: 0,
      'aria-label': t('today.doCheckin'),
      onClick,
      onKeyDown: handleKeyDown,
    },
      React.createElement('svg', { viewBox: '0 0 200 200', className: 'readiness-ring__svg' },
        React.createElement('circle', { cx: 100, cy: 100, r: radius, className: 'readiness-ring__bg', style: { stroke: 'var(--surface3)' } }),
        React.createElement('text', { x: 100, y: 85, className: 'readiness-ring__score', textAnchor: 'middle', style: { fontSize: '24px' } }, '—'),
        React.createElement('text', { x: 100, y: 110, className: 'readiness-ring__label', textAnchor: 'middle' }, t('today.recoveryLabel')),
        React.createElement('text', { x: 100, y: 135, className: 'readiness-ring__hint', textAnchor: 'middle', style: { fontSize: '12px', fill: 'var(--text3)' } }, t('today.doCheckin'))
      )
    );
  }
  
  return React.createElement('div', {
    ...(testId ? { 'data-testid': testId } : {}),
    className: 'hero-ring--large',
    onClick,
    onKeyDown: handleKeyDown,
    role: 'button',
    tabIndex: 0,
    'aria-label': `Recovery Score: ${score}%. Нажмите для метрик.`
  },
    React.createElement('svg', { viewBox: '0 0 200 200', className: 'readiness-ring__svg' },
      React.createElement('defs',
        null,
        React.createElement('linearGradient', { id: 'ringGradient', x1: '0%', y1: '0%', x2: '100%', y2: '100%' },
          React.createElement('stop', { offset: '0%', stopColor: score >= 70 ? '#4ade80' : score >= 40 ? '#facc15' : '#f87171', stopOpacity: 0.8 }),
          React.createElement('stop', { offset: '100%', stopColor: score >= 70 ? '#22c55e' : score >= 40 ? '#eab308' : '#ef4444', stopOpacity: 1 })
        )
      ),
      React.createElement('circle', { cx: 100, cy: 100, r: radius, className: 'readiness-ring__bg' }),
      React.createElement('circle', {
        cx: 100, cy: 100, r: radius, className: 'readiness-ring__progress',
        style: { stroke: 'url(#ringGradient)', strokeDasharray: circumference, strokeDashoffset: offset }
      }),
      React.createElement('text', { x: 100, y: 88, className: 'readiness-ring__score', textAnchor: 'middle' }, score),
      React.createElement('text', { x: 100, y: 112, className: 'readiness-ring__label', textAnchor: 'middle' }, t('today.recoveryLabel'))
    )
  );
}

/* ---------- Sparkline Card Component ---------- */
function SparklineCard({ label, value, data, color, unit = '', t }) {
  const lastValue = data && data.length > 0 ? data[data.length - 1] : null;
  const displayValue = value !== undefined ? value : (lastValue !== null ? `${lastValue}${unit}` : '—');

  // Build sparkline SVG path
  let sparklineSvg = null;
  if (data && data.length >= 2) {
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    const w = 100, h = 28, pad = 2;
    const points = data.map((v, i) => {
      const x = pad + (i / (data.length - 1)) * (w - pad * 2);
      const y = pad + (h - pad * 2) - ((v - min) / range) * (h - pad * 2);
      return `${x},${y}`;
    }).join(' ');
    const area = `${pad},${h - pad} ${points} ${w - pad},${h - pad}`;

    sparklineSvg = React.createElement('svg', { viewBox: `0 0 ${w} ${h}`, className: 'sparkline sparkline--animated' },
      React.createElement('polygon', { points: area, fill: color, opacity: 0.12 }),
      React.createElement('polyline', { points, fill: 'none', stroke: color, strokeWidth: 2.5, strokeLinecap: 'round', strokeLinejoin: 'round' })
    );
  } else {
    sparklineSvg = React.createElement('div', { className: 'sparkline sparkline--empty' }, t ? t('today.noData') : 'Нет данных');
  }

  return React.createElement('div', { className: 'sparkline-card' },
    React.createElement('div', { className: 'sparkline-card__header' },
      React.createElement('span', { className: 'sparkline-card__label' }, label),
      React.createElement('span', { className: 'sparkline-card__value', style: { color } }, displayValue)
    ),
    sparklineSvg
  );
}

/* ---------- Exercise List Component ---------- */
function ExerciseList({ exercises }) {
  if (!exercises || exercises.length === 0) return null;

  return React.createElement('div', { className: 'exercise-list' },
    exercises.map((ex, idx) =>
      React.createElement('div', { key: idx, className: 'exercise-row' },
        React.createElement('span', { className: 'exercise-name' }, ex.n || ex.name || '—'),
        React.createElement('span', { className: 'exercise-sets' }, `${ex.s || ex.sets || '—'}×${ex.r || ex.reps || '—'}`)
      )
    )
  );
}

/* ---------- Coach Tips Panel ---------- */
function CoachTipsPanel({ tips, t }) {
  const [open, setOpen] = useState(false);
  if (!tips || tips.length === 0) return null;

  return React.createElement('div', { className: 'card', style: { padding: 0, overflow: 'hidden' } },
    React.createElement('button', {
      className: 'collapsible__header',
      onClick: () => setOpen(!open),
      style: { borderBottom: open ? '1px solid var(--border)' : 'none' }
    },
      React.createElement('span', null, React.createElement(Lightbulb, { size: 20 }), ' ' + (t ? t('today.coachTips') : 'Советы тренер')),
      React.createElement('span', { className: 'coach-badge' }, tips.length),
      React.createElement('span', { style: { marginLeft: 'auto', fontSize: '0.8rem', color: 'var(--text2)' } }, open ? '▲' : '▼')
    ),
    open && React.createElement('div', { className: 'collapsible__body', 'data-open': '', style: { padding: 'var(--spacing-md)' } },
      React.createElement('ul', { style: { margin: 0, paddingLeft: '1.2rem', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' } },
        tips.map((tip, idx) => React.createElement('li', { key: idx, style: { fontSize: '0.9rem', color: 'var(--text)', lineHeight: 1.5 } }, tip))
      )
    )
  );
}

/* ---------- Tomorrow Mini Preview ---------- */
function TomorrowMini({ tomorrowType, tomorrowPlan, t }) {
  const isRest = !tomorrowType;
  const typeLabel = tomorrowType || (t ? t('today.rest') : 'Отдых');
  const color = tomorrowType === 'A' ? 'var(--green)' : tomorrowType === 'B' ? 'var(--yellow)' : tomorrowType === 'C' ? 'var(--blue)' : 'var(--text2)';

  return React.createElement('div', { className: 'tomorrow-card' },
    React.createElement('span', { className: 'tomorrow-card__label' }, t ? t('today.tomorrow') : 'Завтра'),
    React.createElement('span', { className: 'tomorrow-card__type', style: { color: isRest ? 'var(--text2)' : color } },
      isRest ? React.createElement(React.Fragment, null, React.createElement(Moon, { size: 16 }), ' ' + (t ? t('today.restTomorrow') : 'Отдых')) : (t ? t('today.type', { type: typeLabel }) : `Тип ${typeLabel}`)
    )
  );
}

/* ---------- Вычисляет 3 баланса из чек-ина и тренд-данных ---------- */
function buildBalances(checkin, trendData7, t) {
  if (!checkin) return [];
  const color = (score) => score >= 70 ? 'var(--green)' : score >= 40 ? 'var(--yellow)' : 'var(--red)';

  const balances = [];

  // HRV-баланс
  const hrv = Number(checkin.hrv) || 0;
  if (hrv > 0) {
    const hrvValues = (trendData7 || []).map(d => d.hrv).filter(v => v > 0);
    const mean = hrvValues.length >= 3 ? hrvValues.reduce((a, b) => a + b, 0) / hrvValues.length : 0;
    const hrvScore = mean > 0 ? Math.min(100, Math.round((hrv / mean) * 70)) : (hrv >= 70 ? 90 : hrv >= 55 ? 60 : 30);
    balances.push({
      key: 'hrv',
      label: t('recovery.components.hrv'),
      value: `${hrv} ms`,
      color: color(hrvScore),
      hint: `HRV ${hrv} ms — ANS balance`,
    });
  }

  // Сон-баланс
  const sleep = Number(checkin.sleepHours) || 0;
  if (sleep > 0) {
    const sleepScore = Math.min(100, Math.round((sleep / 8) * 100));
    balances.push({
      key: 'sleep',
      label: t('recovery.components.sleep'),
      value: `${sleep} h`,
      color: color(sleepScore),
      hint: `Sleep ${sleep} h — target 8 h`,
    });
  }

  // Субъективный баланс
  const energy = Number(checkin.energy || 0);
  const mood = Number(checkin.mood || 0);
  const soreness = Number(checkin.muscleSoreness || 0);
  const count = (energy > 0 ? 1 : 0) + (mood > 0 ? 1 : 0) + (soreness > 0 ? 1 : 0);
  if (count > 0) {
    const raw = ((energy || 0) + (mood || 0) + (soreness > 0 ? 6 - soreness : 0)) / count;
    const subjScore = Math.min(100, Math.round((raw / 5) * 100));
    balances.push({
      key: 'subjective',
      label: t('recovery.components.subjective'),
      value: `${Math.round(raw * 10) / 10}/5`,
      color: color(subjScore),
      hint: t('today.hint'),
    });
  }

  return balances;
}

/* ---------- Demo data for tour ---------- */
const DEMO_TREND_DATA = [
  { date: '2026-05-18', recoveryScore: 62, hrv: 48, restHR: 64, sleepHours: 6.5 },
  { date: '2026-05-19', recoveryScore: 68, hrv: 52, restHR: 62, sleepHours: 7.0 },
  { date: '2026-05-20', recoveryScore: 55, hrv: 45, restHR: 66, sleepHours: 6.0 },
  { date: '2026-05-21', recoveryScore: 72, hrv: 56, restHR: 60, sleepHours: 8.0 },
  { date: '2026-05-22', recoveryScore: 78, hrv: 60, restHR: 58, sleepHours: 7.5 },
  { date: '2026-05-23', recoveryScore: 70, hrv: 54, restHR: 61, sleepHours: 7.0 },
  { date: '2026-05-24', recoveryScore: 74, hrv: 57, restHR: 59, sleepHours: 8.0 },
];
const DEMO_RPE_DATA = [
  { date: '2026-05-18', rpe: 6, type: 'A' },
  { date: '2026-05-20', rpe: 7, type: 'B' },
  { date: '2026-05-22', rpe: 5, type: 'A' },
  { date: '2026-05-24', rpe: 7, type: 'A' },
];
const DEMO_SESSION = {
  type: 'A',
  exercises: [
    { n: 'Подтягивания параллельным хватом', s: '3', r: '6-8', w: 'НЕ до отказа', isApre: true, protocol: 'APRE_6', currentRM: 0 },
    { n: 'Австралийские подтягивания', s: '3', r: '8-10', w: 'Контроль негативной фазы' },
    { n: 'W-подъём лёжа на животе', s: '3', r: '10 медленно', w: 'Нижние трапеции' },
  ],
  mode: 'full',
  monthColor: '#4a7c59',
  label: 'Бег Z2 + Тяга',
};

/* ---------- Main Component: 6-Layer Premium Dashboard ---------- */
export default function TodayPage() {
  const { t } = useTranslation();
  const {
    sessionPlan, readiness, recoveryScore, recoveryDebt, rpe, sessionNote,
    testPullUps, testPushUps, testPlank, trainingDone, weekLabel, totalWeek, phase,
    tomorrowPlan,
    durationMinutes, lastCheckin, streak, trendData7, rpeTrend7,
    setRpe, setSessionNote, setDurationMinutes, setTestPullUps, setTestPushUps, setTestPlank,
    handleToggleTraining,
      coachAdvice, updateApreResult, updateSetResult, checkinTier, checkins, planModifications,
      demoMode, dataLoaded, setActiveTab, postSessionFatigue,
      postSessionPain, setPostSessionFatigue, setPostSessionPain, weeklyPlan,
      pendingSetResults, weeklyAdherenceMultiplier, scoreLast30DayAvg,
      sessions, trendData30, todayISO,
    } = useAppStore();

  // Compute set completion progress
  const setProgress = useMemo(() => {
    if (!sessionPlan?.exercises) return { total: 0, completed: 0 };
    let total = 0;
    for (const ex of sessionPlan.exercises) {
      const match = ex.s ? ex.s.match(/(\d+)/) : null;
      total += match ? parseInt(match[1], 10) : 3;
    }
    const completed = pendingSetResults.filter(s => s.completed).length;
    return { total, completed };
  }, [sessionPlan?.exercises, pendingSetResults]);

  // Check if today's training is already completed
  const hasCompletedSession = useMemo(() => {
    if (!todayISO || !sessions) return false;
    return sessions.some(s => s.date === todayISO && s.completed && s.type !== 'morning' && s.type !== 'evening');
  }, [todayISO, sessions]);

  // Find the completed session for view results mode
  const existingSession = useMemo(() => {
    if (!todayISO || !sessions) return null;
    return sessions.find(s => s.date === todayISO && s.completed && s.type !== 'morning' && s.type !== 'evening') || null;
  }, [todayISO, sessions]);

  // Weekly Review Card state (Monday only)
  const [weeklyReviewDismissed, setWeeklyReviewDismissed] = useState(null);
  const weeklyReviewData = useMemo(() => {
    const now = new Date();
    if (now.getDay() !== 1) return { show: false };
    const thisMonday = mondayOfWeek(now);
    const thisWeekISO = formatISO(thisMonday);
    if (weeklyReviewDismissed === thisWeekISO) return { show: false };
    const wasDismissed = (() => { try { return localStorage.getItem('weeklyReviewDismissed') === thisWeekISO; } catch { return false; } })();
    if (wasDismissed) return { show: false };
    const bestLift = getBestLiftDelta(sessions || []);
    const scoreAvg = getPreviousWeekAvgScore(trendData30 || []);
    const completedSessions = (sessions || []).filter(s => s.completed).length;
    const totalPlanned = weeklyPlan?.days?.filter(d => d !== null).length || completedSessions;
    if (completedSessions < 2) return { show: false };
    return { show: true, bestLift, scoreAvg, completedSessions, totalPlanned, thisWeekISO };
  }, [sessions, trendData30, weeklyReviewDismissed, weeklyPlan]);

  const handleDismissWeeklyReview = () => {
    if (weeklyReviewData.thisWeekISO) {
      try { localStorage.setItem('weeklyReviewDismissed', weeklyReviewData.thisWeekISO); } catch {}
      setWeeklyReviewDismissed(weeklyReviewData.thisWeekISO);
    }
  };

  const handleNavigateAnalytics = () => setActiveTab(2);

  // Inject demo data for guided tour
  useEffect(() => {
    const handler = (e) => {
      const step = e.detail?.step;
        if (step === 2 && DEMO_SESSION) {
          // Step 3: inject demo workout plan
          useAppStore.setState({
            sessionPlan: DEMO_SESSION,
            weekLabel: 'Неделя 3',
            totalWeek: 3,
          });
      }
      if (step === 1 && DEMO_TREND_DATA.length > 0) {
        // Step 2: inject demo trend + RPE data + sparklines visible
        useAppStore.setState({
          trendData7: DEMO_TREND_DATA,
          rpeTrend7: DEMO_RPE_DATA,
          lastCheckin: { ...DEMO_TREND_DATA[DEMO_TREND_DATA.length - 1], date: '2026-05-24' },
          recoveryScore: 74,
          readiness: 'green',
        });
      }
    };
    window.addEventListener('tour-demo-data', handler);
    return () => window.removeEventListener('tour-demo-data', handler);
  }, []);

  // Exercise configuration state
  const { exercises: configs, updateExerciseById } = useFitnessData();
  const [configModalOpen, setConfigModalOpen] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState(null);

  // Layer visibility states
  const [showSparklines, setShowSparklines] = useState(false);
  const [showTrainingDetails, setShowTrainingDetails] = useState(false);
  const [showWorkoutMode, setShowWorkoutMode] = useState(false);
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);

  // Map exercise names to config IDs for lookup
  const nameToIdMap = {
    'отжимания': 'push_ups',
    'подтягивания': 'pull_ups',
    'брусья': 'dips',
    'приседания': 'squat',
    'становая': 'deadlift',
    'жим лёжа': 'bench_press',
    'жим стоя': 'overhead_press',
    'тяга': 'barbell_row',
  };

  // Helper to find config for an exercise by name or id
  const findExerciseConfig = (ex) => {
    // First try to match by id if exercise has one
    if (ex.id) {
      const byId = configs.find(c => c.id === ex.id);
      if (byId) return byId;
    }
    // Then try name mapping
    const mappedId = nameToIdMap[ex.n?.toLowerCase()];
    if (mappedId) {
      const byMappedId = configs.find(c => c.id === mappedId);
      if (byMappedId) return byMappedId;
    }
    // Finally try fuzzy name match
    return configs.find(c =>
      c.name.toLowerCase() === ex.n?.toLowerCase() ||
      ex.n?.toLowerCase().includes(c.name.toLowerCase()) ||
      c.name.toLowerCase().includes(ex.n?.toLowerCase())
    );
  };

  const handleConfigureExercise = (idx) => {
    const ex = sessionPlan?.exercises?.[idx];
    if (!ex) return;
    const config = findExerciseConfig(ex);
    if (config) {
      setSelectedExercise(config);
      setConfigModalOpen(true);
    }
  };

  const handleSaveExerciseConfig = ({ id, protocol, currentRM, currentLevel, usesWeight }) => {
    updateExerciseById(id, { protocol, currentRM, currentLevel, usesWeight });
  };

  // Derived values
  const trainType = sessionPlan?.sessionType || null;
  const isRestDay = !trainType || !sessionPlan;
  const weekNum = totalWeek;
  const rpeKey = Math.round(rpe);
  const rpeDesc = getRpeDescription(rpeKey, t) || '';
  const zone = rpeZone(rpe, t);
  const status = getStatusLabel(readiness, recoveryScore, t);

  // Guard: data not loaded yet
  if (!dataLoaded) {
    return React.createElement(
      'div',
      { className: 'today-page' },
      React.createElement('div', { className: 'card', style: { textAlign: 'center', padding: 'var(--spacing-xl)' } },
        React.createElement('p', { className: 'text-muted' }, 'Загрузка данных...')
      )
    );
  }

  // Guard: no sessionPlan despite having a training day (e.g. sports not configured)
  if (!sessionPlan && trainType) {
    return React.createElement(
      'div',
      { className: 'today-page' },
      React.createElement('div', { className: 'card', style: { textAlign: 'center', padding: 'var(--spacing-xl)' } },
        React.createElement(PersonStanding, { size: 32, style: { marginBottom: 'var(--spacing-md)', color: 'var(--text3)' } }),
        React.createElement('h3', { style: { marginBottom: 'var(--spacing-sm)' } }, 'План тренировки не найден'),
        React.createElement('p', { className: 'text-muted', style: { marginBottom: 'var(--spacing-md)' } },
          'Выберите вид спорта и дни тренировок в профиле.'
        ),
        React.createElement('button', {
          className: 'btn btn-accent',
          onClick: () => setActiveTab(3),
        }, 'Перейти в профиль')
      )
    );
  }

  // Sparkline data
  const hrvData = (trendData7 || []).map(d => d.hrv).filter(Boolean);
  const sleepData = (trendData7 || []).map(d => d.sleepHours).filter(Boolean);
  const loadData = (rpeTrend7 || []).map(d => d.rpe || 0).filter(Boolean);

  const todayStr = new Date().toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' });

  // Adaptive tier suggestion
  const suggestedTier = detectOptimalTier(checkins || []);
  const showTierSuggestion = suggestedTier && suggestedTier !== checkinTier;

  // Weekly 7-day strip
  const DAY_NAMES = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
  const todayDow = new Date().getDay();
  const mondayOff = todayDow === 0 ? -6 : 1 - todayDow;
  const WEEK_DAYS = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() + mondayOff + i);
    const dow = d.getDay(); const isTod = i === (todayDow === 0 ? 6 : todayDow - 1);
    const td = [1,3,5]; const hasW = td.includes(dow === 0 ? 7 : dow);
    return { date: d.getDate(), name: DAY_NAMES[i], isTod, type: hasW ? (dow===1||dow===5?'A':dow===3?'B':'C') : null };
  });

  return React.createElement(React.Fragment, null,
    React.createElement('div', { className: 'today-page' },

    // ═══════════════════════════════════════════════════════════════════
    // LAYER 0: Adaptive Tier Suggestion Banner
    // ═══════════════════════════════════════════════════════════════════
    showTierSuggestion && React.createElement('div', {
      className: 'card tier-suggestion-banner',
      'data-testid': 'tier-banner',
      style: { padding: 'var(--spacing-sm) var(--spacing-md)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', fontSize: 'var(--font-size-caption)' },
    },
      React.createElement(Lightbulb, { size: 16, style: { flexShrink: 0, color: 'var(--yellow)' } }),
      React.createElement('span', null, `Совет: переключите уровень чек-ина на "${suggestedTier === 'full' ? 'Полный' : suggestedTier === 'medium' ? 'Средний' : 'Лёгкий'}" — вы редко заполняете текущие метрики.`),
      React.createElement('button', {
        className: 'btn btn-sm',
        style: { marginLeft: 'auto', flexShrink: 0 },
        onClick: () => {
          const { setCheckinTier } = useAppStore.getState();
          setCheckinTier(suggestedTier);
        },
      }, 'Переключить')
    ),

    // ═══════════════════════════════════════════════════════════════════
    // LAYER 0.5: Weekly 7-Day Strip
    React.createElement('div', { className: 'weekly-strip' },
      WEEK_DAYS.map((d, i) =>
        React.createElement('button', {
          key: i, className: 'weekly-day-card' + (d.isTod ? ' is-today' : ''),
          onClick: () => {
            const off = d.isTod ? 0 : (d.date - new Date().getDate());
            useAppStore.getState().setVirtualTodayOffset(off);
          },
        },
          React.createElement('span', { className: 'weekly-day-name' }, d.name),
          React.createElement('span', { className: 'weekly-day-date' }, d.date),
          d.type
            ? React.createElement('span', { className: 'type-badge' }, d.type)
            : React.createElement('span', { className: 'rest-label' }, 'Отдых')
        )
      )
    ),

    // ═══════════════════════════════════════════════════════════════════
    // LAYER 0.5a: Adherence-based Volume Adjustment Banner
    weeklyAdherenceMultiplier !== 1.0 && React.createElement('div', {
      className: 'card',
      style: {
        padding: 'var(--spacing-sm) var(--spacing-md)',
        display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)',
        fontSize: 'var(--font-size-caption)',
        borderLeft: `4px solid ${weeklyAdherenceMultiplier > 1.0 ? 'var(--green)' : 'var(--yellow)'}`,
      },
    },
      React.createElement('span', { style: { fontSize: '1rem' } },
        weeklyAdherenceMultiplier > 1.0 ? '\u{1F53C}' : '\u{1F53D}'
      ),
      React.createElement('span', null,
        weeklyAdherenceMultiplier > 1.0
          ? `Нагрузка увеличена на ${Math.round((weeklyAdherenceMultiplier - 1) * 100)}% — отличное выполнение на прошлой неделе`
          : `Нагрузка снижена на ${Math.round((1 - weeklyAdherenceMultiplier) * 100)}% — восстановительная неделя`
      )
    ),

    // ═══════════════════════════════════════════════════════════════════
    // LAYER 0.6: Weekly Plan Card (expandable, shows exact plan per day)
    React.createElement(WeeklyPlanCard, { plan: weeklyPlan, t }),

    // Weekly Review Card (Monday only, dismissible)
    weeklyReviewData.show && React.createElement(WeeklyReviewCard, {
      bestLift: weeklyReviewData.bestLift,
      sessionsCompleted: weeklyReviewData.completedSessions,
      totalPlannedSessions: weeklyReviewData.totalPlanned,
      avgScoreCurrent: weeklyReviewData.scoreAvg?.currentAvg ?? null,
      avgScorePrevious: weeklyReviewData.scoreAvg?.previousAvg ?? null,
      onDismiss: handleDismissWeeklyReview,
      onNavigateAnalytics: handleNavigateAnalytics,
    }),

    // LAYER 1: Hero Ring (always visible)
    // ═══════════════════════════════════════════════════════════════════
    React.createElement('div', {
      className: 'card card--hero text-center card-appear',
      'data-testid': 'recovery-ring',
      'aria-live': 'polite',
      'aria-atomic': 'true',
      'aria-label': `Recovery Score: ${recoveryScore || 0}%`
    },
      React.createElement(HeroRing, {
        score: recoveryScore || 0,
        onClick: () => setShowSparklines(o => !o),
        t,
        testId: 'checkin-trigger',
      }),
      React.createElement('div', {
        className: 'status-pill',
        style: { backgroundColor: status.color },
      }, status.text),
      scoreLast30DayAvg !== null && React.createElement('p', {
        style: { fontSize: '0.75rem', color: 'var(--text2)', textAlign: 'center', margin: '4px 0' },
      },
        (() => {
          const diff = (recoveryScore || 0) - scoreLast30DayAvg;
          if (diff > 5) return `↑ ${t('score.above', { score: recoveryScore || 0, avg: scoreLast30DayAvg })}`;
          if (diff < -5) return `↓ ${t('score.below', { score: recoveryScore || 0, avg: scoreLast30DayAvg })}`;
          return `~ ${t('score.average', { score: recoveryScore || 0, avg: scoreLast30DayAvg })}`;
        })()
      ),
      scoreLast30DayAvg === null && (recoveryScore || 0) > 0 && React.createElement('p', {
        style: { fontSize: '0.75rem', color: 'var(--text2)', textAlign: 'center', margin: '4px 0' },
      },
        t('score.building')
      ),
      React.createElement('p', { className: 'readiness-hint mt-sm' },
        t('today.tapForMetrics'),
        React.createElement(HelpIcon, {
          term: 'Recovery Score',
          definition: t('recovery.description')
        })
      )
    ),

    // ═══════════════════════════════════════════════════════════════════
    // LAYER 2: Weekly Sparklines (tap to expand)
    // ═══════════════════════════════════════════════════════════════════
    showSparklines && React.createElement('div', { className: 'card-appear', 'data-testid': 'metrics-panel' },
      React.createElement('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' } },
        React.createElement(SparklineCard, {
          label: t('recovery.components.hrv'),
          data: hrvData,
          color: 'var(--blue)',
          unit: ' ms',
          t
        }),
        React.createElement(SparklineCard, {
          label: t('checkin.sleep'),
          data: sleepData,
          color: 'var(--green)',
          unit: ' h',
          t
        }),
        React.createElement(SparklineCard, {
          label: t('checkin.rpe'),
          data: loadData,
          color: 'var(--orange)',
          unit: '',
          t
        })
      )
    ),

    // ═══════════════════════════════════════════════════════════════════
    // LAYER 2.5: Start Workout Button / Completed Card (training days only)
    // ═══════════════════════════════════════════════════════════════════
    !isRestDay && !showWorkoutMode && (
      hasCompletedSession
        ? React.createElement('div', {
            className: 'card card-appear',
            'data-testid': 'workout-completed-card',
            style: { animationDelay: '0.09s', padding: 'var(--spacing-md)' },
          },
            React.createElement('div', { style: { textAlign: 'center', marginBottom: 'var(--spacing-sm)' } },
              React.createElement(CheckCircle, { size: 28, style: { color: 'var(--green)' } }),
            ),
            React.createElement('p', { style: { textAlign: 'center', fontWeight: 600, color: 'var(--text)', marginBottom: 'var(--spacing-md)' } },
              t('today.workoutCompleted')
            ),
            React.createElement('div', { style: { display: 'flex', gap: 'var(--spacing-sm)' } },
              React.createElement('button', {
                className: 'btn btn-outline',
                'data-testid': 'view-results-btn',
                onClick: () => setShowWorkoutMode(true),
                style: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--spacing-xs)' },
              },
                React.createElement(Eye, { size: 16 }),
                React.createElement('span', null, t('today.viewResults'))
              ),
              React.createElement('button', {
                className: 'btn btn-outline',
                'data-testid': 'reset-workout-btn',
                onClick: () => setResetConfirmOpen(true),
                style: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--spacing-xs)', color: 'var(--red)' },
              },
                React.createElement(Trash2, { size: 16 }),
                React.createElement('span', null, t('today.resetWorkout'))
              ),
            ),
            resetConfirmOpen && React.createElement('div', {
              style: {
                marginTop: 'var(--spacing-sm)',
                padding: 'var(--spacing-md)',
                background: 'var(--surface2)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--red)',
              },
            },
              React.createElement('p', { style: { fontSize: 'var(--font-size-caption)', color: 'var(--text2)', marginBottom: 'var(--spacing-sm)' } },
                t('today.resetWorkoutConfirm')
              ),
              React.createElement('div', { style: { display: 'flex', gap: 'var(--spacing-sm)' } },
                React.createElement('button', {
                  className: 'btn btn-sm',
                  onClick: () => setResetConfirmOpen(false),
                  style: { flex: 1 },
                }, t('app.cancel')),
                React.createElement('button', {
                  className: 'btn btn-sm',
                  'data-testid': 'confirm-reset-btn',
                  onClick: () => {
                    setResetConfirmOpen(false);
                    handleToggleTraining();
                  },
                  style: { flex: 1, background: 'var(--red)', color: '#fff' },
                }, t('app.confirm')),
              ),
            ),
          )
        : React.createElement('div', {
            className: 'card card-appear',
            style: { animationDelay: '0.09s', padding: 0, overflow: 'hidden' },
          },
            React.createElement('button', {
              className: 'btn btn-accent',
              'data-testid': 'start-workout-btn',
              onClick: () => setShowWorkoutMode(true),
              style: {
                width: '100%', minHeight: '56px', fontSize: '1.1rem',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                gap: 'var(--spacing-sm)', padding: 'var(--spacing-md)',
                border: 'none', borderRadius: 0, cursor: 'pointer',
              },
            },
              React.createElement(Play, { size: 24 }),
              React.createElement('span', null, t('today.startWorkout') || 'Начать тренировку')
            ),
          )
    ),

    // ═══════════════════════════════════════════════════════════════════
    // LAYER 3: Training Plan / Rest Day
    // ═══════════════════════════════════════════════════════════════════
    isRestDay && React.createElement('div', { className: 'card rest-day-card card-appear', 'data-testid': 'workout-card', style: { animationDelay: '0.1s' } },
        React.createElement('span', { className: 'rest-day-icon' }, React.createElement(PersonStanding, { size: 20 })),
        React.createElement('span', { className: 'rest-day-title' }, t('today.restDay')),
        React.createElement('span', { className: 'rest-day-desc' }, t('today.restDescription'))
      ),

  // ═══════════════════════════════════════════════════════════════════
  // LAYER 6: Tomorrow Preview (compact)
    // ══════════════════════════════════════════════════════════════
    React.createElement(TomorrowMini, { tomorrowPlan, t }),

    // Date header at bottom
    React.createElement('div', { className: 'text-center mt-sm' },
      React.createElement('span', { className: 'today-header__date' }, todayStr),
      streak >= 2 && React.createElement('span', { className: 'streak-badge', style: { marginLeft: 'var(--spacing-sm)' } }, React.createElement(Flame, { size: 20 }), ` ${streak}`)
    )
  ),

  // ═══════════════════════════════════════════════════════════════════
  // WORKOUT MODE OVERLAY (full-screen)
  // ═══════════════════════════════════════════════════════════════════
  showWorkoutMode && React.createElement(WorkoutMode, {
    sessionPlan,
    recoveryScore,
    exercises: sessionPlan?.exercises || [],
    pendingSetResults,
    setProgress,
    rpe,
    sessionNote,
    durationMinutes,
    postSessionFatigue,
    postSessionPain,
    trainingDone,
    existingSession,
    onApreResult: updateApreResult,
    onSetComplete: updateSetResult,
    onRpeChange: setRpe,
    onSessionNoteChange: setSessionNote,
    onDurationChange: setDurationMinutes,
    onPostSessionFatigueChange: setPostSessionFatigue,
    onPostSessionPainChange: setPostSessionPain,
    onSaveWorkout: () => {
      handleToggleTraining();
      setShowWorkoutMode(false);
    },
    onCancelWorkout: () => setShowWorkoutMode(false),
    findExerciseConfig,
    isExerciseConfigured,
    handleConfigureExercise,
    configModalOpen,
    setConfigModalOpen,
    selectedExercise,
    handleSaveExerciseConfig,
    testPullUps,
    testPushUps,
    testPlank,
    onTestPullUpsChange: setTestPullUps,
    onTestPushUpsChange: setTestPushUps,
    onTestPlankChange: setTestPlank,
    showTrainingDetails,
    setShowTrainingDetails,
  }),
);
}
