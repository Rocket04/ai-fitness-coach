// js/ui/components/CheckinHistory.jsx
// Список последних чек-инов с датой, Recovery Score и статусом

import React, { useState } from 'react';
import { calculateRecoveryScore } from '../../core/recoveryScore.js';
import Collapsible from './Collapsible.jsx';

const STATUS_ICON = { green: '✓', yellow: '○', red: '●' };

function CheckinRow({ checkin, allCheckins }) {
  const score = calculateRecoveryScore(checkin, allCheckins);
  const status = checkin.readiness || 'green';
  const dateStr = checkin.date ? checkin.date.slice(5).replace('-', '.') : '??';
  const scoreColor = score >= 70 ? 'var(--green)' : score >= 40 ? 'var(--yellow)' : 'var(--red)';

  return React.createElement(
    'div',
    { className: 'checkin-row' },
    React.createElement('span', { className: 'checkin-row__date font-mono font-caption' }, dateStr),
    React.createElement('span', { className: 'checkin-row__status' }, STATUS_ICON[status] || '⚪'),
    React.createElement(
      'span',
      { className: 'checkin-row__score font-mono font-caption', style: { color: scoreColor } },
      `${score}%`
    ),
    React.createElement(
      'span',
      { className: 'checkin-row__meta font-caption text-secondary' },
      checkin.sleepHours > 0 ? `💤 ${checkin.sleepHours}ч` : '',
      checkin.hrv > 0 ? ` HRV ${checkin.hrv}` : ''
    )
  );
}

export default function CheckinHistory({ checkins }) {
  const [open, setOpen] = useState(false);

  if (!checkins || checkins.length === 0) return null;

  const sorted = [...checkins]
    .sort((a, b) => (b.date || '').localeCompare(a.date || ''))
    .slice(0, 14);

  return React.createElement(
    Collapsible,
    {
      open,
      onToggle: setOpen,
      title: `История чек-инов (${sorted.length})`,
    },
    React.createElement(
      'div',
      { className: 'checkin-history' },
      sorted.map(c =>
        React.createElement(CheckinRow, { key: c.date, checkin: c, allCheckins: checkins })
      )
    )
  );
}
