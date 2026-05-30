window.addEventListener('error', function(event) {
  console.error('[Global Error]', event.error || event.message);
});
window.addEventListener('unhandledrejection', function(event) {
  console.error('[Unhandled Promise Rejection]', event.reason);
});
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js').then(reg => {
    console.log('Service Worker registered:', reg.scope);

    setInterval(() => {
      reg.update().catch(() => {});
    }, 60000);

    reg.addEventListener('updatefound', () => {
      const newWorker = reg.installing;
      if (!newWorker) return;
      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          console.log('[SW] New version available');
        }
      });
    });
  }).catch(err => {
    console.error('Service Worker registration error:', err);
  });

  navigator.serviceWorker.ready.then(reg => {
    if ('periodicSync' in reg) {
      reg.periodicSync.register('daily-checkin-reminder', {
        minInterval: 24 * 60 * 60 * 1000,
      }).then(() => {
        console.log('[SW] Periodic background sync registered');
      }).catch(() => {});
    }
  });

  navigator.serviceWorker.addEventListener('controllerchange', () => {
    console.log('[SW] New Service Worker activated');
  });
}