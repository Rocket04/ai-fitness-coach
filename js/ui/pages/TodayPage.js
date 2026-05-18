// js/ui/pages/TodayPage.js
// Главная страница «Сегодня» — собирает sub-components, потребляет context

import React, { useContext } from 'react';
import { AppStateContext, AppDispatchContext } from '../../core/AppContext.js';
import { ReadinessIndicator, RecoveryBar } from './RecoveryScoreCard.js';
import SessionPlan from './SessionPlan.js';
import CoachAdvice from './CoachAdvice.js';
import QuickStats from './QuickStats.js';

/* ---------- RPE scale descriptions ---------- */
const RPE_DESCRIPTIONS = {
  0: 'Отдых — никакой активности',
  1: 'Очень легко — разминка, ходьба',
  2: 'Легко — дыхание ровное',
  3: 'Умеренно — разговаривать легко',
  4: 'Довольно тяжело — короткие фразы',
  5: 'Тяжело — дыхание частое',
  6: 'Тяжеловато — односложно говорить',
  7: 'Очень тяжело — слова с трудом',
  8: 'Крайне тяжело — невозможно говорить',
  9: 'Предельно — на грани возможностей',
  10: 'Максимум — нельзя больше',
};

function rpeZone(value) {
  if (value <= 3) return { color: 'var(--green)', label: 'Лёгкая' };
  if (value <= 6) return { color: 'var(--yellow)', label: 'Умеренная' };
  return { color: 'var(--red)', label: 'Высокая' };
}

/* ---------- main component ---------- */

