import * as THREE from 'three';

const NORMALIZATION_VERSION = "__normalized_v1";

export interface NormalizeModelOptions {
  targetSize?: number;
  scaleMultiplier?: number;
  centerXZOnly?: boolean;
  snapToGround?: boolean;
  groundOffsetY?: number;
  canonicalYawOnly?: boolean;
  assetType?: string;
}

const ROAD_VERTICAL_ROTATION_TOLERANCE = 0.35;

const normalizeAngle = (angle: number) => {
  const normalized = (angle + Math.PI) % (Math.PI * 2);
  return normalized < 0 ? normalized + Math.PI * 2 - Math.PI : normalized - Math.PI;
};

const hasQuarterTurnSignature = (angle: number) =>
  Math.abs(Math.abs(normalizeAngle(angle)) - Math.PI / 2) <= ROAD_VERTICAL_ROTATION_TOLERANCE;

const getFirstMeshChild = (root: THREE.Object3D): THREE.Object3D | null => {
  let firstMesh: THREE.Object3D | null = null;
  root.traverse((child: any) => {
    if (!firstMesh && child.isMesh) {
      firstMesh = child;
    }
  });
  return firstMesh;
};

const getRelativeQuaternionToRoot = (root: THREE.Object3D, child: THREE.Object3D) => {
  const rootWorldQuaternion = root.getWorldQuaternion(new THREE.Quaternion());
  const childWorldQuaternion = child.getWorldQuaternion(new THREE.Quaternion());
  return rootWorldQuaternion.clone().invert().multiply(childWorldQuaternion);
};

const rotateRootChildren = (root: THREE.Object3D, correction: THREE.Quaternion) => {
  root.children.forEach((child) => {
    child.position.applyQuaternion(correction);
    child.quaternion.premultiply(correction);
    child.updateMatrixWorld(true);
  });
  root.updateWorldMatrix(true, true);
};

const quaternionToEulerArray = (quaternion: THREE.Quaternion) => {
  const euler = new THREE.Euler().setFromQuaternion(quaternion, 'XYZ');
  return vectorToArray(new THREE.Vector3(euler.x, euler.y, euler.z));
};

const rotationHasVerticalRoadSignature = (quaternion: THREE.Quaternion) => {
  const euler = new THREE.Euler().setFromQuaternion(quaternion, 'XYZ');
  return hasQuarterTurnSignature(euler.x) || hasQuarterTurnSignature(euler.z);
};

export function canonicalizeRoadSubtree(root: THREE.Object3D) {
  root.updateWorldMatrix(true, true);
  const firstMeshBefore = getFirstMeshChild(root);
  if (!firstMeshBefore) {
    return {
      flattenApplied: false,
      canonicalUpAxisVerified: false,
      sourceRoadOrientation: null,
      firstMeshLocalRotationBefore: null,
      firstMeshLocalRotationAfter: null,
      firstMeshRelativeRotationBefore: null,
      firstMeshRelativeRotationAfter: null,
    };
  }

  const relativeQuaternionBefore = getRelativeQuaternionToRoot(root, firstMeshBefore);
  const sourceRoadOrientation = {
    firstMeshLocalRotationBefore: vectorToArray(new THREE.Vector3(firstMeshBefore.rotation.x, firstMeshBefore.rotation.y, firstMeshBefore.rotation.z)),
    firstMeshRelativeRotationBefore: quaternionToEulerArray(relativeQuaternionBefore),
    firstMeshRelativeQuaternionBefore: [
      quantizeValue(relativeQuaternionBefore.x),
      quantizeValue(relativeQuaternionBefore.y),
      quantizeValue(relativeQuaternionBefore.z),
      quantizeValue(relativeQuaternionBefore.w),
    ],
  };

  let flattenApplied = false;
  if (rotationHasVerticalRoadSignature(relativeQuaternionBefore)) {
    const correction = relativeQuaternionBefore.clone().invert();
    rotateRootChildren(root, correction);
    flattenApplied = true;
  }

  root.updateWorldMatrix(true, true);
  const firstMeshAfter = getFirstMeshChild(root);
  if (!firstMeshAfter) {
    return {
      flattenApplied,
      canonicalUpAxisVerified: false,
      sourceRoadOrientation,
      firstMeshLocalRotationBefore: sourceRoadOrientation.firstMeshLocalRotationBefore,
      firstMeshLocalRotationAfter: null,
      firstMeshRelativeRotationBefore: sourceRoadOrientation.firstMeshRelativeRotationBefore,
      firstMeshRelativeRotationAfter: null,
    };
  }

  const relativeQuaternionAfter = getRelativeQuaternionToRoot(root, firstMeshAfter);
  return {
    flattenApplied,
    canonicalUpAxisVerified: !rotationHasVerticalRoadSignature(relativeQuaternionAfter),
    sourceRoadOrientation,
    firstMeshLocalRotationBefore: sourceRoadOrientation.firstMeshLocalRotationBefore,
    firstMeshLocalRotationAfter: vectorToArray(new THREE.Vector3(firstMeshAfter.rotation.x, firstMeshAfter.rotation.y, firstMeshAfter.rotation.z)),
    firstMeshRelativeRotationBefore: sourceRoadOrientation.firstMeshRelativeRotationBefore,
    firstMeshRelativeRotationAfter: quaternionToEulerArray(relativeQuaternionAfter),
  };
}

