import assert from 'node:assert/strict';
import {
  buildModularHomeProfessionalQuoteExportData,
  calculateOpeningSchedule,
  calculateComponentBom,
  calculateMaterialTakeoff,
  calculateManufacturingBomPreview,
  calculateModularHomeEstimate,
  calculateModularHomeQuantities,
  compareModularHomeProjects,
  createModularHomeLocalProject,
  createModularHomeProjectComparison,
  createModularHomeShareUrl,
  decodeModularHomeConfigFromUrl,
  DEFAULT_MODULAR_HOME_VIEW_MODE,
  encodeModularHomeConfigToSearchParams,
  getCostItemForComponent,
  getCostItemsByCategory,
  getBomModuleSummary,
  getComponentSummaryForConfig,
  getComponentsForModule,
  getComponentsForProduct,
  getDefaultHomeConfig,
  getDefaultDimensionPresetForProduct,
  getDefaultLayoutVariantForProduct,
  getInvalidConfigReasons,
  formatHomeEstimateEur,
  getHomeDemoMode,
  getModularHomeEstimateConfidenceLabel,
  getModularHomeEstimatePriceSourceLabel,
  getModularHomeMaterials,
  getModularHomeConfigurationWarnings,
  getModularHomeDimensionPresetForConfig,
  getModularHomeDimensionSummary,
  getModularHomeLayoutVariant,
  getModularHomeLayoutVariantForConfig,
  getModularHomeLayoutVariantsForProduct,
  getModularHomeOptionChoices,
  getModularHomeProductionConstraints,
  getModularHomeProductConfigSummary,
  getModularHomeProducts,
  getModularHomeRoomMeasurementSummary,
  getModularHomeRoomMeasurements,
  getModularHomeRoomUseChoices,
  getModularHomeRoomUseProfileForConfig,
  getModularHomeViewMode,
  getModularHomeViewModeLabel,
  getSelectedModularHomeMaterialIds,
  isHomeDemoEnabled,
  isHomeStudioEnabled,
  getModuleInstancesForProduct,
  getModuleQuantitySummary,
  getModulesForProduct,
  getPricingCategoriesForComponentCategory,
  getPricingCategoriesForModuleType,
  getPricingCategoriesForOptionGroup,
  MODULAR_HOME_COMPONENTS,
  MODULAR_HOME_DEFAULT_SUPPLIER_COST_MAP,
  MODULAR_HOME_FACADE_BOARD_ORIENTATION_OPTIONS,
  MODULAR_HOME_FACADE_BOARD_WIDTH_OPTIONS,
  MODULAR_HOME_FLOOR_FINISH_OPTIONS,
  MODULAR_HOME_FURNITURE_PACKAGE_OPTIONS,
  MODULAR_HOME_FURNITURE_TOGGLE_OPTIONS,
  MODULAR_HOME_INTERIOR_WALL_FINISH_OPTIONS,
  MODULAR_HOME_MODULES,
  MODULAR_HOME_OPTIONS,
  MODULAR_HOME_PRICING_CATEGORIES,
  MODULAR_HOME_PRICING_CONTEXT,
  MODULAR_HOME_PRODUCT_COMPONENT_LIBRARY,
  MODULAR_HOME_SUPPLIER_COST_ITEMS,
  MODULAR_HOME_ROOF_EDGE_COLOR_OPTIONS,
  MODULAR_HOME_ROOM_MEASUREMENT_DISCLAIMER,
  MODULAR_HOME_ROOM_MEASUREMENTS,
  MODULAR_HOME_WINDOW_FRAME_COLOR_OPTIONS,
  MODULAR_HOME_VIEW_MODE_OPTIONS,
  resetModularHomeViewMode,
  setModularHomeViewMode,
  validateSupplierCostItems,
  validateHomeConfiguration,
} from '../runtime/modularHome/index.js';

const compactInstances = getModuleInstancesForProduct('compact-timber-40');
assert.equal(compactInstances.length, 3);
assert.equal(compactInstances.reduce((total, instance) => total + instance.quantity, 0), 3);
assert.equal(compactInstances.every((instance) => instance.instanceId.length > 0), true);

const familyQuantitySummary = getModuleQuantitySummary('family-timber-80');
const familyBedroomSummary = familyQuantitySummary.find((item) => item.moduleId === 'family-bedroom-module');
assert.ok(familyBedroomSummary);
assert.equal(familyBedroomSummary.quantity, 2);
assert.deepEqual(familyBedroomSummary.productionGroups, ['primary-shell']);
assert.equal(familyBedroomSummary.roles.includes('Bedroom modules'), true);

const familyBom = getBomModuleSummary('family-timber-80');
const familyBedroomBom = familyBom.find((item) => item.moduleId === 'family-bedroom-module');
assert.ok(familyBedroomBom);
assert.equal(familyBedroomBom.unitPrice, 8800);

assert.equal(getHomeDemoMode('?homeDemo=1'), 'homes');
assert.equal(getHomeDemoMode('?homeStudio=1'), 'homes');
assert.equal(isHomeDemoEnabled('?homeStudio=1'), true);
assert.equal(isHomeStudioEnabled('?homeStudio=1'), true);
assert.equal(isHomeStudioEnabled('?homeDemo=1'), false);

const compactRoomUseChoices = getModularHomeRoomUseChoices('compact-timber-40', 'oneBedroom').map((item) => item.id);
assert.deepEqual(compactRoomUseChoices, ['bedroom', 'office', 'guestRoom', 'storage']);
const compactOfficeRoomUseProfile = getModularHomeRoomUseProfileForConfig({
  ...getDefaultHomeConfig('compact-timber-40'),
  roomUseProfile: 'office',
});
assert.ok(compactOfficeRoomUseProfile);
assert.equal(compactOfficeRoomUseProfile.label, 'Office');
assert.equal(getModularHomeProductConfigSummary({
  ...getDefaultHomeConfig('family-timber-80'),
  layoutVariant: 'largeLiving',
  roomUseProfile: 'largerLiving',
}).roomUseProfile, 'Larger living');
const saunaGuestSummary = getModularHomeRoomMeasurementSummary({
  ...getDefaultHomeConfig('sauna-cabin-25'),
  layoutVariant: 'guestCabin',
  roomUseProfile: 'guestRoom',
});
const saunaGuestMainRoom = saunaGuestSummary.rooms.find((room) => room.id === 'sauna-guest-rest-area');
assert.ok(saunaGuestMainRoom);
assert.equal(saunaGuestMainRoom.label, 'Guest room / rest area');
assert.equal(familyBedroomBom.totalPrice, 17600);

const saunaQuantitySummary = getModuleQuantitySummary('sauna-cabin-25');
assert.deepEqual(
  saunaQuantitySummary.map((item) => `${item.moduleId}:${item.quantity}`),
  ['sauna-core-module:1', 'bathroom-core-module:1'],
);

const saunaBom = getBomModuleSummary('sauna-cabin-25');
assert.equal(saunaBom.find((item) => item.moduleId === 'sauna-core-module')?.productionGroups[0], 'wellness-core');
assert.equal(saunaBom.find((item) => item.moduleId === 'bathroom-core-module')?.productionGroups[0], 'service-core');

assert.equal(getModuleInstancesForProduct('missing-product').length, 0);
assert.equal(getModuleQuantitySummary('missing-product').length, 0);
assert.equal(getBomModuleSummary('missing-product').length, 0);

// Backwards-compatible unique module list remains available for current estimate/rendering paths.
assert.deepEqual(
  getModulesForProduct('family-timber-80').map((module) => module.id).sort(),
  ['family-living-module', 'family-bedroom-module', 'bathroom-core-module'].sort(),
);

assert.equal(getDefaultHomeConfig('compact-timber-40').layoutVariant, 'oneBedroom');
assert.equal(getDefaultHomeConfig('family-timber-80').layoutVariant, 'twoBedroom');
assert.equal(getDefaultHomeConfig('sauna-cabin-25').layoutVariant, 'saunaRestRoom');
assert.equal(getDefaultHomeConfig('compact-timber-40').dimensionPreset, 'compactStandard');
assert.equal(getDefaultHomeConfig('family-timber-80').dimensionPreset, 'familyStandard');
assert.equal(getDefaultHomeConfig('sauna-cabin-25').dimensionPreset, 'saunaStandard');
assert.equal(getDefaultDimensionPresetForProduct('compact-timber-40'), 'compactStandard');
assert.equal(getDefaultDimensionPresetForProduct('family-timber-80'), 'familyStandard');
assert.equal(getDefaultDimensionPresetForProduct('sauna-cabin-25'), 'saunaStandard');
assert.equal(getDefaultHomeConfig('compact-timber-40').windowPlacement, 'balanced');
assert.equal(getDefaultHomeConfig('family-timber-80').windowPlacement, 'frontPanoramic');
assert.equal(getDefaultHomeConfig('sauna-cabin-25').windowPlacement, 'sidePrivacy');
assert.equal(getDefaultHomeConfig('compact-timber-40').doorPlacement, 'frontEntry');
assert.equal(getDefaultHomeConfig('family-timber-80').doorPlacement, 'terraceFacing');
assert.equal(getDefaultHomeConfig('sauna-cabin-25').doorPlacement, 'frontEntry');
assert.equal(getDefaultHomeConfig('compact-timber-40').facadeBoardOrientation, 'vertical');
assert.equal(getDefaultHomeConfig('compact-timber-40').facadeBoardWidth, 'standard');
assert.equal(getDefaultHomeConfig('compact-timber-40').roofEdgeColor, 'graphite');
assert.equal(getDefaultHomeConfig('compact-timber-40').windowFrameColor, 'timber');
assert.equal(getDefaultHomeConfig('compact-timber-40').interiorWallFinish, 'plywood');
assert.equal(getDefaultHomeConfig('compact-timber-40').floorFinish, 'plywood');
assert.equal(getDefaultHomeConfig('compact-timber-40').furniturePackage, 'standardFurniture');
assert.equal(getDefaultHomeConfig('compact-timber-40').sofa, 'enabled');
assert.equal(getDefaultHomeConfig('compact-timber-40').table, 'enabled');
assert.equal(getDefaultHomeConfig('compact-timber-40').bed, 'enabled');
assert.equal(getDefaultHomeConfig('compact-timber-40').kitchenLine, 'enabled');
assert.equal(getDefaultHomeConfig('compact-timber-40').wardrobePlaceholder, 'enabled');
assert.equal(getDefaultHomeConfig('sauna-cabin-25').furniturePackage, 'saunaPackage');
assert.equal(getDefaultHomeConfig('sauna-cabin-25').sofa, 'disabled');
assert.equal(getDefaultHomeConfig('sauna-cabin-25').table, 'enabled');
assert.equal(getDefaultHomeConfig('sauna-cabin-25').bed, 'disabled');
assert.equal(getDefaultHomeConfig('sauna-cabin-25').kitchenLine, 'disabled');
assert.equal(getDefaultHomeConfig('sauna-cabin-25').wardrobePlaceholder, 'disabled');
assert.deepEqual(MODULAR_HOME_FACADE_BOARD_ORIENTATION_OPTIONS.map((option) => option.key), ['horizontal', 'vertical']);
assert.deepEqual(MODULAR_HOME_FACADE_BOARD_WIDTH_OPTIONS.map((option) => option.key), ['narrow', 'standard', 'wide']);
assert.deepEqual(MODULAR_HOME_ROOF_EDGE_COLOR_OPTIONS.map((option) => option.key), ['graphite', 'bronze', 'lightMetal']);
assert.deepEqual(MODULAR_HOME_WINDOW_FRAME_COLOR_OPTIONS.map((option) => option.key), ['timber', 'graphite', 'white']);
assert.deepEqual(MODULAR_HOME_INTERIOR_WALL_FINISH_OPTIONS.map((option) => option.key), ['plywood', 'paintedWhite', 'warmPanel']);
assert.deepEqual(MODULAR_HOME_FLOOR_FINISH_OPTIONS.map((option) => option.key), ['plywood', 'oakLaminate', 'polishedConcrete']);
assert.deepEqual(MODULAR_HOME_FURNITURE_PACKAGE_OPTIONS.map((option) => option.key), ['emptyShell', 'standardFurniture', 'premiumFurniture', 'kitchenPackage', 'bathroomPackage', 'saunaPackage']);
assert.deepEqual(MODULAR_HOME_FURNITURE_TOGGLE_OPTIONS.map((option) => option.key), ['disabled', 'enabled']);
assert.equal(getDefaultLayoutVariantForProduct('compact-timber-40'), 'oneBedroom');
assert.deepEqual(
  getModularHomeLayoutVariantsForProduct('compact-timber-40').map((variant) => variant.id),
  ['openStudio', 'oneBedroom', 'officeCabin'],
);
assert.deepEqual(
  getModularHomeLayoutVariantsForProduct('family-timber-80').map((variant) => variant.id),
  ['twoBedroom', 'threeBedroomCompact', 'largeLiving'],
);
assert.deepEqual(
  getModularHomeLayoutVariantsForProduct('sauna-cabin-25').map((variant) => variant.id),
  ['saunaOnly', 'guestCabin', 'saunaRestRoom'],
);
assert.equal(getModularHomeLayoutVariant('family-timber-80', 'largeLiving')?.label, 'Large living');
assert.equal(getModularHomeLayoutVariantForConfig({
  ...getDefaultHomeConfig('compact-timber-40'),
  layoutVariant: 'officeCabin',
})?.summaryNote.includes('work'), true);
assert.equal(getModularHomeProductConfigSummary({
  ...getDefaultHomeConfig('sauna-cabin-25'),
  layoutVariant: 'guestCabin',
}).layoutVariant, 'Guest cabin');
assert.equal(MODULAR_HOME_ROOM_MEASUREMENTS.length, 48);

