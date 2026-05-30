// js/ui/components/TrendIndicator.jsx
// Индикатор тренда (↑/↓) относительно 7-дневного среднего

import React from 'react';
import styles from './TrendIndicator.module.css';

export default function TrendIndicator({ current, history, unit = '', inverse = false }) {
  if (!history || history.length < 2 || current === undefined || current === null) {
    return null;
  }
  const valid = history.filter(v => typeof v === 'number' && v > 0);
  if (valid.length < 2) return null;
  const avg = valid.reduce((a, b) => a + b, 0) / valid.length;
  const diff = current - avg;
  const pct = avg !== 0 ? Math.round((diff / avg) * 100) : 0;

  let isPositive = diff > 0;
  if (inverse) isPositive = !isPositive;

  const arrow = isPositive ? '↑' : diff < 0 ? '↓' : '→';
  const color = isPositive ? 'var(--green)' : diff < 0 ? 'var(--red)' : 'var(--text3)';

  return React.createElement(
    'span',
    { className: styles['trend-indicator'], style: { color } },
    `${arrow} ${Math.abs(pct)}%`
  );
}
