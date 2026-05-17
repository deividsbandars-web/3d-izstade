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
]);
assert.deepEqual(skydeckNodes.map((node) => node.id), [
  'tower-cluster-mega-highrise-lift-skydeck-to-skybridge',
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
assert.deepEqual(groundNodes[2]?.position, [1260, 0.25, -955]);
assert.deepEqual(groundNodes[2]?.targetPosition, [1260, 242, -1015]);
assert.equal(towerNodes[1]?.targetLevel, 'ground');
assert.deepEqual(towerNodes[1]?.position, [1260, 238, -1015]);
assert.deepEqual(towerNodes[1]?.targetPosition, [1260, 5, -955]);
assert.equal(towerNodes[2]?.targetLevel, 'skydeck');
assert.deepEqual(towerNodes[2]?.position, [1334, 238, -1015]);
assert.deepEqual(towerNodes[2]?.targetPosition, [1380, 456, -1020]);
assert.equal(skydeckNodes[0]?.targetLevel, 'tower');
assert.deepEqual(skydeckNodes[0]?.position, [1380, 452, -1020]);
assert.deepEqual(skydeckNodes[0]?.targetPosition, [1260, 242, -1015]);
assert.deepEqual(level1WalkableRegions.map((region) => region.id), ['tower-cluster-vertical-pilot-level-1-walkable-deck']);
assert.deepEqual(level2WalkableRegions.map((region) => region.id), ['tower-cluster-vertical-pilot-level-2-walkable-deck']);
assert.deepEqual(roofWalkableRegions.map((region) => region.id), ['tower-cluster-vertical-pilot-roof-walkable-deck']);
assert.deepEqual(towerWalkableRegions.map((region) => region.id), [
  'tower-cluster-vertical-pilot-tower-walkable-deck',
  'tower-cluster-mega-highrise-skybridge-deck-walkable',
]);
assert.deepEqual(skydeckWalkableRegions.map((region) => region.id), ['tower-cluster-mega-highrise-crown-skydeck-walkable']);
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
assert.deepEqual(towerWalkableRegions[1]?.position, [1260, 242, -1015]);
assert.deepEqual(towerWalkableRegions[1]?.size, [180, 48]);
assert.equal(towerWalkableRegions[1]?.playerY, 242);
assert.deepEqual(skydeckWalkableRegions[0]?.position, [1380, 456, -1020]);
assert.deepEqual(skydeckWalkableRegions[0]?.size, [148, 82]);
assert.equal(skydeckWalkableRegions[0]?.playerY, 456);
