import type { ModularHomeConfiguratorState } from './modularHomeConfigurator';
import {
  calculateModularHomeQuantities,
  type ModularHomeQuantityTakeoff,
} from './modularHomeQuantities';
import {
  createComponentPricingBreakdown,
  getModularHomePricingCategoryTotals,
  MODULAR_HOME_PRICING_CONTEXT,
  sumModularHomePricingBreakdowns,
  type ModularHomePricingBreakdown,
  type ModularHomePricingCategoryTotal,
  type ModularHomePricingContext,
} from './modularHomePricing';
import {
  getBomModuleSummary,
  getModularHomeProduct,
  getModularHomeProductForConfig,
  getModulesForConfig,
  getModuleQuantitySummary,
  type ModularHomeModule,
  type ModularHomeModuleId,
  type ModularHomeModuleType,
  type ModularHomeProductId,
} from './modularHomeProducts';

export type ModularHomeComponentCategory =
  | 'wallPanel'
  | 'floorCassette'
  | 'roofCassette'
  | 'facadeBoarding'
  | 'windowUnit'
  | 'doorUnit'
  | 'bathroomCore'
  | 'kitchenLine'
  | 'terraceDeck'
  | 'foundationPad'
  | 'interiorFinish'
  | 'furniturePackage';

export type ModularHomeComponentUnit =
  | 'm2'
  | 'linearM'
  | 'piece'
  | 'package';

export type ModularHomeComponentId =
  | 'timber-wall-panel-system'
  | 'timber-floor-cassette-system'
  | 'flat-roof-cassette-system'
  | 'pitched-roof-cassette-system'
  | 'natural-timber-facade-boarding'
  | 'dark-thermo-facade-boarding'
  | 'light-painted-facade-boarding'
  | 'standard-window-unit'
  | 'panoramic-window-unit'
  | 'corner-glazing-unit'
  | 'privacy-window-unit'
  | 'entry-door-unit'
  | 'terrace-slider-door-unit'
  | 'premium-glazed-entry-door-unit'
  | 'bathroom-wet-core-kit'
  | 'compact-kitchen-line'
  | 'family-kitchen-line'
  | 'small-terrace-deck-system'
  | 'side-terrace-deck-system'
  | 'extended-terrace-deck-system'
  | 'covered-terrace-deck-system'
  | 'covered-terrace-roof-placeholder'
  | 'foundation-pad-set'
  | 'interior-plywood-finish'
  | 'standard-furniture-package'
  | 'premium-furniture-package'
  | 'sauna-bench-package';

export type ModularHomeComponent = {
  id: ModularHomeComponentId;
  baseUnitCost: number;
  category: ModularHomeComponentCategory;
  compatibleModuleTypes: readonly ModularHomeModuleType[];
  label: string;
  laborUnitCost: number;
  notes: string;
  quantityFormula: string;
  unit: ModularHomeComponentUnit;
  visualToken: string;
  wasteFactor: number;
};

export type ModularHomeComponentSummaryItem = {
  baseCost: number;
  category: ModularHomeComponentCategory;
  component: ModularHomeComponent;
  componentId: ModularHomeComponentId;
  label: string;
  laborCost: number;
  moduleIds: readonly ModularHomeModuleId[];
  notes: string;
  pricingBreakdown: ModularHomePricingBreakdown;
  quantity: number;
  totalCost: number;
  unit: ModularHomeComponentUnit;
  visualToken: string;
  wasteCost: number;
};

export type ModularHomeComponentBomGroup = {
  category: ModularHomeComponentCategory;
  componentCount: number;
  componentIds: readonly ModularHomeComponentId[];
  laborCostEstimate: number;
  materialCostEstimate: number;
  moduleIds: readonly ModularHomeModuleId[];
  quantity: number;
  subtotal: number;
  unit: ModularHomeComponentUnit | 'mixed';
  wasteCostEstimate: number;
  wasteFactor: number;
};

export type ModularHomeComponentBom = {
  componentCount: number;
  config: ModularHomeConfiguratorState;
  disclaimer: string;
  groups: readonly ModularHomeComponentBomGroup[];
  items: readonly ModularHomeComponentSummaryItem[];
  laborCostEstimate: number;
  materialCostEstimate: number;
  moduleCount: number;
  modules: ReturnType<typeof getBomModuleSummary>;
  pricingCategoryTotals: readonly ModularHomePricingCategoryTotal[];
  pricingContext: ModularHomePricingContext;
  productId: ModularHomeProductId | null;
  productName: string;
  quantities: ModularHomeQuantityTakeoff;
  subtotal: number;
  totalQuantity: number;
  wasteCostEstimate: number;
};

export type ModularHomeManufacturingBomPanelGroup = {
  areaM2: number;
  approximatePanelDimensions: readonly string[];
  id: string;
  label: string;
  moduleIds: readonly ModularHomeModuleId[];
  notes: string;
  panelCount: number;
  wasteFactor: number;
};

export type ModularHomeManufacturingBomScheduleItem = {
  areaM2: number | null;
  dimensions: string;
  id: string;
  label: string;
  linearM: number | null;
  notes: string;
  quantity: number;
  unit: ModularHomeComponentUnit | 'set';
  wasteFactor: number;
};

