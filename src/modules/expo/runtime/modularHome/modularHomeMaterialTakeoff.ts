import type { ModularHomeConfiguratorState } from './modularHomeConfigurator';
import {
  MODULAR_HOME_FACADE_BOARD_ORIENTATION_VISUALS,
  MODULAR_HOME_FACADE_BOARD_PROFILE_VISUALS,
  MODULAR_HOME_FACADE_BOARD_SPACING_VISUALS,
  MODULAR_HOME_FACADE_BOARD_WIDTH_VISUALS,
  MODULAR_HOME_INTERIOR_FLOOR_STYLE_VISUALS,
  MODULAR_HOME_WINDOW_PACKAGE_VISUALS,
} from './modularHomeConfigurator';
import { calculateOpeningSchedule } from './modularHomeComponents';
import { calculateModularHomeQuantities } from './modularHomeQuantities';
import {
  getModularHomeDimensionPresetForConfig,
  getModularHomeLayoutVariantForConfig,
  getModularHomeProductForConfig,
  getModulesForConfig,
} from './modularHomeProducts';

export type ModularHomeMaterialTakeoff = {
  bathroomCoreCount: number;
  disclaimer: string;
  doorCount: number;
  exteriorWallAreaM2: number;
  facadeAreaM2: number;
  facadeBoardLinearM: number;
  floorFinishAreaM2: number;
  furnitureItemCount: number;
  grossFloorAreaM2: number;
  interiorWallFinishAreaM2: number;
  interiorWallPartitionAreaM2: number;
  kitchenLineCount: number;
  moduleCount: number;
  notes: readonly string[];
  roofAreaM2: number;
  terraceDeckingAreaM2: number;
  totalWindowAreaM2: number;
  windowCount: number;
};

export const MODULAR_HOME_MATERIAL_TAKEOFF_DISCLAIMER = 'Preview material takeoff · estimate only, not an engineering quantity survey.';

function roundTakeoff(value: number): number {
  return Math.round(value * 100) / 100;
}

function getFinishLevelAreaFactor(config: ModularHomeConfiguratorState): number {
  if (config.finishLevel === 'shell') {
    return 0.22;
  }

  if (config.finishLevel === 'premium') {
    return 1.08;
  }

  return 1;
}

function getFacadeBoardBaseCoverageWidthM(config: ModularHomeConfiguratorState): number {
  switch (config.facadeBoardWidth) {
    case 'narrow':
      return 0.118;
    case 'wide':
      return 0.168;
    default:
      return 0.145;
  }
}

function getTerraceAreaFactor(config: ModularHomeConfiguratorState): number {
  switch (config.terrace) {
    case 'coveredTerracePlaceholder':
      return 1.12;
    case 'extendedTerrace':
      return 1.08;
    default:
      return 1;
  }
}

function getRoofAreaFactor(config: ModularHomeConfiguratorState): number {
  if (config.roof === 'greenRoofPlaceholder') {
    return 1.08;
  }

  return 1;
}

function getKitchenLineCount(config: ModularHomeConfiguratorState): number {
  if (config.kitchenLine !== 'enabled') {
    return 0;
  }

  const livingModuleCount = getModulesForConfig(config).filter((module) => module.type === 'living').length;
  return Math.max(1, livingModuleCount);
}

function createTakeoffNotes(config: ModularHomeConfiguratorState): readonly string[] {
  const notes: string[] = [];
  const product = getModularHomeProductForConfig(config);
  const layoutVariant = getModularHomeLayoutVariantForConfig(config);
  const dimensionPreset = getModularHomeDimensionPresetForConfig(config);

  if (product && dimensionPreset) {
    notes.push(`${product.name}: ${dimensionPreset.summaryNote}`);
  }

  if (layoutVariant) {
    notes.push(layoutVariant.estimateNote);
  }

  if (config.windowPlacement === 'frontPanoramic' || config.windowPlacement === 'cornerFeature') {
    notes.push('Panoramic/corner glazing increases preview opening area and still requires engineering review.');
  }

  if (config.terrace === 'coveredTerracePlaceholder') {
    notes.push('Covered terrace quantity includes placeholder roof/deck allowance and requires final support review.');
  } else if (config.terrace !== 'none') {
    notes.push('Terrace decking area is included as a preview extension allowance.');
  }

  if (config.furniturePackage !== 'emptyShell') {
    notes.push(`Furniture package allowance follows the selected ${config.furniturePackage} preview package.`);
  }

  return notes;
}

