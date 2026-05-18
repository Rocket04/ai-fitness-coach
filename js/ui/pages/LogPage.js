// js/ui/pages/LogPage.js
// Страница дневника — чек-ин, статистика, история

import React, { useContext } from 'react';
import { AppStateContext } from '../../core/AppContext.js';
import StatBox from '../components/StatBox.js';
import CheckinForm from './CheckinForm.js';
import SessionLogger from './SessionLogger.js';

export default function LogPage() {
  const state = useContext(AppStateContext);
  const { monthStats, weeklySummary } = state;

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
      React.createElement('h4', { style: { margin: '0 0 0.75rem 0', fontSize: '0.9rem' } }, 'Статистика недели'),
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
      React.createElement('h4', { style: { margin: '0 0 0.75rem 0', fontSize: '0.9rem' } }, 'Статистика месяца'),
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
          React.createElement('span', { className: 'month-stat-value', style: { color: 'var(--green)' } }, monthStats.green ?? 0),
          React.createElement('span', { className: 'month-stat-label' }, 'Зелёных')
        ),
        React.createElement(
          'div',
          { className: 'month-stat-item' },
          React.createElement('span', { className: 'month-stat-value', style: { color: 'var(--yellow)' } }, monthStats.yellow ?? 0),
          React.createElement('span', { className: 'month-stat-label' }, 'Жёлтых')
        ),
        React.createElement(
          'div',
          { className: 'month-stat-item' },
          React.createElement('span', { className: 'month-stat-value', style: { color: 'var(--red)' } }, monthStats.red ?? 0),
          React.createElement('span', { className: 'month-stat-label' }, 'Красных')
        )
      )
    ),

    /* ═══════════════════ SESSION HISTORY + TESTS + EXPORT ═══════════════════ */
    React.createElement(SessionLogger, null)
  );
}
