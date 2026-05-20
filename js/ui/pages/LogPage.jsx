// js/ui/pages/LogPage.jsx
// Премиум-аналитический центр — дневник с корреляциями, графиками и тепловой картой

import React from 'react';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../../stores/useAppStore.js';
import CheckinForm from './CheckinForm.jsx';
import SessionLogger from './SessionLogger.jsx';
import CheckinHistory from '../components/CheckinHistory.jsx';
import CorrelationCard from '../components/CorrelationCard.jsx';
import RecoveryVsSleepChart from '../components/RecoveryVsSleepChart.jsx';
import HeatmapGrid from '../components/HeatmapGrid.jsx';

function SnapshotPanel({ recoveryScore, sleepHours, readiness, t }) {
  const scoreColor = recoveryScore >= 70 ? 'var(--green)' : recoveryScore >= 40 ? 'var(--yellow)' : 'var(--red)';
  const statusText = readiness === 'green' ? t('today.ready') : readiness === 'yellow' ? t('today.average') : t('today.rest');
  const statusClass = readiness === 'green' ? 'text-green' : readiness === 'yellow' ? 'text-yellow' : 'text-red';

  return React.createElement(
    'div',
    { className: 'log-snapshot fade-in-up' },
    React.createElement(
      'div',
      { className: 'log-snapshot__score' },
      React.createElement('span', { className: 'log-snapshot__value', style: { color: scoreColor } }, recoveryScore || '—'),
      React.createElement('span', { className: 'log-snapshot__label' }, 'Recovery Score')
    ),
    React.createElement(
      'div',
      { className: 'log-snapshot__col' },
      React.createElement('span', { className: 'log-snapshot__small' }, `💤 ${sleepHours || '—'} ч`)
    ),
    React.createElement(
      'div',
      { className: 'log-snapshot__col' },
      React.createElement('span', { className: `log-snapshot__status ${statusClass}` }, statusText)
    )
  );
}

export default function LogPage() {
  const { t } = useTranslation();
  const state = useAppStore();

  if (!state) {
    return React.createElement('div', { className: 'card' }, 'Загрузка контекста...');
  }

  const {
    recoveryScore,
    readiness,
    checkins,
    correlations,
    trendData30,
    weeklySummary,
    monthStats,
  } = state;

  const lastCheckin = checkins.length > 0
    ? [...checkins].sort((a, b) => (b.date || '').localeCompare(a.date || ''))[0]
    : null;
  const sleepHours = lastCheckin?.sleepHours ?? 0;

  // Prepare chart data: last 14 days with both sleep and recovery
  const chartData = trendData30
    .filter(d => d.sleepHours > 0 && d.recoveryScore > 0)
    .slice(-14);

  return React.createElement(
    'div',
    { className: 'page-enter log-page' },

    /* ═══════════════════ 0. ВЕРХНЯЯ ПАНЕЛЬ ═══════════════════ */
    React.createElement(SnapshotPanel, {
      recoveryScore,
      sleepHours,
      readiness,
      t,
    }),

    /* ═══════════════════ 1. УМНЫЙ ЧЕК-ИН ═══════════════════ */
    React.createElement(CheckinForm, null),

    /* ═══════════════════ 2. ЖИВАЯ АНАЛИТИКА ═══════════════════ */
    React.createElement(
      'div',
      { className: 'card fade-in-up', style: { animationDelay: '0.1s' } },
      React.createElement('h4', { className: 'mb-sm font-body' }, t('log.habitsImpact')),
      React.createElement(
        'div',
        { className: 'correlation-grid' },
        correlations.map((c, i) =>
          React.createElement(CorrelationCard, { key: i, result: c })
        )
      )
    ),

    React.createElement(
      'div',
      { className: 'card fade-in-up', style: { animationDelay: '0.15s' } },
      React.createElement(RecoveryVsSleepChart, { data: chartData })
    ),

    React.createElement(
      'div',
      { className: 'card fade-in-up', style: { animationDelay: '0.2s' } },
      React.createElement(HeatmapGrid, { data: trendData30.slice(-7) })
    ),

    /* ═══════════════════ WEEKLY SUMMARY (сохранено) ═══════════════════ */
    React.createElement(
      'div',
      { className: 'card fade-in-up', style: { animationDelay: '0.25s' } },
      React.createElement('h4', { className: 'mb-sm font-body' }, t('log.weeklyStats')),
      React.createElement(
        'div',
        { className: 'stat-grid' },
        React.createElement(StatBox, { value: weeklySummary.completed, label: t('log.workouts') }),
        React.createElement(StatBox, { value: weeklySummary.avgRPE ?? '—', label: t('log.avgRPE') }),
        React.createElement(StatBox, {
          value: weeklySummary.green ?? 0,
          label: t('log.green'),
          color: 'var(--green)',
        }),
        React.createElement(StatBox, {
          value: weeklySummary.yellow ?? 0,
          label: t('log.yellow'),
          color: 'var(--yellow)',
        }),
        React.createElement(StatBox, {
          value: weeklySummary.red ?? 0,
          label: t('log.red'),
          color: 'var(--red)',
        })
      )
    ),

    /* ═══════════════════ MONTH STATS (сохранено) ═══════════════════ */
    React.createElement(
      'div',
      { className: 'card fade-in-up', style: { animationDelay: '0.3s' } },
      React.createElement('h4', { className: 'mb-sm font-body' }, t('log.monthlyStats')),
      React.createElement(
        'div',
        { className: 'month-stats' },
        React.createElement(
          'div',
          { className: 'month-stat-item' },
          React.createElement('span', { className: 'month-stat-value' }, monthStats.completed ?? 0),
          React.createElement('span', { className: 'month-stat-label' }, t('log.workouts'))
        ),
        React.createElement(
          'div',
          { className: 'month-stat-item' },
          React.createElement('span', { className: 'month-stat-value text-green' }, monthStats.green ?? 0),
          React.createElement('span', { className: 'month-stat-label' }, t('log.green'))
        ),
        React.createElement(
          'div',
          { className: 'month-stat-item' },
          React.createElement('span', { className: 'month-stat-value text-yellow' }, monthStats.yellow ?? 0),
          React.createElement('span', { className: 'month-stat-label' }, t('log.yellow'))
        ),
        React.createElement(
          'div',
          { className: 'month-stat-item' },
          React.createElement('span', { className: 'month-stat-value text-red' }, monthStats.red ?? 0),
          React.createElement('span', { className: 'month-stat-label' }, t('log.red'))
        )
      )
    ),

    /* ═══════════════════ 3. ИСТОРИЯ И УПРАВЛЕНИЕ ═══════════════════ */
    React.createElement(
      'div',
      { className: 'fade-in-up', style: { animationDelay: '0.35s' } },
      React.createElement(CheckinHistory, { checkins })
    ),

    React.createElement(
      'div',
      { className: 'fade-in-up', style: { animationDelay: '0.4s' } },
      React.createElement(SessionLogger, null)
    )
  );
}

function StatBox({ value, label, color }) {
  return React.createElement(
    'div',
    { className: 'stat-box' },
    React.createElement('div', { className: 'stat-value', style: color ? { color } : undefined }, value),
    React.createElement('div', { className: 'stat-label' }, label)
  );
}
