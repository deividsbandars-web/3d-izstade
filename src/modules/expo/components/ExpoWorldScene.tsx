import React, { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useLoader, useThree } from '@react-three/fiber';
import { Environment, Html, Loader, OrbitControls, PointerLockControls, Sky, Text, useGLTF, useVideoTexture } from '@react-three/drei';
import { useNavigate } from 'react-router-dom';
import * as THREE from 'three';
import { EXRLoader } from 'three/examples/jsm/loaders/EXRLoader.js';
import { BoothUI } from '../../../components/BoothUI';
import { normalizeModel } from '../../../utils/threeUtils';
import {
  trackExpoBookingClicked,
  trackExpoBoothClicked,
  trackExpoBoothViewed,
  trackExpoDemoRoomEntered,
  trackExpoSceneLoaded,
  trackExpoSectorEntered,
  trackExpoWebsiteOpened,
} from '../lib/expoAnalytics';
import { buildSponsorBoothPresentation, getSponsorNameFontSize, resolveSponsorCtaIntent, type SponsorBoothTemplate, type SponsorCta } from '../lib/sponsorBoothPresentation';
import { EXPO_FEATURE_FLAGS, type ExpoMode } from '../state/expoRuntime';
import { buildBoothPlacements, buildExpoPlayBounds, buildExpoSectorMarkers, replaceDistrictBoothZones } from '../sceneWorld';

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
const CITY_START_VIEW_KEY = 'cityStartView';
const PLAYER_COLLISION_TARGETS_CACHE_KEY = 'playerCollisionTargetsCache';
const PLAYER_COLLISION_TARGETS_CACHE_VERSION_KEY = 'playerCollisionTargetsCacheVersion';
const PLAYER_COLLISION_TARGETS_CACHE_RESOLVED_VERSION_KEY = 'playerCollisionTargetsCacheResolvedVersion';

type CityStartView = {
  position: [number, number, number];
  lookAt: [number, number, number];
};

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

function buildStaticCityStartView(bounds: THREE.Box3, fovDegrees: number): CityStartView {
  const center = bounds.getCenter(new THREE.Vector3());
  const size = bounds.getSize(new THREE.Vector3());
  const maxDim = Math.max(size.x, size.y, size.z, 1);
  const halfFovRadians = THREE.MathUtils.degToRad(fovDegrees * 0.5);
  const distance = (maxDim * 0.42) / Math.tan(Math.max(halfFovRadians, 0.1));

  return {
    position: [
      center.x - distance * 0.28,
      center.y + Math.max(14, size.y * 0.34),
      center.z + distance * 0.52,
    ],
    lookAt: [
      center.x,
      center.y + Math.max(5, size.y * 0.1),
      center.z,
    ],
  };
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

function PrimitiveCityModel({
  debug = false,
}: {
  debug?: boolean;
}) {
  const { scene } = useThree();
  const { scene: loadedCityScene } = useGLTF('/models/realistic_city.glb');
  const cityRoot = useMemo(() => {
    const clone = loadedCityScene.clone(true);
    clone.updateMatrixWorld(true);

    const initialBounds = new THREE.Box3().setFromObject(clone);
    const initialSize = initialBounds.getSize(new THREE.Vector3());
    const dominantSpan = Math.max(initialSize.x, initialSize.z, 1);
    const targetSpan = 900;
    const scaleFactor = THREE.MathUtils.clamp(targetSpan / dominantSpan, 0.001, 2);

    clone.scale.multiplyScalar(scaleFactor);
    clone.updateMatrixWorld(true);

    const normalizedBounds = new THREE.Box3().setFromObject(clone);
    const normalizedCenter = normalizedBounds.getCenter(new THREE.Vector3());
    const normalizedMin = normalizedBounds.min.clone();

    clone.position.x -= normalizedCenter.x;
    clone.position.z -= normalizedCenter.z;
    clone.position.y -= normalizedMin.y;
    clone.updateMatrixWorld(true);

    return clone;
  }, [loadedCityScene]);
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
      mode: 'static-city-glb',
      source: '/models/realistic_city.glb',
      bounds: {
        center: center.toArray(),
        size: size.toArray(),
      },
    });
    setSceneUserData(scene, CITY_START_VIEW_KEY, buildStaticCityStartView(bounds, 60));
  }, [cityRoot, scene]);

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
  const groundRef = useRef<THREE.Mesh>(null);
  usePlayerColliderRegistration(groundRef, 'expo-ground');

  return (
    <mesh ref={groundRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]} receiveShadow={false}>
      <planeGeometry args={[2000, 2000]} />
      <meshStandardMaterial color="#0a0a0a" roughness={0.8} metalness={0.1} />
    </mesh>
  );
}

