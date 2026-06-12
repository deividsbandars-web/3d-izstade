import { useCallback, useSyncExternalStore } from 'react';
import {
  DEFAULT_MODULAR_HOME_TEMPLATE_ID,
  MODULAR_HOME_TEMPLATE_OPTIONS,
  type ModularHomeTemplateId,
} from './modularHomeConfig';
import {
  getModularHomeFacadeMaterial,
  getModularHomeFinishMaterials,
  getModularHomeRoofMaterial,
  type ModularHomeMaterialId,
} from './modularHomeMaterials';

export type ModularHomeTemplateOption = ModularHomeTemplateId;
export type ModularHomeFacadeOption = 'naturalTimber' | 'darkThermoWood' | 'lightPainted';
export type ModularHomeRoofOption = 'pitched' | 'flat' | 'greenRoofPlaceholder';
export type ModularHomeTerraceOption = 'none' | 'frontDeck' | 'sideTerrace' | 'extendedTerrace' | 'coveredTerracePlaceholder';
export type ModularHomeFinishLevelOption = 'standard' | 'shell' | 'premium';
export type ModularHomeWindowPackageOption = 'standardWindows' | 'panoramicWindows' | 'cornerGlazing' | 'compactPrivacy';
export type ModularHomeDoorPackageOption = 'standardEntry' | 'terraceSlider' | 'premiumGlazedEntry';
export type ModularHomeWindowPlacementOption = 'balanced' | 'frontPanoramic' | 'sidePrivacy' | 'cornerFeature';
export type ModularHomeDoorPlacementOption = 'frontEntry' | 'sideEntry' | 'terraceFacing';
export type ModularHomeFacadeBoardOrientationOption = 'horizontal' | 'vertical';
export type ModularHomeFacadeBoardWidthOption = 'narrow' | 'standard' | 'wide';
export type ModularHomeFacadeBoardProfileOption = 'squareEdge' | 'shadowGap' | 'tongueGroove';
export type ModularHomeFacadeBoardSpacingOption = 'tight' | 'standard' | 'expressive';
export type ModularHomeTrimColorOption = 'timber' | 'graphite' | 'bronze' | 'white';
export type ModularHomeRoofGutterStyleOption = 'minimalEdge' | 'boxGutter' | 'roundGutter';
export type ModularHomeWindowFrameTypeOption = 'standardFrame' | 'slimline' | 'deepReveal';
export type ModularHomeInteriorFloorStyleOption = 'utilityPlywood' | 'warmPlank' | 'polishedSlab';
export type ModularHomeWallPanelStyleOption = 'plainPanel' | 'ribbedPanel' | 'paintReadyBoard';
export type ModularHomeRoofEdgeColorOption = 'graphite' | 'bronze' | 'lightMetal';
export type ModularHomeWindowFrameColorOption = 'timber' | 'graphite' | 'white';
export type ModularHomeInteriorWallFinishOption = 'plywood' | 'paintedWhite' | 'warmPanel';
export type ModularHomeFloorFinishOption = 'plywood' | 'oakLaminate' | 'polishedConcrete';
export type ModularHomeFurniturePackageOption =
  | 'emptyShell'
  | 'standardFurniture'
  | 'premiumFurniture'
  | 'kitchenPackage'
  | 'bathroomPackage'
  | 'saunaPackage';
export type ModularHomeFurnitureToggleOption = 'disabled' | 'enabled';
export type ModularHomeRoomUseProfileOption =
  | 'bedroom'
  | 'office'
  | 'guestRoom'
  | 'storage'
  | 'largerLiving'
  | 'saunaRestRoom';
export type ModularHomeLayoutVariantOption =
  | 'openStudio'
  | 'oneBedroom'
  | 'officeCabin'
  | 'twoBedroom'
  | 'threeBedroomCompact'
  | 'largeLiving'
  | 'saunaOnly'
  | 'guestCabin'
  | 'saunaRestRoom';
export type ModularHomeDimensionPresetOption =
  | 'compactStandard'
  | 'compactWideLiving'
  | 'compactLongBedroom'
  | 'familyStandard'
  | 'familyWideLiving'
  | 'familyExtraBedroomModule'
  | 'saunaStandard'
  | 'saunaDeepTerrace'
  | 'saunaGuestWide';
export type ModularHomeViewModeOption = 'exterior' | 'cutaway' | 'interior' | 'floorplan';

export type ModularHomeConfiguratorState = {
  template: ModularHomeTemplateOption;
  layoutVariant: ModularHomeLayoutVariantOption;
  dimensionPreset: ModularHomeDimensionPresetOption;
  facade: ModularHomeFacadeOption;
  roof: ModularHomeRoofOption;
  terrace: ModularHomeTerraceOption;
  finishLevel: ModularHomeFinishLevelOption;
  windowPackage: ModularHomeWindowPackageOption;
  doorPackage: ModularHomeDoorPackageOption;
  windowPlacement: ModularHomeWindowPlacementOption;
  doorPlacement: ModularHomeDoorPlacementOption;
  facadeBoardOrientation: ModularHomeFacadeBoardOrientationOption;
  facadeBoardWidth: ModularHomeFacadeBoardWidthOption;
  facadeBoardProfile: ModularHomeFacadeBoardProfileOption;
  facadeBoardSpacing: ModularHomeFacadeBoardSpacingOption;
  trimColor: ModularHomeTrimColorOption;
  roofGutterStyle: ModularHomeRoofGutterStyleOption;
  windowFrameType: ModularHomeWindowFrameTypeOption;
  interiorFloorStyle: ModularHomeInteriorFloorStyleOption;
  wallPanelStyle: ModularHomeWallPanelStyleOption;
  roofEdgeColor: ModularHomeRoofEdgeColorOption;
  windowFrameColor: ModularHomeWindowFrameColorOption;
  interiorWallFinish: ModularHomeInteriorWallFinishOption;
  floorFinish: ModularHomeFloorFinishOption;
  furniturePackage: ModularHomeFurniturePackageOption;
  roomUseProfile: ModularHomeRoomUseProfileOption;
  sofa: ModularHomeFurnitureToggleOption;
  table: ModularHomeFurnitureToggleOption;
  bed: ModularHomeFurnitureToggleOption;
  kitchenLine: ModularHomeFurnitureToggleOption;
  wardrobePlaceholder: ModularHomeFurnitureToggleOption;
};

export type ModularHomeConfiguratorOption<Key extends keyof ModularHomeConfiguratorState = keyof ModularHomeConfiguratorState> = {
  key: ModularHomeConfiguratorState[Key];
  label: string;
};

export type ModularHomeConfiguratorGroup<Key extends keyof ModularHomeConfiguratorState = keyof ModularHomeConfiguratorState> = {
  key: Key;
  label: string;
  options: readonly ModularHomeConfiguratorOption<Key>[];
};

export type ModularHomeViewModeOptionDefinition = {
  key: ModularHomeViewModeOption;
  label: string;
  note: string;
};

export type ModularHomeFacadeVisual = {
  label: string;
  materialId: ModularHomeMaterialId;
  wallColor: string;
  sideColor: string;
  trimColor: string;
};

