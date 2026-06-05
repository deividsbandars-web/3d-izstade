import type { ModularHomeTemplateId } from './modularHomeConfig';
import {
  DEFAULT_MODULAR_HOME_CONFIG,
  type ModularHomeConfiguratorState,
  type ModularHomeFacadeOption,
  type ModularHomeFinishLevelOption,
  type ModularHomeRoofOption,
  type ModularHomeTerraceOption,
} from './modularHomeConfigurator';

export type ModularHomeProductId = 'compact-timber-40' | 'family-timber-80' | 'sauna-cabin-25';

export type ModularHomeProductCategory =
  | 'compactHome'
  | 'familyHome'
  | 'saunaCabin';

export type ModularHomeModuleId =
  | 'compact-living-module'
  | 'compact-bedroom-module'
  | 'bathroom-core-module'
  | 'terrace-small-module'
  | 'terrace-extended-module'
  | 'family-living-module'
  | 'family-bedroom-module'
  | 'sauna-core-module'
  | 'roof-flat-module'
  | 'roof-pitched-module'
  | 'facade-natural-timber'
  | 'facade-dark-thermo'
  | 'facade-light-painted';

export type ModularHomeModuleType =
  | 'living'
  | 'bedroom'
  | 'bathroomCore'
  | 'kitchen'
  | 'terrace'
  | 'roof'
  | 'facade'
  | 'technical';

export type ModularHomeOptionGroup =
  | 'facade'
  | 'roof'
  | 'terrace'
  | 'finish'
  | 'windowPackage';

export type ModularHomeDimensions = {
  widthM: number;
  lengthM: number;
  heightM: number;
};

export type ModularHomeFootprintDimensions = {
  widthM: number;
  lengthM: number;
};

export type ModularHomeProduct = {
  id: ModularHomeProductId;
  name: string;
  category: ModularHomeProductCategory;
  floorAreaM2: number;
  footprint: ModularHomeFootprintDimensions;
  ceilingHeightM: number;
  moduleCount: number;
  transportModuleCount: number;
  buildCategoryNote: string;
  bedrooms: number;
  bathrooms: number;
  defaultTemplateId: ModularHomeTemplateId;
  // TODO: production BOM should move to moduleInstances so repeated modules can carry quantity and role explicitly.
  baseModuleIds: readonly ModularHomeModuleId[];
  defaultConfig: ModularHomeConfiguratorState;
  basePrice: number;
  shortDescription: string;
  targetUseCase: string;
  productionNotes: readonly string[];
};

export type ModularHomeModuleInstance = {
  moduleId: ModularHomeModuleId;
  quantity: number;
  role: string;
};

export type ModularHomeModule = {
  id: ModularHomeModuleId;
  type: ModularHomeModuleType;
  dimensions: ModularHomeDimensions;
  price: number;
  compatibleWith: readonly ModularHomeProductId[];
  requiredDependencies: readonly ModularHomeModuleId[];
  notes: string;
};

export type ModularHomeOption = {
  id: string;
  group: ModularHomeOptionGroup;
  label: string;
  priceDelta: number;
  visualToken: string;
  compatibleProducts: readonly ModularHomeProductId[];
  requiredModuleIds: readonly ModularHomeModuleId[];
};

export type ModularHomeProductOptionChoice = ModularHomeOption & {
  disabledReason: string;
  isCompatible: boolean;
};

export type ModularHomeProductConfigSummary = {
  facade: string;
  finishLevel: string;
  product: string;
  roof: string;
  template: string;
  terrace: string;
};

export type ModularHomeDimensionSummary = {
  buildCategoryNote: string;
  ceilingHeightLabel: string;
  ceilingHeightM: number;
  floorAreaLabel: string;
  floorAreaM2: number;
  footprintLabel: string;
  footprintLengthM: number;
  footprintWidthM: number;
  moduleCount: number;
  moduleCountLabel: string;
  transportModuleCount: number;
  transportModuleCountLabel: string;
};

const ALL_MODULAR_HOME_PRODUCT_IDS = [
  'compact-timber-40',
  'family-timber-80',
  'sauna-cabin-25',
] as const satisfies readonly ModularHomeProductId[];