export type ModularHomeManufacturingBom = {
  componentBomSubtotal: number;
  config: ModularHomeConfiguratorState;
  disclaimer: string;
  doorSchedule: readonly ModularHomeManufacturingBomScheduleItem[];
  facadeBoardAreaM2: number;
  facadeBoardLinearM: number;
  floorCassetteAreaM2: number;
  interiorFinishAreas: readonly ModularHomeManufacturingBomScheduleItem[];
  moduleCount: number;
  panelGroups: readonly ModularHomeManufacturingBomPanelGroup[];
  productionVerificationNotes: readonly string[];
  productId: ModularHomeProductId | null;
  productName: string;
  roofCassetteAreaM2: number;
  terraceDeckSchedule: readonly ModularHomeManufacturingBomScheduleItem[];
  totalWasteFactor: number;
  windowSchedule: readonly ModularHomeManufacturingBomScheduleItem[];
};

export const MODULAR_HOME_COMPONENT_BOM_DISCLAIMER = 'Preview component BOM · production verification required';
export const MODULAR_HOME_MANUFACTURING_BOM_DISCLAIMER = 'Manufacturing BOM preview · production verification required';

export const MODULAR_HOME_COMPONENTS = [
  {
    id: 'timber-wall-panel-system',
    baseUnitCost: 64,
    category: 'wallPanel',
    compatibleModuleTypes: ['living', 'bedroom', 'bathroomCore', 'technical'],
    label: 'Timber wall panel system',
    laborUnitCost: 28,
    notes: 'Preview wall panel quantity derived from module perimeter and clear height.',
    quantityFormula: 'module perimeter x module height x module quantity x 0.86 opening factor',
    unit: 'm2',
    visualToken: 'timber-wall-panels',
    wasteFactor: 0.08,
  },
  {
    id: 'timber-floor-cassette-system',
    baseUnitCost: 58,
    category: 'floorCassette',
    compatibleModuleTypes: ['living', 'bedroom', 'bathroomCore', 'technical'],
    label: 'Timber floor cassette',
    laborUnitCost: 18,
    notes: 'Preview floor cassette area follows each transport module footprint.',
    quantityFormula: 'module width x module length x module quantity',
    unit: 'm2',
    visualToken: 'timber-floor-cassette',
    wasteFactor: 0.06,
  },
  {
    id: 'flat-roof-cassette-system',
    baseUnitCost: 74,
    category: 'roofCassette',
    compatibleModuleTypes: ['roof'],
    label: 'Flat roof cassette',
    laborUnitCost: 24,
    notes: 'Flat roof package placeholder before engineering-specific build-up.',
    quantityFormula: 'roof module width x roof module length',
    unit: 'm2',
    visualToken: 'flat-roof-cassette',
    wasteFactor: 0.07,
  },
  {
    id: 'pitched-roof-cassette-system',
    baseUnitCost: 82,
    category: 'roofCassette',
    compatibleModuleTypes: ['roof'],
    label: 'Pitched roof cassette',
    laborUnitCost: 29,
    notes: 'Preview pitched roof area includes a simplified slope factor.',
    quantityFormula: 'roof module width x roof module length x 1.18 pitch factor',
    unit: 'm2',
    visualToken: 'pitched-roof-cassette',
    wasteFactor: 0.09,
  },
  {
    id: 'natural-timber-facade-boarding',
    baseUnitCost: 36,
    category: 'facadeBoarding',
    compatibleModuleTypes: ['facade'],
    label: 'Natural timber facade boarding',
    laborUnitCost: 18,
    notes: 'Baseline timber cladding package for product preview.',
    quantityFormula: 'facade module width x facade module height x 4 elevations',
    unit: 'm2',
    visualToken: 'natural-timber-boarding',
    wasteFactor: 0.1,
  },
  {
    id: 'dark-thermo-facade-boarding',
    baseUnitCost: 48,
    category: 'facadeBoarding',
    compatibleModuleTypes: ['facade'],
    label: 'Dark thermo wood facade boarding',
    laborUnitCost: 20,
    notes: 'Premium exterior expression used by dark facade option.',
    quantityFormula: 'facade module width x facade module height x 4 elevations',
    unit: 'm2',
    visualToken: 'dark-thermo-boarding',
    wasteFactor: 0.1,
  },
  {
    id: 'light-painted-facade-boarding',
    baseUnitCost: 42,
    category: 'facadeBoarding',
    compatibleModuleTypes: ['facade'],
    label: 'Light painted facade boarding',
    laborUnitCost: 21,
    notes: 'Painted facade package for residential-friendly presentation.',
    quantityFormula: 'facade module width x facade module height x 4 elevations',
    unit: 'm2',
    visualToken: 'light-painted-boarding',
    wasteFactor: 0.11,
  },
  {
    id: 'standard-window-unit',
    baseUnitCost: 430,
    category: 'windowUnit',
    compatibleModuleTypes: ['living', 'bedroom', 'bathroomCore', 'technical'],
    label: 'Window unit package',
    laborUnitCost: 120,
    notes: 'Preview window count is derived from module type.',
    quantityFormula: 'module type window count x module quantity',
    unit: 'piece',
    visualToken: 'standard-window-unit',
    wasteFactor: 0.02,
  },
  {
    id: 'panoramic-window-unit',
    baseUnitCost: 980,
    category: 'windowUnit',
    compatibleModuleTypes: ['living', 'bedroom'],
    label: 'Panoramic glazing unit package',
    laborUnitCost: 220,
    notes: 'Larger glazing preview package; final opening, solar-gain and transport review required.',
    quantityFormula: 'selected panoramic window package x module type window count',
    unit: 'piece',
    visualToken: 'panoramic-window-unit',
    wasteFactor: 0.04,
  },
  {
    id: 'corner-glazing-unit',
    baseUnitCost: 1320,
    category: 'windowUnit',
    compatibleModuleTypes: ['living', 'bedroom'],
    label: 'Corner glazing unit package',
    laborUnitCost: 310,
    notes: 'Corner glazing preview package; production corner opening and thermal bridge review required.',
    quantityFormula: 'selected corner glazing package x module type window count',
    unit: 'piece',
    visualToken: 'corner-glazing-unit',
    wasteFactor: 0.06,
  },
  {
    id: 'privacy-window-unit',
    baseUnitCost: 560,
    category: 'windowUnit',
    compatibleModuleTypes: ['living', 'bedroom', 'bathroomCore', 'technical'],
    label: 'Compact/privacy glazing unit',
    laborUnitCost: 145,
    notes: 'Smaller privacy-oriented glazing preview package for compact and service layouts.',
    quantityFormula: 'selected privacy window package x reduced module type window count',
    unit: 'piece',
    visualToken: 'privacy-window-unit',
    wasteFactor: 0.03,
  },
  {
    id: 'entry-door-unit',
    baseUnitCost: 760,
    category: 'doorUnit',
    compatibleModuleTypes: ['living', 'technical'],
    label: 'Entry door unit',
    laborUnitCost: 180,
    notes: 'Main external door package for entry-facing module.',
    quantityFormula: 'one entry door for each living or sauna/technical core module',
    unit: 'piece',
    visualToken: 'entry-door-unit',
    wasteFactor: 0.02,
  },
  {
    id: 'terrace-slider-door-unit',
    baseUnitCost: 2400,
    category: 'doorUnit',
    compatibleModuleTypes: ['living', 'technical'],
    label: 'Terrace slider door unit',
    laborUnitCost: 480,
    notes: 'Slider package placeholder; final threshold, drainage and weatherproofing detail required.',
    quantityFormula: 'selected terrace slider package x entry-facing module count',
    unit: 'piece',
    visualToken: 'terrace-slider-door-unit',
    wasteFactor: 0.05,
  },
  {
    id: 'premium-glazed-entry-door-unit',
    baseUnitCost: 1850,
    category: 'doorUnit',
    compatibleModuleTypes: ['living', 'technical'],
    label: 'Premium glazed entry door unit',
    laborUnitCost: 360,
    notes: 'Premium glazed entry placeholder; final hardware, thermal and security review required.',
    quantityFormula: 'selected premium glazed entry package x entry-facing module count',
    unit: 'piece',
    visualToken: 'premium-glazed-entry-door-unit',
    wasteFactor: 0.04,
  },
  {
    id: 'bathroom-wet-core-kit',
    baseUnitCost: 5200,
    category: 'bathroomCore',
    compatibleModuleTypes: ['bathroomCore'],
    label: 'Bathroom wet core kit',
    laborUnitCost: 2100,
    notes: 'Preview wet core package; final plumbing and compliance require review.',
    quantityFormula: 'one package per bathroom core module quantity',
    unit: 'package',
    visualToken: 'bathroom-wet-core',
    wasteFactor: 0.04,
  },
  {
    id: 'compact-kitchen-line',
    baseUnitCost: 720,
    category: 'kitchenLine',
    compatibleModuleTypes: ['living'],
    label: 'Compact kitchen line',
    laborUnitCost: 190,
    notes: 'Compact kitchen run for the Compact Timber 40 layout.',
    quantityFormula: '2.8 linear meters x compact living module quantity',
    unit: 'linearM',
    visualToken: 'compact-kitchen-line',
    wasteFactor: 0.05,
  },
  {
    id: 'family-kitchen-line',
    baseUnitCost: 760,
    category: 'kitchenLine',
    compatibleModuleTypes: ['living'],
    label: 'Family kitchen line',
    laborUnitCost: 210,
    notes: 'Longer kitchen run for Family Timber 80.',
    quantityFormula: '4.2 linear meters x family living module quantity',
    unit: 'linearM',
    visualToken: 'family-kitchen-line',
    wasteFactor: 0.05,
  },
  {
    id: 'small-terrace-deck-system',
    baseUnitCost: 72,
    category: 'terraceDeck',
    compatibleModuleTypes: ['terrace'],
    label: 'Front deck system',
    laborUnitCost: 26,
    notes: 'Front deck package for first offer conversations.',
    quantityFormula: 'terrace module width x terrace module length',
    unit: 'm2',
    visualToken: 'front-deck-system',
    wasteFactor: 0.08,
  },
  {
    id: 'side-terrace-deck-system',
    baseUnitCost: 76,
    category: 'terraceDeck',
    compatibleModuleTypes: ['terrace'],
    label: 'Side terrace deck system',
    laborUnitCost: 28,
    notes: 'Side terrace package for side access and outdoor utility use.',
    quantityFormula: 'side terrace module width x side terrace module length',
    unit: 'm2',
    visualToken: 'side-terrace-deck',
    wasteFactor: 0.08,
  },
  {
    id: 'extended-terrace-deck-system',
    baseUnitCost: 76,
    category: 'terraceDeck',
    compatibleModuleTypes: ['terrace'],
    label: 'Extended terrace deck system',
    laborUnitCost: 28,
    notes: 'Larger terrace package; final foundation interface requires review.',
    quantityFormula: 'terrace module width x terrace module length',
    unit: 'm2',
    visualToken: 'extended-terrace-deck',
    wasteFactor: 0.09,
  },
  {
    id: 'covered-terrace-deck-system',
    baseUnitCost: 82,
    category: 'terraceDeck',
    compatibleModuleTypes: ['terrace'],
    label: 'Covered terrace deck system',
    laborUnitCost: 32,
    notes: 'Covered terrace deck allowance; final support and foundation interface requires review.',
    quantityFormula: 'covered terrace module width x covered terrace module length',
    unit: 'm2',
    visualToken: 'covered-terrace-deck',
    wasteFactor: 0.1,
  },
  {
    id: 'covered-terrace-roof-placeholder',
    baseUnitCost: 96,
    category: 'roofCassette',
    compatibleModuleTypes: ['terrace'],
    label: 'Covered terrace roof placeholder',
    laborUnitCost: 38,
    notes: 'Placeholder roof/post package for covered terrace preview; production structural review required.',
    quantityFormula: 'covered terrace roof area placeholder',
    unit: 'm2',
    visualToken: 'covered-terrace-roof-placeholder',
    wasteFactor: 0.1,
  },
  {
    id: 'foundation-pad-set',
    baseUnitCost: 92,
    category: 'foundationPad',
    compatibleModuleTypes: ['living', 'bedroom', 'bathroomCore', 'technical', 'terrace'],
    label: 'Foundation pad placeholder',
    laborUnitCost: 34,
    notes: 'Placeholder only; site-specific foundation is outside preview estimate.',
    quantityFormula: 'module footprint m2 x module quantity',
    unit: 'm2',
    visualToken: 'foundation-pad-placeholder',
    wasteFactor: 0.04,
  },
  {
    id: 'interior-plywood-finish',
    baseUnitCost: 26,
    category: 'interiorFinish',
    compatibleModuleTypes: ['living', 'bedroom', 'bathroomCore', 'technical'],
    label: 'Interior plywood finish',
    laborUnitCost: 16,
    notes: 'Preview interior finish surface, excluding final room-by-room specification.',
    quantityFormula: 'module interior wall area x finish factor',
    unit: 'm2',
    visualToken: 'interior-plywood-finish',
    wasteFactor: 0.09,
  },
  {
    id: 'standard-furniture-package',
    baseUnitCost: 2300,
    category: 'furniturePackage',
    compatibleModuleTypes: ['living', 'bedroom'],
    label: 'Standard furniture preview package',
    laborUnitCost: 260,
    notes: 'Simple furniture placeholder for commercial visualization.',
    quantityFormula: 'one package per living or bedroom module when finish is standard or premium',
    unit: 'package',
    visualToken: 'standard-furniture-package',
    wasteFactor: 0.02,
  },
  {
    id: 'premium-furniture-package',
    baseUnitCost: 4200,
    category: 'furniturePackage',
    compatibleModuleTypes: ['living', 'bedroom'],
    label: 'Premium furniture preview package',
    laborUnitCost: 390,
    notes: 'Premium interior placeholder; not a final furniture quote.',
    quantityFormula: 'one package per living or bedroom module when finish is premium',
    unit: 'package',
    visualToken: 'premium-furniture-package',
    wasteFactor: 0.03,
  },
  {
    id: 'sauna-bench-package',
    baseUnitCost: 3100,
    category: 'furniturePackage',
    compatibleModuleTypes: ['living'],
    label: 'Sauna bench package',
    laborUnitCost: 620,
    notes: 'Sauna-specific interior package for the wellness module preview.',
    quantityFormula: 'one sauna bench package per sauna core module',
    unit: 'package',
    visualToken: 'sauna-bench-package',
    wasteFactor: 0.04,
  },
] as const satisfies readonly ModularHomeComponent[];

