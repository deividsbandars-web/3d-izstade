import type { ModularHomeConfiguratorState } from '../modularHomeConfigurator';
import { getModularHomeProductForConfig, getModulesForConfig, getModuleQuantitySummary } from '../modularHomeProducts';
import { MODULAR_HOME_MANUFACTURING_BOM_DISCLAIMER } from './catalog';
import { calculateComponentBom } from './componentBom';
import {
  createManufacturingAssemblyGroups,
  getAssemblyGroupIdForComponentCategory,
  getComponentCodeForComponentId,
  getFacadeBoardLengthGroups,
  getFacadeBoardLinearMeters,
  getFastenerHardwarePlaceholders,
  getManufacturingWasteFactorsByMaterial,
  getPanelGroupId,
  getProductionBatchNotes,
  getTransportPackageNotes,
  getWallPanelDimensions,
  getWallPanelSizeGroups,
  moduleWallArea,
  roundQuantity,
  roundRatio,
  uniqueStrings,
} from './manufacturingHelpers';
import { calculateOpeningSchedule, summarizeOpeningSchedule } from './openingSchedule';
import type {
  ModularHomeComponentSummaryItem,
  ModularHomeManufacturingBom,
  ModularHomeManufacturingBomPanelGroup,
  ModularHomeManufacturingBomPanelSizeGroup,
  ModularHomeManufacturingBomScheduleItem,
} from './types';

