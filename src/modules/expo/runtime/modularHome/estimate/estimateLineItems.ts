import type { ModularHomeConfiguratorState } from '../modularHomeConfigurator';
import {
  createInstallationPricingBreakdown,
  createModulePricingBreakdown,
  createOptionPricingBreakdown,
  createTransportPricingBreakdown,
  sumModularHomePricingBreakdowns,
  type ModularHomePricingBreakdown,
} from '../modularHomePricing';
import {
  getModulesForProduct,
  getSelectedModularHomeOptions,
  type ModularHomeModule,
  type ModularHomeOption,
} from '../modularHomeProducts';
import { MODULAR_HOME_ESTIMATE_CONFIG, type ModularHomeEstimateAdjustment, type ModularHomeEstimateLineItem, type ModularHomeEstimateLineItemCategory } from './estimateTypes';
import { roundToNearestFifty } from './estimateFormatting';
import { createEstimateMetadata } from './estimateMetadata';

export function createModulePackagePricingBreakdown(
  amount: number,
  modules: readonly ModularHomeModule[],
): ModularHomePricingBreakdown {
  if (amount <= 0 || modules.length === 0) {
    return createModulePricingBreakdown(amount, 'living');
  }

  const modulePriceTotal = modules.reduce((total, module) => total + Math.max(module.price, 0), 0);
  const moduleBreakdowns = modules.map((module) => {
    const weight = modulePriceTotal > 0 ? Math.max(module.price, 0) / modulePriceTotal : 1 / modules.length;

    return createModulePricingBreakdown(amount * weight, module.type);
  });

  return sumModularHomePricingBreakdowns(moduleBreakdowns);
}

export function getOptionLineItemCategory(option: ModularHomeOption): ModularHomeEstimateLineItemCategory {
  if (option.group === 'finish') {
    return 'finish';
  }

  if (
    option.group === 'facade'
    || option.group === 'roof'
    || option.group === 'terrace'
    || option.group === 'windowPackage'
    || option.group === 'doorPackage'
    || option.group === 'windowPlacement'
    || option.group === 'doorPlacement'
    || option.group === 'facadeBoardOrientation'
    || option.group === 'facadeBoardWidth'
    || option.group === 'facadeBoardProfile'
    || option.group === 'facadeBoardSpacing'
    || option.group === 'trimColor'
    || option.group === 'roofEdgeColor'
    || option.group === 'roofGutterStyle'
    || option.group === 'windowFrameColor'
    || option.group === 'windowFrameType'
    || option.group === 'interiorWallFinish'
    || option.group === 'floorFinish'
    || option.group === 'interiorFloorStyle'
    || option.group === 'wallPanelStyle'
    || option.group === 'furniturePackage'
    || option.group === 'sofa'
    || option.group === 'table'
    || option.group === 'bed'
    || option.group === 'kitchenLine'
    || option.group === 'wardrobePlaceholder'
  ) {
    return option.group;
  }

  return 'facade';
}

export function getOptionLineItemLabel(option: ModularHomeOption): string {
  const labelByGroup = {
    doorPackage: 'Door package',
    doorPlacement: 'Door placement',
    facade: 'Facade',
    facadeBoardOrientation: 'Facade board orientation',
    facadeBoardProfile: 'Facade board profile',
    facadeBoardSpacing: 'Facade board spacing',
    facadeBoardWidth: 'Facade board width',
    finish: 'Finish level',
    floorFinish: 'Floor finish',
    furniturePackage: 'Furniture package',
    sofa: 'Sofa',
    table: 'Table',
    bed: 'Bed',
    kitchenLine: 'Kitchen line',
    wardrobePlaceholder: 'Wardrobe placeholder',
    interiorFloorStyle: 'Interior floor style',
    interiorWallFinish: 'Interior wall finish',
    kitchenFinish: 'Kitchen finish',
    furnitureMood: 'Furniture mood',
    interiorZoneFocus: 'Interior zone focus',
    roof: 'Roof',
    roofEdgeColor: 'Roof edge color',
    roofGutterStyle: 'Roof edge/gutter style',
    terrace: 'Terrace',
    trimColor: 'Trim color',
    windowFrameColor: 'Window frame color',
    windowFrameType: 'Window frame type',
    windowPackage: 'Window package',
    windowPlacement: 'Window placement',
    wallPanelStyle: 'Wall panel style',
  } as const satisfies Record<ModularHomeOption['group'], string>;

  return `${labelByGroup[option.group]}: ${option.label}`;
}

