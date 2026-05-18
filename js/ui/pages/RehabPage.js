import React from 'react';
import { MORNING_ROUTINE, EVENING_ROUTINE } from '../../config/constants.js';

function RoutineList({ title, routines, done, onMarkDone, color, icon }) {
  const items = routines.map((item, i) =>
    React.createElement(
      'div',
      {
        key: i,
        className: 'routine-item',
      },
      React.createElement(
        'div',
        { style: { flex: 1 } },
        React.createElement(
          'div',
          { style: { fontWeight: 600, fontSize: '0.9rem' } },
          item.name
        ),
        React.createElement(
          'div',
          { className: 'text-sm', style: { color: 'var(--text2)', marginTop: '0.125rem' } },
          `${item.reps} — ${item.why}`
        )
      )
    )
  );

  return React.createElement(
    'div',
    { className: 'card' },
    React.createElement(
      'div',
      {
        style: {
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '0.75rem',
        }
      },
      React.createElement('h3', { style: { margin: 0, fontSize: '1.05rem' } }, `${icon} ${title}`),
      React.createElement(
        'button',
        {
          className: done ? 'btn btn-sm btn-green' : 'btn btn-sm btn-accent',
          onClick: onMarkDone,
        },
        done ? '\u2713 Выполнено' : 'Отметить'
      )
    ),
    items
  );
}

export default function RehabPage({ morningDone, eveningDone, markMorning, markEvening }) {
  return React.createElement(
    'div',
    { className: 'page-enter' },
    React.createElement('h2', null, 'Реабилитация'),
    React.createElement(
      'p',
      { className: 'text-sm', style: { color: 'var(--text2)', marginBottom: '1rem' } },
      'Ежедневные рутины для поддержания здоровья суставов и дыхательной системы'
    ),
    React.createElement(RoutineList, {
      title: 'Утренняя активация',
      routines: MORNING_ROUTINE,
      done: morningDone,
      onMarkDone: markMorning,
      icon: '\u2600\uFE0F',
    }),
    React.createElement(RoutineList, {
      title: 'Вечернее расслабление',
      routines: EVENING_ROUTINE,
      done: eveningDone,
      onMarkDone: markEvening,
      icon: '\uD83C\uDF19',
    })
  );
}
