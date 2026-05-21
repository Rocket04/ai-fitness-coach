// js/ui/pages/SessionLogger.js
// История тренировок + результаты тестов (collapsible sections)

import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, Circle, Sun, Moon, Play, Dumbbell, BarChart } from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore.js';
import EmptyState from '../components/EmptyState.jsx';
import { Collapsible as CollapsiblePrimitive } from '@base-ui/react/collapsible';

/* ---------- sub-components ---------- */

function ReadinessPill({ status }) {
  const STATUS_ICON = { green: React.createElement(Check, { size: 20 }), yellow: React.createElement(Circle, { size: 20 }), red: React.createElement(Circle, { size: 20, fill: 'currentColor' }) };
  return React.createElement(
    'span',
    { className: `pill ${status} font-caption`, style: { padding: '0.15rem 0.5rem' } },
    STATUS_ICON[status] || React.createElement(Circle, { size: 20 })
  );
}

function SessionRow({ session }) {
  const dateStr = session.date ? session.date.slice(5) : '??';
  const typeLabel = session.type === 'morning' ? React.createElement(Sun, { size: 20 }) :
    session.type === 'evening' ? React.createElement(Moon, { size: 20 }) :
    session.type ? React.createElement(Play, { size: 20 }) + ` ${session.type}` : React.createElement(Play, { size: 20 });

  return React.createElement(
    'div',
    { className: 'session-row' },
    React.createElement('span', { className: 'session-date' }, dateStr),
    React.createElement('span', { className: 'session-type' }, typeLabel),
    session.readiness && React.createElement(ReadinessPill, { status: session.readiness }),
    React.createElement(
      'span',
      { className: 'min-w-90 text-right font-weight-600 font-mono font-caption', style: { minWidth: '2.5rem' } },
      session.rpe ? `RPE ${session.rpe}` : '—'
    )
  );
}

/* ---------- main component ---------- */

export default function SessionLogger() {
  const { t } = useTranslation();
  const { sessions, testHistory, handleExportData, handleImportData, handleResetAll } = useAppStore();

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
      CollapsiblePrimitive.Root,
      { className: 'collapsible', open: showSessions, onOpenChange: (open) => setShowSessions(open) },
      React.createElement(
        CollapsiblePrimitive.Trigger,
        { className: 'collapsible-header' },
        React.createElement('span', null, t('session.workoutHistory')),
        React.createElement(
          'span',
          { className: 'flex items-center gap-xs' },
          React.createElement('span', { className: 'count-badge' }, trainSessions.length),
          React.createElement('span', { className: 'font-caption text-muted' }, showSessions ? '▲' : '▼')
        )
      ),
      React.createElement(
        CollapsiblePrimitive.Panel,
        { className: 'collapsible-content' },
        trainSessions.length === 0
          ? React.createElement(EmptyState, { icon: React.createElement(Dumbbell, { size: 20 }), title: 'Тренировок пока нет', subtitle: 'Отметьте выполненную тренировку на главной' })
          : trainSessions.map(s =>
              React.createElement(SessionRow, { key: s.key || s.date + s.type, session: s })
            )
      )
    ),

    /* ═══════════════════ TEST HISTORY ═══════════════════ */
    React.createElement(
      CollapsiblePrimitive.Root,
      { className: 'collapsible', open: showTests, onOpenChange: (open) => setShowTests(open) },
      React.createElement(
        CollapsiblePrimitive.Trigger,
        { className: 'collapsible-header' },
        React.createElement('span', null, t('session.testResults')),
        React.createElement(
          'span',
          { className: 'flex items-center gap-xs' },
          React.createElement('span', { className: 'count-badge' }, testSessions.length),
          React.createElement('span', { className: 'font-caption text-muted' }, showTests ? '▲' : '▼')
        )
      ),
      React.createElement(
        CollapsiblePrimitive.Panel,
        { className: 'collapsible-content' },
        testSessions.length === 0
          ? React.createElement(EmptyState, { icon: React.createElement(BarChart, { size: 20 }), title: 'Тестов пока нет', subtitle: 'Тесты проводятся в день C при зелёной готовности' })
          : testSessions.map((s, i) => {
              const tr = s.testResults || {};
              return React.createElement(
                'div',
                {
                  key: s.date || i,
                  className: 'font-body border-bottom',
                  style: {
                    padding: 'var(--spacing-sm) 0',
                    borderBottom: i < testSessions.length - 1 ? '1px solid var(--border)' : 'none',
                  }
                },
                React.createElement(
                  'div',
                  { className: 'flex justify-between mb-xs' },
                  React.createElement('strong', null, s.date),
                  React.createElement(
                    'span',
                    { className: 'text-sm text-secondary' },
                    `Тип ${s.type || '—'}`
                  )
                ),
                React.createElement(
                  'div',
                  { className: 'text-secondary font-body font-mono' },
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
        { className: 'flex gap-sm flex-wrap justify-center' },
        React.createElement(
          'button',
          {
            className: 'btn btn-sm flex-1 min-w-90',
            onClick: handleExportData,
          },
          t('session.export')
        ),
        React.createElement(
          'button',
          {
            className: 'btn btn-sm flex-1 min-w-90',
            onClick: () => fileInputRef.current && fileInputRef.current.click(),
          },
          t('session.import')
        ),
        React.createElement(
          'button',
          {
            className: 'btn btn-sm btn-red flex-1 min-w-90',
            onClick: handleResetAll,
          },
          t('session.reset')
        ),
        React.createElement('input', {
          ref: fileInputRef,
          type: 'file',
          accept: '.json',
          className: 'hidden',
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