export type ModularHomeRoofVisual = {
  label: string;
  materialId: ModularHomeMaterialId;
  roofColor: string;
  accentColor: string;
  isGreenRoof: boolean;
};

export type ModularHomeFinishLevelVisual = {
  label: string;
  materialIds: readonly ModularHomeMaterialId[];
  interiorFloorColor: string;
  interiorWallColor: string;
  bathroomCoreColor: string;
  note: string;
};

export type ModularHomeTerraceVisual = {
  label: string;
  deckDepth: number;
  deckWidth: number;
  enabled: boolean;
  isCovered: boolean;
  placement: 'none' | 'front' | 'side';
};

export type ModularHomeWindowPackageVisual = {
  label: string;
  glassColor: string;
  trimColor: string;
  widthMultiplier: number;
  heightMultiplier: number;
  sideDepthMultiplier: number;
  reviewNote: string;
};

export type ModularHomeDoorPackageVisual = {
  label: string;
  doorColor: string;
  glassColor: string;
  widthMultiplier: number;
  hasGlassPanel: boolean;
  reviewNote: string;
};

export type ModularHomeWindowPlacementVisual = {
  label: string;
  frontOffsetMultiplier: number;
  frontWindowCount: 1 | 2;
  hasCornerFeature: boolean;
  sideWindowScaleMultiplier: number;
  sideWindowXSign: -1 | 1;
  reviewNote: string;
};

export type ModularHomeDoorPlacementVisual = {
  label: string;
  placement: 'front' | 'side' | 'terrace';
  reviewNote: string;
};

export type ModularHomeFacadeBoardOrientationVisual = {
  label: string;
  orientation: ModularHomeFacadeBoardOrientationOption;
  quantityFactor: number;
  reviewNote: string;
};

export type ModularHomeFacadeBoardWidthVisual = {
  label: string;
  maxPanelSpacing: number;
  quantityFactor: number;
  reviewNote: string;
};

export type ModularHomeFacadeBoardProfileVisual = {
  label: string;
  quantityFactor: number;
  revealColor: string;
  revealDepth: number;
  reviewNote: string;
};

export type ModularHomeFacadeBoardSpacingVisual = {
  label: string;
  lineOpacity: number;
  spacingFactor: number;
  reviewNote: string;
};

export type ModularHomeTrimColorVisual = {
  color: string;
  label: string;
  reviewNote: string;
};

export type ModularHomeRoofGutterStyleVisual = {
  downspoutScale: number;
  label: string;
  profileDepth: number;
  profileHeight: number;
  reviewNote: string;
};

export type ModularHomeWindowFrameTypeVisual = {
  frameScale: number;
  label: string;
  mullionScale: number;
  revealDepth: number;
  reviewNote: string;
};

export type ModularHomeInteriorFloorStyleVisual = {
  color: string;
  label: string;
  lineColor: string;
  lineSpacing: number;
  quantityFactor: number;
  reviewNote: string;
};

export type ModularHomeWallPanelStyleVisual = {
  color: string;
  label: string;
  seamColor: string;
  seamSpacing: number;
  reviewNote: string;
};

export type ModularHomeRoofEdgeColorVisual = {
  color: string;
  label: string;
  reviewNote: string;
};

export type ModularHomeWindowFrameColorVisual = {
  color: string;
  label: string;
  reviewNote: string;
};

export type ModularHomeInteriorWallFinishVisual = {
  color: string;
  label: string;
  reviewNote: string;
};

export type ModularHomeFloorFinishVisual = {
  color: string;
  label: string;
  reviewNote: string;
};

export type ModularHomeFurniturePackageVisual = {
  includedItems: readonly ModularHomeFurnitureToggleKey[];
  isPremium: boolean;
  label: string;
  reviewNote: string;
};

export type ModularHomeFurnitureToggleKey = 'sofa' | 'table' | 'bed' | 'kitchenLine' | 'wardrobePlaceholder';

export const DEFAULT_MODULAR_HOME_CONFIG: ModularHomeConfiguratorState = {
  template: DEFAULT_MODULAR_HOME_TEMPLATE_ID,
  layoutVariant: 'oneBedroom',
  dimensionPreset: 'compactStandard',
  facade: 'naturalTimber',
  roof: 'pitched',
  terrace: 'frontDeck',
  finishLevel: 'standard',
  windowPackage: 'standardWindows',
  doorPackage: 'standardEntry',
  windowPlacement: 'balanced',
  doorPlacement: 'frontEntry',
  facadeBoardOrientation: 'horizontal',
  facadeBoardWidth: 'standard',
  facadeBoardProfile: 'squareEdge',
  facadeBoardSpacing: 'standard',
  trimColor: 'timber',
  roofGutterStyle: 'minimalEdge',
  windowFrameType: 'standardFrame',
  interiorFloorStyle: 'utilityPlywood',
  wallPanelStyle: 'plainPanel',
  roofEdgeColor: 'graphite',
  windowFrameColor: 'timber',
  interiorWallFinish: 'plywood',
  floorFinish: 'plywood',
  furniturePackage: 'standardFurniture',
  roomUseProfile: 'bedroom',
  sofa: 'enabled',
  table: 'enabled',
  bed: 'enabled',
  kitchenLine: 'enabled',
  wardrobePlaceholder: 'enabled',
};

export const MODULAR_HOME_FACADE_OPTIONS = [
  { key: 'naturalTimber', label: 'Natural timber' },
  { key: 'darkThermoWood', label: 'Dark thermo wood' },
  { key: 'lightPainted', label: 'Light painted' },
] as const satisfies readonly ModularHomeConfiguratorOption<'facade'>[];

export const MODULAR_HOME_ROOF_OPTIONS = [
  { key: 'flat', label: 'Flat' },
  { key: 'pitched', label: 'Pitched' },
  { key: 'greenRoofPlaceholder', label: 'Green roof placeholder' },
] as const satisfies readonly ModularHomeConfiguratorOption<'roof'>[];

export const MODULAR_HOME_TERRACE_OPTIONS = [
  { key: 'none', label: 'None' },
  { key: 'frontDeck', label: 'Front deck' },
  { key: 'sideTerrace', label: 'Side terrace' },
  { key: 'extendedTerrace', label: 'Extended terrace' },
  { key: 'coveredTerracePlaceholder', label: 'Covered terrace placeholder' },
] as const satisfies readonly ModularHomeConfiguratorOption<'terrace'>[];

export const MODULAR_HOME_FINISH_LEVEL_OPTIONS = [
  { key: 'shell', label: 'Empty shell' },
  { key: 'standard', label: 'Standard furnished preview' },
  { key: 'premium', label: 'Premium interior preview' },
] as const satisfies readonly ModularHomeConfiguratorOption<'finishLevel'>[];

export const MODULAR_HOME_WINDOW_PACKAGE_OPTIONS = [
  { key: 'standardWindows', label: 'Standard glazing' },
  { key: 'panoramicWindows', label: 'Panoramic glazing' },
  { key: 'cornerGlazing', label: 'Corner glazing' },
  { key: 'compactPrivacy', label: 'Compact/privacy glazing' },
] as const satisfies readonly ModularHomeConfiguratorOption<'windowPackage'>[];

