import { useEffect, useMemo, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useExpoWorldAnalyticsState } from './ExpoWorldAnalyticsProvider';
import { isExpo3dQaEnabled } from '../../app/expo3dQa';
import { GALA_GEOMETRY_SANITY } from '../../modularHome/GalaFloorplan';

type Vec3Like = { x: number; y: number; z: number };

type Expo3DBoundsLike = {
  center: Vec3Like;
  max: Vec3Like;
  min: Vec3Like;
  size: Vec3Like;
};

type Expo3DBoundsCandidate = {
  bounds: Expo3DBoundsLike | null;
  name: string;
  objectCount: number;
  usable: boolean;
  why: string;
};

type Expo3DQAObjectSummary = {
  houseVisualBounds: Expo3DBoundsLike;
  houseVisualBoundsCandidates: Expo3DBoundsCandidate[];
  modularHomeBounds: Expo3DBoundsLike | null;
  modularHomeObjectCount: number;
  modularHomeRootFound: boolean;
  modularHomeRootName: string | null;
  modularHomeVisible: boolean;
  portalActive: boolean;
  portalVisible: boolean;
  sceneObjectCount: number;
  visibleMeshCount: number;
  visibleObjectSummary: {
    modularHomeRootName: string | null;
    semanticVisibleNames: string[];
    sampleVisibleMeshNames: string[];
    sampleVisibleNames: string[];
    sceneObjectCount: number;
    visibleMeshCount: number;
  };
};

type Expo3DQAVisibleObjectSummary = Expo3DQAObjectSummary['visibleObjectSummary'];
type Expo3DQAMeshInventoryItem = {
  bounds: Expo3DBoundsLike | null;
  componentHint: string | null;
  isCeilingTrimCandidate: boolean;
  isDoorFrameCandidate: boolean;
  isFacadeGrooveCandidate: boolean;
  isFloorCandidate: boolean;
  isOpeningAssemblyCandidate: boolean;
  isWallAssemblyCandidate: boolean;
  material: {
    color: string | null;
    metalness: number | null;
    opacity: number | null;
    roughness: number | null;
    transparent: boolean | null;
  };
  name: string;
  position: [number, number, number];
  scale: [number, number, number];
  userData: Record<string, unknown>;
};
type Expo3DQACenterRaycast = {
  distance: number | null;
  hit: boolean;
  material: Expo3DQAMeshInventoryItem['material'] | null;
  objectName: string | null;
  point: Vec3Like | null;
  userData: Record<string, unknown>;
};
type Expo3DQAShotName =
  | 'exteriorFrontHero'
  | 'exteriorSideAngle'
  | 'exteriorRearAngle'
  | 'exteriorElevatedCutaway'
  | 'interiorOverview'
  | 'interiorLiving'
  | 'interiorKitchen'
  | 'interiorSleepingBathroom';
type Expo3DQACameraPreset =
  | 'exteriorOverview'
  | 'doorArea'
  | 'interiorOverview'
  | 'exteriorFrontHero'
  | 'exteriorSideAngle'
  | 'exteriorRearAngle'
  | 'exteriorElevatedCutaway'
  | 'interiorLiving'
  | 'interiorKitchen'
  | 'interiorSleepingBathroom';
type Expo3DQACameraPresetPhase = 'baseline' | 'distance-adjusted' | 'interior-pullback' | 'camera-lock-adjust';

type Expo3DQAState = {
  activeScene: string;
  canvasFocused: boolean;
  cameraPosition: Vec3Like | null;
  cameraDistanceToModularHome: number | null;
  cameraFacingModularHome: boolean;
  cameraInsideGeometryLikely: boolean;
  cameraFov: number;
  cameraRotation: Vec3Like | null;
  houseVisualBounds: Expo3DBoundsLike;
  houseVisualBoundsCandidates: Expo3DBoundsCandidate[];
  modularHomeBounds: Expo3DBoundsLike | null;
  modularHomeRootFound: boolean;
  modularHomeRootName: string | null;
  inHomeInteriorZone: boolean;
  geometrySanity: Record<string, unknown>;
  lastInputAt: string | null;
  modularHomeObjectCount: number;
  modularHomeVisible: boolean;
  pointerLockActive: boolean;
  playerPosition: Vec3Like | null;
  playerVelocity: Vec3Like | null;
  portalActive: boolean;
  portalVisible: boolean;
  route: string;
  runtimeMode: string;
  visibleObjectSummary: Expo3DQAVisibleObjectSummary;
};

const HOUSE_VISUAL_BOUNDS: Expo3DBoundsLike = {
  center: { x: -0.38, y: 8, z: 8.93 },
  max: { x: 35.62, y: 16, z: 56.93 },
  min: { x: -36.38, y: 0, z: -39.07 },
  size: { x: 72, y: 16, z: 96 },
};

const FIXED_CAMERA_PRESETS: Record<Expo3DQAShotName, { position: Vec3Like; target: Vec3Like }> = {
  exteriorFrontHero: {
    position: { x: -0.38, y: 5, z: -86.07 },
    target: { x: -0.38, y: 10, z: 8.93 },
  },
  exteriorSideAngle: {
    position: { x: -75.38, y: 5, z: 18.93 },
    target: { x: -0.38, y: 10, z: 8.93 },
  },
  exteriorRearAngle: {
    position: { x: -0.38, y: 5, z: 103.93 },
    target: { x: -0.38, y: 10, z: 8.93 },
  },
  exteriorElevatedCutaway: {
    position: { x: 69.62, y: 5, z: -81.07 },
    target: { x: -0.38, y: 10, z: 8.93 },
  },
  interiorOverview: {
    position: { x: -0.38, y: 5, z: -36.07 },
    target: { x: -0.38, y: 9, z: 8.93 },
  },
  interiorLiving: {
    position: { x: -22.38, y: 5, z: -16.07 },
    target: { x: -10.38, y: 7, z: 8.93 },
  },
  interiorKitchen: {
    position: { x: 21.62, y: 5, z: -16.07 },
    target: { x: 7.62, y: 7, z: 8.93 },
  },
  interiorSleepingBathroom: {
    position: { x: -0.38, y: 5, z: 53.93 },
    target: { x: -0.38, y: 7, z: 33.93 },
  },
};

