import React from 'react';
import { Dialog } from '@base-ui/react/dialog';

/**
 * Модальное окно на базе Radix Dialog.
 * @param {{isOpen: boolean, title: string, onClose: () => void, children: React.ReactNode}} props
 * @returns {JSX.Element|null}
 */
export default function Modal({ isOpen, onClose, title, children }) {
  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <Dialog.Portal>
        <Dialog.Backdrop className="modal-overlay" />
        <Dialog.Popup
          className="modal"
          aria-describedby={undefined}
        >
          <Dialog.Close className="modal-close" aria-label="Закрыть">✕</Dialog.Close>
          {title && <Dialog.Title className="modal-title">{title}</Dialog.Title>}
          <div className="modal-content">{children}</div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
