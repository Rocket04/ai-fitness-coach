// js/tests/components/MiniSparkline.test.tsx
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';
import MiniSparkline from '../../ui/components/MiniSparkline.jsx';

describe('MiniSparkline', () => {
  it('renders SVG with correct dimensions', () => {
    const { container } = render(React.createElement(MiniSparkline, {
      data: [10, 20, 30, 25, 40],
      width: 120,
      height: 28,
    }));
    const svg = container.querySelector('svg');
    expect(svg).toBeTruthy();
    expect(svg?.getAttribute('width')).toBe('120');
    expect(svg?.getAttribute('height')).toBe('28');
  });

  it('renders area fill and line paths', () => {
    const { container } = render(React.createElement(MiniSparkline, {
      data: [10, 20, 30],
      color: '#4ade80',
    }));
    const area = container.querySelector('path');
    const line = container.querySelector('polyline');
    expect(area).toBeTruthy();
    expect(line).toBeTruthy();
  });

  it('applies color to line stroke', () => {
    const { container } = render(React.createElement(MiniSparkline, {
      data: [10, 20, 30],
      color: '#ff0000',
    }));
    const line = container.querySelector('polyline');
    expect(line?.getAttribute('stroke')).toBe('#ff0000');
  });

  it('applies color to area fill with opacity', () => {
    const { container } = render(React.createElement(MiniSparkline, {
      data: [10, 20, 30],
      color: '#4ade80',
    }));
    const area = container.querySelector('path');
    expect(area?.getAttribute('fill')).toBe('#4ade80');
    expect(area?.getAttribute('opacity')).toBe('0.1');
  });

  it('returns null for empty data', () => {
    const { container } = render(React.createElement(MiniSparkline, {
      data: [],
    }));
    expect(container.querySelector('svg')).toBeNull();
  });

  it('returns null for single data point', () => {
    const { container } = render(React.createElement(MiniSparkline, {
      data: [42],
    }));
    expect(container.querySelector('svg')).toBeNull();
  });

  it('returns null for null data', () => {
    const { container } = render(React.createElement(MiniSparkline, {
      data: null as any,
    }));
    expect(container.querySelector('svg')).toBeNull();
  });

  it('returns null for undefined data', () => {
    const { container } = render(React.createElement(MiniSparkline, {
      data: undefined as any,
    }));
    expect(container.querySelector('svg')).toBeNull();
  });

  it('filters out non-numeric values', () => {
    const { container } = render(React.createElement(MiniSparkline, {
      data: [10, NaN, 20, null as any, 30],
    }));
    const svg = container.querySelector('svg');
    expect(svg).toBeTruthy();
  });

  it('has aria-hidden attribute', () => {
    const { container } = render(React.createElement(MiniSparkline, {
      data: [10, 20, 30],
    }));
    const svg = container.querySelector('svg');
    expect(svg?.getAttribute('aria-hidden')).toBe('true');
  });

  it('has mini-sparkline class', () => {
    const { container } = render(React.createElement(MiniSparkline, {
      data: [10, 20, 30],
    }));
    const svg = container.querySelector('svg');
    expect(svg?.classList.contains('mini-sparkline')).toBe(true);
  });

  it('uses default dimensions when not specified', () => {
    const { container } = render(React.createElement(MiniSparkline, {
      data: [10, 20, 30],
    }));
    const svg = container.querySelector('svg');
    expect(svg?.getAttribute('width')).toBe('120');
    expect(svg?.getAttribute('height')).toBe('28');
  });

  it('uses default color when not specified', () => {
    const { container } = render(React.createElement(MiniSparkline, {
      data: [10, 20, 30],
    }));
    const line = container.querySelector('polyline');
    expect(line?.getAttribute('stroke')).toBe('var(--accent)');
  });
});
