import type { ModularHomeConfiguratorState } from '../modularHomeConfigurator';
import type { ModularHomeModule, ModularHomeModuleId } from '../modularHomeProducts';
import type {
  ModularHomeComponentCategory,
  ModularHomeComponentId,
  ModularHomeManufacturingBomAssemblyGroup,
  ModularHomeManufacturingBomBoardLengthGroup,
  ModularHomeManufacturingBomHardwarePlaceholder,
  ModularHomeManufacturingBomPanelGroup,
  ModularHomeManufacturingBomPanelSizeGroup,
  ModularHomeManufacturingBomScheduleItem,
  ModularHomeManufacturingBomWasteFactorGroup,
} from './types';

export function roundMoney(value: number): number {
  return Math.round(value);
}

export function roundQuantity(value: number): number {
  return Math.round(value * 100) / 100;
}

export function roundRatio(value: number): number {
  return Math.round(value * 1000) / 1000;
}

export function roundOneDecimal(value: number): number {
  return Math.round(value * 10) / 10;
}

export function moduleFloorArea(module: ModularHomeModule): number {
  return module.dimensions.widthM * module.dimensions.lengthM;
}

export function moduleWallArea(module: ModularHomeModule): number {
  return 2 * (module.dimensions.widthM + module.dimensions.lengthM) * module.dimensions.heightM;
}

export function formatMeters(value: number): string {
  return `${roundOneDecimal(value)} m`;
}

export function toManufacturingCodeSegment(value: string): string {
  return value
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toUpperCase();
}

export function createManufacturingCode(prefix: string, id: string): string {
  return `${prefix}-${toManufacturingCodeSegment(id)}`;
}

export function getComponentCodeForComponentId(componentId: string): string {
  return createManufacturingCode('MHC', componentId);
}

export function getSelectedFacadeComponentId(config: ModularHomeConfiguratorState): ModularHomeComponentId {
  const componentByFacade = {
    darkThermoWood: 'dark-thermo-facade-boarding',
    lightPainted: 'light-painted-facade-boarding',
    naturalTimber: 'natural-timber-facade-boarding',
  } as const satisfies Record<ModularHomeConfiguratorState['facade'], ModularHomeComponentId>;

  return componentByFacade[config.facade] ?? 'natural-timber-facade-boarding';
}

export function getSelectedRoofComponentId(config: ModularHomeConfiguratorState): ModularHomeComponentId {
  return config.roof === 'pitched' ? 'pitched-roof-cassette-system' : 'flat-roof-cassette-system';
}

export function getPanelGroupId(moduleId: ModularHomeModuleId): string {
  return createManufacturingCode('PG', moduleId);
}

export function getPanelSizeGroupId(moduleId: ModularHomeModuleId, scope: 'endWall' | 'longWall'): string {
  return createManufacturingCode('PSG', `${moduleId}-${scope}`);
}

export function getAssemblyGroupIdForComponentCategory(category: ModularHomeComponentCategory): string {
  const groupByCategory = {
    bathroomCore: 'assembly-service-cores',
    doorUnit: 'assembly-openings',
    facadeBoarding: 'assembly-facade-boards',
    floorCassette: 'assembly-module-shells',
    foundationPad: 'assembly-foundation-placeholders',
    furniturePackage: 'assembly-interior-fitout',
    interiorFinish: 'assembly-interior-fitout',
    kitchenLine: 'assembly-interior-fitout',
    roofCassette: 'assembly-roof-package',
    terraceDeck: 'assembly-terrace-package',
    wallPanel: 'assembly-module-shells',
    windowUnit: 'assembly-openings',
  } as const satisfies Record<ModularHomeComponentCategory, string>;

  return groupByCategory[category];
}

export function getWallPanelDimensions(module: ModularHomeModule): readonly string[] {
  return [
    `2 x ${formatMeters(module.dimensions.lengthM)} x ${formatMeters(module.dimensions.heightM)} long wall panels`,
    `2 x ${formatMeters(module.dimensions.widthM)} x ${formatMeters(module.dimensions.heightM)} end wall panels`,
  ];
}

