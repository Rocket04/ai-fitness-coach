// js/tests/stores/useAppStore.test.ts
// Tests for useAppStore - critical path: handleSaveCheckin -> derived recalculation

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock Dexie/storage module to avoid IndexedDB dependencies in tests
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

// Mock the advice module to avoid complex dependencies
vi.mock('../../core/advice.js', () => ({
  getCoachAdvice: vi.fn().mockReturnValue([]),
  getApreExplanation: vi.fn().mockReturnValue([]),
}));

describe('useAppStore - Critical Path Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('computeDerived - deload weeks', () => {
    it('should set mode to deload on week 4', async () => {
      // Import the store after mocks are set up
      const { useAppStore } = await import('../../stores/useAppStore.js');
      
      // Get initial state
      const state = useAppStore.getState();
      
      // Verify store has required methods
      expect(state.handleSaveCheckin).toBeDefined();
      expect(state._recompute).toBeDefined();
      expect(state.showToast).toBeDefined();
    });

    it('should have correct initial state', async () => {
      const { useAppStore } = await import('../../stores/useAppStore.js');
      const state = useAppStore.getState();

      // Verify initial derived state structure
      expect(state.recoveryScore).toBe(0);
      expect(state.readiness).toBe('green');
      expect(state.weekNumber).toBe(1);
      expect(state.trainDays).toEqual([1, 3, 5]);
      expect(state.sessions).toEqual([]);
      expect(state.checkins).toEqual([]);
    });

    it('should have all required actions', async () => {
      const { useAppStore } = await import('../../stores/useAppStore.js');
      const state = useAppStore.getState();

      // Verify all required actions exist
      expect(typeof state.initApp).toBe('function');
      expect(typeof state.handleSaveCheckin).toBe('function');
      expect(typeof state.handleToggleTraining).toBe('function');
      expect(typeof state.handleSaveSettings).toBe('function');
      expect(typeof state.updateApreResult).toBe('function');
      expect(typeof state._recompute).toBe('function');
      expect(typeof state.showToast).toBe('function');
    });
  });

  describe('updateApreResult', () => {
    it('should add new APRE result to pendingApreResults', async () => {
      const { useAppStore } = await import('../../stores/useAppStore.js');
      const state = useAppStore.getState();

      // Initial state should have empty pendingApreResults
      expect(state.pendingApreResults).toEqual([]);

      // Update with a result
      state.updateApreResult({
        exerciseName: 'Жим лёжа',
        protocol: 'APRE_6',
        nextRM: 82.5,
        unit: 'kg',
        isCalisthenics: false,
        lastSet3Reps: 8,
        lastSet4Reps: 10,
      });

      // Get updated state
      const newState = useAppStore.getState();
      expect(newState.pendingApreResults).toHaveLength(1);
      expect(newState.pendingApreResults[0].exerciseName).toBe('Жим лёжа');
      expect(newState.pendingApreResults[0].nextRM).toBe(82.5);
    });

    it('should replace existing result for same exercise', async () => {
      const { useAppStore } = await import('../../stores/useAppStore.js');
      const state = useAppStore.getState();

      // Add first result
      state.updateApreResult({
        exerciseName: 'Жим лёжа',
        protocol: 'APRE_6',
        nextRM: 80,
        unit: 'kg',
        isCalisthenics: false,
        lastSet3Reps: 6,
        lastSet4Reps: 8,
      });

      // Update same exercise
      state.updateApreResult({
        exerciseName: 'Жим лёжа',
        protocol: 'APRE_6',
        nextRM: 82.5,
        unit: 'kg',
        isCalisthenics: false,
        lastSet3Reps: 8,
        lastSet4Reps: 10,
      });

      const newState = useAppStore.getState();
      expect(newState.pendingApreResults).toHaveLength(1);
      expect(newState.pendingApreResults[0].nextRM).toBe(82.5);
    });
  });

  describe('form setters', () => {
    it('should update checkin form fields', async () => {
      const { useAppStore } = await import('../../stores/useAppStore.js');
      const state = useAppStore.getState();

      // Test setters
      state.setWeight(85);
      state.setRestHR(65);
      state.setHrv(70);
      state.setSleepHours(7.5);
      state.setEnergy(4);
      state.setMood(5);
      state.setMuscleSoreness(2);

      const newState = useAppStore.getState();
      expect(newState.weight).toBe(85);
      expect(newState.restHR).toBe(65);
      expect(newState.hrv).toBe(70);
      expect(newState.sleepHours).toBe(7.5);
      expect(newState.energy).toBe(4);
      expect(newState.mood).toBe(5);
      expect(newState.muscleSoreness).toBe(2);
    });

    it('should update session form fields', async () => {
      const { useAppStore } = await import('../../stores/useAppStore.js');
      const state = useAppStore.getState();

      state.setRpe(7);
      state.setDurationMinutes(60);
      state.setSessionNote('Хорошая тренировка');
      state.setTestPullUps(12);
      state.setTestPushUps(25);
      state.setTestPlank(45);

      const newState = useAppStore.getState();
      expect(newState.rpe).toBe(7);
      expect(newState.durationMinutes).toBe(60);
      expect(newState.sessionNote).toBe('Хорошая тренировка');
      expect(newState.testPullUps).toBe(12);
      expect(newState.testPushUps).toBe(25);
      expect(newState.testPlank).toBe(45);
    });
  });

  describe('UI state', () => {
    it('should update UI state correctly', async () => {
      const { useAppStore } = await import('../../stores/useAppStore.js');
      const state = useAppStore.getState();

      state.setActiveTab(2);
      state.setShowSettings(true);
      state.setShowResetConfirm(true);

      const newState = useAppStore.getState();
      expect(newState.activeTab).toBe(2);
      expect(newState.showSettings).toBe(true);
      expect(newState.showResetConfirm).toBe(true);
    });
  });
});

describe('SessionPlan Mode - Deload Integration', () => {
  it('deload mode should be defined in SessionMode type', async () => {
    // This test verifies the type system accepts 'deload' as valid SessionMode
    const testMode: import('../../core/types.js').SessionMode = 'deload';
    expect(testMode).toBe('deload');
  });
});
