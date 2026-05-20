import assert from 'node:assert/strict';
import { buildCanonicalWorldPlan, buildCanonicalWorldPlanFromWorldContract, EXPO_CANONICAL_DISTRICT_STRIDE } from '../runtime/planning/index.js';
import { buildCleanTowerLandmarks, buildRightSupportBlocks, buildSignatureMegaLandmarks, buildTowerScreenSurfaces } from '../runtime/planning/legacy/worldCityGeometry.js';
import { buildCityScreenHostMasses } from '../runtime/planning/screens/buildCityScreenHostMassPlan.js';
import { buildCityScreenSurfacePool } from '../runtime/planning/screens/buildCityScreenSurfacePool.js';
import type { CanonicalPrimitiveTexturePlane } from '../runtime/planning/types/index.js';
import { buildBoothWorldObjectRegistry } from '../runtime/world/inspection/worldObjectRegistry.js';
import { selectSectionVisibleBoothPlacements, selectVisibleBoothPlacements } from '../runtime/world/scene/useExpoWorldSceneRuntime.js';
import { buildCityPerimeterConnectors } from '../runtime/world/WorldCityPerimeterLayout.js';
import { buildWorldCityMegaLandmarkBounds } from '../runtime/world/WorldCityMegaLandmarkBounds.js';
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
const cityMassById = new Map(canonicalPlan.filteredMasses.map((mass) => [mass.id, mass]));
const unfilteredScreenSurfaces = buildCityScreenSurfacePool(3, EXPO_CANONICAL_DISTRICT_STRIDE);
const unfilteredScreenSurfaceById = new Map(unfilteredScreenSurfaces.map((surface) => [surface.id, surface]));
const unfilteredScreenHostById = new Map(
  buildCityScreenHostMasses(unfilteredScreenSurfaces).map((mass) => [mass.id, mass])
);
const clearanceDistrictPrograms = ['arrival-core', 'meetings', 'showcase-row'].map((sectorId, index) => ({
  ...world.districtPrograms[0],
  clusterIndex: index,
  sectorId,
}));
const clearanceTowers = buildCleanTowerLandmarks(
  clearanceDistrictPrograms,
  [],
  EXPO_CANONICAL_DISTRICT_STRIDE,
  world.visualProfile,
);
const clearanceTowerById = new Map(
  clearanceTowers.map((tower) => [
    tower.id,
    {
      position: tower.position,
      rotation: [0, 0, 0],
      size: [tower.baseSize[0], tower.baseSize[1] + tower.upperSize[1], tower.baseSize[2]],
    },
  ])
);
const clearanceTowerScreenSurfaceById = new Map(buildTowerScreenSurfaces(clearanceTowers).map((surface) => [surface.id, surface]));
const rightSupportMassById = new Map(buildRightSupportBlocks(
  clearanceDistrictPrograms,
  [],
  EXPO_CANONICAL_DISTRICT_STRIDE,
).map((mass) => [mass.id, mass]));
const signatureMegaById = new Map(buildSignatureMegaLandmarks(3, EXPO_CANONICAL_DISTRICT_STRIDE).map((mass) => [mass.id, mass]));
const megaLandmarkBoundsById = new Map(buildWorldCityMegaLandmarkBounds({
  districtCount: 3,
  districtStride: EXPO_CANONICAL_DISTRICT_STRIDE,
}).map((mass) => [mass.id, mass]));
const perimeterById = new Map(buildCityPerimeterConnectors(canonicalPlan.stadiumReserve).map((connector) => [connector.id, connector]));
const sideArrayScreenSurfaces = canonicalPlan.filteredScreenSurfaces
  .filter((surface) => surface.id.startsWith('screen-array-'))
  .sort((left, right) => left.id.localeCompare(right.id));
