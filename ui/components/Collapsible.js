import React, { useState } from 'react';

/**
 * Сворачиваемая секция.
 * @param {{title: string, defaultOpen?: boolean, children: React.ReactNode}} props
 * @returns {JSX.Element}
 */
export default function Collapsible({ title, defaultOpen = false, children }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return React.createElement(
    'div',
    { className: 'collapsible' },
    React.createElement(
      'div',
      { className: 'collapsible-header', onClick: () => setIsOpen(!isOpen) },
      title
    ),
    isOpen && React.createElement('div', { className: 'collapsible-content' }, children)
  );
}
