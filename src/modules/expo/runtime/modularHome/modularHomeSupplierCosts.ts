import type { ModularHomeComponentCategory } from './modularHomeComponents';
import {
  getPricingCategoriesForComponentCategory,
  type ModularHomeCostRegion,
  type ModularHomeCurrency,
  type ModularHomePricingCategory,
  type ModularHomePricingConfidenceLevel,
  type ModularHomePricingSourceType,
} from './modularHomePricing';

export type ModularHomeSupplierCostCategory = ModularHomePricingCategory | ModularHomeComponentCategory;
export type ModularHomeSupplierCostUnit = 'm2' | 'linearM' | 'piece' | 'package' | 'set';

export type ModularHomeSupplierCostItem = {
  category: ModularHomeSupplierCostCategory;
  confidence: ModularHomePricingConfidenceLevel;
  currency: ModularHomeCurrency;
  itemCode: string;
  itemName: string;
  notes: string;
  region: ModularHomeCostRegion;
  sourceType: ModularHomePricingSourceType;
  supplierId: string;
  supplierName: string;
  unit: ModularHomeSupplierCostUnit;
  unitCost: number;
  validFrom: string;
};

export type ModularHomeSupplierCostValidationIssue = {
  field: keyof ModularHomeSupplierCostItem | 'index';
  itemCode: string | null;
  level: 'error' | 'warning';
  message: string;
};

export type ModularHomeSupplierCostValidationResult = {
  errors: readonly ModularHomeSupplierCostValidationIssue[];
  valid: boolean;
  warnings: readonly ModularHomeSupplierCostValidationIssue[];
};

export type ModularHomeSupplierCostPricingMap = {
  byCategory: Readonly<Record<ModularHomeSupplierCostCategory, readonly ModularHomeSupplierCostItem[]>>;
  byComponentCode: Readonly<Record<string, ModularHomeSupplierCostItem>>;
  errors: readonly ModularHomeSupplierCostValidationIssue[];
  pricingCategoryMap: Readonly<Record<ModularHomePricingCategory, readonly ModularHomeSupplierCostItem[]>>;
  validItems: readonly ModularHomeSupplierCostItem[];
  warnings: readonly ModularHomeSupplierCostValidationIssue[];
};

export const MODULAR_HOME_SUPPLIER_COST_DATASET_NOTE = 'Supplier pricing is preview data unless verified.';

const SUPPORTED_UNITS = new Set<ModularHomeSupplierCostUnit>(['linearM', 'm2', 'package', 'piece', 'set']);
const SUPPORTED_CURRENCIES = new Set<ModularHomeCurrency>(['EUR']);
const SUPPORTED_REGIONS = new Set<ModularHomeCostRegion>(['eu-preview']);
const SUPPORTED_CONFIDENCE = new Set<ModularHomePricingConfidenceLevel>(['high', 'low', 'medium', 'placeholder']);
const SUPPORTED_SOURCE_TYPES = new Set<ModularHomePricingSourceType>(['internalDatabase', 'manualReview', 'supplierBudgetPlaceholder']);

const SUPPLIER_COST_CATEGORIES = [
  'material',
  'factoryLabor',
  'installation',
  'transport',
  'designEngineering',
  'margin',
  'vat',
  'contingency',
  'wallPanel',
  'floorCassette',
  'roofCassette',
  'facadeBoarding',
  'windowUnit',
  'doorUnit',
  'bathroomCore',
  'kitchenLine',
  'terraceDeck',
  'foundationPad',
  'interiorFinish',
  'furniturePackage',
] as const satisfies readonly ModularHomeSupplierCostCategory[];

