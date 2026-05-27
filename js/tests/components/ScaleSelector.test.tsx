import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ScaleSelector from '../../ui/components/ScaleSelector.jsx';

const LABELS = { 1: 'Нет', 2: 'Слабая', 3: 'Умеренная', 4: 'Сильная', 5: 'Очень сильная' };

describe('ScaleSelector', () => {
  it('renders correct number of buttons', () => {
    const { rerender } = render(<ScaleSelector value={0} onChange={() => {}} labels={LABELS} />);
    expect(screen.getAllByRole('button')).toHaveLength(5);

    rerender(<ScaleSelector value={0} onChange={() => {}} labels={LABELS} max={3} />);
    expect(screen.getAllByRole('button')).toHaveLength(3);
  });

  it('reflects active value via aria-pressed', () => {
    render(<ScaleSelector value={3} onChange={() => {}} labels={LABELS} />);
    const buttons = screen.getAllByRole('button');
    expect(buttons[2]).toHaveAttribute('aria-pressed', 'true');
    expect(buttons[0]).toHaveAttribute('aria-pressed', 'false');
  });

  it('calls onChange with correct value on click', () => {
    const handleChange = vi.fn();
    render(<ScaleSelector value={0} onChange={handleChange} labels={LABELS} />);
    fireEvent.click(screen.getAllByRole('button')[1]);
    expect(handleChange).toHaveBeenCalledWith(2);
  });

  it('shows label text for active value', () => {
    render(<ScaleSelector value={3} onChange={() => {}} labels={LABELS} />);
    expect(screen.getByText('Умеренная')).toBeInTheDocument();
  });

  it('shows dash when no value or labels are missing', () => {
    const { rerender } = render(<ScaleSelector value={0} onChange={() => {}} labels={LABELS} />);
    expect(screen.getByText('—')).toBeInTheDocument();

    rerender(<ScaleSelector value={2} onChange={() => {}} labels={undefined} />);
    expect(screen.getByText('—')).toBeInTheDocument();
  });
});