export const MODULAR_HOME_PRODUCTS = [
  {
    id: 'compact-timber-40',
    name: 'Compact Timber 40',
    category: 'compactHome',
    floorAreaM2: 40,
    footprint: { widthM: 8, lengthM: 5 },
    ceilingHeightM: 2.6,
    moduleCount: 2,
    transportModuleCount: 2,
    buildCategoryNote: 'Transport-ready compact residential module concept.',
    bedrooms: 1,
    bathrooms: 1,
    defaultTemplateId: 'compactTimber40',
    baseModuleIds: [
      'compact-living-module',
      'compact-bedroom-module',
      'bathroom-core-module',
    ],
    defaultConfig: {
      facade: 'naturalTimber',
      finishLevel: 'standard',
      roof: 'pitched',
      template: 'compactTimber40',
      terrace: 'smallTerrace',
    },
    basePrice: 38000,
    shortDescription: 'A compact one-bedroom timber module for fast deployment and flexible small-site use.',
    targetUseCase: 'Starter home, guest house, rental cabin or compact backyard dwelling.',
    productionNotes: [
      'Designed around a transport-friendly timber module footprint.',
      'Preview estimate excludes site works, transport, utility connections and local engineering.',
      'Default preview assumes standard finish and small terrace readiness.',
    ],
  },
  {
    id: 'family-timber-80',
    name: 'Family Timber 80',
    category: 'familyHome',
    floorAreaM2: 80,
    footprint: { widthM: 11.2, lengthM: 7.2 },
    ceilingHeightM: 2.6,
    moduleCount: 4,
    transportModuleCount: 3,
    buildCategoryNote: 'Family-scale multi-module transport concept.',
    bedrooms: 2,
    bathrooms: 1,
    defaultTemplateId: 'familyTimber80',
    baseModuleIds: [
      'family-living-module',
      'family-bedroom-module',
      'bathroom-core-module',
    ],
    defaultConfig: {
      facade: 'naturalTimber',
      finishLevel: 'standard',
      roof: 'pitched',
      template: 'familyTimber80',
      terrace: 'extendedTerrace',
    },
    basePrice: 72000,
    shortDescription: 'A larger two-bedroom timber home with an open living zone and family-ready layout.',
    targetUseCase: 'Primary residence, family holiday home or premium rental unit.',
    productionNotes: [
      'Uses a larger paired-module layout with shared service core.',
      'Extended terrace is useful for sales preview but remains optional in estimate logic.',
      'Final production planning requires site-specific transport and foundation review.',
    ],
  },
  {
    id: 'sauna-cabin-25',
    name: 'Sauna Cabin 25',
    category: 'saunaCabin',
    floorAreaM2: 25,
    footprint: { widthM: 6.4, lengthM: 4.2 },
    ceilingHeightM: 2.4,
    moduleCount: 2,
    transportModuleCount: 1,
    buildCategoryNote: 'Single-transport sauna and guest module concept.',
    bedrooms: 0,
    bathrooms: 1,
    defaultTemplateId: 'saunaCabin25',
    baseModuleIds: [
      'sauna-core-module',
      'bathroom-core-module',
    ],
    defaultConfig: {
      facade: 'darkThermoWood',
      finishLevel: 'standard',
      roof: 'flat',
      template: 'saunaCabin25',
      terrace: 'smallTerrace',
    },
    basePrice: 26000,
    shortDescription: 'A compact sauna and guest module for outdoor retreats and add-on hospitality use.',
    targetUseCase: 'Sauna cabin, guest retreat, garden wellness module or rental add-on.',
    productionNotes: [
      'Service core planning is required before quoting wet-room and sauna equipment.',
      'Preview model communicates package shape, not final sauna engineering.',
      'Terrace readiness is included as a product concept, with final decking priced separately.',
    ],
  },
] as const satisfies readonly ModularHomeProduct[];

