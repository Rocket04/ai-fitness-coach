// js/tests/ui/TodayPage.test.tsx
// TDD: TodayPage user-facing behavior — what the user sees and can do

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';

let mockCheckinTier: 'full' | 'medium' | 'light' = 'full';
let mockDetectResult: 'full' | 'medium' | 'light' | null = null;
let mockRecoveryScore = 0;
let mockSessionPlan: any = null;

vi.mock('../../stores/useAppStore.js', () => ({
  useAppStore: () => ({
    sessionPlan: mockSessionPlan, trainType: null, readiness: 'green', recoveryScore: mockRecoveryScore,
    recoveryDebt: 0, rpe: 0, sessionNote: '', testPullUps: 0, testPushUps: 0, testPlank: 0,
    trainingDone: false, weekLabel: 'Неделя 1', totalWeek: 1, totalMultiplier: 1, phase: 'base',
    tomorrowPlan: null, tomorrowType: null, morningDone: false, eveningDone: false,
    apreReasons: [], durationMinutes: 45, lastCheckin: null, streak: 0,
    trendData7: [], rpeTrend7: [], coachAdvice: [], checkinTier: mockCheckinTier,
checkins: [], planModifications: [],
     demoMode: false, dataLoaded: true,
     weeklyPlan: null,
    setRpe: vi.fn(), setSessionNote: vi.fn(), setDurationMinutes: vi.fn(),
    setTestPullUps: vi.fn(), setTestPushUps: vi.fn(), setTestPlank: vi.fn(),
    handleToggleTraining: vi.fn(), handleMarkMorning: vi.fn(), handleMarkEvening: vi.fn(),
    updateApreResult: vi.fn(), setActiveTab: vi.fn(),
    setVirtualTodayOffset: vi.fn(), setCheckinTier: vi.fn(),
  }),
}));

vi.mock('../../core/recoveryScore.js', () => ({
  calculateRecoveryScore: () => 0,
  getWeightsForTier: () => ({ hrv: 0, sleep: 0, rhr: 0, subjective: 0 }),
  detectOptimalTier: () => mockDetectResult,
}));

vi.mock('../../core/advice.js', () => ({
  getExplanation: () => [],
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => {
    const translations: Record<string, string> = {
      'today.recoveryLabel': 'Recovery Score',
      'today.doCheckin': 'Заполните чек-ин',
      'today.status.ready': 'Готов',
      'today.restDay': 'День отдыха',
      'today.tapForMetrics': 'Нажмите для метрик',
      'recovery.description': 'Recovery Score описание',
    };
    return translations[key] || key;
  } }),
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

vi.mock('../../ui/components/WeeklyPlanCard.jsx', () => ({
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
  mockRecoveryScore = 0;
  mockSessionPlan = null;
  const mod = await import('../../ui/pages/TodayPage.jsx');
  TodayPage = mod.default;
});

describe('TodayPage — user sees training readiness', () => {
  it('shows recovery score when user has check-in data', () => {
    mockRecoveryScore = 74;
    render(React.createElement(TodayPage));

    expect(screen.getByText('74')).toBeInTheDocument();
    expect(screen.getByText('Recovery Score')).toBeInTheDocument();
  });

  it('prompts user to do check-in when no recovery data exists', () => {
    mockRecoveryScore = 0;
    render(React.createElement(TodayPage));

    expect(screen.getByText('—')).toBeInTheDocument();
    expect(screen.getByText('Заполните чек-ин')).toBeInTheDocument();
  });

  it('shows rest day card when no training is planned', () => {
    mockSessionPlan = null;
    render(React.createElement(TodayPage));

    expect(screen.getByText('День отдыха')).toBeInTheDocument();
  });

  it('shows training plan when session exists', () => {
    mockSessionPlan = {
      sessionType: 'A',
      sport: 'Бег',
      exercises: [{ n: 'Бег Z2', s: '1', r: '30 мин' }],
    };
    render(React.createElement(TodayPage));

    expect(screen.getByText('Бег')).toBeInTheDocument();
  });
});

describe('TodayPage — adaptive tier suggestion banner', () => {
  it('does not show banner when detectOptimalTier returns null', () => {
    mockCheckinTier = 'full';
    mockDetectResult = null;
    render(React.createElement(TodayPage));

    expect(screen.queryByText(/совет/i)).not.toBeInTheDocument();
  });

  it('does not show banner when suggested tier matches current tier', () => {
    mockCheckinTier = 'full';
    mockDetectResult = 'full';
    render(React.createElement(TodayPage));

    expect(screen.queryByText(/совет/i)).not.toBeInTheDocument();
  });

  it('shows banner suggesting different tier when data indicates change', () => {
    mockCheckinTier = 'full';
    mockDetectResult = 'light';
    render(React.createElement(TodayPage));

    expect(screen.getByText(/совет/i)).toBeInTheDocument();
    expect(screen.getByText(/переключите уровень чек-ина/i)).toBeInTheDocument();
  });
});
