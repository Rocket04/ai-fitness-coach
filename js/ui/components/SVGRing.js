// js/ui/components/SVGRing.js
// Переиспользуемый компонент кольцевого индикатора прогресса

import React from 'react';

/**
 * @param {{
 *   value: number,       — значение 0–100 (заполнение кольца)
 *   size?: number,       — диаметр SVG (default 88)
 *   strokeWidth?: number,— толщина кольца (default 4)
 *   color: string,       — цвет заполнения
 *   label?: string,      — текст в центре
 *   sublabel?: string,   — подпись под label
 * }} props
 */
export default function SVGRing({ value = 75, size = 88, strokeWidth = 4, color, label, sublabel }) {
  const r = (size / 2) - strokeWidth - 4;
  const circumference = 2 * Math.PI * r;
  const offset = circumference * (1 - Math.min(100, Math.max(0, value)) / 100);

  return React.createElement(
    'svg',
    { width: size, height: size, viewBox: `0 0 ${size} ${size}`, style: { flexShrink: 0 } },
    // Background ring
    React.createElement('circle', {
      className: 'readiness-ring',
      cx: size / 2,
      cy: size / 2,
      r: r,
      fill: 'none',
      stroke: 'var(--surface3)',
      strokeWidth: strokeWidth,
    }),
    // Value ring
    React.createElement('circle', {
      className: 'readiness-ring',
      cx: size / 2,
      cy: size / 2,
      r: r,
      fill: 'none',
      stroke: color,
      strokeWidth: strokeWidth,
      strokeDasharray: circumference,
      strokeDashoffset: offset,
      strokeLinecap: 'round',
      transform: `rotate(-90 ${size / 2} ${size / 2})`,
    }),
    // Center label
    label && React.createElement('text', {
      x: size / 2,
      y: sublabel ? size / 2 - 6 : size / 2,
      textAnchor: 'middle',
      dominantBaseline: 'central',
      fill: color,
      fontSize: 'var(--font-size-body)',
      fontWeight: '700',
    }, label),
    // Sublabel
    sublabel && React.createElement('text', {
      x: size / 2,
      y: size / 2 + 12,
      textAnchor: 'middle',
      dominantBaseline: 'central',
      fill: 'var(--text3)',
      fontSize: 'var(--font-size-caption)',
      fontWeight: '500',
    }, sublabel)
  );
}
