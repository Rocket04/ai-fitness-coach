// js/tests/ui/OnboardingWizard.test.tsx
// TDD: OnboardingWizard 5-step flow + tier auto-detection

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

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

import React from 'react';

let OnboardingWizard: any;

beforeEach(async () => {
  vi.clearAllMocks();
  const mod = await import('../../ui/components/OnboardingWizard.jsx');
  OnboardingWizard = mod.default;
});

describe('OnboardingWizard — 5-step flow', () => {
  it('renders step 1 (Value) initially', () => {
    const onComplete = vi.fn();
    render(React.createElement(OnboardingWizard, { isOpen: true, onComplete }));
    expect(document.querySelector('.onboarding-headline')?.textContent).toBe('Твой умный тренер готов к работе');
    expect(document.querySelector('.onboarding-steps')).toBeTruthy();
  });

  it('shows 5 step indicators', () => {
    const onComplete = vi.fn();
    render(React.createElement(OnboardingWizard, { isOpen: true, onComplete }));
    const steps = document.querySelectorAll('.onboarding-step');
    expect(steps.length).toBe(5);
  });

  it('renders nothing when isOpen is false', () => {
    const onComplete = vi.fn();
    const { container } = render(React.createElement(OnboardingWizard, { isOpen: false, onComplete }));
    expect(container.innerHTML).toBe('');
  });

  it('has a close button', () => {
    const onComplete = vi.fn();
    const onClose = vi.fn();
    render(React.createElement(OnboardingWizard, { isOpen: true, onComplete, onClose }));
    expect(document.querySelector('.onboarding-close')).toBeTruthy();
  });

  it('advances from step 1 to step 2 on click', async () => {
    const user = userEvent.setup();
    const onComplete = vi.fn();
    render(React.createElement(OnboardingWizard, { isOpen: true, onComplete }));
    
    const nextBtn = document.querySelector('.onboarding-value-cta button');
    expect(nextBtn).toBeTruthy();
    await user.click(nextBtn!);
    
    // Step 2 should show goal selection
    expect(document.querySelector('.onboarding-goal-cards')).toBeTruthy();
  });
});

describe('OnboardingWizard — tier auto-detection', () => {
  it('renders gadget selection on step 4', async () => {
    const user = userEvent.setup();
    const onComplete = vi.fn();
    render(React.createElement(OnboardingWizard, { isOpen: true, onComplete }));

    // Navigate through steps 1-3
    await user.click(document.querySelector('.onboarding-value-cta button')!);
    
    // Step 2: select a goal and day, then next
    const goalCards = document.querySelectorAll('.onboarding-goal-card');
    if (goalCards.length > 0) await user.click(goalCards[0]);
    const dayChips = document.querySelectorAll('.onboarding-day-chip');
    if (dayChips.length > 0) await user.click(dayChips[0]);
    await user.click(document.querySelector('.onboarding-actions .btn-accent')!);

    // Step 3: select a sport, then next
    const sportChips = document.querySelectorAll('.onboarding-sport-chip');
    if (sportChips.length > 0) await user.click(sportChips[0]);
    await user.click(document.querySelector('.onboarding-actions .btn-accent')!);

    // Step 4: gadget selection should be visible
    expect(document.querySelector('.onboarding-gadgets-list')).toBeTruthy();
  });
});
