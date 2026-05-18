// js/ui/pages/SessionPlan.js
// Отображение текущего плана тренировки + APRE объяснение

import React from 'react';

function ExerciseCard({ ex }) {
  const setsReps = ex.s && ex.s !== '—' ? `${ex.s} × ` : '';
  return React.createElement(
    'div',
    {
      className: `exercise ${ex.isTest ? 'exercise-test' : ''}`,
    },
    React.createElement('div', { className: 'exercise-name' },
      ex.isTest && React.createElement('span', { style: { color: 'var(--yellow)', marginRight: '0.25rem', fontWeight: 700 } }, '🔬 '),
      ex.n
    ),
    React.createElement('div', { className: 'exercise-detail' }, `${setsReps}${ex.r}`),
    ex.c && React.createElement('div', { className: 'exercise-note' }, `${ex.isTest ? '' : ''}${ex.c}`),
    ex.w && !ex.c && React.createElement('div', { className: 'exercise-note' }, ex.w)
  );
}

const DAY_NAMES = { A: 'ПН', B: 'СР', C: 'ПТ' };
const MODE_LABELS = { full: 'Полный', yellow: 'Облегчённый', minimum: 'Минимальный' };
const MODE_COLORS = { full: 'var(--green)', yellow: 'var(--yellow)', minimum: 'var(--red)' };

export default function SessionPlan({ sessionPlan, trainType, weekLabel, apreReasons }) {
  const isRestDay = !trainType || !sessionPlan;

  return React.createElement(
    React.Fragment,
    null,
    // ── Training Plan Card ──
    React.createElement(
      'div',
      { className: 'card' },
      React.createElement(
        'div',
        {
          style: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '0.5rem',
          }
        },
        React.createElement(
          'span',
          { className: 'text-sm', style: { color: 'var(--text2)', fontWeight: 500 } },
          isRestDay ? weekLabel : `${weekLabel} | ${DAY_NAMES[trainType] || ''}`
        ),
        !isRestDay && sessionPlan.mode &&
          React.createElement(
            'span',
            {
              className: 'pill',
              style: {
                backgroundColor: MODE_COLORS[sessionPlan.mode],
                color: '#000',
                border: 'none',
                fontWeight: 700,
              }
            },
            MODE_LABELS[sessionPlan.mode] || sessionPlan.mode
          )
      ),
      isRestDay
        ? React.createElement(
            'div',
            { style: { textAlign: 'center', padding: '2rem 0', color: 'var(--text3)' } },
            React.createElement('div', { style: { fontSize: '2rem', marginBottom: '0.5rem' } }, '🏔️'),
            React.createElement('div', { style: { fontSize: '0.9rem' } }, 'Сегодня отдых')
          )
        : React.createElement(
            'div',
            null,
            React.createElement(
              'h3',
              { style: { margin: '0 0 0.75rem 0', fontSize: '1.05rem' } },
              sessionPlan.label
            ),
            sessionPlan.exercises && sessionPlan.exercises.map((ex, i) =>
              React.createElement(ExerciseCard, { key: i, ex })
            )
          )
    ),

    // ── APRE Explanation ──
    !isRestDay && apreReasons && apreReasons.length > 0 &&
      React.createElement(
        'div',
        { className: 'apre-card' },
        React.createElement('h4', null, 'Авторегуляция плана'),
        apreReasons.map((r, i) =>
          React.createElement(
            'div',
            { key: i, className: 'apre-item' },
            r
          )
        )
      )
  );
}
