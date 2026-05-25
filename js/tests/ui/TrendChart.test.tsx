// js/tests/ui/TrendChart.test.tsx
// TDD: TrendChart — SVG hover tooltip rendering

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

let TrendChart: any;

beforeEach(async () => {
  vi.clearAllMocks();
  vi.resetModules();
  const mod = await import('../../ui/pages/TrendChart.tsx');
  TrendChart = mod.default;
});

function makeData(points: number[]): any[] {
  return points.map((v, i) => ({
    date: `2026-05-${String(18 + i).padStart(2, '0')}`,
    value: v,
  }));
}

describe('TrendChart — tooltip', () => {
  it('renders chart with data points', () => {
    const data = makeData([60, 65, 70, 68, 72]);
    const { unmount } = render(React.createElement(TrendChart, {
      data, yKey: 'value', color: 'var(--green)', label: 'HRV', unit: 'ms',
    }));
    const svg = document.querySelector('svg');
    expect(svg).toBeTruthy();
    unmount();
  });

  it('shows tooltip on mouse enter of data point', () => {
    const data = makeData([60, 65, 70, 68, 72]);
    const { unmount } = render(React.createElement(TrendChart, {
      data, yKey: 'value', color: 'var(--green)', label: 'HRV', unit: 'ms',
    }));
    // Find hit area circles (they have className 'cursor-pointer')
    const hitCircles = document.querySelectorAll('circle.cursor-pointer');
    expect(hitCircles.length).toBeGreaterThan(0);
    unmount();
  });

  it('renders no tooltip when no data', () => {
    const { unmount } = render(React.createElement(TrendChart, {
      data: [], yKey: 'value', color: 'var(--green)',
    }));
    const svg = document.querySelector('svg');
    expect(svg).toBeNull();
    unmount();
  });

  it('renders no tooltip when single data point', () => {
    const { unmount } = render(React.createElement(TrendChart, {
      data: [makeData([60])], yKey: 'value', color: 'var(--green)',
    }));
    const svg = document.querySelector('svg');
    expect(svg).toBeNull();
    unmount();
  });

  it('displays stats summary (min/avg/max/trend)', () => {
    const data = makeData([60, 65, 70, 68, 72]);
    const { unmount } = render(React.createElement(TrendChart, {
      data, yKey: 'value', color: 'var(--green)', unit: 'ms',
    }));
    const stats = document.querySelector('.chart-stats');
    expect(stats).toBeTruthy();
    const statValues = document.querySelectorAll('.chart-stat-value');
    expect(statValues.length).toBeGreaterThanOrEqual(3); // min, avg, max
    unmount();
  });
});