function ExpoPromenadeSurface() {
  const walkwayTexture = useLoader(EXRLoader, '/textures/pergola_walkway_4k.exr');
  const mappedTexture = useMemo(() => {
    const texture = walkwayTexture.clone();
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(2.4, 7.2);
    texture.needsUpdate = true;
    return texture;
  }, [walkwayTexture]);

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.041, -126]} receiveShadow>
      <planeGeometry args={[48, 340]} />
      <meshStandardMaterial
        map={mappedTexture}
        color="#cbd5e1"
        roughness={0.82}
        metalness={0.08}
      />
    </mesh>
  );
}

function ExpoDistrictPromenade({
  sectorMarkers,
}: {
  sectorMarkers: ReturnType<typeof buildExpoSectorMarkers>;
}) {
  return (
    <group name="expo-district-promenade">
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, -126]} receiveShadow>
        <planeGeometry args={[156, 340]} />
        <meshStandardMaterial color="#111827" roughness={0.92} metalness={0.04} />
      </mesh>
      {EXPO_FEATURE_FLAGS.enablePromenadeTexture && <ExpoPromenadeSurface />}
      {[-24, -92, -160, -228].map((z) => (
        <mesh key={`cross-strip-${z}`} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, z]} receiveShadow>
          <planeGeometry args={[156, 12]} />
          <meshStandardMaterial color="#0f172a" roughness={0.86} metalness={0.06} />
        </mesh>
      ))}
      {Array.from({ length: 12 }, (_, index) => -34 - index * 26).map((z) => (
        <mesh key={`lane-${z}`} position={[0, 0.08, z]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[1.4, 12]} />
          <meshStandardMaterial color="#e2e8f0" emissive="#e2e8f0" emissiveIntensity={0.08} />
        </mesh>
      ))}
      <ArrivalPlaza />
      {sectorMarkers.map((marker) => (
        <group key={marker.id} position={marker.position}>
          <mesh position={[0, 6, 0]} castShadow>
            <boxGeometry args={[17, 10, 1.2]} />
            <meshStandardMaterial color="#0f172a" metalness={0.12} roughness={0.82} />
          </mesh>
          <mesh position={[0, 6, 0.65]}>
            <planeGeometry args={[14.5, 7.5]} />
            <meshStandardMaterial color={marker.color} emissive={marker.color} emissiveIntensity={0.22} transparent opacity={0.16} />
          </mesh>
          <Text position={[0, 7.6, 1.25]} fontSize={1.45} color="#f8fafc" anchorX="center" anchorY="middle" maxWidth={13}>
            {marker.label.toUpperCase()}
          </Text>
          <Text position={[0, 4.9, 1.25]} fontSize={0.72} color="#cbd5e1" anchorX="center" anchorY="middle">
            {marker.side === 'left' ? 'WEST HALL' : 'EAST HALL'}
          </Text>
          <mesh position={[marker.side === 'left' ? 12 : -12, 0.2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[12, 3.2]} />
            <meshStandardMaterial color={marker.color} transparent opacity={0.18} />
          </mesh>
        </group>
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

  const insertScale = template === 'hero_pavilion' ? 2.4 : template === 'standard_corner' ? 1.8 : 1.35;
  const insertPosition: [number, number, number] = template === 'hero_pavilion'
    ? [0, 0.24, -3.6]
    : template === 'standard_corner'
      ? [-2.6, 0.2, -2.2]
      : [0, 0.12, -1.8];

  return (
    <group position={insertPosition} scale={[insertScale, insertScale, insertScale]}>
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
  const texture = useLoader(THREE.TextureLoader, url);
  const mappedTexture = useMemo(() => {
    const clone = texture.clone();
    clone.colorSpace = THREE.SRGBColorSpace;
    clone.needsUpdate = true;
    return clone;
  }, [texture]);

  return <meshStandardMaterial color={fallbackColor} map={mappedTexture} transparent opacity={opacity} toneMapped={false} />;
}

function SponsorLogoPanel({ accentColor, fallbackText, url }: { accentColor: string; fallbackText: string; url: string | null }) {
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
        <Text position={[0, 0, 0.18]} fontSize={1.15} color={accentColor} anchorX="center" anchorY="middle" maxWidth={3.2}>
          {fallbackText}
        </Text>
      )}
    </group>
  );
}

function SponsorPosterPanel({
  accentColor,
  isPlaying,
  onTogglePlay,
  posterUrl,
  videoUrl,
}: {
  accentColor: string;
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
                onAction(action);
              }}
              onPointerOver={() => {
                document.body.style.cursor = 'pointer';
              }}
              onPointerOut={() => {
                document.body.style.cursor = 'auto';
              }}
            >
              <boxGeometry args={[3, 0.9, 1]} />
              <meshStandardMaterial color={action.kind === 'demo_room' ? color : '#0f172a'} metalness={0.12} roughness={0.78} />
            </mesh>
            <Text position={[0, 0, 0.62]} fontSize={0.34} color="#f8fafc" anchorX="center" anchorY="middle" maxWidth={2.5}>
              {action.label.toUpperCase()}
            </Text>
          </group>
        );
      })}
    </group>
  );
}

