import React from 'react';
import Collapsible from '../components/Collapsible';

/**
 * Страница реабилитации.
 * @param {{
 *   morningDone: boolean,
 *   eveningDone: boolean,
 *   markMorning: ()=>void,
 *   markEvening: ()=>void,
 *   MORNING_ROUTINE: Array<{name:string}>,
 *   EVENING_ROUTINE: Array<{name:string}>
 * }} props
 * @returns {JSX.Element}
 */
export default function RehabPage({
  morningDone,
  eveningDone,
  markMorning,
  markEvening,
  MORNING_ROUTINE,
  EVENING_ROUTINE
}) {
  return React.createElement(
    React.Fragment,
    null,
    React.createElement(
      'div',
      { className: 'card' },
      React.createElement('h2', null, 'Утренняя активация'),
      React.createElement(
        Collapsible,
        { title: 'Упражнения', defaultOpen: true },
        MORNING_ROUTINE.map((ex, idx) =>
          React.createElement('div', { key: idx, className: 'exercise-name' }, ex.name)
        ),
        React.createElement(
          'div',
          { className: 'row center', style: { marginTop: '1rem' } },
          React.createElement(
            'button',
            {
              className: morningDone ? 'btn btn-green' : 'btn',
              onClick: markMorning,
            },
            morningDone ? 'Выполнено' : 'Отметить как выполнено'
          )
        )
      )
    ),
    React.createElement(
      'div',
      { className: 'card' },
      React.createElement('h2', null, 'Вечернее расслабление'),
      React.createElement(
        Collapsible,
        { title: 'Упражнения', defaultOpen: true },
        EVENING_ROUTINE.map((ex, idx) =>
          React.createElement('div', { key: idx, className: 'exercise-name' }, ex.name)
        ),
        React.createElement(
          'div',
          { className: 'row center', style: { marginTop: '1rem' } },
          React.createElement(
            'button',
            {
              className: eveningDone ? 'btn btn-green' : 'btn',
              onClick: markEvening,
            },
            eveningDone ? 'Выполнено' : 'Отметить как выполнено'
          )
        )
      )
    )
  );
}