export const MODULAR_HOME_MODULES = [
  {
    id: 'compact-living-module',
    type: 'living',
    dimensions: { widthM: 5.2, lengthM: 4.4, heightM: 2.7 },
    price: 11200,
    compatibleWith: ['compact-timber-40'],
    requiredDependencies: [],
    notes: 'Compact combined living and dining module for the 40 m2 product.',
  },
  {
    id: 'compact-bedroom-module',
    type: 'bedroom',
    dimensions: { widthM: 3.2, lengthM: 3.4, heightM: 2.7 },
    price: 7200,
    compatibleWith: ['compact-timber-40'],
    requiredDependencies: ['compact-living-module'],
    notes: 'One private bedroom module sized for a compact double bed layout.',
  },
  {
    id: 'bathroom-core-module',
    type: 'bathroomCore',
    dimensions: { widthM: 2.2, lengthM: 2.4, heightM: 2.7 },
    price: 8200,
    compatibleWith: ALL_MODULAR_HOME_PRODUCT_IDS,
    requiredDependencies: [],
    notes: 'Shared wet-room service core used by all current preview products.',
  },
  {
    id: 'terrace-small-module',
    type: 'terrace',
    dimensions: { widthM: 5.4, lengthM: 2.2, heightM: 0.25 },
    price: 4500,
    compatibleWith: ALL_MODULAR_HOME_PRODUCT_IDS,
    requiredDependencies: [],
    notes: 'Small terrace module for compact outdoor activation.',
  },
  {
    id: 'terrace-extended-module',
    type: 'terrace',
    dimensions: { widthM: 8.4, lengthM: 2.8, heightM: 0.25 },
    price: 8000,
    compatibleWith: ['compact-timber-40', 'family-timber-80'],
    requiredDependencies: [],
    notes: 'Extended terrace module for larger outdoor living packages.',
  },
  {
    id: 'family-living-module',
    type: 'living',
    dimensions: { widthM: 6.8, lengthM: 5.6, heightM: 2.7 },
    price: 19800,
    compatibleWith: ['family-timber-80'],
    requiredDependencies: [],
    notes: 'Large open-plan living module for the family home product.',
  },
  {
    id: 'family-bedroom-module',
    type: 'bedroom',
    dimensions: { widthM: 3.8, lengthM: 3.8, heightM: 2.7 },
    price: 8800,
    compatibleWith: ['family-timber-80'],
    requiredDependencies: ['family-living-module'],
    notes: 'Repeatable bedroom module for the two-bedroom family layout.',
  },
  {
    id: 'sauna-core-module',
    // TODO: add a sauna/wellness module category before production BOM/export work.
    type: 'living',
    dimensions: { widthM: 4.2, lengthM: 3.6, heightM: 2.5 },
    price: 9200,
    compatibleWith: ['sauna-cabin-25'],
    requiredDependencies: ['bathroom-core-module'],
    notes: 'Sauna and guest lounge core for the cabin product.',
  },
  {
    id: 'roof-flat-module',
    type: 'roof',
    dimensions: { widthM: 7.2, lengthM: 7.2, heightM: 0.45 },
    price: 0,
    compatibleWith: ALL_MODULAR_HOME_PRODUCT_IDS,
    requiredDependencies: [],
    notes: 'Flat roof system placeholder for preview configuration.',
  },
  {
    id: 'roof-pitched-module',
    type: 'roof',
    dimensions: { widthM: 7.2, lengthM: 7.2, heightM: 1.1 },
    price: 0,
    compatibleWith: ['compact-timber-40', 'family-timber-80'],
    requiredDependencies: [],
    notes: 'Pitched roof module used by the main timber home products.',
  },
  {
    id: 'facade-natural-timber',
    type: 'facade',
    dimensions: { widthM: 7.2, lengthM: 0.24, heightM: 2.7 },
    price: 0,
    compatibleWith: ALL_MODULAR_HOME_PRODUCT_IDS,
    requiredDependencies: [],
    notes: 'Natural timber facade package for baseline commercial previews.',
  },
  {
    id: 'facade-dark-thermo',
    type: 'facade',
    dimensions: { widthM: 7.2, lengthM: 0.24, heightM: 2.7 },
    price: 3200,
    compatibleWith: ALL_MODULAR_HOME_PRODUCT_IDS,
    requiredDependencies: [],
    notes: 'Dark thermo wood facade package for premium exterior expression.',
  },
  {
    id: 'facade-light-painted',
    type: 'facade',
    dimensions: { widthM: 7.2, lengthM: 0.24, heightM: 2.7 },
    price: 2400,
    compatibleWith: ['compact-timber-40', 'family-timber-80'],
    requiredDependencies: [],
    notes: 'Light painted facade package for residential-friendly presentation.',
  },
] as const satisfies readonly ModularHomeModule[];

