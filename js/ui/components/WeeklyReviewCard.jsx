import React from 'react';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

/**
 * @param {{
 *   bestLift: { exerciseName: string; currentWeight: number; previousWeight: number; unit: string } | null
 *   sessionsCompleted: number
 *   totalPlannedSessions: number
 *   avgScoreCurrent: number | null
 *   avgScorePrevious: number | null
 *   onDismiss: () => void
 *   onNavigateAnalytics: () => void
 * }} props
 */
export default function WeeklyReviewCard({ bestLift, sessionsCompleted, totalPlannedSessions, avgScoreCurrent, avgScorePrevious, onDismiss, onNavigateAnalytics }) {
  const { t } = useTranslation();

  const planned = totalPlannedSessions || sessionsCompleted;
  const hasScoreData = avgScoreCurrent !== null && avgScorePrevious !== null;

  return React.createElement('div', {
    className: 'weekly-review-card',
    style: {
      background: 'var(--surface2)',
      borderRadius: 'var(--radius)',
      padding: '16px',
      marginBottom: '12px',
      position: 'relative',
      boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
    },
  },
    // Dismiss button
    React.createElement('button', {
      onClick: onDismiss,
      style: {
        position: 'absolute', top: '8px', right: '8px',
        background: 'none', border: 'none', color: 'var(--text3)',
        cursor: 'pointer', padding: '4px',
      },
      'aria-label': 'Dismiss',
    }, React.createElement(X, { size: 18 })),

    // Line 1: Best lift delta
    bestLift
      ? React.createElement('p', {
        style: { margin: '0 0 6px', fontSize: '0.9rem', lineHeight: 1.4, paddingRight: '20px' },
      }, t('weekReview.bestLift', {
        exercise: bestLift.exerciseName,
        prev: bestLift.previousWeight,
        current: bestLift.currentWeight,
        unit: bestLift.unit,
      }))
      : React.createElement('p', {
        style: { margin: '0 0 6px', fontSize: '0.9rem', lineHeight: 1.4, color: 'var(--text3)', paddingRight: '20px' },
      }, t('weekReview.noLiftData')),

    // Line 2: Sessions completed
    React.createElement('p', {
      style: { margin: '0 0 6px', fontSize: '0.9rem', lineHeight: 1.4 },
    },
      t('weekReview.sessionsCompleted', { completed: sessionsCompleted, planned }),
      ' ',
      sessionsCompleted >= planned ? '· ' + t('weekReview.bestWeek') : '',
    ),

    // Line 3: Average score comparison
    hasScoreData && React.createElement('p', {
      style: { margin: '0 0 6px', fontSize: '0.9rem', lineHeight: 1.4 },
    }, t('weekReview.avgScore', { current: avgScoreCurrent, previous: avgScorePrevious })),

    // Adjustment line
    React.createElement('p', {
      style: { margin: '0 0 6px', fontSize: '0.85rem', lineHeight: 1.4, color: 'var(--green)' },
    },
      sessionsCompleted >= planned
        ? t('weekReview.nextWeekAdjustUp', { pct: 10 })
        : t('weekReview.nextWeekMaintain')
    ),

    // Footer: link to analytics
    React.createElement('div', {
      style: { textAlign: 'right', marginTop: '4px' },
    },
      React.createElement('button', {
        onClick: onNavigateAnalytics,
        style: {
          background: 'none', border: 'none', color: 'var(--accent)',
          fontSize: '0.8rem', cursor: 'pointer',
        },
      }, t('weekReview.detailedAnalytics'))
    ),
  );
}
