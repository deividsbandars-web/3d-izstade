import {
  type ModularHomeConfiguratorState,
} from './modularHomeConfigurator';
import { getModularHomeTemplate, type ModularHomeTemplateId } from './modularHomeConfig';
import {
  calculateModularHomeQuantities,
  type ModularHomeQuantityTakeoff,
} from './modularHomeQuantities';
import {
  createInstallationPricingBreakdown,
  createModulePricingBreakdown,
  createOptionPricingBreakdown,
  createTransportPricingBreakdown,
  createVatPricingBreakdown,
  type ModularHomePricingCategory,
  summarizeModularHomePricing,
  sumModularHomePricingBreakdowns,
  type ModularHomePricingBreakdown,
  type ModularHomePricingSummary,
  MODULAR_HOME_PRICING_CONTEXT,
} from './modularHomePricing';
import {
  getModularHomeProductConfigSummary,
  getModularHomeProductForConfig,
  getModulesForProduct,
  getSelectedModularHomeOptions,
  type ModularHomeModule,
  type ModularHomeOption,
} from './modularHomeProducts';

export type ModularHomeEstimateLineItemCategory =
  | 'baseProduct'
  | 'bathroomCore'
  | 'facade'
  | 'roof'
  | 'terrace'
  | 'finish'
  | 'windowPackage'
  | 'doorPackage'
  | 'windowPlacement'
  | 'doorPlacement'
  | 'facadeBoardOrientation'
  | 'facadeBoardWidth'
  | 'facadeBoardProfile'
  | 'facadeBoardSpacing'
  | 'trimColor'
  | 'roofEdgeColor'
  | 'roofGutterStyle'
  | 'windowFrameColor'
  | 'windowFrameType'
  | 'interiorWallFinish'
  | 'floorFinish'
  | 'interiorFloorStyle'
  | 'wallPanelStyle'
  | 'furniturePackage'
  | 'sofa'
  | 'table'
  | 'bed'
  | 'kitchenLine'
  | 'wardrobePlaceholder'
  | 'transport'
  | 'installation'
  | 'vat';

export type ModularHomeEstimateConfidence =
  | 'packageFixed'
  | 'estimated'
  | 'siteDependent'
  | 'requiresEngineering';

export type ModularHomeEstimatePriceSource =
  | 'internalPreview'
  | 'supplierPlaceholder'
  | 'manualReviewRequired';

export type ModularHomeEstimateScenarioId =
  | 'base'
  | 'expected'
  | 'premium'
  | 'siteDependentExtras';

export type ModularHomeEstimateReliabilityMetadata = {
  confidence: ModularHomeEstimateConfidence;
  lastUpdated: string;
  notes: readonly string[];
  priceSource: ModularHomeEstimatePriceSource;
};

export type ModularHomeEstimateLineItem = ModularHomeEstimateReliabilityMetadata & {
  amount: number;
  category: ModularHomeEstimateLineItemCategory;
  id: string;
  isPlaceholder?: boolean;
  label: string;
  note?: string;
  pricingBreakdown: ModularHomePricingBreakdown;
};

export type ModularHomeScopeOfSupplySectionId = 'included' | 'optional' | 'requiresReview';

export type ModularHomeScopeOfSupplySection = {
  id: ModularHomeScopeOfSupplySectionId;
  items: readonly string[];
  label: string;
};

export type ModularHomeEstimateAdjustment = {
  amount: number;
  id: string;
  label: string;
};

export type ModularHomeEstimateScenario = ModularHomeEstimateReliabilityMetadata & {
  amount: number;
  description: string;
  exclusions: readonly string[];
  finalQuoteRequirement: string;
  id: ModularHomeEstimateScenarioId;
  included: readonly string[];
  isAdditiveAllowance?: boolean;
  label: string;
  vatMarginNote: string;
};

export type ModularHomeEstimateSectionId =
  | 'modulePackage'
  | 'materials'
  | 'factoryLabor'
  | 'finishPackage'
  | 'terraceExtensions'
  | 'transportPlaceholder'
  | 'installationPlaceholder'
  | 'designEngineeringPlaceholder'
  | 'vatMarginContingency'
  | 'excludedSiteDependent';

export type ModularHomeEstimateSectionLineItem = ModularHomeEstimateReliabilityMetadata & {
  id: string;
  isExcluded?: boolean;
  isPlaceholder?: boolean;
  label: string;
  note?: string;
  quantity: string;
  subtotal: number | null;
  unit: string;
  unitCost: number | null;
};

export type ModularHomeEstimateSection = {
  confidence: ModularHomeEstimateConfidence;
  description: string;
  id: ModularHomeEstimateSectionId;
  label: string;
  lineItems: readonly ModularHomeEstimateSectionLineItem[];
  subtotal: number;
};