const FIXED_CAMERA_DISTANCE_MULTIPLIERS: Record<Expo3DQAShotName, number> = {
  exteriorFrontHero: 1.8,
  exteriorSideAngle: 1.8,
  exteriorRearAngle: 1.8,
  exteriorElevatedCutaway: 1.8,
  interiorOverview: 1.45,
  interiorLiving: 1.55,
  interiorKitchen: 1.55,
  interiorSleepingBathroom: 1.55,
};

const INTERIOR_PULLBACK_MULTIPLIERS: Record<Expo3DQAShotName, number> = {
  exteriorFrontHero: 1,
  exteriorSideAngle: 1,
  exteriorRearAngle: 1,
  exteriorElevatedCutaway: 1,
  interiorOverview: 1.08,
  interiorLiving: 1.08,
  interiorKitchen: 1.08,
  interiorSleepingBathroom: 1.08,
};

const CAMERA_LOCK_ADJUST_MULTIPLIERS: Record<Expo3DQAShotName, number> = {
  exteriorFrontHero: 1,
  exteriorSideAngle: 1,
  exteriorRearAngle: 1,
  exteriorElevatedCutaway: 1,
  interiorOverview: 1.12,
  interiorLiving: 1,
  interiorKitchen: 1,
  interiorSleepingBathroom: 1.12,
};

const FIXED_CAMERA_BASE_FOV = 50;
const FIXED_CAMERA_DISTANCE_ADJUSTED_FOV = 58;

function resolveFixedCameraPresetName(preset: Expo3DQACameraPreset): Expo3DQAShotName {
  if (preset === 'doorArea') {
    return 'exteriorFrontHero';
  }

  if (preset === 'exteriorOverview') {
    return 'exteriorElevatedCutaway';
  }

  return preset;
}

function buildFixedCameraPreset(preset: Expo3DQACameraPreset, phase: Expo3DQACameraPresetPhase) {
  const resolvedPresetName = resolveFixedCameraPresetName(preset);
  const basePreset = FIXED_CAMERA_PRESETS[resolvedPresetName];
  if (!basePreset) {
    return null;
  }

  const target = new THREE.Vector3(basePreset.target.x, basePreset.target.y, basePreset.target.z);
  const basePosition = new THREE.Vector3(basePreset.position.x, basePreset.position.y, basePreset.position.z);
  const direction = basePosition.clone().sub(target);
  const baseDistance = direction.length();
  if (baseDistance <= 0) {
    return null;
  }

  const multiplier = phase === 'distance-adjusted'
    ? FIXED_CAMERA_DISTANCE_MULTIPLIERS[resolvedPresetName] ?? 1
    : phase === 'camera-lock-adjust'
      ? CAMERA_LOCK_ADJUST_MULTIPLIERS[resolvedPresetName] ?? 1
      : 1;
  const position = target.clone().add(direction.normalize().multiplyScalar(baseDistance * multiplier));
  const fov = phase === 'distance-adjusted'
    ? FIXED_CAMERA_DISTANCE_ADJUSTED_FOV
    : phase === 'interior-pullback'
      ? FIXED_CAMERA_DISTANCE_ADJUSTED_FOV
    : FIXED_CAMERA_BASE_FOV;

  return {
    baseDistance,
    basePosition,
    fov,
    multiplier,
    position,
    resolvedPresetName,
    target,
  };
}

function buildInteriorPullbackPreset(preset: Expo3DQACameraPreset, currentPosition: THREE.Vector3) {
  const resolvedPresetName = resolveFixedCameraPresetName(preset);
  const basePreset = FIXED_CAMERA_PRESETS[resolvedPresetName];
  if (!basePreset) {
    return null;
  }

  const target = new THREE.Vector3(basePreset.target.x, basePreset.target.y, basePreset.target.z);
  const direction = currentPosition.clone().sub(target);
  const currentDistance = direction.length();
  if (currentDistance <= 0) {
    return null;
  }

  const multiplier = INTERIOR_PULLBACK_MULTIPLIERS[resolvedPresetName] ?? 1;
  const position = target.clone().add(direction.normalize().multiplyScalar(currentDistance * multiplier));

  return {
    baseDistance: currentDistance,
    basePosition: currentPosition.clone(),
    fov: FIXED_CAMERA_DISTANCE_ADJUSTED_FOV,
    multiplier,
    position,
    resolvedPresetName,
    target,
  };
}

declare global {
  interface Window {
    __WARPALA_3D_QA__?: {
      focusCanvas: () => boolean;
      getCenterRaycast: () => Expo3DQACenterRaycast;
      getSceneMeshInventory: () => Expo3DQAMeshInventoryItem[];
      getObjectSummary: () => Expo3DQAObjectSummary;
      getState: () => Expo3DQAState;
      frameModularHomeShot: (shotName: Expo3DQAShotName) => boolean;
      lookAtModularHome: () => boolean;
      setCameraPreset: (preset: Expo3DQACameraPreset, phase?: Expo3DQACameraPresetPhase | 'interior-pullback' | 'camera-lock-adjust') => boolean;
      setPlayerPosition: (position: Vec3Like) => boolean;
    };
  }
}

function toVec3Like(vector: THREE.Vector3 | null | undefined): Vec3Like | null {
  if (!vector) {
    return null;
  }

  return {
    x: Number(vector.x.toFixed(4)),
    y: Number(vector.y.toFixed(4)),
    z: Number(vector.z.toFixed(4)),
  };
}

function countDescendants(root: THREE.Object3D | null | undefined) {
  if (!root) {
    return 0;
  }

  let count = 0;
  root.traverse((object) => {
    if (object.visible) {
      count += 1;
    }
  });
  return count;
}

