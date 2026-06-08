import type { ModularHomeConfiguratorState } from './modularHomeConfigurator';
import {
  getModularHomeProductForConfig,
  getModulesForConfig,
  getModuleQuantitySummary,
  type ModularHomeModule,
} from './modularHomeProducts';

export type ModularHomeQuantityTakeoff = {
  bathroomCoreCount: number;
  disclaimer: string;
  doorCount: number;
  exteriorWallAreaM2: number;
  facadeAreaM2: number;
  furniturePackageItemCount: number;
  grossFloorAreaM2: number;
  interiorPartitionEstimateM2: number;
  moduleCount: number;
  roofAreaM2: number;
  saunaCoreCount: number;
  terraceAreaM2: number;
  transportModuleCount: number;
  windowCount: number;
};

export const MODULAR_HOME_QUANTITY_TAKEOFF_DISCLAIMER = 'Preview quantity takeoff · approximate only';

function roundQuantity(value: number): number {
  return Math.round(value * 100) / 100;
}

function moduleFloorArea(module: ModularHomeModule): number {
  return module.dimensions.widthM * module.dimensions.lengthM;
}

function moduleWallArea(module: ModularHomeModule): number {
  return 2 * (module.dimensions.widthM + module.dimensions.lengthM) * module.dimensions.heightM;
}

function moduleWindowCount(module: ModularHomeModule): number {
  if (module.id === 'bathroom-core-module') {
    return 1;
  }

  if (module.id === 'family-living-module') {
    return 4;
  }

  if (module.type === 'living') {
    return 3;
  }

  if (module.type === 'bedroom') {
    return 2;
  }

  return 1;
}

function moduleWindowCountForConfig(
  module: ModularHomeModule,
  config: ModularHomeConfiguratorState,
): number {
  let baseCount = moduleWindowCount(module);

  if (config.windowPackage === 'compactPrivacy') {
    baseCount = Math.max(1, baseCount - 1);
  }

  if (config.windowPackage === 'cornerGlazing' && module.type === 'living') {
    baseCount += 1;
  }

  if (config.windowPlacement === 'frontPanoramic' && module.type === 'living') {
    baseCount += 1;
  }

  if (config.windowPlacement === 'sidePrivacy') {
    baseCount = Math.max(1, baseCount - 1);
  }

  if (config.windowPlacement === 'cornerFeature' && (module.type === 'living' || module.type === 'bedroom')) {
    baseCount += 1;
  }

  return baseCount;
}

function moduleDoorCountForConfig(
  module: ModularHomeModule,
  config: ModularHomeConfiguratorState,
): number {
  const baseCount = module.type === 'living' || module.type === 'technical' || module.id === 'sauna-core-module' ? 1 : 0;

  if (baseCount > 0 && config.doorPlacement === 'terraceFacing' && module.type === 'living') {
    return baseCount + 1;
  }

  return baseCount;
}

function moduleInteriorPartitionFactor(module: ModularHomeModule): number {
  if (module.type === 'bathroomCore') {
    return 0.72;
  }

  if (module.id === 'sauna-core-module') {
    return 0.54;
  }

  if (module.type === 'living') {
    return 0.38;
  }

  if (module.type === 'bedroom') {
    return 0.46;
  }

  return 0.3;
}

function moduleQuantityLookup(config: ModularHomeConfiguratorState): Map<string, number> {
  const product = getModularHomeProductForConfig(config);

  if (!product) {
    return new Map();
  }

  return new Map(getModuleQuantitySummary(product.id).map((item) => [item.moduleId, item.quantity]));
}

function getModuleQuantity(module: ModularHomeModule, quantityByModuleId: Map<string, number>): number {
  if (module.type === 'roof' || module.type === 'facade' || module.type === 'terrace') {
    return 1;
  }

  return quantityByModuleId.get(module.id) ?? 1;
}

export function calculateModularHomeQuantities(
  config: ModularHomeConfiguratorState,
): ModularHomeQuantityTakeoff {
  const product = getModularHomeProductForConfig(config);
  const quantityByModuleId = moduleQuantityLookup(config);
  const modules = getModulesForConfig(config);
  let grossFloorAreaM2 = 0;
  let exteriorWallAreaM2 = 0;
  let interiorPartitionEstimateM2 = 0;
  let roofAreaM2 = 0;
  let facadeAreaM2 = 0;
  let terraceAreaM2 = 0;
  let windowCount = 0;
  let doorCount = 0;
  let bathroomCoreCount = 0;
  let saunaCoreCount = 0;
  let furniturePackageItemCount = 0;

  for (const module of modules) {
    const quantity = getModuleQuantity(module, quantityByModuleId);
    const floorArea = moduleFloorArea(module) * quantity;

    if (module.type === 'terrace') {
      terraceAreaM2 += floorArea;
      continue;
    }

    if (module.type === 'roof') {
      const roofBaseArea = product
        ? product.footprint.widthM * product.footprint.lengthM
        : floorArea;
      roofAreaM2 += roofBaseArea * (module.id === 'roof-pitched-module' ? 1.18 : 1);
      continue;
    }

    if (module.type === 'facade') {
      facadeAreaM2 += product
        ? 2 * (product.footprint.widthM + product.footprint.lengthM) * product.ceilingHeightM
        : module.dimensions.widthM * module.dimensions.heightM * 4 * quantity;
      continue;
    }

    grossFloorAreaM2 += floorArea;
    exteriorWallAreaM2 += moduleWallArea(module) * 0.86 * quantity;
    interiorPartitionEstimateM2 += moduleWallArea(module) * moduleInteriorPartitionFactor(module) * quantity;
    windowCount += moduleWindowCountForConfig(module, config) * quantity;
    doorCount += moduleDoorCountForConfig(module, config) * quantity;

    if (module.type === 'bathroomCore') {
      bathroomCoreCount += quantity;
    }

    if (module.id === 'sauna-core-module') {
      saunaCoreCount += quantity;
    }

    if (config.finishLevel === 'standard' || config.finishLevel === 'premium' || module.id === 'sauna-core-module') {
      if (module.type === 'living' || module.type === 'bedroom' || module.id === 'sauna-core-module') {
        furniturePackageItemCount += quantity;
      }
    }
  }

  return {
    bathroomCoreCount,
    disclaimer: MODULAR_HOME_QUANTITY_TAKEOFF_DISCLAIMER,
    doorCount,
    exteriorWallAreaM2: roundQuantity(exteriorWallAreaM2),
    facadeAreaM2: roundQuantity(facadeAreaM2),
    furniturePackageItemCount,
    grossFloorAreaM2: roundQuantity(grossFloorAreaM2 || product?.floorAreaM2 || 0),
    interiorPartitionEstimateM2: roundQuantity(interiorPartitionEstimateM2),
    moduleCount: product?.moduleInstances.reduce((total, instance) => total + instance.quantity, 0) ?? 0,
    roofAreaM2: roundQuantity(roofAreaM2),
    saunaCoreCount,
    terraceAreaM2: roundQuantity(terraceAreaM2),
    transportModuleCount: product?.transportModuleCount ?? 0,
    windowCount,
  };
}
