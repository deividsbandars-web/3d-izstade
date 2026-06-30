import assert from 'node:assert/strict';
import {
  EXPO_VERTICAL_CITY_SYSTEM,
  getVerticalAccessNodesForLevel,
  getVerticalWalkableRegionsForLevel,
  type ExpoVerticalAccessNode,
  type ExpoVerticalElevatorRoute,
  type ExpoVerticalWalkableRegion,
} from '../runtime/planning/vertical/verticalCitySystem.js';
import {
  buildElevatorRouteSegments,
  getElevatorRouteTotalLength,
  resolveElevatorRideablePlayerY,
  resolveElevatorRoutePosition,
} from '../runtime/planning/vertical/elevatorRouteMotion.js';

const levels = new Set(EXPO_VERTICAL_CITY_SYSTEM.levels.map((level) => level.id));

assert.equal(EXPO_VERTICAL_CITY_SYSTEM.defaultFloorHeight, 36);
assert.equal(EXPO_VERTICAL_CITY_SYSTEM.pilotZoneId, 'tower-cluster');
assert.deepEqual([...levels], ['ground', 'level-1', 'level-2', 'roof', 'tower', 'skydeck']);

for (const node of EXPO_VERTICAL_CITY_SYSTEM.accessNodes) {
  assert.ok(levels.has(node.level), `${node.id} must start from a known vertical level`);
  assert.ok(levels.has(node.targetLevel), `${node.id} must target a known vertical level`);
  assert.ok(node.radius > 0, `${node.id} must have a usable trigger radius`);
  assert.equal(node.position.length, 3);
  assert.equal(node.targetPosition.length, 3);
  assert.ok(node.position.every(Number.isFinite));
  assert.ok(node.targetPosition.every(Number.isFinite));
}

for (const route of EXPO_VERTICAL_CITY_SYSTEM.elevatorRoutes) {
  assert.ok(route.waypoints.length >= 2, `${route.id} must have at least two waypoints`);
  assert.ok(route.cycleSeconds >= 6, `${route.id} must have a readable animation cycle`);
  assert.ok(route.rideable, `${route.id} must expose a rideable cabin floor`);
  assert.ok(route.cabinSize.every((value) => value > 0 && Number.isFinite(value)));
  assert.ok(route.rideable.footprintSize.every((value) => value > 0 && Number.isFinite(value)));
  assert.ok(Number.isFinite(route.rideable.floorPlayerOffsetY));
  assert.ok(route.rideable.pickupToleranceY > 0);
  assert.ok((route.stationDwellSeconds ?? 0) >= 0, `${route.id} must expose a valid station dwell value`);
  assert.ok(route.stationSize.every((value) => value > 0 && Number.isFinite(value)));
  assert.ok(route.waypoints.every((point) => point.length === 3 && point.every(Number.isFinite)));
}

assert.deepEqual(EXPO_VERTICAL_CITY_SYSTEM.elevatorRoutes.map((route) => route.id), [
  'sky-market-spine-animated-market-lift',
  'tower-cluster-mega-highrise-animated-panoramic-lift',
  'tower-cluster-television-tower-animated-city-lift',
]);

const routeById = new Map(EXPO_VERTICAL_CITY_SYSTEM.elevatorRoutes.map((route) => [route.id, route]));
const getRoute = (id: string): ExpoVerticalElevatorRoute => {
  const route = routeById.get(id);
  assert.ok(route, `${id} route must exist`);
  return route;
};

const skyMarketRoute = getRoute('sky-market-spine-animated-market-lift');
assert.deepEqual(skyMarketRoute.waypoints, [
  [-650, 41, -520],
  [-650, 577, -520],
  [-650, 955, -520],
]);
assert.deepEqual(skyMarketRoute.cabinSize, [86, 96, 70]);
assert.deepEqual(skyMarketRoute.rideable, {
  floorPlayerOffsetY: -36,
  footprintSize: [98, 78],
  pickupToleranceY: 18,
});
assert.equal(resolveElevatorRideablePlayerY(skyMarketRoute, 41), 5);
assert.equal(resolveElevatorRideablePlayerY(skyMarketRoute, 577), 541);
assert.equal(resolveElevatorRideablePlayerY(skyMarketRoute, 955), 919);
assert.equal(skyMarketRoute.cycleSeconds, 30);
assert.equal(skyMarketRoute.stationDwellSeconds, 0);

