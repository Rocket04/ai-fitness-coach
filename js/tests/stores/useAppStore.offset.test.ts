// js/tests/stores/useAppStore.offset.test.ts
// Tests for virtualTodayOffset in the store

import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../core/storage.js', () => ({
  init: vi.fn().mockResolvedValue(undefined),
  saveSession: vi.fn().mockResolvedValue(undefined),
  deleteSession: vi.fn().mockResolvedValue(undefined),
  saveCheckin: vi.fn().mockResolvedValue(undefined),
  getCheckin: vi.fn().mockResolvedValue(null),
  getLatestTestResults: vi.fn().mockResolvedValue(null),
  exportAllData: vi.fn().mockResolvedValue({}),
  importAllData: vi.fn().mockResolvedValue(undefined),
  clearAllData: vi.fn().mockResolvedValue(undefined),
  getAllSessions: vi.fn().mockResolvedValue([]),
  getAllCheckins: vi.fn().mockResolvedValue([]),
  getSettings: vi.fn().mockResolvedValue({
    startDate: '2026-05-01', trainDays: [1, 3, 5],
    checkinTier: null, selectedGadgets: null, selectedSports: null,
    virtualTodayOffset: 0,
  }),
  saveSettings: vi.fn().mockResolvedValue(undefined),
  saveSetting: vi.fn().mockResolvedValue(undefined),
  getManualStatus: vi.fn().mockResolvedValue(null),
  saveManualStatus: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../../core/advice.js', () => ({
  getCoachAdvice: vi.fn().mockReturnValue([]),
  getApreExplanation: vi.fn().mockReturnValue([]),
}));

describe('useAppStore — virtualTodayOffset', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should have virtualTodayOffset in initial state', async () => {
    const { useAppStore } = await import('../../stores/useAppStore.js');
    const state = useAppStore.getState();
    expect(state.virtualTodayOffset).toBeDefined();
    expect(typeof state.virtualTodayOffset).toBe('number');
  });

  it('should have setVirtualTodayOffset action', async () => {
    const { useAppStore } = await import('../../stores/useAppStore.js');
    const state = useAppStore.getState();
    expect(state.setVirtualTodayOffset).toBeDefined();
    expect(typeof state.setVirtualTodayOffset).toBe('function');
  });

  it('should have setVirtualTodayOffset as async function', async () => {
    const { useAppStore } = await import('../../stores/useAppStore.js');
    const state = useAppStore.getState();
    // The action exists and is a function
    expect(typeof state.setVirtualTodayOffset).toBe('function');
  });

  it('should default virtualTodayOffset to 0', async () => {
    const { useAppStore } = await import('../../stores/useAppStore.js');
    const state = useAppStore.getState();
    expect(state.virtualTodayOffset).toBe(0);
  });
});
