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

describe('CorrelationCard', () => {
  it('renders title, insight and sample size when result is valid', () => {
    render(React.createElement(CorrelationCard, { result: mockResult }));
    expect(screen.getByText('Сон → Recovery')).toBeInTheDocument();
    expect(screen.getByText('При сне >7 ч Recovery Score в среднем выше на 15%')).toBeInTheDocument();
    expect(screen.getByText('n=12')).toBeInTheDocument();
  });

  it('renders nothing when result is null', () => {
    const { container } = render(React.createElement(CorrelationCard, { result: null as any }));
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when result is undefined', () => {
    const { container } = render(React.createElement(CorrelationCard, { result: undefined as any }));
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when sampleSize is less than 2', () => {
    const { container } = render(React.createElement(CorrelationCard, {
      result: { ...mockResult, sampleSize: 1 },
    }));
    expect(container.firstChild).toBeNull();
  });

  it('renders when sampleSize is exactly 2', () => {
    render(React.createElement(CorrelationCard, {
      result: { ...mockResult, sampleSize: 2 },
    }));
    expect(screen.getByText('n=2')).toBeInTheDocument();
  });

  it('renders with unknown icon fallback', () => {
    render(React.createElement(CorrelationCard, {
      result: { ...mockResult, icon: 'UnknownIcon' },
    }));
    expect(screen.getByText('Сон → Recovery')).toBeInTheDocument();
  });
});
