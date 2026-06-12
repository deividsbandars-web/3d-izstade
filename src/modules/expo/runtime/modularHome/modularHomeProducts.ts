import type { ModularHomeTemplateId } from './modularHomeConfig';
import {
  DEFAULT_MODULAR_HOME_CONFIG,
  type ModularHomeConfiguratorState,
  type ModularHomeDoorPackageOption,
  type ModularHomeDoorPlacementOption,
  type ModularHomeDimensionPresetOption,
  type ModularHomeFacadeBoardOrientationOption,
  type ModularHomeFacadeBoardProfileOption,
  type ModularHomeFacadeBoardSpacingOption,
  type ModularHomeFacadeBoardWidthOption,
  type ModularHomeFacadeOption,
  type ModularHomeFinishLevelOption,
  type ModularHomeFloorFinishOption,
  type ModularHomeFurniturePackageOption,
  type ModularHomeFurnitureToggleOption,
  type ModularHomeInteriorFloorStyleOption,
  type ModularHomeInteriorWallFinishOption,
  type ModularHomeLayoutVariantOption,
  type ModularHomeRoofGutterStyleOption,
  type ModularHomeRoofEdgeColorOption,
  type ModularHomeRoofOption,
  type ModularHomeRoomUseProfileOption,
  type ModularHomeTerraceOption,
  type ModularHomeTrimColorOption,
  type ModularHomeWindowFrameColorOption,
  type ModularHomeWindowFrameTypeOption,
  type ModularHomeWindowPlacementOption,
  type ModularHomeWindowPackageOption,
  type ModularHomeWallPanelStyleOption,
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

const ALL_MODULAR_HOME_PRODUCT_IDS = [
  'compact-timber-40',
  'family-timber-80',
  'sauna-cabin-25',
] as const satisfies readonly ModularHomeProductId[];

export const MODULAR_HOME_DIMENSION_PRESETS = [
  {
    id: 'compactStandard',
    productId: 'compact-timber-40',
    label: 'Compact standard',
    shortLabel: 'Standard',
    floorAreaM2: 40,
    footprint: { widthM: 8, lengthM: 5 },
    moduleCount: 2,
    transportModuleCount: 2,
    summaryNote: 'Baseline Compact Timber 40 footprint for balanced living and bedroom proportions.',
    estimateNote: 'Compact standard keeps the baseline shell footprint, quantity takeoff and module allowance.',
    bomNote: 'Preview BOM follows the baseline compact module panel and opening schedule.',
    floorplanNote: 'Floorplan uses the standard compact shell width and bedroom depth.',
    moduleDimensionNote: 'Two transport-ready compact modules in the baseline footprint.',
  },
  {
    id: 'compactWideLiving',
    productId: 'compact-timber-40',
    label: 'Compact wide living',
    shortLabel: 'Wide living',
    floorAreaM2: 44,
    footprint: { widthM: 8.8, lengthM: 5 },
    moduleCount: 2,
    transportModuleCount: 2,
    summaryNote: 'Expands the living width for a more generous lounge and kitchen frontage.',
    estimateNote: 'Wide living preset increases measured shell width but keeps the same two-module concept pending production engineering.',
    bomNote: 'Preview BOM notes wider floor, roof and facade spans for living-zone review.',
    floorplanNote: 'Floorplan widens the social zone while preserving the one-bedroom concept.',
    moduleDimensionNote: 'Two compact modules with wider living-side shell assumptions.',
    windowCountDelta: 1,
  },
  {
    id: 'compactLongBedroom',
    productId: 'compact-timber-40',
    label: 'Compact long bedroom',
    shortLabel: 'Long bedroom',
    floorAreaM2: 42,
    footprint: { widthM: 8, lengthM: 5.3 },
    moduleCount: 2,
    transportModuleCount: 2,
    summaryNote: 'Stretches the private end of the compact plan to improve bedroom and storage depth.',
    estimateNote: 'Long bedroom preset slightly increases shell length and private-room planning allowance.',
    bomNote: 'Preview BOM notes longer floor, roof and interior partition runs for the bedroom-side module.',
    floorplanNote: 'Floorplan lengthens the private zone and circulation allowance.',
    moduleDimensionNote: 'Two compact modules with elongated bedroom-side shell assumptions.',
  },
  {
    id: 'familyStandard',
    productId: 'family-timber-80',
    label: 'Family standard',
    shortLabel: 'Standard',
    floorAreaM2: 80,
    footprint: { widthM: 11.2, lengthM: 7.2 },
    moduleCount: 4,
    transportModuleCount: 3,
    summaryNote: 'Baseline family footprint with shared living zone and two-bedroom planning.',
    estimateNote: 'Family standard keeps the baseline four-module planning and quantity takeoff.',
    bomNote: 'Preview BOM follows the baseline family module schedule.',
    floorplanNote: 'Floorplan uses the standard family shell depth and living width.',
    moduleDimensionNote: 'Four baseline family modules with one shared service core.',
  },
  {
    id: 'familyWideLiving',
    productId: 'family-timber-80',
    label: 'Family wide living',
    shortLabel: 'Wide living',
    floorAreaM2: 84,
    footprint: { widthM: 11.8, lengthM: 7.2 },
    moduleCount: 4,
    transportModuleCount: 3,
    summaryNote: 'Adds width to the family social zone for a broader living/kitchen frontage.',
    estimateNote: 'Family wide living increases living-side shell width while staying within the same baseline module count.',
    bomNote: 'Preview BOM notes broader living-shell panel sizes and roof spans for review.',
    floorplanNote: 'Floorplan allocates more width to the shared living and dining zone.',
    moduleDimensionNote: 'Four family modules with wider shared-living shell assumptions.',
    windowCountDelta: 1,
  },
  {
    id: 'familyExtraBedroomModule',
    productId: 'family-timber-80',
    label: 'Family extra bedroom module',
    shortLabel: 'Extra module',
    floorAreaM2: 96,
    footprint: { widthM: 13.8, lengthM: 7.2 },
    moduleCount: 5,
    transportModuleCount: 4,
    summaryNote: 'Extends the family plan with an extra module for a larger bedroom wing or flex room.',
    estimateNote: 'Extra bedroom module preset raises measured area and module logistics assumptions for pre-quote discussion.',
    bomNote: 'Preview BOM notes an extra module shell, broader opening schedule and longer service runs.',
    floorplanNote: 'Floorplan grows into a five-module concept with more bedroom/flex area.',
    moduleDimensionNote: 'Five-module concept; final module split and transport logic require engineering confirmation.',
    windowCountDelta: 2,
    doorCountDelta: 1,
  },
  {
    id: 'saunaStandard',
    productId: 'sauna-cabin-25',
    label: 'Sauna standard',
    shortLabel: 'Standard',
    floorAreaM2: 25,
    footprint: { widthM: 6.4, lengthM: 4.2 },
    moduleCount: 2,
    transportModuleCount: 1,
    summaryNote: 'Baseline sauna cabin footprint for compact wellness and guest use.',
    estimateNote: 'Sauna standard keeps the baseline shell and service-core planning allowance.',
    bomNote: 'Preview BOM follows the baseline sauna shell and wellness-core schedule.',
    floorplanNote: 'Floorplan uses the standard sauna shell depth and terrace-ready frontage.',
    moduleDimensionNote: 'Single-transport two-module sauna/guest concept.',
  },
  {
    id: 'saunaDeepTerrace',
    productId: 'sauna-cabin-25',
    label: 'Sauna deep terrace',
    shortLabel: 'Deep terrace',
    floorAreaM2: 27,
    footprint: { widthM: 6.4, lengthM: 4.6 },
    moduleCount: 2,
    transportModuleCount: 1,
    summaryNote: 'Adds depth to the wellness frontage for a deeper deck and rest transition zone.',
    estimateNote: 'Deep terrace preset increases measured frontage depth and terrace review allowance without changing the core transport concept.',
    bomNote: 'Preview BOM notes longer terrace interface, roof edge and deck support assumptions.',
    floorplanNote: 'Floorplan deepens the front threshold and terrace connection.',
    moduleDimensionNote: 'Two-module sauna concept with deeper terrace-facing frontage assumptions.',
    terraceAreaMultiplier: 1.45,
  },
  {
    id: 'saunaGuestWide',
    productId: 'sauna-cabin-25',
    label: 'Sauna guest wide',
    shortLabel: 'Guest wide',
    floorAreaM2: 29,
    footprint: { widthM: 7, lengthM: 4.2 },
    moduleCount: 2,
    transportModuleCount: 1,
    summaryNote: 'Widens the guest/rest side of the sauna cabin for a more comfortable overnight concept.',
    estimateNote: 'Guest wide preset increases shell width and guest-room allowance while keeping the same two-module concept.',
    bomNote: 'Preview BOM notes wider facade, floor and roof elements for guest-side review.',
    floorplanNote: 'Floorplan widens the rest/guest zone while preserving the compact wellness core.',
    moduleDimensionNote: 'Two-module sauna/guest concept with widened guest-side shell assumptions.',
    windowCountDelta: 1,
  },
] as const satisfies readonly ModularHomeDimensionPreset[];

export const MODULAR_HOME_ROOM_USE_PROFILES = [
  {
    id: 'bedroom',
    label: 'Bedroom',
    shortLabel: 'Bedroom',
    summaryNote: 'Keeps the flexible room as a standard sleeping zone.',
    estimateNote: 'Bedroom profile keeps the baseline partition and private room allowance.',
    bomNote: 'Preview BOM keeps the flexible room under standard sleeping-room planning.',
    interiorPackageNote: 'Interior package assumes bedroom-ready furnishing and wardrobe allowance.',
  },
  {
    id: 'office',
    label: 'Office',
    shortLabel: 'Office',
    summaryNote: 'Converts the flexible room into a focused work or study zone.',
    estimateNote: 'Office profile keeps module pricing stable but flags desk/storage fit-out for review.',
    bomNote: 'Preview BOM treats the flexible room as a work/study fit-out placeholder.',
    interiorPackageNote: 'Interior package prioritizes desk, storage and lower sleeping emphasis.',
  },
  {
    id: 'guestRoom',
    label: 'Guest room',
    shortLabel: 'Guest',
    summaryNote: 'Uses the flexible room as an overnight guest or rental-ready room.',
    estimateNote: 'Guest room profile keeps structure stable while guest fit-out remains preview-only.',
    bomNote: 'Preview BOM notes guest-ready furnishing and partition planning only.',
    interiorPackageNote: 'Interior package prioritizes bed, wardrobe and guest-ready circulation.',
  },
  {
    id: 'storage',
    label: 'Storage',
    shortLabel: 'Storage',
    summaryNote: 'Reduces the flexible room to storage, utility or support use.',
    estimateNote: 'Storage profile softens finished-room assumptions and keeps fit-out light.',
    bomNote: 'Preview BOM shifts the flexible room toward utility/storage placeholder scope.',
    interiorPackageNote: 'Interior package softens loose furniture and increases utility/storage emphasis.',
  },
  {
    id: 'largerLiving',
    label: 'Larger living',
    shortLabel: 'Living+',
    summaryNote: 'Moves more floor area into the social zone for lounge, dining and open-plan use.',
    estimateNote: 'Larger living profile flags partition reduction and open-plan fit-out review.',
    bomNote: 'Preview BOM notes lighter partition scope and larger open living allowance.',
    interiorPackageNote: 'Interior package prioritizes lounge/dining pieces over enclosed-room furniture.',
  },
  {
    id: 'saunaRestRoom',
    label: 'Sauna rest room',
    shortLabel: 'Sauna rest',
    summaryNote: 'Balances wellness use with a rest/lounge zone next to the sauna core.',
    estimateNote: 'Sauna rest room profile keeps wellness pricing preview-only pending equipment review.',
    bomNote: 'Preview BOM keeps wellness/rest-room notes and service-core assumptions.',
    interiorPackageNote: 'Interior package prioritizes bench, lounge and wellness support placeholders.',
  },
] as const satisfies readonly ModularHomeRoomUseProfile[];

const MODULAR_HOME_ROOM_USE_CHOICES_BY_LAYOUT = {
  guestCabin: ['guestRoom', 'saunaRestRoom', 'storage'],
  largeLiving: ['largerLiving', 'guestRoom', 'office', 'bedroom', 'storage'],
  officeCabin: ['office', 'guestRoom', 'bedroom', 'storage'],
  openStudio: ['largerLiving', 'office', 'guestRoom', 'bedroom'],
  oneBedroom: ['bedroom', 'office', 'guestRoom', 'storage'],
  saunaOnly: ['saunaRestRoom', 'storage', 'guestRoom'],
  saunaRestRoom: ['saunaRestRoom', 'guestRoom', 'storage'],
  threeBedroomCompact: ['bedroom', 'office', 'guestRoom', 'storage'],
  twoBedroom: ['bedroom', 'office', 'guestRoom', 'storage', 'largerLiving'],
} as const satisfies Record<ModularHomeLayoutVariantId, readonly ModularHomeRoomUseProfileOption[]>;

const MODULAR_HOME_DEFAULT_ROOM_USE_PROFILE_BY_LAYOUT = {
  guestCabin: 'guestRoom',
  largeLiving: 'largerLiving',
  officeCabin: 'office',
  openStudio: 'largerLiving',
  oneBedroom: 'bedroom',
  saunaOnly: 'saunaRestRoom',
  saunaRestRoom: 'saunaRestRoom',
  threeBedroomCompact: 'bedroom',
  twoBedroom: 'bedroom',
} as const satisfies Record<ModularHomeLayoutVariantId, ModularHomeRoomUseProfileOption>;

export const MODULAR_HOME_LAYOUT_VARIANTS = [
  {
    id: 'openStudio',
    productId: 'compact-timber-40',
    label: 'Open studio',
    shortLabel: 'Studio',
    roomLabels: ['Studio living/sleeping', 'Kitchen wall', 'Bathroom core', 'Entry storage'],
    summaryNote: 'Open studio layout prioritizes one flexible living/sleeping room with minimal partitions.',
    estimateNote: 'Open studio keeps interior partition scope light; furniture and privacy packages still require review.',
    bomNote: 'Preview BOM assumes reduced partition allowance for one-room compact planning.',
  },
  {
    id: 'oneBedroom',
    productId: 'compact-timber-40',
    label: 'One bedroom',
    shortLabel: '1 bed',
    roomLabels: ['Living / kitchen', 'Bedroom', 'Bathroom core', 'Entrance / storage'],
    summaryNote: 'One-bedroom layout separates the sleeping zone from the living/kitchen area.',
    estimateNote: 'One-bedroom estimate uses the standard compact partition and door allowance.',
    bomNote: 'Preview BOM assumes one private bedroom partition package.',
  },
  {
    id: 'officeCabin',
    productId: 'compact-timber-40',
    label: 'Office cabin',
    shortLabel: 'Office',
    roomLabels: ['Living / work lounge', 'Office / guest room', 'Bathroom core', 'Entry storage'],
    summaryNote: 'Office cabin layout adapts the private module for work, guest stays or studio use.',
    estimateNote: 'Office cabin estimate keeps the same module package but flags work/guest fit-out for review.',
    bomNote: 'Preview BOM uses the compact bedroom module as an office/guest module placeholder.',
  },
  {
    id: 'twoBedroom',
    productId: 'family-timber-80',
    label: 'Two bedroom',
    shortLabel: '2 bed',
    roomLabels: ['Living / kitchen', 'Bedroom 1', 'Bedroom 2', 'Bathroom core', 'Technical / storage'],
    summaryNote: 'Two-bedroom layout is the baseline family plan with a larger shared living zone.',
    estimateNote: 'Two-bedroom estimate uses the baseline family module and partition package.',
    bomNote: 'Preview BOM assumes two bedroom modules and one shared service core.',
  },
  {
    id: 'threeBedroomCompact',
    productId: 'family-timber-80',
    label: 'Three-bedroom compact',
    shortLabel: '3 bed compact',
    roomLabels: ['Compact living / kitchen', 'Bedroom 1', 'Bedroom 2', 'Compact bedroom / office', 'Bathroom core'],
    summaryNote: 'Three-bedroom compact layout converts storage/flex area into a small third room concept.',
    estimateNote: 'Three-bedroom compact requires partition and layout review before a production quote.',
    bomNote: 'Preview BOM notes extra partition planning but does not claim engineering-grade room quantities.',
  },
  {
    id: 'largeLiving',
    productId: 'family-timber-80',
    label: 'Large living',
    shortLabel: 'Large living',
    roomLabels: ['Large living / kitchen', 'Bedroom suite', 'Guest room', 'Bathroom core', 'Utility storage'],
    summaryNote: 'Large living layout prioritizes the shared social zone and keeps bedrooms more flexible.',
    estimateNote: 'Large living estimate keeps module pricing stable while layout detailing remains review-only.',
    bomNote: 'Preview BOM assumes the same modules with altered internal zoning notes.',
  },
  {
    id: 'saunaOnly',
    productId: 'sauna-cabin-25',
    label: 'Sauna only',
    shortLabel: 'Sauna',
    roomLabels: ['Sauna room', 'Changing zone', 'Shower/service core', 'Terrace option'],
    summaryNote: 'Sauna-only layout focuses on wellness use with a compact changing and service zone.',
    estimateNote: 'Sauna-only estimate requires sauna equipment and wet-zone engineering review.',
    bomNote: 'Preview BOM carries sauna/wellness component notes for future production refinement.',
  },
  {
    id: 'guestCabin',
    productId: 'sauna-cabin-25',
    label: 'Guest cabin',
    shortLabel: 'Guest',
    roomLabels: ['Guest rest area', 'Compact kitchenette wall', 'Washroom/service core', 'Terrace option'],
    summaryNote: 'Guest cabin layout turns the sauna core into a small overnight/rest module concept.',
    estimateNote: 'Guest cabin estimate keeps sauna-cabin module pricing but flags guest fit-out for review.',
    bomNote: 'Preview BOM treats the wellness core as a guest/rest module placeholder.',
  },
  {
    id: 'saunaRestRoom',
    productId: 'sauna-cabin-25',
    label: 'Sauna + rest room',
    shortLabel: 'Sauna + rest',
    roomLabels: ['Sauna / rest area', 'Changing zone', 'Service core', 'Terrace option'],
    summaryNote: 'Sauna + rest room layout balances wellness use with a small lounge/rest zone.',
    estimateNote: 'Sauna + rest room estimate remains preview-only pending sauna equipment specification.',
    bomNote: 'Preview BOM assumes the current sauna/rest module with service core.',
  },
] as const satisfies readonly ModularHomeLayoutVariant[];

export const MODULAR_HOME_ROOM_MEASUREMENT_DISCLAIMER = 'Dimensions are preview estimates; final room schedule requires production verification.';

export const MODULAR_HOME_ROOM_MEASUREMENTS = [
  {
    id: 'compact-open-studio-living-sleeping',
    productId: 'compact-timber-40',
    layoutVariantId: 'openStudio',
    label: 'Studio living / sleeping',
    areaM2: 23.2,
    type: 'living',
    note: 'Main flexible room for compact living, sleeping and lounge use.',
  },
  {
    id: 'compact-open-studio-kitchen-wall',
    productId: 'compact-timber-40',
    layoutVariantId: 'openStudio',
    label: 'Kitchen wall',
    areaM2: 4.8,
    type: 'kitchen',
    note: 'Linear kitchen allowance inside the studio module.',
  },
  {
    id: 'compact-open-studio-bathroom-core',
    productId: 'compact-timber-40',
    layoutVariantId: 'openStudio',
    label: 'Bathroom core',
    areaM2: 4.8,
    type: 'bathroom',
    note: 'Wet-room core placeholder.',
  },
  {
    id: 'compact-open-studio-entry-storage',
    productId: 'compact-timber-40',
    layoutVariantId: 'openStudio',
    label: 'Entry storage',
    areaM2: 3.2,
    type: 'storage',
    note: 'Entrance/storage allowance.',
  },
  {
    id: 'compact-open-studio-circulation',
    productId: 'compact-timber-40',
    layoutVariantId: 'openStudio',
    label: 'Circulation / service allowance',
    areaM2: 4,
    type: 'circulation',
    note: 'Preview allowance for wall thickness, circulation and service routing.',
  },
  {
    id: 'compact-one-bedroom-living-kitchen',
    productId: 'compact-timber-40',
    layoutVariantId: 'oneBedroom',
    label: 'Living / kitchen',
    areaM2: 16.8,
    type: 'living',
    note: 'Shared living and kitchen zone.',
  },
  {
    id: 'compact-one-bedroom-bedroom',
    productId: 'compact-timber-40',
    layoutVariantId: 'oneBedroom',
    label: 'Bedroom',
    areaM2: 10.4,
    type: 'bedroom',
    note: 'Private sleeping module.',
  },
  {
    id: 'compact-one-bedroom-bathroom-core',
    productId: 'compact-timber-40',
    layoutVariantId: 'oneBedroom',
    label: 'Bathroom core',
    areaM2: 4.8,
    type: 'bathroom',
    note: 'Wet-room core placeholder.',
  },
  {
    id: 'compact-one-bedroom-entry-storage',
    productId: 'compact-timber-40',
    layoutVariantId: 'oneBedroom',
    label: 'Entrance / storage',
    areaM2: 3.2,
    type: 'storage',
    note: 'Entry and storage allowance.',
  },
  {
    id: 'compact-one-bedroom-circulation',
    productId: 'compact-timber-40',
    layoutVariantId: 'oneBedroom',
    label: 'Circulation / service allowance',
    areaM2: 4.8,
    type: 'circulation',
    note: 'Preview allowance for circulation, walls and service routing.',
  },
  {
    id: 'compact-office-living-work-lounge',
    productId: 'compact-timber-40',
    layoutVariantId: 'officeCabin',
    label: 'Living / work lounge',
    areaM2: 15.8,
    type: 'living',
    note: 'Flexible lounge/work zone.',
  },
  {
    id: 'compact-office-guest-room',
    productId: 'compact-timber-40',
    layoutVariantId: 'officeCabin',
    label: 'Office / guest room',
    areaM2: 10.8,
    type: 'bedroom',
    note: 'Private work or guest module.',
  },
  {
    id: 'compact-office-bathroom-core',
    productId: 'compact-timber-40',
    layoutVariantId: 'officeCabin',
    label: 'Bathroom core',
    areaM2: 4.8,
    type: 'bathroom',
    note: 'Wet-room core placeholder.',
  },
  {
    id: 'compact-office-entry-storage',
    productId: 'compact-timber-40',
    layoutVariantId: 'officeCabin',
    label: 'Entry storage',
    areaM2: 3.4,
    type: 'storage',
    note: 'Entry and storage allowance.',
  },
  {
    id: 'compact-office-circulation',
    productId: 'compact-timber-40',
    layoutVariantId: 'officeCabin',
    label: 'Circulation / service allowance',
    areaM2: 5.2,
    type: 'circulation',
    note: 'Preview allowance for circulation, walls and service routing.',
  },
  {
    id: 'family-two-bedroom-living-kitchen',
    productId: 'family-timber-80',
    layoutVariantId: 'twoBedroom',
    label: 'Living / kitchen',
    areaM2: 30,
    type: 'living',
    note: 'Baseline family living and kitchen zone.',
  },
  {
    id: 'family-two-bedroom-bedroom-1',
    productId: 'family-timber-80',
    layoutVariantId: 'twoBedroom',
    label: 'Bedroom 1',
    areaM2: 12,
    type: 'bedroom',
    note: 'Primary bedroom preview area.',
  },
  {
    id: 'family-two-bedroom-bedroom-2',
    productId: 'family-timber-80',
    layoutVariantId: 'twoBedroom',
    label: 'Bedroom 2',
    areaM2: 12,
    type: 'bedroom',
    note: 'Secondary bedroom preview area.',
  },
  {
    id: 'family-two-bedroom-bathroom-core',
    productId: 'family-timber-80',
    layoutVariantId: 'twoBedroom',
    label: 'Bathroom core',
    areaM2: 5.6,
    type: 'bathroom',
    note: 'Shared wet-room core placeholder.',
  },
  {
    id: 'family-two-bedroom-technical-storage',
    productId: 'family-timber-80',
    layoutVariantId: 'twoBedroom',
    label: 'Technical / storage',
    areaM2: 5,
    type: 'technical',
    note: 'Technical and storage allowance.',
  },
  {
    id: 'family-two-bedroom-circulation',
    productId: 'family-timber-80',
    layoutVariantId: 'twoBedroom',
    label: 'Hall / circulation allowance',
    areaM2: 15.4,
    type: 'circulation',
    note: 'Preview allowance for circulation, partitions and service routing.',
  },
  {
    id: 'family-three-bedroom-living',
    productId: 'family-timber-80',
    layoutVariantId: 'threeBedroomCompact',
    label: 'Compact living / kitchen',
    areaM2: 24,
    type: 'living',
    note: 'Reduced living area to allow a third room concept.',
  },
  {
    id: 'family-three-bedroom-bedroom-1',
    productId: 'family-timber-80',
    layoutVariantId: 'threeBedroomCompact',
    label: 'Bedroom 1',
    areaM2: 11,
    type: 'bedroom',
    note: 'Primary compact bedroom preview.',
  },
  {
    id: 'family-three-bedroom-bedroom-2',
    productId: 'family-timber-80',
    layoutVariantId: 'threeBedroomCompact',
    label: 'Bedroom 2',
    areaM2: 11,
    type: 'bedroom',
    note: 'Secondary compact bedroom preview.',
  },
  {
    id: 'family-three-bedroom-office',
    productId: 'family-timber-80',
    layoutVariantId: 'threeBedroomCompact',
    label: 'Compact bedroom / office',
    areaM2: 8.5,
    type: 'bedroom',
    note: 'Small third room or office allowance.',
  },
  {
    id: 'family-three-bedroom-bathroom-core',
    productId: 'family-timber-80',
    layoutVariantId: 'threeBedroomCompact',
    label: 'Bathroom core',
    areaM2: 5.6,
    type: 'bathroom',
    note: 'Shared wet-room core placeholder.',
  },
  {
    id: 'family-three-bedroom-hall-storage',
    productId: 'family-timber-80',
    layoutVariantId: 'threeBedroomCompact',
    label: 'Hall / storage allowance',
    areaM2: 19.9,
    type: 'circulation',
    note: 'Preview allowance for hall, partitions and storage.',
  },
  {
    id: 'family-large-living-kitchen',
    productId: 'family-timber-80',
    layoutVariantId: 'largeLiving',
    label: 'Large living / kitchen',
    areaM2: 38,
    type: 'living',
    note: 'Expanded social and kitchen zone.',
  },
  {
    id: 'family-large-bedroom-suite',
    productId: 'family-timber-80',
    layoutVariantId: 'largeLiving',
    label: 'Bedroom suite',
    areaM2: 12.5,
    type: 'bedroom',
    note: 'Primary bedroom suite preview area.',
  },
  {
    id: 'family-large-guest-room',
    productId: 'family-timber-80',
    layoutVariantId: 'largeLiving',
    label: 'Guest room',
    areaM2: 11,
    type: 'bedroom',
    note: 'Guest room preview area.',
  },
  {
    id: 'family-large-bathroom-core',
    productId: 'family-timber-80',
    layoutVariantId: 'largeLiving',
    label: 'Bathroom core',
    areaM2: 5.6,
    type: 'bathroom',
    note: 'Shared wet-room core placeholder.',
  },
  {
    id: 'family-large-utility-storage',
    productId: 'family-timber-80',
    layoutVariantId: 'largeLiving',
    label: 'Utility storage',
    areaM2: 5,
    type: 'storage',
    note: 'Utility/storage allowance.',
  },
  {
    id: 'family-large-circulation',
    productId: 'family-timber-80',
    layoutVariantId: 'largeLiving',
    label: 'Hall / circulation allowance',
    areaM2: 7.9,
    type: 'circulation',
    note: 'Preview allowance for circulation and partitions.',
  },
  {
    id: 'sauna-only-sauna-room',
    productId: 'sauna-cabin-25',
    layoutVariantId: 'saunaOnly',
    label: 'Sauna room',
    areaM2: 10,
    type: 'sauna',
    note: 'Primary sauna/wellness room.',
  },
  {
    id: 'sauna-only-changing-zone',
    productId: 'sauna-cabin-25',
    layoutVariantId: 'saunaOnly',
    label: 'Changing zone',
    areaM2: 4,
    type: 'storage',
    note: 'Changing and towel/storage allowance.',
  },
  {
    id: 'sauna-only-service-core',
    productId: 'sauna-cabin-25',
    layoutVariantId: 'saunaOnly',
    label: 'Shower / service core',
    areaM2: 5,
    type: 'bathroom',
    note: 'Wet/service core placeholder.',
  },
  {
    id: 'sauna-only-terrace-transition',
    productId: 'sauna-cabin-25',
    layoutVariantId: 'saunaOnly',
    label: 'Terrace transition',
    areaM2: 2.5,
    type: 'terrace',
    note: 'Internal transition allowance near terrace access.',
  },
  {
    id: 'sauna-only-circulation',
    productId: 'sauna-cabin-25',
    layoutVariantId: 'saunaOnly',
    label: 'Circulation / utility allowance',
    areaM2: 3.5,
    type: 'circulation',
    note: 'Preview allowance for circulation and service routing.',
  },
  {
    id: 'sauna-guest-rest-area',
    productId: 'sauna-cabin-25',
    layoutVariantId: 'guestCabin',
    label: 'Guest rest area',
    areaM2: 10.5,
    type: 'living',
    note: 'Compact overnight/rest room preview.',
  },
  {
    id: 'sauna-guest-kitchenette-wall',
    productId: 'sauna-cabin-25',
    layoutVariantId: 'guestCabin',
    label: 'Compact kitchenette wall',
    areaM2: 3.5,
    type: 'kitchen',
    note: 'Linear kitchenette allowance.',
  },
  {
    id: 'sauna-guest-washroom',
    productId: 'sauna-cabin-25',
    layoutVariantId: 'guestCabin',
    label: 'Washroom / service core',
    areaM2: 4.8,
    type: 'bathroom',
    note: 'Wet/service core placeholder.',
  },
  {
    id: 'sauna-guest-terrace-transition',
    productId: 'sauna-cabin-25',
    layoutVariantId: 'guestCabin',
    label: 'Terrace transition',
    areaM2: 2.2,
    type: 'terrace',
    note: 'Internal transition allowance near terrace access.',
  },
  {
    id: 'sauna-guest-circulation',
    productId: 'sauna-cabin-25',
    layoutVariantId: 'guestCabin',
    label: 'Storage / circulation allowance',
    areaM2: 4,
    type: 'circulation',
    note: 'Preview allowance for circulation and storage.',
  },
  {
    id: 'sauna-rest-room-main',
    productId: 'sauna-cabin-25',
    layoutVariantId: 'saunaRestRoom',
    label: 'Sauna / rest area',
    areaM2: 11.5,
    type: 'sauna',
    note: 'Combined sauna/rest preview area.',
  },
  {
    id: 'sauna-rest-room-changing',
    productId: 'sauna-cabin-25',
    layoutVariantId: 'saunaRestRoom',
    label: 'Changing zone',
    areaM2: 4,
    type: 'storage',
    note: 'Changing and towel/storage allowance.',
  },
  {
    id: 'sauna-rest-room-service',
    productId: 'sauna-cabin-25',
    layoutVariantId: 'saunaRestRoom',
    label: 'Service core',
    areaM2: 4.8,
    type: 'bathroom',
    note: 'Wet/service core placeholder.',
  },
  {
    id: 'sauna-rest-room-terrace-transition',
    productId: 'sauna-cabin-25',
    layoutVariantId: 'saunaRestRoom',
    label: 'Terrace transition',
    areaM2: 2.2,
    type: 'terrace',
    note: 'Internal transition allowance near terrace access.',
  },
  {
    id: 'sauna-rest-room-circulation',
    productId: 'sauna-cabin-25',
    layoutVariantId: 'saunaRestRoom',
    label: 'Circulation / utility allowance',
    areaM2: 2.5,
    type: 'circulation',
    note: 'Preview allowance for circulation and service routing.',
  },
] as const satisfies readonly ModularHomeRoomMeasurement[];

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
      doorPlacement: 'frontEntry',
      facade: 'naturalTimber',
      facadeBoardOrientation: 'horizontal',
      facadeBoardProfile: 'squareEdge',
      facadeBoardSpacing: 'standard',
      facadeBoardWidth: 'standard',
      finishLevel: 'standard',
      floorFinish: 'plywood',
      furniturePackage: 'standardFurniture',
      interiorFloorStyle: 'utilityPlywood',
      interiorWallFinish: 'plywood',
      layoutVariant: 'oneBedroom',
      dimensionPreset: 'compactStandard',
      roomUseProfile: 'bedroom',
      roof: 'pitched',
      roofEdgeColor: 'graphite',
      roofGutterStyle: 'minimalEdge',
      template: 'compactTimber40',
      terrace: 'frontDeck',
      trimColor: 'timber',
      windowFrameColor: 'timber',
      windowFrameType: 'standardFrame',
      windowPackage: 'standardWindows',
      windowPlacement: 'balanced',
      wallPanelStyle: 'plainPanel',
      sofa: 'enabled',
      table: 'enabled',
      bed: 'enabled',
      kitchenLine: 'enabled',
      wardrobePlaceholder: 'enabled',
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
      doorPlacement: 'terraceFacing',
      facade: 'naturalTimber',
      facadeBoardOrientation: 'horizontal',
      facadeBoardProfile: 'squareEdge',
      facadeBoardSpacing: 'standard',
      facadeBoardWidth: 'standard',
      finishLevel: 'standard',
      floorFinish: 'plywood',
      furniturePackage: 'standardFurniture',
      interiorFloorStyle: 'utilityPlywood',
      interiorWallFinish: 'plywood',
      layoutVariant: 'twoBedroom',
      dimensionPreset: 'familyStandard',
      roomUseProfile: 'bedroom',
      roof: 'pitched',
      roofEdgeColor: 'graphite',
      roofGutterStyle: 'minimalEdge',
      template: 'familyTimber80',
      terrace: 'extendedTerrace',
      trimColor: 'timber',
      windowFrameColor: 'timber',
      windowFrameType: 'standardFrame',
      windowPackage: 'panoramicWindows',
      windowPlacement: 'frontPanoramic',
      wallPanelStyle: 'plainPanel',
      sofa: 'enabled',
      table: 'enabled',
      bed: 'enabled',
      kitchenLine: 'enabled',
      wardrobePlaceholder: 'enabled',
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
      doorPlacement: 'frontEntry',
      facade: 'darkThermoWood',
      facadeBoardOrientation: 'horizontal',
      facadeBoardProfile: 'squareEdge',
      facadeBoardSpacing: 'standard',
      facadeBoardWidth: 'standard',
      finishLevel: 'standard',
      floorFinish: 'plywood',
      furniturePackage: 'saunaPackage',
      interiorFloorStyle: 'utilityPlywood',
      interiorWallFinish: 'plywood',
      layoutVariant: 'saunaRestRoom',
      dimensionPreset: 'saunaStandard',
      roomUseProfile: 'saunaRestRoom',
      roof: 'flat',
      roofEdgeColor: 'graphite',
      roofGutterStyle: 'minimalEdge',
      template: 'saunaCabin25',
      terrace: 'frontDeck',
      trimColor: 'timber',
      windowFrameColor: 'timber',
      windowFrameType: 'standardFrame',
      windowPackage: 'compactPrivacy',
      windowPlacement: 'sidePrivacy',
      wallPanelStyle: 'plainPanel',
      sofa: 'disabled',
      table: 'enabled',
      bed: 'disabled',
      kitchenLine: 'disabled',
      wardrobePlaceholder: 'disabled',
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
  {
    id: 'option-window-placement-balanced',
    group: 'windowPlacement',
    label: 'Balanced openings',
    materialIds: [],
    priceDelta: 0,
    visualToken: 'balanced' satisfies ModularHomeWindowPlacementOption,
    compatibleProducts: ALL_MODULAR_HOME_PRODUCT_IDS,
    requiredModuleIds: [],
  },
  {
    id: 'option-window-placement-front-panoramic',
    group: 'windowPlacement',
    label: 'Front panoramic placement',
    materialIds: [],
    priceDelta: 2400,
    visualToken: 'frontPanoramic' satisfies ModularHomeWindowPlacementOption,
    compatibleProducts: ['compact-timber-40', 'family-timber-80'],
    requiredModuleIds: [],
  },
  {
    id: 'option-window-placement-side-privacy',
    group: 'windowPlacement',
    label: 'Side privacy placement',
    materialIds: [],
    priceDelta: 900,
    visualToken: 'sidePrivacy' satisfies ModularHomeWindowPlacementOption,
    compatibleProducts: ALL_MODULAR_HOME_PRODUCT_IDS,
    requiredModuleIds: [],
  },
  {
    id: 'option-window-placement-corner-feature',
    group: 'windowPlacement',
    label: 'Corner feature placement',
    materialIds: [],
    priceDelta: 4800,
    visualToken: 'cornerFeature' satisfies ModularHomeWindowPlacementOption,
    compatibleProducts: ['compact-timber-40', 'family-timber-80'],
    requiredModuleIds: [],
  },
  {
    id: 'option-door-placement-front-entry',
    group: 'doorPlacement',
    label: 'Front entry placement',
    materialIds: [],
    priceDelta: 0,
    visualToken: 'frontEntry' satisfies ModularHomeDoorPlacementOption,
    compatibleProducts: ALL_MODULAR_HOME_PRODUCT_IDS,
    requiredModuleIds: [],
  },
  {
    id: 'option-door-placement-side-entry',
    group: 'doorPlacement',
    label: 'Side entry placement',
    materialIds: [],
    priceDelta: 1200,
    visualToken: 'sideEntry' satisfies ModularHomeDoorPlacementOption,
    compatibleProducts: ALL_MODULAR_HOME_PRODUCT_IDS,
    requiredModuleIds: [],
  },
  {
    id: 'option-door-placement-terrace-facing',
    group: 'doorPlacement',
    label: 'Terrace-facing placement',
    materialIds: [],
    priceDelta: 2800,
    visualToken: 'terraceFacing' satisfies ModularHomeDoorPlacementOption,
    compatibleProducts: ALL_MODULAR_HOME_PRODUCT_IDS,
    requiredModuleIds: [],
  },
  {
    id: 'option-facade-board-orientation-horizontal',
    group: 'facadeBoardOrientation',
    label: 'Horizontal boards',
    materialIds: [],
    priceDelta: 0,
    visualToken: 'horizontal' satisfies ModularHomeFacadeBoardOrientationOption,
    compatibleProducts: ALL_MODULAR_HOME_PRODUCT_IDS,
    requiredModuleIds: [],
  },
  {
    id: 'option-facade-board-orientation-vertical',
    group: 'facadeBoardOrientation',
    label: 'Vertical boards',
    materialIds: [],
    priceDelta: 650,
    visualToken: 'vertical' satisfies ModularHomeFacadeBoardOrientationOption,
    compatibleProducts: ALL_MODULAR_HOME_PRODUCT_IDS,
    requiredModuleIds: [],
  },
  {
    id: 'option-facade-board-width-narrow',
    group: 'facadeBoardWidth',
    label: 'Narrow boards',
    materialIds: [],
    priceDelta: 950,
    visualToken: 'narrow' satisfies ModularHomeFacadeBoardWidthOption,
    compatibleProducts: ALL_MODULAR_HOME_PRODUCT_IDS,
    requiredModuleIds: [],
  },
  {
    id: 'option-facade-board-width-standard',
    group: 'facadeBoardWidth',
    label: 'Standard boards',
    materialIds: [],
    priceDelta: 0,
    visualToken: 'standard' satisfies ModularHomeFacadeBoardWidthOption,
    compatibleProducts: ALL_MODULAR_HOME_PRODUCT_IDS,
    requiredModuleIds: [],
  },
  {
    id: 'option-facade-board-width-wide',
    group: 'facadeBoardWidth',
    label: 'Wide boards',
    materialIds: [],
    priceDelta: 450,
    visualToken: 'wide' satisfies ModularHomeFacadeBoardWidthOption,
    compatibleProducts: ALL_MODULAR_HOME_PRODUCT_IDS,
    requiredModuleIds: [],
  },
  {
    id: 'option-facade-board-profile-square-edge',
    group: 'facadeBoardProfile',
    label: 'Square-edge boards',
    materialIds: [],
    priceDelta: 0,
    visualToken: 'squareEdge' satisfies ModularHomeFacadeBoardProfileOption,
    compatibleProducts: ALL_MODULAR_HOME_PRODUCT_IDS,
    requiredModuleIds: [],
  },
  {
    id: 'option-facade-board-profile-shadow-gap',
    group: 'facadeBoardProfile',
    label: 'Shadow-gap boards',
    materialIds: [],
    priceDelta: 1250,
    visualToken: 'shadowGap' satisfies ModularHomeFacadeBoardProfileOption,
    compatibleProducts: ALL_MODULAR_HOME_PRODUCT_IDS,
    requiredModuleIds: [],
  },
  {
    id: 'option-facade-board-profile-tongue-groove',
    group: 'facadeBoardProfile',
    label: 'Tongue-and-groove boards',
    materialIds: [],
    priceDelta: 980,
    visualToken: 'tongueGroove' satisfies ModularHomeFacadeBoardProfileOption,
    compatibleProducts: ALL_MODULAR_HOME_PRODUCT_IDS,
    requiredModuleIds: [],
  },
  {
    id: 'option-facade-board-spacing-tight',
    group: 'facadeBoardSpacing',
    label: 'Tight spacing',
    materialIds: [],
    priceDelta: 650,
    visualToken: 'tight' satisfies ModularHomeFacadeBoardSpacingOption,
    compatibleProducts: ALL_MODULAR_HOME_PRODUCT_IDS,
    requiredModuleIds: [],
  },
  {
    id: 'option-facade-board-spacing-standard',
    group: 'facadeBoardSpacing',
    label: 'Standard spacing',
    materialIds: [],
    priceDelta: 0,
    visualToken: 'standard' satisfies ModularHomeFacadeBoardSpacingOption,
    compatibleProducts: ALL_MODULAR_HOME_PRODUCT_IDS,
    requiredModuleIds: [],
  },
  {
    id: 'option-facade-board-spacing-expressive',
    group: 'facadeBoardSpacing',
    label: 'Expressive spacing',
    materialIds: [],
    priceDelta: 450,
    visualToken: 'expressive' satisfies ModularHomeFacadeBoardSpacingOption,
    compatibleProducts: ALL_MODULAR_HOME_PRODUCT_IDS,
    requiredModuleIds: [],
  },
  {
    id: 'option-trim-color-timber',
    group: 'trimColor',
    label: 'Timber trim',
    materialIds: [],
    priceDelta: 0,
    visualToken: 'timber' satisfies ModularHomeTrimColorOption,
    compatibleProducts: ALL_MODULAR_HOME_PRODUCT_IDS,
    requiredModuleIds: [],
  },
  {
    id: 'option-trim-color-graphite',
    group: 'trimColor',
    label: 'Graphite trim',
    materialIds: [],
    priceDelta: 520,
    visualToken: 'graphite' satisfies ModularHomeTrimColorOption,
    compatibleProducts: ALL_MODULAR_HOME_PRODUCT_IDS,
    requiredModuleIds: [],
  },
  {
    id: 'option-trim-color-bronze',
    group: 'trimColor',
    label: 'Bronze trim',
    materialIds: ['metal-roof'],
    priceDelta: 820,
    visualToken: 'bronze' satisfies ModularHomeTrimColorOption,
    compatibleProducts: ALL_MODULAR_HOME_PRODUCT_IDS,
    requiredModuleIds: [],
  },
  {
    id: 'option-trim-color-white',
    group: 'trimColor',
    label: 'White trim',
    materialIds: [],
    priceDelta: 380,
    visualToken: 'white' satisfies ModularHomeTrimColorOption,
    compatibleProducts: ALL_MODULAR_HOME_PRODUCT_IDS,
    requiredModuleIds: [],
  },
  {
    id: 'option-roof-edge-graphite',
    group: 'roofEdgeColor',
    label: 'Graphite roof edge',
    materialIds: ['metal-roof'],
    priceDelta: 0,
    visualToken: 'graphite' satisfies ModularHomeRoofEdgeColorOption,
    compatibleProducts: ALL_MODULAR_HOME_PRODUCT_IDS,
    requiredModuleIds: [],
  },
  {
    id: 'option-roof-edge-bronze',
    group: 'roofEdgeColor',
    label: 'Bronze roof edge',
    materialIds: ['metal-roof'],
    priceDelta: 650,
    visualToken: 'bronze' satisfies ModularHomeRoofEdgeColorOption,
    compatibleProducts: ALL_MODULAR_HOME_PRODUCT_IDS,
    requiredModuleIds: [],
  },
  {
    id: 'option-roof-edge-light-metal',
    group: 'roofEdgeColor',
    label: 'Light metal roof edge',
    materialIds: ['metal-roof'],
    priceDelta: 450,
    visualToken: 'lightMetal' satisfies ModularHomeRoofEdgeColorOption,
    compatibleProducts: ALL_MODULAR_HOME_PRODUCT_IDS,
    requiredModuleIds: [],
  },
  {
    id: 'option-roof-gutter-minimal-edge',
    group: 'roofGutterStyle',
    label: 'Minimal edge gutter',
    materialIds: ['metal-roof'],
    priceDelta: 0,
    visualToken: 'minimalEdge' satisfies ModularHomeRoofGutterStyleOption,
    compatibleProducts: ALL_MODULAR_HOME_PRODUCT_IDS,
    requiredModuleIds: [],
  },
  {
    id: 'option-roof-gutter-box',
    group: 'roofGutterStyle',
    label: 'Box gutter',
    materialIds: ['metal-roof'],
    priceDelta: 1050,
    visualToken: 'boxGutter' satisfies ModularHomeRoofGutterStyleOption,
    compatibleProducts: ALL_MODULAR_HOME_PRODUCT_IDS,
    requiredModuleIds: [],
  },
  {
    id: 'option-roof-gutter-round',
    group: 'roofGutterStyle',
    label: 'Round gutter placeholder',
    materialIds: ['metal-roof'],
    priceDelta: 760,
    visualToken: 'roundGutter' satisfies ModularHomeRoofGutterStyleOption,
    compatibleProducts: ALL_MODULAR_HOME_PRODUCT_IDS,
    requiredModuleIds: [],
  },
  {
    id: 'option-window-frame-timber',
    group: 'windowFrameColor',
    label: 'Timber frames',
    materialIds: [],
    priceDelta: 0,
    visualToken: 'timber' satisfies ModularHomeWindowFrameColorOption,
    compatibleProducts: ALL_MODULAR_HOME_PRODUCT_IDS,
    requiredModuleIds: [],
  },
  {
    id: 'option-window-frame-graphite',
    group: 'windowFrameColor',
    label: 'Graphite frames',
    materialIds: [],
    priceDelta: 850,
    visualToken: 'graphite' satisfies ModularHomeWindowFrameColorOption,
    compatibleProducts: ALL_MODULAR_HOME_PRODUCT_IDS,
    requiredModuleIds: [],
  },
  {
    id: 'option-window-frame-white',
    group: 'windowFrameColor',
    label: 'White frames',
    materialIds: [],
    priceDelta: 450,
    visualToken: 'white' satisfies ModularHomeWindowFrameColorOption,
    compatibleProducts: ALL_MODULAR_HOME_PRODUCT_IDS,
    requiredModuleIds: [],
  },
  {
    id: 'option-window-frame-type-standard',
    group: 'windowFrameType',
    label: 'Standard frame',
    materialIds: [],
    priceDelta: 0,
    visualToken: 'standardFrame' satisfies ModularHomeWindowFrameTypeOption,
    compatibleProducts: ALL_MODULAR_HOME_PRODUCT_IDS,
    requiredModuleIds: [],
  },
  {
    id: 'option-window-frame-type-slimline',
    group: 'windowFrameType',
    label: 'Slimline frame',
    materialIds: [],
    priceDelta: 1100,
    visualToken: 'slimline' satisfies ModularHomeWindowFrameTypeOption,
    compatibleProducts: ['compact-timber-40', 'family-timber-80'],
    requiredModuleIds: [],
  },
  {
    id: 'option-window-frame-type-deep-reveal',
    group: 'windowFrameType',
    label: 'Deep reveal frame',
    materialIds: [],
    priceDelta: 1450,
    visualToken: 'deepReveal' satisfies ModularHomeWindowFrameTypeOption,
    compatibleProducts: ALL_MODULAR_HOME_PRODUCT_IDS,
    requiredModuleIds: [],
  },
  {
    id: 'option-interior-wall-plywood',
    group: 'interiorWallFinish',
    label: 'Plywood walls',
    materialIds: ['interior-plywood'],
    priceDelta: 0,
    visualToken: 'plywood' satisfies ModularHomeInteriorWallFinishOption,
    compatibleProducts: ALL_MODULAR_HOME_PRODUCT_IDS,
    requiredModuleIds: [],
  },
  {
    id: 'option-interior-wall-painted-white',
    group: 'interiorWallFinish',
    label: 'Painted white walls',
    materialIds: ['interior-plywood'],
    priceDelta: 1600,
    visualToken: 'paintedWhite' satisfies ModularHomeInteriorWallFinishOption,
    compatibleProducts: ALL_MODULAR_HOME_PRODUCT_IDS,
    requiredModuleIds: [],
  },
  {
    id: 'option-interior-wall-warm-panel',
    group: 'interiorWallFinish',
    label: 'Warm panel walls',
    materialIds: ['interior-plywood'],
    priceDelta: 2200,
    visualToken: 'warmPanel' satisfies ModularHomeInteriorWallFinishOption,
    compatibleProducts: ALL_MODULAR_HOME_PRODUCT_IDS,
    requiredModuleIds: [],
  },
  {
    id: 'option-floor-finish-plywood',
    group: 'floorFinish',
    label: 'Plywood floor',
    materialIds: ['interior-plywood'],
    priceDelta: 0,
    visualToken: 'plywood' satisfies ModularHomeFloorFinishOption,
    compatibleProducts: ALL_MODULAR_HOME_PRODUCT_IDS,
    requiredModuleIds: [],
  },
  {
    id: 'option-floor-finish-oak-laminate',
    group: 'floorFinish',
    label: 'Oak laminate floor',
    materialIds: ['interior-plywood'],
    priceDelta: 2800,
    visualToken: 'oakLaminate' satisfies ModularHomeFloorFinishOption,
    compatibleProducts: ['compact-timber-40', 'family-timber-80'],
    requiredModuleIds: [],
  },
  {
    id: 'option-floor-finish-polished-concrete',
    group: 'floorFinish',
    label: 'Polished concrete floor',
    materialIds: ['interior-plywood'],
    priceDelta: 2400,
    visualToken: 'polishedConcrete' satisfies ModularHomeFloorFinishOption,
    compatibleProducts: ALL_MODULAR_HOME_PRODUCT_IDS,
    requiredModuleIds: [],
  },
  {
    id: 'option-interior-floor-style-utility-plywood',
    group: 'interiorFloorStyle',
    label: 'Utility plywood boards',
    materialIds: ['interior-plywood'],
    priceDelta: 0,
    visualToken: 'utilityPlywood' satisfies ModularHomeInteriorFloorStyleOption,
    compatibleProducts: ALL_MODULAR_HOME_PRODUCT_IDS,
    requiredModuleIds: [],
  },
  {
    id: 'option-interior-floor-style-warm-plank',
    group: 'interiorFloorStyle',
    label: 'Warm plank lines',
    materialIds: ['interior-plywood'],
    priceDelta: 1350,
    visualToken: 'warmPlank' satisfies ModularHomeInteriorFloorStyleOption,
    compatibleProducts: ['compact-timber-40', 'family-timber-80'],
    requiredModuleIds: [],
  },
  {
    id: 'option-interior-floor-style-polished-slab',
    group: 'interiorFloorStyle',
    label: 'Polished slab grid',
    materialIds: ['interior-plywood'],
    priceDelta: 1700,
    visualToken: 'polishedSlab' satisfies ModularHomeInteriorFloorStyleOption,
    compatibleProducts: ALL_MODULAR_HOME_PRODUCT_IDS,
    requiredModuleIds: [],
  },
  {
    id: 'option-wall-panel-style-plain',
    group: 'wallPanelStyle',
    label: 'Plain wall panels',
    materialIds: ['interior-plywood'],
    priceDelta: 0,
    visualToken: 'plainPanel' satisfies ModularHomeWallPanelStyleOption,
    compatibleProducts: ALL_MODULAR_HOME_PRODUCT_IDS,
    requiredModuleIds: [],
  },
  {
    id: 'option-wall-panel-style-ribbed',
    group: 'wallPanelStyle',
    label: 'Ribbed wall panels',
    materialIds: ['interior-plywood'],
    priceDelta: 1250,
    visualToken: 'ribbedPanel' satisfies ModularHomeWallPanelStyleOption,
    compatibleProducts: ['compact-timber-40', 'family-timber-80'],
    requiredModuleIds: [],
  },
  {
    id: 'option-wall-panel-style-paint-ready',
    group: 'wallPanelStyle',
    label: 'Paint-ready boards',
    materialIds: ['interior-plywood'],
    priceDelta: 950,
    visualToken: 'paintReadyBoard' satisfies ModularHomeWallPanelStyleOption,
    compatibleProducts: ALL_MODULAR_HOME_PRODUCT_IDS,
    requiredModuleIds: [],
  },
  {
    id: 'option-furniture-package-empty-shell',
    group: 'furniturePackage',
    label: 'Empty shell',
    materialIds: [],
    priceDelta: 0,
    visualToken: 'emptyShell' satisfies ModularHomeFurniturePackageOption,
    compatibleProducts: ALL_MODULAR_HOME_PRODUCT_IDS,
    requiredModuleIds: [],
  },
  {
    id: 'option-furniture-package-standard',
    group: 'furniturePackage',
    label: 'Standard furniture',
    materialIds: ['interior-plywood'],
    priceDelta: 4200,
    visualToken: 'standardFurniture' satisfies ModularHomeFurniturePackageOption,
    compatibleProducts: ['compact-timber-40', 'family-timber-80'],
    requiredModuleIds: [],
  },
  {
    id: 'option-furniture-package-premium',
    group: 'furniturePackage',
    label: 'Premium furniture',
    materialIds: ['interior-plywood'],
    priceDelta: 9800,
    visualToken: 'premiumFurniture' satisfies ModularHomeFurniturePackageOption,
    compatibleProducts: ['compact-timber-40', 'family-timber-80'],
    requiredModuleIds: [],
  },
  {
    id: 'option-furniture-package-kitchen',
    group: 'furniturePackage',
    label: 'Kitchen package',
    materialIds: ['interior-plywood'],
    priceDelta: 3600,
    visualToken: 'kitchenPackage' satisfies ModularHomeFurniturePackageOption,
    compatibleProducts: ['compact-timber-40', 'family-timber-80'],
    requiredModuleIds: [],
  },
  {
    id: 'option-furniture-package-bathroom',
    group: 'furniturePackage',
    label: 'Bathroom package',
    materialIds: ['bathroom-wet-core'],
    priceDelta: 2900,
    visualToken: 'bathroomPackage' satisfies ModularHomeFurniturePackageOption,
    compatibleProducts: ALL_MODULAR_HOME_PRODUCT_IDS,
    requiredModuleIds: [],
  },
  {
    id: 'option-furniture-package-sauna',
    group: 'furniturePackage',
    label: 'Sauna package',
    materialIds: ['interior-plywood'],
    priceDelta: 3800,
    visualToken: 'saunaPackage' satisfies ModularHomeFurniturePackageOption,
    compatibleProducts: ['sauna-cabin-25'],
    requiredModuleIds: [],
  },
  {
    id: 'option-furniture-sofa-disabled',
    group: 'sofa',
    label: 'Sofa off',
    materialIds: [],
    priceDelta: 0,
    visualToken: 'disabled' satisfies ModularHomeFurnitureToggleOption,
    compatibleProducts: ALL_MODULAR_HOME_PRODUCT_IDS,
    requiredModuleIds: [],
  },
  {
    id: 'option-furniture-sofa-enabled',
    group: 'sofa',
    label: 'Sofa on',
    materialIds: [],
    priceDelta: 850,
    visualToken: 'enabled' satisfies ModularHomeFurnitureToggleOption,
    compatibleProducts: ['compact-timber-40', 'family-timber-80'],
    requiredModuleIds: [],
  },
  {
    id: 'option-furniture-table-disabled',
    group: 'table',
    label: 'Table off',
    materialIds: [],
    priceDelta: 0,
    visualToken: 'disabled' satisfies ModularHomeFurnitureToggleOption,
    compatibleProducts: ALL_MODULAR_HOME_PRODUCT_IDS,
    requiredModuleIds: [],
  },
  {
    id: 'option-furniture-table-enabled',
    group: 'table',
    label: 'Table on',
    materialIds: [],
    priceDelta: 450,
    visualToken: 'enabled' satisfies ModularHomeFurnitureToggleOption,
    compatibleProducts: ALL_MODULAR_HOME_PRODUCT_IDS,
    requiredModuleIds: [],
  },
  {
    id: 'option-furniture-bed-disabled',
    group: 'bed',
    label: 'Bed off',
    materialIds: [],
    priceDelta: 0,
    visualToken: 'disabled' satisfies ModularHomeFurnitureToggleOption,
    compatibleProducts: ALL_MODULAR_HOME_PRODUCT_IDS,
    requiredModuleIds: [],
  },
  {
    id: 'option-furniture-bed-enabled',
    group: 'bed',
    label: 'Bed on',
    materialIds: [],
    priceDelta: 950,
    visualToken: 'enabled' satisfies ModularHomeFurnitureToggleOption,
    compatibleProducts: ['compact-timber-40', 'family-timber-80'],
    requiredModuleIds: [],
  },
  {
    id: 'option-furniture-kitchen-line-disabled',
    group: 'kitchenLine',
    label: 'Kitchen line off',
    materialIds: [],
    priceDelta: 0,
    visualToken: 'disabled' satisfies ModularHomeFurnitureToggleOption,
    compatibleProducts: ALL_MODULAR_HOME_PRODUCT_IDS,
    requiredModuleIds: [],
  },
  {
    id: 'option-furniture-kitchen-line-enabled',
    group: 'kitchenLine',
    label: 'Kitchen line on',
    materialIds: [],
    priceDelta: 2400,
    visualToken: 'enabled' satisfies ModularHomeFurnitureToggleOption,
    compatibleProducts: ['compact-timber-40', 'family-timber-80'],
    requiredModuleIds: [],
  },
  {
    id: 'option-furniture-wardrobe-disabled',
    group: 'wardrobePlaceholder',
    label: 'Wardrobe off',
    materialIds: [],
    priceDelta: 0,
    visualToken: 'disabled' satisfies ModularHomeFurnitureToggleOption,
    compatibleProducts: ALL_MODULAR_HOME_PRODUCT_IDS,
    requiredModuleIds: [],
  },
  {
    id: 'option-furniture-wardrobe-enabled',
    group: 'wardrobePlaceholder',
    label: 'Wardrobe on',
    materialIds: [],
    priceDelta: 700,
    visualToken: 'enabled' satisfies ModularHomeFurnitureToggleOption,
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
    doorPlacement: config.doorPlacement,
    facade: config.facade,
    facadeBoardOrientation: config.facadeBoardOrientation,
    facadeBoardProfile: config.facadeBoardProfile,
    facadeBoardSpacing: config.facadeBoardSpacing,
    facadeBoardWidth: config.facadeBoardWidth,
    finish: config.finishLevel,
    floorFinish: config.floorFinish,
    furniturePackage: config.furniturePackage,
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
