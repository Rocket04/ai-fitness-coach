// js/ui/components/Modal.jsx
// Modal dialog built on Radix Dialog with proper accessibility

import React, { useEffect, useRef, useCallback } from 'react';
import { X } from 'lucide-react';
import { Dialog } from '@base-ui/react/dialog';

/**
 * Focus trap: keeps Tab/Shift+Tab within the modal
 */
function useFocusTrap(active) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!active) return;

    const container = containerRef.current;
    if (!container) return;

    // Focus the first focusable element when modal opens
    const focusable = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (focusable.length > 0) {
      // Focus the close button or first element
      const closeBtn = container.querySelector('.modal-close');
      if (closeBtn) {
        closeBtn.focus();
      } else {
        focusable[0].focus();
      }
    }

    const handleKeyDown = (e) => {
      if (e.key !== 'Tab') return;

      const focusableElements = container.querySelectorAll(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      const first = focusableElements[0];
      const last = focusableElements[focusableElements.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    container.addEventListener('keydown', handleKeyDown);
    return () => container.removeEventListener('keydown', handleKeyDown);
  }, [active]);

  return containerRef;
}

/**
 * Modal dialog with focus trap, ESC to close, and proper ARIA.
 */
export default function Modal({ isOpen, onClose, title, children, 'aria-label': ariaLabel = undefined }) {
  const containerRef = useFocusTrap(isOpen);

  const handleOpenChange = useCallback((open) => {
    if (!open) onClose();
  }, [onClose]);

  return (
    <Dialog.Root open={isOpen} onOpenChange={handleOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop
          className="modal-overlay"
          aria-hidden="true"
        />
        <Dialog.Popup
          ref={containerRef}
          className="modal"
          role="dialog"
          aria-modal="true"
          aria-label={ariaLabel || title || 'Диалоговое окно'}
          aria-describedby={undefined}
        >
          <Dialog.Close className="modal-close" aria-label="Закрыть">
            <X size={20} />
          </Dialog.Close>
          {title && <Dialog.Title className="modal-title">{title}</Dialog.Title>}
          <div className="modal-content">{children}</div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
