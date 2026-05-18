// js/ui/components/ScaleSelector.js
// Переиспользуемый компонент выбора шкалы 1–5 (для RPE, боли и т.д.)

import React from 'react';

/**
 * @param {{ value: number, onChange: (v: number) => void, labels?: Object, max?: number }} props
 */
export default function ScaleSelector({ value, onChange, labels, max = 5 }) {
  const options = Array.from({ length: max }, (_, i) => i + 1);

  return React.createElement(
    'div',
    { style: { display: 'flex', flexDirection: 'column', gap: '0.15rem' } },
    React.createElement(
      'div',
      { style: { display: 'flex', gap: '0.2rem' } },
      options.map(v =>
        React.createElement('button', {
          key: v,
          className: `chip chip-scale ${value === v ? 'active' : ''}`,
          onClick: () => onChange(v),
        }, String(v))
      )
    ),
    React.createElement(
      'div',
      { style: { fontSize: '0.68rem', color: 'var(--text3)', minHeight: '1em', paddingLeft: '0.125rem' } },
      value > 0 && labels ? (labels[value] || '') : '—'
    )
  );
}
