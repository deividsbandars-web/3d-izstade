import type { ModularHomeConfiguratorState } from './modularHomeConfigurator';

export type GalaFacadeStyle =
  | 'vertical-timber'
  | 'horizontal-timber'
  | 'ribbed-modern'
  | 'smooth-panel';

export type GalaRoofStyle =
  | 'dark-standing-seam'
  | 'metal-classic'
  | 'bitumen-flat-dark';

export type GalaWindowTrimStyle =
  | 'minimal-dark'
  | 'white-frame'
  | 'wood-frame';

export type GalaDoorStyle =
  | 'warm-wood'
  | 'dark-modern'
  | 'glass-panel';

export type GalaTerraceStyle =
  | 'simple-low-deck'
  | 'deck-with-steps'
  | 'deck-with-light-rail';

export type GalaInteriorPackage =
  | 'warm-minimal'
  | 'nordic-light'
  | 'compact-premium';

export interface GalaHouseVisualConfig {
  facadeStyle: GalaFacadeStyle;
  facadeTone: 'natural' | 'warm' | 'dark' | 'painted-light';
  roofStyle: GalaRoofStyle;
  windowTrimStyle: GalaWindowTrimStyle;
  doorStyle: GalaDoorStyle;
  terraceStyle: GalaTerraceStyle;
  interiorPackage: GalaInteriorPackage;
  floorFinish: 'warm-plank' | 'utility-plywood' | 'polished-slab';
  wallFinish: 'plain-panel' | 'ribbed-panel' | 'painted-board';
}

export const DEFAULT_GALA_HOUSE_VISUAL_CONFIG: GalaHouseVisualConfig = {
  facadeStyle: 'vertical-timber',
  facadeTone: 'natural',
  roofStyle: 'dark-standing-seam',
  windowTrimStyle: 'minimal-dark',
  doorStyle: 'warm-wood',
  terraceStyle: 'deck-with-steps',
  interiorPackage: 'warm-minimal',
  floorFinish: 'warm-plank',
  wallFinish: 'plain-panel',
};

export type GalaFacadeVisualSpec = {
  seamOrientation: 'vertical' | 'horizontal' | 'none';
  seamSpacingM: number;
  seamWidthM: number;
  seamOpacity: number;
  wallColor: string;
  wallLightColor: string;
  seamColor: string;
  trimColor: string;
};

export type GalaRoofVisualSpec = {
  roofColor: string;
  roofEdgeColor: string;
  roofRoughness: number;
  roofMetalness: number;
  seamColor: string;
  seamCount: number;
  seamVisible: boolean;
  seamWidthM: number;
};

export type GalaOpeningVisualSpec = {
  doorAccentColor: string;
  doorColor: string;
  doorGlassPanel: boolean;
  glassColor: string;
  glassEmissive: string;
  trimColor: string;
};

export type GalaTerraceVisualSpec = {
  deckColor: string;
  deckDarkColor: string;
  edgeTrimDepthM: number;
  edgeTrimHeightM: number;
  railColor: string;
  railHeightM: number;
  showLightRail: boolean;
  showSteps: boolean;
  stepCount: 0 | 1 | 2;
};

export type GalaInteriorVisualSpec = {
  bathroomAccentColor: string;
  bedBaseColor: string;
  blanketColor: string;
  cabinetColor: string;
  counterColor: string;
  floorColor: string;
  kitchenBacksplashColor: string;
  partitionColor: string;
  rugColor: string;
  sofaBackColor: string;
  sofaColor: string;
  tableColor: string;
  wallPanelColor: string;
  wallSeamColor: string;
  wardrobeColor: string;
};

export type GalaOptionQuoteMappingFoundation = {
  bomTags: readonly string[];
  category: 'facade' | 'roof' | 'window' | 'door' | 'terrace' | 'interior';
  costDeltaEur: number;
  label: string;
  optionId: string;
};

function resolveConfig(config?: GalaHouseVisualConfig): GalaHouseVisualConfig {
  return config ?? DEFAULT_GALA_HOUSE_VISUAL_CONFIG;
}

