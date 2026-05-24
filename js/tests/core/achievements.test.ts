// js/tests/core/achievements.test.ts
import { describe, it, expect } from 'vitest';
import type { Checkin, Session } from '../../core/types.js';

function makeCheckin(date: string, overrides: Partial<Checkin> = {}): Checkin {
  return {
    date,
    sleepHours: 7,
    restHR: 60,
    hrv: 50,
    hipPain: 0,
    shoulderPain: 0,
    breathing: 'good',
    weight: 70,
    muscleSoreness: 0,
    energy: 5,
    mood: 5,
    sleepQuality: 5,
    stress: 3,
    readiness: 'green',
    ts: Date.now(),
    ...overrides,
  };
}

function makeSession(date: string, type: 'A' | 'B' | 'C' | 'morning' | 'evening' = 'A', completed = true): Session {
  return {
    key: `${date}_${type}`,
    date,
    type,
    completed,
    readiness: 'green',
    rpe: 7,
    notes: '',
    updatedAt: Date.now(),
  };
}

describe('Achievement System', () => {
  it('achievements config has 15+ achievements', async () => {
    const ACHIEVEMENTS = (await import('../../config/achievements.js')).default;
    expect(ACHIEVEMENTS.length).toBeGreaterThanOrEqual(15);
  });

  it('achievements have bronze/silver/gold tiers', async () => {
    const { ACHIEVEMENT_TIERS } = await import('../../config/achievements.js');
    expect(ACHIEVEMENT_TIERS.BRONZE).toBe('bronze');
    expect(ACHIEVEMENT_TIERS.SILVER).toBe('silver');
    expect(ACHIEVEMENT_TIERS.GOLD).toBe('gold');
  });

  it('checkAchievements function exists and is callable', async () => {
    const { checkAchievements } = await import('../../core/achievements.js');
    expect(typeof checkAchievements).toBe('function');
  });

  it('getAchievementStatus function exists and is callable', async () => {
    const { getAchievementStatus } = await import('../../core/achievements.js');
    expect(typeof getAchievementStatus).toBe('function');
  });

  it('getUnlockedAchievements function exists and is callable', async () => {
    const { getUnlockedAchievements } = await import('../../core/achievements.js');
    expect(typeof getUnlockedAchievements).toBe('function');
  });

  // Test achievement test functions directly
  // Note: test functions receive (sessions, checkins, streak) 
  it('checkin_first test works correctly', async () => {
    const ACHIEVEMENTS = (await import('../../config/achievements.js')).default;
    const checkinFirst = ACHIEVEMENTS.find(a => a.key === 'checkin_first')!;
    expect(checkinFirst).toBeDefined();
    
    // Test receives (sessions, checkins, streak) - checkins is 2nd param
    // Test with 0 checkins
    expect(checkinFirst.test([], [], 0)).toBe(false);
    
    // Test with 1 checkin - pass checkins as second argument
    expect(checkinFirst.test([], [makeCheckin('2025-01-10')], 1)).toBe(true);
  });

  it('workout_first test works correctly', async () => {
    const ACHIEVEMENTS = (await import('../../config/achievements.js')).default;
    const workoutFirst = ACHIEVEMENTS.find(a => a.key === 'workout_first')!;
    expect(workoutFirst).toBeDefined();
    
    // Test receives (sessions, checkins, streak) - sessions is 1st param
    // Test with no sessions
    expect(workoutFirst.test([], [], 0)).toBe(false);
    
    // Test with one workout session
    expect(workoutFirst.test([makeSession('2025-01-10', 'A')], [], 0)).toBe(true);
    
    // Test with morning session (should not count)
    expect(workoutFirst.test([makeSession('2025-01-10', 'morning')], [], 0)).toBe(false);
  });

  it('streak_checkin_3 test works correctly', async () => {
    const ACHIEVEMENTS = (await import('../../config/achievements.js')).default;
    const streakCheckin = ACHIEVEMENTS.find(a => a.key === 'streak_checkin_3')!;
    expect(streakCheckin).toBeDefined();
    
    // Test receives (sessions, checkins, streak) - streak is 3rd param
    // Test with streak < 3
    expect(streakCheckin.test([], [], 2)).toBe(false);
    
    // Test with streak >= 3
    expect(streakCheckin.test([], [], 3)).toBe(true);
  });
});