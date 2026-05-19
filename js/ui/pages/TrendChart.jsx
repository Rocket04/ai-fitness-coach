// js/ui/pages/TrendChart.js
// Переиспользуемый SVG-график трендов

import React, { useState } from 'react';

/**
 * @param {{ data: Array, yKey: string, color: string, label?: string, unit?: string, height?: number }} props
 */
export default function TrendChart({ data, yKey, color, label, unit = '', height = 160 }) {
  if (!data || data.length < 2) {
    return React.createElement(
      'div',
      { className: 'text-center p-lg text-muted font-body' },
      'Недостаточно данных для графика'
    );
  }

  const points = data
    .map((d, i) => ({ index: i, value: Number(d[yKey]) || 0, date: d.date }))
    .filter(p => p.value > 0);

  if (points.length < 2) {
    return React.createElement(
      'div',
      { className: 'text-center p-lg text-muted font-body' },
      'Недостаточно данных для графика'
    );
  }

  const values = points.map(p => p.value);
  const maxVal = Math.max(...values);
  const minVal = Math.min(...values);
  const range = maxVal - minVal || 1;
  const padding = range * 0.15;
  const yMax = maxVal + padding;
  const yMin = Math.max(0, minVal - padding);
  const yRange = yMax - yMin || 1;

  const pt = 18;
  const pb = 28;
  const pl = 40;
  const pr = 12;
  const chartW = Math.max(points.length * 40, 260);
  const chartH = height;

  const xScale = i => pl + (i / Math.max(points.length - 1, 1)) * (chartW - pl - pr);
  const yScale = v => pt + (1 - (v - yMin) / yRange) * (chartH - pt - pb);

  const lineParts = points.map((p, i) => `${xScale(i)},${yScale(p.value)}`);
  const lineD = 'M' + lineParts.join(' L');

  const firstX = xScale(0);
  const lastX = xScale(points.length - 1);
  const bottomY = yScale(yMin);
  const areaD = `M${firstX},${bottomY} L${lineD.slice(1)} L${lastX},${bottomY} Z`;

  const refValues = [];
  for (let i = 0; i <= 4; i++) {
    refValues.push(yMin + (yRange * i) / 4);
  }

  const maxLabels = Math.min(points.length, Math.floor(chartW / 60));
  const labelInterval = Math.max(1, Math.floor(points.length / maxLabels));

  const minStat = Math.round(minVal);
  const maxStat = Math.round(maxVal);
  const avgStat = Math.round(values.reduce((a, b) => a + b, 0) / values.length);
  const lastVal = points[points.length - 1].value;
  const firstVal = points[0].value;
  const trend = lastVal > firstVal ? 'up' : lastVal < firstVal ? 'down' : 'flat';
  const trendColor = trend === 'up' ? 'var(--green)' : trend === 'down' ? 'var(--red)' : 'var(--text3)';
  const trendArrow = trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→';

  const [hoveredIndex, setHoveredIndex] = useState(null);
  const baseline = values.reduce((a, b) => a + b, 0) / values.length;

  return React.createElement(
    'div',
    null,
    // Stats summary
    React.createElement(
      'div',
      { className: 'chart-stats' },
      React.createElement('span', null,
        'Мин: ', React.createElement('span', { className: 'chart-stat-value' }, minStat), ' ', unit
      ),
      React.createElement('span', null,
        'Ср: ', React.createElement('span', { className: 'chart-stat-value' }, avgStat), ' ', unit
      ),
      React.createElement('span', null,
        'Макс: ', React.createElement('span', { className: 'chart-stat-value' }, maxStat), ' ', unit
      ),
      React.createElement('span', { className: 'font-weight-600', style: { color: trendColor } },
        trendArrow, ' ', lastVal.toFixed(0), unit
      )
    ),
    // Chart
    React.createElement(
      'div',
      { className: 'overflow-x-auto overflow-y-hidden mt-xs', style: { WebkitOverflowScrolling: 'touch' } },
      React.createElement(
        'div',
        { className: 'relative', style: { display: 'inline-block' } },
        React.createElement(
          'svg',
          {
            width: chartW,
            height: chartH,
            viewBox: `0 0 ${chartW} ${chartH}`,
            style: { display: 'block', minWidth: '260px' },
          },
          // Grid lines Y
          refValues.map((v, i) =>
            React.createElement('line', {
              key: 'grid-' + i,
              x1: pl,
              y1: yScale(v),
              x2: chartW - pr,
              y2: yScale(v),
              stroke: 'var(--border)',
              strokeWidth: 1,
              strokeDasharray: '3,3',
            })
          ),
          // Baseline line
          React.createElement('line', {
            x1: pl,
            y1: yScale(baseline),
            x2: chartW - pr,
            y2: yScale(baseline),
            stroke: color,
            strokeWidth: 1,
            strokeDasharray: '4,4',
            strokeOpacity: 0.4,
          }),
          // Y labels
          refValues.map((v, i) =>
            React.createElement('text', {
              key: 'ylabel-' + i,
              x: pl - 6,
              y: yScale(v) + 4,
              textAnchor: 'end',
              fill: 'var(--text3)',
              fontSize: '10',
              fontFamily: 'var(--font-mono)',
            }, Math.round(v))
          ),
          // Area fill
          React.createElement('path', {
            d: areaD,
            fill: color,
            fillOpacity: 0.08,
          }),
          // Data line
          React.createElement('path', {
            d: lineD,
            fill: 'none',
            stroke: color,
            strokeWidth: 2,
            strokeLinejoin: 'round',
            strokeLinecap: 'round',
          }),
          // Data points
          points.map((p, i) =>
            React.createElement('circle', {
              key: 'dot-' + i,
              cx: xScale(i),
              cy: yScale(p.value),
              r: 3,
              fill: color,
              stroke: 'var(--bg)',
              strokeWidth: 1.5,
            })
          ),
          // Hit areas for tooltips
          points.map((p, i) =>
            React.createElement('circle', {
              key: 'hit-' + i,
              cx: xScale(i),
              cy: yScale(p.value),
              r: 12,
              fill: 'transparent',
              stroke: 'none',
              className: 'cursor-pointer',
              onMouseEnter: () => setHoveredIndex(i),
              onMouseLeave: () => setHoveredIndex(null),
              onTouchStart: (e) => { e.stopPropagation(); setHoveredIndex(i); },
              onTouchEnd: () => setHoveredIndex(null),
            })
          ),
          // X labels
          points
            .filter((_, i) => i % labelInterval === 0 || i === points.length - 1)
            .map((p, _i, filtered) => {
              const i = points.indexOf(p);
              const d = p.date ? p.date.slice(5) : '';
              return React.createElement('text', {
                key: 'xlabel-' + i,
                x: xScale(i),
                y: chartH - 6,
                textAnchor: 'middle',
                fill: 'var(--text3)',
                fontSize: '9',
                fontFamily: 'var(--font-mono)',
              }, d);
            })
        ),
        // Tooltip
        hoveredIndex !== null && React.createElement(
          'div',
          {
            className: 'absolute font-caption font-mono',
            style: {
              position: 'absolute',
              left: xScale(hoveredIndex),
              top: yScale(points[hoveredIndex].value) - 8,
              transform: 'translate(-50%, -100%)',
              backgroundColor: 'var(--surface)',
              color: 'var(--text)',
              padding: 'var(--spacing-xs) var(--spacing-sm)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border)',
              pointerEvents: 'none',
              whiteSpace: 'nowrap',
              zIndex: 10,
              boxShadow: 'var(--shadow-card)',
            }
          },
          React.createElement('div', { style: { fontWeight: 600 } }, points[hoveredIndex].date ? points[hoveredIndex].date.slice(5) : ''),
          React.createElement('div', null, Math.round(points[hoveredIndex].value), ' ', unit)
        )
      )
    )
  );
}
