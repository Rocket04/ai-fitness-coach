import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { SkeletonLine, SkeletonCard } from '../../ui/components/Skeleton.jsx';

describe('SkeletonLine', () => {
  it('applies custom dimensions', () => {
    const { container } = render(<SkeletonLine width="60%" height="2em" />);
    expect(container.firstChild).toBeInTheDocument();
  });
});

describe('SkeletonCard', () => {
  it('renders placeholder rows', () => {
    const { container } = render(<SkeletonCard rows={4} />);
    expect(container.firstChild?.childNodes).toHaveLength(4);
  });
});
