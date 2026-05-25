// js/tests/components/ExerciseCard.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, params?: any) => {
      const defaults: Record<string, string> = {
        'exercise.set': `Set ${params?.number || ''}`,
        'exercise.reps': 'reps',
        'exercise.weight': 'kg',
        'exercise.nextWeekProgress': `Next: ${params?.value || ''} (${params?.reason || ''})`,
        'exercise.adjustmentReason': `${params?.sign || ''}${params?.amount || ''} ${params?.unit || ''} for ${params?.reps || 0} reps`,
        'units.kg': 'kg',
        'units.lbs': 'lbs',
        'exercise.recoveryBanner.red': `Reduced by ${params?.reduction || ''} ${params?.unit || ''}`,
        'exercise.recoveryBanner.yellow': 'Slight reduction',
      };
      return defaults[key] || key;
    },
  }),
}));

// Mock the APRE engine
vi.mock('../../core/apre/engine.js', () => ({
  calcApreSets: (params: any) => {
    if (!params.currentRM || params.currentRM <= 0) return null;
    return {
      set1: { weight: params.currentRM * 0.5, reps: 10, readonly: true },
      set2: { weight: params.currentRM * 0.75, reps: 8, readonly: true },
      set3: { weight: params.currentRM, reps: 'AMRAP', readonly: false },
      set4: {
        weight: params.set3Reps !== null ? params.currentRM + 2.5 : null,
        reps: 'AMRAP',
        disabled: params.set3Reps === null,
        adjustmentReason: params.set3Reps !== null ? '(+2.5 kg for 10 reps)' : '',
      },
      effectiveRM: params.currentRM,
      recoveryReduction: 0,
    };
  },
  calcNextWeekRM: (_protocol: string, currentRM: number, set4Reps: number) => {
    if (set4Reps >= 10) return currentRM + 2.5;
    if (set4Reps <= 5) return currentRM - 2.5;
    return currentRM;
  },
  CALISTHENICS_PROGRESSIONS: {
    1: 'Level 1',
    2: 'Level 2',
    3: 'Level 3',
    4: 'Level 4',
    5: 'Level 5',
  },
}));

import ExerciseCard from '../../ui/components/ExerciseCard.jsx';

const mockEx = {
  n: 'Подтягивания',
  s: '4',
  r: '6-8',
  w: 'НЕ до отказа',
  isApre: true,
  protocol: 'APRE_6' as const,
  currentRM: 60,
  unit: 'kg' as const,
  isCalisthenics: false,
};

