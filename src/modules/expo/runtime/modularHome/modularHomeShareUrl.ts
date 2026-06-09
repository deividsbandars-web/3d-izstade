import type {
  ModularHomeConfiguratorState,
  ModularHomeDoorPackageOption,
  ModularHomeDoorPlacementOption,
  ModularHomeFacadeBoardOrientationOption,
  ModularHomeFacadeBoardProfileOption,
  ModularHomeFacadeBoardSpacingOption,
  ModularHomeFacadeBoardWidthOption,
  ModularHomeFacadeOption,
  ModularHomeFinishLevelOption,
  ModularHomeFloorFinishOption,
  ModularHomeFurniturePackageOption,
  ModularHomeFurnitureToggleOption,
  ModularHomeInteriorFloorStyleOption,
  ModularHomeInteriorWallFinishOption,
  ModularHomeLayoutVariantOption,
  ModularHomeRoofGutterStyleOption,
  ModularHomeRoofEdgeColorOption,
  ModularHomeRoofOption,
  ModularHomeTerraceOption,
  ModularHomeTrimColorOption,
  ModularHomeViewModeOption,
  ModularHomeWindowFrameColorOption,
  ModularHomeWindowFrameTypeOption,
  ModularHomeWindowPlacementOption,
  ModularHomeWindowPackageOption,
  ModularHomeWallPanelStyleOption,
} from './modularHomeConfigurator';
import {
  getDefaultHomeConfig,
  getDefaultLayoutVariantForProduct,
  getModularHomeOptionChoices,
  getModularHomeProduct,
  getModularHomeProductForConfig,
  isModularHomeLayoutVariantCompatible,
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

const SHARE_PARAM_KEYS = ['model', 'homeModel', 'layout', 'layoutVariant', 'facade', 'roof', 'terrace', 'finish', 'furniture', 'furniturePackage', 'sofa', 'table', 'bed', 'kitchen', 'kitchenLine', 'wardrobe', 'wardrobePlaceholder', 'windows', 'windowPlacement', 'windowPlace', 'door', 'doorPlacement', 'doorPlace', 'boardDir', 'boardOrientation', 'boardWidth', 'boardProfile', 'boardSpacing', 'trim', 'trimColor', 'roofEdge', 'gutter', 'roofGutter', 'windowFrame', 'frame', 'frameType', 'windowFrameType', 'wallFinish', 'wall', 'floorFinish', 'floor', 'floorStyle', 'wallPanel', 'wallPanelStyle', 'view'] as const;

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

const WINDOW_PLACEMENT_ALIAS_TO_TOKEN: Record<string, ModularHomeWindowPlacementOption> = {
  balanced: 'balanced',
  corner: 'cornerFeature',
  cornerFeature: 'cornerFeature',
  feature: 'cornerFeature',
  front: 'frontPanoramic',
  frontPanoramic: 'frontPanoramic',
  panoramic: 'frontPanoramic',
  privacy: 'sidePrivacy',
  side: 'sidePrivacy',
  sidePrivacy: 'sidePrivacy',
};

const DOOR_PLACEMENT_ALIAS_TO_TOKEN: Record<string, ModularHomeDoorPlacementOption> = {
  front: 'frontEntry',
  frontEntry: 'frontEntry',
  side: 'sideEntry',
  sideEntry: 'sideEntry',
  terrace: 'terraceFacing',
  terraceFacing: 'terraceFacing',
};

const FACADE_BOARD_ORIENTATION_ALIAS_TO_TOKEN: Record<string, ModularHomeFacadeBoardOrientationOption> = {
  horizontal: 'horizontal',
  h: 'horizontal',
  vertical: 'vertical',
  v: 'vertical',
};

const FACADE_BOARD_WIDTH_ALIAS_TO_TOKEN: Record<string, ModularHomeFacadeBoardWidthOption> = {
  narrow: 'narrow',
  n: 'narrow',
  standard: 'standard',
  std: 'standard',
  wide: 'wide',
  w: 'wide',
};

const FACADE_BOARD_PROFILE_ALIAS_TO_TOKEN: Record<string, ModularHomeFacadeBoardProfileOption> = {
  square: 'squareEdge',
  squareEdge: 'squareEdge',
  shadow: 'shadowGap',
  shadowGap: 'shadowGap',
  tongue: 'tongueGroove',
  tongueGroove: 'tongueGroove',
  tg: 'tongueGroove',
};

const FACADE_BOARD_SPACING_ALIAS_TO_TOKEN: Record<string, ModularHomeFacadeBoardSpacingOption> = {
  expressive: 'expressive',
  loose: 'expressive',
  standard: 'standard',
  std: 'standard',
  tight: 'tight',
};

const TRIM_COLOR_ALIAS_TO_TOKEN: Record<string, ModularHomeTrimColorOption> = {
  bronze: 'bronze',
  graphite: 'graphite',
  timber: 'timber',
  white: 'white',
};

const ROOF_EDGE_COLOR_ALIAS_TO_TOKEN: Record<string, ModularHomeRoofEdgeColorOption> = {
  bronze: 'bronze',
  graphite: 'graphite',
  light: 'lightMetal',
  lightMetal: 'lightMetal',
};

const ROOF_GUTTER_STYLE_ALIAS_TO_TOKEN: Record<string, ModularHomeRoofGutterStyleOption> = {
  box: 'boxGutter',
  boxGutter: 'boxGutter',
  minimal: 'minimalEdge',
  minimalEdge: 'minimalEdge',
  round: 'roundGutter',
  roundGutter: 'roundGutter',
};

const WINDOW_FRAME_COLOR_ALIAS_TO_TOKEN: Record<string, ModularHomeWindowFrameColorOption> = {
  graphite: 'graphite',
  timber: 'timber',
  white: 'white',
};

const WINDOW_FRAME_TYPE_ALIAS_TO_TOKEN: Record<string, ModularHomeWindowFrameTypeOption> = {
  deep: 'deepReveal',
  deepReveal: 'deepReveal',
  slim: 'slimline',
  slimline: 'slimline',
  standard: 'standardFrame',
  standardFrame: 'standardFrame',
};

const INTERIOR_WALL_FINISH_ALIAS_TO_TOKEN: Record<string, ModularHomeInteriorWallFinishOption> = {
  painted: 'paintedWhite',
  paintedWhite: 'paintedWhite',
  panel: 'warmPanel',
  plywood: 'plywood',
  warm: 'warmPanel',
  warmPanel: 'warmPanel',
};

const FLOOR_FINISH_ALIAS_TO_TOKEN: Record<string, ModularHomeFloorFinishOption> = {
  concrete: 'polishedConcrete',
  oak: 'oakLaminate',
  oakLaminate: 'oakLaminate',
  polishedConcrete: 'polishedConcrete',
  plywood: 'plywood',
};

const INTERIOR_FLOOR_STYLE_ALIAS_TO_TOKEN: Record<string, ModularHomeInteriorFloorStyleOption> = {
  polished: 'polishedSlab',
  polishedSlab: 'polishedSlab',
  slab: 'polishedSlab',
  utility: 'utilityPlywood',
  utilityPlywood: 'utilityPlywood',
  warm: 'warmPlank',
  warmPlank: 'warmPlank',
};

const WALL_PANEL_STYLE_ALIAS_TO_TOKEN: Record<string, ModularHomeWallPanelStyleOption> = {
  paint: 'paintReadyBoard',
  paintReady: 'paintReadyBoard',
  paintReadyBoard: 'paintReadyBoard',
  plain: 'plainPanel',
  plainPanel: 'plainPanel',
  ribbed: 'ribbedPanel',
  ribbedPanel: 'ribbedPanel',
};

const FURNITURE_PACKAGE_ALIAS_TO_TOKEN: Record<string, ModularHomeFurniturePackageOption> = {
  bathroom: 'bathroomPackage',
  bathroomPackage: 'bathroomPackage',
  empty: 'emptyShell',
  emptyShell: 'emptyShell',
  kitchen: 'kitchenPackage',
  kitchenPackage: 'kitchenPackage',
  premium: 'premiumFurniture',
  premiumFurniture: 'premiumFurniture',
  sauna: 'saunaPackage',
  saunaPackage: 'saunaPackage',
  standard: 'standardFurniture',
  standardFurniture: 'standardFurniture',
};

const FURNITURE_TOGGLE_ALIAS_TO_TOKEN: Record<string, ModularHomeFurnitureToggleOption> = {
  disabled: 'disabled',
  enabled: 'enabled',
  false: 'disabled',
  no: 'disabled',
  off: 'disabled',
  on: 'enabled',
  true: 'enabled',
  yes: 'enabled',
  '0': 'disabled',
  '1': 'enabled',
};

const LAYOUT_ALIAS_TO_TOKEN: Record<string, ModularHomeLayoutVariantOption> = {
  guest: 'guestCabin',
  guestCabin: 'guestCabin',
  large: 'largeLiving',
  largeLiving: 'largeLiving',
  office: 'officeCabin',
  officeCabin: 'officeCabin',
  one: 'oneBedroom',
  oneBedroom: 'oneBedroom',
  open: 'openStudio',
  openStudio: 'openStudio',
  rest: 'saunaRestRoom',
  sauna: 'saunaOnly',
  saunaOnly: 'saunaOnly',
  saunaRestRoom: 'saunaRestRoom',
  studio: 'openStudio',
  three: 'threeBedroomCompact',
  threeBedroom: 'threeBedroomCompact',
  threeBedroomCompact: 'threeBedroomCompact',
  two: 'twoBedroom',
  twoBedroom: 'twoBedroom',
};

const VIEW_ALIAS_TO_TOKEN: Record<string, ModularHomeViewModeOption> = {
  cutaway: 'cutaway',
  exterior: 'exterior',
  floor: 'floorplan',
  floorplan: 'floorplan',
  inside: 'interior',
  interior: 'interior',
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

const WINDOW_PLACEMENT_TOKEN_TO_ALIAS: Record<ModularHomeWindowPlacementOption, string> = {
  balanced: 'balanced',
  cornerFeature: 'corner',
  frontPanoramic: 'front',
  sidePrivacy: 'side',
};

const DOOR_PLACEMENT_TOKEN_TO_ALIAS: Record<ModularHomeDoorPlacementOption, string> = {
  frontEntry: 'front',
  sideEntry: 'side',
  terraceFacing: 'terrace',
};

const FACADE_BOARD_ORIENTATION_TOKEN_TO_ALIAS: Record<ModularHomeFacadeBoardOrientationOption, string> = {
  horizontal: 'h',
  vertical: 'v',
};

const FACADE_BOARD_WIDTH_TOKEN_TO_ALIAS: Record<ModularHomeFacadeBoardWidthOption, string> = {
  narrow: 'narrow',
  standard: 'standard',
  wide: 'wide',
};

const FACADE_BOARD_PROFILE_TOKEN_TO_ALIAS: Record<ModularHomeFacadeBoardProfileOption, string> = {
  shadowGap: 'shadow',
  squareEdge: 'square',
  tongueGroove: 'tg',
};

const FACADE_BOARD_SPACING_TOKEN_TO_ALIAS: Record<ModularHomeFacadeBoardSpacingOption, string> = {
  expressive: 'expressive',
  standard: 'standard',
  tight: 'tight',
};

const TRIM_COLOR_TOKEN_TO_ALIAS: Record<ModularHomeTrimColorOption, string> = {
  bronze: 'bronze',
  graphite: 'graphite',
  timber: 'timber',
  white: 'white',
};

const ROOF_EDGE_COLOR_TOKEN_TO_ALIAS: Record<ModularHomeRoofEdgeColorOption, string> = {
  bronze: 'bronze',
  graphite: 'graphite',
  lightMetal: 'light',
};

const ROOF_GUTTER_STYLE_TOKEN_TO_ALIAS: Record<ModularHomeRoofGutterStyleOption, string> = {
  boxGutter: 'box',
  minimalEdge: 'minimal',
  roundGutter: 'round',
};

const WINDOW_FRAME_COLOR_TOKEN_TO_ALIAS: Record<ModularHomeWindowFrameColorOption, string> = {
  graphite: 'graphite',
  timber: 'timber',
  white: 'white',
};

const WINDOW_FRAME_TYPE_TOKEN_TO_ALIAS: Record<ModularHomeWindowFrameTypeOption, string> = {
  deepReveal: 'deep',
  slimline: 'slim',
  standardFrame: 'standard',
};

const INTERIOR_WALL_FINISH_TOKEN_TO_ALIAS: Record<ModularHomeInteriorWallFinishOption, string> = {
  paintedWhite: 'painted',
  plywood: 'plywood',
  warmPanel: 'warm',
};

const FLOOR_FINISH_TOKEN_TO_ALIAS: Record<ModularHomeFloorFinishOption, string> = {
  oakLaminate: 'oak',
  polishedConcrete: 'concrete',
  plywood: 'plywood',
};

const INTERIOR_FLOOR_STYLE_TOKEN_TO_ALIAS: Record<ModularHomeInteriorFloorStyleOption, string> = {
  polishedSlab: 'slab',
  utilityPlywood: 'utility',
  warmPlank: 'warm',
};

const WALL_PANEL_STYLE_TOKEN_TO_ALIAS: Record<ModularHomeWallPanelStyleOption, string> = {
  paintReadyBoard: 'paintReady',
  plainPanel: 'plain',
  ribbedPanel: 'ribbed',
};

const FURNITURE_PACKAGE_TOKEN_TO_ALIAS: Record<ModularHomeFurniturePackageOption, string> = {
  bathroomPackage: 'bathroom',
  emptyShell: 'empty',
  kitchenPackage: 'kitchen',
  premiumFurniture: 'premium',
  saunaPackage: 'sauna',
  standardFurniture: 'standard',
};

const FURNITURE_TOGGLE_TOKEN_TO_ALIAS: Record<ModularHomeFurnitureToggleOption, string> = {
  disabled: '0',
  enabled: '1',
};

const LAYOUT_TOKEN_TO_ALIAS: Record<ModularHomeLayoutVariantOption, string> = {
  guestCabin: 'guest',
  largeLiving: 'large',
  officeCabin: 'office',
  oneBedroom: 'one',
  openStudio: 'open',
  saunaOnly: 'sauna',
  saunaRestRoom: 'rest',
  threeBedroomCompact: 'three',
  twoBedroom: 'two',
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

function decodeLayoutVariant(
  params: URLSearchParams,
  productId: ModularHomeProductId,
): {
  invalid: boolean;
  paramKey: 'layout' | 'layoutVariant';
  token: ModularHomeLayoutVariantOption | null;
} {
  const paramKey = params.has('layout') ? 'layout' : 'layoutVariant';
  const rawValue = params.get(paramKey);

  if (!rawValue) {
    return { invalid: false, paramKey, token: null };
  }

  const token = getAliasValue(LAYOUT_ALIAS_TO_TOKEN, rawValue);

  if (!token || !isModularHomeLayoutVariantCompatible(productId, token)) {
    return { invalid: true, paramKey, token: null };
  }

  return { invalid: false, paramKey, token };
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
  const windowPlacementParamKey = params.has('windowPlacement') ? 'windowPlacement' : 'windowPlace';
  const doorPlacementParamKey = params.has('doorPlacement') ? 'doorPlacement' : 'doorPlace';
  const windowPlacement = decodeOption(params, windowPlacementParamKey, productResult.productId, 'windowPlacement', WINDOW_PLACEMENT_ALIAS_TO_TOKEN);
  const doorPlacement = decodeOption(params, doorPlacementParamKey, productResult.productId, 'doorPlacement', DOOR_PLACEMENT_ALIAS_TO_TOKEN);
  const facadeBoardOrientationParamKey = params.has('boardOrientation') ? 'boardOrientation' : 'boardDir';
  const trimParamKey = params.has('trimColor') ? 'trimColor' : 'trim';
  const roofGutterParamKey = params.has('roofGutter') ? 'roofGutter' : 'gutter';
  const windowFrameParamKey = params.has('windowFrame') ? 'windowFrame' : 'frame';
  const windowFrameTypeParamKey = params.has('windowFrameType') ? 'windowFrameType' : 'frameType';
  const interiorWallFinishParamKey = params.has('wallFinish') ? 'wallFinish' : 'wall';
  const floorFinishParamKey = params.has('floorFinish') ? 'floorFinish' : 'floor';
  const wallPanelStyleParamKey = params.has('wallPanelStyle') ? 'wallPanelStyle' : 'wallPanel';
  const furniturePackageParamKey = params.has('furniturePackage') ? 'furniturePackage' : 'furniture';
  const kitchenLineParamKey = params.has('kitchenLine') ? 'kitchenLine' : 'kitchen';
  const wardrobeParamKey = params.has('wardrobePlaceholder') ? 'wardrobePlaceholder' : 'wardrobe';
  const facadeBoardOrientation = decodeOption(params, facadeBoardOrientationParamKey, productResult.productId, 'facadeBoardOrientation', FACADE_BOARD_ORIENTATION_ALIAS_TO_TOKEN);
  const facadeBoardWidth = decodeOption(params, 'boardWidth', productResult.productId, 'facadeBoardWidth', FACADE_BOARD_WIDTH_ALIAS_TO_TOKEN);
  const facadeBoardProfile = decodeOption(params, 'boardProfile', productResult.productId, 'facadeBoardProfile', FACADE_BOARD_PROFILE_ALIAS_TO_TOKEN);
  const facadeBoardSpacing = decodeOption(params, 'boardSpacing', productResult.productId, 'facadeBoardSpacing', FACADE_BOARD_SPACING_ALIAS_TO_TOKEN);
  const trimColor = decodeOption(params, trimParamKey, productResult.productId, 'trimColor', TRIM_COLOR_ALIAS_TO_TOKEN);
  const roofEdgeColor = decodeOption(params, 'roofEdge', productResult.productId, 'roofEdgeColor', ROOF_EDGE_COLOR_ALIAS_TO_TOKEN);
  const roofGutterStyle = decodeOption(params, roofGutterParamKey, productResult.productId, 'roofGutterStyle', ROOF_GUTTER_STYLE_ALIAS_TO_TOKEN);
  const windowFrameColor = decodeOption(params, windowFrameParamKey, productResult.productId, 'windowFrameColor', WINDOW_FRAME_COLOR_ALIAS_TO_TOKEN);
  const windowFrameType = decodeOption(params, windowFrameTypeParamKey, productResult.productId, 'windowFrameType', WINDOW_FRAME_TYPE_ALIAS_TO_TOKEN);
  const interiorWallFinish = decodeOption(params, interiorWallFinishParamKey, productResult.productId, 'interiorWallFinish', INTERIOR_WALL_FINISH_ALIAS_TO_TOKEN);
  const floorFinish = decodeOption(params, floorFinishParamKey, productResult.productId, 'floorFinish', FLOOR_FINISH_ALIAS_TO_TOKEN);
  const interiorFloorStyle = decodeOption(params, 'floorStyle', productResult.productId, 'interiorFloorStyle', INTERIOR_FLOOR_STYLE_ALIAS_TO_TOKEN);
  const wallPanelStyle = decodeOption(params, wallPanelStyleParamKey, productResult.productId, 'wallPanelStyle', WALL_PANEL_STYLE_ALIAS_TO_TOKEN);
  const furniturePackage = decodeOption(params, furniturePackageParamKey, productResult.productId, 'furniturePackage', FURNITURE_PACKAGE_ALIAS_TO_TOKEN);
  const sofa = decodeOption(params, 'sofa', productResult.productId, 'sofa', FURNITURE_TOGGLE_ALIAS_TO_TOKEN);
  const table = decodeOption(params, 'table', productResult.productId, 'table', FURNITURE_TOGGLE_ALIAS_TO_TOKEN);
  const bed = decodeOption(params, 'bed', productResult.productId, 'bed', FURNITURE_TOGGLE_ALIAS_TO_TOKEN);
  const kitchenLine = decodeOption(params, kitchenLineParamKey, productResult.productId, 'kitchenLine', FURNITURE_TOGGLE_ALIAS_TO_TOKEN);
  const wardrobePlaceholder = decodeOption(params, wardrobeParamKey, productResult.productId, 'wardrobePlaceholder', FURNITURE_TOGGLE_ALIAS_TO_TOKEN);
  const layoutVariant = decodeLayoutVariant(params, productResult.productId);

  config.layoutVariant = getDefaultLayoutVariantForProduct(productResult.productId);

  if (layoutVariant.token) {
    config.layoutVariant = layoutVariant.token;
  } else if (layoutVariant.invalid) {
    invalidKeys.push(layoutVariant.paramKey);
  }

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

  if (windowPlacement.token) {
    config.windowPlacement = windowPlacement.token;
  } else if (windowPlacement.invalid) {
    invalidKeys.push(windowPlacementParamKey);
  }

  if (doorPlacement.token) {
    config.doorPlacement = doorPlacement.token;
  } else if (doorPlacement.invalid) {
    invalidKeys.push(doorPlacementParamKey);
  }

  if (facadeBoardOrientation.token) {
    config.facadeBoardOrientation = facadeBoardOrientation.token;
  } else if (facadeBoardOrientation.invalid) {
    invalidKeys.push(facadeBoardOrientationParamKey);
  }

  if (facadeBoardWidth.token) {
    config.facadeBoardWidth = facadeBoardWidth.token;
  } else if (facadeBoardWidth.invalid) {
    invalidKeys.push('boardWidth');
  }

  if (facadeBoardProfile.token) {
    config.facadeBoardProfile = facadeBoardProfile.token;
  } else if (facadeBoardProfile.invalid) {
    invalidKeys.push('boardProfile');
  }

  if (facadeBoardSpacing.token) {
    config.facadeBoardSpacing = facadeBoardSpacing.token;
  } else if (facadeBoardSpacing.invalid) {
    invalidKeys.push('boardSpacing');
  }

  if (trimColor.token) {
    config.trimColor = trimColor.token;
  } else if (trimColor.invalid) {
    invalidKeys.push(trimParamKey);
  }

  if (roofEdgeColor.token) {
    config.roofEdgeColor = roofEdgeColor.token;
  } else if (roofEdgeColor.invalid) {
    invalidKeys.push('roofEdge');
  }

  if (roofGutterStyle.token) {
    config.roofGutterStyle = roofGutterStyle.token;
  } else if (roofGutterStyle.invalid) {
    invalidKeys.push(roofGutterParamKey);
  }

  if (windowFrameColor.token) {
    config.windowFrameColor = windowFrameColor.token;
  } else if (windowFrameColor.invalid) {
    invalidKeys.push(windowFrameParamKey);
  }

  if (windowFrameType.token) {
    config.windowFrameType = windowFrameType.token;
  } else if (windowFrameType.invalid) {
    invalidKeys.push(windowFrameTypeParamKey);
  }

  if (interiorWallFinish.token) {
    config.interiorWallFinish = interiorWallFinish.token;
  } else if (interiorWallFinish.invalid) {
    invalidKeys.push(interiorWallFinishParamKey);
  }

  if (floorFinish.token) {
    config.floorFinish = floorFinish.token;
  } else if (floorFinish.invalid) {
    invalidKeys.push(floorFinishParamKey);
  }

  if (interiorFloorStyle.token) {
    config.interiorFloorStyle = interiorFloorStyle.token;
  } else if (interiorFloorStyle.invalid) {
    invalidKeys.push('floorStyle');
  }

  if (wallPanelStyle.token) {
    config.wallPanelStyle = wallPanelStyle.token;
  } else if (wallPanelStyle.invalid) {
    invalidKeys.push(wallPanelStyleParamKey);
  }

  if (furniturePackage.token) {
    config.furniturePackage = furniturePackage.token;
  } else if (furniturePackage.invalid) {
    invalidKeys.push(furniturePackageParamKey);
  }

  if (sofa.token) {
    config.sofa = sofa.token;
  } else if (sofa.invalid) {
    invalidKeys.push('sofa');
  }

  if (table.token) {
    config.table = table.token;
  } else if (table.invalid) {
    invalidKeys.push('table');
  }

  if (bed.token) {
    config.bed = bed.token;
  } else if (bed.invalid) {
    invalidKeys.push('bed');
  }

  if (kitchenLine.token) {
    config.kitchenLine = kitchenLine.token;
  } else if (kitchenLine.invalid) {
    invalidKeys.push(kitchenLineParamKey);
  }

  if (wardrobePlaceholder.token) {
    config.wardrobePlaceholder = wardrobePlaceholder.token;
  } else if (wardrobePlaceholder.invalid) {
    invalidKeys.push(wardrobeParamKey);
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
  params.set('layout', LAYOUT_TOKEN_TO_ALIAS[config.layoutVariant]);
  params.set('facade', FACADE_TOKEN_TO_ALIAS[config.facade]);
  params.set('roof', ROOF_TOKEN_TO_ALIAS[config.roof]);
  params.set('terrace', TERRACE_TOKEN_TO_ALIAS[config.terrace]);
  params.set('finish', FINISH_TOKEN_TO_ALIAS[config.finishLevel]);
  params.set('windows', WINDOW_TOKEN_TO_ALIAS[config.windowPackage]);
  params.set('windowPlace', WINDOW_PLACEMENT_TOKEN_TO_ALIAS[config.windowPlacement]);
  params.set('door', DOOR_TOKEN_TO_ALIAS[config.doorPackage]);
  params.set('doorPlace', DOOR_PLACEMENT_TOKEN_TO_ALIAS[config.doorPlacement]);
  params.set('boardDir', FACADE_BOARD_ORIENTATION_TOKEN_TO_ALIAS[config.facadeBoardOrientation]);
  params.set('boardWidth', FACADE_BOARD_WIDTH_TOKEN_TO_ALIAS[config.facadeBoardWidth]);
  params.set('boardProfile', FACADE_BOARD_PROFILE_TOKEN_TO_ALIAS[config.facadeBoardProfile]);
  params.set('boardSpacing', FACADE_BOARD_SPACING_TOKEN_TO_ALIAS[config.facadeBoardSpacing]);
  params.set('trim', TRIM_COLOR_TOKEN_TO_ALIAS[config.trimColor]);
  params.set('roofEdge', ROOF_EDGE_COLOR_TOKEN_TO_ALIAS[config.roofEdgeColor]);
  params.set('gutter', ROOF_GUTTER_STYLE_TOKEN_TO_ALIAS[config.roofGutterStyle]);
  params.set('frame', WINDOW_FRAME_COLOR_TOKEN_TO_ALIAS[config.windowFrameColor]);
  params.set('frameType', WINDOW_FRAME_TYPE_TOKEN_TO_ALIAS[config.windowFrameType]);
  params.set('wall', INTERIOR_WALL_FINISH_TOKEN_TO_ALIAS[config.interiorWallFinish]);
  params.set('floor', FLOOR_FINISH_TOKEN_TO_ALIAS[config.floorFinish]);
  params.set('floorStyle', INTERIOR_FLOOR_STYLE_TOKEN_TO_ALIAS[config.interiorFloorStyle]);
  params.set('wallPanel', WALL_PANEL_STYLE_TOKEN_TO_ALIAS[config.wallPanelStyle]);
  params.set('furniture', FURNITURE_PACKAGE_TOKEN_TO_ALIAS[config.furniturePackage]);
  params.set('sofa', FURNITURE_TOGGLE_TOKEN_TO_ALIAS[config.sofa]);
  params.set('table', FURNITURE_TOGGLE_TOKEN_TO_ALIAS[config.table]);
  params.set('bed', FURNITURE_TOGGLE_TOKEN_TO_ALIAS[config.bed]);
  params.set('kitchen', FURNITURE_TOGGLE_TOKEN_TO_ALIAS[config.kitchenLine]);
  params.set('wardrobe', FURNITURE_TOGGLE_TOKEN_TO_ALIAS[config.wardrobePlaceholder]);
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
