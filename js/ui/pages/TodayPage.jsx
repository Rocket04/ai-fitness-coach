// js/ui/pages/TodayPage.js
// Главная страница «Сегодня» — дашборд в стиле Whoop/Athlytic

import React, { useState } from 'react';
import { useAppStore } from '../../stores/useAppStore.js';
import { ReadinessIndicator, RecoveryBar } from './RecoveryScoreCard.jsx';
import SessionPlan from './SessionPlan.jsx';
import CoachAdvice from './CoachAdvice.jsx';
import TomorrowPreview from '../components/TomorrowPreview.jsx';
import Collapsible from '../components/Collapsible.jsx';

/* ---------- RPE scale descriptions ---------- */
const RPE_DESCRIPTIONS = {
  0: 'Нет нагрузки — пропуск/отдых',
  1: 'Очень легко — восстановление, лёгкая разминка',
  2: 'Легко — разминочная серия, техника',
  3: 'Легко — подготовительный блок',
  4: 'Умеренно — базовый объём, контролируемый темп',
  5: 'Умеренно — рабочие подходы, дыхание ровное',
  6: 'Тяжело — рабочий вес, к концу тяжело',
  7: 'Тяжело — интенсив, короткие фразы между подходами',
  8: 'Очень тяжело — предельные подходы, нельзя говорить',
  9: 'Предел — выход за зону комфорта, фейл близок',
  10: 'Максимум — мышечный отказ, больше невозможно',
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
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick?.();
    }
  };
  return React.createElement('div', {
    className: 'readiness-ring',
    onClick,
    onKeyDown: handleKeyDown,
    role: 'button',
    tabIndex: 0,
    'aria-label': `Recovery Score: ${score}%. Нажмите для подробностей.`
  },
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

/* ---------- Вычисляет 3 баланса из чек-ина и тренд-данных ---------- */
function buildBalances(checkin, trendData7) {
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
      label: 'ВНС (HRV)',
      value: `${hrv} мс`,
      color: color(hrvScore),
      hint: `HRV ${hrv} мс — баланс вегетативной нервной системы`,
    });
  }

  // Сон-баланс
  const sleep = Number(checkin.sleepHours) || 0;
  if (sleep > 0) {
    const sleepScore = Math.min(100, Math.round((sleep / 8) * 100));
    balances.push({
      key: 'sleep',
      label: 'Сон',
      value: `${sleep} ч`,
      color: color(sleepScore),
      hint: `Сон ${sleep} ч — норма 8 ч`,
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
      label: 'Субъективно',
      value: `${Math.round(raw * 10) / 10}/5`,
      color: color(subjScore),
      hint: 'Энергия, настроение, болезненность мышц',
    });
  }

  return balances;
}

/* ---------- Quick Action Button ---------- */
function QuickAction({ label, icon, done, onClick }) {
  return React.createElement('button', {
    className: `quick-action${done ? ' done' : ''}`,
    onClick,
    'aria-label': done ? `${label} — выполнено` : label,
    'aria-pressed': done
  },
    React.createElement('span', { className: 'quick-action__icon' }, done ? '\u2705' : icon),
    React.createElement('span', { className: 'quick-action__label' }, label)
  );
}