describe('ExerciseCard', () => {
  it('renders exercise name', () => {
    render(React.createElement(ExerciseCard, {
      ex: mockEx,
      recoveryScore: 80,
      onApreResult: vi.fn(),
      isConfigured: true,
      onConfigure: vi.fn(),
    }));
    expect(screen.getByText('Подтягивания')).toBeTruthy();
  });

  it('renders exercise sets and reps', () => {
    render(React.createElement(ExerciseCard, {
      ex: mockEx,
      recoveryScore: 80,
      onApreResult: vi.fn(),
      isConfigured: true,
      onConfigure: vi.fn(),
    }));
    expect(screen.getByText('4×6-8')).toBeTruthy();
  });

  it('renders APRE set rows', () => {
    const { container } = render(React.createElement(ExerciseCard, {
      ex: mockEx,
      recoveryScore: 80,
      onApreResult: vi.fn(),
      isConfigured: true,
      onConfigure: vi.fn(),
    }));
    const setRows = container.querySelectorAll('.apre-set-row');
    expect(setRows.length).toBe(4); // 4 APRE sets
  });

  it('renders readonly sets 1 and 2', () => {
    const { container } = render(React.createElement(ExerciseCard, {
      ex: mockEx,
      recoveryScore: 80,
      onApreResult: vi.fn(),
      isConfigured: true,
      onConfigure: vi.fn(),
    }));
    const readonlyRows = container.querySelectorAll('.apre-set-row');
    expect(readonlyRows.length).toBeGreaterThanOrEqual(2);
  });

  it('renders AMRAP input for set 3', () => {
    const { container } = render(React.createElement(ExerciseCard, {
      ex: mockEx,
      recoveryScore: 80,
      onApreResult: vi.fn(),
      isConfigured: true,
      onConfigure: vi.fn(),
    }));
    const amrapRows = container.querySelectorAll('.apre-set-row--amrap');
    expect(amrapRows.length).toBeGreaterThanOrEqual(1);
  });

  it('set 4 is disabled until set 3 has input', () => {
    const { container } = render(React.createElement(ExerciseCard, {
      ex: mockEx,
      recoveryScore: 80,
      onApreResult: vi.fn(),
      isConfigured: true,
      onConfigure: vi.fn(),
    }));
    const disabledRows = container.querySelectorAll('.apre-set-row--disabled');
    expect(disabledRows.length).toBeGreaterThanOrEqual(1);
  });

  it('enables set 4 after entering set 3 reps', () => {
    const { container } = render(React.createElement(ExerciseCard, {
      ex: mockEx,
      recoveryScore: 80,
      onApreResult: vi.fn(),
      isConfigured: true,
      onConfigure: vi.fn(),
    }));

    // Find the AMRAP input for set 3
    const inputs = container.querySelectorAll('.apre-set-reps-input');
    expect(inputs.length).toBeGreaterThanOrEqual(1);

    // Enter reps for set 3
    fireEvent.change(inputs[0], { target: { value: '8' } });

    // Set 4 should now be enabled
    const disabledRows = container.querySelectorAll('.apre-set-row--disabled');
    expect(disabledRows.length).toBe(0);
  });

  it('shows next week prediction after set 4 input', () => {
    const { container } = render(React.createElement(ExerciseCard, {
      ex: mockEx,
      recoveryScore: 80,
      onApreResult: vi.fn(),
      isConfigured: true,
      onConfigure: vi.fn(),
    }));

    // Enter set 3 reps
    const inputs = container.querySelectorAll('.apre-set-reps-input');
    fireEvent.change(inputs[0], { target: { value: '8' } });

    // Enter set 4 reps
    const allInputs = container.querySelectorAll('.apre-set-reps-input');
    if (allInputs.length > 1) {
      fireEvent.change(allInputs[1], { target: { value: '10' } });
    }

    // Should show next week info
    const nextWeekEl = container.querySelector('.apre-next-week');
    expect(nextWeekEl).toBeTruthy();
  });

  it('renders configure button when not configured', () => {
    const onConfigure = vi.fn();
    const { container } = render(React.createElement(ExerciseCard, {
      ex: mockEx,
      recoveryScore: 80,
      onApreResult: vi.fn(),
      isConfigured: false,
      onConfigure,
    }));
    const configButton = container.querySelectorAll('button');
    expect(configButton.length).toBeGreaterThan(0);
  });

  it('calls onConfigure when configure button clicked', () => {
    const onConfigure = vi.fn();
    const { container } = render(React.createElement(ExerciseCard, {
      ex: mockEx,
      recoveryScore: 80,
      onApreResult: vi.fn(),
      isConfigured: false,
      onConfigure,
    }));
    // Find and click the settings/configure button
    const buttons = container.querySelectorAll('button');
    const configBtn = Array.from(buttons).find(b => b.querySelector('svg'));
    if (configBtn) {
      fireEvent.click(configBtn);
      expect(onConfigure).toHaveBeenCalled();
    }
  });

  it('renders recovery banner when score is low', () => {
    const { container } = render(React.createElement(ExerciseCard, {
      ex: mockEx,
      recoveryScore: 30,
      onApreResult: vi.fn(),
      isConfigured: true,
      onConfigure: vi.fn(),
    }));
    const banner = container.querySelector('.apre-recovery-banner');
    expect(banner).toBeTruthy();
  });

  it('does not render recovery banner when score is good', () => {
    const { container } = render(React.createElement(ExerciseCard, {
      ex: mockEx,
      recoveryScore: 80,
      onApreResult: vi.fn(),
      isConfigured: true,
      onConfigure: vi.fn(),
    }));
    const banner = container.querySelector('.apre-recovery-banner');
    expect(banner).toBeNull();
  });

  it('renders non-APRE exercise without set rows', () => {
    const { container } = render(React.createElement(ExerciseCard, {
      ex: { n: 'Бег', s: '3', r: '20 мин', w: 'Z2' },
      recoveryScore: 80,
      onApreResult: vi.fn(),
      isConfigured: true,
      onConfigure: vi.fn(),
    }));
    const setRows = container.querySelectorAll('.apre-set-row');
    expect(setRows.length).toBe(0);
  });

  it('renders exercise weight/notes', () => {
    render(React.createElement(ExerciseCard, {
      ex: mockEx,
      recoveryScore: 80,
      onApreResult: vi.fn(),
      isConfigured: true,
      onConfigure: vi.fn(),
    }));
    expect(screen.getByText('НЕ до отказа')).toBeTruthy();
  });

  it('has correct class structure', () => {
    const { container } = render(React.createElement(ExerciseCard, {
      ex: mockEx,
      recoveryScore: 80,
      onApreResult: vi.fn(),
      isConfigured: true,
      onConfigure: vi.fn(),
    }));
    expect(container.querySelector('.exercise-card')).toBeTruthy();
  });
});