for (const product of getModularHomeProducts()) {
  for (const layout of getModularHomeLayoutVariantsForProduct(product.id)) {
    const rooms = getModularHomeRoomMeasurements(product.id, layout.id);
    const roomAreaTotal = Math.round(rooms.reduce((total, room) => total + room.areaM2, 0) * 10) / 10;

    assert.ok(rooms.length >= 4, `${layout.id} should include room measurements`);
    assert.equal(rooms.every((room) => room.label.length > 0 && room.note.length > 0), true);
    assert.equal(rooms.every((room) => room.areaM2 > 0), true);
    assert.ok(
      Math.abs(roomAreaTotal - product.floorAreaM2) <= 0.6,
      `${layout.id} room area ${roomAreaTotal} should roughly match ${product.floorAreaM2}`,
    );
  }
}

const compactFloorplanSummary = getModularHomeRoomMeasurementSummary({
  ...getDefaultHomeConfig('compact-timber-40'),
  layoutVariant: 'oneBedroom',
});
assert.equal(compactFloorplanSummary.disclaimer, MODULAR_HOME_ROOM_MEASUREMENT_DISCLAIMER);
assert.equal(compactFloorplanSummary.floorAreaM2, 40);
assert.equal(compactFloorplanSummary.ceilingHeightM, 2.6);
assert.equal(compactFloorplanSummary.roomAreaTotalM2, 40);
assert.equal(compactFloorplanSummary.rooms.some((room) => room.label === 'Living / kitchen' && room.areaM2 > 16), true);

const invalidFamilyFloorplanSummary = getModularHomeRoomMeasurementSummary({
  ...getDefaultHomeConfig('family-timber-80'),
  layoutVariant: 'missing-layout' as ReturnType<typeof getDefaultHomeConfig>['layoutVariant'],
});
assert.equal(invalidFamilyFloorplanSummary.layoutVariant?.id, 'twoBedroom');
assert.equal(invalidFamilyFloorplanSummary.roomAreaTotalM2, 80);

const saunaConfig = getDefaultHomeConfig('sauna-cabin-25');
const saunaRoofChoices = getModularHomeOptionChoices('sauna-cabin-25', 'roof', saunaConfig);
const saunaPitchedRoof = saunaRoofChoices.find((item) => item.visualToken === 'pitched');
assert.ok(saunaPitchedRoof);
assert.equal(saunaPitchedRoof.isCompatible, false);
assert.equal(saunaPitchedRoof.constraintStatus, 'notAvailable');

const saunaFacadeChoices = getModularHomeOptionChoices('sauna-cabin-25', 'facade', saunaConfig);
assert.equal(saunaFacadeChoices.find((item) => item.visualToken === 'lightPainted')?.constraintStatus, 'notAvailable');

const saunaTerraceChoices = getModularHomeOptionChoices('sauna-cabin-25', 'terrace', saunaConfig);
assert.equal(saunaTerraceChoices.find((item) => item.visualToken === 'extendedTerrace')?.constraintStatus, 'notAvailable');
assert.equal(saunaTerraceChoices.find((item) => item.visualToken === 'frontDeck')?.constraintStatus, 'requiresReview');
assert.equal(saunaTerraceChoices.find((item) => item.visualToken === 'sideTerrace')?.constraintStatus, 'compatible');
assert.equal(saunaTerraceChoices.find((item) => item.visualToken === 'coveredTerracePlaceholder')?.constraintStatus, 'requiresReview');

const saunaFinishChoices = getModularHomeOptionChoices('sauna-cabin-25', 'finish', saunaConfig);
assert.equal(saunaFinishChoices.find((item) => item.visualToken === 'premium')?.constraintStatus, 'notAvailable');

const invalidSaunaConfig = {
  ...saunaConfig,
  layoutVariant: 'oneBedroom',
  roof: 'pitched',
  terrace: 'extendedTerrace',
} as const;
assert.equal(validateHomeConfiguration(invalidSaunaConfig), false);
assert.equal(getInvalidConfigReasons(invalidSaunaConfig).some((reason) => reason.includes('Layout variant oneBedroom')), true);
assert.equal(getInvalidConfigReasons(invalidSaunaConfig).some((reason) => reason.includes('Pitched roof')), true);
assert.equal(getInvalidConfigReasons(invalidSaunaConfig).some((reason) => reason.includes('Extended terrace')), true);

const compactPremiumConfig = {
  ...getDefaultHomeConfig('compact-timber-40'),
  finishLevel: 'premium',
} as const;
assert.equal(validateHomeConfiguration(compactPremiumConfig), true);
assert.equal(
  getModularHomeConfigurationWarnings(compactPremiumConfig)
    .some((warning) => warning.status === 'requiresReview' && warning.id === 'premium-finish-standard-base-review'),
  true,
);
assert.equal(
  getModularHomeProductionConstraints(compactPremiumConfig)
    .some((constraint) => (
      constraint.id === 'premium-interior-lead-time-warning'
      && constraint.severity === 'warning'
      && constraint.nextStep.includes('lead time')
    )),
  true,
);

const familyGreenRoofConfig = {
  ...getDefaultHomeConfig('family-timber-80'),
  facade: 'lightPainted',
  roof: 'greenRoofPlaceholder',
  terrace: 'extendedTerrace',
} as const;
const familyWarnings = getModularHomeConfigurationWarnings(familyGreenRoofConfig);
assert.equal(validateHomeConfiguration(familyGreenRoofConfig), true);
assert.equal(familyWarnings.some((warning) => warning.id === 'green-roof-engineering-review'), true);
assert.equal(familyWarnings.some((warning) => warning.id === 'green-roof-extended-terrace-review'), true);
assert.equal(familyWarnings.some((warning) => warning.id === 'green-roof-light-facade-review'), true);
assert.equal(familyWarnings.some((warning) => warning.id === 'extended-terrace-foundation-review'), true);

const compactCoveredTerraceConfig = {
  ...getDefaultHomeConfig('compact-timber-40'),
  terrace: 'coveredTerracePlaceholder',
} as const;
assert.equal(validateHomeConfiguration(compactCoveredTerraceConfig), true);
assert.equal(
  getModularHomeConfigurationWarnings(compactCoveredTerraceConfig)
    .some((warning) => warning.id === 'covered-terrace-structure-review'),
  true,
);

const compactRoofChoices = getModularHomeOptionChoices('compact-timber-40', 'roof', getDefaultHomeConfig('compact-timber-40'));
assert.equal(
  compactRoofChoices.find((item) => item.visualToken === 'greenRoofPlaceholder')?.constraintStatus,
  'requiresReview',
);

const compactWindowChoices = getModularHomeOptionChoices('compact-timber-40', 'windowPackage', getDefaultHomeConfig('compact-timber-40'));
assert.equal(compactWindowChoices.find((item) => item.visualToken === 'panoramicWindows')?.constraintStatus, 'requiresReview');
assert.equal(compactWindowChoices.find((item) => item.visualToken === 'cornerGlazing')?.constraintStatus, 'requiresReview');
assert.equal(compactWindowChoices.find((item) => item.visualToken === 'cornerGlazing')?.productionConstraintSeverity, 'requiresReview');

const compactOfficeConfig = {
  ...getDefaultHomeConfig('compact-timber-40'),
  layoutVariant: 'officeCabin',
} as const;
const compactOfficeWindowChoices = getModularHomeOptionChoices('compact-timber-40', 'windowPackage', compactOfficeConfig);
const compactOfficeCornerGlazing = compactOfficeWindowChoices.find((item) => item.visualToken === 'cornerGlazing');
assert.ok(compactOfficeCornerGlazing);
assert.equal(compactOfficeCornerGlazing.isCompatible, false);
assert.equal(compactOfficeCornerGlazing.constraintStatus, 'notAvailable');
assert.equal(compactOfficeCornerGlazing.productionConstraintSeverity, 'blocked');
assert.equal(compactOfficeCornerGlazing.productionNextStep.includes('balanced'), true);

const compactOfficeCornerConfig = {
  ...compactOfficeConfig,
  windowPackage: 'cornerGlazing',
} as const;
assert.equal(validateHomeConfiguration(compactOfficeCornerConfig), false);
assert.equal(
  getModularHomeProductionConstraints(compactOfficeCornerConfig)
    .some((constraint) => constraint.id === 'office-cabin-corner-glazing-blocked' && constraint.severity === 'blocked'),
  true,
);

const saunaWindowChoices = getModularHomeOptionChoices('sauna-cabin-25', 'windowPackage', saunaConfig);
assert.equal(saunaWindowChoices.find((item) => item.visualToken === 'panoramicWindows')?.constraintStatus, 'notAvailable');
assert.equal(saunaWindowChoices.find((item) => item.visualToken === 'cornerGlazing')?.constraintStatus, 'notAvailable');
assert.equal(saunaWindowChoices.find((item) => item.visualToken === 'compactPrivacy')?.constraintStatus, 'compatible');

const compactDoorChoices = getModularHomeOptionChoices('compact-timber-40', 'doorPackage', getDefaultHomeConfig('compact-timber-40'));
assert.equal(compactDoorChoices.find((item) => item.visualToken === 'terraceSlider')?.constraintStatus, 'requiresReview');
assert.equal(compactDoorChoices.find((item) => item.visualToken === 'premiumGlazedEntry')?.constraintStatus, 'requiresReview');

const saunaDoorChoices = getModularHomeOptionChoices('sauna-cabin-25', 'doorPackage', saunaConfig);
assert.equal(saunaDoorChoices.find((item) => item.visualToken === 'premiumGlazedEntry')?.constraintStatus, 'notAvailable');

const compactWindowPlacementChoices = getModularHomeOptionChoices('compact-timber-40', 'windowPlacement', getDefaultHomeConfig('compact-timber-40'));
assert.equal(compactWindowPlacementChoices.find((item) => item.visualToken === 'frontPanoramic')?.constraintStatus, 'requiresReview');
assert.equal(compactWindowPlacementChoices.find((item) => item.visualToken === 'cornerFeature')?.constraintStatus, 'requiresReview');

const saunaWindowPlacementChoices = getModularHomeOptionChoices('sauna-cabin-25', 'windowPlacement', saunaConfig);
assert.equal(saunaWindowPlacementChoices.find((item) => item.visualToken === 'cornerFeature')?.constraintStatus, 'notAvailable');
assert.equal(saunaWindowPlacementChoices.find((item) => item.visualToken === 'sidePrivacy')?.constraintStatus, 'compatible');

const compactDoorPlacementChoices = getModularHomeOptionChoices('compact-timber-40', 'doorPlacement', getDefaultHomeConfig('compact-timber-40'));
assert.equal(compactDoorPlacementChoices.find((item) => item.visualToken === 'sideEntry')?.constraintStatus, 'requiresReview');
assert.equal(compactDoorPlacementChoices.find((item) => item.visualToken === 'terraceFacing')?.constraintStatus, 'requiresReview');

const compactBoardOrientationChoices = getModularHomeOptionChoices('compact-timber-40', 'facadeBoardOrientation', getDefaultHomeConfig('compact-timber-40'));
assert.equal(compactBoardOrientationChoices.find((item) => item.visualToken === 'vertical')?.constraintStatus, 'compatible');
assert.equal(compactBoardOrientationChoices.find((item) => item.visualToken === 'vertical')?.productionConstraintSeverity, 'warning');

