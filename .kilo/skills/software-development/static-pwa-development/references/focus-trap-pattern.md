# Focus Trap Pattern for Modals

## When to Use
Any modal/dialog that traps focus must implement a focus trap so Tab/Shift+Tab cycles within the modal and doesn't escape to the page behind.

## React Hook Implementation
```jsx
import { useEffect, useRef } from 'react';

function useFocusTrap(active) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!active) return;
    const container = containerRef.current;
    if (!container) return;

    // Auto-focus close button or first focusable element
    const closeBtn = container.querySelector('.modal-close');
    if (closeBtn) {
      closeBtn.focus();
    } else {
      const focusable = container.querySelectorAll(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length > 0) focusable[0].focus();
    }

    const handleKeyDown = (e) => {
      if (e.key !== 'Tab') return;
      const focusable = container.querySelectorAll(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last.focus(); }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };

    container.addEventListener('keydown', handleKeyDown);
    return () => container.removeEventListener('keydown', handleKeyDown);
  }, [active]);

  return containerRef;
}
```

## Usage with Radix Dialog
```jsx
function Modal({ isOpen, onClose, title, children }) {
  const containerRef = useFocusTrap(isOpen);

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <Dialog.Portal>
        <Dialog.Backdrop className="modal-overlay" aria-hidden="true" />
        <Dialog.Popup
          ref={containerRef}
          className="modal"
          role="dialog"
          aria-modal="true"
          aria-label={title || 'Диалоговое окно'}
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
```

## Key ARIA Attributes for Modals
- `role="dialog"` — identifies the element as a dialog
- `aria-modal="true"` — tells assistive tech the content outside is inert
- `aria-label` or `aria-labelledby` — names the dialog
- `aria-hidden="true"` on backdrop — hides decorative overlay from screen readers
- `aria-label` on close button — always provide in the user's language

## CSS for Focus Visibility
```css
/* Show focus ring only for keyboard navigation */
:focus-visible {
  outline: 2px solid var(--blue);
  outline-offset: 2px;
}
:focus:not(:focus-visible) {
  outline: none;
}
```

## Pitfalls
- Don't forget to clean up the keydown listener on unmount
- Query focusable elements inside the container, not the whole document
- Include `:not([disabled])` in selectors so disabled buttons are skipped
- Auto-focus the close button for safety (user can always ESC out)
