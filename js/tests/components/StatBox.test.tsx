import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import StatBox from '../../ui/components/StatBox.jsx';

describe('StatBox', () => {
  it('renders value and label', () => {
    render(<StatBox value={42} label="Recovery" />);
    expect(screen.getByText('42')).toBeInTheDocument();
    expect(screen.getByText('Recovery')).toBeInTheDocument();
  });

  it('renders up, down, and flat trend arrows', () => {
    const { rerender } = render(<StatBox value={80} label="Score" trend="up" />);
    expect(screen.getByText('↑')).toBeInTheDocument();

    rerender(<StatBox value={60} label="Score" trend="down" />);
    expect(screen.getByText('↓')).toBeInTheDocument();

    rerender(<StatBox value={70} label="Score" trend="flat" />);
    expect(screen.getByText('→')).toBeInTheDocument();
  });

  it('renders no trend arrow when trend is absent', () => {
    render(<StatBox value={70} label="Score" />);
    expect(screen.queryByText('↑')).not.toBeInTheDocument();
    expect(screen.queryByText('↓')).not.toBeInTheDocument();
    expect(screen.queryByText('→')).not.toBeInTheDocument();
  });
});
