// js/tests/ui/CheckinForm.test.tsx
// TDD: CheckinForm tier-adaptive field visibility

import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';

// Tier control — each sub-suite sets this before importing
let __tier: 'full' | 'medium' | 'light' = 'full';
export function __setTier(t: 'full' | 'medium' | 'light') { __tier = t; }

vi.mock('../../stores/useAppStore.js', () => ({
  useAppStore: () => ({
    weight: 0, restHR: 0, hrv: 0, sleepHours: 0,
    hipPain: 0, shoulderPain: 0, breathing: 'good' as const, notes: '',
    muscleSoreness: 0, energy: 0, mood: 0, sleepQuality: 0, stress: 0,
    setWeight: vi.fn(), setRestHR: vi.fn(), setHrv: vi.fn(), setSleepHours: vi.fn(),
    setHipPain: vi.fn(), setShoulderPain: vi.fn(), setBreathing: vi.fn(), setNotes: vi.fn(),
    setMuscleSoreness: vi.fn(), setEnergy: vi.fn(), setMood: vi.fn(), setSleepQuality: vi.fn(), setStress: vi.fn(),
    handleSaveCheckin: vi.fn().mockResolvedValue(undefined),
    checkins: [], showToast: vi.fn(), todayISO: '2026-05-24',
    get checkinTier() { return __tier; },
  }),
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

describe('CheckinForm — tier-adaptive biometric fields', () => {
  it('shows HRV and RHR fields for full tier', () => {
    __setTier('full');
    const { unmount } = render(React.createElement(CheckinForm));
    const sections = document.querySelectorAll('.checkin-section');
    const bioSection = Array.from(sections).find(s => s.textContent?.includes('Биометрика'));
    expect(bioSection).toBeTruthy();
    const numberInputs = bioSection?.querySelectorAll('input[type="number"]');
    expect(numberInputs?.length).toBeGreaterThanOrEqual(3); // RHR + HRV + weight
    unmount();
  });

  it('hides HRV field for medium tier', () => {
    __setTier('medium');
    const { unmount } = render(React.createElement(CheckinForm));
    const sections = document.querySelectorAll('.checkin-section');
    const bioSection = Array.from(sections).find(s => s.textContent?.includes('Биометрика'));
    expect(bioSection).toBeTruthy();
    const numberInputs = bioSection?.querySelectorAll('input[type="number"]');
    expect(numberInputs?.length).toBe(2); // RHR + weight (no HRV)
    unmount();
  });

  it('hides both HRV and RHR for light tier', () => {
    __setTier('light');
    const { unmount } = render(React.createElement(CheckinForm));
    const sections = document.querySelectorAll('.checkin-section');
    const bioSection = Array.from(sections).find(s => s.textContent?.includes('Биометрика'));
    expect(bioSection).toBeTruthy();
    const numberInputs = bioSection?.querySelectorAll('input[type="number"]');
    expect(numberInputs?.length).toBeLessThanOrEqual(1); // Only weight
    unmount();
  });

  it('always shows subjective fields regardless of tier', () => {
    for (const tier of ['full', 'medium', 'light'] as const) {
      __setTier(tier);
      const { unmount } = render(React.createElement(CheckinForm));
      const scaleRows = document.querySelectorAll('.checkin-row--scale');
      expect(scaleRows.length).toBeGreaterThanOrEqual(3);
      unmount();
    }
  });
});
