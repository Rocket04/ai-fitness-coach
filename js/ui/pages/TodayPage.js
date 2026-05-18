// js/ui/pages/TodayPage.js
// Главная страница «Сегодня» — дашборд в стиле Whoop/Athlytic

import React, { useContext, useState } from 'react';
import { AppStateContext, AppDispatchContext } from '../../core/AppContext.js';
import { ReadinessIndicator, RecoveryBar } from './RecoveryScoreCard.js';
import SessionPlan from './SessionPlan.js';
import CoachAdvice from './CoachAdvice.js';
import QuickStats from './QuickStats.js';

/* ---------- RPE scale descriptions ---------- */
const RPE_DESCRIPTIONS = {
  0: 'Отдых — никакой активности',
  1: 'Очень легко — разминка, ходьба',
  2: 'Легко — дыхание ровное',
  3: 'Умеренно — разговаривать легко',
  4: 'Довольно тяжело — короткие фразы',
  5: 'Тяжело — дыхание частое',
  6: 'Тяжеловато — односложно говорить',
  7: 'Очень тяжело — слова с трудом',
  8: 'Крайне тяжело — невозможно говорить',
  9: 'Предельно — на грани возможностей',
  10: 'Максимум — нельзя больше',
};

function rpeZone(value) {
  if (value <= 3) return { color: 'var(--green)', label: 'Лёгкая' };
  if (value <= 6) return { color: 'var(--yellow)', label: 'Умеренная' };
  return { color: 'var(--red)', label: 'Высокая' };
}