const compactBoardWidthChoices = getModularHomeOptionChoices('compact-timber-40', 'facadeBoardWidth', getDefaultHomeConfig('compact-timber-40'));
assert.equal(compactBoardWidthChoices.find((item) => item.visualToken === 'wide')?.productionConstraintSeverity, 'warning');

const compactFloorFinishChoices = getModularHomeOptionChoices('compact-timber-40', 'floorFinish', getDefaultHomeConfig('compact-timber-40'));
assert.equal(compactFloorFinishChoices.find((item) => item.visualToken === 'polishedConcrete')?.constraintStatus, 'requiresReview');

const saunaFloorFinishChoices = getModularHomeOptionChoices('sauna-cabin-25', 'floorFinish', saunaConfig);
assert.equal(saunaFloorFinishChoices.find((item) => item.visualToken === 'oakLaminate')?.constraintStatus, 'notAvailable');
assert.equal(saunaFloorFinishChoices.find((item) => item.visualToken === 'polishedConcrete')?.constraintStatus, 'requiresReview');

const compactFurniturePackageChoices = getModularHomeOptionChoices('compact-timber-40', 'furniturePackage', getDefaultHomeConfig('compact-timber-40'));
assert.equal(compactFurniturePackageChoices.find((item) => item.visualToken === 'premiumFurniture')?.constraintStatus, 'requiresReview');
assert.equal(compactFurniturePackageChoices.find((item) => item.visualToken === 'saunaPackage')?.constraintStatus, 'notAvailable');

const saunaFurniturePackageChoices = getModularHomeOptionChoices('sauna-cabin-25', 'furniturePackage', saunaConfig);
assert.equal(saunaFurniturePackageChoices.find((item) => item.visualToken === 'standardFurniture')?.constraintStatus, 'notAvailable');
assert.equal(saunaFurniturePackageChoices.find((item) => item.visualToken === 'saunaPackage')?.constraintStatus, 'compatible');
assert.equal(getModularHomeOptionChoices('sauna-cabin-25', 'sofa', saunaConfig).find((item) => item.visualToken === 'enabled')?.constraintStatus, 'notAvailable');

const compactNoTerraceDoorFacingConfig = {
  ...getDefaultHomeConfig('compact-timber-40'),
  terrace: 'none',
  doorPlacement: 'terraceFacing',
} as const;
assert.equal(validateHomeConfiguration(compactNoTerraceDoorFacingConfig), true);
assert.equal(
  getModularHomeProductionConstraints(compactNoTerraceDoorFacingConfig)
    .some((constraint) => constraint.id === 'terrace-facing-door-without-terrace-warning' && constraint.severity === 'warning'),
  true,
);

const materialIds = getModularHomeMaterials().map((material) => material.id);
assert.deepEqual(
  materialIds,
  [
    'natural-timber-siding',
    'dark-thermo-wood',
    'light-painted-facade',
    'metal-roof',
    'green-roof-placeholder',
    'interior-plywood',
    'bathroom-wet-core',
  ],
);

const selectedMaterialIds = getSelectedModularHomeMaterialIds({
  ...getDefaultHomeConfig('compact-timber-40'),
  facade: 'darkThermoWood',
  finishLevel: 'premium',
  roof: 'greenRoofPlaceholder',
});
assert.equal(selectedMaterialIds.includes('dark-thermo-wood'), true);
assert.equal(selectedMaterialIds.includes('green-roof-placeholder'), true);
assert.equal(selectedMaterialIds.includes('interior-plywood'), true);
assert.equal(selectedMaterialIds.includes('bathroom-wet-core'), true);

const expectedComponentCategories = [
  'bathroomCore',
  'facadeBoarding',
  'floorCassette',
  'foundationPad',
  'interiorFinish',
  'roofCassette',
  'wallPanel',
] as const;

assert.ok(MODULAR_HOME_COMPONENTS.length >= 12);
assert.equal(getComponentsForModule('compact-living-module').some((component) => component.category === 'wallPanel'), true);
assert.equal(getComponentsForModule('bathroom-core-module').some((component) => component.category === 'bathroomCore'), true);
assert.equal(getComponentsForModule('missing-module').length, 0);

assert.deepEqual(
  MODULAR_HOME_PRICING_CATEGORIES,
  [
    'material',
    'factoryLabor',
    'installation',
    'transport',
    'designEngineering',
    'margin',
    'vat',
    'contingency',
  ],
);
assert.equal(MODULAR_HOME_PRICING_CONTEXT.currency, 'EUR');
assert.equal(MODULAR_HOME_PRICING_CONTEXT.costRegion, 'eu-preview');
assert.equal(MODULAR_HOME_PRICING_CONTEXT.priceDate, '2026-06-06');
assert.equal(MODULAR_HOME_PRICING_CONTEXT.confidenceLevel, 'low');
assert.equal(getModularHomeEstimateConfidenceLabel('packageFixed'), 'Fixed package');
assert.equal(getModularHomeEstimateConfidenceLabel('estimated'), 'Estimate');
assert.equal(getModularHomeEstimateConfidenceLabel('siteDependent'), 'Site-dependent');
assert.equal(getModularHomeEstimateConfidenceLabel('requiresEngineering'), 'Engineering review');
assert.equal(getModularHomeEstimatePriceSourceLabel('internalPreview'), 'Internal preview');
assert.equal(getModularHomeEstimatePriceSourceLabel('supplierPlaceholder'), 'Supplier placeholder');
assert.equal(getModularHomeEstimatePriceSourceLabel('manualReviewRequired'), 'Manual review');

for (const module of MODULAR_HOME_MODULES) {
  assert.ok(getPricingCategoriesForModuleType(module.type).length > 0, `${module.id} should map to pricing categories`);
}

const visualOnlyOptionGroups = new Set(['kitchenFinish', 'furnitureMood', 'interiorZoneFocus']);

for (const option of MODULAR_HOME_OPTIONS) {
  const pricingCategories = getPricingCategoriesForOptionGroup(option.group);
  assert.ok(
    pricingCategories.length > 0 || visualOnlyOptionGroups.has(option.group),
    `${option.id} should map to pricing categories unless it is a visual-only option group`,
  );
}

for (const component of MODULAR_HOME_COMPONENTS) {
  assert.ok(getPricingCategoriesForComponentCategory(component.category).length > 0, `${component.id} should map to pricing categories`);
}

for (const product of getModularHomeProducts()) {
  const productComponents = getComponentsForProduct(product.id);
  assert.ok(productComponents.length > 0, `${product.id} should have component library entries`);
  assert.equal(MODULAR_HOME_PRODUCT_COMPONENT_LIBRARY[product.id].length, productComponents.length);

  const componentSummary = getComponentSummaryForConfig(getDefaultHomeConfig(product.id));
  const categories = new Set(componentSummary.map((item) => item.category));

  assert.ok(componentSummary.length > 0, `${product.id} should produce component summary rows`);
  assert.equal(componentSummary.every((item) => item.quantity > 0), true);
  assert.equal(componentSummary.every((item) => item.totalCost > 0), true);
  assert.equal(componentSummary.every((item) => (
    item.pricingBreakdown.material
    + item.pricingBreakdown.factoryLabor
    + item.pricingBreakdown.contingency
  ) > 0), true);

  for (const category of expectedComponentCategories) {
    assert.equal(categories.has(category), true, `${product.id} should include ${category}`);
  }
}

const compactComponentSummary = getComponentSummaryForConfig(getDefaultHomeConfig('compact-timber-40'));
const compactWallPanel = compactComponentSummary.find((item) => item.componentId === 'timber-wall-panel-system');
assert.ok(compactWallPanel);
assert.equal(compactWallPanel.category, 'wallPanel');
assert.equal(compactWallPanel.unit, 'm2');
assert.ok(compactWallPanel.quantity > 90);

const saunaComponentSummary = getComponentSummaryForConfig(getDefaultHomeConfig('sauna-cabin-25'));
assert.equal(saunaComponentSummary.some((item) => item.componentId === 'sauna-bench-package'), true);
assert.equal(saunaComponentSummary.some((item) => item.category === 'kitchenLine'), false);

const premiumFamilySummary = getComponentSummaryForConfig({
  ...getDefaultHomeConfig('family-timber-80'),
  finishLevel: 'premium',
  furniturePackage: 'premiumFurniture',
});
assert.equal(premiumFamilySummary.some((item) => item.componentId === 'premium-furniture-package'), true);

const compactComponentBom = calculateComponentBom(getDefaultHomeConfig('compact-timber-40'));
const compactBomCategories = new Set(compactComponentBom.groups.map((group) => group.category));
assert.equal(compactBomCategories.has('wallPanel'), true);
assert.equal(compactBomCategories.has('floorCassette'), true);
assert.equal(compactBomCategories.has('roofCassette'), true);
assert.equal(compactBomCategories.has('windowUnit'), true);
assert.equal(compactBomCategories.has('doorUnit'), true);
assert.equal(compactBomCategories.has('facadeBoarding'), true);
assert.equal(compactComponentBom.disclaimer, 'Preview component BOM · production verification required');
assert.ok(compactComponentBom.materialCostEstimate > 0);
assert.ok(compactComponentBom.laborCostEstimate > 0);
assert.ok(compactComponentBom.wasteCostEstimate > 0);
assert.equal(compactComponentBom.pricingContext.currency, 'EUR');
assert.equal(compactComponentBom.pricingCategoryTotals.some((item) => item.category === 'material'), true);
assert.equal(compactComponentBom.pricingCategoryTotals.some((item) => item.category === 'factoryLabor'), true);
assert.equal(compactComponentBom.pricingCategoryTotals.some((item) => item.category === 'contingency'), true);

const compactKitchenOffComponentBom = calculateComponentBom({
  ...getDefaultHomeConfig('compact-timber-40'),
  kitchenLine: 'disabled',
});
assert.equal(compactKitchenOffComponentBom.groups.some((group) => group.category === 'kitchenLine'), false);

const compactEmptyFurnitureComponentBom = calculateComponentBom({
  ...getDefaultHomeConfig('compact-timber-40'),
  furniturePackage: 'emptyShell',
});
assert.equal(compactEmptyFurnitureComponentBom.groups.some((group) => group.category === 'furniturePackage'), false);