export function calculateMaterialTakeoff(
  config: ModularHomeConfiguratorState,
): ModularHomeMaterialTakeoff {
  const quantities = calculateModularHomeQuantities(config);
  const openingSchedule = calculateOpeningSchedule(config);
  const dimensionPreset = getModularHomeDimensionPresetForConfig(config);
  const facadeOrientationVisual = MODULAR_HOME_FACADE_BOARD_ORIENTATION_VISUALS[config.facadeBoardOrientation];
  const facadeWidthVisual = MODULAR_HOME_FACADE_BOARD_WIDTH_VISUALS[config.facadeBoardWidth];
  const facadeProfileVisual = MODULAR_HOME_FACADE_BOARD_PROFILE_VISUALS[config.facadeBoardProfile];
  const facadeSpacingVisual = MODULAR_HOME_FACADE_BOARD_SPACING_VISUALS[config.facadeBoardSpacing];
  const floorStyleVisual = MODULAR_HOME_INTERIOR_FLOOR_STYLE_VISUALS[config.interiorFloorStyle];
  const windowPackageVisual = MODULAR_HOME_WINDOW_PACKAGE_VISUALS[config.windowPackage];
  const finishLevelFactor = getFinishLevelAreaFactor(config);
  const facadeBoardLinearM = quantities.facadeAreaM2 > 0
    ? (
      quantities.facadeAreaM2
      / getFacadeBoardBaseCoverageWidthM(config)
      * facadeOrientationVisual.quantityFactor
      * facadeWidthVisual.quantityFactor
      * facadeProfileVisual.quantityFactor
      * facadeSpacingVisual.spacingFactor
    )
    : 0;
  const totalWindowAreaM2 = openingSchedule
    .filter((item) => item.type === 'window')
    .reduce((total, item) => total + ((item.widthMm / 1000) * (item.heightMm / 1000) * item.quantity), 0);
  const doorCount = openingSchedule
    .filter((item) => item.type !== 'window')
    .reduce((total, item) => total + item.quantity, 0);

  return {
    bathroomCoreCount: quantities.bathroomCoreCount,
    disclaimer: MODULAR_HOME_MATERIAL_TAKEOFF_DISCLAIMER,
    doorCount,
    exteriorWallAreaM2: roundTakeoff(quantities.exteriorWallAreaM2),
    facadeAreaM2: roundTakeoff(quantities.facadeAreaM2),
    facadeBoardLinearM: roundTakeoff(facadeBoardLinearM),
    floorFinishAreaM2: roundTakeoff(quantities.grossFloorAreaM2 * floorStyleVisual.quantityFactor * finishLevelFactor),
    furnitureItemCount: quantities.furniturePackageItemCount,
    grossFloorAreaM2: roundTakeoff(quantities.grossFloorAreaM2),
    interiorWallFinishAreaM2: roundTakeoff(quantities.interiorPartitionEstimateM2 * finishLevelFactor),
    interiorWallPartitionAreaM2: roundTakeoff(quantities.interiorPartitionEstimateM2),
    kitchenLineCount: getKitchenLineCount(config),
    moduleCount: dimensionPreset?.moduleCount ?? quantities.moduleCount,
    notes: createTakeoffNotes(config),
    roofAreaM2: roundTakeoff(quantities.roofAreaM2 * getRoofAreaFactor(config)),
    terraceDeckingAreaM2: roundTakeoff(quantities.terraceAreaM2 * getTerraceAreaFactor(config)),
    totalWindowAreaM2: roundTakeoff(totalWindowAreaM2 * windowPackageVisual.widthMultiplier * windowPackageVisual.heightMultiplier),
    windowCount: Math.max(0, quantities.windowCount + (dimensionPreset?.windowCountDelta ?? 0)),
  };
}