export const MODULAR_HOME_SUPPLIER_COST_ITEMS = [
  {
    category: 'wallPanel',
    confidence: 'medium',
    currency: 'EUR',
    itemCode: 'MHC-TIMBER-WALL-PANEL-SYSTEM',
    itemName: 'Timber wall panel system',
    notes: 'Preview supplier budget line for shell panel package.',
    region: 'eu-preview',
    sourceType: 'supplierBudgetPlaceholder',
    supplierId: 'timber-shell-eu',
    supplierName: 'Timber Shell Supplier Placeholder',
    unit: 'm2',
    unitCost: 92,
    validFrom: '2026-06-10',
  },
  {
    category: 'floorCassette',
    confidence: 'medium',
    currency: 'EUR',
    itemCode: 'MHC-TIMBER-FLOOR-CASSETTE-SYSTEM',
    itemName: 'Timber floor cassette system',
    notes: 'Preview supplier budget line for modular floor cassette package.',
    region: 'eu-preview',
    sourceType: 'supplierBudgetPlaceholder',
    supplierId: 'timber-shell-eu',
    supplierName: 'Timber Shell Supplier Placeholder',
    unit: 'm2',
    unitCost: 78,
    validFrom: '2026-06-10',
  },
  {
    category: 'roofCassette',
    confidence: 'medium',
    currency: 'EUR',
    itemCode: 'MHC-FLAT-ROOF-CASSETTE-SYSTEM',
    itemName: 'Flat roof cassette package',
    notes: 'Preview roof supplier package baseline.',
    region: 'eu-preview',
    sourceType: 'supplierBudgetPlaceholder',
    supplierId: 'roof-package-eu',
    supplierName: 'Roof Package Supplier Placeholder',
    unit: 'm2',
    unitCost: 104,
    validFrom: '2026-06-10',
  },
  {
    category: 'roofCassette',
    confidence: 'placeholder',
    currency: 'EUR',
    itemCode: 'MHC-PITCHED-ROOF-CASSETTE-SYSTEM',
    itemName: 'Pitched roof cassette package',
    notes: 'Preview pitched roof allowance pending supplier confirmation.',
    region: 'eu-preview',
    sourceType: 'manualReview',
    supplierId: 'roof-package-eu',
    supplierName: 'Roof Package Supplier Placeholder',
    unit: 'm2',
    unitCost: 128,
    validFrom: '2026-06-10',
  },
  {
    category: 'facadeBoarding',
    confidence: 'medium',
    currency: 'EUR',
    itemCode: 'MHC-NATURAL-TIMBER-FACADE-BOARDING',
    itemName: 'Natural timber facade boarding',
    notes: 'Preview cladding supplier rate before profile verification.',
    region: 'eu-preview',
    sourceType: 'supplierBudgetPlaceholder',
    supplierId: 'facade-boards-eu',
    supplierName: 'Facade Board Supplier Placeholder',
    unit: 'linearM',
    unitCost: 8.6,
    validFrom: '2026-06-10',
  },
  {
    category: 'facadeBoarding',
    confidence: 'placeholder',
    currency: 'EUR',
    itemCode: 'MHC-DARK-THERMO-FACADE-BOARDING',
    itemName: 'Dark thermo facade boarding',
    notes: 'Thermo board allowance requires supplier stock confirmation.',
    region: 'eu-preview',
    sourceType: 'manualReview',
    supplierId: 'facade-boards-eu',
    supplierName: 'Facade Board Supplier Placeholder',
    unit: 'linearM',
    unitCost: 10.9,
    validFrom: '2026-06-10',
  },
  {
    category: 'facadeBoarding',
    confidence: 'placeholder',
    currency: 'EUR',
    itemCode: 'MHC-LIGHT-PAINTED-FACADE-BOARDING',
    itemName: 'Light painted facade boarding',
    notes: 'Painted board finish remains preview until coating supplier review.',
    region: 'eu-preview',
    sourceType: 'manualReview',
    supplierId: 'facade-boards-eu',
    supplierName: 'Facade Board Supplier Placeholder',
    unit: 'linearM',
    unitCost: 11.8,
    validFrom: '2026-06-10',
  },
  {
    category: 'windowUnit',
    confidence: 'medium',
    currency: 'EUR',
    itemCode: 'WIN-STD',
    itemName: 'Standard window unit',
    notes: 'Preview standard window supplier rate.',
    region: 'eu-preview',
    sourceType: 'supplierBudgetPlaceholder',
    supplierId: 'window-systems-eu',
    supplierName: 'Window Systems Supplier Placeholder',
    unit: 'piece',
    unitCost: 740,
    validFrom: '2026-06-10',
  },
  {
    category: 'windowUnit',
    confidence: 'placeholder',
    currency: 'EUR',
    itemCode: 'WIN-PANO',
    itemName: 'Panoramic window unit',
    notes: 'Panoramic glazing requires supplier confirmation and engineering review.',
    region: 'eu-preview',
    sourceType: 'manualReview',
    supplierId: 'window-systems-eu',
    supplierName: 'Window Systems Supplier Placeholder',
    unit: 'piece',
    unitCost: 1480,
    validFrom: '2026-06-10',
  },
  {
    category: 'windowUnit',
    confidence: 'placeholder',
    currency: 'EUR',
    itemCode: 'WIN-CORNER',
    itemName: 'Corner glazing unit',
    notes: 'Corner glazing is preview-only until structural and supplier review.',
    region: 'eu-preview',
    sourceType: 'manualReview',
    supplierId: 'window-systems-eu',
    supplierName: 'Window Systems Supplier Placeholder',
    unit: 'piece',
    unitCost: 1620,
    validFrom: '2026-06-10',
  },
  {
    category: 'doorUnit',
    confidence: 'medium',
    currency: 'EUR',
    itemCode: 'DR-STD',
    itemName: 'Standard exterior door',
    notes: 'Preview standard entry door supplier rate.',
    region: 'eu-preview',
    sourceType: 'supplierBudgetPlaceholder',
    supplierId: 'door-systems-eu',
    supplierName: 'Door Systems Supplier Placeholder',
    unit: 'piece',
    unitCost: 980,
    validFrom: '2026-06-10',
  },
  {
    category: 'doorUnit',
    confidence: 'placeholder',
    currency: 'EUR',
    itemCode: 'DR-TRC',
    itemName: 'Terrace slider door',
    notes: 'Terrace slider allowance requires supplier system and threshold review.',
    region: 'eu-preview',
    sourceType: 'manualReview',
    supplierId: 'door-systems-eu',
    supplierName: 'Door Systems Supplier Placeholder',
    unit: 'piece',
    unitCost: 2480,
    validFrom: '2026-06-10',
  },
  {
    category: 'doorUnit',
    confidence: 'placeholder',
    currency: 'EUR',
    itemCode: 'DR-GLZ',
    itemName: 'Premium glazed entry door',
    notes: 'Premium glazed entry door remains preview until supplier quote review.',
    region: 'eu-preview',
    sourceType: 'manualReview',
    supplierId: 'door-systems-eu',
    supplierName: 'Door Systems Supplier Placeholder',
    unit: 'piece',
    unitCost: 1840,
    validFrom: '2026-06-10',
  },
  {
    category: 'bathroomCore',
    confidence: 'medium',
    currency: 'EUR',
    itemCode: 'MHC-BATHROOM-WET-CORE-KIT',
    itemName: 'Bathroom wet core kit',
    notes: 'Preview bathroom core supplier package.',
    region: 'eu-preview',
    sourceType: 'supplierBudgetPlaceholder',
    supplierId: 'wet-core-eu',
    supplierName: 'Wet Core Supplier Placeholder',
    unit: 'package',
    unitCost: 5900,
    validFrom: '2026-06-10',
  },
  {
    category: 'kitchenLine',
    confidence: 'placeholder',
    currency: 'EUR',
    itemCode: 'MHC-COMPACT-KITCHEN-LINE',
    itemName: 'Compact kitchen line',
    notes: 'Preview kitchen line allowance pending supplier spec selection.',
    region: 'eu-preview',
    sourceType: 'manualReview',
    supplierId: 'kitchen-fitout-eu',
    supplierName: 'Kitchen Supplier Placeholder',
    unit: 'package',
    unitCost: 4200,
    validFrom: '2026-06-10',
  },
  {
    category: 'terraceDeck',
    confidence: 'medium',
    currency: 'EUR',
    itemCode: 'MHC-SMALL-TERRACE-DECK-SYSTEM',
    itemName: 'Terrace deck system',
    notes: 'Preview terrace deck supplier rate before site support review.',
    region: 'eu-preview',
    sourceType: 'supplierBudgetPlaceholder',
    supplierId: 'terrace-structure-eu',
    supplierName: 'Terrace Structure Supplier Placeholder',
    unit: 'm2',
    unitCost: 124,
    validFrom: '2026-06-10',
  },
  {
    category: 'interiorFinish',
    confidence: 'medium',
    currency: 'EUR',
    itemCode: 'MHC-INTERIOR-PLYWOOD-FINISH',
    itemName: 'Interior finish package',
    notes: 'Preview interior finish supplier allowance.',
    region: 'eu-preview',
    sourceType: 'supplierBudgetPlaceholder',
    supplierId: 'interior-finish-eu',
    supplierName: 'Interior Finish Supplier Placeholder',
    unit: 'm2',
    unitCost: 29,
    validFrom: '2026-06-10',
  },
  {
    category: 'furniturePackage',
    confidence: 'placeholder',
    currency: 'EUR',
    itemCode: 'MHC-STANDARD-FURNITURE-PACKAGE',
    itemName: 'Standard furniture package',
    notes: 'Furniture remains a sales preview package until supplier list is locked.',
    region: 'eu-preview',
    sourceType: 'manualReview',
    supplierId: 'furniture-fitout-eu',
    supplierName: 'Furniture Supplier Placeholder',
    unit: 'package',
    unitCost: 6900,
    validFrom: '2026-06-10',
  },
  {
    category: 'transport',
    confidence: 'placeholder',
    currency: 'EUR',
    itemCode: 'LOG-TRANSPORT-MODULE',
    itemName: 'Transport module placeholder',
    notes: 'Transport remains local-route dependent.',
    region: 'eu-preview',
    sourceType: 'manualReview',
    supplierId: 'transport-logistics-eu',
    supplierName: 'Transport Logistics Placeholder',
    unit: 'set',
    unitCost: 1800,
    validFrom: '2026-06-10',
  },
] as const satisfies readonly ModularHomeSupplierCostItem[];