function findModularHomeRoot(scene: THREE.Scene): THREE.Object3D | null {
  let fallbackRoot: THREE.Object3D | null = null;
  let preferredRoot: THREE.Object3D | null = null;

  scene.traverse((object) => {
    if (preferredRoot) {
      return;
    }

    const userData = object.userData as Record<string, unknown> | undefined;
    const objectName = object.name || '';
    const groupId = typeof userData?.expoZoneGroupId === 'string' ? String(userData.expoZoneGroupId) : '';
    const isPortalLike = objectName.includes('portal')
      || Boolean(userData?.expoModularHomeEntryPortal)
      || Boolean(userData?.expoModularHomeEntryTrigger);
    const isCandidate = objectName.includes('modular-home')
      && !isPortalLike
      || userData?.homeDemoPreview === true
      || typeof userData?.modularHomeId === 'string'
      || typeof userData?.source === 'string' && String(userData.source).includes('ModularHomeModel');

    if (!isCandidate) {
      return;
    }

    fallbackRoot = fallbackRoot ?? object;
    if (
      groupId === 'modular-home-preview'
      || objectName === 'expo-zone-group:modular-home-preview'
      || objectName === 'modular-home-preview'
      || objectName === 'modular-home-preview-district'
      || objectName === 'modular-home'
    ) {
      preferredRoot = object;
    }
  });

  return preferredRoot ?? fallbackRoot;
}

function toBox3Like(box: THREE.Box3 | null | undefined): Expo3DBoundsLike | null {
  if (!box || !Number.isFinite(box.min.x) || !Number.isFinite(box.max.x)) {
    return null;
  }

  const center = new THREE.Vector3();
  const size = new THREE.Vector3();
  box.getCenter(center);
  box.getSize(size);

  return {
    center: toVec3Like(center) ?? { x: 0, y: 0, z: 0 },
    max: toVec3Like(box.max) ?? { x: 0, y: 0, z: 0 },
    min: toVec3Like(box.min) ?? { x: 0, y: 0, z: 0 },
    size: toVec3Like(size) ?? { x: 0, y: 0, z: 0 },
  };
}

function materialInventorySummary(material: THREE.Material | THREE.Material[] | undefined): Expo3DQAMeshInventoryItem['material'] {
  const singleMaterial = Array.isArray(material) ? material[0] : material;
  const materialWithColor = singleMaterial as (THREE.Material & {
    color?: THREE.Color;
    metalness?: number;
    roughness?: number;
  }) | undefined;

  return {
    color: materialWithColor?.color ? `#${materialWithColor.color.getHexString()}` : null,
    metalness: typeof materialWithColor?.metalness === 'number' ? Number(materialWithColor.metalness.toFixed(4)) : null,
    opacity: typeof materialWithColor?.opacity === 'number' ? Number(materialWithColor.opacity.toFixed(4)) : null,
    roughness: typeof materialWithColor?.roughness === 'number' ? Number(materialWithColor.roughness.toFixed(4)) : null,
    transparent: typeof materialWithColor?.transparent === 'boolean' ? materialWithColor.transparent : null,
  };
}

function primitiveUserData(userData: Record<string, unknown> | undefined): Record<string, unknown> {
  if (!userData) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(userData)
      .map(([key, value]) => {
        if (value === null || ['boolean', 'number', 'string'].includes(typeof value)) {
          return [key, value] as const;
        }

        if ((key === 'constructionLocalPosition' || key === 'constructionLocalSize')
          && Array.isArray(value)
          && value.every((item) => typeof item === 'number')) {
          return [key, value] as const;
        }

        if (key === 'constructionLocalBounds' && value && typeof value === 'object') {
          return [key, value] as const;
        }

        return null;
      })
      .filter((entry): entry is readonly [string, unknown] => entry !== null),
  );
}

function buildSceneMeshInventory(scene: THREE.Scene): Expo3DQAMeshInventoryItem[] {
  const inventory: Expo3DQAMeshInventoryItem[] = [];

  scene.traverse((object) => {
    if (!object.visible || !(object as THREE.Mesh).isMesh) {
      return;
    }

    const mesh = object as THREE.Mesh;
    const name = mesh.name || '(unnamed mesh)';
    const lowerName = name.toLowerCase();
    const userData = primitiveUserData(mesh.userData as Record<string, unknown> | undefined);
    const componentHint = typeof userData.componentHint === 'string' ? userData.componentHint : null;
    const worldPosition = mesh.getWorldPosition(new THREE.Vector3());
    const worldScale = mesh.getWorldScale(new THREE.Vector3());
    const bounds = toBox3Like(new THREE.Box3().setFromObject(mesh));

    inventory.push({
      bounds,
      componentHint,
      isCeilingTrimCandidate: /ceiling|crown|header|soffit/.test(lowerName),
      isDoorFrameCandidate: /door|jamb|casing|threshold|opening/.test(lowerName),
      isFacadeGrooveCandidate: /cladding|board|groove|facade|gable/.test(lowerName),
      isFloorCandidate: /floor|rug|mat|threshold|slab/.test(lowerName),
      isOpeningAssemblyCandidate: Boolean(userData.openingAssemblyOwnsDoorWindowRevealsCasing) || lowerName.includes('opening-assembly'),
      isWallAssemblyCandidate: Boolean(userData.wallAssemblyOwnsCoreFacesRevealsTrim) || lowerName.includes('wall-assembly') || lowerName.includes('wall-core'),
      material: materialInventorySummary(mesh.material),
      name,
      position: [
        Number(worldPosition.x.toFixed(4)),
        Number(worldPosition.y.toFixed(4)),
        Number(worldPosition.z.toFixed(4)),
      ],
      scale: [
        Number(worldScale.x.toFixed(4)),
        Number(worldScale.y.toFixed(4)),
        Number(worldScale.z.toFixed(4)),
      ],
      userData,
    });
  });

  return inventory;
}

