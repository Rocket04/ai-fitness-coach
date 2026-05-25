// js/tests/components/CorrelationCard.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import CorrelationCard from '../../ui/components/CorrelationCard.jsx';

const mockResult = {
  title: 'Сон → Recovery',
  insight: 'При сне >7 ч Recovery Score в среднем выше на 15%',
  deltaPercent: 15,
  sampleSize: 12,
  icon: 'Moon',
};

const mockNegativeResult = {
  title: 'Стресс → Recovery',
  insight: 'При стрессе >3 Recovery Score ниже на 22%',
  deltaPercent: -22,
  sampleSize: 8,
  icon: 'Zap',
};

const mockNoDeltaResult = {
  title: 'HRV → Recovery',
  insight: 'Недостаточно данных для вывода',
  deltaPercent: null,
  sampleSize: 3,
  icon: 'Activity',
};

describe('CorrelationCard', () => {
  it('renders card with title and insight', () => {
    render(React.createElement(CorrelationCard, { result: mockResult }));
    expect(screen.getByText('Сон → Recovery')).toBeTruthy();
    expect(screen.getByText('При сне >7 ч Recovery Score в среднем выше на 15%')).toBeTruthy();
  });

  it('renders sample size', () => {
    render(React.createElement(CorrelationCard, { result: mockResult }));
    expect(screen.getByText('n=12')).toBeTruthy();
  });

  it('renders icon', () => {
    const { container } = render(React.createElement(CorrelationCard, { result: mockResult }));
    const iconContainer = container.querySelector('.correlation-card__icon');
    expect(iconContainer).toBeTruthy();
  });

  it('applies green color for positive delta', () => {
    const { container } = render(React.createElement(CorrelationCard, { result: mockResult }));
    const insight = container.querySelector('.correlation-card__insight') as HTMLElement;
    expect(insight.style.color).toBe('var(--green)');
  });

  it('applies red color for negative delta', () => {
    const { container } = render(React.createElement(CorrelationCard, { result: mockNegativeResult }));
    const insight = container.querySelector('.correlation-card__insight') as HTMLElement;
    expect(insight.style.color).toBe('var(--red)');
  });

  it('applies muted color for null delta', () => {
    const { container } = render(React.createElement(CorrelationCard, { result: mockNoDeltaResult }));
    const insight = container.querySelector('.correlation-card__insight') as HTMLElement;
    expect(insight.style.color).toBe('var(--text3)');
  });

  it('returns null when result is null', () => {
    const { container } = render(React.createElement(CorrelationCard, { result: null as any }));
    expect(container.querySelector('.correlation-card')).toBeNull();
  });

  it('returns null when result is undefined', () => {
    const { container } = render(React.createElement(CorrelationCard, { result: undefined as any }));
    expect(container.querySelector('.correlation-card')).toBeNull();
  });

  it('returns null when sampleSize < 2', () => {
    const { container } = render(React.createElement(CorrelationCard, {
      result: { ...mockResult, sampleSize: 1 },
    }));
    expect(container.querySelector('.correlation-card')).toBeNull();
  });

  it('renders with sampleSize exactly 2', () => {
    render(React.createElement(CorrelationCard, {
      result: { ...mockResult, sampleSize: 2 },
    }));
    expect(screen.getByText('n=2')).toBeTruthy();
  });

  it('has correct class structure', () => {
    const { container } = render(React.createElement(CorrelationCard, { result: mockResult }));
    expect(container.querySelector('.correlation-card')).toBeTruthy();
    expect(container.querySelector('.correlation-card__header')).toBeTruthy();
    expect(container.querySelector('.correlation-card__title')).toBeTruthy();
    expect(container.querySelector('.correlation-card__insight')).toBeTruthy();
    expect(container.querySelector('.correlation-card__sample')).toBeTruthy();
  });

  it('renders unknown icon as HelpCircle fallback', () => {
    const { container } = render(React.createElement(CorrelationCard, {
      result: { ...mockResult, icon: 'UnknownIcon' },
    }));
    expect(container.querySelector('.correlation-card')).toBeTruthy();
  });

  it('handles zero deltaPercent', () => {
    const { container } = render(React.createElement(CorrelationCard, {
      result: { ...mockResult, deltaPercent: 0 },
    }));
    const insight = container.querySelector('.correlation-card__insight') as HTMLElement;
    expect(insight.style.color).toBe('var(--red)');
  });
});
