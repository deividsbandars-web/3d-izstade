import type { ModularHomeTemplateId } from './modularHomeConfig';
import {
  DEFAULT_MODULAR_HOME_CONFIG,
  type ModularHomeConfiguratorState,
  type ModularHomeDimensionPresetOption,
  type ModularHomeLayoutVariantOption,
  type ModularHomeRoomUseProfileOption,
} from './modularHomeConfigurator';
import {
  getModularHomeMaterial,
  type ModularHomeMaterial,
  type ModularHomeMaterialId,
} from './modularHomeMaterials';
import modularHomeProductData from './modularHomeProducts.json';

export type ModularHomeProductId = 'compact-timber-40' | 'family-timber-80' | 'sauna-cabin-25';

export type ModularHomeProductCategory =
  | 'compactHome'
  | 'familyHome'
  | 'saunaCabin';

export type ModularHomeLayoutVariantId = ModularHomeLayoutVariantOption;
export type ModularHomeDimensionPresetId = ModularHomeDimensionPresetOption;

export type ModularHomeLayoutVariant = {
  id: ModularHomeLayoutVariantId;
  productId: ModularHomeProductId;
  label: string;
  shortLabel: string;
  roomLabels: readonly string[];
  summaryNote: string;
  estimateNote: string;
  bomNote: string;
};

export type ModularHomeRoomMeasurementType =
  | 'bathroom'
  | 'bedroom'
  | 'circulation'
  | 'kitchen'
  | 'living'
  | 'sauna'
  | 'storage'
  | 'technical'
  | 'terrace';

export type ModularHomeRoomMeasurement = {
  areaM2: number;
  id: string;
  label: string;
  layoutVariantId: ModularHomeLayoutVariantId;
  note: string;
  productId: ModularHomeProductId;
  type: ModularHomeRoomMeasurementType;
};

export type ModularHomeRoomMeasurementSummary = {
  ceilingHeightM: number;
  disclaimer: string;
  floorAreaM2: number;
  layoutVariant: ModularHomeLayoutVariant | null;
  product: ModularHomeProduct | null;
  roomAreaTotalM2: number;
  rooms: readonly ModularHomeRoomMeasurement[];
};

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
  | 'doorPackage'
  | 'windowPlacement'
  | 'doorPlacement'
  | 'facadeBoardOrientation'
  | 'facadeBoardWidth'
  | 'facadeBoardProfile'
  | 'facadeBoardSpacing'
  | 'trimColor'
  | 'roofGutterStyle'
  | 'windowFrameType'
  | 'interiorFloorStyle'
  | 'wallPanelStyle'
  | 'kitchenFinish'
  | 'furnitureMood'
  | 'interiorZoneFocus'
  | 'roofEdgeColor'
  | 'windowFrameColor'
  | 'interiorWallFinish'
  | 'floorFinish'
  | 'furniturePackage'
  | 'sofa'
  | 'table'
  | 'bed'
  | 'kitchenLine'
  | 'wardrobePlaceholder';

export type ModularHomeConstraintStatus =
  | 'compatible'
  | 'notAvailable'
  | 'requiresReview';

export type ModularHomeProductionConstraintSeverity =
  | 'info'
  | 'warning'
  | 'requiresReview'
  | 'blocked';

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

export type ModularHomeDimensionPreset = {
  id: ModularHomeDimensionPresetId;
  productId: ModularHomeProductId;
  label: string;
  shortLabel: string;
  floorAreaM2: number;
  footprint: ModularHomeFootprintDimensions;
  moduleCount: number;
  transportModuleCount: number;
  summaryNote: string;
  estimateNote: string;
  bomNote: string;
  floorplanNote: string;
  moduleDimensionNote: string;
  windowCountDelta?: number;
  doorCountDelta?: number;
  terraceAreaMultiplier?: number;
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
  productionConstraintSeverity: ModularHomeProductionConstraintSeverity;
  productionNextStep: string;
};

export type ModularHomeConfigurationWarning = {
  affectedOptions: readonly string[];
  id: string;
  message: string;
  nextStep: string;
  relatedGroups: readonly ModularHomeOptionGroup[];
  severity: ModularHomeProductionConstraintSeverity;
  status: ModularHomeConstraintStatus;
};

export type ModularHomeProductionConstraint = ModularHomeConfigurationWarning;

