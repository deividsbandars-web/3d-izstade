import React, { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { AdaptiveDpr, AdaptiveEvents, Environment, Html, Loader, OrbitControls, PointerLockControls, Sky, Text, useGLTF, useVideoTexture } from '@react-three/drei';
import { useNavigate } from 'react-router-dom';
import * as THREE from 'three';
import { BoothUI } from '../../../components/BoothUI';
import { normalizeModel } from '../../../utils/threeUtils';
import { ArrivalReveal } from './ArrivalReveal';
import { BoothArchitectureKit, getBoothArchitectureMetrics, getBoothColliderSegments } from './BoothArchitectureKit';
import { CuratedSkylineRing } from './CuratedSkylineRing';
import { ExpoEvidenceProbe } from './ExpoEvidenceProbe';
import {
  trackExpoBookingClicked,
  trackExpoBoothClicked,
  trackExpoBoothViewed,
  trackExpoDemoRoomEntered,
  trackExpoSceneLoaded,
  trackExpoSectorEntered,
  trackExpoWebsiteOpened,
} from '../lib/expoAnalytics';
import { buildBoulevardArtPass } from '../lib/boulevardArtPass';
import { sanitizeExpoBackdropCityScene, type ExpoBackdropStrategy } from '../lib/backdropSanitization';
import { buildExpoCuratedPropPlacements, type ExpoCuratedPropKey } from '../lib/expoCuratedPropPlacement';
import { getExpoGroundFallbackProfile, getExpoGroundTextureCandidates } from '../lib/expoGroundMaterialManifest';
import { resolveExpoTextureCandidateUrls } from '../lib/expoTexturePipeline';
import { buildSponsorScreenLayout, type SponsorScreenNode } from '../lib/sponsorScreenLayout';
import { buildSponsorBoothPresentation, getSponsorNameFontSize, resolveSponsorCtaIntent, type SponsorBoothTemplate, type SponsorCta } from '../lib/sponsorBoothPresentation';
import type { ExpoSectorMarker } from '../layout-engine';
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
const PLAYER_COLLIDER_FLAG = 'playerCollider';
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

function markPlayerCollisionCacheDirty(scene: THREE.Scene) {
  setSceneUserData(scene, PLAYER_COLLISION_TARGETS_CACHE_VERSION_KEY, getPlayerCollisionTargetsVersion(scene) + 1);
  setSceneUserData(scene, PLAYER_COLLISION_TARGETS_CACHE_KEY, null);
  setSceneUserData(scene, PLAYER_COLLISION_TARGETS_CACHE_RESOLVED_VERSION_KEY, -1);
}

function getPlayerColliderRoots(scene: THREE.Scene): THREE.Object3D[] {
  const roots = scene.userData[PLAYER_COLLIDER_ROOTS_KEY];
  if (!Array.isArray(roots)) {
    return [];
  }

  return roots.filter((root): root is THREE.Object3D => Boolean(root && typeof (root as THREE.Object3D).traverse === 'function'));
}

function registerPlayerColliderRoot(scene: THREE.Scene, root: THREE.Object3D | null, label: string) {
  if (!root) {
    return;
  }

  root.userData[PLAYER_COLLIDER_FLAG] = true;
  root.userData.playerColliderLabel = label;

  const roots = getPlayerColliderRoots(scene);
  if (!roots.includes(root)) {
    setSceneUserData(scene, PLAYER_COLLIDER_ROOTS_KEY, [...roots, root]);
    markPlayerCollisionCacheDirty(scene);
  }
}

function unregisterPlayerColliderRoot(scene: THREE.Scene, root: THREE.Object3D | null) {
  if (!root) {
    return;
  }

  root.userData[PLAYER_COLLIDER_FLAG] = false;
  const roots = getPlayerColliderRoots(scene).filter((entry) => entry !== root);
  setSceneUserData(scene, PLAYER_COLLIDER_ROOTS_KEY, roots);
  markPlayerCollisionCacheDirty(scene);
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

function usePlayerColliderRegistration<T extends THREE.Object3D>(ref: React.RefObject<T | null>, label: string) {
  const { scene } = useThree();

  useEffect(() => {
    const root = ref.current;
    registerPlayerColliderRoot(scene, root, label);

    return () => {
      unregisterPlayerColliderRoot(scene, root);
    };
  }, [label, ref, scene]);
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

function loadTextureWithCandidateUrls(loader: THREE.TextureLoader, urls: string[]) {
  return new Promise<THREE.Texture>((resolve, reject) => {
    const queue = [...urls];

    const tryNext = () => {
      const nextUrl = queue.shift();
      if (!nextUrl) {
        reject(new Error(`Could not load any texture candidate: ${urls.join(', ')}`));
        return;
      }

      loader.load(nextUrl, resolve, undefined, () => {
        tryNext();
      });
    };

    tryNext();
  });
}

const EXPO_TEXTURE_CACHE = new Map<string, THREE.Texture | null>();
const EXPO_TEXTURE_PROMISE_CACHE = new Map<string, Promise<THREE.Texture | null>>();

function loadCachedExpoTexture(url: string) {
  const cachedTexture = EXPO_TEXTURE_CACHE.get(url);
  if (cachedTexture !== undefined) {
    return Promise.resolve(cachedTexture);
  }

  const cachedPromise = EXPO_TEXTURE_PROMISE_CACHE.get(url);
  if (cachedPromise) {
    return cachedPromise;
  }

  const loader = new THREE.TextureLoader();
  const candidateUrls = resolveExpoTextureCandidateUrls(url);
  const promise = loadTextureWithCandidateUrls(loader, candidateUrls)
    .then((texture) => {
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.needsUpdate = true;
      EXPO_TEXTURE_CACHE.set(url, texture);
      EXPO_TEXTURE_PROMISE_CACHE.delete(url);
      return texture;
    })
    .catch(() => {
      EXPO_TEXTURE_CACHE.set(url, null);
      EXPO_TEXTURE_PROMISE_CACHE.delete(url);
      return null;
    });

  EXPO_TEXTURE_PROMISE_CACHE.set(url, promise);
  return promise;
}

function buildGroundFallbackNormalMap(color: string, accentColor: string) {
  const size = 64;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext('2d');
  if (!context) {
    return null;
  }

  context.fillStyle = color;
  context.fillRect(0, 0, size, size);
  context.strokeStyle = accentColor;
  context.globalAlpha = 0.2;

  for (let index = 0; index <= size; index += 8) {
    context.beginPath();
    context.moveTo(index, 0);
    context.lineTo(index, size);
    context.stroke();

    context.beginPath();
    context.moveTo(0, index);
    context.lineTo(size, index);
    context.stroke();
  }

  context.globalAlpha = 1;
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.needsUpdate = true;
  return texture;
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

function GroundPlane({ visualProfile }: { visualProfile: ExpoWorldVisualProfile }) {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]} receiveShadow={false}>
      <planeGeometry args={[2000, 2000]} />
      <meshStandardMaterial color={visualProfile.global.groundBase} roughness={0.82} metalness={0.04} />
    </mesh>
  );
}

const EXPO_CURATED_PROP_URLS: Record<ExpoCuratedPropKey, string> = {
  planter: '/models/expo/props/planter.glb',
  bench: '/models/expo/props/bench.glb',
  bench_cushion_low: '/models/expo/props/bench-cushion-low.glb',
  light_square: '/models/expo/props/light-square.glb',
  light_square_double: '/models/expo/props/light-square-double.glb',
  light_curved: '/models/expo/props/light-curved.glb',
  sign_highway: '/models/expo/props/sign-highway.glb',
  sign_highway_wide: '/models/expo/props/sign-highway-wide.glb',
  info_kiosk_base_computer_screen: '/models/expo/props/info-kiosk-base-computer-screen.glb',
  bush: '/models/expo/props/bush.glb',
  big_bush: '/models/expo/props/big-bush.glb',
};

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
      ? 2
      : district?.expressionMode === 'calm-dwell'
        ? 1
        : district?.expressionMode === 'feature-court'
          ? 1
          : district?.expressionMode === 'scenic' || district?.expressionMode === 'satellite' || district?.expressionMode === 'orientation'
            ? 1
            : 1;

    return rankedPlacements.slice(0, Math.min(visibleLimit, rankedPlacements.length));
  });
}

export function ExpoCuratedPropsLayer({
  boothPlacements,
  districtPrograms,
  sectorMarkers,
}: {
  boothPlacements: ExpoBoothPlacement[];
  districtPrograms: ExpoDistrictProgramSummary[];
  sectorMarkers: ExpoSectorMarker[];
}) {
  const planterScene = useGLTF(EXPO_CURATED_PROP_URLS.planter).scene;
  const benchScene = useGLTF(EXPO_CURATED_PROP_URLS.bench).scene;
  const benchCushionLowScene = useGLTF(EXPO_CURATED_PROP_URLS.bench_cushion_low).scene;
  const lightSquareScene = useGLTF(EXPO_CURATED_PROP_URLS.light_square).scene;
  const lightSquareDoubleScene = useGLTF(EXPO_CURATED_PROP_URLS.light_square_double).scene;
  const lightCurvedScene = useGLTF(EXPO_CURATED_PROP_URLS.light_curved).scene;
  const signHighwayScene = useGLTF(EXPO_CURATED_PROP_URLS.sign_highway).scene;
  const signHighwayWideScene = useGLTF(EXPO_CURATED_PROP_URLS.sign_highway_wide).scene;
  const infoKioskScene = useGLTF(EXPO_CURATED_PROP_URLS.info_kiosk_base_computer_screen).scene;
  const bushScene = useGLTF(EXPO_CURATED_PROP_URLS.bush).scene;
  const bigBushScene = useGLTF(EXPO_CURATED_PROP_URLS.big_bush).scene;
  const sourceScenes = useMemo(() => ({
    planter: planterScene,
    bench: benchScene,
    bench_cushion_low: benchCushionLowScene,
    light_square: lightSquareScene,
    light_square_double: lightSquareDoubleScene,
    light_curved: lightCurvedScene,
    sign_highway: signHighwayScene,
    sign_highway_wide: signHighwayWideScene,
    info_kiosk_base_computer_screen: infoKioskScene,
    bush: bushScene,
    big_bush: bigBushScene,
  } as const), [
    benchCushionLowScene,
    benchScene,
    bigBushScene,
    bushScene,
    infoKioskScene,
    lightCurvedScene,
    lightSquareDoubleScene,
    lightSquareScene,
    planterScene,
    signHighwayScene,
    signHighwayWideScene,
  ]);

  const placements = useMemo(
    () => buildExpoCuratedPropPlacements(boothPlacements, sectorMarkers, districtPrograms, { showcase: EXPO_FEATURE_FLAGS.enableEnhancedBoulevardDetail }),
    [boothPlacements, districtPrograms, sectorMarkers]
  );

  const instances = useMemo(() => (
    placements.map((placement) => {
      const clone = sourceScenes[placement.assetKey].clone(true);
      markScenicNonColliding(clone);

      return {
        ...placement,
        object: clone,
      };
    })
  ), [placements, sourceScenes]);

  return (
    <group name="expo-curated-props-layer">
      {instances.map((instance) => (
        <group key={instance.id} position={instance.position} rotation={[0, instance.rotationY, 0]} scale={instance.scale}>
          <primitive object={instance.object} />
          <ExpoCuratedPropDecoration placement={instance} />
        </group>
      ))}
    </group>
  );
}

function ExpoCuratedPropDecoration({
  placement,
}: {
  placement: ReturnType<typeof buildExpoCuratedPropPlacements>[number];
}) {
  if (placement.decorationKind === 'district-sign-wide') {
    return (
      <group position={[0, 10.6, 0.2]}>
        <mesh castShadow>
          <boxGeometry args={[8.8, 2.7, 0.22]} />
          <meshStandardMaterial color="#08111f" metalness={0.25} roughness={0.42} />
        </mesh>
        <mesh position={[0, -1.85, 0.12]} castShadow>
          <boxGeometry args={[4.6, 0.55, 0.18]} />
          <meshStandardMaterial color={placement.accentColor || '#2563eb'} emissive={placement.accentColor || '#2563eb'} emissiveIntensity={0.12} />
        </mesh>
        <mesh position={[0, 0.34, 0.16]}>
          <boxGeometry args={[5.8, 0.16, 0.05]} />
          <meshStandardMaterial color="#dbeafe" emissive="#dbeafe" emissiveIntensity={0.08} />
        </mesh>
      </group>
    );
  }

  if (placement.decorationKind === 'info-kiosk') {
    return (
      <group position={[0, 2.1, 0.42]}>
        <mesh castShadow>
          <boxGeometry args={[2.1, 1.3, 0.08]} />
          <meshStandardMaterial color="#020617" emissive={placement.accentColor || '#0f766e'} emissiveIntensity={0.1} roughness={0.28} metalness={0.2} />
        </mesh>
        <mesh position={[0, 0.92, 0.03]} castShadow>
          <boxGeometry args={[1.16, 0.22, 0.06]} />
          <meshStandardMaterial color={placement.accentColor || '#0f766e'} emissive={placement.accentColor || '#0f766e'} emissiveIntensity={0.32} />
        </mesh>
        <mesh position={[0, 0.15, 0.08]}>
          <boxGeometry args={[1.26, 0.34, 0.03]} />
          <meshStandardMaterial color="#dff7f3" emissive="#dff7f3" emissiveIntensity={0.08} />
        </mesh>
      </group>
    );
  }

  return null;
}

export function BoulevardGrassClusters({ clusters }: { clusters: ReturnType<typeof buildBoulevardArtPass>['grassClusters'] }) {
  const { scene: grassScene } = useGLTF('/models/simple_grass_chunks.glb');
  const instances = useMemo(() => (
    clusters.map((cluster) => {
      const clone = grassScene.clone(true);
      clone.traverse((child) => {
        child.userData[DISABLE_PLAYER_COLLISION_FLAG] = true;
      });

      return {
        ...cluster,
        object: clone,
      };
    })
  ), [clusters, grassScene]);

  return (
    <group name="boulevard-grass-clusters">
      {instances.map((cluster) => (
        <primitive
          key={cluster.id}
          object={cluster.object}
          position={cluster.position}
          rotation={[0, cluster.rotationY, 0]}
          scale={cluster.scale}
        />
      ))}
    </group>
  );
}

