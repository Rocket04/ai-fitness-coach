import React from 'react';
import * as Dialog from '@radix-ui/react-dialog';

/**
 * Модальное окно на базе Radix Dialog.
 * @param {{isOpen: boolean, title: string, onClose: () => void, children: React.ReactNode}} props
 * @returns {JSX.Element|null}
 */
export default function Modal({ isOpen, onClose, title, children }) {
  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <Dialog.Portal>
        <Dialog.Overlay className="modal-overlay" />
        <Dialog.Content
          className="modal"
          aria-describedby={undefined}
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <Dialog.Close className="modal-close" aria-label="Закрыть">✕</Dialog.Close>
          {title && <Dialog.Title className="modal-title">{title}</Dialog.Title>}
          <div className="modal-content">{children}</div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
