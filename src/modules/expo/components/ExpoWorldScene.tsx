import React, { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { AdaptiveDpr, AdaptiveEvents, Environment, Html, Loader, OrbitControls, PointerLockControls, Sky, Text, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { BoothUI } from '../../../components/BoothUI';
import { CuratedSkylineRing } from './CuratedSkylineRing';
import { ExpoEvidenceProbe } from './ExpoEvidenceProbe';
import {
  DistrictBooth as RuntimeDistrictBooth,
} from '../runtime/booths';
import {
  ExpoRearCampus as RuntimeExpoRearCampus,
  ExpoArchitecturalMassMaterial,
  WorldCitySkeleton,
  WorldGroundPlane,
  WorldPromenade,
  WorldWayfinding,
  usePlayerColliderRegistration,
} from '../runtime/world';
import {
  trackExpoBoothViewed,
  trackExpoSceneLoaded,
  trackExpoSectorEntered,
} from '../lib/expoAnalytics';
import { sanitizeExpoBackdropCityScene, type ExpoBackdropStrategy } from '../lib/backdropSanitization';
import { buildSponsorBoothPresentation } from '../lib/sponsorBoothPresentation';
import { EXPO_CITY_QUALITY_TIER, EXPO_FEATURE_FLAGS, EXPO_SPATIAL_DEBUG_FLAGS, type ExpoMode } from '../state/expoRuntime';
import { replaceDistrictBoothZones } from '../sceneWorld-support';
import type { ExpoPlayBounds, ExpoWalkRegion } from '../walk-region';
import type {
  ExpoDistrictProgramSummary,
  ExpoStartView,
  ExpoWorldContract,
  ExpoWorldVisualProfile,
} from '../world-contract';
import type { ExpoBoothPlacement } from '../layout-engine';
import { getWorldCityStadiumReserve, type StadiumReserve } from '../runtime/world/WorldCitySkeletonLayout';

class SceneErrorBoundary extends React.Component<{ children: React.ReactNode; fallback: React.ReactNode }, { hasError: boolean }> {
  constructor(props: { children: React.ReactNode; fallback: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    if (import.meta.env.DEV) {
      console.error('Expo world asset loading failed. Falling back to safe city scaffold.', error);
    }
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }

    return this.props.children;
  }
}

function FallbackCityScaffold({ label }: { label: string }) {
  const fallbackRef = useRef<THREE.Group>(null);
  const fallbackBlocks = useMemo(() => (
    Array.from({ length: 14 }, (_, index) => {
      const column = index % 4;
      const row = Math.floor(index / 4);
      const x = (column - 1.5) * 26;
      const z = -40 - row * 28;
      const height = 8 + ((index % 5) * 4);

      return {
        id: `fallback-block-${index}`,
        position: [x, height / 2, z] as [number, number, number],
        size: [10, height, 10] as [number, number, number],
      };
    })
  ), []);
  usePlayerColliderRegistration(fallbackRef, 'fallback-city');

  return (
    <group ref={fallbackRef}>
      {fallbackBlocks.map((block) => (
        <mesh key={block.id} position={block.position} castShadow>
          <boxGeometry args={block.size} />
          <meshStandardMaterial color="#1e293b" metalness={0.15} roughness={0.8} />
        </mesh>
      ))}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, -70]}>
        <planeGeometry args={[180, 180]} />
        <meshStandardMaterial color="#111827" />
      </mesh>
      <Text position={[0, 14, 20]} fontSize={3} color="#38bdf8" anchorX="center" anchorY="middle">
        WEB3D FALLBACK CITY
      </Text>
      <Text position={[0, 10, 20]} maxWidth={60} fontSize={1.1} color="#e2e8f0" anchorX="center" anchorY="middle">
        {label}
      </Text>
    </group>
  );
}

function setSceneUserData(scene: THREE.Scene, key: string, value: unknown) {
  scene.userData[key] = value;
}

const PLAYER_COLLIDER_ROOTS_KEY = 'playerCollisionRoots';
const DISABLE_PLAYER_COLLISION_FLAG = 'disablePlayerCollision';
const EXPO_START_VIEW_KEY = 'expoStartView';
const PLAYER_COLLISION_TARGETS_CACHE_KEY = 'playerCollisionTargetsCache';
const PLAYER_COLLISION_TARGETS_CACHE_VERSION_KEY = 'playerCollisionTargetsCacheVersion';
const PLAYER_COLLISION_TARGETS_CACHE_RESOLVED_VERSION_KEY = 'playerCollisionTargetsCacheResolvedVersion';

function isCollisionMesh(object: THREE.Object3D) {
  return Boolean((object as THREE.Mesh).isMesh || (object as THREE.InstancedMesh).isInstancedMesh);
}

function getPlayerCollisionTargetsVersion(scene: THREE.Scene) {
  const version = Number(scene.userData[PLAYER_COLLISION_TARGETS_CACHE_VERSION_KEY]);
  return Number.isFinite(version) ? version : 0;
}

function getPlayerColliderRoots(scene: THREE.Scene): THREE.Object3D[] {
  const roots = scene.userData[PLAYER_COLLIDER_ROOTS_KEY];
  if (!Array.isArray(roots)) {
    return [];
  }

  return roots.filter((root): root is THREE.Object3D => Boolean(root && typeof (root as THREE.Object3D).traverse === 'function'));
}

function isCollisionDisabled(object: THREE.Object3D, boundaryRoot: THREE.Object3D) {
  let current: THREE.Object3D | null = object;

  while (current) {
    if (current.userData?.[DISABLE_PLAYER_COLLISION_FLAG] === true) {
      return true;
    }
    if (current === boundaryRoot) {
      break;
    }
    current = current.parent;
  }

  return false;
}

function collectPlayerCollisionTargets(scene: THREE.Scene) {
  const cacheVersion = getPlayerCollisionTargetsVersion(scene);
  const cachedTargets = scene.userData[PLAYER_COLLISION_TARGETS_CACHE_KEY];
  const resolvedVersion = Number(scene.userData[PLAYER_COLLISION_TARGETS_CACHE_RESOLVED_VERSION_KEY]);
  if (Array.isArray(cachedTargets) && resolvedVersion === cacheVersion) {
    return cachedTargets as THREE.Object3D[];
  }

  const targets = new Set<THREE.Object3D>();

  getPlayerColliderRoots(scene).forEach((root) => {
    if (!root.visible || root.userData?.[DISABLE_PLAYER_COLLISION_FLAG] === true) {
      return;
    }

    root.traverse((child) => {
      if (!child.visible || isCollisionDisabled(child, root) || !isCollisionMesh(child)) {
        return;
      }

      targets.add(child);
    });
  });

  const resolvedTargets = Array.from(targets);
  setSceneUserData(scene, PLAYER_COLLISION_TARGETS_CACHE_KEY, resolvedTargets);
  setSceneUserData(scene, PLAYER_COLLISION_TARGETS_CACHE_RESOLVED_VERSION_KEY, cacheVersion);
  return resolvedTargets;
}

function logExpoWorldDebug(enabled: boolean, ...args: unknown[]) {
  if (enabled) {
    console.log(...args);
  }
}

function markScenicNonColliding(root: THREE.Object3D) {
  root.userData.sceneLayerRole = 'scenic-non-colliding';
  root.traverse((child) => {
    child.userData.sceneLayerRole = 'scenic-non-colliding';
    child.userData[DISABLE_PLAYER_COLLISION_FLAG] = true;
  });
}

export function PrimitiveCityModel({
  debug = false,
  strategy,
}: {
  debug?: boolean;
  strategy: ExpoBackdropStrategy;
}) {
  const { scene } = useThree();
  const { scene: loadedCityScene } = useGLTF('/models/realistic_city.glb');
  const cityRoot = useMemo(() => {
    const clone = loadedCityScene.clone(true);
    markScenicNonColliding(clone);
    const sanitized = sanitizeExpoBackdropCityScene(clone, strategy);
    clone.userData.expoBackdropStrategy = strategy;
    clone.userData.expoBackdropBounds = sanitized;

    return clone;
  }, [loadedCityScene, strategy]);
  useEffect(() => {
    if (debug && EXPO_FEATURE_FLAGS.enableSceneGlobalsDebug) {
      (window as any).scene = scene;
      return () => {
        if ((window as any).scene === scene) {
          delete (window as any).scene;
        }
      };
    }

    if ((window as any).scene === scene) {
      delete (window as any).scene;
    }
  }, [debug, scene]);

  useEffect(() => {
    if (!cityRoot) {
      return;
    }

      const bounds = new THREE.Box3().setFromObject(cityRoot);
      const center = bounds.getCenter(new THREE.Vector3());
      const size = bounds.getSize(new THREE.Vector3());
      setSceneUserData(scene, 'cityAssetPipeline', {
        mode: 'sanitized-city-shell',
        source: '/models/realistic_city.glb',
        bounds: {
          center: center.toArray(),
          size: size.toArray(),
        },
        strategy: {
          cityShellOffsetY: strategy.cityShellOffsetY,
          cityShellOffsetZ: strategy.cityShellOffsetZ,
          cityShellOpacity: strategy.cityShellOpacity,
          cityShellTargetSpan: strategy.cityShellTargetSpan,
          skylineDensity: strategy.skylineDensity,
        },
      });
  }, [cityRoot, scene, strategy]);

  return (
    <>
      {debug && (
        <>
          <gridHelper args={[500, 50, '#ff0000', '#444444']} position={[0, 0.05, 0]} />
          <axesHelper args={[100]} position={[0, 0.1, 0]} />
        </>
      )}

      <SceneErrorBoundary fallback={<FallbackCityScaffold label="Static city failed to load. Switched to safe fallback city mode." />}>
        <primitive object={cityRoot} />
      </SceneErrorBoundary>
    </>
  );
}

/* Legacy city fallback path is quarantined from the release path.
function LegacyCityModel({
  const [availableAssetUrls, setAvailableAssetUrls] = useState<string[] | null>(null);
  const [forceFallback, setForceFallback] = useState(false);
  const [worldDiagnostics, setWorldDiagnostics] = useState<ExpoWorldDiagnostics | null>(null);

  useEffect(() => {
    let cancelled = false;

    const probeAssets = async () => {
      const results = await Promise.all(
        EXPO_ASSET_URLS.map(async (url) => {
          try {
            const response = await fetch(url, { method: 'HEAD', cache: 'no-store' });
            return response.ok ? url : null;
          } catch {
            return null;
          }
        })
      );

      if (!cancelled) {
        setAvailableAssetUrls(results.filter(Boolean) as string[]);
      }
    };

    probeAssets().catch((error) => {
      console.error('Failed to probe city asset availability.', error);
      if (!cancelled) {
        setAvailableAssetUrls([]);
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const fallbackLabel = availableAssetUrls === null
    ? 'Ielādē Web3D pilsētas resursus...'
    : availableAssetUrls.length === 0
      ? '3D modeļi nav pieejami. Izmantojam drošu Web3D fallback pilsētu un sponsoru stendus.'
      : 'GLTF pilsētas moduļi ielādēti.';

  return (
    <>
      {debug && (
        <>
          <gridHelper args={[500, 50, '#ff0000', '#444444']} position={[0, 0.05, 0]} />
          <axesHelper args={[100]} position={[0, 0.1, 0]} />
        </>
      )}

      {availableAssetUrls && availableAssetUrls.length > 0 && !forceFallback ? (
        <SceneErrorBoundary fallback={<FallbackCityScaffold label="GLTF ielade neizdevās. Pārslēgts drošais fallback city režīms." />}>
          <AssetCityContent
            assetUrls={availableAssetUrls}
            boothPlacements={boothPlacements}
            debug={debug}
            zoneSystem={zoneSystem}
            onDiagnosticsChange={setWorldDiagnostics}
            onNoValidModules={() => setForceFallback(true)}
          />
        </SceneErrorBoundary>
      ) : (
        <FallbackCityScaffold label={fallbackLabel} />
      )}

      {debug && worldDiagnostics && (
        <Html position={[0, 12, 18]} center>
          <div style={{ background: 'rgba(2, 6, 23, 0.8)', color: '#e2e8f0', border: '1px solid rgba(59, 130, 246, 0.35)', borderRadius: '12px', padding: '10px 14px', minWidth: '260px' }}>
            <div>Asset URLs: <strong>{worldDiagnostics.assetUrlCount}</strong></div>
            <div>Raw models: <strong>{worldDiagnostics.rawModelCount}</strong></div>
            <div>Processed modules: <strong>{worldDiagnostics.processedModuleCount}</strong></div>
            <div>Booth placements: <strong>{worldDiagnostics.boothPlacementCount}</strong></div>
          </div>
        </Html>
      )}

      {worldDiagnostics?.status === 'no-valid-modules' && (
        <Html position={[0, 14, 0]} center>
          <div style={{ background: 'rgba(15, 23, 42, 0.92)', color: 'white', padding: '16px 20px', borderRadius: '14px', border: '1px solid rgba(248, 113, 113, 0.45)', width: '360px', textAlign: 'center' }}>
            <strong>Expo city modules were rejected.</strong>
            <div style={{ marginTop: '8px', fontSize: '13px', lineHeight: 1.5 }}>
              Processed modules: {worldDiagnostics.processedModuleCount} / {worldDiagnostics.assetUrlCount}
            </div>
          </div>
        </Html>
      )}

      <mesh position={[5, 1, -20]} castShadow>
        <boxGeometry args={[1, 2, 1]} />
        <meshStandardMaterial color="lime" />
      </mesh>
    </>
  );
}

*/

export function Guests({ guests: _guests }: { guests: any[] }) {
  return (
    <group>
      {_guests.map((guest: any) => (
        <group key={guest.id} position={guest.position}>
          {guest.isSpeaking && (
            <mesh position={[0, 1.5, 0]}>
              <sphereGeometry args={[1.5, 16, 16]} />
              <meshBasicMaterial color="#10b981" transparent opacity={0.1} />
            </mesh>
          )}
          <mesh position={[0, 1, 0]} castShadow>
            <capsuleGeometry args={[0.4, 1.2, 4, 8]} />
            <meshStandardMaterial color={guest.color || '#3b82f6'} />
          </mesh>
          <mesh position={[0, 2, 0]}>
            <sphereGeometry args={[0.3, 8, 8]} />
            <meshStandardMaterial color="#ffdbac" />
          </mesh>
          <Html position={[0, 2.8, 0]} center>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}>
              {guest.isSpeaking && <div style={{ fontSize: '12px' }}>🎙️</div>}
              <div style={{ background: 'rgba(0,0,0,0.5)', color: 'white', padding: '2px 8px', borderRadius: '10px', fontSize: '10px', fontWeight: 'bold', whiteSpace: 'nowrap' }}>
                User_{guest.id.substring(0, 4)}
              </div>
            </div>
          </Html>
        </group>
      ))}
    </group>
  );
}