function BoulevardGroundArt({
  boothPlacements,
  sectorMarkers,
}: {
  boothPlacements: ExpoBoothPlacement[];
  sectorMarkers: ExpoSectorMarker[];
}) {
  const artPass = useMemo(
    () => buildBoulevardArtPass(boothPlacements, sectorMarkers, { showcase: EXPO_FEATURE_FLAGS.enableEnhancedBoulevardDetail }),
    [boothPlacements, sectorMarkers]
  );
  const [textures, setTextures] = useState<THREE.Texture[] | null>(null);

  useEffect(() => {
    if (!EXPO_FEATURE_FLAGS.enablePremiumGroundTextures) {
      return () => undefined;
    }

    let isActive = true;
    const loader = new THREE.TextureLoader();
    const urls = [
      getExpoGroundTextureCandidates('hero_paver')?.map ?? [],
      getExpoGroundTextureCandidates('hero_paver')?.normalMap ?? [],
      getExpoGroundTextureCandidates('hero_paver')?.roughnessMap ?? [],
      getExpoGroundTextureCandidates('light_concrete')?.map ?? [],
      getExpoGroundTextureCandidates('light_concrete')?.normalMap ?? [],
      getExpoGroundTextureCandidates('light_concrete')?.roughnessMap ?? [],
      getExpoGroundTextureCandidates('urban_grass')?.map ?? [],
      getExpoGroundTextureCandidates('urban_grass')?.normalMap ?? [],
      getExpoGroundTextureCandidates('urban_grass')?.roughnessMap ?? [],
    ];

    Promise.all(urls.map((candidateUrls) => loadTextureWithCandidateUrls(loader, candidateUrls)))
      .then((loadedTextures) => {
        if (!isActive) return;
        setTextures(loadedTextures);
      })
      .catch((error) => {
        if (!isActive) return;
        if (import.meta.env.DEV) {
          console.warn('Expo boulevard textures unavailable. Falling back to color-only boulevard materials.', error);
        }
        setTextures(null);
      });

    return () => {
      isActive = false;
    };
  }, []);

  const materialMaps = useMemo(() => {
    if (!textures) {
      return {
        hero_paver: null,
        light_concrete: null,
        urban_grass: null,
      } as const;
    }

    const configure = (texture: THREE.Texture, repeatX: number, repeatY: number) => {
      const clone = texture.clone();
      clone.wrapS = THREE.RepeatWrapping;
      clone.wrapT = THREE.RepeatWrapping;
      clone.repeat.set(repeatX, repeatY);
      clone.colorSpace = texture === textures[0] || texture === textures[3] || texture === textures[6]
        ? THREE.SRGBColorSpace
        : THREE.NoColorSpace;
      clone.needsUpdate = true;
      return clone;
    };

    return {
      hero_paver: {
        map: configure(textures[0], 2.6, 8),
        normalMap: configure(textures[1], 2.6, 8),
        roughnessMap: configure(textures[2], 2.6, 8),
      },
      light_concrete: {
        map: configure(textures[3], 1.8, 7),
        normalMap: configure(textures[4], 1.8, 7),
        roughnessMap: configure(textures[5], 1.8, 7),
      },
      urban_grass: {
        map: configure(textures[6], 2.4, 8),
        normalMap: configure(textures[7], 2.4, 8),
        roughnessMap: configure(textures[8], 2.4, 8),
        },
      };
    }, [textures]);
  const surfaceTextureVariants = useMemo(() => {
    const variantCache = new Map<string, { map?: THREE.Texture; normalMap?: THREE.Texture; roughnessMap?: THREE.Texture }>();
    const buildVariant = (surface: ReturnType<typeof buildBoulevardArtPass>['surfaces'][number]) => {
      if (!surface.textureRepeat) {
        return null;
      }

      const maps = surface.materialKey === 'hero_paver'
        ? materialMaps.hero_paver
        : surface.materialKey === 'light_concrete'
          ? materialMaps.light_concrete
          : surface.materialKey === 'urban_grass'
            ? materialMaps.urban_grass
            : null;

      if (!maps) {
        return null;
      }

      const cacheKey = `${surface.materialKey}:${surface.textureRepeat[0]}:${surface.textureRepeat[1]}`;
      if (!variantCache.has(cacheKey)) {
        const cloneTexture = (texture: THREE.Texture | undefined) => {
          if (!texture) {
            return undefined;
          }

          const clone = texture.clone();
          clone.repeat.set(...surface.textureRepeat!);
          clone.needsUpdate = true;
          return clone;
        };

        variantCache.set(cacheKey, {
          map: cloneTexture(maps.map),
          normalMap: cloneTexture(maps.normalMap),
          roughnessMap: cloneTexture(maps.roughnessMap),
        });
      }

      return variantCache.get(cacheKey) ?? null;
    };

    return new Map(artPass.surfaces.map((surface) => [surface.id, buildVariant(surface)]));
  }, [artPass.surfaces, materialMaps]);
  const fallbackMaterialVariants = useMemo(() => {
    const cache = new Map<string, { bumpMap: THREE.Texture | null; normalMap: THREE.Texture | null; roughness: number; metalness: number; emissiveIntensity: number; normalScale: THREE.Vector2; bumpScale: number }>();

    artPass.surfaces.forEach((surface) => {
      const cacheKey = `${surface.kind}:${surface.color}:${surface.emissive ?? 'none'}`;
      if (cache.has(cacheKey)) {
        return;
      }

      const accentColor = surface.emissive ?? surface.color;
      const fallbackProfile = getExpoGroundFallbackProfile(surface.kind, surface.roughness, surface.metalness);
      const texture = buildGroundFallbackNormalMap(surface.color, accentColor);
      if (texture) {
        texture.repeat.set(...(surface.textureRepeat ?? [1, 1]));
        texture.needsUpdate = true;
      }

      cache.set(cacheKey, {
        bumpMap: texture,
        normalMap: texture ? texture.clone() : null,
        roughness: fallbackProfile.roughness,
        metalness: fallbackProfile.metalness,
        emissiveIntensity: (surface.emissiveIntensity ?? 0) + fallbackProfile.emissiveIntensityBoost,
        normalScale: fallbackProfile.normalScale,
        bumpScale: fallbackProfile.bumpScale,
      });
    });

    return cache;
  }, [artPass.surfaces]);

  return (
    <group name="boulevard-ground-art">
      {artPass.surfaces.map((surface) => {
        const maps = surface.materialKey === 'hero_paver'
          ? materialMaps.hero_paver
          : surface.materialKey === 'light_concrete'
          ? materialMaps.light_concrete
          : surface.materialKey === 'urban_grass'
              ? materialMaps.urban_grass
              : null;
        const textureVariant = surfaceTextureVariants.get(surface.id) ?? null;
        const shouldRenderLightPool = surface.kind !== 'light_pool' || EXPO_FEATURE_FLAGS.enableLocalizedLightPools;

        if (!shouldRenderLightPool) {
          return null;
        }

        return (
          <mesh
            key={surface.id}
            position={surface.position}
            rotation={[-Math.PI / 2, 0, 0]}
            receiveShadow
          >
            <planeGeometry args={surface.size} />
            <meshStandardMaterial
              color={surface.color}
              emissive={surface.emissive}
              emissiveIntensity={maps || textureVariant ? surface.emissiveIntensity : fallbackMaterialVariants.get(`${surface.kind}:${surface.color}:${surface.emissive ?? 'none'}`)?.emissiveIntensity}
              bumpMap={maps || textureVariant ? null : fallbackMaterialVariants.get(`${surface.kind}:${surface.color}:${surface.emissive ?? 'none'}`)?.bumpMap ?? undefined}
              bumpScale={maps || textureVariant ? 0 : fallbackMaterialVariants.get(`${surface.kind}:${surface.color}:${surface.emissive ?? 'none'}`)?.bumpScale}
              map={textureVariant?.map ?? maps?.map}
              metalness={maps || textureVariant ? surface.metalness : fallbackMaterialVariants.get(`${surface.kind}:${surface.color}:${surface.emissive ?? 'none'}`)?.metalness}
              normalMap={textureVariant?.normalMap ?? maps?.normalMap ?? fallbackMaterialVariants.get(`${surface.kind}:${surface.color}:${surface.emissive ?? 'none'}`)?.normalMap ?? undefined}
              normalScale={maps || textureVariant ? undefined : fallbackMaterialVariants.get(`${surface.kind}:${surface.color}:${surface.emissive ?? 'none'}`)?.normalScale}
              opacity={surface.opacity ?? 1}
              roughnessMap={textureVariant?.roughnessMap ?? maps?.roughnessMap}
              roughness={maps || textureVariant ? surface.roughness : fallbackMaterialVariants.get(`${surface.kind}:${surface.color}:${surface.emissive ?? 'none'}`)?.roughness}
              transparent={surface.opacity !== undefined}
            />
          </mesh>
        );
      })}
    </group>
  );
}

function ExpoAxisMaterial({
  color,
  metalness = 0.04,
  roughness = 0.64,
}: {
  color: string;
  metalness?: number;
  roughness?: number;
}) {
  return <meshStandardMaterial color={color} metalness={metalness} roughness={roughness} />;
}

export function DistrictGatewayNode({ marker }: { marker: ExpoSectorMarker }) {
  const style = marker.districtTheme.gatewayStyle;
  const accent = marker.color;

  return (
    <group position={marker.position}>
      <mesh position={[0, 0.04, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[18, 6]} />
        <meshStandardMaterial color={marker.districtTheme.groundPalette.plaza} transparent opacity={0.14} />
      </mesh>
      {style === 'studio_portal' && (
        <>
          <mesh position={[0, 6.2, 0]} castShadow>
            <boxGeometry args={[16, 10.5, 1.2]} />
            <meshStandardMaterial color="#0f172a" metalness={0.12} roughness={0.82} />
          </mesh>
          <mesh position={[0, 6.4, 0.68]}>
            <planeGeometry args={[13.5, 7.6]} />
            <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.22} transparent opacity={0.16} />
          </mesh>
        </>
      )}
      {style === 'signal_frame' && (
        <>
          <mesh position={[-6, 6.4, 0]} castShadow>
            <boxGeometry args={[1.2, 11.5, 1.4]} />
            <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.18} />
          </mesh>
          <mesh position={[6, 6.4, 0]} castShadow>
            <boxGeometry args={[1.2, 11.5, 1.4]} />
            <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.18} />
          </mesh>
          <mesh position={[0, 11.3, 0]} castShadow>
            <boxGeometry args={[14.2, 1, 1.5]} />
            <meshStandardMaterial color="#0f172a" />
          </mesh>
        </>
      )}
      {style === 'forum_arch' && (
        <>
          <mesh position={[0, 6.8, 0]} castShadow>
            <torusGeometry args={[6.1, 0.7, 18, 40, Math.PI]} />
            <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.16} />
          </mesh>
          <mesh position={[-6.1, 3.5, 0]} castShadow>
            <boxGeometry args={[1, 7, 1.2]} />
            <meshStandardMaterial color="#1f2937" />
          </mesh>
          <mesh position={[6.1, 3.5, 0]} castShadow>
            <boxGeometry args={[1, 7, 1.2]} />
            <meshStandardMaterial color="#1f2937" />
          </mesh>
        </>
      )}
      {style === 'gallery_blade' && (
        <>
          <mesh position={[0, 6.6, 0]} castShadow>
            <boxGeometry args={[4.2, 11.8, 1.1]} />
            <meshStandardMaterial color="#0f172a" />
          </mesh>
          <mesh position={[0, 6.6, 0.7]}>
            <planeGeometry args={[3.3, 9.8]} />
            <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.18} transparent opacity={0.22} />
          </mesh>
        </>
      )}
      <mesh position={[0, 7.4, 1.18]}>
        <boxGeometry args={[4.8, 0.22, 0.06]} />
        <meshStandardMaterial color="#e2e8f0" emissive="#e2e8f0" emissiveIntensity={0.08} />
      </mesh>
      <mesh position={[marker.side === 'left' ? 12 : -12, 0.2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[12, 3.2]} />
        <meshStandardMaterial color={accent} transparent opacity={0.12} />
      </mesh>
    </group>
  );
}

function ExpoDistrictPromenade({
  boothPlacements,
  sectorMarkers,
}: {
  boothPlacements: ExpoBoothPlacement[];
  sectorMarkers: ExpoSectorMarker[];
}) {
  const footprint = useMemo(() => {
    const planned = boothPlacements[0]?.layoutFootprint;
    if (planned) {
      return planned;
    }

    const xs = boothPlacements.map((placement) => placement.position[0]);
    const zs = boothPlacements.map((placement) => placement.position[2]);
    return {
      maxX: xs.length > 0 ? Math.max(...xs) + 96 : 260,
      maxZ: zs.length > 0 ? Math.max(...zs) + 96 : 80,
      minX: xs.length > 0 ? Math.min(...xs) - 96 : -260,
      minZ: zs.length > 0 ? Math.min(...zs) - 180 : -620,
    };
  }, [boothPlacements]);
  const centerZ = (footprint.minZ + footprint.maxZ) * 0.5;
  const promenadeLength = Math.max(1320, (footprint.maxZ - footprint.minZ) + 520);
  const promenadeWidth = 108;
  const innerRunwayWidth = 28;
  const shoulderWidth = 22;
  const sidePromenadeWidth = 92;
  const sidePromenadeX = 252;
  const laneStep = 92;
  const laneCount = Math.max(10, Math.floor((promenadeLength - 80) / laneStep));
  const laneStartZ = footprint.maxZ - 28;
  const plazaDepth = 168;
  const plazaOffsets = [
    footprint.maxZ - 168,
    centerZ + 44,
    footprint.minZ + 224,
  ];

  return (
    <group name="expo-district-promenade">
      {EXPO_FEATURE_FLAGS.enableGroundArtPass && (
        <BoulevardGroundArt boothPlacements={boothPlacements} sectorMarkers={sectorMarkers} />
      )}
      <mesh position={[0, 0.03, centerZ]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[promenadeWidth, promenadeLength]} />
        <ExpoAxisMaterial color="#dce3eb" roughness={0.58} metalness={0.05} />
      </mesh>
      <mesh position={[0, 0.035, centerZ]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[innerRunwayWidth, promenadeLength - 36]} />
        <ExpoAxisMaterial color="#eef4f8" roughness={0.48} metalness={0.05} />
      </mesh>
      <mesh position={[-((promenadeWidth * 0.5) - (shoulderWidth * 0.5)), 0.034, centerZ]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[shoulderWidth, promenadeLength - 36]} />
        <ExpoAxisMaterial color="#cfd7df" roughness={0.66} metalness={0.04} />
      </mesh>
      <mesh position={[(promenadeWidth * 0.5) - (shoulderWidth * 0.5), 0.034, centerZ]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[shoulderWidth, promenadeLength - 36]} />
        <ExpoAxisMaterial color="#cfd7df" roughness={0.66} metalness={0.04} />
      </mesh>
      <mesh position={[-sidePromenadeX, 0.031, centerZ - 24]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[sidePromenadeWidth, promenadeLength - 120]} />
        <ExpoAxisMaterial color="#dce6ed" roughness={0.68} metalness={0.03} />
      </mesh>
      <mesh position={[sidePromenadeX, 0.031, centerZ - 24]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[sidePromenadeWidth, promenadeLength - 120]} />
        <ExpoAxisMaterial color="#dce6ed" roughness={0.68} metalness={0.03} />
      </mesh>
      {plazaOffsets.map((z, index) => (
        <group key={`city-plaza-${z}`}>
          <mesh position={[0, 0.029, z]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
            <planeGeometry args={[186, plazaDepth]} />
            <ExpoAxisMaterial
              color={index === 0 ? '#d7e0e8' : index === 1 ? '#d2dbe4' : '#d0d9e1'}
              roughness={0.74}
              metalness={0.03}
            />
          </mesh>
          <mesh position={[0, 0.032, z]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
            <planeGeometry args={[52, plazaDepth - 24]} />
            <ExpoAxisMaterial color="#edf3f7" roughness={0.52} metalness={0.04} />
          </mesh>
        </group>
      ))}
      {EXPO_FEATURE_FLAGS.enableEnhancedBoulevardDetail && Array.from({ length: laneCount }, (_, index) => laneStartZ - index * laneStep).map((z) => (
        <mesh key={`lane-${z}`} position={[0, 0.08, z]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[3.8, 10.8]} />
          <meshStandardMaterial color="#e2e8f0" emissive="#cbd5e1" emissiveIntensity={0.04} transparent opacity={0.88} />
        </mesh>
      ))}
      {EXPO_FEATURE_FLAGS.enableEnhancedBoulevardDetail && Array.from({ length: laneCount - 2 }, (_, index) => laneStartZ - 36 - index * laneStep).map((z) => (
        <group key={`side-wayfinding-${z}`}>
          <mesh position={[-sidePromenadeX, 0.052, z]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[3.2, 11.2]} />
            <meshStandardMaterial color="#cfd9e4" emissive="#b9c7d6" emissiveIntensity={0.02} transparent opacity={0.8} />
          </mesh>
          <mesh position={[sidePromenadeX, 0.052, z]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[3.2, 11.2]} />
            <meshStandardMaterial color="#cfd9e4" emissive="#b9c7d6" emissiveIntensity={0.02} transparent opacity={0.8} />
          </mesh>
        </group>
      ))}
      {!EXPO_SPATIAL_DEBUG_FLAGS.disableArrivalReveal && <ArrivalReveal />}
    </group>
  );
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

function getStadiumReserve(_boothPlacements: ExpoBoothPlacement[]) {
  return {
    // Stadium planning is paused until the target zone is mapped correctly in
    // live review. Keep the reserve effectively disabled so we do not wipe out
    // unrelated city fabric while iterating on the corner selection.
    centerX: -10000,
    centerZ: -10000,
    halfWidth: 1,
    halfDepth: 1,
  };
}

function isInsideStadiumReserve(point: [number, number, number], reserve: ReturnType<typeof getStadiumReserve>) {
  return (
    Math.abs(point[0] - reserve.centerX) <= reserve.halfWidth &&
    Math.abs(point[2] - reserve.centerZ) <= reserve.halfDepth
  );
}

function overlapsStadiumReserve(
  point: [number, number, number],
  reserve: ReturnType<typeof getStadiumReserve>,
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
  const stadiumReserve = useMemo(() => getStadiumReserve(boothPlacements), [boothPlacements]);
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
    const entries = districtPrograms.flatMap((district, districtIndex) => {
      const baseZ = -196 - (districtIndex * 548);
      const leftX = [-208, -254, -318];
      const rightX = [208, 254, 318];
      const zs = [baseZ + 162, baseZ + 42, baseZ - 122];

      return [
        ...leftX.flatMap((x, xIndex) => zs.map((z, zIndex) => ({
          id: `${district.sectorId ?? district.clusterIndex}-tree-left-${xIndex}-${zIndex}`,
          position: [x, 0, z] as [number, number, number],
        }))),
        ...rightX.flatMap((x, xIndex) => zs.map((z, zIndex) => ({
          id: `${district.sectorId ?? district.clusterIndex}-tree-right-${xIndex}-${zIndex}`,
          position: [x, 0, z - 18] as [number, number, number],
        }))),
      ];
    });
    return filterReservedSponsorFrontageEntries(entries, boothPlacements, { frontDepth: 340, rearDepth: 140, sideWidth: 180, radius: 220 });
  }, [districtPrograms, boothPlacements]);

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
    const entries = districtPrograms.flatMap((district, districtIndex) => {
      const baseZ = -196 - (districtIndex * 548);
      const parkZ = baseZ - 24;
      const isScenic = district.expressionMode === 'scenic' || district.expressionMode === 'feature-court';
      const isCalm = district.expressionMode === 'calm-dwell';
      const parkWidth = isScenic ? 176 : isCalm ? 138 : 104;
      const parkDepth = isScenic ? 92 : isCalm ? 66 : 48;
      const sideX = isScenic ? 248 : 208;

      return [
        {
          id: `${district.sectorId ?? district.clusterIndex}-park-left`,
          position: [-sideX, 0.012, parkZ] as [number, number, number],
          size: [parkWidth, parkDepth] as [number, number],
          color: isScenic ? '#7b927d' : '#7f8f81',
          pathColor: '#cfd8de',
          ringColor: '#31414d',
          hasTrees: true,
        },
        {
          id: `${district.sectorId ?? district.clusterIndex}-park-right`,
          position: [sideX, 0.012, parkZ - 18] as [number, number, number],
          size: [parkWidth - 10, Math.max(18, parkDepth - 4)] as [number, number],
          color: isScenic ? '#76907b' : '#7a897d',
          pathColor: '#c8d1d8',
          ringColor: '#2e3d47',
          hasTrees: isScenic || isCalm,
        },
      ];
    });
    return filterReservedSponsorFrontageEntries(entries, boothPlacements, { frontDepth: 320, rearDepth: 120, sideWidth: 180, radius: 220 });
  }, [districtPrograms, boothPlacements]);

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

