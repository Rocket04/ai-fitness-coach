// js/tests/stores/useAppStore.test.ts
// TDD behavior tests: user actions through public store interface

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
  getSettings: vi.fn().mockResolvedValue({ startDate: null, trainDays: null, checkinTier: null, selectedGadgets: null, selectedSports: null }),
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
    weight: 85,
    restHR: 65,
    hrv: 70,
    sleepHours: 7.5,
    hipPain: 0,
    shoulderPain: 0,
    breathing: 'good',
    notes: '',
    muscleSoreness: 2,
    energy: 4,
    mood: 5,
    sleepQuality: 0,
    stress: 0,
    rpe: 7,
    sessionNote: 'Хорошая тренировка',
    durationMinutes: 60,
    testPullUps: 12,
    testPushUps: 25,
    testPlank: 45,
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

describe('user tracks APRE results during workout', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await resetStore();
  });

  it('new exercise result is queued for saving', async () => {
    const { useAppStore } = await import('../../stores/useAppStore.js');

    useAppStore.getState().updateApreResult({
      exerciseName: 'Жим лёжа',
      protocol: 'APRE_6',
      nextRM: 82.5,
      unit: 'kg',
      isCalisthenics: false,
      lastSet3Reps: 8,
      lastSet4Reps: 10,
    });

    const state = useAppStore.getState();
    expect(state.pendingApreResults).toHaveLength(1);
    expect(state.pendingApreResults[0].exerciseName).toBe('Жим лёжа');
    expect(state.pendingApreResults[0].nextRM).toBe(82.5);
  });

  it('updating same exercise replaces the previous result', async () => {
    const { useAppStore } = await import('../../stores/useAppStore.js');

    useAppStore.getState().updateApreResult({
      exerciseName: 'Жим лёжа',
      protocol: 'APRE_6',
      nextRM: 80,
      unit: 'kg',
      isCalisthenics: false,
      lastSet3Reps: 6,
      lastSet4Reps: 8,
    });

    useAppStore.getState().updateApreResult({
      exerciseName: 'Жим лёжа',
      protocol: 'APRE_6',
      nextRM: 82.5,
      unit: 'kg',
      isCalisthenics: false,
      lastSet3Reps: 8,
      lastSet4Reps: 10,
    });

    const state = useAppStore.getState();
    expect(state.pendingApreResults).toHaveLength(1);
    expect(state.pendingApreResults[0].nextRM).toBe(82.5);
  });

  it('different exercises accumulate as separate results', async () => {
    const { useAppStore } = await import('../../stores/useAppStore.js');

    useAppStore.getState().updateApreResult({
      exerciseName: 'Жим лёжа',
      protocol: 'APRE_6',
      nextRM: 82.5,
      unit: 'kg',
      isCalisthenics: false,
      lastSet3Reps: 8,
      lastSet4Reps: 10,
    });

    useAppStore.getState().updateApreResult({
      exerciseName: 'Присед',
      protocol: 'APRE_6',
      nextRM: 100,
      unit: 'kg',
      isCalisthenics: false,
      lastSet3Reps: 6,
      lastSet4Reps: 8,
    });

    const state = useAppStore.getState();
    expect(state.pendingApreResults).toHaveLength(2);
    expect(state.pendingApreResults.map(r => r.exerciseName)).toContain('Жим лёжа');
    expect(state.pendingApreResults.map(r => r.exerciseName)).toContain('Присед');
  });
});

describe('user marks daily routines', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await resetStore();
  });

  it('morning routine appears in today sessions after marking', async () => {
    const { useAppStore } = await import('../../stores/useAppStore.js');

    await useAppStore.getState().handleMarkMorning();

    const state = useAppStore.getState();
    const morning = state.sessions.find(s => s.type === 'morning');
    expect(morning).toBeDefined();
    expect(morning?.date).toBe('2026-05-26');
    expect(morning?.completed).toBe(true);
  });

  it('toggling morning routine removes it from today sessions', async () => {
    const { useAppStore } = await import('../../stores/useAppStore.js');

    await useAppStore.getState().handleMarkMorning();
    await useAppStore.getState().handleMarkMorning();

    const state = useAppStore.getState();
    expect(state.sessions.filter(s => s.type === 'morning')).toHaveLength(0);
  });

  it('evening routine appears in today sessions after marking', async () => {
    const { useAppStore } = await import('../../stores/useAppStore.js');

    await useAppStore.getState().handleMarkEvening();

    const state = useAppStore.getState();
    const evening = state.sessions.find(s => s.type === 'evening');
    expect(evening).toBeDefined();
    expect(evening?.date).toBe('2026-05-26');
    expect(evening?.completed).toBe(true);
  });

  it('toggling evening routine removes it from today sessions', async () => {
    const { useAppStore } = await import('../../stores/useAppStore.js');

    await useAppStore.getState().handleMarkEvening();
    await useAppStore.getState().handleMarkEvening();

    const state = useAppStore.getState();
    expect(state.sessions.filter(s => s.type === 'evening')).toHaveLength(0);
  });
});

describe('user saves daily checkin', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await resetStore();
  });

  it('checkin is stored with all filled metrics', async () => {
    const { useAppStore } = await import('../../stores/useAppStore.js');
    const { saveCheckin } = await import('../../core/storage.js');

    await useAppStore.getState().handleSaveCheckin();

    expect(vi.mocked(saveCheckin)).toHaveBeenCalledOnce();
    const saved = vi.mocked(saveCheckin).mock.calls[0][0];
    expect(saved.weight).toBe(85);
    expect(saved.restHR).toBe(65);
    expect(saved.hrv).toBe(70);
    expect(saved.sleepHours).toBe(7.5);
    expect(saved.energy).toBe(4);
    expect(saved.mood).toBe(5);
    expect(saved.muscleSoreness).toBe(2);
    expect(saved.date).toBe('2026-05-26');
  });

  it('checkin appears in today data after saving', async () => {
    const { useAppStore } = await import('../../stores/useAppStore.js');

    await useAppStore.getState().handleSaveCheckin();

    const state = useAppStore.getState();
    const today = state.checkins.find(c => c.date === '2026-05-26');
    expect(today).toBeDefined();
    expect(today?.weight).toBe(85);
  });
});

describe('user manages training sessions', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await resetStore();
  });

  it('form values are reflected when recording a session', async () => {
    const { useAppStore } = await import('../../stores/useAppStore.js');

    // User fills the session form
    useAppStore.getState().setRpe(8);
    useAppStore.getState().setDurationMinutes(75);
    useAppStore.getState().setSessionNote('Интенсивная тренировка');

    const state = useAppStore.getState();
    expect(state.rpe).toBe(8);
    expect(state.durationMinutes).toBe(75);
    expect(state.sessionNote).toBe('Интенсивная тренировка');
  });

  it('test results are captured for strength tracking', async () => {
    const { useAppStore } = await import('../../stores/useAppStore.js');

    useAppStore.getState().setTestPullUps(15);
    useAppStore.getState().setTestPushUps(30);
    useAppStore.getState().setTestPlank(60);

    const state = useAppStore.getState();
    expect(state.testPullUps).toBe(15);
    expect(state.testPushUps).toBe(30);
    expect(state.testPlank).toBe(60);
  });
});