function getDistrictVisualProfile(
  sectorId: string | null | undefined,
  clusterIndex: number | undefined,
  visualProfile: ExpoWorldVisualProfile
) {
  return (sectorId ? visualProfile.districts.find((district) => district.sectorId === sectorId) : undefined)
    ?? visualProfile.districts.find((district) => district.clusterIndex === clusterIndex)
    ?? visualProfile.districts[0];
}

function selectVisibleBoothPlacements(
  boothPlacements: ExpoBoothPlacement[],
  districtPrograms: ExpoDistrictProgramSummary[]
) {
  const districtByKey = new Map(
    districtPrograms.map((district) => [district.sectorId ?? `cluster-${district.clusterIndex}`, district])
  );
  const placementsByDistrict = new Map<string, ExpoBoothPlacement[]>();

  boothPlacements.forEach((placement) => {
    const key = placement.sectorId ?? `cluster-${placement.clusterIndex ?? -1}`;
    const existing = placementsByDistrict.get(key) ?? [];
    existing.push(placement);
    placementsByDistrict.set(key, existing);
  });

  return Array.from(placementsByDistrict.entries()).flatMap(([districtKey, placements]) => {
    const district = districtByKey.get(districtKey);
    const rankedPlacements = [...placements].sort((left, right) => {
      const priorityDiff = Number(right.priority ?? 0) - Number(left.priority ?? 0);
      if (priorityDiff !== 0) {
        return priorityDiff;
      }

      const nodeWeight = (placement: ExpoBoothPlacement) => (
        placement.nodeType === 'hero_left' || placement.nodeType === 'hero_right'
          ? 4
          : placement.nodeType === 'endcap'
            ? 3
            : placement.nodeType === 'standard_left' || placement.nodeType === 'standard_right'
              ? 2
              : 1
      );
      const nodeDiff = nodeWeight(right) - nodeWeight(left);
      if (nodeDiff !== 0) {
        return nodeDiff;
      }

      return String(left.id).localeCompare(String(right.id));
    });

    const visibleLimit = district?.expressionMode === 'active-commercial'
      ? 4
      : district?.expressionMode === 'calm-dwell'
        ? 2
        : district?.expressionMode === 'feature-court'
          ? 3
          : district?.expressionMode === 'scenic' || district?.expressionMode === 'satellite' || district?.expressionMode === 'orientation'
            ? 2
            : 2;

    return rankedPlacements.slice(0, Math.min(visibleLimit, rankedPlacements.length));
  });
}

function isInsideSponsorFrontageReserve(
  point: [number, number, number],
  boothPlacements: ExpoBoothPlacement[],
  options?: {
    frontDepth?: number;
    rearDepth?: number;
    sideWidth?: number;
    radius?: number;
  }
) {
  const frontDepth = options?.frontDepth ?? 520;
  const rearDepth = options?.rearDepth ?? 220;
  const sideWidth = options?.sideWidth ?? 260;
  const radius = options?.radius ?? 340;

  return boothPlacements.some((booth) => {
    const dx = point[0] - booth.position[0];
    const dz = point[2] - booth.position[2];
    const yaw = booth.rotation?.[1] ?? 0;
    const cos = Math.cos(-yaw);
    const sin = Math.sin(-yaw);
    const localX = (dx * cos) - (dz * sin);
    const localZ = (dx * sin) + (dz * cos);
    const distanceSq = (dx * dx) + (dz * dz);

    const inFrontageLane = Math.abs(localX) < sideWidth && localZ > -rearDepth && localZ < frontDepth;
    const inFrontageRadius = distanceSq < (radius * radius);

    return inFrontageLane || inFrontageRadius;
  });
}

function filterReservedSponsorFrontageEntries<T extends { position: [number, number, number] }>(
  entries: T[],
  boothPlacements: ExpoBoothPlacement[],
  options?: {
    frontDepth?: number;
    rearDepth?: number;
    sideWidth?: number;
    radius?: number;
  }
) {
  return entries.filter((entry) => !isInsideSponsorFrontageReserve(entry.position, boothPlacements, options));
}

function isInsideStadiumReserve(point: [number, number, number], reserve: StadiumReserve) {
  return (
    Math.abs(point[0] - reserve.centerX) <= reserve.halfWidth &&
    Math.abs(point[2] - reserve.centerZ) <= reserve.halfDepth
  );
}

function overlapsStadiumReserve(
  point: [number, number, number],
  reserve: StadiumReserve,
  footprint?: [number, number] | [number, number, number] | number
) {
  if (typeof footprint === 'number') {
    return (
      Math.abs(point[0] - reserve.centerX) <= reserve.halfWidth + footprint &&
      Math.abs(point[2] - reserve.centerZ) <= reserve.halfDepth + footprint
    );
  }

  if (Array.isArray(footprint)) {
    const halfX = footprint[0] * 0.5;
    const halfZ = (footprint.length === 3 ? footprint[2] : footprint[1]) * 0.5;
    return (
      Math.abs(point[0] - reserve.centerX) <= reserve.halfWidth + halfX &&
      Math.abs(point[2] - reserve.centerZ) <= reserve.halfDepth + halfZ
    );
  }

  return isInsideStadiumReserve(point, reserve);
}

