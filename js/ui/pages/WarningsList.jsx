// js/ui/pages/WarningsList.js
// Секция предупреждений/алертов аналитики

import React from 'react';
import { AlertTriangle, Lightbulb, Settings } from 'lucide-react';

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
        ? React.createElement(AlertTriangle, { size: 20 }) + ' Критический'
        : React.createElement(AlertTriangle, { size: 20 }) + ' Внимание'
    ),
    warning &&
      React.createElement('h4', null, warning.title),
    warning &&
      React.createElement(
        'p',
        { className: 'text-primary' },
        warning.message
      ),
    warning &&
      React.createElement(
        'p',
        { className: 'warning-recommendation' },
        React.createElement(Lightbulb, { size: 20 }), ' ', warning.recommendation
      ),
    warning && warning.apreOverride &&
      React.createElement(
        'p',
        { className: 'warning-apre' },
        React.createElement(Settings, { size: 20 }), ' ', warning.apreOverride
      ),
    // Additional warnings (when no overtraining warning)
    !warning && warnings.map((w, i) =>
      React.createElement(
        'div',
        { key: i, className: i < warnings.length - 1 ? 'mb-sm' : '' },
        React.createElement(
          'p',
          { className: 'mb-xs font-body font-weight-600 text-primary' },
          w.message
        ),
        React.createElement(
          'p',
          { className: 'warning-recommendation mb-xs' },
          React.createElement(Lightbulb, { size: 20 }), ' ', w.recommendation
        ),
        React.createElement(
          'p',
          { className: 'warning-apre mb-0' },
          React.createElement(Settings, { size: 20 }), ' ', w.apreAction
        )
      )
    )
  );
}