const compactManufacturingBom = calculateManufacturingBomPreview(getDefaultHomeConfig('compact-timber-40'));
assert.equal(compactManufacturingBom.disclaimer, 'Manufacturing BOM preview · production cut list requires engineering verification.');
assert.equal(compactManufacturingBom.openingSchedule.length > 0, true);
assert.equal(compactManufacturingBom.openingScheduleSummary.windowCount > 0, true);
assert.equal(compactManufacturingBom.openingScheduleSummary.doorCount > 0, true);
assert.equal(compactManufacturingBom.componentCodes.length > 0, true);
assert.equal(compactManufacturingBom.componentCodes.some((code) => code.startsWith('MHC-')), true);
assert.equal(compactManufacturingBom.assemblyGroups.length >= 5, true);
assert.equal(compactManufacturingBom.assemblyGroups.some((group) => group.assemblyGroupId === 'assembly-module-shells'), true);
assert.equal(compactManufacturingBom.assemblyGroups.some((group) => group.assemblyGroupId === 'assembly-facade-boards'), true);
assert.equal(compactManufacturingBom.assemblyGroups.every((group) => group.componentCodes.length > 0 || group.quantity === 0), true);
assert.equal(compactManufacturingBom.panelGroups.length >= 3, true);
assert.equal(compactManufacturingBom.panelGroups.every((group) => group.panelCount > 0), true);
assert.equal(compactManufacturingBom.panelGroups.every((group) => group.approximatePanelDimensions.length === 2), true);
assert.equal(compactManufacturingBom.panelGroups.every((group) => group.panelGroupId.startsWith('PG-') && group.componentCode.startsWith('MHC-')), true);
assert.equal(compactManufacturingBom.panelSizeGroups.length >= compactManufacturingBom.panelGroups.length * 2, true);
assert.equal(compactManufacturingBom.panelSizeGroups.every((group) => group.panelCount > 0 && group.dimensions.includes('m')), true);
assert.equal(compactManufacturingBom.panelSizeGroups.every((group) => group.panelSizeGroupId.startsWith('PSG-') && group.panelGroupId.startsWith('PG-')), true);
assert.equal(compactManufacturingBom.boardLengthGroups.length >= 2, true);
assert.equal(compactManufacturingBom.boardLengthGroups.every((group) => group.quantity > 0 && group.lengthM > 0), true);
assert.equal(compactManufacturingBom.boardLengthGroups.some((group) => group.boardLengthCategory === 'primary-elevation-boards'), true);
assert.equal(compactManufacturingBom.boardLengthGroups.every((group) => group.assemblyGroupId === 'assembly-facade-boards' && group.componentCode.startsWith('MHC-')), true);
assert.equal(compactManufacturingBom.fastenerHardwarePlaceholders.length >= 3, true);
assert.equal(compactManufacturingBom.fastenerHardwarePlaceholders.every((item) => item.quantity > 0 && item.notes.length > 0), true);
assert.equal(compactManufacturingBom.fastenerHardwarePlaceholders.every((item) => item.hardwareGroupId.startsWith('hardware-') && item.componentCode.length > 0), true);
assert.equal(compactManufacturingBom.wasteFactorsByMaterial.some((item) => item.id === 'waste-facade-boarding'), true);
assert.equal(compactManufacturingBom.wasteFactorsByMaterial.every((item) => item.wasteFactor >= 0), true);
assert.equal(compactManufacturingBom.wasteFactorsByMaterial.every((item) => item.materialCategory.length > 0 && item.componentCode.length > 0), true);
assert.equal(compactManufacturingBom.productionBatchNotes.some((note) => note.includes('Batch preview')), true);
assert.equal(compactManufacturingBom.transportPackageNotes.some((note) => note.includes('Transport package preview')), true);
assert.ok(compactManufacturingBom.facadeBoardLinearM > compactManufacturingBom.facadeBoardAreaM2);
assert.ok(compactManufacturingBom.roofCassetteAreaM2 > 0);
assert.ok(compactManufacturingBom.floorCassetteAreaM2 > 0);
assert.ok(compactManufacturingBom.windowSchedule.reduce((total, item) => total + item.quantity, 0) > 0);
assert.ok(compactManufacturingBom.doorSchedule.reduce((total, item) => total + item.quantity, 0) > 0);
assert.equal(compactManufacturingBom.openingSchedule.some((item) => item.type === 'interiorDoorPlaceholder'), true);
assert.equal(compactManufacturingBom.productionVerificationNotes.some((note) => note.includes('not a factory-approved cut list')), true);
assert.equal(compactManufacturingBom.productionVerificationNotes.some((note) => note.includes('Manufacturing BOM v2 adds component codes')), true);
assert.equal(compactManufacturingBom.productionVerificationNotes.some((note) => note.includes('cut-list readiness aids only')), true);
assert.equal(calculateManufacturingBomPreview({
  ...getDefaultHomeConfig('compact-timber-40'),
  terrace: 'none',
}).terraceDeckSchedule.length, 0);
const compactDetailManufacturingBom = calculateManufacturingBomPreview({
  ...getDefaultHomeConfig('compact-timber-40'),
  facadeBoardOrientation: 'vertical',
  facadeBoardWidth: 'narrow',
  floorFinish: 'oakLaminate',
  interiorWallFinish: 'paintedWhite',
  roofEdgeColor: 'bronze',
  windowFrameColor: 'graphite',
});
assert.ok(compactDetailManufacturingBom.facadeBoardLinearM > compactManufacturingBom.facadeBoardLinearM);
assert.ok(compactDetailManufacturingBom.boardLengthGroups.reduce((total, group) => total + group.quantity, 0) > compactManufacturingBom.boardLengthGroups.reduce((total, group) => total + group.quantity, 0));
assert.equal(compactDetailManufacturingBom.productionVerificationNotes.some((note) => note.includes('vertical orientation / narrow width')), true);
assert.equal(compactDetailManufacturingBom.productionVerificationNotes.some((note) => note.includes('paintedWhite interior walls / plainPanel wall panel style / oakLaminate floor finish / utilityPlywood floor style')), true);const compactStandardOpeningSchedule = calculateOpeningSchedule(getDefaultHomeConfig('compact-timber-40'));
assert.equal(compactStandardOpeningSchedule.some((item) => item.type === 'window' && item.wallSide === 'front'), true);
assert.equal(compactStandardOpeningSchedule.some((item) => item.type === 'exteriorDoor' && item.wallSide === 'front'), true);

const compactPanoramicOpeningSchedule = calculateOpeningSchedule({
  ...getDefaultHomeConfig('compact-timber-40'),
  windowPackage: 'panoramicWindows',
  windowPlacement: 'frontPanoramic',
});
assert.equal(compactPanoramicOpeningSchedule.some((item) => item.reviewRequirement?.includes('engineering') ?? false), true);
assert.ok(
  compactPanoramicOpeningSchedule
    .filter((item) => item.type === 'window' && item.wallSide === 'front')
    .some((item) => item.widthMm >= 1800),
);

const familyStandardOpeningSchedule = calculateOpeningSchedule(getDefaultHomeConfig('family-timber-80'));
const familyExtraOpeningSchedule = calculateOpeningSchedule({
  ...getDefaultHomeConfig('family-timber-80'),
  dimensionPreset: 'familyExtraBedroomModule',
});
assert.ok(
  familyExtraOpeningSchedule.reduce((total, item) => total + item.quantity, 0)
  > familyStandardOpeningSchedule.reduce((total, item) => total + item.quantity, 0),
);

const saunaStandardOpeningSchedule = calculateOpeningSchedule(getDefaultHomeConfig('sauna-cabin-25'));
const saunaDeepOpeningSchedule = calculateOpeningSchedule({
  ...getDefaultHomeConfig('sauna-cabin-25'),
  dimensionPreset: 'saunaDeepTerrace',
  doorPackage: 'terraceSlider',
  doorPlacement: 'terraceFacing',
  terrace: 'frontDeck',
});
assert.ok(
  saunaDeepOpeningSchedule.some((item) => item.type === 'terraceDoor' && item.widthMm > 2400),
);
assert.ok(
  saunaDeepOpeningSchedule.reduce((total, item) => total + item.estimateImpact, 0)
  >= saunaStandardOpeningSchedule.reduce((total, item) => total + item.estimateImpact, 0),
);

const compactStandardWindowEstimate = calculateModularHomeEstimate({
  ...getDefaultHomeConfig('compact-timber-40'),
  windowPackage: 'standardWindows',
});
assert.equal(compactStandardWindowEstimate.pricing.currency, 'EUR');
assert.equal(compactStandardWindowEstimate.pricing.priceDate, '2026-06-06');
assert.equal(compactStandardWindowEstimate.pricing.confidenceLevel, 'low');
assert.equal(compactStandardWindowEstimate.pricing.categoryTotals.some((item) => item.category === 'material'), true);
assert.equal(compactStandardWindowEstimate.pricing.categoryTotals.some((item) => item.category === 'factoryLabor'), true);
assert.equal(compactStandardWindowEstimate.pricing.categoryTotals.some((item) => item.category === 'installation'), true);
assert.equal(compactStandardWindowEstimate.pricing.categoryTotals.some((item) => item.category === 'transport'), true);
assert.equal(compactStandardWindowEstimate.pricing.categoryTotals.some((item) => item.category === 'vat'), true);
assert.equal(compactStandardWindowEstimate.lineItems.every((item) => typeof item.pricingBreakdown.material === 'number'), true);
assert.equal(
  compactStandardWindowEstimate.lineItems.every((item) => (
    ['packageFixed', 'estimated', 'siteDependent', 'requiresEngineering'].includes(item.confidence)
    && ['internalPreview', 'supplierPlaceholder', 'manualReviewRequired'].includes(item.priceSource)
    && ['internalDatabase', 'supplierBudgetPlaceholder', 'manualReview'].includes(item.sourceType)
    && item.lastUpdated === '2026-06-06'
    && item.currency === 'EUR'
    && item.region === 'eu-preview'
    && item.supplierPlaceholder.length > 0
    && item.pricingAssumptions.marginAssumption.length > 0
    && item.pricingAssumptions.wasteAssumption.length > 0
    && item.pricingAssumptions.notes.length >= 2
    && item.notes.length > 0
  )),
  true,
);
assert.equal(
  compactStandardWindowEstimate.optionalServices.every((item) => (
    item.confidence === 'siteDependent'
    && item.priceSource === 'manualReviewRequired'
    && item.lastUpdated === '2026-06-06'
    && item.notes.some((note) => note.includes('Site-dependent allowance'))
  )),
  true,
);
assert.equal(compactStandardWindowEstimate.vatEstimate.confidence, 'estimated');
assert.equal(compactStandardWindowEstimate.vatEstimate.priceSource, 'internalPreview');
assert.equal(compactStandardWindowEstimate.vatEstimate.lastUpdated, '2026-06-06');
assert.equal(compactStandardWindowEstimate.priceConfidenceVersion, 'v5');
assert.deepEqual(
  compactStandardWindowEstimate.scenarios.map((scenario) => scenario.id),
  ['base', 'expected', 'premium', 'siteDependentExtras'],
);
const compactBaseScenario = compactStandardWindowEstimate.scenarios.find((scenario) => scenario.id === 'base');
const compactExpectedScenario = compactStandardWindowEstimate.scenarios.find((scenario) => scenario.id === 'expected');
const compactPremiumScenario = compactStandardWindowEstimate.scenarios.find((scenario) => scenario.id === 'premium');
const compactSiteExtrasScenario = compactStandardWindowEstimate.scenarios.find((scenario) => scenario.id === 'siteDependentExtras');
assert.ok(compactBaseScenario);
assert.ok(compactExpectedScenario);
assert.ok(compactPremiumScenario);
assert.ok(compactSiteExtrasScenario);
assert.equal(compactBaseScenario.confidence, 'estimated');
assert.equal(compactExpectedScenario.confidence, 'siteDependent');
assert.equal(compactPremiumScenario.confidence, 'requiresEngineering');
assert.equal(compactSiteExtrasScenario.confidence, 'siteDependent');
assert.equal(compactExpectedScenario.amount, compactStandardWindowEstimate.estimatedTotal);
assert.ok(compactBaseScenario.amount < compactExpectedScenario.amount);
assert.ok(compactPremiumScenario.amount > compactExpectedScenario.amount);
assert.equal(compactSiteExtrasScenario.amount, compactStandardWindowEstimate.optionalServicesTotal);
assert.equal(compactSiteExtrasScenario.isAdditiveAllowance, true);
assert.equal(compactStandardWindowEstimate.scenarios.every((scenario) => (
  scenario.exclusions.length > 0
  && scenario.finalQuoteRequirement.toLowerCase().includes('quote')
  && scenario.included.length > 0
  && scenario.notes.length > 0
  && scenario.vatMarginNote.toLowerCase().includes('vat')
  && scenario.lastUpdated === '2026-06-06'
)), true);
assert.equal(compactStandardWindowEstimate.scenarios.some((scenario) => scenario.priceSource === 'manualReviewRequired'), true);
assert.deepEqual(
  compactStandardWindowEstimate.sections.map((section) => section.id),
  [
    'modulePackage',
    'materials',
    'factoryLabor',
    'finishPackage',
    'terraceExtensions',
    'transportPlaceholder',
    'installationPlaceholder',
    'designEngineeringPlaceholder',
    'vatMarginContingency',
    'excludedSiteDependent',
  ],
);
assert.equal(compactStandardWindowEstimate.sections.every((section) => section.lineItems.length > 0), true);
assert.equal(
  compactStandardWindowEstimate.sections.every((section) => (
    section.lineItems.every((item) => (
      item.label.length > 0
      && item.quantity.length > 0
      && item.unit.length > 0
      && ['packageFixed', 'estimated', 'siteDependent', 'requiresEngineering'].includes(item.confidence)
      && ['internalPreview', 'supplierPlaceholder', 'manualReviewRequired'].includes(item.priceSource)
      && ['internalDatabase', 'supplierBudgetPlaceholder', 'manualReview'].includes(item.sourceType)
      && item.lastUpdated === '2026-06-06'
      && item.currency === 'EUR'
      && item.region === 'eu-preview'
      && item.supplierPlaceholder.length > 0
      && item.pricingAssumptions.marginAssumption.length > 0
      && item.pricingAssumptions.wasteAssumption.length > 0
      && item.notes.length > 0
      && Object.hasOwn(item, 'unitCost')
      && Object.hasOwn(item, 'subtotal')
    ))
  )),
  true,
);
assert.equal(
  compactStandardWindowEstimate.sections.some((section) => section.lineItems.some((item) => item.sourceType === 'supplierBudgetPlaceholder')),
  true,
);
assert.equal(
  compactStandardWindowEstimate.sections.some((section) => section.lineItems.some((item) => item.sourceType === 'manualReview')),
  true,
);
assert.equal(compactStandardWindowEstimate.sections.find((section) => section.id === 'modulePackage')?.confidence, 'estimated');
assert.equal(
  compactStandardWindowEstimate.sections
    .find((section) => section.id === 'modulePackage')
    ?.lineItems.find((item) => item.id.includes('base-modules'))
    ?.confidence,
  'packageFixed',
);
assert.equal(
  compactStandardWindowEstimate.sections
    .find((section) => section.id === 'transportPlaceholder')
    ?.lineItems.every((item) => item.confidence === 'siteDependent' && item.priceSource === 'manualReviewRequired'),
  true,
);
assert.equal(
  compactStandardWindowEstimate.sections
    .find((section) => section.id === 'designEngineeringPlaceholder')
    ?.lineItems.every((item) => item.confidence === 'requiresEngineering' && item.priceSource === 'manualReviewRequired'),
  true,
);
assert.equal(
  compactStandardWindowEstimate.sections
    .find((section) => section.id === 'vatMarginContingency')
    ?.lineItems.find((item) => item.id.includes('vat-placeholder'))
    ?.confidence,
  'estimated',
);
assert.equal(
  compactStandardWindowEstimate.sections
    .find((section) => section.id === 'vatMarginContingency')
    ?.lineItems.find((item) => item.id.includes('vat-placeholder'))
    ?.priceSource,
  'internalPreview',
);
assert.equal(compactStandardWindowEstimate.sections.find((section) => section.id === 'excludedSiteDependent')?.lineItems.every((item) => (
  item.subtotal === null
  && item.unitCost === null
  && item.isExcluded === true
  && item.confidence === 'requiresEngineering'
  && item.priceSource === 'manualReviewRequired'
)), true);
const compactGreenRoofEstimate = calculateModularHomeEstimate({
  ...getDefaultHomeConfig('compact-timber-40'),
  roof: 'greenRoofPlaceholder',
});
const compactGreenRoofLineItem = compactGreenRoofEstimate.lineItems.find((item) => item.category === 'roof');
assert.equal(compactGreenRoofLineItem?.confidence, 'requiresEngineering');
assert.equal(compactGreenRoofLineItem?.priceSource, 'manualReviewRequired');
assert.equal(
  compactGreenRoofLineItem?.notes.some((note) => (
    note.includes('engineering') || note.includes('manual production')
  )),
  true,
);
const compactPanoramicWindowEstimate = calculateModularHomeEstimate({
  ...getDefaultHomeConfig('compact-timber-40'),
  windowPackage: 'panoramicWindows',
});
assert.ok(compactPanoramicWindowEstimate.estimatedTotal > compactStandardWindowEstimate.estimatedTotal);
assert.equal(compactPanoramicWindowEstimate.selectedOptions.windowPackage, 'Panoramic glazing');