function ExpoCityForeground({
  boothPlacements,
  districtPrograms,
  visualProfile,
}: {
  boothPlacements: ExpoBoothPlacement[];
  districtPrograms: ExpoDistrictProgramSummary[];
  visualProfile: ExpoWorldVisualProfile;
}) {
  const enableHeavyShadows = EXPO_FEATURE_FLAGS.enableShowcaseSkylineDensity;
  const stadiumReserve = useMemo(() => getWorldCityStadiumReserve(boothPlacements), [boothPlacements]);
  const cityStreetMoments = useMemo(() => {
    const entries = districtPrograms.flatMap((district, districtIndex) => {
      const baseZ = -196 - (districtIndex * 548);
      const isActive = district.expressionMode === 'active-commercial';
      const isCalm = district.expressionMode === 'calm-dwell';
      const boulevardColor = isActive ? '#1a2531' : isCalm ? '#202a33' : '#1c2730';
      const farStreetColor = isActive ? '#33424f' : isCalm ? '#3b4953' : '#36454f';
      const connectorColor = isActive ? '#aebfcd' : '#b8c4cf';

      return [
        {
          id: `${district.sectorId ?? district.clusterIndex}-street-left`,
          position: [-228, 0.014, baseZ - 72] as [number, number, number],
          size: [84, 436] as [number, number],
          color: boulevardColor,
        },
        {
          id: `${district.sectorId ?? district.clusterIndex}-street-right`,
          position: [228, 0.014, baseZ - 88] as [number, number, number],
          size: [84, 452] as [number, number],
          color: boulevardColor,
        },
        {
          id: `${district.sectorId ?? district.clusterIndex}-street-far-left`,
          position: [-474, 0.014, baseZ - 204] as [number, number, number],
          size: [96, 404] as [number, number],
          color: farStreetColor,
        },
        {
          id: `${district.sectorId ?? district.clusterIndex}-street-far-right`,
          position: [474, 0.014, baseZ - 228] as [number, number, number],
          size: [96, 404] as [number, number],
          color: farStreetColor,
        },
        {
          id: `${district.sectorId ?? district.clusterIndex}-cross-link-near`,
          position: [0, 0.016, baseZ + 84] as [number, number, number],
          size: [612, 28] as [number, number],
          color: '#d7e0e8',
        },
        {
          id: `${district.sectorId ?? district.clusterIndex}-cross-link-mid`,
          position: [0, 0.016, baseZ - 126] as [number, number, number],
          size: [764, 24] as [number, number],
          color: connectorColor,
        },
      ];
    });
    return filterReservedSponsorFrontageEntries(entries, boothPlacements, { frontDepth: 540, rearDepth: 180, sideWidth: 220, radius: 280 });
  }, [districtPrograms, boothPlacements]);

  const cityBranchMoments = useMemo(() => {
    const entries = districtPrograms.flatMap((district, districtIndex) => {
      const baseZ = -196 - (districtIndex * 548);
      const isActive = district.expressionMode === 'active-commercial';
      const isCalm = district.expressionMode === 'calm-dwell';
      const branchColor = isActive ? '#dce4eb' : isCalm ? '#d6dde4' : '#d1d9e1';
      const civicColor = isActive ? '#c8d4df' : '#ccd6de';

      return [
        {
          id: `${district.sectorId ?? district.clusterIndex}-branch-left-a`,
          position: [-134, 0.017, baseZ + 128] as [number, number, number],
          size: [92, 18] as [number, number],
          color: branchColor,
        },
        {
          id: `${district.sectorId ?? district.clusterIndex}-branch-right-a`,
          position: [134, 0.017, baseZ + 118] as [number, number, number],
          size: [92, 18] as [number, number],
          color: branchColor,
        },
        {
          id: `${district.sectorId ?? district.clusterIndex}-branch-left-b`,
          position: [-184, 0.017, baseZ - 162] as [number, number, number],
          size: [124, 18] as [number, number],
          color: branchColor,
        },
        {
          id: `${district.sectorId ?? district.clusterIndex}-branch-right-b`,
          position: [184, 0.017, baseZ - 176] as [number, number, number],
          size: [124, 18] as [number, number],
          color: branchColor,
        },
        {
          id: `${district.sectorId ?? district.clusterIndex}-civic-left`,
          position: [-286, 0.019, baseZ + 84] as [number, number, number],
          size: isActive ? ([84, 54] as [number, number]) : isCalm ? ([72, 46] as [number, number]) : ([68, 42] as [number, number]),
          color: civicColor,
        },
        {
          id: `${district.sectorId ?? district.clusterIndex}-civic-right`,
          position: [286, 0.019, baseZ + 72] as [number, number, number],
          size: isActive ? ([84, 54] as [number, number]) : isCalm ? ([72, 46] as [number, number]) : ([68, 42] as [number, number]),
          color: civicColor,
        },
      ];
    });
    return filterReservedSponsorFrontageEntries(entries, boothPlacements, { frontDepth: 480, rearDepth: 180, sideWidth: 220, radius: 280 });
  }, [districtPrograms, boothPlacements]);

  const civicTreeRows = useMemo(() => {
    return [] as Array<{
      id: string;
      position: [number, number, number];
    }>;
  }, []);

  const districtCharacterMasses = useMemo(() => {
    const entries = districtPrograms.flatMap((district, districtIndex) => {
      const visual = getDistrictVisualProfile(district.sectorId, district.clusterIndex, visualProfile);
      const baseZ = -196 - (districtIndex * 548);
      const isActive = district.expressionMode === 'active-commercial';
      const isCalm = district.expressionMode === 'calm-dwell';
      const isScenic = district.expressionMode === 'scenic' || district.expressionMode === 'feature-court';

      if (isActive) {
        return [
          {
            id: `${district.sectorId ?? district.clusterIndex}-active-left-spine`,
            position: [-356, 22, baseZ + 116] as [number, number, number],
            size: [72, 44, 112] as [number, number, number],
            color: '#1a2a39',
            trim: visual.districtGlow,
          },
          {
            id: `${district.sectorId ?? district.clusterIndex}-active-right-spine`,
            position: [356, 22, baseZ + 102] as [number, number, number],
            size: [72, 44, 112] as [number, number, number],
            color: '#1a2a39',
            trim: visual.districtGlow,
          },
          {
            id: `${district.sectorId ?? district.clusterIndex}-active-left-court`,
            position: [-278, 12, baseZ - 28] as [number, number, number],
            size: [88, 24, 54] as [number, number, number],
            color: '#223344',
            trim: visual.shellAccent,
          },
          {
            id: `${district.sectorId ?? district.clusterIndex}-active-right-court`,
            position: [278, 12, baseZ - 42] as [number, number, number],
            size: [88, 24, 54] as [number, number, number],
            color: '#223344',
            trim: visual.shellAccent,
          },
        ];
      }

      if (isCalm) {
        return [
          {
            id: `${district.sectorId ?? district.clusterIndex}-calm-left-pavilion`,
            position: [-298, 10, baseZ + 88] as [number, number, number],
            size: [96, 20, 42] as [number, number, number],
            color: '#31414d',
            trim: '#d5e0e8',
          },
          {
            id: `${district.sectorId ?? district.clusterIndex}-calm-right-pavilion`,
            position: [298, 10, baseZ + 74] as [number, number, number],
            size: [96, 20, 42] as [number, number, number],
            color: '#31414d',
            trim: '#d5e0e8',
          },
          {
            id: `${district.sectorId ?? district.clusterIndex}-calm-left-court`,
            position: [-238, 6, baseZ - 122] as [number, number, number],
            size: [78, 12, 34] as [number, number, number],
            color: '#394954',
            trim: visual.shellAccent,
          },
          {
            id: `${district.sectorId ?? district.clusterIndex}-calm-right-court`,
            position: [238, 6, baseZ - 138] as [number, number, number],
            size: [78, 12, 34] as [number, number, number],
            color: '#394954',
            trim: visual.shellAccent,
          },
        ];
      }

      if (isScenic) {
        return [
          {
            id: `${district.sectorId ?? district.clusterIndex}-scenic-left-frame`,
            position: [-344, 18, baseZ + 64] as [number, number, number],
            size: [28, 36, 12] as [number, number, number],
            color: '#2a3944',
            trim: visual.districtGlow,
          },
          {
            id: `${district.sectorId ?? district.clusterIndex}-scenic-right-frame`,
            position: [344, 18, baseZ + 46] as [number, number, number],
            size: [28, 36, 12] as [number, number, number],
            color: '#2a3944',
            trim: visual.districtGlow,
          },
          {
            id: `${district.sectorId ?? district.clusterIndex}-scenic-left-wall`,
            position: [-286, 8, baseZ - 118] as [number, number, number],
            size: [108, 16, 14] as [number, number, number],
            color: '#32414b',
            trim: '#dde5eb',
          },
          {
            id: `${district.sectorId ?? district.clusterIndex}-scenic-right-wall`,
            position: [286, 8, baseZ - 136] as [number, number, number],
            size: [108, 16, 14] as [number, number, number],
            color: '#32414b',
            trim: '#dde5eb',
          },
        ];
      }

      return [];
    });
    return filterReservedSponsorFrontageEntries(entries, boothPlacements, { frontDepth: 460, rearDepth: 180, sideWidth: 240, radius: 320 });
  }, [districtPrograms, boothPlacements, visualProfile]);

  const districtCharacterCourts = useMemo(() => {
    const entries = districtPrograms.flatMap((district, districtIndex) => {
      const baseZ = -196 - (districtIndex * 548);
      const isActive = district.expressionMode === 'active-commercial';
      const isCalm = district.expressionMode === 'calm-dwell';
      const isScenic = district.expressionMode === 'scenic' || district.expressionMode === 'feature-court';

      if (isActive) {
        return [
          { id: `${district.sectorId ?? district.clusterIndex}-active-court-left`, position: [-278, 0.018, baseZ - 28] as [number, number, number], size: [118, 72] as [number, number], color: '#ccd7e0' },
          { id: `${district.sectorId ?? district.clusterIndex}-active-court-right`, position: [278, 0.018, baseZ - 42] as [number, number, number], size: [118, 72] as [number, number], color: '#ccd7e0' },
        ];
      }

      if (isCalm) {
        return [
          { id: `${district.sectorId ?? district.clusterIndex}-calm-court-left`, position: [-238, 0.018, baseZ - 122] as [number, number, number], size: [132, 84] as [number, number], color: '#d8e0e6' },
          { id: `${district.sectorId ?? district.clusterIndex}-calm-court-right`, position: [238, 0.018, baseZ - 138] as [number, number, number], size: [132, 84] as [number, number], color: '#d8e0e6' },
        ];
      }

      if (isScenic) {
        return [
          { id: `${district.sectorId ?? district.clusterIndex}-scenic-court-left`, position: [-286, 0.018, baseZ - 118] as [number, number, number], size: [142, 92] as [number, number], color: '#dde5ea' },
          { id: `${district.sectorId ?? district.clusterIndex}-scenic-court-right`, position: [286, 0.018, baseZ - 136] as [number, number, number], size: [142, 92] as [number, number], color: '#dde5ea' },
        ];
      }

      return [];
    });
    return filterReservedSponsorFrontageEntries(entries, boothPlacements, { frontDepth: 420, rearDepth: 160, sideWidth: 220, radius: 300 });
  }, [districtPrograms, boothPlacements]);

  const districtTransitionBands = useMemo(() => {
    return districtPrograms.flatMap((district, districtIndex) => {
      if (districtIndex === 0) {
        return [];
      }

      const currentBaseZ = -196 - (districtIndex * 548);
      const previousBaseZ = -196 - ((districtIndex - 1) * 548);
      const transitionZ = (currentBaseZ + previousBaseZ) * 0.5;
      const isActive = district.expressionMode === 'active-commercial';
      const isCalm = district.expressionMode === 'calm-dwell';

      return [
        {
          id: `${district.sectorId ?? district.clusterIndex}-transition-main`,
          position: [0, 0.02, transitionZ] as [number, number, number],
          size: [208, 34] as [number, number],
          color: isActive ? '#d4dde6' : isCalm ? '#d9e1e7' : '#d7dee4',
        },
        {
          id: `${district.sectorId ?? district.clusterIndex}-transition-left`,
          position: [-236, 0.02, transitionZ + 8] as [number, number, number],
          size: [96, 20] as [number, number],
          color: '#c7d1da',
        },
        {
          id: `${district.sectorId ?? district.clusterIndex}-transition-right`,
          position: [236, 0.02, transitionZ - 8] as [number, number, number],
          size: [96, 20] as [number, number],
          color: '#c7d1da',
        },
      ];
    });
  }, [districtPrograms]);

  const districtTransitionPockets = useMemo(() => {
    return districtPrograms.flatMap((district, districtIndex) => {
      if (districtIndex === 0) {
        return [];
      }

      const currentBaseZ = -196 - (districtIndex * 548);
      const previousBaseZ = -196 - ((districtIndex - 1) * 548);
      const transitionZ = (currentBaseZ + previousBaseZ) * 0.5;
      const isActive = district.expressionMode === 'active-commercial';
      const isCalm = district.expressionMode === 'calm-dwell';
      const isScenic = district.expressionMode === 'scenic' || district.expressionMode === 'feature-court';

      return [
        {
          id: `${district.sectorId ?? district.clusterIndex}-transition-pocket-left`,
          position: [-332, 0.018, transitionZ + 18] as [number, number, number],
          size: [142, isActive ? 88 : isCalm ? 74 : 82] as [number, number],
          color: isActive ? '#d6e0e8' : isCalm ? '#dde6eb' : '#e1e8ec',
        },
        {
          id: `${district.sectorId ?? district.clusterIndex}-transition-pocket-right`,
          position: [332, 0.018, transitionZ - 18] as [number, number, number],
          size: [142, isActive ? 88 : isCalm ? 74 : 82] as [number, number],
          color: isActive ? '#d6e0e8' : isCalm ? '#dde6eb' : '#e1e8ec',
        },
        {
          id: `${district.sectorId ?? district.clusterIndex}-transition-pocket-center`,
          position: [0, 0.019, transitionZ] as [number, number, number],
          size: [118, isScenic ? 54 : 42] as [number, number],
          color: '#eef4f7',
        },
      ];
    });
  }, [districtPrograms]);

  const districtTransitionFrames = useMemo(() => {
    return districtPrograms.flatMap((district, districtIndex) => {
      if (districtIndex === 0) {
        return [];
      }

      const visual = getDistrictVisualProfile(district.sectorId, district.clusterIndex, visualProfile);
      const currentBaseZ = -196 - (districtIndex * 548);
      const previousBaseZ = -196 - ((districtIndex - 1) * 548);
      const transitionZ = (currentBaseZ + previousBaseZ) * 0.5;
      const isActive = district.expressionMode === 'active-commercial';
      const isCalm = district.expressionMode === 'calm-dwell';

      return [
        {
          id: `${district.sectorId ?? district.clusterIndex}-transition-frame-left-post`,
          position: [-404, 20, transitionZ + 10] as [number, number, number],
          size: [16, isActive ? 40 : isCalm ? 30 : 24, 16] as [number, number, number],
          color: '#617581',
          trim: visual.districtGlow,
        },
        {
          id: `${district.sectorId ?? district.clusterIndex}-transition-frame-right-post`,
          position: [404, 20, transitionZ - 10] as [number, number, number],
          size: [16, isActive ? 40 : isCalm ? 30 : 24, 16] as [number, number, number],
          color: '#617581',
          trim: visual.districtGlow,
        },
        {
          id: `${district.sectorId ?? district.clusterIndex}-transition-frame-left-bar`,
          position: [-332, 10, transitionZ + 6] as [number, number, number],
          size: [124, 20, 18] as [number, number, number],
          color: '#8ea0ac',
          trim: visual.shellAccent,
        },
        {
          id: `${district.sectorId ?? district.clusterIndex}-transition-frame-right-bar`,
          position: [332, 10, transitionZ - 6] as [number, number, number],
          size: [124, 20, 18] as [number, number, number],
          color: '#8ea0ac',
          trim: visual.shellAccent,
        },
      ];
    });
  }, [districtPrograms, visualProfile]);

  const cityQuarterBands = useMemo(() => {
    const entries = districtPrograms.flatMap((district, districtIndex) => {
      const visual = getDistrictVisualProfile(district.sectorId, district.clusterIndex, visualProfile);
      const baseZ = -196 - (districtIndex * 548);
      const isActive = district.expressionMode === 'active-commercial';
      const isCalm = district.expressionMode === 'calm-dwell';
      const isScenic = district.expressionMode === 'scenic' || district.expressionMode === 'feature-court';

      const frontColor = isActive ? '#6f8394' : isCalm ? '#7d8f9c' : '#8798a4';
      const rearColor = isActive ? '#8799a7' : isCalm ? '#93a3ad' : '#9dabb4';
      const portalColor = isActive ? '#4a6273' : isCalm ? '#5a707d' : '#647883';

      return [
        {
          id: `${district.sectorId ?? district.clusterIndex}-quarter-band-left-front`,
          position: [-548, 46, baseZ + 122] as [number, number, number],
          size: [188, 92, 206] as [number, number, number],
          color: frontColor,
          trim: visual.districtGlow,
        },
        {
          id: `${district.sectorId ?? district.clusterIndex}-quarter-band-right-front`,
          position: [548, 46, baseZ + 98] as [number, number, number],
          size: [188, 92, 206] as [number, number, number],
          color: frontColor,
          trim: visual.districtGlow,
        },
        {
          id: `${district.sectorId ?? district.clusterIndex}-quarter-band-left-rear`,
          position: [-682, 72, baseZ - 214] as [number, number, number],
          size: [244, 144, 248] as [number, number, number],
          color: rearColor,
          trim: visual.shellAccent,
        },
        {
          id: `${district.sectorId ?? district.clusterIndex}-quarter-band-right-rear`,
          position: [682, 72, baseZ - 238] as [number, number, number],
          size: [244, 144, 248] as [number, number, number],
          color: rearColor,
          trim: visual.shellAccent,
        },
        {
          id: `${district.sectorId ?? district.clusterIndex}-quarter-portal-left`,
          position: [-420, 18, baseZ + 224] as [number, number, number],
          size: [126, 36, 18] as [number, number, number],
          color: portalColor,
          trim: '#eef4f7',
        },
        {
          id: `${district.sectorId ?? district.clusterIndex}-quarter-portal-right`,
          position: [420, 18, baseZ + 204] as [number, number, number],
          size: [126, 36, 18] as [number, number, number],
          color: portalColor,
          trim: '#eef4f7',
        },
        ...(isScenic
          ? [{
              id: `${district.sectorId ?? district.clusterIndex}-quarter-center-pavilion`,
              position: [0, 24, baseZ - 186] as [number, number, number],
              size: [166, 48, 26] as [number, number, number],
              color: '#93a3ad',
              trim: visual.districtGlow,
            }]
          : []),
      ];
    });

    return filterReservedSponsorFrontageEntries(entries, boothPlacements, { frontDepth: 700, rearDepth: 280, sideWidth: 420, radius: 560 });
  }, [districtPrograms, boothPlacements, visualProfile]);

  const avenueQuarterPlazas = useMemo(() => {
    const entries = districtPrograms.flatMap((district, districtIndex) => {
      const baseZ = -196 - (districtIndex * 548);
      const isActive = district.expressionMode === 'active-commercial';
      const isCalm = district.expressionMode === 'calm-dwell';
      const width = isActive ? 182 : isCalm ? 156 : 168;
      const depth = isActive ? 94 : isCalm ? 78 : 86;

      return [
        {
          id: `${district.sectorId ?? district.clusterIndex}-quarter-plaza-left`,
          position: [-412, 0.02, baseZ + 168] as [number, number, number],
          size: [width, depth] as [number, number],
          color: '#dbe4ea',
        },
        {
          id: `${district.sectorId ?? district.clusterIndex}-quarter-plaza-right`,
          position: [412, 0.02, baseZ + 148] as [number, number, number],
          size: [width, depth] as [number, number],
          color: '#dbe4ea',
        },
      ];
    });

    return filterReservedSponsorFrontageEntries(entries, boothPlacements, { frontDepth: 620, rearDepth: 220, sideWidth: 360, radius: 440 });
  }, [districtPrograms, boothPlacements]);

  const boulevardSidePlazas = useMemo(() => {
    const entries = districtPrograms.flatMap((district, districtIndex) => {
      const baseZ = -196 - (districtIndex * 548);
      const isActive = district.expressionMode === 'active-commercial';
      const isCalm = district.expressionMode === 'calm-dwell';

      return [
        {
          id: `${district.sectorId ?? district.clusterIndex}-boulevard-plaza-left-a`,
          position: [-192, 0.018, baseZ + 214] as [number, number, number],
          size: [126, isActive ? 94 : isCalm ? 84 : 88] as [number, number],
          color: '#dce5eb',
        },
        {
          id: `${district.sectorId ?? district.clusterIndex}-boulevard-plaza-right-a`,
          position: [192, 0.018, baseZ + 198] as [number, number, number],
          size: [126, isActive ? 94 : isCalm ? 84 : 88] as [number, number],
          color: '#dce5eb',
        },
        {
          id: `${district.sectorId ?? district.clusterIndex}-boulevard-plaza-left-b`,
          position: [-164, 0.018, baseZ - 214] as [number, number, number],
          size: [112, isActive ? 72 : 66] as [number, number],
          color: '#d7e1e8',
        },
        {
          id: `${district.sectorId ?? district.clusterIndex}-boulevard-plaza-right-b`,
          position: [164, 0.018, baseZ - 228] as [number, number, number],
          size: [112, isActive ? 72 : 66] as [number, number],
          color: '#d7e1e8',
        },
      ];
    });

    return filterReservedSponsorFrontageEntries(entries, boothPlacements, { frontDepth: 460, rearDepth: 220, sideWidth: 180, radius: 240 });
  }, [districtPrograms, boothPlacements]);

  const boulevardMedianPlazas = useMemo(() => {
    return districtPrograms.flatMap((district, districtIndex) => {
      const baseZ = -196 - (districtIndex * 548);
      const isActive = district.expressionMode === 'active-commercial';
      const isCalm = district.expressionMode === 'calm-dwell';

      return [
        {
          id: `${district.sectorId ?? district.clusterIndex}-median-plaza-main`,
          position: [0, 0.022, baseZ + 226] as [number, number, number],
          size: [138, isActive ? 62 : isCalm ? 54 : 58] as [number, number],
          color: '#edf3f7',
        },
        {
          id: `${district.sectorId ?? district.clusterIndex}-median-plaza-rear`,
          position: [0, 0.022, baseZ - 196] as [number, number, number],
          size: [118, isActive ? 48 : 42] as [number, number],
          color: '#e6edf2',
        },
      ];
    });
  }, [districtPrograms]);

  const promenadeEdgeBands = useMemo(() => {
    const entries = districtPrograms.flatMap((district, districtIndex) => {
      const baseZ = -196 - (districtIndex * 548);
      const isActive = district.expressionMode === 'active-commercial';
      const isCalm = district.expressionMode === 'calm-dwell';
      const edgeColor = isActive ? '#253647' : isCalm ? '#32414d' : '#2a3944';
      const capColor = isActive ? '#d8e5ec' : isCalm ? '#d5dfe6' : '#dce5ea';

      return [
        {
          id: `${district.sectorId ?? district.clusterIndex}-edge-left`,
          position: [-128, 4, baseZ - 8] as [number, number, number],
          size: [12, 8, 472] as [number, number, number],
          color: edgeColor,
          cap: capColor,
        },
        {
          id: `${district.sectorId ?? district.clusterIndex}-edge-right`,
          position: [128, 4, baseZ - 8] as [number, number, number],
          size: [12, 8, 472] as [number, number, number],
          color: edgeColor,
          cap: capColor,
        },
        {
          id: `${district.sectorId ?? district.clusterIndex}-edge-left-outer`,
          position: [-156, 2.6, baseZ + 42] as [number, number, number],
          size: [8, 5.2, 182] as [number, number, number],
          color: '#4e616d',
          cap: '#edf3f6',
        },
        {
          id: `${district.sectorId ?? district.clusterIndex}-edge-right-outer`,
          position: [156, 2.6, baseZ + 28] as [number, number, number],
          size: [8, 5.2, 182] as [number, number, number],
          color: '#4e616d',
          cap: '#edf3f6',
        },
      ];
    });
    return filterReservedSponsorFrontageEntries(entries, boothPlacements, { frontDepth: 460, rearDepth: 120, sideWidth: 120, radius: 180 });
  }, [districtPrograms, boothPlacements]);

  const districtThresholdFrames = useMemo(() => {
    const entries = districtPrograms.flatMap((district, districtIndex) => {
      const visual = getDistrictVisualProfile(district.sectorId, district.clusterIndex, visualProfile);
      const baseZ = -196 - (districtIndex * 548);
      const isActive = district.expressionMode === 'active-commercial';
      const isCalm = district.expressionMode === 'calm-dwell';

      return [
        {
          id: `${district.sectorId ?? district.clusterIndex}-threshold-left-post`,
          position: [-172, 15, baseZ + 284] as [number, number, number],
          size: [14, isActive ? 30 : isCalm ? 22 : 18, 14] as [number, number, number],
          color: isActive ? '#22384a' : isCalm ? '#30404d' : '#33424a',
          trim: visual.districtGlow,
        },
        {
          id: `${district.sectorId ?? district.clusterIndex}-threshold-right-post`,
          position: [172, 15, baseZ + 270] as [number, number, number],
          size: [14, isActive ? 30 : isCalm ? 22 : 18, 14] as [number, number, number],
          color: isActive ? '#22384a' : isCalm ? '#30404d' : '#33424a',
          trim: visual.districtGlow,
        },
        {
          id: `${district.sectorId ?? district.clusterIndex}-threshold-left-wall`,
          position: [-238, 6, baseZ + 246] as [number, number, number],
          size: [88, 12, 16] as [number, number, number],
          color: isActive ? '#2a3e52' : isCalm ? '#41535d' : '#4a5961',
          trim: visual.shellAccent,
        },
        {
          id: `${district.sectorId ?? district.clusterIndex}-threshold-right-wall`,
          position: [238, 6, baseZ + 232] as [number, number, number],
          size: [88, 12, 16] as [number, number, number],
          color: isActive ? '#2a3e52' : isCalm ? '#41535d' : '#4a5961',
          trim: visual.shellAccent,
        },
      ];
    });
    return filterReservedSponsorFrontageEntries(entries, boothPlacements, { frontDepth: 260, rearDepth: 120, sideWidth: 180, radius: 240 });
  }, [districtPrograms, boothPlacements, visualProfile]);

  const promenadeMedianMoments = useMemo(() => {
    return districtPrograms.flatMap((district, districtIndex) => {
      const baseZ = -196 - (districtIndex * 548);
      const isActive = district.expressionMode === 'active-commercial';
      const isCalm = district.expressionMode === 'calm-dwell';
      const mainColor = isActive ? '#d5e1e9' : isCalm ? '#dce4e9' : '#e0e7eb';
      const trimColor = isActive ? '#415769' : isCalm ? '#5a6a73' : '#64727a';

      return [
        {
          id: `${district.sectorId ?? district.clusterIndex}-median-main`,
          position: [0, 0.021, baseZ + 148] as [number, number, number],
          size: [72, 18] as [number, number],
          color: mainColor,
        },
        {
          id: `${district.sectorId ?? district.clusterIndex}-median-cross`,
          position: [0, 0.021, baseZ - 14] as [number, number, number],
          size: [48, 14] as [number, number],
          color: mainColor,
        },
        {
          id: `${district.sectorId ?? district.clusterIndex}-median-ring`,
          position: [0, 1.4, baseZ + 148] as [number, number, number],
          radius: isActive ? 10 : isCalm ? 8.5 : 7.5,
          color: trimColor,
          ring: '#eef4f7',
        },
      ];
    });
  }, [districtPrograms]);

  const civicAccentNodes = useMemo(() => {
    const entries = districtPrograms.flatMap((district, districtIndex) => {
      const baseZ = -196 - (districtIndex * 548);
      const isActive = district.expressionMode === 'active-commercial';
      const isCalm = district.expressionMode === 'calm-dwell';
      const isScenic = district.expressionMode === 'scenic' || district.expressionMode === 'feature-court';

      return [
        {
          id: `${district.sectorId ?? district.clusterIndex}-accent-left`,
          position: [-286, 2.4, baseZ + 84] as [number, number, number],
          radius: isActive ? 14 : isCalm ? 12 : 11,
          color: isActive ? '#31465a' : isCalm ? '#455863' : '#51616a',
          ring: isActive ? '#dbe8f0' : '#dde7ec',
        },
        {
          id: `${district.sectorId ?? district.clusterIndex}-accent-right`,
          position: [286, 2.4, baseZ + 72] as [number, number, number],
          radius: isActive ? 14 : isCalm ? 12 : 11,
          color: isActive ? '#31465a' : isCalm ? '#455863' : '#51616a',
          ring: isActive ? '#dbe8f0' : '#dde7ec',
        },
        ...(isScenic
          ? [{
              id: `${district.sectorId ?? district.clusterIndex}-accent-center`,
              position: [0, 2, baseZ - 96] as [number, number, number],
              radius: 16,
              color: '#5d6f77',
              ring: '#e4edf1',
            }]
          : []),
      ];
    });
    return filterReservedSponsorFrontageEntries(entries, boothPlacements, { frontDepth: 360, rearDepth: 160, sideWidth: 220, radius: 260 });
  }, [districtPrograms, boothPlacements]);

  const districtCharacterPromenades = useMemo(() => {
    const entries = districtPrograms.flatMap((district, districtIndex) => {
      const baseZ = -196 - (districtIndex * 548);
      const isActive = district.expressionMode === 'active-commercial';
      const isCalm = district.expressionMode === 'calm-dwell';
      const isScenic = district.expressionMode === 'scenic' || district.expressionMode === 'feature-court';

      if (isActive) {
        return [
          {
            id: `${district.sectorId ?? district.clusterIndex}-active-promenade-left`,
            position: [-248, 0.019, baseZ + 54] as [number, number, number],
            size: [86, 256] as [number, number],
            color: '#d3dde5',
          },
          {
            id: `${district.sectorId ?? district.clusterIndex}-active-promenade-right`,
            position: [248, 0.019, baseZ + 42] as [number, number, number],
            size: [86, 256] as [number, number],
            color: '#d3dde5',
          },
          {
            id: `${district.sectorId ?? district.clusterIndex}-active-court-center`,
            position: [0, 0.02, baseZ - 42] as [number, number, number],
            size: [182, 92] as [number, number],
            color: '#e7eef3',
          },
        ];
      }

      if (isCalm) {
        return [
          {
            id: `${district.sectorId ?? district.clusterIndex}-calm-promenade-left`,
            position: [-222, 0.019, baseZ + 38] as [number, number, number],
            size: [72, 228] as [number, number],
            color: '#dde6ea',
          },
          {
            id: `${district.sectorId ?? district.clusterIndex}-calm-promenade-right`,
            position: [222, 0.019, baseZ + 24] as [number, number, number],
            size: [72, 228] as [number, number],
            color: '#dde6ea',
          },
          {
            id: `${district.sectorId ?? district.clusterIndex}-calm-court-center`,
            position: [0, 0.02, baseZ - 124] as [number, number, number],
            size: [148, 104] as [number, number],
            color: '#eef3f6',
          },
        ];
      }

      if (isScenic) {
        return [
          {
            id: `${district.sectorId ?? district.clusterIndex}-scenic-ribbon-left`,
            position: [-262, 0.019, baseZ - 12] as [number, number, number],
            size: [64, 204] as [number, number],
            color: '#d8e1e7',
          },
          {
            id: `${district.sectorId ?? district.clusterIndex}-scenic-ribbon-right`,
            position: [262, 0.019, baseZ - 28] as [number, number, number],
            size: [64, 204] as [number, number],
            color: '#d8e1e7',
          },
          {
            id: `${district.sectorId ?? district.clusterIndex}-scenic-garden-center`,
            position: [0, 0.018, baseZ - 102] as [number, number, number],
            size: [176, 118] as [number, number],
            color: '#dfe8ec',
          },
        ];
      }

      return [];
    });

    return filterReservedSponsorFrontageEntries(entries, boothPlacements, { frontDepth: 460, rearDepth: 180, sideWidth: 240, radius: 320 });
  }, [districtPrograms, boothPlacements]);

  const districtMonetizationPockets = useMemo(() => {
    const entries = districtPrograms.flatMap((district, districtIndex) => {
      const baseZ = -196 - (districtIndex * 548);
      const isActive = district.expressionMode === 'active-commercial';
      const isCalm = district.expressionMode === 'calm-dwell';
      const isScenic = district.expressionMode === 'scenic' || district.expressionMode === 'feature-court';

      return [
        {
          id: `${district.sectorId ?? district.clusterIndex}-monetization-left`,
          position: [-486, 0.018, baseZ + 132] as [number, number, number],
          size: [isActive ? 164 : 148, isActive ? 112 : isCalm ? 96 : 102] as [number, number],
          color: isActive ? '#d7e1e9' : isCalm ? '#dde6eb' : '#e2eaee',
        },
        {
          id: `${district.sectorId ?? district.clusterIndex}-monetization-right`,
          position: [486, 0.018, baseZ + 114] as [number, number, number],
          size: [isActive ? 164 : 148, isActive ? 112 : isCalm ? 96 : 102] as [number, number],
          color: isActive ? '#d7e1e9' : isCalm ? '#dde6eb' : '#e2eaee',
        },
        ...(isScenic
          ? [{
              id: `${district.sectorId ?? district.clusterIndex}-monetization-center`,
              position: [0, 0.018, baseZ + 186] as [number, number, number],
              size: [124, 58] as [number, number],
              color: '#edf3f6',
            }]
          : []),
      ];
    });

    return filterReservedSponsorFrontageEntries(entries, boothPlacements, { frontDepth: 720, rearDepth: 220, sideWidth: 420, radius: 520 });
  }, [districtPrograms, boothPlacements]);

  const districtMonetizationFrames = useMemo(() => {
    const entries = districtPrograms.flatMap((district, districtIndex) => {
      const visual = getDistrictVisualProfile(district.sectorId, district.clusterIndex, visualProfile);
      const baseZ = -196 - (districtIndex * 548);
      const isActive = district.expressionMode === 'active-commercial';
      const isCalm = district.expressionMode === 'calm-dwell';
      const isScenic = district.expressionMode === 'scenic' || district.expressionMode === 'feature-court';
      const frameColor = isActive ? '#546a7a' : isCalm ? '#687b87' : '#74858f';
      const trimColor = isActive ? visual.districtGlow : visual.shellAccent;

      return [
        {
          id: `${district.sectorId ?? district.clusterIndex}-monetization-left-back`,
          position: [-566, isActive ? 30 : 24, baseZ + 124] as [number, number, number],
          size: [62, isActive ? 60 : 48, 22] as [number, number, number],
          color: frameColor,
          trim: trimColor,
        },
        {
          id: `${district.sectorId ?? district.clusterIndex}-monetization-right-back`,
          position: [566, isActive ? 30 : 24, baseZ + 108] as [number, number, number],
          size: [62, isActive ? 60 : 48, 22] as [number, number, number],
          color: frameColor,
          trim: trimColor,
        },
        {
          id: `${district.sectorId ?? district.clusterIndex}-monetization-left-wing`,
          position: [-514, 10, baseZ + 158] as [number, number, number],
          size: [146, 20, 18] as [number, number, number],
          color: '#8f9faa',
          trim: '#eef4f7',
        },
        {
          id: `${district.sectorId ?? district.clusterIndex}-monetization-right-wing`,
          position: [514, 10, baseZ + 142] as [number, number, number],
          size: [146, 20, 18] as [number, number, number],
          color: '#8f9faa',
          trim: '#eef4f7',
        },
        ...(isCalm || isScenic
          ? [{
              id: `${district.sectorId ?? district.clusterIndex}-monetization-center-bar`,
              position: [0, 8, baseZ + 186] as [number, number, number],
              size: [112, 16, 14] as [number, number, number],
              color: '#9baab3',
              trim: '#eef4f7',
            }]
          : []),
      ];
    });

    return filterReservedSponsorFrontageEntries(entries, boothPlacements, { frontDepth: 760, rearDepth: 220, sideWidth: 460, radius: 560 });
  }, [districtPrograms, boothPlacements, visualProfile]);

  const districtMasses = useMemo(() => {
    const entries = districtPrograms.flatMap((district, districtIndex) => {
      const visual = getDistrictVisualProfile(district.sectorId, district.clusterIndex, visualProfile);
      const districtStride = 548;
      const baseZ = -196 - (districtIndex * districtStride);
      const districtDepth = Math.max(420, Math.min(760, district.depth + 180));
      const edgeX = district.expressionMode === 'active-commercial' ? 382 : district.expressionMode === 'calm-dwell' ? 334 : 408;
      const frontageDepth = district.expressionMode === 'active-commercial' ? 62 : district.expressionMode === 'calm-dwell' ? 52 : 46;
      const frontageHeight = district.expressionMode === 'active-commercial' ? 56 : district.expressionMode === 'calm-dwell' ? 36 : 30;
      const frontageWidth = district.expressionMode === 'active-commercial' ? 86 : district.expressionMode === 'calm-dwell' ? 68 : 58;
      const midDepth = frontageDepth + 10;
      const midHeight = district.expressionMode === 'active-commercial' ? 82 : district.expressionMode === 'calm-dwell' ? 48 : 40;
      const rearDepth = frontageDepth + 16;
      const rearHeight = district.expressionMode === 'active-commercial' ? 124 : district.expressionMode === 'calm-dwell' ? 72 : 60;
      const outerDepth = frontageDepth + 20;
      const outerHeight = district.expressionMode === 'active-commercial' ? 72 : district.expressionMode === 'calm-dwell' ? 42 : 34;
      const wingHeight = district.expressionMode === 'active-commercial' ? 22 : 14;
      const centerHeight = district.expressionMode === 'active-commercial' ? 32 : district.expressionMode === 'feature-court' ? 24 : 18;
      const sideOffsets = [-1, 1];

      const masses = sideOffsets.flatMap((side, sideIndex) => {
        const frontageX = edgeX * side;
        const outerX = (edgeX + 112) * side;
        const frontId = `${district.sectorId ?? district.clusterIndex}-front-${sideIndex}`;
        const midId = `${district.sectorId ?? district.clusterIndex}-mid-${sideIndex}`;
        const rearId = `${district.sectorId ?? district.clusterIndex}-rear-${sideIndex}`;
        const outerId = `${district.sectorId ?? district.clusterIndex}-outer-${sideIndex}`;
        const wingId = `${district.sectorId ?? district.clusterIndex}-wing-${sideIndex}`;

        return [
          {
            id: frontId,
            position: [frontageX, frontageHeight * 0.5, baseZ + 42] as [number, number, number],
            size: [frontageWidth, frontageHeight, frontageDepth] as [number, number, number],
            color: visual.shellBase,
            emissive: visual.shellAccent,
            emissiveIntensity: district.expressionMode === 'active-commercial' ? 0.02 : 0.008,
            trim: visual.shellAccent,
          },
          {
            id: midId,
            position: [frontageX - (side * 26), midHeight * 0.5, baseZ - (districtDepth * 0.14)] as [number, number, number],
            size: [Math.max(18, frontageWidth - 6), midHeight, midDepth] as [number, number, number],
            color: district.expressionMode === 'scenic' ? '#4a5d6b' : '#465867',
            emissive: visual.districtGlow,
            emissiveIntensity: district.expressionMode === 'active-commercial' ? 0.012 : 0.006,
            trim: visual.groundAccent,
          },
          {
            id: rearId,
            position: [outerX, rearHeight * 0.5, baseZ - (districtDepth * 0.44)] as [number, number, number],
            size: [Math.max(16, frontageWidth - 10), rearHeight, rearDepth] as [number, number, number],
            color: district.expressionMode === 'scenic' ? '#586a77' : '#546572',
            emissive: visual.districtGlow,
            emissiveIntensity: district.expressionMode === 'active-commercial' ? 0.014 : 0.006,
            trim: visual.groundAccent,
          },
          {
            id: outerId,
            position: [frontageX + (side * 68), outerHeight * 0.5, baseZ - (districtDepth * 0.06)] as [number, number, number],
            size: [24, outerHeight, outerDepth] as [number, number, number],
            color: '#627483',
            emissive: visual.shellAccent,
            emissiveIntensity: 0.004,
            trim: visual.groundAccent,
          },
          {
            id: wingId,
            position: [frontageX - (side * 52), wingHeight * 0.5, baseZ + 66] as [number, number, number],
            size: [38, wingHeight, 28] as [number, number, number],
            color: '#6d7f8d',
            emissive: visual.shellAccent,
            emissiveIntensity: 0.003,
            trim: visual.groundAccent,
          },
        ];
      });

      const centerMoments = [
        {
          id: `${district.sectorId ?? district.clusterIndex}-center-rear`,
          position: [0, centerHeight * 0.5, baseZ - (districtDepth * 0.28)] as [number, number, number],
          size: [
            district.expressionMode === 'active-commercial' ? 126 : district.expressionMode === 'calm-dwell' ? 84 : 64,
            centerHeight,
            district.expressionMode === 'active-commercial' ? 26 : 16,
          ] as [number, number, number],
          color: district.expressionMode === 'active-commercial' ? '#5c7282' : '#657985',
          emissive: visual.districtGlow,
          emissiveIntensity: district.expressionMode === 'active-commercial' ? 0.008 : 0.004,
          trim: visual.shellAccent,
        },
        ...(district.expressionMode === 'scenic' || district.expressionMode === 'feature-court'
          ? [{
              id: `${district.sectorId ?? district.clusterIndex}-center-frame`,
              position: [0, 18, baseZ - 42] as [number, number, number],
              size: [44, 36, 10] as [number, number, number],
              color: '#657984',
              emissive: visual.districtGlow,
              emissiveIntensity: 0.006,
              trim: visual.shellAccent,
            }]
          : []),
      ];

      return [...masses, ...centerMoments];
    });
    return filterReservedSponsorFrontageEntries(entries, boothPlacements, { frontDepth: 560, rearDepth: 240, sideWidth: 320, radius: 420 });
  }, [districtPrograms, boothPlacements, visualProfile]);

  const cityStitchMasses = useMemo(() => {
    if (districtPrograms.length === 0) {
      return [];
    }

    const farBackZ = -196 - ((districtPrograms.length - 1) * 548) - 380;
    const leftWallX = -648;
    const rightWallX = 648;

    return [
      {
        id: 'city-left-wall',
        position: [leftWallX, 68, farBackZ + 420] as [number, number, number],
        size: [64, 136, 1080] as [number, number, number],
        color: '#526474',
      },
      {
        id: 'city-right-wall',
        position: [rightWallX, 68, farBackZ + 420] as [number, number, number],
        size: [64, 136, 1080] as [number, number, number],
        color: '#526474',
      },
      {
        id: 'city-back-wall-left',
        position: [-388, 58, farBackZ] as [number, number, number],
        size: [204, 116, 42] as [number, number, number],
        color: '#8ea0ae',
      },
      {
        id: 'city-back-wall-right',
        position: [388, 58, farBackZ] as [number, number, number],
        size: [204, 116, 42] as [number, number, number],
        color: '#8ea0ae',
      },
      {
        id: 'city-back-wall-gate-left',
        position: [-154, 42, farBackZ + 12] as [number, number, number],
        size: [76, 84, 32] as [number, number, number],
        color: '#97a8b5',
      },
      {
        id: 'city-back-wall-gate-right',
        position: [154, 42, farBackZ + 12] as [number, number, number],
        size: [76, 84, 32] as [number, number, number],
        color: '#97a8b5',
      },
      {
        id: 'city-back-wall-upper-left',
        position: [-404, 112, farBackZ - 124] as [number, number, number],
        size: [344, 164, 56] as [number, number, number],
        color: '#a1b2be',
      },
      {
        id: 'city-back-wall-upper-right',
        position: [404, 112, farBackZ - 124] as [number, number, number],
        size: [344, 164, 56] as [number, number, number],
        color: '#a1b2be',
      },
      {
        id: 'city-back-wall-upper-bridge',
        position: [0, 178, farBackZ - 132] as [number, number, number],
        size: [184, 42, 48] as [number, number, number],
        color: '#a7b7c2',
      },
      {
        id: 'city-back-wall-left-deep',
        position: [-972, 84, farBackZ - 88] as [number, number, number],
        size: [188, 168, 324] as [number, number, number],
        color: '#8ea0ad',
      },
      {
        id: 'city-back-wall-right-deep',
        position: [972, 84, farBackZ - 88] as [number, number, number],
        size: [188, 168, 324] as [number, number, number],
        color: '#8ea0ad',
      },
      {
        id: 'city-back-wall-left-tower',
        position: [-1264, 132, farBackZ - 164] as [number, number, number],
        size: [96, 264, 112] as [number, number, number],
        color: '#9aabb8',
      },
      {
        id: 'city-back-wall-right-tower',
        position: [1264, 132, farBackZ - 164] as [number, number, number],
        size: [96, 264, 112] as [number, number, number],
        color: '#9aabb8',
      },
    ];
  }, [districtPrograms.length]);

  const deepBackdropMasses = useMemo(() => {
    return districtPrograms.flatMap((district, districtIndex) => {
      const visual = getDistrictVisualProfile(district.sectorId, district.clusterIndex, visualProfile);
      const baseZ = -196 - (districtIndex * 548);
      const isActive = district.expressionMode === 'active-commercial';
      const isCalm = district.expressionMode === 'calm-dwell';
      const leftBaseX = -1090;
      const rightBaseX = 1090;
      const leftDepthX = -1380;
      const rightDepthX = 1380;

      return [
        {
          id: `${district.sectorId ?? district.clusterIndex}-deep-left-a`,
          position: [leftBaseX, isActive ? 118 : isCalm ? 84 : 72, baseZ - 118] as [number, number, number],
          size: [142, isActive ? 236 : isCalm ? 168 : 144, 164] as [number, number, number],
          color: '#8d9fab',
          trim: visual.districtGlow,
        },
        {
          id: `${district.sectorId ?? district.clusterIndex}-deep-right-a`,
          position: [rightBaseX, isActive ? 112 : isCalm ? 82 : 70, baseZ - 154] as [number, number, number],
          size: [148, isActive ? 224 : isCalm ? 164 : 140, 176] as [number, number, number],
          color: '#8d9fab',
          trim: visual.districtGlow,
        },
        {
          id: `${district.sectorId ?? district.clusterIndex}-deep-left-mid`,
          position: [-1620, isActive ? 138 : isCalm ? 102 : 88, baseZ - 204] as [number, number, number],
          size: [188, isActive ? 276 : isCalm ? 204 : 176, 208] as [number, number, number],
          color: '#93a4b0',
          trim: visual.districtGlow,
        },
        {
          id: `${district.sectorId ?? district.clusterIndex}-deep-right-mid`,
          position: [1620, isActive ? 132 : isCalm ? 98 : 84, baseZ - 238] as [number, number, number],
          size: [194, isActive ? 264 : isCalm ? 196 : 168, 218] as [number, number, number],
          color: '#93a4b0',
          trim: visual.districtGlow,
        },
        {
          id: `${district.sectorId ?? district.clusterIndex}-deep-left-b`,
          position: [leftDepthX, isActive ? 154 : isCalm ? 106 : 88, baseZ - 332] as [number, number, number],
          size: [126, isActive ? 308 : isCalm ? 212 : 176, 138] as [number, number, number],
          color: '#a0b1bd',
          trim: visual.shellAccent,
        },
        {
          id: `${district.sectorId ?? district.clusterIndex}-deep-right-b`,
          position: [rightDepthX, isActive ? 148 : isCalm ? 104 : 86, baseZ - 356] as [number, number, number],
          size: [132, isActive ? 296 : isCalm ? 208 : 172, 146] as [number, number, number],
          color: '#a0b1bd',
          trim: visual.shellAccent,
        },
        {
          id: `${district.sectorId ?? district.clusterIndex}-deep-left-c`,
          position: [-1960, isActive ? 182 : isCalm ? 134 : 118, baseZ - 468] as [number, number, number],
          size: [164, isActive ? 364 : isCalm ? 268 : 236, 172] as [number, number, number],
          color: '#aab8c2',
          trim: visual.shellAccent,
        },
        {
          id: `${district.sectorId ?? district.clusterIndex}-deep-right-c`,
          position: [1960, isActive ? 176 : isCalm ? 128 : 114, baseZ - 492] as [number, number, number],
          size: [170, isActive ? 352 : isCalm ? 256 : 228, 180] as [number, number, number],
          color: '#aab8c2',
          trim: visual.shellAccent,
        },
      ];
    });
  }, [districtPrograms, visualProfile]);

  const parkMoments = useMemo(() => {
    return [] as Array<{
      color: string;
      hasTrees: boolean;
      id: string;
      pathColor: string;
      position: [number, number, number];
      ringColor: string;
      size: [number, number];
    }>;
  }, []);

  const districtTowerClusters = useMemo(() => {
    const entries = districtPrograms.flatMap((district, districtIndex) => {
      const visual = getDistrictVisualProfile(district.sectorId, district.clusterIndex, visualProfile);
      const baseZ = -196 - (districtIndex * 548);
      const isActive = district.expressionMode === 'active-commercial';
      const isCalm = district.expressionMode === 'calm-dwell';
      const isScenic = district.expressionMode === 'scenic' || district.expressionMode === 'feature-court';
      const towerPalette = isActive
        ? { hero: '#5a7080', mid: '#647887', support: '#728391' }
        : isCalm
          ? { hero: '#657987', mid: '#718391', support: '#81919d' }
          : { hero: '#5f7281', mid: '#6f808d', support: '#7d8c97' };
      const heroHeight = isActive ? 228 : isCalm ? 154 : 184;
      const midHeight = isActive ? 168 : isCalm ? 118 : 138;
      const supportHeight = isActive ? 102 : isCalm ? 74 : 88;
      const rearSupportHeight = isActive ? 132 : isCalm ? 94 : 108;

      return [-1, 1].flatMap((side) => {
        const sideRotationBias = side < 0 ? -1 : 1;
        return [
          {
            id: `${district.sectorId ?? district.clusterIndex}-tower-hero-${side}`,
            position: [side * 446, heroHeight * 0.5, baseZ - 318] as [number, number, number],
            size: [isActive ? 42 : 36, heroHeight, isActive ? 30 : 26] as [number, number, number],
            color: towerPalette.hero,
            emissive: visual.districtGlow,
            emissiveIntensity: isActive ? 0.016 : 0.008,
            crownColor: isScenic ? visual.shellAccent : visual.groundAccent,
            towerRole: 'hero' as const,
            screenReady: true,
            silhouetteBias: sideRotationBias,
          },
          {
            id: `${district.sectorId ?? district.clusterIndex}-tower-mid-front-${side}`,
            position: [side * 286, midHeight * 0.5, baseZ - 132] as [number, number, number],
            size: [isActive ? 28 : 24, midHeight, isActive ? 22 : 18] as [number, number, number],
            color: towerPalette.mid,
            emissive: visual.districtGlow,
            emissiveIntensity: isActive ? 0.012 : 0.006,
            crownColor: visual.groundAccent,
            towerRole: 'mid' as const,
            screenReady: true,
            silhouetteBias: sideRotationBias,
          },
          {
            id: `${district.sectorId ?? district.clusterIndex}-tower-mid-rear-${side}`,
            position: [side * 612, midHeight * 0.5, baseZ - 564] as [number, number, number],
            size: [isActive ? 30 : 26, midHeight + (isActive ? 18 : 12), isActive ? 24 : 20] as [number, number, number],
            color: towerPalette.mid,
            emissive: visual.districtGlow,
            emissiveIntensity: isActive ? 0.012 : 0.006,
            crownColor: visual.groundAccent,
            towerRole: 'mid' as const,
            screenReady: true,
            silhouetteBias: sideRotationBias,
          },
          {
            id: `${district.sectorId ?? district.clusterIndex}-tower-support-front-${side}`,
            position: [side * 196, supportHeight * 0.5, baseZ + 42] as [number, number, number],
            size: [isActive ? 18 : 16, supportHeight, isActive ? 16 : 14] as [number, number, number],
            color: towerPalette.support,
            emissive: visual.districtGlow,
            emissiveIntensity: isActive ? 0.006 : 0.003,
            crownColor: visual.shellAccent,
            towerRole: 'support' as const,
            screenReady: false,
            silhouetteBias: sideRotationBias,
          },
          {
            id: `${district.sectorId ?? district.clusterIndex}-tower-support-rear-${side}`,
            position: [side * 782, rearSupportHeight * 0.5, baseZ - 742] as [number, number, number],
            size: [isActive ? 22 : 18, rearSupportHeight, isActive ? 18 : 16] as [number, number, number],
            color: towerPalette.support,
            emissive: visual.districtGlow,
            emissiveIntensity: isActive ? 0.006 : 0.003,
            crownColor: visual.shellAccent,
            towerRole: 'support' as const,
            screenReady: false,
            silhouetteBias: sideRotationBias,
          },
        ];
      });
    });
    return filterReservedSponsorFrontageEntries(entries, boothPlacements, { frontDepth: 680, rearDepth: 320, sideWidth: 380, radius: 520 });
  }, [districtPrograms, boothPlacements, visualProfile]);

  const visibleDeepBackdropMasses = useMemo(
    () => (EXPO_FEATURE_FLAGS.enableShowcaseSkylineDensity ? deepBackdropMasses : deepBackdropMasses.filter((_, index) => index % 2 === 0)),
    [deepBackdropMasses]
  );

  const visibleDistrictTowerClusters = useMemo(
    () => (EXPO_FEATURE_FLAGS.enableShowcaseSkylineDensity ? districtTowerClusters : districtTowerClusters.filter((_, index) => index % 2 === 0)),
    [districtTowerClusters]
  );
  const enableLegacyClutterLayers = false;

    return (
      <group name="expo-city-foreground">
        {cityStreetMoments.filter((street) => !overlapsStadiumReserve(street.position, stadiumReserve, street.size)).map((street) => (
          <mesh key={street.id} position={street.position} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
            <planeGeometry args={street.size} />
            <meshStandardMaterial color={street.color} roughness={0.82} metalness={0.05} />
          </mesh>
      ))}
      {cityBranchMoments.filter((branch) => !overlapsStadiumReserve(branch.position, stadiumReserve, branch.size)).map((branch) => (
        <mesh key={branch.id} position={branch.position} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={branch.size} />
          <meshStandardMaterial color={branch.color} roughness={0.76} metalness={0.04} />
        </mesh>
      ))}
      {districtCharacterCourts.filter((court) => !overlapsStadiumReserve(court.position, stadiumReserve, court.size)).map((court) => (
        <mesh key={court.id} position={court.position} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={court.size} />
          <meshStandardMaterial color={court.color} roughness={0.72} metalness={0.04} />
        </mesh>
      ))}
      {avenueQuarterPlazas.filter((plaza) => !overlapsStadiumReserve(plaza.position, stadiumReserve, plaza.size)).map((plaza) => (
        <mesh key={plaza.id} position={plaza.position} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={plaza.size} />
          <meshStandardMaterial color={plaza.color} roughness={0.68} metalness={0.04} />
        </mesh>
      ))}
      {boulevardSidePlazas.filter((plaza) => !overlapsStadiumReserve(plaza.position, stadiumReserve, plaza.size)).map((plaza) => (
        <mesh key={plaza.id} position={plaza.position} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={plaza.size} />
          <meshStandardMaterial color={plaza.color} roughness={0.7} metalness={0.04} />
        </mesh>
      ))}
      {boulevardMedianPlazas.filter((plaza) => !overlapsStadiumReserve(plaza.position, stadiumReserve, plaza.size)).map((plaza) => (
        <mesh key={plaza.id} position={plaza.position} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={plaza.size} />
          <meshStandardMaterial color={plaza.color} roughness={0.66} metalness={0.06} />
        </mesh>
      ))}
      {districtCharacterPromenades.filter((plaza) => !overlapsStadiumReserve(plaza.position, stadiumReserve, plaza.size)).map((plaza) => (
        <mesh key={plaza.id} position={plaza.position} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={plaza.size} />
          <meshStandardMaterial color={plaza.color} roughness={0.68} metalness={0.04} />
        </mesh>
      ))}
      {districtMonetizationPockets.filter((plaza) => !overlapsStadiumReserve(plaza.position, stadiumReserve, plaza.size)).map((plaza) => (
        <mesh key={plaza.id} position={plaza.position} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={plaza.size} />
          <meshStandardMaterial color={plaza.color} roughness={0.64} metalness={0.06} />
        </mesh>
      ))}
      {districtTransitionPockets.filter((plaza) => !overlapsStadiumReserve(plaza.position, stadiumReserve, plaza.size)).map((plaza) => (
        <mesh key={plaza.id} position={plaza.position} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={plaza.size} />
          <meshStandardMaterial color={plaza.color} roughness={0.66} metalness={0.04} />
        </mesh>
      ))}
      {districtTransitionBands.filter((band) => !overlapsStadiumReserve(band.position, stadiumReserve, band.size)).map((band) => (
        <mesh key={band.id} position={band.position} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={band.size} />
          <meshStandardMaterial color={band.color} roughness={0.7} metalness={0.05} />
        </mesh>
      ))}
      {[...districtMasses, ...visibleDeepBackdropMasses]
        .filter((mass) => !overlapsStadiumReserve(mass.position, stadiumReserve, mass.size))
        .map((mass) => (
        <group key={mass.id} position={mass.position}>
          {(() => {
            const enrichedMass = mass as typeof mass & { emissive?: string; emissiveIntensity?: number; trim?: string };
            return (
          <mesh castShadow={enableHeavyShadows} receiveShadow>
            <boxGeometry args={mass.size} />
            <ExpoArchitecturalMassMaterial
              fallbackColor={mass.color}
              repeat={[Math.max(1.2, mass.size[0] / 180), Math.max(1.2, mass.size[2] / 180)]}
              emissive={typeof enrichedMass.emissive === 'string' ? enrichedMass.emissive : '#000000'}
              emissiveIntensity={typeof enrichedMass.emissiveIntensity === 'number' ? enrichedMass.emissiveIntensity : 0}
            />
          </mesh>
            );
          })()}
          {'trim' in mass && (
            <mesh position={[0, mass.size[1] * 0.5 + 0.18, 0]} castShadow={enableHeavyShadows}>
              <boxGeometry args={[Math.max(4, mass.size[0] * 0.72), 0.22, Math.max(3, mass.size[2] * 0.74)]} />
              <meshStandardMaterial color={typeof (mass as { trim?: string }).trim === 'string' ? (mass as { trim?: string }).trim : '#d7e2ea'} metalness={0.18} roughness={0.58} />
            </mesh>
          )}
        </group>
      ))}
      {enableLegacyClutterLayers && [...districtCharacterMasses, ...cityQuarterBands, ...promenadeEdgeBands, ...districtThresholdFrames, ...districtTransitionFrames, ...districtMonetizationFrames, ...cityStitchMasses]
        .filter((mass) => !overlapsStadiumReserve(mass.position, stadiumReserve, mass.size))
        .map((mass) => (
        <group key={mass.id} position={mass.position}>
          {(() => {
            const enrichedMass = mass as typeof mass & { emissive?: string; emissiveIntensity?: number; trim?: string };
            return (
          <mesh castShadow={enableHeavyShadows} receiveShadow>
            <boxGeometry args={mass.size} />
            <ExpoArchitecturalMassMaterial
              fallbackColor={mass.color}
              repeat={[Math.max(1.2, mass.size[0] / 180), Math.max(1.2, mass.size[2] / 180)]}
              emissive={typeof enrichedMass.emissive === 'string' ? enrichedMass.emissive : '#000000'}
              emissiveIntensity={typeof enrichedMass.emissiveIntensity === 'number' ? enrichedMass.emissiveIntensity : 0}
            />
          </mesh>
            );
          })()}
          {'trim' in mass && (
            <mesh position={[0, mass.size[1] * 0.5 + 0.18, 0]} castShadow={enableHeavyShadows}>
              <boxGeometry args={[Math.max(4, mass.size[0] * 0.72), 0.22, Math.max(3, mass.size[2] * 0.74)]} />
              <meshStandardMaterial color={typeof (mass as { trim?: string }).trim === 'string' ? (mass as { trim?: string }).trim : '#d7e2ea'} metalness={0.18} roughness={0.58} />
            </mesh>
          )}
        </group>
      ))}
      {visibleDistrictTowerClusters.filter((tower) => !overlapsStadiumReserve(tower.position, stadiumReserve, tower.size)).map((tower) => (
        <group key={tower.id} position={tower.position}>
          {(() => {
            const enrichedTower = tower as typeof tower & {
              towerRole?: 'hero' | 'mid' | 'support';
              screenReady?: boolean;
              silhouetteBias?: number;
            };
            const towerRole = enrichedTower.towerRole ?? 'support';
            const silhouetteBias = enrichedTower.silhouetteBias ?? 1;
            const upperHeight = towerRole === 'hero' ? tower.size[1] * 0.28 : towerRole === 'mid' ? tower.size[1] * 0.22 : tower.size[1] * 0.16;
            const upperWidth = towerRole === 'hero' ? tower.size[0] * 0.68 : towerRole === 'mid' ? tower.size[0] * 0.76 : tower.size[0] * 0.84;
            const upperDepth = towerRole === 'hero' ? tower.size[2] * 0.68 : towerRole === 'mid' ? tower.size[2] * 0.76 : tower.size[2] * 0.84;
            const beaconHeight = towerRole === 'hero' ? 18 : towerRole === 'mid' ? 10 : 0;

            return (
              <>
          <mesh castShadow={enableHeavyShadows} receiveShadow>
            <boxGeometry args={tower.size} />
            <ExpoArchitecturalMassMaterial
              fallbackColor={tower.color}
              repeat={[Math.max(1.2, tower.size[0] / 120), Math.max(1.2, tower.size[2] / 120)]}
              emissive={tower.emissive}
              emissiveIntensity={tower.emissiveIntensity}
            />
          </mesh>
          <mesh position={[silhouetteBias * tower.size[0] * 0.08, tower.size[1] * 0.18, 0]} castShadow={enableHeavyShadows} receiveShadow>
            <boxGeometry args={[upperWidth, upperHeight, upperDepth]} />
            <ExpoArchitecturalMassMaterial
              fallbackColor={towerRole === 'hero' ? '#8ea3b3' : towerRole === 'mid' ? '#90a1ad' : '#93a4af'}
              emissive={tower.emissive}
              emissiveIntensity={towerRole === 'hero' ? 0.008 : 0.004}
            />
          </mesh>
          {towerRole === 'hero' && (
            <mesh position={[-silhouetteBias * tower.size[0] * 0.12, tower.size[1] * 0.34, 0]} castShadow={enableHeavyShadows} receiveShadow>
              <boxGeometry args={[tower.size[0] * 0.44, tower.size[1] * 0.14, tower.size[2] * 0.44]} />
              <ExpoArchitecturalMassMaterial fallbackColor="#d7e2ea" emissive={tower.emissive} emissiveIntensity={0.01} />
            </mesh>
          )}
          <mesh position={[0, (tower.size[1] * 0.5) + 0.8, 0]} castShadow={enableHeavyShadows}>
            <boxGeometry args={[tower.size[0] * (towerRole === 'support' ? 0.78 : 0.64), towerRole === 'hero' ? 1.8 : 1.2, tower.size[2] * (towerRole === 'support' ? 0.78 : 0.64)]} />
            <meshStandardMaterial color={tower.crownColor} metalness={0.12} roughness={0.52} />
          </mesh>
          {beaconHeight > 0 && (
            <mesh position={[0, (tower.size[1] * 0.5) + beaconHeight * 0.5 + 2.4, 0]} castShadow={enableHeavyShadows}>
              <boxGeometry args={[tower.size[0] * 0.14, beaconHeight, tower.size[2] * 0.14]} />
              <meshStandardMaterial color={tower.crownColor} emissive={tower.crownColor} emissiveIntensity={0.12} metalness={0.18} roughness={0.42} />
            </mesh>
          )}
              </>
            );
          })()}
        </group>
      ))}
      {civicTreeRows.filter((tree) => !isInsideStadiumReserve(tree.position, stadiumReserve)).map((tree) => (
        <group key={tree.id} position={tree.position}>
          <mesh position={[0, 4.6, 0]} castShadow>
            <cylinderGeometry args={[0.42, 0.58, 9.2, 8]} />
            <meshStandardMaterial color="#46525c" roughness={0.94} />
          </mesh>
          <mesh position={[0, 10.6, 0]} castShadow>
            <sphereGeometry args={[3.1, 12, 10]} />
            <meshStandardMaterial color="#708676" roughness={0.95} />
          </mesh>
        </group>
      ))}
      {civicAccentNodes.filter((node) => !overlapsStadiumReserve(node.position, stadiumReserve, node.radius)).map((node) => (
        <group key={node.id} position={node.position}>
          <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
            <cylinderGeometry args={[node.radius, node.radius, 1.2, 28]} />
            <meshStandardMaterial color={node.color} roughness={0.64} metalness={0.08} />
          </mesh>
          <mesh position={[0, 0.38, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[node.radius * 0.62, node.radius * 0.88, 28]} />
            <meshStandardMaterial color={node.ring} roughness={0.42} metalness={0.16} />
          </mesh>
        </group>
      ))}
      {promenadeMedianMoments.filter((node) => !overlapsStadiumReserve(node.position, stadiumReserve, 'radius' in node ? node.radius : node.size)).map((node) => (
        'radius' in node ? (
          <group key={node.id} position={node.position}>
            <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
              <cylinderGeometry args={[node.radius ?? 1, node.radius ?? 1, 0.9, 28]} />
              <meshStandardMaterial color={node.color} roughness={0.66} metalness={0.08} />
            </mesh>
            <mesh position={[0, 0.28, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[(node.radius ?? 1) * 0.58, (node.radius ?? 1) * 0.86, 28]} />
              <meshStandardMaterial color={node.ring} roughness={0.42} metalness={0.16} />
            </mesh>
          </group>
        ) : (
          <mesh key={node.id} position={node.position} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
            <planeGeometry args={node.size} />
            <meshStandardMaterial color={node.color} roughness={0.78} metalness={0.04} />
          </mesh>
        )
      ))}
      {parkMoments.filter((park) => !overlapsStadiumReserve(park.position, stadiumReserve, park.size)).map((park) => (
        <group key={park.id} position={park.position}>
          <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
            <planeGeometry args={park.size} />
            <meshStandardMaterial color={park.color} roughness={0.96} metalness={0.01} />
          </mesh>
          <mesh position={[0, 0.015, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
            <planeGeometry args={[park.size[0] * 0.26, park.size[1] * 0.82]} />
            <meshStandardMaterial color={park.pathColor} roughness={0.84} metalness={0.02} />
          </mesh>
          <mesh position={[0, 0.024, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[Math.max(5, park.size[0] * 0.12), Math.max(7.5, park.size[0] * 0.18), 28]} />
            <meshStandardMaterial color={park.ringColor} roughness={0.78} metalness={0.08} />
          </mesh>
          {park.hasTrees && (
            <>
              {[-1, 1].map((side) => (
                <group key={`${park.id}-tree-${side}`} position={[side * (park.size[0] * 0.24), 0, side > 0 ? 4 : -4]}>
                  <mesh position={[0, 4.2, 0]} castShadow>
                    <cylinderGeometry args={[0.45, 0.65, 8.4, 8]} />
                    <meshStandardMaterial color="#4a5560" roughness={0.92} />
                  </mesh>
                  <mesh position={[0, 9.8, 0]} castShadow>
                    <sphereGeometry args={[3.4, 14, 12]} />
                    <meshStandardMaterial color="#6f8773" roughness={0.94} />
                  </mesh>
                </group>
              ))}
            </>
          )}
        </group>
      ))}
    </group>
  );
}

void ExpoCityForeground;

export function CleanExpoCitySkeleton({
  boothPlacements,
  districtPrograms,
  visualProfile,
}: {
  boothPlacements: ExpoBoothPlacement[];
  districtPrograms: ExpoDistrictProgramSummary[];
  visualProfile: ExpoWorldVisualProfile;
}) {
  return <WorldCitySkeleton boothPlacements={boothPlacements} districtPrograms={districtPrograms} visualProfile={visualProfile} />;
}

export function ExpoRearCampus({
  boothPlacements,
  visualProfile,
}: {
  boothPlacements: ExpoBoothPlacement[];
  visualProfile: ExpoWorldVisualProfile;
}) {
  return <RuntimeExpoRearCampus boothPlacements={boothPlacements} visualProfile={visualProfile} />;
}

function SpawnDebugOverlay({
  playBounds,
  startView,
  walkRegions,
}: {
  playBounds: ExpoPlayBounds;
  startView: ExpoStartView;
  walkRegions: ExpoWalkRegion[];
}) {
  return (
    <group name="expo-spatial-debug-overlay">
      {EXPO_SPATIAL_DEBUG_FLAGS.showWalkCorridor && (
        <>
          {walkRegions.map((region) => (
            <mesh
              key={region.id}
              position={[(region.minX + region.maxX) * 0.5, 0.02, (region.minZ + region.maxZ) * 0.5]}
              rotation={[-Math.PI / 2, 0, 0]}
            >
              <planeGeometry args={[region.maxX - region.minX, region.maxZ - region.minZ]} />
                <meshBasicMaterial
                  color={
                    region.type === 'arrival'
                      ? '#38bdf8'
                      : region.type === 'spine'
                        ? '#22c55e'
                        : region.type === 'promenade'
                          ? '#f97316'
                          : '#eab308'
                  }
                  transparent
                  opacity={region.type === 'booth-pocket' ? 0.09 : region.type === 'promenade' ? 0.1 : 0.14}
                  depthWrite={false}
                  toneMapped={false}
                />
              </mesh>
          ))}
          <mesh position={[0, 0.025, (playBounds.minZ + playBounds.maxZ) * 0.5]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[playBounds.maxX - playBounds.minX, playBounds.maxZ - playBounds.minZ]} />
            <meshBasicMaterial color="#ef4444" transparent opacity={0.04} depthWrite={false} toneMapped={false} />
          </mesh>
        </>
      )}
      {EXPO_SPATIAL_DEBUG_FLAGS.showSpawnMarkers && (
        <>
          <mesh position={[startView.position[0], 0.3, startView.position[2]]}>
            <cylinderGeometry args={[0.55, 0.55, 0.6, 18]} />
            <meshBasicMaterial color="#f97316" toneMapped={false} />
          </mesh>
          <mesh position={startView.lookAt}>
            <sphereGeometry args={[0.9, 18, 18]} />
            <meshBasicMaterial color="#22d3ee" toneMapped={false} />
          </mesh>
          <Text position={[startView.position[0], 2, startView.position[2]]} fontSize={0.9} color="#f8fafc" anchorX="center" anchorY="middle">
            SPAWN
          </Text>
          <Text position={[startView.lookAt[0], startView.lookAt[1] + 2.2, startView.lookAt[2]]} fontSize={0.72} color="#f8fafc" anchorX="center" anchorY="middle">
            START TARGET
          </Text>
        </>
      )}
    </group>
  );
}

/* Legacy city collision layer is quarantined from the release path.
function CityCollisionLayer({ debug = false }: { debug?: boolean }) {
  const { scene } = useThree();
  const collisionRootRef = useRef<THREE.Group>(null);
  const [summary, setSummary] = useState<CityCollisionSummary | null>(
    () => ((scene.userData[CITY_COLLISION_SUMMARY_KEY] as CityCollisionSummary | null) ?? null)
  );
  const summaryRef = useRef<CityCollisionSummary | null>(summary);

  usePlayerColliderRegistration(collisionRootRef, 'city-collision-layer');

  useEffect(() => {
    markPlayerCollisionCacheDirty(scene);
  }, [scene, summary]);

  useFrame(() => {
    const nextSummary = (scene.userData[CITY_COLLISION_SUMMARY_KEY] as CityCollisionSummary | null) ?? null;
    if (nextSummary !== summaryRef.current) {
      summaryRef.current = nextSummary;
      setSummary(nextSummary);
    }
  });

  return (
    <group ref={collisionRootRef} name="city-collision-layer">
      {summary?.cells.map((cell) => (
        <mesh key={cell.key} position={cell.center}>
          <boxGeometry args={cell.size} />
          <ColliderMaterial debug={debug} color={cell.role === 'structure' ? '#ef4444' : '#22c55e'} />
        </mesh>
      ))}
    </group>
  );
}
*/

const PLAYER_RADIUS = 0.92;
const PLAYER_WALK_SPEED = 66;
const PLAYER_SPRINT_MULTIPLIER = 1.8;

function Player({
  bounds,
  debug = false,
  mobileMoveIntent,
  mode,
  onMove,
  startView,
}: {
  bounds: { minX: number; maxX: number; minZ: number; maxZ: number };
  debug?: boolean;
  mobileMoveIntent?: { f: boolean; b: boolean; l: boolean; r: boolean; s?: boolean };
  mode: ExpoMode;
  onMove: (pos: number[]) => void;
  startView: ExpoStartView;
}) {
  const { camera, scene } = useThree();
  const [mov, setMov] = useState({ f: false, b: false, l: false, r: false, s: false });
  const raycaster = useRef(new THREE.Raycaster());
  const desiredMoveVector = useRef(new THREE.Vector3());
  const moveVelocity = useRef(new THREE.Vector3());
  const spawnChecked = useRef(false);
  const startFramingApplied = useRef(false);
  const lastMoveTime = useRef(0);
  const lastReportedPosition = useRef<[number, number, number]>([0, 0, 0]);

  useEffect(() => {
    camera.position.set(-8, 5, 10);
    camera.lookAt(0, 3, -24);
    logExpoWorldDebug(debug, 'CAMERA START:', camera.position);
  }, [camera, debug]);

  useEffect(() => {
    startFramingApplied.current = false;
    spawnChecked.current = false;
    camera.position.set(...startView.position);
    camera.lookAt(...startView.lookAt);
    camera.updateMatrixWorld();
    lastReportedPosition.current = [startView.position[0], startView.position[1], startView.position[2]];
    logExpoWorldDebug(debug, '[ExpoView][StartViewChanged]', startView);
  }, [camera, debug, startView]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (spawnChecked.current) {
        return;
      }

      const downRay = new THREE.Raycaster(camera.position, new THREE.Vector3(0, -1, 0));
      const intersects = downRay.intersectObjects(collectPlayerCollisionTargets(scene), false);
      const hit = intersects.find((entry) => entry.object.visible && isCollisionMesh(entry.object));

      if (hit && hit.distance < 2) {
        logExpoWorldDebug(debug, 'Spawn unsafe, pushing player upward.');
        camera.position.y += (2 - hit.distance) + 1;
      }

      spawnChecked.current = true;
    }, 4500);

    return () => clearTimeout(timer);
  }, [camera, debug, scene]);

  useEffect(() => {
    if (mode !== 'walk') {
      return;
    }

    const onEscape = (event: KeyboardEvent) => {
      if (event.code === 'Escape' && document.pointerLockElement) {
        document.exitPointerLock?.();
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      switch (event.code) {
        case 'KeyW': setMov((value) => ({ ...value, f: true })); break;
        case 'KeyS': setMov((value) => ({ ...value, b: true })); break;
        case 'KeyA': setMov((value) => ({ ...value, l: true })); break;
        case 'KeyD': setMov((value) => ({ ...value, r: true })); break;
        case 'ShiftLeft':
        case 'ShiftRight': setMov((value) => ({ ...value, s: true })); break;
      }
    };

    const onKeyUp = (event: KeyboardEvent) => {
      switch (event.code) {
        case 'KeyW': setMov((value) => ({ ...value, f: false })); break;
        case 'KeyS': setMov((value) => ({ ...value, b: false })); break;
        case 'KeyA': setMov((value) => ({ ...value, l: false })); break;
        case 'KeyD': setMov((value) => ({ ...value, r: false })); break;
        case 'ShiftLeft':
        case 'ShiftRight': setMov((value) => ({ ...value, s: false })); break;
      }
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('keydown', onEscape);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('keydown', onEscape);
    };
  }, [mode]);

  useFrame((_, delta) => {
    if (!startFramingApplied.current) {
      const startView = scene.userData[EXPO_START_VIEW_KEY] as ExpoStartView | undefined;
      if (startView?.lookAt) {
        camera.position.set(...startView.position);
        camera.lookAt(...startView.lookAt);
        camera.updateMatrixWorld();
        startFramingApplied.current = true;
        logExpoWorldDebug(debug, '[ExpoView][StartFraming]', startView);
      }
    }

    if (mode !== 'walk') {
      return;
    }

    const stableDelta = Math.min(delta, 1 / 90);
    const sprintMultiplier = mov.s || mobileMoveIntent?.s ? PLAYER_SPRINT_MULTIPLIER : 1;
    const speed = PLAYER_WALK_SPEED * sprintMultiplier * stableDelta;
    desiredMoveVector.current.set(0, 0, 0);

    if (mov.f || mobileMoveIntent?.f) desiredMoveVector.current.z -= speed;
    if (mov.b || mobileMoveIntent?.b) desiredMoveVector.current.z += speed;
    if (mov.l || mobileMoveIntent?.l) desiredMoveVector.current.x -= speed;
    if (mov.r || mobileMoveIntent?.r) desiredMoveVector.current.x += speed;

    moveVelocity.current.lerp(desiredMoveVector.current, Math.min(1, stableDelta * 18));
    if (desiredMoveVector.current.lengthSq() <= 0.00001 && moveVelocity.current.lengthSq() < 0.00002) {
      moveVelocity.current.set(0, 0, 0);
    }

    const moved = moveVelocity.current.lengthSq() > 0.00001;

    if (moved) {
      const moveDir = moveVelocity.current.clone().applyQuaternion(camera.quaternion);
      moveDir.y = 0;
      const nextPos = camera.position.clone().add(moveDir);
      const origin = nextPos.clone();
      origin.y -= 1;
      const collisionTargets = collectPlayerCollisionTargets(scene);

      const checkCollision = (pos: THREE.Vector3, dir: THREE.Vector3) => {
        raycaster.current.set(pos, dir);
        const intersects = raycaster.current.intersectObjects(collisionTargets, false);
        return intersects.find((entry) => entry.object.visible && isCollisionMesh(entry.object));
      };

      const forwardDir = moveDir.clone().setY(0).normalize();
      const sideDir = new THREE.Vector3(-forwardDir.z, 0, forwardDir.x).normalize();
      const collisionDirections = [
        forwardDir,
        sideDir,
        sideDir.clone().multiplyScalar(-1),
      ];

      let isBlocked = false;
      for (const direction of collisionDirections) {
        const hit = checkCollision(origin, direction);
        if (hit && hit.distance < PLAYER_RADIUS) {
          isBlocked = true;
          break;
        }
      }

      if (!isBlocked) {
        camera.position.add(moveDir);
      } else {
        const slideX = new THREE.Vector3(moveDir.x * 0.88, 0, 0);
        const slideZ = new THREE.Vector3(0, 0, moveDir.z * 0.88);
        const trySlide = (candidate: THREE.Vector3) => {
          if (candidate.lengthSq() <= 0) {
            return false;
          }

          const nextCandidate = camera.position.clone().add(candidate);
          const candidateOrigin = nextCandidate.clone();
          candidateOrigin.y -= 1;

          for (const direction of collisionDirections) {
            const hit = checkCollision(candidateOrigin, direction);
            if (hit && hit.distance < PLAYER_RADIUS) {
              return false;
            }
          }

          camera.position.copy(nextCandidate);
          return true;
        };

        if (Math.abs(moveDir.x) >= Math.abs(moveDir.z)) {
          if (!trySlide(slideX)) {
            trySlide(slideZ);
          }
        } else if (!trySlide(slideZ)) {
          trySlide(slideX);
        }
      }
    }

    camera.position.setY(5);
    camera.position.setX(Math.min(bounds.maxX, Math.max(bounds.minX, camera.position.x)));
    camera.position.setZ(Math.min(bounds.maxZ, Math.max(bounds.minZ, camera.position.z)));

    if (moved) {
      const now = Date.now();
      const dx = camera.position.x - lastReportedPosition.current[0];
      const dz = camera.position.z - lastReportedPosition.current[2];
      const distanceSq = (dx * dx) + (dz * dz);

      if (now - lastMoveTime.current > 450 || distanceSq > 28 * 28) {
        lastMoveTime.current = now;
        lastReportedPosition.current = [camera.position.x, camera.position.y, camera.position.z];
        onMove(lastReportedPosition.current);
      }
    }
  });

  return mode === 'fly'
    ? <OrbitControls enablePan enableZoom enableRotate maxDistance={500} enableDamping dampingFactor={0.05} />
    : (mode === 'walk' ? <PointerLockControls onUnlock={() => document.body.style.cursor = 'auto'} pointerSpeed={0.18} /> : null);
}

interface ExpoWorldSceneProps {
  activeZone: any;
  debug: boolean;
  guests: any[];
  mobileMoveIntent?: { f: boolean; b: boolean; l: boolean; r: boolean; s?: boolean };
  mode: ExpoMode;
  onMove: (pos: number[]) => void;
  runtimeLayerToggles?: {
    booths: boolean;
    city: boolean;
    promenade: boolean;
    skyline: boolean;
    stadium: boolean;
  };
  runtimeCaptureSafe?: boolean;
  runtimeHighlightedTargets?: string[];
  runtimeSectionToggles?: {
    arrival: boolean;
    left: boolean;
    middle: boolean;
    right: boolean;
    stadium: boolean;
  };
  sceneVersion: string | null;
  startViewOverride?: ExpoStartView | null;
  worldContract: ExpoWorldContract;
  zoneSystem: any;
}

function matchesCitySection(
  position: [number, number, number],
  toggles: { arrival: boolean; left: boolean; middle: boolean; right: boolean }
) {
  if (position[2] > 120) {
    return toggles.arrival;
  }
  if (position[0] < -260) {
    return toggles.left;
  }
  if (position[0] > 260) {
    return toggles.right;
  }
  return toggles.middle;
}

function SceneBridge({ startView }: { startView: ExpoStartView }) {
  const { scene } = useThree();

  useEffect(() => {
    (window as unknown as { __expoSceneRef?: THREE.Scene }).__expoSceneRef = scene;
    setSceneUserData(scene, EXPO_START_VIEW_KEY, startView);
    setSceneUserData(scene, 'expoCollisionPolicy', {
      containment: 'walk-regions + intentional booth blockers',
      gameplayCritical: ['district-booth-collider'],
      scenicNonColliding: ['realistic_city.glb', 'curated-skyline-ring', 'expo-landmark-layer', 'district-anchor-nodes'],
    });

    return () => {
      if ((window as unknown as { __expoSceneRef?: THREE.Scene }).__expoSceneRef === scene) {
        delete (window as unknown as { __expoSceneRef?: THREE.Scene }).__expoSceneRef;
      }
    };
  }, [scene, startView]);

  return null;
}

function CenterScreenInspector() {
  const { camera, scene } = useThree();
  const raycasterRef = useRef(new THREE.Raycaster());
  const directionRef = useRef(new THREE.Vector2(0, 0));
  const frameRef = useRef(0);

  useFrame(() => {
    frameRef.current += 1;
    if (frameRef.current % 8 !== 0) {
      return;
    }

    raycasterRef.current.setFromCamera(directionRef.current, camera);
    const intersections = raycasterRef.current.intersectObjects(scene.children, true);
    const hit = intersections.find((entry) => {
      let current: THREE.Object3D | null = entry.object;
      while (current) {
        if (current.name && current.name.includes(':')) {
          return true;
        }
        current = current.parent;
      }
      return false;
    });

    if (!hit) {
      (window as unknown as { __WARPALA_EXPO_CENTER_TARGET__?: string | null }).__WARPALA_EXPO_CENTER_TARGET__ = null;
      (window as unknown as { __WARPALA_EXPO_CENTER_STACK__?: string[] }).__WARPALA_EXPO_CENTER_STACK__ = [];
      return;
    }
    const centerStack = intersections
      .map((entry) => {
        let current: THREE.Object3D | null = entry.object;
        while (current) {
          if (current.name && current.name.includes(':')) {
            return current.name;
          }
          current = current.parent;
        }
        return null;
      })
      .filter((value): value is string => Boolean(value))
      .filter((value, index, array) => array.indexOf(value) === index)
      .slice(0, 5);

    (window as unknown as { __WARPALA_EXPO_CENTER_STACK__?: string[] }).__WARPALA_EXPO_CENTER_STACK__ = centerStack;
    (window as unknown as { __WARPALA_EXPO_CENTER_TARGET__?: string | null }).__WARPALA_EXPO_CENTER_TARGET__ = centerStack[0] ?? null;
  });

  return null;
}

function ClickInspector() {
  const { camera, gl, scene } = useThree();
  const raycasterRef = useRef(new THREE.Raycaster());

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (!import.meta.env.DEV) {
        return;
      }

      const rect = gl.domElement.getBoundingClientRect();
      if (
        event.clientX < rect.left ||
        event.clientX > rect.right ||
        event.clientY < rect.top ||
        event.clientY > rect.bottom
      ) {
        return;
      }

      const ndc = new THREE.Vector2(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        -(((event.clientY - rect.top) / rect.height) * 2 - 1),
      );

      raycasterRef.current.setFromCamera(ndc, camera);
      const intersections = raycasterRef.current.intersectObjects(scene.children, true);
      const clickStack = intersections
        .map((entry) => {
          let current: THREE.Object3D | null = entry.object;
          while (current) {
            if (current.name && current.name.includes(':')) {
              return current.name;
            }
            current = current.parent;
          }
          return null;
        })
        .filter((value): value is string => Boolean(value))
        .filter((value, index, array) => array.indexOf(value) === index)
        .slice(0, 5);

      (window as unknown as { __WARPALA_EXPO_CLICK_STACK__?: string[] }).__WARPALA_EXPO_CLICK_STACK__ = clickStack;

      if (clickStack.length === 0) {
        (window as unknown as { __WARPALA_EXPO_CLICK_TARGET__?: string | null }).__WARPALA_EXPO_CLICK_TARGET__ = null;
        return;
      }
      (window as unknown as { __WARPALA_EXPO_CLICK_TARGET__?: string | null }).__WARPALA_EXPO_CLICK_TARGET__ = clickStack[0] ?? null;
    };

    window.addEventListener('pointerdown', handlePointerDown);
    return () => window.removeEventListener('pointerdown', handlePointerDown);
  }, [camera, gl, scene]);

  return null;
}

