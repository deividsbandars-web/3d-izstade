import assert from 'node:assert/strict';
import {
  EXPO_VERTICAL_CITY_SYSTEM,
  getVerticalAccessNodesForLevel,
  getVerticalWalkableRegionsForLevel,
} from '../runtime/planning/vertical/verticalCitySystem.js';

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
  assert.ok(route.cabinSize.every((value) => value > 0 && Number.isFinite(value)));
  assert.ok(route.stationSize.every((value) => value > 0 && Number.isFinite(value)));
  assert.ok(route.waypoints.every((point) => point.length === 3 && point.every(Number.isFinite)));
}

assert.deepEqual(EXPO_VERTICAL_CITY_SYSTEM.elevatorRoutes.map((route) => route.id), [
  'tower-cluster-mega-highrise-animated-panoramic-lift',
  'tower-cluster-television-tower-animated-city-lift',
]);
assert.deepEqual(EXPO_VERTICAL_CITY_SYSTEM.elevatorRoutes[0]?.waypoints, [
  [-296, 42, -1134],
  [-296, 552, -1134],
  [-296, 1572, -1134],
]);
assert.deepEqual(EXPO_VERTICAL_CITY_SYSTEM.elevatorRoutes[0]?.cabinSize, [82, 96, 60]);
assert.equal(EXPO_VERTICAL_CITY_SYSTEM.elevatorRoutes[0]?.cycleSeconds, 14);
assert.deepEqual(EXPO_VERTICAL_CITY_SYSTEM.elevatorRoutes[1]?.waypoints, [
  [360, 48, -1012],
  [360, 1932, -1012],
  [360, 3246, -1012],
  [360, 5200, -1012],
]);
assert.deepEqual(EXPO_VERTICAL_CITY_SYSTEM.elevatorRoutes[1]?.cabinSize, [72, 106, 58]);
assert.equal(EXPO_VERTICAL_CITY_SYSTEM.elevatorRoutes[1]?.cycleSeconds, 18);

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
  'tower-cluster-mega-highrise-lift-skydeck-to-skybridge',
  'tower-cluster-east-needle-lift-skydeck-to-landing',
  'tower-cluster-television-tower-lift-top-to-broadcast',
]);
assert.equal(groundNodes[0]?.targetLevel, 'level-2');
assert.deepEqual(groundNodes[0]?.position, [900, 0.25, -620]);
assert.deepEqual(groundNodes[0]?.targetPosition, [900, 124, -680]);
assert.equal(groundNodes[1]?.targetLevel, 'level-1');
assert.deepEqual(groundNodes[1]?.position, [820, 0.25, -620]);
assert.deepEqual(groundNodes[1]?.targetPosition, [820, 70, -650]);
assert.equal(level1Nodes[0]?.targetLevel, 'ground');
assert.deepEqual(level1Nodes[0]?.position, [820, 67, -650]);
assert.deepEqual(level1Nodes[0]?.targetPosition, [820, 5, -620]);
assert.equal(level1Nodes[1]?.targetLevel, 'level-2');
assert.deepEqual(level1Nodes[1]?.position, [980, 67, -650]);
assert.deepEqual(level1Nodes[1]?.targetPosition, [980, 124, -680]);
assert.equal(level2Nodes[0]?.targetLevel, 'ground');
assert.deepEqual(level2Nodes[0]?.position, [900, 121, -680]);
assert.deepEqual(level2Nodes[0]?.targetPosition, [900, 5, -620]);
assert.equal(level2Nodes[1]?.targetLevel, 'level-1');
assert.deepEqual(level2Nodes[1]?.position, [980, 121, -680]);
assert.deepEqual(level2Nodes[1]?.targetPosition, [980, 70, -650]);
assert.equal(level2Nodes[2]?.targetLevel, 'roof');
assert.deepEqual(level2Nodes[2]?.position, [760, 121, -690]);
assert.deepEqual(level2Nodes[2]?.targetPosition, [900, 170, -710]);
assert.equal(roofNodes[0]?.targetLevel, 'level-2');
assert.deepEqual(roofNodes[0]?.position, [760, 167, -710]);
assert.deepEqual(roofNodes[0]?.targetPosition, [900, 124, -680]);
assert.equal(roofNodes[1]?.targetLevel, 'tower');
assert.deepEqual(roofNodes[1]?.position, [900, 167, -710]);
assert.deepEqual(roofNodes[1]?.targetPosition, [900, 248, -650]);
assert.equal(towerNodes[0]?.targetLevel, 'roof');
assert.deepEqual(towerNodes[0]?.position, [900, 245, -650]);
assert.deepEqual(towerNodes[0]?.targetPosition, [900, 170, -710]);
assert.equal(groundNodes[2]?.targetLevel, 'tower');
assert.deepEqual(groundNodes[2]?.position, [-570, 0.25, -1185]);
assert.deepEqual(groundNodes[2]?.targetPosition, [-570, 552, -1245]);
assert.equal(towerNodes[1]?.targetLevel, 'ground');
assert.deepEqual(towerNodes[1]?.position, [-570, 548, -1245]);
assert.deepEqual(towerNodes[1]?.targetPosition, [-570, 5, -1185]);
assert.equal(towerNodes[2]?.targetLevel, 'skydeck');
assert.deepEqual(towerNodes[2]?.position, [-496, 548, -1245]);
assert.deepEqual(towerNodes[2]?.targetPosition, [-450, 1572, -1250]);
assert.equal(skydeckNodes[0]?.targetLevel, 'tower');
assert.deepEqual(skydeckNodes[0]?.position, [-450, 1568, -1250]);
assert.deepEqual(skydeckNodes[0]?.targetPosition, [-570, 552, -1245]);
assert.equal(groundNodes[3]?.targetLevel, 'tower');
assert.deepEqual(groundNodes[3]?.position, [-360, 0.25, -1245]);
assert.deepEqual(groundNodes[3]?.targetPosition, [-360, 868, -1292]);
assert.equal(groundNodes[4]?.targetLevel, 'tower');
assert.deepEqual(groundNodes[4]?.position, [-605, 0.25, -1418]);
assert.deepEqual(groundNodes[4]?.targetPosition, [-550, 676, -1474]);
assert.equal(groundNodes[5]?.targetLevel, 'tower');
assert.deepEqual(groundNodes[5]?.position, [360, 0.25, -1030]);
assert.deepEqual(groundNodes[5]?.targetPosition, [360, 1932, -1104]);
assert.equal(towerNodes[3]?.targetLevel, 'ground');
assert.deepEqual(towerNodes[3]?.position, [-360, 864, -1292]);
assert.deepEqual(towerNodes[3]?.targetPosition, [-360, 5, -1245]);
assert.equal(towerNodes[4]?.targetLevel, 'skydeck');
assert.deepEqual(towerNodes[4]?.position, [-394, 864, -1292]);
assert.deepEqual(towerNodes[4]?.targetPosition, [-450, 1572, -1250]);
assert.equal(towerNodes[5]?.targetLevel, 'ground');
assert.deepEqual(towerNodes[5]?.position, [-550, 672, -1474]);
assert.deepEqual(towerNodes[5]?.targetPosition, [-605, 5, -1418]);
assert.equal(towerNodes[6]?.targetLevel, 'ground');
assert.deepEqual(towerNodes[6]?.position, [360, 1928, -1104]);
assert.deepEqual(towerNodes[6]?.targetPosition, [360, 5, -1030]);
assert.equal(towerNodes[7]?.targetLevel, 'tower');
assert.deepEqual(towerNodes[7]?.position, [496, 1928, -1240]);
assert.deepEqual(towerNodes[7]?.targetPosition, [447, 3246, -1240]);
assert.equal(towerNodes[8]?.targetLevel, 'tower');
assert.deepEqual(towerNodes[8]?.position, [447, 3242, -1240]);
assert.deepEqual(towerNodes[8]?.targetPosition, [496, 1932, -1240]);
assert.equal(towerNodes[9]?.targetLevel, 'skydeck');
assert.deepEqual(towerNodes[9]?.position, [360, 3242, -1153]);
assert.deepEqual(towerNodes[9]?.targetPosition, [360, 5252, -1240]);
assert.equal(skydeckNodes[1]?.targetLevel, 'tower');
assert.deepEqual(skydeckNodes[1]?.position, [-492, 1568, -1250]);
assert.deepEqual(skydeckNodes[1]?.targetPosition, [-360, 868, -1292]);
assert.equal(skydeckNodes[2]?.targetLevel, 'tower');
assert.deepEqual(skydeckNodes[2]?.position, [360, 5248, -1240]);
assert.deepEqual(skydeckNodes[2]?.targetPosition, [360, 3246, -1153]);
assert.deepEqual(level1WalkableRegions.map((region) => region.id), ['tower-cluster-vertical-pilot-level-1-walkable-deck']);
assert.deepEqual(level2WalkableRegions.map((region) => region.id), ['tower-cluster-vertical-pilot-level-2-walkable-deck']);
assert.deepEqual(roofWalkableRegions.map((region) => region.id), ['tower-cluster-vertical-pilot-roof-walkable-deck']);
assert.deepEqual(towerWalkableRegions.map((region) => region.id), [
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
  'tower-cluster-mega-highrise-crown-skydeck-walkable',
  'tower-cluster-television-tower-top-beacon-walkable',
]);
assert.deepEqual(level1WalkableRegions[0]?.position, [900, 70, -650]);
assert.deepEqual(level1WalkableRegions[0]?.size, [228, 46]);
assert.equal(level1WalkableRegions[0]?.playerY, 70);
assert.deepEqual(level2WalkableRegions[0]?.position, [900, 124, -680]);
assert.deepEqual(level2WalkableRegions[0]?.size, [276, 54]);
assert.equal(level2WalkableRegions[0]?.playerY, 124);
assert.deepEqual(roofWalkableRegions[0]?.position, [900, 170, -710]);
assert.deepEqual(roofWalkableRegions[0]?.size, [340, 64]);
assert.equal(roofWalkableRegions[0]?.playerY, 170);
assert.deepEqual(towerWalkableRegions[0]?.position, [900, 248, -650]);
assert.deepEqual(towerWalkableRegions[0]?.size, [220, 54]);
assert.equal(towerWalkableRegions[0]?.playerY, 248);
assert.deepEqual(towerWalkableRegions[1]?.position, [-570, 552, -1245]);
assert.deepEqual(towerWalkableRegions[1]?.size, [260, 74]);
assert.equal(towerWalkableRegions[1]?.playerY, 552);
assert.deepEqual(towerWalkableRegions[2]?.position, [-360, 868, -1292]);
assert.deepEqual(towerWalkableRegions[2]?.size, [132, 72]);
assert.equal(towerWalkableRegions[2]?.playerY, 868);
assert.deepEqual(towerWalkableRegions[3]?.position, [-550, 676, -1474]);
assert.deepEqual(towerWalkableRegions[3]?.size, [148, 66]);
assert.equal(towerWalkableRegions[3]?.playerY, 676);
assert.deepEqual(towerWalkableRegions[4]?.position, [224, 1932, -1240]);
assert.deepEqual(towerWalkableRegions[4]?.size, [170, 440]);
assert.equal(towerWalkableRegions[4]?.playerY, 1932);
assert.deepEqual(towerWalkableRegions[5]?.position, [496, 1932, -1240]);
assert.deepEqual(towerWalkableRegions[5]?.size, [170, 440]);
assert.equal(towerWalkableRegions[5]?.playerY, 1932);
assert.deepEqual(towerWalkableRegions[6]?.position, [360, 1932, -1104]);
assert.deepEqual(towerWalkableRegions[6]?.size, [70, 170]);
assert.equal(towerWalkableRegions[6]?.playerY, 1932);
assert.deepEqual(towerWalkableRegions[7]?.position, [360, 1932, -1376]);
assert.deepEqual(towerWalkableRegions[7]?.size, [70, 170]);
assert.equal(towerWalkableRegions[7]?.playerY, 1932);
assert.deepEqual(towerWalkableRegions[8]?.position, [273, 3246, -1240]);
assert.deepEqual(towerWalkableRegions[8]?.size, [100, 280]);
assert.equal(towerWalkableRegions[8]?.playerY, 3246);
assert.deepEqual(towerWalkableRegions[9]?.position, [447, 3246, -1240]);
assert.deepEqual(towerWalkableRegions[9]?.size, [100, 280]);
assert.equal(towerWalkableRegions[9]?.playerY, 3246);
assert.deepEqual(towerWalkableRegions[10]?.position, [360, 3246, -1153]);
assert.deepEqual(towerWalkableRegions[10]?.size, [70, 100]);
assert.equal(towerWalkableRegions[10]?.playerY, 3246);
assert.deepEqual(towerWalkableRegions[11]?.position, [360, 3246, -1327]);
assert.deepEqual(towerWalkableRegions[11]?.size, [70, 100]);
assert.equal(towerWalkableRegions[11]?.playerY, 3246);
assert.deepEqual(skydeckWalkableRegions[0]?.position, [-450, 1572, -1250]);
assert.deepEqual(skydeckWalkableRegions[0]?.size, [300, 180]);
assert.equal(skydeckWalkableRegions[0]?.playerY, 1572);
assert.deepEqual(skydeckWalkableRegions[1]?.position, [360, 5252, -1240]);
assert.deepEqual(skydeckWalkableRegions[1]?.size, [96, 96]);
assert.equal(skydeckWalkableRegions[1]?.playerY, 5252);
