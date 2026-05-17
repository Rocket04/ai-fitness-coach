import React from 'react';

/**
 * Модальное окно.
 * @param {{open: boolean, title: string, onClose: () => void, children: React.ReactNode}} props
 * @returns {JSX.Element|null}
 */
export default function Modal({ open, title, onClose, children }) {
  if (!open) return null;

  return React.createElement(
    React.Fragment,
    null,
    React.createElement(
      'div',
      { className: 'modal-overlay', onClick: onClose },
      React.createElement(
        'div',
        { className: 'modal', onClick: e => e.stopPropagation() },
        React.createElement('h2', { className: 'modal-title' }, title),
        React.createElement(
          'button',
          { className: 'modal-close', onClick: onClose },
          '×'
        ),
        React.createElement('div', { className: 'modal-content' }, children)
      )
    )
  );
}