function TargetBasketHighlighter({ targets }: { targets: string[] }) {
  const { scene } = useThree();

  useEffect(() => {
    const originals = new Map<THREE.Material, { emissive?: THREE.Color; emissiveIntensity?: number }>();
    const activeTargets = new Set(targets);

    const highlightMaterial = (material: THREE.Material) => {
      const emissiveMaterial = material as THREE.MeshStandardMaterial;
      if (!('emissive' in emissiveMaterial)) {
        return;
      }
      if (!originals.has(material)) {
        originals.set(material, {
          emissive: emissiveMaterial.emissive?.clone?.(),
          emissiveIntensity: emissiveMaterial.emissiveIntensity,
        });
      }
      emissiveMaterial.emissive = new THREE.Color('#ff3b30');
      emissiveMaterial.emissiveIntensity = Math.max(emissiveMaterial.emissiveIntensity || 0, 0.8);
    };

    scene.traverse((object) => {
      let current: THREE.Object3D | null = object;
      let matched = false;
      while (current) {
        if (current.name && activeTargets.has(current.name)) {
          matched = true;
          break;
        }
        current = current.parent;
      }

      if (!matched) {
        return;
      }

      const mesh = object as THREE.Mesh;
      if (!mesh.material) {
        return;
      }

      if (Array.isArray(mesh.material)) {
        mesh.material.forEach(highlightMaterial);
      } else {
        highlightMaterial(mesh.material);
      }
    });

    return () => {
      originals.forEach((value, material) => {
        const emissiveMaterial = material as THREE.MeshStandardMaterial;
        if ('emissive' in emissiveMaterial && value.emissive) {
          emissiveMaterial.emissive.copy(value.emissive);
        }
        if ('emissiveIntensity' in emissiveMaterial && typeof value.emissiveIntensity === 'number') {
          emissiveMaterial.emissiveIntensity = value.emissiveIntensity;
        }
      });
    };
  }, [scene, targets]);

  return null;
}

