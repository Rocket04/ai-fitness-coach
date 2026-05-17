import React from 'react';

/**
 * Модальное окно.
 * @param {{open: boolean, title: string, onClose: () => void, children: React.ReactNode}} props
 * @returns {JSX.Element|null}
 */
export default function Modal({ open, title, onClose, children }) {
  if (!open) return null;

  return (
    <>
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal" onClick={e => e.stopPropagation()}>
          <h2 className="modal-title">{title}</h2>
          <button className="modal-close" onClick={onClose}>
            ×
          </button>
          <div className="modal-content">{children}</div>
        </div>
      </div>
    </>
  );
}
