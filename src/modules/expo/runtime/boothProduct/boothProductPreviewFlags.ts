import { isSalesDemoEnabled } from '../salesDemo';

export type BoothProductPreviewMode = 'off' | 'preview';

type BoothProductPreviewSearchInput =
  | URLSearchParams
  | string
  | {
      search?: string;
    }
  | null
  | undefined;

function readSearchInput(input?: BoothProductPreviewSearchInput): string {
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

export function getBoothProductPreviewMode(input?: BoothProductPreviewSearchInput): BoothProductPreviewMode {
  const search = readSearchInput(input);
  const params = new URLSearchParams(search);

  if (isSalesDemoEnabled(input)) {
    return 'preview';
  }

  if (params.get('boothProductPreview') === '1') {
    return 'preview';
  }

  if (params.get('boothProduct') === 'preview') {
    return 'preview';
  }

  return 'off';
}

export function isBoothProductPreviewEnabled(input?: BoothProductPreviewSearchInput): boolean {
  return getBoothProductPreviewMode(input) === 'preview';
}
