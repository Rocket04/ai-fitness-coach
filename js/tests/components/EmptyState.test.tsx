import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import EmptyState from '../../ui/components/EmptyState.jsx';

describe('EmptyState', () => {
  it('renders title', () => {
    render(<EmptyState title="Нет данных" />);
    expect(screen.getByText('Нет данных')).toBeInTheDocument();
  });

  it('renders default icon when none provided', () => {
    render(<EmptyState title="Test" />);
    expect(screen.getByText('📭')).toBeInTheDocument();
  });

  it('renders custom icon', () => {
    render(<EmptyState icon="📊" title="Test" />);
    expect(screen.getByText('📊')).toBeInTheDocument();
  });

  it('renders subtitle when provided', () => {
    render(<EmptyState title="Test" subtitle="Подсказка" />);
    expect(screen.getByText('Подсказка')).toBeInTheDocument();
  });

  it('does not render subtitle when omitted', () => {
    const { container } = render(<EmptyState title="Test" />);
    expect(container.querySelector('.empty-state__subtitle')).toBeNull();
  });

  it('renders action button when action prop provided', () => {
    const handleClick = vi.fn();
    render(<EmptyState title="Test" action={{ label: 'Добавить', onClick: handleClick }} />);
    const btn = screen.getByRole('button', { name: 'Добавить' });
    expect(btn).toBeInTheDocument();
    fireEvent.click(btn);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('does not render button when action omitted', () => {
    render(<EmptyState title="Test" />);
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('has correct BEM class structure', () => {
    const { container } = render(<EmptyState title="Test" subtitle="Sub" />);
    expect(container.querySelector('.empty-state')).toBeInTheDocument();
    expect(container.querySelector('.empty-state__icon')).toBeInTheDocument();
    expect(container.querySelector('.empty-state__title')).toBeInTheDocument();
    expect(container.querySelector('.empty-state__subtitle')).toBeInTheDocument();
  });
});
