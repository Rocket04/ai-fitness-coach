import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ScaleSelector from '../../ui/components/ScaleSelector.jsx';

const LABELS = { 1: 'Нет', 2: 'Слабая', 3: 'Умеренная', 4: 'Сильная', 5: 'Очень сильная' };

describe('ScaleSelector', () => {
  it('renders 5 buttons by default', () => {
    render(<ScaleSelector value={0} onChange={() => {}} labels={LABELS} />);
    expect(screen.getAllByRole('button')).toHaveLength(5);
  });

  it('renders custom max count', () => {
    render(<ScaleSelector value={0} onChange={() => {}} max={3} labels={LABELS} />);
    expect(screen.getAllByRole('button')).toHaveLength(3);
  });

  it('marks active button', () => {
    render(<ScaleSelector value={3} onChange={() => {}} labels={LABELS} />);
    const buttons = screen.getAllByRole('button');
    expect(buttons[2].className).toContain('active');
    expect(buttons[0].className).not.toContain('active');
  });

  it('calls onChange with correct value on click', () => {
    const handleChange = vi.fn();
    render(<ScaleSelector value={0} onChange={handleChange} labels={LABELS} />);
    fireEvent.click(screen.getAllByRole('button')[1]); // button "2"
    expect(handleChange).toHaveBeenCalledWith(2);
  });

  it('shows label text for active value', () => {
    render(<ScaleSelector value={3} onChange={() => {}} labels={LABELS} />);
    expect(screen.getByText('Умеренная')).toBeInTheDocument();
  });

  it('shows dash when value is 0', () => {
    render(<ScaleSelector value={0} onChange={() => {}} labels={LABELS} />);
    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('shows dash when no labels provided', () => {
    render(<ScaleSelector value={2} onChange={() => {}} labels={undefined} />);
    expect(screen.getByText('—')).toBeInTheDocument();
  });
});
