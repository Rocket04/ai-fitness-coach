// js/ui/pages/WeeklySummary.js
// Сводка за неделю (используется в Analytics)

import React from 'react';

export default function WeeklySummary({ weeklySummary, monthStats }) {
  if (!weeklySummary) return null;

  return React.createElement(
    'div',
    { className: 'card' },
    React.createElement(
      'h4',
      { style: { margin: '0 0 var(--spacing-sm) 0', fontSize: 'var(--font-size-body)', color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.03em' } },
      'Сводка за неделю'
    ),
    React.createElement(
      'div',
      { className: 'month-stats' },
      React.createElement(
        'div',
        { className: 'month-stat-item' },
        React.createElement('span', { className: 'month-stat-value' }, weeklySummary.completed || 0),
        React.createElement('span', { className: 'month-stat-label' }, 'тренировок')
      ),
      React.createElement(
        'div',
        { className: 'month-stat-item' },
        React.createElement(
          'span',
          { className: 'month-stat-value', style: { color: weeklySummary.avgRPE !== null ? 'var(--text)' : 'var(--text2)' } },
          weeklySummary.avgRPE !== null ? weeklySummary.avgRPE : '—'
        ),
        React.createElement('span', { className: 'month-stat-label' }, 'ср. RPE')
      ),
      React.createElement(
        'div',
        { className: 'month-stat-item' },
        React.createElement('span', { className: 'month-stat-value', style: { color: 'var(--green)' } }, weeklySummary.green || 0),
        React.createElement('span', { className: 'month-stat-label' }, 'зелёных')
      ),
      React.createElement(
        'div',
        { className: 'month-stat-item' },
        React.createElement('span', { className: 'month-stat-value', style: { color: 'var(--yellow)' } }, weeklySummary.yellow || 0),
        React.createElement('span', { className: 'month-stat-label' }, 'жёлтых')
      ),
      React.createElement(
        'div',
        { className: 'month-stat-item' },
        React.createElement('span', { className: 'month-stat-value', style: { color: 'var(--red)' } }, weeklySummary.red || 0),
        React.createElement('span', { className: 'month-stat-label' }, 'красных')
      )
    ),
    monthStats && React.createElement(
      'div',
      { style: { marginTop: 'var(--spacing-sm)', display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-size-body)', color: 'var(--text3)' } },
      React.createElement('span', null, 'За месяц:'),
      React.createElement('span', null,
        monthStats.completed, ' тренировок (зел: ', monthStats.green,
        ', ж: ', monthStats.yellow, ', к: ', monthStats.red, ')'
      )
    )
  );
}
