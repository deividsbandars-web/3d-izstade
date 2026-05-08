import assert from 'node:assert/strict';
import { buildCanonicalWorldPlan, buildCanonicalWorldPlanFromWorldContract, EXPO_CANONICAL_DISTRICT_STRIDE } from '../runtime/planning/index.js';
import { selectSectionVisibleBoothPlacements, selectVisibleBoothPlacements } from '../runtime/world/scene/useExpoWorldSceneRuntime.js';
import { buildExpoWorldContract } from '../../../shared/expo/worldContract.js';

const world = buildExpoWorldContract({
  companies: [
    { booth: { id: 'booth-1' }, boothType: 'hero', id: 'company-1', name: 'Hero One', priority: 100, sector_id: 'sector-1', sponsorTier: 'hero' },
    { booth: { id: 'booth-2' }, boothType: 'hero', id: 'company-2', name: 'Hero Two', priority: 95, sector_id: 'sector-1', sponsorTier: 'hero' },
    { booth: { id: 'booth-3' }, boothType: 'premium', id: 'company-3', name: 'Premium Three', priority: 90, sector_id: 'sector-2', sponsorTier: 'gold' },
    { booth: { id: 'booth-4' }, boothType: 'standard', id: 'company-4', name: 'Standard Four', priority: 60, sector_id: 'sector-2', sponsorTier: 'silver' },
  ],
  sectors: [
    { color_theme: '#0ea5e9', id: 'sector-1', map_position: { x: 0, z: 0 }, name: 'Infra' },
    { color_theme: '#22c55e', id: 'sector-2', map_position: { x: 12, z: -10 }, name: 'AI' },
  ],
});

const planningPlacements = selectVisibleBoothPlacements(world.boothPlacements, world.districtPrograms);
const leftHiddenRenderPlacements = selectSectionVisibleBoothPlacements(planningPlacements, {
  arrival: true,
  left: false,
  middle: true,
  right: true,
});
const middleHiddenRenderPlacements = selectSectionVisibleBoothPlacements(planningPlacements, {
  arrival: true,
  left: true,
  middle: false,
  right: true,
});

assert.ok(planningPlacements.length > 0);
assert.ok(leftHiddenRenderPlacements.length < planningPlacements.length || middleHiddenRenderPlacements.length < planningPlacements.length);
assert.deepEqual(
  planningPlacements.map((placement) => placement.id).sort(),
  selectVisibleBoothPlacements(world.boothPlacements, world.districtPrograms).map((placement) => placement.id).sort(),
);

const canonicalPlan = buildCanonicalWorldPlanFromWorldContract(world);
function resolveReserveOverlappingMassIds(plan: typeof canonicalPlan) {
  return plan.filteredMasses
    .filter((mass) => {
      const halfX = mass.size[0] * 0.5;
      const halfZ = mass.size[2] * 0.5;
      return (
        Math.abs(mass.position[0] - plan.stadiumReserve.centerX) <= plan.stadiumReserve.halfWidth + halfX
        && Math.abs(mass.position[2] - plan.stadiumReserve.centerZ) <= plan.stadiumReserve.halfDepth + halfZ
      );
    })
    .map((mass) => mass.id)
    .sort();
}

const stableScreenIds = canonicalPlan.filteredScreenSurfaces.map((surface) => surface.id).sort();
const stableSocketIds = canonicalPlan.screenSockets.map((socket) => socket.id).sort();
const filteredInputPlan = buildCanonicalWorldPlan({
  boothPlacements: leftHiddenRenderPlacements,
  districtPrograms: world.districtPrograms,
  districtStride: EXPO_CANONICAL_DISTRICT_STRIDE,
  visualProfile: world.visualProfile,
});
const filteredInputScreenIds = filteredInputPlan.filteredScreenSurfaces.map((surface) => surface.id).sort();
const filteredInputSocketIds = filteredInputPlan.screenSockets.map((socket) => socket.id).sort();

assert.ok(stableScreenIds.length > 0);
assert.ok(stableSocketIds.length > 0);
assert.deepEqual(resolveReserveOverlappingMassIds(canonicalPlan), []);
assert.deepEqual(resolveReserveOverlappingMassIds(filteredInputPlan), []);
assert.deepEqual(stableScreenIds, buildCanonicalWorldPlanFromWorldContract(world).filteredScreenSurfaces.map((surface) => surface.id).sort());
assert.deepEqual(stableSocketIds, buildCanonicalWorldPlanFromWorldContract(world).screenSockets.map((socket) => socket.id).sort());
assert.notDeepEqual(filteredInputScreenIds, stableScreenIds);
assert.notDeepEqual(filteredInputSocketIds, stableSocketIds);
