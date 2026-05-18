// js/ui/pages/RecoveryScoreCard.js
// SVG кольцо готовности + индикатор восстановления

import React from 'react';

const READINESS_LABELS = { green: 'Зелёный', yellow: 'Жёлтый', red: 'Красный' };

export function ReadinessIndicator({ readiness, autoReadiness, manualOverride, onManualOverrideChange, lastCheckin, recoveryScore }) {
  const [showSubjTooltip, setShowSubjTooltip] = React.useState(false);
  const isOverridden = manualOverride && manualOverride !== 'unknown';

  const hrvValue = lastCheckin?.hrv ? `${lastCheckin.hrv} мс` : '\u2014';
  const recoveryValue = typeof recoveryScore === 'number' ? `${recoveryScore}%` : '\u2014';
  const subjectiveValue = (() => {
    if (!lastCheckin) return '\u2014';
    const mood = Number(lastCheckin.mood);
    const stress = Number(lastCheckin.stress);
    if (!mood && !stress) return '\u2014';
    const avg = Math.round((mood || 0) + (stress || 0)) / 2;
    return `${avg}/5`;
  })();
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
          fontSize: '10',
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
      React.createElement('span', { className: `balance-chip ${readiness === 'green' ? 'green' : readiness === 'yellow' ? 'yellow' : 'red'}` }, `\u25CF HRV ${hrvValue}`),
      React.createElement('span', { className: `balance-chip ${readiness === 'green' ? 'green' : readiness === 'yellow' ? 'yellow' : 'red'}` }, `\u25CF Восст. ${recoveryValue}`),
      React.createElement(
        'span',
        { style: { position: 'relative', display: 'inline-block' } },
        React.createElement('span', { className: `balance-chip ${readiness === 'red' ? 'red' : readiness === 'yellow' ? 'yellow' : 'green'}` },
          `\u25CF Субъект. ${subjectiveValue}`,
          React.createElement(
            'button',
            {
              onClick: () => setShowSubjTooltip(v => !v),
              style: {
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'inherit',
                fontSize: '0.7rem',
                padding: '0 0 0 0.2rem',
                lineHeight: 1,
                opacity: 0.7,
              },
              title: 'Подробнее о порогах',
              'aria-label': 'Подробнее о порогах',
            },
            '(?)'
          )
        ),
        showSubjTooltip && React.createElement(
          'div',
          {
            style: {
              position: 'absolute',
              top: '100%',
              left: '0',
              marginTop: '0.35rem',
              background: 'var(--surface2)',
              border: '1px solid var(--surface3)',
              borderRadius: '0.5rem',
              padding: '0.5rem 0.75rem',
              fontSize: '0.72rem',
              color: 'var(--text2)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              zIndex: 10,
              whiteSpace: 'nowrap',
            },
          },
          'Пороги основаны на данных профессиональных спортсменов, могут требовать индивидуальной калибровки.'
        )
      )
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
  const [showTooltip, setShowTooltip] = React.useState(false);
  const color = score >= 80 ? 'var(--green)' : score >= 60 ? 'var(--yellow)' : 'var(--red)';
  return React.createElement(
    'div',
    { className: 'card', style: { padding: '0.75rem 1rem', position: 'relative' } },
    React.createElement(
      'div',
      { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' } },
      React.createElement('span', { className: 'text-sm', style: { fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.35rem' } },
        'Восстановление',
        React.createElement(
          'button',
          {
            onClick: () => setShowTooltip(v => !v),
            style: {
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text3)',
              fontSize: '0.85rem',
              padding: '0',
              lineHeight: 1,
            },
            title: 'Подробнее о формуле',
            'aria-label': 'Подробнее о формуле',
          },
          '(?)'
        )
      ),
      React.createElement('strong', { style: { color, fontSize: '1.1rem' } }, `${score}%`)
    ),
    showTooltip && React.createElement(
      'div',
      {
        style: {
          position: 'absolute',
          bottom: '100%',
          left: '0.5rem',
          right: '0.5rem',
          marginBottom: '0.5rem',
          background: 'var(--surface2)',
          border: '1px solid var(--surface3)',
          borderRadius: '0.5rem',
          padding: '0.5rem 0.75rem',
          fontSize: '0.78rem',
          color: 'var(--text2)',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          zIndex: 10,
        },
      },
      'Формула основана на исследованиях 2025-2026 гг., но не является клинически валидированной.'
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
