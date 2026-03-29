import React, { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Environment, Html, Loader, OrbitControls, PointerLockControls, Sky, Text, useGLTF, useVideoTexture } from '@react-three/drei';
import { useNavigate } from 'react-router-dom';
import * as THREE from 'three';
import { BoothUI } from '../../../components/BoothUI';
import { normalizeModel } from '../../../utils/threeUtils';
import { AmbientMotionLayer } from './AmbientMotionLayer';
import { ArrivalReveal } from './ArrivalReveal';
import { BoothArchitectureKit, getBoothArchitectureMetrics, getBoothColliderSegments } from './BoothArchitectureKit';
import { CuratedSkylineRing } from './CuratedSkylineRing';
import { DistrictAnchorNodes } from './DistrictAnchorNodes';
import { ExpoEvidenceProbe } from './ExpoEvidenceProbe';
import { ExpoLandmarkLayer } from './ExpoLandmarkLayer';
import { ProgrammedFillerLayer } from './ProgrammedFillerLayer';
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
import { resolveExpoBackdropStrategy, sanitizeExpoBackdropCityScene, type ExpoBackdropStrategy } from '../lib/backdropSanitization';
import { buildExpoCuratedPropPlacements, type ExpoCuratedPropKey } from '../lib/expoCuratedPropPlacement';
import { getExpoGroundFallbackProfile, getExpoGroundTextureCandidates } from '../lib/expoGroundMaterialManifest';
import { resolveExpoTextureCandidateUrls } from '../lib/expoTexturePipeline';
import { buildSponsorScreenLayout, type SponsorScreenNode } from '../lib/sponsorScreenLayout';
import { buildSponsorBoothPresentation, getSponsorNameFontSize, resolveSponsorCtaIntent, type SponsorBoothTemplate, type SponsorCta } from '../lib/sponsorBoothPresentation';
import { EXPO_CITY_QUALITY_TIER, EXPO_FEATURE_FLAGS, EXPO_SPATIAL_DEBUG_FLAGS, type ExpoMode } from '../state/expoRuntime';
import { buildBoothPlacements, buildExpoPlayBounds, buildExpoSectorMarkers, buildExpoSponsorStartView, buildExpoWalkRegions, buildSponsorBoulevardLayout, replaceDistrictBoothZones, type ExpoBoothPlacement, type ExpoStartView, type ExpoWalkRegion } from '../sceneWorld';

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

