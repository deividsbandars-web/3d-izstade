import * as THREE from 'three';

const NORMALIZATION_VERSION = "__normalized_v1";

/**
 * PRODUCTION ENGINE NORMALIZATION
 * 1. Versioned flags in userData for reliable cloning & state tracking.
 * 2. Precision world matrix synchronization.
 * 3. Subtree-safe pivot reset via immediate children offset.
 */
export const normalizeModel = (model: THREE.Object3D, targetSize = 20) => {
  if (!model.userData) model.userData = {};
  if (model.userData[NORMALIZATION_VERSION]) return;
  model.userData[NORMALIZATION_VERSION] = true;

  model.updateWorldMatrix(true, true);

  let box = new THREE.Box3().setFromObject(model);
  const size = new THREE.Vector3();
  box.getSize(size);

  const dominantAxis = Math.max(size.x, size.z);
  const scaleMultiplier = dominantAxis > 0 ? targetSize / dominantAxis : 1;

  const currentScale = model.scale.clone();
  model.scale.set(
    currentScale.x * scaleMultiplier,
    currentScale.y * scaleMultiplier,
    currentScale.z * scaleMultiplier
  );

  model.updateWorldMatrix(true, true);
  box = new THREE.Box3().setFromObject(model);

  const center = new THREE.Vector3();
  box.getCenter(center);
  const offset = new THREE.Vector3(center.x, box.min.y, center.z);

  model.children.forEach((child) => {
    child.position.sub(offset);
  });

  const EPS = 0.0001;
  model.traverse((child: any) => {
    if (child !== model && child.position) {
      if (Math.abs(child.position.y) < EPS) child.position.y = 0;
      if (Math.abs(child.position.x) < EPS) child.position.x = 0;
      if (Math.abs(child.position.z) < EPS) child.position.z = 0;
    }
  });
};

/**
 * WORLD SYSTEM: Origin-Aware Snapping
 * Ensures snapping remains consistent even if world origin shifts.
 */
export const snapVector3 = (
  pos: THREE.Vector3, 
  gridSize = 10, 
  origin = new THREE.Vector3(0, 0, 0)
) => {
  return new THREE.Vector3(
    Math.round((pos.x - origin.x) / gridSize) * gridSize + origin.x,
    Math.round((pos.y - origin.y) / gridSize) * gridSize + origin.y,
    Math.round((pos.z - origin.z) / gridSize) * gridSize + origin.z
  );
};

export const snapRotation = (r: number) => {
  const STEP = Math.PI / 2;
  return Math.round(r / STEP) * STEP;
};

/**
 * NETWORK & MOTION SYSTEM: Quantization
 */
export const quantizeValue = (v: number) => Math.round(v * 1000) / 1000;
export const quantizeVectorArray = (arr: number[]) => arr.map(v => quantizeValue(v));
