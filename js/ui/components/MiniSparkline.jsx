// js/ui/components/MiniSparkline.jsx
// Компактный SVG-спарклайн для чек-ин метрик

import React from 'react';

export default function MiniSparkline({ data, width = 120, height = 32, color = 'var(--green)', emptyText = '—' }) {
  if (!data || data.length < 2) {
    return React.createElement(
      'span',
      { className: 'sparkline--empty', style: { width, height } },
      emptyText
    );
  }

  const values = data.map(v => (typeof v === 'number' ? v : 0));
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const padding = 2;
  const chartW = width - padding * 2;
  const chartH = height - padding * 2;

  const points = values.map((v, i) => {
    const x = padding + (i / (values.length - 1)) * chartW;
    const y = padding + chartH - ((v - min) / range) * chartH;
    return `${x},${y}`;
  }).join(' ');

  const lastX = padding + chartW;
  const lastY = padding + chartH - ((values[values.length - 1] - min) / range) * chartH;

  return React.createElement(
    'svg',
    { width, height, className: 'sparkline', viewBox: `0 0 ${width} ${height}` },
    React.createElement('polyline', {
      points,
      fill: 'none',
      stroke: color,
      strokeWidth: 2,
      strokeLinecap: 'round',
      strokeLinejoin: 'round',
      opacity: 0.85,
    }),
    React.createElement('circle', { cx: lastX, cy: lastY, r: 3, fill: color })
  );
}
