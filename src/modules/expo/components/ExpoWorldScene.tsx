import React, { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Bvh, Environment, Html, Loader, OrbitControls, PointerLockControls, Sky, Text, useGLTF, useVideoTexture } from '@react-three/drei';
import { useNavigate } from 'react-router-dom';
import * as THREE from 'three';
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js';
import { BoothUI } from '../../../components/BoothUI';
import { CityGenerator } from '../../city/CityGenerator';
import { processAssets } from '../../../utils/proAssetPipeline';
import { normalizeModel } from '../../../utils/threeUtils';
import { EXPO_ASSET_URLS, EXPO_CITY_QUALITY_TIER, type ExpoMode } from '../state/expoRuntime';

class SceneErrorBoundary extends React.Component<{ children: React.ReactNode; fallback: React.ReactNode }, { hasError: boolean }> {
  constructor(props: { children: React.ReactNode; fallback: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.error('Expo world asset loading failed. Falling back to safe city scaffold.', error);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }

    return this.props.children;
  }
}

function FallbackCityScaffold({ label }: { label: string }) {
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

  return (
    <group>
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

function replaceDistrictBoothZones(zoneSystem: any, boothPlacements: ReturnType<typeof buildBoothPlacements>) {
  if (!zoneSystem || !Array.isArray(zoneSystem.zones)) {
    return;
  }

  zoneSystem.zones = zoneSystem.zones.filter((zone: any) => !String(zone.id).startsWith('district-booth-'));
  boothPlacements.forEach((placement) => {
    zoneSystem.addZone({
      id: `district-booth-${placement.id}`,
      type: 'web',
      position: placement.position,
      radius: 14,
    });
  });
}

function AssetCityContent({ assetUrls, zoneSystem, onNoValidModules }: { assetUrls: string[]; zoneSystem?: any; onNoValidModules?: () => void }) {
  const { scene } = useThree();
  const gltfResult = useGLTF(assetUrls.length === 1 ? assetUrls[0] : assetUrls) as any;
  const gltfs = useMemo(() => (Array.isArray(gltfResult) ? gltfResult : [gltfResult]), [gltfResult]);
  const cityGeneratedRef = useRef(false);

  useEffect(() => {
    (window as any).scene = scene;
  }, [scene]);

  useEffect(() => {
    if (!scene || cityGeneratedRef.current || gltfs.length === 0) {
      return;
    }

    const rawModels = gltfs.map((gltf, index) => {
      const clone = SkeletonUtils.clone(gltf.scene);
      clone.name = assetUrls[index]?.split('/').pop() || `model_${index}`;
      return clone;
    });

    const processed = processAssets(rawModels, assetUrls);
    setSceneUserData(scene, 'cityAssetPipeline', processed.summary);

    if (processed.modules.length === 0) {
      setSceneUserData(scene, 'cityPlacement', {
        placed: 0,
        skipped: 0,
        placedByCategory: { building: 0, booth: 0, landmark: 0, nature: 0, road: 0 },
        skippedByReason: { NO_VALIDATED_MODULES: assetUrls.length },
      });
      cityGeneratedRef.current = true;
      onNoValidModules?.();
      console.warn('No validated GLTF city modules remained after processing. Using booth layer and fallback scaffold only.');
      return;
    }

    const generator = new CityGenerator(scene, processed.modules, zoneSystem);
    const placementSummary = generator.generate({
      gridSize: 8,
      spacing: 12,
      qualityTier: EXPO_CITY_QUALITY_TIER,
    });

    const visibleCoreSummary = placementSummary?.visibleCore ?? scene.userData.cityVisibleCore ?? null;
    const finalPlacementSummary = visibleCoreSummary
      ? {
          ...placementSummary,
          visibleCore: visibleCoreSummary,
        }
      : placementSummary;

    setSceneUserData(scene, 'cityPlacement', finalPlacementSummary);
    setSceneUserData(scene, 'cityVisibleCore', visibleCoreSummary);
    cityGeneratedRef.current = true;
    if (visibleCoreSummary) {
      console.log('[CityPlacement][VisibleCore]', {
        completedBeforeBroadFill: visibleCoreSummary.completedBeforeBroadFill,
        plannedCoreCells: visibleCoreSummary.plannedCoreCells,
        committedCoreCells: visibleCoreSummary.committedCoreCells,
        failedCoreCells: visibleCoreSummary.failedCoreCells,
        failedReasonsByReason: visibleCoreSummary.failedReasonsByReason,
      });
    }
    console.log('Web3D city generated successfully.', {
      assets: processed.summary,
      placement: finalPlacementSummary,
      budget: scene.userData.cityPerformanceBudget,
    });
  }, [assetUrls, gltfs, onNoValidModules, scene, zoneSystem]);

  return null;
}

function CityModel({ debug = false, zoneSystem }: { debug?: boolean; zoneSystem?: any }) {
  const [availableAssetUrls, setAvailableAssetUrls] = useState<string[] | null>(null);
  const [forceFallback, setForceFallback] = useState(false);

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
          <AssetCityContent assetUrls={availableAssetUrls} zoneSystem={zoneSystem} onNoValidModules={() => setForceFallback(true)} />
        </SceneErrorBoundary>
      ) : (
        <FallbackCityScaffold label={fallbackLabel} />
      )}

      <mesh position={[5, 1, -20]} castShadow>
        <boxGeometry args={[1, 2, 1]} />
        <meshStandardMaterial color="lime" />
      </mesh>
    </>
  );
}

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