export function ExpoWorldScene({ activeZone, debug, guests: _guests, mobileMoveIntent, mode, onMove, runtimeLayerToggles, runtimeCaptureSafe = false, runtimeHighlightedTargets = [], runtimeSectionToggles, sceneVersion, startViewOverride, worldContract, zoneSystem }: ExpoWorldSceneProps) {
  const { boothPlacements, districtPrograms, plan: _boulevardPlan, playBounds, qualityProfileInputs, sectorMarkers, startView, visualProfile, walkRegions } = worldContract;
  const effectiveStartView = startViewOverride ?? startView;
  const layerToggles = runtimeLayerToggles ?? {
    booths: true,
    city: true,
    promenade: true,
    skyline: true,
    stadium: true,
  };
  const sectionToggles = runtimeSectionToggles ?? {
    arrival: true,
    left: true,
    middle: true,
    right: true,
    stadium: true,
  };
  const visibleBoothPlacements = useMemo(
    () => selectVisibleBoothPlacements(boothPlacements, districtPrograms),
    [boothPlacements, districtPrograms]
  );
  const sectionVisibleBoothPlacements = useMemo(
    () => visibleBoothPlacements.filter((placement) => matchesCitySection(placement.position, sectionToggles)),
    [sectionToggles, visibleBoothPlacements]
  );
  const sectorCount = qualityProfileInputs.sectorCount;
  const [playerPosition, setPlayerPosition] = useState<[number, number, number]>([0, 0, 0]);
  const sceneLoadedRef = useRef(false);
  const viewedBoothsRef = useRef<Set<string>>(new Set());
  const lastSectorRef = useRef<string | null>(null);

  useEffect(() => {
    const zoneReplacement = replaceDistrictBoothZones(zoneSystem, visibleBoothPlacements);
    if (import.meta.env.DEV && zoneReplacement.replaced && zoneReplacement.registeredZoneCount !== visibleBoothPlacements.length) {
      console.warn('[ExpoWorld][Zones] District booth zone count mismatch after replacement.', {
        boothPlacementCount: visibleBoothPlacements.length,
        registeredZoneCount: zoneReplacement.registeredZoneCount,
      });
    }
  }, [visibleBoothPlacements, zoneSystem]);

  useEffect(() => {
    if (!EXPO_FEATURE_FLAGS.enableAnalytics) {
      return;
    }

    if (sceneLoadedRef.current) {
      return;
    }
    sceneLoadedRef.current = true;
    trackExpoSceneLoaded({
      boothCount: visibleBoothPlacements.length,
      mode,
      sectorCount,
    });
  }, [mode, sectorCount, visibleBoothPlacements.length]);

  useEffect(() => {
    if (!EXPO_FEATURE_FLAGS.enableAnalytics || !activeZone?.id) {
      return;
    }

    const placementId = String(activeZone.id).replace(/^district-booth-/, '');
    const placement = visibleBoothPlacements.find((entry) => entry.id === placementId);
    if (!placement) {
      return;
    }

    const boothKey = placement.company?.id ? String(placement.company.id) : placement.id;
    if (!viewedBoothsRef.current.has(boothKey)) {
      viewedBoothsRef.current.add(boothKey);
      trackExpoBoothViewed(placement.company, {
        boothId: placement.company?.booth?.id ?? placement.id,
        boothTemplate: buildSponsorBoothPresentation(placement.company, placement.company?.booth ?? null, placement.nodeType, { districtThemeId: placement.districtThemeId }).template,
        sectorName: placement.sectorName,
      });
    }
  }, [activeZone, visibleBoothPlacements]);

  useEffect(() => {
    if (!EXPO_FEATURE_FLAGS.enableAnalytics || sectorMarkers.length === 0) {
      return;
    }

    const [playerX, , playerZ] = playerPosition;
    let nearestMarker = sectorMarkers[0];
    let nearestDistance = Number.POSITIVE_INFINITY;

    sectorMarkers.forEach((marker) => {
      const dx = marker.position[0] - playerX;
      const dz = marker.position[2] - playerZ;
      const distance = (dx * dx) + (dz * dz);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestMarker = marker;
      }
    });

    const sectorKey = String(nearestMarker.sectorId ?? nearestMarker.label);
    if (sectorKey !== lastSectorRef.current) {
      lastSectorRef.current = sectorKey;
      trackExpoSectorEntered(null, {
        sectorId: nearestMarker.sectorId ?? null,
        sectorName: nearestMarker.label,
      });
    }
  }, [playerPosition, sectorMarkers]);

  return (
    <>
      <BoothUI visible={debug && !!activeZone} zoneName={activeZone?.id} />
      <Canvas
        shadows={EXPO_CITY_QUALITY_TIER === 'quality'}
        dpr={runtimeCaptureSafe ? 1 : (EXPO_CITY_QUALITY_TIER === 'quality' ? [0.85, 1.2] : [0.55, 0.8])}
        gl={{ antialias: false, powerPreference: 'high-performance' }}
        performance={{ min: EXPO_CITY_QUALITY_TIER === 'quality' ? 0.5 : 0.85 }}
        camera={{ position: [0, 2, 10], fov: 60, far: 10000 }}
      >
        <SceneBridge startView={effectiveStartView} />
        <CenterScreenInspector />
        <ClickInspector />
        <TargetBasketHighlighter targets={runtimeHighlightedTargets} />
        <Suspense fallback={null}>
            {!runtimeCaptureSafe && <AdaptiveDpr />}
            {!runtimeCaptureSafe && <AdaptiveEvents />}
            {runtimeCaptureSafe ? (
              <color attach="background" args={['#d8e4ef']} />
            ) : (
              <Sky distance={450000} sunPosition={[56, 10, 42]} inclination={0.42} azimuth={0.18} />
            )}
            {!runtimeCaptureSafe && (
              EXPO_FEATURE_FLAGS.enableStreetEnvironmentLighting ? (
                <Environment files="/models/modern_evening_street_4k.exr" />
              ) : (
                <Environment preset="park" />
              )
            )}
            <ambientLight intensity={runtimeCaptureSafe ? 0.16 : 0.24} />
            <directionalLight position={[16, 26, 10]} intensity={runtimeCaptureSafe ? 0.66 : 0.96} castShadow={false} />
            <hemisphereLight args={['#94a8b8', '#4f5d69', runtimeCaptureSafe ? 0.24 : 0.36]} />
            {EXPO_FEATURE_FLAGS.enableFog && <fog attach="fog" args={['#748392', 230, 620]} />}

            <WorldGroundPlane visualProfile={visualProfile} />
            {layerToggles.promenade && <WorldPromenade boothPlacements={sectionVisibleBoothPlacements} sectorMarkers={sectorMarkers} visualProfile={visualProfile} />}
            {layerToggles.city && (
              <WorldCitySkeleton
                boothPlacements={sectionVisibleBoothPlacements}
                districtPrograms={districtPrograms}
                playerPosition={playerPosition}
                sectionToggles={sectionToggles}
                visualProfile={visualProfile}
              />
            )}
            {layerToggles.stadium && sectionToggles.stadium && <ExpoRearCampus boothPlacements={sectionVisibleBoothPlacements} visualProfile={visualProfile} />}
            {(layerToggles.city || layerToggles.booths) && (
              <WorldWayfinding
                boothPlacements={sectionVisibleBoothPlacements}
                playerPosition={playerPosition}
                sectorMarkers={sectorMarkers}
              />
            )}
            {layerToggles.skyline && EXPO_FEATURE_FLAGS.enableCuratedSkylineRing && (
              <CuratedSkylineRing
                density={EXPO_FEATURE_FLAGS.enableShowcaseSkylineDensity ? 'standard' : 'minimal'}
                visualProfile={visualProfile}
                walkRegions={walkRegions}
              />
            )}
            {(EXPO_SPATIAL_DEBUG_FLAGS.showSpawnMarkers || EXPO_SPATIAL_DEBUG_FLAGS.showWalkCorridor) && (
              <SpawnDebugOverlay playBounds={playBounds} startView={startView} walkRegions={walkRegions} />
            )}
            
            <ExpoEvidenceProbe
              activeZoneId={activeZone?.id ? String(activeZone.id) : null}
              mode={mode}
              playerPosition={playerPosition}
              qualityPreset={EXPO_CITY_QUALITY_TIER}
              qualityProfileInputs={qualityProfileInputs}
              sceneVersion={sceneVersion}
              sectorCount={sectorCount}
              sponsorCount={qualityProfileInputs.boothCount}
            />
              {layerToggles.booths && <group>
                {sectionVisibleBoothPlacements.map((placement) => (
                  <RuntimeDistrictBooth
                    key={placement.id}
                    districtVisual={getDistrictVisualProfile(placement.sectorId, placement.clusterIndex, visualProfile)}
                    placement={placement}
                    playerPosition={playerPosition}
                  />
                ))}
              </group>}

              {layerToggles.booths && sectionVisibleBoothPlacements.length === 0 && (
                <Html position={[0, 8, 0]} center>
                  <div style={{ background: 'rgba(15, 23, 42, 0.9)', color: 'white', padding: '16px 20px', borderRadius: '14px', border: '1px solid rgba(59, 130, 246, 0.35)', width: '320px', textAlign: 'center' }}>
                    Sponsor booths are not loaded yet. Check /api/expo/scene or the underlying Supabase sector and company data.
                </div>
              </Html>
            )}

            <Player
              bounds={playBounds}
              debug={debug}
              mobileMoveIntent={mobileMoveIntent}
              mode={mode}
              onMove={(position) => {
                setPlayerPosition([position[0], position[1], position[2]]);
                onMove(position);
              }}
              startView={effectiveStartView}
            />
        </Suspense>
      </Canvas>
    </>
  );
}

export function Expo3DLoader() {
  return <Loader />;
}




