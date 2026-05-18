import React from 'react';
import Pill from '../components/Pill.js';

/**
 * Страница «Сегодня».
 */
export default function TodayPage({
  sessionPlan,
  trainType,
  readiness,
  recoveryDebt,
  recoveryScore,
  coachAdvice,
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
  weekLabel,
  tomorrowPlan,
  tomorrowType,
}) {
  const isTestDay = sessionPlan?.some(ex => ex.isTest) ?? false;

  return React.createElement(
    React.Fragment,
    null,
    React.createElement(
      'div',
      { className: 'card' },
      React.createElement('div', { className: 'text-sm text-xs', style: { marginBottom: '0.5rem', color: 'var(--text2)' } }, weekLabel),
      React.createElement(
        'div',
        { className: 'row' },
        React.createElement('div', null, React.createElement(Pill, { tone: readiness }, readiness)),
        React.createElement(
          'div',
          { style: { flex: 1 } },
          React.createElement('h3', null, 'Recovery Score: ', recoveryScore),
          recoveryDebt &&
            React.createElement('p', { className: 'highlight' }, 'Накопленная усталость — снизь нагрузку'),
          React.createElement(
            'p',
            null,
            recoveryScore >= 80
              ? 'Отлично, полный план'
              : recoveryScore >= 60
              ? 'Хорошо, можно умеренный план'
              : 'Низкий, рекомендуется лёгкий план или отдых'
          )
        )
      ),
      coachAdvice?.length > 0 &&
        React.createElement(
          'div',
          { style: { marginTop: '0.75rem' } },
          coachAdvice.map((tip, idx) =>
            React.createElement('p', { key: idx, className: 'text-sm', style: { margin: '0.25rem 0' } }, '• ', tip)
          )
        )
    ),
    React.createElement(
      'div',
      { className: 'card' },
      React.createElement('h2', null, 'Тренировка: ', trainType),
      React.createElement(
        'div',
        { className: 'collapsible' },
        React.createElement('div', { className: 'collapsible-header' }, 'Упражнения'),
        React.createElement(
          'div',
          { className: 'collapsible-content' },
          (sessionPlan?.length ? sessionPlan : [{ name: 'Отдых', note: 'Нет запланированных упражнений' }]).map(
            (ex, idx) =>
              React.createElement(
                'div',
                { key: idx, className: 'exercise' },
                React.createElement('div', { className: 'exercise-name' }, ex.name),
                ex.sets &&
                  React.createElement(
                    'div',
                    { className: 'exercise-detail' },
                    'Подходы: ',
                    ex.sets,
                    ' ',
                    ex.reps ? `Повторы: ${ex.reps}` : ''
                  ),
                ex.note && React.createElement('div', { className: 'exercise-note' }, ex.note)
              )
          )
        )
      )
    ),
    React.createElement(
      'div',
      { className: 'card' },
      React.createElement('h3', null, 'Запись тренировки'),
      React.createElement(
        'div',
        { className: 'row' },
        React.createElement(
          'div',
          null,
          React.createElement('label', null, 'RPE:'),
          React.createElement('input', {
            type: 'number',
            min: '1',
            max: '10',
            value: rpe,
            onChange: e => setRpe(Number(e.target.value)),
            className: 'btn',
            style: { width: '60px' },
          })
        ),
        React.createElement(
          'div',
          { style: { flex: 1 } },
          React.createElement('label', null, 'Заметка:'),
          React.createElement('textarea', {
            value: sessionNote,
            onChange: e => setSessionNote(e.target.value),
            rows: '3',
            style: { width: '100%', boxSizing: 'border-box' },
          })
        )
      ),
      React.createElement(
        'div',
        { className: 'row center', style: { marginTop: '1rem' } },
        React.createElement('button', { className: 'btn btn-green', onClick: markSession }, 'Выполнено')
      )
    ),
    isTestDay &&
      React.createElement(
        'div',
        { className: 'card' },
        React.createElement('h3', null, 'Тестовый день'),
        React.createElement(
          'div',
          { className: 'row' },
          React.createElement(
            'div',
            null,
            React.createElement('label', null, 'Подтягивания:'),
            React.createElement('input', {
              type: 'number',
              value: testPullUps,
              onChange: e => setTestPullUps(Number(e.target.value)),
              className: 'btn',
              style: { width: '80px' },
            })
          ),
          React.createElement(
            'div',
            null,
            React.createElement('label', null, 'Отжимания:'),
            React.createElement('input', {
              type: 'number',
              value: testPushUps,
              onChange: e => setTestPushUps(Number(e.target.value)),
              className: 'btn',
              style: { width: '80px' },
            })
          ),
          React.createElement(
            'div',
            null,
            React.createElement('label', null, 'Планка (сек):'),
            React.createElement('input', {
              type: 'number',
              value: testPlank,
              onChange: e => setTestPlank(Number(e.target.value)),
              className: 'btn',
              style: { width: '80px' },
            })
          )
        )
      ),
    tomorrowPlan?.length > 0 &&
      React.createElement(
        'div',
        { className: 'card' },
        React.createElement('h3', null, 'Завтра'),
        React.createElement('p', null, 'Тип: ', tomorrowType),
        React.createElement(
          'div',
          { className: 'collapsible' },
          React.createElement('div', { className: 'collapsible-header' }, 'План'),
          React.createElement(
            'div',
            { className: 'collapsible-content' },
            tomorrowPlan.map((ex, idx) =>
              React.createElement(
                'div',
                { key: idx, className: 'exercise' },
                React.createElement('div', { className: 'exercise-name' }, ex.name),
                ex.sets &&
                  React.createElement(
                    'div',
                    { className: 'exercise-detail' },
                    'Подходы: ',
                    ex.sets,
                    ' ',
                    ex.reps ? `Повторы: ${ex.reps}` : ''
                  )
              )
            )
          )
        )
      )
  );
}
