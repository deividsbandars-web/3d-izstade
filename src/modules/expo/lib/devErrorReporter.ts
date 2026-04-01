type ExpoDevErrorEntry = {
  context?: Record<string, unknown>;
  message: string;
  source: string;
  timestamp: string;
};

declare global {
  interface Window {
    __WARPALA_EXPO_DEV_ERRORS__?: ExpoDevErrorEntry[];
  }
}

function toErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return `${error.name}: ${error.message}`;
  }

  if (typeof error === 'string') {
    return error;
  }

  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
}

export function reportExpoDevError(
  source: string,
  error: unknown,
  context?: Record<string, unknown>
) {
  const entry: ExpoDevErrorEntry = {
    context,
    message: toErrorMessage(error),
    source,
    timestamp: new Date().toISOString(),
  };

  if (typeof window !== 'undefined') {
    const existing = window.__WARPALA_EXPO_DEV_ERRORS__ ?? [];
    window.__WARPALA_EXPO_DEV_ERRORS__ = [...existing.slice(-24), entry];
  }

  console.error(`[ExpoDevError] ${source}`, error, context ?? {});
}
