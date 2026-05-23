// js/tests/ui/TodayPage.test.tsx
// TDD: Adaptive tier suggestion banner in TodayPage

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';

let mockCheckinTier: 'full' | 'medium' | 'light' = 'full';
let mockDetectResult: 'full' | 'medium' | 'light' | null = null;

vi.mock('../../stores/useAppStore.js', () => ({
  useAppStore: () => ({
    sessionPlan: null, trainType: null, readiness: 'green', recoveryScore: 0,
    rpe: 0, sessionNote: '', testPullUps: 0, testPushUps: 0, testPlank: 0,
    trainingDone: false, weekLabel: 'Неделя 1', weekNumber: 1, totalMultiplier: 1,
    tomorrowPlan: null, tomorrowType: null, morningDone: false, eveningDone: false,
    apreReasons: [], durationMinutes: 45, lastCheckin: null, streak: 0,
    trendData7: [], rpeTrend7: [], coachAdvice: [], checkinTier: mockCheckinTier,
    checkins: [],
    setRpe: vi.fn(), setSessionNote: vi.fn(), setDurationMinutes: vi.fn(),
    setTestPullUps: vi.fn(), setTestPushUps: vi.fn(), setTestPlank: vi.fn(),
    handleToggleTraining: vi.fn(), handleMarkMorning: vi.fn(), handleMarkEvening: vi.fn(),
    updateApreResult: vi.fn(), setActiveTab: vi.fn(),
  }),
}));

vi.mock('../../core/recoveryScore.js', async () => ({
  calculateRecoveryScore: () => 0,
  getWeightsForTier: () => ({ hrv: 0, sleep: 0, rhr: 0, subjective: 0 }),
  detectOptimalTier: () => mockDetectResult,
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('../../ui/components/Collapsible.jsx', () => ({
  default: ({ children }: any) => React.createElement('div', null, children),
}));

vi.mock('../../ui/components/ExerciseCard.jsx', () => ({
  default: () => null,
}));

vi.mock('../../ui/components/ExerciseConfigModal.jsx', () => ({
  default: () => null,
}));

vi.mock('../../ui/components/HelpIcon.jsx', () => ({
  default: () => null,
}));

vi.mock('../../hooks/useFitnessData.js', () => ({
  useFitnessData: () => ({ exercises: [], updateExerciseById: vi.fn(), loaded: true }),
  isExerciseConfigured: () => false,
}));

let TodayPage: any;

beforeEach(async () => {
  vi.clearAllMocks();
  mockCheckinTier = 'full';
  mockDetectResult = null;
  vi.resetModules();
  const mod = await import('../../ui/pages/TodayPage.jsx');
  TodayPage = mod.default;
});

describe('TodayPage — adaptive tier suggestion', () => {
  it('does not show suggestion banner when tier is already optimal', () => {
    mockCheckinTier = 'full';
    mockDetectResult = 'full';
    const { unmount } = render(React.createElement(TodayPage));
    const suggestion = document.querySelector('.tier-suggestion-banner');
    expect(suggestion).toBeNull();
    unmount();
  });

  it('shows suggestion banner when detectOptimalTier suggests a different tier', () => {
    mockCheckinTier = 'full';
    mockDetectResult = 'medium';
    const { unmount } = render(React.createElement(TodayPage));
    const suggestion = document.querySelector('.tier-suggestion-banner');
    expect(suggestion).toBeTruthy();
    unmount();
  });

  it('does not show banner when detectOptimalTier returns null (insufficient data)', () => {
    mockCheckinTier = 'full';
    mockDetectResult = null;
    const { unmount } = render(React.createElement(TodayPage));
    const suggestion = document.querySelector('.tier-suggestion-banner');
    expect(suggestion).toBeNull();
    unmount();
  });

  it('shows switch button in suggestion banner', () => {
    mockCheckinTier = 'full';
    mockDetectResult = 'light';
    const { unmount } = render(React.createElement(TodayPage));
    const btn = document.querySelector('.tier-suggestion-banner button');
    expect(btn).toBeTruthy();
    unmount();
  });
});