export default function TodayPage() {
  const state = useContext(AppStateContext);
  const dispatch = useContext(AppDispatchContext);

  const {
    sessionPlan, trainType, readiness, autoReadiness, manualOverride,
    recoveryScore, coachAdvice, rpe, sessionNote,
    testPullUps, testPushUps, testPlank,
    trainingDone, weekLabel, tomorrowPlan, tomorrowType,
    morningDone, eveningDone, apreReasons,
  } = state;

  const {
    setRpe, setSessionNote, setTestPullUps, setTestPushUps, setTestPlank,
    handleManualOverrideChange, handleToggleTraining,
    handleMarkMorning, handleMarkEvening,
  } = dispatch;

  const isRestDay = !trainType || !sessionPlan;
  const rpeKey = Math.round(rpe);
  const rpeDesc = RPE_DESCRIPTIONS[rpeKey] || '';
  const zone = rpeZone(rpe);

  return React.createElement(
    'div',
    { className: 'page-enter' },

    // ── Readiness + Recovery ──
    React.createElement(ReadinessIndicator, {
      readiness,
      autoReadiness,
      manualOverride,
      onManualOverrideChange: handleManualOverrideChange,
    }),
    React.createElement(RecoveryBar, { score: recoveryScore }),

    // ── Training Plan ──
    React.createElement(SessionPlan, {
      sessionPlan, trainType, weekLabel, apreReasons,
    }),

    // ── Test Results (only on test days) ──
    sessionPlan && sessionPlan.isTestDay &&
      React.createElement(
        'div',
        { className: 'card', style: { borderColor: 'rgba(234, 179, 8, 0.3)' } },
        React.createElement(
          'h4',
          { style: { margin: '0 0 0.75rem 0', color: 'var(--yellow)', display: 'flex', alignItems: 'center', gap: '0.3rem' } },
          React.createElement('span', null, '🔬'),
          'Результаты тестов'
        ),
        React.createElement(
          'div',
          { className: 'grid-3' },
          React.createElement(
            'label',
            { style: { display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.85rem', fontWeight: 500 } },
            'Подтягивания',
            React.createElement('input', {
              type: 'number',
              value: testPullUps,
              onChange: e => setTestPullUps(Number(e.target.value)),
              min: 0,
            })
          ),
          React.createElement(
            'label',
            { style: { display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.85rem', fontWeight: 500 } },
            'Отжимания',
            React.createElement('input', {
              type: 'number',
              value: testPushUps,
              onChange: e => setTestPushUps(Number(e.target.value)),
              min: 0,
            })
          ),
          React.createElement(
            'label',
            { style: { display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.85rem', fontWeight: 500 } },
            'Планка (сек)',
            React.createElement('input', {
              type: 'number',
              value: testPlank,
              onChange: e => setTestPlank(Number(e.target.value)),
              min: 0,
            })
          )
        )
      ),

    // ── RPE + Save (only on training days) ──
    !isRestDay &&
      React.createElement(
        'div',
        { className: 'card' },
        // RPE header
        React.createElement(
          'div',
          { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' } },
          React.createElement(
            'span',
            { style: { fontSize: '0.9rem', fontWeight: 600 } },
            'Как прошла тренировка?'
          ),
          React.createElement(
            'strong',
            { style: { fontSize: '1.3rem', color: zone.color, fontFamily: 'var(--font-mono)' } },
            rpe || '?'
          )
        ),
        // RPE description
        React.createElement(
          'div',
          { style: { fontSize: '0.82rem', color: 'var(--text2)', marginBottom: '0.625rem', minHeight: '1.2em' } },
          rpeDesc
        ),
        // RPE zone line indicator
        React.createElement(
          'div',
          { className: 'rpe-zone-line' },
          Array.from({ length: 10 }, (_, i) =>
            React.createElement('div', {
              key: i,
              className: 'rpe-zone-segment',
              style: {
                opacity: i < rpeKey ? 1 : 0.3,
                transition: 'opacity var(--transition)',
              },
            })
          )
        ),
        // RPE anchors
        React.createElement(
          'div',
          { className: 'rpe-anchors' },
          React.createElement('span', null, '0 — отдых'),
          React.createElement('span', null, '5 — тяжело'),
          React.createElement('span', null, '10 — предел')
        ),
        // Slider
        React.createElement(
          'div',
          { style: { margin: '0.75rem 0' } },
          React.createElement('input', {
            type: 'range',
            min: 0,
            max: 10,
            step: 0.5,
            value: rpe,
            onChange: e => setRpe(Number(e.target.value)),
            style: { width: '100%' },
          })
        ),
        // Zone labels
        React.createElement(
          'div',
          { style: { display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text3)', marginBottom: '0.75rem' } },
          React.createElement('span', { style: { color: 'var(--green)', fontWeight: 500 } }, 'лёгкая'),
          React.createElement('span', { style: { color: 'var(--yellow)', fontWeight: 500 } }, 'умеренная'),
          React.createElement('span', { style: { color: 'var(--red)', fontWeight: 500 } }, 'высокая')
        ),
        // Notes
        React.createElement(
          'div',
          { style: { marginBottom: '0.875rem' } },
          React.createElement(
            'label',
            { style: { fontSize: '0.85rem', marginBottom: '0.25rem', display: 'block', fontWeight: 500 } },
            'Заметки'
          ),
          React.createElement('textarea', {
            value: sessionNote,
            onChange: e => setSessionNote(e.target.value),
            placeholder: 'Что получилось? Что было тяжело?',
            rows: 2,
          })
        ),
        // Save / Cancel button
        React.createElement(
          'button',
          {
            className: trainingDone ? 'btn btn-red' : 'btn btn-accent',
            onClick: handleToggleTraining,
            style: { width: '100%' },
          },
          trainingDone ? 'Отменить тренировку' : 'Сохранить тренировку'
        )
      ),

    // ── Coach Advice ──
    React.createElement(CoachAdvice, { advice: coachAdvice }),

    // ── Quick Stats: Tomorrow + Morning/Evening ──
    React.createElement(QuickStats, {
      tomorrowType, tomorrowPlan,
      morningDone, eveningDone,
      onMarkMorning: handleMarkMorning,
      onMarkEvening: handleMarkEvening,
    })
  );
}