export const MODULAR_HOME_OPTIONS = [
  {
    id: 'option-facade-natural-timber',
    group: 'facade',
    label: 'Natural timber',
    priceDelta: 0,
    visualToken: 'naturalTimber' satisfies ModularHomeFacadeOption,
    compatibleProducts: ALL_MODULAR_HOME_PRODUCT_IDS,
    requiredModuleIds: ['facade-natural-timber'],
  },
  {
    id: 'option-facade-dark-thermo',
    group: 'facade',
    label: 'Dark thermo wood',
    priceDelta: 3200,
    visualToken: 'darkThermoWood' satisfies ModularHomeFacadeOption,
    compatibleProducts: ALL_MODULAR_HOME_PRODUCT_IDS,
    requiredModuleIds: ['facade-dark-thermo'],
  },
  {
    id: 'option-facade-light-painted',
    group: 'facade',
    label: 'Light painted',
    priceDelta: 2400,
    visualToken: 'lightPainted' satisfies ModularHomeFacadeOption,
    compatibleProducts: ['compact-timber-40', 'family-timber-80'],
    requiredModuleIds: ['facade-light-painted'],
  },
  {
    id: 'option-roof-flat',
    group: 'roof',
    label: 'Flat roof',
    priceDelta: 0,
    visualToken: 'flat' satisfies ModularHomeRoofOption,
    compatibleProducts: ALL_MODULAR_HOME_PRODUCT_IDS,
    requiredModuleIds: ['roof-flat-module'],
  },
  {
    id: 'option-roof-pitched',
    group: 'roof',
    label: 'Pitched roof',
    priceDelta: 0,
    visualToken: 'pitched' satisfies ModularHomeRoofOption,
    compatibleProducts: ['compact-timber-40', 'family-timber-80'],
    requiredModuleIds: ['roof-pitched-module'],
  },
  {
    id: 'option-roof-green-placeholder',
    group: 'roof',
    label: 'Green roof placeholder',
    priceDelta: 6500,
    visualToken: 'greenRoofPlaceholder' satisfies ModularHomeRoofOption,
    compatibleProducts: ['compact-timber-40', 'family-timber-80'],
    requiredModuleIds: ['roof-flat-module'],
  },
  {
    id: 'option-terrace-none',
    group: 'terrace',
    label: 'No terrace',
    priceDelta: 0,
    visualToken: 'none' satisfies ModularHomeTerraceOption,
    compatibleProducts: ALL_MODULAR_HOME_PRODUCT_IDS,
    requiredModuleIds: [],
  },
  {
    id: 'option-terrace-small',
    group: 'terrace',
    label: 'Small terrace',
    priceDelta: 4500,
    visualToken: 'smallTerrace' satisfies ModularHomeTerraceOption,
    compatibleProducts: ALL_MODULAR_HOME_PRODUCT_IDS,
    requiredModuleIds: ['terrace-small-module'],
  },
  {
    id: 'option-terrace-extended',
    group: 'terrace',
    label: 'Extended terrace',
    priceDelta: 8000,
    visualToken: 'extendedTerrace' satisfies ModularHomeTerraceOption,
    compatibleProducts: ['compact-timber-40', 'family-timber-80'],
    requiredModuleIds: ['terrace-extended-module'],
  },
  {
    id: 'option-finish-shell',
    group: 'finish',
    label: 'Shell',
    priceDelta: 0,
    visualToken: 'shell' satisfies ModularHomeFinishLevelOption,
    compatibleProducts: ALL_MODULAR_HOME_PRODUCT_IDS,
    requiredModuleIds: [],
  },
  {
    id: 'option-finish-standard',
    group: 'finish',
    label: 'Standard',
    priceDelta: 12000,
    visualToken: 'standard' satisfies ModularHomeFinishLevelOption,
    compatibleProducts: ALL_MODULAR_HOME_PRODUCT_IDS,
    requiredModuleIds: [],
  },
  {
    id: 'option-finish-premium',
    group: 'finish',
    label: 'Premium',
    priceDelta: 24000,
    visualToken: 'premium' satisfies ModularHomeFinishLevelOption,
    compatibleProducts: ['compact-timber-40', 'family-timber-80'],
    requiredModuleIds: [],
  },
  {
    id: 'option-window-package-standard',
    group: 'windowPackage',
    label: 'Standard glazing package',
    priceDelta: 0,
    visualToken: 'standardWindows',
    compatibleProducts: ALL_MODULAR_HOME_PRODUCT_IDS,
    requiredModuleIds: [],
  },
  {
    id: 'option-window-package-panoramic',
    group: 'windowPackage',
    label: 'Panoramic glazing package',
    priceDelta: 7800,
    visualToken: 'panoramicWindows',
    compatibleProducts: ['compact-timber-40', 'family-timber-80'],
    requiredModuleIds: [],
  },
] as const satisfies readonly ModularHomeOption[];

const DEFAULT_MODULAR_HOME_PRODUCT_ID: ModularHomeProductId = 'compact-timber-40';

function getProductForConfig(config: ModularHomeConfiguratorState): ModularHomeProduct | undefined {
  return MODULAR_HOME_PRODUCTS.find((product) => product.defaultTemplateId === config.template);
}

