// js/ui/pages/TodayPage.js
// Главная страница «Сегодня» — премиум-дашборд в стиле Whoop/Athlytic
// 6 слоёв прогрессивного раскрытия

import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next'; 
import { Check, Sun, Moon, Flame, PersonStanding, Lightbulb } from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore.js';
import { useFitnessData, isExerciseConfigured } from '../../hooks/useFitnessData.js';
import { detectOptimalTier } from '../../core/recoveryScore.js';
import Collapsible from '../components/Collapsible.jsx';
import ExerciseCard from '../components/ExerciseCard.jsx';
import ExerciseConfigModal from '../components/ExerciseConfigModal.jsx';
import HelpIcon from '../components/HelpIcon.jsx';

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
function HeroRing({ score, onClick, t }) {
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

/* ---------- Quick Action Toggle ---------- */
function QuickActionToggle({ icon, label, statusLabel, active, onClick, t }) {
  return React.createElement('button', {
    className: `quick-action-toggle${active ? ' active' : ''}`,
    onClick,
    'aria-label': `${label} — ${active ? (t ? t('today.done') : 'выполнено') : (t ? t('today.notDone') : 'не выполнено')}`
  },
    React.createElement('span', { className: 'quick-action-toggle__icon' }, active ? React.createElement(Check, { size: 20 }) : icon),
    React.createElement('div', { className: 'quick-action-toggle__text' },
      React.createElement('span', { className: 'quick-action-toggle__label' }, label),
      React.createElement('span', { className: 'quick-action-toggle__status' }, active ? (t ? t('today.done') : 'Выполнено') : statusLabel)
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
    sessionPlan, readiness, recoveryScore, rpe, sessionNote,
    testPullUps, testPushUps, testPlank, trainingDone, weekLabel, totalWeek, phase,
    tomorrowPlan, morningDone, eveningDone,
    durationMinutes, lastCheckin, streak, trendData7, rpeTrend7,
    setRpe, setSessionNote, setDurationMinutes, setTestPullUps, setTestPushUps, setTestPlank,
    handleToggleTraining, handleMarkMorning, handleMarkEvening,
    coachAdvice, updateApreResult, checkinTier, checkins,
    demoMode,
  } = useAppStore();

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

  const handleSaveExerciseConfig = ({ id, protocol, currentRM, currentLevel }) => {
    updateExerciseById(id, { protocol, currentRM, currentLevel });
  };

  // Derived values
  const trainType = sessionPlan?.sessionType || null;
  const isRestDay = !trainType || !sessionPlan;
  const weekNum = totalWeek;
  const rpeKey = Math.round(rpe);
  const rpeDesc = getRpeDescription(rpeKey, t) || '';
  const zone = rpeZone(rpe, t);
  const status = getStatusLabel(readiness, recoveryScore, t);

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

  return React.createElement('div', { className: 'today-page' },

    // ═══════════════════════════════════════════════════════════════════
    // LAYER 0: Adaptive Tier Suggestion Banner
    // ═══════════════════════════════════════════════════════════════════
    showTierSuggestion && React.createElement('div', {
      className: 'card tier-suggestion-banner',
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

    // LAYER 1: Hero Ring (always visible)
    // ═══════════════════════════════════════════════════════════════════
    React.createElement('div', {
      className: 'card card--hero text-center card-appear',
      'aria-live': 'polite',
      'aria-atomic': 'true',
      'aria-label': `Recovery Score: ${recoveryScore || 0}%`
    },
      React.createElement(HeroRing, {
        score: recoveryScore || 0,
        onClick: () => setShowSparklines(o => !o),
        t,
      }),
      React.createElement('div', {
        className: 'status-pill',
        style: { backgroundColor: status.color },
      }, status.text),
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
    showSparklines && React.createElement('div', { className: 'card-appear' },
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
    // LAYER 3: Training Plan / Rest Day
    // ═══════════════════════════════════════════════════════════════════
    isRestDay
      ? React.createElement('div', { className: 'card rest-day-card card-appear', style: { animationDelay: '0.1s' } },
          React.createElement('span', { className: 'rest-day-icon' }, React.createElement(PersonStanding, { size: 20 })),
          React.createElement('span', { className: 'rest-day-title' }, t('today.restDay')),
          React.createElement('span', { className: 'rest-day-desc' }, t('today.restDescription'))
        )
      : React.createElement('div', { className: 'card card-appear', style: { animationDelay: '0.1s', padding: 0, overflow: 'hidden' } },
          // Training Header
          React.createElement('div', { className: 'training-header' },
            React.createElement('span', { className: 'training-type' }, sessionPlan?.sport || sessionPlan?.sessionType || null),
            React.createElement('div', { className: 'training-meta' },
              React.createElement('div', { className: 'training-week' },
                weekLabel,
                  totalWeek % 4 === 0 && React.createElement('span', {
                    className: 'deload-badge',
                    style: { marginLeft: '8px', fontSize: '0.75rem', color: 'var(--blue)' }
                  }, t('training.deload'))
              ),
              React.createElement('div', { className: 'training-title' },
                sessionPlan?.mode === 'test' ? t('training.testDay') : t('training.trainingDay'))
            )
          ),
          // Exercise List
          sessionPlan?.exercises && React.createElement(Collapsible, {
            open: showTrainingDetails,
            onToggle: () => setShowTrainingDetails(o => !o),
            title: t('today.exercises'),
            summary: t('today.exerciseCount', { count: sessionPlan.exercises.length }),
          },
            React.createElement('div', { className: 'exercise-list' },
              sessionPlan.exercises.map((ex, idx) => {
                // Find user config for this exercise
                const userConfig = findExerciseConfig(ex);

                // Create mapped exercise with user config applied
                const mappedEx = { ...ex };

                if (userConfig) {
                  // Force overwrite with user config values
                  mappedEx.protocol = userConfig.protocol;
                  mappedEx.currentRM = userConfig.currentRM;
                  mappedEx.currentLevel = userConfig.currentLevel;
                  mappedEx.isCalisthenics = userConfig.isCalisthenics;
                  mappedEx.unit = userConfig.unit;
                  mappedEx.id = userConfig.id; // Ensure id is set for future lookups
                }

                const isConfigured = userConfig ? isExerciseConfigured(userConfig) : false;

                return React.createElement(ExerciseCard, {
                  key: `${mappedEx.n}-${idx}`,
                  ex: mappedEx,
                  recoveryScore: recoveryScore || 0,
                  onApreResult: updateApreResult,
                  isConfigured,
                  onConfigure: () => handleConfigureExercise(idx),
                });
              })
            ),

            // Exercise Config Modal
            React.createElement(ExerciseConfigModal, {
              isOpen: configModalOpen,
              onClose: () => setConfigModalOpen(false),
              exercise: selectedExercise,
              onSave: handleSaveExerciseConfig,
            })
          ),
          // Test inputs if test day
          sessionPlan?.isTestDay && React.createElement('div', { className: 'grid-3', style: { padding: '0 var(--spacing-md) var(--spacing-md)' } },
            React.createElement('label', { className: 'flex flex-column gap-xs font-body' },
              t('training.pullUps'),
              React.createElement('input', { type: 'number', value: testPullUps, onChange: e => setTestPullUps(Number(e.target.value)), min: 0, style: { padding: '0.5rem' } })
            ),
            React.createElement('label', { className: 'flex flex-column gap-xs font-body' },
              t('training.pushUps'),
              React.createElement('input', { type: 'number', value: testPushUps, onChange: e => setTestPushUps(Number(e.target.value)), min: 0, style: { padding: '0.5rem' } })
            ),
            React.createElement('label', { className: 'flex flex-column gap-xs font-body' },
              t('training.plank'),
              React.createElement('input', { type: 'number', value: testPlank, onChange: e => setTestPlank(Number(e.target.value)), min: 0, style: { padding: '0.5rem' } })
            )
          ),
          // RPE Form
          React.createElement('div', { style: { padding: '0 var(--spacing-md) var(--spacing-md)' } },
            React.createElement('div', { className: 'flex justify-between items-center mb-sm' },
              React.createElement('span', { className: 'font-body font-weight-600' }, t('today.howWasWorkout')),
              React.createElement('strong', { className: 'font-mono', style: { fontSize: '1.5rem', color: zone.color } }, rpe || '?')
            ),
            React.createElement('div', { className: 'font-body text-secondary mb-sm' }, rpeDesc),
            React.createElement('input', {
              type: 'range', min: 0, max: 10, step: 0.5, value: rpe,
              onChange: e => setRpe(Number(e.target.value)),
              className: 'w-full',
              style: { marginBottom: 'var(--spacing-sm)' }
            }),
            React.createElement('div', { className: 'flex gap-sm mb-sm' },
              React.createElement('label', { className: 'flex-1 font-body' },
                t('today.duration'),
                React.createElement('input', {
                  type: 'number', min: 0, max: 300, value: durationMinutes,
                  onChange: e => setDurationMinutes(Number(e.target.value)),
                  className: 'w-full', style: { padding: '0.5rem', marginTop: '0.25rem' }
                })
              ),
              React.createElement('div', { style: { flex: 2 } },
                React.createElement('label', { className: 'font-body' }, t('today.notes')),
                React.createElement('textarea', {
                  value: sessionNote, onChange: e => setSessionNote(e.target.value),
                  placeholder: t('today.notesPlaceholder'),
                  rows: 2, className: 'w-full', style: { marginTop: '0.25rem' }
                })
              )
            ),
            React.createElement('button', {
              className: `${trainingDone ? 'btn btn-red' : 'btn btn-accent'} w-full`,
              onClick: handleToggleTraining,
              style: { minHeight: '48px' }
            }, trainingDone ? t('today.cancelWorkout') : t('today.saveWorkout'))
          ),
        ),

  // ═══════════════════════════════════════════════════════════════════
  React.createElement('div', { className: 'card card-appear', style: { animationDelay: '0.2s', padding: 'var(--spacing-md)' } },
    React.createElement(CoachTipsPanel, { tips: coachAdvice || [], t }),
    React.createElement('div', { style: { display: 'flex', gap: 'var(--spacing-sm)', marginTop: 'var(--spacing-md)' } },
      React.createElement(QuickActionToggle, {
        icon: React.createElement(Sun, { size: 20 }),
        label: t('today.morning'),
        statusLabel: t('today.morningStatus'),
        active: morningDone,
        onClick: handleMarkMorning,
        t
      }),
      React.createElement(QuickActionToggle, {
        icon: React.createElement(Moon, { size: 20 }),
        label: t('today.evening'),
        statusLabel: t('today.eveningStatus'),
        active: eveningDone,
        onClick: handleMarkEvening,
        t
      })
    )
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
  );
}
