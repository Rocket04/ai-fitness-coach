// js/ui/components/RecoveryVsSleepChart.jsx
// Совмещённый scatter+линия: Recovery Score vs Часы сна (SVG)

import React from 'react';
import { useTranslation } from 'react-i18next';
import styles from './RecoveryVsSleepChart.module.css';

export default function RecoveryVsSleepChart({ data }) {
  const { t } = useTranslation();
  if (!data || data.length < 2) {
    return React.createElement(
      'div',
      { className: styles['recovery-chart-container'] },
      React.createElement('p', { className: 'text-muted text-center text-sm' }, t('log.insufficientDataChart'))
    );
  }

  const width = 320;
  const height = 180;
  const pad = { top: 16, right: 16, bottom: 32, left: 40 };
  const cw = width - pad.left - pad.right;
  const ch = height - pad.top - pad.bottom;

  const sleepValues = data.map(d => d.sleepHours || 0);
  const recoveryValues = data.map(d => d.recoveryScore || 0);
  const minSleep = Math.min(...sleepValues);
  const maxSleep = Math.max(...sleepValues);
  const minRec = Math.min(...recoveryValues);
  const maxRec = Math.max(...recoveryValues);

  const sRange = maxSleep - minSleep || 1;
  const rRange = maxRec - minRec || 1;

  const scaleX = v => pad.left + ((v - minSleep) / sRange) * cw;
  const scaleY = v => pad.top + ch - ((v - minRec) / rRange) * ch;

  // Linear regression line
  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
  const n = data.length;
  for (const d of data) {
    const x = d.sleepHours || 0;
    const y = d.recoveryScore || 0;
    sumX += x; sumY += y; sumXY += x * y; sumX2 += x * x;
  }
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  const lineX1 = minSleep;
  const lineY1 = slope * lineX1 + intercept;
  const lineX2 = maxSleep;
  const lineY2 = slope * lineX2 + intercept;

  const xTicks = [4, 6, 8, 10, 12];
  const yTicks = [20, 40, 60, 80, 100];

  return React.createElement(
    'div',
    { className: styles['recovery-chart-container'] },
    React.createElement(
      'div',
      { className: styles['recovery-chart-container__header'] },
      React.createElement('span', { className: styles['recovery-chart-container__title'] }, 'Recovery Score vs Сон'),
      React.createElement('span', { className: styles['recovery-chart-container__subtitle'] }, `${data.length} дней`)
    ),
    React.createElement(
      'svg',
      { width: '100%', viewBox: `0 0 ${width} ${height}`, className: styles['recovery-chart'] },
      // Grid
      ...xTicks.map(t =>
        React.createElement('line', {
          key: `gx${t}`, x1: scaleX(t), x2: scaleX(t), y1: pad.top, y2: pad.top + ch,
          stroke: 'var(--border)', strokeWidth: 1, opacity: 0.5,
        })
      ),
      ...yTicks.map(t =>
        React.createElement('line', {
          key: `gy${t}`, x1: pad.left, x2: pad.left + cw, y1: scaleY(t), y2: scaleY(t),
          stroke: 'var(--border)', strokeWidth: 1, opacity: 0.5,
        })
      ),
      // Axis labels
      ...xTicks.map(t =>
        React.createElement('text', {
          key: `lx${t}`, x: scaleX(t), y: height - 6,
          fill: 'var(--text3)', fontSize: 9, textAnchor: 'middle',
        }, `${t}ч`)
      ),
      ...yTicks.map(t =>
        React.createElement('text', {
          key: `ly${t}`, x: pad.left - 6, y: scaleY(t) + 3,
          fill: 'var(--text3)', fontSize: 9, textAnchor: 'end',
        }, t)
      ),
      // Trend line
      React.createElement('line', {
        x1: scaleX(lineX1), y1: scaleY(lineY1),
        x2: scaleX(lineX2), y2: scaleY(lineY2),
        stroke: 'var(--blue)', strokeWidth: 2, strokeDasharray: '4 4', opacity: 0.8,
      }),
      // Points
      ...data.map((d, i) =>
        React.createElement('circle', {
          key: i, cx: scaleX(d.sleepHours || 0), cy: scaleY(d.recoveryScore || 0), r: 4,
          fill: 'var(--green)', opacity: 0.85,
        })
      )
    )
  );
}
