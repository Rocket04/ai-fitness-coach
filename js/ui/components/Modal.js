import React from 'react';

export default function Modal({ isOpen, onClose, title, children }) {
  if (!isOpen) return null;

  return React.createElement(
    'div',
    { className: 'modal-overlay', onClick: onClose },
    React.createElement(
      'div',
      { className: 'modal', onClick: e => e.stopPropagation(), role: 'dialog', 'aria-modal': 'true' },
      React.createElement(
        'button',
        { className: 'modal-close', onClick: onClose, 'aria-label': 'Закрыть' },
        '\u2715'
      ),
      title && React.createElement('h2', { className: 'modal-title' }, title),
      React.createElement('div', { className: 'modal-content' }, children)
    )
  );
}
