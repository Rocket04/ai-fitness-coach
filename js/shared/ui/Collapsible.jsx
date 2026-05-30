import React from 'react';
import { Collapsible as CollapsiblePrimitive } from '@base-ui/react/collapsible';
import styles from './Collapsible.module.css';

/**
 * Сворачиваемая секция на базе Radix Collapsible.
 * Поддерживает управляемый (open + onToggle) и неуправляемый (defaultOpen) режимы.
 * @param {{open?: boolean, defaultOpen?: boolean, onToggle?: (open: boolean) => void, title?: string, summary?: string, children?: React.ReactNode, contentStyle?: React.CSSProperties}} props
 * @returns {JSX.Element}
 */
export default function Collapsible({ open, defaultOpen, onToggle, title, summary, children, contentStyle }) {
  const isControlled = open !== undefined;

  return React.createElement(
    CollapsiblePrimitive.Root,
    {
      className: styles['collapsible'],
      open: isControlled ? open : undefined,
      defaultOpen: !isControlled ? defaultOpen : undefined,
      onOpenChange: (isOpen) => { if (onToggle) onToggle(isOpen); },
    },
    title && React.createElement(
      CollapsiblePrimitive.Trigger,
      { className: styles['collapsible__header'] },
      React.createElement('span', { className: styles['collapsible__title'] }, title),
      summary && React.createElement('span', { className: styles['collapsible__summary'] }, summary),
      React.createElement('span', { className: styles['collapsible__chevron'] }, '\u25BC')
    ),
    React.createElement(
      CollapsiblePrimitive.Panel,
      { className: styles['collapsible__body'], style: contentStyle },
      children
    )
  );
}
