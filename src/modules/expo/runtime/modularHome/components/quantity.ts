import type { ModularHomeConfiguratorState } from '../modularHomeConfigurator';
import type { ModularHomeModule } from '../modularHomeProducts';
import type { ModularHomeComponent, ModularHomeComponentId } from './types';
import {
  getFacadeBoardQuantityFactor,
  getInteriorFinishQuantityFactor,
  moduleFloorArea,
  moduleWallArea,
} from './manufacturingHelpers';

export function moduleWindowCount(module: ModularHomeModule): number {
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

export function isComponentCompatibleWithModule(
  component: ModularHomeComponent,
  module: ModularHomeModule,
): boolean {
  return component.compatibleModuleTypes.includes(module.type);
}

export function getSelectedWindowComponentId(config: ModularHomeConfiguratorState): ModularHomeComponentId {
  const componentByPackage = {
    standardWindows: 'standard-window-unit',
    panoramicWindows: 'panoramic-window-unit',
    cornerGlazing: 'corner-glazing-unit',
    compactPrivacy: 'privacy-window-unit',
  } as const satisfies Record<ModularHomeConfiguratorState['windowPackage'], ModularHomeComponentId>;

  return componentByPackage[config.windowPackage] ?? 'standard-window-unit';
}

export function getSelectedDoorComponentId(config: ModularHomeConfiguratorState): ModularHomeComponentId {
  const componentByPackage = {
    standardEntry: 'entry-door-unit',
    terraceSlider: 'terrace-slider-door-unit',
    premiumGlazedEntry: 'premium-glazed-entry-door-unit',
  } as const satisfies Record<ModularHomeConfiguratorState['doorPackage'], ModularHomeComponentId>;

  return componentByPackage[config.doorPackage] ?? 'entry-door-unit';
}

export function getWindowQuantityForConfig(
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

export function getDoorQuantityForConfig(
  module: ModularHomeModule,
  moduleQuantity: number,
  config: ModularHomeConfiguratorState,
): number {
  if (config.doorPlacement === 'terraceFacing' && module.type === 'living') {
    return moduleQuantity + 1;
  }

  return moduleQuantity;
}

export function calculateComponentQuantity(
  component: ModularHomeComponent,
  module: ModularHomeModule,
  moduleQuantity: number,
  config: ModularHomeConfiguratorState,
): number {
  if (!isComponentCompatibleWithModule(component, module)) {
    return 0;
  }

  switch (component.category) {
    case 'wallPanel':
      return moduleWallArea(module) * 0.86 * moduleQuantity;
    case 'floorCassette':
    case 'foundationPad':
      return moduleFloorArea(module) * moduleQuantity;
    case 'roofCassette':
      return moduleFloorArea(module) * (component.id === 'pitched-roof-cassette-system' ? 1.18 : 1) * moduleQuantity;
    case 'facadeBoarding':
      return module.dimensions.widthM * module.dimensions.heightM * 4 * moduleQuantity * getFacadeBoardQuantityFactor(config);
    case 'windowUnit':
      return component.id === getSelectedWindowComponentId(config)
        ? getWindowQuantityForConfig(module, config) * moduleQuantity
        : 0;
    case 'doorUnit':
      return component.id === getSelectedDoorComponentId(config) ? getDoorQuantityForConfig(module, moduleQuantity, config) : 0;
    case 'bathroomCore':
      return moduleQuantity;
    case 'kitchenLine':
      if (config.kitchenLine !== 'enabled'
        || !['standardFurniture', 'premiumFurniture', 'kitchenPackage'].includes(config.furniturePackage)) {
        return 0;
      }
      return (component.id === 'family-kitchen-line' ? 4.2 : 2.8) * moduleQuantity;
    case 'terraceDeck':
      return moduleFloorArea(module) * moduleQuantity;
    case 'interiorFinish':
      return moduleWallArea(module) * 0.72 * getInteriorFinishQuantityFactor(config) * moduleQuantity;
    case 'furniturePackage': {
      if (component.id === 'sauna-bench-package') {
        return config.furniturePackage === 'saunaPackage' && module.id === 'sauna-core-module'
          ? moduleQuantity
          : 0;
      }

      if (config.furniturePackage === 'emptyShell') {
        return 0;
      }

      const toggleCount = [
        config.sofa,
        config.table,
        config.bed,
        config.kitchenLine,
        config.wardrobePlaceholder,
      ].filter((value) => value === 'enabled').length;
      const toggleFactor = Math.max(toggleCount / 5, 0);

      if (component.id === 'premium-furniture-package') {
        return config.furniturePackage === 'premiumFurniture' ? moduleQuantity * toggleFactor : 0;
      }

      if (component.id === 'standard-furniture-package') {
        if (config.furniturePackage === 'standardFurniture') {
          return moduleQuantity * toggleFactor;
        }

        if (config.furniturePackage === 'kitchenPackage') {
          return module.type === 'living' ? moduleQuantity * Math.max([
            config.table,
            config.kitchenLine,
          ].filter((value) => value === 'enabled').length / 2, 0) : 0;
        }

        if (config.furniturePackage === 'bathroomPackage') {
          return module.type === 'bathroomCore' ? moduleQuantity : 0;
        }
      }

      return 0;
    }
    default:
      return 0;
  }
}