export const MODULAR_HOME_DOOR_PACKAGE_OPTIONS = [
  { key: 'standardEntry', label: 'Standard entry' },
  { key: 'terraceSlider', label: 'Terrace slider' },
  { key: 'premiumGlazedEntry', label: 'Premium glazed entry' },
] as const satisfies readonly ModularHomeConfiguratorOption<'doorPackage'>[];

export const MODULAR_HOME_WINDOW_PLACEMENT_OPTIONS = [
  { key: 'balanced', label: 'Balanced openings' },
  { key: 'frontPanoramic', label: 'Front panoramic' },
  { key: 'sidePrivacy', label: 'Side privacy' },
  { key: 'cornerFeature', label: 'Corner feature' },
] as const satisfies readonly ModularHomeConfiguratorOption<'windowPlacement'>[];

export const MODULAR_HOME_DOOR_PLACEMENT_OPTIONS = [
  { key: 'frontEntry', label: 'Front entry' },
  { key: 'sideEntry', label: 'Side entry' },
  { key: 'terraceFacing', label: 'Terrace-facing' },
] as const satisfies readonly ModularHomeConfiguratorOption<'doorPlacement'>[];

export const MODULAR_HOME_FACADE_BOARD_ORIENTATION_OPTIONS = [
  { key: 'horizontal', label: 'Horizontal boards' },
  { key: 'vertical', label: 'Vertical boards' },
] as const satisfies readonly ModularHomeConfiguratorOption<'facadeBoardOrientation'>[];

export const MODULAR_HOME_FACADE_BOARD_WIDTH_OPTIONS = [
  { key: 'narrow', label: 'Narrow boards' },
  { key: 'standard', label: 'Standard boards' },
  { key: 'wide', label: 'Wide boards' },
] as const satisfies readonly ModularHomeConfiguratorOption<'facadeBoardWidth'>[];

export const MODULAR_HOME_FACADE_BOARD_PROFILE_OPTIONS = [
  { key: 'squareEdge', label: 'Square-edge boards' },
  { key: 'shadowGap', label: 'Shadow-gap boards' },
  { key: 'tongueGroove', label: 'Tongue-and-groove boards' },
] as const satisfies readonly ModularHomeConfiguratorOption<'facadeBoardProfile'>[];

export const MODULAR_HOME_FACADE_BOARD_SPACING_OPTIONS = [
  { key: 'tight', label: 'Tight spacing' },
  { key: 'standard', label: 'Standard spacing' },
  { key: 'expressive', label: 'Expressive spacing' },
] as const satisfies readonly ModularHomeConfiguratorOption<'facadeBoardSpacing'>[];

export const MODULAR_HOME_TRIM_COLOR_OPTIONS = [
  { key: 'timber', label: 'Timber trim' },
  { key: 'graphite', label: 'Graphite trim' },
  { key: 'bronze', label: 'Bronze trim' },
  { key: 'white', label: 'White trim' },
] as const satisfies readonly ModularHomeConfiguratorOption<'trimColor'>[];

export const MODULAR_HOME_ROOF_GUTTER_STYLE_OPTIONS = [
  { key: 'minimalEdge', label: 'Minimal edge gutter' },
  { key: 'boxGutter', label: 'Box gutter' },
  { key: 'roundGutter', label: 'Round gutter placeholder' },
] as const satisfies readonly ModularHomeConfiguratorOption<'roofGutterStyle'>[];

export const MODULAR_HOME_WINDOW_FRAME_TYPE_OPTIONS = [
  { key: 'standardFrame', label: 'Standard frame' },
  { key: 'slimline', label: 'Slimline frame' },
  { key: 'deepReveal', label: 'Deep reveal frame' },
] as const satisfies readonly ModularHomeConfiguratorOption<'windowFrameType'>[];

export const MODULAR_HOME_INTERIOR_FLOOR_STYLE_OPTIONS = [
  { key: 'utilityPlywood', label: 'Utility plywood boards' },
  { key: 'warmPlank', label: 'Warm plank lines' },
  { key: 'polishedSlab', label: 'Polished slab grid' },
] as const satisfies readonly ModularHomeConfiguratorOption<'interiorFloorStyle'>[];

export const MODULAR_HOME_WALL_PANEL_STYLE_OPTIONS = [
  { key: 'plainPanel', label: 'Plain wall panels' },
  { key: 'ribbedPanel', label: 'Ribbed wall panels' },
  { key: 'paintReadyBoard', label: 'Paint-ready boards' },
] as const satisfies readonly ModularHomeConfiguratorOption<'wallPanelStyle'>[];

export const MODULAR_HOME_ROOF_EDGE_COLOR_OPTIONS = [
  { key: 'graphite', label: 'Graphite roof edge' },
  { key: 'bronze', label: 'Bronze roof edge' },
  { key: 'lightMetal', label: 'Light metal roof edge' },
] as const satisfies readonly ModularHomeConfiguratorOption<'roofEdgeColor'>[];

export const MODULAR_HOME_WINDOW_FRAME_COLOR_OPTIONS = [
  { key: 'timber', label: 'Timber frames' },
  { key: 'graphite', label: 'Graphite frames' },
  { key: 'white', label: 'White frames' },
] as const satisfies readonly ModularHomeConfiguratorOption<'windowFrameColor'>[];

export const MODULAR_HOME_INTERIOR_WALL_FINISH_OPTIONS = [
  { key: 'plywood', label: 'Plywood walls' },
  { key: 'paintedWhite', label: 'Painted white walls' },
  { key: 'warmPanel', label: 'Warm panel walls' },
] as const satisfies readonly ModularHomeConfiguratorOption<'interiorWallFinish'>[];

export const MODULAR_HOME_FLOOR_FINISH_OPTIONS = [
  { key: 'plywood', label: 'Plywood floor' },
  { key: 'oakLaminate', label: 'Oak laminate floor' },
  { key: 'polishedConcrete', label: 'Polished concrete floor' },
] as const satisfies readonly ModularHomeConfiguratorOption<'floorFinish'>[];

export const MODULAR_HOME_FURNITURE_PACKAGE_OPTIONS = [
  { key: 'emptyShell', label: 'Empty shell' },
  { key: 'standardFurniture', label: 'Standard furniture' },
  { key: 'premiumFurniture', label: 'Premium furniture' },
  { key: 'kitchenPackage', label: 'Kitchen package' },
  { key: 'bathroomPackage', label: 'Bathroom package' },
  { key: 'saunaPackage', label: 'Sauna package' },
] as const satisfies readonly ModularHomeConfiguratorOption<'furniturePackage'>[];

export const MODULAR_HOME_ROOM_USE_PROFILE_OPTIONS = [
  { key: 'bedroom', label: 'Bedroom' },
  { key: 'office', label: 'Office' },
  { key: 'guestRoom', label: 'Guest room' },
  { key: 'storage', label: 'Storage' },
  { key: 'largerLiving', label: 'Larger living' },
  { key: 'saunaRestRoom', label: 'Sauna rest room' },
] as const satisfies readonly ModularHomeConfiguratorOption<'roomUseProfile'>[];

export const MODULAR_HOME_FURNITURE_TOGGLE_OPTIONS = [
  { key: 'disabled', label: 'Off' },
  { key: 'enabled', label: 'On' },
] as const satisfies readonly ModularHomeConfiguratorOption<'sofa'>[];