const WINDOW_COMPONENT_IDS = [
  'standard-window-unit',
  'panoramic-window-unit',
  'corner-glazing-unit',
  'privacy-window-unit',
] as const satisfies readonly ModularHomeComponentId[];

const DOOR_COMPONENT_IDS = [
  'entry-door-unit',
  'terrace-slider-door-unit',
  'premium-glazed-entry-door-unit',
] as const satisfies readonly ModularHomeComponentId[];

export const MODULAR_HOME_MODULE_COMPONENT_IDS = {
  'compact-living-module': [
    'timber-wall-panel-system',
    'timber-floor-cassette-system',
    ...WINDOW_COMPONENT_IDS,
    ...DOOR_COMPONENT_IDS,
    'compact-kitchen-line',
    'foundation-pad-set',
    'interior-plywood-finish',
    'standard-furniture-package',
    'premium-furniture-package',
  ],
  'compact-bedroom-module': [
    'timber-wall-panel-system',
    'timber-floor-cassette-system',
    ...WINDOW_COMPONENT_IDS,
    'foundation-pad-set',
    'interior-plywood-finish',
    'standard-furniture-package',
    'premium-furniture-package',
  ],
  'bathroom-core-module': [
    'timber-wall-panel-system',
    'timber-floor-cassette-system',
    ...WINDOW_COMPONENT_IDS,
    'bathroom-wet-core-kit',
    'foundation-pad-set',
    'interior-plywood-finish',
  ],
  'family-living-module': [
    'timber-wall-panel-system',
    'timber-floor-cassette-system',
    ...WINDOW_COMPONENT_IDS,
    ...DOOR_COMPONENT_IDS,
    'family-kitchen-line',
    'foundation-pad-set',
    'interior-plywood-finish',
    'standard-furniture-package',
    'premium-furniture-package',
  ],
  'family-bedroom-module': [
    'timber-wall-panel-system',
    'timber-floor-cassette-system',
    ...WINDOW_COMPONENT_IDS,
    'foundation-pad-set',
    'interior-plywood-finish',
    'standard-furniture-package',
    'premium-furniture-package',
  ],
  'sauna-core-module': [
    'timber-wall-panel-system',
    'timber-floor-cassette-system',
    'standard-window-unit',
    'privacy-window-unit',
    ...DOOR_COMPONENT_IDS,
    'foundation-pad-set',
    'interior-plywood-finish',
    'sauna-bench-package',
  ],
  'roof-flat-module': [
    'flat-roof-cassette-system',
  ],
  'roof-pitched-module': [
    'pitched-roof-cassette-system',
  ],
  'facade-natural-timber': [
    'natural-timber-facade-boarding',
  ],
  'facade-dark-thermo': [
    'dark-thermo-facade-boarding',
  ],
  'facade-light-painted': [
    'light-painted-facade-boarding',
  ],
  'terrace-small-module': [
    'small-terrace-deck-system',
    'foundation-pad-set',
  ],
  'terrace-side-module': [
    'side-terrace-deck-system',
    'foundation-pad-set',
  ],
  'terrace-extended-module': [
    'extended-terrace-deck-system',
    'foundation-pad-set',
  ],
  'terrace-covered-placeholder-module': [
    'covered-terrace-deck-system',
    'covered-terrace-roof-placeholder',
    'foundation-pad-set',
  ],
} as const satisfies Record<ModularHomeModuleId, readonly ModularHomeComponentId[]>;

