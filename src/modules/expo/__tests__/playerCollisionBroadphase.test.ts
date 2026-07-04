import assert from 'node:assert/strict';
import * as THREE from 'three';
import {
  collectPlayerCollisionTargets,
  getPlayerCollisionBroadphaseRuntimeStats,
  queryNearbyPlayerCollisionTargets,
  registerPlayerColliderRoot,
} from '../runtime/world/WorldSceneSupport';

function createBoxMesh(name: string, position: [number, number, number]) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(2, 2, 2));
  mesh.name = name;
  mesh.position.set(...position);
  return mesh;
}

function createColliderRoot(name: string, mesh: THREE.Mesh) {
  const root = new THREE.Group();
  root.name = name;
  root.add(mesh);
  return root;
}

const scene = new THREE.Scene();
const nearMesh = createBoxMesh('near-collider', [0, 1, 0]);
const farMesh = createBoxMesh('far-collider', [200, 1, 0]);
const dynamicMesh = createBoxMesh('dynamic-collider', [500, 1, 0]);
const nearRoot = createColliderRoot('near-root', nearMesh);
const farRoot = createColliderRoot('far-root', farMesh);
const dynamicRoot = createColliderRoot('dynamic-root', dynamicMesh);

scene.add(nearRoot, farRoot, dynamicRoot);
scene.updateMatrixWorld(true);

registerPlayerColliderRoot(scene, nearRoot, 'near-root');
registerPlayerColliderRoot(scene, farRoot, 'far-root');
registerPlayerColliderRoot(scene, dynamicRoot, 'dynamic-root', { dynamic: true });

const allTargets = collectPlayerCollisionTargets(scene);
assert.equal(allTargets.length, 3);

const nearCandidates = queryNearbyPlayerCollisionTargets(scene, new THREE.Vector3(0, 1, 0), 8);
assert.equal(nearCandidates.includes(nearMesh), true);
assert.equal(nearCandidates.includes(farMesh), false);
assert.equal(nearCandidates.includes(dynamicMesh), true);

const nearStats = getPlayerCollisionBroadphaseRuntimeStats();
assert.equal(nearStats.targetCount, 3);
assert.equal(nearStats.indexedTargetCount, 2);
assert.equal(nearStats.dynamicTargetCount, 1);
assert.equal(nearStats.candidateCount, 2);

const farCandidates = queryNearbyPlayerCollisionTargets(scene, new THREE.Vector3(200, 1, 0), 8);
assert.equal(farCandidates.includes(nearMesh), false);
assert.equal(farCandidates.includes(farMesh), true);
assert.equal(farCandidates.includes(dynamicMesh), true);
