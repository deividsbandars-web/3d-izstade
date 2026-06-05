import { isHomeUploadPreviewEnabled } from './homeUploadPreviewFlags';

export type HomeDemoMode = 'off' | 'homes';

export type HomeDemoSearchInput =
  | URLSearchParams
  | string
  | {
      search?: string;
    }
  | null
  | undefined;

export type HomeDemoSummary = {
  enabled: boolean;
  mode: HomeDemoMode;
  hasBackend: false;
  hasEstimatePreview: true;
  hasForms: true;
  hasLocalUploadPreview: boolean;
  hasModelUpload: boolean;
  hasPricing: true;
  hasProductionUpload: false;
  hasProjectSummary: true;
  hasQuotePreview: true;
};

function readSearchInput(input?: HomeDemoSearchInput): string {
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

export function getHomeDemoMode(input?: HomeDemoSearchInput): HomeDemoMode {
  const params = new URLSearchParams(readSearchInput(input));

  if (params.get('homeDemo') === '1') {
    return 'homes';
  }

  if (params.get('demo') === 'homes') {
    return 'homes';
  }

  if (
    (params.get('salesDemo') === '1' || params.get('demo') === 'sales')
    && params.get('salesDemoStep')?.trim().toLowerCase() === 'homes'
  ) {
    return 'homes';
  }

  return 'off';
}

export function isHomeDemoEnabled(input?: HomeDemoSearchInput): boolean {
  return getHomeDemoMode(input) === 'homes';
}

export function getHomeDemoSummary(input?: HomeDemoSearchInput): HomeDemoSummary {
  const enabled = isHomeDemoEnabled(input);
  const hasLocalUploadPreview = isHomeUploadPreviewEnabled(input);

  return {
    enabled,
    mode: enabled ? 'homes' : 'off',
    hasBackend: false,
    hasEstimatePreview: true,
    hasForms: true,
    hasLocalUploadPreview,
    hasModelUpload: hasLocalUploadPreview,
    hasPricing: true,
    hasProductionUpload: false,
    hasProjectSummary: true,
    hasQuotePreview: true,
  };
}