function CleanExpoCitySkeleton({
  boothPlacements,
  districtPrograms,
  visualProfile,
}: {
  boothPlacements: ExpoBoothPlacement[];
  districtPrograms: ExpoDistrictProgramSummary[];
  visualProfile: ExpoWorldVisualProfile;
}) {
  const stadiumReserve = useMemo(() => getStadiumReserve(boothPlacements), [boothPlacements]);
  const districtStride = 548;

  const arrivalPlanes = useMemo(() => ([
    { id: 'arrival-main', position: [0, 0.018, 64] as [number, number, number], size: [260, 220] as [number, number], color: '#eef4f7' },
    { id: 'arrival-spine', position: [0, 0.02, -84] as [number, number, number], size: [96, 520] as [number, number], color: '#dde7ef' },
    { id: 'arrival-left', position: [-168, 0.018, -18] as [number, number, number], size: [146, 264] as [number, number], color: '#d6e2ea' },
    { id: 'arrival-right', position: [168, 0.018, -18] as [number, number, number], size: [146, 264] as [number, number], color: '#d6e2ea' },
  ]), []);

  const promenadeAxisPlanes = useMemo(() => {
    const districtCount = Math.max(3, districtPrograms.length);
    return Array.from({ length: districtCount }, (_, districtIndex) => {
      const baseZ = -178 - (districtIndex * districtStride);
      return [
        {
          id: `promenade-axis-main-${districtIndex}`,
          position: [0, 0.02, baseZ + 16] as [number, number, number],
          size: [148, 262] as [number, number],
          color: '#edf3f7',
        },
        {
          id: `promenade-axis-cross-${districtIndex}`,
          position: [0, 0.019, baseZ + 126] as [number, number, number],
          size: [328, 84] as [number, number],
          color: '#e2ebf1',
        },
      ];
    }).flat();
  }, [districtPrograms.length, districtStride]);

  const arrivalGatewayBlocks = useMemo(() => ([
    {
      id: 'arrival-gateway-left',
      position: [-226, 0, 128] as [number, number, number],
      size: [72, 168, 48] as [number, number, number],
      color: '#7d919f',
    },
    {
      id: 'arrival-gateway-right',
      position: [226, 0, 128] as [number, number, number],
      size: [72, 168, 48] as [number, number, number],
      color: '#7d919f',
    },
    {
      id: 'arrival-gateway-lintel',
      position: [0, 0, 128] as [number, number, number],
      size: [344, 26, 40] as [number, number, number],
      color: '#aab8c2',
    },
  ]), []);

  const arrivalLandmarkBlocks = useMemo(() => ([
    {
      id: 'arrival-landmark-pylon-left',
      position: [-324, 0, 96] as [number, number, number],
      size: [58, 248, 58] as [number, number, number],
      color: '#7c909f',
    },
    {
      id: 'arrival-landmark-pylon-right',
      position: [324, 0, 96] as [number, number, number],
      size: [58, 248, 58] as [number, number, number],
      color: '#7c909f',
    },
    {
      id: 'arrival-landmark-bridge',
      position: [0, 0, 96] as [number, number, number],
      size: [548, 34, 52] as [number, number, number],
      color: '#b4c3cc',
    },
  ]), []);

  const arrivalSupportBlocks = useMemo(() => ([
    {
      id: 'arrival-support-left-outer',
      position: [-472, 0, 24] as [number, number, number],
      size: [164, 96, 212] as [number, number, number],
      color: '#9dafbb',
    },
    {
      id: 'arrival-support-right-outer',
      position: [472, 0, 12] as [number, number, number],
      size: [164, 104, 224] as [number, number, number],
      color: '#9dafbb',
    },
    {
      id: 'arrival-support-left-inner',
      position: [-286, 0, -82] as [number, number, number],
      size: [112, 62, 148] as [number, number, number],
      color: '#b8c5ce',
    },
    {
      id: 'arrival-support-right-inner',
      position: [286, 0, -96] as [number, number, number],
      size: [112, 62, 148] as [number, number, number],
      color: '#b8c5ce',
    },
  ]), []);

  const boulevardEdgeBlocks = useMemo(() => {
    const districtCount = Math.max(3, districtPrograms.length);
    return Array.from({ length: districtCount }, (_, districtIndex) => {
      const baseZ = -168 - (districtIndex * districtStride);
      return [
        {
          id: `boulevard-edge-left-${districtIndex}`,
          position: [-132, 0, baseZ + 28] as [number, number, number],
          size: [18, 6, 164] as [number, number, number],
          color: '#dfe8ee',
        },
        {
          id: `boulevard-edge-right-${districtIndex}`,
          position: [132, 0, baseZ + 22] as [number, number, number],
          size: [18, 6, 164] as [number, number, number],
          color: '#dfe8ee',
        },
        {
          id: `boulevard-node-left-${districtIndex}`,
          position: [-214, 0, baseZ - 88] as [number, number, number],
          size: [42, 10, 46] as [number, number, number],
          color: '#d7e2e9',
        },
        {
          id: `boulevard-node-right-${districtIndex}`,
          position: [214, 0, baseZ - 102] as [number, number, number],
          size: [42, 10, 46] as [number, number, number],
          color: '#d7e2e9',
        },
      ];
    }).flat();
  }, [districtPrograms.length, districtStride]);

  const mediaWallBlocks = useMemo(() => {
    const entries = districtPrograms.slice(0, Math.max(3, districtPrograms.length)).flatMap((district, districtIndex) => {
      const baseZ = -160 - (districtIndex * districtStride);
      return [
        {
          id: `${district.sectorId ?? district.clusterIndex}-media-left-block-a`,
          position: [-562, 34, baseZ + 84] as [number, number, number],
          size: [72, 68, 28] as [number, number, number],
          color: '#627686',
        },
        {
          id: `${district.sectorId ?? district.clusterIndex}-media-left-block-b`,
          position: [-488, 22, baseZ - 64] as [number, number, number],
          size: [56, 44, 52] as [number, number, number],
          color: '#718492',
        },
        {
          id: `${district.sectorId ?? district.clusterIndex}-media-left-anchor`,
          position: [-426, 12, baseZ - 206] as [number, number, number],
          size: [52, 24, 44] as [number, number, number],
          color: '#7f93a0',
        },
        {
          id: `${district.sectorId ?? district.clusterIndex}-media-right-block-a`,
          position: [562, 32, baseZ + 72] as [number, number, number],
          size: [72, 64, 28] as [number, number, number],
          color: '#627686',
        },
        {
          id: `${district.sectorId ?? district.clusterIndex}-media-right-block-b`,
          position: [494, 24, baseZ - 86] as [number, number, number],
          size: [58, 48, 54] as [number, number, number],
          color: '#718492',
        },
        {
          id: `${district.sectorId ?? district.clusterIndex}-media-right-anchor`,
          position: [432, 12, baseZ - 214] as [number, number, number],
          size: [52, 24, 44] as [number, number, number],
          color: '#7f93a0',
        },
      ];
    });

    return filterReservedSponsorFrontageEntries(entries, boothPlacements, { frontDepth: 480, rearDepth: 180, sideWidth: 220, radius: 280 });
  }, [districtPrograms, boothPlacements]);

  const mediaWallSupportBlocks = useMemo(() => {
    const entries = districtPrograms.slice(0, Math.max(3, districtPrograms.length)).flatMap((district, districtIndex) => {
      const baseZ = -160 - (districtIndex * districtStride);
      return [
        {
          id: `${district.sectorId ?? district.clusterIndex}-media-left-buttress-a`,
          position: [-646, 0, baseZ + 116] as [number, number, number],
          size: [64, 118, 64] as [number, number, number],
          color: '#879aa7',
        },
        {
          id: `${district.sectorId ?? district.clusterIndex}-media-left-buttress-b`,
          position: [-602, 0, baseZ - 228] as [number, number, number],
          size: [52, 92, 72] as [number, number, number],
          color: '#91a4b0',
        },
        {
          id: `${district.sectorId ?? district.clusterIndex}-media-right-buttress-a`,
          position: [646, 0, baseZ + 104] as [number, number, number],
          size: [64, 118, 64] as [number, number, number],
          color: '#879aa7',
        },
        {
          id: `${district.sectorId ?? district.clusterIndex}-media-right-buttress-b`,
          position: [606, 0, baseZ - 236] as [number, number, number],
          size: [52, 92, 72] as [number, number, number],
          color: '#91a4b0',
        },
      ];
    });

    return filterReservedSponsorFrontageEntries(entries, boothPlacements, { frontDepth: 500, rearDepth: 200, sideWidth: 240, radius: 300 });
  }, [districtPrograms, boothPlacements]);

  const showcasePlazas = useMemo(() => {
    const entries = districtPrograms.slice(0, Math.max(3, districtPrograms.length)).flatMap((district, districtIndex) => {
      const baseZ = -182 - (districtIndex * districtStride);
      return [
        { id: `${district.sectorId ?? district.clusterIndex}-showcase-main`, position: [0, 0.019, baseZ + 148] as [number, number, number], size: [176, 82] as [number, number], color: '#f0f5f8' },
        { id: `${district.sectorId ?? district.clusterIndex}-showcase-left`, position: [-134, 0.018, baseZ + 66] as [number, number, number], size: [82, 108] as [number, number], color: '#dfe8ee' },
        { id: `${district.sectorId ?? district.clusterIndex}-showcase-right`, position: [134, 0.018, baseZ + 52] as [number, number, number], size: [82, 108] as [number, number], color: '#dfe8ee' },
      ];
    });

    return filterReservedSponsorFrontageEntries(entries, boothPlacements, { frontDepth: 420, rearDepth: 180, sideWidth: 180, radius: 220 });
  }, [districtPrograms, boothPlacements]);

  const boothForecourtPlanes = useMemo(() => {
    const entries = districtPrograms.slice(0, Math.max(3, districtPrograms.length)).flatMap((district, districtIndex) => {
      const baseZ = -186 - (districtIndex * districtStride);
      return [
        {
          id: `${district.sectorId ?? district.clusterIndex}-booth-court-left-main`,
          position: [-238, 0.019, baseZ + 42] as [number, number, number],
          size: [124, 182] as [number, number],
          color: '#eef4f8',
        },
        {
          id: `${district.sectorId ?? district.clusterIndex}-booth-court-left-pocket`,
          position: [-334, 0.018, baseZ - 58] as [number, number, number],
          size: [108, 126] as [number, number],
          color: '#dce7ee',
        },
        {
          id: `${district.sectorId ?? district.clusterIndex}-booth-court-right-main`,
          position: [238, 0.019, baseZ + 34] as [number, number, number],
          size: [124, 182] as [number, number],
          color: '#eef4f8',
        },
        {
          id: `${district.sectorId ?? district.clusterIndex}-booth-court-right-pocket`,
          position: [334, 0.018, baseZ - 66] as [number, number, number],
          size: [108, 126] as [number, number],
          color: '#dce7ee',
        },
      ];
    });

    return filterReservedSponsorFrontageEntries(entries, boothPlacements, { frontDepth: 340, rearDepth: 160, sideWidth: 160, radius: 180 });
  }, [districtPrograms, boothPlacements, districtStride]);

  const boothNodePavilions = useMemo(() => {
    const entries = districtPrograms.slice(0, Math.max(3, districtPrograms.length)).flatMap((district, districtIndex) => {
      const baseZ = -196 - (districtIndex * districtStride);
      return [
        {
          id: `${district.sectorId ?? district.clusterIndex}-booth-pavilion-left-anchor`,
          position: [-258, 0, baseZ + 28] as [number, number, number],
          size: [58, 8, 58] as [number, number, number],
          color: '#c9d6de',
        },
        {
          id: `${district.sectorId ?? district.clusterIndex}-booth-pavilion-left-tower`,
          position: [-318, 0, baseZ + 102] as [number, number, number],
          size: [18, 54, 18] as [number, number, number],
          color: '#8ea2af',
        },
        {
          id: `${district.sectorId ?? district.clusterIndex}-booth-pavilion-right-anchor`,
          position: [258, 0, baseZ + 24] as [number, number, number],
          size: [58, 8, 58] as [number, number, number],
          color: '#c9d6de',
        },
        {
          id: `${district.sectorId ?? district.clusterIndex}-booth-pavilion-right-tower`,
          position: [318, 0, baseZ + 94] as [number, number, number],
          size: [18, 54, 18] as [number, number, number],
          color: '#8ea2af',
        },
      ];
    });

    return filterReservedSponsorFrontageEntries(entries, boothPlacements, { frontDepth: 340, rearDepth: 180, sideWidth: 160, radius: 200 });
  }, [districtPrograms, boothPlacements, districtStride]);

  const rightSupportBlocks = useMemo(() => {
    const entries = districtPrograms.slice(0, Math.max(3, districtPrograms.length)).flatMap((district, districtIndex) => {
      const baseZ = -196 - (districtIndex * districtStride);
      return [
        {
          id: `${district.sectorId ?? district.clusterIndex}-right-support-front`,
          position: [332, 20, baseZ + 72] as [number, number, number],
          size: [84, 40, 78] as [number, number, number],
          color: '#6d808d',
        },
        {
          id: `${district.sectorId ?? district.clusterIndex}-right-support-rear`,
          position: [452, 48, baseZ - 214] as [number, number, number],
          size: [112, 96, 118] as [number, number, number],
          color: '#80929f',
        },
      ];
    });

    return filterReservedSponsorFrontageEntries(entries, boothPlacements, { frontDepth: 540, rearDepth: 220, sideWidth: 280, radius: 340 });
  }, [districtPrograms, boothPlacements]);

  const showcaseLandmarkBlocks = useMemo(() => {
    const entries = districtPrograms.slice(0, Math.max(3, districtPrograms.length)).flatMap((district, districtIndex) => {
      const baseZ = -196 - (districtIndex * districtStride);
      return [
        {
          id: `${district.sectorId ?? district.clusterIndex}-showcase-plinth-left`,
          position: [-112, 0, baseZ - 18] as [number, number, number],
          size: [104, 30, 82] as [number, number, number],
          color: '#a0b0bc',
        },
        {
          id: `${district.sectorId ?? district.clusterIndex}-showcase-plinth-right`,
          position: [112, 0, baseZ - 24] as [number, number, number],
          size: [104, 30, 82] as [number, number, number],
          color: '#a0b0bc',
        },
        {
          id: `${district.sectorId ?? district.clusterIndex}-showcase-beacon-left`,
          position: [-126, 0, baseZ + 112] as [number, number, number],
          size: [32, 96, 32] as [number, number, number],
          color: '#8799a6',
        },
        {
          id: `${district.sectorId ?? district.clusterIndex}-showcase-beacon-right`,
          position: [126, 0, baseZ + 102] as [number, number, number],
          size: [32, 88, 32] as [number, number, number],
          color: '#8799a6',
        },
      ];
    });

    return filterReservedSponsorFrontageEntries(entries, boothPlacements, { frontDepth: 420, rearDepth: 180, sideWidth: 180, radius: 220 });
  }, [districtPrograms, boothPlacements]);

  const showcaseHeroLandmarks = useMemo(() => {
    const entries = districtPrograms.slice(0, Math.max(3, districtPrograms.length)).flatMap((district, districtIndex) => {
      const baseZ = -196 - (districtIndex * districtStride);
      return [
        {
          id: `${district.sectorId ?? district.clusterIndex}-showcase-hero-left-spire`,
          position: [-208, 0, baseZ - 18] as [number, number, number],
          size: [42, 196, 42] as [number, number, number],
          color: '#7f92a0',
        },
        {
          id: `${district.sectorId ?? district.clusterIndex}-showcase-hero-right-spire`,
          position: [208, 0, baseZ - 14] as [number, number, number],
          size: [42, 188, 42] as [number, number, number],
          color: '#7f92a0',
        },
        {
          id: `${district.sectorId ?? district.clusterIndex}-showcase-hero-left-cap`,
          position: [-208, 0, baseZ - 18] as [number, number, number],
          size: [20, 56, 20] as [number, number, number],
          color: '#bcc8d0',
        },
        {
          id: `${district.sectorId ?? district.clusterIndex}-showcase-hero-right-cap`,
          position: [208, 0, baseZ - 14] as [number, number, number],
          size: [20, 52, 20] as [number, number, number],
          color: '#bcc8d0',
        },
        {
          id: `${district.sectorId ?? district.clusterIndex}-showcase-hero-sculpture-left`,
          position: [-74, 0, baseZ - 84] as [number, number, number],
          size: [48, 116, 48] as [number, number, number],
          color: '#93a6b2',
        },
        {
          id: `${district.sectorId ?? district.clusterIndex}-showcase-hero-sculpture-right`,
          position: [74, 0, baseZ - 96] as [number, number, number],
          size: [48, 116, 48] as [number, number, number],
          color: '#93a6b2',
        },
      ];
    });

    return filterReservedSponsorFrontageEntries(entries, boothPlacements, { frontDepth: 420, rearDepth: 180, sideWidth: 180, radius: 220 });
  }, [districtPrograms, boothPlacements]);

  const showcaseForumTerraces = useMemo(() => {
    const entries = districtPrograms.slice(0, Math.max(3, districtPrograms.length)).flatMap((district, districtIndex) => {
      const baseZ = -196 - (districtIndex * districtStride);
      return [
        {
          id: `${district.sectorId ?? district.clusterIndex}-forum-terrace-lower`,
          position: [0, 0, baseZ + 126] as [number, number, number],
          size: [286, 18, 128] as [number, number, number],
          color: '#e2ebf1',
        },
        {
          id: `${district.sectorId ?? district.clusterIndex}-forum-terrace-mid`,
          position: [0, 0, baseZ + 84] as [number, number, number],
          size: [214, 18, 84] as [number, number, number],
          color: '#d4e0e8',
        },
        {
          id: `${district.sectorId ?? district.clusterIndex}-forum-terrace-upper`,
          position: [0, 0, baseZ + 42] as [number, number, number],
          size: [148, 18, 54] as [number, number, number],
          color: '#c6d4de',
        },
      ];
    });

    return filterReservedSponsorFrontageEntries(entries, boothPlacements, { frontDepth: 420, rearDepth: 180, sideWidth: 180, radius: 220 });
  }, [districtPrograms, boothPlacements]);

  const discoveryEdgeBlocks = useMemo(() => {
    const districtCount = Math.max(1, districtPrograms.length);
    const endBaseZ = -196 - ((districtCount - 1) * districtStride) - 860;

    return [
      {
        id: 'discovery-anchor-left',
        position: [-768, 82, endBaseZ] as [number, number, number],
        size: [176, 164, 148] as [number, number, number],
        color: '#81919d',
      },
      {
        id: 'discovery-anchor-right',
        position: [768, 88, endBaseZ - 64] as [number, number, number],
        size: [188, 176, 156] as [number, number, number],
        color: '#8394a0',
      },
      {
        id: 'discovery-hero-plinth-left',
        position: [-124, 28, endBaseZ - 138] as [number, number, number],
        size: [132, 56, 74] as [number, number, number],
          color: '#94a6b2',
        },
        {
          id: 'discovery-hero-plinth-right',
          position: [124, 28, endBaseZ - 166] as [number, number, number],
          size: [132, 56, 74] as [number, number, number],
          color: '#94a6b2',
        },
        {
          id: 'discovery-landmark-wall-left',
          position: [-226, 76, endBaseZ - 236] as [number, number, number],
          size: [114, 152, 28] as [number, number, number],
          color: '#5d7282',
        },
        {
          id: 'discovery-landmark-wall-right',
          position: [226, 74, endBaseZ - 264] as [number, number, number],
          size: [114, 148, 28] as [number, number, number],
          color: '#5d7282',
        },
      ];
  }, [districtPrograms.length]);

  const supportEdgeBlocks = useMemo(() => {
    const districtCount = Math.max(3, districtPrograms.length);
    return Array.from({ length: districtCount }, (_, districtIndex) => {
      const baseZ = -244 - (districtIndex * districtStride);
      return [
        {
          id: `support-edge-left-${districtIndex}`,
          position: [-908, 0, baseZ - 64] as [number, number, number],
          size: [118, 92, 142] as [number, number, number],
          color: '#97a7b2',
        },
        {
          id: `support-edge-right-${districtIndex}`,
          position: [908, 0, baseZ - 92] as [number, number, number],
          size: [124, 104, 148] as [number, number, number],
          color: '#9aabb6',
        },
      ];
    }).flat();
  }, [districtPrograms.length, districtStride]);

  const discoveryLandmarks = useMemo(() => {
    const districtCount = Math.max(1, districtPrograms.length);
    const endBaseZ = -196 - ((districtCount - 1) * districtStride) - 980;

    return [
      {
        id: 'discovery-spire-main',
        position: [0, 0, endBaseZ] as [number, number, number],
        size: [84, 324, 84] as [number, number, number],
        color: '#6f8594',
      },
      {
        id: 'discovery-spire-cap',
        position: [0, 0, endBaseZ] as [number, number, number],
        size: [34, 104, 34] as [number, number, number],
        color: '#c3d0d8',
      },
      {
        id: 'discovery-flank-left',
        position: [-214, 0, endBaseZ + 92] as [number, number, number],
        size: [92, 142, 58] as [number, number, number],
        color: '#8da0ad',
      },
      {
        id: 'discovery-flank-right',
        position: [214, 0, endBaseZ + 64] as [number, number, number],
        size: [92, 148, 58] as [number, number, number],
        color: '#8da0ad',
      },
    ];
  }, [districtPrograms.length, districtStride]);

  const discoverySupportTerraces = useMemo(() => {
    const districtCount = Math.max(1, districtPrograms.length);
    const endBaseZ = -196 - ((districtCount - 1) * districtStride) - 860;

    return [
      {
        id: 'discovery-terrace-left',
        position: [-364, 0, endBaseZ + 168] as [number, number, number],
        size: [244, 84, 168] as [number, number, number],
        color: '#a4b5c0',
      },
      {
        id: 'discovery-terrace-right',
        position: [364, 0, endBaseZ + 142] as [number, number, number],
        size: [244, 92, 168] as [number, number, number],
        color: '#a4b5c0',
      },
      {
        id: 'discovery-terrace-center',
        position: [0, 0, endBaseZ + 86] as [number, number, number],
        size: [320, 54, 124] as [number, number, number],
        color: '#c7d3db',
      },
    ];
  }, [districtPrograms.length, districtStride]);

  const civicWaterCourt = useMemo(() => ([
    {
      id: 'arrival-water-court-main',
      position: [0, 0.026, -6] as [number, number, number],
      size: [118, 228] as [number, number],
      color: '#9fd3e7',
    },
    {
      id: 'arrival-water-court-left',
      position: [-182, 0.026, 22] as [number, number, number],
      size: [52, 126] as [number, number],
      color: '#9fd3e7',
    },
    {
      id: 'arrival-water-court-right',
      position: [182, 0.026, 12] as [number, number, number],
      size: [52, 126] as [number, number],
      color: '#9fd3e7',
    },
  ]), []);

  const sideBoothBoulevards = useMemo(() => {
    const districtCount = Math.max(3, districtPrograms.length);
    return Array.from({ length: districtCount }, (_, districtIndex) => {
      const baseZ = -196 - (districtIndex * districtStride);
      return [
        {
          id: `booth-boulevard-left-plinth-a-${districtIndex}`,
          position: [-268, 0, baseZ + 64] as [number, number, number],
          size: [84, 8, 124] as [number, number, number],
          color: '#d5e0e7',
        },
        {
          id: `booth-boulevard-left-plinth-b-${districtIndex}`,
          position: [-312, 0, baseZ - 118] as [number, number, number],
          size: [62, 10, 92] as [number, number, number],
          color: '#c3d1db',
        },
        {
          id: `booth-boulevard-right-plinth-a-${districtIndex}`,
          position: [268, 0, baseZ + 56] as [number, number, number],
          size: [84, 8, 124] as [number, number, number],
          color: '#d5e0e7',
        },
        {
          id: `booth-boulevard-right-plinth-b-${districtIndex}`,
          position: [312, 0, baseZ - 126] as [number, number, number],
          size: [62, 10, 92] as [number, number, number],
          color: '#c3d1db',
        },
        {
          id: `booth-boulevard-left-beacon-${districtIndex}`,
          position: [-224, 0, baseZ - 6] as [number, number, number],
          size: [14, 72, 14] as [number, number, number],
          color: '#8ea2af',
        },
        {
          id: `booth-boulevard-right-beacon-${districtIndex}`,
          position: [224, 0, baseZ - 14] as [number, number, number],
          size: [14, 72, 14] as [number, number, number],
          color: '#8ea2af',
        },
      ];
    }).flat();
  }, [districtPrograms.length, districtStride]);

  const signatureMegaLandmarks = useMemo(() => {
    const districtCount = Math.max(1, districtPrograms.length);
    const boulevardCenterZ = -196 - (Math.min(1, districtCount - 1) * districtStride) - 122;
    return [
      {
        id: 'signature-mega-pylon-left',
        position: [-418, 0, boulevardCenterZ + 24] as [number, number, number],
        size: [72, 362, 72] as [number, number, number],
        color: '#748998',
      },
      {
        id: 'signature-mega-pylon-right',
        position: [418, 0, boulevardCenterZ - 18] as [number, number, number],
        size: [72, 348, 72] as [number, number, number],
        color: '#748998',
      },
      {
        id: 'signature-mega-left-bridge-wing',
        position: [-236, 0, boulevardCenterZ + 12] as [number, number, number],
        size: [324, 28, 54] as [number, number, number],
        color: '#c4d1d9',
      },
      {
        id: 'signature-mega-right-bridge-wing',
        position: [236, 0, boulevardCenterZ - 10] as [number, number, number],
        size: [324, 28, 54] as [number, number, number],
        color: '#c4d1d9',
      },
      {
        id: 'signature-mega-left-plinth',
        position: [-236, 0, boulevardCenterZ + 88] as [number, number, number],
        size: [184, 18, 92] as [number, number, number],
        color: '#8fa2af',
      },
      {
        id: 'signature-mega-right-plinth',
        position: [236, 0, boulevardCenterZ - 84] as [number, number, number],
        size: [184, 18, 92] as [number, number, number],
        color: '#8fa2af',
      },
      {
        id: 'signature-mega-spire-left',
        position: [-142, 0, boulevardCenterZ - 112] as [number, number, number],
        size: [42, 214, 42] as [number, number, number],
        color: '#8ca0ae',
      },
      {
        id: 'signature-mega-spire-right',
        position: [142, 0, boulevardCenterZ - 136] as [number, number, number],
        size: [42, 196, 42] as [number, number, number],
        color: '#8ca0ae',
      },
    ];
  }, [districtPrograms.length, districtStride]);

  const discoverySkybridge = useMemo(() => {
    const districtCount = Math.max(1, districtPrograms.length);
    const endBaseZ = -196 - ((districtCount - 1) * districtStride) - 900;

    return [
      {
        id: 'discovery-skybridge-left-pylon',
        position: [-282, 0, endBaseZ + 48] as [number, number, number],
        size: [48, 196, 48] as [number, number, number],
        color: '#7c92a1',
      },
      {
        id: 'discovery-skybridge-right-pylon',
        position: [282, 0, endBaseZ + 20] as [number, number, number],
        size: [48, 196, 48] as [number, number, number],
        color: '#7c92a1',
      },
      {
        id: 'discovery-skybridge-span',
        position: [0, 0, endBaseZ + 34] as [number, number, number],
        size: [612, 28, 42] as [number, number, number],
        color: '#c4d1d9',
      },
      {
        id: 'discovery-skybridge-underdeck',
        position: [0, 0, endBaseZ + 34] as [number, number, number],
        size: [440, 12, 58] as [number, number, number],
        color: '#8ea2af',
      },
    ];
  }, [districtPrograms.length, districtStride]);

  const cleanTowerLandmarks = useMemo(() => {
    const entries = districtPrograms.slice(0, Math.max(3, districtPrograms.length)).flatMap((district, districtIndex) => {
      const baseZ = -196 - (districtIndex * districtStride);
      return [
        {
          id: `${district.sectorId ?? district.clusterIndex}-hero-tower-left`,
          position: [-532, 106, baseZ - 284] as [number, number, number],
          baseSize: [46, 212, 34] as [number, number, number],
          upperSize: [34, 86, 26] as [number, number, number],
          color: '#617583',
          crownColor: visualProfile.global.hudAccent,
        },
        {
          id: `${district.sectorId ?? district.clusterIndex}-hero-tower-right`,
          position: [532, 116, baseZ - 332] as [number, number, number],
          baseSize: [52, 232, 38] as [number, number, number],
          upperSize: [38, 96, 28] as [number, number, number],
          color: '#647887',
          crownColor: visualProfile.global.hudAccent,
        },
        {
          id: `${district.sectorId ?? district.clusterIndex}-mid-tower-left`,
          position: [-262, 74, baseZ - 96] as [number, number, number],
          baseSize: [30, 148, 24] as [number, number, number],
          upperSize: [22, 54, 18] as [number, number, number],
          color: '#718391',
          crownColor: '#d7e2ea',
        },
        {
          id: `${district.sectorId ?? district.clusterIndex}-mid-tower-right`,
          position: [262, 70, baseZ - 128] as [number, number, number],
          baseSize: [30, 140, 24] as [number, number, number],
          upperSize: [22, 48, 18] as [number, number, number],
          color: '#718391',
          crownColor: '#d7e2ea',
        },
      ];
    });

    return filterReservedSponsorFrontageEntries(entries, boothPlacements, { frontDepth: 620, rearDepth: 260, sideWidth: 300, radius: 420 });
  }, [districtPrograms, boothPlacements, visualProfile.global.hudAccent]);

  return (
    <group name="clean-expo-city-skeleton">
      {arrivalPlanes.map((plane) => (
        <mesh key={plane.id} position={plane.position} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={plane.size} />
          <meshStandardMaterial color={plane.color} roughness={0.72} metalness={0.04} />
        </mesh>
      ))}

      {promenadeAxisPlanes.map((plane) => (
        <mesh key={plane.id} position={plane.position} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={plane.size} />
          <meshStandardMaterial color={plane.color} roughness={0.68} metalness={0.04} />
        </mesh>
      ))}

      {[...showcasePlazas, ...boothForecourtPlanes]
        .filter((plane) => !overlapsStadiumReserve(plane.position, stadiumReserve, plane.size))
        .map((plane) => (
          <mesh key={plane.id} position={plane.position} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
            <planeGeometry args={plane.size} />
            <meshStandardMaterial color={plane.color} roughness={0.7} metalness={0.04} />
          </mesh>
        ))}

      {civicWaterCourt.map((plane) => (
        <mesh key={plane.id} position={plane.position} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={plane.size} />
          <meshStandardMaterial color={plane.color} emissive={plane.color} emissiveIntensity={0.08} roughness={0.22} metalness={0.12} transparent opacity={0.92} />
        </mesh>
      ))}

      {[...arrivalGatewayBlocks, ...arrivalLandmarkBlocks, ...arrivalSupportBlocks, ...boulevardEdgeBlocks, ...mediaWallBlocks, ...mediaWallSupportBlocks, ...showcaseLandmarkBlocks, ...showcaseHeroLandmarks, ...showcaseForumTerraces, ...sideBoothBoulevards, ...boothNodePavilions, ...signatureMegaLandmarks, ...rightSupportBlocks, ...supportEdgeBlocks, ...discoveryEdgeBlocks, ...discoveryLandmarks, ...discoverySupportTerraces, ...discoverySkybridge]
        .filter((mass) => !overlapsStadiumReserve(mass.position, stadiumReserve, mass.size))
        .map((mass) => (
          <group key={mass.id} position={[mass.position[0], 0, mass.position[2]]}>
            <mesh castShadow receiveShadow position={[0, mass.size[1] * 0.5, 0]}>
              <boxGeometry args={mass.size} />
              <ExpoArchitecturalMassMaterial fallbackColor={mass.color} />
            </mesh>
          </group>
        ))}

      {cleanTowerLandmarks
        .filter((tower) => !overlapsStadiumReserve(tower.position, stadiumReserve, tower.baseSize))
        .map((tower) => (
          <group key={tower.id} position={[tower.position[0], 0, tower.position[2]]}>
            <mesh castShadow receiveShadow position={[0, tower.baseSize[1] * 0.5, 0]}>
              <boxGeometry args={tower.baseSize} />
              <ExpoArchitecturalMassMaterial fallbackColor={tower.color} emissive={tower.crownColor} emissiveIntensity={0.01} />
            </mesh>
            <mesh position={[0, tower.baseSize[1] + (tower.upperSize[1] * 0.5) - 18, 0]} castShadow receiveShadow>
              <boxGeometry args={tower.upperSize} />
              <ExpoArchitecturalMassMaterial fallbackColor="#94a6b2" emissive={tower.crownColor} emissiveIntensity={0.012} />
            </mesh>
            <mesh position={[0, tower.baseSize[1] + tower.upperSize[1] - 8, 0]} castShadow>
              <boxGeometry args={[tower.baseSize[0] * 0.62, 1.8, tower.baseSize[2] * 0.62]} />
              <meshStandardMaterial color={tower.crownColor} metalness={0.12} roughness={0.44} />
            </mesh>
          </group>
        ))}
    </group>
  );
}

