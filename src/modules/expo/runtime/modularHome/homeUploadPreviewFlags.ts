export type HomeUploadPreviewMode = 'off' | 'local';

export type HomeUploadPreviewSearchInput =
  | URLSearchParams
  | string
  | {
      search?: string;
    }
  | null
  | undefined;

export type HomeUploadPreviewSummary = {
  acceptedFormats: readonly string[];
  enabled: boolean;
  hasBackend: false;
  hasStorage: false;
  localOnly: true;
  maxFileBytes: number;
  mode: HomeUploadPreviewMode;
  reason: string;
  requested: boolean;
};

export const HOME_UPLOAD_PREVIEW_ACCEPTED_FORMATS = ['.glb', '.gltf'] as const;
export const HOME_UPLOAD_PREVIEW_MAX_FILE_BYTES = 25 * 1024 * 1024;

function readSearchInput(input?: HomeUploadPreviewSearchInput): string {
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

function isLocalPreviewHost() {
  if (typeof window === 'undefined') {
    return false;
  }

  const hostname = window.location.hostname.toLowerCase();
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1';
}

export function isHomeUploadPreviewRequested(input?: HomeUploadPreviewSearchInput): boolean {
  const params = new URLSearchParams(readSearchInput(input));
  return params.get('homeUploadPreview') === '1';
}

export function isHomeUploadPreviewAvailable(): boolean {
  return import.meta.env.DEV || isLocalPreviewHost();
}

export function getHomeUploadPreviewMode(input?: HomeUploadPreviewSearchInput): HomeUploadPreviewMode {
  if (!isHomeUploadPreviewRequested(input)) {
    return 'off';
  }

  return isHomeUploadPreviewAvailable() ? 'local' : 'off';
}

export function isHomeUploadPreviewEnabled(input?: HomeUploadPreviewSearchInput): boolean {
  return getHomeUploadPreviewMode(input) === 'local';
}

export function getHomeUploadPreviewSummary(input?: HomeUploadPreviewSearchInput): HomeUploadPreviewSummary {
  const requested = isHomeUploadPreviewRequested(input);
  const available = isHomeUploadPreviewAvailable();
  const enabled = requested && available;

  return {
    acceptedFormats: HOME_UPLOAD_PREVIEW_ACCEPTED_FORMATS,
    enabled,
    hasBackend: false,
    hasStorage: false,
    localOnly: true,
    maxFileBytes: HOME_UPLOAD_PREVIEW_MAX_FILE_BYTES,
    mode: enabled ? 'local' : 'off',
    reason: !requested
      ? 'not-requested'
      : available
        ? 'local-file-preview-only'
        : 'blocked-non-local-host',
    requested,
  };
}
