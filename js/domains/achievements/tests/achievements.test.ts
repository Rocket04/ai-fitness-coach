// js/domains/achievements/tests/achievements.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Checkin, Session } from '../../../core/types.js';

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

const mockToArray = vi.fn();
const mockBulkAdd = vi.fn();
const mockClear = vi.fn();

vi.mock('../../../data/storage.js', () => ({
  getActiveDatabase: () => ({
    achievements: {
      toArray: () => mockToArray(),
      bulkAdd: (...args: any[]) => mockBulkAdd(...args),
      clear: () => mockClear(),
    },
  }),
}));

describe('Achievement System', () => {
  beforeEach(() => {
    mockToArray.mockReset();
    mockBulkAdd.mockReset();
    mockClear.mockReset();
  });

  describe('checkAchievements', () => {
    it('first checkin unlocks First Check-in achievement', async () => {
      mockToArray.mockResolvedValue([]);
      const { checkAchievements } = await import('../achievements.js');
      const newAchievements = await checkAchievements([], [makeCheckin('2025-01-10')], [], null);
      expect(newAchievements.some(a => a.key === 'checkin_first')).toBe(true);
    });

    it('completed workout unlocks First Workout achievement', async () => {
      mockToArray.mockResolvedValue([]);
      const { checkAchievements } = await import('../achievements.js');
      const newAchievements = await checkAchievements([makeSession('2025-01-10', 'A')], [], [], null);
      expect(newAchievements.some(a => a.key === 'workout_first')).toBe(true);
    });

    it('no data yields no new achievements', async () => {
      mockToArray.mockResolvedValue([]);
      const { checkAchievements } = await import('../achievements.js');
      const newAchievements = await checkAchievements([], [], [], null);
      expect(newAchievements).toHaveLength(0);
    });

    it('already-unlocked achievements are skipped', async () => {
      mockToArray.mockResolvedValue([{ achievementKey: 'checkin_first', earnedAt: Date.now() }]);
      const { checkAchievements } = await import('../achievements.js');
      const newAchievements = await checkAchievements([], [makeCheckin('2025-01-10')], [], null);
      expect(newAchievements.some(a => a.key === 'checkin_first')).toBe(false);
    });
  });

  describe('getAchievementStatus', () => {
    it('shows progress toward workout goal', async () => {
      mockToArray.mockResolvedValue([]);
      const { getAchievementStatus } = await import('../achievements.js');
      const status = await getAchievementStatus(
        [makeSession('2025-01-10', 'A'), makeSession('2025-01-11', 'A')],
        [],
        [],
        null
      );
      const workoutTrio = status.find(a => a.key === 'workout_trio');
      expect(workoutTrio).toBeDefined();
      const progress = (workoutTrio as any).progress;
      expect(progress).toBeDefined();
      expect(progress.current).toBe(2);
      expect(progress.target).toBe(3);
    });

    it('marks unlocked achievements with earnedAt timestamp', async () => {
      const earnedAt = 1700000000000;
      mockToArray.mockResolvedValue([{ achievementKey: 'checkin_first', earnedAt }]);
      const { getAchievementStatus } = await import('../achievements.js');
      const status = await getAchievementStatus([], [makeCheckin('2025-01-10')], [], null);
      const firstCheckin = status.find(a => a.key === 'checkin_first');
      expect(firstCheckin?.earnedAt).toBe(earnedAt);
    });
  });

  describe('pure helper functions', () => {
    it('groupByTier groups achievements by tier', async () => {
      const { groupByTier } = await import('../achievements.js');
      const achievements = [
        { key: 'a', tier: 'bronze' } as any,
        { key: 'b', tier: 'silver' } as any,
        { key: 'c', tier: 'bronze' } as any,
      ];
      const grouped = groupByTier(achievements);
      expect(grouped.bronze).toHaveLength(2);
      expect(grouped.silver).toHaveLength(1);
    });

    it('groupByCategory groups achievements by category', async () => {
      const { groupByCategory } = await import('../achievements.js');
      const achievements = [
        { key: 'a', category: 'checkin' } as any,
        { key: 'b', category: 'workout' } as any,
        { key: 'c', category: 'checkin' } as any,
      ];
      const grouped = groupByCategory(achievements);
      expect(grouped.checkin).toHaveLength(2);
      expect(grouped.workout).toHaveLength(1);
    });
  });
});
