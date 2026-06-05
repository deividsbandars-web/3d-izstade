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
export type ModularHomeTerraceOption = 'smallTerrace' | 'none' | 'extendedTerrace';
export type ModularHomeFinishLevelOption = 'standard' | 'shell' | 'premium';

export type ModularHomeConfiguratorState = {
  template: ModularHomeTemplateOption;
  facade: ModularHomeFacadeOption;
  roof: ModularHomeRoofOption;
  terrace: ModularHomeTerraceOption;
  finishLevel: ModularHomeFinishLevelOption;
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
};

export const DEFAULT_MODULAR_HOME_CONFIG: ModularHomeConfiguratorState = {
  template: DEFAULT_MODULAR_HOME_TEMPLATE_ID,
  facade: 'naturalTimber',
  roof: 'pitched',
  terrace: 'smallTerrace',
  finishLevel: 'standard',
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
  { key: 'smallTerrace', label: 'Small terrace' },
  { key: 'extendedTerrace', label: 'Extended terrace' },
] as const satisfies readonly ModularHomeConfiguratorOption<'terrace'>[];

export const MODULAR_HOME_FINISH_LEVEL_OPTIONS = [
  { key: 'shell', label: 'Empty shell' },
  { key: 'standard', label: 'Standard furnished preview' },
  { key: 'premium', label: 'Premium interior preview' },
] as const satisfies readonly ModularHomeConfiguratorOption<'finishLevel'>[];

export const MODULAR_HOME_CONFIGURATOR_GROUPS = [
  { key: 'template', label: 'Home template', options: MODULAR_HOME_TEMPLATE_OPTIONS },
  { key: 'facade', label: 'Facade', options: MODULAR_HOME_FACADE_OPTIONS },
  { key: 'roof', label: 'Roof', options: MODULAR_HOME_ROOF_OPTIONS },
  { key: 'terrace', label: 'Terrace', options: MODULAR_HOME_TERRACE_OPTIONS },
  { key: 'finishLevel', label: 'Finish level', options: MODULAR_HOME_FINISH_LEVEL_OPTIONS },
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
  },
  smallTerrace: {
    label: 'Small terrace',
    deckDepth: 18,
    deckWidth: 62,
    enabled: true,
  },
  extendedTerrace: {
    label: 'Extended terrace',
    deckDepth: 32,
    deckWidth: 88,
    enabled: true,
  },
};

let currentModularHomeConfig: ModularHomeConfiguratorState = DEFAULT_MODULAR_HOME_CONFIG;
const modularHomeConfigListeners = new Set<() => void>();

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

function getModularHomeConfigSnapshot() {
  return currentModularHomeConfig;
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
  currentModularHomeConfig = config;
  emitModularHomeConfigChange();
}

export function resetModularHomeConfig() {
  currentModularHomeConfig = DEFAULT_MODULAR_HOME_CONFIG;
  emitModularHomeConfigChange();
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
