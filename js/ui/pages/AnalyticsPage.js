// js/ui/pages/AnalyticsPage.js
// Страница аналитики — потребляет context, использует sub-components

import React, { useState, useContext } from 'react';
import { AppStateContext } from '../../core/AppContext.js';
import TrendChart from './TrendChart.js';
import WarningsList from './WarningsList.js';
import WeeklySummary from './WeeklySummary.js';

export default function AnalyticsPage() {
  const state = useContext(AppStateContext);
  const {
    trendData7, trendData30, rpeTrend7, rpeTrend30,
    weeklyAverages, trendWarnings, overtrainingWarning,
    weeklySummary, monthStats,
  } = state;

  const [trendDays, setTrendDays] = useState(7);

  const currentTrend = trendDays === 7 ? trendData7 : trendData30;
  const currentRpe = trendDays === 7 ? rpeTrend7 : rpeTrend30;

  const scoreColor = 'var(--green)';
  const hrvColor = 'var(--blue)';
  const hrColor = 'var(--yellow)';
  const rpeColor = 'var(--accent)';

  return React.createElement(
    'div',
    { className: 'page-enter' },

    React.createElement('h2', null, 'Аналитика'),

    React.createElement(
      'p',
      { className: 'text-sm', style: { color: 'var(--text2)', marginBottom: 'var(--spacing-md)' } },
      'Динамика показателей восстановления и прогноз риска перетренированности'
    ),

    // ── Warning banner ──
    React.createElement(WarningsList, { overtrainingWarning, trendWarnings }),

    // ── Weekly summary ──
    React.createElement(WeeklySummary, { weeklySummary, monthStats }),

    // ── Toggle 7 / 30 days ──
    React.createElement(
      'div',
      {
        style: {
          display: 'flex',
          gap: 'var(--spacing-xs)',
          justifyContent: 'flex-end',
          marginBottom: 'var(--spacing-sm)',
        }
      },
      [7, 30].map(d =>
        React.createElement(
          'button',
          {
            key: d,
            onClick: () => setTrendDays(d),
            style: {
              padding: '0.3rem 0.75rem',
              fontSize: 'var(--font-size-caption)',
              minHeight: '32px',
              backgroundColor: trendDays === d ? 'var(--accent)' : 'var(--surface2)',
              color: trendDays === d ? '#fff' : 'var(--text2)',
              border: `1px solid ${trendDays === d ? 'var(--accent)' : 'var(--border)'}`,
              borderRadius: '100px',
              cursor: 'pointer',
              fontWeight: trendDays === d ? 600 : 400,
              transition: 'all var(--transition)',
            }
          },
          d === 7 ? '7 дней' : '30 дней'
        )
      )
    ),

    // ── Recovery Score ──
    React.createElement(
      'div',
      { className: 'card chart-card' },
      React.createElement(
        'div',
        { className: 'chart-header' },
        React.createElement('span', { className: 'chart-title', style: { color: scoreColor } }, 'Recovery Score')
      ),
      React.createElement(TrendChart, {
        data: currentTrend,
        yKey: 'recoveryScore',
        color: scoreColor,
        unit: '%',
      })
    ),

    // ── HRV ──
    React.createElement(
      'div',
      { className: 'card chart-card' },
      React.createElement(
        'div',
        { className: 'chart-header' },
        React.createElement('span', { className: 'chart-title', style: { color: hrvColor } }, 'HRV (мс)')
      ),
      React.createElement(TrendChart, {
        data: currentTrend,
        yKey: 'hrv',
        color: hrvColor,
        unit: 'мс',
      })
    ),

    // ── Rest HR ──
    React.createElement(
      'div',
      { className: 'card chart-card' },
      React.createElement(
        'div',
        { className: 'chart-header' },
        React.createElement('span', { className: 'chart-title', style: { color: hrColor } }, 'ЧСС покоя (уд/мин)')
      ),
      React.createElement(TrendChart, {
        data: currentTrend,
        yKey: 'restHR',
        color: hrColor,
        unit: 'уд/мин',
      })
    ),

    // ── RPE ──
    currentRpe.length > 0 &&
      React.createElement(
        'div',
        { className: 'card chart-card' },
        React.createElement(
          'div',
          { className: 'chart-header' },
          React.createElement('span', { className: 'chart-title', style: { color: rpeColor } }, 'RPE тренировок')
        ),
        React.createElement(TrendChart, {
          data: currentRpe,
          yKey: 'rpe',
          color: rpeColor,
          unit: '',
        })
      ),

    // ── Weekly averages table ──
    weeklyAverages.length >= 2 &&
      React.createElement(
        'div',
        { className: 'card' },
        React.createElement(
          'h4',
          { style: { margin: '0 0 var(--spacing-sm) 0', fontSize: 'var(--font-size-body)', color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.03em' } },
          'Среднее за неделю'
        ),
        React.createElement(
          'div',
          { style: { overflowX: 'auto' } },
          React.createElement(
            'table',
            { className: 'weekly-table' },
            React.createElement(
              'thead',
              null,
              React.createElement(
                'tr',
                null,
                React.createElement('th', null, 'Неделя'),
                React.createElement('th', { style: { textAlign: 'center', color: scoreColor } }, 'Recovery'),
                React.createElement('th', { style: { textAlign: 'center', color: hrvColor } }, 'HRV'),
                React.createElement('th', { style: { textAlign: 'center', color: hrColor } }, 'ЧСС')
              )
            ),
            React.createElement(
              'tbody',
              null,
              weeklyAverages.map((w, i) => {
                const date = w.weekStart ? w.weekStart.slice(5) : '?';
                const prevScore = i > 0 ? weeklyAverages[i - 1].avgRecoveryScore : w.avgRecoveryScore;
                const scoreDelta = w.avgRecoveryScore - prevScore;
                const deltaClass = scoreDelta > 0 ? 'delta-up' : scoreDelta < 0 ? 'delta-down' : 'delta-flat';
                const deltaSign = scoreDelta > 0 ? '+' : '';

                return React.createElement(
                  'tr',
                  { key: i },
                  React.createElement('td', { style: { fontFamily: 'var(--font-mono)', fontSize: 'var(--font-size-caption)' } }, `с ${date}`),
                  React.createElement(
                    'td',
                    { style: { textAlign: 'center', fontWeight: 600 } },
                    w.avgRecoveryScore,
                    i > 0 && React.createElement(
                      'span',
                      { className: deltaClass, style: { marginLeft: 'var(--spacing-xs)', fontSize: 'var(--font-size-caption)' } },
                      `${deltaSign}${scoreDelta}`
                    )
                  ),
                  React.createElement(
                    'td',
                    { style: { textAlign: 'center', color: 'var(--text2)' } },
                    w.avgHrv > 0 ? w.avgHrv : '—'
                  ),
                  React.createElement(
                    'td',
                    { style: { textAlign: 'center', color: 'var(--text2)' } },
                    w.avgRestHR > 0 ? w.avgRestHR : '—'
                  )
                );
              })
            )
          )
        )
      ),

    // ── Empty state ──
    currentTrend.length === 0 &&
      React.createElement(
        'div',
        { className: 'empty-state' },
        React.createElement('div', { className: 'empty-state-icon' }, '📊'),
        React.createElement('div', { className: 'empty-state-text' }, 'Пока нет данных для анализа.'),
        React.createElement(
          'div',
          { className: 'empty-state-hint' },
          'Заполняй чек-ины ежедневно, и через несколько дней здесь будут графики твоих трендов.'
        )
      )
  );
}