function PrimitiveCityModel({
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

function Guests({ guests }: { guests: any[] }) {
  return (
    <group>
      {guests.map((guest) => (
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

function GroundPlane() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]} receiveShadow={false}>
      <planeGeometry args={[2000, 2000]} />
      <meshStandardMaterial color="#0f1724" roughness={0.88} metalness={0.06} />
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
  tree_small: '/models/expo/props/tree-small.glb',
  tree_large: '/models/expo/props/tree-large.glb',
  bush: '/models/expo/props/bush.glb',
  big_bush: '/models/expo/props/big-bush.glb',
};

function ExpoCuratedPropsLayer({
  boothPlacements,
  sectorMarkers,
}: {
  boothPlacements: ReturnType<typeof buildBoothPlacements>;
  sectorMarkers: ReturnType<typeof buildExpoSectorMarkers>;
}) {
  const sourceScenes = {
    planter: useGLTF(EXPO_CURATED_PROP_URLS.planter).scene,
    bench: useGLTF(EXPO_CURATED_PROP_URLS.bench).scene,
    bench_cushion_low: useGLTF(EXPO_CURATED_PROP_URLS.bench_cushion_low).scene,
    light_square: useGLTF(EXPO_CURATED_PROP_URLS.light_square).scene,
    light_square_double: useGLTF(EXPO_CURATED_PROP_URLS.light_square_double).scene,
    light_curved: useGLTF(EXPO_CURATED_PROP_URLS.light_curved).scene,
    sign_highway: useGLTF(EXPO_CURATED_PROP_URLS.sign_highway).scene,
    sign_highway_wide: useGLTF(EXPO_CURATED_PROP_URLS.sign_highway_wide).scene,
    info_kiosk_base_computer_screen: useGLTF(EXPO_CURATED_PROP_URLS.info_kiosk_base_computer_screen).scene,
    tree_small: useGLTF(EXPO_CURATED_PROP_URLS.tree_small).scene,
    tree_large: useGLTF(EXPO_CURATED_PROP_URLS.tree_large).scene,
    bush: useGLTF(EXPO_CURATED_PROP_URLS.bush).scene,
    big_bush: useGLTF(EXPO_CURATED_PROP_URLS.big_bush).scene,
  } as const;

  const placements = useMemo(
    () => buildExpoCuratedPropPlacements(boothPlacements, sectorMarkers, { showcase: EXPO_FEATURE_FLAGS.enableEnhancedBoulevardDetail }),
    [boothPlacements, sectorMarkers]
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
          <meshStandardMaterial color="#08111f" emissive={placement.accentColor || '#2563eb'} emissiveIntensity={0.08} metalness={0.25} roughness={0.42} />
        </mesh>
        <mesh position={[0, -1.85, 0.12]} castShadow>
          <boxGeometry args={[4.6, 0.55, 0.18]} />
          <meshStandardMaterial color={placement.accentColor || '#2563eb'} emissive={placement.accentColor || '#2563eb'} emissiveIntensity={0.18} />
        </mesh>
        <Text position={[0, 0.38, 0.16]} fontSize={0.72} maxWidth={7.6} color="#f8fafc" anchorX="center" anchorY="middle">
          {(placement.label || 'SPONSOR DISTRICT').toUpperCase()}
        </Text>
        <Text position={[0, -0.68, 0.16]} fontSize={0.28} maxWidth={7} color="#bfdbfe" anchorX="center" anchorY="middle">
          {(placement.subLabel || 'WAYFINDING').toUpperCase()}
        </Text>
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
        <Text position={[0, 0.15, 0.08]} fontSize={0.18} maxWidth={1.7} color="#f8fafc" anchorX="center" anchorY="middle">
          {(placement.label || 'SPONSOR INFO').toUpperCase()}
        </Text>
        <Text position={[0, -0.34, 0.08]} fontSize={0.1} maxWidth={1.6} color="#cbd5e1" anchorX="center" anchorY="middle">
          {(placement.subLabel || 'INFO DESK').toUpperCase()}
        </Text>
      </group>
    );
  }

  return null;
}

function BoulevardGrassClusters({ clusters }: { clusters: ReturnType<typeof buildBoulevardArtPass>['grassClusters'] }) {
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
  boothPlacements: ReturnType<typeof buildBoothPlacements>;
  sectorMarkers: ReturnType<typeof buildExpoSectorMarkers>;
}) {
  const artPass = useMemo(
    () => buildBoulevardArtPass(boothPlacements, sectorMarkers, { showcase: EXPO_FEATURE_FLAGS.enableEnhancedBoulevardDetail }),
    [boothPlacements, sectorMarkers]
  );
  const [textures, setTextures] = useState<THREE.Texture[] | null>(null);

  useEffect(() => {
    if (!EXPO_FEATURE_FLAGS.enablePremiumGroundTextures) {
      setTextures(null);
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
      {EXPO_FEATURE_FLAGS.enableBoulevardGrassClusters && <BoulevardGrassClusters clusters={artPass.grassClusters} />}
    </group>
  );
}

function DistrictGatewayNode({ marker }: { marker: ReturnType<typeof buildExpoSectorMarkers>[number] }) {
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
      <Text position={[0, 7.8, 1.25]} fontSize={1.25} color="#f8fafc" anchorX="center" anchorY="middle" maxWidth={13}>
        {marker.label.toUpperCase()}
      </Text>
      <Text position={[0, 4.7, 1.25]} fontSize={0.58} color="#cbd5e1" anchorX="center" anchorY="middle">
        {marker.side === 'left' ? 'WEST HALL' : 'EAST HALL'}
      </Text>
      <mesh position={[marker.side === 'left' ? 12 : -12, 0.2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[12, 3.2]} />
        <meshStandardMaterial color={accent} transparent opacity={0.18} />
      </mesh>
    </group>
  );
}

function ExpoDistrictPromenade({
  boothPlacements,
  sectorMarkers,
}: {
  boothPlacements: ReturnType<typeof buildBoothPlacements>;
  sectorMarkers: ReturnType<typeof buildExpoSectorMarkers>;
}) {
  return (
    <group name="expo-district-promenade">
      {EXPO_FEATURE_FLAGS.enableGroundArtPass && (
        <BoulevardGroundArt boothPlacements={boothPlacements} sectorMarkers={sectorMarkers} />
      )}
      {Array.from({ length: 14 }, (_, index) => 8 - index * 28).map((z) => (
        <mesh key={`lane-${z}`} position={[0, 0.08, z]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[1.4, 12]} />
          <meshStandardMaterial color="#f8fafc" emissive="#cbd5e1" emissiveIntensity={0.1} />
        </mesh>
      ))}
      {!EXPO_SPATIAL_DEBUG_FLAGS.disableArrivalReveal && <ArrivalReveal />}
      {sectorMarkers.map((marker) => (
        <DistrictGatewayNode key={marker.id} marker={marker} />
      ))}
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
  playBounds: ReturnType<typeof buildExpoPlayBounds>;
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
    const loader = new THREE.TextureLoader();
    const candidateUrls = resolveExpoTextureCandidateUrls(url);

    loadTextureWithCandidateUrls(loader, candidateUrls)
      .then((texture) => {
        if (!isActive) {
          return;
        }

        const clone = texture.clone();
        clone.colorSpace = THREE.SRGBColorSpace;
        clone.needsUpdate = true;
        setMappedTexture(clone);
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

  return <meshStandardMaterial color={fallbackColor} map={mappedTexture ?? undefined} transparent opacity={opacity} toneMapped={false} />;
}

function ScreenTextureMaterial({ fallbackColor, url }: { fallbackColor: string; url: string }) {
  const [mappedTexture, setMappedTexture] = useState<THREE.Texture | null>(null);

  useEffect(() => {
    let isActive = true;
    const loader = new THREE.TextureLoader();
    const candidateUrls = resolveExpoTextureCandidateUrls(url);

    loadTextureWithCandidateUrls(loader, candidateUrls)
      .then((texture) => {
        if (!isActive) {
          return;
        }

        const clone = texture.clone();
        clone.colorSpace = THREE.SRGBColorSpace;
        clone.needsUpdate = true;
        setMappedTexture(clone);
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

  return <meshStandardMaterial color={fallbackColor} emissive={fallbackColor} emissiveIntensity={0.08} map={mappedTexture ?? undefined} toneMapped={false} />;
}

function SponsorScreenGraphic({
  accentColor,
  fallbackEyebrow,
  fallbackMode = false,
  fallbackMonogram,
  size,
  url,
}: {
  accentColor: string;
  fallbackEyebrow?: string;
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
            <meshBasicMaterial color="#020617" transparent opacity={0.36} />
          </mesh>
          <Text position={[0, size[1] * 0.26, 0.05]} fontSize={Math.max(0.24, size[1] * 0.065)} color="#cbd5e1" anchorX="center" anchorY="middle" maxWidth={size[0] * 0.78}>
            {(fallbackEyebrow || 'CURATED RUNTIME IDENTITY').toUpperCase()}
          </Text>
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
  fallbackEyebrow,
  fallbackText,
  url,
}: {
  accentColor: string;
  fallbackEyebrow?: string;
  fallbackText: string;
  url: string | null;
}) {
  return (
    <group>
      <mesh position={[0, 0, 0.06]}>
        <planeGeometry args={[3.8, 3.8]} />
        {url ? (
          <Suspense fallback={<meshStandardMaterial color="#e2e8f0" />}>
            <SponsorTextureSurface fallbackColor="#ffffff" url={url} />
          </Suspense>
        ) : (
          <meshStandardMaterial color="#e2e8f0" />
        )}
      </mesh>
      {!url && (
        <>
          <mesh position={[0, 0, 0.1]}>
            <planeGeometry args={[3.3, 3.3]} />
            <meshBasicMaterial color="#020617" transparent opacity={0.1} />
          </mesh>
          <Text position={[0, 0.78, 0.18]} fontSize={0.22} color="#64748b" anchorX="center" anchorY="middle" maxWidth={2.9}>
            {(fallbackEyebrow || 'CURATED BRAND').toUpperCase()}
          </Text>
          <Text position={[0, -0.06, 0.18]} fontSize={1.15} color={accentColor} anchorX="center" anchorY="middle" maxWidth={3.2}>
            {fallbackText}
          </Text>
        </>
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

  return (
    <group>
      <mesh
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
        <planeGeometry args={[9.8, 5.8]} />
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
        <group position={[0, 0, 0.08]}>
          <mesh>
            <planeGeometry args={[8.6, 4.8]} />
            <meshBasicMaterial color="#020617" transparent opacity={0.18} />
          </mesh>
          <Text position={[0, 1.05, 0.08]} fontSize={0.62} color="#f8fafc" anchorX="center" anchorY="middle" maxWidth={7.6}>
            {(fallbackHeadline || 'LIVE PRODUCT STORY').toUpperCase()}
          </Text>
          <Text position={[0, -0.2, 0.08]} fontSize={0.28} color="#cbd5e1" anchorX="center" anchorY="middle" maxWidth={7.4}>
            {(fallbackSupportLine || 'MEET THE TEAM • FOLLOW THE CTA • ENTER THE DEMO ROOM').toUpperCase()}
          </Text>
          <mesh position={[0, -1.55, 0.1]}>
            <planeGeometry args={[3.9, 0.7]} />
            <meshBasicMaterial color={accentColor} transparent opacity={0.88} />
          </mesh>
          <Text position={[0, -1.55, 0.12]} fontSize={0.26} color="#f8fafc" anchorX="center" anchorY="middle">
            CURATED PREVIEW
          </Text>
        </group>
      )}
      <mesh position={[0, -3.3, 0.08]}>
        <planeGeometry args={[9.8, 0.9]} />
        <meshStandardMaterial color="#020617" metalness={0.08} roughness={0.84} />
      </mesh>
      <Text position={[0, -3.28, 0.16]} fontSize={0.48} color="#cbd5e1" anchorX="center" anchorY="middle">
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
        <boxGeometry args={[4.8, 1.1, 0.4]} />
        <meshStandardMaterial color={accentColor} emissive={accentColor} emissiveIntensity={0.18} />
      </mesh>
      <Text position={[0, 0, 0.28]} fontSize={0.46} color="#f8fafc" anchorX="center" anchorY="middle">
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
  return (
    <group>
      {actions.map((action, index) => {
        const x = (index - ((actions.length - 1) / 2)) * 3.6;

        return (
          <group key={`${action.kind}-${index}`} position={[x, 0, 0]}>
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
              <boxGeometry args={[3, 0.9, 1]} />
              <meshStandardMaterial color={action.disabled ? '#1e293b' : action.kind === 'demo_room' ? color : '#0f172a'} metalness={0.12} roughness={0.78} />
            </mesh>
            <Text position={[0, 0, 0.62]} fontSize={0.34} color={action.disabled ? '#94a3b8' : '#f8fafc'} anchorX="center" anchorY="middle" maxWidth={2.5}>
              {action.label.toUpperCase()}
            </Text>
          </group>
        );
      })}
    </group>
  );
}

function SponsorScreenNodeView({ node }: { node: SponsorScreenNode }) {
  if (node.kind === 'facade') {
    return (
      <group position={node.position} rotation={node.rotation}>
        <mesh castShadow>
          <boxGeometry args={[node.size[0] + 5, node.size[1] + 4, 1.8]} />
          <meshStandardMaterial color="#07101a" metalness={0.22} roughness={0.72} />
        </mesh>
        <mesh position={[0, 0, 0.58]} castShadow>
          <boxGeometry args={[node.size[0] + 1.4, node.size[1] + 1.2, 0.6]} />
          <meshStandardMaterial color={node.accentColor} emissive={node.accentColor} emissiveIntensity={0.14} />
        </mesh>
        <group position={[0, 0, 0.94]}>
          <SponsorScreenGraphic accentColor={node.accentColor} fallbackEyebrow={node.fallbackEyebrow} fallbackMode={node.fallbackMode} fallbackMonogram={node.fallbackMonogram} size={node.size} url={node.imageUrl} />
        </group>
        <Text position={[0, -(node.size[1] * 0.5) - 2.1, 1.1]} fontSize={1.15} color="#f8fafc" anchorX="center" anchorY="middle" maxWidth={node.size[0] - 4}>
          {node.title.toUpperCase()}
        </Text>
        <Text position={[0, -(node.size[1] * 0.5) - 3.7, 1.1]} fontSize={0.56} color="#cbd5e1" anchorX="center" anchorY="middle" maxWidth={node.size[0] - 6}>
          {node.subtitle.toUpperCase()}
        </Text>
        {node.fallbackMode && (
          <Text position={[0, (node.size[1] * 0.5) - 1.2, 1.1]} fontSize={0.52} color="#f8fafc" anchorX="center" anchorY="middle">
            {node.ctaLabel.toUpperCase()}
          </Text>
        )}
      </group>
    );
  }

  if (node.kind === 'medium_billboard') {
    return (
      <group position={node.position} rotation={node.rotation}>
        <mesh position={[0, 0, 0]} castShadow>
          <boxGeometry args={[node.size[0] + 1.6, node.size[1] + 1.1, 0.9]} />
          <meshStandardMaterial color="#08111c" metalness={0.18} roughness={0.76} />
        </mesh>
        <group position={[0, 0, 0.52]}>
          <SponsorScreenGraphic accentColor={node.accentColor} fallbackEyebrow={node.fallbackEyebrow} fallbackMode={node.fallbackMode} fallbackMonogram={node.fallbackMonogram} size={node.size} url={node.imageUrl} />
        </group>
        <mesh position={[0, -(node.size[1] * 0.5) - 1.8, 0]} castShadow>
          <boxGeometry args={[0.85, 7.2, 0.85]} />
          <meshStandardMaterial color="#111827" metalness={0.14} roughness={0.8} />
        </mesh>
        <Text position={[0, -(node.size[1] * 0.5) - 0.85, 0.6]} fontSize={0.58} color="#f8fafc" anchorX="center" anchorY="middle" maxWidth={node.size[0] - 1}>
          {node.title.toUpperCase()}
        </Text>
        <Text position={[0, -(node.size[1] * 0.5) - 1.7, 0.6]} fontSize={0.32} color="#cbd5e1" anchorX="center" anchorY="middle" maxWidth={node.size[0] - 1.4}>
          {node.subtitle.toUpperCase()}
        </Text>
        {node.fallbackMode && (
          <Text position={[0, (node.size[1] * 0.5) - 0.62, 0.6]} fontSize={0.3} color="#f8fafc" anchorX="center" anchorY="middle">
            {node.ctaLabel.toUpperCase()}
          </Text>
        )}
      </group>
    );
  }

  return (
    <group position={node.position} rotation={node.rotation}>
      <mesh castShadow>
        <boxGeometry args={[node.size[0] + 1.1, node.size[1] + 1.4, 1.1]} />
        <meshStandardMaterial color="#07101a" metalness={0.16} roughness={0.82} />
      </mesh>
      <group position={[0, 0.3, 0.58]}>
        <SponsorScreenGraphic accentColor={node.accentColor} fallbackEyebrow={node.fallbackEyebrow} fallbackMode={node.fallbackMode} fallbackMonogram={node.fallbackMonogram} size={node.size} url={node.imageUrl} />
      </group>
      <mesh position={[0, -(node.size[1] * 0.5) - 1.2, 0]} castShadow>
        <boxGeometry args={[1.05, 3.2, 1.05]} />
        <meshStandardMaterial color={node.accentColor} emissive={node.accentColor} emissiveIntensity={0.12} />
      </mesh>
      <Text position={[0, (node.size[1] * 0.5) + 0.9, 0.7]} fontSize={0.46} color="#f8fafc" anchorX="center" anchorY="middle" maxWidth={node.size[0] + 0.5}>
        {node.title.toUpperCase()}
      </Text>
      {node.fallbackMode && (
        <Text position={[0, -(node.size[1] * 0.5) - 0.42, 0.7]} fontSize={0.24} color="#cbd5e1" anchorX="center" anchorY="middle" maxWidth={node.size[0] + 0.4}>
          {node.ctaLabel.toUpperCase()}
        </Text>
      )}
    </group>
  );
}

function SponsorScreenHierarchy({
  boothPlacements,
  sectorMarkers,
}: {
  boothPlacements: ReturnType<typeof buildBoothPlacements>;
  sectorMarkers: ReturnType<typeof buildExpoSectorMarkers>;
}) {
  const layout = useMemo(() => buildSponsorScreenLayout(boothPlacements, sectorMarkers), [boothPlacements, sectorMarkers]);

  return (
    <group name="sponsor-screen-hierarchy">
      {EXPO_FEATURE_FLAGS.enableFacadeScreens && layout.facadeScreens.map((node) => (
        <SponsorScreenNodeView key={node.id} node={node} />
      ))}
      {layout.mediumScreens.map((node) => (
        <SponsorScreenNodeView key={node.id} node={node} />
      ))}
      {EXPO_FEATURE_FLAGS.enableBoulevardGroundScreens && layout.groundScreens.map((node) => (
        <SponsorScreenNodeView key={node.id} node={node} />
      ))}
    </group>
  );
}

function SponsorBillboards({ placements }: { placements: ReturnType<typeof buildBoothPlacements>; }) {
  const billboardPlacements = useMemo(() => (
    [...placements]
      .filter((placement) => placement.nodeType === 'hero_left' || placement.nodeType === 'hero_right' || placement.nodeType === 'endcap')
      .sort((left, right) => (Number(right.priority || 0) - Number(left.priority || 0)))
      .slice(0, 6)
  ), [placements]);

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

function DistrictBooth({ placement }: { placement: ExpoBoothPlacement }) {
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
  const onAction = (action: SponsorCta) => {
    const intent = resolveSponsorCtaIntent(action, presentation);
    if (!intent) {
      return;
    }

    if (intent.type === 'navigate') {
      if (EXPO_FEATURE_FLAGS.enableAnalytics) {
        trackExpoDemoRoomEntered(company, { boothId: booth?.id ?? placement.id, boothTemplate: presentation.template, sectorName: placement.sectorName });
      }
      nav(intent.target);
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
      onClick={() => {
        if (EXPO_FEATURE_FLAGS.enableAnalytics) {
          trackExpoBoothClicked(company, {
            boothId: booth?.id ?? placement.id,
            boothTemplate: presentation.template,
            nodeType: placement.nodeType,
            sectorName: placement.sectorName,
          });
        }
      }}
    >
      <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={metrics.footprintSize} />
        <meshStandardMaterial color={placement.districtTheme.groundPalette.lightPool} transparent opacity={0.1} />
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
        : <BoothArchitectureKit accentColor={placement.color} template={presentation.template} />}
      {presentation.customInsertUrl && (
        <Suspense fallback={null}>
          <CustomBoothInsert template={presentation.template} url={presentation.customInsertUrl} />
        </Suspense>
      )}
      <group position={metrics.mediaWallPosition}>
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
      </group>
      <group position={metrics.logoPanelPosition}>
        <mesh castShadow>
          <boxGeometry args={[4.4, 4.4, 0.6]} />
          <meshStandardMaterial color="#020617" />
        </mesh>
        <SponsorLogoPanel accentColor={placement.color} fallbackEyebrow={presentation.fallbackIdentity.eyebrow} fallbackText={presentation.fallbackIdentity.monogram} url={presentation.logoUrl} />
      </group>
      <Text position={metrics.titlePosition} fontSize={nameFontSize} color="#f8fafc" anchorX="center" anchorY="middle" maxWidth={metrics.titleMaxWidth}>{presentation.displayName.toUpperCase()}</Text>
      <Text position={metrics.taglinePosition} fontSize={metrics.titleMaxWidth <= 10 ? 0.44 : 0.52} color="#cbd5e1" anchorX="center" anchorY="middle" maxWidth={Math.max(10, metrics.titleMaxWidth - 1)}>{(presentation.tagline || '').toUpperCase()}</Text>
      <SponsorBadge accentColor={placement.color} label={presentation.badgeLabel} position={metrics.badgePosition} />
      <group position={metrics.ctaPosition}>
        <SponsorCtaStrip actions={presentation.actions} color={placement.color} onAction={onAction} />
      </group>
      {placement.sectorName && (
        <Text position={metrics.sectorLabelPosition} fontSize={0.44} color="#93c5fd" anchorX="center" anchorY="middle">{placement.sectorName.toUpperCase()}</Text>
      )}
      {(presentation.template === 'hero_gallery' || presentation.template === 'hero_forum') && (
        <mesh position={[0, 0.4, 8.6]} receiveShadow>
          <boxGeometry args={[18, 0.12, 2]} />
          <meshStandardMaterial color={placement.color} emissive={placement.color} emissiveIntensity={0.16} />
        </mesh>
      )}
    </group>
  );
}
const PLAYER_RADIUS = 1.2;

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

    const speed = 12 * delta;
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

    if (moved && Date.now() - lastMoveTime.current > 200) {
      lastMoveTime.current = Date.now();
      onMove([camera.position.x, camera.position.y, camera.position.z]);
    }
  });

  return mode === 'fly'
    ? <OrbitControls enablePan enableZoom enableRotate maxDistance={500} enableDamping dampingFactor={0.05} />
    : (mode === 'walk' ? <PointerLockControls onUnlock={() => document.body.style.cursor = 'auto'} /> : null);
}

interface ExpoWorldSceneProps {
  activeZone: any;
  data: any;
  debug: boolean;
  guests: any[];
  mode: ExpoMode;
  onMove: (pos: number[]) => void;
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

export function ExpoWorldScene({ activeZone, data, debug, guests, mode, onMove, zoneSystem }: ExpoWorldSceneProps) {
  const boulevardPlan = useMemo(() => buildSponsorBoulevardLayout(data), [data]);
  const boothPlacements = useMemo(() => buildBoothPlacements(data), [data]);
  const sectorMarkers = useMemo(() => buildExpoSectorMarkers(data), [data]);
  const startView = useMemo(() => buildExpoSponsorStartView(boulevardPlan), [boulevardPlan]);
  const sectorCount = useMemo(() => {
    if (!Array.isArray(data?.sectors)) {
      return 0;
    }

    return new Set(
      data.sectors
        .map((sector: any) => String(sector?.id || '').trim())
        .filter((sectorId: string) => sectorId.length > 0)
    ).size;
  }, [data]);
  const playBounds = useMemo(() => buildExpoPlayBounds(boothPlacements), [boothPlacements]);
  const walkRegions = useMemo(() => buildExpoWalkRegions(boothPlacements), [boothPlacements]);
  const backdropStrategy = useMemo(
    () => resolveExpoBackdropStrategy({
      qualityPreset: EXPO_CITY_QUALITY_TIER,
      skylineRingEnabled: EXPO_FEATURE_FLAGS.enableCuratedSkylineRing,
    }),
    []
  );
  const [playerPosition, setPlayerPosition] = useState<[number, number, number]>([0, 0, 0]);
  const sceneLoadedRef = useRef(false);
  const viewedBoothsRef = useRef<Set<string>>(new Set());
  const lastSectorRef = useRef<string | null>(null);

  useEffect(() => {
    const zoneReplacement = replaceDistrictBoothZones(zoneSystem, boothPlacements);
    if (import.meta.env.DEV && zoneReplacement.replaced && zoneReplacement.registeredZoneCount !== boothPlacements.length) {
      console.warn('[ExpoWorld][Zones] District booth zone count mismatch after replacement.', {
        boothPlacementCount: boothPlacements.length,
        registeredZoneCount: zoneReplacement.registeredZoneCount,
      });
    }
  }, [boothPlacements, zoneSystem]);

  useEffect(() => {
    if (!EXPO_FEATURE_FLAGS.enableAnalytics) {
      return;
    }

    if (sceneLoadedRef.current) {
      return;
    }
    sceneLoadedRef.current = true;
    trackExpoSceneLoaded({
      boothCount: boothPlacements.length,
      mode,
      sectorCount,
    });
  }, [boothPlacements.length, mode, sectorCount]);

  useEffect(() => {
    if (!EXPO_FEATURE_FLAGS.enableAnalytics || !activeZone?.id) {
      return;
    }

    const placementId = String(activeZone.id).replace(/^district-booth-/, '');
    const placement = boothPlacements.find((entry) => entry.id === placementId);
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
  }, [activeZone, boothPlacements]);

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
      <BoothUI visible={!!activeZone} zoneName={activeZone?.id} />
      <Canvas shadows gl={{ antialias: true }} camera={{ position: [0, 2, 10], fov: 60, far: 10000 }}>
        <SceneBridge startView={startView} />
        <Suspense fallback={null}>
            <Sky distance={450000} sunPosition={[100, 20, 100]} inclination={0.49} azimuth={0.25} />
            {EXPO_FEATURE_FLAGS.enableStreetEnvironmentLighting ? (
              <Environment files="/models/modern_evening_street_4k.exr" />
            ) : (
              <Environment preset="city" />
            )}
            <ambientLight intensity={0.3} />
            <directionalLight position={[20, 30, 10]} intensity={1.5} castShadow={false} />
            <hemisphereLight args={['#87CEEB', '#222222', 0.5]} />
            {EXPO_FEATURE_FLAGS.enableFog && <fog attach="fog" args={['#0a0a0a', 80, 300]} />}

            <GroundPlane />
            <ExpoDistrictPromenade boothPlacements={boothPlacements} sectorMarkers={sectorMarkers} />
            {(EXPO_SPATIAL_DEBUG_FLAGS.showSpawnMarkers || EXPO_SPATIAL_DEBUG_FLAGS.showWalkCorridor) && (
              <SpawnDebugOverlay playBounds={playBounds} startView={startView} walkRegions={walkRegions} />
            )}
            <SponsorScreenHierarchy boothPlacements={boothPlacements} sectorMarkers={sectorMarkers} />
            {EXPO_FEATURE_FLAGS.enableSponsorBillboards && <SponsorBillboards placements={boothPlacements} />}

            {backdropStrategy.enableStaticCityShell && <PrimitiveCityModel debug={debug} strategy={backdropStrategy} />}
            {backdropStrategy.enableCuratedSkylineRing && !EXPO_SPATIAL_DEBUG_FLAGS.disableCuratedSkylineRing && (
              <SceneErrorBoundary fallback={null}>
                <CuratedSkylineRing
                  debugBounds={EXPO_SPATIAL_DEBUG_FLAGS.showSkylineBounds}
                  density={backdropStrategy.skylineDensity}
                  walkRegions={walkRegions}
                />
              </SceneErrorBoundary>
            )}
            {EXPO_FEATURE_FLAGS.enableDistrictLandmarks && !EXPO_SPATIAL_DEBUG_FLAGS.disableExpoLandmarkLayer && (
              <ExpoLandmarkLayer boothPlacements={boothPlacements} sectorMarkers={sectorMarkers} />
            )}
            <ProgrammedFillerLayer boothPlacements={boothPlacements} qualityPreset={EXPO_CITY_QUALITY_TIER} sectorMarkers={sectorMarkers} />
            {EXPO_FEATURE_FLAGS.enableCuratedExpoProps && (
              <SceneErrorBoundary fallback={null}>
                <ExpoCuratedPropsLayer boothPlacements={boothPlacements} sectorMarkers={sectorMarkers} />
              </SceneErrorBoundary>
            )}
            {EXPO_FEATURE_FLAGS.enableDistrictAnchorNodes && !EXPO_SPATIAL_DEBUG_FLAGS.disableDistrictAnchorNodes && (
              <DistrictAnchorNodes boothPlacements={boothPlacements} sectorMarkers={sectorMarkers} showcase={EXPO_FEATURE_FLAGS.enableEnhancedBoulevardDetail} />
            )}
            {EXPO_FEATURE_FLAGS.enableAmbientMotionLayer && <AmbientMotionLayer sectorMarkers={sectorMarkers} />}
            <ExpoEvidenceProbe
              activeZoneId={activeZone?.id ? String(activeZone.id) : null}
              mode={mode}
              playerPosition={playerPosition}
              qualityPreset={EXPO_CITY_QUALITY_TIER}
              sceneVersion={data?.sceneVersion ? String(data.sceneVersion) : null}
              sectorCount={sectorCount}
              sponsorCount={boothPlacements.length}
            />
            <Guests guests={guests} />

            <group>
              {boothPlacements.map((placement) => (
                <DistrictBooth
                  key={placement.id}
                  placement={placement}
                />
              ))}
            </group>

            {boothPlacements.length === 0 && (
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