function ExpoRearCampus({
  boothPlacements,
  visualProfile,
}: {
  boothPlacements: ExpoBoothPlacement[];
  visualProfile: ExpoWorldVisualProfile;
}) {
  const campusColliderRef = useRef<THREE.Group>(null);
  const footprint = boothPlacements[0]?.layoutFootprint;
  const minZ = footprint?.minZ ?? -1400;
  const routeEndZ = minZ - 720;
  const campusCenterZ = minZ - 1480;
  const accent = visualProfile.global.hudAccent;
  usePlayerColliderRegistration(campusColliderRef, 'rear-campus-collider');
  const backStandZ = -1700;
  const towerX = 1520;
  const towerZ = 1500;
  const perimeterHalfX = 2860;
  const perimeterBackZ = -2500;
  const enableHeavyShadows = EXPO_FEATURE_FLAGS.enableShowcaseSkylineDensity;
  const stadiumForecourts = [
    { id: 'stadium-forecourt-left-main', position: [-860, 5.98, campusCenterZ + 520] as [number, number, number], size: [680, 980] as [number, number], color: '#eef4f8' },
    { id: 'stadium-forecourt-left-inner', position: [-520, 6.02, campusCenterZ + 140] as [number, number, number], size: [320, 520] as [number, number], color: '#dfe8ee' },
    { id: 'stadium-forecourt-right-main', position: [860, 5.98, campusCenterZ + 520] as [number, number, number], size: [680, 980] as [number, number], color: '#eef4f8' },
    { id: 'stadium-forecourt-right-inner', position: [520, 6.02, campusCenterZ + 120] as [number, number, number], size: [320, 520] as [number, number], color: '#dfe8ee' },
  ] as const;
  return (
    <group name="expo-rear-campus">
      <mesh position={[0, 0.02, routeEndZ + 240]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[1180, 2760]} />
        <ExpoRuntimeSurfaceMaterial fallbackColor="#e4ebf1" repeat={[2.4, 7.8]} surface="paver" />
      </mesh>
      <mesh position={[0, 0.02, campusCenterZ]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[6200, 4400]} />
        <ExpoRuntimeSurfaceMaterial fallbackColor="#edf3f8" repeat={[11.2, 8.2]} surface="concrete" />
      </mesh>
      <mesh position={[0, 0.024, campusCenterZ + 820]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[2600, 1500]} />
        <ExpoRuntimeSurfaceMaterial fallbackColor="#f6fafc" repeat={[5.2, 3.2]} surface="concrete" />
      </mesh>
      <mesh position={[0, 5.2, routeEndZ]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[1240, 220]} />
        <ExpoRuntimeSurfaceMaterial fallbackColor="#73889b" repeat={[3.4, 1.1]} surface="paver" />
      </mesh>
      <mesh position={[0, 5.92, campusCenterZ + 540]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[1380, 2140]} />
        <ExpoRuntimeSurfaceMaterial fallbackColor="#f8fbfd" repeat={[3.4, 4.4]} surface="concrete" />
      </mesh>
      <mesh position={[0, 6.34, campusCenterZ + 980]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[1960, 640]} />
        <ExpoRuntimeSurfaceMaterial fallbackColor="#d8e4ec" repeat={[4.2, 1.8]} surface="paver" />
      </mesh>
      {stadiumForecourts.map((plane) => (
        <mesh key={plane.id} position={plane.position} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={plane.size} />
          <meshStandardMaterial color={plane.color} roughness={0.72} metalness={0.04} />
        </mesh>
      ))}
      <group position={[0, 0, campusCenterZ]}>
        <mesh position={[0, 6.08, -40]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <circleGeometry args={[3080, 112]} />
          <ExpoRuntimeSurfaceMaterial fallbackColor="#94a7b6" repeat={[6.8, 6.8]} surface="concrete" />
        </mesh>
        <mesh position={[0, 6.3, -40]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <circleGeometry args={[2120, 88]} />
          <ExpoRuntimeSurfaceMaterial fallbackColor="#ffffff" repeat={[4.8, 4.8]} surface="concrete" />
        </mesh>
        <mesh position={[0, 6.54, -40]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <ringGeometry args={[2120, 2540, 96]} />
          <ExpoRuntimeSurfaceMaterial fallbackColor="#d8e3ea" repeat={[5.8, 5.8]} surface="paver" />
        </mesh>
        <mesh position={[0, 6.82, -40]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <ringGeometry args={[1860, 2000, 96]} />
          <ExpoRuntimeSurfaceMaterial fallbackColor="#9eb2c0" repeat={[4.8, 4.8]} surface="paver" />
        </mesh>
        <mesh position={[0, 26, -40]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <ringGeometry args={[2440, 2720, 96]} />
          <meshStandardMaterial color="#cbd8e0" roughness={0.56} metalness={0.06} />
        </mesh>
        {[-1, 1].map((side) => (
          <group key={`rear-campus-gateway-${side}`} position={[side * 1260, 0, 980]}>
            <mesh position={[0, 168, 0]} castShadow={enableHeavyShadows} receiveShadow>
              <boxGeometry args={[126, 336, 126]} />
              <ExpoArchitecturalMassMaterial fallbackColor="#8095a6" repeat={[1.2, 1.2]} />
            </mesh>
            <mesh position={[0, 296, 0]} castShadow={enableHeavyShadows} receiveShadow>
              <boxGeometry args={[224, 34, 78]} />
              <ExpoArchitecturalMassMaterial fallbackColor="#c8d4dc" repeat={[1.4, 1.2]} />
            </mesh>
          </group>
        ))}
        {[-1, 1].map((side) => (
          <group key={`rear-campus-side-wall-${side}`} position={[side * 1540, 0, -260]}>
            <mesh position={[0, 188, 0]} castShadow={enableHeavyShadows} receiveShadow>
              <boxGeometry args={[188, 376, 2780]} />
              <ExpoArchitecturalMassMaterial fallbackColor="#97a9b6" repeat={[1.8, 7.8]} />
            </mesh>
            <mesh position={[side > 0 ? -74 : 74, 264, 0]} castShadow={enableHeavyShadows} receiveShadow>
              <boxGeometry args={[42, 124, 2120]} />
              <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.16} roughness={0.22} metalness={0.16} />
            </mesh>
          </group>
        ))}
        {[-1, 1].flatMap((side) =>
          [-760, 180, 1080].map((zOffset, index) => (
            <group key={`rear-campus-side-pavilion-${side}-${index}`} position={[side * 1160, 0, zOffset]}>
              <mesh position={[0, 84, 0]} castShadow={enableHeavyShadows} receiveShadow>
                <boxGeometry args={[244, 168, 188]} />
                <ExpoArchitecturalMassMaterial fallbackColor={index === 1 ? '#aebdc8' : '#a2b4c0'} repeat={[1.6, 1.6]} />
              </mesh>
              <mesh position={[0, 164, side > 0 ? -58 : 58]} castShadow={enableHeavyShadows} receiveShadow>
                <boxGeometry args={[184, 24, 48]} />
                <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.12} roughness={0.24} metalness={0.14} />
              </mesh>
            </group>
          ))
        )}
        <group position={[0, 0, backStandZ + 180]}>
          <mesh position={[0, 208, 0]} rotation={[-0.08, 0, 0]} castShadow={enableHeavyShadows} receiveShadow>
            <boxGeometry args={[3260, 416, 920]} />
            <ExpoArchitecturalMassMaterial fallbackColor="#9eb1bf" repeat={[8.2, 2.4]} />
          </mesh>
          <mesh position={[0, 378, -88]} rotation={[-0.12, 0, 0]} castShadow={enableHeavyShadows} receiveShadow>
            <boxGeometry args={[2680, 144, 640]} />
            <ExpoArchitecturalMassMaterial fallbackColor="#c9d5de" repeat={[6.8, 1.8]} />
          </mesh>
          <mesh position={[0, 498, -146]} rotation={[-0.16, 0, 0]} castShadow={enableHeavyShadows} receiveShadow>
            <boxGeometry args={[2140, 104, 420]} />
            <ExpoArchitecturalMassMaterial fallbackColor="#eef4f7" repeat={[5.4, 1.4]} />
          </mesh>
          <mesh position={[0, 306, 264]} rotation={[-0.06, 0, 0]}>
            <boxGeometry args={[2480, 48, 56]} />
            <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.16} roughness={0.24} metalness={0.14} />
          </mesh>
        </group>
        {[-1120, 1120].map((x) => (
          <group key={`rear-campus-concourse-node-${x}`} position={[x, 0, 620]}>
            <mesh position={[0, 72, 0]} castShadow={enableHeavyShadows} receiveShadow>
              <boxGeometry args={[188, 144, 188]} />
              <ExpoArchitecturalMassMaterial fallbackColor="#a5b6c1" repeat={[1.4, 1.4]} />
            </mesh>
            <mesh position={[0, 138, 0]} castShadow={enableHeavyShadows} receiveShadow>
              <boxGeometry args={[132, 18, 132]} />
              <ExpoArchitecturalMassMaterial fallbackColor="#dbe5ec" repeat={[1.2, 1.2]} />
            </mesh>
          </group>
        ))}
        {[-1, 1].map((side) => (
          <group key={`rear-campus-terrace-${side}`} position={[side * 520, 0, -1160]}>
            <mesh position={[0, 54, 0]} castShadow={enableHeavyShadows} receiveShadow>
              <boxGeometry args={[540, 108, 260]} />
              <ExpoArchitecturalMassMaterial fallbackColor="#a9bac5" repeat={[2.2, 1.8]} />
            </mesh>
            <mesh position={[0, 114, -42]} castShadow={enableHeavyShadows} receiveShadow>
              <boxGeometry args={[420, 24, 168]} />
              <ExpoArchitecturalMassMaterial fallbackColor="#d3dee6" repeat={[1.8, 1.2]} />
            </mesh>
          </group>
        ))}
        {[-1, 1].flatMap((xSide) =>
          ([-1, 1] as const).map((zSide) => (
            <group key={`rear-campus-landmark-tower-${xSide}-${zSide}`} position={[xSide * towerX, 0, zSide * towerZ]}>
              <mesh position={[0, 620, 0]} castShadow={enableHeavyShadows} receiveShadow>
                <boxGeometry args={[132, 1240, 132]} />
                <ExpoArchitecturalMassMaterial fallbackColor="#708596" repeat={[1.4, 1.4]} />
              </mesh>
              <mesh position={[0, 1170, 0]} castShadow={enableHeavyShadows} receiveShadow>
                <boxGeometry args={[248, 76, 248]} />
                <ExpoArchitecturalMassMaterial fallbackColor="#b7c5ce" repeat={[1.6, 1.6]} />
              </mesh>
              <mesh position={[0, 960, zSide > 0 ? -44 : 44]} rotation={[0, zSide > 0 ? Math.PI : 0, 0]}>
                <planeGeometry args={[660, 360]} />
                <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.24} roughness={0.18} metalness={0.18} />
              </mesh>
              <mesh position={[xSide > 0 ? -44 : 44, 960, 0]} rotation={[0, xSide > 0 ? Math.PI * 0.5 : -Math.PI * 0.5, 0]}>
                <planeGeometry args={[660, 360]} />
                <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.24} roughness={0.18} metalness={0.18} />
              </mesh>
            </group>
          ))
        )}
        <mesh position={[0, 10, 760]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[1380, 1880]} />
          <ExpoRuntimeSurfaceMaterial fallbackColor="#edf3f7" repeat={[3.6, 4.2]} surface="concrete" />
        </mesh>
        <mesh position={[0, 12, 60]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[1320, 920]} />
          <ExpoRuntimeSurfaceMaterial fallbackColor="#f6fafc" repeat={[3.2, 2.6]} surface="paver" />
        </mesh>
        {[-1, 1].map((side) => (
          <group key={`rear-campus-perimeter-side-${side}`} position={[side * perimeterHalfX, 0, -120]}>
            <mesh position={[0, 24, 0]} castShadow={enableHeavyShadows} receiveShadow>
              <boxGeometry args={[54, 48, 4340]} />
              <ExpoArchitecturalMassMaterial fallbackColor="#c1d0d9" repeat={[1.2, 8.8]} />
            </mesh>
          </group>
        ))}
        <mesh position={[0, 24, perimeterBackZ]} castShadow={enableHeavyShadows} receiveShadow>
          <boxGeometry args={[5760, 48, 60]} />
          <ExpoArchitecturalMassMaterial fallbackColor="#c1d0d9" repeat={[9.8, 1.2]} />
        </mesh>
      </group>
      <group ref={campusColliderRef} name="rear-campus-collider">
        {[-1, 1].map((side) => (
          <mesh key={`rear-campus-side-stand-collider-${side}`} position={[side * 1540, 188, campusCenterZ - 260]} rotation={[0, 0, 0]}>
            <boxGeometry args={[188, 376, 2780]} />
            <ColliderMaterial color="#f97316" />
          </mesh>
        ))}
        {[-1, 1].map((side) => (
          <mesh key={`rear-campus-gateway-collider-${side}`} position={[side * 1260, 168, campusCenterZ + 980]} rotation={[0, 0, 0]}>
            <boxGeometry args={[126, 336, 126]} />
            <ColliderMaterial color="#f97316" />
          </mesh>
        ))}
        <mesh position={[0, 208, campusCenterZ + backStandZ + 180]} rotation={[-0.08, 0, 0]}>
          <boxGeometry args={[3260, 416, 920]} />
          <ColliderMaterial color="#f97316" />
        </mesh>
      </group>
    </group>
  );
}

