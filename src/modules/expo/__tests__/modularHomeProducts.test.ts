import assert from 'node:assert/strict';
import {
  getBomModuleSummary,
  getDefaultHomeConfig,
  getInvalidConfigReasons,
  getModularHomeMaterials,
  getModularHomeConfigurationWarnings,
  getModularHomeOptionChoices,
  getSelectedModularHomeMaterialIds,
  getModuleInstancesForProduct,
  getModuleQuantitySummary,
  getModulesForProduct,
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

const compactRoofChoices = getModularHomeOptionChoices('compact-timber-40', 'roof', getDefaultHomeConfig('compact-timber-40'));
assert.equal(
  compactRoofChoices.find((item) => item.visualToken === 'greenRoofPlaceholder')?.constraintStatus,
  'requiresReview',
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
