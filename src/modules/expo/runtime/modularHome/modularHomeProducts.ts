import type { ModularHomeTemplateId } from './modularHomeConfig';
import {
  DEFAULT_MODULAR_HOME_CONFIG,
  type ModularHomeConfiguratorState,
  type ModularHomeDoorPackageOption,
  type ModularHomeFacadeOption,
  type ModularHomeFinishLevelOption,
  type ModularHomeRoofOption,
  type ModularHomeTerraceOption,
  type ModularHomeWindowPackageOption,
} from './modularHomeConfigurator';
import {
  getModularHomeMaterial,
  type ModularHomeMaterial,
  type ModularHomeMaterialId,
} from './modularHomeMaterials';

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
  | 'terrace-side-module'
  | 'terrace-extended-module'
  | 'terrace-covered-placeholder-module'
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
  | 'windowPackage'
  | 'doorPackage';

export type ModularHomeConstraintStatus =
  | 'compatible'
  | 'notAvailable'
  | 'requiresReview';

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
  moduleInstances: readonly ModularHomeModuleInstance[];
  // Temporary backwards-compatible unique module list. Production BOM should read moduleInstances with quantity and role.
  baseModuleIds: readonly ModularHomeModuleId[];
  defaultConfig: ModularHomeConfiguratorState;
  basePrice: number;
  shortDescription: string;
  targetUseCase: string;
  productionNotes: readonly string[];
};

export type ModularHomeModuleInstance = {
  instanceId: string;
  moduleId: ModularHomeModuleId;
  positionHint: string;
  productionGroup: string;
  quantity: number;
  role: string;
};

export type ModularHomeModuleQuantitySummaryItem = {
  moduleId: ModularHomeModuleId;
  positionHints: readonly string[];
  productionGroups: readonly string[];
  quantity: number;
  roles: readonly string[];
};

export type ModularHomeBomModuleSummaryItem = ModularHomeModuleQuantitySummaryItem & {
  module: ModularHomeModule | null;
  moduleType: ModularHomeModuleType | 'missing';
  notes: string;
  totalPrice: number;
  unitPrice: number;
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
  materialIds: readonly ModularHomeMaterialId[];
  priceDelta: number;
  visualToken: string;
  compatibleProducts: readonly ModularHomeProductId[];
  requiredModuleIds: readonly ModularHomeModuleId[];
};

export type ModularHomeProductOptionChoice = ModularHomeOption & {
  constraintMessage: string;
  constraintStatus: ModularHomeConstraintStatus;
  disabledReason: string;
  isCompatible: boolean;
};

export type ModularHomeConfigurationWarning = {
  id: string;
  message: string;
  relatedGroups: readonly ModularHomeOptionGroup[];
  status: ModularHomeConstraintStatus;
};

export type ModularHomeProductConfigSummary = {
  doorPackage: string;
  facade: string;
  finishLevel: string;
  product: string;
  roof: string;
  template: string;
  terrace: string;
  windowPackage: string;
};

