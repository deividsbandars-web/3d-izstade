import assert from 'node:assert/strict';
import {
  calculateComponentBom,
  calculateModularHomeEstimate,
  calculateModularHomeQuantities,
  createModularHomeLocalProject,
  createModularHomeProjectComparison,
  createModularHomeShareUrl,
  decodeModularHomeConfigFromUrl,
  DEFAULT_MODULAR_HOME_VIEW_MODE,
  encodeModularHomeConfigToSearchParams,
  getBomModuleSummary,
  getComponentSummaryForConfig,
  getComponentsForModule,
  getComponentsForProduct,
  getDefaultHomeConfig,
  getInvalidConfigReasons,
  getModularHomeMaterials,
  getModularHomeConfigurationWarnings,
  getModularHomeOptionChoices,
  getModularHomeProducts,
  getModularHomeViewMode,
  getModularHomeViewModeLabel,
  getSelectedModularHomeMaterialIds,
  getModuleInstancesForProduct,
  getModuleQuantitySummary,
  getModulesForProduct,
  getPricingCategoriesForComponentCategory,
  getPricingCategoriesForModuleType,
  getPricingCategoriesForOptionGroup,
  MODULAR_HOME_COMPONENTS,
  MODULAR_HOME_MODULES,
  MODULAR_HOME_OPTIONS,
  MODULAR_HOME_PRICING_CATEGORIES,
  MODULAR_HOME_PRICING_CONTEXT,
  MODULAR_HOME_PRODUCT_COMPONENT_LIBRARY,
  MODULAR_HOME_VIEW_MODE_OPTIONS,
  resetModularHomeViewMode,
  setModularHomeViewMode,
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
  roof: 'pitched',
  terrace: 'extendedTerrace',
} as const;
assert.equal(validateHomeConfiguration(invalidSaunaConfig), false);
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

const saunaWindowChoices = getModularHomeOptionChoices('sauna-cabin-25', 'windowPackage', saunaConfig);
assert.equal(saunaWindowChoices.find((item) => item.visualToken === 'panoramicWindows')?.constraintStatus, 'notAvailable');
assert.equal(saunaWindowChoices.find((item) => item.visualToken === 'cornerGlazing')?.constraintStatus, 'notAvailable');
assert.equal(saunaWindowChoices.find((item) => item.visualToken === 'compactPrivacy')?.constraintStatus, 'compatible');

const compactDoorChoices = getModularHomeOptionChoices('compact-timber-40', 'doorPackage', getDefaultHomeConfig('compact-timber-40'));
assert.equal(compactDoorChoices.find((item) => item.visualToken === 'terraceSlider')?.constraintStatus, 'requiresReview');
assert.equal(compactDoorChoices.find((item) => item.visualToken === 'premiumGlazedEntry')?.constraintStatus, 'requiresReview');

const saunaDoorChoices = getModularHomeOptionChoices('sauna-cabin-25', 'doorPackage', saunaConfig);
assert.equal(saunaDoorChoices.find((item) => item.visualToken === 'premiumGlazedEntry')?.constraintStatus, 'notAvailable');

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

for (const module of MODULAR_HOME_MODULES) {
  assert.ok(getPricingCategoriesForModuleType(module.type).length > 0, `${module.id} should map to pricing categories`);
}

