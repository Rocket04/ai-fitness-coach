// js/ui/pages/WarningsList.js
// Секция предупреждений/алертов аналитики

import React from 'react';

export default function WarningsList({ overtrainingWarning, trendWarnings }) {
  const warning = overtrainingWarning;
  const warnings = trendWarnings || [];

  if (!warning && warnings.length === 0) return null;

  return React.createElement(
    'div',
    {
      className: `analytics-warning ${warning && warning.severity === 'critical' ? '' : 'info'}`,
    },
    React.createElement(
      'div',
      {
        className: `severity-badge ${warning && warning.severity === 'critical' ? 'critical' : 'warning'}`,
      },
      warning && warning.severity === 'critical'
        ? '⚠️ Критический'
        : '⚠️ Внимание'
    ),
    warning &&
      React.createElement('h4', null, warning.title),
    warning &&
      React.createElement(
        'p',
        { style: { color: 'var(--text)' } },
        warning.message
      ),
    warning &&
      React.createElement(
        'p',
        { className: 'warning-recommendation' },
        '💡 ', warning.recommendation
      ),
    warning && warning.apreOverride &&
      React.createElement(
        'p',
        { className: 'warning-apre' },
        '⚙️ ', warning.apreOverride
      ),
    // Additional warnings (when no overtraining warning)
    !warning && warnings.map((w, i) =>
      React.createElement(
        'div',
        { key: i, style: { marginBottom: i < warnings.length - 1 ? '0.75rem' : 0 } },
        React.createElement(
          'p',
          { style: { margin: '0 0 0.25rem 0', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text)' } },
          w.message
        ),
        React.createElement(
          'p',
          { className: 'warning-recommendation', style: { marginBottom: '0.25rem' } },
          '💡 ', w.recommendation
        ),
        React.createElement(
          'p',
          { className: 'warning-apre', style: { margin: 0 } },
          '⚙️ ', w.apreAction
        )
      )
    )
  );
}