export const MODULAR_HOME_LAYOUT_VARIANT_OPTIONS = [
  { key: 'openStudio', label: 'Open studio' },
  { key: 'oneBedroom', label: 'One bedroom' },
  { key: 'officeCabin', label: 'Office cabin' },
  { key: 'twoBedroom', label: 'Two bedroom' },
  { key: 'threeBedroomCompact', label: 'Three-bedroom compact' },
  { key: 'largeLiving', label: 'Large living' },
  { key: 'saunaOnly', label: 'Sauna only' },
  { key: 'guestCabin', label: 'Guest cabin' },
  { key: 'saunaRestRoom', label: 'Sauna + rest room' },
] as const satisfies readonly ModularHomeConfiguratorOption<'layoutVariant'>[];

export const MODULAR_HOME_DIMENSION_PRESET_OPTIONS = [
  { key: 'compactStandard', label: 'Compact standard' },
  { key: 'compactWideLiving', label: 'Compact wide living' },
  { key: 'compactLongBedroom', label: 'Compact long bedroom' },
  { key: 'familyStandard', label: 'Family standard' },
  { key: 'familyWideLiving', label: 'Family wide living' },
  { key: 'familyExtraBedroomModule', label: 'Family extra bedroom module' },
  { key: 'saunaStandard', label: 'Sauna standard' },
  { key: 'saunaDeepTerrace', label: 'Sauna deep terrace' },
  { key: 'saunaGuestWide', label: 'Sauna guest wide' },
] as const satisfies readonly ModularHomeConfiguratorOption<'dimensionPreset'>[];

export const DEFAULT_MODULAR_HOME_VIEW_MODE: ModularHomeViewModeOption = 'exterior';

export const MODULAR_HOME_VIEW_MODE_OPTIONS = [
  {
    key: 'exterior',
    label: 'Exterior',
    note: 'Full exterior with roof and facade.',
  },
  {
    key: 'cutaway',
    label: 'Cutaway',
    note: 'Roof hidden so the interior can be inspected.',
  },
  {
    key: 'interior',
    label: 'Interior',
    note: 'Roof hidden and exterior shell softened for room inspection.',
  },
  {
    key: 'floorplan',
    label: 'Floorplan',
    note: 'Low-wall layout view for room planning.',
  },
] as const satisfies readonly ModularHomeViewModeOptionDefinition[];

export const MODULAR_HOME_CONFIGURATOR_GROUPS = [
  { key: 'template', label: 'Home template', options: MODULAR_HOME_TEMPLATE_OPTIONS },
  { key: 'dimensionPreset', label: 'Dimension preset', options: MODULAR_HOME_DIMENSION_PRESET_OPTIONS },
  { key: 'roomUseProfile', label: 'Room use profile', options: MODULAR_HOME_ROOM_USE_PROFILE_OPTIONS },
  { key: 'facade', label: 'Facade', options: MODULAR_HOME_FACADE_OPTIONS },
  { key: 'roof', label: 'Roof', options: MODULAR_HOME_ROOF_OPTIONS },
  { key: 'terrace', label: 'Terrace', options: MODULAR_HOME_TERRACE_OPTIONS },
  { key: 'finishLevel', label: 'Finish level', options: MODULAR_HOME_FINISH_LEVEL_OPTIONS },
  { key: 'furniturePackage', label: 'Furniture package', options: MODULAR_HOME_FURNITURE_PACKAGE_OPTIONS },
  { key: 'sofa', label: 'Sofa', options: MODULAR_HOME_FURNITURE_TOGGLE_OPTIONS },
  { key: 'table', label: 'Table', options: MODULAR_HOME_FURNITURE_TOGGLE_OPTIONS },
  { key: 'bed', label: 'Bed', options: MODULAR_HOME_FURNITURE_TOGGLE_OPTIONS },
  { key: 'kitchenLine', label: 'Kitchen line', options: MODULAR_HOME_FURNITURE_TOGGLE_OPTIONS },
  { key: 'wardrobePlaceholder', label: 'Wardrobe placeholder', options: MODULAR_HOME_FURNITURE_TOGGLE_OPTIONS },
  { key: 'interiorWallFinish', label: 'Interior wall finish', options: MODULAR_HOME_INTERIOR_WALL_FINISH_OPTIONS },
  { key: 'floorFinish', label: 'Floor finish', options: MODULAR_HOME_FLOOR_FINISH_OPTIONS },
  { key: 'windowPackage', label: 'Window package', options: MODULAR_HOME_WINDOW_PACKAGE_OPTIONS },
  { key: 'doorPackage', label: 'Door package', options: MODULAR_HOME_DOOR_PACKAGE_OPTIONS },
  { key: 'windowPlacement', label: 'Window placement', options: MODULAR_HOME_WINDOW_PLACEMENT_OPTIONS },
  { key: 'doorPlacement', label: 'Door placement', options: MODULAR_HOME_DOOR_PLACEMENT_OPTIONS },
  { key: 'facadeBoardOrientation', label: 'Facade board orientation', options: MODULAR_HOME_FACADE_BOARD_ORIENTATION_OPTIONS },
  { key: 'facadeBoardWidth', label: 'Facade board width', options: MODULAR_HOME_FACADE_BOARD_WIDTH_OPTIONS },
  { key: 'facadeBoardProfile', label: 'Facade board profile', options: MODULAR_HOME_FACADE_BOARD_PROFILE_OPTIONS },
  { key: 'facadeBoardSpacing', label: 'Facade board spacing', options: MODULAR_HOME_FACADE_BOARD_SPACING_OPTIONS },
  { key: 'trimColor', label: 'Trim color', options: MODULAR_HOME_TRIM_COLOR_OPTIONS },
  { key: 'roofGutterStyle', label: 'Roof edge/gutter style', options: MODULAR_HOME_ROOF_GUTTER_STYLE_OPTIONS },
  { key: 'windowFrameType', label: 'Window frame type', options: MODULAR_HOME_WINDOW_FRAME_TYPE_OPTIONS },
  { key: 'interiorFloorStyle', label: 'Interior floor style', options: MODULAR_HOME_INTERIOR_FLOOR_STYLE_OPTIONS },
  { key: 'wallPanelStyle', label: 'Wall panel style', options: MODULAR_HOME_WALL_PANEL_STYLE_OPTIONS },
  { key: 'roofEdgeColor', label: 'Roof edge color', options: MODULAR_HOME_ROOF_EDGE_COLOR_OPTIONS },
  { key: 'windowFrameColor', label: 'Window frame color', options: MODULAR_HOME_WINDOW_FRAME_COLOR_OPTIONS },
] as const satisfies readonly ModularHomeConfiguratorGroup[];

function createFacadeVisual(option: ModularHomeFacadeOption): ModularHomeFacadeVisual {
  const material = getModularHomeFacadeMaterial(option);

  return {
    label: material.label,
    materialId: material.id,
    sideColor: material.secondaryColor,
    trimColor: material.accentColor,
    wallColor: material.baseColor,
  };
}