function buildCenterRaycast(scene: THREE.Scene, camera: THREE.Camera): Expo3DQACenterRaycast {
  const raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
  const intersections = raycaster
    .intersectObjects(scene.children, true)
    .filter((entry) => entry.object.visible && (entry.object as THREE.Mesh).isMesh);
  const hit = intersections[0];
  if (!hit) {
    return {
      distance: null,
      hit: false,
      material: null,
      objectName: null,
      point: null,
      userData: {},
    };
  }

  const mesh = hit.object as THREE.Mesh;
  return {
    distance: Number(hit.distance.toFixed(4)),
    hit: true,
    material: materialInventorySummary(mesh.material),
    objectName: mesh.name || '(unnamed mesh)',
    point: toVec3Like(hit.point),
    userData: primitiveUserData(mesh.userData as Record<string, unknown> | undefined),
  };
}

function isPointInsideBounds(point: THREE.Vector3, bounds: THREE.Box3) {
  return point.x >= bounds.min.x
    && point.x <= bounds.max.x
    && point.y >= bounds.min.y
    && point.y <= bounds.max.y
    && point.z >= bounds.min.z
    && point.z <= bounds.max.z;
}

function distanceToBounds(point: THREE.Vector3, bounds: THREE.Box3) {
  const dx = Math.max(bounds.min.x - point.x, 0, point.x - bounds.max.x);
  const dy = Math.max(bounds.min.y - point.y, 0, point.y - bounds.max.y);
  const dz = Math.max(bounds.min.z - point.z, 0, point.z - bounds.max.z);
  if (dx === 0 && dy === 0 && dz === 0) {
    const insideDx = Math.min(point.x - bounds.min.x, bounds.max.x - point.x);
    const insideDy = Math.min(point.y - bounds.min.y, bounds.max.y - point.y);
    const insideDz = Math.min(point.z - bounds.min.z, bounds.max.z - point.z);
    return Math.max(0, Math.min(insideDx, insideDy, insideDz));
  }

  return Math.hypot(dx, dy, dz);
}

function collectVisibleNames(root: THREE.Object3D | null | undefined, limit = 12) {
  if (!root) {
    return [] as string[];
  }

  const names: string[] = [];
  root.traverse((object) => {
    if (!object.visible) {
      return;
    }
    const name = object.name || '';
    if (!name || names.includes(name)) {
      return;
    }
    names.push(name);
  });
  return names.slice(0, limit);
}

function collectVisibleMeshNames(root: THREE.Object3D | null | undefined, limit = 12) {
  if (!root) {
    return [] as string[];
  }

  const names: string[] = [];
  root.traverse((object) => {
    if (!object.visible || !(object as THREE.Mesh).isMesh) {
      return;
    }
    const name = object.name || '';
    if (!name || names.includes(name)) {
      return;
    }
    names.push(name);
  });
  return names.slice(0, limit);
}

function collectSemanticVisibleNames(root: THREE.Object3D | null | undefined, limit = 18) {
  if (!root) {
    return [] as string[];
  }

  const keywords = [
    'door',
    'entry',
    'roof',
    'deck',
    'step',
    'platform',
    'plinth',
    'facade',
    'cladding',
    'board',
    'panel',
    'window',
    'living',
    'kitchen',
    'sleep',
    'bath',
    'vanity',
    'sofa',
    'table',
    'bed',
    'wardrobe',
    'media',
    'shelf',
    'plant',
    'fridge',
    'sink',
    'cooktop',
    'appliance',
  ];

  const names: string[] = [];
  root.traverse((object) => {
    if (!object.visible) {
      return;
    }

    const name = object.name || '';
    const lowerName = name.toLowerCase();
    if (!name || names.includes(name)) {
      return;
    }

    if (keywords.some((keyword) => lowerName.includes(keyword))) {
      names.push(name);
    }
  });

  return names.slice(0, limit);
}