/* ---------- Sparkline component ---------- */
function Sparkline({ data, color }) {
  if (!data || data.length < 2) {
    return React.createElement('div', { className: 'sparkline sparkline--empty' }, '\u2014');
  }
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const w = 120, h = 32, pad = 2;
  const points = data.map((v, i) => {
    const x = pad + (i / (data.length - 1)) * (w - pad * 2);
    const y = pad + (h - pad * 2) - ((v - min) / range) * (h - pad * 2);
    return `${x},${y}`;
  }).join(' ');
  const area = `${pad},${h - pad} ${points} ${w - pad},${h - pad}`;
  return React.createElement('svg', { viewBox: `0 0 ${w} ${h}`, className: 'sparkline' },
    React.createElement('polygon', { points: area, fill: color, opacity: 0.15 }),
    React.createElement('polyline', { points, fill: 'none', stroke: color, strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' })
  );
}

/* ---------- Readiness Ring ---------- */
function ReadinessRing({ score, onClick }) {
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 70 ? 'var(--green)' : score >= 40 ? 'var(--yellow)' : 'var(--red)';
  return React.createElement('div', { className: 'readiness-ring', onClick, role: 'button', tabIndex: 0 },
    React.createElement('svg', { viewBox: '0 0 160 160', className: 'readiness-ring__svg' },
      React.createElement('circle', { cx: 80, cy: 80, r: radius, className: 'readiness-ring__bg' }),
      React.createElement('circle', {
        cx: 80, cy: 80, r: radius, className: 'readiness-ring__progress',
        style: { stroke: color, strokeDasharray: circumference, strokeDashoffset: offset }
      }),
      React.createElement('text', { x: 80, y: 72, className: 'readiness-ring__score', textAnchor: 'middle' }, score),
      React.createElement('text', { x: 80, y: 92, className: 'readiness-ring__label', textAnchor: 'middle' }, 'Recovery')
    )
  );
}

/* ---------- Quick Action Button ---------- */
function QuickAction({ label, icon, done, onClick }) {
  return React.createElement('button', { className: `quick-action${done ? ' done' : ''}`, onClick },
    React.createElement('span', { className: 'quick-action__icon' }, done ? '\u2705' : icon),
    React.createElement('span', { className: 'quick-action__label' }, label)
  );
}

/* ---------- Collapsible Section ---------- */
function Collapsible({ open, onToggle, title, summary, children }) {
  return React.createElement('div', { className: `collapsible${open ? ' open' : ''}` },
    React.createElement('button', { className: 'collapsible__header', onClick: onToggle },
      React.createElement('span', { className: 'collapsible__title' }, title),
      summary && React.createElement('span', { className: 'collapsible__summary' }, summary),
      React.createElement('span', { className: 'collapsible__chevron' }, open ? '\u25B2' : '\u25BC')
    ),
    open && React.createElement('div', { className: 'collapsible__body' }, children)
  );
}

/* ---------- main component ---------- */
export default function TodayPage() {
  const state = useContext(AppStateContext);
  const dispatch = useContext(AppDispatchContext);

  const {
    sessionPlan, trainType, readiness, autoReadiness, manualOverride,
    recoveryScore, coachAdvice, rpe, sessionNote,
    testPullUps, testPushUps, testPlank,
    trainingDone, weekLabel, tomorrowPlan, tomorrowType,
    morningDone, eveningDone, apreReasons,
    trendData7,
  } = state;

  const {
    setRpe, setSessionNote, setTestPullUps, setTestPushUps, setTestPlank,
    handleManualOverrideChange, handleToggleTraining,
    handleMarkMorning, handleMarkEvening,
  } = dispatch;

  const [sparkOpen, setSparkOpen] = useState(false);
  const [planOpen, setPlanOpen] = useState(true);

  const isRestDay = !trainType || !sessionPlan;
  const rpeKey = Math.round(rpe);
  const rpeDesc = RPE_DESCRIPTIONS[rpeKey] || '';
  const zone = rpeZone(rpe);

  // Sparkline data from trendData7
  const hrvSpark = (trendData7 || []).map(d => d.hrv).filter(Boolean);
  const sleepSpark = (trendData7 || []).map(d => d.sleepHours).filter(Boolean);
  const strainSpark = (trendData7 || []).map(d => d.recoveryScore).filter(Boolean);

  const todayStr = new Date().toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' });

  return React.createElement('div', { className: 'today-page' },

    // ── Date header ──
    React.createElement('div', { className: 'today-header' },
      React.createElement('h2', { className: 'today-header__title' }, '\uD83C\uDFC3\uFE0F Сегодня'),
      React.createElement('p', { className: 'today-header__date' }, todayStr)
    ),

    // ── Hero: Readiness Ring ──
    React.createElement('div', { className: 'card card--hero' },
      React.createElement(ReadinessRing, {
        score: recoveryScore || 0,
        onClick: () => setSparkOpen(o => !o),
      }),
      React.createElement('p', { className: 'readiness-hint' }, 'Нажмите для просмотра метрик')
    ),

    // ── Sparklines (collapsible) ──
    React.createElement(Collapsible, {
      open: sparkOpen,
      onToggle: () => setSparkOpen(o => !o),
      title: 'Метрики недели',
      summary: `HRV ${hrvSpark[hrvSpark.length - 1] || '\u2014'} мс`,
    },
      React.createElement('div', { className: 'sparkline-grid' },
        React.createElement('div', { className: 'sparkline-item' },
          React.createElement('span', { className: 'sparkline-item__label' }, 'HRV'),
          React.createElement(Sparkline, { data: hrvSpark, color: 'var(--blue)' })
        ),
        React.createElement('div', { className: 'sparkline-item' },
          React.createElement('span', { className: 'sparkline-item__label' }, 'Сон'),
          React.createElement(Sparkline, { data: sleepSpark, color: 'var(--green)' })
        ),
        React.createElement('div', { className: 'sparkline-item' },
          React.createElement('span', { className: 'sparkline-item__label' }, 'Recovery'),
          React.createElement(Sparkline, { data: strainSpark, color: 'var(--yellow)' })
        )
      )
    ),

    // ── Readiness + Recovery Bar ──
    React.createElement(ReadinessIndicator, {
      readiness, autoReadiness, manualOverride,
      onManualOverrideChange: handleManualOverrideChange,
    }),
    React.createElement(RecoveryBar, { score: recoveryScore }),

    // ── Training Plan (collapsible) ──
    !isRestDay && sessionPlan && React.createElement(Collapsible, {
      open: planOpen,
      onToggle: () => setPlanOpen(o => !o),
      title: 'Тренировка сегодня',
      summary: weekLabel,
    },
      React.createElement(SessionPlan, {
        sessionPlan, trainType, weekLabel, apreReasons,
      })
    ),

    // ── Test Results (only on test days) ──
    sessionPlan && sessionPlan.isTestDay &&
      React.createElement('div', { className: 'card', style: { borderColor: 'rgba(234, 179, 8, 0.3)' } },
        React.createElement('h4', { style: { margin: '0 0 0.75rem 0', color: 'var(--yellow)', display: 'flex', alignItems: 'center', gap: '0.3rem' } },
          React.createElement('span', null, '\uD83D\uDD2C'), 'Результаты тестов'
        ),
        React.createElement('div', { className: 'grid-3' },
          React.createElement('label', { style: { display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.85rem', fontWeight: 500 } },
            'Подтягивания',
            React.createElement('input', { type: 'number', value: testPullUps, onChange: e => setTestPullUps(Number(e.target.value)), min: 0 })
          ),
          React.createElement('label', { style: { display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.85rem', fontWeight: 500 } },
            'Отжимания',
            React.createElement('input', { type: 'number', value: testPushUps, onChange: e => setTestPushUps(Number(e.target.value)), min: 0 })
          ),
          React.createElement('label', { style: { display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.85rem', fontWeight: 500 } },
            'Планка (сек)',
            React.createElement('input', { type: 'number', value: testPlank, onChange: e => setTestPlank(Number(e.target.value)), min: 0 })
          )
        )
      ),

    // ── RPE + Save (only on training days) ──
    !isRestDay && React.createElement('div', { className: 'card' },
      React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' } },
        React.createElement('span', { style: { fontSize: '0.9rem', fontWeight: 600 } }, 'Как прошла тренировка?'),
        React.createElement('strong', { style: { fontSize: '1.3rem', color: zone.color, fontFamily: 'var(--font-mono)' } }, rpe || '?')
      ),
      React.createElement('div', { style: { fontSize: '0.82rem', color: 'var(--text2)', marginBottom: '0.625rem', minHeight: '1.2em' } }, rpeDesc),
      React.createElement('div', { className: 'rpe-zone-line' },
        Array.from({ length: 10 }, (_, i) =>
          React.createElement('div', { key: i, className: 'rpe-zone-segment', style: { opacity: i < rpeKey ? 1 : 0.3, transition: 'opacity var(--transition)' } })
        )
      ),
      React.createElement('div', { className: 'rpe-anchors' },
        React.createElement('span', null, '0 — отдых'),
        React.createElement('span', null, '5 — тяжело'),
        React.createElement('span', null, '10 — предел')
      ),
      React.createElement('div', { style: { margin: '0.75rem 0' } },
        React.createElement('input', { type: 'range', min: 0, max: 10, step: 0.5, value: rpe, onChange: e => setRpe(Number(e.target.value)), style: { width: '100%' } })
      ),
      React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text3)', marginBottom: '0.75rem' } },
        React.createElement('span', { style: { color: 'var(--green)', fontWeight: 500 } }, 'лёгкая'),
        React.createElement('span', { style: { color: 'var(--yellow)', fontWeight: 500 } }, 'умеренная'),
        React.createElement('span', { style: { color: 'var(--red)', fontWeight: 500 } }, 'высокая')
      ),
      React.createElement('div', { style: { marginBottom: '0.875rem' } },
        React.createElement('label', { style: { fontSize: '0.85rem', marginBottom: '0.25rem', display: 'block', fontWeight: 500 } }, 'Заметки'),
        React.createElement('textarea', { value: sessionNote, onChange: e => setSessionNote(e.target.value), placeholder: 'Что получилось? Что было тяжело?', rows: 2 })
      ),
      React.createElement('button', {
        className: trainingDone ? 'btn btn-red' : 'btn btn-accent',
        onClick: handleToggleTraining,
        style: { width: '100%' },
      }, trainingDone ? 'Отменить тренировку' : 'Сохранить тренировку')
    ),

    // ── Coach Advice ──
    React.createElement(CoachAdvice, { advice: coachAdvice }),

    // ── Quick Actions: Morning/Evening Rehab ──
    React.createElement('div', { className: 'card card--quick-actions' },
      React.createElement('h3', { className: 'card__title' }, 'Быстрые действия'),
      React.createElement('div', { className: 'quick-actions-grid' },
        React.createElement(QuickAction, { label: 'Утренний реабилит', icon: '\u2600\uFE0F', done: morningDone, onClick: handleMarkMorning }),
        React.createElement(QuickAction, { label: 'Вечерний реабилит', icon: '\uD83C\uDF19', done: eveningDone, onClick: handleMarkEvening })
      )
    ),

    // ── Tomorrow Preview ──
    React.createElement(QuickStats, {
      tomorrowType, tomorrowPlan,
      morningDone: false, eveningDone: false,
      onMarkMorning: handleMarkMorning,
      onMarkEvening: handleMarkEvening,
    })
  );
}
