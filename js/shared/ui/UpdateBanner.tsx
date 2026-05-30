// js/ui/components/UpdateBanner.jsx
// Banner that appears when a new service worker version is available

import React from 'react';
import { RefreshCw, X, Download } from 'lucide-react';

interface UpdateBannerProps {
  onActivate: () => void;
  onDismiss: () => void;
}

export default function UpdateBanner({ onActivate, onDismiss }: UpdateBannerProps) {
  return React.createElement(
    'div',
    {
      className: 'update-banner',
      role: 'alert',
      'aria-live': 'polite',
      style: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 3000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 'var(--spacing-sm)',
        padding: 'var(--spacing-sm) var(--spacing-md)',
        background: 'linear-gradient(135deg, var(--accent), #3a6130)',
        color: '#fff',
        fontSize: 'var(--font-size-caption)',
        fontWeight: 500,
        boxShadow: 'var(--shadow-md)',
        animation: 'slideDown 0.3s ease-out',
      },
    },
    React.createElement(
      'span',
      { style: { display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)', flex: 1 } },
      React.createElement(Download, { size: 14, style: { flexShrink: 0 } }),
      'Доступна новая версия приложения'
    ),
    React.createElement(
      'div',
      { style: { display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)', flexShrink: 0 } },
      React.createElement(
        'button',
        {
          onClick: onActivate,
          style: {
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            padding: '4px 10px',
            backgroundColor: 'rgba(255,255,255,0.2)',
            color: '#fff',
            border: '1px solid rgba(255,255,255,0.3)',
            borderRadius: '100px',
            fontSize: 'var(--font-size-caption)',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'background var(--transition-fast)',
          },
          onMouseEnter: (e: React.MouseEvent<HTMLButtonElement>) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(255,255,255,0.3)'; },
          onMouseLeave: (e: React.MouseEvent<HTMLButtonElement>) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(255,255,255,0.2)'; },
        },
        React.createElement(RefreshCw, { size: 12 }),
        'Обновить'
      ),
      React.createElement(
        'button',
        {
          onClick: onDismiss,
          'aria-label': 'Закрыть',
          style: {
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '28px',
            height: '28px',
            backgroundColor: 'transparent',
            color: '#fff',
            border: 'none',
            borderRadius: '50%',
            cursor: 'pointer',
            opacity: 0.7,
            transition: 'opacity var(--transition-fast)',
          },
          onMouseEnter: (e: React.MouseEvent<HTMLButtonElement>) => { (e.currentTarget as HTMLButtonElement).style.opacity = '1'; },
          onMouseLeave: (e: React.MouseEvent<HTMLButtonElement>) => { (e.currentTarget as HTMLButtonElement).style.opacity = '0.7'; },
        },
        React.createElement(X, { size: 14 })
      )
    )
  );
}