/**
 * PRODUCTION ENGINE NORMALIZATION
 * 1. Versioned flags in userData for reliable cloning & state tracking.
 * 2. Precision world matrix synchronization.
 * 3. Subtree-safe pivot reset via immediate children offset.
 */
export const normalizeModel = (model: THREE.Object3D, options: number | NormalizeModelOptions = 20) => {
  const normalizedOptions: NormalizeModelOptions = typeof options === 'number'
    ? { targetSize: options }
    : options;
  const {
    targetSize = 20,
    scaleMultiplier = 1,
    centerXZOnly = true,
    snapToGround = true,
    groundOffsetY = 0,
    canonicalYawOnly = false,
    assetType,
  } = normalizedOptions;

  if (!model.userData) model.userData = {};
  if (model.userData[NORMALIZATION_VERSION]) {
    if (assetType === 'road' && model.userData.normalization) {
      const canonicalYawCandidate = Boolean(
        model.userData.normalization.canonicalYawCandidate === true ||
        model.userData.normalization.canonicalYawOnly === true ||
        canonicalYawOnly
      );
      const canonicalUpAxisVerified = Boolean(model.userData.normalization.canonicalUpAxisVerified === true);
      model.userData.normalization = {
        ...model.userData.normalization,
        canonicalYawOnly,
        canonicalYawCandidate,
        flattenApplied: Boolean(model.userData.normalization.flattenApplied === true),
        canonicalUpAxisVerified,
        placementRoadFlattenPending: Boolean(
          canonicalYawCandidate && !canonicalUpAxisVerified
        ),
      };
    }
    return;
  }
  model.userData[NORMALIZATION_VERSION] = true;

  const applyPivotOffset = (target: THREE.Object3D, offset: THREE.Vector3) => {
    const worldOrigin = target.localToWorld(new THREE.Vector3(0, 0, 0));
    const worldOffsetPoint = worldOrigin.clone().add(offset);
    const localOrigin = target.worldToLocal(worldOrigin.clone());
    const localOffset = target.worldToLocal(worldOffsetPoint).sub(localOrigin);

    if (target.children.length > 0) {
      target.children.forEach((child) => {
        child.position.sub(localOffset);
      });
    } else {
      target.position.sub(localOffset);
    }
    target.updateWorldMatrix(true, true);
  };

  model.updateWorldMatrix(true, true);
  const preNormalizeBox = new THREE.Box3().setFromObject(model);

  let box = new THREE.Box3().setFromObject(model);
  const size = new THREE.Vector3();
  box.getSize(size);

  const dominantAxis = Math.max(size.x, size.z);
  const scaleFactor = dominantAxis > 0 ? (targetSize / dominantAxis) * scaleMultiplier : scaleMultiplier;

  const currentScale = model.scale.clone();
  model.scale.set(
    currentScale.x * scaleFactor,
    currentScale.y * scaleFactor,
    currentScale.z * scaleFactor
  );

  model.updateWorldMatrix(true, true);
  const roadNormalization =
    assetType === 'road'
      ? canonicalizeRoadSubtree(model)
      : {
          flattenApplied: false,
          canonicalUpAxisVerified: false,
          sourceRoadOrientation: null,
          firstMeshLocalRotationBefore: null,
          firstMeshLocalRotationAfter: null,
          firstMeshRelativeRotationBefore: null,
          firstMeshRelativeRotationAfter: null,
        };
  box = new THREE.Box3().setFromObject(model);

  const center = new THREE.Vector3();
  box.getCenter(center);
  const offset = new THREE.Vector3(
    centerXZOnly ? center.x : 0,
    snapToGround ? box.min.y - groundOffsetY : 0,
    centerXZOnly ? center.z : 0
  );

  applyPivotOffset(model, offset);

  const residualBox = new THREE.Box3().setFromObject(model);
  const residualCenter = new THREE.Vector3();
  residualBox.getCenter(residualCenter);
  const residualOffset = new THREE.Vector3(
    centerXZOnly ? residualCenter.x : 0,
    snapToGround ? residualBox.min.y - groundOffsetY : 0,
    centerXZOnly ? residualCenter.z : 0
  );
  if (Math.abs(residualOffset.x) > 0.01 || Math.abs(residualOffset.y) > 0.01 || Math.abs(residualOffset.z) > 0.01) {
    applyPivotOffset(model, residualOffset);
  }

  const EPS = 0.0001;
  model.traverse((child: any) => {
    if (child !== model && child.position) {
      if (Math.abs(child.position.y) < EPS) child.position.y = 0;
      if (Math.abs(child.position.x) < EPS) child.position.x = 0;
      if (Math.abs(child.position.z) < EPS) child.position.z = 0;
    }
  });

  if (Math.abs(model.position.x) < EPS) model.position.x = 0;
  if (Math.abs(model.position.y) < EPS) model.position.y = 0;
  if (Math.abs(model.position.z) < EPS) model.position.z = 0;
  const postNormalizeBox = new THREE.Box3().setFromObject(model);
  const postNormalizeCenter = new THREE.Vector3();
  postNormalizeBox.getCenter(postNormalizeCenter);
  model.userData.normalization = {
    version: NORMALIZATION_VERSION,
    targetSize,
    scaleMultiplier,
    centerXZOnly,
    snapToGround,
    groundOffsetY,
    canonicalYawOnly,
    canonicalYawCandidate: Boolean(assetType === 'road' && canonicalYawOnly),
    assetType: assetType || null,
    flattenApplied: roadNormalization.flattenApplied,
    canonicalUpAxisVerified: roadNormalization.canonicalUpAxisVerified,
    placementRoadFlattenPending: Boolean(
      assetType === 'road' &&
      canonicalYawOnly &&
      !roadNormalization.canonicalUpAxisVerified
    ),
    sourceRoadOrientation: roadNormalization.sourceRoadOrientation,
    firstMeshLocalRotationBefore: roadNormalization.firstMeshLocalRotationBefore,
    firstMeshLocalRotationAfter: roadNormalization.firstMeshLocalRotationAfter,
    firstMeshRelativeRotationBefore: roadNormalization.firstMeshRelativeRotationBefore,
    firstMeshRelativeRotationAfter: roadNormalization.firstMeshRelativeRotationAfter,
    preNormalizeMinY: quantizeValue(preNormalizeBox.min.y),
    postNormalizeMinY: quantizeValue(postNormalizeBox.min.y),
    postNormalizeCenter: vectorToArray(postNormalizeCenter),
  };
  if (assetType === 'road') {
    console.log('[RoadNormalization]', model.name || 'Unnamed Road Asset', model.userData.normalization);
  }
  model.updateWorldMatrix(true, true);
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
export const vectorToArray = (vector: THREE.Vector3) => [
  quantizeValue(vector.x),
  quantizeValue(vector.y),
  quantizeValue(vector.z),
];
export const isFiniteVector3 = (vector: THREE.Vector3) =>
  Number.isFinite(vector.x) && Number.isFinite(vector.y) && Number.isFinite(vector.z);