const FACADE_TONE_COLORS: Record<GalaHouseVisualConfig['facadeTone'], Pick<GalaFacadeVisualSpec, 'wallColor' | 'wallLightColor' | 'seamColor' | 'trimColor'>> = {
  natural: {
    seamColor: '#6e472b',
    trimColor: '#704629',
    wallColor: '#c5925c',
    wallLightColor: '#cca06b',
  },
  warm: {
    seamColor: '#704426',
    trimColor: '#633b22',
    wallColor: '#b97945',
    wallLightColor: '#c38855',
  },
  dark: {
    seamColor: '#382818',
    trimColor: '#251a10',
    wallColor: '#65462d',
    wallLightColor: '#725239',
  },
  'painted-light': {
    seamColor: '#b8b0a4',
    trimColor: '#756c60',
    wallColor: '#ddd5c8',
    wallLightColor: '#e6dfd4',
  },
};

const FACADE_STYLE_PATTERN: Record<GalaFacadeStyle, Pick<GalaFacadeVisualSpec, 'seamOrientation' | 'seamOpacity' | 'seamSpacingM' | 'seamWidthM'>> = {
  'horizontal-timber': {
    seamOpacity: 0.58,
    seamOrientation: 'horizontal',
    seamSpacingM: 0.22,
    seamWidthM: 0.01,
  },
  'ribbed-modern': {
    seamOpacity: 0.56,
    seamOrientation: 'vertical',
    seamSpacingM: 0.2,
    seamWidthM: 0.012,
  },
  'smooth-panel': {
    seamOpacity: 0.42,
    seamOrientation: 'vertical',
    seamSpacingM: 1.2,
    seamWidthM: 0.01,
  },
  'vertical-timber': {
    seamOpacity: 0.5,
    seamOrientation: 'vertical',
    seamSpacingM: 0.42,
    seamWidthM: 0.012,
  },
};

export function resolveGalaFacadeVisual(config?: GalaHouseVisualConfig): GalaFacadeVisualSpec {
  const resolved = resolveConfig(config);
  return {
    ...FACADE_STYLE_PATTERN[resolved.facadeStyle],
    ...FACADE_TONE_COLORS[resolved.facadeTone],
  };
}

export function resolveGalaRoofVisual(config?: GalaHouseVisualConfig): GalaRoofVisualSpec {
  const resolved = resolveConfig(config);
  if (resolved.roofStyle === 'metal-classic') {
    return {
      roofColor: '#34414d',
      roofEdgeColor: '#202833',
      roofMetalness: 0.32,
      roofRoughness: 0.48,
      seamColor: '#53606c',
      seamCount: 6,
      seamVisible: true,
      seamWidthM: 0.026,
    };
  }

  if (resolved.roofStyle === 'bitumen-flat-dark') {
    return {
      roofColor: '#20242c',
      roofEdgeColor: '#161b22',
      roofMetalness: 0.05,
      roofRoughness: 0.78,
      seamColor: '#2f3640',
      seamCount: 0,
      seamVisible: false,
      seamWidthM: 0.02,
    };
  }

  return {
    roofColor: '#303943',
    roofEdgeColor: '#181f28',
    roofMetalness: 0.22,
    roofRoughness: 0.42,
    seamColor: '#394556',
    seamCount: 10,
    seamVisible: true,
    seamWidthM: 0.035,
  };
}

export function resolveGalaOpeningVisual(config?: GalaHouseVisualConfig): GalaOpeningVisualSpec {
  const resolved = resolveConfig(config);
  const trimColorByStyle: Record<GalaWindowTrimStyle, string> = {
    'minimal-dark': '#1f2937',
    'white-frame': '#f8fafc',
    'wood-frame': '#8f6238',
  };
  const doorByStyle: Record<GalaDoorStyle, Pick<GalaOpeningVisualSpec, 'doorAccentColor' | 'doorColor' | 'doorGlassPanel'>> = {
    'dark-modern': {
      doorAccentColor: '#111827',
      doorColor: '#26303a',
      doorGlassPanel: false,
    },
    'glass-panel': {
      doorAccentColor: '#0f172a',
      doorColor: '#334155',
      doorGlassPanel: true,
    },
    'warm-wood': {
      doorAccentColor: '#5f351b',
      doorColor: '#9a5a2e',
      doorGlassPanel: false,
    },
  };

  return {
    ...doorByStyle[resolved.doorStyle],
    glassColor: '#314a67',
    glassEmissive: '#20344e',
    trimColor: trimColorByStyle[resolved.windowTrimStyle],
  };
}

