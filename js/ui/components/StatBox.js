// js/ui/components/StatBox.js
// Переиспользуемый компонент отображения статистики (метка + значение + опциональный тренд)

import React from 'react';

/**
 * @param {{ value: string|number, label: string, color?: string, trend?: 'up'|'down'|'flat' }} props
 */
export default function StatBox({ value, label, color, trend }) {
  const trendArrow = trend === 'up' ? '↑' : trend === 'down' ? '↓' : trend === 'flat' ? '→' : null;
  const trendColor = trend === 'up' ? 'var(--green)' : trend === 'down' ? 'var(--red)' : 'var(--text3)';

  return React.createElement(
    'div',
    { className: 'stat-box' },
    React.createElement(
      'div',
      { className: 'stat-value', style: color ? { color } : {} },
      value,
      trendArrow && React.createElement(
        'span',
        { style: { marginLeft: '0.25rem', fontSize: '0.75em', color: trendColor } },
        trendArrow
      )
    ),
    React.createElement('div', { className: 'stat-label' }, label)
  );
}
