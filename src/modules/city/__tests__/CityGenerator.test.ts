import assert from 'node:assert/strict';
import * as THREE from 'three';
import { CityGenerator } from '../CityGenerator.js';
import { InstancedCityLayer } from '../InstancedCityLayer.js';
import { ZoneSystem } from '../ZoneSystem.js';
import { getModuleBudgetDelta } from '../cityPerformanceBudget.js';
import { processAssets } from '../../../utils/proAssetPipeline.js';
import { validateModel } from '../../../utils/modelValidator.js';
import type { ProcessedAsset, AssetType } from '../../../utils/proAssetPipeline.js';

function createModule(category: AssetType, sourceName: string, budget: { vertices: number; meshes: number; materials: number }): ProcessedAsset {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(1, 1, 1),
    new THREE.MeshBasicMaterial({ color: '#ffffff' })
  );
  const group = new THREE.Group();
  group.name = sourceName;
  group.add(mesh);

  if (category === 'road') {
    group.userData.normalization = {
      canonicalYawCandidate: true,
      canonicalUpAxisVerified: true,
      placementRoadFlattenPending: false,
    };
  }

  return {
    id: sourceName,
    sourceUrl: `/models/${sourceName}`,
    sourceName,
    sourceKind: 'manifest',
    category,
    type: category,
    object: group,
    pivot: {
      centered: true,
      grounded: true,
      offset: [0, 0, 0],
    },
    footprint: category === 'road' ? { width: 12, depth: 12 } : { width: 6, depth: 6 },
    width: 6,
    height: 6,
    depth: 6,
    snap: {
      gridUnit: category === 'road' ? 12 : 6,
      alignToGround: true,
    },
    allowedRotations: category === 'road' ? [0, Math.PI / 2] : [0, Math.PI / 2, Math.PI, Math.PI * 1.5],
    collisionStrategy: category === 'road' ? 'none' : category === 'nature' ? 'relaxed' : 'footprint',
    transform: {
      canonicalYawCandidate: category === 'road',
      rotationEuler: [0, 0, 0],
      scaleMultiplier: 1,
      groundOffsetY: 0,
      placementAnchor: 'base-center',
      centerXZOnly: true,
      snapToGround: true,
      canonicalYawOnly: category === 'road',
      flattenApplied: false,
      canonicalUpAxisVerified: category === 'road',
      placementRoadFlattenPending: false,
    },
    placementTags: [],
    validation: {
      accepted: true,
      warnings: [],
      errors: [],
      flags: [],
    },
    budget,
    bounds: {
      size: [1, 1, 1],
      center: [0, 0.5, 0],
      min: [-0.5, 0, -0.5],
      max: [0.5, 1, 0.5],
    },
  };
}

function createHighMeshScene() {
  const group = new THREE.Group();

  for (let index = 0; index < 65; index += 1) {
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(1, 1, 1),
      new THREE.MeshBasicMaterial({ color: '#ffffff' })
    );
    mesh.position.set((index % 8) * 0.2, 0, Math.floor(index / 8) * 0.2);
    group.add(mesh);
  }

  return group;
}

const road = createModule('road', 'american_road.glb', { vertices: 24000, meshes: 8, materials: 8 });
const intersection = createModule('road', 'american_road_intersection.glb', { vertices: 26000, meshes: 9, materials: 9 });
const building = createModule('building', 'office.glb', { vertices: 54000, meshes: 12, materials: 12 });
const buildingAlt = createModule('building', 'tower.glb', { vertices: 42000, meshes: 14, materials: 14 });
const lamp = createModule('nature', 'victorian_street_lamp.glb', { vertices: 6000, meshes: 4, materials: 4 });

const scene = new THREE.Scene();
const zoneSystem = new ZoneSystem();
const generator = new CityGenerator(scene, [road, intersection, building, buildingAlt, lamp], zoneSystem);
const summary = generator.generate({
  gridSize: 4,
  spacing: 12,
  qualityTier: 'balanced',
});
const performanceSummary = scene.userData.cityPerformanceBudget as {
  skippedByBudget: Record<string, number>;
  usage: {
    instancedGroups: number;
    placedModules: number;
  };
};

assert.ok(summary.placed > 0);
assert.ok(summary.placed >= 24);
assert.ok((summary.visibleCore?.committedCoreCells.length ?? 0) >= 4);
assert.ok(summary.placedByCategory.road >= 3);
assert.ok(summary.placedByCategory.building >= 1);
assert.ok(scene.children.length > 0);
assert.ok(((generator as any).placedBySourceName['office.glb'] ?? 0) >= 1);
assert.ok(((generator as any).placedBySourceName['tower.glb'] ?? 0) >= 1);
assert.equal(performanceSummary.usage.placedModules, summary.placed);
assert.ok(performanceSummary.usage.instancedGroups >= 1);
assert.ok((performanceSummary.skippedByBudget.BUDGET_MAX_MESHES ?? 0) === 0);
assert.ok((performanceSummary.skippedByBudget.BUDGET_MAX_MATERIALS ?? 0) === 0);

const baseRoadBudget = getModuleBudgetDelta(road);
const reusedRoadBudget = getModuleBudgetDelta(road, { reuseGeometry: true });
assert.ok(reusedRoadBudget.vertices < baseRoadBudget.vertices);
assert.equal(reusedRoadBudget.meshes, 0);
assert.equal(reusedRoadBudget.materials, 0);

const instancedScene = new THREE.Scene();
const instancer = new InstancedCityLayer(instancedScene);
const root = new THREE.Group();
const raisedMesh = new THREE.Mesh(
  new THREE.BoxGeometry(1, 1, 1),
  new THREE.MeshBasicMaterial({ color: '#00ff00' })
);
raisedMesh.position.set(0, 5, 0);
raisedMesh.rotation.set(Math.PI / 2, 0, 0);
root.add(raisedMesh);
root.updateWorldMatrix(true, true);
const localMatrix = raisedMesh.matrixWorld.clone().premultiply(root.matrixWorld.clone().invert());
const instancedMesh = instancer.createInstanceGroup('road-test', raisedMesh, 1);
instancer.setInstance(
  instancedMesh,
  0,
  new THREE.Vector3(10, 0, 20),
  Math.PI / 2,
  new THREE.Vector3(2, 2, 2),
  localMatrix
);
const resolvedMatrix = new THREE.Matrix4();
instancedMesh.getMatrixAt(0, resolvedMatrix);
const expectedMatrix = new THREE.Matrix4().compose(
  new THREE.Vector3(10, 0, 20),
  new THREE.Quaternion().setFromEuler(new THREE.Euler(0, Math.PI / 2, 0)),
  new THREE.Vector3(2, 2, 2)
).multiply(localMatrix);
assert.deepEqual(
  resolvedMatrix.elements.map((value) => Number(value.toFixed(6))),
  expectedMatrix.elements.map((value) => Number(value.toFixed(6)))
);

const complexScene = createHighMeshScene();
const complexReport = validateModel(complexScene, { autoFix: false });
assert.ok(complexReport.warnings.includes('PERF_HIGH_MESH_COUNT'));
assert.ok(!complexReport.fatalErrors.includes('PERF_HIGH_MESH_COUNT'));

const processed = processAssets([createHighMeshScene()], ['free__atlanta_corperate_office_building.glb']);
assert.equal(processed.modules.length, 1);
assert.equal(processed.rejected.length, 0);