export type ModularHomeProductConfigSummary = {
  dimensionPreset: string;
  doorPackage: string;
  doorPlacement: string;
  facade: string;
  facadeBoardOrientation: string;
  facadeBoardProfile: string;
  facadeBoardSpacing: string;
  facadeBoardWidth: string;
  finishLevel: string;
  floorFinish: string;
  furniturePackage: string;
  sofa: string;
  table: string;
  bed: string;
  kitchenLine: string;
  wardrobePlaceholder: string;
  interiorWallFinish: string;
  interiorFloorStyle: string;
  kitchenFinish: string;
  furnitureMood: string;
  interiorZoneFocus: string;
  layoutVariant: string;
  product: string;
  roomUseProfile: string;
  roof: string;
  roofEdgeColor: string;
  roofGutterStyle: string;
  template: string;
  terrace: string;
  trimColor: string;
  windowFrameColor: string;
  windowFrameType: string;
  windowPackage: string;
  windowPlacement: string;
  wallPanelStyle: string;
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
  dimensionPresetId: ModularHomeDimensionPresetId;
  dimensionPresetLabel: string;
  dimensionPresetNote: string;
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

export type ModularHomeRoomUseProfile = {
  id: ModularHomeRoomUseProfileOption;
  label: string;
  shortLabel: string;
  summaryNote: string;
  estimateNote: string;
  bomNote: string;
  interiorPackageNote: string;
};

type ModularHomeProductsData = {
  allProductIds: readonly ModularHomeProductId[];
  defaultRoomUseProfileByLayout: Record<ModularHomeLayoutVariantId, ModularHomeRoomUseProfileOption>;
  dimensionPresets: readonly ModularHomeDimensionPreset[];
  layoutVariants: readonly ModularHomeLayoutVariant[];
  modules: readonly ModularHomeModule[];
  options: readonly ModularHomeOption[];
  products: readonly ModularHomeProduct[];
  roomMeasurementDisclaimer: string;
  roomMeasurements: readonly ModularHomeRoomMeasurement[];
  roomUseChoicesByLayout: Record<ModularHomeLayoutVariantId, readonly ModularHomeRoomUseProfileOption[]>;
  roomUseProfiles: readonly ModularHomeRoomUseProfile[];
};

const MODULAR_HOME_PRODUCT_DATA = modularHomeProductData as unknown as ModularHomeProductsData;

export const MODULAR_HOME_DIMENSION_PRESETS = MODULAR_HOME_PRODUCT_DATA.dimensionPresets;
export const MODULAR_HOME_ROOM_USE_PROFILES = MODULAR_HOME_PRODUCT_DATA.roomUseProfiles;
const MODULAR_HOME_ROOM_USE_CHOICES_BY_LAYOUT = MODULAR_HOME_PRODUCT_DATA.roomUseChoicesByLayout;
const MODULAR_HOME_DEFAULT_ROOM_USE_PROFILE_BY_LAYOUT = MODULAR_HOME_PRODUCT_DATA.defaultRoomUseProfileByLayout;
export const MODULAR_HOME_LAYOUT_VARIANTS = MODULAR_HOME_PRODUCT_DATA.layoutVariants;
export const MODULAR_HOME_ROOM_MEASUREMENT_DISCLAIMER = MODULAR_HOME_PRODUCT_DATA.roomMeasurementDisclaimer;
export const MODULAR_HOME_ROOM_MEASUREMENTS = MODULAR_HOME_PRODUCT_DATA.roomMeasurements;
export const MODULAR_HOME_PRODUCTS = MODULAR_HOME_PRODUCT_DATA.products;
export const MODULAR_HOME_MODULES = MODULAR_HOME_PRODUCT_DATA.modules;
export const MODULAR_HOME_OPTIONS = MODULAR_HOME_PRODUCT_DATA.options;

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
    doorPlacement: config.doorPlacement,
    facade: config.facade,
    facadeBoardOrientation: config.facadeBoardOrientation,
    facadeBoardProfile: config.facadeBoardProfile,
    facadeBoardSpacing: config.facadeBoardSpacing,
    facadeBoardWidth: config.facadeBoardWidth,
    finish: config.finishLevel,
    floorFinish: config.floorFinish,
    furniturePackage: config.furniturePackage,
    kitchenFinish: config.kitchenFinish,
    furnitureMood: config.furnitureMood,
    interiorZoneFocus: config.interiorZoneFocus,
    interiorFloorStyle: config.interiorFloorStyle,
    interiorWallFinish: config.interiorWallFinish,
    trimColor: config.trimColor,
    sofa: config.sofa,
    table: config.table,
    bed: config.bed,
    kitchenLine: config.kitchenLine,
    wardrobePlaceholder: config.wardrobePlaceholder,
    roof: config.roof,
    roofEdgeColor: config.roofEdgeColor,
    roofGutterStyle: config.roofGutterStyle,
    terrace: config.terrace,
    windowFrameColor: config.windowFrameColor,
    windowFrameType: config.windowFrameType,
    windowPackage: config.windowPackage,
    windowPlacement: config.windowPlacement,
    wallPanelStyle: config.wallPanelStyle,
  } as const satisfies Record<ModularHomeOptionGroup, string>;

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
    doorPlacement: 'doorPlacement',
    facade: 'facade',
    facadeBoardOrientation: 'facadeBoardOrientation',
    facadeBoardProfile: 'facadeBoardProfile',
    facadeBoardSpacing: 'facadeBoardSpacing',
    facadeBoardWidth: 'facadeBoardWidth',
    finish: 'finishLevel',
    floorFinish: 'floorFinish',
    furniturePackage: 'furniturePackage',
    interiorFloorStyle: 'interiorFloorStyle',
    interiorWallFinish: 'interiorWallFinish',
    kitchenFinish: 'kitchenFinish',
    furnitureMood: 'furnitureMood',
    interiorZoneFocus: 'interiorZoneFocus',
    trimColor: 'trimColor',
    sofa: 'sofa',
    table: 'table',
    bed: 'bed',
    kitchenLine: 'kitchenLine',
    wardrobePlaceholder: 'wardrobePlaceholder',
    roof: 'roof',
    roofEdgeColor: 'roofEdgeColor',
    roofGutterStyle: 'roofGutterStyle',
    terrace: 'terrace',
    windowFrameColor: 'windowFrameColor',
    windowFrameType: 'windowFrameType',
    windowPackage: 'windowPackage',
    windowPlacement: 'windowPlacement',
    wallPanelStyle: 'wallPanelStyle',
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
  nextStep = 'Choose a compatible option for this product before using the preview as a client discussion.',
): ModularHomeConfigurationWarning {
  return {
    affectedOptions: relatedGroups,
    id,
    message,
    nextStep,
    relatedGroups,
    severity: 'blocked',
    status: 'notAvailable',
  };
}

function createRequiresReviewWarning(
  id: string,
  message: string,
  relatedGroups: readonly ModularHomeOptionGroup[],
  nextStep = 'Keep this option only as a preview assumption and confirm it during production/engineering review.',
): ModularHomeConfigurationWarning {
  return {
    affectedOptions: relatedGroups,
    id,
    message,
    nextStep,
    relatedGroups,
    severity: 'requiresReview',
    status: 'requiresReview',
  };
}

function createWarningConstraint(
  id: string,
  message: string,
  relatedGroups: readonly ModularHomeOptionGroup[],
  nextStep: string,
): ModularHomeConfigurationWarning {
  return {
    affectedOptions: relatedGroups,
    id,
    message,
    nextStep,
    relatedGroups,
    severity: 'warning',
    status: 'compatible',
  };
}

