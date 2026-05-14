const OPERATOR_FRESH_PARAM = 'operatorFresh';
const OPERATOR_FRESH_DONE_PARAM = 'operatorFreshDone';

export function maybeRunExpoOperatorFreshCacheReset(operatorEnabled: boolean, buildStamp: string) {
  if (!operatorEnabled || typeof window === 'undefined') {
    return;
  }

  const url = new URL(window.location.href);
  if (url.searchParams.get(OPERATOR_FRESH_PARAM) !== '1') {
    return;
  }

  const resetId = encodeURIComponent(buildStamp);
  if (url.searchParams.get(OPERATOR_FRESH_DONE_PARAM) === resetId) {
    return;
  }

  Object.assign(window, {
    __WARPALA_EXPO_CACHE_RESET__: {
      buildStamp,
      startedAt: new Date().toISOString(),
    },
  });

  void (async () => {
    try {
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map((registration) => registration.unregister()));
      }

      if ('caches' in window) {
        const cacheNames = await window.caches.keys();
        await Promise.all(cacheNames.map((cacheName) => window.caches.delete(cacheName)));
      }
    } finally {
      url.searchParams.delete(OPERATOR_FRESH_PARAM);
      url.searchParams.set(OPERATOR_FRESH_DONE_PARAM, resetId);
      window.location.replace(url.toString());
    }
  })();
}
