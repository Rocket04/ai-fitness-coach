// js/hooks/useServiceWorkerUpdate.ts
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

/**
 * Hook that monitors service worker updates.
 * Works with the custom sw.js that calls self.skipWaiting() + clients.claim().
 *
 * Usage:
 *   const { updateAvailable, activateUpdate, dismissUpdate } = useServiceWorkerUpdate();
 */
export function useServiceWorkerUpdate(): SwUpdateState {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    let waitingSW: ServiceWorker | null = null;

    // Check for updates on the current registration
    const checkForUpdates = (reg: ServiceWorkerRegistration) => {
      // If there's already a waiting worker, update is available
      if (reg.waiting) {
        waitingSW = reg.waiting;
        setRegistration(reg);
        setUpdateAvailable(true);
        return;
      }

      // Listen for new updates
      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing;
        if (!newWorker) return;

        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // New SW is installed but waiting for old tabs to close
            waitingSW = newWorker;
            setRegistration(reg);
            setUpdateAvailable(true);
          }
        });
      });
    };

    // Get existing registration
    navigator.serviceWorker.getRegistration().then((reg) => {
      if (reg) {
        checkForUpdates(reg);

        // Also listen for controllerchange (when new SW activates)
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          // New controller took over — page will reload or we can show "updated" toast
          setUpdateAvailable(false);
        });
      }
    });

    // Periodically check for updates (every 30s while tab is active)
    const interval = setInterval(() => {
      navigator.serviceWorker.getRegistration().then((reg) => {
        if (reg && !waitingSW) {
          reg.update().catch(() => {
            // Silently fail — network might be down
          });
        }
      });
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const activateUpdate = useCallback(() => {
    if (!registration?.waiting) return;

    // Tell the waiting SW to skip waiting and become active
    registration.waiting.addEventListener('statechange', (e: Event) => {
      const sw = e.target as ServiceWorker;
      if (sw.state === 'activated') {
        // New SW is active — reload to use the new version
        window.location.reload();
      }
    });

    registration.waiting.postMessage({ type: 'SKIP_WAITING' });
  }, [registration]);

  const dismissUpdate = useCallback(() => {
    setUpdateAvailable(false);
    // Will re-appear if user re-opens tab or when check finds the waiting SW again
  }, []);

  return { updateAvailable, registration, activateUpdate, dismissUpdate };
}

export default useServiceWorkerUpdate;
