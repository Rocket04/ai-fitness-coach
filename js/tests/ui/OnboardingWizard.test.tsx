// js/tests/ui/OnboardingWizard.test.tsx
// TDD: OnboardingWizard user-facing behavior — what the user can do and see

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

// Mock constants
vi.mock('../../config/constants.js', () => ({
  DAYS: ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'],
  DAYS_TO_DOW: [1, 2, 3, 4, 5, 6, 0],
  SPORT_CATEGORIES: [
    { key: 'cardio', label: 'Кардио', emoji: '🏃', sports: [
      { key: 'running', label: 'Бег' },
      { key: 'cycling', label: 'Велосипед' },
    ]},
    { key: 'strength', label: 'Силовые', emoji: '💪', sports: [
      { key: 'strength_gym', label: 'Тренажёрный зал' },
    ]},
  ],
  GADGETS: [
    { key: 'manual', label: 'Ручной ввод', desc: 'Без устройств', tier: 'light', exclusive: true },
    { key: 'smart_watch', label: 'Смарт-часы', desc: 'ЧСС покоя', tier: 'medium' },
    { key: 'hrv_monitor', label: 'HRV-монитор', desc: 'HRV', tier: 'full' },
  ],
  deriveTierFromGadgets: (gadgets: string[]) => {
    if (gadgets.includes('manual')) return 'light';
    if (gadgets.includes('hrv_monitor')) return 'full';
    if (gadgets.includes('smart_watch')) return 'medium';
    return 'light';
  },
}));

// Mock lucide-react
vi.mock('lucide-react', () => ({
  Dumbbell: () => React.createElement('svg', { 'data-testid': 'dumbbell-icon' }),
  Zap: () => React.createElement('svg', { 'data-testid': 'zap-icon' }),
  Flame: () => React.createElement('svg', { 'data-testid': 'flame-icon' }),
  Check: () => React.createElement('svg', { 'data-testid': 'check-icon' }),
  Rocket: () => React.createElement('svg', { 'data-testid': 'rocket-icon' }),
  X: () => React.createElement('svg', { 'data-testid': 'close-icon' }),
}));

let OnboardingWizard: any;

beforeEach(async () => {
  vi.clearAllMocks();
  const mod = await import('../../ui/components/OnboardingWizard.jsx');
  OnboardingWizard = mod.default;
});

describe('OnboardingWizard — user onboarding flow', () => {
  it('shows value proposition headline when opened', () => {
    render(React.createElement(OnboardingWizard, { isOpen: true, onComplete: vi.fn() }));
    expect(screen.getByText('Твой умный тренер готов к работе')).toBeInTheDocument();
  });

  it('shows 5 step progress indicators', () => {
    const { container } = render(React.createElement(OnboardingWizard, { isOpen: true, onComplete: vi.fn() }));
    const steps = container.querySelector('[data-testid="onboarding-step-1"]');
    expect(steps).toBeInTheDocument();
  });

  it('does not render anything when isOpen is false', () => {
    const { container } = render(React.createElement(OnboardingWizard, { isOpen: false, onComplete: vi.fn() }));
    expect(container.innerHTML).toBe('');
  });

  it('shows a close button when onClose is provided', () => {
    const onClose = vi.fn();
    render(React.createElement(OnboardingWizard, { isOpen: true, onComplete: vi.fn(), onClose }));
    const closeBtn = screen.getByLabelText(/закрыть/i);
    expect(closeBtn).toBeInTheDocument();
  });

  it('advances to goal selection when user clicks primary CTA', async () => {
    render(React.createElement(OnboardingWizard, { isOpen: true, onComplete: vi.fn() }));

    const ctaBtn = screen.getByRole('button', { name: /начать первую тренировку/i });
    await userEvent.click(ctaBtn);

    expect(screen.getByText('Выбери свою цель')).toBeInTheDocument();
  });

  it('shows gadget selection with auto-detected tier on step 4', async () => {
    render(React.createElement(OnboardingWizard, { isOpen: true, onComplete: vi.fn() }));

    // Step 1 → Step 2
    await userEvent.click(screen.getByRole('button', { name: /начать первую тренировку/i }));

    // Step 2: select a goal
    await userEvent.click(screen.getByText('Стать сильнее'));
    // Select a day
    await userEvent.click(screen.getByText('Пн'));
    // Next
    await userEvent.click(screen.getAllByRole('button', { name: /далее/i })[0]);

    // Step 3: select a sport
    await userEvent.click(screen.getByText('Бег'));
    await userEvent.click(screen.getAllByRole('button', { name: /далее/i })[0]);

    // Step 4: gadget selection visible
    expect(screen.getByText('Какие устройства используешь?')).toBeInTheDocument();
    expect(screen.getByText('Ручной ввод')).toBeInTheDocument();
    expect(screen.getByText('Смарт-часы')).toBeInTheDocument();
  });

  it('recommends light tier when user selects manual input gadget', async () => {
    render(React.createElement(OnboardingWizard, { isOpen: true, onComplete: vi.fn() }));

    // Navigate to step 4
    await userEvent.click(screen.getByRole('button', { name: /начать первую тренировку/i }));
    await userEvent.click(screen.getByText('Стать сильнее'));
    await userEvent.click(screen.getByText('Пн'));
    await userEvent.click(screen.getAllByRole('button', { name: /далее/i })[0]);
    await userEvent.click(screen.getByText('Бег'));
    await userEvent.click(screen.getAllByRole('button', { name: /далее/i })[0]);

    // Select manual gadget
    await userEvent.click(screen.getByText('Ручной ввод'));

    expect(screen.getByText(/лёгкий/i)).toBeInTheDocument();
  });
});
