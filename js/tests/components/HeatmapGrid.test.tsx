// js/tests/components/HeatmapGrid.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import HeatmapGrid from '../../ui/components/HeatmapGrid.jsx';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const mockData = [
  { date: '2026-05-20', recoveryScore: 62, hrv: 48, sleepHours: 6.5, readiness: 'green' },
  { date: '2026-05-21', recoveryScore: 68, hrv: 52, sleepHours: 7.0, readiness: 'green' },
  { date: '2026-05-22', recoveryScore: 55, hrv: 45, sleepHours: 6.0, readiness: 'yellow' },
  { date: '2026-05-23', recoveryScore: 72, hrv: 56, sleepHours: 8.0, readiness: 'green' },
  { date: '2026-05-24', recoveryScore: 78, hrv: 60, sleepHours: 7.5, readiness: 'green' },
  { date: '2026-05-25', recoveryScore: 70, hrv: 54, sleepHours: 7.0, readiness: 'yellow' },
  { date: '2026-05-26', recoveryScore: 74, hrv: 57, sleepHours: 8.0, readiness: 'green' },
];

describe('HeatmapGrid', () => {
  it('renders heatmap grid container', () => {
    const { container } = render(React.createElement(HeatmapGrid, { data: mockData }));
    expect(container.querySelector('.heatmap-grid')).toBeTruthy();
  });

  it('renders header with title and day count', () => {
    const { container } = render(React.createElement(HeatmapGrid, { data: mockData }));
    expect(container.querySelector('.heatmap-grid__header')).toBeTruthy();
    expect(container.querySelector('.heatmap-grid__title')).toBeTruthy();
    expect(container.querySelector('.heatmap-grid__subtitle')).toBeTruthy();
  });

  it('renders day labels in header row', () => {
    const { container } = render(React.createElement(HeatmapGrid, { data: mockData }));
    const dayCells = container.querySelectorAll('.heatmap-grid__day');
    expect(dayCells.length).toBe(7);
  });

  it('renders data rows for each metric', () => {
    const { container } = render(React.createElement(HeatmapGrid, { data: mockData }));
    const rows = container.querySelectorAll('.heatmap-grid__row');
    // 1 header row + 4 data rows (recovery, hrv, sleep, readiness)
    expect(rows.length).toBe(5);
  });

  it('renders row labels', () => {
    const { container } = render(React.createElement(HeatmapGrid, { data: mockData }));
    const labels = container.querySelectorAll('.heatmap-grid__label');
    expect(labels.length).toBe(5); // 1 empty header + 4 row labels
  });

  it('renders cells with background colors', () => {
    const { container } = render(React.createElement(HeatmapGrid, { data: mockData }));
    const cells = container.querySelectorAll('.heatmap-grid__cell');
    // 4 rows × 7 days = 28 cells
    expect(cells.length).toBe(28);
  });

  it('renders readiness dots', () => {
    const { container } = render(React.createElement(HeatmapGrid, { data: mockData }));
    const dotCells = container.querySelectorAll('.heatmap-grid__cell--dot');
    expect(dotCells.length).toBe(7); // 1 per day
  });

  it('shows empty state when no data', () => {
    const { container } = render(React.createElement(HeatmapGrid, { data: [] }));
    expect(container.querySelector('.heatmap-grid')).toBeTruthy();
    expect(container.querySelector('.text-muted')).toBeTruthy();
  });

  it('shows empty state when data is null', () => {
    const { container } = render(React.createElement(HeatmapGrid, { data: null as any }));
    expect(container.querySelector('.heatmap-grid')).toBeTruthy();
  });

  it('handles data with missing fields', () => {
    const partialData = [
      { date: '2026-05-20', recoveryScore: 62 },
      { date: '2026-05-21', hrv: 52 },
    ];
    const { container } = render(React.createElement(HeatmapGrid, { data: partialData }));
    expect(container.querySelector('.heatmap-grid')).toBeTruthy();
  });

  it('handles data with zero values', () => {
    const zeroData = [
      { date: '2026-05-20', recoveryScore: 0, hrv: 0, sleepHours: 0, readiness: 'green' },
      { date: '2026-05-21', recoveryScore: 0, hrv: 0, sleepHours: 0, readiness: 'yellow' },
    ];
    const { container } = render(React.createElement(HeatmapGrid, { data: zeroData }));
    const cells = container.querySelectorAll('.heatmap-grid__cell');
    expect(cells.length).toBe(6); // 2 rows × 3 days (recovery, hrv, sleep)
  });

  it('limits to last 7 days', () => {
    const longData = Array.from({ length: 14 }, (_, i) => ({
      date: `2026-05-${String(10 + i).padStart(2, '0')}`,
      recoveryScore: 50 + i,
      hrv: 40 + i,
      sleepHours: 6 + (i % 3),
      readiness: 'green' as const,
    }));
    const { container } = render(React.createElement(HeatmapGrid, { data: longData }));
    const dayCells = container.querySelectorAll('.heatmap-grid__day');
    expect(dayCells.length).toBe(7);
  });

  it('applies title attribute to cells with values', () => {
    const { container } = render(React.createElement(HeatmapGrid, { data: mockData }));
    const cells = container.querySelectorAll('.heatmap-grid__cell[title]');
    expect(cells.length).toBeGreaterThan(0);
  });
});