export const MODULAR_HOME_PRODUCT_COMPONENT_LIBRARY = {
  'compact-timber-40': [
    'timber-wall-panel-system',
    'timber-floor-cassette-system',
    'pitched-roof-cassette-system',
    'natural-timber-facade-boarding',
    ...WINDOW_COMPONENT_IDS,
    ...DOOR_COMPONENT_IDS,
    'bathroom-wet-core-kit',
    'compact-kitchen-line',
    'small-terrace-deck-system',
    'side-terrace-deck-system',
    'covered-terrace-deck-system',
    'covered-terrace-roof-placeholder',
    'foundation-pad-set',
    'interior-plywood-finish',
    'standard-furniture-package',
  ],
  'family-timber-80': [
    'timber-wall-panel-system',
    'timber-floor-cassette-system',
    'pitched-roof-cassette-system',
    'natural-timber-facade-boarding',
    ...WINDOW_COMPONENT_IDS,
    ...DOOR_COMPONENT_IDS,
    'bathroom-wet-core-kit',
    'family-kitchen-line',
    'extended-terrace-deck-system',
    'side-terrace-deck-system',
    'covered-terrace-deck-system',
    'covered-terrace-roof-placeholder',
    'foundation-pad-set',
    'interior-plywood-finish',
    'standard-furniture-package',
  ],
  'sauna-cabin-25': [
    'timber-wall-panel-system',
    'timber-floor-cassette-system',
    'flat-roof-cassette-system',
    'dark-thermo-facade-boarding',
    'standard-window-unit',
    'privacy-window-unit',
    ...DOOR_COMPONENT_IDS,
    'bathroom-wet-core-kit',
    'small-terrace-deck-system',
    'side-terrace-deck-system',
    'covered-terrace-deck-system',
    'covered-terrace-roof-placeholder',
    'foundation-pad-set',
    'interior-plywood-finish',
    'sauna-bench-package',
  ],
} as const satisfies Record<ModularHomeProductId, readonly ModularHomeComponentId[]>;

