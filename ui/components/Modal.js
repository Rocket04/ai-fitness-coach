import React from 'react';
import * as Dialog from '@radix-ui/react-dialog';

/**
 * Модальное окно на базе Radix Dialog.
 * @param {{open: boolean, title: string, onClose: () => void, children: React.ReactNode}} props
 * @returns {JSX.Element|null}
 */
export default function Modal({ open, title, onClose, children }) {
  return React.createElement(
    Dialog.Root,
    { open, onOpenChange: (isOpen) => { if (!isOpen) onClose(); } },
    React.createElement(
      Dialog.Portal,
      null,
      React.createElement(Dialog.Overlay, { className: 'modal-overlay' }),
      React.createElement(
        Dialog.Content,
        { className: 'modal', onOpenAutoFocus: (e) => e.preventDefault() },
        React.createElement(
          Dialog.Close,
          { className: 'modal-close', 'aria-label': 'Закрыть' },
          '\u2715'
        ),
        title && React.createElement(Dialog.Title, { className: 'modal-title' }, title),
        React.createElement('div', { className: 'modal-content' }, children)
      )
    )
  );
}