function findNamedWorldPosition(scene: THREE.Scene, names: string[]) {
  for (const name of names) {
    const object = scene.getObjectByName(name);
    if (object) {
      return object.getWorldPosition(new THREE.Vector3());
    }
  }
  return null;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function normalizeOrFallback(vector: THREE.Vector3, fallback: THREE.Vector3) {
  if (vector.lengthSq() === 0) {
    return fallback.clone();
  }
  return vector.normalize();
}

function getAnchorOrFallback(scene: THREE.Scene, names: string[], fallback: THREE.Vector3) {
  return findNamedWorldPosition(scene, names) ?? fallback.clone();
}

function buildVisibleObjectSummary(
  scene: THREE.Scene,
  modularHomeRoot: THREE.Object3D | null,
): Expo3DQAVisibleObjectSummary {
  let visibleMeshCount = 0;
  let sceneObjectCount = 0;

  scene.traverse((object) => {
    if (!object.visible) {
      return;
    }
    sceneObjectCount += 1;
    if ((object as THREE.Mesh).isMesh) {
      visibleMeshCount += 1;
    }
  });

  return {
    modularHomeRootName: modularHomeRoot?.name ?? null,
    semanticVisibleNames: collectSemanticVisibleNames(modularHomeRoot),
    sampleVisibleMeshNames: collectVisibleMeshNames(modularHomeRoot),
    sampleVisibleNames: collectVisibleNames(modularHomeRoot),
    sceneObjectCount,
    visibleMeshCount,
  };
}

function buildBoundsCandidate(scene: THREE.Scene, name: string, why: string, usable = false): Expo3DBoundsCandidate {
  const object = scene.getObjectByName(name);
  return {
    bounds: toBox3Like(object ? new THREE.Box3().setFromObject(object) : null),
    name,
    objectCount: countDescendants(object),
    usable: Boolean(object && usable),
    why: object ? why : 'not found in current scene',
  };
}

function buildHouseVisualBoundsCandidates(scene: THREE.Scene, modularHomeRoot: THREE.Object3D | null): Expo3DBoundsCandidate[] {
  return [
    {
      bounds: toBox3Like(modularHomeRoot ? new THREE.Box3().setFromObject(modularHomeRoot) : null),
      name: modularHomeRoot?.name ?? 'modular-home-root',
      objectCount: countDescendants(modularHomeRoot),
      usable: false,
      why: 'too broad for camera targeting; can include labels, helper planes, approach pads, and preview-zone objects',
    },
    buildBoundsCandidate(
      scene,
      'modular-home-preview-district',
      'closer to the authored house preview, but still may include label Html, clearance pads, and floor helpers',
      false,
    ),
    buildBoundsCandidate(
      scene,
      'modular-home-interior-walkthrough',
      'usable only as an interior content reference, not as the whole exterior house target',
      false,
    ),
    {
      bounds: HOUSE_VISUAL_BOUNDS,
      name: 'HOUSE_VISUAL_BOUNDS_QA_OVERRIDE',
      objectCount: 0,
      usable: true,
      why: 'QA-only fixed camera target; excludes wide preview rails, labels, pads, and helper objects',
    },
  ];
}

function buildObjectSummary(scene: THREE.Scene): Expo3DQAObjectSummary {
  const modularHomeRoot = findModularHomeRoot(scene);
  const portalRoot = scene.getObjectByName('modular-home-entrance-portal')
    ?? scene.getObjectByName('modular-home-portal');
  const visibleObjectSummary = buildVisibleObjectSummary(scene, modularHomeRoot);

  return {
    houseVisualBounds: HOUSE_VISUAL_BOUNDS,
    houseVisualBoundsCandidates: buildHouseVisualBoundsCandidates(scene, modularHomeRoot),
    modularHomeBounds: toBox3Like(modularHomeRoot ? new THREE.Box3().setFromObject(modularHomeRoot) : null),
    modularHomeObjectCount: countDescendants(modularHomeRoot),
    modularHomeRootFound: Boolean(modularHomeRoot),
    modularHomeRootName: modularHomeRoot?.name ?? null,
    modularHomeVisible: Boolean(modularHomeRoot?.visible) || countDescendants(modularHomeRoot) > 0,
    portalActive: Boolean(portalRoot?.visible),
    portalVisible: Boolean(portalRoot?.visible),
    sceneObjectCount: visibleObjectSummary.sceneObjectCount,
    visibleMeshCount: visibleObjectSummary.visibleMeshCount,
    visibleObjectSummary,
  };
}

function getGalaGeometrySanity() {
  if (typeof window === 'undefined') {
    return GALA_GEOMETRY_SANITY;
  }

  const runtimeState = (window as unknown as {
    __WARPALA_GALA_GEOMETRY_SANITY__?: Record<string, unknown>;
  }).__WARPALA_GALA_GEOMETRY_SANITY__;

  return {
    ...GALA_GEOMETRY_SANITY,
    ...(runtimeState ?? {}),
  };
}

export function Expo3DQAHook({
  runtimeMode,
}: {
  runtimeMode: string;
}) {
  const location = useLocation();
  const analyticsState = useExpoWorldAnalyticsState();
  const { camera, gl, scene } = useThree();
  const qa3dMode = useMemo(() => isExpo3dQaEnabled(), []);
  const activeFixedCameraPresetRef = useRef<{ framesRemaining: number; phase: Expo3DQACameraPresetPhase; preset: Expo3DQACameraPreset } | null>(null);
  const lastInputAtRef = useRef<string | null>(null);
  const lastCameraPositionRef = useRef<THREE.Vector3 | null>(null);
  const lastStateUpdateAtRef = useRef(0);
  const pendingQaCommandRef = useRef<
    | { type: 'look-at-modular-home' }
    | { phase?: Expo3DQACameraPresetPhase | 'interior-pullback'; type: 'preset'; preset: Expo3DQACameraPreset }
    | { type: 'frame-shot'; shotName: Expo3DQAShotName }
    | { type: 'player-position'; position: Vec3Like }
    | null
  >(null);
  const latestStateRef = useRef<Expo3DQAState>({
    activeScene: 'unknown',
    canvasFocused: false,
    cameraPosition: null,
    cameraDistanceToModularHome: null,
    cameraFacingModularHome: false,
    cameraInsideGeometryLikely: false,
    cameraFov: 50,
    cameraRotation: null,
    houseVisualBounds: HOUSE_VISUAL_BOUNDS,
    houseVisualBoundsCandidates: [],
    modularHomeBounds: null,
    modularHomeRootFound: false,
    modularHomeRootName: null,
    inHomeInteriorZone: false,
    geometrySanity: GALA_GEOMETRY_SANITY,
    lastInputAt: null,
    modularHomeObjectCount: 0,
    modularHomeVisible: false,
    pointerLockActive: false,
    playerPosition: null,
    playerVelocity: null,
    portalActive: false,
    portalVisible: false,
    route: location.pathname,
    runtimeMode,
    visibleObjectSummary: {
      modularHomeRootName: null,
      semanticVisibleNames: [],
      sampleVisibleMeshNames: [],
      sampleVisibleNames: [],
      sceneObjectCount: 0,
      visibleMeshCount: 0,
    },
  });

  const activeScene = useMemo(() => {
    if (location.pathname.startsWith('/modular-homes/studio')) {
      return 'modular-home-studio';
    }

    if (location.pathname.startsWith('/expo-3d')) {
      return 'expo-3d';
    }

    return location.pathname || 'unknown';
  }, [location.pathname]);

  useEffect(() => {
    const canvas = gl.domElement;
    if (!canvas) {
      return undefined;
    }

    canvas.setAttribute('tabindex', '0');

    const markInput = () => {
      lastInputAtRef.current = new Date().toISOString();
    };

    const handleEvent = () => markInput();

    window.addEventListener('keydown', handleEvent, true);
    window.addEventListener('mousedown', handleEvent, true);
    window.addEventListener('pointerdown', handleEvent, true);
    window.addEventListener('mousemove', handleEvent, true);
    window.addEventListener('wheel', handleEvent, true);

    return () => {
      window.removeEventListener('keydown', handleEvent, true);
      window.removeEventListener('mousedown', handleEvent, true);
      window.removeEventListener('pointerdown', handleEvent, true);
      window.removeEventListener('mousemove', handleEvent, true);
      window.removeEventListener('wheel', handleEvent, true);
    };
  }, [gl]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    const api = {
      focusCanvas() {
        const canvas = gl.domElement;
        if (!canvas) {
          return false;
        }
        canvas.setAttribute('tabindex', '0');
        canvas.focus({ preventScroll: true });
        return document.activeElement === canvas;
      },
      getObjectSummary() {
        return buildObjectSummary(scene);
      },
      getCenterRaycast() {
        return buildCenterRaycast(scene, camera);
      },
      getSceneMeshInventory() {
        return buildSceneMeshInventory(scene);
      },
      getState() {
        return latestStateRef.current;
      },
      frameModularHomeShot(shotName: Expo3DQAShotName) {
        pendingQaCommandRef.current = { type: 'frame-shot', shotName };
        lastInputAtRef.current = new Date().toISOString();
        return true;
      },
      lookAtModularHome() {
        pendingQaCommandRef.current = { type: 'look-at-modular-home' };
        lastInputAtRef.current = new Date().toISOString();
        return true;
      },
      setCameraPreset(preset: Expo3DQACameraPreset, phase: Expo3DQACameraPresetPhase | 'interior-pullback' | 'camera-lock-adjust' = 'baseline') {
        pendingQaCommandRef.current = { phase, type: 'preset', preset };
        lastInputAtRef.current = new Date().toISOString();
        return true;
      },
      setPlayerPosition(position: Vec3Like) {
        pendingQaCommandRef.current = { type: 'player-position', position };
        lastInputAtRef.current = new Date().toISOString();
        return true;
      },
    };

    window.__WARPALA_3D_QA__ = api;
    return () => {
      if (window.__WARPALA_3D_QA__ === api) {
        window.__WARPALA_3D_QA__ = undefined;
      }
    };
  }, [camera, gl, scene]);

  useFrame((state) => {
    const hasCameraCommand = Boolean(pendingQaCommandRef.current || activeFixedCameraPresetRef.current);
    if (!hasCameraCommand && !qa3dMode) {
      return;
    }

    const nowMs = state.clock.elapsedTime * 1000;
    if (!hasCameraCommand && nowMs - lastStateUpdateAtRef.current < 250) {
      return;
    }
    lastStateUpdateAtRef.current = nowMs;

    const modularHomeRoot = findModularHomeRoot(scene);
    const objectSummary = buildObjectSummary(scene);
    const modularHomeBounds = modularHomeRoot ? new THREE.Box3().setFromObject(modularHomeRoot) : null;
    const modularHomeBoundsLike = toBox3Like(modularHomeBounds);
    const portalRoot = scene.getObjectByName('modular-home-entrance-portal');
    const portalPosition = portalRoot ? portalRoot.getWorldPosition(new THREE.Vector3()) : null;
    const canvas = gl.domElement;
    const pointerLockActive = typeof document !== 'undefined' && document.pointerLockElement === canvas;
    const canvasFocused = typeof document !== 'undefined' && document.activeElement === canvas;

    const setCamera = (position: THREE.Vector3, target: THREE.Vector3, fov = FIXED_CAMERA_BASE_FOV) => {
      camera.position.copy(position);
      camera.lookAt(target);
      (camera as THREE.PerspectiveCamera).fov = fov;
      camera.updateProjectionMatrix();
      camera.updateMatrixWorld();
    };

    const applyFixedCameraPreset = (preset: Expo3DQACameraPreset, phase: Expo3DQACameraPresetPhase = 'baseline') => {
      const fixedPreset = buildFixedCameraPreset(preset, phase);
      if (!fixedPreset) {
        return false;
      }

      setCamera(fixedPreset.position, fixedPreset.target, fixedPreset.fov);
      return true;
    };

    const applyQaCommand = () => {
      const command = pendingQaCommandRef.current;
      if (!command) {
        return;
      }

      const homeBounds = modularHomeBounds;
      const homeCenter = homeBounds ? homeBounds.getCenter(new THREE.Vector3()) : new THREE.Vector3(0, 5, 0);
      const homeSize = homeBounds ? homeBounds.getSize(new THREE.Vector3()) : new THREE.Vector3(48, 18, 48);
      const homeFront = homeBounds ? homeBounds.max.z : homeCenter.z + Math.max(24, homeSize.z * 0.8);

      const applyPreset = (preset: Expo3DQACameraPreset, phase: Expo3DQACameraPresetPhase | 'interior-pullback' | 'camera-lock-adjust' = 'baseline') => {
        if (phase === 'interior-pullback') {
          const pullbackPreset = buildInteriorPullbackPreset(preset, camera.position.clone());
          if (!pullbackPreset) {
            return false;
          }

          setCamera(pullbackPreset.position, pullbackPreset.target, pullbackPreset.fov);
          activeFixedCameraPresetRef.current = null;
          return true;
        }

        if (applyFixedCameraPreset(preset, phase)) {
          activeFixedCameraPresetRef.current = { framesRemaining: 90, phase, preset };
          return true;
        }

        return false;
      };

      const frameShot = (shotName: Expo3DQAShotName) => {
        if (!homeBounds) {
          return false;
        }

        const perspectiveCamera = camera as THREE.PerspectiveCamera;
        const fovRadians = THREE.MathUtils.degToRad(clamp(perspectiveCamera.fov || 50, 25, 75));
        const baseRadius = Math.max(homeSize.x, homeSize.y, homeSize.z) / 2;
        const exteriorDistance = Math.max(baseRadius * 1.25, (baseRadius / Math.tan(fovRadians / 2)) * 1.6);
        const elevatedDistance = Math.max(baseRadius * 1.05, (baseRadius / Math.tan(fovRadians / 2)) * 1.2);
        const interiorDistance = Math.max(Math.max(homeSize.x, homeSize.z) * 0.32, (baseRadius / Math.tan(fovRadians / 2)) * 0.9);
        const closeInteriorDistance = Math.max(Math.max(homeSize.x, homeSize.z) * 0.24, (baseRadius / Math.tan(fovRadians / 2)) * 0.72);
        const frontDoor = getAnchorOrFallback(
          scene,
          ['front-door', 'front-entry', 'entry-door', 'door-frame', 'modular-home-entry-door', 'entry'],
          new THREE.Vector3(homeCenter.x, homeCenter.y + 1.2, homeFront - Math.max(2, homeSize.z * 0.14)),
        );
        const livingZone = getAnchorOrFallback(
          scene,
          ['living-zone-furniture', 'family-living-module-main', 'compact-living-module-main'],
          new THREE.Vector3(homeCenter.x - Math.max(6, homeSize.x * 0.14), homeCenter.y + 1.1, homeCenter.z + Math.max(2, homeSize.z * 0.04)),
        );
        const kitchenZone = getAnchorOrFallback(
          scene,
          ['kitchen-zone-furniture', 'family-living-module-main', 'compact-living-module-main'],
          new THREE.Vector3(homeCenter.x + Math.max(5, homeSize.x * 0.12), homeCenter.y + 1.0, homeCenter.z + Math.max(1, homeSize.z * 0.02)),
        );
        const sleepingZone = getAnchorOrFallback(
          scene,
          ['sleeping-zone-furniture', 'family-bedroom-module-left', 'family-bedroom-module-right', 'compact-bedroom-module-main'],
          new THREE.Vector3(homeCenter.x - Math.max(7, homeSize.x * 0.16), homeCenter.y + 1.0, homeCenter.z - Math.max(6, homeSize.z * 0.18)),
        );
        const bathroomZone = getAnchorOrFallback(
          scene,
          ['bathroom-zone-furniture', 'bathroom-core-module-family', 'bathroom-core-module-compact', 'bathroom-core-module-sauna'],
          new THREE.Vector3(homeCenter.x + Math.max(6, homeSize.x * 0.14), homeCenter.y + 1.0, homeCenter.z - Math.max(8, homeSize.z * 0.2)),
        );
        const interiorAnchor = getAnchorOrFallback(
          scene,
          ['modular-home-interior-furniture', 'modular-home-interior-walkthrough'],
          homeCenter.clone(),
        );
        const midpointAnchor = sleepingZone.clone().add(bathroomZone).multiplyScalar(0.5);

        const aim = (position: THREE.Vector3, target: THREE.Vector3) => {
          setCamera(position, target);
          return true;
        };

        switch (shotName) {
          case 'exteriorFrontHero': {
            const direction = normalizeOrFallback(new THREE.Vector3(0.14, 0.18, 1), new THREE.Vector3(0, 0, 1));
            return aim(
              frontDoor.clone()
                .add(direction.multiplyScalar(exteriorDistance))
                .add(new THREE.Vector3(0, Math.max(3.5, homeSize.y * 0.14), 0)),
              frontDoor.clone().add(new THREE.Vector3(0, 0.9, 0)),
            );
          }
          case 'exteriorSideAngle': {
            const direction = normalizeOrFallback(new THREE.Vector3(1, 0.16, 0.32), new THREE.Vector3(1, 0, 0));
            return aim(
              homeCenter.clone()
                .add(direction.multiplyScalar(exteriorDistance * 0.98))
                .add(new THREE.Vector3(0, Math.max(3.6, homeSize.y * 0.14), 0)),
              homeCenter.clone().add(new THREE.Vector3(0, 1.4, 0)),
            );
          }
          case 'exteriorRearAngle': {
            const direction = normalizeOrFallback(new THREE.Vector3(-0.82, 0.18, -1), new THREE.Vector3(-1, 0, 0));
            return aim(
              homeCenter.clone()
                .add(direction.multiplyScalar(exteriorDistance * 0.94))
                .add(new THREE.Vector3(0, Math.max(3.7, homeSize.y * 0.16), 0)),
              homeCenter.clone().add(new THREE.Vector3(0, 1.2, 0)),
            );
          }
          case 'exteriorElevatedCutaway': {
            const direction = normalizeOrFallback(new THREE.Vector3(-0.18, 1, 0.22), new THREE.Vector3(0, 1, 0.2));
            return aim(
              homeCenter.clone()
                .add(direction.multiplyScalar(elevatedDistance))
                .add(new THREE.Vector3(0, Math.max(4.5, homeSize.y * 0.2), 0)),
              homeCenter.clone().add(new THREE.Vector3(0, 1.6, 0)),
            );
          }
          case 'interiorOverview': {
            const direction = normalizeOrFallback(new THREE.Vector3(0.58, 0.35, 0.78), new THREE.Vector3(0.4, 0.2, 0.8));
            return aim(
              interiorAnchor.clone()
                .add(direction.multiplyScalar(interiorDistance))
                .add(new THREE.Vector3(0, Math.max(2.5, homeSize.y * 0.08), 0)),
              interiorAnchor.clone().add(new THREE.Vector3(0, 1.1, 0)),
            );
          }
          case 'interiorLiving': {
            const direction = normalizeOrFallback(new THREE.Vector3(0.68, 0.18, 0.66), new THREE.Vector3(0.6, 0.15, 0.55));
            return aim(
              livingZone.clone()
                .add(direction.multiplyScalar(closeInteriorDistance))
                .add(new THREE.Vector3(0, Math.max(2.0, homeSize.y * 0.06), 0)),
              livingZone.clone().add(new THREE.Vector3(0, 0.9, 0)),
            );
          }
          case 'interiorKitchen': {
            const direction = normalizeOrFallback(new THREE.Vector3(-0.62, 0.18, 0.72), new THREE.Vector3(-0.55, 0.15, 0.62));
            return aim(
              kitchenZone.clone()
                .add(direction.multiplyScalar(closeInteriorDistance))
                .add(new THREE.Vector3(0, Math.max(2.0, homeSize.y * 0.06), 0)),
              kitchenZone.clone().add(new THREE.Vector3(0, 0.9, 0)),
            );
          }
          case 'interiorSleepingBathroom': {
            const direction = normalizeOrFallback(new THREE.Vector3(-0.72, 0.2, 0.68), new THREE.Vector3(-0.6, 0.15, 0.6));
            return aim(
              midpointAnchor.clone()
                .add(direction.multiplyScalar(closeInteriorDistance * 1.08))
                .add(new THREE.Vector3(0, Math.max(2.0, homeSize.y * 0.06), 0)),
              midpointAnchor.clone().add(new THREE.Vector3(0, 0.9, 0)),
            );
          }
          default:
            return false;
        }
      };

      switch (command.type) {
        case 'player-position': {
          const nextPosition = new THREE.Vector3(command.position.x, command.position.y, command.position.z);
          setCamera(nextPosition, homeCenter);
          break;
        }
        case 'look-at-modular-home': {
          const position = camera.position.clone();
          setCamera(position, new THREE.Vector3(homeCenter.x, Math.max(homeCenter.y + 1.5, 6.2), homeCenter.z));
          break;
        }
        case 'frame-shot': {
          frameShot(command.shotName);
          break;
        }
        case 'preset': {
          applyPreset(command.preset, command.phase ?? 'baseline');
          break;
        }
      }

      pendingQaCommandRef.current = null;
    };

    applyQaCommand();
    if (activeFixedCameraPresetRef.current) {
      const { phase, preset } = activeFixedCameraPresetRef.current;
      if (applyFixedCameraPreset(preset, phase)) {
        activeFixedCameraPresetRef.current.framesRemaining -= 1;
      } else {
        activeFixedCameraPresetRef.current.framesRemaining = 0;
      }
      if (activeFixedCameraPresetRef.current.framesRemaining <= 0) {
        activeFixedCameraPresetRef.current = null;
      }
    }

    const playerPositionVector = new THREE.Vector3(...analyticsState.playerPosition);
    const cameraPosition = camera.position;
    const cameraRotation = camera.rotation;
    const cameraForward = camera.getWorldDirection(new THREE.Vector3()).normalize();
    const nextPlayerPosition = toVec3Like(playerPositionVector);
    const nextCameraPosition = toVec3Like(cameraPosition);
    const nextCameraRotation = {
      x: Number(cameraRotation.x.toFixed(4)),
      y: Number(cameraRotation.y.toFixed(4)),
      z: Number(cameraRotation.z.toFixed(4)),
    };
    const playerVelocity = lastCameraPositionRef.current && nextCameraPosition
      ? {
          x: Number((cameraPosition.x - lastCameraPositionRef.current.x).toFixed(4)),
          y: Number((cameraPosition.y - lastCameraPositionRef.current.y).toFixed(4)),
          z: Number((cameraPosition.z - lastCameraPositionRef.current.z).toFixed(4)),
        }
      : null;

    lastCameraPositionRef.current = cameraPosition.clone();

    const cameraDistanceToModularHome = modularHomeBounds
      ? Number(distanceToBounds(camera.position, modularHomeBounds).toFixed(4))
      : null;
    const modularHomeCenter = modularHomeBounds ? modularHomeBounds.getCenter(new THREE.Vector3()) : null;
    const cameraFacingModularHome = Boolean(
      modularHomeCenter
      && cameraForward.dot(modularHomeCenter.clone().sub(camera.position).normalize()) > 0.18,
    );
    const cameraInsideGeometryLikely = Boolean(
      modularHomeBounds
      && isPointInsideBounds(camera.position, modularHomeBounds)
      && distanceToBounds(camera.position, modularHomeBounds) < 1.5,
    );

    latestStateRef.current = {
      activeScene,
      canvasFocused,
      cameraPosition: nextCameraPosition,
      cameraDistanceToModularHome,
      cameraFacingModularHome,
      cameraInsideGeometryLikely,
      cameraFov: Number(((camera as THREE.PerspectiveCamera).fov ?? 50).toFixed(2)),
      cameraRotation: nextCameraRotation,
      houseVisualBounds: objectSummary.houseVisualBounds,
      houseVisualBoundsCandidates: objectSummary.houseVisualBoundsCandidates,
      geometrySanity: getGalaGeometrySanity(),
      modularHomeRootFound: objectSummary.modularHomeRootFound,
      modularHomeRootName: objectSummary.modularHomeRootName,
      inHomeInteriorZone: location.pathname.startsWith('/modular-homes/studio') && new URLSearchParams(location.search).get('view') === 'interior',
      lastInputAt: lastInputAtRef.current,
      modularHomeBounds: modularHomeBoundsLike,
      modularHomeObjectCount: objectSummary.modularHomeObjectCount,
      modularHomeVisible: objectSummary.modularHomeVisible,
      pointerLockActive,
      playerPosition: nextPlayerPosition,
      playerVelocity,
      portalActive: Boolean(
        portalPosition
        && nextPlayerPosition
        && Math.hypot(
          nextPlayerPosition.x - portalPosition.x,
          nextPlayerPosition.z - portalPosition.z,
        ) <= 30
        && Math.abs(nextPlayerPosition.y - portalPosition.y) <= 22,
      ),
      portalVisible: objectSummary.portalVisible,
      route: `${location.pathname}${location.search}`,
      runtimeMode,
      visibleObjectSummary: objectSummary.visibleObjectSummary,
    };
  });

  return null;
}