function ColliderMaterial({ debug, color }: { debug?: boolean; color: string }) {
  return (
    <meshBasicMaterial
      color={color}
      transparent
      opacity={debug ? 0.18 : 0}
      depthWrite={false}
      toneMapped={false}
    />
  );
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

function BoothDebugShellFallback({ accentColor, metrics }: { accentColor: string; metrics: ReturnType<typeof getBoothArchitectureMetrics> }) {
  return (
    <group name="booth-debug-shell-fallback">
      <mesh position={[0, metrics.colliderSize[1] * 0.34, 0]} castShadow>
        <boxGeometry args={[metrics.footprintSize[0] * 0.78, metrics.colliderSize[1] * 0.68, metrics.footprintSize[1] * 0.72]} />
        <meshStandardMaterial color="#0f172a" metalness={0.18} roughness={0.82} />
      </mesh>
      <mesh position={[0, metrics.colliderSize[1] * 0.58, (metrics.footprintSize[1] * 0.36) + 0.22]} castShadow>
        <boxGeometry args={[metrics.footprintSize[0] * 0.64, 1.1, 0.44]} />
        <meshStandardMaterial color={accentColor} emissive={accentColor} emissiveIntensity={0.16} />
      </mesh>
    </group>
  );
}

function OpenBoothPavilion({
  accentColor,
  metrics,
}: {
  accentColor: string;
  metrics: ReturnType<typeof getBoothArchitectureMetrics>;
}) {
  const width = metrics.footprintSize[0] * 0.72;
  const depth = metrics.footprintSize[1] * 0.58;
  const postHeight = Math.max(6.2, metrics.colliderSize[1] * 0.58);
  const postOffsetX = (width * 0.5) - 1.2;
  const postOffsetZ = (depth * 0.5) - 1;

  return (
    <group name="booth-open-pavilion">
      <mesh position={[0, 0.12, 0.4]} receiveShadow>
        <boxGeometry args={[width, 0.24, depth]} />
        <meshStandardMaterial color="#e5edf4" metalness={0.04} roughness={0.74} />
      </mesh>
      {[
        [-postOffsetX, postHeight * 0.5, -postOffsetZ],
        [postOffsetX, postHeight * 0.5, -postOffsetZ],
        [-postOffsetX, postHeight * 0.5, postOffsetZ],
        [postOffsetX, postHeight * 0.5, postOffsetZ],
      ].map((position, index) => (
        <mesh key={`pavilion-post-${index}`} position={position as [number, number, number]} castShadow receiveShadow>
          <boxGeometry args={[0.42, postHeight, 0.42]} />
          <meshStandardMaterial color="#6c8190" metalness={0.18} roughness={0.58} />
        </mesh>
      ))}
      <mesh position={[0, postHeight + 0.22, 0]} castShadow receiveShadow>
        <boxGeometry args={[width + 1.4, 0.32, depth * 0.74]} />
        <meshStandardMaterial color="#c9d6df" metalness={0.1} roughness={0.46} />
      </mesh>
      <mesh position={[0, postHeight + 0.42, (depth * 0.5) - 0.2]} castShadow>
        <boxGeometry args={[width * 0.82, 0.16, 0.22]} />
        <meshStandardMaterial color={accentColor} emissive={accentColor} emissiveIntensity={0.1} roughness={0.42} metalness={0.16} />
      </mesh>
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

function SafeVideo({ url }: { url: string }) {
  const texture = useVideoTexture(url, { crossOrigin: 'anonymous', loop: true, muted: true });
  return <meshBasicMaterial map={texture} toneMapped={false} />;
}

function CustomBoothInsert({ template, url }: { template: SponsorBoothTemplate; url: string }) {
  const { scene } = useGLTF(url);
  const normalizedScene = React.useMemo(() => {
    const clone = scene.clone();
    normalizeModel(clone);
    return clone;
  }, [scene]);
  const metrics = getBoothArchitectureMetrics(template);

  return (
    <group position={metrics.insertPosition} scale={[metrics.insertScale, metrics.insertScale, metrics.insertScale]}>
      <primitive object={normalizedScene} />
    </group>
  );
}

function SponsorShowcaseObject({
  accentColor,
  fallbackMonogram,
  mode,
}: {
  accentColor: string;
  fallbackMonogram: string;
  mode: 'immersive' | 'hero-object' | 'product' | 'support';
}) {
  const turntableRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (turntableRef.current) {
      turntableRef.current.rotation.y += delta * (mode === 'immersive' ? 0.36 : 0.28);
    }
  });

  return (
    <group ref={turntableRef}>
      {mode === 'immersive' && (
        <>
          <mesh castShadow>
            <icosahedronGeometry args={[1.52, 0]} />
            <meshStandardMaterial color="#e9f1f7" metalness={0.28} roughness={0.22} emissive={accentColor} emissiveIntensity={0.08} />
          </mesh>
          <mesh position={[0, -0.12, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[1.98, 0.12, 14, 42]} />
            <meshStandardMaterial color={accentColor} metalness={0.34} roughness={0.28} emissive={accentColor} emissiveIntensity={0.1} />
          </mesh>
        </>
      )}
      {mode === 'hero-object' && (
        <mesh castShadow>
          <cylinderGeometry args={[1.28, 1.62, 3.6, 8]} />
          <meshStandardMaterial color="#ecf3f8" metalness={0.18} roughness={0.28} emissive={accentColor} emissiveIntensity={0.05} />
        </mesh>
      )}
      {mode === 'product' && (
        <mesh castShadow rotation={[0.12, 0.24, 0]}>
          <boxGeometry args={[2.18, 2.18, 2.18]} />
          <meshStandardMaterial color="#eef4f8" metalness={0.12} roughness={0.32} emissive={accentColor} emissiveIntensity={0.04} />
        </mesh>
      )}
      {mode === 'support' && (
        <mesh castShadow rotation={[0, 0.4, 0]}>
          <octahedronGeometry args={[1.42, 0]} />
          <meshStandardMaterial color="#dde7ee" metalness={0.1} roughness={0.42} emissive={accentColor} emissiveIntensity={0.03} />
        </mesh>
      )}
      <Text position={[0, -2.08, 0.1]} fontSize={0.68} color={accentColor} anchorX="center" anchorY="middle">
        {fallbackMonogram}
      </Text>
    </group>
  );
}

function SponsorTextureSurface({
  fallbackColor,
  opacity = 1,
  url,
}: {
  fallbackColor: string;
  opacity?: number;
  url: string;
}) {
  const [mappedTexture, setMappedTexture] = useState<THREE.Texture | null>(null);

  useEffect(() => {
    let isActive = true;
    loadCachedExpoTexture(url)
      .then((texture) => {
        if (!isActive) {
          return;
        }
        setMappedTexture(texture);
      })
      .catch(() => {
        if (!isActive) {
          return;
        }
        setMappedTexture(null);
      });

    return () => {
      isActive = false;
    };
  }, [url]);

  return <meshBasicMaterial color={fallbackColor} map={mappedTexture ?? undefined} transparent opacity={opacity} toneMapped={false} />;
}

function ScreenTextureMaterial({ fallbackColor, url }: { fallbackColor: string; url: string }) {
  const [mappedTexture, setMappedTexture] = useState<THREE.Texture | null>(null);

  useEffect(() => {
    let isActive = true;
    loadCachedExpoTexture(url)
      .then((texture) => {
        if (!isActive) {
          return;
        }
        setMappedTexture(texture);
      })
      .catch(() => {
        if (!isActive) {
          return;
        }
        setMappedTexture(null);
      });

    return () => {
      isActive = false;
    };
  }, [url]);

  return <meshBasicMaterial color={fallbackColor} map={mappedTexture ?? undefined} toneMapped={false} />;
}

function ExpoRuntimeSurfaceMaterial({
  fallbackColor,
  repeat: _repeat,
  surface: _surface,
}: {
  fallbackColor: string;
  repeat: [number, number];
  surface: 'concrete' | 'paver' | 'grass';
}) {
  return (
    <meshStandardMaterial
      color={fallbackColor}
      roughness={0.76}
      metalness={0.04}
    />
  );
}

function ExpoArchitecturalMassMaterial({
  fallbackColor,
  repeat: _repeat = [1.8, 1.8],
  surface: _surface = 'concrete',
  emissive = '#000000',
  emissiveIntensity = 0,
}: {
  fallbackColor: string;
  repeat?: [number, number];
  surface?: 'concrete' | 'paver';
  emissive?: string;
  emissiveIntensity?: number;
}) {
  return (
    <meshStandardMaterial
      color={fallbackColor}
      roughness={0.76}
      metalness={0.05}
      emissive={emissive}
      emissiveIntensity={emissiveIntensity}
    />
  );
}

function SponsorScreenGraphic({
  accentColor,
  fallbackMode = false,
  fallbackMonogram,
  size,
  url,
}: {
  accentColor: string;
  fallbackMode?: boolean;
  fallbackMonogram?: string;
  size: [number, number];
  url: string | null;
}) {
  return (
    <group>
      <mesh>
        <planeGeometry args={size} />
        {url ? (
          <Suspense fallback={<meshStandardMaterial color={accentColor} emissive={accentColor} emissiveIntensity={0.14} />}>
            <ScreenTextureMaterial fallbackColor={accentColor} url={url} />
          </Suspense>
        ) : (
          <meshStandardMaterial color={accentColor} emissive={accentColor} emissiveIntensity={0.14} />
        )}
      </mesh>
      {fallbackMode && (
        <>
          <mesh position={[0, 0, 0.02]}>
            <planeGeometry args={[size[0] * 0.92, size[1] * 0.92]} />
            <meshBasicMaterial color="#020617" transparent opacity={0.18} />
          </mesh>
          <Text position={[0, -0.08, 0.05]} fontSize={Math.max(0.64, size[1] * 0.22)} color="#f8fafc" anchorX="center" anchorY="middle" maxWidth={size[0] * 0.56}>
            {(fallbackMonogram || 'WP').toUpperCase()}
          </Text>
        </>
      )}
    </group>
  );
}

function SponsorLogoPanel({
  accentColor,
  fallbackText,
  url,
}: {
  accentColor: string;
  fallbackText: string;
  url: string | null;
}) {
  return (
    <group>
      <mesh position={[0.06, 0.24, -0.22]} castShadow>
        <boxGeometry args={[5.84, 6.34, 1.08]} />
        <meshStandardMaterial color="#07101a" metalness={0.12} roughness={0.52} />
      </mesh>
      <mesh position={[0.06, 3.38, -0.04]} castShadow>
        <boxGeometry args={[4.26, 0.48, 0.44]} />
        <meshStandardMaterial color={accentColor} emissive={accentColor} emissiveIntensity={0.12} />
      </mesh>
      <mesh position={[0.06, -3.04, -0.02]} castShadow>
        <boxGeometry args={[4.74, 0.74, 0.54]} />
        <meshStandardMaterial color="#09121c" metalness={0.1} roughness={0.64} />
      </mesh>
      <mesh position={[-2.34, 0, 0.14]} castShadow>
        <boxGeometry args={[0.24, 5.32, 0.28]} />
        <meshStandardMaterial color={accentColor} emissive={accentColor} emissiveIntensity={0.1} />
      </mesh>
      <mesh position={[2.42, 0, 0.14]} castShadow>
        <boxGeometry args={[0.24, 5.32, 0.28]} />
        <meshStandardMaterial color={accentColor} emissive={accentColor} emissiveIntensity={0.06} />
      </mesh>
      <mesh position={[0.08, 0, 0.08]} castShadow>
        <boxGeometry args={[4.86, 5.06, 0.34]} />
        <meshStandardMaterial color="#d8e1ea" metalness={0.04} roughness={0.28} />
      </mesh>
      <mesh position={[0.08, 0, 0.26]} castShadow>
        <boxGeometry args={[4.12, 4.34, 0.18]} />
        <meshStandardMaterial color="#cbd6e2" metalness={0.05} roughness={0.32} />
      </mesh>
      <mesh position={[0.08, 0, 0.44]}>
        <planeGeometry args={[3.66, 3.84]} />
        {url ? (
          <Suspense fallback={<meshStandardMaterial color="#e2e8f0" />}>
            <SponsorTextureSurface fallbackColor="#ffffff" url={url} />
          </Suspense>
        ) : (
          <meshStandardMaterial color="#dbe6f0" />
        )}
      </mesh>
      {!url && (
        <Text position={[0.08, -0.04, 0.54]} fontSize={0.82} color={accentColor} anchorX="center" anchorY="middle" maxWidth={2.5}>
          {fallbackText}
        </Text>
      )}
    </group>
  );
}

function SponsorPosterPanel({
  accentColor,
  fallbackHeadline,
  fallbackSupportLine,
  isPlaying,
  onTogglePlay,
  posterUrl,
  videoUrl,
}: {
  accentColor: string;
  fallbackHeadline?: string;
  fallbackSupportLine?: string;
  isPlaying: boolean;
  onTogglePlay: () => void;
  posterUrl: string | null;
  videoUrl: string | null;
}) {
  const canPlay = Boolean(videoUrl);
  const posterStatusLabel = isPlaying ? 'LIVE FEATURE' : (canPlay ? 'OPEN DEMO FEATURE' : 'STATIC FEATURE');

  return (
    <group>
      <mesh position={[0, 0.12, -0.3]} castShadow>
        <boxGeometry args={[12.48, 8.48, 0.98]} />
        <meshStandardMaterial color="#08111c" metalness={0.12} roughness={0.54} />
      </mesh>
      <mesh position={[0, 4.38, -0.1]} castShadow>
        <boxGeometry args={[9.18, 0.64, 0.48]} />
        <meshStandardMaterial color={accentColor} emissive={accentColor} emissiveIntensity={0.08} roughness={0.42} metalness={0.08} />
      </mesh>
      <mesh position={[0, -4.02, -0.02]} castShadow>
        <boxGeometry args={[10.84, 0.86, 0.52]} />
        <meshStandardMaterial color="#060d17" metalness={0.08} roughness={0.68} />
      </mesh>
      <mesh position={[0, 0.02, -0.01]} castShadow>
        <boxGeometry args={[11.52, 7.42, 0.26]} />
        <meshStandardMaterial color={accentColor} emissive={accentColor} emissiveIntensity={0.06} roughness={0.42} metalness={0.08} />
      </mesh>
      <mesh position={[-5.16, 0, 0.08]} castShadow>
        <boxGeometry args={[0.32, 6.68, 0.28]} />
        <meshStandardMaterial color={accentColor} emissive={accentColor} emissiveIntensity={0.12} />
      </mesh>
      <mesh position={[5.16, 0, 0.08]} castShadow>
        <boxGeometry args={[0.32, 6.68, 0.28]} />
        <meshStandardMaterial color={accentColor} emissive={accentColor} emissiveIntensity={0.06} />
      </mesh>
      <mesh position={[0, -0.14, 0.02]} castShadow>
        <boxGeometry args={[10.76, 6.54, 0.2]} />
        <meshStandardMaterial color="#030712" metalness={0.08} roughness={0.5} />
      </mesh>
      <mesh
        position={[0, -0.08, 0.12]}
        onClick={(event) => {
          if (!canPlay) {
            return;
          }

          event.stopPropagation();
          onTogglePlay();
        }}
        onPointerOver={() => {
          if (canPlay) {
            document.body.style.cursor = 'pointer';
          }
        }}
        onPointerOut={() => {
          document.body.style.cursor = 'auto';
        }}
      >
        <planeGeometry args={[9.84, 5.86]} />
        {isPlaying && videoUrl ? (
          <Suspense fallback={<meshStandardMaterial color="#020617" />}>
            <SafeVideo url={videoUrl} />
          </Suspense>
        ) : posterUrl ? (
          <Suspense fallback={<meshStandardMaterial color="#020617" />}>
            <SponsorTextureSurface fallbackColor="#111827" url={posterUrl} />
          </Suspense>
        ) : (
          <meshStandardMaterial color="#0f172a" emissive={accentColor} emissiveIntensity={0.08} />
        )}
      </mesh>
      {!posterUrl && !videoUrl && (
        <group position={[0, 0.04, 0.18]}>
          <mesh>
            <planeGeometry args={[9.08, 5.16]} />
            <meshBasicMaterial color="#020617" transparent opacity={0.18} />
          </mesh>
          <Text position={[0, 0.54, 0.08]} fontSize={0.72} color="#f8fafc" anchorX="center" anchorY="middle" maxWidth={6.8}>
            {(fallbackHeadline || 'LIVE PRODUCT STORY').toUpperCase()}
          </Text>
          <Text position={[0, -0.42, 0.08]} fontSize={0.2} color="#020617" anchorX="center" anchorY="middle" maxWidth={5.6}>
            {(fallbackSupportLine || 'MEET THE TEAM • FOLLOW THE CTA • ENTER THE DEMO ROOM').toUpperCase()}
          </Text>
          <Text position={[0, -0.42, 0.09]} fontSize={0.18} color="#94a3b8" anchorX="center" anchorY="middle" maxWidth={4.8}>
            GUIDED PRODUCT SESSION
          </Text>
          <mesh position={[0, -1.54, 0.1]}>
            <planeGeometry args={[2.6, 0.42]} />
            <meshBasicMaterial color={accentColor} transparent opacity={0.72} />
          </mesh>
          <Text position={[0, -1.54, 0.12]} fontSize={0.18} color="#f8fafc" anchorX="center" anchorY="middle">
            FEATURE
          </Text>
        </group>
      )}
      <mesh position={[0, -3.28, 0.08]} castShadow>
        <boxGeometry args={[10.18, 0.58, 0.24]} />
        <meshStandardMaterial color="#060d17" metalness={0.08} roughness={0.68} />
      </mesh>
      <mesh position={[-4.44, -3.28, 0.16]} castShadow>
        <boxGeometry args={[0.18, 0.58, 0.08]} />
        <meshStandardMaterial color={accentColor} emissive={accentColor} emissiveIntensity={0.12} />
      </mesh>
      <Text position={[0.12, -3.28, 0.25]} fontSize={0.24} color="#94a3b8" anchorX="center" anchorY="middle" maxWidth={7.2}>
        {posterStatusLabel}
      </Text>
      <Text position={[0.12, -3.28, 0.24]} fontSize={0.001} color="#000000" fillOpacity={0} anchorX="center" anchorY="middle" maxWidth={7.2}>
        {isPlaying ? 'CLICK TO PAUSE' : (canPlay ? 'POSTER • CLICK TO PLAY DEMO' : 'POSTER • STATIC PREVIEW')}
      </Text>
    </group>
  );
}

function getNormalizedBooth(company: any) {
  const rawBooth = company?.booth ?? company?.booths ?? null;

  if (Array.isArray(rawBooth)) {
    return rawBooth[0] || null;
  }

  if (rawBooth && typeof rawBooth === 'object') {
    return rawBooth;
  }

  return null;
}

function SponsorBadge({
  accentColor,
  label,
  position,
}: {
  accentColor: string;
  label: string;
  position: [number, number, number];
}) {
  return (
    <group position={position}>
      <mesh castShadow>
        <boxGeometry args={[3.9, 0.84, 0.34]} />
        <meshStandardMaterial color="#08111c" metalness={0.14} roughness={0.58} />
      </mesh>
      <mesh position={[-1.36, 0, 0.1]} castShadow>
        <boxGeometry args={[0.2, 0.84, 0.08]} />
        <meshStandardMaterial color={accentColor} emissive={accentColor} emissiveIntensity={0.16} />
      </mesh>
      <Text position={[0.14, 0, 0.24]} fontSize={0.34} color="#f8fafc" anchorX="center" anchorY="middle" maxWidth={2.6}>
        {label}
      </Text>
    </group>
  );
}

function SponsorCtaStrip({
  actions,
  color,
  onAction,
}: {
  actions: SponsorCta[];
  color: string;
  onAction: (action: SponsorCta) => void;
}) {
  const primaryIndex = actions.findIndex((action) => !action.disabled && action.kind === 'demo_room');

  return (
    <group>
      <mesh castShadow>
        <boxGeometry args={[11.9, 0.92, 0.42]} />
        <meshStandardMaterial color="#08111c" metalness={0.12} roughness={0.62} />
      </mesh>
      <mesh position={[0, -0.16, 0.08]} castShadow>
        <boxGeometry args={[11.2, 0.1, 0.08]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.06} roughness={0.48} />
      </mesh>
      {actions.map((action, index) => {
        const x = (index - ((actions.length - 1) / 2)) * 3.5;
        const isPrimary = index === primaryIndex;

        return (
          <group key={`${action.kind}-${index}`} position={[x, 0.01, 0.13]}>
            <mesh
              onClick={(event) => {
                event.stopPropagation();
                if (action.disabled) {
                  return;
                }
                onAction(action);
              }}
              onPointerOver={() => {
                document.body.style.cursor = action.disabled ? 'auto' : 'pointer';
              }}
              onPointerOut={() => {
                document.body.style.cursor = 'auto';
              }}
            >
              <boxGeometry args={[isPrimary ? 3.64 : 3.04, 0.54, 0.18]} />
              <meshStandardMaterial color={action.disabled ? '#172030' : isPrimary ? color : '#101b2a'} metalness={0.08} roughness={0.7} />
            </mesh>
            {index < actions.length - 1 && (
              <mesh position={[isPrimary ? 1.94 : 1.66, 0, 0.03]}>
                <boxGeometry args={[0.04, 0.4, 0.04]} />
                <meshStandardMaterial color="#1b2533" />
              </mesh>
            )}
            <Text position={[0, 0, 0.16]} fontSize={isPrimary ? 0.22 : 0.2} color={action.disabled ? '#64748b' : '#f8fafc'} anchorX="center" anchorY="middle" maxWidth={isPrimary ? 2.5 : 1.9}>
              {action.label.toUpperCase()}
            </Text>
          </group>
        );
      })}
    </group>
  );
}

function SponsorScreenNodeView({ node }: { node: SponsorScreenNode }) {
  const showIdentity = Boolean(node.companyId);
  const isElite = node.placementTier === 'elite';
  const isPremium = node.placementTier === 'premium';
  const isCity = node.placementTier === 'city';
  const showLabel = showIdentity && EXPO_FEATURE_FLAGS.enableShowcaseSkylineDensity && !isCity;

  if (node.kind === 'facade') {
    return (
      <group position={node.position} rotation={node.rotation}>
        <mesh castShadow>
          <boxGeometry args={[node.size[0] + (isElite ? 16 : isPremium ? 11 : 6.8), node.size[1] + (isElite ? 8.8 : isPremium ? 6.4 : 4.6), isElite ? 4.2 : isPremium ? 3 : 2]} />
        <meshStandardMaterial color="#182634" metalness={0.22} roughness={0.72} />
        </mesh>
        <mesh position={[0, (node.size[1] * 0.5) + (isElite ? 3.4 : isPremium ? 2.6 : 1.8), 0]} castShadow>
          <boxGeometry args={[node.size[0] + (isElite ? 7.2 : isPremium ? 4.8 : 2.4), isElite ? 1.72 : isPremium ? 1.22 : 0.88, isElite ? 2.8 : isPremium ? 2.1 : 1.4]} />
          <meshStandardMaterial color={node.accentColor} emissive={node.accentColor} emissiveIntensity={isElite ? 0.16 : 0.12} />
        </mesh>
        {(isElite || isPremium) && (
          <>
            <mesh position={[-((node.size[0] * 0.5) + (isElite ? 5.6 : 4.2)), 0, 0]} castShadow>
              <boxGeometry args={[isElite ? 4.6 : 3.2, node.size[1] + (isElite ? 8.2 : 6.4), isElite ? 3.2 : 2.4]} />
              <meshStandardMaterial color="#1a2835" metalness={0.22} roughness={0.72} />
            </mesh>
            <mesh position={[(node.size[0] * 0.5) + (isElite ? 5.6 : 4.2), 0, 0]} castShadow>
              <boxGeometry args={[isElite ? 4.6 : 3.2, node.size[1] + (isElite ? 8.2 : 6.4), isElite ? 3.2 : 2.4]} />
              <meshStandardMaterial color="#1a2835" metalness={0.22} roughness={0.72} />
            </mesh>
            <mesh position={[-((node.size[0] * 0.5) + (isElite ? 10.8 : 7.8)), 0, 0]} castShadow>
              <boxGeometry args={[isElite ? 7.8 : 5.4, node.size[1] * 0.78, isElite ? 2.2 : 1.6]} />
              <meshStandardMaterial color={node.accentColor} emissive={node.accentColor} emissiveIntensity={isElite ? 0.08 : 0.06} />
            </mesh>
            <mesh position={[(node.size[0] * 0.5) + (isElite ? 10.8 : 7.8), 0, 0]} castShadow>
              <boxGeometry args={[isElite ? 7.8 : 5.4, node.size[1] * 0.78, isElite ? 2.2 : 1.6]} />
              <meshStandardMaterial color={node.accentColor} emissive={node.accentColor} emissiveIntensity={isElite ? 0.08 : 0.06} />
            </mesh>
          </>
        )}
        <mesh position={[0, 0, isElite ? 1.42 : isPremium ? 1.08 : 0.72]} castShadow>
          <boxGeometry args={[node.size[0] + (isElite ? 4.2 : isPremium ? 2.6 : 1.2), node.size[1] + (isElite ? 3.4 : isPremium ? 2.2 : 1.2), isElite ? 1.34 : isPremium ? 0.92 : 0.6]} />
          <meshStandardMaterial color={node.accentColor} emissive={node.accentColor} emissiveIntensity={isElite ? 0.14 : 0.1} />
        </mesh>
        <mesh position={[0, -(node.size[1] * 0.5) - (isElite ? 4.8 : isPremium ? 3.5 : 2.1), 0]} castShadow>
          <boxGeometry args={[Math.max(isElite ? 18 : isPremium ? 14 : 9, node.size[0] * (isElite ? 0.62 : isPremium ? 0.52 : 0.42)), isElite ? 7.2 : isPremium ? 5.2 : 3.4, isElite ? 4.8 : isPremium ? 3.2 : 2]} />
          <meshStandardMaterial color="#1b2a38" metalness={0.16} roughness={0.68} />
        </mesh>
        <mesh position={[0, -(node.size[1] * 0.5) - (isElite ? 8.6 : isPremium ? 6.2 : 4.1), 0]} castShadow>
          <boxGeometry args={[Math.max(isElite ? 26 : isPremium ? 21 : 12, node.size[0] * (isElite ? 0.82 : isPremium ? 0.72 : 0.54)), isElite ? 1.24 : isPremium ? 0.94 : 0.72, isElite ? 7.2 : isPremium ? 5.2 : 3.2]} />
          <meshStandardMaterial color="#192735" metalness={0.12} roughness={0.74} />
        </mesh>
        <group position={[0, 0, isElite ? 2.1 : isPremium ? 1.62 : 1.08]}>
          <SponsorScreenGraphic accentColor={node.accentColor} fallbackMode={node.fallbackMode} fallbackMonogram={node.fallbackMonogram} size={node.size} url={node.imageUrl} />
        </group>
        {showLabel && (
          <Text position={[0, -(node.size[1] * 0.5) - (isElite ? 4.6 : isPremium ? 3.4 : 2.3), isElite ? 2.38 : isPremium ? 1.84 : 1.22]} fontSize={isElite ? 1.44 : isPremium ? 1.18 : 1.05} color="#f8fafc" anchorX="center" anchorY="middle" maxWidth={node.size[0] - 2}>
            {node.title.toUpperCase()}
          </Text>
        )}
      </group>
    );
  }

  if (node.kind === 'medium_billboard') {
    return (
      <group position={node.position} rotation={node.rotation}>
        <mesh position={[0, 0, 0]} castShadow>
          <boxGeometry args={[node.size[0] + (isPremium ? 8.8 : 5.6), node.size[1] + (isPremium ? 5.2 : 3.8), isPremium ? 2.8 : 1.9]} />
          <meshStandardMaterial color="#1a2835" metalness={0.18} roughness={0.76} />
        </mesh>
        <mesh position={[0, (node.size[1] * 0.5) + (isPremium ? 2.6 : 1.9), 0]} castShadow>
          <boxGeometry args={[node.size[0] + (isPremium ? 2.8 : 1.8), isPremium ? 1.2 : 0.88, isPremium ? 2.1 : 1.5]} />
          <meshStandardMaterial color={node.accentColor} emissive={node.accentColor} emissiveIntensity={isPremium ? 0.12 : 0.09} />
        </mesh>
        <mesh position={[0, 0, isPremium ? 1.42 : 1.02]} castShadow>
          <boxGeometry args={[node.size[0] + (isPremium ? 1.4 : 0.8), node.size[1] + (isPremium ? 1.1 : 0.8), isPremium ? 0.92 : 0.64]} />
          <meshStandardMaterial color={node.accentColor} emissive={node.accentColor} emissiveIntensity={isPremium ? 0.1 : 0.08} />
        </mesh>
        <group position={[0, 0, isPremium ? 1.88 : 1.32]}>
          <SponsorScreenGraphic accentColor={node.accentColor} fallbackMode={node.fallbackMode} fallbackMonogram={node.fallbackMonogram} size={node.size} url={node.imageUrl} />
        </group>
        <mesh position={[-((node.size[0] * 0.5) + (isPremium ? 2.6 : 1.9)), -1.2, 0]} castShadow>
          <boxGeometry args={[isPremium ? 1.2 : 0.84, node.size[1] + (isPremium ? 5.4 : 4.2), isPremium ? 1.6 : 1.14]} />
          <meshStandardMaterial color="#111827" metalness={0.16} roughness={0.78} />
        </mesh>
        <mesh position={[(node.size[0] * 0.5) + (isPremium ? 2.6 : 1.9), -1.2, 0]} castShadow>
          <boxGeometry args={[isPremium ? 1.2 : 0.84, node.size[1] + (isPremium ? 5.4 : 4.2), isPremium ? 1.6 : 1.14]} />
          <meshStandardMaterial color="#111827" metalness={0.16} roughness={0.78} />
        </mesh>
        <mesh position={[0, -(node.size[1] * 0.5) - 4.8, 0]} castShadow>
          <boxGeometry args={[isPremium ? 2.6 : 1.8, isPremium ? 18.8 : 15.2, isPremium ? 2.6 : 1.8]} />
          <meshStandardMaterial color="#111827" metalness={0.14} roughness={0.8} />
        </mesh>
        <mesh position={[0, -(node.size[1] * 0.5) - 10.9, 0]} castShadow>
          <boxGeometry args={[isPremium ? 10.2 : 7.4, 1.08, isPremium ? 6.8 : 4.8]} />
          <meshStandardMaterial color="#1b2a38" metalness={0.12} roughness={0.74} />
        </mesh>
        <mesh position={[0, -(node.size[1] * 0.5) - 11.8, 0]} castShadow>
          <boxGeometry args={[isPremium ? 13.4 : 9.8, 0.48, isPremium ? 8.8 : 6.2]} />
          <meshStandardMaterial color="#1b2a38" metalness={0.12} roughness={0.74} />
        </mesh>
      </group>
    );
  }

  return (
    <group position={node.position} rotation={node.rotation}>
      <mesh castShadow>
        <boxGeometry args={[node.size[0] + (isPremium ? 4.2 : 2.8), node.size[1] + (isPremium ? 4.8 : 3.4), isPremium ? 2.4 : 1.8]} />
        <meshStandardMaterial color="#182634" metalness={0.16} roughness={0.82} />
      </mesh>
      <mesh position={[0, (node.size[1] * 0.5) + (isPremium ? 1.8 : 1.3), 0]} castShadow>
        <boxGeometry args={[node.size[0] + (isPremium ? 1.8 : 1.2), isPremium ? 0.92 : 0.72, isPremium ? 1.6 : 1.2]} />
        <meshStandardMaterial color={node.accentColor} emissive={node.accentColor} emissiveIntensity={0.09} />
      </mesh>
      <mesh position={[0, 0.5, isPremium ? 1.32 : 0.96]} castShadow>
        <boxGeometry args={[node.size[0] + (isPremium ? 0.8 : 0.4), node.size[1] + (isPremium ? 0.8 : 0.4), isPremium ? 0.8 : 0.58]} />
        <meshStandardMaterial color={node.accentColor} emissive={node.accentColor} emissiveIntensity={0.08} />
      </mesh>
      <group position={[0, 0.5, isPremium ? 1.68 : 1.22]}>
        <SponsorScreenGraphic accentColor={node.accentColor} fallbackMode={node.fallbackMode} fallbackMonogram={node.fallbackMonogram} size={node.size} url={node.imageUrl} />
      </group>
      <mesh position={[0, -(node.size[1] * 0.5) - 4.2, 0]} castShadow>
        <boxGeometry args={[isPremium ? 2.24 : 1.72, isPremium ? 12.4 : 9.2, isPremium ? 2.24 : 1.72]} />
        <meshStandardMaterial color={node.accentColor} emissive={node.accentColor} emissiveIntensity={0.09} />
      </mesh>
      <mesh position={[0, -(node.size[1] * 0.5) - 7.8, 0]} castShadow>
        <boxGeometry args={[isPremium ? 7.8 : isCity ? 6.6 : 5.6, 0.96, isPremium ? 5.4 : 4.2]} />
        <meshStandardMaterial color="#1b2a38" metalness={0.12} roughness={0.74} />
      </mesh>
      <mesh position={[0, -(node.size[1] * 0.5) - 8.6, 0]} castShadow>
        <boxGeometry args={[isPremium ? 10.8 : isCity ? 9.2 : 7.8, 0.4, isPremium ? 7.2 : 5.8]} />
        <meshStandardMaterial color="#1b2a38" metalness={0.12} roughness={0.74} />
      </mesh>
    </group>
  );
}

function SponsorScreenHierarchy({
  boothPlacements,
  districtPrograms,
  playerPosition,
  sectorMarkers,
}: {
  boothPlacements: ExpoBoothPlacement[];
  districtPrograms: ExpoDistrictProgramSummary[];
  playerPosition: [number, number, number];
  sectorMarkers: ExpoSectorMarker[];
}) {
  const layout = useMemo(
    () => buildSponsorScreenLayout(boothPlacements, sectorMarkers, districtPrograms),
    [boothPlacements, districtPrograms, sectorMarkers]
  );
  const stadiumReserve = useMemo(() => getStadiumReserve(boothPlacements), [boothPlacements]);
  const facadeNodes = useMemo(() => {
    const available = layout.facadeScreens.filter((node) => !overlapsStadiumReserve(node.position, stadiumReserve, node.size));
    if (EXPO_FEATURE_FLAGS.enableShowcaseSkylineDensity) {
      return available;
    }
    return available.filter((node, index) => node.placementTier === 'elite' || node.placementTier === 'premium' || index % 3 === 0);
  }, [layout.facadeScreens, stadiumReserve]);
  const mediumNodes = useMemo(() => {
    const available = layout.mediumScreens.filter((node) => !overlapsStadiumReserve(node.position, stadiumReserve, node.size));
    return EXPO_FEATURE_FLAGS.enableShowcaseSkylineDensity ? available : available.slice(0, 6);
  }, [layout.mediumScreens, stadiumReserve]);
  const groundNodes = useMemo(() => {
    const available = layout.groundScreens.filter((node) => !overlapsStadiumReserve(node.position, stadiumReserve, node.size));
    return EXPO_FEATURE_FLAGS.enableShowcaseSkylineDensity ? available : available.slice(0, 4);
  }, [layout.groundScreens, stadiumReserve]);
  const visibleFacadeNodes = useMemo(() => {
    if (EXPO_FEATURE_FLAGS.enableShowcaseSkylineDensity) {
      return facadeNodes;
    }

    return facadeNodes.filter((node) => {
      const dx = node.position[0] - playerPosition[0];
      const dz = node.position[2] - playerPosition[2];
      const distanceSq = (dx * dx) + (dz * dz);
      const maxDistance =
        node.placementTier === 'elite'
          ? 2200
          : node.placementTier === 'premium'
            ? 1500
            : 900;
      return distanceSq <= maxDistance * maxDistance;
    });
  }, [facadeNodes, playerPosition]);
  const visibleMediumNodes = useMemo(() => (
    EXPO_FEATURE_FLAGS.enableShowcaseSkylineDensity
      ? mediumNodes
      : mediumNodes.filter((node) => {
          const dx = node.position[0] - playerPosition[0];
          const dz = node.position[2] - playerPosition[2];
          return (dx * dx) + (dz * dz) <= 900 * 900;
        })
  ), [mediumNodes, playerPosition]);
  const visibleGroundNodes = useMemo(() => (
    EXPO_FEATURE_FLAGS.enableShowcaseSkylineDensity
      ? groundNodes
      : groundNodes.filter((node) => {
          const dx = node.position[0] - playerPosition[0];
          const dz = node.position[2] - playerPosition[2];
          return (dx * dx) + (dz * dz) <= 720 * 720;
        })
  ), [groundNodes, playerPosition]);
  return (
    <group name="sponsor-screen-hierarchy">
      {EXPO_FEATURE_FLAGS.enableFacadeScreens && visibleFacadeNodes.map((node) => (
        <SponsorScreenNodeView key={node.id} node={node} />
      ))}
      {visibleMediumNodes.map((node) => (
        <SponsorScreenNodeView key={node.id} node={node} />
      ))}
      {EXPO_FEATURE_FLAGS.enableBoulevardGroundScreens && visibleGroundNodes.map((node) => (
        <SponsorScreenNodeView key={node.id} node={node} />
      ))}
    </group>
  );
}

void SponsorScreenHierarchy;

export function SponsorBillboards({ placements: _placements }: { placements: ExpoBoothPlacement[]; }) {
  const billboardPlacements = useMemo(() => (
    [..._placements]
      .filter((placement) => placement.nodeType === 'hero_left' || placement.nodeType === 'hero_right' || placement.nodeType === 'endcap')
      .sort((left, right) => (Number(right.priority || 0) - Number(left.priority || 0)))
      .slice(0, 6)
  ), [_placements]);

  return (
    <group name="sponsor-billboards">
      {billboardPlacements.map((placement, index) => {
        const company = placement.company;
        const presentation = buildSponsorBoothPresentation(company, company.booth, placement.nodeType, { districtThemeId: placement.districtThemeId });
        const side = placement.position[0] < 0 ? -1 : 1;
        const billboardX = placement.position[0] + side * 18;
        const billboardZ = placement.position[2] + ((index % 2 === 0) ? 8 : -8);

        return (
          <group key={`billboard-${placement.id}`} position={[billboardX, 13, billboardZ]}>
            <mesh castShadow>
              <boxGeometry args={[10, 7.2, 0.9]} />
              <meshStandardMaterial color="#020617" metalness={0.18} roughness={0.78} />
            </mesh>
            <mesh position={[0, 0, 0.48]}>
              <planeGeometry args={[8.6, 5.8]} />
              {presentation.logoUrl ? (
                <Suspense fallback={<meshStandardMaterial color={placement.color} emissive={placement.color} emissiveIntensity={0.12} />}>
                  <SponsorTextureSurface fallbackColor="#0f172a" opacity={0.94} url={presentation.logoUrl} />
                </Suspense>
              ) : (
                <meshStandardMaterial color={placement.color} emissive={placement.color} emissiveIntensity={0.12} />
              )}
            </mesh>
            <Text position={[0, -3.2, 0.54]} fontSize={0.52} color="#f8fafc" anchorX="center" anchorY="middle" maxWidth={8.4}>{presentation.displayName.toUpperCase()}</Text>
          </group>
        );
      })}
    </group>
  );
}

function DistrictBooth({
  placement,
  playerPosition,
  visualProfile,
}: {
  placement: ExpoBoothPlacement;
  playerPosition: [number, number, number];
  visualProfile: ExpoWorldVisualProfile;
}) {
  const nav = useNavigate();
  const company = placement.company;
  const booth = getNormalizedBooth(company);
  const presentation = useMemo(
    () => buildSponsorBoothPresentation(company, booth, placement.nodeType, { districtThemeId: placement.districtThemeId }),
    [booth, company, placement.districtThemeId, placement.nodeType]
  );
  const [isPosterPlaying, setIsPosterPlaying] = useState(false);
  const boothColliderRef = useRef<THREE.Group>(null);
  usePlayerColliderRegistration(boothColliderRef, `district-booth-${String(company?.id || company?.name || 'unknown')}`);

  const nameFontSize = getSponsorNameFontSize(presentation.displayName);
  const metrics = getBoothArchitectureMetrics(presentation.template);
  const colliderSegments = useMemo(() => getBoothColliderSegments(presentation.template), [presentation.template]);
  const districtVisual = getDistrictVisualProfile(placement.sectorId, placement.clusterIndex, visualProfile);
  const isEliteBooth = presentation.adTier === 'elite';
  const isPremiumBooth = presentation.adTier === 'premium';
  const isHeroNode = placement.nodeType === 'hero_left' || placement.nodeType === 'hero_right';
  const useOpenPavilionShell = !isHeroNode;
  const stageScale = isEliteBooth ? 1.28 : isPremiumBooth ? 1.14 : 1;
  const mediaWallScale = isEliteBooth ? 1.16 : isPremiumBooth ? 1.08 : 1;
  const sidePanelScale = isEliteBooth ? 1.12 : isPremiumBooth ? 1.06 : 1;
  const sidePanelOffsetX = (isEliteBooth ? 8.4 : isPremiumBooth ? 7.5 : 6.9) * sidePanelScale;
  const frontApronWidth = isEliteBooth ? 20 : isPremiumBooth ? 17 : 0;
  const frontApronDepth = isEliteBooth ? 3.6 : isPremiumBooth ? 2.8 : 0;
  const showTagline = (presentation.hasBrandAssets || isEliteBooth || isPremiumBooth) && districtVisual.expressionMode === 'active-commercial' && presentation.template !== 'standard_studio';
  const showBadge = (presentation.hasBrandAssets || isEliteBooth || isPremiumBooth) && districtVisual.expressionMode === 'active-commercial';
  const showPremiumEyebrow = isEliteBooth || isPremiumBooth;
  const distanceToPlayer = Math.hypot(playerPosition[0] - placement.position[0], playerPosition[2] - placement.position[2]);
  const showDetailedText = EXPO_FEATURE_FLAGS.enableShowcaseSkylineDensity || distanceToPlayer < 760;
  const showFullBoothUi = EXPO_FEATURE_FLAGS.enableShowcaseSkylineDensity || distanceToPlayer < 540 || isEliteBooth || isPremiumBooth;
  const showRichMedia = EXPO_FEATURE_FLAGS.enableShowcaseSkylineDensity || distanceToPlayer < 460 || isEliteBooth || isPremiumBooth;
  const infoBandWidth = Math.max(8.8, metrics.titleMaxWidth + (isEliteBooth ? 4.6 : isPremiumBooth ? 3.4 : 2.2));
  const infoBandHeight = showTagline ? (isEliteBooth ? 3.72 : isPremiumBooth ? 3.24 : 2.56) : (isEliteBooth ? 2.7 : isPremiumBooth ? 2.24 : 1.76);
  const infoBandZ = metrics.titlePosition[2] - 0.24;
  const openShowcaseRoom = () => {
    if (EXPO_FEATURE_FLAGS.enableAnalytics) {
      trackExpoDemoRoomEntered(company, { boothId: booth?.id ?? placement.id, boothTemplate: presentation.template, sectorName: placement.sectorName });
    }
    nav(presentation.demoRoomPath);
  };
  const onAction = (action: SponsorCta) => {
    const intent = resolveSponsorCtaIntent(action, presentation);
    if (!intent) {
      return;
    }

    if (intent.type === 'navigate') {
      openShowcaseRoom();
      return;
    }

    if (EXPO_FEATURE_FLAGS.enableAnalytics) {
      if (action.kind === 'website') {
        trackExpoWebsiteOpened(company, { boothId: booth?.id ?? placement.id, boothTemplate: presentation.template, websiteUrl: intent.target });
      } else if (action.kind === 'booking') {
        trackExpoBookingClicked(company, { boothId: booth?.id ?? placement.id, boothTemplate: presentation.template, bookingUrl: intent.target });
      }
    }
    window.open(intent.target, '_blank', 'noopener,noreferrer');
  };

  return (
    <group
      position={placement.position}
      rotation={placement.rotation}
      onClick={(event) => {
        event.stopPropagation();
        if (EXPO_FEATURE_FLAGS.enableAnalytics) {
          trackExpoBoothClicked(company, {
            boothId: booth?.id ?? placement.id,
            boothTemplate: presentation.template,
            nodeType: placement.nodeType,
            sectorName: placement.sectorName,
          });
        }
        openShowcaseRoom();
      }}
      onPointerOver={() => {
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        document.body.style.cursor = 'auto';
      }}
    >
      <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={metrics.footprintSize} />
        <meshStandardMaterial color={districtVisual.groundAccent} transparent opacity={districtVisual.expressionMode === 'active-commercial' ? 0.16 : 0.11} />
      </mesh>
      <group ref={boothColliderRef} name="district-booth-collider">
        {colliderSegments.map((segment) => (
          <mesh key={segment.id} position={segment.position}>
            <boxGeometry args={segment.size} />
            <ColliderMaterial color="#2563eb" debug={EXPO_SPATIAL_DEBUG_FLAGS.showBoothColliderBoxes} />
          </mesh>
        ))}
      </group>
      {EXPO_SPATIAL_DEBUG_FLAGS.disableBoothArchitectureKit
        ? <BoothDebugShellFallback accentColor={placement.color} metrics={metrics} />
        : useOpenPavilionShell
          ? <OpenBoothPavilion accentColor={districtVisual.shellAccent} metrics={metrics} />
          : <BoothArchitectureKit accentColor={districtVisual.shellAccent} template={presentation.template} visualTone={districtVisual.expressionMode} />}
      {presentation.customInsertUrl && showRichMedia && (
        <Suspense fallback={null}>
          <CustomBoothInsert template={presentation.template} url={presentation.customInsertUrl} />
        </Suspense>
      )}
      {(isEliteBooth || isPremiumBooth) && (
        <group position={[0, 0, 7.4]}>
          <mesh position={[0, 0.08, 0]} receiveShadow>
            <boxGeometry args={[frontApronWidth, 0.16, frontApronDepth]} />
            <meshStandardMaterial color="#e4edf4" metalness={0.04} roughness={0.72} />
          </mesh>
          <mesh position={[0, 0.24, 0]} receiveShadow>
            <boxGeometry args={[frontApronWidth * 0.78, 0.08, frontApronDepth * 0.44]} />
            <meshStandardMaterial color={districtVisual.shellAccent} emissive={districtVisual.districtGlow} emissiveIntensity={0.08} roughness={0.54} metalness={0.16} />
          </mesh>
        </group>
      )}
      <group position={[0, 0, 1.48]}>
        <mesh position={[0, 0.32, 0]} receiveShadow>
          <cylinderGeometry args={[3.9 * stageScale, 4.5 * stageScale, 0.46, 28]} />
          <meshStandardMaterial color="#0a1220" metalness={0.12} roughness={0.68} />
        </mesh>
        <mesh position={[0, 0.56, 0]} receiveShadow>
          <cylinderGeometry args={[3.52 * stageScale, 3.84 * stageScale, 0.12, 28]} />
          <meshStandardMaterial color={placement.color} emissive={placement.color} emissiveIntensity={0.08} roughness={0.48} />
        </mesh>
        {(isEliteBooth || isPremiumBooth) && (
          <mesh position={[0, 0.9, 0]} receiveShadow>
            <cylinderGeometry args={[4.34 * stageScale, 4.64 * stageScale, 0.14, 28]} />
            <meshStandardMaterial color="#0f1a28" metalness={0.2} roughness={0.52} />
          </mesh>
        )}
        <group position={[0, 3.1, 0]}>
          {!presentation.customInsertUrl && (
            <SponsorShowcaseObject
              accentColor={placement.color}
              fallbackMonogram={presentation.fallbackIdentity.monogram}
              mode={presentation.showcaseMode}
            />
          )}
        </group>
      </group>
      {isHeroNode && (
      <group position={[metrics.mediaWallPosition[0], metrics.mediaWallPosition[1], metrics.mediaWallPosition[2] + 0.46]}>
        {(isEliteBooth || isPremiumBooth) && showRichMedia && (
          <>
            <mesh position={[0, 0, -0.22]} castShadow>
              <boxGeometry args={[11.8 * mediaWallScale, 8.4 * mediaWallScale, 0.56]} />
              <meshStandardMaterial color="#08111c" metalness={0.14} roughness={0.66} />
            </mesh>
            <mesh position={[0, 4.5 * mediaWallScale, -0.06]} castShadow>
              <boxGeometry args={[8.2 * mediaWallScale, 0.58, 0.36]} />
              <meshStandardMaterial color={placement.color} emissive={placement.color} emissiveIntensity={0.14} roughness={0.52} metalness={0.18} />
            </mesh>
          </>
        )}
        {showRichMedia ? (
          <SponsorPosterPanel
            accentColor={placement.color}
            fallbackHeadline={presentation.fallbackIdentity.headline}
            fallbackSupportLine={presentation.fallbackIdentity.supportLine}
            isPlaying={isPosterPlaying}
            onTogglePlay={() => {
              setIsPosterPlaying((value) => !value);
              if (EXPO_FEATURE_FLAGS.enableAnalytics) {
                trackExpoBoothClicked(company, {
                  boothId: booth?.id ?? placement.id,
                  boothTemplate: presentation.template,
                  mediaAction: isPosterPlaying ? 'poster_pause' : 'poster_play',
                  hasVideo: Boolean(presentation.videoUrl),
                  interactionArea: 'media',
                });
              }
            }}
            posterUrl={presentation.posterUrl}
            videoUrl={presentation.videoUrl}
          />
        ) : (
          <mesh position={[0, 0, 0.12]}>
            <boxGeometry args={[8.8, 6.4, 0.18]} />
            <meshStandardMaterial color={placement.color} emissive={placement.color} emissiveIntensity={0.12} roughness={0.32} metalness={0.12} />
          </mesh>
        )}
      </group>
      )}
      {isHeroNode && showRichMedia && (
        <group position={[metrics.logoPanelPosition[0], metrics.logoPanelPosition[1], metrics.logoPanelPosition[2] - 0.28]}>
          <SponsorLogoPanel accentColor={placement.color} fallbackText={presentation.fallbackIdentity.monogram} url={presentation.logoUrl} />
        </group>
      )}
      {isHeroNode && showRichMedia && (
      <group position={[-sidePanelOffsetX, metrics.mediaWallPosition[1] + 0.36, metrics.mediaWallPosition[2] + (isEliteBooth ? 1.74 : 1.42)]}>
        <mesh castShadow>
          <boxGeometry args={[2.5 * sidePanelScale, 5.8 * sidePanelScale, 0.34]} />
          <meshStandardMaterial color="#08111c" metalness={0.12} roughness={0.58} />
        </mesh>
        <mesh position={[0, 0, 0.22]}>
          <planeGeometry args={[2.18 * sidePanelScale, 5.32 * sidePanelScale]} />
          {presentation.logoUrl ? (
            <Suspense fallback={<meshStandardMaterial color={placement.color} emissive={placement.color} emissiveIntensity={0.08} />}>
              <SponsorTextureSurface fallbackColor="#101827" url={presentation.logoUrl} />
            </Suspense>
          ) : (
            <meshStandardMaterial color="#0f172a" emissive={placement.color} emissiveIntensity={0.08} />
          )}
        </mesh>
      </group>
      )}
      {isHeroNode && showRichMedia && (
      <group position={[sidePanelOffsetX, metrics.mediaWallPosition[1] + 0.36, metrics.mediaWallPosition[2] + (isEliteBooth ? 1.74 : 1.42)]}>
        <mesh castShadow>
          <boxGeometry args={[2.5 * sidePanelScale, 5.8 * sidePanelScale, 0.34]} />
          <meshStandardMaterial color="#08111c" metalness={0.12} roughness={0.58} />
        </mesh>
        <mesh position={[0, 0, 0.22]}>
          <planeGeometry args={[2.18 * sidePanelScale, 5.32 * sidePanelScale]} />
          {presentation.posterUrl ? (
            <Suspense fallback={<meshStandardMaterial color="#101827" emissive={placement.color} emissiveIntensity={0.08} />}>
              <SponsorTextureSurface fallbackColor="#101827" url={presentation.posterUrl} />
            </Suspense>
          ) : (
            <meshStandardMaterial color="#0f172a" emissive={placement.color} emissiveIntensity={0.08} />
          )}
        </mesh>
      </group>
      )}
      <mesh position={[0, metrics.titlePosition[1] - 0.82, infoBandZ - 0.04]} castShadow>
        <boxGeometry args={[infoBandWidth + 1.46, infoBandHeight + 0.72, 0.48]} />
        <meshStandardMaterial color="#08111c" metalness={0.08} roughness={0.58} />
      </mesh>
      <mesh position={[0, metrics.titlePosition[1] + 0.52, infoBandZ + 0.02]} castShadow>
        <boxGeometry args={[Math.max(7.8, metrics.titleMaxWidth + (isEliteBooth ? 1.2 : 0.4)), 0.18, 0.18]} />
        <meshStandardMaterial color={placement.color} emissive={placement.color} emissiveIntensity={0.08} />
      </mesh>
      {showPremiumEyebrow && showDetailedText && (
        <Text
          position={[metrics.titlePosition[0], metrics.titlePosition[1] + 0.92, metrics.titlePosition[2] - 0.08]}
          fontSize={isEliteBooth ? 0.34 : 0.28}
          color={isEliteBooth ? '#99f6e4' : '#bae6fd'}
          anchorX="center"
          anchorY="middle"
          maxWidth={Math.max(8.2, metrics.titleMaxWidth)}
        >
          {isEliteBooth ? 'UNREAL-POWERED BUYER SUITE' : 'PREMIUM LIVE SHOWROOM'}
        </Text>
      )}
      <mesh position={[-((infoBandWidth * 0.5) + 0.54), metrics.titlePosition[1] - 0.86, infoBandZ + 0.02]} castShadow>
        <boxGeometry args={[0.24, infoBandHeight + 0.42, 0.18]} />
        <meshStandardMaterial color={placement.color} emissive={placement.color} emissiveIntensity={0.1} />
      </mesh>
      <mesh position={[(infoBandWidth * 0.5) + 0.54, metrics.titlePosition[1] - 0.86, infoBandZ + 0.02]} castShadow>
        <boxGeometry args={[0.24, infoBandHeight + 0.42, 0.18]} />
        <meshStandardMaterial color={placement.color} emissive={placement.color} emissiveIntensity={0.06} />
      </mesh>
      {showDetailedText && (
        <Text position={metrics.titlePosition} fontSize={nameFontSize * 0.84} color="#f8fafc" anchorX="center" anchorY="middle" maxWidth={metrics.titleMaxWidth - 1.1}>{presentation.displayName.toUpperCase()}</Text>
      )}
      {showTagline && showDetailedText && (
        <Text position={metrics.taglinePosition} fontSize={metrics.titleMaxWidth <= 10 ? 0.36 : 0.42} color="#94a3b8" anchorX="center" anchorY="middle" maxWidth={Math.max(8.4, metrics.titleMaxWidth - 2.4)}>{(presentation.tagline || '').toUpperCase()}</Text>
      )}
      {showBadge && showDetailedText && <SponsorBadge accentColor={placement.color} label={presentation.badgeLabel} position={[metrics.badgePosition[0], metrics.badgePosition[1] + (showPremiumEyebrow ? 0.14 : 0), metrics.badgePosition[2] - 0.46]} />}
      <mesh position={[metrics.ctaPosition[0], metrics.ctaPosition[1] - 0.12, metrics.ctaPosition[2] - 0.14]} castShadow>
        <boxGeometry args={[7.84, 1.02, 0.44]} />
        <meshStandardMaterial color="#08111c" metalness={0.1} roughness={0.6} />
      </mesh>
      <mesh position={[metrics.ctaPosition[0], metrics.ctaPosition[1] - 0.12, metrics.ctaPosition[2] + 0.08]} castShadow>
        <boxGeometry args={[6.92, 0.16, 0.18]} />
        <meshStandardMaterial color={placement.color} emissive={placement.color} emissiveIntensity={0.08} />
      </mesh>
      {showFullBoothUi && (
        <group position={[metrics.ctaPosition[0], metrics.ctaPosition[1], metrics.ctaPosition[2] + 0.06]}>
          <SponsorCtaStrip actions={presentation.actions} color={placement.color} onAction={onAction} />
        </group>
      )}
      {(presentation.template === 'hero_gallery' || presentation.template === 'hero_forum') && (
        <mesh position={[0, 0.4, 8.6]} receiveShadow>
          <boxGeometry args={[18, 0.12, 2]} />
          <meshStandardMaterial color={districtVisual.shellAccent} emissive={districtVisual.districtGlow} emissiveIntensity={districtVisual.expressionMode === 'active-commercial' ? 0.18 : 0.08} />
        </mesh>
      )}
    </group>
  );
}
const PLAYER_RADIUS = 1.2;
const PLAYER_WALK_SPEED = 48;

function Player({
  bounds,
  debug = false,
  mode,
  onMove,
}: {
  bounds: { minX: number; maxX: number; minZ: number; maxZ: number };
  debug?: boolean;
  mode: ExpoMode;
  onMove: (pos: number[]) => void;
}) {
  const { camera, scene } = useThree();
  const [mov, setMov] = useState({ f: false, b: false, l: false, r: false });
  const raycaster = useRef(new THREE.Raycaster());
  const moveVector = useRef(new THREE.Vector3());
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
      }
    };

    const onKeyUp = (event: KeyboardEvent) => {
      switch (event.code) {
        case 'KeyW': setMov((value) => ({ ...value, f: false })); break;
        case 'KeyS': setMov((value) => ({ ...value, b: false })); break;
        case 'KeyA': setMov((value) => ({ ...value, l: false })); break;
        case 'KeyD': setMov((value) => ({ ...value, r: false })); break;
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

    const speed = PLAYER_WALK_SPEED * delta;
    moveVector.current.set(0, 0, 0);

    if (mov.f) moveVector.current.z -= speed;
    if (mov.b) moveVector.current.z += speed;
    if (mov.l) moveVector.current.x -= speed;
    if (mov.r) moveVector.current.x += speed;

    const moved = moveVector.current.lengthSq() > 0;

    if (moved) {
      const moveDir = moveVector.current.clone().applyQuaternion(camera.quaternion);
      moveDir.y = 0;
      const nextPos = camera.position.clone().add(moveDir);
      const origin = nextPos.clone();
      origin.y -= 1;

      const checkCollision = (pos: THREE.Vector3, dir: THREE.Vector3) => {
        raycaster.current.set(pos, dir);
        const intersects = raycaster.current.intersectObjects(collectPlayerCollisionTargets(scene), false);
        return intersects.find((entry) => entry.object.visible && isCollisionMesh(entry.object));
      };

      const collisionDirections = [
        new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion).setY(0).normalize(),
        new THREE.Vector3(0, 0, 1).applyQuaternion(camera.quaternion).setY(0).normalize(),
        new THREE.Vector3(-1, 0, 0).applyQuaternion(camera.quaternion).setY(0).normalize(),
        new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion).setY(0).normalize(),
        new THREE.Vector3(0, -1, 0),
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
    : (mode === 'walk' ? <PointerLockControls onUnlock={() => document.body.style.cursor = 'auto'} /> : null);
}

interface ExpoWorldSceneProps {
  activeZone: any;
  debug: boolean;
  guests: any[];
  mode: ExpoMode;
  onMove: (pos: number[]) => void;
  sceneVersion: string | null;
  worldContract: ExpoWorldContract;
  zoneSystem: any;
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

export function ExpoWorldScene({ activeZone, debug, guests: _guests, mode, onMove, sceneVersion, worldContract, zoneSystem }: ExpoWorldSceneProps) {
  const { boothPlacements, districtPrograms, plan: _boulevardPlan, playBounds, qualityProfileInputs, sectorMarkers, startView, visualProfile, walkRegions } = worldContract;
  const visibleBoothPlacements = useMemo(
    () => selectVisibleBoothPlacements(boothPlacements, districtPrograms),
    [boothPlacements, districtPrograms]
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
        dpr={EXPO_CITY_QUALITY_TIER === 'quality' ? [0.85, 1.2] : [0.55, 0.8]}
        gl={{ antialias: false, powerPreference: 'high-performance' }}
        performance={{ min: EXPO_CITY_QUALITY_TIER === 'quality' ? 0.5 : 0.85 }}
        camera={{ position: [0, 2, 10], fov: 60, far: 10000 }}
      >
        <SceneBridge startView={startView} />
        <Suspense fallback={null}>
            <AdaptiveDpr />
            <AdaptiveEvents />
            <Sky distance={450000} sunPosition={[100, 20, 100]} inclination={0.49} azimuth={0.25} />
            {EXPO_FEATURE_FLAGS.enableStreetEnvironmentLighting ? (
              <Environment files="/models/modern_evening_street_4k.exr" />
            ) : (
              <Environment preset="park" />
            )}
            <ambientLight intensity={0.55} />
            <directionalLight position={[20, 34, 14]} intensity={2.15} castShadow={false} />
            <hemisphereLight args={['#d7ecff', '#7f8ea3', 1.05]} />
            {EXPO_FEATURE_FLAGS.enableFog && <fog attach="fog" args={['#9eb6d4', 180, 520]} />}

            <GroundPlane visualProfile={visualProfile} />
            <ExpoDistrictPromenade boothPlacements={boothPlacements} sectorMarkers={sectorMarkers} />
            <CleanExpoCitySkeleton boothPlacements={visibleBoothPlacements} districtPrograms={districtPrograms} visualProfile={visualProfile} />
            <ExpoRearCampus boothPlacements={visibleBoothPlacements} visualProfile={visualProfile} />
            {EXPO_FEATURE_FLAGS.enableCuratedSkylineRing && (
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
              <group>
                {visibleBoothPlacements.map((placement) => (
                  <DistrictBooth
                    key={placement.id}
                    placement={placement}
                    playerPosition={playerPosition}
                    visualProfile={visualProfile}
                  />
                ))}
              </group>

              {visibleBoothPlacements.length === 0 && (
                <Html position={[0, 8, 0]} center>
                  <div style={{ background: 'rgba(15, 23, 42, 0.9)', color: 'white', padding: '16px 20px', borderRadius: '14px', border: '1px solid rgba(59, 130, 246, 0.35)', width: '320px', textAlign: 'center' }}>
                    Sponsor booths are not loaded yet. Check /api/expo/scene or the underlying Supabase sector and company data.
                </div>
              </Html>
            )}

            <Player
              bounds={playBounds}
              debug={debug}
              mode={mode}
              onMove={(position) => {
                setPlayerPosition([position[0], position[1], position[2]]);
                onMove(position);
              }}
            />
        </Suspense>
      </Canvas>
    </>
  );
}

export function Expo3DLoader() {
  return <Loader />;
}




