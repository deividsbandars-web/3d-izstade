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
const cityMassSourceFunctions = new Set(canonicalPlan.filteredMasses.map((mass) => mass.planningSource?.sourceFunction ?? 'missing'));
const cityTowerSourceFunctions = new Set(canonicalPlan.filteredTowerLandmarks.map((tower) => tower.planningSource?.sourceFunction ?? 'missing'));
const renderedLegacyMediaWallMassIds = canonicalPlan.filteredMasses
  .filter((mass) => mass.id.startsWith('media-wall-'))
  .map((mass) => mass.id)
  .sort();
const cityScreenHostMasses = canonicalPlan.filteredMasses
  .filter((mass) => mass.id.startsWith('screen-') && mass.id.endsWith('-host'))
  .sort((left, right) => left.id.localeCompare(right.id));
const sideArrayScreenSurfaces = canonicalPlan.filteredScreenSurfaces
  .filter((surface) => surface.id.startsWith('screen-array-'))
  .sort((left, right) => left.id.localeCompare(right.id));
const sideArrayHostMassById = new Map(cityScreenHostMasses.map((mass) => [mass.id, mass]));
const sideArraySocketBySurfaceId = new Map(canonicalPlan.screenSockets.map((socket) => [socket.surfaceId, socket]));
const sideArrayAssignmentBySocketId = new Map(canonicalPlan.screenAssignments.map((assignment) => [assignment.socketId, assignment]));
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
assert.ok(
  canonicalPlan.filteredMasses.every((mass) => mass.planningSource?.sourceFile && mass.planningSource.sourceFunction !== 'buildCanonicalWorldPlan'),
  `filtered city masses must keep concrete non-generic source functions: ${Array.from(cityMassSourceFunctions).join(', ')}`,
);
assert.deepEqual(renderedLegacyMediaWallMassIds, []);
assert.ok(canonicalPlan.filteredMasses.some((mass) => mass.id === 'screen-marquee-left-0-host'));
assert.ok(!cityMassSourceFunctions.has('buildMediaWallLandmarks'));
assert.ok(cityScreenHostMasses.length > 0);
assert.ok(sideArrayScreenSurfaces.length > 0);
for (const surface of sideArrayScreenSurfaces) {
  const match = /^screen-array-(?:left|right)(-upper)?-(\d+)$/.exec(surface.id);
  assert.ok(match, `unexpected side-array screen id: ${surface.id}`);
  const districtIndex = Number(match[2]);
  const isUpper = Boolean(match[1]);
  const minSurfaceY = isUpper ? 216 + (districtIndex * 12) : 146 + (districtIndex * 14);
  const minSurfaceHeight = isUpper ? 184 + (districtIndex * 8) : 192 + (districtIndex * 10);
  assert.ok(surface.position[1] >= minSurfaceY, `${surface.id} must be elevated for side/far visibility`);
  assert.ok(surface.size[1] >= minSurfaceHeight, `${surface.id} must use a tall side/far host plate`);

  const host = sideArrayHostMassById.get(`${surface.id}-host`);
  assert.ok(host, `${surface.id} must have a planned host mass`);
  assert.ok(host.size[0] >= surface.size[0] * 1.25, `${host?.id} must be wider than its side-array screen`);
  assert.ok(host.size[1] >= surface.position[1] + (surface.size[1] * 0.5) + 38, `${host?.id} must carry the elevated side-array plate`);

  const socket = sideArraySocketBySurfaceId.get(surface.id);
  assert.ok(socket, `${surface.id} must have a screen socket`);
  assert.ok(socket.frameSize[0] >= surface.size[0] * 0.92, `${socket?.id} must expose most of the plate width`);
  assert.ok(socket.frameSize[1] >= surface.size[1] * 0.9, `${socket?.id} must expose most of the plate height`);

  const assignment = socket ? sideArrayAssignmentBySocketId.get(socket.id) : null;
  assert.ok(assignment, `${socket?.id} must receive an assignment`);
  assert.equal(assignment?.renderIntent?.fullBleed, true, `${assignment?.id} must use full-bleed side-array rendering`);
  assert.ok((assignment?.renderIntent?.frameWidth ?? 0) >= surface.size[0] * 0.88, `${assignment?.id} must render a wide ad face`);
  assert.ok((assignment?.renderIntent?.frameHeight ?? 0) >= surface.size[1] * 0.84, `${assignment?.id} must render a tall ad face`);
}
assert.ok(
  cityScreenHostMasses.every((mass) => mass.planningSource?.sourceFunction === 'buildCityScreenHostMasses'),
  `screen host masses must be screen-planned, got: ${cityScreenHostMasses.map((mass) => `${mass.id}:${mass.planningSource?.sourceFunction}`).join(', ')}`,
);
assert.ok(
  cityScreenHostMasses.every((mass) => mass.planningSource?.safeEditSeam === 'src/modules/expo/runtime/planning/screens/buildCityScreenHostMassPlan.ts'),
);
assert.deepEqual(Array.from(cityTowerSourceFunctions), ['buildCleanTowerLandmarks']);
assert.deepEqual(resolveReserveOverlappingMassIds(canonicalPlan), []);
assert.deepEqual(resolveReserveOverlappingMassIds(filteredInputPlan), []);
assert.deepEqual(stableScreenIds, buildCanonicalWorldPlanFromWorldContract(world).filteredScreenSurfaces.map((surface) => surface.id).sort());
assert.deepEqual(stableSocketIds, buildCanonicalWorldPlanFromWorldContract(world).screenSockets.map((socket) => socket.id).sort());
assert.notDeepEqual(filteredInputScreenIds, stableScreenIds);
assert.notDeepEqual(filteredInputSocketIds, stableSocketIds);