for (const option of MODULAR_HOME_OPTIONS) {
  assert.ok(getPricingCategoriesForOptionGroup(option.group).length > 0, `${option.id} should map to pricing categories`);
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
      && item.confidence.length > 0
      && Object.hasOwn(item, 'unitCost')
      && Object.hasOwn(item, 'subtotal')
    ))
  )),
  true,
);
assert.equal(compactStandardWindowEstimate.sections.find((section) => section.id === 'modulePackage')?.confidence, 'medium');
assert.equal(compactStandardWindowEstimate.sections.find((section) => section.id === 'excludedSiteDependent')?.lineItems.every((item) => (
  item.subtotal === null && item.unitCost === null && item.isExcluded === true
)), true);
const compactPanoramicWindowEstimate = calculateModularHomeEstimate({
  ...getDefaultHomeConfig('compact-timber-40'),
  windowPackage: 'panoramicWindows',
});
assert.ok(compactPanoramicWindowEstimate.estimatedTotal > compactStandardWindowEstimate.estimatedTotal);
assert.equal(compactPanoramicWindowEstimate.selectedOptions.windowPackage, 'Panoramic glazing');

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
  },
  estimateTotal: compactPanoramicWindowEstimate.estimatedTotal,
  productId: 'compact-timber-40',
  projectName: 'Compact panoramic',
});
const workspaceComparison = createModularHomeProjectComparison(
  compactWorkspaceProject,
  compactPanoramicWorkspaceProject,
);
assert.equal(compactWorkspaceProject.projectName, 'Compact baseline');
assert.equal(compactPanoramicWorkspaceProject.projectName, 'Compact panoramic');
assert.ok(workspaceComparison.estimateDelta > 0);
assert.equal(
  workspaceComparison.options.find((option) => option.key === 'windowPackage')?.hasChanged,
  true,
);
assert.equal(
  workspaceComparison.options.find((option) => option.key === 'facade')?.hasChanged,
  false,
);

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

const familyComponentBom = calculateComponentBom(getDefaultHomeConfig('family-timber-80'));
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

const saunaComponentBom = calculateComponentBom(getDefaultHomeConfig('sauna-cabin-25'));
assert.equal(saunaComponentBom.items.some((item) => item.componentId === 'sauna-bench-package'), true);
assert.equal(saunaComponentBom.groups.some((group) => group.category === 'furniturePackage'), true);
assert.equal(saunaComponentBom.groups.some((group) => group.category === 'bathroomCore'), true);

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

const encodedConfig = encodeModularHomeConfigToSearchParams({
  ...getDefaultHomeConfig('compact-timber-40'),
  doorPackage: 'premiumGlazedEntry',
  terrace: 'sideTerrace',
  windowPackage: 'cornerGlazing',
}, 'floorplan');
assert.equal(encodedConfig.get('model'), 'compact');
assert.equal(encodedConfig.get('homeModel'), null);
assert.equal(encodedConfig.get('windows'), 'corner');
assert.equal(encodedConfig.get('door'), 'glazed');
assert.equal(encodedConfig.get('terrace'), 'side');
assert.equal(encodedConfig.get('view'), 'floorplan');

const decodedConfig = decodeModularHomeConfigFromUrl('?homeDemo=1&homeModel=compact&windows=panoramic&door=slider&terrace=covered');
assert.equal(decodedConfig.config.windowPackage, 'panoramicWindows');
assert.equal(decodedConfig.config.doorPackage, 'terraceSlider');
assert.equal(decodedConfig.config.terrace, 'coveredTerracePlaceholder');
assert.equal(decodedConfig.usedFallback, false);
assert.equal(decodedConfig.viewMode, 'exterior');

const decodedShortConfig = decodeModularHomeConfigFromUrl('?homeDemo=1&model=family&facade=dark&roof=flat&terrace=side&finish=premium&windows=panoramic&door=slider&view=cutaway');
assert.equal(decodedShortConfig.config.template, 'familyTimber80');
assert.equal(decodedShortConfig.productId, 'family-timber-80');
assert.equal(decodedShortConfig.config.facade, 'darkThermoWood');
assert.equal(decodedShortConfig.config.roof, 'flat');
assert.equal(decodedShortConfig.config.terrace, 'sideTerrace');
assert.equal(decodedShortConfig.config.finishLevel, 'premium');
assert.equal(decodedShortConfig.config.windowPackage, 'panoramicWindows');
assert.equal(decodedShortConfig.config.doorPackage, 'terraceSlider');
assert.equal(decodedShortConfig.viewMode, 'cutaway');
assert.equal(decodedShortConfig.usedFallback, false);

