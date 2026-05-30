// js/shared/hooks/useServiceWorkerUpdate.ts
// Detects when a new service worker is waiting and provides update controls

import { useState, useEffect, useCallback } from 'react';

export interface SwUpdateState {
  /** A new SW is waiting to activate */
  updateAvailable: boolean;
  /** The waiting registration, if any */
  registration: ServiceWorkerRegistration | null;
  /** Activate the waiting SW and reload */
  activateUpdate: () => void;
  /** Dismiss the update prompt (will appear again on next check) */
  dismissUpdate: () => void;
}

export function useServiceWorkerUpdate(): SwUpdateState {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    // Check if service worker is supported
    if (!('serviceWorker' in navigator)) return;

    const handleUpdateFound = (reg: ServiceWorkerRegistration) => {
      setRegistration(reg);
      const newWorker = reg.installing;
      if (!newWorker) return;

      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          // New SW installed and waiting
          setUpdateAvailable(true);
        }
      });
    };

    // Register or get existing registration
    const register = async () => {
      try {
        // Try to get existing registration first
        const existing = await navigator.serviceWorker.getRegistration();
        if (existing) {
          handleUpdateFound(existing);
          // Also listen for future updates
          existing.addEventListener('updatefound', () => handleUpdateFound(existing));
        }
      } catch (err) {
        console.debug('SW registration check:', err);
      }
    };

    register();

    // Listen for controller change (after update is activated)
    const handleControllerChange = () => {
      window.location.reload();
    };
    navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);

    return () => {
      navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
    };
  }, []);

  const activateUpdate = useCallback(() => {
    if (registration?.waiting) {
      // Send message to skip waiting
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
  }, [registration]);

  const dismissUpdate = useCallback(() => {
    setUpdateAvailable(false);
  }, []);

  return {
    updateAvailable,
    registration,
    activateUpdate,
    dismissUpdate,
  };
}
