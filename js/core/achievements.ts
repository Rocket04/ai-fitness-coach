// js/core/achievements.ts
// Achievement evaluation and storage logic

import type { Checkin, Session } from './types.js';
import ACHIEVEMENTS from '../config/achievements.js';
import { getActiveDatabase } from './storage.js';
import { getAllStreaks } from './streak.js';

export interface Achievement {
  key: string;
  name: string;
  tier: string;
  category: string;
  icon: string;
  description: string;
  earnedAt?: number;
}

export interface UserAchievement {
  id?: number;
  achievementKey: string;
  earnedAt: number;
}

/**
 * Get all unlocked achievements for the user
 */
export async function getUnlockedAchievements(): Promise<UserAchievement[]> {
  try {
    return await getActiveDatabase().achievements.toArray();
  } catch {
    return [];
  }
}

/**
 * Check which achievements are newly unlocked
 */
export async function checkAchievements(
  sessions: Session[],
  checkins: Checkin[],
  trainDays: number[],
  startDate: string | null
): Promise<Achievement[]> {
  const unlocked = await getUnlockedAchievements();
  const unlockedKeys = new Set(unlocked.map(a => a.achievementKey));
  
  const streaks = getAllStreaks(checkins, sessions, trainDays, startDate);
  const newAchievements: Achievement[] = [];
  
  for (const achievement of ACHIEVEMENTS) {
    // Skip if already unlocked
    if (unlockedKeys.has(achievement.key)) continue;
    
    // Evaluate the achievement
    if (achievement.test(sessions, checkins, streaks.checkinStreak)) {
      newAchievements.push({
        ...achievement,
        earnedAt: Date.now(),
      });
    }
  }
  
  // Save newly unlocked achievements
  if (newAchievements.length > 0) {
    await saveUnlockedAchievements(newAchievements);
  }
  
  return newAchievements;
}

/**
 * Save unlocked achievements to database
 */
export async function saveUnlockedAchievements(achievements: Achievement[]): Promise<void> {
  try {
    const records = achievements.map(a => ({
      achievementKey: a.key,
      earnedAt: a.earnedAt || Date.now(),
    }));
    await getActiveDatabase().achievements.bulkAdd(records);
  } catch (err) {
    console.error('Failed to save achievements:', err);
  }
}

/**
 * Get all achievements with unlock status and progress
 */
export async function getAchievementStatus(
  sessions: Session[],
  checkins: Checkin[],
  trainDays: number[],
  startDate: string | null
): Promise<Achievement[]> {
  const unlocked = await getUnlockedAchievements();
  const unlockedKeys = new Set(unlocked.map(a => a.achievementKey));
  const unlockedMap = new Map(unlocked.map(a => [a.achievementKey, a.earnedAt]));
  
  const streaks = getAllStreaks(checkins, sessions, trainDays, startDate);
  
  return ACHIEVEMENTS.map(achievement => {
    const isUnlocked = unlockedKeys.has(achievement.key);
    return {
      ...achievement,
      earnedAt: isUnlocked ? unlockedMap.get(achievement.key) : undefined,
      progress: achievement.progress
        ? achievement.progress(sessions, checkins, streaks.checkinStreak)
        : undefined,
    };
  });
}

/**
 * Reset all achievements (for testing or fresh start)
 */
export async function resetAchievements(): Promise<void> {
  await getActiveDatabase().achievements.clear();
}

/**
 * Group achievements by tier
 */
export function groupByTier(achievements: Achievement[]): Record<string, Achievement[]> {
  return achievements.reduce((acc, a) => {
    if (!acc[a.tier]) acc[a.tier] = [];
    acc[a.tier].push(a);
    return acc;
  }, {} as Record<string, Achievement[]>);
}

/**
 * Group achievements by category
 */
export function groupByCategory(achievements: Achievement[]): Record<string, Achievement[]> {
  return achievements.reduce((acc, a) => {
    if (!acc[a.category]) acc[a.category] = [];
    acc[a.category].push(a);
    return acc;
  }, {} as Record<string, Achievement[]>);
}