const sideArrayHostMassById = new Map(cityScreenHostMasses.map((mass) => [mass.id, mass]));
const screenSurfaceById = new Map(canonicalPlan.filteredScreenSurfaces.map((surface) => [surface.id, surface]));
const screenSocketById = new Map(canonicalPlan.screenSockets.map((socket) => [socket.id, socket]));
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
const isTexturePrimitive = (primitive: { kind: string }): primitive is CanonicalPrimitiveTexturePlane => primitive.kind === 'texture-plane';
function resolveBounds(entry: { position: number[]; rotation?: number[]; size: number[] }) {
  const yaw = entry.rotation?.[1] ?? 0;
  const halfX = (Math.abs(Math.cos(yaw)) * entry.size[0] * 0.5) + (Math.abs(Math.sin(yaw)) * entry.size[2] * 0.5);
  const halfZ = (Math.abs(Math.sin(yaw)) * entry.size[0] * 0.5) + (Math.abs(Math.cos(yaw)) * entry.size[2] * 0.5);
  return {
    maxX: entry.position[0] + halfX,
    maxZ: entry.position[2] + halfZ,
    minX: entry.position[0] - halfX,
    minZ: entry.position[2] - halfZ,
  };
}
function gapXZ(left: { position: number[]; rotation?: number[]; size: number[] }, right: { position: number[]; rotation?: number[]; size: number[] }) {
  const leftBounds = resolveBounds(left);
  const rightBounds = resolveBounds(right);
  const dx = Math.max(0, Math.max(leftBounds.minX - rightBounds.maxX, rightBounds.minX - leftBounds.maxX));
  const dz = Math.max(0, Math.max(leftBounds.minZ - rightBounds.maxZ, rightBounds.minZ - leftBounds.maxZ));
  return Math.sqrt((dx * dx) + (dz * dz));
}
function resolveClearanceEntry(id: string) {
  return cityMassById.get(id) ?? unfilteredScreenHostById.get(id) ?? rightSupportMassById.get(id) ?? clearanceTowerById.get(id) ?? signatureMegaById.get(id) ?? megaLandmarkBoundsById.get(id) ?? perimeterById.get(id);
}
function assertMinGap(idA: string, idB: string, minGap: number) {
  const left = resolveClearanceEntry(idA);
  const right = resolveClearanceEntry(idB);
  assert.ok(left, `${idA} must exist for city clearance checks`);
  assert.ok(right, `${idB} must exist for city clearance checks`);
  assert.ok(gapXZ(left, right) >= minGap, `${idA} must stay at least ${minGap} units from ${idB}`);
}
function assertMinGapIfPresent(idA: string, idB: string, minGap: number) {
  if (!resolveClearanceEntry(idA) || !resolveClearanceEntry(idB)) {
    return;
  }
  assertMinGap(idA, idB, minGap);
}
function assertWithinFrontCityPerimeter(id: string) {
  const mass = cityMassById.get(id);
  assert.ok(mass, `${id} must exist for city perimeter checks`);
  const bounds = resolveBounds(mass);
  assert.ok(bounds.minX >= -1720, `${id} must stay inside the left city perimeter`);
  assert.ok(bounds.maxX <= 1720, `${id} must stay inside the right city perimeter`);
  assert.ok(bounds.maxZ <= 780, `${id} must stay behind the front city perimeter`);
}
function assertSurfaceZSpacing(idA: string, idB: string, minSpacing: number) {
  const left = screenSurfaceById.get(idA) ?? unfilteredScreenSurfaceById.get(idA);
  const right = screenSurfaceById.get(idB) ?? unfilteredScreenSurfaceById.get(idB);
  assert.ok(left, `${idA} must exist for screen rhythm checks`);
  assert.ok(right, `${idB} must exist for screen rhythm checks`);
  assert.ok(Math.abs(left.position[2] - right.position[2]) >= minSpacing, `${idA} and ${idB} must keep at least ${minSpacing} units of Z rhythm`);
}
function assertSurfaceCenterDistance(idA: string, idB: string, minDistance: number) {
  const left = screenSurfaceById.get(idA) ?? unfilteredScreenSurfaceById.get(idA) ?? clearanceTowerScreenSurfaceById.get(idA);
  const right = screenSurfaceById.get(idB) ?? unfilteredScreenSurfaceById.get(idB) ?? clearanceTowerScreenSurfaceById.get(idB);
  assert.ok(left, `${idA} must exist for screen distance checks`);
  assert.ok(right, `${idB} must exist for screen distance checks`);
  assert.ok(
    Math.hypot(left.position[0] - right.position[0], left.position[2] - right.position[2]) >= minDistance,
    `${idA} and ${idB} must stay at least ${minDistance} units apart in X/Z`,
  );
}
function screenAssignmentFaceClearance(
  surface: NonNullable<ReturnType<typeof screenSurfaceById.get>>,
  socket: NonNullable<ReturnType<typeof screenSocketById.get>>,
  primitive: CanonicalPrimitiveTexturePlane,
) {
  const yaw = surface.rotation[1] ?? 0;
  const socketDepth = ((socket.position[0] - surface.position[0]) * Math.sin(yaw)) + ((socket.position[2] - surface.position[2]) * Math.cos(yaw));
  const frontFaceDepth = (surface.renderIntent?.housingDepth ?? surface.size[2]) * 0.5;
  return (socketDepth + primitive.position[2]) - frontFaceDepth;
}
function assertWorldBoothScreenHostClearance(worldContract: typeof world, label: string) {
  const plan = buildCanonicalWorldPlanFromWorldContract(worldContract);
  const mediaWallHosts = plan.filteredMasses.filter((mass) => /^screen-(?:marquee|array|spine)-/.test(mass.id) && mass.id.endsWith('-host'));
  const boothEntries = buildBoothWorldObjectRegistry(worldContract.boothPlacements).map((entry) => {
    assert.ok(entry.size, `${label}:${entry.id} must have a booth registry footprint size`);
    return { ...entry, size: entry.size };
  });

  assert.ok(mediaWallHosts.length > 0, `${label} must include media wall screen hosts for booth clearance checks`);
  assert.ok(boothEntries.length > 0, `${label} must include booths for screen-host clearance checks`);

  for (const booth of boothEntries) {
    for (const host of mediaWallHosts) {
      assert.ok(
        gapXZ(booth, host) >= 96,
        `${label}:${booth.id} must stay at least 96 units from ${host.id}`,
      );
    }
  }
}