export type ModularHomeEstimate = {
  adjustments: readonly ModularHomeEstimateAdjustment[];
  baseModel: string;
  basePrice: number;
  basePriceLabel: string;
  disclaimer: string;
  estimatedTotal: number;
  lineItems: readonly ModularHomeEstimateLineItem[];
  optionalServices: readonly ModularHomeEstimateLineItem[];
  optionalServicesTotal: number;
  pricing: ModularHomePricingSummary;
  priceConfidenceVersion: 'v5';
  quantities: ModularHomeQuantityTakeoff;
  scenarios: readonly ModularHomeEstimateScenario[];
  selectedOptions: ReturnType<typeof getModularHomeProductConfigSummary>;
  sections: readonly ModularHomeEstimateSection[];
  sizeLabel: string;
  scopeOfSupply: readonly ModularHomeScopeOfSupplySection[];
  subtotal: number;
  templateId: ModularHomeTemplateId;
  totalPrice: number;
  vatEstimate: ModularHomeEstimateLineItem;
  vatRate: number;
};

export const MODULAR_HOME_ESTIMATE_CONFIG = {
  disclaimer: 'Estimate only - final quote depends on site, transport, VAT, foundations, utilities and engineering.',
  premiumScenarioContingencyRate: 0.12,
  installationPerM2: 180,
  transportBase: 900,
  transportPerModule: 1800,
  vatRate: 0.21,
} as const;

type ModularHomeEstimateSectionLineItemDraft =
  Omit<ModularHomeEstimateSectionLineItem, keyof ModularHomeEstimateReliabilityMetadata>
  & Partial<ModularHomeEstimateReliabilityMetadata>
  & {
    sourceCategory?: ModularHomeEstimateLineItemCategory;
  };

type ModularHomeEstimateSectionDraft =
  Omit<ModularHomeEstimateSection, 'lineItems' | 'subtotal'>
  & {
    lineItems: readonly ModularHomeEstimateSectionLineItemDraft[];
  };

const PRICE_METADATA_LAST_UPDATED = MODULAR_HOME_PRICING_CONTEXT.priceDate;

const ESTIMATE_CONFIDENCE_LABELS = {
  estimated: 'Estimate',
  packageFixed: 'Fixed package',
  requiresEngineering: 'Engineering review',
  siteDependent: 'Site-dependent',
} as const satisfies Record<ModularHomeEstimateConfidence, string>;

const ESTIMATE_PRICE_SOURCE_LABELS = {
  internalPreview: 'Internal preview',
  manualReviewRequired: 'Manual review',
  supplierPlaceholder: 'Supplier placeholder',
} as const satisfies Record<ModularHomeEstimatePriceSource, string>;

export function getModularHomeEstimateConfidenceLabel(confidence: ModularHomeEstimateConfidence): string {
  return ESTIMATE_CONFIDENCE_LABELS[confidence];
}

export function getModularHomeEstimatePriceSourceLabel(priceSource: ModularHomeEstimatePriceSource): string {
  return ESTIMATE_PRICE_SOURCE_LABELS[priceSource];
}

function sumLineItems(items: readonly ModularHomeEstimateLineItem[]): number {
  return items.reduce((total, item) => total + item.amount, 0);
}

function roundToNearestFifty(amount: number): number {
  return Math.round(amount / 50) * 50;
}

function roundToNearestEuro(amount: number): number {
  return Math.round(amount);
}

function formatEstimateQuantity(value: number, suffix = ''): string {
  if (!Number.isFinite(value) || value <= 0) {
    return suffix ? `0${suffix}` : '1';
  }

  const rounded = Math.round(value * 10) / 10;

  return `${Number.isInteger(rounded) ? rounded.toFixed(0) : rounded.toFixed(1)}${suffix}`;
}

function getUnitCost(subtotal: number, quantity: number): number | null {
  if (!Number.isFinite(quantity) || quantity <= 0 || subtotal <= 0) {
    return null;
  }

  return roundToNearestEuro(subtotal / quantity);
}

