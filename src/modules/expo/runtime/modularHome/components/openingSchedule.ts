import type { ModularHomeConfiguratorState } from '../modularHomeConfigurator';
import {
  getModularHomeDimensionPresetForConfig,
  getModularHomeLayoutVariantForConfig,
  getModularHomeProductForConfig,
} from '../modularHomeProducts';
import { getComponentById } from './catalog';
import { roundMoney } from './manufacturingHelpers';
import type {
  ModularHomeOpeningScheduleItem,
  ModularHomeOpeningScheduleSummary,
  ModularHomeOpeningType,
  ModularHomeOpeningWallSide,
} from './types';
import { getSelectedDoorComponentId, getSelectedWindowComponentId } from './quantity';

function getWindowOpeningBase(
  config: ModularHomeConfiguratorState,
  wallSide: ModularHomeOpeningWallSide,
): {
  frameType: string;
  glazingType: string;
  heightMm: number;
  reviewRequirement: string | null;
  unitCodePlaceholder: string;
  widthMm: number;
} {
  const frameType = config.windowFrameType;
  let widthMm = 1200;
  let heightMm = 1500;
  let glazingType = 'standard';
  let reviewRequirement: string | null = null;
  let unitCodePlaceholder = 'WIN-STD';

  if (config.windowPackage === 'compactPrivacy' || config.windowPlacement === 'sidePrivacy') {
    widthMm = wallSide === 'front' ? 900 : 800;
    heightMm = wallSide === 'front' ? 1200 : 1000;
    glazingType = 'privacy';
    unitCodePlaceholder = 'WIN-PRIV';
  } else if (config.windowPackage === 'panoramicWindows' || config.windowPlacement === 'frontPanoramic') {
    widthMm = wallSide === 'front' ? 1800 : 1400;
    heightMm = 2100;
    glazingType = 'panoramic';
    reviewRequirement = 'Panoramic glazing requires engineering and weatherproofing review.';
    unitCodePlaceholder = 'WIN-PANO';
  } else if (config.windowPackage === 'cornerGlazing' || config.windowPlacement === 'cornerFeature') {
    widthMm = wallSide === 'front' ? 1600 : 1400;
    heightMm = 2100;
    glazingType = 'cornerFeature';
    reviewRequirement = 'Corner glazing requires structural review and opening coordination.';
    unitCodePlaceholder = 'WIN-CORNER';
  }

  return {
    frameType,
    glazingType,
    heightMm,
    reviewRequirement,
    unitCodePlaceholder,
    widthMm,
  };
}

function getDoorOpeningBase(
  config: ModularHomeConfiguratorState,
  openingType: Extract<ModularHomeOpeningType, 'exteriorDoor' | 'terraceDoor' | 'interiorDoorPlaceholder'>,
): {
  frameType: string;
  glazingType: string;
  heightMm: number;
  reviewRequirement: string | null;
  unitCodePlaceholder: string;
  widthMm: number;
} {
  if (openingType === 'interiorDoorPlaceholder') {
    return {
      frameType: 'interior-placeholder',
      glazingType: 'opaque-placeholder',
      heightMm: 2040,
      reviewRequirement: 'Interior doors remain a placeholder only in the web preview.',
      unitCodePlaceholder: 'IDR-PLACEHOLDER',
      widthMm: 820,
    };
  }

  if (config.doorPackage === 'terraceSlider' || openingType === 'terraceDoor') {
    return {
      frameType: 'sliding-frame',
      glazingType: 'full-height-slider',
      heightMm: 2100,
      reviewRequirement: config.doorPlacement === 'terraceFacing'
        ? 'Terrace-facing door placement requires terrace/weatherproofing review.'
        : null,
      unitCodePlaceholder: 'DR-TRC',
      widthMm: openingType === 'terraceDoor' ? 2400 : 1800,
    };
  }

  if (config.doorPackage === 'premiumGlazedEntry') {
    return {
      frameType: 'premium-glazed-entry',
      glazingType: 'glazed-entry',
      heightMm: 2200,
      reviewRequirement: null,
      unitCodePlaceholder: 'DR-GLZ',
      widthMm: 1100,
    };
  }

  return {
    frameType: 'standard-entry',
    glazingType: 'solid-entry',
    heightMm: 2100,
    reviewRequirement: null,
    unitCodePlaceholder: 'DR-STD',
    widthMm: 1000,
  };
}

