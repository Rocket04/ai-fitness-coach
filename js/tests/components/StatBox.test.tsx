import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import StatBox from '../../ui/components/StatBox.jsx';

describe('StatBox', () => {
  it('renders value and label', () => {
    render(<StatBox value={42} label="Recovery" />);
    expect(screen.getByText('42')).toBeInTheDocument();
    expect(screen.getByText('Recovery')).toBeInTheDocument();
  });

  it('renders string value', () => {
    render(<StatBox value="✓" label="Готовность" />);
    expect(screen.getByText('✓')).toBeInTheDocument();
  });

  it('renders up trend arrow', () => {
    render(<StatBox value={80} label="Score" trend="up" />);
    expect(screen.getByText('↑')).toBeInTheDocument();
  });

  it('renders down trend arrow', () => {
    render(<StatBox value={60} label="Score" trend="down" />);
    expect(screen.getByText('↓')).toBeInTheDocument();
  });

  it('renders flat trend arrow', () => {
    render(<StatBox value={70} label="Score" trend="flat" />);
    expect(screen.getByText('→')).toBeInTheDocument();
  });

  it('renders no trend arrow when trend not provided', () => {
    const { container } = render(<StatBox value={70} label="Score" />);
    expect(container.querySelector('.stat-trend')).toBeNull();
  });

  it('applies custom color to value', () => {
    const { container } = render(<StatBox value={90} label="HRV" color="var(--blue)" />);
    const valueEl = container.querySelector('.stat-value') as HTMLElement;
    expect(valueEl.style.color).toBe('var(--blue)');
  });

  it('has correct class structure', () => {
    const { container } = render(<StatBox value={1} label="Test" />);
    expect(container.querySelector('.stat-box')).toBeInTheDocument();
    expect(container.querySelector('.stat-value')).toBeInTheDocument();
    expect(container.querySelector('.stat-label')).toBeInTheDocument();
  });
});
