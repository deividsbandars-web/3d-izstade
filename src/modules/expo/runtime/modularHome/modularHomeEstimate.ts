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
  type ModularHomePricingConfidenceLevel,
  type ModularHomePricingSummary,
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
  | 'transport'
  | 'installation'
  | 'vat';

export type ModularHomeEstimateLineItem = {
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

export type ModularHomeEstimateSectionLineItem = {
  confidence: ModularHomePricingConfidenceLevel;
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
  confidence: ModularHomePricingConfidenceLevel;
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
  quantities: ModularHomeQuantityTakeoff;
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
  disclaimer: 'Estimate only · final quote depends on site, transport, VAT, foundations, utilities and engineering.',
  installationPerM2: 180,
  transportBase: 900,
  transportPerModule: 1800,
  vatRate: 0.21,
} as const;

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
  ) {
    return option.group;
  }

  return 'facade';
}

function getOptionLineItemLabel(option: ModularHomeOption): string {
  const labelByGroup = {
    doorPackage: 'Door package',
    facade: 'Facade',
    finish: 'Finish level',
    roof: 'Roof',
    terrace: 'Terrace',
    windowPackage: 'Window package',
  } as const;

  return `${labelByGroup[option.group]}: ${option.label}`;
}

function createBaseLineItems(
  basePrice: number,
  productId: string | undefined,
): readonly ModularHomeEstimateLineItem[] {
  if (!productId) {
    return [
      {
        amount: basePrice,
        category: 'baseProduct',
        id: 'base-product',
        label: 'Base product module package',
        pricingBreakdown: createModulePricingBreakdown(basePrice, 'living'),
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

  return [
    {
      amount: baseModuleTotal,
      category: 'baseProduct',
      id: `${productId}-base-modules`,
      label: 'Base product module package',
      note: moduleNote || undefined,
      pricingBreakdown: createModulePackagePricingBreakdown(baseModuleTotal, nonBathroomModules),
    },
    {
      amount: bathroomCoreTotal,
      category: 'bathroomCore',
      id: `${productId}-bathroom-core`,
      label: 'Bathroom core allowance',
      note: bathroomCoreTotal > 0 ? 'Wet-room/service core placeholder included in the structured preview.' : undefined,
      pricingBreakdown: createModulePricingBreakdown(bathroomCoreTotal, 'bathroomCore'),
    },
  ];
}

function createOptionLineItems(config: ModularHomeConfiguratorState): readonly ModularHomeEstimateLineItem[] {
  return getSelectedModularHomeOptions(config).map((option) => ({
    amount: option.priceDelta,
    category: getOptionLineItemCategory(option),
    id: option.id,
    label: getOptionLineItemLabel(option),
    note: option.priceDelta === 0 ? 'Included in selected package.' : undefined,
    pricingBreakdown: createOptionPricingBreakdown(option.priceDelta, option.group),
  }));
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
    },
    {
      amount: installationAmount,
      category: 'installation',
      id: 'installation-placeholder',
      isPlaceholder: true,
      label: 'Installation placeholder',
      note: 'Preview allowance only. Final installation depends on foundation, utilities and site readiness.',
      pricingBreakdown: createInstallationPricingBreakdown(installationAmount),
    },
  ];
}

function createVatEstimate(taxableAmount: number): ModularHomeEstimateLineItem {
  return {
    amount: roundToNearestFifty(taxableAmount * MODULAR_HOME_ESTIMATE_CONFIG.vatRate),
    category: 'vat',
    id: 'vat-placeholder',
    isPlaceholder: true,
    label: 'VAT placeholder',
    note: `${Math.round(MODULAR_HOME_ESTIMATE_CONFIG.vatRate * 100)}% placeholder for review estimates only.`,
    pricingBreakdown: createVatPricingBreakdown(roundToNearestFifty(taxableAmount * MODULAR_HOME_ESTIMATE_CONFIG.vatRate)),
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

function createSection(input: Omit<ModularHomeEstimateSection, 'subtotal'>): ModularHomeEstimateSection {
  return {
    ...input,
    subtotal: sumSectionLineItems(input.lineItems),
  };
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
      confidence: 'medium',
      description: 'Factory module shell, wet core and base package allowances.',
      id: 'modulePackage',
      label: 'Module package',
      lineItems: modulePackageItems.map((item) => {
        const quantity = item.category === 'bathroomCore'
          ? input.quantities.bathroomCoreCount
          : input.quantities.moduleCount;

        return {
          confidence: 'medium',
          id: `section-${item.id}`,
          label: item.label,
          note: item.note,
          quantity: item.category === 'bathroomCore'
            ? formatEstimateQuantity(input.quantities.bathroomCoreCount, ' core')
            : formatEstimateQuantity(input.quantities.moduleCount, ' modules'),
          subtotal: item.amount,
          unit: item.category === 'bathroomCore' ? 'core' : 'module package',
          unitCost: getUnitCost(item.amount, quantity),
        };
      }),
    }),
    createSection({
      confidence: 'low',
      description: 'Aggregated material allowance from component and option pricing categories.',
      id: 'materials',
      label: 'Materials',
      lineItems: [
        {
          confidence: 'low',
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
      confidence: 'low',
      description: 'Factory labor allowance from module and option pricing categories.',
      id: 'factoryLabor',
      label: 'Factory labor',
      lineItems: [
        {
          confidence: 'low',
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
      confidence: 'low',
      description: 'Selected interior/finish package.',
      id: 'finishPackage',
      label: 'Finish package',
      lineItems: [
        {
          confidence: 'low',
          id: `section-${finishItem?.id ?? 'finish-package'}`,
          label: finishItem?.label ?? `Finish level: ${input.selectedOptions.finishLevel}`,
          note: finishItem?.note ?? 'Finish package estimate remains preview-only.',
          quantity: '1 package',
          subtotal: finishItem?.amount ?? 0,
          unit: 'finish package',
          unitCost: finishItem?.amount ?? 0,
        },
      ],
    }),
    createSection({
      confidence: 'low',
      description: 'Selected terrace or extension package.',
      id: 'terraceExtensions',
      label: 'Terrace/extensions',
      lineItems: [
        {
          confidence: input.selectedOptions.terrace === 'No terrace' ? 'placeholder' : 'low',
          id: `section-${terraceItem?.id ?? 'terrace-extension'}`,
          isPlaceholder: input.selectedOptions.terrace === 'No terrace',
          label: terraceItem?.label ?? `Terrace: ${input.selectedOptions.terrace}`,
          note: terraceItem?.note ?? 'Terrace extension package requires foundation/interface review.',
          quantity: input.quantities.terraceAreaM2 > 0
            ? formatEstimateQuantity(input.quantities.terraceAreaM2, ' m2')
            : '0 m2',
          subtotal: terraceItem?.amount ?? 0,
          unit: 'terrace area',
          unitCost: getUnitCost(terraceItem?.amount ?? 0, input.quantities.terraceAreaM2),
        },
      ],
    }),
    createSection({
      confidence: 'placeholder',
      description: 'Transport allowance only; final logistics are route and site dependent.',
      id: 'transportPlaceholder',
      label: 'Transport placeholder',
      lineItems: [
        {
          confidence: 'placeholder',
          id: `section-${transportItem?.id ?? 'transport-placeholder'}`,
          isPlaceholder: true,
          label: transportItem?.label ?? 'Transport placeholder',
          note: transportItem?.note,
          quantity: formatEstimateQuantity(input.quantities.transportModuleCount, ' transport modules'),
          subtotal: transportItem?.amount ?? 0,
          unit: 'transport module',
          unitCost: getUnitCost(transportItem?.amount ?? 0, input.quantities.transportModuleCount),
        },
      ],
    }),
    createSection({
      confidence: 'placeholder',
      description: 'Installation allowance only; final site readiness and foundation scope are not included.',
      id: 'installationPlaceholder',
      label: 'Installation placeholder',
      lineItems: [
        {
          confidence: 'placeholder',
          id: `section-${installationItem?.id ?? 'installation-placeholder'}`,
          isPlaceholder: true,
          label: installationItem?.label ?? 'Installation placeholder',
          note: installationItem?.note,
          quantity: formatEstimateQuantity(grossFloorArea, ' m2'),
          subtotal: installationItem?.amount ?? 0,
          unit: 'gross floor m2',
          unitCost: getUnitCost(installationItem?.amount ?? 0, grossFloorArea),
        },
      ],
    }),
    createSection({
      confidence: 'placeholder',
      description: 'Design and engineering allocation from preview pricing categories.',
      id: 'designEngineeringPlaceholder',
      label: 'Design/engineering placeholder',
      lineItems: [
        {
          confidence: 'placeholder',
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
      confidence: 'placeholder',
      description: 'Commercial and tax placeholders carried separately from production package costs.',
      id: 'vatMarginContingency',
      label: 'VAT/margin/contingency',
      lineItems: [
        {
          confidence: 'placeholder',
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
          confidence: 'placeholder',
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
          confidence: 'placeholder',
          id: `section-${input.vatEstimate.id}`,
          isPlaceholder: true,
          label: input.vatEstimate.label,
          note: input.vatEstimate.note,
          quantity: '1 placeholder',
          subtotal: input.vatEstimate.amount,
          unit: 'VAT placeholder',
          unitCost: input.vatEstimate.amount,
        },
      ],
    }),
    createSection({
      confidence: 'placeholder',
      description: 'Items not priced in the preview estimate and requiring project review.',
      id: 'excludedSiteDependent',
      label: 'Excluded/site-dependent',
      lineItems: [
        {
          confidence: 'placeholder',
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
          confidence: 'placeholder',
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
          confidence: 'placeholder',
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
        `${selectedOptions.facade} facade package`,
        `${selectedOptions.roof} package`,
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
    baseModel: product?.name ?? template.name,
    basePrice,
    basePriceLabel: 'Base modules + bathroom core',
    disclaimer: MODULAR_HOME_ESTIMATE_CONFIG.disclaimer,
    estimatedTotal,
    lineItems,
    optionalServices,
    optionalServicesTotal,
    pricing,
    quantities,
    selectedOptions,
    sections,
    sizeLabel: product ? `${product.floorAreaM2} m²` : template.sizeLabel,
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
