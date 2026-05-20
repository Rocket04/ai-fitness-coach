// js/ui/components/Tooltip.jsx
// Reusable tooltip wrapper with i18n support
// Wraps HelpIcon with centralized tooltip content from config

import React from 'react';
import HelpIcon from './HelpIcon.jsx';
import { getTooltip } from '../../config/tooltips.js';

/**
 * Tooltip component that uses centralized tooltip registry
 * @param {{tooltipKey: string, t: Function, children?: React.ReactNode}} props
 */
export default function Tooltip({ tooltipKey, t, children }) {
  const tooltip = getTooltip(tooltipKey);
  
  if (!tooltip) {
    console.warn(`Tooltip not found: ${tooltipKey}`);
    return children || null;
  }
  
  // Get translated title and description
  const title = t ? t(tooltip.i18nTitle) : tooltip.term;
  const description = t ? t(tooltip.i18nDescription) : '';
  
  return React.createElement('span', { 
    className: 'tooltip-wrapper',
    style: { display: 'inline-flex', alignItems: 'center', gap: '4px' }
  },
    children,
    React.createElement(HelpIcon, {
      term: title,
      definition: description,
    })
  );
}

/**
 * Inline tooltip - just the icon without wrapper
 * @param {{tooltipKey: string, t: Function}} props
 */
export function InlineTooltip({ tooltipKey, t }) {
  const tooltip = getTooltip(tooltipKey);
  
  if (!tooltip) {
    console.warn(`Tooltip not found: ${tooltipKey}`);
    return null;
  }
  
  const title = t ? t(tooltip.i18nTitle) : tooltip.term;
  const description = t ? t(tooltip.i18nDescription) : '';
  
  return React.createElement(HelpIcon, {
    term: title,
    definition: description,
  });
}