export function calculateManufacturingBomPreview(config: ModularHomeConfiguratorState): ModularHomeManufacturingBom {
  const product = getModularHomeProductForConfig(config);
  const componentBom = calculateComponentBom(config);
  const openingSchedule = calculateOpeningSchedule(config);
  const openingScheduleSummary = summarizeOpeningSchedule(openingSchedule);
  const moduleQuantityById = new Map(
    product ? getModuleQuantitySummary(product.id).map((item) => [item.moduleId, item.quantity]) : [],
  );
  const panelGroups: ModularHomeManufacturingBomPanelGroup[] = [];
  const panelSizeGroups: ModularHomeManufacturingBomPanelSizeGroup[] = [];

  for (const module of getModulesForConfig(config)) {
    if (!['living', 'bedroom', 'bathroomCore', 'technical'].includes(module.type)) {
      continue;
    }

    const moduleQuantity = moduleQuantityById.get(module.id) ?? 1;
    const wallArea = roundQuantity(moduleWallArea(module) * moduleQuantity);
    panelSizeGroups.push(...getWallPanelSizeGroups(module, moduleQuantity));

    panelGroups.push({
      assemblyGroupId: 'assembly-module-shells',
      areaM2: wallArea,
      approximatePanelDimensions: getWallPanelDimensions(module),
      componentCode: getComponentCodeForComponentId('timber-wall-panel-system'),
      id: `${module.id}-wall-panel-group`,
      label: `${module.id} wall panel group`,
      moduleIds: [module.id],
      notes: 'Approximate elevation panelization only; final stud layout, openings and transport breaks require production verification.',
      panelCount: 4 * moduleQuantity,
      panelGroupId: getPanelGroupId(module.id),
      wasteFactor: 0.08,
    });
  }

  const facadeGroup = componentBom.groups.find((group) => group.category === 'facadeBoarding');
  const floorGroup = componentBom.groups.find((group) => group.category === 'floorCassette');
  const roofGroup = componentBom.groups.find((group) => group.category === 'roofCassette');
  const terraceItems = componentBom.items.filter((item) => item.category === 'terraceDeck');
  const interiorItems = componentBom.items.filter((item) => item.category === 'interiorFinish');
  const wasteBase = componentBom.materialCostEstimate + componentBom.laborCostEstimate;

  const scheduleFromItems = (
    items: readonly ModularHomeComponentSummaryItem[],
    dimensions: (item: ModularHomeComponentSummaryItem) => string,
  ): readonly ModularHomeManufacturingBomScheduleItem[] => items.map((item) => ({
    assemblyGroupId: getAssemblyGroupIdForComponentCategory(item.category),
    areaM2: item.unit === 'm2' ? roundQuantity(item.quantity) : null,
    componentCode: getComponentCodeForComponentId(item.componentId),
    dimensions: dimensions(item),
    id: item.componentId,
    label: item.label,
    linearM: item.unit === 'linearM' ? roundQuantity(item.quantity) : null,
    notes: item.notes,
    quantity: roundQuantity(item.quantity),
    unit: item.unit,
    wasteFactor: item.component.wasteFactor,
  }));

  const windowSchedule: readonly ModularHomeManufacturingBomScheduleItem[] = openingSchedule
    .filter((item) => item.type === 'window')
    .map((item) => ({
      assemblyGroupId: 'assembly-openings',
      areaM2: roundQuantity((item.widthMm * item.heightMm * item.quantity) / 1000000),
      componentCode: item.unitCodePlaceholder,
      dimensions: `${item.widthMm} x ${item.heightMm} mm / ${item.wallSide}`,
      id: item.id,
      label: `${item.layoutVariantId} ${item.wallSide} ${item.glazingType} window`,
      linearM: null,
      notes: item.reviewRequirement ? `${item.notes} ${item.reviewRequirement}` : item.notes,
      quantity: item.quantity,
      unit: 'piece',
      wasteFactor: 0.08,
    }));
  const doorSchedule: readonly ModularHomeManufacturingBomScheduleItem[] = openingSchedule
    .filter((item) => item.type === 'exteriorDoor' || item.type === 'terraceDoor')
    .map((item) => ({
      assemblyGroupId: 'assembly-openings',
      areaM2: roundQuantity((item.widthMm * item.heightMm * item.quantity) / 1000000),
      componentCode: item.unitCodePlaceholder,
      dimensions: `${item.widthMm} x ${item.heightMm} mm / ${item.wallSide}`,
      id: item.id,
      label: `${item.layoutVariantId} ${item.type === 'terraceDoor' ? 'terrace' : 'entry'} door`,
      linearM: null,
      notes: item.reviewRequirement ? `${item.notes} ${item.reviewRequirement}` : item.notes,
      quantity: item.quantity,
      unit: 'piece',
      wasteFactor: 0.06,
    }));
  const terraceDeckSchedule = scheduleFromItems(terraceItems, () => `${config.terrace} terrace deck package`);
  const interiorFinishAreas = scheduleFromItems(interiorItems, () => `${config.finishLevel} / ${config.wallPanelStyle} / ${config.interiorFloorStyle} interior finish surface allowance`);
  const facadeBoardAreaM2 = roundQuantity(facadeGroup?.quantity ?? componentBom.quantities.facadeAreaM2);
  const facadeBoardLinearM = getFacadeBoardLinearMeters(facadeBoardAreaM2);
  const panelCount = panelGroups.reduce((total, group) => total + group.panelCount, 0);
  const windowCount = windowSchedule.reduce((total, item) => total + item.quantity, 0);
  const doorCount = doorSchedule.reduce((total, item) => total + item.quantity, 0);
  const totalWasteFactor = wasteBase > 0 ? roundRatio(componentBom.wasteCostEstimate / wasteBase) : 0;
  const boardLengthGroups = getFacadeBoardLengthGroups(config, facadeBoardLinearM, facadeBoardAreaM2);
  const fastenerHardwarePlaceholders = getFastenerHardwarePlaceholders(
    config,
    componentBom.moduleCount,
    panelCount,
    windowCount,
    doorCount,
  );
  const wasteFactorsByMaterial = getManufacturingWasteFactorsByMaterial(config, totalWasteFactor);
  const productionBatchNotes = getProductionBatchNotes(config, componentBom.moduleCount, panelCount);
  const transportPackageNotes = getTransportPackageNotes(config, componentBom.moduleCount, terraceDeckSchedule);
  const assemblyGroups = createManufacturingAssemblyGroups({
    boardLengthGroups,
    doorSchedule,
    fastenerHardwarePlaceholders,
    interiorFinishAreas,
    moduleCount: componentBom.moduleCount,
    panelGroups,
    panelSizeGroups,
    terraceDeckSchedule,
    wasteFactorsByMaterial,
    windowSchedule,
  });
  const componentCodes = uniqueStrings([
    ...componentBom.items.map((item) => getComponentCodeForComponentId(item.componentId)),
    ...panelGroups.map((group) => group.componentCode),
    ...panelSizeGroups.map((group) => group.componentCode),
    ...boardLengthGroups.map((group) => group.componentCode),
    ...windowSchedule.map((item) => item.componentCode),
    ...doorSchedule.map((item) => item.componentCode),
    ...terraceDeckSchedule.map((item) => item.componentCode),
    ...interiorFinishAreas.map((item) => item.componentCode),
    ...fastenerHardwarePlaceholders.map((item) => item.componentCode),
    ...wasteFactorsByMaterial.map((item) => item.componentCode),
  ]);

  return {
    assemblyGroups,
    boardLengthGroups,
    componentBomSubtotal: componentBom.subtotal,
    componentCodes,
    config,
    disclaimer: MODULAR_HOME_MANUFACTURING_BOM_DISCLAIMER,
    doorSchedule,
    fastenerHardwarePlaceholders,
    facadeBoardAreaM2,
    facadeBoardLinearM,
    floorCassetteAreaM2: roundQuantity(floorGroup?.quantity ?? componentBom.quantities.grossFloorAreaM2),
    interiorFinishAreas,
    moduleCount: componentBom.moduleCount,
    openingSchedule,
    openingScheduleSummary,
    panelGroups,
    panelSizeGroups,
    productionBatchNotes,
    productionVerificationNotes: [
      'Preview manufacturing BOM is derived from configurable web product data, not a factory-approved cut list.',
      'Manufacturing BOM v2 adds component codes, assembly groups, panel group IDs, board length categories, hardware groups and material waste categories for planning only.',
      'Openings, structural headers, transport splits, fasteners, CNC nesting and supplier-specific profiles require production verification.',
      'Panoramic glazing, corner glazing and terrace-facing door variants require engineering and weatherproofing review before manufacturing.',
      'Panel size groups, board length groups, hardware placeholders and transport package notes are cut-list readiness aids only.',
      `Facade board detail: ${config.facadeBoardProfile} profile / ${config.facadeBoardSpacing} spacing / ${config.facadeBoardOrientation} orientation / ${config.facadeBoardWidth} width.`,
      `Finish detail: ${config.interiorWallFinish} interior walls / ${config.wallPanelStyle} wall panel style / ${config.floorFinish} floor finish / ${config.interiorFloorStyle} floor style.`,
      `Trim detail: ${config.trimColor} trim / ${config.roofEdgeColor} roof edge / ${config.roofGutterStyle} gutter style / ${config.windowFrameColor} ${config.windowFrameType} window frames.`,
    ],
    productId: componentBom.productId,
    productName: componentBom.productName,
    roofCassetteAreaM2: roundQuantity(roofGroup?.quantity ?? componentBom.quantities.roofAreaM2),
    terraceDeckSchedule,
    totalWasteFactor,
    transportPackageNotes,
    wasteFactorsByMaterial,
    windowSchedule,
  };
}

export function calculateManufacturingBom(config: ModularHomeConfiguratorState): ModularHomeManufacturingBom {
  return calculateManufacturingBomPreview(config);
}