function getOpeningScheduleWallSideForDoor(config: ModularHomeConfiguratorState): ModularHomeOpeningWallSide {
  if (config.doorPlacement === 'sideEntry') {
    return config.terrace === 'sideTerrace' ? 'right' : 'left';
  }

  if (config.doorPlacement === 'terraceFacing') {
    if (config.terrace === 'sideTerrace') {
      return 'right';
    }

    if (config.terrace === 'none') {
      return 'rear';
    }

    return 'front';
  }

  return 'front';
}

function createOpeningEstimateImpact(
  config: ModularHomeConfiguratorState,
  input: {
    heightMm: number;
    quantity: number;
    reviewRequirement: string | null;
    type: ModularHomeOpeningType;
    widthMm: number;
  },
): number {
  if (input.type === 'interiorDoorPlaceholder') {
    return 0;
  }

  const componentId = input.type === 'window'
    ? getSelectedWindowComponentId(config)
    : getSelectedDoorComponentId(config);
  const component = getComponentById(componentId);

  if (!component) {
    return 0;
  }

  const baselineArea = input.type === 'window' ? 1.8 : 2.1;
  const areaFactor = Math.max((input.widthMm * input.heightMm) / 1000000 / baselineArea, 0.5);
  const baseCost = (component.baseUnitCost + component.laborUnitCost) * areaFactor * input.quantity;
  const wasteCost = baseCost * component.wasteFactor;
  const reviewAllowance = input.reviewRequirement ? 120 * input.quantity : 0;

  return roundMoney(baseCost + wasteCost + reviewAllowance);
}

function getInteriorDoorPlaceholderQuantity(
  config: ModularHomeConfiguratorState,
): number {
  const product = getModularHomeProductForConfig(config);
  if (!product) {
    return 0;
  }

  if (product.id === 'family-timber-80') {
    return config.dimensionPreset === 'familyExtraBedroomModule' ? 3 : 2;
  }

  return 1;
}

function createOpeningScheduleItem(
  config: ModularHomeConfiguratorState,
  input: {
    glazingType: string;
    heightMm: number;
    notes: string;
    openingId: string;
    quantity: number;
    reviewRequirement: string | null;
    type: ModularHomeOpeningType;
    unitCodePlaceholder: string;
    wallSide: ModularHomeOpeningWallSide;
    widthMm: number;
  },
): ModularHomeOpeningScheduleItem | null {
  const product = getModularHomeProductForConfig(config);
  const layoutVariant = getModularHomeLayoutVariantForConfig(config);
  const dimensionPreset = getModularHomeDimensionPresetForConfig(config);

  if (!product || !layoutVariant || !dimensionPreset || input.quantity <= 0) {
    return null;
  }

  return {
    bomCategory: input.type === 'window' ? 'windowUnit' : 'doorUnit',
    dimensionPresetId: dimensionPreset.id,
    estimateImpact: createOpeningEstimateImpact(config, input),
    frameType: input.type === 'window' ? config.windowFrameType : getDoorOpeningBase(config, input.type as 'exteriorDoor' | 'terraceDoor' | 'interiorDoorPlaceholder').frameType,
    glazingType: input.glazingType,
    heightMm: input.heightMm,
    id: input.openingId,
    layoutVariantId: layoutVariant.id,
    notes: input.notes,
    openingId: input.openingId,
    productId: product.id,
    quantity: input.quantity,
    reviewRequirement: input.reviewRequirement,
    terraceOption: config.terrace,
    type: input.type,
    unitCodePlaceholder: input.unitCodePlaceholder,
    wallSide: input.wallSide,
    widthMm: input.widthMm,
  };
}

