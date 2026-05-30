// js/shared/ui/OnlineStatus.jsx
// Compact online/offline indicator pill for the header

import React from 'react';
import { Wifi, WifiOff } from 'lucide-react';
import useOnlineStatus from '../hooks/useOnlineStatus.js';

export default function OnlineStatus() {
  const isOnline = useOnlineStatus();

  return React.createElement(
    'div',
    {
      className: `online-status ${isOnline ? 'online-status--online' : 'online-status--offline'}`,
      role: 'status',
      'aria-live': 'polite',
      style: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding: '2px 8px',
        borderRadius: '100px',
        fontSize: 'var(--font-size-caption)',
        fontWeight: 500,
        backgroundColor: isOnline ? 'rgba(74, 222, 128, 0.12)' : 'rgba(248, 113, 113, 0.12)',
        color: isOnline ? 'var(--green)' : 'var(--red)',
        border: `1px solid ${isOnline ? 'rgba(74, 222, 128, 0.25)' : 'rgba(248, 113, 113, 0.25)'}`,
        transition: 'all var(--transition-normal)',
        lineHeight: 1.2,
        whiteSpace: 'nowrap',
      },
    },
    React.createElement(isOnline ? Wifi : WifiOff, { size: 12 }),
    isOnline ? 'Онлайн' : 'Оффлайн'
  );
}
