// js/tests/components/TrendIndicator.test.tsx
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';
import TrendIndicator from '../../ui/components/TrendIndicator.jsx';

describe('TrendIndicator', () => {
  it('renders trend arrow and percentage', () => {
    const { container } = render(React.createElement(TrendIndicator, {
      current: 110,
      history: [100, 100, 100],
    }));
    const el = container.querySelector('.trend-indicator');
    expect(el).toBeTruthy();
    expect(el?.textContent).toContain('↑');
    expect(el?.textContent).toContain('10%');
  });

  it('renders down arrow when current below average', () => {
    const { container } = render(React.createElement(TrendIndicator, {
      current: 80,
      history: [100, 100, 100],
    }));
    const el = container.querySelector('.trend-indicator');
    expect(el?.textContent).toContain('↓');
    expect(el?.textContent).toContain('20%');
  });

  it('renders flat arrow when current equals average', () => {
    const { container } = render(React.createElement(TrendIndicator, {
      current: 100,
      history: [100, 100, 100],
    }));
    const el = container.querySelector('.trend-indicator');
    expect(el?.textContent).toContain('→');
    expect(el?.textContent).toContain('0%');
  });

  it('applies green color for positive trend', () => {
    const { container } = render(React.createElement(TrendIndicator, {
      current: 110,
      history: [100, 100, 100],
    }));
    const el = container.querySelector('.trend-indicator') as HTMLElement;
    expect(el.style.color).toBe('var(--green)');
  });

  it('applies red color for negative trend', () => {
    const { container } = render(React.createElement(TrendIndicator, {
      current: 80,
      history: [100, 100, 100],
    }));
    const el = container.querySelector('.trend-indicator') as HTMLElement;
    expect(el.style.color).toBe('var(--red)');
  });

  it('applies muted color for flat trend', () => {
    const { container } = render(React.createElement(TrendIndicator, {
      current: 100,
      history: [100, 100, 100],
    }));
    const el = container.querySelector('.trend-indicator') as HTMLElement;
    expect(el.style.color).toBe('var(--text3)');
  });

  it('returns null when history is null', () => {
    const { container } = render(React.createElement(TrendIndicator, {
      current: 100,
      history: null as any,
    }));
    expect(container.querySelector('.trend-indicator')).toBeNull();
  });

  it('returns null when history has less than 2 items', () => {
    const { container } = render(React.createElement(TrendIndicator, {
      current: 100,
      history: [100],
    }));
    expect(container.querySelector('.trend-indicator')).toBeNull();
  });

  it('returns null when current is undefined', () => {
    const { container } = render(React.createElement(TrendIndicator, {
      current: undefined,
      history: [100, 100, 100],
    } as any));
    expect(container.querySelector('.trend-indicator')).toBeNull();
  });

  it('returns null when current is null', () => {
    const { container } = render(React.createElement(TrendIndicator, {
      current: null,
      history: [100, 100, 100],
    } as any));
    expect(container.querySelector('.trend-indicator')).toBeNull();
  });

  it('returns null when history has only non-positive values', () => {
    const { container } = render(React.createElement(TrendIndicator, {
      current: 100,
      history: [0, 0, 0],
    }));
    expect(container.querySelector('.trend-indicator')).toBeNull();
  });

  it('filters out non-numeric values from history', () => {
    const { container } = render(React.createElement(TrendIndicator, {
      current: 110,
      history: [100, 'abc' as any, 100, null as any, 100],
    }));
    const el = container.querySelector('.trend-indicator');
    expect(el).toBeTruthy();
    expect(el?.textContent).toContain('10%');
  });

  it('displays unit when provided', () => {
    const { container } = render(React.createElement(TrendIndicator, {
      current: 110,
      history: [100, 100, 100],
      unit: 'ms',
    }));
    const el = container.querySelector('.trend-indicator');
    expect(el?.textContent).toContain('↑');
  });

  it('inverts trend direction when inverse is true', () => {
    const { container } = render(React.createElement(TrendIndicator, {
      current: 110,
      history: [100, 100, 100],
      inverse: true,
    }));
    const el = container.querySelector('.trend-indicator') as HTMLElement;
    // Higher is worse when inverse=true, so should show red
    expect(el.style.color).toBe('var(--red)');
    expect(el.textContent).toContain('↓');
  });

  it('shows green for lower value when inverse is true', () => {
    const { container } = render(React.createElement(TrendIndicator, {
      current: 80,
      history: [100, 100, 100],
      inverse: true,
    }));
    const el = container.querySelector('.trend-indicator') as HTMLElement;
    expect(el.style.color).toBe('var(--green)');
    expect(el.textContent).toContain('↑');
  });

  it('handles zero average (edge case)', () => {
    const { container } = render(React.createElement(TrendIndicator, {
      current: 0,
      history: [0, 0, 0],
    }));
    // All zeros → no valid history → returns null
    expect(container.querySelector('.trend-indicator')).toBeNull();
  });

  it('rounds percentage to integer', () => {
    const { container } = render(React.createElement(TrendIndicator, {
      current: 115,
      history: [100, 100, 100],
    }));
    const el = container.querySelector('.trend-indicator');
    expect(el?.textContent).toContain('15%');
  });

  it('uses absolute value for percentage display', () => {
    const { container } = render(React.createElement(TrendIndicator, {
      current: 85,
      history: [100, 100, 100],
    }));
    const el = container.querySelector('.trend-indicator');
    expect(el?.textContent).toContain('15%');
    expect(el?.textContent).not.toContain('-');
  });
});