export function getWallPanelSizeGroups(
  module: ModularHomeModule,
  moduleQuantity: number,
): readonly ModularHomeManufacturingBomPanelSizeGroup[] {
  const height = formatMeters(module.dimensions.heightM);
  const longWallArea = roundQuantity(module.dimensions.lengthM * module.dimensions.heightM * 2 * moduleQuantity);
  const endWallArea = roundQuantity(module.dimensions.widthM * module.dimensions.heightM * 2 * moduleQuantity);

  return [
    {
      areaM2: longWallArea,
      componentCode: getComponentCodeForComponentId('timber-wall-panel-system'),
      dimensions: `${formatMeters(module.dimensions.lengthM)} x ${height}`,
      id: `${module.id}-long-wall-panel-size`,
      label: `${module.id} long wall panels`,
      moduleIds: [module.id],
      notes: 'Preview panel size group only; final split depends on openings, factory table size and transport breaks.',
      panelCount: 2 * moduleQuantity,
      panelGroupId: getPanelGroupId(module.id),
      panelSizeGroupId: getPanelSizeGroupId(module.id, 'longWall'),
    },
    {
      areaM2: endWallArea,
      componentCode: getComponentCodeForComponentId('timber-wall-panel-system'),
      dimensions: `${formatMeters(module.dimensions.widthM)} x ${height}`,
      id: `${module.id}-end-wall-panel-size`,
      label: `${module.id} end wall panels`,
      moduleIds: [module.id],
      notes: 'Preview panel size group only; final split depends on openings, factory table size and transport breaks.',
      panelCount: 2 * moduleQuantity,
      panelGroupId: getPanelGroupId(module.id),
      panelSizeGroupId: getPanelSizeGroupId(module.id, 'endWall'),
    },
  ];
}

export function getFacadeBoardLinearMeters(areaM2: number): number {
  // Preview assumes 145 mm effective cladding board coverage before final supplier profile selection.
  return roundQuantity(areaM2 / 0.145);
}

export function getFacadeBoardLengthGroups(
  config: ModularHomeConfiguratorState,
  linearM: number,
  areaM2: number,
): readonly ModularHomeManufacturingBomBoardLengthGroup[] {
  const lengthM = config.facadeBoardOrientation === 'vertical'
    ? 3
    : config.facadeBoardWidth === 'wide'
      ? 4.8
      : 4.2;
  const profilePrefix = `${config.facadeBoardProfile} / ${config.facadeBoardSpacing}`;
  const primaryShare = config.facadeBoardSpacing === 'tight' ? 0.74 : config.facadeBoardSpacing === 'expressive' ? 0.68 : 0.72;
  const primaryLinearM = roundQuantity(linearM * primaryShare);
  const secondaryLinearM = roundQuantity(linearM - primaryLinearM);
  const primaryCoverageM2 = roundQuantity(areaM2 * primaryShare);
  const secondaryLengthM = config.facadeBoardOrientation === 'vertical' ? 2.6 : 3.6;

  return [
    {
      assemblyGroupId: 'assembly-facade-boards',
      boardLengthCategory: 'primary-elevation-boards',
      componentCode: getComponentCodeForComponentId(getSelectedFacadeComponentId(config)),
      coverageM2: primaryCoverageM2,
      id: 'facade-board-primary-length-group',
      label: `${profilePrefix} ${config.facadeBoardOrientation} facade boards primary length`,
      lengthM,
      linearM: primaryLinearM,
      notes: 'Preview ordering group for main elevations; profile, spacing, nesting, offcuts and supplier stock lengths require production verification.',
      quantity: Math.ceil(primaryLinearM / lengthM),
    },
    {
      assemblyGroupId: 'assembly-facade-boards',
      boardLengthCategory: 'trim-return-and-short-elevation-boards',
      componentCode: getComponentCodeForComponentId(getSelectedFacadeComponentId(config)),
      coverageM2: roundQuantity(areaM2 - primaryCoverageM2),
      id: 'facade-board-secondary-length-group',
      label: `${profilePrefix} ${config.facadeBoardOrientation} facade boards trim/secondary length`,
      lengthM: secondaryLengthM,
      linearM: secondaryLinearM,
      notes: `Preview allowance for short elevations, returns and ${config.trimColor} trim zones; not a supplier cut list.`,
      quantity: Math.ceil(secondaryLinearM / secondaryLengthM),
    },
  ];
}

