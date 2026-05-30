// js/ui/components/HelpIcon.jsx
// Кликабельная иконка (?) с popover-подсказкой для терминов

import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';

/**
 * @param {{ term: string, definition: string }} props
 */
export default function HelpIcon({ term, definition }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState(null);
  const popoverRef = useRef(null);
  const buttonRef = useRef(null);

  // Закрыть при клике вне попапа
  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target)
      ) {
        setOpen(false);
        setPos(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  // Закрыть по Escape
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setOpen(false);
        setPos(null);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open]);

  const toggle = () => {
    if (open) {
      setOpen(false);
      setPos(null);
      return;
    }
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const flipDown = rect.top < 160;
    const centerX = rect.left + rect.width / 2;
    const tooltipW = 260;
    const margin = 12;
    const left = Math.max(margin + tooltipW / 2, Math.min(centerX, window.innerWidth - margin - tooltipW / 2));
    const top = flipDown ? rect.bottom + 8 : rect.top - 8;
    setPos({ top, left, flipDown });
    setOpen(true);
  };

  const tooltip = open && pos && ReactDOM.createPortal(
    React.createElement(
      'div',
      {
        ref: popoverRef,
        style: {
          position: 'fixed',
          top: pos.top,
          left: pos.left,
          transform: pos.flipDown ? 'translateX(-50%)' : 'translate(-50%, -100%)',
          backgroundColor: 'var(--surface2)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)',
          padding: 'var(--spacing-sm) var(--spacing-md)',
          minWidth: '220px',
          maxWidth: '280px',
          boxShadow: 'var(--shadow-lg)',
          zIndex: 10000,
          fontSize: 'var(--font-size-caption)',
          lineHeight: 1.5,
          color: 'var(--text2)',
        },
      },
      React.createElement(
        'div',
        { style: { fontWeight: 600, color: 'var(--text)', marginBottom: '4px' } },
        term
      ),
      definition,
      React.createElement('div', {
        style: {
          position: 'absolute',
          left: '50%',
          transform: 'translateX(-50%)',
          width: 0,
          height: 0,
          borderLeft: '6px solid transparent',
          borderRight: '6px solid transparent',
          ...(pos.flipDown
            ? { top: '-6px', borderBottom: '6px solid var(--surface2)' }
            : { bottom: '-6px', borderTop: '6px solid var(--surface2)' }),
        },
      })
    ),
    document.body
  );

  return React.createElement(
    'span',
    { style: { display: 'inline-flex', alignItems: 'center' } },
    React.createElement(
      'button',
      {
        ref: buttonRef,
        onClick: toggle,
        'aria-label': `Подробнее о термине "${term}"`,
        'aria-expanded': open,
        style: {
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: '2px 6px',
          marginLeft: '4px',
          fontSize: '0.85em',
          color: 'var(--text3)',
          borderRadius: '50%',
          minWidth: '22px',
          minHeight: '22px',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'background-color 0.2s, color 0.2s',
        },
        onMouseEnter: (e) => {
          e.currentTarget.style.backgroundColor = 'var(--surface2)';
          e.currentTarget.style.color = 'var(--text)';
        },
        onMouseLeave: (e) => {
          e.currentTarget.style.backgroundColor = 'transparent';
          e.currentTarget.style.color = 'var(--text3)';
        },
      },
      '？'
    ),
    tooltip
  );
}
