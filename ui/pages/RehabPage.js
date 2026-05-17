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
  return (
    <>
      <div className="card">
        <h2>Утренняя активация</h2>
        <Collapsible title="Упражнения" defaultOpen={true}>
          {MORNING_ROUTINE.map((ex, idx) => (
            <div key={idx} className="exercise-name">{ex.name}</div>
          ))}
          <div className="row center" style={{ marginTop: '1rem' }}>
            <button
              className={morningDone ? 'btn btn-green' : 'btn'}
              onClick={markMorning}
            >
              {morningDone ? 'Выполнено' : 'Отметить как выполнено'}
            </button>
          </div>
        </Collapsible>
      </div>

      <div className="card">
        <h2>Вечернее расслабление</h2>
        <Collapsible title="Упражнения" defaultOpen={true}>
          {EVENING_ROUTINE.map((ex, idx) => (
            <div key={idx} className="exercise-name">{ex.name}</div>
          ))}
          <div className="row center" style={{ marginTop: '1rem' }}>
            <button
              className={eveningDone ? 'btn btn-green' : 'btn'}
              onClick={markEvening}
            >
              {eveningDone ? 'Выполнено' : 'Отметить как выполнено'}
            </button>
          </div>
        </Collapsible>
      </div>
    </>
  );
}