export function calculateOpeningSchedule(
  config: ModularHomeConfiguratorState,
): readonly ModularHomeOpeningScheduleItem[] {
  const product = getModularHomeProductForConfig(config);
  const layoutVariant = getModularHomeLayoutVariantForConfig(config);
  const dimensionPreset = getModularHomeDimensionPresetForConfig(config);

  if (!product || !layoutVariant || !dimensionPreset) {
    return [];
  }

  const openingItems: ModularHomeOpeningScheduleItem[] = [];
  const frontWindow = getWindowOpeningBase(config, 'front');
  const rearWindow = getWindowOpeningBase(config, 'rear');
  const sideWindow = getWindowOpeningBase(config, 'left');
  const doorSide = getOpeningScheduleWallSideForDoor(config);
  const primaryDoorType = config.doorPlacement === 'terraceFacing' ? 'terraceDoor' : 'exteriorDoor';
  const primaryDoor = getDoorOpeningBase(config, primaryDoorType);

  const pushItem = (item: ModularHomeOpeningScheduleItem | null) => {
    if (item) {
      openingItems.push(item);
    }
  };

  if (product.id === 'compact-timber-40') {
    pushItem(createOpeningScheduleItem(config, {
      glazingType: frontWindow.glazingType,
      heightMm: frontWindow.heightMm,
      notes: `Living frontage openings for ${layoutVariant.label}. ${dimensionPreset.moduleDimensionNote}`,
      openingId: 'CT40-W-FR-LIV',
      quantity: config.windowPlacement === 'sidePrivacy' ? 1 : 2,
      reviewRequirement: frontWindow.reviewRequirement,
      type: 'window',
      unitCodePlaceholder: frontWindow.unitCodePlaceholder,
      wallSide: 'front',
      widthMm: config.dimensionPreset === 'compactWideLiving' ? frontWindow.widthMm + 200 : frontWindow.widthMm,
    }));
    pushItem(createOpeningScheduleItem(config, {
      glazingType: rearWindow.glazingType,
      heightMm: rearWindow.heightMm,
      notes: `Bedroom daylight opening for ${dimensionPreset.shortLabel.toLowerCase()} compact preset.`,
      openingId: 'CT40-W-RR-BED',
      quantity: config.dimensionPreset === 'compactLongBedroom' ? 2 : 1,
      reviewRequirement: rearWindow.reviewRequirement,
      type: 'window',
      unitCodePlaceholder: rearWindow.unitCodePlaceholder,
      wallSide: 'rear',
      widthMm: config.dimensionPreset === 'compactLongBedroom' ? rearWindow.widthMm + 120 : rearWindow.widthMm,
    }));
    pushItem(createOpeningScheduleItem(config, {
      glazingType: 'privacy',
      heightMm: 600,
      notes: 'Bathroom/service daylight placeholder.',
      openingId: 'CT40-W-LT-BTH',
      quantity: 1,
      reviewRequirement: null,
      type: 'window',
      unitCodePlaceholder: 'WIN-BTH',
      wallSide: 'left',
      widthMm: 600,
    }));
  } else if (product.id === 'family-timber-80') {
    pushItem(createOpeningScheduleItem(config, {
      glazingType: frontWindow.glazingType,
      heightMm: frontWindow.heightMm,
      notes: `Main living frontage openings for ${layoutVariant.label}.`,
      openingId: 'FT80-W-FR-LIV',
      quantity: config.windowPlacement === 'frontPanoramic' ? 3 : 2,
      reviewRequirement: frontWindow.reviewRequirement,
      type: 'window',
      unitCodePlaceholder: frontWindow.unitCodePlaceholder,
      wallSide: 'front',
      widthMm: config.dimensionPreset === 'familyWideLiving' ? frontWindow.widthMm + 250 : frontWindow.widthMm,
    }));
    pushItem(createOpeningScheduleItem(config, {
      glazingType: rearWindow.glazingType,
      heightMm: 1400,
      notes: 'Bedroom module rear opening set.',
      openingId: 'FT80-W-RR-BED',
      quantity: config.dimensionPreset === 'familyExtraBedroomModule' ? 3 : 2,
      reviewRequirement: rearWindow.reviewRequirement,
      type: 'window',
      unitCodePlaceholder: rearWindow.unitCodePlaceholder,
      wallSide: 'rear',
      widthMm: 1100,
    }));
    pushItem(createOpeningScheduleItem(config, {
      glazingType: sideWindow.glazingType,
      heightMm: sideWindow.heightMm,
      notes: 'Bathroom/technical side daylight and ventilation opening.',
      openingId: 'FT80-W-LT-SVC',
      quantity: 1,
      reviewRequirement: sideWindow.reviewRequirement,
      type: 'window',
      unitCodePlaceholder: sideWindow.unitCodePlaceholder,
      wallSide: 'left',
      widthMm: 800,
    }));
  } else if (product.id === 'sauna-cabin-25') {
    pushItem(createOpeningScheduleItem(config, {
      glazingType: config.windowPlacement === 'sidePrivacy' ? 'privacy' : frontWindow.glazingType,
      heightMm: config.windowPlacement === 'sidePrivacy' ? 900 : frontWindow.heightMm,
      notes: `Sauna/rest frontage opening for ${layoutVariant.label}.`,
      openingId: 'SC25-W-FR-SAUNA',
      quantity: 1,
      reviewRequirement: frontWindow.reviewRequirement,
      type: 'window',
      unitCodePlaceholder: config.windowPlacement === 'sidePrivacy' ? 'WIN-SAUNA-PRIV' : frontWindow.unitCodePlaceholder,
      wallSide: 'front',
      widthMm: config.dimensionPreset === 'saunaGuestWide' ? 1600 : 1200,
    }));
    pushItem(createOpeningScheduleItem(config, {
      glazingType: 'privacy',
      heightMm: 1000,
      notes: 'Side privacy opening for changing/service zone.',
      openingId: 'SC25-W-RT-SIDE',
      quantity: 1,
      reviewRequirement: config.windowPlacement === 'cornerFeature' ? 'Corner sauna glazing requires heat and moisture detailing review.' : null,
      type: 'window',
      unitCodePlaceholder: 'WIN-SAUNA-SIDE',
      wallSide: 'right',
      widthMm: config.windowPlacement === 'cornerFeature' ? 1200 : 800,
    }));
  }

  pushItem(createOpeningScheduleItem(config, {
    glazingType: primaryDoor.glazingType,
    heightMm: primaryDoor.heightMm,
    notes: `${config.doorPlacement} controlled primary access opening.`,
    openingId: `${product.id}-DR-PRIMARY`,
    quantity: 1,
    reviewRequirement: primaryDoor.reviewRequirement,
    type: primaryDoorType,
    unitCodePlaceholder: primaryDoor.unitCodePlaceholder,
    wallSide: doorSide,
    widthMm: config.dimensionPreset === 'saunaDeepTerrace' && primaryDoorType === 'terraceDoor'
      ? primaryDoor.widthMm + 300
      : primaryDoor.widthMm,
  }));

  pushItem(createOpeningScheduleItem(config, {
    glazingType: 'opaque-placeholder',
    heightMm: 2040,
    notes: `${layoutVariant.label} internal circulation placeholder only.`,
    openingId: `${product.id}-DR-INT-PLACEHOLDER`,
    quantity: getInteriorDoorPlaceholderQuantity(config),
    reviewRequirement: 'Interior doors are placeholders only; detailed door pack is not configured in this round.',
    type: 'interiorDoorPlaceholder',
    unitCodePlaceholder: 'IDR-PLACEHOLDER',
    wallSide: 'rear',
    widthMm: 820,
  }));

  return openingItems;
}

export function summarizeOpeningSchedule(
  openingSchedule: readonly ModularHomeOpeningScheduleItem[],
): ModularHomeOpeningScheduleSummary {
  return {
    doorCount: openingSchedule
      .filter((item) => item.type === 'exteriorDoor' || item.type === 'terraceDoor')
      .reduce((total, item) => total + item.quantity, 0),
    reviewRequiredCount: openingSchedule.filter((item) => item.reviewRequirement).length,
    totalEstimateImpact: roundMoney(openingSchedule.reduce((total, item) => total + item.estimateImpact, 0)),
    totalQuantity: openingSchedule.reduce((total, item) => total + item.quantity, 0),
    windowCount: openingSchedule
      .filter((item) => item.type === 'window')
      .reduce((total, item) => total + item.quantity, 0),
  };
}