export function getFacadeBoardWidthFactor(config: ModularHomeConfiguratorState): number {
  const factorByWidth = {
    narrow: 1.16,
    standard: 1,
    wide: 0.9,
  } as const satisfies Record<ModularHomeConfiguratorState['facadeBoardWidth'], number>;

  return factorByWidth[config.facadeBoardWidth] ?? 1;
}

export function getFacadeBoardOrientationFactor(config: ModularHomeConfiguratorState): number {
  return config.facadeBoardOrientation === 'vertical' ? 1.04 : 1;
}

export function getFacadeBoardProfileFactor(config: ModularHomeConfiguratorState): number {
  const factorByProfile = {
    shadowGap: 1.08,
    squareEdge: 1,
    tongueGroove: 1.05,
  } as const satisfies Record<ModularHomeConfiguratorState['facadeBoardProfile'], number>;

  return factorByProfile[config.facadeBoardProfile] ?? 1;
}

export function getFacadeBoardSpacingFactor(config: ModularHomeConfiguratorState): number {
  const factorBySpacing = {
    expressive: 0.96,
    standard: 1,
    tight: 1.12,
  } as const satisfies Record<ModularHomeConfiguratorState['facadeBoardSpacing'], number>;

  return factorBySpacing[config.facadeBoardSpacing] ?? 1;
}

export function getFacadeBoardQuantityFactor(config: ModularHomeConfiguratorState): number {
  return getFacadeBoardWidthFactor(config)
    * getFacadeBoardOrientationFactor(config)
    * getFacadeBoardProfileFactor(config)
    * getFacadeBoardSpacingFactor(config);
}

export function getInteriorFinishQuantityFactor(config: ModularHomeConfiguratorState): number {
  const wallFactorByStyle = {
    paintReadyBoard: 1.03,
    plainPanel: 1,
    ribbedPanel: 1.08,
  } as const satisfies Record<ModularHomeConfiguratorState['wallPanelStyle'], number>;
  const floorFactorByStyle = {
    polishedSlab: 1.05,
    utilityPlywood: 1,
    warmPlank: 1.04,
  } as const satisfies Record<ModularHomeConfiguratorState['interiorFloorStyle'], number>;

  return (wallFactorByStyle[config.wallPanelStyle] ?? 1) * (floorFactorByStyle[config.interiorFloorStyle] ?? 1);
}