function createInfoConstraint(
  id: string,
  message: string,
  relatedGroups: readonly ModularHomeOptionGroup[],
  nextStep: string,
): ModularHomeConfigurationWarning {
  return {
    affectedOptions: relatedGroups,
    id,
    message,
    nextStep,
    relatedGroups,
    severity: 'info',
    status: 'compatible',
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
    getSelectedOptionForGroup(config, 'windowPlacement'),
    getSelectedOptionForGroup(config, 'doorPlacement'),
    getSelectedOptionForGroup(config, 'facadeBoardOrientation'),
    getSelectedOptionForGroup(config, 'facadeBoardWidth'),
    getSelectedOptionForGroup(config, 'facadeBoardProfile'),
    getSelectedOptionForGroup(config, 'facadeBoardSpacing'),
    getSelectedOptionForGroup(config, 'trimColor'),
    getSelectedOptionForGroup(config, 'roofEdgeColor'),
    getSelectedOptionForGroup(config, 'roofGutterStyle'),
    getSelectedOptionForGroup(config, 'windowFrameColor'),
    getSelectedOptionForGroup(config, 'windowFrameType'),
    getSelectedOptionForGroup(config, 'interiorWallFinish'),
    getSelectedOptionForGroup(config, 'floorFinish'),
    getSelectedOptionForGroup(config, 'interiorFloorStyle'),
    getSelectedOptionForGroup(config, 'wallPanelStyle'),
    getSelectedOptionForGroup(config, 'kitchenFinish'),
    getSelectedOptionForGroup(config, 'furnitureMood'),
    getSelectedOptionForGroup(config, 'interiorZoneFocus'),
    getSelectedOptionForGroup(config, 'furniturePackage'),
    getSelectedOptionForGroup(config, 'sofa'),
    getSelectedOptionForGroup(config, 'table'),
    getSelectedOptionForGroup(config, 'bed'),
    getSelectedOptionForGroup(config, 'kitchenLine'),
    getSelectedOptionForGroup(config, 'wardrobePlaceholder'),
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
    warnings.push(createWarningConstraint(
      'premium-interior-lead-time-warning',
      'Premium interior may increase production lead time and supplier coordination.',
      ['finish'],
      'Confirm finish package lead time before promising delivery dates.',
    ));
  }

  if (config.furniturePackage === 'premiumFurniture') {
    warnings.push(createRequiresReviewWarning(
      'premium-furniture-final-supplier-review',
      'Premium furniture package is a sales preview allowance and requires supplier confirmation.',
      ['furniturePackage'],
    ));
  }

  if (config.finishLevel === 'shell' && config.furniturePackage !== 'emptyShell') {
    warnings.push(createWarningConstraint(
      'shell-with-furniture-preview-warning',
      'Shell finish with furniture enabled is allowed only as a visual preview mix.',
      ['finish', 'furniturePackage'],
      'Use this combination for concept discussion only; final quote should separate shell and furniture scope.',
    ));
  }

  if (product.id !== 'sauna-cabin-25' && config.furniturePackage === 'saunaPackage') {
    warnings.push(createNotAvailableWarning(
      'sauna-furniture-package-not-available',
      'Sauna package is only available for Sauna Cabin 25.',
      ['furniturePackage'],
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

  if (config.layoutVariant === 'officeCabin' && config.windowPackage === 'cornerGlazing') {
    warnings.push(createNotAvailableWarning(
      'office-cabin-corner-glazing-blocked',
      'Office cabin layout cannot use corner glazing in the controlled preview because the work wall needs a safer solid corner.',
      ['windowPackage'],
      'Use balanced or panoramic glazing for office cabin, then request manual review for custom corner openings.',
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

  if (config.windowPlacement === 'frontPanoramic') {
    warnings.push(createRequiresReviewWarning(
      'front-panoramic-placement-review',
      'Front panoramic window placement requires structural opening, solar-gain and privacy review.',
      ['windowPlacement'],
    ));
  }

  if (config.windowPlacement === 'cornerFeature') {
    warnings.push(createRequiresReviewWarning(
      'corner-feature-placement-review',
      'Corner feature window placement requires structural corner opening, thermal bridge and transport review.',
      ['windowPlacement'],
    ));
  }

  if (config.layoutVariant === 'officeCabin' && config.windowPlacement === 'cornerFeature') {
    warnings.push(createNotAvailableWarning(
      'office-cabin-corner-feature-blocked',
      'Office cabin layout cannot use corner feature placement in this controlled preview.',
      ['windowPlacement'],
      'Use balanced or front panoramic placement, then request manual review for custom corner openings.',
    ));
  }

  if (config.layoutVariant === 'threeBedroomCompact' && config.windowPlacement === 'cornerFeature') {
    warnings.push(createNotAvailableWarning(
      'three-bedroom-corner-feature-blocked',
      'Three-bedroom compact layout cannot use corner feature placement because the compact bedroom partition plan needs fixed corner structure.',
      ['windowPlacement'],
      'Use balanced or front panoramic placement for this layout, or switch to Large living for corner glazing review.',
    ));
  }

  if (config.windowPlacement === 'sidePrivacy' && config.windowPackage === 'panoramicWindows') {
    warnings.push(createRequiresReviewWarning(
      'side-privacy-panoramic-package-review',
      'Side privacy placement with panoramic glazing requires site orientation and privacy review.',
      ['windowPlacement', 'windowPackage'],
    ));
  }

  if (config.doorPlacement === 'sideEntry') {
    warnings.push(createRequiresReviewWarning(
      'side-entry-placement-review',
      'Side entry placement requires site approach, facade orientation and weather protection review.',
      ['doorPlacement'],
    ));
  }

  if (config.doorPlacement === 'terraceFacing') {
    warnings.push(createRequiresReviewWarning(
      'terrace-facing-door-placement-review',
      'Terrace-facing door placement requires threshold, drainage and terrace interface review.',
      ['doorPlacement', 'terrace'],
    ));
  }

  if (config.terrace === 'none' && config.doorPlacement === 'terraceFacing') {
    warnings.push(createWarningConstraint(
      'terrace-facing-door-without-terrace-warning',
      'Terrace-facing door is allowed as a preview, but the actual terrace/interface package is not selected.',
      ['doorPlacement', 'terrace'],
      'Add a terrace package or confirm this door placement during manual review.',
    ));
  }

  if (config.facadeBoardOrientation === 'vertical') {
    warnings.push(createWarningConstraint(
      'vertical-facade-board-detail-review',
      'Vertical facade boards change batten, drainage and supplier profile assumptions.',
      ['facadeBoardOrientation'],
      'Confirm vertical cladding detail during production review before quoting it as fixed.',
    ));
  }

  if (config.facadeBoardWidth === 'wide') {
    warnings.push(createWarningConstraint(
      'wide-facade-board-profile-review',
      'Wide facade boards depend on supplier profile availability and movement detailing.',
      ['facadeBoardWidth'],
      'Confirm board profile availability before production pricing.',
    ));
  }

  if (config.facadeBoardProfile === 'shadowGap') {
    warnings.push(createRequiresReviewWarning(
      'shadow-gap-facade-profile-review',
      'Shadow-gap facade boards require supplier profile, reveal depth and moisture-detail review.',
      ['facadeBoardProfile'],
    ));
  }

  if (config.facadeBoardProfile === 'tongueGroove') {
    warnings.push(createWarningConstraint(
      'tongue-groove-facade-profile-review',
      'Tongue-and-groove facade boards require movement gap and supplier stock review.',
      ['facadeBoardProfile'],
      'Confirm supplier board profile before using it as fixed package pricing.',
    ));
  }

  if (config.facadeBoardSpacing === 'tight') {
    warnings.push(createWarningConstraint(
      'tight-facade-board-spacing-warning',
      'Tight board spacing increases board count, finishing time and moisture-detail sensitivity.',
      ['facadeBoardSpacing'],
      'Use the preview estimate as a comparison only and confirm exact spacing with production.',
    ));
  }

  if (config.facadeBoardSpacing === 'expressive') {
    warnings.push(createRequiresReviewWarning(
      'expressive-facade-board-spacing-review',
      'Expressive board spacing requires weatherproofing and facade shadow-detail review.',
      ['facadeBoardSpacing'],
    ));
  }

  if (config.trimColor === 'bronze') {
    warnings.push(createWarningConstraint(
      'bronze-trim-finish-review',
      'Bronze trim is a premium color assumption and requires supplier finish confirmation.',
      ['trimColor'],
      'Confirm trim finish availability before presenting it as a fixed delivery color.',
    ));
  }

  if (config.trimColor === 'white' && config.facade === 'darkThermoWood') {
    warnings.push(createWarningConstraint(
      'white-trim-dark-facade-maintenance-review',
      'White trim on dark thermo wood is a high-contrast detail and may require maintenance/coating review.',
      ['trimColor', 'facade'],
      'Confirm coating system and maintenance expectations before final quote.',
    ));
  }

  if (config.roofGutterStyle === 'boxGutter') {
    warnings.push(createRequiresReviewWarning(
      'box-gutter-drainage-review',
      'Box gutter style requires roof drainage, snow-load and maintenance access review.',
      ['roofGutterStyle', 'roof'],
    ));
  }

  if (config.roofGutterStyle === 'roundGutter') {
    warnings.push(createWarningConstraint(
      'round-gutter-profile-review',
      'Round gutter placeholder requires supplier profile and downspout coordination review.',
      ['roofGutterStyle'],
      'Confirm gutter supplier profile before production pricing.',
    ));
  }

  if (config.windowFrameType === 'slimline') {
    warnings.push(createRequiresReviewWarning(
      'slimline-window-frame-review',
      'Slimline window frames require supplier profile, thermal bridge and opening tolerance review.',
      ['windowFrameType', 'windowPackage'],
    ));
  }

  if (config.windowFrameType === 'deepReveal') {
    warnings.push(createRequiresReviewWarning(
      'deep-reveal-window-frame-review',
      'Deep reveal window frames require wall build-up, flashing and weatherproofing review.',
      ['windowFrameType'],
    ));
  }

  if (config.floorFinish === 'polishedConcrete') {
    warnings.push(createRequiresReviewWarning(
      'polished-concrete-floor-system-review',
      'Polished concrete floor finish is a visual preview token and requires slab/system review.',
      ['floorFinish'],
    ));
  }

  if (config.interiorFloorStyle === 'polishedSlab') {
    warnings.push(createRequiresReviewWarning(
      'polished-slab-floor-style-review',
      'Polished slab grid is a visual style token and requires floor cassette/slab system review.',
      ['interiorFloorStyle', 'floorFinish'],
    ));
  }

  if (config.interiorFloorStyle === 'warmPlank') {
    warnings.push(createWarningConstraint(
      'warm-plank-floor-style-review',
      'Warm plank floor style adds a supplier finish allowance and needs final board specification review.',
      ['interiorFloorStyle'],
      'Confirm interior floor product before quoting as a fixed finish.',
    ));
  }

  if (config.wallPanelStyle === 'ribbedPanel') {
    warnings.push(createWarningConstraint(
      'ribbed-wall-panel-style-review',
      'Ribbed wall panel style depends on supplier panel profile and interior acoustic detailing.',
      ['wallPanelStyle'],
      'Confirm panel profile before final production quote.',
    ));
  }

  if (config.wallPanelStyle === 'paintReadyBoard') {
    warnings.push(createWarningConstraint(
      'paint-ready-wall-panel-style-review',
      'Paint-ready boards require final coating, joint treatment and site maintenance review.',
      ['wallPanelStyle'],
      'Confirm coating scope and whether painting is factory or site work.',
    ));
  }

  if (warnings.length === 0) {
    warnings.push(createInfoConstraint(
      'controlled-preview-compatible',
      'Selected controlled configuration has no production blockers in the preview rules.',
      [],
      'Continue with estimate review; final production quote still requires site and engineering checks.',
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

export function getModularHomeDimensionPresetsForProduct(productId: string): readonly ModularHomeDimensionPreset[] {
  return MODULAR_HOME_DIMENSION_PRESETS.filter((preset) => preset.productId === productId);
}

export function isModularHomeDimensionPresetCompatible(
  productId: string,
  dimensionPreset: string,
): dimensionPreset is ModularHomeDimensionPresetId {
  return getModularHomeDimensionPresetsForProduct(productId).some((preset) => preset.id === dimensionPreset);
}

export function getDefaultDimensionPresetForProduct(productId: string): ModularHomeDimensionPresetId {
  const product = getModularHomeProduct(productId) ?? getModularHomeProduct(DEFAULT_MODULAR_HOME_PRODUCT_ID);
  const defaultPreset = product?.defaultConfig.dimensionPreset;

  if (product && defaultPreset && isModularHomeDimensionPresetCompatible(product.id, defaultPreset)) {
    return defaultPreset;
  }

  return getModularHomeDimensionPresetsForProduct(product?.id ?? DEFAULT_MODULAR_HOME_PRODUCT_ID)[0]?.id ?? 'compactStandard';
}

export function getModularHomeDimensionPreset(
  productId: string,
  dimensionPreset?: string,
): ModularHomeDimensionPreset | null {
  const presets = getModularHomeDimensionPresetsForProduct(productId);
  const selectedPreset = presets.find((preset) => preset.id === dimensionPreset);

  return selectedPreset
    ?? presets.find((preset) => preset.id === getDefaultDimensionPresetForProduct(productId))
    ?? presets[0]
    ?? null;
}

export function getModularHomeDimensionPresetForConfig(
  config: ModularHomeConfiguratorState,
): ModularHomeDimensionPreset | null {
  const product = getProductForConfig(config);

  if (!product) {
    return getModularHomeDimensionPreset(DEFAULT_MODULAR_HOME_PRODUCT_ID, DEFAULT_MODULAR_HOME_CONFIG.dimensionPreset);
  }

  return getModularHomeDimensionPreset(product.id, config.dimensionPreset);
}

export function getDefaultHomeConfig(productId: string): ModularHomeConfiguratorState {
  const product = getModularHomeProduct(productId) ?? getModularHomeProduct(DEFAULT_MODULAR_HOME_PRODUCT_ID);

  return {
    ...(product?.defaultConfig ?? DEFAULT_MODULAR_HOME_CONFIG),
  };
}

export function getModularHomeLayoutVariantsForProduct(productId: string): readonly ModularHomeLayoutVariant[] {
  return MODULAR_HOME_LAYOUT_VARIANTS.filter((variant) => variant.productId === productId);
}

export function isModularHomeLayoutVariantCompatible(
  productId: string,
  layoutVariant: string,
): layoutVariant is ModularHomeLayoutVariantId {
  return getModularHomeLayoutVariantsForProduct(productId).some((variant) => variant.id === layoutVariant);
}

export function getDefaultLayoutVariantForProduct(productId: string): ModularHomeLayoutVariantId {
  const product = getModularHomeProduct(productId) ?? getModularHomeProduct(DEFAULT_MODULAR_HOME_PRODUCT_ID);
  const defaultVariant = product?.defaultConfig.layoutVariant;

  if (product && defaultVariant && isModularHomeLayoutVariantCompatible(product.id, defaultVariant)) {
    return defaultVariant;
  }

  return getModularHomeLayoutVariantsForProduct(product?.id ?? DEFAULT_MODULAR_HOME_PRODUCT_ID)[0]?.id ?? 'oneBedroom';
}

export function getModularHomeLayoutVariant(
  productId: string,
  layoutVariant?: string,
): ModularHomeLayoutVariant | null {
  const variants = getModularHomeLayoutVariantsForProduct(productId);
  const selectedVariant = variants.find((variant) => variant.id === layoutVariant);

  return selectedVariant ?? variants.find((variant) => variant.id === getDefaultLayoutVariantForProduct(productId)) ?? variants[0] ?? null;
}

export function getModularHomeLayoutVariantForConfig(
  config: ModularHomeConfiguratorState,
): ModularHomeLayoutVariant | null {
  const product = getProductForConfig(config);

  if (!product) {
    return getModularHomeLayoutVariant(DEFAULT_MODULAR_HOME_PRODUCT_ID, DEFAULT_MODULAR_HOME_CONFIG.layoutVariant);
  }

  return getModularHomeLayoutVariant(product.id, config.layoutVariant);
}

export function getDefaultRoomUseProfileForLayout(
  layoutVariantId: ModularHomeLayoutVariantId,
): ModularHomeRoomUseProfileOption {
  return MODULAR_HOME_DEFAULT_ROOM_USE_PROFILE_BY_LAYOUT[layoutVariantId];
}

export function getModularHomeRoomUseChoices(
  productId: string,
  layoutVariantId?: string,
): readonly ModularHomeRoomUseProfile[] {
  const product = getModularHomeProduct(productId);
  const resolvedLayoutVariant = product
    ? getModularHomeLayoutVariant(product.id, layoutVariantId)?.id
    : null;

  if (!resolvedLayoutVariant) {
    return [];
  }

  const allowed = MODULAR_HOME_ROOM_USE_CHOICES_BY_LAYOUT[resolvedLayoutVariant] ?? [];
  const profiles: ModularHomeRoomUseProfile[] = [];

  for (const id of allowed) {
    const profile = MODULAR_HOME_ROOM_USE_PROFILES.find((item) => item.id === id);
    if (profile) {
      profiles.push(profile);
    }
  }

  return profiles;
}

export function getModularHomeRoomUseProfile(
  productId: string,
  layoutVariantId: string | undefined,
  roomUseProfileId?: string,
): ModularHomeRoomUseProfile | null {
  const choices = getModularHomeRoomUseChoices(productId, layoutVariantId);
  const selected = choices.find((profile) => profile.id === roomUseProfileId);

  if (selected) {
    return selected;
  }

  const fallbackId = layoutVariantId && layoutVariantId in MODULAR_HOME_DEFAULT_ROOM_USE_PROFILE_BY_LAYOUT
    ? MODULAR_HOME_DEFAULT_ROOM_USE_PROFILE_BY_LAYOUT[layoutVariantId as ModularHomeLayoutVariantId]
    : null;

  return (
    choices.find((profile) => profile.id === fallbackId)
    ?? choices[0]
    ?? null
  );
}

export function getModularHomeRoomUseProfileForConfig(
  config: ModularHomeConfiguratorState,
): ModularHomeRoomUseProfile | null {
  const product = getProductForConfig(config);

  if (!product) {
    return getModularHomeRoomUseProfile(DEFAULT_MODULAR_HOME_PRODUCT_ID, DEFAULT_MODULAR_HOME_CONFIG.layoutVariant, DEFAULT_MODULAR_HOME_CONFIG.roomUseProfile);
  }

  return getModularHomeRoomUseProfile(product.id, config.layoutVariant, config.roomUseProfile);
}

export function getModularHomeRoomMeasurements(
  productId: string,
  layoutVariant?: string,
): readonly ModularHomeRoomMeasurement[] {
  const product = getModularHomeProduct(productId);

  if (!product) {
    return [];
  }

  const variant = getModularHomeLayoutVariant(product.id, layoutVariant);

  if (!variant) {
    return [];
  }

  return MODULAR_HOME_ROOM_MEASUREMENTS.filter((room) => (
    room.productId === product.id
    && room.layoutVariantId === variant.id
  ));
}

function getAdjustedRoomMeasurementLabel(
  room: ModularHomeRoomMeasurement,
  roomUseProfileId: ModularHomeRoomUseProfileOption,
): string {
  if (room.productId === 'compact-timber-40') {
    if (room.id === 'compact-open-studio-living-sleeping') {
      const labelByProfile: Partial<Record<ModularHomeRoomUseProfileOption, string>> = {
        bedroom: 'Studio sleeping / living',
        guestRoom: 'Guest studio / lounge',
        largerLiving: 'Larger living / lounge',
        office: 'Studio office / lounge',
      };
      return labelByProfile[roomUseProfileId] ?? room.label;
    }

    if (room.id === 'compact-one-bedroom-bedroom' || room.id === 'compact-office-guest-room') {
      const labelByProfile: Partial<Record<ModularHomeRoomUseProfileOption, string>> = {
        bedroom: 'Bedroom',
        guestRoom: 'Guest room',
        office: 'Office',
        storage: 'Storage room',
      };
      return labelByProfile[roomUseProfileId] ?? room.label;
    }
  }

  if (room.productId === 'family-timber-80') {
    if (room.id === 'family-two-bedroom-bedroom-2' || room.id === 'family-large-guest-room' || room.id === 'family-three-bedroom-office') {
      const labelByProfile: Partial<Record<ModularHomeRoomUseProfileOption, string>> = {
        bedroom: 'Bedroom',
        guestRoom: 'Guest room',
        office: 'Office',
        storage: 'Storage / utility room',
      };
      return labelByProfile[roomUseProfileId] ?? room.label;
    }

    if ((room.id === 'family-two-bedroom-living-kitchen' || room.id === 'family-large-living-kitchen') && roomUseProfileId === 'largerLiving') {
      return 'Larger living / kitchen';
    }

    if (room.id === 'family-two-bedroom-technical-storage' && roomUseProfileId === 'largerLiving') {
      return 'Service / storage wall';
    }
  }

  if (room.productId === 'sauna-cabin-25') {
    if (room.id === 'sauna-only-sauna-room' || room.id === 'sauna-guest-rest-area' || room.id === 'sauna-rest-room-main') {
      const labelByProfile: Partial<Record<ModularHomeRoomUseProfileOption, string>> = {
        guestRoom: 'Guest room / rest area',
        saunaRestRoom: 'Sauna rest room',
        storage: 'Storage / support room',
      };
      return labelByProfile[roomUseProfileId] ?? room.label;
    }
  }

  return room.label;
}

function getAdjustedRoomMeasurementNote(
  room: ModularHomeRoomMeasurement,
  roomUseProfile: ModularHomeRoomUseProfile | null,
): string {
  if (!roomUseProfile) {
    return room.note;
  }

  if (
    room.type === 'bedroom'
    || room.type === 'living'
    || room.type === 'storage'
    || room.type === 'sauna'
  ) {
    return `${room.note} ${roomUseProfile.summaryNote}`;
  }

  return room.note;
}

export function getModularHomeRoomMeasurementSummary(
  config: ModularHomeConfiguratorState,
): ModularHomeRoomMeasurementSummary {
  const product = getProductForConfig(config) ?? getModularHomeProduct(DEFAULT_MODULAR_HOME_PRODUCT_ID) ?? null;
  const layoutVariant = product ? getModularHomeLayoutVariant(product.id, config.layoutVariant) : null;
  const dimensionPreset = product ? getModularHomeDimensionPreset(product.id, config.dimensionPreset) : null;
  const roomUseProfile = product && layoutVariant
    ? getModularHomeRoomUseProfile(product.id, layoutVariant.id, config.roomUseProfile)
    : null;
  const baseFloorArea = product?.floorAreaM2 ?? 0;
  const targetFloorArea = dimensionPreset?.floorAreaM2 ?? baseFloorArea;
  const roomAreaScale = baseFloorArea > 0 ? targetFloorArea / baseFloorArea : 1;
  const rooms = product && layoutVariant
    ? getModularHomeRoomMeasurements(product.id, layoutVariant.id).map((room) => ({
      ...room,
      areaM2: Math.round(room.areaM2 * roomAreaScale * 10) / 10,
      label: getAdjustedRoomMeasurementLabel(room, roomUseProfile?.id ?? getDefaultRoomUseProfileForLayout(layoutVariant.id)),
      note: getAdjustedRoomMeasurementNote(room, roomUseProfile),
    }))
    : [];

  return {
    ceilingHeightM: product?.ceilingHeightM ?? 0,
    disclaimer: MODULAR_HOME_ROOM_MEASUREMENT_DISCLAIMER,
    floorAreaM2: targetFloorArea,
    layoutVariant,
    product,
    roomAreaTotalM2: Math.round(rooms.reduce((total, room) => total + room.areaM2, 0) * 10) / 10,
    rooms,
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
        const message = `Product ${productId} is not available.`;
        return {
          ...option,
          constraintMessage: message,
          constraintStatus: 'notAvailable',
          disabledReason: message,
          isCompatible: false,
          productionConstraintSeverity: 'blocked',
          productionNextStep: 'Choose an available Modular Home product.',
        } satisfies ModularHomeProductOptionChoice;
      }

      const isCompatible = isOptionCompatibleWithProduct(option, product);
      const disabledReason = isCompatible ? '' : `${option.label} is not available for ${product.name}.`;
      const nextConfig = config ? createConfigWithOption(config, option) : product.defaultConfig;
      const optionConstraints = isCompatible
        ? getReviewWarningsForCompatibleConfig(nextConfig, product).filter((warning) => (
          warning.relatedGroups.includes(option.group)
        ))
        : [];
      const blockedWarning = optionConstraints.find((warning) => warning.severity === 'blocked');
      const reviewWarning = optionConstraints.find((warning) => warning.severity === 'requiresReview');
      const softWarning = optionConstraints.find((warning) => warning.severity === 'warning' || warning.severity === 'info');
      const activeConstraint = blockedWarning ?? reviewWarning ?? softWarning;
      const constraintStatus: ModularHomeConstraintStatus = isCompatible
        ? blockedWarning ? 'notAvailable' : reviewWarning ? 'requiresReview' : 'compatible'
        : 'notAvailable';
      const activeDisabledReason = disabledReason || blockedWarning?.message || '';

      return {
        ...option,
        constraintMessage: activeDisabledReason || activeConstraint?.message || 'Compatible with selected product.',
        constraintStatus,
        disabledReason: activeDisabledReason,
        isCompatible: isCompatible && !blockedWarning,
        productionConstraintSeverity: activeConstraint?.severity ?? (isCompatible ? 'info' : 'blocked'),
        productionNextStep: activeConstraint?.nextStep ?? (isCompatible
          ? 'Continue with preview estimate; final quote still requires review.'
          : `Choose an option compatible with ${product.name}.`),
      } satisfies ModularHomeProductOptionChoice;
    });
}

export function getModularHomeProductionConstraints(
  config: ModularHomeConfiguratorState,
): readonly ModularHomeProductionConstraint[] {
  return getModularHomeConfigurationWarnings(config);
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
  if (!isModularHomeLayoutVariantCompatible(product.id, config.layoutVariant)) {
    warnings.push(createNotAvailableWarning(
      `${config.layoutVariant}-layout-not-available`,
      `Layout variant ${config.layoutVariant} is not available for ${product.name}.`,
      [],
    ));
  }

  if (!isModularHomeDimensionPresetCompatible(product.id, config.dimensionPreset)) {
    warnings.push(createNotAvailableWarning(
      `${config.dimensionPreset}-dimension-preset-not-available`,
      `Dimension preset ${config.dimensionPreset} is not available for ${product.name}.`,
      [],
    ));
  }

  const selectedGroups = [
    'facade',
    'roof',
    'terrace',
    'finish',
    'windowPackage',
    'doorPackage',
    'windowPlacement',
    'doorPlacement',
    'facadeBoardOrientation',
    'facadeBoardWidth',
    'facadeBoardProfile',
    'facadeBoardSpacing',
    'trimColor',
    'roofEdgeColor',
    'roofGutterStyle',
    'windowFrameColor',
    'windowFrameType',
    'interiorWallFinish',
    'floorFinish',
    'interiorFloorStyle',
    'wallPanelStyle',
    'kitchenFinish',
    'furnitureMood',
    'interiorZoneFocus',
    'furniturePackage',
    'sofa',
    'table',
    'bed',
    'kitchenLine',
    'wardrobePlaceholder',
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
    getSelectedOptionForGroup(config, 'windowPlacement'),
    getSelectedOptionForGroup(config, 'doorPlacement'),
    getSelectedOptionForGroup(config, 'facadeBoardOrientation'),
    getSelectedOptionForGroup(config, 'facadeBoardWidth'),
    getSelectedOptionForGroup(config, 'facadeBoardProfile'),
    getSelectedOptionForGroup(config, 'facadeBoardSpacing'),
    getSelectedOptionForGroup(config, 'trimColor'),
    getSelectedOptionForGroup(config, 'roofEdgeColor'),
    getSelectedOptionForGroup(config, 'roofGutterStyle'),
    getSelectedOptionForGroup(config, 'windowFrameColor'),
    getSelectedOptionForGroup(config, 'windowFrameType'),
    getSelectedOptionForGroup(config, 'interiorWallFinish'),
    getSelectedOptionForGroup(config, 'floorFinish'),
    getSelectedOptionForGroup(config, 'interiorFloorStyle'),
    getSelectedOptionForGroup(config, 'wallPanelStyle'),
    getSelectedOptionForGroup(config, 'kitchenFinish'),
    getSelectedOptionForGroup(config, 'furnitureMood'),
    getSelectedOptionForGroup(config, 'interiorZoneFocus'),
    getSelectedOptionForGroup(config, 'furniturePackage'),
    getSelectedOptionForGroup(config, 'sofa'),
    getSelectedOptionForGroup(config, 'table'),
    getSelectedOptionForGroup(config, 'bed'),
    getSelectedOptionForGroup(config, 'kitchenLine'),
    getSelectedOptionForGroup(config, 'wardrobePlaceholder'),
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
  const layoutVariant = product ? getModularHomeLayoutVariant(product.id, config.layoutVariant) : null;
  const dimensionPreset = product ? getModularHomeDimensionPreset(product.id, config.dimensionPreset) : null;

  return {
    dimensionPreset: dimensionPreset?.label ?? config.dimensionPreset,
    roomUseProfile: getModularHomeRoomUseProfileForConfig(config)?.label ?? config.roomUseProfile,
    doorPackage: getOptionForGroupAndToken('doorPackage', config.doorPackage)?.label ?? config.doorPackage,
    doorPlacement: getOptionForGroupAndToken('doorPlacement', config.doorPlacement)?.label ?? config.doorPlacement,
    facade: getOptionForGroupAndToken('facade', config.facade)?.label ?? config.facade,
    facadeBoardOrientation: getOptionForGroupAndToken('facadeBoardOrientation', config.facadeBoardOrientation)?.label ?? config.facadeBoardOrientation,
    facadeBoardProfile: getOptionForGroupAndToken('facadeBoardProfile', config.facadeBoardProfile)?.label ?? config.facadeBoardProfile,
    facadeBoardSpacing: getOptionForGroupAndToken('facadeBoardSpacing', config.facadeBoardSpacing)?.label ?? config.facadeBoardSpacing,
    facadeBoardWidth: getOptionForGroupAndToken('facadeBoardWidth', config.facadeBoardWidth)?.label ?? config.facadeBoardWidth,
    finishLevel: getOptionForGroupAndToken('finish', config.finishLevel)?.label ?? config.finishLevel,
    floorFinish: getOptionForGroupAndToken('floorFinish', config.floorFinish)?.label ?? config.floorFinish,
    furniturePackage: getOptionForGroupAndToken('furniturePackage', config.furniturePackage)?.label ?? config.furniturePackage,
    sofa: getOptionForGroupAndToken('sofa', config.sofa)?.label ?? config.sofa,
    table: getOptionForGroupAndToken('table', config.table)?.label ?? config.table,
    bed: getOptionForGroupAndToken('bed', config.bed)?.label ?? config.bed,
    kitchenLine: getOptionForGroupAndToken('kitchenLine', config.kitchenLine)?.label ?? config.kitchenLine,
    wardrobePlaceholder: getOptionForGroupAndToken('wardrobePlaceholder', config.wardrobePlaceholder)?.label ?? config.wardrobePlaceholder,
    interiorFloorStyle: getOptionForGroupAndToken('interiorFloorStyle', config.interiorFloorStyle)?.label ?? config.interiorFloorStyle,
    interiorWallFinish: getOptionForGroupAndToken('interiorWallFinish', config.interiorWallFinish)?.label ?? config.interiorWallFinish,
    kitchenFinish: getOptionForGroupAndToken('kitchenFinish', config.kitchenFinish)?.label ?? config.kitchenFinish,
    furnitureMood: getOptionForGroupAndToken('furnitureMood', config.furnitureMood)?.label ?? config.furnitureMood,
    interiorZoneFocus: getOptionForGroupAndToken('interiorZoneFocus', config.interiorZoneFocus)?.label ?? config.interiorZoneFocus,
    layoutVariant: layoutVariant?.label ?? config.layoutVariant,
    product: product?.name ?? config.template,
    roof: getOptionForGroupAndToken('roof', config.roof)?.label ?? config.roof,
    roofEdgeColor: getOptionForGroupAndToken('roofEdgeColor', config.roofEdgeColor)?.label ?? config.roofEdgeColor,
    roofGutterStyle: getOptionForGroupAndToken('roofGutterStyle', config.roofGutterStyle)?.label ?? config.roofGutterStyle,
    template: product?.name ?? config.template,
    terrace: getOptionForGroupAndToken('terrace', config.terrace)?.label ?? config.terrace,
    trimColor: getOptionForGroupAndToken('trimColor', config.trimColor)?.label ?? config.trimColor,
    windowFrameColor: getOptionForGroupAndToken('windowFrameColor', config.windowFrameColor)?.label ?? config.windowFrameColor,
    windowFrameType: getOptionForGroupAndToken('windowFrameType', config.windowFrameType)?.label ?? config.windowFrameType,
    windowPackage: getOptionForGroupAndToken('windowPackage', config.windowPackage)?.label ?? config.windowPackage,
    windowPlacement: getOptionForGroupAndToken('windowPlacement', config.windowPlacement)?.label ?? config.windowPlacement,
    wallPanelStyle: getOptionForGroupAndToken('wallPanelStyle', config.wallPanelStyle)?.label ?? config.wallPanelStyle,
  };
}

export function getModularHomeDimensionSummary(config: ModularHomeConfiguratorState): ModularHomeDimensionSummary {
  const product = getProductForConfig(config) ?? getModularHomeProduct(DEFAULT_MODULAR_HOME_PRODUCT_ID);
  const fallbackProduct = product ?? MODULAR_HOME_PRODUCTS[0];
  const dimensionPreset = getModularHomeDimensionPreset(
    fallbackProduct.id,
    config.dimensionPreset,
  ) ?? getModularHomeDimensionPresetsForProduct(fallbackProduct.id)[0] ?? MODULAR_HOME_DIMENSION_PRESETS[0];

  return {
    buildCategoryNote: fallbackProduct.buildCategoryNote,
    ceilingHeightLabel: `${formatMetricLength(fallbackProduct.ceilingHeightM)} ceiling height`,
    ceilingHeightM: fallbackProduct.ceilingHeightM,
    dimensionPresetId: dimensionPreset.id,
    dimensionPresetLabel: dimensionPreset.label,
    dimensionPresetNote: `${dimensionPreset.summaryNote} ${dimensionPreset.moduleDimensionNote}`,
    floorAreaLabel: `${dimensionPreset.floorAreaM2} m\u00b2`,
    floorAreaM2: dimensionPreset.floorAreaM2,
    footprintLabel: `${formatMetricLength(dimensionPreset.footprint.widthM)} x ${formatMetricLength(dimensionPreset.footprint.lengthM)} footprint`,
    footprintLengthM: dimensionPreset.footprint.lengthM,
    footprintWidthM: dimensionPreset.footprint.widthM,
    moduleCount: dimensionPreset.moduleCount,
    moduleCountLabel: formatCountLabel(dimensionPreset.moduleCount, 'module', 'modules'),
    transportModuleCount: dimensionPreset.transportModuleCount,
    transportModuleCountLabel: formatCountLabel(dimensionPreset.transportModuleCount, 'transport module', 'transport modules'),
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