const megaHighriseRoute = getRoute('tower-cluster-mega-highrise-animated-panoramic-lift');
assert.deepEqual(megaHighriseRoute.waypoints, [
  [-220, 42, -1130],
  [-220, 588, -1130],
  [-220, 1608, -1130],
]);
assert.deepEqual(megaHighriseRoute.cabinSize, [82, 96, 60]);
assert.deepEqual(megaHighriseRoute.rideable, {
  floorPlayerOffsetY: -36,
  footprintSize: [98, 68],
  pickupToleranceY: 18,
});
assert.equal(resolveElevatorRideablePlayerY(megaHighriseRoute, 42), 6);
assert.equal(resolveElevatorRideablePlayerY(megaHighriseRoute, 588), 552);
assert.equal(resolveElevatorRideablePlayerY(megaHighriseRoute, 1608), 1572);
assert.equal(megaHighriseRoute.cycleSeconds, 32);
assert.equal(megaHighriseRoute.stationDwellSeconds, 0);

const televisionTowerRoute = getRoute('tower-cluster-television-tower-animated-city-lift');
assert.deepEqual(televisionTowerRoute.waypoints, [
  [620, 48, -900],
  [620, 1973, -900],
  [620, 3287, -900],
  [620, 5293, -900],
]);
assert.deepEqual(televisionTowerRoute.cabinSize, [72, 106, 58]);
assert.deepEqual(televisionTowerRoute.rideable, {
  floorPlayerOffsetY: -41,
  footprintSize: [88, 68],
  pickupToleranceY: 18,
});
assert.equal(resolveElevatorRideablePlayerY(televisionTowerRoute, 48), 7);
assert.equal(resolveElevatorRideablePlayerY(televisionTowerRoute, 1973), 1932);
assert.equal(resolveElevatorRideablePlayerY(televisionTowerRoute, 3287), 3246);
assert.equal(resolveElevatorRideablePlayerY(televisionTowerRoute, 5293), 5252);
assert.equal(televisionTowerRoute.cycleSeconds, 62);
assert.equal(televisionTowerRoute.stationDwellSeconds, 0);

const televisionElevatorSegments = buildElevatorRouteSegments(televisionTowerRoute.waypoints);
const televisionElevatorPositionDuringAscent = resolveElevatorRoutePosition({
  elapsedTime: 17,
  fallbackPosition: televisionTowerRoute.waypoints[0],
  route: televisionTowerRoute,
  segments: televisionElevatorSegments,
  totalLength: getElevatorRouteTotalLength(televisionElevatorSegments),
});
assert.equal(televisionElevatorPositionDuringAscent[0], 620);
assert.equal(televisionElevatorPositionDuringAscent[2], -900);
assert.ok(televisionElevatorPositionDuringAscent[1] > 48);
assert.ok(televisionElevatorPositionDuringAscent[1] < 5293);
assert.notDeepEqual(televisionElevatorPositionDuringAscent, [620, 1973, -900]);
const televisionElevatorPositionDuringReturn = resolveElevatorRoutePosition({
  elapsedTime: 44,
  fallbackPosition: televisionTowerRoute.waypoints[0],
  route: televisionTowerRoute,
  segments: televisionElevatorSegments,
  totalLength: getElevatorRouteTotalLength(televisionElevatorSegments),
});
assert.equal(televisionElevatorPositionDuringReturn[0], 620);
assert.equal(televisionElevatorPositionDuringReturn[2], -900);
assert.ok(televisionElevatorPositionDuringReturn[1] > 48);
assert.ok(televisionElevatorPositionDuringReturn[1] < 5293);
assert.notDeepEqual(televisionElevatorPositionDuringReturn, [620, 5293, -900]);

const groundNodes = getVerticalAccessNodesForLevel(EXPO_VERTICAL_CITY_SYSTEM, 'ground');
const level1Nodes = getVerticalAccessNodesForLevel(EXPO_VERTICAL_CITY_SYSTEM, 'level-1');
const level2Nodes = getVerticalAccessNodesForLevel(EXPO_VERTICAL_CITY_SYSTEM, 'level-2');
const roofNodes = getVerticalAccessNodesForLevel(EXPO_VERTICAL_CITY_SYSTEM, 'roof');
const towerNodes = getVerticalAccessNodesForLevel(EXPO_VERTICAL_CITY_SYSTEM, 'tower');
const skydeckNodes = getVerticalAccessNodesForLevel(EXPO_VERTICAL_CITY_SYSTEM, 'skydeck');
const level1WalkableRegions = getVerticalWalkableRegionsForLevel(EXPO_VERTICAL_CITY_SYSTEM, 'level-1');
const level2WalkableRegions = getVerticalWalkableRegionsForLevel(EXPO_VERTICAL_CITY_SYSTEM, 'level-2');
const roofWalkableRegions = getVerticalWalkableRegionsForLevel(EXPO_VERTICAL_CITY_SYSTEM, 'roof');
const towerWalkableRegions = getVerticalWalkableRegionsForLevel(EXPO_VERTICAL_CITY_SYSTEM, 'tower');
const skydeckWalkableRegions = getVerticalWalkableRegionsForLevel(EXPO_VERTICAL_CITY_SYSTEM, 'skydeck');

