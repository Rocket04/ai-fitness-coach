// js/ui/pages/RecoveryScoreCard.js
// SVG кольцо готовности + индикатор восстановления

import React, { } from 'react';
import { useAppStore } from '../../stores/useAppStore.js';

const READINESS_LABELS = { green: 'Зелёный', yellow: 'Жёлтый', red: 'Красный' };

export function ReadinessIndicator({ readiness, autoReadiness, manualOverride, onManualOverrideChange, lastCheckin, recoveryScore }) {
  const { setActiveTab } = useAppStore();
  const isOverridden = manualOverride && manualOverride !== 'unknown';

  const hrvValue = lastCheckin?.hrv ? `${lastCheckin.hrv} мс` : '\u2014';
  const recoveryValue = typeof recoveryScore === 'number' ? `${recoveryScore}%` : '\u2014';
  const subjectiveValue = (() => {
    if (!lastCheckin) return '\u2014';
    const mood = Number(lastCheckin.mood);
    const stress = Number(lastCheckin.stress);
    if (!mood && !stress) return '\u2014';
    const moodScore = mood || 0;
    const stressScore = stress > 0 ? (6 - stress) : 0;
    const count = (mood > 0 ? 1 : 0) + (stress > 0 ? 1 : 0);
    const avg = count > 0 ? Math.round((moodScore + stressScore) / count) : 0;
    return `${avg}/5`;
  })();
  const ringColor = readiness === 'green' ? 'var(--green)' : readiness === 'yellow' ? 'var(--yellow)' : 'var(--red)';
  const circumference = 2 * Math.PI * 36;

  return React.createElement(
    'div',
    { className: 'card text-center' },
    // Ring + status display
    React.createElement(
      'div',
      { className: 'flex items-center justify-center gap-md' },
      // SVG ring
      React.createElement(
        'svg',
        { width: '88', height: '88', viewBox: '0 0 88 88', className: 'flex-shrink-0' },
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
        { className: 'text-left' },
        React.createElement('div', { className: 'score-display', style: { color: ringColor, fontSize: '1.8rem' } },
          READINESS_LABELS[readiness] || readiness
        ),
        React.createElement('div', { className: 'score-label' }, 'Готовность')
      )
    ),
    // Balance chips
    React.createElement(
      'div',
      { className: 'balance-row justify-center' },
      React.createElement('span', { className: `balance-chip ${readiness === 'green' ? 'green' : readiness === 'yellow' ? 'yellow' : 'red'}` }, `\u25CF HRV ${hrvValue}`),
      React.createElement('span', { className: `balance-chip ${readiness === 'green' ? 'green' : readiness === 'yellow' ? 'yellow' : 'red'}` }, `\u25CF Восст. ${recoveryValue}`),
      React.createElement(
        'span',
        { className: 'relative', style: { display: 'inline-block' } },
        React.createElement('span', { className: `balance-chip ${readiness === 'red' ? 'red' : readiness === 'yellow' ? 'yellow' : 'green'}` },
          `\u25CF \u0421\u0430\u043C\u043E\u0447\u0443\u0432\u0441\u0442\u0432\u0438\u0435 ${subjectiveValue}`,
          React.createElement(
            'button',
            {
              onClick: () => {
                if (setActiveTab) { window.location.hash = 'subjective-thresholds'; setActiveTab(4); }
              },
              className: 'cursor-pointer font-caption',
              style: {
                background: 'var(--background)',
                border: 'none',
                color: 'inherit',
                padding: '0 var(--spacing-xs)',
                lineHeight: 1,
                opacity: 0.7,
              },
              title: 'Подробнее о порогах',
              'aria-label': 'Подробнее о порогах',
            },
            '(?)'
          )
        )
      )
    ),
    // Manual override buttons
    React.createElement(
      'div',
      { className: 'flex gap-xs justify-center mt-sm' },
      React.createElement(
        'button',
        {
          className: `btn btn-sm ${manualOverride === 'unknown' ? 'btn-accent' : 'btn-outline'} font-caption`,
          onClick: () => onManualOverrideChange('unknown'),
        },
        'Авто'
      ),
      ['green', 'yellow', 'red'].map(color =>
        React.createElement(
          'button',
          {
            key: color,
            className: `btn btn-sm ${manualOverride === color ? 'btn-accent' : 'btn-outline'} font-caption`,
            onClick: () => onManualOverrideChange(color),
            style: {
              borderLeft: `3px solid var(--${color})`,
            },
          },
          { green: 'Г', yellow: 'Ж', red: 'К' }[color]
        )
      )
    ),
    React.createElement(
      'div',
      { className: 'text-xs text-muted mt-xs' },
      'Авто: ', READINESS_LABELS[autoReadiness] || autoReadiness
    )
  );
}

export function RecoveryBar({ score }) {
  const dispatch = useAppStore();
  const { setActiveTab } = dispatch || {};
  const color = score >= 80 ? 'var(--green)' : score >= 60 ? 'var(--yellow)' : 'var(--red)';
  return React.createElement(
    'div',
    { className: 'card relative', style: { padding: '0.75rem 1rem' } },
    React.createElement(
      'div',
      { className: 'flex justify-between items-center' },
      React.createElement('span', { className: 'text-sm font-weight-500 flex items-center gap-xs' },
        'Восстановление',
        React.createElement(
          'button',
          {
            onClick: () => {
              if (setActiveTab) { window.location.hash = 'recovery-score'; setActiveTab(4); }
            },
            className: 'cursor-pointer font-caption',
            style: {
              background: 'var(--background)',
              border: 'none',
              color: 'inherit',
              padding: '0 var(--spacing-xs)',
              lineHeight: 1,
              opacity: 0.7,
            },
            title: 'Подробнее о формуле',
            'aria-label': 'Подробнее о формуле',
          },
          '(?)'
        )
      ),
      React.createElement('strong', { style: { color, fontSize: '1.1rem' } }, `${score}%`),
    ),
    React.createElement(
      'div',
      { className: 'recovery-bar' },
      React.createElement('div', {
        className: 'recovery-bar-fill',
        style: { transform: `scaleX(${score / 100})`, backgroundColor: color },
      })
    )
  );
}
