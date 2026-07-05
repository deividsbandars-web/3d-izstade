import type { ModularHomeConfiguratorState } from '../modularHomeConfigurator';
import type { ModularHomeQuantityTakeoff } from '../modularHomeQuantities';
import type {
  ModularHomePricingBreakdown,
  ModularHomePricingCategoryTotal,
  ModularHomePricingContext,
} from '../modularHomePricing';
import type {
  getBomModuleSummary,
  ModularHomeModuleId,
  ModularHomeModuleType,
  ModularHomeProductId,
} from '../modularHomeProducts';

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
  assemblyGroupId: string;
  areaM2: number;
  approximatePanelDimensions: readonly string[];
  componentCode: string;
  id: string;
  label: string;
  moduleIds: readonly ModularHomeModuleId[];
  notes: string;
  panelCount: number;
  panelGroupId: string;
  wasteFactor: number;
};

export type ModularHomeManufacturingBomPanelSizeGroup = {
  areaM2: number;
  componentCode: string;
  dimensions: string;
  id: string;
  label: string;
  moduleIds: readonly ModularHomeModuleId[];
  notes: string;
  panelCount: number;
  panelGroupId: string;
  panelSizeGroupId: string;
};

export type ModularHomeManufacturingBomBoardLengthGroup = {
  assemblyGroupId: string;
  boardLengthCategory: string;
  componentCode: string;
  coverageM2: number;
  id: string;
  label: string;
  lengthM: number;
  linearM: number;
  notes: string;
  quantity: number;
};

export type ModularHomeManufacturingBomScheduleItem = {
  assemblyGroupId: string;
  areaM2: number | null;
  componentCode: string;
  dimensions: string;
  id: string;
  label: string;
  linearM: number | null;
  notes: string;
  quantity: number;
  unit: ModularHomeComponentUnit | 'set';
  wasteFactor: number;
};

export type ModularHomeOpeningType =
  | 'window'
  | 'exteriorDoor'
  | 'terraceDoor'
  | 'interiorDoorPlaceholder';

export type ModularHomeOpeningWallSide =
  | 'front'
  | 'rear'
  | 'left'
  | 'right';

export type ModularHomeOpeningScheduleItem = {
  bomCategory: 'windowUnit' | 'doorUnit';
  dimensionPresetId: ModularHomeConfiguratorState['dimensionPreset'];
  estimateImpact: number;
  frameType: string;
  glazingType: string;
  heightMm: number;
  id: string;
  layoutVariantId: ModularHomeConfiguratorState['layoutVariant'];
  notes: string;
  openingId: string;
  productId: ModularHomeProductId;
  quantity: number;
  reviewRequirement: string | null;
  terraceOption: ModularHomeConfiguratorState['terrace'];
  type: ModularHomeOpeningType;
  unitCodePlaceholder: string;
  wallSide: ModularHomeOpeningWallSide;
  widthMm: number;
};

export type ModularHomeOpeningScheduleSummary = {
  doorCount: number;
  reviewRequiredCount: number;
  totalEstimateImpact: number;
  totalQuantity: number;
  windowCount: number;
};

export type ModularHomeManufacturingBomHardwarePlaceholder = {
  appliesTo: string;
  componentCode: string;
  hardwareGroupId: string;
  id: string;
  label: string;
  notes: string;
  quantity: number;
  unit: 'set' | 'pcs' | 'box';
};

export type ModularHomeManufacturingBomWasteFactorGroup = {
  appliesTo: string;
  componentCode: string;
  id: string;
  label: string;
  material: string;
  materialCategory: string;
  notes: string;
  wasteFactor: number;
};

export type ModularHomeManufacturingBomAssemblyGroup = {
  assemblyGroupId: string;
  componentCodes: readonly string[];
  hardwareGroupIds: readonly string[];
  label: string;
  moduleIds: readonly ModularHomeModuleId[];
  notes: string;
  panelGroupIds: readonly string[];
  quantity: number;
  unit: ModularHomeComponentUnit | 'set' | 'group' | 'mixed';
};

export type ModularHomeManufacturingBom = {
  assemblyGroups: readonly ModularHomeManufacturingBomAssemblyGroup[];
  boardLengthGroups: readonly ModularHomeManufacturingBomBoardLengthGroup[];
  componentBomSubtotal: number;
  componentCodes: readonly string[];
  config: ModularHomeConfiguratorState;
  disclaimer: string;
  doorSchedule: readonly ModularHomeManufacturingBomScheduleItem[];
  fastenerHardwarePlaceholders: readonly ModularHomeManufacturingBomHardwarePlaceholder[];
  facadeBoardAreaM2: number;
  facadeBoardLinearM: number;
  floorCassetteAreaM2: number;
  interiorFinishAreas: readonly ModularHomeManufacturingBomScheduleItem[];
  moduleCount: number;
  openingSchedule: readonly ModularHomeOpeningScheduleItem[];
  openingScheduleSummary: ModularHomeOpeningScheduleSummary;
  panelGroups: readonly ModularHomeManufacturingBomPanelGroup[];
  panelSizeGroups: readonly ModularHomeManufacturingBomPanelSizeGroup[];
  productionBatchNotes: readonly string[];
  productionVerificationNotes: readonly string[];
  productId: ModularHomeProductId | null;
  productName: string;
  roofCassetteAreaM2: number;
  terraceDeckSchedule: readonly ModularHomeManufacturingBomScheduleItem[];
  totalWasteFactor: number;
  transportPackageNotes: readonly string[];
  wasteFactorsByMaterial: readonly ModularHomeManufacturingBomWasteFactorGroup[];
  windowSchedule: readonly ModularHomeManufacturingBomScheduleItem[];
};