export function resolveGalaTerraceVisual(config?: GalaHouseVisualConfig): GalaTerraceVisualSpec {
  const resolved = resolveConfig(config);
  if (resolved.terraceStyle === 'simple-low-deck') {
    return {
      deckColor: '#b98250',
      deckDarkColor: '#7a5230',
      edgeTrimDepthM: 0.045,
      edgeTrimHeightM: 0.045,
      railColor: '#6f4b2c',
      railHeightM: 0,
      showLightRail: false,
      showSteps: false,
      stepCount: 0,
    };
  }

  if (resolved.terraceStyle === 'deck-with-light-rail') {
    return {
      deckColor: '#b98352',
      deckDarkColor: '#76502f',
      edgeTrimDepthM: 0.045,
      edgeTrimHeightM: 0.04,
      railColor: '#5c4028',
      railHeightM: 0.68,
      showLightRail: true,
      showSteps: true,
      stepCount: 1,
    };
  }

  return {
    deckColor: '#b98250',
    deckDarkColor: '#7a5230',
    edgeTrimDepthM: 0.045,
    edgeTrimHeightM: 0.05,
    railColor: '#6f4b2c',
    railHeightM: 0,
    showLightRail: false,
    showSteps: true,
    stepCount: 2,
  };
}

export function resolveGalaInteriorVisual(config?: GalaHouseVisualConfig): GalaInteriorVisualSpec {
  const resolved = resolveConfig(config);
  const packagePalette: Record<GalaInteriorPackage, Omit<GalaInteriorVisualSpec, 'floorColor' | 'wallPanelColor' | 'wallSeamColor'>> = {
    'compact-premium': {
      bathroomAccentColor: '#b8a99a',
      bedBaseColor: '#3f3328',
      blanketColor: '#44546a',
      cabinetColor: '#3c3128',
      counterColor: '#1f2937',
      kitchenBacksplashColor: '#c9b8a2',
      partitionColor: '#c9bda8',
      rugColor: '#56616e',
      sofaBackColor: '#273f3a',
      sofaColor: '#47645f',
      tableColor: '#3f3328',
      wardrobeColor: '#594331',
    },
    'nordic-light': {
      bathroomAccentColor: '#d8cec0',
      bedBaseColor: '#c6aa83',
      blanketColor: '#9bb6c9',
      cabinetColor: '#e7ddce',
      counterColor: '#e5e7eb',
      kitchenBacksplashColor: '#eee4d6',
      partitionColor: '#ded8cc',
      rugColor: '#d8e3e6',
      sofaBackColor: '#bacfc7',
      sofaColor: '#dce8e4',
      tableColor: '#bea078',
      wardrobeColor: '#c0a17a',
    },
    'warm-minimal': {
      bathroomAccentColor: '#d1bda6',
      bedBaseColor: '#7c5a3e',
      blanketColor: '#8fa4b5',
      cabinetColor: '#a87342',
      counterColor: '#3f3024',
      kitchenBacksplashColor: '#d6c3a8',
      partitionColor: '#d3c0a4',
      rugColor: '#9d7449',
      sofaBackColor: '#405f55',
      sofaColor: '#5f7d72',
      tableColor: '#8a5a34',
      wardrobeColor: '#865d38',
    },
  };
  const floorColorByFinish: Record<GalaHouseVisualConfig['floorFinish'], string> = {
    'polished-slab': '#b7bec9',
    'utility-plywood': '#bf9360',
    'warm-plank': '#c9955f',
  };
  const wallByFinish: Record<GalaHouseVisualConfig['wallFinish'], Pick<GalaInteriorVisualSpec, 'wallPanelColor' | 'wallSeamColor'>> = {
    'painted-board': {
      wallPanelColor: '#eee6d8',
      wallSeamColor: '#b6a48d',
    },
    'plain-panel': {
      wallPanelColor: '#dcc9ad',
      wallSeamColor: '#a98c64',
    },
    'ribbed-panel': {
      wallPanelColor: '#d4bf9d',
      wallSeamColor: '#9a7a55',
    },
  };

  return {
    ...packagePalette[resolved.interiorPackage],
    floorColor: floorColorByFinish[resolved.floorFinish],
    ...wallByFinish[resolved.wallFinish],
  };
}

