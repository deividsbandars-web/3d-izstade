export type HomeQuoteBackendMode = 'localOnly' | 'backend';

export type HomeQuoteBackendSearchInput =
  | URLSearchParams
  | string
  | {
      search?: string;
    }
  | null
  | undefined;

export type HomeQuoteBackendSummary = {
  enabled: boolean;
  mode: HomeQuoteBackendMode;
  requiresServerFeatureFlag: true;
  storageTarget: 'modular_home_quote_requests';
};

function readSearchInput(input?: HomeQuoteBackendSearchInput): string {
  if (input instanceof URLSearchParams) {
    return input.toString();
  }

  if (typeof input === 'string') {
    return input.startsWith('?') ? input.slice(1) : input;
  }

  if (input?.search) {
    return input.search.startsWith('?') ? input.search.slice(1) : input.search;
  }

  if (typeof window !== 'undefined') {
    return window.location.search.startsWith('?') ? window.location.search.slice(1) : window.location.search;
  }

  return '';
}

export function getHomeQuoteBackendMode(input?: HomeQuoteBackendSearchInput): HomeQuoteBackendMode {
  const params = new URLSearchParams(readSearchInput(input));
  return params.get('homeQuoteBackend') === '1' ? 'backend' : 'localOnly';
}

export function isHomeQuoteBackendEnabled(input?: HomeQuoteBackendSearchInput): boolean {
  return getHomeQuoteBackendMode(input) === 'backend';
}

export function getHomeQuoteBackendSummary(input?: HomeQuoteBackendSearchInput): HomeQuoteBackendSummary {
  const enabled = isHomeQuoteBackendEnabled(input);

  return {
    enabled,
    mode: enabled ? 'backend' : 'localOnly',
    requiresServerFeatureFlag: true,
    storageTarget: 'modular_home_quote_requests',
  };
}