function SponsorBoothShell({
  accentColor,
  template,
}: {
  accentColor: string;
  template: SponsorBoothTemplate;
}) {
  if (template === 'hero_pavilion') {
    return (
      <group>
        <mesh position={[0, 0.25, 0]} receiveShadow>
          <boxGeometry args={[26, 0.5, 20]} />
          <meshStandardMaterial color="#e2e8f0" />
        </mesh>
        <mesh position={[0, 10, -8.2]} castShadow>
          <boxGeometry args={[24, 16, 1.1]} />
          <meshStandardMaterial color="#0f172a" metalness={0.16} roughness={0.76} />
        </mesh>
        <mesh position={[0, 17.5, -1.8]} castShadow>
          <boxGeometry args={[26, 1.1, 17]} />
          <meshStandardMaterial color="#111827" metalness={0.14} roughness={0.72} />
        </mesh>
        <mesh position={[-12.2, 8.6, -1.8]} castShadow>
          <boxGeometry args={[1.2, 17.2, 17]} />
          <meshStandardMaterial color={accentColor} emissive={accentColor} emissiveIntensity={0.18} />
        </mesh>
        <mesh position={[12.2, 8.6, -1.8]} castShadow>
          <boxGeometry args={[1.2, 17.2, 17]} />
          <meshStandardMaterial color={accentColor} emissive={accentColor} emissiveIntensity={0.18} />
        </mesh>
      </group>
    );
  }

  if (template === 'standard_corner') {
    return (
      <group>
        <mesh position={[0, 0.22, 0]} receiveShadow>
          <boxGeometry args={[20, 0.44, 16]} />
          <meshStandardMaterial color="#dbe4ef" />
        </mesh>
        <mesh position={[0, 8.6, -6.3]} castShadow>
          <boxGeometry args={[18, 13.5, 1]} />
          <meshStandardMaterial color="#0f172a" metalness={0.14} roughness={0.76} />
        </mesh>
        <mesh position={[-8.5, 8.4, 0]} castShadow>
          <boxGeometry args={[1, 13.2, 13]} />
          <meshStandardMaterial color={accentColor} emissive={accentColor} emissiveIntensity={0.16} />
        </mesh>
        <mesh position={[0, 14.8, -0.2]} castShadow>
          <boxGeometry args={[18, 0.8, 13]} />
          <meshStandardMaterial color="#111827" />
        </mesh>
      </group>
    );
  }

  return (
    <group>
      <mesh position={[0, 0.16, 0]} receiveShadow>
        <boxGeometry args={[14, 0.32, 10]} />
        <meshStandardMaterial color="#e5edf7" />
      </mesh>
      <mesh position={[0, 5.8, -3.4]} castShadow>
        <boxGeometry args={[12, 9, 0.9]} />
        <meshStandardMaterial color="#0f172a" metalness={0.12} roughness={0.8} />
      </mesh>
      <mesh position={[0, 10.25, -0.4]} castShadow>
        <boxGeometry args={[12, 0.7, 7.4]} />
        <meshStandardMaterial color={accentColor} emissive={accentColor} emissiveIntensity={0.16} />
      </mesh>
    </group>
  );
}