export function resolveGalaHouseVisualConfigFromModularHomeConfig(
  config: ModularHomeConfiguratorState,
): GalaHouseVisualConfig {
  const facadeStyle: GalaFacadeStyle = config.facadeBoardProfile === 'shadowGap' || config.facadeBoardSpacing === 'tight'
    ? 'ribbed-modern'
    : config.facadeBoardOrientation === 'horizontal'
      ? 'horizontal-timber'
      : 'vertical-timber';
  const facadeTone: GalaHouseVisualConfig['facadeTone'] = config.facade === 'darkThermoWood'
    ? 'dark'
    : config.facade === 'lightPainted'
      ? 'painted-light'
      : config.trimColor === 'bronze'
        ? 'warm'
        : 'natural';
  const roofStyle: GalaRoofStyle = config.roof === 'flat' || config.roof === 'greenRoofPlaceholder'
    ? 'bitumen-flat-dark'
    : config.roofEdgeColor === 'lightMetal' || config.roofGutterStyle === 'roundGutter'
      ? 'metal-classic'
      : 'dark-standing-seam';
  const windowTrimStyle: GalaWindowTrimStyle = config.windowFrameColor === 'white'
    ? 'white-frame'
    : config.windowFrameColor === 'timber'
      ? 'wood-frame'
      : 'minimal-dark';
  const doorStyle: GalaDoorStyle = config.doorPackage === 'premiumGlazedEntry'
    ? 'glass-panel'
    : config.doorPackage === 'terraceSlider'
      ? 'dark-modern'
      : 'warm-wood';
  const terraceStyle: GalaTerraceStyle = config.terrace === 'coveredTerracePlaceholder'
    ? 'deck-with-light-rail'
    : config.terrace === 'sideTerrace' || config.terrace === 'extendedTerrace'
      ? 'deck-with-steps'
      : 'simple-low-deck';
  const interiorPackage: GalaInteriorPackage = config.furnitureMood === 'premiumCompact' || config.finishLevel === 'premium'
    ? 'compact-premium'
    : config.furnitureMood === 'minimal' || config.finishLevel === 'shell'
      ? 'nordic-light'
      : 'warm-minimal';
  const floorFinish: GalaHouseVisualConfig['floorFinish'] = config.interiorFloorStyle === 'polishedSlab'
    ? 'polished-slab'
    : config.interiorFloorStyle === 'utilityPlywood'
      ? 'utility-plywood'
      : 'warm-plank';
  const wallFinish: GalaHouseVisualConfig['wallFinish'] = config.wallPanelStyle === 'ribbedPanel'
    ? 'ribbed-panel'
    : config.wallPanelStyle === 'paintReadyBoard'
      ? 'painted-board'
      : 'plain-panel';

  return {
    doorStyle,
    facadeStyle,
    facadeTone,
    floorFinish,
    interiorPackage,
    roofStyle,
    terraceStyle,
    wallFinish,
    windowTrimStyle,
  };
}

export const GALA_OPTION_QUOTE_MAPPING_FOUNDATION: readonly GalaOptionQuoteMappingFoundation[] = [
  {
    bomTags: ['timber-cladding', 'vertical-profile'],
    category: 'facade',
    costDeltaEur: 0,
    label: 'Natural vertical timber facade',
    optionId: 'facade.vertical-timber.natural',
  },
  {
    bomTags: ['timber-cladding', 'horizontal-profile'],
    category: 'facade',
    costDeltaEur: 0,
    label: 'Horizontal timber facade',
    optionId: 'facade.horizontal-timber.natural',
  },
  {
    bomTags: ['timber-cladding', 'ribbed-profile'],
    category: 'facade',
    costDeltaEur: 0,
    label: 'Ribbed modern facade',
    optionId: 'facade.ribbed-modern',
  },
  {
    bomTags: ['roofing', 'standing-seam-metal'],
    category: 'roof',
    costDeltaEur: 0,
    label: 'Dark standing seam roof',
    optionId: 'roof.dark-standing-seam',
  },
  {
    bomTags: ['roofing', 'classic-metal'],
    category: 'roof',
    costDeltaEur: 0,
    label: 'Classic metal roof',
    optionId: 'roof.metal-classic',
  },
  {
    bomTags: ['entry-door', 'wood-finish'],
    category: 'door',
    costDeltaEur: 0,
    label: 'Warm wood entry door',
    optionId: 'door.warm-wood',
  },
  {
    bomTags: ['entry-door', 'glass-panel'],
    category: 'door',
    costDeltaEur: 0,
    label: 'Glass panel entry door',
    optionId: 'door.glass-panel',
  },
  {
    bomTags: ['terrace-deck', 'low-step'],
    category: 'terrace',
    costDeltaEur: 0,
    label: 'Low terrace with residential steps',
    optionId: 'terrace.deck-with-steps',
  },
  {
    bomTags: ['interior-package', 'light-furniture'],
    category: 'interior',
    costDeltaEur: 0,
    label: 'Nordic light interior package',
    optionId: 'interior.nordic-light',
  },
];
