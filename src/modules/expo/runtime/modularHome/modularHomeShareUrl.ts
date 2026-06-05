import type {
  ModularHomeConfiguratorState,
  ModularHomeFacadeOption,
  ModularHomeFinishLevelOption,
  ModularHomeRoofOption,
  ModularHomeTerraceOption,
} from './modularHomeConfigurator';
import {
  getDefaultHomeConfig,
  getModularHomeOptionChoices,
  getModularHomeProduct,
  getModularHomeProductForConfig,
  type ModularHomeOptionGroup,
  type ModularHomeProductId,
} from './modularHomeProducts';

export type ModularHomeShareSearchInput =
  | URLSearchParams
  | string
  | {
      search?: string;
    }
  | null
  | undefined;

export type ModularHomeShareDecodeResult = {
  config: ModularHomeConfiguratorState;
  invalidKeys: readonly string[];
  isSharedConfig: boolean;
  productId: ModularHomeProductId;
  usedFallback: boolean;
};

const FALLBACK_PRODUCT_ID = 'compact-timber-40' satisfies ModularHomeProductId;

const SHARE_PARAM_KEYS = ['homeModel', 'facade', 'roof', 'terrace', 'finish'] as const;

const PRODUCT_ALIAS_TO_ID: Record<string, ModularHomeProductId> = {
  compact: 'compact-timber-40',
  'compact-timber-40': 'compact-timber-40',
  family: 'family-timber-80',
  'family-timber-80': 'family-timber-80',
  sauna: 'sauna-cabin-25',
  'sauna-cabin-25': 'sauna-cabin-25',
};

const FACADE_ALIAS_TO_TOKEN: Record<string, ModularHomeFacadeOption> = {
  dark: 'darkThermoWood',
  darkThermoWood: 'darkThermoWood',
  light: 'lightPainted',
  lightPainted: 'lightPainted',
  natural: 'naturalTimber',
  naturalTimber: 'naturalTimber',
};

const ROOF_ALIAS_TO_TOKEN: Record<string, ModularHomeRoofOption> = {
  flat: 'flat',
  green: 'greenRoofPlaceholder',
  greenRoofPlaceholder: 'greenRoofPlaceholder',
  pitched: 'pitched',
};

const TERRACE_ALIAS_TO_TOKEN: Record<string, ModularHomeTerraceOption> = {
  extended: 'extendedTerrace',
  extendedTerrace: 'extendedTerrace',
  none: 'none',
  small: 'smallTerrace',
  smallTerrace: 'smallTerrace',
};

const FINISH_ALIAS_TO_TOKEN: Record<string, ModularHomeFinishLevelOption> = {
  premium: 'premium',
  shell: 'shell',
  standard: 'standard',
};

const FACADE_TOKEN_TO_ALIAS: Record<ModularHomeFacadeOption, string> = {
  darkThermoWood: 'dark',
  lightPainted: 'light',
  naturalTimber: 'natural',
};

const ROOF_TOKEN_TO_ALIAS: Record<ModularHomeRoofOption, string> = {
  flat: 'flat',
  greenRoofPlaceholder: 'green',
  pitched: 'pitched',
};

const TERRACE_TOKEN_TO_ALIAS: Record<ModularHomeTerraceOption, string> = {
  extendedTerrace: 'extended',
  none: 'none',
  smallTerrace: 'small',
};

const FINISH_TOKEN_TO_ALIAS: Record<ModularHomeFinishLevelOption, string> = {
  premium: 'premium',
  shell: 'shell',
  standard: 'standard',
};