function createRoofVisual(option: ModularHomeRoofOption): ModularHomeRoofVisual {
  const material = getModularHomeRoofMaterial(option);

  return {
    accentColor: material.accentColor,
    isGreenRoof: option === 'greenRoofPlaceholder',
    label: material.label,
    materialId: material.id,
    roofColor: option === 'flat' ? material.secondaryColor : material.baseColor,
  };
}

function createFinishLevelVisual(
  option: ModularHomeFinishLevelOption,
  note: string,
): ModularHomeFinishLevelVisual {
  const materials = getModularHomeFinishMaterials(option);
  const interiorMaterial = materials.find((material) => material.group === 'interior');
  const wetCoreMaterial = materials.find((material) => material.group === 'wetCore');

  return {
    bathroomCoreColor: wetCoreMaterial?.baseColor ?? '#bae6fd',
    interiorFloorColor: interiorMaterial?.baseColor ?? '#d6b98b',
    interiorWallColor: interiorMaterial?.secondaryColor ?? '#f8e6c7',
    label: getModularHomeConfigLabel('finishLevel', option),
    materialIds: materials.map((material) => material.id),
    note,
  };
}

export const MODULAR_HOME_FACADE_VISUALS: Record<ModularHomeFacadeOption, ModularHomeFacadeVisual> = {
  naturalTimber: createFacadeVisual('naturalTimber'),
  darkThermoWood: createFacadeVisual('darkThermoWood'),
  lightPainted: createFacadeVisual('lightPainted'),
};

export const MODULAR_HOME_ROOF_VISUALS: Record<ModularHomeRoofOption, ModularHomeRoofVisual> = {
  pitched: createRoofVisual('pitched'),
  flat: createRoofVisual('flat'),
  greenRoofPlaceholder: createRoofVisual('greenRoofPlaceholder'),
};

export const MODULAR_HOME_FINISH_LEVEL_VISUALS: Record<ModularHomeFinishLevelOption, ModularHomeFinishLevelVisual> = {
  shell: createFinishLevelVisual('shell', 'Shell-level plywood preview.'),
  standard: createFinishLevelVisual('standard', 'Standard finish preview using plywood and wet-core material tokens.'),
  premium: createFinishLevelVisual('premium', 'Premium finish preview keeps the same lightweight material tokens until texture maps are added.'),
};

export const MODULAR_HOME_TERRACE_VISUALS: Record<ModularHomeTerraceOption, ModularHomeTerraceVisual> = {
  none: {
    label: 'None',
    deckDepth: 0,
    deckWidth: 0,
    enabled: false,
    isCovered: false,
    placement: 'none',
  },
  frontDeck: {
    label: 'Front deck',
    deckDepth: 18,
    deckWidth: 62,
    enabled: true,
    isCovered: false,
    placement: 'front',
  },
  sideTerrace: {
    label: 'Side terrace',
    deckDepth: 18,
    deckWidth: 58,
    enabled: true,
    isCovered: false,
    placement: 'side',
  },
  extendedTerrace: {
    label: 'Extended terrace',
    deckDepth: 32,
    deckWidth: 88,
    enabled: true,
    isCovered: false,
    placement: 'front',
  },
  coveredTerracePlaceholder: {
    label: 'Covered terrace placeholder',
    deckDepth: 24,
    deckWidth: 74,
    enabled: true,
    isCovered: true,
    placement: 'front',
  },
};

export const MODULAR_HOME_WINDOW_PACKAGE_VISUALS: Record<ModularHomeWindowPackageOption, ModularHomeWindowPackageVisual> = {
  standardWindows: {
    label: 'Standard glazing',
    glassColor: '#93c5fd',
    trimColor: '#d7b074',
    widthMultiplier: 1,
    heightMultiplier: 1,
    sideDepthMultiplier: 1,
    reviewNote: 'Baseline window module package for preview pricing.',
  },
  panoramicWindows: {
    label: 'Panoramic glazing',
    glassColor: '#bae6fd',
    trimColor: '#e0f2fe',
    widthMultiplier: 1.42,
    heightMultiplier: 1.12,
    sideDepthMultiplier: 1.18,
    reviewNote: 'Panoramic glazing requires structural, solar-gain and transport review.',
  },
  cornerGlazing: {
    label: 'Corner glazing',
    glassColor: '#cffafe',
    trimColor: '#67e8f9',
    widthMultiplier: 1.24,
    heightMultiplier: 1.08,
    sideDepthMultiplier: 1.42,
    reviewNote: 'Corner glazing requires production opening and thermal bridge review.',
  },
  compactPrivacy: {
    label: 'Compact/privacy glazing',
    glassColor: '#cbd5e1',
    trimColor: '#94a3b8',
    widthMultiplier: 0.76,
    heightMultiplier: 0.86,
    sideDepthMultiplier: 0.78,
    reviewNote: 'Privacy glazing keeps openings smaller for compact/service-oriented layouts.',
  },
};

export const MODULAR_HOME_DOOR_PACKAGE_VISUALS: Record<ModularHomeDoorPackageOption, ModularHomeDoorPackageVisual> = {
  standardEntry: {
    label: 'Standard entry',
    doorColor: '#6b3f1f',
    glassColor: '#bfdbfe',
    widthMultiplier: 1,
    hasGlassPanel: false,
    reviewNote: 'Baseline entry door package for preview pricing.',
  },
  terraceSlider: {
    label: 'Terrace slider',
    doorColor: '#334155',
    glassColor: '#bae6fd',
    widthMultiplier: 1.42,
    hasGlassPanel: true,
    reviewNote: 'Terrace slider requires threshold, drainage and weatherproofing review.',
  },
  premiumGlazedEntry: {
    label: 'Premium glazed entry',
    doorColor: '#1f2937',
    glassColor: '#e0f2fe',
    widthMultiplier: 1.16,
    hasGlassPanel: true,
    reviewNote: 'Premium glazed entry requires thermal, security and final hardware review.',
  },
};

export const MODULAR_HOME_WINDOW_PLACEMENT_VISUALS: Record<ModularHomeWindowPlacementOption, ModularHomeWindowPlacementVisual> = {
  balanced: {
    label: 'Balanced openings',
    frontOffsetMultiplier: -0.46,
    frontWindowCount: 1,
    hasCornerFeature: false,
    sideWindowScaleMultiplier: 1,
    sideWindowXSign: 1,
    reviewNote: 'Balanced front and side openings for baseline preview planning.',
  },
  frontPanoramic: {
    label: 'Front panoramic',
    frontOffsetMultiplier: -0.34,
    frontWindowCount: 2,
    hasCornerFeature: false,
    sideWindowScaleMultiplier: 0.8,
    sideWindowXSign: 1,
    reviewNote: 'Front panoramic placement requires structural opening and solar-gain review.',
  },
  sidePrivacy: {
    label: 'Side privacy',
    frontOffsetMultiplier: -0.56,
    frontWindowCount: 1,
    hasCornerFeature: false,
    sideWindowScaleMultiplier: 0.62,
    sideWindowXSign: -1,
    reviewNote: 'Side privacy placement keeps public-facing openings smaller and requires site orientation review.',
  },
  cornerFeature: {
    label: 'Corner feature',
    frontOffsetMultiplier: -0.38,
    frontWindowCount: 2,
    hasCornerFeature: true,
    sideWindowScaleMultiplier: 1.24,
    sideWindowXSign: 1,
    reviewNote: 'Corner feature placement requires structural corner opening and thermal bridge review.',
  },
};

