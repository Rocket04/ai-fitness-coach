// js/tests/components/HelpIcon.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import HelpIcon from '../../ui/components/HelpIcon.jsx';

// Mock ReactDOM.createPortal to render inline
vi.mock('react-dom', () => ({
  ...vi.importActual('react-dom'),
  createPortal: (node: React.ReactNode) => node,
}));

describe('HelpIcon', () => {
  it('renders help button with question mark', () => {
    render(React.createElement(HelpIcon, { term: 'Recovery Score', definition: 'Test definition' }));
    expect(screen.getByText('？')).toBeTruthy();
  });

  it('button has correct aria-label', () => {
    render(React.createElement(HelpIcon, { term: 'Recovery Score', definition: 'Test definition' }));
    const button = screen.getByRole('button');
    expect(button.getAttribute('aria-label')).toBe('Подробнее о термине "Recovery Score"');
  });

  it('button has aria-expanded false initially', () => {
    render(React.createElement(HelpIcon, { term: 'Test', definition: 'Test def' }));
    const button = screen.getByRole('button');
    expect(button.getAttribute('aria-expanded')).toBe('false');
  });

  it('toggles popover on click', () => {
    render(React.createElement(HelpIcon, { term: 'Recovery Score', definition: 'A comprehensive metric' }));
    const button = screen.getByRole('button');

    // Click to open
    fireEvent.click(button);
    expect(screen.getByText('Recovery Score')).toBeTruthy();
    expect(screen.getByText('A comprehensive metric')).toBeTruthy();
    expect(button.getAttribute('aria-expanded')).toBe('true');

    // Click to close
    fireEvent.click(button);
    expect(screen.queryByText('A comprehensive metric')).toBeNull();
  });

  it('opens on mouse click and shows definition', () => {
    render(React.createElement(HelpIcon, { term: 'APRE', definition: 'Auto-regulation by Performance' }));
    fireEvent.click(screen.getByRole('button'));

    expect(screen.getByText('APRE')).toBeTruthy();
    expect(screen.getByText('Auto-regulation by Performance')).toBeTruthy();
  });

  it('closes on Escape key', () => {
    render(React.createElement(HelpIcon, { term: 'Test', definition: 'Test definition' }));

    // Open
    fireEvent.click(screen.getByRole('button'));
    expect(screen.getByText('Test definition')).toBeTruthy();

    // Press Escape
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByText('Test definition')).toBeNull();
  });

  it('closes on click outside', () => {
    render(React.createElement(HelpIcon, { term: 'Test', definition: 'Test definition' }));

    // Open
    fireEvent.click(screen.getByRole('button'));
    expect(screen.getByText('Test definition')).toBeTruthy();

    // Click outside
    fireEvent.mouseDown(document.body);
    expect(screen.queryByText('Test definition')).toBeNull();
  });

  it('does not close when clicking inside popover', () => {
    render(React.createElement(HelpIcon, { term: 'Test', definition: 'Test definition' }));

    // Open
    fireEvent.click(screen.getByRole('button'));
    const definition = screen.getByText('Test definition');

    // Click inside popover
    fireEvent.mouseDown(definition);
    expect(screen.getByText('Test definition')).toBeTruthy();
  });

  it('has correct class structure', () => {
    const { container } = render(React.createElement(HelpIcon, { term: 'Test', definition: 'Test' }));
    const button = container.querySelector('button');
    expect(button).toBeTruthy();
  });

  it('renders with inline-flex display', () => {
    const { container } = render(React.createElement(HelpIcon, { term: 'Test', definition: 'Test' }));
    const wrapper = container.querySelector('span');
    expect(wrapper?.style.display).toBe('inline-flex');
  });

  it('button has pointer cursor', () => {
    const { container } = render(React.createElement(HelpIcon, { term: 'Test', definition: 'Test' }));
    const button = container.querySelector('button') as HTMLElement;
    expect(button.style.cursor).toBe('pointer');
  });

  it('button has minimum dimensions for touch target', () => {
    const { container } = render(React.createElement(HelpIcon, { term: 'Test', definition: 'Test' }));
    const button = container.querySelector('button') as HTMLElement;
    expect(button.style.minWidth).toBe('22px');
    expect(button.style.minHeight).toBe('22px');
  });
});