assert.ok(stableScreenIds.length > 0);
assert.ok(stableSocketIds.length > 0);
for (const surface of canonicalPlan.filteredScreenSurfaces) {
  assert.ok(
    surface.renderIntent?.primitives?.every((primitive) => primitive.kind === 'box'),
    `${surface.id} screen host must use clean solid geometry only; transparent host planes cause screen shimmer/mutations`,
  );
  assert.ok(
    (surface.renderIntent?.primitives?.length ?? 0) <= 7,
    `${surface.id} screen host must stay simple instead of stacking old decorative frame layers`,
  );
}
for (const assignment of canonicalPlan.screenAssignments) {
  assert.equal(assignment.renderIntent?.fullBleed, true, `${assignment.id} must use full-bleed city-screen rendering`);
  assert.ok(
    assignment.renderIntent?.primitives?.every((primitive) => primitive.kind !== 'text'),
    `${assignment.id} must bake screen text into a stable billboard texture instead of live text meshes`,
  );
  const texturePrimitive = assignment.renderIntent?.primitives?.find(isTexturePrimitive);
  assert.ok(texturePrimitive, `${assignment.id} must render a generated billboard texture`);
  assert.equal(assignment.renderIntent?.primitives?.length, 1, `${assignment.id} must render one billboard overlay plane, not stacked backing planes`);
  assert.ok((texturePrimitive.url ?? '').startsWith('generated-billboard:'), `${assignment.id} must use a controlled full-bleed ad texture`);
  assert.equal(texturePrimitive.opacity ?? 1, 1, `${assignment.id} billboard texture must be opaque to avoid transparent-sort jitter`);
  const socket = screenSocketById.get(assignment.socketId);
  const surface = socket ? screenSurfaceById.get(socket.surfaceId) : null;
  assert.ok(socket, `${assignment.id} must reference an existing screen socket`);
  assert.ok(surface, `${assignment.id} must reference an existing screen surface`);
  assert.ok(
    socket && surface && screenAssignmentFaceClearance(surface, socket, texturePrimitive) >= 1.25,
    `${assignment.id} billboard texture must sit clearly in front of screen housing instead of z-fighting with the host shell`,
  );
  assert.ok(
    (assignment.renderIntent?.maxDistance ?? 0) >= (socket?.renderIntent?.maxDistance ?? 0),
    `${assignment.id} billboard content must stay visible for at least the host screen visibility range`,
  );
}
for (const socket of canonicalPlan.screenSockets) {
  const surface = screenSurfaceById.get(socket.surfaceId);
  assert.ok(surface, `${socket.id} must reference an existing screen surface`);
  const yaw = surface?.rotation[1] ?? 0;
  const socketDepth = surface
    ? ((socket.position[0] - surface.position[0]) * Math.sin(yaw)) + ((socket.position[2] - surface.position[2]) * Math.cos(yaw))
    : 0;
  assert.ok(
    socketDepth >= (surface?.renderIntent?.housingDepth ?? 0) * 0.54,
    `${socket.id} must place screen content in front of its housing shell instead of inside stacked surface geometry`,
  );
}
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
  const hostTopY = (host.vertical?.baseY ?? 0) + host.size[1];
  assert.ok(hostTopY >= surface.position[1] + (surface.size[1] * 0.5) + 38, `${host?.id} must carry the elevated side-array plate`);

  const socket = sideArraySocketBySurfaceId.get(surface.id);
  assert.ok(socket, `${surface.id} must have a screen socket`);
  assert.ok(socket.frameSize[0] >= surface.size[0] * 0.92, `${socket?.id} must expose most of the plate width`);
  assert.ok(socket.frameSize[1] >= surface.size[1] * 0.9, `${socket?.id} must expose most of the plate height`);
  const yaw = surface.rotation[1] ?? 0;
  const socketDepth = socket
    ? ((socket.position[0] - surface.position[0]) * Math.sin(yaw)) + ((socket.position[2] - surface.position[2]) * Math.cos(yaw))
    : 0;
  assert.ok(socketDepth >= (surface.renderIntent?.housingDepth ?? 0) * 0.54, `${socket?.id} must sit in front of the side-array housing face`);

  const assignment = socket ? sideArrayAssignmentBySocketId.get(socket.id) : null;
  assert.ok(assignment, `${socket?.id} must receive an assignment`);
  assert.equal(assignment?.renderIntent?.fullBleed, true, `${assignment?.id} must use full-bleed side-array rendering`);
  assert.ok((assignment?.renderIntent?.frameWidth ?? 0) >= surface.size[0] * 0.88, `${assignment?.id} must render a wide ad face`);
  assert.ok((assignment?.renderIntent?.frameHeight ?? 0) >= surface.size[1] * 0.84, `${assignment?.id} must render a tall ad face`);
  const texturePrimitive = assignment?.renderIntent?.primitives?.find(isTexturePrimitive);
  assert.ok(texturePrimitive, `${assignment?.id} must render a generated billboard texture`);
  assert.equal(assignment?.renderIntent?.primitives?.length, 1, `${assignment?.id} must render one side-array billboard overlay plane`);
  assert.ok((texturePrimitive.url ?? '').startsWith('generated-billboard:'), `${assignment?.id} must use a controlled side-array ad texture`);
  assert.equal(texturePrimitive.opacity ?? 1, 1, `${assignment?.id} texture must render opaque for stable camera rotation`);
  assert.ok(
    socket && screenAssignmentFaceClearance(surface, socket, texturePrimitive) >= 1.25,
    `${assignment?.id} side-array texture must sit clearly in front of the host shell`,
  );
}
assert.ok(
  cityScreenHostMasses.every((mass) => mass.planningSource?.sourceFunction === 'buildCityScreenHostMasses'),
  `screen host masses must be screen-planned, got: ${cityScreenHostMasses.map((mass) => `${mass.id}:${mass.planningSource?.sourceFunction}`).join(', ')}`,
);
assert.ok(
  cityScreenHostMasses.every((mass) => mass.planningSource?.safeEditSeam === 'src/modules/expo/runtime/planning/screens/buildCityScreenHostMassPlan.ts'),
);
assertMinGap('screen-array-left-upper-0-host', 'city-perimeter-left-wall', 72);
assertMinGap('screen-array-left-upper-1-host', 'city-perimeter-left-wall', 72);
assertMinGap('screen-array-left-upper-1-host', 'city-perimeter-left-stadium-terminus', 72);
assertMinGap('screen-array-left-upper-1-host', 'signature-mega-pylon-left', 72);
assertMinGap('screen-array-left-2-host', 'showcase-row-outer-support-tower-left', 72);
assertMinGap('screen-marquee-left-0-host', 'mega-landmark-left-grand-rampart', 72);
assertMinGap('screen-marquee-left-1-host', 'mega-landmark-left-disc-habitat', 72);
assertMinGap('screen-marquee-left-1-host', 'mega-landmark-left-split-monolith-pair', 72);
assertMinGap('screen-marquee-right-0-host', 'arrival-core-outer-support-tower-right', 120);
assertMinGap('screen-marquee-right-0-host', 'mega-landmark-right-media-halo', 72);
assertMinGap('screen-marquee-right-1-host', 'meetings-outer-support-tower-right', 120);
assertMinGap('screen-array-right-2-host', 'meetings-outer-support-tower-right', 72);
assertMinGap('screen-array-right-upper-0-host', 'city-perimeter-right-wall', 72);
assertMinGap('screen-array-right-upper-1-host', 'city-perimeter-right-wall', 72);
assertMinGap('arrival-core-right-support-rear', 'arrival-core-outer-support-tower-right', 72);
assertMinGap('arrival-core-mid-tower-right', 'mega-landmark-right-support-spire', 72);
assertMinGap('meetings-hero-tower-right', 'mega-landmark-media-frame-wall', 72);
assertMinGap('meetings-outer-support-tower-right', 'mega-landmark-media-frame-wall', 72);
assertMinGap('showcase-row-outer-support-tower-right', 'mega-landmark-media-frame-wall', 72);
assertMinGap('screen-marquee-left-0-host', 'ai-reactor-core-primitive-rig', 72);
assertMinGap('screen-array-left-0-host', 'ai-reactor-core-primitive-rig', 72);
assertMinGap('screen-array-left-upper-0-host', 'ai-reactor-core-primitive-rig', 72);
assertMinGap('screen-marquee-left-1-host', 'ai-reactor-core-primitive-rig', 72);
assertMinGap('screen-array-left-1-host', 'ai-reactor-core-primitive-rig', 72);
assertMinGap('screen-array-left-upper-1-host', 'ai-reactor-core-primitive-rig', 72);
assertMinGapIfPresent('screen-array-left-2-host', 'ai-reactor-core-primitive-rig', 72);
assertMinGapIfPresent('screen-array-left-upper-2-host', 'ai-reactor-core-primitive-rig', 72);
assertMinGap('screen-marquee-right-0-host', 'ai-oracle-chamber-primitive-rig', 72);
assertMinGap('screen-array-right-0-host', 'ai-oracle-chamber-primitive-rig', 72);
assertMinGap('screen-array-right-upper-0-host', 'ai-oracle-chamber-primitive-rig', 72);
assertMinGap('screen-marquee-right-1-host', 'ai-oracle-chamber-primitive-rig', 72);
assertMinGap('screen-array-right-1-host', 'ai-oracle-chamber-primitive-rig', 72);
assertMinGap('screen-array-right-upper-1-host', 'ai-oracle-chamber-primitive-rig', 72);
assertMinGapIfPresent('screen-array-right-2-host', 'ai-oracle-chamber-primitive-rig', 72);
assertMinGapIfPresent('screen-array-right-upper-2-host', 'ai-oracle-chamber-primitive-rig', 72);
assertMinGap('screen-spine-primary-1-host', 'ai-oracle-chamber-primitive-rig', 72);
assertMinGap('ai-oracle-chamber-primitive-rig', 'orbital-broadcast-foundry-curved-dish-core', 72);
assertMinGap('ai-oracle-chamber-primitive-rig', 'orbital-broadcast-foundry-main-deck', 72);
assertMinGap('ai-oracle-chamber-primitive-rig', 'screen-array-right-upper-3-host', 72);
assertWithinFrontCityPerimeter('ai-reactor-core-primitive-rig');
assertWithinFrontCityPerimeter('ai-oracle-chamber-primitive-rig');
assertWithinFrontCityPerimeter('center-sky-compass-primitive-rig');
assertSurfaceZSpacing('screen-marquee-left-1', 'screen-array-left-1', 96);
assertSurfaceZSpacing('screen-array-left-1', 'screen-array-left-upper-1', 96);
assertSurfaceCenterDistance('screen-marquee-right-2', 'screen-array-right-2', 340);
assertSurfaceCenterDistance('screen-marquee-right-2', 'screen-array-right-upper-2', 340);
assertSurfaceCenterDistance('screen-marquee-right-2', 'meetings-hero-tower-right-crown-beacon', 320);
assertSurfaceCenterDistance('screen-marquee-right-2', 'meetings-hero-tower-right-tower-ribbon', 320);
assertWorldBoothScreenHostClearance(world, 'primary-world');
assertWorldBoothScreenHostClearance(buildExpoWorldContract({
  companies: [
    { booth: { id: 'booth-a' }, boothType: 'hero', id: 'hero-a', name: 'Hero A', priority: 100, sector_id: 'sector-a', sponsorTier: 'hero' },
    { booth: { id: 'booth-b' }, boothType: 'premium', id: 'premium-b', name: 'Premium B', priority: 90, sponsorTier: 'gold' },
    { booth: { id: 'booth-c' }, boothType: 'standard', id: 'standard-c', name: 'Standard C', priority: 50, sector_id: 'sector-b', sponsorTier: 'silver' },
  ],
  sectors: [
    { color_theme: '#0ea5e9', id: 'sector-a', map_position: { x: 0, z: 0 }, name: 'Sector A' },
    { color_theme: '#22c55e', id: 'sector-b', map_position: { x: 12, z: -10 }, name: 'Sector B' },
  ],
}), 'arrival-discovery-world');
assert.deepEqual(Array.from(cityTowerSourceFunctions), ['buildCleanTowerLandmarks']);
assert.deepEqual(resolveReserveOverlappingMassIds(canonicalPlan), []);
assert.deepEqual(resolveReserveOverlappingMassIds(filteredInputPlan), []);
assert.deepEqual(stableScreenIds, buildCanonicalWorldPlanFromWorldContract(world).filteredScreenSurfaces.map((surface) => surface.id).sort());
assert.deepEqual(stableSocketIds, buildCanonicalWorldPlanFromWorldContract(world).screenSockets.map((socket) => socket.id).sort());
assert.notDeepEqual(filteredInputScreenIds, stableScreenIds);
assert.notDeepEqual(filteredInputSocketIds, stableSocketIds);
