// js/ui/components/CorrelationCard.jsx
// Карточка корреляции с инсайтом

import React from 'react';

export default function CorrelationCard({ result }) {
  if (!result || result.sampleSize < 2) return null;

  const hasDelta = result.deltaPercent !== null;
  const isPositive = (result.deltaPercent ?? 0) > 0;
  const accent = hasDelta ? (isPositive ? 'var(--green)' : 'var(--red)') : 'var(--text3)';

  return React.createElement(
    'div',
    { className: 'correlation-card' },
    React.createElement(
      'div',
      { className: 'correlation-card__header' },
      React.createElement('span', { className: 'correlation-card__icon' }, result.icon),
      React.createElement('span', { className: 'correlation-card__title' }, result.title)
    ),
    React.createElement(
      'p',
      { className: 'correlation-card__insight', style: { color: accent } },
      result.insight
    ),
    React.createElement(
      'span',
      { className: 'correlation-card__sample' },
      `n=${result.sampleSize}`
    )
  );
}
