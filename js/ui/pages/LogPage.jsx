// js/ui/pages/LogPage.js
// Страница дневника — чек-ин, статистика, история

import React, { } from 'react';
import { useAppStore } from '../../stores/useAppStore.js';
import StatBox from '../components/StatBox.jsx';
import CheckinForm from './CheckinForm.jsx';
import SessionLogger from './SessionLogger.jsx';
import CheckinHistory from '../components/CheckinHistory.jsx';

export default function LogPage() {
  const state = useAppStore();
  
  // Add safeguard for context availability
  if (!state) {
    return React.createElement('div', { className: 'card' }, 'Загрузка контекста...');
  }
  
  const { monthStats, weeklySummary, checkins } = state;

  return React.createElement(
    'div',
    { className: 'page-enter' },
    React.createElement('h2', null, 'Дневник'),

    /* ═══════════════════ CHECK-IN FORM ═══════════════════ */
    React.createElement(CheckinForm, null),

    /* ═══════════════════ WEEKLY SUMMARY ═══════════════════ */
    React.createElement(
      'div',
      { className: 'card' },
      React.createElement('h4', { className: 'mb-sm font-body' }, 'Статистика недели'),
      React.createElement(
        'div',
        { className: 'stat-grid' },
        React.createElement(StatBox, { value: weeklySummary.completed, label: 'Тренировок' }),
        React.createElement(StatBox, { value: weeklySummary.avgRPE ?? '—', label: 'Средний RPE' }),
        React.createElement(StatBox, {
          value: weeklySummary.green ?? 0,
          label: 'Зелёных',
          color: 'var(--green)',
        }),
        React.createElement(StatBox, {
          value: weeklySummary.yellow ?? 0,
          label: 'Жёлтых',
          color: 'var(--yellow)',
        }),
        React.createElement(StatBox, {
          value: weeklySummary.red ?? 0,
          label: 'Красных',
          color: 'var(--red)',
        })
      )
    ),

    /* ═══════════════════ MONTH STATS ═══════════════════ */
    React.createElement(
      'div',
      { className: 'card' },
      React.createElement('h4', { className: 'mb-sm font-body' }, 'Статистика месяца'),
      React.createElement(
        'div',
        { className: 'month-stats' },
        React.createElement(
          'div',
          { className: 'month-stat-item' },
          React.createElement('span', { className: 'month-stat-value' }, monthStats.completed ?? 0),
          React.createElement('span', { className: 'month-stat-label' }, 'Тренировок')
        ),
        React.createElement(
          'div',
          { className: 'month-stat-item' },
          React.createElement('span', { className: 'month-stat-value text-green' }, monthStats.green ?? 0),
          React.createElement('span', { className: 'month-stat-label' }, 'Зелёных')
        ),
        React.createElement(
          'div',
          { className: 'month-stat-item' },
          React.createElement('span', { className: 'month-stat-value text-yellow' }, monthStats.yellow ?? 0),
          React.createElement('span', { className: 'month-stat-label' }, 'Жёлтых')
        ),
        React.createElement(
          'div',
          { className: 'month-stat-item' },
          React.createElement('span', { className: 'month-stat-value text-red' }, monthStats.red ?? 0),
          React.createElement('span', { className: 'month-stat-label' }, 'Красных')
        )
      )
    ),

    /* ═══════════════════ CHECKIN HISTORY ═══════════════════ */
    React.createElement(CheckinHistory, { checkins }),

    /* ═══════════════════ SESSION HISTORY + TESTS + EXPORT ═══════════════════ */
    React.createElement(SessionLogger, null)
  );
}
