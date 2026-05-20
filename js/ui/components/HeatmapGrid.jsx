// js/ui/components/HeatmapGrid.jsx
// Тепловая карта 7 дней × 4 метрики (Recovery, HRV, Sleep, Readiness)

import React from 'react';

function getDayLabel(dateStr) {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('ru-RU', { weekday: 'short' });
}

function cellColor(value, min, max, invert = false) {
  if (value === undefined || value === null || value === 0) return 'var(--surface3)';
  let t = max === min ? 0.5 : (value - min) / (max - min);
  if (invert) t = 1 - t;
  // Green scale: dark surface -> bright green
  if (t >= 0.75) return '#4ade80';
  if (t >= 0.5) return 'color-mix(in srgb, #4ade80 60%, var(--surface3))';
  if (t >= 0.25) return 'color-mix(in srgb, #4ade80 30%, var(--surface3))';
  return 'var(--surface3)';
}

function readinessDot(status) {
  const map = { green: 'var(--green)', yellow: 'var(--yellow)', red: 'var(--red)' };
  return map[status] || 'var(--surface3)';
}

export default function HeatmapGrid({ data }) {
  if (!data || data.length === 0) {
    return React.createElement(
      'div',
      { className: 'heatmap-grid' },
      React.createElement('p', { className: 'text-secondary text-center' }, 'Нет данных для тепловой карты')
    );
  }

  const days = data.slice(-7);
  const recValues = days.map(d => d.recoveryScore || 0).filter(v => v > 0);
  const hrvValues = days.map(d => d.hrv || 0).filter(v => v > 0);
  const sleepValues = days.map(d => d.sleepHours || 0).filter(v => v > 0);

  const recMin = recValues.length ? Math.min(...recValues) : 0;
  const recMax = recValues.length ? Math.max(...recValues) : 100;
  const hrvMin = hrvValues.length ? Math.min(...hrvValues) : 0;
  const hrvMax = hrvValues.length ? Math.max(...hrvValues) : 200;
  const sleepMin = sleepValues.length ? Math.min(...sleepValues) : 0;
  const sleepMax = sleepValues.length ? Math.max(...sleepValues) : 12;

  const rows = [
    { key: 'recovery', label: 'Recovery', get: d => d.recoveryScore, min: recMin, max: recMax },
    { key: 'hrv', label: 'HRV', get: d => d.hrv, min: hrvMin, max: hrvMax },
    { key: 'sleep', label: 'Сон', get: d => d.sleepHours, min: sleepMin, max: sleepMax },
    { key: 'readiness', label: 'Готовность', get: d => d.readiness },
  ];

  return React.createElement(
    'div',
    { className: 'heatmap-grid' },
    React.createElement(
      'div',
      { className: 'heatmap-grid__header' },
      React.createElement('span', { className: 'heatmap-grid__title' }, 'Недельная тепловая карта'),
      React.createElement('span', { className: 'heatmap-grid__subtitle' }, `${days.length} дней`)
    ),
    React.createElement(
      'div',
      { className: 'heatmap-grid__table' },
      // Header row with day labels
      React.createElement(
        'div',
        { className: 'heatmap-grid__row heatmap-grid__row--header' },
        React.createElement('div', { className: 'heatmap-grid__label' }, ''),
        ...days.map((d, i) =>
          React.createElement('div', { key: i, className: 'heatmap-grid__day' }, getDayLabel(d.date))
        )
      ),
      // Data rows
      ...rows.map(row =>
        React.createElement(
          'div',
          { key: row.key, className: 'heatmap-grid__row' },
          React.createElement('div', { className: 'heatmap-grid__label' }, row.label),
          ...days.map((d, i) => {
            const val = row.get(d);
            if (row.key === 'readiness') {
              return React.createElement('div', {
                key: i,
                className: 'heatmap-grid__cell heatmap-grid__cell--dot',
                style: { background: readinessDot(val) },
              });
            }
            const isEmpty = val === undefined || val === null || val === 0;
            return React.createElement('div', {
              key: i,
              className: 'heatmap-grid__cell',
              style: { background: isEmpty ? 'var(--surface3)' : cellColor(val, row.min, row.max, row.key === 'hrv') },
              title: isEmpty ? '' : `${val}`,
            });
          })
        )
      )
    )
  );
}