export const MODULAR_HOME_DOOR_PLACEMENT_VISUALS: Record<ModularHomeDoorPlacementOption, ModularHomeDoorPlacementVisual> = {
  frontEntry: {
    label: 'Front entry',
    placement: 'front',
    reviewNote: 'Baseline front entry placement.',
  },
  sideEntry: {
    label: 'Side entry',
    placement: 'side',
    reviewNote: 'Side entry placement requires site approach and facade orientation review.',
  },
  terraceFacing: {
    label: 'Terrace-facing',
    placement: 'terrace',
    reviewNote: 'Terrace-facing access requires threshold, drainage and terrace interface review.',
  },
};

export const MODULAR_HOME_FACADE_BOARD_ORIENTATION_VISUALS: Record<ModularHomeFacadeBoardOrientationOption, ModularHomeFacadeBoardOrientationVisual> = {
  horizontal: {
    label: 'Horizontal boards',
    orientation: 'horizontal',
    quantityFactor: 1,
    reviewNote: 'Horizontal board orientation is the baseline preview cladding detail.',
  },
  vertical: {
    label: 'Vertical boards',
    orientation: 'vertical',
    quantityFactor: 1.04,
    reviewNote: 'Vertical board orientation changes batten/detail assumptions and requires production review.',
  },
};

export const MODULAR_HOME_FACADE_BOARD_WIDTH_VISUALS: Record<ModularHomeFacadeBoardWidthOption, ModularHomeFacadeBoardWidthVisual> = {
  narrow: {
    label: 'Narrow boards',
    maxPanelSpacing: 2.8,
    quantityFactor: 1.16,
    reviewNote: 'Narrow boards increase preview board count and labor allowance.',
  },
  standard: {
    label: 'Standard boards',
    maxPanelSpacing: 4.2,
    quantityFactor: 1,
    reviewNote: 'Standard board width is the baseline cladding detail.',
  },
  wide: {
    label: 'Wide boards',
    maxPanelSpacing: 6.2,
    quantityFactor: 0.9,
    reviewNote: 'Wide boards reduce preview board count but require profile availability review.',
  },
};

export const MODULAR_HOME_FACADE_BOARD_PROFILE_VISUALS: Record<ModularHomeFacadeBoardProfileOption, ModularHomeFacadeBoardProfileVisual> = {
  shadowGap: {
    label: 'Shadow-gap boards',
    quantityFactor: 1.08,
    revealColor: '#020617',
    revealDepth: 0.18,
    reviewNote: 'Shadow-gap boards add reveal labor and supplier profile review.',
  },
  squareEdge: {
    label: 'Square-edge boards',
    quantityFactor: 1,
    revealColor: '#2a1d14',
    revealDepth: 0.08,
    reviewNote: 'Square-edge boards are the baseline controlled facade profile.',
  },
  tongueGroove: {
    label: 'Tongue-and-groove boards',
    quantityFactor: 1.05,
    revealColor: '#4a2f1b',
    revealDepth: 0.12,
    reviewNote: 'Tongue-and-groove boards require supplier profile and movement detailing review.',
  },
};

export const MODULAR_HOME_FACADE_BOARD_SPACING_VISUALS: Record<ModularHomeFacadeBoardSpacingOption, ModularHomeFacadeBoardSpacingVisual> = {
  expressive: {
    label: 'Expressive spacing',
    lineOpacity: 0.72,
    spacingFactor: 1.22,
    reviewNote: 'Expressive spacing is visually stronger and requires weather detailing review.',
  },
  standard: {
    label: 'Standard spacing',
    lineOpacity: 0.52,
    spacingFactor: 1,
    reviewNote: 'Standard spacing is the baseline controlled cladding spacing.',
  },
  tight: {
    label: 'Tight spacing',
    lineOpacity: 0.42,
    spacingFactor: 0.82,
    reviewNote: 'Tight spacing increases board count and factory labor allowance.',
  },
};

export const MODULAR_HOME_TRIM_COLOR_VISUALS: Record<ModularHomeTrimColorOption, ModularHomeTrimColorVisual> = {
  bronze: {
    color: '#b7791f',
    label: 'Bronze trim',
    reviewNote: 'Bronze trim is a premium color detail requiring supplier finish confirmation.',
  },
  graphite: {
    color: '#1f2937',
    label: 'Graphite trim',
    reviewNote: 'Graphite trim creates a stronger exterior contrast in preview mode.',
  },
  timber: {
    color: '#d7b074',
    label: 'Timber trim',
    reviewNote: 'Timber trim is the baseline controlled exterior detail.',
  },
  white: {
    color: '#f8fafc',
    label: 'White trim',
    reviewNote: 'White trim requires final coating and maintenance review.',
  },
};

export const MODULAR_HOME_ROOF_GUTTER_STYLE_VISUALS: Record<ModularHomeRoofGutterStyleOption, ModularHomeRoofGutterStyleVisual> = {
  boxGutter: {
    downspoutScale: 1.14,
    label: 'Box gutter',
    profileDepth: 0.56,
    profileHeight: 0.34,
    reviewNote: 'Box gutter style requires drainage capacity and roof edge detailing review.',
  },
  minimalEdge: {
    downspoutScale: 1,
    label: 'Minimal edge gutter',
    profileDepth: 0.34,
    profileHeight: 0.22,
    reviewNote: 'Minimal edge gutter is the baseline preview roof edge style.',
  },
  roundGutter: {
    downspoutScale: 0.92,
    label: 'Round gutter placeholder',
    profileDepth: 0.46,
    profileHeight: 0.28,
    reviewNote: 'Round gutter placeholder requires supplier profile confirmation.',
  },
};

export const MODULAR_HOME_WINDOW_FRAME_TYPE_VISUALS: Record<ModularHomeWindowFrameTypeOption, ModularHomeWindowFrameTypeVisual> = {
  deepReveal: {
    frameScale: 1.36,
    label: 'Deep reveal frame',
    mullionScale: 1.12,
    revealDepth: 0.18,
    reviewNote: 'Deep reveal frames require opening depth and weatherproofing review.',
  },
  slimline: {
    frameScale: 0.72,
    label: 'Slimline frame',
    mullionScale: 0.72,
    revealDepth: 0.08,
    reviewNote: 'Slimline frames require supplier profile confirmation.',
  },
  standardFrame: {
    frameScale: 1,
    label: 'Standard frame',
    mullionScale: 1,
    revealDepth: 0.12,
    reviewNote: 'Standard frame type is the baseline controlled opening detail.',
  },
};