const decodedCaseInsensitiveConfig = decodeModularHomeConfigFromUrl('?homeDemo=1&model=FAMILY&facade=Dark&roof=FLAT&terrace=SIDE&finish=Premium&windows=Panoramic&door=Slider&view=PLAN');
assert.equal(decodedCaseInsensitiveConfig.config.template, 'familyTimber80');
assert.equal(decodedCaseInsensitiveConfig.productId, 'family-timber-80');
assert.equal(decodedCaseInsensitiveConfig.config.facade, 'darkThermoWood');
assert.equal(decodedCaseInsensitiveConfig.config.windowPackage, 'panoramicWindows');
assert.equal(decodedCaseInsensitiveConfig.config.doorPackage, 'terraceSlider');
assert.equal(decodedCaseInsensitiveConfig.viewMode, 'floorplan');
assert.equal(decodedCaseInsensitiveConfig.usedFallback, false);

const decodedLegacyTerraceConfig = decodeModularHomeConfigFromUrl('?homeDemo=1&homeModel=compact&terrace=small');
assert.equal(decodedLegacyTerraceConfig.config.terrace, 'frontDeck');
assert.equal(decodedLegacyTerraceConfig.invalidKeys.includes('terrace'), false);

const decodedInvalidSaunaConfig = decodeModularHomeConfigFromUrl('?homeDemo=1&homeModel=sauna&windows=corner&door=glazed');
assert.equal(decodedInvalidSaunaConfig.config.windowPackage, 'compactPrivacy');
assert.equal(decodedInvalidSaunaConfig.config.doorPackage, 'standardEntry');
assert.equal(decodedInvalidSaunaConfig.invalidKeys.includes('windows'), true);
assert.equal(decodedInvalidSaunaConfig.invalidKeys.includes('door'), true);

const decodedInvalidShareConfig = decodeModularHomeConfigFromUrl('?homeDemo=1&model=missing&facade=unknown&roof=bad&terrace=bad&finish=bad&windows=bad&door=bad&view=bad');
assert.equal(decodedInvalidShareConfig.config.template, 'compactTimber40');
assert.equal(decodedInvalidShareConfig.productId, 'compact-timber-40');
assert.equal(decodedInvalidShareConfig.viewMode, 'exterior');
assert.equal(decodedInvalidShareConfig.usedFallback, true);
assert.deepEqual(
  [...decodedInvalidShareConfig.invalidKeys].sort(),
  ['door', 'facade', 'finish', 'model', 'roof', 'terrace', 'view', 'windows'].sort(),
);

const shareUrl = createModularHomeShareUrl(
  {
    ...getDefaultHomeConfig('family-timber-80'),
    facade: 'darkThermoWood',
    roof: 'flat',
    terrace: 'sideTerrace',
    windowPackage: 'panoramicWindows',
  },
  'https://example.test/expo-3d?old=1#debug',
  'cutaway',
);
const shareUrlSearch = new URL(shareUrl).searchParams;
assert.equal(shareUrl, 'https://example.test/expo-3d?homeDemo=1&model=family&facade=dark&roof=flat&terrace=side&finish=standard&windows=panoramic&door=slider&view=cutaway');
assert.equal(shareUrlSearch.get('old'), null);
assert.equal(shareUrlSearch.get('model'), 'family');
assert.equal(shareUrlSearch.get('view'), 'cutaway');

assert.equal(DEFAULT_MODULAR_HOME_VIEW_MODE, 'exterior');
assert.deepEqual(MODULAR_HOME_VIEW_MODE_OPTIONS.map((option) => option.key), ['exterior', 'cutaway', 'floorplan']);
assert.equal(getModularHomeViewModeLabel('cutaway'), 'Cutaway');
assert.equal(getModularHomeViewMode(), 'exterior');
setModularHomeViewMode('floorplan');
assert.equal(getModularHomeViewMode(), 'floorplan');
resetModularHomeViewMode();
assert.equal(getModularHomeViewMode(), 'exterior');
assert.equal(getModularHomeViewModeLabel(DEFAULT_MODULAR_HOME_VIEW_MODE), 'Exterior');
