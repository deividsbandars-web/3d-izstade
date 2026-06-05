export type SalesDemoMode = 'off' | 'sales';
export type SalesDemoStep = 'none' | 'landmark' | 'premium' | 'standard' | 'arena' | 'homes';

export type SalesDemoSearchInput =
  | URLSearchParams
  | string
  | {
      search?: string;
    }
  | null
  | undefined;

export type SalesDemoSummary = {
  boothProductPreviewEnabled: boolean;
  demoArenaPreviewEnabled: boolean;
  enabled: boolean;
  mode: SalesDemoMode;
  step: SalesDemoStep;
};

type SalesDemoSummaryArgs = {
  boothProductPreviewEnabled?: boolean;
  demoArenaPreviewEnabled?: boolean;
  input?: SalesDemoSearchInput;
};

function readSearchInput(input?: SalesDemoSearchInput): string {
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

export function getSalesDemoMode(input?: SalesDemoSearchInput): SalesDemoMode {
  const search = readSearchInput(input);
  const params = new URLSearchParams(search);

  if (params.get('salesDemo') === '1') {
    return 'sales';
  }

  if (params.get('demo') === 'sales') {
    return 'sales';
  }

  return 'off';
}

export function isSalesDemoEnabled(input?: SalesDemoSearchInput): boolean {
  return getSalesDemoMode(input) === 'sales';
}

export function getSalesDemoStep(input?: SalesDemoSearchInput): SalesDemoStep {
  if (!isSalesDemoEnabled(input)) {
    return 'none';
  }

  const search = readSearchInput(input);
  const params = new URLSearchParams(search);
  const requestedStep = params.get('salesDemoStep')?.trim().toLowerCase();

  if (
    requestedStep === 'landmark'
    || requestedStep === 'premium'
    || requestedStep === 'standard'
    || requestedStep === 'arena'
    || requestedStep === 'homes'
  ) {
    return requestedStep;
  }

  return 'none';
}

export function getSalesDemoSummary(args: SalesDemoSummaryArgs = {}): SalesDemoSummary {
  const enabled = isSalesDemoEnabled(args.input);

  return {
    boothProductPreviewEnabled: args.boothProductPreviewEnabled ?? enabled,
    demoArenaPreviewEnabled: args.demoArenaPreviewEnabled ?? enabled,
    enabled,
    mode: enabled ? 'sales' : 'off',
    step: getSalesDemoStep(args.input),
  };
}