export const MODULAR_HOME_INTERIOR_FLOOR_STYLE_VISUALS: Record<ModularHomeInteriorFloorStyleOption, ModularHomeInteriorFloorStyleVisual> = {
  polishedSlab: {
    color: '#9ca3af',
    label: 'Polished slab grid',
    lineColor: '#e5e7eb',
    lineSpacing: 7.8,
    quantityFactor: 1.08,
    reviewNote: 'Polished slab grid is a preview token requiring floor system review.',
  },
  utilityPlywood: {
    color: '#d6b98b',
    label: 'Utility plywood boards',
    lineColor: '#8a5f33',
    lineSpacing: 5.5,
    quantityFactor: 1,
    reviewNote: 'Utility plywood boards are the baseline interior floor detail.',
  },
  warmPlank: {
    color: '#c79554',
    label: 'Warm plank lines',
    lineColor: '#5a371d',
    lineSpacing: 4.2,
    quantityFactor: 1.05,
    reviewNote: 'Warm plank lines add finish allowance and require supplier review.',
  },
};

export const MODULAR_HOME_WALL_PANEL_STYLE_VISUALS: Record<ModularHomeWallPanelStyleOption, ModularHomeWallPanelStyleVisual> = {
  paintReadyBoard: {
    color: '#f8fafc',
    label: 'Paint-ready boards',
    seamColor: '#cbd5e1',
    seamSpacing: 5.2,
    reviewNote: 'Paint-ready boards require final coating specification review.',
  },
  plainPanel: {
    color: '#f8e6c7',
    label: 'Plain wall panels',
    seamColor: '#8a5f33',
    seamSpacing: 7.2,
    reviewNote: 'Plain wall panels are the baseline interior wall panel detail.',
  },
  ribbedPanel: {
    color: '#e7c892',
    label: 'Ribbed wall panels',
    seamColor: '#5a371d',
    seamSpacing: 3.4,
    reviewNote: 'Ribbed panels add visible interior detail and supplier profile review.',
  },
};

export const MODULAR_HOME_ROOF_EDGE_COLOR_VISUALS: Record<ModularHomeRoofEdgeColorOption, ModularHomeRoofEdgeColorVisual> = {
  bronze: {
    color: '#b7791f',
    label: 'Bronze roof edge',
    reviewNote: 'Bronze edge trim is a premium color detail in preview pricing.',
  },
  graphite: {
    color: '#334155',
    label: 'Graphite roof edge',
    reviewNote: 'Graphite roof edge is the baseline trim color.',
  },
  lightMetal: {
    color: '#cbd5e1',
    label: 'Light metal roof edge',
    reviewNote: 'Light metal edge trim requires final supplier color confirmation.',
  },
};

export const MODULAR_HOME_WINDOW_FRAME_COLOR_VISUALS: Record<ModularHomeWindowFrameColorOption, ModularHomeWindowFrameColorVisual> = {
  graphite: {
    color: '#1f2937',
    label: 'Graphite frames',
    reviewNote: 'Graphite frames are a controlled premium color preview.',
  },
  timber: {
    color: '#d7b074',
    label: 'Timber frames',
    reviewNote: 'Timber frame color is the baseline preview trim.',
  },
  white: {
    color: '#f8fafc',
    label: 'White frames',
    reviewNote: 'White frames require final supplier finish confirmation.',
  },
};

export const MODULAR_HOME_INTERIOR_WALL_FINISH_VISUALS: Record<ModularHomeInteriorWallFinishOption, ModularHomeInteriorWallFinishVisual> = {
  paintedWhite: {
    color: '#f8fafc',
    label: 'Painted white walls',
    reviewNote: 'Painted walls add finish labor and require production spec review.',
  },
  plywood: {
    color: '#f8e6c7',
    label: 'Plywood walls',
    reviewNote: 'Plywood walls are the baseline interior preview material.',
  },
  warmPanel: {
    color: '#e7c892',
    label: 'Warm panel walls',
    reviewNote: 'Warm panel walls are a premium interior finish placeholder.',
  },
};

export const MODULAR_HOME_FLOOR_FINISH_VISUALS: Record<ModularHomeFloorFinishOption, ModularHomeFloorFinishVisual> = {
  oakLaminate: {
    color: '#c79554',
    label: 'Oak laminate floor',
    reviewNote: 'Oak laminate adds a preview finish allowance.',
  },
  plywood: {
    color: '#d6b98b',
    label: 'Plywood floor',
    reviewNote: 'Plywood floor is the baseline preview material.',
  },
  polishedConcrete: {
    color: '#94a3b8',
    label: 'Polished concrete floor',
    reviewNote: 'Polished concrete effect is a preview token and requires slab/system review.',
  },
};

export const MODULAR_HOME_FURNITURE_PACKAGE_VISUALS: Record<ModularHomeFurniturePackageOption, ModularHomeFurniturePackageVisual> = {
  bathroomPackage: {
    includedItems: [],
    isPremium: false,
    label: 'Bathroom package',
    reviewNote: 'Bathroom core fixtures remain visible while loose furniture is optional.',
  },
  emptyShell: {
    includedItems: [],
    isPremium: false,
    label: 'Empty shell',
    reviewNote: 'No loose furniture placeholders are included.',
  },
  kitchenPackage: {
    includedItems: ['kitchenLine', 'table'],
    isPremium: false,
    label: 'Kitchen package',
    reviewNote: 'Kitchen-focused package keeps the kitchen line and table placeholders.',
  },
  premiumFurniture: {
    includedItems: ['sofa', 'table', 'bed', 'kitchenLine', 'wardrobePlaceholder'],
    isPremium: true,
    label: 'Premium furniture',
    reviewNote: 'Premium furniture is a visual and estimate placeholder, not a final furniture quote.',
  },
  saunaPackage: {
    includedItems: ['table'],
    isPremium: false,
    label: 'Sauna package',
    reviewNote: 'Sauna package keeps sauna bench/service placeholders and optional rest-area table.',
  },
  standardFurniture: {
    includedItems: ['sofa', 'table', 'bed', 'kitchenLine', 'wardrobePlaceholder'],
    isPremium: false,
    label: 'Standard furniture',
    reviewNote: 'Standard preview furniture uses low-poly placeholders.',
  },
};

export const MODULAR_HOME_FURNITURE_TOGGLE_KEYS = [
  'sofa',
  'table',
  'bed',
  'kitchenLine',
  'wardrobePlaceholder',
] as const satisfies readonly ModularHomeFurnitureToggleKey[];

export function getModularHomeFurnitureToggleLabel(value: ModularHomeFurnitureToggleOption): string {
  return value === 'enabled' ? 'On' : 'Off';
}

let currentModularHomeConfig: ModularHomeConfiguratorState = DEFAULT_MODULAR_HOME_CONFIG;
const modularHomeConfigListeners = new Set<() => void>();
let currentModularHomeViewMode: ModularHomeViewModeOption = DEFAULT_MODULAR_HOME_VIEW_MODE;
const modularHomeViewModeListeners = new Set<() => void>();

function emitModularHomeConfigChange() {
  for (const listener of modularHomeConfigListeners) {
    listener();
  }
}

function subscribeModularHomeConfig(listener: () => void) {
  modularHomeConfigListeners.add(listener);

  return () => {
    modularHomeConfigListeners.delete(listener);
  };
}

function emitModularHomeViewModeChange() {
  for (const listener of modularHomeViewModeListeners) {
    listener();
  }
}

function subscribeModularHomeViewMode(listener: () => void) {
  modularHomeViewModeListeners.add(listener);

  return () => {
    modularHomeViewModeListeners.delete(listener);
  };
}

