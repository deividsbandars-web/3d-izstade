import type {
  ModularHomeConfiguratorState,
  ModularHomeDoorPackageOption,
  ModularHomeFacadeOption,
  ModularHomeFinishLevelOption,
  ModularHomeRoofOption,
  ModularHomeTerraceOption,
  ModularHomeViewModeOption,
  ModularHomeWindowPackageOption,
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
  viewMode: ModularHomeViewModeOption;
};

const FALLBACK_PRODUCT_ID = 'compact-timber-40' satisfies ModularHomeProductId;
const FALLBACK_VIEW_MODE = 'exterior' satisfies ModularHomeViewModeOption;

const SHARE_PARAM_KEYS = ['model', 'homeModel', 'facade', 'roof', 'terrace', 'finish', 'windows', 'door', 'view'] as const;

const PRODUCT_ALIAS_TO_ID: Record<string, ModularHomeProductId> = {
  compact: 'compact-timber-40',
  c40: 'compact-timber-40',
  'compact-timber-40': 'compact-timber-40',
  family: 'family-timber-80',
  f80: 'family-timber-80',
  'family-timber-80': 'family-timber-80',
  sauna: 'sauna-cabin-25',
  s25: 'sauna-cabin-25',
  'sauna-cabin-25': 'sauna-cabin-25',
};

const PRODUCT_ID_TO_ALIAS: Record<ModularHomeProductId, string> = {
  'compact-timber-40': 'compact',
  'family-timber-80': 'family',
  'sauna-cabin-25': 'sauna',
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
  covered: 'coveredTerracePlaceholder',
  coveredTerracePlaceholder: 'coveredTerracePlaceholder',
  extended: 'extendedTerrace',
  extendedTerrace: 'extendedTerrace',
  front: 'frontDeck',
  frontDeck: 'frontDeck',
  none: 'none',
  side: 'sideTerrace',
  sideTerrace: 'sideTerrace',
  small: 'frontDeck',
  smallTerrace: 'frontDeck',
};

const FINISH_ALIAS_TO_TOKEN: Record<string, ModularHomeFinishLevelOption> = {
  premium: 'premium',
  shell: 'shell',
  standard: 'standard',
};

const WINDOW_ALIAS_TO_TOKEN: Record<string, ModularHomeWindowPackageOption> = {
  compact: 'compactPrivacy',
  compactPrivacy: 'compactPrivacy',
  corner: 'cornerGlazing',
  cornerGlazing: 'cornerGlazing',
  panoramic: 'panoramicWindows',
  panoramicWindows: 'panoramicWindows',
  privacy: 'compactPrivacy',
  standard: 'standardWindows',
  standardWindows: 'standardWindows',
};

const DOOR_ALIAS_TO_TOKEN: Record<string, ModularHomeDoorPackageOption> = {
  glazed: 'premiumGlazedEntry',
  premium: 'premiumGlazedEntry',
  premiumGlazedEntry: 'premiumGlazedEntry',
  slider: 'terraceSlider',
  standard: 'standardEntry',
  standardEntry: 'standardEntry',
  terraceSlider: 'terraceSlider',
};

const VIEW_ALIAS_TO_TOKEN: Record<string, ModularHomeViewModeOption> = {
  cutaway: 'cutaway',
  exterior: 'exterior',
  floor: 'floorplan',
  floorplan: 'floorplan',
  plan: 'floorplan',
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
  coveredTerracePlaceholder: 'covered',
  extendedTerrace: 'extended',
  frontDeck: 'front',
  none: 'none',
  sideTerrace: 'side',
};

const FINISH_TOKEN_TO_ALIAS: Record<ModularHomeFinishLevelOption, string> = {
  premium: 'premium',
  shell: 'shell',
  standard: 'standard',
};

const WINDOW_TOKEN_TO_ALIAS: Record<ModularHomeWindowPackageOption, string> = {
  compactPrivacy: 'privacy',
  cornerGlazing: 'corner',
  panoramicWindows: 'panoramic',
  standardWindows: 'standard',
};

