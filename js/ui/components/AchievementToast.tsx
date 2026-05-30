// js/ui/components/AchievementToast.tsx
// Celebratory toast notification for unlocked achievements

import { useEffect, useState } from 'react';
import { Trophy, Medal } from 'lucide-react';
import { useAppStore } from '../../store/index.js';
import styles from './AchievementToast.module.css';

const TIER_CONFIG = {
  bronze: { 
    label: 'Bronze', 
    icon: Medal, 
    color: 'var(--bronze)',
    bg: 'linear-gradient(135deg, #cd7f32, #a8763e)'
  },
  silver: { 
    label: 'Silver', 
    icon: Medal, 
    color: 'var(--silver)',
    bg: 'linear-gradient(135deg, #c0c0c0, #a0a0a0)'
  },
  gold: { 
    label: 'Gold', 
    icon: Trophy, 
    color: 'var(--gold)',
    bg: 'linear-gradient(135deg, #ffd700, #daa520)'
  },
};

export default function AchievementToast() {
  const { pendingAchievement, clearPendingAchievement } = useAppStore();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (pendingAchievement) {
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
        setTimeout(() => clearPendingAchievement(), 300);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [pendingAchievement, clearPendingAchievement]);

  if (!pendingAchievement) return null;

  const config = TIER_CONFIG[pendingAchievement.tier as keyof typeof TIER_CONFIG] || TIER_CONFIG.bronze;
  const TierIcon = config.icon;

  return (
    <div className={`${styles['achievement-toast']} ${visible ? styles['achievement-toast--visible'] : ''}`}>
      <div className={styles['achievement-toast__icon']} style={{ background: config.bg }}>
        <span className={styles['achievement-toast__emoji']}>{pendingAchievement.icon}</span>
        <TierIcon className={styles['achievement-toast__tier-icon']} />
      </div>
      <div className={styles['achievement-toast__content']}>
        <div className={styles['achievement-toast__label']}>Achievement Unlocked!</div>
        <div className={styles['achievement-toast__name']}>{pendingAchievement.name}</div>
        <div className={styles['achievement-toast__tier']}>{config.label}</div>
      </div>
      <button className={styles['achievement-toast__close']} onClick={() => { setVisible(false); setTimeout(clearPendingAchievement, 300); }}>
        ×
      </button>
    </div>
  );
}