function ArrivalPlaza() {
  return (
    <group name="arrival-plaza" position={[0, 0, 18]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, -12]} receiveShadow>
        <planeGeometry args={[56, 34]} />
        <meshStandardMaterial color="#0f172a" roughness={0.88} metalness={0.06} />
      </mesh>
      <mesh position={[0, 14, -18]} castShadow>
        <boxGeometry args={[38, 1.2, 4]} />
        <meshStandardMaterial color="#020617" metalness={0.18} roughness={0.76} />
      </mesh>
      <mesh position={[-18, 7.6, -18]} castShadow>
        <boxGeometry args={[2, 15, 2]} />
        <meshStandardMaterial color="#1e293b" metalness={0.24} roughness={0.68} />
      </mesh>
      <mesh position={[18, 7.6, -18]} castShadow>
        <boxGeometry args={[2, 15, 2]} />
        <meshStandardMaterial color="#1e293b" metalness={0.24} roughness={0.68} />
      </mesh>
      <mesh position={[0, 0.25, -2]} receiveShadow>
        <cylinderGeometry args={[11.5, 13.5, 0.35, 40]} />
        <meshStandardMaterial color="#131c2e" />
      </mesh>
      <Text position={[0, 15.2, -15.6]} fontSize={3.6} color="#f8fafc" anchorX="center" anchorY="middle">WARPALA SPONSOR BOULEVARD</Text>
      <Text position={[0, 11.1, -17.4]} fontSize={1.05} color="#93c5fd" anchorX="center" anchorY="middle" maxWidth={48}>ARRIVE. DISCOVER SPONSORS. OPEN DEMOS. BOOK LIVE MEETINGS.</Text>
      <Text position={[0, 0.88, -1.8]} fontSize={1.2} color="#38bdf8" anchorX="center" anchorY="middle">START HERE</Text>
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
        const presentation = buildSponsorBoothPresentation(company, company.booth, placement.nodeType);
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

function DistrictBooth({ placement }: { placement: any }) {
  const nav = useNavigate();
  const company = placement.company;
  const booth = getNormalizedBooth(company);
  const presentation = useMemo(() => buildSponsorBoothPresentation(company, booth, placement.nodeType), [booth, company, placement.nodeType]);
  const [isPosterPlaying, setIsPosterPlaying] = useState(false);
  const boothColliderRef = useRef<THREE.Group>(null);
  usePlayerColliderRegistration(boothColliderRef, `district-booth-${String(company?.id || company?.name || 'unknown')}`);

  const nameFontSize = getSponsorNameFontSize(presentation.displayName);
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

  const mediaWallPosition: [number, number, number] = presentation.template === 'hero_pavilion' ? [0, 8.8, -7.55] : presentation.template === 'standard_corner' ? [0, 7.8, -5.7] : [0, 5.5, -3.1];
  const logoPanelPosition: [number, number, number] = presentation.template === 'compact_kiosk' ? [0, 8.15, 3.8] : [-7.4, 10.4, 3.8];
  const ctaPosition: [number, number, number] = presentation.template === 'hero_pavilion' ? [0, 1.6, 6.4] : presentation.template === 'standard_corner' ? [0, 1.45, 5.8] : [0, 1.4, 3.2];
  const taglinePosition: [number, number, number] = presentation.template === 'hero_pavilion' ? [0, 14.6, -7] : presentation.template === 'standard_corner' ? [0, 10.6, -5.3] : [0, 8.55, -2.6];
  const titlePosition: [number, number, number] = presentation.template === 'hero_pavilion' ? [0, 17.6, -7] : presentation.template === 'standard_corner' ? [0, 13, -5.3] : [0, 10.8, -2.5];
  const badgePosition: [number, number, number] = presentation.template === 'hero_pavilion' ? [0, 19.8, -7.1] : presentation.template === 'standard_corner' ? [0, 15.6, -5.2] : [0, 12.3, -2.4];
  const colliderSize: [number, number, number] = presentation.template === 'hero_pavilion' ? [24, 18, 18] : presentation.template === 'standard_corner' ? [19, 15, 14] : [14, 10, 10];

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
        <planeGeometry args={presentation.template === 'hero_pavilion' ? [34, 26] : presentation.template === 'standard_corner' ? [28, 20] : [18, 14]} />
        <meshStandardMaterial color={placement.color} transparent opacity={0.09} />
      </mesh>
      <group ref={boothColliderRef} name="district-booth-collider">
        <mesh position={[0, colliderSize[1] / 2, 0]}>
          <boxGeometry args={colliderSize} />
          <ColliderMaterial color="#2563eb" />
        </mesh>
      </group>
      <SponsorBoothShell accentColor={placement.color} template={presentation.template} />
      {presentation.customInsertUrl && (
        <Suspense fallback={null}>
          <CustomBoothInsert template={presentation.template} url={presentation.customInsertUrl} />
        </Suspense>
      )}
      <group position={mediaWallPosition}>
        <SponsorPosterPanel
          accentColor={placement.color}
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
      <group position={logoPanelPosition}>
        <mesh castShadow>
          <boxGeometry args={[4.4, 4.4, 0.6]} />
          <meshStandardMaterial color="#020617" />
        </mesh>
        <SponsorLogoPanel accentColor={placement.color} fallbackText={presentation.displayName.slice(0, 1).toUpperCase()} url={presentation.logoUrl} />
      </group>
      <Text position={titlePosition} fontSize={nameFontSize} color="#f8fafc" anchorX="center" anchorY="middle" maxWidth={presentation.template === 'compact_kiosk' ? 10 : 14}>{presentation.displayName.toUpperCase()}</Text>
      <Text position={taglinePosition} fontSize={presentation.template === 'compact_kiosk' ? 0.44 : 0.52} color="#cbd5e1" anchorX="center" anchorY="middle" maxWidth={presentation.template === 'compact_kiosk' ? 10 : 13}>{(presentation.tagline || '').toUpperCase()}</Text>
      <SponsorBadge accentColor={placement.color} label={presentation.badgeLabel} position={badgePosition} />
      <group position={ctaPosition}>
        <SponsorCtaStrip actions={presentation.actions} color={placement.color} onAction={onAction} />
      </group>
      {placement.sectorName && (
        <Text position={[0, 0.72, presentation.template === 'compact_kiosk' ? -4.8 : -8.9]} fontSize={0.44} color="#93c5fd" anchorX="center" anchorY="middle">{placement.sectorName.toUpperCase()}</Text>
      )}
      {presentation.template === 'hero_pavilion' && (
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
      const startView = scene.userData[CITY_START_VIEW_KEY] as CityStartView | undefined;
      if (startView?.lookAt) {
        camera.position.set(...startView.position);
        camera.lookAt(...startView.lookAt);
        camera.updateMatrixWorld();
        startFramingApplied.current = true;
        logExpoWorldDebug(debug, '[CityView][StartFraming]', startView);
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

export function ExpoWorldScene({ activeZone, data, debug, guests, mode, onMove, zoneSystem }: ExpoWorldSceneProps) {
  const boothPlacements = useMemo(() => buildBoothPlacements(data), [data]);
  const sectorMarkers = useMemo(() => buildExpoSectorMarkers(data), [data]);
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
        boothTemplate: buildSponsorBoothPresentation(placement.company, placement.company?.booth ?? null, placement.nodeType).template,
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
        <Suspense fallback={null}>
            <Sky distance={450000} sunPosition={[100, 20, 100]} inclination={0.49} azimuth={0.25} />
            <Environment preset="city" />
            <ambientLight intensity={0.3} />
            <directionalLight position={[20, 30, 10]} intensity={1.5} castShadow={false} />
            <hemisphereLight args={['#87CEEB', '#222222', 0.5]} />
            {EXPO_FEATURE_FLAGS.enableFog && <fog attach="fog" args={['#0a0a0a', 80, 300]} />}

            <GroundPlane />
            <ExpoDistrictPromenade sectorMarkers={sectorMarkers} />
            {EXPO_FEATURE_FLAGS.enableSponsorBillboards && <SponsorBillboards placements={boothPlacements} />}

            <PrimitiveCityModel debug={debug} />
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
                  Sponsoru stendi vēl nav ielādēti. Pārbaudiet <code>/api/expo/scene</code> vai Supabase sektoru un uzņēmumu datus.
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
