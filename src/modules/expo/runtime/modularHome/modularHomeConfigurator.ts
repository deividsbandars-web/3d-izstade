import { useCallback, useSyncExternalStore } from 'react';
import {
  DEFAULT_MODULAR_HOME_TEMPLATE_ID,
  MODULAR_HOME_TEMPLATE_OPTIONS,
  type ModularHomeTemplateId,
} from './modularHomeConfig';
import {
  getModularHomeFacadeMaterial,
  getModularHomeFinishMaterials,
  getModularHomeRoofMaterial,
  type ModularHomeMaterialId,
} from './modularHomeMaterials';

export type ModularHomeTemplateOption = ModularHomeTemplateId;
export type ModularHomeFacadeOption = 'naturalTimber' | 'darkThermoWood' | 'lightPainted';
export type ModularHomeRoofOption = 'pitched' | 'flat' | 'greenRoofPlaceholder';
export type ModularHomeTerraceOption = 'none' | 'frontDeck' | 'sideTerrace' | 'extendedTerrace' | 'coveredTerracePlaceholder';
export type ModularHomeFinishLevelOption = 'standard' | 'shell' | 'premium';
export type ModularHomeWindowPackageOption = 'standardWindows' | 'panoramicWindows' | 'cornerGlazing' | 'compactPrivacy';
export type ModularHomeDoorPackageOption = 'standardEntry' | 'terraceSlider' | 'premiumGlazedEntry';
export type ModularHomeViewModeOption = 'exterior' | 'cutaway' | 'floorplan';

export type ModularHomeConfiguratorState = {
  template: ModularHomeTemplateOption;
  facade: ModularHomeFacadeOption;
  roof: ModularHomeRoofOption;
  terrace: ModularHomeTerraceOption;
  finishLevel: ModularHomeFinishLevelOption;
  windowPackage: ModularHomeWindowPackageOption;
  doorPackage: ModularHomeDoorPackageOption;
};

export type ModularHomeConfiguratorOption<Key extends keyof ModularHomeConfiguratorState = keyof ModularHomeConfiguratorState> = {
  key: ModularHomeConfiguratorState[Key];
  label: string;
};

export type ModularHomeConfiguratorGroup<Key extends keyof ModularHomeConfiguratorState = keyof ModularHomeConfiguratorState> = {
  key: Key;
  label: string;
  options: readonly ModularHomeConfiguratorOption<Key>[];
};

export type ModularHomeViewModeOptionDefinition = {
  key: ModularHomeViewModeOption;
  label: string;
  note: string;
};

export type ModularHomeFacadeVisual = {
  label: string;
  materialId: ModularHomeMaterialId;
  wallColor: string;
  sideColor: string;
  trimColor: string;
};

export type ModularHomeRoofVisual = {
  label: string;
  materialId: ModularHomeMaterialId;
  roofColor: string;
  accentColor: string;
  isGreenRoof: boolean;
};

export type ModularHomeFinishLevelVisual = {
  label: string;
  materialIds: readonly ModularHomeMaterialId[];
  interiorFloorColor: string;
  interiorWallColor: string;
  bathroomCoreColor: string;
  note: string;
};

export type ModularHomeTerraceVisual = {
  label: string;
  deckDepth: number;
  deckWidth: number;
  enabled: boolean;
  isCovered: boolean;
  placement: 'none' | 'front' | 'side';
};

export type ModularHomeWindowPackageVisual = {
  label: string;
  glassColor: string;
  trimColor: string;
  widthMultiplier: number;
  heightMultiplier: number;
  sideDepthMultiplier: number;
  reviewNote: string;
};

export type ModularHomeDoorPackageVisual = {
  label: string;
  doorColor: string;
  glassColor: string;
  widthMultiplier: number;
  hasGlassPanel: boolean;
  reviewNote: string;
};