function createModulePackagePricingBreakdown(
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

function getOptionLineItemCategory(option: ModularHomeOption): ModularHomeEstimateLineItemCategory {
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

function getOptionLineItemLabel(option: ModularHomeOption): string {
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

function createBaseLineItems(
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

function createOptionLineItems(config: ModularHomeConfiguratorState): readonly ModularHomeEstimateLineItem[] {
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

function createOptionalServices(
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

function createVatEstimate(taxableAmount: number): ModularHomeEstimateLineItem {
  const amount = roundToNearestFifty(taxableAmount * MODULAR_HOME_ESTIMATE_CONFIG.vatRate);
  const label = 'VAT placeholder';
  const note = `${Math.round(MODULAR_HOME_ESTIMATE_CONFIG.vatRate * 100)}% placeholder for review estimates only.`;

  return {
    amount,
    category: 'vat',
    id: 'vat-placeholder',
    isPlaceholder: true,
    label,
    note,
    pricingBreakdown: createVatPricingBreakdown(amount),
    ...createEstimateMetadata({
      confidence: 'estimated',
      isPlaceholder: true,
      label,
      note,
      priceSource: 'internalPreview',
      sectionId: 'vatMarginContingency',
      sourceCategory: 'vat',
    }),
  };
}

function createAdjustment(item: ModularHomeEstimateLineItem): ModularHomeEstimateAdjustment | null {
  return item.amount === 0 ? null : {
    amount: item.amount,
    id: item.id,
    label: item.label,
  };
}

function getPricingAmount(
  pricing: ModularHomePricingSummary,
  category: ModularHomePricingCategory,
): number {
  return pricing.categoryTotals.find((item) => item.category === category)?.amount ?? 0;
}

function sumSectionLineItems(lineItems: readonly ModularHomeEstimateSectionLineItem[]): number {
  return lineItems.reduce((total, item) => total + (item.subtotal ?? 0), 0);
}

function hasReviewSignal(value: string | undefined): boolean {
  return /\b(corner|covered|engineering|extended|final|foundation|glazed|green|panoramic|permit|review|site|slider|supplier|transport)\b/i.test(value ?? '');
}

function createEstimateMetadata(input: {
  confidence?: ModularHomeEstimateConfidence;
  isExcluded?: boolean;
  isPlaceholder?: boolean;
  label: string;
  note?: string;
  notes?: readonly string[];
  priceSource?: ModularHomeEstimatePriceSource;
  sectionId: ModularHomeEstimateSectionId;
  sourceCategory?: ModularHomeEstimateLineItemCategory;
}): ModularHomeEstimateReliabilityMetadata {
  const category = input.sourceCategory;
  const hasReviewNote = hasReviewSignal(input.note) || hasReviewSignal(input.label);
  const confidence = input.confidence ?? (() => {
    if (input.isExcluded || input.sectionId === 'excludedSiteDependent' || input.sectionId === 'designEngineeringPlaceholder') {
      return 'requiresEngineering';
    }

    if (
      category === 'transport'
      || category === 'installation'
      || category === 'vat'
      || input.sectionId === 'transportPlaceholder'
      || input.sectionId === 'installationPlaceholder'
      || input.sectionId === 'vatMarginContingency'
    ) {
      return 'siteDependent';
    }

    if (hasReviewNote && (
      category === 'roof'
      || category === 'terrace'
      || category === 'windowPackage'
      || category === 'doorPackage'
      || category === 'windowPlacement'
      || category === 'doorPlacement'
      || category === 'facadeBoardOrientation'
      || category === 'facadeBoardWidth'
      || category === 'roofEdgeColor'
      || category === 'windowFrameColor'
      || category === 'interiorWallFinish'
      || category === 'floorFinish'
      || category === 'furniturePackage'
      || category === 'sofa'
      || category === 'table'
      || category === 'bed'
      || category === 'kitchenLine'
      || category === 'wardrobePlaceholder'
    )) {
      return 'requiresEngineering';
    }

    if (category === 'baseProduct') {
      return 'packageFixed';
    }

    return 'estimated';
  })();
  const priceSource = input.priceSource ?? (() => {
    if (
      confidence === 'requiresEngineering'
      || confidence === 'siteDependent'
      || input.isExcluded
    ) {
      return 'manualReviewRequired';
    }

    if (
      category === 'bathroomCore'
      || category === 'facade'
      || category === 'roof'
      || category === 'terrace'
      || category === 'finish'
      || category === 'windowPackage'
      || category === 'doorPackage'
      || category === 'windowPlacement'
      || category === 'doorPlacement'
      || category === 'facadeBoardOrientation'
      || category === 'facadeBoardWidth'
      || category === 'roofEdgeColor'
      || category === 'windowFrameColor'
      || category === 'interiorWallFinish'
      || category === 'floorFinish'
      || category === 'furniturePackage'
      || category === 'sofa'
      || category === 'table'
      || category === 'bed'
      || category === 'kitchenLine'
      || category === 'wardrobePlaceholder'
    ) {
      return 'supplierPlaceholder';
    }

    return 'internalPreview';
  })();
  const reliabilityNoteByConfidence: Record<ModularHomeEstimateConfidence, string> = {
    estimated: 'Preview estimate based on current module and option assumptions.',
    packageFixed: 'Preview package allowance from the internal modular product library.',
    requiresEngineering: 'Requires manual production, engineering or permit review before a real quote.',
    siteDependent: 'Site-dependent allowance; final cost depends on route, ground, utilities and local requirements.',
  };
  const sourceNoteByPriceSource: Record<ModularHomeEstimatePriceSource, string> = {
    internalPreview: 'Price source: internal preview pricing database.',
    manualReviewRequired: 'Price source: manual review required before production quote.',
    supplierPlaceholder: 'Price source: supplier placeholder until live supplier pricing is connected.',
  };
  const notes = [
    reliabilityNoteByConfidence[confidence],
    sourceNoteByPriceSource[priceSource],
    ...(input.note ? [input.note] : []),
    ...(input.notes ?? []),
  ];

  return {
    confidence,
    lastUpdated: PRICE_METADATA_LAST_UPDATED,
    notes: Array.from(new Set(notes)),
    priceSource,
  };
}

function normalizeSectionLineItem(
  sectionId: ModularHomeEstimateSectionId,
  item: ModularHomeEstimateSectionLineItemDraft,
): ModularHomeEstimateSectionLineItem {
  const { sourceCategory, ...lineItem } = item;

  return {
    ...lineItem,
    ...createEstimateMetadata({
      confidence: item.confidence,
      isExcluded: item.isExcluded,
      isPlaceholder: item.isPlaceholder,
      label: item.label,
      note: item.note,
      notes: item.notes,
      priceSource: item.priceSource,
      sectionId,
      sourceCategory,
    }),
  };
}

function createSection(input: ModularHomeEstimateSectionDraft): ModularHomeEstimateSection {
  const lineItems = input.lineItems.map((item) => normalizeSectionLineItem(input.id, item));

  return {
    ...input,
    lineItems,
    subtotal: sumSectionLineItems(lineItems),
  };
}

function createEstimateScenario(input: {
  amount: number;
  confidence: ModularHomeEstimateConfidence;
  description: string;
  exclusions: readonly string[];
  finalQuoteRequirement: string;
  id: ModularHomeEstimateScenarioId;
  included: readonly string[];
  isAdditiveAllowance?: boolean;
  label: string;
  notes: readonly string[];
  priceSource: ModularHomeEstimatePriceSource;
  vatMarginNote: string;
}): ModularHomeEstimateScenario {
  return {
    amount: input.amount,
    description: input.description,
    exclusions: input.exclusions,
    finalQuoteRequirement: input.finalQuoteRequirement,
    id: input.id,
    included: input.included,
    isAdditiveAllowance: input.isAdditiveAllowance,
    label: input.label,
    vatMarginNote: input.vatMarginNote,
    ...createEstimateMetadata({
      confidence: input.confidence,
      label: input.label,
      notes: input.notes,
      priceSource: input.priceSource,
      sectionId: input.id === 'siteDependentExtras' ? 'excludedSiteDependent' : 'vatMarginContingency',
      sourceCategory: input.id === 'siteDependentExtras' ? 'installation' : 'baseProduct',
    }),
  };
}

function createEstimateScenarios(input: {
  estimatedTotal: number;
  optionalServicesTotal: number;
  productName: string;
  subtotal: number;
}): readonly ModularHomeEstimateScenario[] {
  const baseVatAmount = roundToNearestFifty(input.subtotal * MODULAR_HOME_ESTIMATE_CONFIG.vatRate);
  const baseScenarioAmount = input.subtotal + baseVatAmount;
  const premiumScenarioAmount = roundToNearestFifty(
    Math.max(
      input.estimatedTotal + input.estimatedTotal * MODULAR_HOME_ESTIMATE_CONFIG.premiumScenarioContingencyRate,
      input.estimatedTotal + 7500,
    ),
  );

  return [
    createEstimateScenario({
      amount: baseScenarioAmount,
      confidence: 'estimated',
      description: 'Base production package scenario for initial buyer discussion.',
      exclusions: [
        'transport and crane access',
        'installation and foundation works',
        'utility connections',
        'permits and municipality fees',
        'site preparation',
      ],
      finalQuoteRequirement: 'Requires final model confirmation, supplier check and site review before quote.',
      id: 'base',
      included: [
        input.productName,
        'selected module and option package',
        'preview production package allowance',
        'VAT placeholder on the production package',
      ],
      label: 'Base package',
      notes: [
        'Useful for package comparison before site-dependent extras are added.',
        'Base scenario is not a complete installed project price.',
      ],
      priceSource: 'internalPreview',
      vatMarginNote: 'Includes preview VAT placeholder on production package only; margin/contingency are internal preview allocations.',
    }),
    createEstimateScenario({
      amount: input.estimatedTotal,
      confidence: 'siteDependent',
      description: 'Expected discussion scenario using current selected configuration and placeholders.',
      exclusions: [
        'final foundation design',
        'utility connection pricing',
        'permit and municipality-specific fees',
        'route-specific transport permits',
        'engineering release for production',
      ],
      finalQuoteRequirement: 'Requires manual quote review with site address, delivery route, foundation and engineering assumptions.',
      id: 'expected',
      included: [
        'selected production package',
        'transport placeholder',
        'installation placeholder',
        'VAT placeholder',
        'current option and detail selections',
      ],
      label: 'Expected discussion total',
      notes: [
        'This is the main client-facing preview scenario.',
        'Site-dependent placeholders are included but still require review.',
      ],
      priceSource: 'manualReviewRequired',
      vatMarginNote: 'VAT, margin and contingency are preview placeholders; final quote may separate tax and commercial terms.',
    }),
    createEstimateScenario({
      amount: premiumScenarioAmount,
      confidence: 'requiresEngineering',
      description: 'Premium scenario for higher specification, supplier review and contingency discussion.',
      exclusions: [
        'engineering-grade premium interior specification',
        'supplier-confirmed premium materials',
        'final glazing/weatherproofing details',
        'site-specific foundation and utilities',
      ],
      finalQuoteRequirement: 'Requires supplier confirmation, engineering review and final quote scope sign-off.',
      id: 'premium',
      included: [
        'expected scenario baseline',
        `${Math.round(MODULAR_HOME_ESTIMATE_CONFIG.premiumScenarioContingencyRate * 100)}% premium/contingency allowance`,
        'higher-specification review buffer',
      ],
      label: 'Premium scenario',
      notes: [
        'Use for investor/client conversations where premium finishes or risk buffer are expected.',
        'Not a guaranteed cap.',
      ],
      priceSource: 'manualReviewRequired',
      vatMarginNote: 'Premium scenario carries preview margin/contingency; VAT treatment must be confirmed in final quote.',
    }),
    createEstimateScenario({
      amount: input.optionalServicesTotal,
      confidence: 'siteDependent',
      description: 'Separated site-dependent extras allowance, shown as an additive planning block.',
      exclusions: [
        'soil report',
        'foundation contractor quote',
        'utility provider fees',
        'municipality fees',
        'transport permit/crane specifics',
      ],
      finalQuoteRequirement: 'Requires site survey, route check and local contractor/supplier quotes.',
      id: 'siteDependentExtras',
      included: [
        'transport placeholder',
        'installation placeholder',
      ],
      isAdditiveAllowance: true,
      label: 'Site-dependent extras',
      notes: [
        'This is not a standalone project total.',
        'Use it to explain what can change after site review.',
      ],
      priceSource: 'manualReviewRequired',
      vatMarginNote: 'VAT and margin treatment for extras depends on final delivery, installation and local contractor scope.',
    }),
  ];
}

function getLineItemByCategory(
  lineItems: readonly ModularHomeEstimateLineItem[],
  category: ModularHomeEstimateLineItemCategory,
): ModularHomeEstimateLineItem | undefined {
  return lineItems.find((item) => item.category === category);
}

function getLineItemsByCategories(
  lineItems: readonly ModularHomeEstimateLineItem[],
  categories: readonly ModularHomeEstimateLineItemCategory[],
): readonly ModularHomeEstimateLineItem[] {
  return lineItems.filter((item) => categories.includes(item.category));
}

function createModularHomeEstimateSections(input: {
  lineItems: readonly ModularHomeEstimateLineItem[];
  optionalServices: readonly ModularHomeEstimateLineItem[];
  pricing: ModularHomePricingSummary;
  quantities: ModularHomeQuantityTakeoff;
  selectedOptions: ReturnType<typeof getModularHomeProductConfigSummary>;
  vatEstimate: ModularHomeEstimateLineItem;
}): readonly ModularHomeEstimateSection[] {
  const modulePackageItems = getLineItemsByCategories(input.lineItems, ['baseProduct', 'bathroomCore']);
  const finishItem = getLineItemByCategory(input.lineItems, 'finish');
  const terraceItem = getLineItemByCategory(input.lineItems, 'terrace');
  const transportItem = getLineItemByCategory(input.optionalServices, 'transport');
  const installationItem = getLineItemByCategory(input.optionalServices, 'installation');
  const materialSubtotal = getPricingAmount(input.pricing, 'material');
  const factoryLaborSubtotal = getPricingAmount(input.pricing, 'factoryLabor');
  const designEngineeringSubtotal = getPricingAmount(input.pricing, 'designEngineering');
  const marginSubtotal = getPricingAmount(input.pricing, 'margin');
  const contingencySubtotal = getPricingAmount(input.pricing, 'contingency');
  const grossFloorArea = input.quantities.grossFloorAreaM2 || 1;
  const materialAreaBasis = Math.max(
    input.quantities.facadeAreaM2 + input.quantities.roofAreaM2 + input.quantities.grossFloorAreaM2,
    grossFloorArea,
  );

  return [
    createSection({
      confidence: 'estimated',
      description: 'Factory module shell, wet core and base package allowances.',
      id: 'modulePackage',
      label: 'Module package',
      lineItems: modulePackageItems.map((item) => {
        const quantity = item.category === 'bathroomCore'
          ? input.quantities.bathroomCoreCount
          : input.quantities.moduleCount;

        return {
          confidence: item.category === 'baseProduct' ? 'packageFixed' : 'estimated',
          id: `section-${item.id}`,
          label: item.label,
          note: item.note,
          quantity: item.category === 'bathroomCore'
            ? formatEstimateQuantity(input.quantities.bathroomCoreCount, ' core')
            : formatEstimateQuantity(input.quantities.moduleCount, ' modules'),
          subtotal: item.amount,
          sourceCategory: item.category,
          unit: item.category === 'bathroomCore' ? 'core' : 'module package',
          unitCost: getUnitCost(item.amount, quantity),
        };
      }),
    }),
    createSection({
      confidence: 'estimated',
      description: 'Aggregated material allowance from component and option pricing categories.',
      id: 'materials',
      label: 'Materials',
      lineItems: [
        {
          confidence: 'estimated',
          id: 'section-materials-allowance',
          label: 'Materials allowance',
          note: 'Includes material-category allocations from modules, options and component BOM preview data.',
          quantity: formatEstimateQuantity(materialAreaBasis, ' m2 basis'),
          subtotal: materialSubtotal,
          unit: 'pricing m2 basis',
          unitCost: getUnitCost(materialSubtotal, materialAreaBasis),
        },
      ],
    }),
    createSection({
      confidence: 'estimated',
      description: 'Factory labor allowance from module and option pricing categories.',
      id: 'factoryLabor',
      label: 'Factory labor',
      lineItems: [
        {
          confidence: 'estimated',
          id: 'section-factory-labor-allowance',
          label: 'Factory labor allowance',
          note: 'Preview factory labor category allocation; supplier production timing still requires review.',
          quantity: formatEstimateQuantity(input.quantities.moduleCount, ' modules'),
          subtotal: factoryLaborSubtotal,
          unit: 'factory module',
          unitCost: getUnitCost(factoryLaborSubtotal, input.quantities.moduleCount),
        },
      ],
    }),
    createSection({
      confidence: 'estimated',
      description: 'Selected interior/finish package.',
      id: 'finishPackage',
      label: 'Finish package',
      lineItems: [
        {
          confidence: 'estimated',
          id: `section-${finishItem?.id ?? 'finish-package'}`,
          label: finishItem?.label ?? `Finish level: ${input.selectedOptions.finishLevel}`,
          note: finishItem?.note ?? 'Finish package estimate remains preview-only.',
          quantity: '1 package',
          subtotal: finishItem?.amount ?? 0,
          sourceCategory: finishItem?.category ?? 'finish',
          unit: 'finish package',
          unitCost: finishItem?.amount ?? 0,
        },
      ],
    }),
    createSection({
      confidence: hasReviewSignal(input.selectedOptions.terrace) ? 'requiresEngineering' : 'estimated',
      description: 'Selected terrace or extension package.',
      id: 'terraceExtensions',
      label: 'Terrace/extensions',
      lineItems: [
        {
          ...(input.selectedOptions.terrace === 'No terrace' ? { confidence: 'packageFixed' as const } : {}),
          id: `section-${terraceItem?.id ?? 'terrace-extension'}`,
          isPlaceholder: input.selectedOptions.terrace === 'No terrace',
          label: terraceItem?.label ?? `Terrace: ${input.selectedOptions.terrace}`,
          note: terraceItem?.note ?? 'Terrace extension package requires foundation/interface review.',
          quantity: input.quantities.terraceAreaM2 > 0
            ? formatEstimateQuantity(input.quantities.terraceAreaM2, ' m2')
            : '0 m2',
          subtotal: terraceItem?.amount ?? 0,
          sourceCategory: terraceItem?.category ?? 'terrace',
          unit: 'terrace area',
          unitCost: getUnitCost(terraceItem?.amount ?? 0, input.quantities.terraceAreaM2),
        },
      ],
    }),
    createSection({
      confidence: 'siteDependent',
      description: 'Transport allowance only; final logistics are route and site dependent.',
      id: 'transportPlaceholder',
      label: 'Transport placeholder',
      lineItems: [
        {
          confidence: 'siteDependent',
          id: `section-${transportItem?.id ?? 'transport-placeholder'}`,
          isPlaceholder: true,
          label: transportItem?.label ?? 'Transport placeholder',
          note: transportItem?.note,
          quantity: formatEstimateQuantity(input.quantities.transportModuleCount, ' transport modules'),
          subtotal: transportItem?.amount ?? 0,
          sourceCategory: transportItem?.category ?? 'transport',
          unit: 'transport module',
          unitCost: getUnitCost(transportItem?.amount ?? 0, input.quantities.transportModuleCount),
        },
      ],
    }),
    createSection({
      confidence: 'siteDependent',
      description: 'Installation allowance only; final site readiness and foundation scope are not included.',
      id: 'installationPlaceholder',
      label: 'Installation placeholder',
      lineItems: [
        {
          confidence: 'siteDependent',
          id: `section-${installationItem?.id ?? 'installation-placeholder'}`,
          isPlaceholder: true,
          label: installationItem?.label ?? 'Installation placeholder',
          note: installationItem?.note,
          quantity: formatEstimateQuantity(grossFloorArea, ' m2'),
          subtotal: installationItem?.amount ?? 0,
          sourceCategory: installationItem?.category ?? 'installation',
          unit: 'gross floor m2',
          unitCost: getUnitCost(installationItem?.amount ?? 0, grossFloorArea),
        },
      ],
    }),
    createSection({
      confidence: 'requiresEngineering',
      description: 'Design and engineering allocation from preview pricing categories.',
      id: 'designEngineeringPlaceholder',
      label: 'Design/engineering placeholder',
      lineItems: [
        {
          confidence: 'requiresEngineering',
          id: 'section-design-engineering-placeholder',
          isPlaceholder: true,
          label: 'Design and engineering allowance',
          note: 'Final structural, MEP and permit design scope requires review.',
          quantity: '1 allowance',
          subtotal: designEngineeringSubtotal,
          unit: 'allowance',
          unitCost: designEngineeringSubtotal,
        },
      ],
    }),
    createSection({
      confidence: 'siteDependent',
      description: 'Commercial and tax placeholders carried separately from production package costs.',
      id: 'vatMarginContingency',
      label: 'VAT/margin/contingency',
      lineItems: [
        {
          confidence: 'siteDependent',
          id: 'section-margin-placeholder',
          isPlaceholder: true,
          label: 'Margin placeholder',
          note: 'Preview margin allocation only.',
          quantity: '1 allowance',
          subtotal: marginSubtotal,
          unit: 'allowance',
          unitCost: marginSubtotal,
        },
        {
          confidence: 'siteDependent',
          id: 'section-contingency-placeholder',
          isPlaceholder: true,
          label: 'Contingency placeholder',
          note: 'Preview contingency allocation only.',
          quantity: '1 allowance',
          subtotal: contingencySubtotal,
          unit: 'allowance',
          unitCost: contingencySubtotal,
        },
        {
          confidence: 'estimated',
          id: `section-${input.vatEstimate.id}`,
          isPlaceholder: true,
          label: input.vatEstimate.label,
          note: input.vatEstimate.note,
          priceSource: 'internalPreview',
          quantity: '1 placeholder',
          subtotal: input.vatEstimate.amount,
          sourceCategory: input.vatEstimate.category,
          unit: 'VAT placeholder',
          unitCost: input.vatEstimate.amount,
        },
      ],
    }),
    createSection({
      confidence: 'requiresEngineering',
      description: 'Items not priced in the preview estimate and requiring project review.',
      id: 'excludedSiteDependent',
      label: 'Excluded/site-dependent',
      lineItems: [
        {
          confidence: 'requiresEngineering',
          id: 'section-excluded-site-preparation',
          isExcluded: true,
          label: 'Site preparation and earthworks',
          note: 'Requires site survey and local contractor pricing.',
          quantity: 'review',
          subtotal: null,
          unit: 'site',
          unitCost: null,
        },
        {
          confidence: 'requiresEngineering',
          id: 'section-excluded-foundation',
          isExcluded: true,
          label: 'Final foundation design and works',
          note: 'Foundation choice depends on soil, loads and municipality requirements.',
          quantity: 'review',
          subtotal: null,
          unit: 'site',
          unitCost: null,
        },
        {
          confidence: 'requiresEngineering',
          id: 'section-excluded-permits-utilities',
          isExcluded: true,
          label: 'Permits, utility connections and municipality fees',
          note: 'Local requirements are outside preview pricing.',
          quantity: 'review',
          subtotal: null,
          unit: 'project',
          unitCost: null,
        },
      ],
    }),
  ];
}

export function getModularHomeScopeOfSupply(
  selectedOptions: ReturnType<typeof getModularHomeProductConfigSummary>,
): readonly ModularHomeScopeOfSupplySection[] {
  return [
    {
      id: 'included',
      label: 'Included',
      items: [
        'Timber module shell',
        `${selectedOptions.windowPackage} window package`,
        `${selectedOptions.doorPackage} door package`,
        `${selectedOptions.windowPlacement} controlled window placement`,
        `${selectedOptions.doorPlacement} controlled door placement`,
        `${selectedOptions.facade} facade package`,
        `${selectedOptions.facadeBoardOrientation} facade board orientation`,
        `${selectedOptions.facadeBoardWidth} facade board width`,
        `${selectedOptions.facadeBoardProfile} facade board profile`,
        `${selectedOptions.facadeBoardSpacing} facade board spacing`,
        `${selectedOptions.trimColor} trim color`,
        `${selectedOptions.roof} package`,
        `${selectedOptions.roofEdgeColor} roof edge color`,
        `${selectedOptions.roofGutterStyle} roof edge/gutter style`,
        `${selectedOptions.layoutVariant} layout planning preview`,
        `${selectedOptions.windowFrameColor} window frame color`,
        `${selectedOptions.windowFrameType} window frame type`,
        `${selectedOptions.interiorWallFinish} interior wall finish`,
        `${selectedOptions.floorFinish} floor finish`,
        `${selectedOptions.interiorFloorStyle} interior floor style`,
        `${selectedOptions.wallPanelStyle} wall panel style`,
        `${selectedOptions.furniturePackage} interior furniture package`,
        `Furniture toggles: sofa ${selectedOptions.sofa}, table ${selectedOptions.table}, bed ${selectedOptions.bed}, kitchen ${selectedOptions.kitchenLine}, wardrobe ${selectedOptions.wardrobePlaceholder}`,
        selectedOptions.terrace === 'No terrace'
          ? 'No terrace extension selected'
          : `${selectedOptions.terrace} extension package`,
        'Basic installation planning',
      ],
    },
    {
      id: 'optional',
      label: 'Optional',
      items: [
        'Foundation',
        'Terrace foundation and structural review',
        'Transport planning and delivery',
        'Utility connections',
        'Interior premium package',
        'Permits/design services',
      ],
    },
    {
      id: 'requiresReview',
      label: 'Not included / requires review',
      items: [
        'Site preparation',
        'Local permits',
        'Engineering verification',
        'Final transport cost',
        'Municipality-specific requirements',
      ],
    },
  ];
}

export function calculateModularHomeEstimate(config: ModularHomeConfiguratorState): ModularHomeEstimate {
  const template = getModularHomeTemplate(config.template);
  const product = getModularHomeProductForConfig(config);
  const quantities = calculateModularHomeQuantities(config);
  const selectedOptions = getModularHomeProductConfigSummary(config);
  const basePrice = product?.basePrice ?? template.basePrice;
  const lineItems = [
    ...createBaseLineItems(basePrice, product?.id),
    ...createOptionLineItems(config),
  ];
  const subtotal = sumLineItems(lineItems);
  const optionalServices = createOptionalServices(
    quantities.grossFloorAreaM2 || product?.floorAreaM2 || (Number.parseInt(template.sizeLabel, 10) || 40),
    quantities.transportModuleCount || product?.transportModuleCount || 2,
  );
  const optionalServicesTotal = sumLineItems(optionalServices);
  const vatEstimate = createVatEstimate(subtotal + optionalServicesTotal);
  const estimatedTotal = subtotal + optionalServicesTotal + vatEstimate.amount;
  const baseModel = product?.name ?? template.name;
  const scenarios = createEstimateScenarios({
    estimatedTotal,
    optionalServicesTotal,
    productName: baseModel,
    subtotal,
  });
  const pricing = summarizeModularHomePricing([
    ...lineItems.map((item) => item.pricingBreakdown),
    ...optionalServices.map((item) => item.pricingBreakdown),
    vatEstimate.pricingBreakdown,
  ]);
  const sections = createModularHomeEstimateSections({
    lineItems,
    optionalServices,
    pricing,
    quantities,
    selectedOptions,
    vatEstimate,
  });
  const adjustments = [
    ...lineItems.slice(2),
    ...optionalServices,
    vatEstimate,
  ]
    .map(createAdjustment)
    .filter((item): item is ModularHomeEstimateAdjustment => item !== null);

  return {
    adjustments,
    baseModel,
    basePrice,
    basePriceLabel: 'Base modules + bathroom core',
    disclaimer: MODULAR_HOME_ESTIMATE_CONFIG.disclaimer,
    estimatedTotal,
    lineItems,
    optionalServices,
    optionalServicesTotal,
    pricing,
    priceConfidenceVersion: 'v5',
    quantities,
    scenarios,
    selectedOptions,
    sections,
    sizeLabel: product ? `${product.floorAreaM2} m2` : template.sizeLabel,
    scopeOfSupply: getModularHomeScopeOfSupply(selectedOptions),
    subtotal,
    templateId: product?.defaultTemplateId ?? template.templateId,
    totalPrice: estimatedTotal,
    vatEstimate,
    vatRate: MODULAR_HOME_ESTIMATE_CONFIG.vatRate,
  };
}

export function calculateHomeEstimate(config: ModularHomeConfiguratorState): ModularHomeEstimate {
  return calculateModularHomeEstimate(config);
}

export function formatHomeEstimateEur(amount: number) {
  return new Intl.NumberFormat('en-IE', {
    currency: 'EUR',
    maximumFractionDigits: 0,
    style: 'currency',
  }).format(amount);
}
