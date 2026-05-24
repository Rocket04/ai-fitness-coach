// js/ui/pages/AchievementsPage.jsx
// Dedicated page for viewing achievements

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Trophy, Lock, CheckCircle2 } from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore.js';
import { getAchievementStatus } from '../../core/achievements.js';
import StreakBadge from '../components/StreakBadge.jsx';
import AchievementToast from '../components/AchievementToast.jsx';
import './AchievementsPage.css';

function AchievementsPage() {
  const { t } = useTranslation();
  const { sessions, checkins, trainDays, startDate, streak } = useAppStore();
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newAchievement, setNewAchievement] = useState(null);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    loadAchievements();
  }, [sessions, checkins, trainDays, startDate]);

  const loadAchievements = async () => {
    setLoading(true);
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
    return React.createElement('div', { className: 'achievements-page' },
      React.createElement('div', { className: 'loading' }, 'Loading achievements...')
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
          style: { width: `${(unlockedCount / totalCount) * 100}%` }
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