export const DEFAULT_MODULAR_HOME_CONFIG: ModularHomeConfiguratorState = {
  template: DEFAULT_MODULAR_HOME_TEMPLATE_ID,
  facade: 'naturalTimber',
  roof: 'pitched',
  terrace: 'frontDeck',
  finishLevel: 'standard',
  windowPackage: 'standardWindows',
  doorPackage: 'standardEntry',
};

export const MODULAR_HOME_FACADE_OPTIONS = [
  { key: 'naturalTimber', label: 'Natural timber' },
  { key: 'darkThermoWood', label: 'Dark thermo wood' },
  { key: 'lightPainted', label: 'Light painted' },
] as const satisfies readonly ModularHomeConfiguratorOption<'facade'>[];

export const MODULAR_HOME_ROOF_OPTIONS = [
  { key: 'flat', label: 'Flat' },
  { key: 'pitched', label: 'Pitched' },
  { key: 'greenRoofPlaceholder', label: 'Green roof placeholder' },
] as const satisfies readonly ModularHomeConfiguratorOption<'roof'>[];

export const MODULAR_HOME_TERRACE_OPTIONS = [
  { key: 'none', label: 'None' },
  { key: 'frontDeck', label: 'Front deck' },
  { key: 'sideTerrace', label: 'Side terrace' },
  { key: 'extendedTerrace', label: 'Extended terrace' },
  { key: 'coveredTerracePlaceholder', label: 'Covered terrace placeholder' },
] as const satisfies readonly ModularHomeConfiguratorOption<'terrace'>[];

export const MODULAR_HOME_FINISH_LEVEL_OPTIONS = [
  { key: 'shell', label: 'Empty shell' },
  { key: 'standard', label: 'Standard furnished preview' },
  { key: 'premium', label: 'Premium interior preview' },
] as const satisfies readonly ModularHomeConfiguratorOption<'finishLevel'>[];

export const MODULAR_HOME_WINDOW_PACKAGE_OPTIONS = [
  { key: 'standardWindows', label: 'Standard glazing' },
  { key: 'panoramicWindows', label: 'Panoramic glazing' },
  { key: 'cornerGlazing', label: 'Corner glazing' },
  { key: 'compactPrivacy', label: 'Compact/privacy glazing' },
] as const satisfies readonly ModularHomeConfiguratorOption<'windowPackage'>[];

export const MODULAR_HOME_DOOR_PACKAGE_OPTIONS = [
  { key: 'standardEntry', label: 'Standard entry' },
  { key: 'terraceSlider', label: 'Terrace slider' },
  { key: 'premiumGlazedEntry', label: 'Premium glazed entry' },
] as const satisfies readonly ModularHomeConfiguratorOption<'doorPackage'>[];

export const DEFAULT_MODULAR_HOME_VIEW_MODE: ModularHomeViewModeOption = 'exterior';

export const MODULAR_HOME_VIEW_MODE_OPTIONS = [
  {
    key: 'exterior',
    label: 'Exterior',
    note: 'Full exterior with roof and facade.',
  },
  {
    key: 'cutaway',
    label: 'Cutaway',
    note: 'Roof hidden so the interior can be inspected.',
  },
  {
    key: 'floorplan',
    label: 'Floorplan',
    note: 'Low-wall layout view for room planning.',
  },
] as const satisfies readonly ModularHomeViewModeOptionDefinition[];

export const MODULAR_HOME_CONFIGURATOR_GROUPS = [
  { key: 'template', label: 'Home template', options: MODULAR_HOME_TEMPLATE_OPTIONS },
  { key: 'facade', label: 'Facade', options: MODULAR_HOME_FACADE_OPTIONS },
  { key: 'roof', label: 'Roof', options: MODULAR_HOME_ROOF_OPTIONS },
  { key: 'terrace', label: 'Terrace', options: MODULAR_HOME_TERRACE_OPTIONS },
  { key: 'finishLevel', label: 'Finish level', options: MODULAR_HOME_FINISH_LEVEL_OPTIONS },
  { key: 'windowPackage', label: 'Window package', options: MODULAR_HOME_WINDOW_PACKAGE_OPTIONS },
  { key: 'doorPackage', label: 'Door package', options: MODULAR_HOME_DOOR_PACKAGE_OPTIONS },
] as const satisfies readonly ModularHomeConfiguratorGroup[];