export function getManufacturingWasteFactorsByMaterial(
  config: ModularHomeConfiguratorState,
  totalWasteFactor: number,
): readonly ModularHomeManufacturingBomWasteFactorGroup[] {
  const facadeWasteFactor = roundRatio(0.08 * getFacadeBoardQuantityFactor(config));
  const terraceWasteFactor = config.terrace === 'none'
    ? 0
    : config.terrace === 'coveredTerracePlaceholder' || config.terrace === 'extendedTerrace'
      ? 0.12
      : 0.1;

  return [
    {
      appliesTo: 'wall and floor cassette preview groups',
      componentCode: getComponentCodeForComponentId('timber-wall-panel-system'),
      id: 'waste-timber-structural',
      label: 'Structural timber waste',
      material: 'timber cassette / framing',
      materialCategory: 'structural-timber',
      notes: 'Preview allowance for panel trimming, service openings and factory handling.',
      wasteFactor: 0.08,
    },
    {
      appliesTo: 'facadeBoarding',
      componentCode: getComponentCodeForComponentId(getSelectedFacadeComponentId(config)),
      id: 'waste-facade-boarding',
      label: 'Facade board waste',
      material: `${config.facadeBoardProfile} ${config.facadeBoardSpacing} ${config.facadeBoardOrientation} ${config.facadeBoardWidth} facade boards`,
      materialCategory: 'facade-boarding',
      notes: 'Board profile, spacing, direction and width affect offcuts; supplier stock lengths still require verification.',
      wasteFactor: facadeWasteFactor,
    },
    {
      appliesTo: 'roofCassette',
      componentCode: getComponentCodeForComponentId(getSelectedRoofComponentId(config)),
      id: 'waste-roof-package',
      label: 'Roof package waste',
      material: `${config.roof} roof package`,
      materialCategory: 'roof-package',
      notes: 'Green roof and pitched roof packages require roof supplier verification.',
      wasteFactor: config.roof === 'greenRoofPlaceholder' ? 0.13 : 0.09,
    },
    {
      appliesTo: 'terraceDeck',
      componentCode: getComponentCodeForComponentId('small-terrace-deck-system'),
      id: 'waste-terrace-decking',
      label: 'Terrace deck waste',
      material: `${config.terrace} terrace package`,
      materialCategory: 'terrace-decking',
      notes: 'Terrace waste is zero when no terrace is selected; extended/covered packages require site review.',
      wasteFactor: terraceWasteFactor,
    },
    {
      appliesTo: 'component BOM subtotal',
      componentCode: 'MHC-COMPONENT-BOM-SUBTOTAL',
      id: 'waste-overall-preview',
      label: 'Overall preview waste',
      material: 'combined material/labor preview',
      materialCategory: 'overall-preview-allowance',
      notes: 'Derived from component BOM costs; not a production purchasing allowance.',
      wasteFactor: totalWasteFactor,
    },
  ];
}

export function getFastenerHardwarePlaceholders(
  config: ModularHomeConfiguratorState,
  moduleCount: number,
  panelCount: number,
  windowCount: number,
  doorCount: number,
): readonly ModularHomeManufacturingBomHardwarePlaceholder[] {
  const terraceHardwareSets = config.terrace === 'none' ? 0 : config.terrace === 'extendedTerrace' ? 2 : 1;

  const placeholders: ModularHomeManufacturingBomHardwarePlaceholder[] = [
    {
      appliesTo: 'wallPanel + floorCassette',
      componentCode: getComponentCodeForComponentId('timber-wall-panel-system'),
      hardwareGroupId: 'hardware-module-connection',
      id: 'hardware-panel-connection-set',
      label: 'Panel connection screw/plate set',
      notes: 'Placeholder only; final screw type, plate layout and fire/acoustic requirements require engineering.',
      quantity: Math.max(1, moduleCount),
      unit: 'set',
    },
    {
      appliesTo: 'wallPanel seams',
      componentCode: getComponentCodeForComponentId('timber-wall-panel-system'),
      hardwareGroupId: 'hardware-panel-seams',
      id: 'hardware-panel-seam-fastener-box',
      label: 'Panel seam fastener box',
      notes: 'Preview box count based on approximate wall panel count, not fastener spacing.',
      quantity: Math.max(1, Math.ceil(panelCount / 6)),
      unit: 'box',
    },
    {
      appliesTo: 'windowUnit + doorUnit',
      componentCode: 'MHC-OPENING-SEAL-ANCHOR-SET',
      hardwareGroupId: 'hardware-opening-weatherproofing',
      id: 'hardware-opening-sealant-set',
      label: 'Opening seal/tape/anchor set',
      notes: 'Placeholder for weatherproofing and fixing around controlled openings.',
      quantity: Math.max(1, windowCount + doorCount),
      unit: 'set',
    },
    {
      appliesTo: 'terraceDeck',
      componentCode: getComponentCodeForComponentId('small-terrace-deck-system'),
      hardwareGroupId: 'hardware-terrace-fixings',
      id: 'hardware-terrace-fixing-set',
      label: 'Terrace fixing set',
      notes: 'Included only for selected terrace packages; foundation and access review still required.',
      quantity: terraceHardwareSets,
      unit: 'set',
    },
  ];

  return placeholders.filter((item) => item.quantity > 0);
}