/* ---------- main component ---------- */
export default function TodayPage() {
  const {
    sessionPlan, trainType, readiness, autoReadiness, manualOverride,
    recoveryScore, rpe, sessionNote,
    testPullUps, testPushUps, testPlank,
    trainingDone, weekLabel, tomorrowPlan, tomorrowType,
    morningDone, eveningDone, apreReasons,
    durationMinutes, lastCheckin, streak,
    trendData7, rpeTrend7,
    setRpe, setSessionNote, setDurationMinutes, setTestPullUps, setTestPushUps, setTestPlank,
    handleManualOverrideChange, handleToggleTraining,
    handleMarkMorning, handleMarkEvening,
  } = useAppStore();

  const [sparkOpen, setSparkOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const isRestDay = !trainType || !sessionPlan;
  const rpeKey = Math.round(rpe);
  const rpeDesc = RPE_DESCRIPTIONS[rpeKey] || '';
  const zone = rpeZone(rpe);
  const readinessColor = readiness === 'green' ? 'var(--green)' : readiness === 'yellow' ? 'var(--yellow)' : 'var(--red)';
  const readinessLabel = readiness === 'green' ? 'Зелёный' : readiness === 'yellow' ? 'Жёлтый' : 'Красный';

  // Sparkline data
  const hrvSpark = (trendData7 || []).map(d => d.hrv).filter(Boolean);
  const sleepSpark = (trendData7 || []).map(d => d.sleepHours).filter(Boolean);
  const rpeSpark = (rpeTrend7 || []).map(d => d.rpe).filter(Boolean);

  // 3 балланса для визуализации
  const balances = buildBalances(lastCheckin, trendData7);

  const todayStr = new Date().toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' });

  return React.createElement('div', { className: 'today-page' },

    // ── Date header ──
    React.createElement('div', { className: 'today-header' },
      React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' } },
        React.createElement('h2', { className: 'today-header__title' }, '\uD83C\uDFC3\uFE0F Сегодня'),
        streak >= 2 && React.createElement('span', { className: 'streak-badge' }, `🔥 ${streak}`)
      ),
      React.createElement('p', { className: 'today-header__date' }, todayStr)
    ),

    // ════════════════════════════════════════════════════════════
    // LEVEL 1: Hero — всегда видно
    // ════════════════════════════════════════════════════════════
    React.createElement('div', { className: 'card card--hero text-center' },
      React.createElement(ReadinessRing, {
        score: recoveryScore || 0,
        onClick: () => setSparkOpen(o => !o),
      }),
      React.createElement('div', {
        className: 'readiness-label',
        style: {
          backgroundColor: readinessColor,
          color: '#000',
        },
      }, readinessLabel),
      React.createElement('p', { className: 'readiness-hint mt-sm' }, 'Тренды HRV, сна и RPE за 7 дней ↓'),
      balances.length > 0 && React.createElement(
        'div',
        { className: 'balance-row' },
        balances.map(b => React.createElement(
          'button',
          { key: b.key, className: 'balance-item', onClick: () => setSparkOpen(o => !o), title: b.hint, 'aria-label': `${b.label}: ${b.value}. ${b.hint}` },
          React.createElement('span', { className: 'balance-item__dot', style: { background: b.color } }),
          React.createElement('span', { className: 'balance-item__label' }, b.label),
          React.createElement('span', { className: 'balance-item__value' }, b.value)
        ))
      )
    ),

    // ════════════════════════════════════════════════════════════
    // LEVEL 2: Sparklines — раскрывается по тапу на кольцо
    // ════════════════════════════════════════════════════════════
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
          React.createElement('span', { className: 'sparkline-item__label' }, 'RPE'),
          React.createElement(Sparkline, { data: rpeSpark, color: 'var(--yellow)' })
        )
      )
    ),

    // ════════════════════════════════════════════════════════════
    // LEVEL 3: Подробнее — план, RPE, советы
    // ════════════════════════════════════════════════════════════
    React.createElement('div', { className: 'mb-md' },
      React.createElement('button', {
        className: 'btn btn-outline w-full font-weight-600',
        onClick: () => setDetailsOpen(o => !o),
      }, detailsOpen ? '\u25B2 Скрыть подробности' : '\u25BC Подробнее'),
      React.createElement(Collapsible, {
        open: detailsOpen,
        onToggle: () => {}, // managed by parent button
        title: '',
        summary: '',
      },
        // Training Plan
        !isRestDay && sessionPlan && React.createElement(SessionPlan, {
          sessionPlan, trainType, weekLabel, apreReasons,
        }),

        // Test Results
        sessionPlan && sessionPlan.isTestDay &&
          React.createElement('div', { className: 'card bg-yellow-light' },
            React.createElement('h4', { className: 'mb-sm text-yellow flex items-center gap-xs' },
              React.createElement('span', null, '\uD83D\uDD2C'), 'Результаты тестов'
            ),
            React.createElement('div', { className: 'grid-3' },
              React.createElement('label', { className: 'flex flex-column gap-xs font-body font-weight-500' },
                'Подтягивания',
                React.createElement('input', { type: 'number', value: testPullUps, onChange: e => setTestPullUps(Number(e.target.value)), min: 0 })
              ),
              React.createElement('label', { className: 'flex flex-column gap-xs font-body font-weight-500' },
                'Отжимания',
                React.createElement('input', { type: 'number', value: testPushUps, onChange: e => setTestPushUps(Number(e.target.value)), min: 0 })
              ),
              React.createElement('label', { className: 'flex flex-column gap-xs font-body font-weight-500' },
                'Планка (сек)',
                React.createElement('input', { type: 'number', value: testPlank, onChange: e => setTestPlank(Number(e.target.value)), min: 0 })
              )
            )
          ),

        // RPE + Save
        !isRestDay && React.createElement('div', { className: 'card' },
          React.createElement('div', { className: 'flex justify-between items-center mb-sm' },
            React.createElement('span', { className: 'font-body font-weight-600' }, 'Как прошла тренировка?'),
            React.createElement('strong', { className: 'font-mono', style: { fontSize: '1.3rem', color: zone.color } }, rpe || '?')
          ),
          React.createElement('div', { className: 'font-body text-secondary mb-sm', style: { minHeight: '1.2em' } }, rpeDesc),
          React.createElement('div', { className: 'rpe-zone-line' },
            Array.from({ length: 10 }, (_, i) =>
              React.createElement('div', { key: i, className: 'rpe-zone-segment opacity-transition', style: { opacity: i < rpeKey ? 1 : 0.3 } })
            )
          ),
          React.createElement('div', { className: 'rpe-anchors' },
            React.createElement('span', null, '0 — отдых'),
            React.createElement('span', null, '5 — тяжело'),
            React.createElement('span', null, '10 — предел')
          ),
          React.createElement('div', { className: 'my-sm' },
            React.createElement('input', { type: 'range', min: 0, max: 10, step: 0.5, value: rpe, onChange: e => setRpe(Number(e.target.value)), className: 'w-full' })
          ),
          React.createElement('div', { className: 'flex justify-between font-caption text-muted mb-sm' },
            React.createElement('span', { className: 'text-green font-weight-500' }, 'лёгкая'),
            React.createElement('span', { className: 'text-yellow font-weight-500' }, 'умеренная'),
            React.createElement('span', { className: 'text-red font-weight-500' }, 'высокая')
          ),
          React.createElement('div', { className: 'mb-sm' },
            React.createElement('label', { className: 'font-body font-weight-500', style: { marginBottom: 'var(--spacing-xs)', display: 'block' } }, 'Длительность (мин)'),
            React.createElement('input', {
              type: 'number',
              min: 0,
              max: 300,
              value: durationMinutes,
              onChange: e => setDurationMinutes(Number(e.target.value)),
              className: 'w-full font-body', style: { padding: '0.375rem 0.5rem' },
            })
          ),
          React.createElement('div', { className: 'mb-sm' },
            React.createElement('label', { className: 'font-body font-weight-500', style: { marginBottom: 'var(--spacing-xs)', display: 'block' } }, 'Заметки'),
            React.createElement('textarea', { value: sessionNote, onChange: e => setSessionNote(e.target.value), placeholder: 'Что было тяжело? Какой подход дался хуже всего? Остановили ли раньше?', rows: 2, className: 'w-full' })
          ),
          React.createElement('button', {
            className: `${trainingDone ? 'btn btn-red' : 'btn btn-accent'} w-full`,
            onClick: handleToggleTraining,
          }, trainingDone ? 'Отменить тренировку' : 'Сохранить тренировку')
        ),

        // Coach Advice
        React.createElement(CoachAdvice)
      )
    ),

    // ════════════════════════════════════════════════════════════
    // Bottom: компактно
    // ════════════════════════════════════════════════════════════
    React.createElement(ReadinessIndicator, {
      readiness, autoReadiness, manualOverride,
      onManualOverrideChange: handleManualOverrideChange,
      lastCheckin, recoveryScore,
    }),
    React.createElement(RecoveryBar, { score: recoveryScore }),

    // Quick Actions
    React.createElement('div', { className: 'card card--quick-actions' },
      React.createElement('h3', { className: 'card__title' }, 'Быстрые действия'),
      React.createElement('div', { className: 'quick-actions-grid' },
        React.createElement(QuickAction, { label: 'Утренняя активация', icon: '☀️', done: morningDone, onClick: handleMarkMorning }),
        React.createElement(QuickAction, { label: 'Вечернее восстановление', icon: '🌙', done: eveningDone, onClick: handleMarkEvening })
      )
    ),

    // Tomorrow Preview
    React.createElement(
      'div',
      { className: 'card' },
      React.createElement(TomorrowPreview, { tomorrowPlan, tomorrowType })
    )
  );
}