const DOOR_TOKEN_TO_ALIAS: Record<ModularHomeDoorPackageOption, string> = {
  premiumGlazedEntry: 'glazed',
  standardEntry: 'standard',
  terraceSlider: 'slider',
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

function getAliasValue<Token extends string>(
  aliases: Record<string, Token>,
  rawValue: string,
): Token | undefined {
  const normalized = rawValue.trim();
  const direct = aliases[normalized];

  if (direct) {
    return direct;
  }

  const lower = normalized.toLowerCase();
  const match = Object.entries(aliases).find(([key]) => key.toLowerCase() === lower);

  return match?.[1];
}

function decodeProductId(rawValue: string | null): {
  invalid: boolean;
  productId: ModularHomeProductId;
} {
  if (!rawValue) {
    return { invalid: false, productId: FALLBACK_PRODUCT_ID };
  }

  const productId = getAliasValue(PRODUCT_ALIAS_TO_ID, rawValue);

  if (!productId || !getModularHomeProduct(productId)) {
    return { invalid: true, productId: FALLBACK_PRODUCT_ID };
  }

  return { invalid: false, productId };
}

function decodeViewMode(rawValue: string | null): {
  invalid: boolean;
  viewMode: ModularHomeViewModeOption;
} {
  if (!rawValue) {
    return { invalid: false, viewMode: FALLBACK_VIEW_MODE };
  }

  const viewMode = getAliasValue(VIEW_ALIAS_TO_TOKEN, rawValue);

  return viewMode
    ? { invalid: false, viewMode }
    : { invalid: true, viewMode: FALLBACK_VIEW_MODE };
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

  const token = getAliasValue(aliases, rawValue);

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
  const productParamKey = params.has('model') ? 'model' : 'homeModel';
  const productResult = decodeProductId(params.get(productParamKey));
  const viewMode = decodeViewMode(params.get('view'));
  const config = getDefaultHomeConfig(productResult.productId);

  if (productResult.invalid) {
    invalidKeys.push(productParamKey);
  }

  if (viewMode.invalid) {
    invalidKeys.push('view');
  }

  const facade = decodeOption(params, 'facade', productResult.productId, 'facade', FACADE_ALIAS_TO_TOKEN);
  const roof = decodeOption(params, 'roof', productResult.productId, 'roof', ROOF_ALIAS_TO_TOKEN);
  const terrace = decodeOption(params, 'terrace', productResult.productId, 'terrace', TERRACE_ALIAS_TO_TOKEN);
  const finish = decodeOption(params, 'finish', productResult.productId, 'finish', FINISH_ALIAS_TO_TOKEN);
  const windowPackage = decodeOption(params, 'windows', productResult.productId, 'windowPackage', WINDOW_ALIAS_TO_TOKEN);
  const doorPackage = decodeOption(params, 'door', productResult.productId, 'doorPackage', DOOR_ALIAS_TO_TOKEN);

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

  if (windowPackage.token) {
    config.windowPackage = windowPackage.token;
  } else if (windowPackage.invalid) {
    invalidKeys.push('windows');
  }

  if (doorPackage.token) {
    config.doorPackage = doorPackage.token;
  } else if (doorPackage.invalid) {
    invalidKeys.push('door');
  }

  return {
    config,
    invalidKeys,
    isSharedConfig,
    productId: productResult.productId,
    usedFallback: invalidKeys.length > 0,
    viewMode: viewMode.viewMode,
  };
}

export function encodeModularHomeConfigToSearchParams(
  config: ModularHomeConfiguratorState,
  viewMode: ModularHomeViewModeOption = FALLBACK_VIEW_MODE,
): URLSearchParams {
  const product = getModularHomeProductForConfig(config) ?? getModularHomeProduct(FALLBACK_PRODUCT_ID);
  const params = new URLSearchParams();
  const productId = product?.id ?? FALLBACK_PRODUCT_ID;

  params.set('homeDemo', '1');
  params.set('model', PRODUCT_ID_TO_ALIAS[productId] ?? productId);
  params.set('facade', FACADE_TOKEN_TO_ALIAS[config.facade]);
  params.set('roof', ROOF_TOKEN_TO_ALIAS[config.roof]);
  params.set('terrace', TERRACE_TOKEN_TO_ALIAS[config.terrace]);
  params.set('finish', FINISH_TOKEN_TO_ALIAS[config.finishLevel]);
  params.set('windows', WINDOW_TOKEN_TO_ALIAS[config.windowPackage]);
  params.set('door', DOOR_TOKEN_TO_ALIAS[config.doorPackage]);
  params.set('view', viewMode);

  return params;
}

export function createModularHomeShareUrl(
  config: ModularHomeConfiguratorState,
  currentHref?: string,
  viewMode: ModularHomeViewModeOption = FALLBACK_VIEW_MODE,
): string {
  const href = currentHref
    ?? (typeof window !== 'undefined' ? window.location.href : 'http://localhost/expo-3d');
  const url = new URL(href, 'http://localhost');
  const configParams = encodeModularHomeConfigToSearchParams(config, viewMode);

  url.search = '';
  url.hash = '';
  for (const [key, value] of configParams.entries()) {
    url.searchParams.set(key, value);
  }

  return url.toString();
}