assert.deepEqual(groundNodes.map((node) => node.id), [
  'sky-market-spine-lift-ground-to-lower',
  'tower-cluster-vertical-pilot-lift-ground',
  'tower-cluster-vertical-pilot-lift-ground-to-level-1',
  'tower-cluster-mega-highrise-lift-ground-to-skybridge',
  'tower-cluster-east-needle-jump-ground-to-landing',
  'tower-cluster-rear-needle-jump-ground-to-landing',
  'tower-cluster-television-tower-lift-ground-to-observation',
]);
assert.deepEqual(level1Nodes.map((node) => node.id), [
  'tower-cluster-vertical-pilot-lift-level-1-to-ground',
  'tower-cluster-vertical-pilot-lift-level-1-to-level-2',
]);
assert.deepEqual(level2Nodes.map((node) => node.id), [
  'tower-cluster-vertical-pilot-lift-level-2',
  'tower-cluster-vertical-pilot-lift-level-2-to-level-1',
  'tower-cluster-vertical-pilot-lift-level-2-to-roof',
]);
assert.deepEqual(roofNodes.map((node) => node.id), [
  'tower-cluster-vertical-pilot-lift-roof-to-level-2',
  'tower-cluster-vertical-pilot-lift-roof-to-tower',
]);
assert.deepEqual(towerNodes.map((node) => node.id), [
  'sky-market-spine-lift-lower-to-ground',
  'sky-market-spine-lift-lower-to-upper',
  'tower-cluster-vertical-pilot-lift-tower-to-roof',
  'tower-cluster-mega-highrise-lift-skybridge-to-ground',
  'tower-cluster-mega-highrise-lift-skybridge-to-skydeck',
  'tower-cluster-east-needle-jump-landing-to-ground',
  'tower-cluster-east-needle-lift-landing-to-skydeck',
  'tower-cluster-rear-needle-jump-landing-to-ground',
  'tower-cluster-television-tower-lift-observation-to-ground',
  'tower-cluster-television-tower-lift-observation-to-broadcast',
  'tower-cluster-television-tower-lift-broadcast-to-observation',
  'tower-cluster-television-tower-lift-broadcast-to-top',
]);
assert.deepEqual(skydeckNodes.map((node) => node.id), [
  'sky-market-spine-lift-upper-to-lower',
  'tower-cluster-mega-highrise-lift-skydeck-to-skybridge',
  'tower-cluster-east-needle-lift-skydeck-to-landing',
  'tower-cluster-television-tower-lift-top-to-broadcast',
]);

const nodeById = new Map(EXPO_VERTICAL_CITY_SYSTEM.accessNodes.map((node) => [node.id, node]));
const assertNode = (
  id: string,
  position: [number, number, number],
  targetPosition: [number, number, number],
  targetLevel: ExpoVerticalAccessNode['targetLevel'],
  autoActivate?: boolean,
) => {
  const node = nodeById.get(id);
  assert.ok(node, `${id} node must exist`);
  assert.equal(node.targetLevel, targetLevel);
  if (typeof autoActivate === 'boolean') {
    assert.equal(node.autoActivate, autoActivate);
  }
  assert.deepEqual(node.position, position);
  assert.deepEqual(node.targetPosition, targetPosition);
};

