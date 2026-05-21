// js/ui/components/CheckinHistory.jsx
// Список последних чек-инов с датой, Recovery Score и статусом

import React, { useState } from 'react';
import { Check, Circle, Moon } from 'lucide-react';
import { calculateRecoveryScore } from '../../core/recoveryScore.js';
import Collapsible from './Collapsible.jsx';

const STATUS_ICON = { green: React.createElement(Check, { size: 20 }), yellow: React.createElement(Circle, { size: 20 }), red: React.createElement(Circle, { size: 20, fill: 'currentColor' }) };

function CheckinRow({ checkin, allCheckins }) {
  const score = calculateRecoveryScore(checkin, allCheckins);
  const status = checkin.readiness || 'green';
  const dateStr = checkin.date ? checkin.date.slice(5).replace('-', '.') : '??';
  const scoreColor = score >= 70 ? 'var(--green)' : score >= 40 ? 'var(--yellow)' : 'var(--red)';

  return React.createElement(
    'div',
    { className: 'checkin-row' },
    React.createElement('span', { className: 'checkin-row__date font-mono font-caption' }, dateStr),
    React.createElement('span', { className: 'checkin-row__status' }, STATUS_ICON[status] || React.createElement(Circle, { size: 20 })),
    React.createElement(
      'span',
      { className: 'checkin-row__score font-mono font-caption', style: { color: scoreColor } },
      `${score}%`
    ),
    React.createElement(
      'span',
      { className: 'checkin-row__meta font-caption text-secondary' },
      checkin.sleepHours > 0 ? React.createElement(React.Fragment, null, React.createElement(Moon, { size: 20 }), ` ${checkin.sleepHours}ч`) : '',
      checkin.hrv > 0 ? ` HRV ${checkin.hrv}` : ''
    )
  );
}

export default function CheckinHistory({ checkins, defaultLimit = 5 }) {
  const [open, setOpen] = useState(false);
  const [showAll, setShowAll] = useState(false);

  if (!checkins || checkins.length === 0) return null;

  const sorted = [...checkins]
    .sort((a, b) => (b.date || '').localeCompare(a.date || ''));

  const visible = showAll ? sorted : sorted.slice(0, defaultLimit);
  const hasMore = sorted.length > defaultLimit;

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
      visible.map(c =>
        React.createElement(CheckinRow, { key: c.date, checkin: c, allCheckins: checkins })
      ),
      hasMore && React.createElement(
        'button',
        {
          className: 'checkin-history__more',
          onClick: () => setShowAll(v => !v),
        },
        showAll ? 'Скрыть' : `Показать ещё (${sorted.length - defaultLimit})`
      )
    )
  );
}