function createCategoryRecord<T>(valueFactory: () => T): Record<ModularHomeSupplierCostCategory, T> {
  return Object.fromEntries(
    SUPPLIER_COST_CATEGORIES.map((category) => [category, valueFactory()]),
  ) as Record<ModularHomeSupplierCostCategory, T>;
}

function createPricingCategoryRecord<T>(valueFactory: () => T): Record<ModularHomePricingCategory, T> {
  return Object.fromEntries(
    ['material', 'factoryLabor', 'installation', 'transport', 'designEngineering', 'margin', 'vat', 'contingency'].map((category) => [category, valueFactory()]),
  ) as Record<ModularHomePricingCategory, T>;
}

function isSupportedCategory(category: string): category is ModularHomeSupplierCostCategory {
  return (SUPPLIER_COST_CATEGORIES as readonly string[]).includes(category);
}

function getPricingCategoriesForSupplierCostCategory(
  category: ModularHomeSupplierCostCategory,
): readonly ModularHomePricingCategory[] {
  switch (category) {
    case 'material':
    case 'factoryLabor':
    case 'installation':
    case 'transport':
    case 'designEngineering':
    case 'margin':
    case 'vat':
    case 'contingency':
      return [category];
    default:
      return getPricingCategoriesForComponentCategory(category);
  }
}

