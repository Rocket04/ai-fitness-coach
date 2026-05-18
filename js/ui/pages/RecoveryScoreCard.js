// js/ui/pages/RecoveryScoreCard.js
// SVG кольцо готовности + индикатор восстановления

import React from 'react';

const READINESS_LABELS = { green: 'Зелёный', yellow: 'Жёлтый', red: 'Красный' };

export function ReadinessIndicator({ readiness, autoReadiness, manualOverride, onManualOverrideChange }) {
  const isOverridden = manualOverride && manualOverride !== 'unknown';
  const ringColor = readiness === 'green' ? 'var(--green)' : readiness === 'yellow' ? 'var(--yellow)' : 'var(--red)';
  const circumference = 2 * Math.PI * 36;

  return React.createElement(
    'div',
    { className: 'card', style: { textAlign: 'center' } },
    // Ring + status display
    React.createElement(
      'div',
      { style: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem' } },
      // SVG ring
      React.createElement(
        'svg',
        { width: '88', height: '88', viewBox: '0 0 88 88', style: { flexShrink: 0 } },
        React.createElement('circle', {
          className: 'readiness-ring',
          cx: '44', cy: '44', r: '36',
          fill: 'none',
          stroke: 'var(--surface3)',
          strokeWidth: '4',
        }),
        React.createElement('circle', {
          className: 'readiness-ring',
          cx: '44', cy: '44', r: '36',
          fill: 'none',
          stroke: ringColor,
          strokeWidth: '4',
          strokeDasharray: circumference,
          strokeDashoffset: circumference * 0.25,
          strokeLinecap: 'round',
          opacity: '0.5',
        }),
        React.createElement('circle', {
          className: 'readiness-ring',
          cx: '44', cy: '44', r: '28',
          fill: 'none',
          stroke: ringColor,
          strokeWidth: '4',
          strokeDasharray: circumference * 0.78,
          strokeDashoffset: '0',
          strokeLinecap: 'round',
          opacity: '0.8',
        }),
        React.createElement('text', {
          x: '44', y: '44',
          textAnchor: 'middle',
          dominantBaseline: 'central',
          fill: ringColor,
          fontSize: '14',
          fontWeight: '700',
        }, READINESS_LABELS[readiness] || readiness),
        React.createElement('text', {
          x: '44', y: '60',
          textAnchor: 'middle',
          dominantBaseline: 'central',
          fill: 'var(--text3)',
          fontSize: '8',
          fontWeight: '500',
        }, isOverridden ? 'ручной' : 'статус')
      ),
      // Status label
      React.createElement(
        'div',
        { style: { textAlign: 'left' } },
        React.createElement('div', { className: 'score-display', style: { color: ringColor, fontSize: '1.8rem' } },
          READINESS_LABELS[readiness] || readiness
        ),
        React.createElement('div', { className: 'score-label' }, 'Готовность')
      )
    ),
    // Balance chips
    React.createElement(
      'div',
      { className: 'balance-row', style: { justifyContent: 'center' } },
      React.createElement('span', { className: `balance-chip ${readiness === 'green' ? 'green' : readiness === 'yellow' ? 'yellow' : 'red'}` }, '● HRV'),
      React.createElement('span', { className: `balance-chip ${readiness === 'green' ? 'green' : readiness === 'yellow' ? 'yellow' : 'red'}` }, '● Восст.'),
      React.createElement('span', { className: `balance-chip ${readiness === 'red' ? 'red' : readiness === 'yellow' ? 'yellow' : 'green'}` }, '● Субъект.')
    ),
    // Manual override buttons
    React.createElement(
      'div',
      { style: { display: 'flex', gap: '0.375rem', justifyContent: 'center', marginTop: '0.75rem' } },
      React.createElement(
        'button',
        {
          className: `btn btn-sm ${manualOverride === 'unknown' ? 'btn-accent' : 'btn-outline'}`,
          onClick: () => onManualOverrideChange('unknown'),
          style: { fontSize: '0.78rem' },
        },
        'Авто'
      ),
      ['green', 'yellow', 'red'].map(color =>
        React.createElement(
          'button',
          {
            key: color,
            className: `btn btn-sm ${manualOverride === color ? 'btn-accent' : 'btn-outline'}`,
            onClick: () => onManualOverrideChange(color),
            style: {
              fontSize: '0.78rem',
              borderLeft: `3px solid var(--${color})`,
            },
          },
          { green: 'Г', yellow: 'Ж', red: 'К' }[color]
        )
      )
    ),
    React.createElement(
      'div',
      { className: 'text-xs', style: { color: 'var(--text3)', marginTop: '0.35rem' } },
      'Авто: ', READINESS_LABELS[autoReadiness] || autoReadiness
    )
  );
}

export function RecoveryBar({ score }) {
  const color = score >= 80 ? 'var(--green)' : score >= 60 ? 'var(--yellow)' : 'var(--red)';
  return React.createElement(
    'div',
    { className: 'card', style: { padding: '0.75rem 1rem' } },
    React.createElement(
      'div',
      { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' } },
      React.createElement('span', { className: 'text-sm', style: { fontWeight: 500 } }, 'Восстановление'),
      React.createElement('strong', { style: { color, fontSize: '1.1rem' } }, `${score}%`)
    ),
    React.createElement(
      'div',
      { className: 'recovery-bar' },
      React.createElement('div', {
        className: 'recovery-bar-fill',
        style: { width: `${score}%`, backgroundColor: color },
      })
    )
  );
}
