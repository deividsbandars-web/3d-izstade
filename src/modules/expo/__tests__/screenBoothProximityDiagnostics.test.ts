import assert from 'node:assert/strict';
import { buildExpoBoothLocalFootprint } from '../../../shared/expo/lib/boothLocalFootprint.js';
import { diagnoseScreenBoothProximity } from '../runtime/planning/screens/screenBoothProximityDiagnostics.js';
import type { CityScreenSurface } from '../runtime/planning/types/index.js';

const baseSurface: CityScreenSurface = {
  color: '#08111c',
  glowColor: '#7dd3fc',
  id: 'screen-wall',
  position: [0, 120, -120],
  role: 'hero-wall',
  rotation: [0, 0, 0],
  size: [40, 120, 4],
  type: 'wall',
};

const overlapBooth = {
  id: 'booth-overlap',
  localFootprint: buildExpoBoothLocalFootprint({
    boothType: 'hero',
    nodeType: 'hero_left',
    position: [4, 0, -120],
    rotation: [0, 0, 0],
    sponsorTier: 'hero',
  }),
  nodeType: 'hero_left' as const,
};

const nearbyBooth = {
  id: 'booth-nearby',
  localFootprint: buildExpoBoothLocalFootprint({
    boothType: 'standard',
    nodeType: 'standard_left',
    position: [38, 0, -120],
    rotation: [0, 0, 0],
    sponsorTier: 'silver',
  }),
  nodeType: 'standard_left' as const,
};

const farBooth = {
  id: 'booth-far',
  localFootprint: buildExpoBoothLocalFootprint({
    boothType: 'standard',
    nodeType: 'standard_right',
    position: [140, 0, -120],
    rotation: [0, 0, 0],
    sponsorTier: 'silver',
  }),
  nodeType: 'standard_right' as const,
};

const thresholdEdgeBooth = {
  id: 'booth-threshold-edge',
  localFootprint: buildExpoBoothLocalFootprint({
    boothType: 'standard',
    nodeType: 'standard_right',
    position: [45, 0, -120],
    rotation: [0, 0, 0],
    sponsorTier: 'silver',
  }),
  nodeType: 'standard_right' as const,
};

const towerRibbonSurface: CityScreenSurface = {
  ...baseSurface,
  id: 'screen-tower-ribbon',
  role: 'tower-side',
  type: 'tower-side',
};

const diagnostics = diagnoseScreenBoothProximity({
  boothPlacements: [overlapBooth, nearbyBooth, farBooth, thresholdEdgeBooth],
  screenSurfaces: [baseSurface, towerRibbonSurface],
});

assert.ok(diagnostics.some((entry) => entry.boothId === 'booth-overlap' && entry.code === 'screen-booth-overlap'));
assert.ok(diagnostics.some((entry) => entry.boothId === 'booth-nearby' && entry.code === 'screen-booth-proximity'));
assert.equal(diagnostics.some((entry) => entry.boothId === 'booth-far'), false);
assert.equal(diagnostics.some((entry) => entry.boothId === 'booth-threshold-edge'), false);
assert.equal(diagnostics.some((entry) => entry.screenId === 'screen-tower-ribbon'), false);