function getModularHomeConfigSnapshot() {
  return currentModularHomeConfig;
}

function getModularHomeViewModeSnapshot() {
  return currentModularHomeViewMode;
}

export function getModularHomeConfigLabel<Key extends keyof ModularHomeConfiguratorState>(
  groupKey: Key,
  value: ModularHomeConfiguratorState[Key],
): string {
  if (groupKey === 'layoutVariant') {
    const option = MODULAR_HOME_LAYOUT_VARIANT_OPTIONS.find((item) => item.key === value);
    return option?.label ?? String(value);
  }

  const group = MODULAR_HOME_CONFIGURATOR_GROUPS.find((item) => item.key === groupKey);
  const option = group?.options.find((item) => item.key === value);
  return option?.label ?? String(value);
}

export function getModularHomeConfigSummary(config: ModularHomeConfiguratorState) {
  return {
    template: getModularHomeConfigLabel('template', config.template),
    layoutVariant: getModularHomeConfigLabel('layoutVariant', config.layoutVariant),
    dimensionPreset: getModularHomeConfigLabel('dimensionPreset', config.dimensionPreset),
    roomUseProfile: getModularHomeConfigLabel('roomUseProfile', config.roomUseProfile),
    facade: getModularHomeConfigLabel('facade', config.facade),
    roof: getModularHomeConfigLabel('roof', config.roof),
    terrace: getModularHomeConfigLabel('terrace', config.terrace),
    finishLevel: getModularHomeConfigLabel('finishLevel', config.finishLevel),
    windowPackage: getModularHomeConfigLabel('windowPackage', config.windowPackage),
    doorPackage: getModularHomeConfigLabel('doorPackage', config.doorPackage),
    windowPlacement: getModularHomeConfigLabel('windowPlacement', config.windowPlacement),
    doorPlacement: getModularHomeConfigLabel('doorPlacement', config.doorPlacement),
    facadeBoardOrientation: getModularHomeConfigLabel('facadeBoardOrientation', config.facadeBoardOrientation),
    facadeBoardWidth: getModularHomeConfigLabel('facadeBoardWidth', config.facadeBoardWidth),
    facadeBoardProfile: getModularHomeConfigLabel('facadeBoardProfile', config.facadeBoardProfile),
    facadeBoardSpacing: getModularHomeConfigLabel('facadeBoardSpacing', config.facadeBoardSpacing),
    trimColor: getModularHomeConfigLabel('trimColor', config.trimColor),
    roofGutterStyle: getModularHomeConfigLabel('roofGutterStyle', config.roofGutterStyle),
    windowFrameType: getModularHomeConfigLabel('windowFrameType', config.windowFrameType),
    interiorFloorStyle: getModularHomeConfigLabel('interiorFloorStyle', config.interiorFloorStyle),
    wallPanelStyle: getModularHomeConfigLabel('wallPanelStyle', config.wallPanelStyle),
    roofEdgeColor: getModularHomeConfigLabel('roofEdgeColor', config.roofEdgeColor),
    windowFrameColor: getModularHomeConfigLabel('windowFrameColor', config.windowFrameColor),
    interiorWallFinish: getModularHomeConfigLabel('interiorWallFinish', config.interiorWallFinish),
    floorFinish: getModularHomeConfigLabel('floorFinish', config.floorFinish),
    furniturePackage: getModularHomeConfigLabel('furniturePackage', config.furniturePackage),
    sofa: getModularHomeFurnitureToggleLabel(config.sofa),
    table: getModularHomeFurnitureToggleLabel(config.table),
    bed: getModularHomeFurnitureToggleLabel(config.bed),
    kitchenLine: getModularHomeFurnitureToggleLabel(config.kitchenLine),
    wardrobePlaceholder: getModularHomeFurnitureToggleLabel(config.wardrobePlaceholder),
  };
}

export function normalizeModularHomeConfig(
  config: Partial<ModularHomeConfiguratorState>,
): ModularHomeConfiguratorState {
  const rawTerrace = config.terrace as ModularHomeTerraceOption | 'smallTerrace' | undefined;
  const terrace = rawTerrace === 'smallTerrace'
    ? 'frontDeck'
    : rawTerrace;

  return {
    ...DEFAULT_MODULAR_HOME_CONFIG,
    ...config,
    terrace: terrace ?? DEFAULT_MODULAR_HOME_CONFIG.terrace,
  };
}

export function setModularHomeConfigOption<Key extends keyof ModularHomeConfiguratorState>(
  key: Key,
  value: ModularHomeConfiguratorState[Key],
) {
  if (currentModularHomeConfig[key] === value) {
    return;
  }

  currentModularHomeConfig = {
    ...currentModularHomeConfig,
    [key]: value,
  };
  emitModularHomeConfigChange();
}

export function setModularHomeConfig(config: ModularHomeConfiguratorState) {
  currentModularHomeConfig = normalizeModularHomeConfig(config);
  emitModularHomeConfigChange();
}

export function resetModularHomeConfig() {
  currentModularHomeConfig = DEFAULT_MODULAR_HOME_CONFIG;
  emitModularHomeConfigChange();
}

export function getModularHomeViewModeLabel(value: ModularHomeViewModeOption): string {
  return MODULAR_HOME_VIEW_MODE_OPTIONS.find((item) => item.key === value)?.label ?? value;
}

export function getModularHomeViewMode(): ModularHomeViewModeOption {
  return currentModularHomeViewMode;
}

export function setModularHomeViewMode(value: ModularHomeViewModeOption) {
  if (currentModularHomeViewMode === value) {
    return;
  }

  currentModularHomeViewMode = value;
  emitModularHomeViewModeChange();
}

export function resetModularHomeViewMode() {
  currentModularHomeViewMode = DEFAULT_MODULAR_HOME_VIEW_MODE;
  emitModularHomeViewModeChange();
}

export function useModularHomeConfigurator() {
  const config = useSyncExternalStore(
    subscribeModularHomeConfig,
    getModularHomeConfigSnapshot,
    getModularHomeConfigSnapshot,
  );
  const setOption = useCallback(<Key extends keyof ModularHomeConfiguratorState>(
    key: Key,
    value: ModularHomeConfiguratorState[Key],
  ) => setModularHomeConfigOption(key, value), []);
  const setConfig = useCallback((nextConfig: ModularHomeConfiguratorState) => setModularHomeConfig(nextConfig), []);
  const reset = useCallback(() => resetModularHomeConfig(), []);

  return {
    config,
    reset,
    setConfig,
    setOption,
    summary: getModularHomeConfigSummary(config),
  };
}

export function useModularHomeViewMode() {
  const viewMode = useSyncExternalStore(
    subscribeModularHomeViewMode,
    getModularHomeViewModeSnapshot,
    getModularHomeViewModeSnapshot,
  );
  const setViewMode = useCallback((nextMode: ModularHomeViewModeOption) => setModularHomeViewMode(nextMode), []);
  const resetViewMode = useCallback(() => resetModularHomeViewMode(), []);

  return {
    label: getModularHomeViewModeLabel(viewMode),
    resetViewMode,
    setViewMode,
    viewMode,
  };
}
