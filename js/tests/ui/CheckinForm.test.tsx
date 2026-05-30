// js/tests/ui/CheckinForm.test.tsx
// TDD: CheckinForm user-facing behavior — what the user can see and do

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

let mockTier: 'full' | 'medium' | 'light' = 'full';
let mockCheckins: Array<{ date: string }> = [{ date: '2026-05-24' }];
const mockStore = {
  weight: 0, restHR: 0, hrv: 0, sleepHours: 0,
  hipPain: 0, shoulderPain: 0, breathing: 'good' as const, notes: '',
  muscleSoreness: 0, energy: 0, mood: 0, sleepQuality: 0, stress: 0,
  setWeight: (v: number) => { mockStore.weight = v; },
  setRestHR: vi.fn(), setHrv: vi.fn(), setSleepHours: (v: number) => { mockStore.sleepHours = v; },
  setHipPain: vi.fn(), setShoulderPain: vi.fn(), setBreathing: vi.fn(), setNotes: vi.fn(),
  setMuscleSoreness: (v: number) => { mockStore.muscleSoreness = v; },
  setEnergy: (v: number) => { mockStore.energy = v; },
  setMood: (v: number) => { mockStore.mood = v; },
  setSleepQuality: (v: number) => { mockStore.sleepQuality = v; },
  setStress: (v: number) => { mockStore.stress = v; },
  handleSaveCheckin: vi.fn().mockResolvedValue(undefined),
  get checkins() { return mockCheckins; },
  showToast: vi.fn(), todayISO: '2026-05-24',
  get checkinTier() { return mockTier; },
};

vi.mock('../../store/index.js', () => ({
  useAppStore: () => mockStore,
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('../../ui/components/TrendIndicator.jsx', () => ({ default: () => null }));
vi.mock('../../ui/components/MiniSparkline.jsx', () => ({ default: () => null }));
vi.mock('../../ui/components/ScaleSelector.jsx', () => ({ default: () => null }));
vi.mock('../../ui/components/Collapsible.jsx', () => ({
  default: ({ children, ...props }: any) => React.createElement('div', props, children),
}));

import CheckinForm from '../../ui/pages/CheckinForm.jsx';

beforeEach(() => {
  mockCheckins = [{ date: '2026-05-24' }];
  mockStore.weight = 0;
  mockStore.restHR = 0;
  mockStore.hrv = 0;
  mockStore.sleepHours = 0;
  mockStore.muscleSoreness = 0;
  mockStore.energy = 0;
  mockStore.mood = 0;
  mockStore.sleepQuality = 0;
  mockStore.stress = 0;
  mockStore.hipPain = 0;
  mockStore.shoulderPain = 0;
  mockStore.notes = '';
  mockStore.breathing = 'good';
});

function getInputForLabel(labelText: string): HTMLInputElement | null {
  const label = screen.queryByText(labelText, { selector: 'span' });
  if (!label) return null;
  const row = label.closest('.checkin-row');
  if (!row) return null;
  return row.querySelector('input[type="number"]');
}

describe('CheckinForm — user can enter daily check-in data', () => {
  it('shows weight, RHR, and HRV fields when user has full tier', () => {
    mockTier = 'full';
    render(React.createElement(CheckinForm));

    expect(screen.getByText('Вес')).toBeInTheDocument();
    expect(screen.getByText('ЧСС покоя')).toBeInTheDocument();
    expect(screen.getByText('HRV')).toBeInTheDocument();

    expect(getInputForLabel('Вес')).toBeTruthy();
    expect(getInputForLabel('ЧСС покоя')).toBeTruthy();
    expect(getInputForLabel('HRV')).toBeTruthy();
  });

  it('shows weight and RHR but not HRV when user has medium tier', () => {
    mockTier = 'medium';
    render(React.createElement(CheckinForm));

    expect(screen.getByText('Вес')).toBeInTheDocument();
    expect(screen.getByText('ЧСС покоя')).toBeInTheDocument();
    expect(screen.queryByText('HRV')).not.toBeInTheDocument();
  });

  it('shows only weight (no biometric devices) when user has light tier', () => {
    mockTier = 'light';
    render(React.createElement(CheckinForm));

    expect(screen.getByText('Вес')).toBeInTheDocument();
    expect(screen.queryByText('ЧСС покоя')).not.toBeInTheDocument();
    expect(screen.queryByText('HRV')).not.toBeInTheDocument();
  });

  it('always shows subjective well-being fields regardless of tier', () => {
    for (const tier of ['full', 'medium', 'light'] as const) {
      mockTier = tier;
      const { unmount } = render(React.createElement(CheckinForm));

      expect(screen.getByText('Энергия')).toBeInTheDocument();
      expect(screen.getByText('Настроение')).toBeInTheDocument();
      expect(screen.getByText('Болезненность')).toBeInTheDocument();
      expect(screen.getByText('Стресс')).toBeInTheDocument();

      unmount();
    }
  });

  it('shows validation error when user tries to save with no data entered', async () => {
    mockTier = 'full';
    render(React.createElement(CheckinForm));

    const saveBtn = screen.getByRole('button', { name: /сохранить чек-ин/i });
    await userEvent.click(saveBtn);

    expect(screen.getByRole('alert')).toHaveTextContent(/заполните хотя бы одно поле/i);
  });

  it('allows user to save when at least one field has data', async () => {
    mockTier = 'light';
    mockStore.weight = 75; // Simulate user entered weight
    render(React.createElement(CheckinForm));

    const saveBtn = screen.getByRole('button', { name: /сохранить чек-ин/i });
    await userEvent.click(saveBtn);

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent(/чек-ин сохранён/i);
  });
});
