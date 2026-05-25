// js/ui/pages/AchievementsPage.jsx
// Dedicated page for viewing achievements

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Trophy, Lock, CheckCircle2, Inbox } from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore.js';
import { getAchievementStatus } from '../../core/achievements.js';
import StreakBadge from '../components/StreakBadge.jsx';
import AchievementToast from '../components/AchievementToast.jsx';
import EmptyState from '../components/EmptyState.jsx';
import { SkeletonCard } from '../components/Skeleton.jsx';
import './AchievementsPage.css';

function AchievementsPage() {
  const { t } = useTranslation();
  const { sessions, checkins, trainDays, startDate, streak } = useAppStore();
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newAchievement, setNewAchievement] = useState(null);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    loadAchievements();
  }, [sessions, checkins, trainDays, startDate]);

  const loadAchievements = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAchievementStatus(sessions, checkins, trainDays, startDate);
      setAchievements(data);
      
      // Check for newly unlocked
      const newlyUnlocked = data.filter(a => a.justUnlocked);
      if (newlyUnlocked.length > 0) {
        setNewAchievement(newlyUnlocked[0]);
      }
    } catch (err) {
      console.error('Failed to load achievements:', err);
      setError(err?.message || 'Не удалось загрузить достижения');
    } finally {
      setLoading(false);
    }
  };

  const categories = ['all', 'checkin', 'workout', 'streak', 'recovery', 'test', 'consistency'];
  const tiers = ['bronze', 'silver', 'gold'];

  const filteredAchievements = achievements.filter(a => {
    if (activeTab === 'all') return true;
    return a.category === activeTab;
  });

  const unlockedCount = achievements.filter(a => a.earnedAt).length;
  const totalCount = achievements.length;

  if (loading) {
    return React.createElement(
      'div',
      { className: 'achievements-page' },
      React.createElement(SkeletonCard, { rows: 2 }),
      React.createElement('div', { style: { height: 'var(--spacing-md)' } }),
      React.createElement(SkeletonCard, { rows: 3 }),
      React.createElement('div', { style: { height: 'var(--spacing-md)' } }),
      React.createElement(SkeletonCard, { rows: 3 })
    );
  }

  // Error state
  if (error) {
    return React.createElement(
      'div',
      { className: 'achievements-page' },
      React.createElement('div', {
        className: 'card',
        style: {
          textAlign: 'center',
          padding: 'var(--spacing-xl)',
          color: 'var(--red)',
        },
      },
        React.createElement('p', null, error),
        React.createElement(
          'button',
          {
            className: 'btn btn-accent mt-md',
            onClick: loadAchievements,
          },
          'Повторить'
        )
      )
    );
  }

  // Empty state: no achievements at all (shouldn't happen with default config)
  if (!achievements || achievements.length === 0) {
    return React.createElement(
      'div',
      { className: 'achievements-page' },
      React.createElement(EmptyState, {
        icon: React.createElement(Inbox, { size: 20 }),
        title: 'Пока нет достижений',
        subtitle: 'Достижения появятся по мере тренировок и чек-инов.',
      })
    );
  }

  return React.createElement('div', { className: 'achievements-page' },
    // Header with streak
    React.createElement('div', { className: 'achievements-header' },
      React.createElement('h2', null, t('achievements.title')),
      React.createElement(StreakBadge, { streak, label: t('achievements.streak') })
    ),
    
    // Progress summary
    React.createElement('div', { className: 'achievements-summary' },
      React.createElement('div', { className: 'achievements-progress' },
        React.createElement('span', { className: 'achievements-count' }, 
          `${unlockedCount} / ${totalCount}`
        ),
        React.createElement('span', { className: 'achievements-label' }, t('achievements.unlocked'))
      ),
      React.createElement('div', { className: 'achievements-bar' },
        React.createElement('div', { 
          className: 'achievements-bar__fill',
          style: { width: `${totalCount > 0 ? (unlockedCount / totalCount) * 100 : 0}%` }
        })
      )
    ),

    // Category tabs
    React.createElement('div', { className: 'achievements-tabs' },
      categories.map(cat =>
        React.createElement('button', {
          key: cat,
          className: `achievements-tab ${activeTab === cat ? 'active' : ''}`,
          onClick: () => setActiveTab(cat)
        }, t(`achievements.categories.${cat}`))
      )
    ),

    // Tier sections
    tiers.map(tier => {
      const tierAchievements = filteredAchievements.filter(a => a.tier === tier);
      if (tierAchievements.length === 0) return null;

      return React.createElement('div', { key: tier, className: 'achievements-tier' },
        React.createElement('h3', { className: `achievements-tier__title achievements-tier__title--${tier}` },
          React.createElement(Trophy, { size: 20, className: `achievements-tier__icon--${tier}` }),
          t(`achievements.tiers.${tier}`)
        ),
        React.createElement('div', { className: 'achievements-grid' },
          tierAchievements.map(a =>
            React.createElement('div', {
              key: a.key,
              className: `achievements-card ${a.earnedAt ? 'unlocked' : 'locked'}`
            },
              React.createElement('div', { className: 'achievements-card__icon' }, a.icon),
              React.createElement('div', { className: 'achievements-card__content' },
                React.createElement('div', { className: 'achievements-card__name' }, a.name),
                React.createElement('div', { className: 'achievements-card__desc' }, a.description),
                a.progress && !a.earnedAt && React.createElement('div', { className: 'achievements-progress-bar' },
                  React.createElement('div', { 
                    className: 'achievements-progress-bar__fill',
                    style: { width: `${Math.min(100, (a.progress.current / a.progress.target) * 100)}%` }
                  })
                )
              ),
              React.createElement('div', { className: 'achievements-card__status' },
                a.earnedAt 
                  ? React.createElement(CheckCircle2, { size: 20, className: 'status-unlocked' })
                  : React.createElement(Lock, { size: 20, className: 'status-locked' })
              )
            )
          )
        )
      );
    }),

    // Achievement toast notification
    newAchievement && React.createElement(AchievementToast, {
      achievement: newAchievement,
      onClose: () => setNewAchievement(null)
    })
  );
}

export default AchievementsPage;