assertNode('sky-market-spine-lift-ground-to-lower', [-650, 0.25, -520], [-650, 541, -520], 'tower', false);
assertNode('sky-market-spine-lift-lower-to-ground', [-650, 537, -520], [-650, 5, -520], 'ground', false);
assertNode('sky-market-spine-lift-lower-to-upper', [-650, 537, -520], [-650, 919, -520], 'skydeck', false);
assertNode('sky-market-spine-lift-upper-to-lower', [-650, 915, -520], [-650, 541, -520], 'tower', false);
assertNode('tower-cluster-vertical-pilot-lift-ground', [900, 0.25, -620], [900, 124, -680], 'level-2');
assertNode('tower-cluster-vertical-pilot-lift-ground-to-level-1', [820, 0.25, -620], [820, 70, -650], 'level-1');
assertNode('tower-cluster-vertical-pilot-lift-level-1-to-ground', [820, 67, -650], [820, 5, -620], 'ground');
assertNode('tower-cluster-vertical-pilot-lift-level-1-to-level-2', [980, 67, -650], [980, 124, -680], 'level-2');
assertNode('tower-cluster-vertical-pilot-lift-level-2', [900, 121, -680], [900, 5, -620], 'ground');
assertNode('tower-cluster-vertical-pilot-lift-level-2-to-level-1', [980, 121, -680], [980, 70, -650], 'level-1');
assertNode('tower-cluster-vertical-pilot-lift-level-2-to-roof', [760, 121, -690], [900, 170, -710], 'roof');
assertNode('tower-cluster-vertical-pilot-lift-roof-to-level-2', [760, 167, -710], [900, 124, -680], 'level-2');
assertNode('tower-cluster-vertical-pilot-lift-roof-to-tower', [900, 167, -710], [900, 248, -650], 'tower');
assertNode('tower-cluster-vertical-pilot-lift-tower-to-roof', [900, 245, -650], [900, 170, -710], 'roof');
assertNode('tower-cluster-mega-highrise-lift-ground-to-skybridge', [-220, 0.25, -1130], [-220, 552, -1130], 'tower', false);
assertNode('tower-cluster-mega-highrise-lift-skybridge-to-ground', [-220, 548, -1130], [-220, 5, -1130], 'ground', false);
assertNode('tower-cluster-mega-highrise-lift-skybridge-to-skydeck', [-220, 548, -1130], [-220, 1572, -1130], 'skydeck', false);
assertNode('tower-cluster-mega-highrise-lift-skydeck-to-skybridge', [-220, 1568, -1130], [-220, 552, -1130], 'tower', false);
assertNode('tower-cluster-east-needle-jump-ground-to-landing', [-360, 0.25, -1245], [-360, 868, -1292], 'tower');
assertNode('tower-cluster-east-needle-jump-landing-to-ground', [-360, 864, -1292], [-360, 5, -1245], 'ground');
assertNode('tower-cluster-east-needle-lift-landing-to-skydeck', [-394, 864, -1292], [-450, 1572, -1250], 'skydeck');
assertNode('tower-cluster-east-needle-lift-skydeck-to-landing', [-492, 1568, -1250], [-360, 868, -1292], 'tower');
assertNode('tower-cluster-rear-needle-jump-ground-to-landing', [-605, 0.25, -1418], [-550, 676, -1474], 'tower');
assertNode('tower-cluster-rear-needle-jump-landing-to-ground', [-550, 672, -1474], [-605, 5, -1418], 'ground');
assertNode('tower-cluster-television-tower-lift-ground-to-observation', [620, 0.25, -900], [620, 1932, -900], 'tower', false);
assertNode('tower-cluster-television-tower-lift-observation-to-ground', [620, 1928, -900], [620, 5, -900], 'ground', false);
assertNode('tower-cluster-television-tower-lift-observation-to-broadcast', [620, 1928, -900], [620, 3246, -900], 'tower', false);
assertNode('tower-cluster-television-tower-lift-broadcast-to-observation', [620, 3242, -900], [620, 1932, -900], 'tower', false);
assertNode('tower-cluster-television-tower-lift-broadcast-to-top', [620, 3242, -900], [620, 5252, -900], 'skydeck', false);
assertNode('tower-cluster-television-tower-lift-top-to-broadcast', [620, 5248, -900], [620, 3246, -900], 'tower', false);

