// js/ui/components/TomorrowPreview.jsx
// Блок «Завтра» — тип тренировки, режим и топ-3 упражнения

import React from 'react';

const TYPE_LABEL = { A: 'Тренировка A', B: 'Тренировка B', C: 'Тренировка C' };
const MODE_LABEL = { full: 'Полная', yellow: 'Облегчённая', minimum: 'Минимум' };
const MODE_COLOR = { full: 'var(--green)', yellow: 'var(--yellow)', minimum: 'var(--red)' };

export default function TomorrowPreview({ tomorrowPlan, tomorrowType }) {
  if (!tomorrowType || !tomorrowPlan) {
    return React.createElement(
      'div',
      { className: 'tomorrow-preview' },
      React.createElement(
        'div',
        { className: 'tomorrow-preview__header' },
        React.createElement('span', { className: 'tomorrow-preview__title' }, 'Завтра'),
        React.createElement(
          'span',
          { className: 'tomorrow-preview__badge', style: { color: 'var(--text3)' } },
          'Отдых'
        )
      )
    );
  }

  const typeLabel = TYPE_LABEL[tomorrowType] || `Тренировка ${tomorrowType}`;
  const mode = tomorrowPlan.mode || 'full';
  const modeLabel = MODE_LABEL[mode] || mode;
  const modeColor = MODE_COLOR[mode] || 'var(--text2)';
  const topExercises = (tomorrowPlan.exercises || []).slice(0, 3);

  return React.createElement(
    'div',
    { className: 'tomorrow-preview' },
    React.createElement(
      'div',
      { className: 'tomorrow-preview__header' },
      React.createElement('span', { className: 'tomorrow-preview__title' }, `Завтра — ${typeLabel}`),
      React.createElement(
        'span',
        { className: 'tomorrow-preview__badge', style: { color: modeColor } },
        modeLabel
      )
    ),
    topExercises.length > 0 && React.createElement(
      'div',
      { className: 'tomorrow-preview__exercises' },
      topExercises.map((ex, i) =>
        React.createElement(
          'div',
          { key: i, className: 'tomorrow-preview__exercise' },
          React.createElement('span', { className: 'tomorrow-preview__exercise-name' }, ex.n),
          React.createElement(
            'span',
            { className: 'tomorrow-preview__exercise-sets' },
            `${ex.s}\u00d7${ex.r}`
          )
        )
      ),
      tomorrowPlan.exercises && tomorrowPlan.exercises.length > 3 && React.createElement(
        'div',
        { className: 'font-caption text-secondary', style: { paddingTop: '2px' } },
        `+${tomorrowPlan.exercises.length - 3} упражнений`
      )
    )
  );
}
