import React, { useState } from 'react';
import { Calendar, ChevronDown, ChevronUp } from 'lucide-react';

export default function WeeklyPlanCard({ plan, t }) {
  const [open, setOpen] = useState(false);
  const [expandedDay, setExpandedDay] = useState(null);

  if (!plan || !plan.days || plan.days.length === 0) return null;

  return React.createElement('div', { className: 'card weekly-plan-card', style: { padding: 0, overflow: 'hidden' } },
    // Header
    React.createElement('button', {
      className: 'collapsible__header',
      onClick: () => setOpen(!open),
      style: { borderBottom: open ? '1px solid var(--border)' : 'none' },
    },
      React.createElement(Calendar, { size: 18, style: { marginRight: '8px' } }),
      React.createElement('span', null, 'План на неделю'),
      React.createElement('span', { style: { marginLeft: 'auto', fontSize: '0.75rem', color: 'var(--text2)' } }, plan.weekLabel),
      React.createElement('span', { style: { marginLeft: '8px', fontSize: '0.8rem', color: 'var(--text3)' } }, open ? React.createElement(ChevronUp, { size: 16 }) : React.createElement(ChevronDown, { size: 16 }))
    ),
    open && React.createElement('div', {
      className: 'collapsible__body',
      'data-open': '',
      style: { padding: 'var(--spacing-xs) var(--spacing-md) var(--spacing-md)' }
    },
      React.createElement('div', { style: { display: 'flex', flexDirection: 'column', gap: '6px' } },
        plan.days.map((day, idx) =>
          React.createElement('div', {
            key: day.iso,
            className: `weekly-plan-day${day.isToday ? ' is-today' : ''}${day.session && !day.session.isRestDay ? ' has-training' : ''}`,
            style: {
              display: 'flex', flexDirection: 'column', gap: '4px',
              padding: '8px 10px', borderRadius: 'var(--radius-sm)',
              backgroundColor: day.isToday ? 'var(--surface-2)' : 'transparent',
              border: `1px solid ${day.isToday ? 'var(--accent-green)' : 'var(--border)'}`,
              cursor: day.session ? 'pointer' : 'default',
              transition: 'all 0.15s ease',
            },
            onClick: day.session ? () => setExpandedDay(expandedDay === day.iso ? null : day.iso) : undefined,
          },

            // Day header: name + sport + rehabilitation badge
            React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' } },
              React.createElement('span', { style: { fontWeight: day.isToday ? 700 : 500 } },
                day.dayLabel,
                day.isToday ? ' (сегодня)' : ''
              ),
              React.createElement('span', { style: { display: 'flex', gap: '6px', alignItems: 'center' } },
day.rehabExercises.length > 0 && React.createElement('span', {
                   title: 'Реабилитационные упражнения',
                   style: { fontSize: '0.7rem', padding: '1px 6px', borderRadius: '100px', backgroundColor: 'rgba(96,165,250,0.15)', color: 'var(--blue)' }
                 }, 'РЕХАБ'),
                day.session && !day.session.isRestDay
                  ? React.createElement('span', { style: { fontSize: '0.75rem', padding: '1px 6px', borderRadius: '100px', backgroundColor: 'rgba(74,222,128,0.12)', color: 'var(--green)' } }, day.session.sport)
                  : React.createElement('span', { style: { fontSize: '0.75rem', color: 'var(--text3)' } }, t ? t('today.rest') : 'Отдых')
              )
            ),

            // Day expanded: exercise list
            expandedDay === day.iso && day.session && React.createElement('div', {
              style: { marginTop: '6px', paddingLeft: '4px', borderLeft: '2px solid var(--border)' }
            },
              // Pre-workout rehab exercises
day.rehabExercises.length > 0 && React.createElement('div', { style: { marginBottom: '4px' } },
                 React.createElement('div', { style: { fontSize: '0.7rem', color: 'var(--blue)', marginBottom: '2px', fontWeight: 600 } },
                   'Реабилитационные'
                 ),
                day.rehabExercises.map((ex, ei) =>
                  React.createElement('div', {
                    key: `rehab-${ei}`,
                    style: { fontSize: '0.75rem', padding: '2px 0', display: 'flex', justifyContent: 'space-between' }
                  },
                    React.createElement('span', { style: { color: 'var(--text2)' } }, ex.n),
                    React.createElement('span', { style: { color: 'var(--text3)', fontSize: '0.7rem' } }, `${ex.s}×${ex.r}`)
                  )
                )
              ),
              // Main exercises
              day.session.exercises && day.session.exercises.map((ex, ei) =>
                React.createElement('div', {
                  key: `main-${ei}`,
                  style: { fontSize: '0.75rem', padding: '2px 0', display: 'flex', justifyContent: 'space-between' }
                },
                  React.createElement('span', { style: { color: 'var(--text)' } }, ex.n),
                  React.createElement('span', { style: { color: 'var(--text3)', fontSize: '0.7rem' } }, `${ex.s}×${ex.r}`)
                )
              ),
              // Mode badge
              day.session.mode && day.session.mode !== 'full' && React.createElement('div', {
                style: { marginTop: '4px', fontSize: '0.7rem', color: 'var(--yellow)' }
              }, day.session.isDeload ? 'Разгрузка' : `Rezhim: ${day.session.mode}`),

              // Modifications
              day.modifications.length > 0 && React.createElement('div', { style: { marginTop: '2px' } },
                day.modifications.map((mod, mi) =>
                  React.createElement('div', {
                    key: `mod-${mi}`,
                    style: { fontSize: '0.65rem', color: 'var(--text3)', padding: '1px 0' }
                  }, mod)
                )
              )
            )
          )
        )
      )
    )
  );
}