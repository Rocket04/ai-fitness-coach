import React from 'react';
import { Inbox } from 'lucide-react';

/**
 * Reusable empty-state placeholder with icon, title and optional action button.
 * @param {{ icon?: string, title: string, subtitle?: string, action?: { label: string, onClick: () => void } }} props
 */
export default function EmptyState({ icon = React.createElement(Inbox, { size: 20 }), title, subtitle, action }) {
  return React.createElement(
    'div',
    { className: 'empty-state' },
    React.createElement('div', { className: 'empty-state__icon' }, icon),
    React.createElement('div', { className: 'empty-state__title' }, title),
    subtitle && React.createElement('div', { className: 'empty-state__subtitle' }, subtitle),
    action && React.createElement(
      'button',
      { className: 'btn btn-sm mt-sm', onClick: action.onClick },
      action.label
    )
  );
}