function createFacadeVisual(option: ModularHomeFacadeOption): ModularHomeFacadeVisual {
  const material = getModularHomeFacadeMaterial(option);

  return {
    label: material.label,
    materialId: material.id,
    sideColor: material.secondaryColor,
    trimColor: material.accentColor,
    wallColor: material.baseColor,
  };
}

function createRoofVisual(option: ModularHomeRoofOption): ModularHomeRoofVisual {
  const material = getModularHomeRoofMaterial(option);

  return {
    accentColor: material.accentColor,
    isGreenRoof: option === 'greenRoofPlaceholder',
    label: material.label,
    materialId: material.id,
    roofColor: option === 'flat' ? material.secondaryColor : material.baseColor,
  };
}

function createFinishLevelVisual(
  option: ModularHomeFinishLevelOption,
  note: string,
): ModularHomeFinishLevelVisual {
  const materials = getModularHomeFinishMaterials(option);
  const interiorMaterial = materials.find((material) => material.group === 'interior');
  const wetCoreMaterial = materials.find((material) => material.group === 'wetCore');

  return {
    bathroomCoreColor: wetCoreMaterial?.baseColor ?? '#bae6fd',
    interiorFloorColor: interiorMaterial?.baseColor ?? '#d6b98b',
    interiorWallColor: interiorMaterial?.secondaryColor ?? '#f8e6c7',
    label: getModularHomeConfigLabel('finishLevel', option),
    materialIds: materials.map((material) => material.id),
    note,
  };
}

export const MODULAR_HOME_FACADE_VISUALS: Record<ModularHomeFacadeOption, ModularHomeFacadeVisual> = {
  naturalTimber: createFacadeVisual('naturalTimber'),
  darkThermoWood: createFacadeVisual('darkThermoWood'),
  lightPainted: createFacadeVisual('lightPainted'),
};

export const MODULAR_HOME_ROOF_VISUALS: Record<ModularHomeRoofOption, ModularHomeRoofVisual> = {
  pitched: createRoofVisual('pitched'),
  flat: createRoofVisual('flat'),
  greenRoofPlaceholder: createRoofVisual('greenRoofPlaceholder'),
};

export const MODULAR_HOME_FINISH_LEVEL_VISUALS: Record<ModularHomeFinishLevelOption, ModularHomeFinishLevelVisual> = {
  shell: createFinishLevelVisual('shell', 'Shell-level plywood preview.'),
  standard: createFinishLevelVisual('standard', 'Standard finish preview using plywood and wet-core material tokens.'),
  premium: createFinishLevelVisual('premium', 'Premium finish preview keeps the same lightweight material tokens until texture maps are added.'),
};

export const MODULAR_HOME_TERRACE_VISUALS: Record<ModularHomeTerraceOption, ModularHomeTerraceVisual> = {
  none: {
    label: 'None',
    deckDepth: 0,
    deckWidth: 0,
    enabled: false,
    isCovered: false,
    placement: 'none',
  },
  frontDeck: {
    label: 'Front deck',
    deckDepth: 18,
    deckWidth: 62,
    enabled: true,
    isCovered: false,
    placement: 'front',
  },
  sideTerrace: {
    label: 'Side terrace',
    deckDepth: 18,
    deckWidth: 58,
    enabled: true,
    isCovered: false,
    placement: 'side',
  },
  extendedTerrace: {
    label: 'Extended terrace',
    deckDepth: 32,
    deckWidth: 88,
    enabled: true,
    isCovered: false,
    placement: 'front',
  },
  coveredTerracePlaceholder: {
    label: 'Covered terrace placeholder',
    deckDepth: 24,
    deckWidth: 74,
    enabled: true,
    isCovered: true,
    placement: 'front',
  },
};

