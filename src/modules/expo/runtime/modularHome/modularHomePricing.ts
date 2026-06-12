import type {
  ModularHomeComponentCategory,
} from './modularHomeComponents';
import type {
  ModularHomeModuleType,
  ModularHomeOptionGroup,
} from './modularHomeProducts';

export type ModularHomePricingCategory =
  | 'material'
  | 'factoryLabor'
  | 'installation'
  | 'transport'
  | 'designEngineering'
  | 'margin'
  | 'vat'
  | 'contingency';

export type ModularHomeCostRegion = 'eu-preview';
export type ModularHomeCurrency = 'EUR';
export type ModularHomePricingConfidenceLevel = 'low' | 'medium' | 'high' | 'placeholder';
export type ModularHomePricingSourceType =
  | 'internalDatabase'
  | 'supplierBudgetPlaceholder'
  | 'manualReview';

export type ModularHomePricingBreakdown = Record<ModularHomePricingCategory, number>;

export type ModularHomePricingCategoryTotal = {
  amount: number;
  category: ModularHomePricingCategory;
  label: string;
};

export type ModularHomePricingContext = {
  confidenceLabel: string;
  confidenceLevel: ModularHomePricingConfidenceLevel;
  costRegion: ModularHomeCostRegion;
  costRegionLabel: string;
  currency: ModularHomeCurrency;
  disclaimer: string;
  priceDate: string;
};

export type ModularHomePricingSummary = ModularHomePricingContext & {
  categoryTotals: readonly ModularHomePricingCategoryTotal[];
  total: number;
};

export const MODULAR_HOME_PRICING_SOURCE_TYPE_LABELS = {
  internalDatabase: 'Internal database',
  manualReview: 'Manual review',
  supplierBudgetPlaceholder: 'Supplier placeholder',
} as const satisfies Record<ModularHomePricingSourceType, string>;

type PricingDistribution = Partial<Record<ModularHomePricingCategory, number>>;

export const MODULAR_HOME_PRICING_CATEGORIES = [
  'material',
  'factoryLabor',
  'installation',
  'transport',
  'designEngineering',
  'margin',
  'vat',
  'contingency',
] as const satisfies readonly ModularHomePricingCategory[];

export const MODULAR_HOME_PRICING_CATEGORY_LABELS = {
  material: 'Materials',
  factoryLabor: 'Factory labor',
  installation: 'Installation',
  transport: 'Transport',
  designEngineering: 'Design/engineering',
  margin: 'Margin',
  vat: 'VAT',
  contingency: 'Contingency',
} as const satisfies Record<ModularHomePricingCategory, string>;

export const MODULAR_HOME_PRICING_CONTEXT = {
  confidenceLabel: 'Low confidence preview pricing',
  confidenceLevel: 'low',
  costRegion: 'eu-preview',
  costRegionLabel: 'EU preview region',
  currency: 'EUR',
  disclaimer: 'Pricing DB v1 is a preview estimate database, not a final quote.',
  priceDate: '2026-06-06',
} as const satisfies ModularHomePricingContext;

const MODULE_PRICING_DISTRIBUTION_BY_TYPE = {
  bathroomCore: {
    material: 0.46,
    factoryLabor: 0.34,
    designEngineering: 0.06,
    margin: 0.1,
    contingency: 0.04,
  },
  bedroom: {
    material: 0.52,
    factoryLabor: 0.33,
    designEngineering: 0.03,
    margin: 0.09,
    contingency: 0.03,
  },
  facade: {
    material: 0.68,
    factoryLabor: 0.18,
    margin: 0.1,
    contingency: 0.04,
  },
  kitchen: {
    material: 0.5,
    factoryLabor: 0.32,
    designEngineering: 0.04,
    margin: 0.1,
    contingency: 0.04,
  },
  living: {
    material: 0.54,
    factoryLabor: 0.31,
    designEngineering: 0.04,
    margin: 0.08,
    contingency: 0.03,
  },
  roof: {
    material: 0.6,
    factoryLabor: 0.22,
    designEngineering: 0.06,
    margin: 0.08,
    contingency: 0.04,
  },
  technical: {
    material: 0.5,
    factoryLabor: 0.3,
    designEngineering: 0.08,
    margin: 0.08,
    contingency: 0.04,
  },
  terrace: {
    material: 0.5,
    factoryLabor: 0.16,
    installation: 0.2,
    designEngineering: 0.04,
    margin: 0.07,
    contingency: 0.03,
  },
} as const satisfies Record<ModularHomeModuleType, PricingDistribution>;

