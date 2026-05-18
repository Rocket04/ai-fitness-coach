// js/ui/pages/QuickStats.js
// Блок быстрых кнопок (утро/вечер) + превью завтра

import React from 'react';

const DAY_NAMES = { A: 'ПН', B: 'СР', C: 'ПТ' };

export default function QuickStats({
  tomorrowType, tomorrowPlan,
  morningDone, eveningDone,
  onMarkMorning, onMarkEvening,
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

    // ── Morning / Evening Routine Status ──
    React.createElement(
      'div',
      {
        style: {
          display: 'flex',
          gap: '0.625rem',
          marginTop: '0.5rem',
        }
      },
      React.createElement(
        'button',
        {
          className: morningDone ? 'btn btn-green' : 'btn btn-outline',
          onClick: onMarkMorning,
          style: { flex: 1, fontSize: '0.85rem' },
        },
        `☀️ ${morningDone ? 'Готово' : 'Утро'}`
      ),
      React.createElement(
        'button',
        {
          className: eveningDone ? 'btn btn-green' : 'btn btn-outline',
          onClick: onMarkEvening,
          style: { flex: 1, fontSize: '0.85rem' },
        },
        `🌙 ${eveningDone ? 'Готово' : 'Вечер'}`
      )
    )
  );
}