function getModuleById(id: ModularHomeModuleId): ModularHomeModule | undefined {
  return MODULAR_HOME_MODULES.find((module) => module.id === id);
}

function getSelectedOptionForGroup(
  config: ModularHomeConfiguratorState,
  group: 'facade' | 'finish' | 'roof' | 'terrace',
): ModularHomeOption | undefined {
  const selectedTokenByGroup = {
    facade: config.facade,
    finish: config.finishLevel,
    roof: config.roof,
    terrace: config.terrace,
  } as const;

  return MODULAR_HOME_OPTIONS.find((option) => (
    option.group === group
    && option.visualToken === selectedTokenByGroup[group]
  ));
}

function getOptionForGroupAndToken(
  group: ModularHomeOptionGroup,
  visualToken: string,
): ModularHomeOption | undefined {
  return MODULAR_HOME_OPTIONS.find((option) => (
    option.group === group
    && option.visualToken === visualToken
  ));
}

function getRequiredOptionModuleIds(config: ModularHomeConfiguratorState): readonly ModularHomeModuleId[] {
  const selectedOptions = [
    getSelectedOptionForGroup(config, 'facade'),
    getSelectedOptionForGroup(config, 'roof'),
    getSelectedOptionForGroup(config, 'terrace'),
    getSelectedOptionForGroup(config, 'finish'),
  ].filter((option): option is ModularHomeOption => Boolean(option));

  return selectedOptions.flatMap((option) => option.requiredModuleIds);
}

function getSelectedModuleIdsForConfig(config: ModularHomeConfiguratorState): readonly ModularHomeModuleId[] {
  const product = getProductForConfig(config);

  if (!product) {
    return [];
  }

  return [...new Set([...product.baseModuleIds, ...getRequiredOptionModuleIds(config)])];
}

function formatMetricLength(value: number): string {
  return `${value.toFixed(1)} m`;
}

function formatCountLabel(count: number, singular: string, plural: string): string {
  return `${count} ${count === 1 ? singular : plural}`;
}

export function getModularHomeProduct(id: string): ModularHomeProduct | undefined {
  return MODULAR_HOME_PRODUCTS.find((product) => product.id === id);
}

export function getModularHomeProductForTemplate(templateId: ModularHomeTemplateId): ModularHomeProduct | undefined {
  return MODULAR_HOME_PRODUCTS.find((product) => product.defaultTemplateId === templateId);
}

export function getModularHomeProductForConfig(config: ModularHomeConfiguratorState): ModularHomeProduct | undefined {
  return getProductForConfig(config);
}

export function getModularHomeProducts(): readonly ModularHomeProduct[] {
  return MODULAR_HOME_PRODUCTS;
}

export function getModulesForProduct(id: string): readonly ModularHomeModule[] {
  const product = getModularHomeProduct(id);

  if (!product) {
    return [];
  }

  return MODULAR_HOME_MODULES.filter((module) => product.baseModuleIds.includes(module.id));
}

export function getModulesForConfig(config: ModularHomeConfiguratorState): readonly ModularHomeModule[] {
  const moduleIds = getSelectedModuleIdsForConfig(config);

  return moduleIds
    .map((moduleId) => getModuleById(moduleId))
    .filter((module): module is ModularHomeModule => Boolean(module));
}

export function getDefaultHomeConfig(productId: string): ModularHomeConfiguratorState {
  const product = getModularHomeProduct(productId) ?? getModularHomeProduct(DEFAULT_MODULAR_HOME_PRODUCT_ID);

  return {
    ...(product?.defaultConfig ?? DEFAULT_MODULAR_HOME_CONFIG),
  };
}

export function getCompatibleOptions(
  productId: string,
  optionGroup: ModularHomeOptionGroup,
): readonly ModularHomeOption[] {
  return MODULAR_HOME_OPTIONS.filter((option) => (
    option.group === optionGroup
    && (option.compatibleProducts as readonly ModularHomeProductId[]).includes(productId as ModularHomeProductId)
  ));
}

export function getModularHomeOptionChoices(
  productId: string,
  optionGroup: ModularHomeOptionGroup,
): readonly ModularHomeProductOptionChoice[] {
  const product = getModularHomeProduct(productId);

  return MODULAR_HOME_OPTIONS
    .filter((option) => option.group === optionGroup)
    .map((option) => {
      if (!product) {
        return {
          ...option,
          disabledReason: `Product ${productId} is not available.`,
          isCompatible: false,
        };
      }

      const isCompatible = (option.compatibleProducts as readonly ModularHomeProductId[]).includes(product.id);

      return {
        ...option,
        disabledReason: isCompatible ? '' : `${option.label} is not available for ${product.name}.`,
        isCompatible,
      };
    });
}