export function createBaseLineItems(
  basePrice: number,
  productId: string | undefined,
): readonly ModularHomeEstimateLineItem[] {
  if (!productId) {
    const label = 'Base product module package';

    return [
      {
        amount: basePrice,
        category: 'baseProduct',
        id: 'base-product',
        label,
        pricingBreakdown: createModulePricingBreakdown(basePrice, 'living'),
        ...createEstimateMetadata({
          confidence: 'packageFixed',
          label,
          priceSource: 'internalPreview',
          sectionId: 'modulePackage',
          sourceCategory: 'baseProduct',
        }),
      },
    ];
  }

  const baseModules = getModulesForProduct(productId);
  const bathroomCoreTotal = baseModules
    .filter((module) => module.type === 'bathroomCore')
    .reduce((total, module) => total + module.price, 0);
  const baseModuleTotal = Math.max(basePrice - bathroomCoreTotal, 0);
  const moduleNote = baseModules
    .filter((module) => module.type !== 'bathroomCore')
    .map((module) => module.notes)
    .join(' ');
  const nonBathroomModules = baseModules.filter((module) => module.type !== 'bathroomCore');
  const baseLabel = 'Base product module package';
  const bathroomLabel = 'Bathroom core allowance';
  const bathroomNote = bathroomCoreTotal > 0 ? 'Wet-room/service core placeholder included in the structured preview.' : undefined;

  return [
    {
      amount: baseModuleTotal,
      category: 'baseProduct',
      id: `${productId}-base-modules`,
      label: baseLabel,
      note: moduleNote || undefined,
      pricingBreakdown: createModulePackagePricingBreakdown(baseModuleTotal, nonBathroomModules),
      ...createEstimateMetadata({
        confidence: 'packageFixed',
        label: baseLabel,
        note: moduleNote || undefined,
        priceSource: 'internalPreview',
        sectionId: 'modulePackage',
        sourceCategory: 'baseProduct',
      }),
    },
    {
      amount: bathroomCoreTotal,
      category: 'bathroomCore',
      id: `${productId}-bathroom-core`,
      label: bathroomLabel,
      note: bathroomNote,
      pricingBreakdown: createModulePricingBreakdown(bathroomCoreTotal, 'bathroomCore'),
      ...createEstimateMetadata({
        label: bathroomLabel,
        note: bathroomNote,
        sectionId: 'modulePackage',
        sourceCategory: 'bathroomCore',
      }),
    },
  ];
}

export function createOptionLineItems(config: ModularHomeConfiguratorState): readonly ModularHomeEstimateLineItem[] {
  return getSelectedModularHomeOptions(config).map((option) => {
    const category = getOptionLineItemCategory(option);
    const label = getOptionLineItemLabel(option);
    const note = option.priceDelta === 0 ? 'Included in selected package.' : undefined;

    return {
      amount: option.priceDelta,
      category,
      id: option.id,
      label,
      note,
      pricingBreakdown: createOptionPricingBreakdown(option.priceDelta, option.group),
      ...createEstimateMetadata({
        label,
        note,
        sectionId: category === 'terrace'
          ? 'terraceExtensions'
          : category === 'finish'
            ? 'finishPackage'
            : 'materials',
        sourceCategory: category,
      }),
    };
  });
}

export function createOptionalServices(
  floorAreaM2: number,
  transportModuleCount: number,
): readonly ModularHomeEstimateLineItem[] {
  const transportAmount = roundToNearestFifty(
    MODULAR_HOME_ESTIMATE_CONFIG.transportBase
    + transportModuleCount * MODULAR_HOME_ESTIMATE_CONFIG.transportPerModule,
  );
  const installationAmount = roundToNearestFifty(
    floorAreaM2 * MODULAR_HOME_ESTIMATE_CONFIG.installationPerM2,
  );

  return [
    {
      amount: transportAmount,
      category: 'transport',
      id: 'transport-placeholder',
      isPlaceholder: true,
      label: 'Transport placeholder',
      note: 'Preview allowance only. Final transport depends on route, crane access and delivery count.',
      pricingBreakdown: createTransportPricingBreakdown(transportAmount),
      ...createEstimateMetadata({
        confidence: 'siteDependent',
        isPlaceholder: true,
        label: 'Transport placeholder',
        note: 'Preview allowance only. Final transport depends on route, crane access and delivery count.',
        sectionId: 'transportPlaceholder',
        sourceCategory: 'transport',
      }),
    },
    {
      amount: installationAmount,
      category: 'installation',
      id: 'installation-placeholder',
      isPlaceholder: true,
      label: 'Installation placeholder',
      note: 'Preview allowance only. Final installation depends on foundation, utilities and site readiness.',
      pricingBreakdown: createInstallationPricingBreakdown(installationAmount),
      ...createEstimateMetadata({
        confidence: 'siteDependent',
        isPlaceholder: true,
        label: 'Installation placeholder',
        note: 'Preview allowance only. Final installation depends on foundation, utilities and site readiness.',
        sectionId: 'installationPlaceholder',
        sourceCategory: 'installation',
      }),
    },
  ];
}

export function createAdjustment(item: ModularHomeEstimateLineItem): ModularHomeEstimateAdjustment | null {
  return item.amount === 0 ? null : {
    amount: item.amount,
    id: item.id,
    label: item.label,
  };
}
