// js/ui/pages/CoachAdvice.js
// Секция советов тренера

import React from 'react';

export default function CoachAdvice({ advice }) {
  if (!advice || advice.length === 0) return null;
  return React.createElement(
    'div',
    { className: 'coach-advice-card' },
    React.createElement('h4', null, 'Советы тренера'),
    advice.map((a, i) =>
      React.createElement(
        'div',
        { key: i, className: 'coach-advice-item' },
        a
      )
    )
  );
}
