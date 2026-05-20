// js/ui/pages/WeeklySummary.js
// Сводка за неделю (используется в Analytics)

import React from 'react';
import { useTranslation } from 'react-i18next';

export default function WeeklySummary({ weeklySummary, monthStats }) {
  const { t } = useTranslation();
  if (!weeklySummary) return null;

  return React.createElement(
    'div',
    { className: 'card' },
    React.createElement(
      'h4',
      { className: 'mb-sm font-body text-secondary', style: { textTransform: 'uppercase', letterSpacing: '0.03em' } },
      t('log.weeklyStats')
    ),
    React.createElement(
      'div',
      { className: 'month-stats' },
      React.createElement(
        'div',
        { className: 'month-stat-item' },
        React.createElement('span', { className: 'month-stat-value' }, weeklySummary.completed || 0),
        React.createElement('span', { className: 'month-stat-label' }, t('log.workouts'))
      ),
      React.createElement(
        'div',
        { className: 'month-stat-item' },
        React.createElement(
          'span',
          { className: `month-stat-value ${weeklySummary.avgRPE !== null ? 'text-primary' : 'text-secondary'}` },
          weeklySummary.avgRPE !== null ? weeklySummary.avgRPE : '—'
        ),
        React.createElement('span', { className: 'month-stat-label' }, t('log.avgRPE'))
      ),
      React.createElement(
        'div',
        { className: 'month-stat-item' },
        React.createElement('span', { className: 'month-stat-value text-green' }, weeklySummary.green || 0),
        React.createElement('span', { className: 'month-stat-label' }, t('log.green'))
      ),
      React.createElement(
        'div',
        { className: 'month-stat-item' },
        React.createElement('span', { className: 'month-stat-value text-yellow' }, weeklySummary.yellow || 0),
        React.createElement('span', { className: 'month-stat-label' }, t('log.yellow'))
      ),
      React.createElement(
        'div',
        { className: 'month-stat-item' },
        React.createElement('span', { className: 'month-stat-value text-red' }, weeklySummary.red || 0),
        React.createElement('span', { className: 'month-stat-label' }, t('log.red'))
      )
    )
  );
}
