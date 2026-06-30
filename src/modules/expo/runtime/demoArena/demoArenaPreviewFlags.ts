import { isSalesDemoEnabled } from '../salesDemo';

export type DemoArenaPreviewMode = 'off' | 'preview';

type DemoArenaPreviewSearchInput =
  | URLSearchParams
  | string
  | {
      search?: string;
    }
  | null
  | undefined;

function readSearchInput(input?: DemoArenaPreviewSearchInput): string {
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

export function getDemoArenaPreviewMode(input?: DemoArenaPreviewSearchInput): DemoArenaPreviewMode {
  const search = readSearchInput(input);
  const params = new URLSearchParams(search);

  if (isSalesDemoEnabled(input)) {
    return 'preview';
  }

  if (params.get('demoArenaPreview') === '1') {
    return 'preview';
  }

  if (params.get('demoArena') === 'preview') {
    return 'preview';
  }

  return 'off';
}

export function isDemoArenaPreviewEnabled(input?: DemoArenaPreviewSearchInput): boolean {
  return getDemoArenaPreviewMode(input) === 'preview';
}
