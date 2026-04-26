import { useEffect } from 'react';
import { reportExpoDevError } from '../../lib/devErrorReporter';

function isExpoIgnorablePointerLockError(error: unknown) {
  const message = error instanceof Error
    ? error.message
    : typeof error === 'string'
      ? error
      : '';

  return message.includes('Pointer lock cannot be acquired immediately after the user has exited the lock')
    || message.includes('Target Element removed from DOM');
}

export function useExpoRuntimeErrorBridge(enabled: boolean) {
  useEffect(() => {
    if (!enabled) {
      return;
    }

    const onError = (event: ErrorEvent) => {
      reportExpoDevError('window.error', event.error ?? event.message, {
        colno: event.colno,
        filename: event.filename,
        lineno: event.lineno,
      });
    };

    const onUnhandledRejection = (event: PromiseRejectionEvent) => {
      if (isExpoIgnorablePointerLockError(event.reason)) {
        event.preventDefault();
        return;
      }

      reportExpoDevError('window.unhandledrejection', event.reason);
    };

    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onUnhandledRejection);

    return () => {
      window.removeEventListener('error', onError);
      window.removeEventListener('unhandledrejection', onUnhandledRejection);
    };
  }, [enabled]);
}