function getComponentById(id: ModularHomeComponentId): ModularHomeComponent | undefined {
  return MODULAR_HOME_COMPONENTS.find((component) => component.id === id);
}

function getComponentIdsForModule(moduleId: ModularHomeModuleId): readonly ModularHomeComponentId[] {
  return MODULAR_HOME_MODULE_COMPONENT_IDS[moduleId] ?? [];
}

function roundMoney(value: number): number {
  return Math.round(value);
}

function roundQuantity(value: number): number {
  return Math.round(value * 100) / 100;
}

function roundRatio(value: number): number {
  return Math.round(value * 1000) / 1000;
}

function roundOneDecimal(value: number): number {
  return Math.round(value * 10) / 10;
}

function moduleFloorArea(module: ModularHomeModule): number {
  return module.dimensions.widthM * module.dimensions.lengthM;
}

function moduleWallArea(module: ModularHomeModule): number {
  return 2 * (module.dimensions.widthM + module.dimensions.lengthM) * module.dimensions.heightM;
}

function formatMeters(value: number): string {
  return `${roundOneDecimal(value)} m`;
}

function getWallPanelDimensions(module: ModularHomeModule): readonly string[] {
  return [
    `2 x ${formatMeters(module.dimensions.lengthM)} x ${formatMeters(module.dimensions.heightM)} long wall panels`,
    `2 x ${formatMeters(module.dimensions.widthM)} x ${formatMeters(module.dimensions.heightM)} end wall panels`,
  ];
}