export const MODULAR_HOME_WINDOW_PACKAGE_VISUALS: Record<ModularHomeWindowPackageOption, ModularHomeWindowPackageVisual> = {
  standardWindows: {
    label: 'Standard glazing',
    glassColor: '#93c5fd',
    trimColor: '#d7b074',
    widthMultiplier: 1,
    heightMultiplier: 1,
    sideDepthMultiplier: 1,
    reviewNote: 'Baseline window module package for preview pricing.',
  },
  panoramicWindows: {
    label: 'Panoramic glazing',
    glassColor: '#bae6fd',
    trimColor: '#e0f2fe',
    widthMultiplier: 1.42,
    heightMultiplier: 1.12,
    sideDepthMultiplier: 1.18,
    reviewNote: 'Panoramic glazing requires structural, solar-gain and transport review.',
  },
  cornerGlazing: {
    label: 'Corner glazing',
    glassColor: '#cffafe',
    trimColor: '#67e8f9',
    widthMultiplier: 1.24,
    heightMultiplier: 1.08,
    sideDepthMultiplier: 1.42,
    reviewNote: 'Corner glazing requires production opening and thermal bridge review.',
  },
  compactPrivacy: {
    label: 'Compact/privacy glazing',
    glassColor: '#cbd5e1',
    trimColor: '#94a3b8',
    widthMultiplier: 0.76,
    heightMultiplier: 0.86,
    sideDepthMultiplier: 0.78,
    reviewNote: 'Privacy glazing keeps openings smaller for compact/service-oriented layouts.',
  },
};

export const MODULAR_HOME_DOOR_PACKAGE_VISUALS: Record<ModularHomeDoorPackageOption, ModularHomeDoorPackageVisual> = {
  standardEntry: {
    label: 'Standard entry',
    doorColor: '#6b3f1f',
    glassColor: '#bfdbfe',
    widthMultiplier: 1,
    hasGlassPanel: false,
    reviewNote: 'Baseline entry door package for preview pricing.',
  },
  terraceSlider: {
    label: 'Terrace slider',
    doorColor: '#334155',
    glassColor: '#bae6fd',
    widthMultiplier: 1.42,
    hasGlassPanel: true,
    reviewNote: 'Terrace slider requires threshold, drainage and weatherproofing review.',
  },
  premiumGlazedEntry: {
    label: 'Premium glazed entry',
    doorColor: '#1f2937',
    glassColor: '#e0f2fe',
    widthMultiplier: 1.16,
    hasGlassPanel: true,
    reviewNote: 'Premium glazed entry requires thermal, security and final hardware review.',
  },
};

let currentModularHomeConfig: ModularHomeConfiguratorState = DEFAULT_MODULAR_HOME_CONFIG;
const modularHomeConfigListeners = new Set<() => void>();
let currentModularHomeViewMode: ModularHomeViewModeOption = DEFAULT_MODULAR_HOME_VIEW_MODE;
const modularHomeViewModeListeners = new Set<() => void>();

function emitModularHomeConfigChange() {
  for (const listener of modularHomeConfigListeners) {
    listener();
  }
}

function subscribeModularHomeConfig(listener: () => void) {
  modularHomeConfigListeners.add(listener);

  return () => {
    modularHomeConfigListeners.delete(listener);
  };
}

function emitModularHomeViewModeChange() {
  for (const listener of modularHomeViewModeListeners) {
    listener();
  }
}

function subscribeModularHomeViewMode(listener: () => void) {
  modularHomeViewModeListeners.add(listener);

  return () => {
    modularHomeViewModeListeners.delete(listener);
  };
}

function getModularHomeConfigSnapshot() {
  return currentModularHomeConfig;
}

function getModularHomeViewModeSnapshot() {
  return currentModularHomeViewMode;
}

export function getModularHomeConfigLabel<Key extends keyof ModularHomeConfiguratorState>(
  groupKey: Key,
  value: ModularHomeConfiguratorState[Key],
): string {
  const group = MODULAR_HOME_CONFIGURATOR_GROUPS.find((item) => item.key === groupKey);
  const option = group?.options.find((item) => item.key === value);
  return option?.label ?? String(value);
}