const compactBalancedPlacementEstimate = calculateModularHomeEstimate({
  ...getDefaultHomeConfig('compact-timber-40'),
  windowPlacement: 'balanced',
});
const compactFrontPlacementEstimate = calculateModularHomeEstimate({
  ...getDefaultHomeConfig('compact-timber-40'),
  windowPlacement: 'frontPanoramic',
});
assert.ok(compactFrontPlacementEstimate.estimatedTotal > compactBalancedPlacementEstimate.estimatedTotal);
assert.equal(compactFrontPlacementEstimate.selectedOptions.windowPlacement, 'Front panoramic placement');

const compactWideDimensionSummary = getModularHomeDimensionSummary({
  ...getDefaultHomeConfig('compact-timber-40'),
  dimensionPreset: 'compactWideLiving',
});
assert.equal(compactWideDimensionSummary.dimensionPresetLabel, 'Compact wide living');
assert.equal(compactWideDimensionSummary.floorAreaM2, 44);
assert.equal(compactWideDimensionSummary.footprintWidthM, 8.8);

const compactWideRoomSummary = getModularHomeRoomMeasurementSummary({
  ...getDefaultHomeConfig('compact-timber-40'),
  dimensionPreset: 'compactWideLiving',
});
assert.equal(compactWideRoomSummary.floorAreaM2, 44);
assert.ok(compactWideRoomSummary.roomAreaTotalM2 > 40);

const familyExtraPreset = getModularHomeDimensionPresetForConfig({
  ...getDefaultHomeConfig('family-timber-80'),
  dimensionPreset: 'familyExtraBedroomModule',
});
assert.ok(familyExtraPreset);
assert.equal(familyExtraPreset.id, 'familyExtraBedroomModule');

const familyStandardQuantities = calculateModularHomeQuantities(getDefaultHomeConfig('family-timber-80'));
const familyExtraQuantities = calculateModularHomeQuantities({
  ...getDefaultHomeConfig('family-timber-80'),
  dimensionPreset: 'familyExtraBedroomModule',
});
assert.ok(familyExtraQuantities.grossFloorAreaM2 > familyStandardQuantities.grossFloorAreaM2);
assert.ok(familyExtraQuantities.moduleCount > familyStandardQuantities.moduleCount);
assert.ok(familyExtraQuantities.transportModuleCount > familyStandardQuantities.transportModuleCount);

const saunaStandardQuantities = calculateModularHomeQuantities(getDefaultHomeConfig('sauna-cabin-25'));
const saunaDeepTerraceQuantities = calculateModularHomeQuantities({
  ...getDefaultHomeConfig('sauna-cabin-25'),
  dimensionPreset: 'saunaDeepTerrace',
});
assert.ok(saunaDeepTerraceQuantities.terraceAreaM2 > saunaStandardQuantities.terraceAreaM2);

const compactStandardDoorEstimate = calculateModularHomeEstimate({
  ...getDefaultHomeConfig('compact-timber-40'),
  doorPackage: 'standardEntry',
});
const compactSliderDoorEstimate = calculateModularHomeEstimate({
  ...getDefaultHomeConfig('compact-timber-40'),
  doorPackage: 'terraceSlider',
});
assert.ok(compactSliderDoorEstimate.estimatedTotal > compactStandardDoorEstimate.estimatedTotal);
assert.equal(compactSliderDoorEstimate.selectedOptions.doorPackage, 'Terrace slider');

const compactFrontDoorPlacementEstimate = calculateModularHomeEstimate({
  ...getDefaultHomeConfig('compact-timber-40'),
  doorPlacement: 'frontEntry',
});
const compactTerraceDoorPlacementEstimate = calculateModularHomeEstimate({
  ...getDefaultHomeConfig('compact-timber-40'),
  doorPlacement: 'terraceFacing',
});
assert.ok(compactTerraceDoorPlacementEstimate.estimatedTotal > compactFrontDoorPlacementEstimate.estimatedTotal);
assert.equal(compactTerraceDoorPlacementEstimate.selectedOptions.doorPlacement, 'Terrace-facing placement');

const compactDetailEstimate = calculateModularHomeEstimate({
  ...getDefaultHomeConfig('compact-timber-40'),
  facadeBoardOrientation: 'vertical',
  facadeBoardProfile: 'shadowGap',
  facadeBoardSpacing: 'tight',
  facadeBoardWidth: 'narrow',
  floorFinish: 'oakLaminate',
  interiorFloorStyle: 'warmPlank',
  interiorWallFinish: 'warmPanel',
  roofEdgeColor: 'bronze',
  roofGutterStyle: 'boxGutter',
  trimColor: 'bronze',
  windowFrameColor: 'graphite',
  windowFrameType: 'deepReveal',
  wallPanelStyle: 'ribbedPanel',
});
assert.ok(compactDetailEstimate.estimatedTotal > compactStandardWindowEstimate.estimatedTotal);
assert.equal(compactDetailEstimate.selectedOptions.facadeBoardOrientation, 'Vertical boards');
assert.equal(compactDetailEstimate.selectedOptions.facadeBoardWidth, 'Narrow boards');
assert.equal(compactDetailEstimate.selectedOptions.facadeBoardProfile, 'Shadow-gap boards');
assert.equal(compactDetailEstimate.selectedOptions.facadeBoardSpacing, 'Tight spacing');
assert.equal(compactDetailEstimate.selectedOptions.trimColor, 'Bronze trim');
assert.equal(compactDetailEstimate.selectedOptions.roofEdgeColor, 'Bronze roof edge');
assert.equal(compactDetailEstimate.selectedOptions.roofGutterStyle, 'Box gutter');
assert.equal(compactDetailEstimate.selectedOptions.windowFrameColor, 'Graphite frames');
assert.equal(compactDetailEstimate.selectedOptions.windowFrameType, 'Deep reveal frame');
assert.equal(compactDetailEstimate.selectedOptions.interiorWallFinish, 'Warm panel walls');
assert.equal(compactDetailEstimate.selectedOptions.floorFinish, 'Oak laminate floor');
assert.equal(compactDetailEstimate.selectedOptions.interiorFloorStyle, 'Warm plank lines');
assert.equal(compactDetailEstimate.selectedOptions.wallPanelStyle, 'Ribbed wall panels');
assert.equal(compactDetailEstimate.lineItems.some((item) => item.category === 'floorFinish' && item.amount > 0), true);
assert.equal(compactDetailEstimate.lineItems.some((item) => item.category === 'facadeBoardProfile' && item.amount > 0), true);
assert.equal(compactDetailEstimate.lineItems.some((item) => item.category === 'facadeBoardSpacing' && item.amount > 0), true);
assert.equal(compactDetailEstimate.lineItems.some((item) => item.category === 'roofGutterStyle' && item.amount > 0), true);
assert.equal(compactDetailEstimate.lineItems.some((item) => item.category === 'windowFrameType' && item.amount > 0), true);
assert.equal(compactDetailEstimate.lineItems.some((item) => item.category === 'interiorFloorStyle' && item.amount > 0), true);
assert.equal(compactDetailEstimate.lineItems.some((item) => item.category === 'wallPanelStyle' && item.amount > 0), true);

const compactEmptyFurnitureEstimate = calculateModularHomeEstimate({
  ...getDefaultHomeConfig('compact-timber-40'),
  furniturePackage: 'emptyShell',
  sofa: 'disabled',
  table: 'disabled',
  bed: 'disabled',
  kitchenLine: 'disabled',
  wardrobePlaceholder: 'disabled',
});
const compactPremiumFurnitureEstimate = calculateModularHomeEstimate({
  ...getDefaultHomeConfig('compact-timber-40'),
  furniturePackage: 'premiumFurniture',
});
assert.ok(compactPremiumFurnitureEstimate.estimatedTotal > compactEmptyFurnitureEstimate.estimatedTotal);
assert.equal(compactPremiumFurnitureEstimate.selectedOptions.furniturePackage, 'Premium furniture');
assert.equal(compactPremiumFurnitureEstimate.selectedOptions.sofa, 'Sofa on');
assert.equal(compactPremiumFurnitureEstimate.selectedOptions.table, 'Table on');
assert.equal(compactPremiumFurnitureEstimate.selectedOptions.bed, 'Bed on');
assert.equal(compactPremiumFurnitureEstimate.selectedOptions.kitchenLine, 'Kitchen line on');
assert.equal(compactPremiumFurnitureEstimate.selectedOptions.wardrobePlaceholder, 'Wardrobe on');
assert.equal(compactPremiumFurnitureEstimate.lineItems.some((item) => item.category === 'furniturePackage' && item.amount > 0), true);
assert.equal(compactPremiumFurnitureEstimate.lineItems.some((item) => item.category === 'sofa' && item.amount > 0), true);