function getFacadeBoardLinearMeters(areaM2: number): number {
  // Preview assumes 145 mm effective cladding board coverage before final supplier profile selection.
  return roundQuantity(areaM2 / 0.145);
}

function moduleWindowCount(module: ModularHomeModule): number {
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

function isComponentCompatibleWithModule(
  component: ModularHomeComponent,
  module: ModularHomeModule,
): boolean {
  return component.compatibleModuleTypes.includes(module.type);
}

function getSelectedWindowComponentId(config: ModularHomeConfiguratorState): ModularHomeComponentId {
  const componentByPackage = {
    standardWindows: 'standard-window-unit',
    panoramicWindows: 'panoramic-window-unit',
    cornerGlazing: 'corner-glazing-unit',
    compactPrivacy: 'privacy-window-unit',
  } as const satisfies Record<ModularHomeConfiguratorState['windowPackage'], ModularHomeComponentId>;

  return componentByPackage[config.windowPackage] ?? 'standard-window-unit';
}

function getSelectedDoorComponentId(config: ModularHomeConfiguratorState): ModularHomeComponentId {
  const componentByPackage = {
    standardEntry: 'entry-door-unit',
    terraceSlider: 'terrace-slider-door-unit',
    premiumGlazedEntry: 'premium-glazed-entry-door-unit',
  } as const satisfies Record<ModularHomeConfiguratorState['doorPackage'], ModularHomeComponentId>;

  return componentByPackage[config.doorPackage] ?? 'entry-door-unit';
}

function getWindowQuantityForConfig(
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

function getDoorQuantityForConfig(
  module: ModularHomeModule,
  moduleQuantity: number,
  config: ModularHomeConfiguratorState,
): number {
  if (config.doorPlacement === 'terraceFacing' && module.type === 'living') {
    return moduleQuantity + 1;
  }

  return moduleQuantity;
}

function calculateComponentQuantity(
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
      return module.dimensions.widthM * module.dimensions.heightM * 4 * moduleQuantity;
    case 'windowUnit':
      return component.id === getSelectedWindowComponentId(config)
        ? getWindowQuantityForConfig(module, config) * moduleQuantity
        : 0;
    case 'doorUnit':
      return component.id === getSelectedDoorComponentId(config) ? getDoorQuantityForConfig(module, moduleQuantity, config) : 0;
    case 'bathroomCore':
      return moduleQuantity;
    case 'kitchenLine':
      return (component.id === 'family-kitchen-line' ? 4.2 : 2.8) * moduleQuantity;
    case 'terraceDeck':
      return moduleFloorArea(module) * moduleQuantity;
    case 'interiorFinish':
      return moduleWallArea(module) * 0.72 * moduleQuantity;
    case 'furniturePackage':
      if (component.id === 'sauna-bench-package') {
        return module.id === 'sauna-core-module' ? moduleQuantity : 0;
      }

      if (config.finishLevel === 'shell') {
        return 0;
      }

      if (component.id === 'premium-furniture-package') {
        return config.finishLevel === 'premium' ? moduleQuantity : 0;
      }

      return config.finishLevel === 'standard' ? moduleQuantity : 0;
    default:
      return 0;
  }
}

export function getComponentsForModule(moduleId: string): readonly ModularHomeComponent[] {
  if (!MODULAR_HOME_MODULE_COMPONENT_IDS[moduleId as ModularHomeModuleId]) {
    return [];
  }

  return getComponentIdsForModule(moduleId as ModularHomeModuleId)
    .map((componentId) => getComponentById(componentId))
    .filter((component): component is ModularHomeComponent => Boolean(component));
}

export function getComponentsForProduct(productId: string): readonly ModularHomeComponent[] {
  const product = getModularHomeProduct(productId);

  if (!product) {
    return [];
  }

  const componentIds = new Set<ModularHomeComponentId>();

  for (const componentId of MODULAR_HOME_PRODUCT_COMPONENT_LIBRARY[product.id]) {
    componentIds.add(componentId);
  }

  return [...componentIds]
    .map((componentId) => getComponentById(componentId))
    .filter((component): component is ModularHomeComponent => Boolean(component));
}

export function getComponentSummaryForConfig(
  config: ModularHomeConfiguratorState,
): readonly ModularHomeComponentSummaryItem[] {
  const product = getModularHomeProductForConfig(config);

  if (!product) {
    return [];
  }

  const moduleQuantityById = new Map(
    getModuleQuantitySummary(product.id).map((item) => [item.moduleId, item.quantity]),
  );
  const summaryByComponentId = new Map<ModularHomeComponentId, ModularHomeComponentSummaryItem & {
    mutableModuleIds: ModularHomeModuleId[];
  }>();

  for (const module of getModulesForConfig(config)) {
    const moduleQuantity = moduleQuantityById.get(module.id) ?? 1;

    for (const component of getComponentsForModule(module.id)) {
      if (!component.compatibleModuleTypes.includes(module.type)) {
        continue;
      }

      const quantity = calculateComponentQuantity(component, module, moduleQuantity, config);

      if (quantity <= 0) {
        continue;
      }

      const roundedQuantity = roundQuantity(quantity);
      const baseCost = roundMoney(roundedQuantity * component.baseUnitCost);
      const laborCost = roundMoney(roundedQuantity * component.laborUnitCost);
      const wasteCost = roundMoney((baseCost + laborCost) * component.wasteFactor);
      const totalCost = baseCost + laborCost + wasteCost;
      const existing = summaryByComponentId.get(component.id);

      if (existing) {
        existing.quantity = roundQuantity(existing.quantity + roundedQuantity);
        existing.baseCost += baseCost;
        existing.laborCost += laborCost;
        existing.pricingBreakdown = sumModularHomePricingBreakdowns([
          existing.pricingBreakdown,
          createComponentPricingBreakdown({
            laborCost,
            materialCost: baseCost,
            wasteCost,
          }),
        ]);
        existing.wasteCost += wasteCost;
        existing.totalCost += totalCost;
        if (!existing.mutableModuleIds.includes(module.id)) {
          existing.mutableModuleIds.push(module.id);
        }
        continue;
      }

      summaryByComponentId.set(component.id, {
        baseCost,
        category: component.category,
        component,
        componentId: component.id,
        label: component.label,
        laborCost,
        moduleIds: [module.id],
        mutableModuleIds: [module.id],
        notes: component.notes,
        pricingBreakdown: createComponentPricingBreakdown({
          laborCost,
          materialCost: baseCost,
          wasteCost,
        }),
        quantity: roundedQuantity,
        totalCost,
        unit: component.unit,
        visualToken: component.visualToken,
        wasteCost,
      });
    }
  }

  return [...summaryByComponentId.values()].map((item) => ({
    baseCost: item.baseCost,
    category: item.category,
    component: item.component,
    componentId: item.componentId,
    label: item.label,
    laborCost: item.laborCost,
    moduleIds: item.mutableModuleIds,
    notes: item.notes,
    pricingBreakdown: item.pricingBreakdown,
    quantity: roundQuantity(item.quantity),
    totalCost: item.totalCost,
    unit: item.unit,
    visualToken: item.visualToken,
    wasteCost: item.wasteCost,
  }));
}

export function calculateComponentBom(config: ModularHomeConfiguratorState): ModularHomeComponentBom {
  const product = getModularHomeProductForConfig(config);
  const items = getComponentSummaryForConfig(config);
  const quantities = calculateModularHomeQuantities(config);
  const moduleSummary = product ? getBomModuleSummary(product.id) : [];
  const pricingCategoryTotals = getModularHomePricingCategoryTotals(items.map((item) => item.pricingBreakdown));
  const groupsByCategory = new Map<ModularHomeComponentCategory, {
    componentIds: ModularHomeComponentId[];
    laborCostEstimate: number;
    materialCostEstimate: number;
    moduleIds: ModularHomeModuleId[];
    quantity: number;
    subtotal: number;
    units: Set<ModularHomeComponentUnit>;
    wasteCostEstimate: number;
  }>();

  for (const item of items) {
    const existing = groupsByCategory.get(item.category) ?? {
      componentIds: [],
      laborCostEstimate: 0,
      materialCostEstimate: 0,
      moduleIds: [],
      quantity: 0,
      subtotal: 0,
      units: new Set<ModularHomeComponentUnit>(),
      wasteCostEstimate: 0,
    };

    if (!existing.componentIds.includes(item.componentId)) {
      existing.componentIds.push(item.componentId);
    }

    for (const moduleId of item.moduleIds) {
      if (!existing.moduleIds.includes(moduleId)) {
        existing.moduleIds.push(moduleId);
      }
    }

    existing.laborCostEstimate += item.laborCost;
    existing.materialCostEstimate += item.baseCost;
    existing.quantity = roundQuantity(existing.quantity + item.quantity);
    existing.subtotal += item.totalCost;
    existing.units.add(item.unit);
    existing.wasteCostEstimate += item.wasteCost;
    groupsByCategory.set(item.category, existing);
  }

  const groups = [...groupsByCategory.entries()].map(([category, group]): ModularHomeComponentBomGroup => {
    const costBeforeWaste = group.materialCostEstimate + group.laborCostEstimate;

    return {
      category,
      componentCount: group.componentIds.length,
      componentIds: group.componentIds,
      laborCostEstimate: group.laborCostEstimate,
      materialCostEstimate: group.materialCostEstimate,
      moduleIds: group.moduleIds,
      quantity: roundQuantity(group.quantity),
      subtotal: group.subtotal,
      unit: group.units.size === 1 ? [...group.units][0] : 'mixed',
      wasteCostEstimate: group.wasteCostEstimate,
      wasteFactor: costBeforeWaste > 0 ? roundRatio(group.wasteCostEstimate / costBeforeWaste) : 0,
    };
  });

  return {
    componentCount: items.length,
    config,
    disclaimer: MODULAR_HOME_COMPONENT_BOM_DISCLAIMER,
    groups,
    items,
    laborCostEstimate: items.reduce((total, item) => total + item.laborCost, 0),
    materialCostEstimate: items.reduce((total, item) => total + item.baseCost, 0),
    moduleCount: quantities.moduleCount,
    modules: moduleSummary,
    pricingCategoryTotals,
    pricingContext: MODULAR_HOME_PRICING_CONTEXT,
    productId: product?.id ?? null,
    productName: product?.name ?? 'Unknown modular home',
    quantities,
    subtotal: items.reduce((total, item) => total + item.totalCost, 0),
    totalQuantity: roundQuantity(items.reduce((total, item) => total + item.quantity, 0)),
    wasteCostEstimate: items.reduce((total, item) => total + item.wasteCost, 0),
  };
}

export function calculateManufacturingBomPreview(config: ModularHomeConfiguratorState): ModularHomeManufacturingBom {
  const product = getModularHomeProductForConfig(config);
  const componentBom = calculateComponentBom(config);
  const moduleQuantityById = new Map(
    product ? getModuleQuantitySummary(product.id).map((item) => [item.moduleId, item.quantity]) : [],
  );
  const panelGroups: ModularHomeManufacturingBomPanelGroup[] = [];

  for (const module of getModulesForConfig(config)) {
    if (!['living', 'bedroom', 'bathroomCore', 'technical'].includes(module.type)) {
      continue;
    }

    const moduleQuantity = moduleQuantityById.get(module.id) ?? 1;
    const wallArea = roundQuantity(moduleWallArea(module) * moduleQuantity);

    panelGroups.push({
      areaM2: wallArea,
      approximatePanelDimensions: getWallPanelDimensions(module),
      id: `${module.id}-wall-panel-group`,
      label: `${module.id} wall panel group`,
      moduleIds: [module.id],
      notes: 'Approximate elevation panelization only; final stud layout, openings and transport breaks require production verification.',
      panelCount: 4 * moduleQuantity,
      wasteFactor: 0.08,
    });
  }

  const facadeGroup = componentBom.groups.find((group) => group.category === 'facadeBoarding');
  const floorGroup = componentBom.groups.find((group) => group.category === 'floorCassette');
  const roofGroup = componentBom.groups.find((group) => group.category === 'roofCassette');
  const windowItems = componentBom.items.filter((item) => item.category === 'windowUnit');
  const doorItems = componentBom.items.filter((item) => item.category === 'doorUnit');
  const terraceItems = componentBom.items.filter((item) => item.category === 'terraceDeck');
  const interiorItems = componentBom.items.filter((item) => item.category === 'interiorFinish');
  const wasteBase = componentBom.materialCostEstimate + componentBom.laborCostEstimate;

  const scheduleFromItems = (
    items: readonly ModularHomeComponentSummaryItem[],
    dimensions: (item: ModularHomeComponentSummaryItem) => string,
  ): readonly ModularHomeManufacturingBomScheduleItem[] => items.map((item) => ({
    areaM2: item.unit === 'm2' ? roundQuantity(item.quantity) : null,
    dimensions: dimensions(item),
    id: item.componentId,
    label: item.label,
    linearM: item.unit === 'linearM' ? roundQuantity(item.quantity) : null,
    notes: item.notes,
    quantity: roundQuantity(item.quantity),
    unit: item.unit,
    wasteFactor: item.component.wasteFactor,
  }));

  const windowSchedule = scheduleFromItems(windowItems, () => (
    config.windowPlacement === 'cornerFeature'
      ? `${config.windowPlacement} placement / includes corner feature review`
      : `${config.windowPlacement} placement / controlled openings`
  ));
  const doorSchedule = scheduleFromItems(doorItems, () => (
    config.doorPlacement === 'terraceFacing'
      ? 'terrace-facing controlled door placement'
      : `${config.doorPlacement} controlled door placement`
  ));
  const terraceDeckSchedule = scheduleFromItems(terraceItems, () => `${config.terrace} terrace deck package`);
  const interiorFinishAreas = scheduleFromItems(interiorItems, () => `${config.finishLevel} interior finish surface allowance`);

  return {
    componentBomSubtotal: componentBom.subtotal,
    config,
    disclaimer: MODULAR_HOME_MANUFACTURING_BOM_DISCLAIMER,
    doorSchedule,
    facadeBoardAreaM2: roundQuantity(facadeGroup?.quantity ?? componentBom.quantities.facadeAreaM2),
    facadeBoardLinearM: getFacadeBoardLinearMeters(facadeGroup?.quantity ?? componentBom.quantities.facadeAreaM2),
    floorCassetteAreaM2: roundQuantity(floorGroup?.quantity ?? componentBom.quantities.grossFloorAreaM2),
    interiorFinishAreas,
    moduleCount: componentBom.moduleCount,
    panelGroups,
    productionVerificationNotes: [
      'Preview manufacturing BOM is derived from configurable web product data, not a factory-approved cut list.',
      'Openings, structural headers, transport splits, fasteners, CNC nesting and supplier-specific profiles require production verification.',
      'Panoramic glazing, corner glazing and terrace-facing door variants require engineering and weatherproofing review before manufacturing.',
    ],
    productId: componentBom.productId,
    productName: componentBom.productName,
    roofCassetteAreaM2: roundQuantity(roofGroup?.quantity ?? componentBom.quantities.roofAreaM2),
    terraceDeckSchedule,
    totalWasteFactor: wasteBase > 0 ? roundRatio(componentBom.wasteCostEstimate / wasteBase) : 0,
    windowSchedule,
  };
}

export function calculateManufacturingBom(config: ModularHomeConfiguratorState): ModularHomeManufacturingBom {
  return calculateManufacturingBomPreview(config);
}
