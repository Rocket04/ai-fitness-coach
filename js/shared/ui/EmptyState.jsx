import React from 'react';
import { Inbox } from 'lucide-react';
import styles from './EmptyState.module.css';

/**
 * Reusable empty-state placeholder with icon, title and optional action button.
 * @param {{ icon?: string, title: string, subtitle?: string, action?: { label: string, onClick: () => void } }} props
 */
export default function EmptyState({ icon = React.createElement(Inbox, { size: 20 }), title, subtitle, action }) {
  return React.createElement(
    'div',
    { className: styles['empty-state'] },
    React.createElement('div', { className: styles['empty-state__icon'] }, icon),
    React.createElement('div', { className: styles['empty-state__title'] }, title),
    subtitle && React.createElement('div', { className: styles['empty-state__subtitle'] }, subtitle),
    action && React.createElement(
      'button',
      { className: 'btn btn-sm mt-sm', onClick: action.onClick },
      action.label
    )
  );
}