const compactWorkspaceProject = createModularHomeLocalProject({
  config: getDefaultHomeConfig('compact-timber-40'),
  estimateTotal: compactStandardWindowEstimate.estimatedTotal,
  productId: 'compact-timber-40',
  projectName: 'Compact baseline',
});
const compactPanoramicWorkspaceProject = createModularHomeLocalProject({
  config: {
    ...getDefaultHomeConfig('compact-timber-40'),
    windowPackage: 'panoramicWindows',
    windowPlacement: 'cornerFeature',
  },
  estimateTotal: compactPanoramicWindowEstimate.estimatedTotal,
  productId: 'compact-timber-40',
  projectName: 'Compact panoramic',
});
const workspaceComparison = createModularHomeProjectComparison(
  compactWorkspaceProject,
  compactPanoramicWorkspaceProject,
);
const workspaceComparisonAlias = compareModularHomeProjects(
  compactWorkspaceProject,
  compactPanoramicWorkspaceProject,
);
assert.equal(compactWorkspaceProject.projectName, 'Compact baseline');
assert.equal(compactPanoramicWorkspaceProject.projectName, 'Compact panoramic');
assert.ok(workspaceComparison.estimateDelta > 0);
assert.equal(workspaceComparisonAlias.estimateDelta, workspaceComparison.estimateDelta);
assert.equal(workspaceComparison.changedOptionCount, 2);
assert.equal(workspaceComparison.recommendationNote, 'This comparison is preview-only and requires final review.');
assert.equal(workspaceComparison.savedSummary.product, 'Compact Timber 40');
assert.equal(workspaceComparison.currentSummary.product, 'Compact Timber 40');
assert.equal(workspaceComparison.savedSummary.moduleCount, 2);
assert.equal(workspaceComparison.currentSummary.moduleCount, 2);
assert.equal(workspaceComparison.currentSummary.confidenceSummary.reviewLineCount >= workspaceComparison.savedSummary.confidenceSummary.reviewLineCount, true);
assert.equal(workspaceComparison.savedSummary.confidenceSummary.confidenceLabels.includes('Estimate'), true);
assert.equal(workspaceComparison.currentSummary.confidenceSummary.priceSourceLabels.includes('Manual review'), true);
assert.equal(workspaceComparison.confidenceNotes.some((note) => note.includes('preview-only')), true);
assert.equal(
  workspaceComparison.options.find((option) => option.key === 'product')?.savedValue,
  'Compact Timber 40',
);
assert.equal(
  workspaceComparison.options.find((option) => option.key === 'product')?.hasChanged,
  false,
);
assert.equal(
  workspaceComparison.options.find((option) => option.key === 'windowPackage')?.hasChanged,
  true,
);
assert.equal(
  workspaceComparison.options.find((option) => option.key === 'windowPlacement')?.hasChanged,
  true,
);
assert.equal(
  workspaceComparison.options.find((option) => option.key === 'facade')?.hasChanged,
  false,
);
assert.ok(workspaceComparison.bomSummary.componentSubtotalDelta > 0);
assert.ok(workspaceComparison.majorBomCategoryDeltas.some((item) => (
  item.category === 'windowUnit'
  && item.status === 'changed'
  && item.costDelta > 0
)));
assert.ok(workspaceComparison.componentDeltas.some((item) => (
  item.id === 'panoramic-window-unit'
  && item.status === 'added'
  && item.costDelta > 0
)));
assert.ok(workspaceComparison.componentDeltas.some((item) => (
  item.id === 'standard-window-unit'
  && item.status === 'removed'
  && item.costDelta < 0
)));

const familyWorkspaceConfig = getDefaultHomeConfig('family-timber-80');
const familyWorkspaceEstimate = calculateModularHomeEstimate(familyWorkspaceConfig);
const familyWorkspaceProject = createModularHomeLocalProject({
  config: familyWorkspaceConfig,
  estimateTotal: familyWorkspaceEstimate.estimatedTotal,
  productId: 'family-timber-80',
  projectName: 'Family baseline',
});
const compactVsFamilyComparison = createModularHomeProjectComparison(
  compactWorkspaceProject,
  familyWorkspaceProject,
);
assert.equal(compactVsFamilyComparison.options.find((option) => option.key === 'product')?.hasChanged, true);
assert.ok(compactVsFamilyComparison.estimateDelta > 0);
assert.ok(compactVsFamilyComparison.bomSummary.moduleCountDelta > 0);
assert.ok(compactVsFamilyComparison.bomSummary.componentSubtotalDelta > workspaceComparison.bomSummary.componentSubtotalDelta);
assert.equal(compactVsFamilyComparison.savedSummary.product, 'Compact Timber 40');
assert.equal(compactVsFamilyComparison.currentSummary.product, 'Family Timber 80');
assert.ok(compactVsFamilyComparison.currentSummary.moduleCount > compactVsFamilyComparison.savedSummary.moduleCount);
assert.ok(compactVsFamilyComparison.majorBomCategoryDeltas.some((item) => (
  item.category === 'wallPanel'
  && item.costDelta > 0
)));
assert.ok(compactVsFamilyComparison.moduleDeltas.some((item) => (
  item.id === 'family-bedroom-module'
  && item.status === 'added'
  && item.currentQuantity === 2
)));
assert.ok(compactVsFamilyComparison.moduleDeltas.some((item) => (
  item.id === 'compact-bedroom-module'
  && item.status === 'removed'
)));

const compactPanoramicBom = calculateComponentBom({
  ...getDefaultHomeConfig('compact-timber-40'),
  windowPackage: 'panoramicWindows',
});
const compactPrivacyBom = calculateComponentBom({
  ...getDefaultHomeConfig('compact-timber-40'),
  windowPackage: 'compactPrivacy',
});
assert.equal(compactPanoramicBom.items.some((item) => item.componentId === 'panoramic-window-unit'), true);
assert.equal(compactPrivacyBom.items.some((item) => item.componentId === 'privacy-window-unit'), true);
assert.ok(
  (compactPanoramicBom.groups.find((group) => group.category === 'windowUnit')?.subtotal ?? 0)
  > (compactComponentBom.groups.find((group) => group.category === 'windowUnit')?.subtotal ?? 0),
);

const compactSliderDoorBom = calculateComponentBom({
  ...getDefaultHomeConfig('compact-timber-40'),
  doorPackage: 'terraceSlider',
});
assert.equal(compactSliderDoorBom.items.some((item) => item.componentId === 'terrace-slider-door-unit'), true);
assert.ok(
  (compactSliderDoorBom.groups.find((group) => group.category === 'doorUnit')?.subtotal ?? 0)
  > (compactComponentBom.groups.find((group) => group.category === 'doorUnit')?.subtotal ?? 0),
);

const compactFrontPlacementBom = calculateComponentBom({
  ...getDefaultHomeConfig('compact-timber-40'),
  windowPlacement: 'frontPanoramic',
});
const compactCornerPlacementBom = calculateComponentBom({
  ...getDefaultHomeConfig('compact-timber-40'),
  windowPlacement: 'cornerFeature',
});
assert.ok(
  (compactFrontPlacementBom.groups.find((group) => group.category === 'windowUnit')?.subtotal ?? 0)
  > (compactComponentBom.groups.find((group) => group.category === 'windowUnit')?.subtotal ?? 0),
);
assert.ok(
  (compactCornerPlacementBom.groups.find((group) => group.category === 'windowUnit')?.subtotal ?? 0)
  > (compactFrontPlacementBom.groups.find((group) => group.category === 'windowUnit')?.subtotal ?? 0),
);

const compactTerraceDoorPlacementBom = calculateComponentBom({
  ...getDefaultHomeConfig('compact-timber-40'),
  doorPlacement: 'terraceFacing',
});
assert.ok(
  (compactTerraceDoorPlacementBom.groups.find((group) => group.category === 'doorUnit')?.subtotal ?? 0)
  > (compactComponentBom.groups.find((group) => group.category === 'doorUnit')?.subtotal ?? 0),
);

const compactFrontDeckEstimate = calculateModularHomeEstimate({
  ...getDefaultHomeConfig('compact-timber-40'),
  terrace: 'frontDeck',
});
const compactSideTerraceEstimate = calculateModularHomeEstimate({
  ...getDefaultHomeConfig('compact-timber-40'),
  terrace: 'sideTerrace',
});
const compactCoveredTerraceEstimate = calculateModularHomeEstimate(compactCoveredTerraceConfig);
assert.ok(compactSideTerraceEstimate.estimatedTotal > compactFrontDeckEstimate.estimatedTotal);
assert.ok(compactCoveredTerraceEstimate.estimatedTotal > compactSideTerraceEstimate.estimatedTotal);
assert.equal(compactCoveredTerraceEstimate.selectedOptions.terrace, 'Covered terrace placeholder');
assert.equal(
  compactCoveredTerraceEstimate.scopeOfSupply
    .find((section) => section.id === 'included')
    ?.items.some((item) => item.includes('Covered terrace placeholder extension package')),
  true,
);
assert.equal(
  compactCoveredTerraceEstimate.scopeOfSupply
    .find((section) => section.id === 'optional')
    ?.items.includes('Terrace foundation and structural review'),
  true,
);

const compactSideTerraceBom = calculateComponentBom({
  ...getDefaultHomeConfig('compact-timber-40'),
  terrace: 'sideTerrace',
});
const compactCoveredTerraceBom = calculateComponentBom(compactCoveredTerraceConfig);
assert.equal(compactSideTerraceBom.items.some((item) => item.componentId === 'side-terrace-deck-system'), true);
assert.equal(compactCoveredTerraceBom.items.some((item) => item.componentId === 'covered-terrace-deck-system'), true);
assert.equal(compactCoveredTerraceBom.items.some((item) => item.componentId === 'covered-terrace-roof-placeholder'), true);
assert.ok(
  (compactCoveredTerraceBom.groups.find((group) => group.category === 'terraceDeck')?.subtotal ?? 0)
  > (compactSideTerraceBom.groups.find((group) => group.category === 'terraceDeck')?.subtotal ?? 0),
);
const compactSideTerraceManufacturingBom = calculateManufacturingBomPreview({
  ...getDefaultHomeConfig('compact-timber-40'),
  terrace: 'sideTerrace',
});
const compactCoveredTerraceManufacturingBom = calculateManufacturingBomPreview(compactCoveredTerraceConfig);
assert.equal(compactSideTerraceManufacturingBom.terraceDeckSchedule.some((item) => item.id === 'side-terrace-deck-system'), true);
assert.equal(compactCoveredTerraceManufacturingBom.terraceDeckSchedule.some((item) => item.id === 'covered-terrace-deck-system'), true);
assert.ok(
  compactCoveredTerraceManufacturingBom.terraceDeckSchedule.reduce((total, item) => total + (item.areaM2 ?? item.quantity), 0)
  > compactSideTerraceManufacturingBom.terraceDeckSchedule.reduce((total, item) => total + (item.areaM2 ?? item.quantity), 0),
);

const familyComponentBom = calculateComponentBom(getDefaultHomeConfig('family-timber-80'));
const familyManufacturingBom = calculateManufacturingBomPreview(getDefaultHomeConfig('family-timber-80'));
const compactWallPanelGroup = compactComponentBom.groups.find((group) => group.category === 'wallPanel');
const familyWallPanelGroup = familyComponentBom.groups.find((group) => group.category === 'wallPanel');
const compactWindowGroup = compactComponentBom.groups.find((group) => group.category === 'windowUnit');
const familyWindowGroup = familyComponentBom.groups.find((group) => group.category === 'windowUnit');
assert.ok(compactWallPanelGroup);
assert.ok(familyWallPanelGroup);
assert.ok(compactWindowGroup);
assert.ok(familyWindowGroup);
assert.ok(familyWallPanelGroup.quantity > compactWallPanelGroup.quantity);
assert.ok(familyWindowGroup.quantity > compactWindowGroup.quantity);
assert.ok(familyComponentBom.subtotal > compactComponentBom.subtotal);
assert.ok(familyManufacturingBom.floorCassetteAreaM2 > compactManufacturingBom.floorCassetteAreaM2);
assert.ok(familyManufacturingBom.panelGroups.reduce((total, group) => total + group.panelCount, 0) > compactManufacturingBom.panelGroups.reduce((total, group) => total + group.panelCount, 0));
assert.ok(familyManufacturingBom.panelSizeGroups.reduce((total, group) => total + group.panelCount, 0) > compactManufacturingBom.panelSizeGroups.reduce((total, group) => total + group.panelCount, 0));

const saunaComponentBom = calculateComponentBom(getDefaultHomeConfig('sauna-cabin-25'));
const saunaManufacturingBom = calculateManufacturingBomPreview(getDefaultHomeConfig('sauna-cabin-25'));
assert.equal(saunaComponentBom.items.some((item) => item.componentId === 'sauna-bench-package'), true);
assert.equal(saunaComponentBom.groups.some((group) => group.category === 'furniturePackage'), true);
assert.equal(saunaComponentBom.groups.some((group) => group.category === 'bathroomCore'), true);
assert.equal(saunaManufacturingBom.terraceDeckSchedule.length > 0, true);
assert.equal(saunaManufacturingBom.windowSchedule.some((item) => item.label.includes('privacy')), true);

const compactQuantities = calculateModularHomeQuantities(getDefaultHomeConfig('compact-timber-40'));
const familyQuantities = calculateModularHomeQuantities(getDefaultHomeConfig('family-timber-80'));
assert.ok(familyQuantities.grossFloorAreaM2 > compactQuantities.grossFloorAreaM2);
assert.ok(familyQuantities.exteriorWallAreaM2 > compactQuantities.exteriorWallAreaM2);
assert.ok(familyQuantities.roofAreaM2 > compactQuantities.roofAreaM2);
assert.equal(compactQuantities.disclaimer, 'Preview quantity takeoff · approximate only');