function SafeVideo({ url }: { url: string | null }) {
  const defaultVideo = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';
  const texture = useVideoTexture(url || defaultVideo, { crossOrigin: 'anonymous', loop: true, muted: true });
  return <meshBasicMaterial map={texture} toneMapped={false} />;
}

function ValidBoothModel({ url }: { url: string }) {
  const { scene } = useGLTF(url);
  const normalizedScene = React.useMemo(() => {
    const clone = scene.clone();
    normalizeModel(clone);
    return clone;
  }, [scene]);

  return (
    <group position={[0, 0.2, 0]}>
      <primitive object={normalizedScene} />
    </group>
  );
}

function PrimitiveBoothBackdrop({ color }: { color: string }) {
  return (
    <group>
      <mesh position={[0, 8, -7.5]} castShadow>
        <boxGeometry args={[22, 16, 1]} />
        <meshStandardMaterial color="#1e293b" />
      </mesh>
      <mesh position={[0, 8, -6.95]}>
        <planeGeometry args={[18, 10]} />
        <meshStandardMaterial color={color} transparent opacity={0.12} />
      </mesh>
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

function DistrictBooth({ position, rotation, company, color }: any) {
  const [hovered, setHovered] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const nav = useNavigate();
  const booth = getNormalizedBooth(company);
  const modelUrl = booth?.model_url || company?.['3d_model_url'];

  return (
    <group position={position} rotation={rotation}>
      <mesh position={[0, 0.1, 0]} receiveShadow>
        <boxGeometry args={[22, 0.2, 16]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      <Suspense fallback={<PrimitiveBoothBackdrop color={color} />}>
        {modelUrl && modelUrl.endsWith('.glb') ? (
          <ValidBoothModel url={modelUrl} />
        ) : (
          <PrimitiveBoothBackdrop color={color} />
        )}
      </Suspense>
      <mesh position={[0, 16.5, -7]} castShadow>
        <boxGeometry args={[22, 3, 1.2]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <Text position={[0, 16.5, -6.3]} fontSize={1.5} color="#fff" fontWeight="black">
        {company?.name?.toUpperCase() || 'BOOTH'}
      </Text>
      <mesh
        position={[0, 8, -6.9]}
        onClick={(event) => {
          event.stopPropagation();
          if (company?.website) {
            window.open(company.website, '_blank');
          }
        }}
        onPointerOver={() => {
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          document.body.style.cursor = 'auto';
        }}
      >
        <planeGeometry args={[18, 10]} />
        <Suspense fallback={<meshStandardMaterial color="#000" />}>
          <SafeVideo url={booth?.video_url || null} />
        </Suspense>
      </mesh>
      <group
        position={[0, 1.5, 5]}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        onClick={(event) => {
          event.stopPropagation();
          setShowForm(true);
        }}
      >
        <mesh castShadow receiveShadow>
          <boxGeometry args={[8, 3, 3]} />
          <meshStandardMaterial color="#f8fafc" />
        </mesh>
        <mesh position={[0, 1.6, 0]} rotation={[-0.2, 0, 0]} castShadow>
          <boxGeometry args={[8.2, 0.5, 3.2]} />
          <meshStandardMaterial color={hovered ? color : '#0f172a'} />
        </mesh>
        <Text position={[0, 2, 0.8]} rotation={[-0.2, 0, 0]} fontSize={0.5} color="#fff" fontWeight="bold">
          VISIT BOOTH
        </Text>
        {(hovered || showForm) && (
          <Html position={[0, 5, 0]} center transform distanceFactor={10}>
            <div
              style={{
                background: 'white',
                padding: '25px',
                borderRadius: '16px',
                border: `5px solid ${color}`,
                boxShadow: '0 15px 40px rgba(0,0,0,0.2)',
                width: '300px',
                textAlign: 'center'
              }}
              onClick={(event) => event.stopPropagation()}
            >
              <h3 style={{ margin: '0 0 10px 0', color: '#000' }}>{company?.name || 'Company'}</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <button style={{ width: '100%', padding: '12px', background: '#10b981', border: 'none', color: 'white', fontWeight: 'bold', borderRadius: '8px', cursor: 'pointer' }}>
                  📞 LIVE VIDEO CALL
                </button>
                <button
                  onClick={() => nav(`/expo/booth/${company?.id}`)}
                  style={{ width: '100%', padding: '12px', background: color, border: 'none', color: 'white', fontWeight: 'bold', borderRadius: '8px', cursor: 'pointer' }}
                >
                  ENTER 3D SPACE
                </button>
              </div>
            </div>
          </Html>
        )}
      </group>
    </group>
  );
}

const PLAYER_RADIUS = 1.2;

function Player({ mode, onMove }: { mode: ExpoMode; onMove: (pos: number[]) => void }) {
  const { camera, scene } = useThree();
  const [mov, setMov] = useState({ f: false, b: false, l: false, r: false });
  const raycaster = useRef(new THREE.Raycaster());
  const moveVector = useRef(new THREE.Vector3());
  const spawnChecked = useRef(false);
  const lastMoveTime = useRef(0);

  useEffect(() => {
    camera.position.set(0, 5, 10);
    console.log('CAMERA START:', camera.position);
  }, [camera]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (spawnChecked.current) {
        return;
      }

      const downRay = new THREE.Raycaster(camera.position, new THREE.Vector3(0, -1, 0));
      const intersects = downRay.intersectObjects(scene.children, true);
      const hit = intersects.find((entry) => entry.object.visible && entry.object.type === 'Mesh');

      if (hit && hit.distance < 2) {
        console.log('Spawn unsafe, pushing player upward.');
        camera.position.y += (2 - hit.distance) + 1;
      }

      spawnChecked.current = true;
    }, 4500);

    return () => clearTimeout(timer);
  }, [scene, camera]);

  useEffect(() => {
    if (mode !== 'walk') {
      return;
    }

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

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [mode]);

  useFrame((_, delta) => {
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
        const intersects = raycaster.current.intersectObjects(scene.children, true);
        return intersects.find((entry) => entry.object.visible && entry.object.type === 'Mesh');
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

    if (moved && Date.now() - lastMoveTime.current > 200) {
      lastMoveTime.current = Date.now();
      onMove([camera.position.x, camera.position.y, camera.position.z]);
    }
  });

  return mode === 'fly'
    ? <OrbitControls enablePan enableZoom enableRotate maxDistance={500} enableDamping dampingFactor={0.05} />
    : (mode === 'walk' ? <PointerLockControls /> : null);
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

function buildBoothPlacements(data: any) {
  const sectors = Array.isArray(data?.sectors) ? data.sectors : [];
  const companies = Array.isArray(data?.companies) ? data.companies : [];
  const placements: Array<{
    id: string;
    company: any;
    color: string;
    position: [number, number, number];
    rotation: [number, number, number];
  }> = [];

  sectors.forEach((sector: any, sectorIndex: number) => {
    const sectorCompanies = companies.filter((company: any) => (
      String(company.sector_id || company.sectorId || '') === String(sector.id)
    ));

    const baseX = Number(sector?.map_position?.x ?? 0);
    const baseZ = Number(sector?.map_position?.z ?? (-120 - sectorIndex * 70));
    const color = sector?.color_theme || '#3b82f6';
    const columns = 3;

    sectorCompanies.forEach((company: any, companyIndex: number) => {
      const column = companyIndex % columns;
      const row = Math.floor(companyIndex / columns);
      const xOffset = (column - 1) * 30;
      const zOffset = row * 28;

      placements.push({
        id: String(company.id || `${sector.id}-${companyIndex}`),
        company: {
          ...company,
          booth: getNormalizedBooth(company),
        },
        color,
        position: [baseX + xOffset, 0, baseZ - zOffset],
        rotation: [0, 0, 0],
      });
    });
  });

  return placements;
}

export function ExpoWorldScene({ activeZone, data, debug, guests, mode, onMove, zoneSystem }: ExpoWorldSceneProps) {
  const boothPlacements = useMemo(() => buildBoothPlacements(data), [data]);

  useEffect(() => {
    replaceDistrictBoothZones(zoneSystem, boothPlacements);
  }, [boothPlacements, zoneSystem]);

  return (
    <>
      <BoothUI visible={!!activeZone} zoneName={activeZone?.id} />
      <Canvas shadows gl={{ antialias: true }} camera={{ position: [0, 2, 10], fov: 60 }}>
        <Suspense fallback={null}>
          <Bvh firstHitOnly>
            <Sky distance={450000} sunPosition={[100, 20, 100]} inclination={0.49} azimuth={0.25} />
            <Environment preset="city" />
            <ambientLight intensity={0.3} />
            <directionalLight position={[20, 30, 10]} intensity={1.5} castShadow={false} />
            <hemisphereLight args={['#87CEEB', '#222222', 0.5]} />
            <fog attach="fog" args={['#0a0a0a', 80, 300]} />

            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]} receiveShadow={false}>
              <planeGeometry args={[2000, 2000]} />
              <meshStandardMaterial color="#0a0a0a" roughness={0.8} metalness={0.1} />
            </mesh>

            <CityModel debug={debug} zoneSystem={zoneSystem} />
            <Guests guests={guests} />

            <group>
              {boothPlacements.map((placement) => (
                <DistrictBooth
                  key={placement.id}
                  company={placement.company}
                  color={placement.color}
                  position={placement.position}
                  rotation={placement.rotation}
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

            <Player mode={mode} onMove={onMove} />
          </Bvh>
        </Suspense>
      </Canvas>
    </>
  );
}

export function Expo3DLoader() {
  return <Loader />;
}