const OPTION_PRICING_DISTRIBUTION_BY_GROUP = {
  doorPackage: {
    material: 0.62,
    factoryLabor: 0.16,
    installation: 0.08,
    designEngineering: 0.04,
    margin: 0.07,
    contingency: 0.03,
  },
  doorPlacement: {
    material: 0.38,
    factoryLabor: 0.22,
    installation: 0.18,
    designEngineering: 0.08,
    margin: 0.09,
    contingency: 0.05,
  },
  facade: {
    material: 0.64,
    factoryLabor: 0.18,
    installation: 0.05,
    margin: 0.09,
    contingency: 0.04,
  },
  facadeBoardOrientation: {
    material: 0.42,
    factoryLabor: 0.34,
    installation: 0.04,
    designEngineering: 0.06,
    margin: 0.09,
    contingency: 0.05,
  },
  facadeBoardProfile: {
    material: 0.54,
    factoryLabor: 0.28,
    designEngineering: 0.05,
    margin: 0.09,
    contingency: 0.04,
  },
  facadeBoardSpacing: {
    material: 0.42,
    factoryLabor: 0.36,
    designEngineering: 0.06,
    margin: 0.1,
    contingency: 0.06,
  },
  facadeBoardWidth: {
    material: 0.58,
    factoryLabor: 0.24,
    designEngineering: 0.04,
    margin: 0.09,
    contingency: 0.05,
  },
  finish: {
    material: 0.44,
    factoryLabor: 0.36,
    designEngineering: 0.04,
    margin: 0.1,
    contingency: 0.06,
  },
  floorFinish: {
    material: 0.56,
    factoryLabor: 0.28,
    designEngineering: 0.03,
    margin: 0.09,
    contingency: 0.04,
  },
  interiorFloorStyle: {
    material: 0.52,
    factoryLabor: 0.3,
    designEngineering: 0.04,
    margin: 0.1,
    contingency: 0.04,
  },
  furniturePackage: {
    material: 0.68,
    factoryLabor: 0.14,
    installation: 0.04,
    designEngineering: 0.03,
    margin: 0.08,
    contingency: 0.03,
  },
  sofa: {
    material: 0.72,
    factoryLabor: 0.12,
    margin: 0.1,
    contingency: 0.06,
  },
  table: {
    material: 0.7,
    factoryLabor: 0.14,
    margin: 0.1,
    contingency: 0.06,
  },
  bed: {
    material: 0.72,
    factoryLabor: 0.12,
    margin: 0.1,
    contingency: 0.06,
  },
  kitchenLine: {
    material: 0.62,
    factoryLabor: 0.2,
    installation: 0.05,
    designEngineering: 0.03,
    margin: 0.07,
    contingency: 0.03,
  },
  wardrobePlaceholder: {
    material: 0.7,
    factoryLabor: 0.14,
    margin: 0.1,
    contingency: 0.06,
  },
  interiorWallFinish: {
    material: 0.5,
    factoryLabor: 0.32,
    designEngineering: 0.04,
    margin: 0.1,
    contingency: 0.04,
  },
  roof: {
    material: 0.58,
    factoryLabor: 0.2,
    installation: 0.07,
    designEngineering: 0.06,
    margin: 0.06,
    contingency: 0.03,
  },
  roofEdgeColor: {
    material: 0.62,
    factoryLabor: 0.18,
    installation: 0.06,
    margin: 0.09,
    contingency: 0.05,
  },
  roofGutterStyle: {
    material: 0.58,
    factoryLabor: 0.2,
    installation: 0.08,
    designEngineering: 0.06,
    margin: 0.05,
    contingency: 0.03,
  },
  terrace: {
    material: 0.5,
    factoryLabor: 0.13,
    installation: 0.23,
    designEngineering: 0.04,
    margin: 0.07,
    contingency: 0.03,
  },
  windowPackage: {
    material: 0.65,
    factoryLabor: 0.14,
    installation: 0.07,
    designEngineering: 0.05,
    margin: 0.06,
    contingency: 0.03,
  },
  windowFrameColor: {
    material: 0.64,
    factoryLabor: 0.16,
    installation: 0.06,
    margin: 0.09,
    contingency: 0.05,
  },
  trimColor: {
    material: 0.6,
    factoryLabor: 0.18,
    installation: 0.06,
    margin: 0.1,
    contingency: 0.06,
  },
  windowPlacement: {
    material: 0.46,
    factoryLabor: 0.2,
    installation: 0.1,
    designEngineering: 0.1,
    margin: 0.09,
    contingency: 0.05,
  },
  windowFrameType: {
    material: 0.62,
    factoryLabor: 0.18,
    installation: 0.06,
    designEngineering: 0.05,
    margin: 0.06,
    contingency: 0.03,
  },
  wallPanelStyle: {
    material: 0.48,
    factoryLabor: 0.34,
    designEngineering: 0.04,
    margin: 0.1,
    contingency: 0.04,
  },
} as const satisfies Record<ModularHomeOptionGroup, PricingDistribution>;

