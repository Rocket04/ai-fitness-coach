// js/ui/pages/SessionLogger.js
// История тренировок + результаты тестов (collapsible sections)

import React, { useState, useRef, useContext } from 'react';
import { AppStateContext, AppDispatchContext } from '../../core/AppContext.js';

/* ---------- sub-components ---------- */

function ReadinessPill({ status }) {
  const map = { green: '🟢', yellow: '🟡', red: '🔴' };
  return React.createElement(
    'span',
    { className: `pill ${status}`, style: { fontSize: '0.7rem', padding: '0.15rem 0.5rem' } },
    map[status] || '⚪'
  );
}

function SessionRow({ session }) {
  const dateStr = session.date ? session.date.slice(5) : '??';
  const typeLabel = session.type === 'morning' ? '☀️' :
    session.type === 'evening' ? '🌙' :
    session.type ? `🏃 ${session.type}` : '🏃';

  return React.createElement(
    'div',
    { className: 'session-row' },
    React.createElement('span', { className: 'session-date' }, dateStr),
    React.createElement('span', { className: 'session-type' }, typeLabel),
    session.readiness && React.createElement(ReadinessPill, { status: session.readiness }),
    React.createElement(
      'span',
      { style: { minWidth: '2.5rem', textAlign: 'right', fontWeight: 600, fontFamily: 'var(--font-mono)', fontSize: '0.8rem' } },
      session.rpe ? `RPE ${session.rpe}` : '—'
    )
  );
}

/* ---------- main component ---------- */

export default function SessionLogger() {
  const state = useContext(AppStateContext);
  const dispatch = useContext(AppDispatchContext);
  const { sessions, testHistory } = state;
  const { handleExportData, handleImportData, handleResetAll } = dispatch;

  const [showSessions, setShowSessions] = useState(false);
  const [showTests, setShowTests] = useState(false);
  const fileInputRef = useRef(null);

  // Filter to only training sessions (not morning/evening)
  const trainSessions = (sessions || [])
    .filter(s => s.completed && s.type !== 'morning' && s.type !== 'evening')
    .sort((a, b) => (b.date || '').localeCompare(a.date || ''));

  const testSessions = (testHistory || []).slice().reverse();

  return React.createElement(
    React.Fragment,
    null,

    /* ═══════════════════ SESSION HISTORY ═══════════════════ */
    React.createElement(
      'div',
      { className: 'collapsible' },
      React.createElement(
        'div',
        {
          className: 'collapsible-header',
          onClick: () => setShowSessions(!showSessions),
        },
        React.createElement('span', null, 'История тренировок'),
        React.createElement(
          'span',
          { style: { display: 'flex', alignItems: 'center', gap: '0.375rem' } },
          React.createElement('span', { className: 'count-badge' }, trainSessions.length),
          React.createElement('span', { style: { fontSize: '0.75rem', color: 'var(--text3)' } }, showSessions ? '▲' : '▼')
        )
      ),
      showSessions &&
        React.createElement(
          'div',
          { className: 'collapsible-content' },
          trainSessions.length === 0
            ? React.createElement(
                'div',
                { className: 'empty-state', style: { padding: '1.5rem 1rem' } },
                React.createElement('div', { className: 'empty-state-text' }, 'Тренировок пока нет')
              )
            : trainSessions.map(s =>
                React.createElement(SessionRow, { key: s.key || s.date + s.type, session: s })
              )
        )
    ),

    /* ═══════════════════ TEST HISTORY ═══════════════════ */
    React.createElement(
      'div',
      { className: 'collapsible' },
      React.createElement(
        'div',
        {
          className: 'collapsible-header',
          onClick: () => setShowTests(!showTests),
        },
        React.createElement('span', null, 'Результаты тестов'),
        React.createElement(
          'span',
          { style: { display: 'flex', alignItems: 'center', gap: '0.375rem' } },
          React.createElement('span', { className: 'count-badge' }, testSessions.length),
          React.createElement('span', { style: { fontSize: '0.75rem', color: 'var(--text3)' } }, showTests ? '▲' : '▼')
        )
      ),
      showTests &&
        React.createElement(
          'div',
          { className: 'collapsible-content' },
          testSessions.length === 0
            ? React.createElement(
                'div',
                { className: 'empty-state', style: { padding: '1.5rem 1rem' } },
                React.createElement('div', { className: 'empty-state-text' }, 'Тестов пока нет')
              )
            : testSessions.map((s, i) => {
                const tr = s.testResults || {};
                return React.createElement(
                  'div',
                  {
                    key: s.date || i,
                    style: {
                      padding: '0.625rem 0',
                      borderBottom: i < testSessions.length - 1 ? '1px solid var(--border)' : 'none',
                      fontSize: '0.875rem',
                    }
                  },
                  React.createElement(
                    'div',
                    { style: { display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' } },
                    React.createElement('strong', null, s.date),
                    React.createElement(
                      'span',
                      { className: 'text-sm', style: { color: 'var(--text2)' } },
                      `Тип ${s.type || '—'}`
                    )
                  ),
                  React.createElement(
                    'div',
                    { style: { color: 'var(--text2)', fontSize: '0.85rem', fontFamily: 'var(--font-mono)' } },
                    `Подт.: ${tr.pullUps ?? '—'}  |  Отж.: ${tr.pushUps ?? '—'}  |  Планка: ${tr.plankSec ?? '—'}с`
                  )
                );
              })
        )
    ),

    /* ═══════════════════ EXPORT / IMPORT / RESET ═══════════════════ */
    React.createElement(
      'div',
      { className: 'card' },
      React.createElement(
        'div',
        { style: { display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'center' } },
        React.createElement(
          'button',
          {
            className: 'btn btn-sm',
            onClick: handleExportData,
            style: { flex: 1, minWidth: '90px' },
          },
          'Экспорт'
        ),
        React.createElement(
          'button',
          {
            className: 'btn btn-sm',
            onClick: () => fileInputRef.current && fileInputRef.current.click(),
            style: { flex: 1, minWidth: '90px' },
          },
          'Импорт'
        ),
        React.createElement(
          'button',
          {
            className: 'btn btn-sm btn-red',
            onClick: handleResetAll,
            style: { flex: 1, minWidth: '90px' },
          },
          'Сброс'
        ),
        React.createElement('input', {
          ref: fileInputRef,
          type: 'file',
          accept: '.json',
          style: { display: 'none' },
          onChange: e => {
            if (e.target.files[0]) {
              handleImportData(e.target.files[0]);
              e.target.value = '';
            }
          },
        })
      )
    )
  );
}