export type ModularHomeSelectedMaterialSummary = {
  material: ModularHomeMaterial | null;
  materialId: ModularHomeMaterialId;
  optionGroup: ModularHomeOptionGroup;
  optionLabel: string;
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
    moduleInstances: [
      {
        instanceId: 'compact-40-living-01',
        moduleId: 'compact-living-module',
        positionHint: 'front living/kitchen zone',
        productionGroup: 'primary-shell',
        quantity: 1,
        role: 'Living and kitchen module',
      },
      {
        instanceId: 'compact-40-bedroom-01',
        moduleId: 'compact-bedroom-module',
        positionHint: 'rear private zone',
        productionGroup: 'primary-shell',
        quantity: 1,
        role: 'Bedroom module',
      },
      {
        instanceId: 'compact-40-bathroom-core-01',
        moduleId: 'bathroom-core-module',
        positionHint: 'rear service corner',
        productionGroup: 'service-core',
        quantity: 1,
        role: 'Bathroom core',
      },
    ],
    baseModuleIds: [
      'compact-living-module',
      'compact-bedroom-module',
      'bathroom-core-module',
    ],
    defaultConfig: {
      doorPackage: 'standardEntry',
      facade: 'naturalTimber',
      finishLevel: 'standard',
      roof: 'pitched',
      template: 'compactTimber40',
      terrace: 'frontDeck',
      windowPackage: 'standardWindows',
    },
    basePrice: 38000,
    shortDescription: 'A compact one-bedroom timber module for fast deployment and flexible small-site use.',
    targetUseCase: 'Starter home, guest house, rental cabin or compact backyard dwelling.',
    productionNotes: [
      'Designed around a transport-friendly timber module footprint.',
      'Preview estimate excludes site works, transport, utility connections and local engineering.',
      'Default preview assumes standard finish and front deck readiness.',
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
    moduleInstances: [
      {
        instanceId: 'family-80-living-01',
        moduleId: 'family-living-module',
        positionHint: 'front shared living/kitchen zone',
        productionGroup: 'primary-shell',
        quantity: 1,
        role: 'Family living and kitchen module',
      },
      {
        instanceId: 'family-80-bedroom-pair-01',
        moduleId: 'family-bedroom-module',
        positionHint: 'rear two-bedroom wing',
        productionGroup: 'primary-shell',
        quantity: 2,
        role: 'Bedroom modules',
      },
      {
        instanceId: 'family-80-bathroom-core-01',
        moduleId: 'bathroom-core-module',
        positionHint: 'central service core',
        productionGroup: 'service-core',
        quantity: 1,
        role: 'Bathroom core',
      },
    ],
    baseModuleIds: [
      'family-living-module',
      'family-bedroom-module',
      'bathroom-core-module',
    ],
    defaultConfig: {
      doorPackage: 'terraceSlider',
      facade: 'naturalTimber',
      finishLevel: 'standard',
      roof: 'pitched',
      template: 'familyTimber80',
      terrace: 'extendedTerrace',
      windowPackage: 'panoramicWindows',
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
    moduleInstances: [
      {
        instanceId: 'sauna-25-core-01',
        moduleId: 'sauna-core-module',
        positionHint: 'main wellness/rest zone',
        productionGroup: 'wellness-core',
        quantity: 1,
        role: 'Sauna and guest core',
      },
      {
        instanceId: 'sauna-25-bathroom-core-01',
        moduleId: 'bathroom-core-module',
        positionHint: 'compact bathroom/service zone',
        productionGroup: 'service-core',
        quantity: 1,
        role: 'Bathroom and service core',
      },
    ],
    baseModuleIds: [
      'sauna-core-module',
      'bathroom-core-module',
    ],
    defaultConfig: {
      doorPackage: 'standardEntry',
      facade: 'darkThermoWood',
      finishLevel: 'standard',
      roof: 'flat',
      template: 'saunaCabin25',
      terrace: 'frontDeck',
      windowPackage: 'compactPrivacy',
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
    notes: 'Front deck extension module for compact outdoor activation.',
  },
  {
    id: 'terrace-side-module',
    type: 'terrace',
    dimensions: { widthM: 5.8, lengthM: 2.2, heightM: 0.25 },
    price: 6200,
    compatibleWith: ALL_MODULAR_HOME_PRODUCT_IDS,
    requiredDependencies: [],
    notes: 'Side terrace extension module for side-entry and service-side outdoor use.',
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
    id: 'terrace-covered-placeholder-module',
    type: 'terrace',
    dimensions: { widthM: 7.4, lengthM: 3, heightM: 2.7 },
    price: 12000,
    compatibleWith: ALL_MODULAR_HOME_PRODUCT_IDS,
    requiredDependencies: [],
    notes: 'Covered terrace placeholder with roof/post allowance; final structure requires review.',
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
    materialIds: ['natural-timber-siding'],
    priceDelta: 0,
    visualToken: 'naturalTimber' satisfies ModularHomeFacadeOption,
    compatibleProducts: ALL_MODULAR_HOME_PRODUCT_IDS,
    requiredModuleIds: ['facade-natural-timber'],
  },
  {
    id: 'option-facade-dark-thermo',
    group: 'facade',
    label: 'Dark thermo wood',
    materialIds: ['dark-thermo-wood'],
    priceDelta: 3200,
    visualToken: 'darkThermoWood' satisfies ModularHomeFacadeOption,
    compatibleProducts: ALL_MODULAR_HOME_PRODUCT_IDS,
    requiredModuleIds: ['facade-dark-thermo'],
  },
  {
    id: 'option-facade-light-painted',
    group: 'facade',
    label: 'Light painted',
    materialIds: ['light-painted-facade'],
    priceDelta: 2400,
    visualToken: 'lightPainted' satisfies ModularHomeFacadeOption,
    compatibleProducts: ['compact-timber-40', 'family-timber-80'],
    requiredModuleIds: ['facade-light-painted'],
  },
  {
    id: 'option-roof-flat',
    group: 'roof',
    label: 'Flat roof',
    materialIds: ['metal-roof'],
    priceDelta: 0,
    visualToken: 'flat' satisfies ModularHomeRoofOption,
    compatibleProducts: ALL_MODULAR_HOME_PRODUCT_IDS,
    requiredModuleIds: ['roof-flat-module'],
  },
  {
    id: 'option-roof-pitched',
    group: 'roof',
    label: 'Pitched roof',
    materialIds: ['metal-roof'],
    priceDelta: 0,
    visualToken: 'pitched' satisfies ModularHomeRoofOption,
    compatibleProducts: ['compact-timber-40', 'family-timber-80'],
    requiredModuleIds: ['roof-pitched-module'],
  },
  {
    id: 'option-roof-green-placeholder',
    group: 'roof',
    label: 'Green roof placeholder',
    materialIds: ['green-roof-placeholder'],
    priceDelta: 6500,
    visualToken: 'greenRoofPlaceholder' satisfies ModularHomeRoofOption,
    compatibleProducts: ['compact-timber-40', 'family-timber-80'],
    requiredModuleIds: ['roof-flat-module'],
  },
  {
    id: 'option-terrace-none',
    group: 'terrace',
    label: 'No terrace',
    materialIds: [],
    priceDelta: 0,
    visualToken: 'none' satisfies ModularHomeTerraceOption,
    compatibleProducts: ALL_MODULAR_HOME_PRODUCT_IDS,
    requiredModuleIds: [],
  },
  {
    id: 'option-terrace-front-deck',
    group: 'terrace',
    label: 'Front deck',
    materialIds: ['natural-timber-siding'],
    priceDelta: 4500,
    visualToken: 'frontDeck' satisfies ModularHomeTerraceOption,
    compatibleProducts: ALL_MODULAR_HOME_PRODUCT_IDS,
    requiredModuleIds: ['terrace-small-module'],
  },
  {
    id: 'option-terrace-side',
    group: 'terrace',
    label: 'Side terrace',
    materialIds: ['natural-timber-siding'],
    priceDelta: 6200,
    visualToken: 'sideTerrace' satisfies ModularHomeTerraceOption,
    compatibleProducts: ALL_MODULAR_HOME_PRODUCT_IDS,
    requiredModuleIds: ['terrace-side-module'],
  },
  {
    id: 'option-terrace-extended',
    group: 'terrace',
    label: 'Extended terrace',
    materialIds: ['natural-timber-siding'],
    priceDelta: 8000,
    visualToken: 'extendedTerrace' satisfies ModularHomeTerraceOption,
    compatibleProducts: ['compact-timber-40', 'family-timber-80'],
    requiredModuleIds: ['terrace-extended-module'],
  },
  {
    id: 'option-terrace-covered-placeholder',
    group: 'terrace',
    label: 'Covered terrace placeholder',
    materialIds: ['natural-timber-siding', 'metal-roof'],
    priceDelta: 12000,
    visualToken: 'coveredTerracePlaceholder' satisfies ModularHomeTerraceOption,
    compatibleProducts: ALL_MODULAR_HOME_PRODUCT_IDS,
    requiredModuleIds: ['terrace-covered-placeholder-module'],
  },
  {
    id: 'option-finish-shell',
    group: 'finish',
    label: 'Empty shell',
    materialIds: ['interior-plywood'],
    priceDelta: 0,
    visualToken: 'shell' satisfies ModularHomeFinishLevelOption,
    compatibleProducts: ALL_MODULAR_HOME_PRODUCT_IDS,
    requiredModuleIds: [],
  },
  {
    id: 'option-finish-standard',
    group: 'finish',
    label: 'Standard furnished preview',
    materialIds: ['interior-plywood', 'bathroom-wet-core'],
    priceDelta: 12000,
    visualToken: 'standard' satisfies ModularHomeFinishLevelOption,
    compatibleProducts: ALL_MODULAR_HOME_PRODUCT_IDS,
    requiredModuleIds: [],
  },
  {
    id: 'option-finish-premium',
    group: 'finish',
    label: 'Premium interior preview',
    materialIds: ['interior-plywood', 'bathroom-wet-core'],
    priceDelta: 24000,
    visualToken: 'premium' satisfies ModularHomeFinishLevelOption,
    compatibleProducts: ['compact-timber-40', 'family-timber-80'],
    requiredModuleIds: [],
  },
  {
    id: 'option-window-package-standard',
    group: 'windowPackage',
    label: 'Standard glazing',
    materialIds: [],
    priceDelta: 0,
    visualToken: 'standardWindows' satisfies ModularHomeWindowPackageOption,
    compatibleProducts: ALL_MODULAR_HOME_PRODUCT_IDS,
    requiredModuleIds: [],
  },
  {
    id: 'option-window-package-panoramic',
    group: 'windowPackage',
    label: 'Panoramic glazing',
    materialIds: [],
    priceDelta: 7800,
    visualToken: 'panoramicWindows' satisfies ModularHomeWindowPackageOption,
    compatibleProducts: ['compact-timber-40', 'family-timber-80'],
    requiredModuleIds: [],
  },
  {
    id: 'option-window-package-corner-glazing',
    group: 'windowPackage',
    label: 'Corner glazing',
    materialIds: [],
    priceDelta: 11500,
    visualToken: 'cornerGlazing' satisfies ModularHomeWindowPackageOption,
    compatibleProducts: ['compact-timber-40', 'family-timber-80'],
    requiredModuleIds: [],
  },
  {
    id: 'option-window-package-compact-privacy',
    group: 'windowPackage',
    label: 'Compact/privacy glazing',
    materialIds: [],
    priceDelta: 1800,
    visualToken: 'compactPrivacy' satisfies ModularHomeWindowPackageOption,
    compatibleProducts: ALL_MODULAR_HOME_PRODUCT_IDS,
    requiredModuleIds: [],
  },
  {
    id: 'option-door-package-standard-entry',
    group: 'doorPackage',
    label: 'Standard entry',
    materialIds: [],
    priceDelta: 0,
    visualToken: 'standardEntry' satisfies ModularHomeDoorPackageOption,
    compatibleProducts: ALL_MODULAR_HOME_PRODUCT_IDS,
    requiredModuleIds: [],
  },
  {
    id: 'option-door-package-terrace-slider',
    group: 'doorPackage',
    label: 'Terrace slider',
    materialIds: [],
    priceDelta: 4200,
    visualToken: 'terraceSlider' satisfies ModularHomeDoorPackageOption,
    compatibleProducts: ALL_MODULAR_HOME_PRODUCT_IDS,
    requiredModuleIds: [],
  },
  {
    id: 'option-door-package-premium-glazed-entry',
    group: 'doorPackage',
    label: 'Premium glazed entry',
    materialIds: [],
    priceDelta: 5200,
    visualToken: 'premiumGlazedEntry' satisfies ModularHomeDoorPackageOption,
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
  group: ModularHomeOptionGroup,
): ModularHomeOption | undefined {
  const selectedTokenByGroup = {
    doorPackage: config.doorPackage,
    facade: config.facade,
    finish: config.finishLevel,
    roof: config.roof,
    terrace: config.terrace,
    windowPackage: config.windowPackage,
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

function getConfigKeyForOptionGroup(
  group: ModularHomeOptionGroup,
): keyof ModularHomeConfiguratorState | null {
  const keyByGroup = {
    doorPackage: 'doorPackage',
    facade: 'facade',
    finish: 'finishLevel',
    roof: 'roof',
    terrace: 'terrace',
    windowPackage: 'windowPackage',
  } as const satisfies Record<ModularHomeOptionGroup, keyof ModularHomeConfiguratorState>;

  return keyByGroup[group];
}

function isOptionCompatibleWithProduct(
  option: ModularHomeOption,
  product: ModularHomeProduct,
): boolean {
  return (option.compatibleProducts as readonly ModularHomeProductId[]).includes(product.id);
}

function createConfigWithOption(
  baseConfig: ModularHomeConfiguratorState,
  option: ModularHomeOption,
): ModularHomeConfiguratorState {
  const key = getConfigKeyForOptionGroup(option.group);

  if (!key) {
    return baseConfig;
  }

  return {
    ...baseConfig,
    [key]: option.visualToken,
  } as ModularHomeConfiguratorState;
}

function createNotAvailableWarning(
  id: string,
  message: string,
  relatedGroups: readonly ModularHomeOptionGroup[],
): ModularHomeConfigurationWarning {
  return {
    id,
    message,
    relatedGroups,
    status: 'notAvailable',
  };
}

function createRequiresReviewWarning(
  id: string,
  message: string,
  relatedGroups: readonly ModularHomeOptionGroup[],
): ModularHomeConfigurationWarning {
  return {
    id,
    message,
    relatedGroups,
    status: 'requiresReview',
  };
}

function getRequiredOptionModuleIds(config: ModularHomeConfiguratorState): readonly ModularHomeModuleId[] {
  const selectedOptions = [
    getSelectedOptionForGroup(config, 'facade'),
    getSelectedOptionForGroup(config, 'roof'),
    getSelectedOptionForGroup(config, 'terrace'),
    getSelectedOptionForGroup(config, 'finish'),
    getSelectedOptionForGroup(config, 'windowPackage'),
    getSelectedOptionForGroup(config, 'doorPackage'),
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

function getReviewWarningsForCompatibleConfig(
  config: ModularHomeConfiguratorState,
  product: ModularHomeProduct,
): readonly ModularHomeConfigurationWarning[] {
  const warnings: ModularHomeConfigurationWarning[] = [];

  if (config.finishLevel === 'premium') {
    warnings.push(createRequiresReviewWarning(
      'premium-finish-standard-base-review',
      'Premium finish requires Standard-or-better base package confirmation before final quote.',
      ['finish'],
    ));
  }

  if (config.roof === 'greenRoofPlaceholder') {
    warnings.push(createRequiresReviewWarning(
      'green-roof-engineering-review',
      'Green roof placeholder requires structural load, drainage and maintenance review.',
      ['roof'],
    ));
  }

  if (config.roof === 'greenRoofPlaceholder' && config.terrace === 'extendedTerrace') {
    warnings.push(createRequiresReviewWarning(
      'green-roof-extended-terrace-review',
      'Green roof with extended terrace requires roof-edge, drainage and terrace connection review.',
      ['roof', 'terrace'],
    ));
  }

  if (config.roof === 'greenRoofPlaceholder' && config.facade === 'lightPainted') {
    warnings.push(createRequiresReviewWarning(
      'green-roof-light-facade-review',
      'Light painted facade with green roof requires runoff and staining review.',
      ['roof', 'facade'],
    ));
  }

  if (config.roof === 'greenRoofPlaceholder' && config.facade === 'darkThermoWood') {
    warnings.push(createRequiresReviewWarning(
      'green-roof-dark-facade-review',
      'Dark thermo wood facade with green roof requires ventilation and moisture-detail review.',
      ['roof', 'facade'],
    ));
  }

  if (config.roof === 'flat' && config.terrace === 'extendedTerrace') {
    warnings.push(createRequiresReviewWarning(
      'flat-roof-extended-terrace-review',
      'Flat roof with extended terrace requires connection, snow-load and drainage review.',
      ['roof', 'terrace'],
    ));
  }

  if (config.terrace === 'extendedTerrace') {
    warnings.push(createRequiresReviewWarning(
      'extended-terrace-foundation-review',
      'Extended terrace may require additional foundation pads, lateral stability and site connection review.',
      ['terrace'],
    ));
  }

  if (config.terrace === 'coveredTerracePlaceholder') {
    warnings.push(createRequiresReviewWarning(
      'covered-terrace-structure-review',
      'Covered terrace placeholder requires roof load, posts, drainage and permit review before final quote.',
      ['terrace'],
    ));
  }

  if (product.id === 'sauna-cabin-25' && config.terrace === 'frontDeck') {
    warnings.push(createRequiresReviewWarning(
      'sauna-front-deck-review',
      'Sauna Cabin front deck package requires wet-zone drainage and safety review.',
      ['terrace'],
    ));
  }

  if (config.windowPackage === 'panoramicWindows') {
    warnings.push(createRequiresReviewWarning(
      'panoramic-glazing-review',
      'Panoramic glazing requires structural opening, solar-gain and transport review.',
      ['windowPackage'],
    ));
  }

  if (config.windowPackage === 'cornerGlazing') {
    warnings.push(createRequiresReviewWarning(
      'corner-glazing-review',
      'Corner glazing requires structural corner opening, thermal bridge and transport review.',
      ['windowPackage'],
    ));
  }

  if (config.doorPackage === 'terraceSlider') {
    warnings.push(createRequiresReviewWarning(
      'terrace-slider-threshold-review',
      'Terrace slider requires threshold, drainage and weatherproofing detail review.',
      ['doorPackage', 'terrace'],
    ));
  }

  if (config.doorPackage === 'premiumGlazedEntry') {
    warnings.push(createRequiresReviewWarning(
      'premium-glazed-entry-review',
      'Premium glazed entry requires thermal, security and hardware review.',
      ['doorPackage'],
    ));
  }

  return warnings;
}

function formatMetricLength(value: number): string {
  return `${value.toFixed(1)} m`;
}

function formatCountLabel(count: number, singular: string, plural: string): string {
  return `${count} ${count === 1 ? singular : plural}`;
}

function appendUnique(values: string[], nextValues: readonly string[]) {
  for (const value of nextValues) {
    if (!values.includes(value)) {
      values.push(value);
    }
  }
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

export function getModuleInstancesForProduct(id: string): readonly ModularHomeModuleInstance[] {
  return getModularHomeProduct(id)?.moduleInstances ?? [];
}

export function getModuleQuantitySummary(id: string): readonly ModularHomeModuleQuantitySummaryItem[] {
  const summaryByModuleId = new Map<ModularHomeModuleId, {
    moduleId: ModularHomeModuleId;
    positionHints: string[];
    productionGroups: string[];
    quantity: number;
    roles: string[];
  }>();

  for (const instance of getModuleInstancesForProduct(id)) {
    const existing = summaryByModuleId.get(instance.moduleId) ?? {
      moduleId: instance.moduleId,
      positionHints: [],
      productionGroups: [],
      quantity: 0,
      roles: [],
    };

    existing.quantity += instance.quantity;
    appendUnique(existing.roles, [instance.role]);
    appendUnique(existing.positionHints, [instance.positionHint]);
    appendUnique(existing.productionGroups, [instance.productionGroup]);
    summaryByModuleId.set(instance.moduleId, existing);
  }

  return [...summaryByModuleId.values()];
}

export function getBomModuleSummary(id: string): readonly ModularHomeBomModuleSummaryItem[] {
  return getModuleQuantitySummary(id).map((item) => {
    const module = getModuleById(item.moduleId);
    const unitPrice = module?.price ?? 0;

    return {
      ...item,
      module: module ?? null,
      moduleType: module?.type ?? 'missing',
      notes: module?.notes ?? 'Module is missing from the modular home library.',
      totalPrice: unitPrice * item.quantity,
      unitPrice,
    };
  });
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
  config?: ModularHomeConfiguratorState,
): readonly ModularHomeProductOptionChoice[] {
  const product = getModularHomeProduct(productId);

  return MODULAR_HOME_OPTIONS
    .filter((option) => option.group === optionGroup)
    .map((option) => {
      if (!product) {
        return {
          ...option,
          constraintMessage: `Product ${productId} is not available.`,
          constraintStatus: 'notAvailable',
          disabledReason: `Product ${productId} is not available.`,
          isCompatible: false,
        } satisfies ModularHomeProductOptionChoice;
      }

      const isCompatible = isOptionCompatibleWithProduct(option, product);
      const disabledReason = isCompatible ? '' : `${option.label} is not available for ${product.name}.`;
      const nextConfig = config ? createConfigWithOption(config, option) : product.defaultConfig;
      const reviewWarning = isCompatible
        ? getReviewWarningsForCompatibleConfig(nextConfig, product).find((warning) => (
          warning.relatedGroups.includes(option.group)
        ))
        : undefined;
      const constraintStatus: ModularHomeConstraintStatus = isCompatible
        ? reviewWarning ? 'requiresReview' : 'compatible'
        : 'notAvailable';

      return {
        ...option,
        constraintMessage: disabledReason || reviewWarning?.message || 'Compatible with selected product.',
        constraintStatus,
        disabledReason,
        isCompatible,
      } satisfies ModularHomeProductOptionChoice;
    });
}

export function getModularHomeConfigurationWarnings(
  config: ModularHomeConfiguratorState,
): readonly ModularHomeConfigurationWarning[] {
  const product = getProductForConfig(config);

  if (!product) {
    return [
      createNotAvailableWarning(
        'missing-product-template',
        `No modular home product matches template "${config.template}".`,
        [],
      ),
    ];
  }

  const warnings: ModularHomeConfigurationWarning[] = [];
  const selectedGroups = [
    'facade',
    'roof',
    'terrace',
    'finish',
    'windowPackage',
    'doorPackage',
  ] as const;

  for (const group of selectedGroups) {
    const option = getSelectedOptionForGroup(config, group);
    if (!option) {
      warnings.push(createNotAvailableWarning(
        `missing-${group}-option`,
        `No ${group} option matches selected value.`,
        [group],
      ));
      continue;
    }

    if (!isOptionCompatibleWithProduct(option, product)) {
      warnings.push(createNotAvailableWarning(
        `${option.id}-not-available`,
        `${option.label} is not compatible with ${product.name}.`,
        [group],
      ));
    }
  }

  const selectedModuleIds = getSelectedModuleIdsForConfig(config);
  const selectedModuleIdSet = new Set(selectedModuleIds);

  for (const moduleId of selectedModuleIds) {
    const module = getModuleById(moduleId);

    if (!module) {
      warnings.push(createNotAvailableWarning(
        `${moduleId}-missing-module`,
        `Module ${moduleId} is missing from the modular home library.`,
        [],
      ));
      continue;
    }

    if (!(module.compatibleWith as readonly ModularHomeProductId[]).includes(product.id)) {
      warnings.push(createNotAvailableWarning(
        `${module.id}-not-compatible`,
        `Module ${module.id} is not compatible with ${product.name}.`,
        [],
      ));
    }

    for (const dependencyId of module.requiredDependencies) {
      if (!selectedModuleIdSet.has(dependencyId)) {
        warnings.push(createNotAvailableWarning(
          `${module.id}-missing-${dependencyId}`,
          `Module ${module.id} requires ${dependencyId}.`,
          [],
        ));
      }
    }
  }

  if (warnings.some((warning) => warning.status === 'notAvailable')) {
    return warnings;
  }

  return [
    ...warnings,
    ...getReviewWarningsForCompatibleConfig(config, product),
  ];
}

export function getSelectedModularHomeOptions(config: ModularHomeConfiguratorState): readonly ModularHomeOption[] {
  return [
    getSelectedOptionForGroup(config, 'facade'),
    getSelectedOptionForGroup(config, 'roof'),
    getSelectedOptionForGroup(config, 'terrace'),
    getSelectedOptionForGroup(config, 'finish'),
    getSelectedOptionForGroup(config, 'windowPackage'),
    getSelectedOptionForGroup(config, 'doorPackage'),
  ].filter((option): option is ModularHomeOption => Boolean(option));
}

export function getSelectedModularHomeMaterialIds(config: ModularHomeConfiguratorState): readonly ModularHomeMaterialId[] {
  return [...new Set(getSelectedModularHomeOptions(config).flatMap((option) => option.materialIds))];
}

export function getSelectedModularHomeMaterials(config: ModularHomeConfiguratorState): readonly ModularHomeSelectedMaterialSummary[] {
  return getSelectedModularHomeOptions(config).flatMap((option) => (
    option.materialIds.map((materialId) => ({
      material: getModularHomeMaterial(materialId) ?? null,
      materialId,
      optionGroup: option.group,
      optionLabel: option.label,
    }))
  ));
}

export function getModularHomeProductConfigSummary(config: ModularHomeConfiguratorState): ModularHomeProductConfigSummary {
  const product = getProductForConfig(config);

  return {
    doorPackage: getOptionForGroupAndToken('doorPackage', config.doorPackage)?.label ?? config.doorPackage,
    facade: getOptionForGroupAndToken('facade', config.facade)?.label ?? config.facade,
    finishLevel: getOptionForGroupAndToken('finish', config.finishLevel)?.label ?? config.finishLevel,
    product: product?.name ?? config.template,
    roof: getOptionForGroupAndToken('roof', config.roof)?.label ?? config.roof,
    template: product?.name ?? config.template,
    terrace: getOptionForGroupAndToken('terrace', config.terrace)?.label ?? config.terrace,
    windowPackage: getOptionForGroupAndToken('windowPackage', config.windowPackage)?.label ?? config.windowPackage,
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
  return getModularHomeConfigurationWarnings(config)
    .filter((warning) => warning.status === 'notAvailable')
    .map((warning) => warning.message);
}

export function validateHomeConfiguration(config: ModularHomeConfiguratorState): boolean {
  return getInvalidConfigReasons(config).length === 0;
}