const COMPONENT_PRICING_CATEGORY_BY_COMPONENT = {
  bathroomCore: ['material', 'factoryLabor', 'contingency'],
  doorUnit: ['material', 'factoryLabor', 'contingency'],
  facadeBoarding: ['material', 'factoryLabor', 'contingency'],
  floorCassette: ['material', 'factoryLabor', 'contingency'],
  foundationPad: ['material', 'factoryLabor', 'contingency'],
  furniturePackage: ['material', 'factoryLabor', 'contingency'],
  interiorFinish: ['material', 'factoryLabor', 'contingency'],
  kitchenLine: ['material', 'factoryLabor', 'contingency'],
  roofCassette: ['material', 'factoryLabor', 'contingency'],
  terraceDeck: ['material', 'factoryLabor', 'contingency'],
  wallPanel: ['material', 'factoryLabor', 'contingency'],
  windowUnit: ['material', 'factoryLabor', 'contingency'],
} as const satisfies Record<ModularHomeComponentCategory, readonly ModularHomePricingCategory[]>;

function roundMoney(amount: number): number {
  return Math.round(amount);
}

function emptyBreakdown(): ModularHomePricingBreakdown {
  return {
    material: 0,
    factoryLabor: 0,
    installation: 0,
    transport: 0,
    designEngineering: 0,
    margin: 0,
    vat: 0,
    contingency: 0,
  };
}

function normalizeDistribution(distribution: PricingDistribution): readonly [ModularHomePricingCategory, number][] {
  const entries = MODULAR_HOME_PRICING_CATEGORIES
    .map((category) => [category, distribution[category] ?? 0] as const)
    .filter(([, share]) => share > 0);
  const totalShare = entries.reduce((total, [, share]) => total + share, 0);

  if (totalShare <= 0) {
    return [];
  }

  return entries.map(([category, share]) => [category, share / totalShare] as const);
}

export function createModularHomePricingBreakdown(
  values: Partial<Record<ModularHomePricingCategory, number>> = {},
): ModularHomePricingBreakdown {
  const breakdown = emptyBreakdown();

  for (const category of MODULAR_HOME_PRICING_CATEGORIES) {
    breakdown[category] = roundMoney(values[category] ?? 0);
  }

  return breakdown;
}

export function allocateModularHomePricingAmount(
  amount: number,
  distribution: PricingDistribution,
): ModularHomePricingBreakdown {
  const roundedAmount = roundMoney(amount);
  const normalizedDistribution = normalizeDistribution(distribution);
  const breakdown = emptyBreakdown();

  if (roundedAmount <= 0 || normalizedDistribution.length === 0) {
    return breakdown;
  }

  let allocated = 0;

  normalizedDistribution.forEach(([category, share], index) => {
    const isLast = index === normalizedDistribution.length - 1;
    const categoryAmount = isLast ? roundedAmount - allocated : roundMoney(roundedAmount * share);

    breakdown[category] = categoryAmount;
    allocated += categoryAmount;
  });

  return breakdown;
}

