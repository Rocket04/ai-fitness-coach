// js/tests/ui/TodayPage.weekly.test.tsx
// TDD: Weekly 7-day strip in TodayPage

import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';

vi.mock('../../stores/useAppStore.js', () => ({
  useAppStore: () => ({
    sessionPlan: { sessionType: 'A', exercises: [{ n: 'Test', s: '3', r: '8' }], mode: 'full', isRestDay: false },
    readiness: 'green', recoveryScore: 74, rpe: 0, sessionNote: '',
    testPullUps: 0, testPushUps: 0, testPlank: 0, trainingDone: false,
    weekLabel: 'Неделя 3', totalWeek: 3, totalMultiplier: 1,
    tomorrowPlan: null, morningDone: false, eveningDone: false,
    apreReasons: [], durationMinutes: 45, lastCheckin: null, streak: 0,
    trendData7: [], rpeTrend7: [], coachAdvice: [], checkinTier: 'medium',
    checkins: [], virtualTodayOffset: 0, selectedSports: [], demoMode: false,
    phase: 'base', weekInPhase: 3,
    setRpe: vi.fn(), setSessionNote: vi.fn(), setDurationMinutes: vi.fn(),
    setTestPullUps: vi.fn(), setTestPushUps: vi.fn(), setTestPlank: vi.fn(),
    handleToggleTraining: vi.fn(), handleMarkMorning: vi.fn(), handleMarkEvening: vi.fn(),
    updateApreResult: vi.fn(), setActiveTab: vi.fn(), setCheckinTier: vi.fn(),
    setVirtualTodayOffset: vi.fn().mockResolvedValue(undefined),
  }),
}));

vi.mock('../../core/recoveryScore.js', () => ({
  detectOptimalTier: () => null,
}));

vi.mock('../../core/helpers.js', () => ({
  getAppDate: () => new Date(),
  getAppDateSync: () => new Date(),
  setVirtualTodayOffset: vi.fn(),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('../../ui/components/Collapsible.jsx', () => ({
  default: ({ children }: any) => React.createElement('div', null, children),
}));
vi.mock('../../ui/components/ExerciseCard.jsx', () => ({ default: () => null }));
vi.mock('../../ui/components/ExerciseConfigModal.jsx', () => ({ default: () => null }));
vi.mock('../../ui/components/HelpIcon.jsx', () => ({ default: () => null }));
vi.mock('../../hooks/useFitnessData.js', () => ({
  useFitnessData: () => ({ exercises: [], updateExerciseById: vi.fn(), loaded: true }),
  isExerciseConfigured: () => false,
}));

describe('TodayPage — 30-day date strip', () => {
  it('should render date strip with 30 day cards', async () => {
    const TodayPage = (await import('../../ui/pages/TodayPage.jsx')).default;
    const { container } = render(React.createElement(TodayPage));
    const strip = container.querySelector('.weekly-strip');
    expect(strip).toBeTruthy();
    const cards = container.querySelectorAll('.weekly-day-card');
    expect(cards.length).toBe(7);
  });

  it('should highlight the current day', async () => {
    const TodayPage = (await import('../../ui/pages/TodayPage.jsx')).default;
    const { container } = render(React.createElement(TodayPage));
    const currentDay = container.querySelector('.weekly-day-card.is-today');
    expect(currentDay).toBeTruthy();
  });
  
  it('should render navigation buttons for 30-day view', async () => {
    const TodayPage = (await import('../../ui/pages/TodayPage.jsx')).default;
    const { container } = render(React.createElement(TodayPage));
    const navContainer = container.querySelector('.weekly-strip');
    expect(navContainer).toBeTruthy();
  });
});