function createIssue(
  field: keyof ModularHomeSupplierCostItem | 'index',
  itemCode: string | null,
  level: 'error' | 'warning',
  message: string,
): ModularHomeSupplierCostValidationIssue {
  return { field, itemCode, level, message };
}

export function validateSupplierCostItems(
  items: readonly ModularHomeSupplierCostItem[],
): ModularHomeSupplierCostValidationResult {
  const errors: ModularHomeSupplierCostValidationIssue[] = [];
  const warnings: ModularHomeSupplierCostValidationIssue[] = [];
  const seenCodes = new Set<string>();

  items.forEach((item, index) => {
    const itemCode = typeof item?.itemCode === 'string' ? item.itemCode : null;

    if (!item || typeof item !== 'object') {
      errors.push(createIssue('index', null, 'error', `Item at index ${index} is not an object.`));
      return;
    }

    if (!item.supplierId?.trim()) {
      errors.push(createIssue('supplierId', itemCode, 'error', 'supplierId is required.'));
    }
    if (!item.supplierName?.trim()) {
      errors.push(createIssue('supplierName', itemCode, 'error', 'supplierName is required.'));
    }
    if (!item.itemCode?.trim()) {
      errors.push(createIssue('itemCode', itemCode, 'error', 'itemCode is required.'));
    } else if (seenCodes.has(item.itemCode)) {
      errors.push(createIssue('itemCode', item.itemCode, 'error', 'itemCode must be unique.'));
    } else {
      seenCodes.add(item.itemCode);
    }
    if (!item.itemName?.trim()) {
      errors.push(createIssue('itemName', itemCode, 'error', 'itemName is required.'));
    }
    if (!isSupportedCategory(item.category)) {
      errors.push(createIssue('category', itemCode, 'error', `Unsupported category: ${String(item.category)}.`));
    }
    if (!SUPPORTED_UNITS.has(item.unit)) {
      errors.push(createIssue('unit', itemCode, 'error', `Unsupported unit: ${String(item.unit)}.`));
    }
    if (!Number.isFinite(item.unitCost) || item.unitCost <= 0) {
      errors.push(createIssue('unitCost', itemCode, 'error', 'unitCost must be a positive number.'));
    }
    if (!SUPPORTED_CURRENCIES.has(item.currency)) {
      errors.push(createIssue('currency', itemCode, 'error', `Unsupported currency: ${String(item.currency)}.`));
    }
    if (!SUPPORTED_REGIONS.has(item.region)) {
      errors.push(createIssue('region', itemCode, 'error', `Unsupported region: ${String(item.region)}.`));
    }
    if (!SUPPORTED_CONFIDENCE.has(item.confidence)) {
      errors.push(createIssue('confidence', itemCode, 'error', `Unsupported confidence: ${String(item.confidence)}.`));
    }
    if (!SUPPORTED_SOURCE_TYPES.has(item.sourceType)) {
      errors.push(createIssue('sourceType', itemCode, 'error', `Unsupported sourceType: ${String(item.sourceType)}.`));
    }
    if (!item.validFrom?.trim() || Number.isNaN(Date.parse(item.validFrom))) {
      errors.push(createIssue('validFrom', itemCode, 'error', 'validFrom must be an ISO-like parseable date.'));
    }
    if (!item.notes?.trim()) {
      warnings.push(createIssue('notes', itemCode, 'warning', 'notes is empty; add sourcing context.'));
    }
  });

  return {
    errors,
    valid: errors.length === 0,
    warnings,
  };
}