export function getSelectedModularHomeOptions(config: ModularHomeConfiguratorState): readonly ModularHomeOption[] {
  return [
    getSelectedOptionForGroup(config, 'facade'),
    getSelectedOptionForGroup(config, 'roof'),
    getSelectedOptionForGroup(config, 'terrace'),
    getSelectedOptionForGroup(config, 'finish'),
  ].filter((option): option is ModularHomeOption => Boolean(option));
}

export function getModularHomeProductConfigSummary(config: ModularHomeConfiguratorState): ModularHomeProductConfigSummary {
  const product = getProductForConfig(config);

  return {
    facade: getOptionForGroupAndToken('facade', config.facade)?.label ?? config.facade,
    finishLevel: getOptionForGroupAndToken('finish', config.finishLevel)?.label ?? config.finishLevel,
    product: product?.name ?? config.template,
    roof: getOptionForGroupAndToken('roof', config.roof)?.label ?? config.roof,
    template: product?.name ?? config.template,
    terrace: getOptionForGroupAndToken('terrace', config.terrace)?.label ?? config.terrace,
  };
}

export function getModularHomeDimensionSummary(config: ModularHomeConfiguratorState): ModularHomeDimensionSummary {
  const product = getProductForConfig(config) ?? getModularHomeProduct(DEFAULT_MODULAR_HOME_PRODUCT_ID);
  const fallbackProduct = product ?? MODULAR_HOME_PRODUCTS[0];

  return {
    buildCategoryNote: fallbackProduct.buildCategoryNote,
    ceilingHeightLabel: `${formatMetricLength(fallbackProduct.ceilingHeightM)} ceiling height`,
    ceilingHeightM: fallbackProduct.ceilingHeightM,
    floorAreaLabel: `${fallbackProduct.floorAreaM2} m\u00b2`,
    floorAreaM2: fallbackProduct.floorAreaM2,
    footprintLabel: `${formatMetricLength(fallbackProduct.footprint.widthM)} x ${formatMetricLength(fallbackProduct.footprint.lengthM)} footprint`,
    footprintLengthM: fallbackProduct.footprint.lengthM,
    footprintWidthM: fallbackProduct.footprint.widthM,
    moduleCount: fallbackProduct.moduleCount,
    moduleCountLabel: formatCountLabel(fallbackProduct.moduleCount, 'module', 'modules'),
    transportModuleCount: fallbackProduct.transportModuleCount,
    transportModuleCountLabel: formatCountLabel(fallbackProduct.transportModuleCount, 'transport module', 'transport modules'),
  };
}

export function getInvalidConfigReasons(config: ModularHomeConfiguratorState): readonly string[] {
  const product = getProductForConfig(config);

  if (!product) {
    return [`No modular home product matches template "${config.template}".`];
  }

  const reasons: string[] = [];
  const selectedGroups = [
    'facade',
    'roof',
    'terrace',
    'finish',
  ] as const;

  for (const group of selectedGroups) {
    const option = getSelectedOptionForGroup(config, group);
    if (!option) {
      reasons.push(`No ${group} option matches selected value.`);
      continue;
    }

    if (!(option.compatibleProducts as readonly ModularHomeProductId[]).includes(product.id)) {
      reasons.push(`${option.label} is not compatible with ${product.name}.`);
    }
  }

  const selectedModuleIds = getSelectedModuleIdsForConfig(config);
  const selectedModuleIdSet = new Set(selectedModuleIds);

  for (const moduleId of selectedModuleIds) {
    const module = getModuleById(moduleId);

    if (!module) {
      reasons.push(`Module ${moduleId} is missing from the modular home library.`);
      continue;
    }

    if (!(module.compatibleWith as readonly ModularHomeProductId[]).includes(product.id)) {
      reasons.push(`Module ${module.id} is not compatible with ${product.name}.`);
    }

    for (const dependencyId of module.requiredDependencies) {
      if (!selectedModuleIdSet.has(dependencyId)) {
        reasons.push(`Module ${module.id} requires ${dependencyId}.`);
      }
    }
  }

  return reasons;
}

export function validateHomeConfiguration(config: ModularHomeConfiguratorState): boolean {
  return getInvalidConfigReasons(config).length === 0;
}
