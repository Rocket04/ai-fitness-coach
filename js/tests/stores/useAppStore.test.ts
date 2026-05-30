// js/tests/stores/useAppStore.test.ts
// TDD behavior tests: user actions through public store interface

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('../../data/storage.js', () => ({
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
  activateDemoData: vi.fn().mockResolvedValue(undefined),
  deactivateDemoData: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../../domains/recovery/advice.js', () => ({
  getCoachAdvice: vi.fn().mockReturnValue([]),
  getApreExplanation: vi.fn().mockReturnValue([]),
}));

vi.mock('../../core/achievements.js', () => ({
  checkAchievements: vi.fn().mockResolvedValue([]),
}));

/** Reset store to a clean state before each test */
async function resetStore() {
  const { useAppStore } = await import('../../store/index.js');
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
    const { useAppStore } = await import('../../store/index.js');

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
    const { useAppStore } = await import('../../store/index.js');

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
    const { useAppStore } = await import('../../store/index.js');

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

describe('user saves daily checkin', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await resetStore();
  });

  it('checkin is stored with all filled metrics', async () => {
    const { useAppStore } = await import('../../store/index.js');
    const { saveCheckin } = await import('../../data/storage.js');

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
    const { useAppStore } = await import('../../store/index.js');

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
    const { useAppStore } = await import('../../store/index.js');

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
    const { useAppStore } = await import('../../store/index.js');

    useAppStore.getState().setTestPullUps(15);
    useAppStore.getState().setTestPushUps(30);
    useAppStore.getState().setTestPlank(60);

    const state = useAppStore.getState();
    expect(state.testPullUps).toBe(15);
    expect(state.testPushUps).toBe(30);
    expect(state.testPlank).toBe(60);
  });
});

describe('user manages settings', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await resetStore();
  });

  it('updates startDate and trainDays via handleSaveSettings', async () => {
    const { useAppStore } = await import('../../store/index.js');
    const { saveSettings } = await import('../../data/storage.js');

    useAppStore.getState().setEditStartDate('2026-06-01');
    useAppStore.getState().setEditTrainDays([2, 4, 6]);
    await useAppStore.getState().handleSaveSettings();

    const state = useAppStore.getState();
    expect(state.startDate).toBe('2026-06-01');
    expect(state.trainDays).toEqual([2, 4, 6]);
    expect(vi.mocked(saveSettings)).toHaveBeenCalledOnce();
  });

  it('updates profile fields', async () => {
    const { useAppStore } = await import('../../store/index.js');

    await useAppStore.getState().setProfileLevel('advanced');
    await useAppStore.getState().setProfileGoals(['hypertrophy']);
    await useAppStore.getState().setProfileEquipment({ dumbbells_max_kg: 20 });

    const state = useAppStore.getState();
    expect(state.profileLevel).toBe('advanced');
    expect(state.profileGoals).toEqual(['hypertrophy']);
    expect(state.profileEquipment).toEqual({ dumbbells_max_kg: 20 });
  });

  it('sets checkin tier', async () => {
    const { useAppStore } = await import('../../store/index.js');
    const { saveSetting } = await import('../../data/storage.js');

    await useAppStore.getState().setCheckinTier('full');

    expect(vi.mocked(saveSetting)).toHaveBeenCalledWith('checkinTier', 'full');
    expect(useAppStore.getState().checkinTier).toBe('full');
  });
});

describe('user toggles UI state', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await resetStore();
  });

  it('opens settings modal', async () => {
    const { useAppStore } = await import('../../store/index.js');

    useAppStore.getState().openSettings();
    expect(useAppStore.getState().showSettings).toBe(true);
    expect(useAppStore.getState().editStartDate).toBe('2026-05-01');
  });

  it('closes settings modal', async () => {
    const { useAppStore } = await import('../../store/index.js');

    useAppStore.getState().openSettings();
    useAppStore.getState().closeSettings();
    expect(useAppStore.getState().showSettings).toBe(false);
  });

  it('opens reset confirmation dialog', async () => {
    const { useAppStore } = await import('../../store/index.js');

    useAppStore.getState().handleResetAll();
    expect(useAppStore.getState().showResetConfirm).toBe(true);
  });

  it('closes reset confirmation dialog', async () => {
    const { useAppStore } = await import('../../store/index.js');

    useAppStore.getState().handleResetAll();
    useAppStore.getState().closeResetConfirm();
    expect(useAppStore.getState().showResetConfirm).toBe(false);
  });

  it('switches active tab', async () => {
    const { useAppStore } = await import('../../store/index.js');

    useAppStore.getState().setActiveTab(2);
    expect(useAppStore.getState().activeTab).toBe(2);
  });

  it('shows readiness', async () => {
    const { useAppStore } = await import('../../store/index.js');

    useAppStore.getState().setShowReadiness(true);
    expect(useAppStore.getState().showReadiness).toBe(true);
  });
});