const saunaQuantities = calculateModularHomeQuantities(getDefaultHomeConfig('sauna-cabin-25'));
assert.ok(saunaQuantities.terraceAreaM2 > 0);
assert.equal(saunaQuantities.saunaCoreCount, 1);
assert.equal(saunaQuantities.bathroomCoreCount, 1);
assert.equal(saunaQuantities.furniturePackageItemCount, 1);

const compactEmptyFurnitureQuantities = calculateModularHomeQuantities({
  ...getDefaultHomeConfig('compact-timber-40'),
  furniturePackage: 'emptyShell',
});
assert.equal(compactEmptyFurnitureQuantities.furniturePackageItemCount, 0);

const compactNoTerraceQuantities = calculateModularHomeQuantities({
  ...getDefaultHomeConfig('compact-timber-40'),
  terrace: 'none',
});
const compactFrontDeckQuantities = calculateModularHomeQuantities({
  ...getDefaultHomeConfig('compact-timber-40'),
  terrace: 'frontDeck',
});
const compactSideTerraceQuantities = calculateModularHomeQuantities({
  ...getDefaultHomeConfig('compact-timber-40'),
  terrace: 'sideTerrace',
});
const compactCoveredTerraceQuantities = calculateModularHomeQuantities(compactCoveredTerraceConfig);
assert.equal(compactNoTerraceQuantities.terraceAreaM2, 0);
assert.ok(compactFrontDeckQuantities.terraceAreaM2 > compactNoTerraceQuantities.terraceAreaM2);
assert.ok(compactSideTerraceQuantities.terraceAreaM2 >= compactFrontDeckQuantities.terraceAreaM2);
assert.ok(compactCoveredTerraceQuantities.terraceAreaM2 > compactSideTerraceQuantities.terraceAreaM2);

const compactFlatRoofQuantities = calculateModularHomeQuantities({
  ...getDefaultHomeConfig('compact-timber-40'),
  roof: 'flat',
});
const compactPitchedRoofQuantities = calculateModularHomeQuantities({
  ...getDefaultHomeConfig('compact-timber-40'),
  roof: 'pitched',
});
assert.ok(compactPitchedRoofQuantities.roofAreaM2 > compactFlatRoofQuantities.roofAreaM2);

const compactPrivacyQuantities = calculateModularHomeQuantities({
  ...getDefaultHomeConfig('compact-timber-40'),
  windowPackage: 'compactPrivacy',
});
const compactCornerQuantities = calculateModularHomeQuantities({
  ...getDefaultHomeConfig('compact-timber-40'),
  windowPackage: 'cornerGlazing',
});
assert.ok(compactPrivacyQuantities.windowCount < compactQuantities.windowCount);
assert.ok(compactCornerQuantities.windowCount > compactQuantities.windowCount);

const compactSidePrivacyPlacementQuantities = calculateModularHomeQuantities({
  ...getDefaultHomeConfig('compact-timber-40'),
  windowPlacement: 'sidePrivacy',
});
const compactCornerFeaturePlacementQuantities = calculateModularHomeQuantities({
  ...getDefaultHomeConfig('compact-timber-40'),
  windowPlacement: 'cornerFeature',
});
assert.ok(compactSidePrivacyPlacementQuantities.windowCount < compactQuantities.windowCount);
assert.ok(compactCornerFeaturePlacementQuantities.windowCount > compactQuantities.windowCount);

const compactTerraceFacingDoorQuantities = calculateModularHomeQuantities({
  ...getDefaultHomeConfig('compact-timber-40'),
  doorPlacement: 'terraceFacing',
});
assert.ok(compactTerraceFacingDoorQuantities.doorCount > compactQuantities.doorCount);

const compactMaterialTakeoff = calculateMaterialTakeoff(getDefaultHomeConfig('compact-timber-40'));
const familyMaterialTakeoff = calculateMaterialTakeoff(getDefaultHomeConfig('family-timber-80'));
assert.ok(familyMaterialTakeoff.grossFloorAreaM2 > compactMaterialTakeoff.grossFloorAreaM2);
assert.ok(familyMaterialTakeoff.facadeAreaM2 > compactMaterialTakeoff.facadeAreaM2);
assert.ok(familyMaterialTakeoff.roofAreaM2 > compactMaterialTakeoff.roofAreaM2);

const compactNoTerraceMaterialTakeoff = calculateMaterialTakeoff({
  ...getDefaultHomeConfig('compact-timber-40'),
  terrace: 'none',
});
const compactCoveredTerraceMaterialTakeoff = calculateMaterialTakeoff({
  ...getDefaultHomeConfig('compact-timber-40'),
  terrace: 'coveredTerracePlaceholder',
});
assert.ok(compactCoveredTerraceMaterialTakeoff.terraceDeckingAreaM2 > compactNoTerraceMaterialTakeoff.terraceDeckingAreaM2);

const compactBalancedWindowTakeoff = calculateMaterialTakeoff(getDefaultHomeConfig('compact-timber-40'));
const compactPanoramicWindowTakeoff = calculateMaterialTakeoff({
  ...getDefaultHomeConfig('compact-timber-40'),
  windowPackage: 'panoramicWindows',
  windowPlacement: 'frontPanoramic',
});
assert.ok(compactPanoramicWindowTakeoff.totalWindowAreaM2 > compactBalancedWindowTakeoff.totalWindowAreaM2);

const compactStandardDimensionTakeoff = calculateMaterialTakeoff({
  ...getDefaultHomeConfig('compact-timber-40'),
  dimensionPreset: 'compactStandard',
});
const compactWideDimensionTakeoff = calculateMaterialTakeoff({
  ...getDefaultHomeConfig('compact-timber-40'),
  dimensionPreset: 'compactWideLiving',
});
assert.ok(compactWideDimensionTakeoff.grossFloorAreaM2 > compactStandardDimensionTakeoff.grossFloorAreaM2);
assert.ok(compactWideDimensionTakeoff.facadeBoardLinearM > compactStandardDimensionTakeoff.facadeBoardLinearM);

const validSupplierCostValidation = validateSupplierCostItems(MODULAR_HOME_SUPPLIER_COST_ITEMS);
assert.equal(validSupplierCostValidation.valid, true);
assert.equal(validSupplierCostValidation.errors.length, 0);

const missingUnitCostValidation = validateSupplierCostItems([
  {
    ...MODULAR_HOME_SUPPLIER_COST_ITEMS[0],
    itemCode: 'TEST-MISSING-UNITCOST',
    unitCost: 0,
  },
]);
assert.equal(missingUnitCostValidation.valid, false);
assert.equal(missingUnitCostValidation.errors.some((issue) => issue.field === 'unitCost'), true);

const wrongCurrencyValidation = validateSupplierCostItems([
  {
    ...MODULAR_HOME_SUPPLIER_COST_ITEMS[0],
    currency: 'USD',
    itemCode: 'TEST-WRONG-CURRENCY',
  } as typeof MODULAR_HOME_SUPPLIER_COST_ITEMS[number] & { currency: 'USD' },
]);
assert.equal(wrongCurrencyValidation.valid, false);
assert.equal(wrongCurrencyValidation.errors.some((issue) => issue.field === 'currency'), true);

const facadeBoardSupplierItems = getCostItemsByCategory('facadeBoarding');
assert.equal(facadeBoardSupplierItems.length > 0, true);
assert.equal(MODULAR_HOME_DEFAULT_SUPPLIER_COST_MAP.pricingCategoryMap.material.length > 0, true);

const windowSupplierItem = getCostItemForComponent('WIN-PANO');
assert.equal(windowSupplierItem?.category, 'windowUnit');

const fallbackEstimate = calculateModularHomeEstimate(getDefaultHomeConfig('compact-timber-40'));
assert.equal(fallbackEstimate.totalPrice > 0, true);

const encodedConfig = encodeModularHomeConfigToSearchParams({
  ...getDefaultHomeConfig('compact-timber-40'),
  dimensionPreset: 'compactWideLiving',
  doorPackage: 'premiumGlazedEntry',
  doorPlacement: 'sideEntry',
  terrace: 'sideTerrace',
  windowPackage: 'cornerGlazing',
  windowPlacement: 'cornerFeature',
}, 'floorplan');
assert.equal(encodedConfig.get('model'), 'compact');
assert.equal(encodedConfig.get('homeModel'), null);
assert.equal(encodedConfig.get('layout'), 'one');
assert.equal(encodedConfig.get('dims'), 'wide');
assert.equal(encodedConfig.get('windows'), 'corner');
assert.equal(encodedConfig.get('windowPlace'), 'corner');
assert.equal(encodedConfig.get('door'), 'glazed');
assert.equal(encodedConfig.get('doorPlace'), 'side');
assert.equal(encodedConfig.get('terrace'), 'side');
assert.equal(encodedConfig.get('view'), 'floorplan');

const decodedConfig = decodeModularHomeConfigFromUrl('?homeDemo=1&homeModel=compact&dims=long&windows=panoramic&windowPlace=front&door=slider&doorPlace=terrace&terrace=covered');
assert.equal(decodedConfig.config.windowPackage, 'panoramicWindows');
assert.equal(decodedConfig.config.dimensionPreset, 'compactLongBedroom');
assert.equal(decodedConfig.config.windowPlacement, 'frontPanoramic');
assert.equal(decodedConfig.config.doorPackage, 'terraceSlider');
assert.equal(decodedConfig.config.doorPlacement, 'terraceFacing');
assert.equal(decodedConfig.config.terrace, 'coveredTerracePlaceholder');
assert.equal(decodedConfig.config.layoutVariant, 'oneBedroom');
assert.equal(decodedConfig.usedFallback, false);
assert.equal(decodedConfig.viewMode, 'exterior');

const decodedShortConfig = decodeModularHomeConfigFromUrl('?homeDemo=1&model=family&layout=three&dims=extra&facade=dark&roof=flat&terrace=side&finish=premium&windows=panoramic&windowPlace=corner&door=slider&doorPlace=side&view=cutaway');
assert.equal(decodedShortConfig.config.template, 'familyTimber80');
assert.equal(decodedShortConfig.productId, 'family-timber-80');
assert.equal(decodedShortConfig.config.layoutVariant, 'threeBedroomCompact');
assert.equal(decodedShortConfig.config.dimensionPreset, 'familyExtraBedroomModule');
assert.equal(decodedShortConfig.config.facade, 'darkThermoWood');
assert.equal(decodedShortConfig.config.roof, 'flat');
assert.equal(decodedShortConfig.config.terrace, 'sideTerrace');
assert.equal(decodedShortConfig.config.finishLevel, 'premium');
assert.equal(decodedShortConfig.config.windowPackage, 'panoramicWindows');
assert.equal(decodedShortConfig.config.windowPlacement, 'cornerFeature');
assert.equal(decodedShortConfig.config.doorPackage, 'terraceSlider');
assert.equal(decodedShortConfig.config.doorPlacement, 'sideEntry');
assert.equal(decodedShortConfig.viewMode, 'cutaway');
assert.equal(decodedShortConfig.usedFallback, false);

const decodedCaseInsensitiveConfig = decodeModularHomeConfigFromUrl('?homeDemo=1&model=FAMILY&layout=Large&dimensionPreset=Wide&facade=Dark&roof=FLAT&terrace=SIDE&finish=Premium&windows=Panoramic&windowPlacement=Front&door=Slider&doorPlacement=Terrace&view=PLAN');
assert.equal(decodedCaseInsensitiveConfig.config.template, 'familyTimber80');
assert.equal(decodedCaseInsensitiveConfig.productId, 'family-timber-80');
assert.equal(decodedCaseInsensitiveConfig.config.layoutVariant, 'largeLiving');
assert.equal(decodedCaseInsensitiveConfig.config.dimensionPreset, 'familyWideLiving');
assert.equal(decodedCaseInsensitiveConfig.config.facade, 'darkThermoWood');
assert.equal(decodedCaseInsensitiveConfig.config.windowPackage, 'panoramicWindows');
assert.equal(decodedCaseInsensitiveConfig.config.windowPlacement, 'frontPanoramic');
assert.equal(decodedCaseInsensitiveConfig.config.doorPackage, 'terraceSlider');
assert.equal(decodedCaseInsensitiveConfig.config.doorPlacement, 'terraceFacing');
assert.equal(decodedCaseInsensitiveConfig.viewMode, 'floorplan');
assert.equal(decodedCaseInsensitiveConfig.usedFallback, false);