export function getProductionBatchNotes(
  config: ModularHomeConfiguratorState,
  moduleCount: number,
  panelCount: number,
): readonly string[] {
  return [
    `Batch preview: ${moduleCount} transport module${moduleCount === 1 ? '' : 's'} with approximately ${panelCount} wall panels before opening-specific split.`,
    `Facade batch: ${config.facadeBoardProfile} / ${config.facadeBoardSpacing} / ${config.facadeBoardOrientation} / ${config.facadeBoardWidth} board package should be checked against supplier stock lengths and finish batch availability.`,
    `Opening batch: ${config.windowPlacement} windows with ${config.windowFrameType} frames and ${config.doorPlacement} doors need final shop drawings before manufacturing release.`,
    `Trim/gutter batch: ${config.trimColor} trim with ${config.roofGutterStyle} roof edge/gutter style requires supplier color and drainage detail confirmation.`,
    `Interior finish batch: ${config.wallPanelStyle} wall panels and ${config.interiorFloorStyle} floor style require final material specification.`,
    'Production batch notes are for planning readiness only and are not a factory work order.',
  ];
}

export function getTransportPackageNotes(
  config: ModularHomeConfiguratorState,
  moduleCount: number,
  terraceSchedule: readonly ModularHomeManufacturingBomScheduleItem[],
): readonly string[] {
  return [
    `Transport package preview: ${moduleCount} primary module${moduleCount === 1 ? '' : 's'} plus loose/flat-pack elements where required.`,
    config.terrace === 'none'
      ? 'No terrace deck transport package selected.'
      : `Terrace transport package: ${terraceSchedule.map((item) => `${item.label} ${item.quantity} ${item.unit}`).join(' / ') || config.terrace}.`,
    'Final transport packing depends on truck dimensions, crane access, route permits and weather protection.',
  ];
}

export function uniqueStrings(values: readonly string[]): readonly string[] {
  return Array.from(new Set(values.filter(Boolean))).sort();
}