describe('user shifts virtual date', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await resetStore();
  });

  it('applies positive offset to virtualTodayOffset', async () => {
    const { useAppStore } = await import('../../store/index.js');

    await useAppStore.getState().setVirtualTodayOffset(3);
    expect(useAppStore.getState().virtualTodayOffset).toBe(3);
  });

  it('applies negative offset to virtualTodayOffset', async () => {
    const { useAppStore } = await import('../../store/index.js');

    await useAppStore.getState().setVirtualTodayOffset(-2);
    expect(useAppStore.getState().virtualTodayOffset).toBe(-2);
  });

  it('resets offset to zero', async () => {
    const { useAppStore } = await import('../../store/index.js');

    await useAppStore.getState().setVirtualTodayOffset(5);
    await useAppStore.getState().setVirtualTodayOffset(0);
    expect(useAppStore.getState().virtualTodayOffset).toBe(0);
  });
});

describe('demo mode management', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await resetStore();
  });

  it('sets demo mode flag', async () => {
    const { useAppStore } = await import('../../store/index.js');

    useAppStore.getState().setDemoMode(true);
    expect(useAppStore.getState().demoMode).toBe(true);
  });
});

describe('guest mode management', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await resetStore();
  });

  it('sets guest mode flag', async () => {
    const { useAppStore } = await import('../../store/index.js');

    useAppStore.getState().setGuestMode(true);
    expect(useAppStore.getState().guestMode).toBe(true);
  });

  it('shows guest modal', async () => {
    const { useAppStore } = await import('../../store/index.js');

    useAppStore.getState().setShowGuestModal(true);
    expect(useAppStore.getState().showGuestModal).toBe(true);
  });
});

describe('weekly adherence multiplier', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await resetStore();
  });

  function makeSession(date: string, totalPlanned: number, totalCompleted: number) {
    return {
      key: `${date}_training`,
      date,
      type: 'A' as const,
      completed: true,
      readiness: 'green' as const,
      rpe: 7,
      notes: '',
      updatedAt: Date.now(),
      exerciseResults: [{
        exerciseName: 'Push-ups',
        plannedSets: totalPlanned,
        completedSets: totalCompleted,
        sets: [],
        completed: totalCompleted > 0,
      }],
    };
  }

  it('sets multiplier to 1.2 when last week completion is 100%', async () => {
    const { useAppStore } = await import('../../store/index.js');

    // todayISO is '2026-05-26' (Tue)
    // Current Monday = 2026-05-25, Last Monday = 2026-05-18
    // Sessions from 2026-05-18 to 2026-05-25 (excl. 25th) count as "last week"
    const sessions = [
      makeSession('2026-05-19', 3, 3), // 100%
      makeSession('2026-05-21', 3, 3), // 100%
    ];

    useAppStore.setState({ sessions });
    useAppStore.getState()._recompute();

    const state = useAppStore.getState();
    expect(state.weeklyAdherenceMultiplier).toBe(1.2);
  });

  it('sets multiplier to 0.8 when last week completion is 40%', async () => {
    const { useAppStore } = await import('../../store/index.js');

    const sessions = [
      makeSession('2026-05-19', 5, 2), // 40%
      makeSession('2026-05-21', 5, 2), // 40%
    ];

    useAppStore.setState({ sessions });
    useAppStore.getState()._recompute();

    const state = useAppStore.getState();
    expect(state.weeklyAdherenceMultiplier).toBe(0.8);
  });

  it('keeps multiplier at 1.0 when no sessions in previous week', async () => {
    const { useAppStore } = await import('../../store/index.js');

    // Sessions from before last week — should not affect multiplier
    const sessions = [
      makeSession('2026-05-11', 3, 3), // earlier week
    ];

    useAppStore.setState({ sessions });
    useAppStore.getState()._recompute();

    const state = useAppStore.getState();
    expect(state.weeklyAdherenceMultiplier).toBe(1.0);
  });
});