const decodedInteriorViewConfig = decodeModularHomeConfigFromUrl('?homeDemo=1&model=compact&view=inside');
assert.equal(decodedInteriorViewConfig.viewMode, 'interior');
assert.equal(decodedInteriorViewConfig.usedFallback, false);

const decodedLegacyTerraceConfig = decodeModularHomeConfigFromUrl('?homeDemo=1&homeModel=compact&terrace=small');
assert.equal(decodedLegacyTerraceConfig.config.terrace, 'frontDeck');
assert.equal(decodedLegacyTerraceConfig.invalidKeys.includes('terrace'), false);

const decodedLayoutAliasConfig = decodeModularHomeConfigFromUrl('?homeDemo=1&model=sauna&layout=guest');
assert.equal(decodedLayoutAliasConfig.config.layoutVariant, 'guestCabin');
assert.equal(decodedLayoutAliasConfig.invalidKeys.includes('layout'), false);

const decodedInvalidSaunaConfig = decodeModularHomeConfigFromUrl('?homeDemo=1&homeModel=sauna&layout=office&windows=corner&windowPlace=corner&door=glazed&doorPlace=bad');
assert.equal(decodedInvalidSaunaConfig.config.windowPackage, 'compactPrivacy');
assert.equal(decodedInvalidSaunaConfig.config.windowPlacement, 'sidePrivacy');
assert.equal(decodedInvalidSaunaConfig.config.doorPackage, 'standardEntry');
assert.equal(decodedInvalidSaunaConfig.config.doorPlacement, 'frontEntry');
assert.equal(decodedInvalidSaunaConfig.config.layoutVariant, 'saunaRestRoom');
assert.equal(decodedInvalidSaunaConfig.invalidKeys.includes('layout'), true);
assert.equal(decodedInvalidSaunaConfig.invalidKeys.includes('windows'), true);
assert.equal(decodedInvalidSaunaConfig.invalidKeys.includes('windowPlace'), true);
assert.equal(decodedInvalidSaunaConfig.invalidKeys.includes('door'), true);
assert.equal(decodedInvalidSaunaConfig.invalidKeys.includes('doorPlace'), true);

const decodedDetailConfig = decodeModularHomeConfigFromUrl('?homeDemo=1&model=compact&boardDir=v&boardWidth=narrow&boardProfile=shadow&boardSpacing=tight&trim=bronze&roofEdge=bronze&gutter=box&frame=graphite&frameType=deep&wall=warm&floor=oak&floorStyle=warm&wallPanel=ribbed&kitchenFinish=wood&furniture=premium&sofa=1&table=0&bed=1&kitchen=1&wardrobe=0');
assert.equal(decodedDetailConfig.config.facadeBoardOrientation, 'vertical');
assert.equal(decodedDetailConfig.config.facadeBoardWidth, 'narrow');
assert.equal(decodedDetailConfig.config.facadeBoardProfile, 'shadowGap');
assert.equal(decodedDetailConfig.config.facadeBoardSpacing, 'tight');
assert.equal(decodedDetailConfig.config.trimColor, 'bronze');
assert.equal(decodedDetailConfig.config.roofEdgeColor, 'bronze');
assert.equal(decodedDetailConfig.config.roofGutterStyle, 'boxGutter');
assert.equal(decodedDetailConfig.config.windowFrameColor, 'graphite');
assert.equal(decodedDetailConfig.config.windowFrameType, 'deepReveal');
assert.equal(decodedDetailConfig.config.interiorWallFinish, 'warmPanel');
assert.equal(decodedDetailConfig.config.floorFinish, 'oakLaminate');
assert.equal(decodedDetailConfig.config.interiorFloorStyle, 'warmPlank');
assert.equal(decodedDetailConfig.config.wallPanelStyle, 'ribbedPanel');
assert.equal(decodedDetailConfig.config.furniturePackage, 'premiumFurniture');
assert.equal(decodedDetailConfig.config.sofa, 'enabled');
assert.equal(decodedDetailConfig.config.table, 'disabled');
assert.equal(decodedDetailConfig.config.bed, 'enabled');
assert.equal(decodedDetailConfig.config.kitchenLine, 'enabled');
assert.equal(decodedDetailConfig.config.wardrobePlaceholder, 'disabled');
assert.equal(decodedDetailConfig.usedFallback, false);

const decodedInvalidShareConfig = decodeModularHomeConfigFromUrl('?homeDemo=1&model=missing&layout=bad&dims=bad&facade=unknown&roof=bad&terrace=bad&finish=bad&furniture=bad&sofa=bad&table=bad&bed=bad&kitchen=bad&wardrobe=bad&windows=bad&windowPlace=bad&door=bad&doorPlace=bad&boardDir=bad&boardWidth=bad&boardProfile=bad&boardSpacing=bad&trim=bad&roofEdge=bad&gutter=bad&frame=bad&frameType=bad&wall=bad&floor=bad&floorStyle=bad&wallPanel=bad&view=bad');
assert.equal(decodedInvalidShareConfig.config.template, 'compactTimber40');
assert.equal(decodedInvalidShareConfig.config.layoutVariant, 'oneBedroom');
assert.equal(decodedInvalidShareConfig.config.dimensionPreset, 'compactStandard');
assert.equal(decodedInvalidShareConfig.productId, 'compact-timber-40');
assert.equal(decodedInvalidShareConfig.viewMode, 'exterior');
assert.equal(decodedInvalidShareConfig.usedFallback, true);
assert.deepEqual(
  [...decodedInvalidShareConfig.invalidKeys].sort(),
  ['bed', 'boardDir', 'boardProfile', 'boardSpacing', 'boardWidth', 'dims', 'door', 'doorPlace', 'facade', 'finish', 'floor', 'floorStyle', 'frame', 'frameType', 'furniture', 'furniture', 'gutter', 'kitchen', 'kitchen', 'layout', 'model', 'roof', 'roofEdge', 'sofa', 'table', 'terrace', 'trim', 'view', 'wall', 'wallPanel', 'wardrobe', 'windowPlace', 'windows'].sort(),
);

const shareUrl = createModularHomeShareUrl(
  {
    ...getDefaultHomeConfig('family-timber-80'),
    dimensionPreset: 'familyWideLiving',
    facade: 'darkThermoWood',
    roof: 'flat',
    terrace: 'sideTerrace',
    windowPackage: 'panoramicWindows',
  },
  'https://example.test/expo-3d?old=1#debug',
  'cutaway',
);
const shareUrlSearch = new URL(shareUrl).searchParams;
assert.equal(shareUrl, 'https://example.test/modular-homes/studio?homeStudio=1&model=family&layout=two&dims=wide&facade=dark&roof=flat&terrace=side&finish=standard&windows=panoramic&windowPlace=front&door=slider&doorPlace=terrace&boardDir=v&boardWidth=standard&boardProfile=square&boardSpacing=standard&trim=timber&roofEdge=graphite&gutter=minimal&frame=timber&frameType=standard&wall=plywood&floor=plywood&floorStyle=utility&wallPanel=plain&kitchenFinish=wood&furnitureMood=warm&interiorZoneFocus=living&furniture=standard&sofa=1&table=1&bed=1&kitchen=1&wardrobe=1&view=cutaway');
assert.equal(shareUrlSearch.get('homeStudio'), '1');
assert.equal(shareUrlSearch.get('homeDemo'), null);
assert.equal(shareUrlSearch.get('old'), null);
assert.equal(shareUrlSearch.get('model'), 'family');
assert.equal(shareUrlSearch.get('layout'), 'two');
assert.equal(shareUrlSearch.get('dims'), 'wide');
assert.equal(shareUrlSearch.get('windowPlace'), 'front');
assert.equal(shareUrlSearch.get('doorPlace'), 'terrace');
assert.equal(shareUrlSearch.get('boardDir'), 'v');
assert.equal(shareUrlSearch.get('boardWidth'), 'standard');
assert.equal(shareUrlSearch.get('boardProfile'), 'square');
assert.equal(shareUrlSearch.get('boardSpacing'), 'standard');
assert.equal(shareUrlSearch.get('trim'), 'timber');
assert.equal(shareUrlSearch.get('roofEdge'), 'graphite');
assert.equal(shareUrlSearch.get('gutter'), 'minimal');
assert.equal(shareUrlSearch.get('frame'), 'timber');
assert.equal(shareUrlSearch.get('frameType'), 'standard');
assert.equal(shareUrlSearch.get('wall'), 'plywood');
assert.equal(shareUrlSearch.get('floor'), 'plywood');
assert.equal(shareUrlSearch.get('floorStyle'), 'utility');
assert.equal(shareUrlSearch.get('wallPanel'), 'plain');
assert.equal(shareUrlSearch.get('furniture'), 'standard');
assert.equal(shareUrlSearch.get('sofa'), '1');
assert.equal(shareUrlSearch.get('table'), '1');
assert.equal(shareUrlSearch.get('bed'), '1');
assert.equal(shareUrlSearch.get('kitchen'), '1');
assert.equal(shareUrlSearch.get('wardrobe'), '1');
assert.equal(shareUrlSearch.get('view'), 'cutaway');

assert.equal(DEFAULT_MODULAR_HOME_VIEW_MODE, 'exterior');
assert.deepEqual(MODULAR_HOME_VIEW_MODE_OPTIONS.map((option) => option.key), ['exterior', 'cutaway', 'interior', 'floorplan']);
assert.equal(getModularHomeViewModeLabel('cutaway'), 'Cutaway');
assert.equal(getModularHomeViewMode(), 'exterior');
setModularHomeViewMode('interior');
assert.equal(getModularHomeViewMode(), 'interior');
resetModularHomeViewMode();
assert.equal(getModularHomeViewMode(), 'exterior');
assert.equal(getModularHomeViewModeLabel(DEFAULT_MODULAR_HOME_VIEW_MODE), 'Exterior');

const professionalExportConfig = {
  ...getDefaultHomeConfig('compact-timber-40'),
  layoutVariant: 'officeCabin',
  dimensionPreset: 'compactWideLiving',
  roomUseProfile: 'office',
  windowPlacement: 'frontPanoramic',
  doorPlacement: 'terraceFacing',
} as const;
const professionalExportEstimate = calculateModularHomeEstimate(professionalExportConfig);
const professionalQuoteExport = buildModularHomeProfessionalQuoteExportData({
  componentBom: calculateComponentBom(professionalExportConfig),
  dimensions: getModularHomeDimensionSummary(professionalExportConfig),
  estimate: professionalExportEstimate,
  generatedAt: new Date('2026-06-10T10:30:00.000Z'),
  latestQuoteRequest: {
    budgetRange: '100k-150k',
    config: professionalExportConfig,
    consentGiven: true,
    consentText: 'Preview only',
    countryCity: 'Riga, Latvia',
    createdAt: '2026-06-10T10:20:00.000Z',
    disclaimer: professionalExportEstimate.disclaimer,
    email: 'client@example.com',
    estimatedTotal: professionalExportEstimate.estimatedTotal,
    estimatedTotalLabel: formatHomeEstimateEur(professionalExportEstimate.estimatedTotal),
    id: 'preview-1',
    landOwned: 'yes',
    message: 'Need compact office cabin.',
    model: professionalExportEstimate.baseModel,
    name: 'Client Example',
    phone: '+37120000000',
    selectedOptions: professionalExportEstimate.selectedOptions,
    source: 'homeDemoPreview',
    status: 'preview-local-only',
    targetBuildDate: '6-12-months',
  },
  manufacturingBom: calculateManufacturingBomPreview(professionalExportConfig),
  materialTakeoff: calculateMaterialTakeoff(professionalExportConfig),
  productionConstraints: getModularHomeProductionConstraints(professionalExportConfig),
  projectId: 'home-preview-round143',
});
assert.equal(professionalQuoteExport.headerRows.some((row) => row.label === 'Project ID' && row.value === 'home-preview-round143'), true);
assert.equal(professionalQuoteExport.clientRows.some((row) => row.label === 'Client' && row.value === 'Client Example'), true);
assert.equal(professionalQuoteExport.configRows.some((row) => row.label === 'Dimension preset' && row.value === 'Compact wide living'), true);
assert.deepEqual(professionalQuoteExport.estimateScenarioRows.map((row) => row.id), ['base', 'expected', 'premium', 'siteDependentExtras']);
assert.equal(professionalQuoteExport.nextSteps.length, 4);
assert.equal(professionalQuoteExport.exportText.includes('Professional Quote Export'), true);
assert.equal(professionalQuoteExport.exportText.includes('Opening schedule summary'), true);
assert.equal(professionalQuoteExport.exportText.includes('Manufacturing BOM preview summary'), true);
