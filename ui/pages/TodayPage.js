import React from 'react';
import Pill from '../components/Pill';
import Collapsible from '../components/Collapsible';
import MiniChart from '../components/MiniChart';

/**
 * Страница «Сегодня».
 * @param {{
 *   sessionPlan: Array<Object>,
 *   sessionToday: Object|null,
 *   trainType: string,
 *   readiness: 'green'|'yellow'|'red',
 *   recoveryDebt: boolean,
 *   recoveryScore: number,
 *   todayISO: string,
 *   tomorrowPlan: Array<Object>|null,
 *   tomorrowType: string|null,
 *   rpe: number,
 *   setRpe: (v:number)=>void,
 *   sessionNote: string,
 *   setSessionNote: (v:string)=>void,
 *   testPullUps: number,
 *   setTestPullUps: (v:number)=>void,
 *   testPushUps: number,
 *   setTestPushUps: (v:number)=>void,
 *   testPlank: number,
 *   setTestPlank: (v:number)=>void,
 *   markSession: ()=>void,
 *   startDate: string,
 *   inPlan: boolean,
 *   weekLabel: string
 * }} props
 * @returns {JSX.Element}
 */
export default function TodayPage({
  sessionPlan,
  sessionToday,
  trainType,
  readiness,
  recoveryDebt,
  recoveryScore,
  todayISO,
  tomorrowPlan,
  tomorrowType,
  rpe,
  setRpe,
  sessionNote,
  setSessionNote,
  testPullUps,
  setTestPullUps,
  testPushUps,
  setTestPushUps,
  testPlank,
  setTestPlank,
  markSession,
  startDate,
  inPlan,
  weekLabel
}) {
  const isTestDay = sessionPlan?.some(ex => ex.isTest) ?? false;

  return (
    <>
      <div className="card">
        <div className="row">
          <div>
            <Pill tone={readiness}>{readiness}</Pill>
          </div>
          <div style={{ flex: 1 }}>
            <h3>Recovery Score: {recoveryScore}</h3>
            <p>
              {recoveryScore >= 80
                ? 'Отлично, полный план'
                : recoveryScore >= 60
                ? 'Хорошо, можно умеренный план'
                : 'Низкий, рекомендуется лёгкий план или отдых'}
            </p>
          </div>
        </div>
      </div>

      <div className="card">
        <h2>Тренировка: {trainType}</h2>
        <div className="collapsible">
          <div className="collapsible-header">Упражнения</div>
          <div className="collapsible-content">
            {sessionPlan?.map((ex, idx) => (
              <div key={idx} className="exercise">
                <div className="exercise-name">{ex.name}</div>
                {ex.sets && (
                  <div className="exercise-detail">
                    Подходы: {ex.sets}{' '}
                    {ex.reps ? `Повторы: ${ex.reps}` : ''}
                  </div>
                )}
                {ex.note && <div className="exercise-note">{ex.note}</div>}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card">
        <h3>Запись тренировки</h3>
        <div className="row">
          <div>
            <label>RPE:</label>
            <input
              type="number"
              min="1"
              max="10"
              value={rpe}
              onChange={e => setRpe(Number(e.target.value))}
              className="btn"
              style={{ width: '60px' }}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label>Заметка:</label>
            <textarea
              value={sessionNote}
              onChange={e => setSessionNote(e.target.value)}
              rows="3"
              style={{ width: '100%', boxSizing: 'border-box' }}
            />
          </div>
        </div>
        <div className="row center" style={{ marginTop: '1rem' }}>
          <button className="btn btn-green" onClick={markSession}>
            Выполнено
          </button>
          <button className="btn btn-accent" onClick={markSession}>
            Сохранить
          </button>
        </div>
      </div>

      {isTestDay && (
        <div className="card">
          <h3>Тестовый день</h3>
          <div className="row">
            <div>
              <label>Подтягивания:</label>
              <input
                type="number"
                value={testPullUps}
                onChange={e => setTestPullUps(Number(e.target.value))}
                className="btn"
                style={{ width: '80px' }}
              />
            </div>
            <div>
              <label>Отжимания:</label>
              <input
                type="number"
                value={testPushUps}
                onChange={e => setTestPushUps(Number(e.target.value))}
                className="btn"
                style={{ width: '80px' }}
              />
            </div>
            <div>
              <label>Планка (сек):</label>
              <input
                type="number"
                value={testPlank}
                onChange={e => setTestPlank(Number(e.target.value))}
                className="btn"
                style={{ width: '80px' }}
              />
            </div>
          </div>
        </div>
      )}

      {tomorrowPlan && (
        <div className="card">
          <h3>Завтра</h3>
          <p>Тип: {tomorrowType}</p>
          <div className="collapsible">
            <div className="collapsible-header">План</div>
            <div className="collapsible-content">
              {tomorrowPlan.map((ex, idx) => (
                <div key={idx} className="exercise">
                  <div className="exercise-name">{ex.name}</div>
                  {ex.sets && (
                    <div className="exercise-detail">
                      Подходы: {ex.sets}{' '}
                      {ex.reps ? `Повторы: ${ex.reps}` : ''}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
