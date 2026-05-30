// js/ui/pages/AnalyticsPage.js
// Страница аналитики — потребляет context, использует sub-components

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { TrendingUp, BarChart } from 'lucide-react';
import { useAppStore } from '../../store/index.js';
import TrendChart from './TrendChart.tsx';
import WarningsList from './WarningsList.jsx';
import WeeklySummary from './WeeklySummary.jsx';
import EmptyState from '../components/EmptyState.jsx';
import { SkeletonLine } from '../components/Skeleton.jsx';

export default function AnalyticsPage() {
  const { t } = useTranslation();
  const state = useAppStore();
  
  // Guard: store not ready
  if (!state || !state.dataLoaded) {
    return React.createElement(
      'div',
      { className: 'page-enter' },
      React.createElement('h2', null, t('analytics.title')),
      React.createElement('div', { className: 'card', style: { textAlign: 'center', padding: 'var(--spacing-xl)' } },
        React.createElement('p', { className: 'text-muted' }, 'Загрузка аналитики...')
      )
    );
  }
  
  const {
    trendData7, trendData30, rpeTrend7, rpeTrend30,
    weeklyAverages, trendWarnings, overtrainingWarning,
    weeklySummary, monthStats, setActiveTab,
  } = state;

  const [trendDays, setTrendDays] = useState(7);

  const currentTrend = trendDays === 7 ? trendData7 : trendData30;
  const currentRpe = trendDays === 7 ? rpeTrend7 : rpeTrend30;

  const scoreColor = 'var(--green)';
  const hrvColor = 'var(--blue)';
  const hrColor = 'var(--yellow)';
  const rpeColor = 'var(--accent)';

  if (!currentTrend || currentTrend.length < 2) {
    return React.createElement(
      'div',
      { className: 'page-enter', 'data-testid': 'analytics-empty' },
      React.createElement('h2', null, t('analytics.title')),
      React.createElement(EmptyState, {
        icon: React.createElement(TrendingUp, { size: 20 }),
        title: t('analytics.insufficientData'),
        subtitle: t('analytics.needMinimumCheckins'),
      }),
      React.createElement(
        'button',
        {
          className: 'btn btn-accent w-full mt-md',
          onClick: () => setActiveTab(1),
          style: { maxWidth: '300px', margin: 'var(--spacing-md) auto', display: 'block' }
        },
        t('analytics.goToCheckin')
      ),
      // Skeleton chart placeholders
      React.createElement(
        'div',
        { className: 'card chart-card mt-lg' },
        React.createElement(
          'div',
          { className: 'chart-header' },
          React.createElement('span', { className: 'chart-title', style: { color: scoreColor } }, t('analytics.recoveryScore'))
        ),
        React.createElement(SkeletonLine, { width: '100%', height: '120px', borderRadius: '8px' })
      ),
      React.createElement(
        'div',
        { className: 'card chart-card mt-md' },
        React.createElement(
          'div',
          { className: 'chart-header' },
          React.createElement('span', { className: 'chart-title', style: { color: hrvColor } }, t('analytics.hrv'))
        ),
        React.createElement(SkeletonLine, { width: '100%', height: '120px', borderRadius: '8px' })
      ),
      React.createElement(
        'div',
        { className: 'card chart-card mt-md' },
        React.createElement(
          'div',
          { className: 'chart-header' },
          React.createElement('span', { className: 'chart-title', style: { color: hrColor } }, t('analytics.restHR'))
        ),
        React.createElement(SkeletonLine, { width: '100%', height: '120px', borderRadius: '8px' })
      ),
      React.createElement(
        'div',
        { className: 'card chart-card mt-md' },
        React.createElement(
          'div',
          { className: 'chart-header' },
          React.createElement('span', { className: 'chart-title', style: { color: rpeColor } }, t('analytics.rpe'))
        ),
        React.createElement(SkeletonLine, { width: '100%', height: '120px', borderRadius: '8px' })
      )
    );
  }

  return React.createElement(
    'div',
    { className: 'page-enter' },

    React.createElement('h2', null, 'Аналитика'),

    React.createElement(
      'p',
      { className: 'text-sm', style: { color: 'var(--text2)', marginBottom: 'var(--spacing-md)' } },
'Тренды HRV, сна и RPE — ранние сигналы перетренированности'
    ),

    // ── Warning banner ──
    React.createElement('div', { 'data-testid': 'warnings-list' },
      React.createElement(WarningsList, { overtrainingWarning, trendWarnings })
    ),

    // ── Weekly summary ──
    React.createElement(WeeklySummary, {
      weeklySummary: weeklySummary || { completed: 0, avgRPE: null, green: 0, yellow: 0, red: 0, dominantStatus: '' },
      monthStats: monthStats || { completed: 0, green: 0, yellow: 0, red: 0 },
    }),

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
      { className: 'card chart-card', 'data-testid': 'trend-chart' },
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


  );
}
