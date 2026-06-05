import { useCallback, useSyncExternalStore } from 'react';
import {
  DEFAULT_MODULAR_HOME_TEMPLATE_ID,
  MODULAR_HOME_TEMPLATE_OPTIONS,
  type ModularHomeTemplateId,
} from './modularHomeConfig';

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
  wallColor: string;
  sideColor: string;
  trimColor: string;
};

export type ModularHomeRoofVisual = {
  label: string;
  roofColor: string;
  accentColor: string;
  isGreenRoof: boolean;
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
  { key: 'shell', label: 'Shell' },
  { key: 'standard', label: 'Standard' },
  { key: 'premium', label: 'Premium' },
] as const satisfies readonly ModularHomeConfiguratorOption<'finishLevel'>[];

export const MODULAR_HOME_CONFIGURATOR_GROUPS = [
  { key: 'template', label: 'Home template', options: MODULAR_HOME_TEMPLATE_OPTIONS },
  { key: 'facade', label: 'Facade', options: MODULAR_HOME_FACADE_OPTIONS },
  { key: 'roof', label: 'Roof', options: MODULAR_HOME_ROOF_OPTIONS },
  { key: 'terrace', label: 'Terrace', options: MODULAR_HOME_TERRACE_OPTIONS },
  { key: 'finishLevel', label: 'Finish level', options: MODULAR_HOME_FINISH_LEVEL_OPTIONS },
] as const satisfies readonly ModularHomeConfiguratorGroup[];

export const MODULAR_HOME_FACADE_VISUALS: Record<ModularHomeFacadeOption, ModularHomeFacadeVisual> = {
  naturalTimber: {
    label: 'Natural timber',
    wallColor: '#b98245',
    sideColor: '#9a6a3c',
    trimColor: '#f6d7a7',
  },
  darkThermoWood: {
    label: 'Dark thermo wood',
    wallColor: '#3b2a1d',
    sideColor: '#271a12',
    trimColor: '#d8b17c',
  },
  lightPainted: {
    label: 'Light painted',
    wallColor: '#eadcc8',
    sideColor: '#c9b79e',
    trimColor: '#7c4f2d',
  },
};

export const MODULAR_HOME_ROOF_VISUALS: Record<ModularHomeRoofOption, ModularHomeRoofVisual> = {
  pitched: {
    label: 'Pitched',
    roofColor: '#273449',
    accentColor: '#1e293b',
    isGreenRoof: false,
  },
  flat: {
    label: 'Flat',
    roofColor: '#243246',
    accentColor: '#111827',
    isGreenRoof: false,
  },
  greenRoofPlaceholder: {
    label: 'Green roof placeholder',
    roofColor: '#2f5137',
    accentColor: '#7bbf58',
    isGreenRoof: true,
  },
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
  const reset = useCallback(() => resetModularHomeConfig(), []);

  return {
    config,
    reset,
    setOption,
    summary: getModularHomeConfigSummary(config),
  };
}
