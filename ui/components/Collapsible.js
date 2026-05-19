import React from 'react';
import * as CollapsiblePrimitive from '@radix-ui/react-collapsible';

/**
 * Сворачиваемая секция на базе Radix Collapsible.
 * @param {{title: string, defaultOpen?: boolean, children: React.ReactNode}} props
 * @returns {JSX.Element}
 */
export default function Collapsible({ title, defaultOpen = false, children }) {
  return React.createElement(
    CollapsiblePrimitive.Root,
    { className: 'collapsible', defaultOpen },
    React.createElement(
      CollapsiblePrimitive.Trigger,
      { className: 'collapsible-header' },
      title
    ),
    React.createElement(
      CollapsiblePrimitive.Content,
      { className: 'collapsible-content' },
      children
    )
  );
}
