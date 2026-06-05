import {
  type ModularHomeConfiguratorState,
} from './modularHomeConfigurator';
import { getModularHomeTemplate, type ModularHomeTemplateId } from './modularHomeConfig';
import {
  getModularHomeProductConfigSummary,
  getModularHomeProductForConfig,
  getModulesForProduct,
  getSelectedModularHomeOptions,
  type ModularHomeOption,
} from './modularHomeProducts';

export type ModularHomeEstimateLineItemCategory =
  | 'baseProduct'
  | 'bathroomCore'
  | 'facade'
  | 'roof'
  | 'terrace'
  | 'finish'
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
  selectedOptions: ReturnType<typeof getModularHomeProductConfigSummary>;
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

function getOptionLineItemCategory(option: ModularHomeOption): ModularHomeEstimateLineItemCategory {
  if (option.group === 'finish') {
    return 'finish';
  }

  if (option.group === 'facade' || option.group === 'roof' || option.group === 'terrace') {
    return option.group;
  }

  return 'facade';
}

function getOptionLineItemLabel(option: ModularHomeOption): string {
  const labelByGroup = {
    facade: 'Facade',
    finish: 'Finish level',
    roof: 'Roof',
    terrace: 'Terrace',
  } as const;

  const labelPrefix = option.group === 'windowPackage'
    ? 'Window package'
    : labelByGroup[option.group];

  return `${labelPrefix}: ${option.label}`;
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

  return [
    {
      amount: baseModuleTotal,
      category: 'baseProduct',
      id: `${productId}-base-modules`,
      label: 'Base product module package',
      note: moduleNote || undefined,
    },
    {
      amount: bathroomCoreTotal,
      category: 'bathroomCore',
      id: `${productId}-bathroom-core`,
      label: 'Bathroom core allowance',
      note: bathroomCoreTotal > 0 ? 'Wet-room/service core placeholder included in the structured preview.' : undefined,
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
    },
    {
      amount: installationAmount,
      category: 'installation',
      id: 'installation-placeholder',
      isPlaceholder: true,
      label: 'Installation placeholder',
      note: 'Preview allowance only. Final installation depends on foundation, utilities and site readiness.',
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
  };
}

function createAdjustment(item: ModularHomeEstimateLineItem): ModularHomeEstimateAdjustment | null {
  return item.amount === 0 ? null : {
    amount: item.amount,
    id: item.id,
    label: item.label,
  };
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
        'Windows/doors according to selected package',
        `${selectedOptions.facade} facade package`,
        `${selectedOptions.roof} package`,
        'Basic installation planning',
      ],
    },
    {
      id: 'optional',
      label: 'Optional',
      items: [
        'Foundation',
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
  const selectedOptions = getModularHomeProductConfigSummary(config);
  const basePrice = product?.basePrice ?? template.basePrice;
  const lineItems = [
    ...createBaseLineItems(basePrice, product?.id),
    ...createOptionLineItems(config),
  ];
  const subtotal = sumLineItems(lineItems);
  const optionalServices = createOptionalServices(
    product?.floorAreaM2 ?? (Number.parseInt(template.sizeLabel, 10) || 40),
    product?.transportModuleCount ?? 2,
  );
  const optionalServicesTotal = sumLineItems(optionalServices);
  const vatEstimate = createVatEstimate(subtotal + optionalServicesTotal);
  const estimatedTotal = subtotal + optionalServicesTotal + vatEstimate.amount;
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
    selectedOptions,
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
