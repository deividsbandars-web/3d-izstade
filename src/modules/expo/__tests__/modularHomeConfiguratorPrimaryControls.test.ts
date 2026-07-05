import assert from 'node:assert/strict';
import { MODULAR_HOME_PRIMARY_CONFIGURATOR_GROUP_KEYS } from '../runtime/modularHome/ConfiguratorOptionsPanel.js';
import { resolveGalaHouseVisualConfigFromModularHomeConfig } from '../runtime/modularHome/GalaHouseState.js';
import { getDefaultHomeConfig } from '../runtime/modularHome/index.js';

const expectedPrimaryConfiguratorKeys = [
  'template',
  'layoutVariant',
  'roomUseProfile',
  'facade',
  'roof',
  'terrace',
  'trimColor',
  'windowFrameColor',
  'doorPackage',
  'roofEdgeColor',
  'floorFinish',
  'interiorWallFinish',
  'furniturePackage',
] as const;

assert.deepEqual(MODULAR_HOME_PRIMARY_CONFIGURATOR_GROUP_KEYS, expectedPrimaryConfiguratorKeys);
assert.equal(
  new Set(MODULAR_HOME_PRIMARY_CONFIGURATOR_GROUP_KEYS).size,
  MODULAR_HOME_PRIMARY_CONFIGURATOR_GROUP_KEYS.length,
);

const galaVisualConfig = resolveGalaHouseVisualConfigFromModularHomeConfig({
  ...getDefaultHomeConfig('compact-timber-40'),
  doorPackage: 'premiumGlazedEntry',
  facade: 'naturalTimber',
  facadeBoardOrientation: 'horizontal',
  facadeBoardProfile: 'squareEdge',
  facadeBoardSpacing: 'standard',
  floorFinish: 'oakLaminate',
  furnitureMood: 'premiumCompact',
  interiorWallFinish: 'warmPanel',
  roof: 'pitched',
  roofEdgeColor: 'lightMetal',
  roofGutterStyle: 'roundGutter',
  terrace: 'extendedTerrace',
  trimColor: 'bronze',
  wallPanelStyle: 'ribbedPanel',
  windowFrameColor: 'white',
});

assert.equal(galaVisualConfig.facadeStyle, 'horizontal-timber');
assert.equal(galaVisualConfig.facadeTone, 'warm');
assert.equal(galaVisualConfig.trimTone, 'bronze');
assert.equal(galaVisualConfig.roofStyle, 'metal-classic');
assert.equal(galaVisualConfig.roofEdgeTone, 'lightMetal');
assert.equal(galaVisualConfig.roofGutterProfile, 'round-gutter');
assert.equal(galaVisualConfig.windowTrimStyle, 'white-frame');
assert.equal(galaVisualConfig.doorStyle, 'glass-panel');
assert.equal(galaVisualConfig.terraceStyle, 'extended-deck-with-steps');
assert.equal(galaVisualConfig.interiorPackage, 'compact-premium');
assert.equal(galaVisualConfig.floorTextureVariant, 'oakLaminate');
assert.equal(galaVisualConfig.floorFinish, 'warm-plank');
assert.equal(galaVisualConfig.interiorWallTextureVariant, 'warmPanel');
assert.equal(galaVisualConfig.wallFinish, 'ribbed-panel');