export function mapSupplierCostToPricingDatabase(
  items: readonly ModularHomeSupplierCostItem[],
): ModularHomeSupplierCostPricingMap {
  const validation = validateSupplierCostItems(items);
  const validItems = validation.valid ? [...items] : [];
  const byCategory = createCategoryRecord<readonly ModularHomeSupplierCostItem[]>(() => []);
  const pricingCategoryMap = createPricingCategoryRecord<readonly ModularHomeSupplierCostItem[]>(() => []);
  const byComponentCode: Record<string, ModularHomeSupplierCostItem> = {};

  for (const item of validItems) {
    byCategory[item.category] = [...byCategory[item.category], item];
    for (const pricingCategory of getPricingCategoriesForSupplierCostCategory(item.category)) {
      pricingCategoryMap[pricingCategory] = [...pricingCategoryMap[pricingCategory], item];
    }
    byComponentCode[item.itemCode] = item;
  }

  return {
    byCategory,
    byComponentCode,
    errors: validation.errors,
    pricingCategoryMap,
    validItems,
    warnings: validation.warnings,
  };
}

export const MODULAR_HOME_DEFAULT_SUPPLIER_COST_MAP = mapSupplierCostToPricingDatabase(MODULAR_HOME_SUPPLIER_COST_ITEMS);

export function getCostItemsByCategory(
  category: ModularHomeSupplierCostCategory,
): readonly ModularHomeSupplierCostItem[] {
  return MODULAR_HOME_DEFAULT_SUPPLIER_COST_MAP.byCategory[category] ?? [];
}

export function getCostItemForComponent(componentCode: string): ModularHomeSupplierCostItem | null {
  return MODULAR_HOME_DEFAULT_SUPPLIER_COST_MAP.byComponentCode[componentCode] ?? null;
}