export function sumModularHomePricingBreakdowns(
  breakdowns: readonly ModularHomePricingBreakdown[],
): ModularHomePricingBreakdown {
  const totals = emptyBreakdown();

  for (const breakdown of breakdowns) {
    for (const category of MODULAR_HOME_PRICING_CATEGORIES) {
      totals[category] += breakdown[category];
    }
  }

  return totals;
}

export function getModularHomePricingCategoryTotals(
  breakdowns: readonly ModularHomePricingBreakdown[],
): readonly ModularHomePricingCategoryTotal[] {
  const totals = sumModularHomePricingBreakdowns(breakdowns);

  return MODULAR_HOME_PRICING_CATEGORIES
    .map((category) => ({
      amount: totals[category],
      category,
      label: MODULAR_HOME_PRICING_CATEGORY_LABELS[category],
    }))
    .filter((item) => item.amount > 0);
}

export function summarizeModularHomePricing(
  breakdowns: readonly ModularHomePricingBreakdown[],
): ModularHomePricingSummary {
  const categoryTotals = getModularHomePricingCategoryTotals(breakdowns);

  return {
    ...MODULAR_HOME_PRICING_CONTEXT,
    categoryTotals,
    total: categoryTotals.reduce((total, item) => total + item.amount, 0),
  };
}

export function createModulePricingBreakdown(
  amount: number,
  moduleType: ModularHomeModuleType,
): ModularHomePricingBreakdown {
  return allocateModularHomePricingAmount(amount, MODULE_PRICING_DISTRIBUTION_BY_TYPE[moduleType]);
}

export function createOptionPricingBreakdown(
  amount: number,
  optionGroup: ModularHomeOptionGroup,
): ModularHomePricingBreakdown {
  return allocateModularHomePricingAmount(amount, OPTION_PRICING_DISTRIBUTION_BY_GROUP[optionGroup]);
}

export function createComponentPricingBreakdown(input: {
  laborCost: number;
  materialCost: number;
  wasteCost: number;
}): ModularHomePricingBreakdown {
  return createModularHomePricingBreakdown({
    material: input.materialCost,
    factoryLabor: input.laborCost,
    contingency: input.wasteCost,
  });
}

export function createTransportPricingBreakdown(amount: number): ModularHomePricingBreakdown {
  return createModularHomePricingBreakdown({ transport: amount });
}

export function createInstallationPricingBreakdown(amount: number): ModularHomePricingBreakdown {
  return createModularHomePricingBreakdown({ installation: amount });
}

export function createVatPricingBreakdown(amount: number): ModularHomePricingBreakdown {
  return createModularHomePricingBreakdown({ vat: amount });
}

export function getPricingCategoriesForModuleType(
  moduleType: ModularHomeModuleType,
): readonly ModularHomePricingCategory[] {
  return normalizeDistribution(MODULE_PRICING_DISTRIBUTION_BY_TYPE[moduleType]).map(([category]) => category);
}

export function getPricingCategoriesForOptionGroup(
  optionGroup: ModularHomeOptionGroup,
): readonly ModularHomePricingCategory[] {
  return normalizeDistribution(OPTION_PRICING_DISTRIBUTION_BY_GROUP[optionGroup]).map(([category]) => category);
}

export function getPricingCategoriesForComponentCategory(
  componentCategory: ModularHomeComponentCategory,
): readonly ModularHomePricingCategory[] {
  return COMPONENT_PRICING_CATEGORY_BY_COMPONENT[componentCategory];
}

export function getModularHomePricingSourceTypeLabel(
  sourceType: ModularHomePricingSourceType,
): string {
  return MODULAR_HOME_PRICING_SOURCE_TYPE_LABELS[sourceType];
}
