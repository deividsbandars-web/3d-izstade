import assert from 'node:assert/strict';
import { buildExpoBoothLocalFootprint } from '../../../shared/expo/lib/boothLocalFootprint.js';
import { buildExpoWorldContract } from '../../../shared/expo/worldContract.js';

const rotatedHeroFootprint = buildExpoBoothLocalFootprint({
  boothType: 'hero',
  nodeType: 'hero_left',
  position: [120, 0, -240],
  rotation: [0, Math.PI / 2, 0],
  sponsorTier: 'hero',
});

assert.equal(rotatedHeroFootprint.width, 36);
assert.equal(rotatedHeroFootprint.depth, 26);
assert.equal(rotatedHeroFootprint.source, 'conservative-node-baseline');
assert.equal(rotatedHeroFootprint.localBounds.minX, -18);
assert.equal(rotatedHeroFootprint.localBounds.maxZ, 13);
assert.ok(Math.abs(rotatedHeroFootprint.worldBounds.maxX - (120 + 13)) < 1e-9);
assert.ok(Math.abs(rotatedHeroFootprint.worldBounds.minZ - (-240 - 18)) < 1e-9);

const world = buildExpoWorldContract({
  companies: [
    { booth: { id: 'booth-1' }, boothType: 'hero', id: 'company-1', name: 'Hero One', priority: 100, sector_id: 'sector-1', sponsorTier: 'hero' },
    { booth: { id: 'booth-2' }, boothType: 'premium', id: 'company-2', name: 'Premium Two', priority: 80, sector_id: 'sector-1', sponsorTier: 'gold' },
    { booth: { id: 'booth-3' }, boothType: 'standard', id: 'company-3', name: 'Standard Three', priority: 20, sector_id: 'sector-2', sponsorTier: 'silver' },
  ],
  sectors: [
    { color_theme: '#0ea5e9', id: 'sector-1', map_position: { x: 0, z: 0 }, name: 'Infra' },
    { color_theme: '#22c55e', id: 'sector-2', map_position: { x: 12, z: -10 }, name: 'AI' },
  ],
});

assert.ok(world.boothPlacements.length >= 3);
assert.ok(world.boothPlacements.every((placement) => placement.layoutFootprint));
assert.ok(world.boothPlacements.every((placement) => placement.localFootprint));
assert.ok(world.boothPlacements.every((placement) => (placement.localFootprint?.width ?? 0) > 0));
assert.ok(world.boothPlacements.every((placement) => (placement.localFootprint?.depth ?? 0) > 0));
assert.ok(world.boothPlacements.every((placement) => placement.localFootprint?.worldBounds.minX !== undefined));

const [heroPlacement] = world.boothPlacements;
assert.ok(heroPlacement.layoutFootprint);
assert.ok(heroPlacement.localFootprint);
assert.notEqual(heroPlacement.layoutFootprint?.maxX, heroPlacement.localFootprint?.worldBounds.maxX);