describe('toast notifications', () => {
  beforeEach(async () => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    await resetStore();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows success toast', async () => {
    const { useAppStore } = await import('../../store/index.js');

    useAppStore.getState().showToast('Saved!');

    const toast = useAppStore.getState().toast;
    expect(toast.message).toBe('Saved!');
    expect(toast.type).toBe('success');
    expect(toast.visible).toBe(true);
  });

  it('hides toast after timeout', async () => {
    const { useAppStore } = await import('../../store/index.js');

    useAppStore.getState().showToast('Hidden');

    expect(useAppStore.getState().toast.visible).toBe(true);

    vi.advanceTimersByTime(2000);
    await Promise.resolve();

    expect(useAppStore.getState().toast.visible).toBe(false);
  });
});

describe('data export', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await resetStore();
  });

  it('exports data as JSON blob', async () => {
    const { useAppStore } = await import('../../store/index.js');
    
    // Mock URL APIs
    const mockCreateObjectURL = vi.fn(() => 'blob:url');
    const mockRevokeObjectURL = vi.fn();
    globalThis.URL.createObjectURL = mockCreateObjectURL;
    globalThis.URL.revokeObjectURL = mockRevokeObjectURL;

    const mockClick = vi.fn();
    const mockAnchor = { click: mockClick, href: '', download: '' };
    vi.spyOn(document, 'createElement').mockReturnValue(mockAnchor as any);

    await useAppStore.getState().handleExportData();

    expect(mockCreateObjectURL).toHaveBeenCalled();
    expect(mockClick).toHaveBeenCalled();
    expect(mockRevokeObjectURL).toHaveBeenCalled();
  });
});

describe('data import', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await resetStore();
  });

  it('rejects oversized files', async () => {
    const { useAppStore } = await import('../../store/index.js');
    
    const largeFile = new File(['x'.repeat(6 * 1024 * 1024)], 'large.json', { type: 'application/json' });
    
    await expect(useAppStore.getState().handleImportData(largeFile)).rejects.toThrow('слишком большой');
  });

  it('rejects non-JSON files', async () => {
    const { useAppStore } = await import('../../store/index.js');
    
    const txtFile = new File(['test'], 'test.txt', { type: 'text/plain' });
    
    await expect(useAppStore.getState().handleImportData(txtFile)).rejects.toThrow('Ожидается файл JSON');
  });

  it('rejects empty files', async () => {
    const { useAppStore } = await import('../../store/index.js');
    
    const emptyFile = new File([''], 'empty.json', { type: 'application/json' });
    
    await expect(useAppStore.getState().handleImportData(emptyFile)).rejects.toThrow('Файл пуст');
  });
});

describe('reset functionality', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await resetStore();
  });

  it('shows reset confirmation dialog on handleResetAll', async () => {
    const { useAppStore } = await import('../../store/index.js');
    
    useAppStore.getState().handleResetAll();
    expect(useAppStore.getState().showResetConfirm).toBe(true);
  });
});

describe('settings actions', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await resetStore();
  });

  it('opens settings modal via openSettings', async () => {
    const { useAppStore } = await import('../../store/index.js');
    
    useAppStore.getState().openSettings();
    const state = useAppStore.getState();
    expect(state.showSettings).toBe(true);
    expect(state.editStartDate).toBe('2026-05-01');
  });

  it('toggles training days', async () => {
    const { useAppStore } = await import('../../store/index.js');
    
    useAppStore.getState().toggleDay(2);
    expect(useAppStore.getState().editTrainDays).toContain(2);
    
    useAppStore.getState().toggleDay(2);
    expect(useAppStore.getState().editTrainDays).not.toContain(2);
  });

  it('sets checkin tier', async () => {
    const { useAppStore } = await import('../../store/index.js');
    const { saveSetting } = await import('../../data/storage.js');
    
    await useAppStore.getState().setCheckinTier('full');
    
    expect(vi.mocked(saveSetting)).toHaveBeenCalledWith('checkinTier', 'full');
  });

  it('sets virtual today offset', async () => {
    const { useAppStore } = await import('../../store/index.js');
    const { saveSetting } = await import('../../data/storage.js');
    
    await useAppStore.getState().setVirtualTodayOffset(5);
    
    expect(vi.mocked(saveSetting)).toHaveBeenCalledWith('virtualTodayOffset', 5);
    expect(useAppStore.getState().virtualTodayOffset).toBe(5);
  });
});

describe('toast actions', () => {
  beforeEach(async () => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    await resetStore();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('showToast displays message and auto-hides', async () => {
    const { useAppStore } = await import('../../store/index.js');
    
    useAppStore.getState().showToast('Test message');
    
    expect(useAppStore.getState().toast.message).toBe('Test message');
    expect(useAppStore.getState().toast.visible).toBe(true);
    
    vi.advanceTimersByTime(2000);
    await Promise.resolve();
    
    expect(useAppStore.getState().toast.visible).toBe(false);
  });
});
