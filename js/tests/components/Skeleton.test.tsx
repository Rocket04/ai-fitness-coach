import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { SkeletonLine, SkeletonCard } from '../../ui/components/Skeleton.jsx';

describe('SkeletonLine', () => {
  it('renders with default props', () => {
    const { container } = render(<SkeletonLine />);
    const el = container.querySelector('.skeleton-line') as HTMLElement;
    expect(el).toBeInTheDocument();
    expect(el.style.width).toBe('100%');
    expect(el.style.height).toBe('1em');
  });

  it('applies custom width and height', () => {
    const { container } = render(<SkeletonLine width="60%" height="2em" />);
    const el = container.querySelector('.skeleton-line') as HTMLElement;
    expect(el.style.width).toBe('60%');
    expect(el.style.height).toBe('2em');
  });

  it('applies extra className', () => {
    const { container } = render(<SkeletonLine className="mb-sm" />);
    expect(container.querySelector('.skeleton-line.mb-sm')).toBeInTheDocument();
  });
});

describe('SkeletonCard', () => {
  it('renders correct number of rows', () => {
    const { container } = render(<SkeletonCard rows={4} />);
    expect(container.querySelectorAll('.skeleton-line')).toHaveLength(4);
  });

  it('renders 3 rows by default', () => {
    const { container } = render(<SkeletonCard />);
    expect(container.querySelectorAll('.skeleton-line')).toHaveLength(3);
  });

  it('has skeleton-card class', () => {
    const { container } = render(<SkeletonCard />);
    expect(container.querySelector('.skeleton-card')).toBeInTheDocument();
  });

  it('has card class', () => {
    const { container } = render(<SkeletonCard />);
    expect(container.querySelector('.card')).toBeInTheDocument();
  });
});
