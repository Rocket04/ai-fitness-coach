// js/ui/pages/QuickStats.js
// Блок быстрых кнопок (утро/вечер) + превью завтра

import React from 'react';

const DAY_NAMES = { A: 'ПН', B: 'СР', C: 'ПТ' };

export default function QuickStats({
  tomorrowType, tomorrowPlan,
}) {
  return React.createElement(
    React.Fragment,
    null,
    // ── Tomorrow Preview ──
    tomorrowType &&
      React.createElement(
        'div',
        { className: 'tomorrow-preview' },
        React.createElement(
          'span',
          { className: 'tomorrow-preview-label' },
          'Завтра'
        ),
        React.createElement(
          'span',
          { className: 'tomorrow-preview-value' },
          `${DAY_NAMES[tomorrowType] || ''} | ${tomorrowPlan ? tomorrowPlan.label : 'отдых'}`
        )
      ),

  );
}