function readSearchInput(input?: ModularHomeShareSearchInput): string {
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

function hasShareParams(params: URLSearchParams): boolean {
  return SHARE_PARAM_KEYS.some((key) => params.has(key));
}

function decodeProductId(rawValue: string | null): {
  invalid: boolean;
  productId: ModularHomeProductId;
} {
  if (!rawValue) {
    return { invalid: false, productId: FALLBACK_PRODUCT_ID };
  }

  const productId = PRODUCT_ALIAS_TO_ID[rawValue.trim()];

  if (!productId || !getModularHomeProduct(productId)) {
    return { invalid: true, productId: FALLBACK_PRODUCT_ID };
  }

  return { invalid: false, productId };
}

function getCompatibleToken(
  productId: ModularHomeProductId,
  group: ModularHomeOptionGroup,
  token: string,
): string | null {
  const option = getModularHomeOptionChoices(productId, group).find((item) => (
    item.visualToken === token && item.isCompatible
  ));

  return option?.visualToken ?? null;
}

function decodeOption<Token extends string>(
  params: URLSearchParams,
  paramKey: string,
  productId: ModularHomeProductId,
  group: ModularHomeOptionGroup,
  aliases: Record<string, Token>,
): {
  invalid: boolean;
  token: Token | null;
} {
  const rawValue = params.get(paramKey);

  if (!rawValue) {
    return { invalid: false, token: null };
  }

  const token = aliases[rawValue.trim()];

  if (!token) {
    return { invalid: true, token: null };
  }

  const compatibleToken = getCompatibleToken(productId, group, token);

  return compatibleToken
    ? { invalid: false, token: compatibleToken as Token }
    : { invalid: true, token: null };
}

export function decodeModularHomeConfigFromUrl(
  input?: ModularHomeShareSearchInput,
): ModularHomeShareDecodeResult {
  const params = new URLSearchParams(readSearchInput(input));
  const isSharedConfig = hasShareParams(params);
  const invalidKeys: string[] = [];
  const productResult = decodeProductId(params.get('homeModel'));
  const config = getDefaultHomeConfig(productResult.productId);

  if (productResult.invalid) {
    invalidKeys.push('homeModel');
  }

  const facade = decodeOption(params, 'facade', productResult.productId, 'facade', FACADE_ALIAS_TO_TOKEN);
  const roof = decodeOption(params, 'roof', productResult.productId, 'roof', ROOF_ALIAS_TO_TOKEN);
  const terrace = decodeOption(params, 'terrace', productResult.productId, 'terrace', TERRACE_ALIAS_TO_TOKEN);
  const finish = decodeOption(params, 'finish', productResult.productId, 'finish', FINISH_ALIAS_TO_TOKEN);

  if (facade.token) {
    config.facade = facade.token;
  } else if (facade.invalid) {
    invalidKeys.push('facade');
  }

  if (roof.token) {
    config.roof = roof.token;
  } else if (roof.invalid) {
    invalidKeys.push('roof');
  }

  if (terrace.token) {
    config.terrace = terrace.token;
  } else if (terrace.invalid) {
    invalidKeys.push('terrace');
  }

  if (finish.token) {
    config.finishLevel = finish.token;
  } else if (finish.invalid) {
    invalidKeys.push('finish');
  }

  return {
    config,
    invalidKeys,
    isSharedConfig,
    productId: productResult.productId,
    usedFallback: invalidKeys.length > 0,
  };
}

export function encodeModularHomeConfigToSearchParams(
  config: ModularHomeConfiguratorState,
): URLSearchParams {
  const product = getModularHomeProductForConfig(config) ?? getModularHomeProduct(FALLBACK_PRODUCT_ID);
  const params = new URLSearchParams();

  params.set('homeDemo', '1');
  params.set('homeModel', product?.id ?? FALLBACK_PRODUCT_ID);
  params.set('facade', FACADE_TOKEN_TO_ALIAS[config.facade]);
  params.set('roof', ROOF_TOKEN_TO_ALIAS[config.roof]);
  params.set('terrace', TERRACE_TOKEN_TO_ALIAS[config.terrace]);
  params.set('finish', FINISH_TOKEN_TO_ALIAS[config.finishLevel]);

  return params;
}

export function createModularHomeShareUrl(
  config: ModularHomeConfiguratorState,
  currentHref?: string,
): string {
  const href = currentHref
    ?? (typeof window !== 'undefined' ? window.location.href : 'http://localhost/expo-3d');
  const url = new URL(href, 'http://localhost');
  const configParams = encodeModularHomeConfigToSearchParams(config);

  url.search = '';
  url.hash = '';
  for (const [key, value] of configParams.entries()) {
    url.searchParams.set(key, value);
  }

  return url.toString();
}