export function createManufacturingAssemblyGroups(input: {
  boardLengthGroups: readonly ModularHomeManufacturingBomBoardLengthGroup[];
  doorSchedule: readonly ModularHomeManufacturingBomScheduleItem[];
  fastenerHardwarePlaceholders: readonly ModularHomeManufacturingBomHardwarePlaceholder[];
  interiorFinishAreas: readonly ModularHomeManufacturingBomScheduleItem[];
  moduleCount: number;
  panelGroups: readonly ModularHomeManufacturingBomPanelGroup[];
  panelSizeGroups: readonly ModularHomeManufacturingBomPanelSizeGroup[];
  terraceDeckSchedule: readonly ModularHomeManufacturingBomScheduleItem[];
  wasteFactorsByMaterial: readonly ModularHomeManufacturingBomWasteFactorGroup[];
  windowSchedule: readonly ModularHomeManufacturingBomScheduleItem[];
}): readonly ModularHomeManufacturingBomAssemblyGroup[] {
  const panelComponentCodes = uniqueStrings([
    ...input.panelGroups.map((group) => group.componentCode),
    ...input.panelSizeGroups.map((group) => group.componentCode),
  ]);
  const openingItems = [...input.windowSchedule, ...input.doorSchedule];
  const terraceHardware = input.fastenerHardwarePlaceholders.filter((item) => item.hardwareGroupId === 'hardware-terrace-fixings');
  const nonTerraceHardware = input.fastenerHardwarePlaceholders.filter((item) => item.hardwareGroupId !== 'hardware-terrace-fixings');

  return [
    {
      assemblyGroupId: 'assembly-module-shells',
      componentCodes: panelComponentCodes,
      hardwareGroupIds: uniqueStrings(nonTerraceHardware.map((item) => item.hardwareGroupId)),
      label: 'Module shell panels',
      moduleIds: uniqueStrings(input.panelGroups.flatMap((group) => group.moduleIds)) as readonly ModularHomeModuleId[],
      notes: 'Wall panel and panel-size readiness group; not released for CNC or factory table nesting.',
      panelGroupIds: uniqueStrings(input.panelGroups.map((group) => group.panelGroupId)),
      quantity: input.panelGroups.reduce((total, group) => total + group.panelCount, 0),
      unit: 'piece',
    },
    {
      assemblyGroupId: 'assembly-facade-boards',
      componentCodes: uniqueStrings(input.boardLengthGroups.map((group) => group.componentCode)),
      hardwareGroupIds: [],
      label: 'Facade board package',
      moduleIds: [],
      notes: 'Board length category planning only; supplier stock lengths, coating batches and offcuts require verification.',
      panelGroupIds: [],
      quantity: input.boardLengthGroups.reduce((total, group) => total + group.quantity, 0),
      unit: 'piece',
    },
    {
      assemblyGroupId: 'assembly-openings',
      componentCodes: uniqueStrings(openingItems.map((item) => item.componentCode)),
      hardwareGroupIds: uniqueStrings(nonTerraceHardware.filter((item) => item.hardwareGroupId === 'hardware-opening-weatherproofing').map((item) => item.hardwareGroupId)),
      label: 'Window and door openings',
      moduleIds: [],
      notes: 'Opening schedule is controlled placement only; final headers, flashing and weatherproofing require shop drawings.',
      panelGroupIds: [],
      quantity: openingItems.reduce((total, item) => total + item.quantity, 0),
      unit: 'piece',
    },
    {
      assemblyGroupId: 'assembly-terrace-package',
      componentCodes: uniqueStrings([
        ...input.terraceDeckSchedule.map((item) => item.componentCode),
        ...terraceHardware.map((item) => item.componentCode),
      ]),
      hardwareGroupIds: uniqueStrings(terraceHardware.map((item) => item.hardwareGroupId)),
      label: 'Terrace and exterior extension package',
      moduleIds: [],
      notes: 'Terrace deck schedule is preview only; foundation, access and covered terrace structure require site review.',
      panelGroupIds: [],
      quantity: input.terraceDeckSchedule.reduce((total, item) => total + item.quantity, 0),
      unit: input.terraceDeckSchedule.length > 0 ? 'm2' : 'set',
    },
    {
      assemblyGroupId: 'assembly-interior-fitout',
      componentCodes: uniqueStrings(input.interiorFinishAreas.map((item) => item.componentCode)),
      hardwareGroupIds: [],
      label: 'Interior finish package',
      moduleIds: [],
      notes: 'Interior finish areas are approximate and require final room-by-room finish schedule.',
      panelGroupIds: [],
      quantity: roundQuantity(input.interiorFinishAreas.reduce((total, item) => total + (item.areaM2 ?? item.quantity), 0)),
      unit: 'm2',
    },
    {
      assemblyGroupId: 'assembly-waste-and-batch-allowances',
      componentCodes: uniqueStrings(input.wasteFactorsByMaterial.map((item) => item.componentCode)),
      hardwareGroupIds: uniqueStrings(input.fastenerHardwarePlaceholders.map((item) => item.hardwareGroupId)),
      label: 'Waste, hardware and batch allowances',
      moduleIds: [],
      notes: 'Planning allowances only; purchasing quantities, pack sizes and factory batches require manual verification.',
      panelGroupIds: uniqueStrings(input.panelGroups.map((group) => group.panelGroupId)),
      quantity: input.moduleCount,
      unit: 'group',
    },
  ];
}