assert.deepEqual(level1WalkableRegions.map((region) => region.id), ['tower-cluster-vertical-pilot-level-1-walkable-deck']);
assert.deepEqual(level2WalkableRegions.map((region) => region.id), ['tower-cluster-vertical-pilot-level-2-walkable-deck']);
assert.deepEqual(roofWalkableRegions.map((region) => region.id), ['tower-cluster-vertical-pilot-roof-walkable-deck']);
assert.deepEqual(towerWalkableRegions.map((region) => region.id), [
  'sky-market-spine-lower-market-deck-walkable',
  'tower-cluster-vertical-pilot-tower-walkable-deck',
  'tower-cluster-mega-highrise-skybridge-deck-walkable',
  'tower-cluster-mega-highrise-east-needle-landing-walkable',
  'tower-cluster-mega-highrise-rear-needle-landing-walkable',
  'tower-cluster-television-tower-observation-ring-west-walkable',
  'tower-cluster-television-tower-observation-ring-east-walkable',
  'tower-cluster-television-tower-observation-ring-front-walkable',
  'tower-cluster-television-tower-observation-ring-rear-walkable',
  'tower-cluster-television-tower-broadcast-collar-west-walkable',
  'tower-cluster-television-tower-broadcast-collar-east-walkable',
  'tower-cluster-television-tower-broadcast-collar-front-walkable',
  'tower-cluster-television-tower-broadcast-collar-rear-walkable',
]);
assert.deepEqual(skydeckWalkableRegions.map((region) => region.id), [
  'sky-market-spine-upper-market-deck-walkable',
  'tower-cluster-mega-highrise-crown-skydeck-walkable',
  'tower-cluster-television-tower-top-beacon-walkable',
]);

const regionById = new Map(EXPO_VERTICAL_CITY_SYSTEM.walkableRegions.map((region) => [region.id, region]));
const assertRegion = (
  id: string,
  position: [number, number, number],
  size: [number, number],
  playerY: number,
  level: ExpoVerticalWalkableRegion['level'],
) => {
  const region = regionById.get(id);
  assert.ok(region, `${id} region must exist`);
  assert.equal(region.level, level);
  assert.deepEqual(region.position, position);
  assert.deepEqual(region.size, size);
  assert.equal(region.playerY, playerY);
};

assertRegion('sky-market-spine-lower-market-deck-walkable', [0, 541, -520], [780, 1040], 541, 'tower');
assertRegion('sky-market-spine-upper-market-deck-walkable', [0, 919, -520], [580, 900], 919, 'skydeck');
assertRegion('tower-cluster-vertical-pilot-level-1-walkable-deck', [900, 70, -650], [228, 46], 70, 'level-1');
assertRegion('tower-cluster-vertical-pilot-level-2-walkable-deck', [900, 124, -680], [276, 54], 124, 'level-2');
assertRegion('tower-cluster-vertical-pilot-roof-walkable-deck', [900, 170, -710], [340, 64], 170, 'roof');
assertRegion('tower-cluster-vertical-pilot-tower-walkable-deck', [900, 248, -650], [220, 54], 248, 'tower');
assertRegion('tower-cluster-mega-highrise-skybridge-deck-walkable', [-570, 552, -1245], [260, 74], 552, 'tower');
assertRegion('tower-cluster-mega-highrise-east-needle-landing-walkable', [-360, 868, -1292], [132, 72], 868, 'tower');
assertRegion('tower-cluster-mega-highrise-rear-needle-landing-walkable', [-550, 676, -1474], [148, 66], 676, 'tower');
assertRegion('tower-cluster-mega-highrise-crown-skydeck-walkable', [-450, 1572, -1250], [300, 180], 1572, 'skydeck');
assertRegion('tower-cluster-television-tower-observation-ring-west-walkable', [224, 1932, -1240], [170, 440], 1932, 'tower');
assertRegion('tower-cluster-television-tower-observation-ring-east-walkable', [496, 1932, -1240], [170, 440], 1932, 'tower');
assertRegion('tower-cluster-television-tower-observation-ring-front-walkable', [360, 1932, -1104], [70, 170], 1932, 'tower');
assertRegion('tower-cluster-television-tower-observation-ring-rear-walkable', [360, 1932, -1376], [70, 170], 1932, 'tower');
assertRegion('tower-cluster-television-tower-broadcast-collar-west-walkable', [273, 3246, -1240], [100, 280], 3246, 'tower');
assertRegion('tower-cluster-television-tower-broadcast-collar-east-walkable', [447, 3246, -1240], [100, 280], 3246, 'tower');
assertRegion('tower-cluster-television-tower-broadcast-collar-front-walkable', [360, 3246, -1153], [70, 100], 3246, 'tower');
assertRegion('tower-cluster-television-tower-broadcast-collar-rear-walkable', [360, 3246, -1327], [70, 100], 3246, 'tower');
assertRegion('tower-cluster-television-tower-top-beacon-walkable', [360, 5252, -1240], [96, 96], 5252, 'skydeck');
