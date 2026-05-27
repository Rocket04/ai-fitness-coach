// js/tests/components/MiniSparkline.test.tsx
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';
import MiniSparkline from '../../ui/components/MiniSparkline.jsx';

describe('MiniSparkline', () => {
  it('renders sparkline for valid data array', () => {
    const { container } = render(React.createElement(MiniSparkline, {
      data: [10, 20, 30, 25, 40],
    }));
    expect(container.firstChild).toBeInTheDocument();
  });

  it('returns null for empty data', () => {
    const { container } = render(React.createElement(MiniSparkline, { data: [] }));
    expect(container.firstChild).toBeNull();
  });

  it('returns null for single, null, or undefined data', () => {
    const { container: c1 } = render(React.createElement(MiniSparkline, { data: [42] }));
    expect(c1.firstChild).toBeNull();

    const { container: c2 } = render(React.createElement(MiniSparkline, { data: null as any }));
    expect(c2.firstChild).toBeNull();

    const { container: c3 } = render(React.createElement(MiniSparkline, { data: undefined as any }));
    expect(c3.firstChild).toBeNull();
  });

  it('filters out non-numeric values and still renders', () => {
    const { container } = render(React.createElement(MiniSparkline, {
      data: [10, NaN, 20, null as any, 30],
    }));
    expect(container.firstChild).toBeInTheDocument();
  });
});
