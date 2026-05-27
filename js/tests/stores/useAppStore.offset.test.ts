// js/tests/stores/useAppStore.offset.test.ts
// TDD behavior tests: user shifts virtual date through public store interface

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

vi.mock('../../core/achievements.js', () => ({
  checkAchievements: vi.fn().mockResolvedValue([]),
}));

/** Reset store to a clean state before each test */
async function resetStore() {
  const { useAppStore } = await import('../../stores/useAppStore.js');
  useAppStore.setState({
    sessions: [],
    checkins: [],
    dataLoaded: true,
    todayISO: '2026-05-26',
    startDate: '2026-05-01',
    trainDays: [1, 3, 5],
    checkinTier: 'medium',
    selectedGadgets: [],
    selectedSports: [],
    virtualTodayOffset: 0,
    demoMode: false,
    guestMode: false,
    showGuestModal: false,
    showSettings: false,
    showResetConfirm: false,
    editStartDate: '',
    editTrainDays: [1, 3, 5],
    rehabIssues: [],
    rehabExercises: [],
    profileLevel: 'intermediate',
    profileGoals: [],
    profileEquipment: {},
    weight: 0,
    restHR: 0,
    hrv: 0,
    sleepHours: 0,
    hipPain: 0,
    shoulderPain: 0,
    breathing: 'good',
    notes: '',
    muscleSoreness: 0,
    energy: 0,
    mood: 0,
    sleepQuality: 0,
    stress: 0,
    rpe: 0,
    sessionNote: '',
    durationMinutes: 45,
    testPullUps: 0,
    testPushUps: 0,
    testPlank: 0,
    pendingApreResults: [],
    activeTab: 0,
    showReadiness: false,
    manualOverride: 'unknown',
    toast: { message: '', type: 'success', visible: false },
    weeklyTemplate: {
      days: ['running', 'strength', null, 'running', 'strength', null, 'running'],
      sportOrder: ['running'],
    },
    pendingAchievement: null,
  });
}

describe('user shifts displayed date', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await resetStore();
  });

  it('positive offset moves today forward in app state', async () => {
    const { useAppStore } = await import('../../stores/useAppStore.js');

    await useAppStore.getState().setVirtualTodayOffset(3);

    const state = useAppStore.getState();
    expect(state.virtualTodayOffset).toBe(3);
  });

  it('negative offset moves today backward in app state', async () => {
    const { useAppStore } = await import('../../stores/useAppStore.js');

    await useAppStore.getState().setVirtualTodayOffset(-5);

    const state = useAppStore.getState();
    expect(state.virtualTodayOffset).toBe(-5);
  });

  it('offset is persisted to storage when changed', async () => {
    const { useAppStore } = await import('../../stores/useAppStore.js');
    const { saveSetting } = await import('../../core/storage.js');

    await useAppStore.getState().setVirtualTodayOffset(7);

    expect(vi.mocked(saveSetting)).toHaveBeenCalledWith('virtualTodayOffset', 7);
  });

  it('resetting offset restores today to current date', async () => {
    const { useAppStore } = await import('../../stores/useAppStore.js');

    await useAppStore.getState().setVirtualTodayOffset(5);
    await useAppStore.getState().setVirtualTodayOffset(0);

    const state = useAppStore.getState();
    expect(state.virtualTodayOffset).toBe(0);
  });
});
