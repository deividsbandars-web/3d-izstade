import assert from 'node:assert/strict';
import {
  EXPO_VERTICAL_CITY_SYSTEM,
  getVerticalAccessNodesForLevel,
  getVerticalWalkableRegionsForLevel,
} from '../runtime/planning/vertical/verticalCitySystem.js';

const levels = new Set(EXPO_VERTICAL_CITY_SYSTEM.levels.map((level) => level.id));

assert.equal(EXPO_VERTICAL_CITY_SYSTEM.defaultFloorHeight, 36);
assert.equal(EXPO_VERTICAL_CITY_SYSTEM.pilotZoneId, 'tower-cluster');
assert.deepEqual([...levels], ['ground', 'level-1', 'level-2', 'roof', 'tower']);

for (const node of EXPO_VERTICAL_CITY_SYSTEM.accessNodes) {
  assert.ok(levels.has(node.level), `${node.id} must start from a known vertical level`);
  assert.ok(levels.has(node.targetLevel), `${node.id} must target a known vertical level`);
  assert.ok(node.radius > 0, `${node.id} must have a usable trigger radius`);
  assert.equal(node.position.length, 3);
  assert.equal(node.targetPosition.length, 3);
  assert.ok(node.position.every(Number.isFinite));
  assert.ok(node.targetPosition.every(Number.isFinite));
}

const groundNodes = getVerticalAccessNodesForLevel(EXPO_VERTICAL_CITY_SYSTEM, 'ground');
const level1Nodes = getVerticalAccessNodesForLevel(EXPO_VERTICAL_CITY_SYSTEM, 'level-1');
const level2Nodes = getVerticalAccessNodesForLevel(EXPO_VERTICAL_CITY_SYSTEM, 'level-2');
const level1WalkableRegions = getVerticalWalkableRegionsForLevel(EXPO_VERTICAL_CITY_SYSTEM, 'level-1');
const level2WalkableRegions = getVerticalWalkableRegionsForLevel(EXPO_VERTICAL_CITY_SYSTEM, 'level-2');

assert.deepEqual(groundNodes.map((node) => node.id), [
  'tower-cluster-vertical-pilot-lift-ground',
  'tower-cluster-vertical-pilot-lift-ground-to-level-1',
]);
assert.deepEqual(level1Nodes.map((node) => node.id), [
  'tower-cluster-vertical-pilot-lift-level-1-to-ground',
  'tower-cluster-vertical-pilot-lift-level-1-to-level-2',
]);
assert.deepEqual(level2Nodes.map((node) => node.id), [
  'tower-cluster-vertical-pilot-lift-level-2',
  'tower-cluster-vertical-pilot-lift-level-2-to-level-1',
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
assert.deepEqual(level1WalkableRegions.map((region) => region.id), ['tower-cluster-vertical-pilot-level-1-walkable-deck']);
assert.deepEqual(level2WalkableRegions.map((region) => region.id), ['tower-cluster-vertical-pilot-level-2-walkable-deck']);
assert.deepEqual(level1WalkableRegions[0]?.position, [900, 70, -650]);
assert.deepEqual(level1WalkableRegions[0]?.size, [228, 46]);
assert.equal(level1WalkableRegions[0]?.playerY, 70);
assert.deepEqual(level2WalkableRegions[0]?.position, [900, 124, -680]);
assert.deepEqual(level2WalkableRegions[0]?.size, [276, 54]);
assert.equal(level2WalkableRegions[0]?.playerY, 124);