export function getModularHomeConfigSummary(config: ModularHomeConfiguratorState) {
  return {
    template: getModularHomeConfigLabel('template', config.template),
    facade: getModularHomeConfigLabel('facade', config.facade),
    roof: getModularHomeConfigLabel('roof', config.roof),
    terrace: getModularHomeConfigLabel('terrace', config.terrace),
    finishLevel: getModularHomeConfigLabel('finishLevel', config.finishLevel),
    windowPackage: getModularHomeConfigLabel('windowPackage', config.windowPackage),
    doorPackage: getModularHomeConfigLabel('doorPackage', config.doorPackage),
  };
}

export function normalizeModularHomeConfig(
  config: Partial<ModularHomeConfiguratorState>,
): ModularHomeConfiguratorState {
  const rawTerrace = config.terrace as ModularHomeTerraceOption | 'smallTerrace' | undefined;
  const terrace = rawTerrace === 'smallTerrace'
    ? 'frontDeck'
    : rawTerrace;

  return {
    ...DEFAULT_MODULAR_HOME_CONFIG,
    ...config,
    terrace: terrace ?? DEFAULT_MODULAR_HOME_CONFIG.terrace,
  };
}

export function setModularHomeConfigOption<Key extends keyof ModularHomeConfiguratorState>(
  key: Key,
  value: ModularHomeConfiguratorState[Key],
) {
  if (currentModularHomeConfig[key] === value) {
    return;
  }

  currentModularHomeConfig = {
    ...currentModularHomeConfig,
    [key]: value,
  };
  emitModularHomeConfigChange();
}

export function setModularHomeConfig(config: ModularHomeConfiguratorState) {
  currentModularHomeConfig = normalizeModularHomeConfig(config);
  emitModularHomeConfigChange();
}

export function resetModularHomeConfig() {
  currentModularHomeConfig = DEFAULT_MODULAR_HOME_CONFIG;
  emitModularHomeConfigChange();
}

export function getModularHomeViewModeLabel(value: ModularHomeViewModeOption): string {
  return MODULAR_HOME_VIEW_MODE_OPTIONS.find((item) => item.key === value)?.label ?? value;
}

export function getModularHomeViewMode(): ModularHomeViewModeOption {
  return currentModularHomeViewMode;
}

export function setModularHomeViewMode(value: ModularHomeViewModeOption) {
  if (currentModularHomeViewMode === value) {
    return;
  }

  currentModularHomeViewMode = value;
  emitModularHomeViewModeChange();
}

export function resetModularHomeViewMode() {
  currentModularHomeViewMode = DEFAULT_MODULAR_HOME_VIEW_MODE;
  emitModularHomeViewModeChange();
}

export function useModularHomeConfigurator() {
  const config = useSyncExternalStore(
    subscribeModularHomeConfig,
    getModularHomeConfigSnapshot,
    getModularHomeConfigSnapshot,
  );
  const setOption = useCallback(<Key extends keyof ModularHomeConfiguratorState>(
    key: Key,
    value: ModularHomeConfiguratorState[Key],
  ) => setModularHomeConfigOption(key, value), []);
  const setConfig = useCallback((nextConfig: ModularHomeConfiguratorState) => setModularHomeConfig(nextConfig), []);
  const reset = useCallback(() => resetModularHomeConfig(), []);

  return {
    config,
    reset,
    setConfig,
    setOption,
    summary: getModularHomeConfigSummary(config),
  };
}

export function useModularHomeViewMode() {
  const viewMode = useSyncExternalStore(
    subscribeModularHomeViewMode,
    getModularHomeViewModeSnapshot,
    getModularHomeViewModeSnapshot,
  );
  const setViewMode = useCallback((nextMode: ModularHomeViewModeOption) => setModularHomeViewMode(nextMode), []);
  const resetViewMode = useCallback(() => resetModularHomeViewMode(), []);

  return {
    label: getModularHomeViewModeLabel(viewMode),
    resetViewMode,
    setViewMode,
    viewMode,
  };
}
