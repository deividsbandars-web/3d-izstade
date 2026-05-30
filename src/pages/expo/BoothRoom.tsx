import { Suspense, useEffect, useMemo, useRef, useState, type CSSProperties, type MutableRefObject, type PointerEvent as ReactPointerEvent } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { ContactShadows, OrbitControls, useGLTF, useTexture } from '@react-three/drei';
import { Link, useNavigate, useParams } from 'react-router-dom';
import * as THREE from 'three';
import { getFrontendRuntimeEnv } from '../../config/runtimeEnv';
import { normalizeModel } from '../../utils/threeUtils';
import {
  trackExpoBookingClicked,
  trackExpoBoothViewed,
  trackExpoDemoRoomEntered,
  trackExpoWebsiteOpened,
} from '../../modules/expo/lib/expoAnalytics';
import { loadExpoSceneForRelease } from '../../modules/expo/lib/sceneDataSource';
import { buildSponsorRoomActions, resolveSponsorRoomRecord, type SponsorRoomRecord } from '../../modules/expo/lib/sponsorRoom';
import type { ExpoSceneData } from '../../modules/expo/types/scene';

type RoomState =
  | { status: 'loading' }
  | { status: 'ready'; record: SponsorRoomRecord; scene: ExpoSceneData }
  | { status: 'missing' };

type LeadFormState = {
  clientEmail: string;
  clientName: string;
  message: string;
};

type HallProfile = {
  cameraPosition: [number, number, number];
  floorSize: [number, number];
  heroY: number;
  orbitMax: number;
  orbitMin: number;
  heroScale: number;
  screenGap: number;
  sideScreenSize: [number, number];
  stageHeight: number;
  stageRadius: number;
  stageTopRadius: number;
  topScreenSize: [number, number];
  frontScreenZ: number;
  sideScreenZ: number;
  sideScreenY: number;
  sideScreenRotation: number;
};

type RoomMovementKey = 'backward' | 'forward' | 'left' | 'right';

type RoomMovementState = Record<RoomMovementKey, boolean>;

const ROOM_MOVEMENT_KEY_MAP: Record<string, RoomMovementKey> = {
  ArrowDown: 'backward',
  ArrowLeft: 'left',
  ArrowRight: 'right',
  ArrowUp: 'forward',
  KeyA: 'left',
  KeyD: 'right',
  KeyS: 'backward',
  KeyW: 'forward',
  a: 'left',
  d: 'right',
  s: 'backward',
  w: 'forward',
};

function createRoomMovementState(): RoomMovementState {
  return {
    backward: false,
    forward: false,
    left: false,
    right: false,
  };
}

function setRoomMovement(input: MutableRefObject<RoomMovementState>, key: RoomMovementKey, active: boolean) {
  input.current[key] = active;
}

function resetRoomMovement(input: MutableRefObject<RoomMovementState>) {
  input.current.backward = false;
  input.current.forward = false;
  input.current.left = false;
  input.current.right = false;
}

function resolveRoomMovementKey(event: KeyboardEvent) {
  return ROOM_MOVEMENT_KEY_MAP[event.code] ?? ROOM_MOVEMENT_KEY_MAP[event.key] ?? null;
}

function isEditableKeyboardTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  return target.isContentEditable || target.tagName === 'INPUT' || target.tagName === 'SELECT' || target.tagName === 'TEXTAREA';
}

function roomShellStyle(color: string) {
  return {
    '--room-accent': color,
  } as CSSProperties;
}

function normalizeLeadForm(data: LeadFormState) {
  return {
    clientEmail: data.clientEmail.trim(),
    clientName: data.clientName.trim(),
    message: data.message.trim(),
  };
}

async function submitSponsorLead(record: SponsorRoomRecord, formData: LeadFormState) {
  const runtimeEnv = getFrontendRuntimeEnv();
  const payload = {
    clientEmail: formData.clientEmail,
    clientName: formData.clientName,
    companyId: record.company.id,
    companySlug: record.company.slug,
    message: formData.message,
    sourcePath: `/expo/booth/${record.slugOrId}`,
  };

  const response = await fetch(`${runtimeEnv.apiBaseUrl}/api/expo/lead`, {
    body: JSON.stringify(payload),
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    method: 'POST',
  });

  if (!response.ok) {
    throw new Error(`EXPO_LEAD_HTTP_${response.status}`);
  }
}

function getHallProfile(adTier: SponsorRoomRecord['presentation']['adTier']): HallProfile {
  if (adTier === 'elite') {
    return {
      cameraPosition: [0, 10.8, 46],
      floorSize: [112, 86],
      heroY: 5.4,
      orbitMax: 62,
      orbitMin: 18,
      heroScale: 1.18,
      screenGap: 28,
      sideScreenSize: [22, 14],
      stageHeight: 1.3,
      stageRadius: 9.4,
      stageTopRadius: 8.4,
      topScreenSize: [30, 18],
      frontScreenZ: -32,
      sideScreenZ: -35,
      sideScreenY: 9.4,
      sideScreenRotation: 0.3,
    };
  }

  if (adTier === 'premium') {
    return {
      cameraPosition: [0, 10, 40],
      floorSize: [98, 76],
      heroY: 4.8,
      orbitMax: 54,
      orbitMin: 16,
      heroScale: 1.1,
      screenGap: 24,
      sideScreenSize: [20, 12.8],
      stageHeight: 1.12,
      stageRadius: 8.4,
      stageTopRadius: 7.4,
      topScreenSize: [26, 16],
      frontScreenZ: -29,
      sideScreenZ: -31,
      sideScreenY: 8.8,
      sideScreenRotation: 0.28,
    };
  }

  if (adTier === 'standard') {
    return {
      cameraPosition: [0, 9.2, 35],
      floorSize: [86, 66],
      heroY: 4.4,
      orbitMax: 48,
      orbitMin: 15,
      heroScale: 1.02,
      screenGap: 21,
      sideScreenSize: [18, 11.6],
      stageHeight: 1,
      stageRadius: 7.8,
      stageTopRadius: 6.9,
      topScreenSize: [22, 14],
      frontScreenZ: -26,
      sideScreenZ: -28,
      sideScreenY: 8.2,
      sideScreenRotation: 0.26,
    };
  }

  return {
    cameraPosition: [0, 8.6, 31],
    floorSize: [76, 58],
    heroY: 4,
    orbitMax: 40,
    orbitMin: 13,
    heroScale: 0.94,
    screenGap: 18,
    sideScreenSize: [16, 10.4],
    stageHeight: 0.92,
    stageRadius: 7,
    stageTopRadius: 6.2,
    topScreenSize: [19, 12.5],
    frontScreenZ: -23,
    sideScreenZ: -24,
    sideScreenY: 7.5,
    sideScreenRotation: 0.24,
  };
}

function SponsorImageSurface({ size, url }: { size: [number, number]; url: string }) {
  const sourceTexture = useTexture(url);
  const { gl } = useThree();
  const texture = useMemo(() => {
    const clone = sourceTexture.clone();
    clone.colorSpace = THREE.SRGBColorSpace;
    clone.wrapS = THREE.ClampToEdgeWrapping;
    clone.wrapT = THREE.ClampToEdgeWrapping;
    clone.anisotropy = gl.capabilities.getMaxAnisotropy();
    clone.magFilter = THREE.LinearFilter;
    clone.minFilter = THREE.LinearMipmapLinearFilter;
    clone.needsUpdate = true;
    return clone;
  }, [gl, sourceTexture]);

  return (
    <mesh>
      <planeGeometry args={size} />
      <meshBasicMaterial map={texture} toneMapped={false} />
    </mesh>
  );
}

function useClampedTexture(url: string, repeat?: [number, number]) {
  const sourceTexture = useTexture(url);
  const { gl } = useThree();

  return useMemo(() => {
    const clone = sourceTexture.clone();
    clone.colorSpace = THREE.SRGBColorSpace;
    clone.wrapS = THREE.RepeatWrapping;
    clone.wrapT = THREE.RepeatWrapping;
    clone.anisotropy = gl.capabilities.getMaxAnisotropy();
    if (repeat) {
      clone.repeat.set(repeat[0], repeat[1]);
    }
    clone.needsUpdate = true;
    return clone;
  }, [gl, repeat, sourceTexture]);
}

function PremiumHallShell({ accent, profile }: { accent: string; profile: HallProfile }) {
  const floorMap = useClampedTexture('/textures/expo-runtime/light-concrete-4k/concrete_floor_worn_001_diff_4k.webp', [6, 5]);
  const floorNormal = useClampedTexture('/textures/expo-runtime/light-concrete-4k/concrete_floor_worn_001_nor_gl_4k.webp', [6, 5]);
  const floorRough = useClampedTexture('/textures/expo-runtime/light-concrete-4k/concrete_floor_worn_001_rough_4k.webp', [6, 5]);
  const floorAo = useClampedTexture('/textures/expo-runtime/light-concrete-4k/concrete_floor_worn_001_ao_4k.webp', [6, 5]);
  const stageMap = useClampedTexture('/textures/expo-runtime/hero-paver-4k/pavement_01_diff_4k.webp', [3, 3]);
  const stageNormal = useClampedTexture('/textures/expo-runtime/hero-paver-4k/pavement_01_nor_gl_4k.webp', [3, 3]);
  const stageRough = useClampedTexture('/textures/expo-runtime/hero-paver-4k/pavement_01_rough_4k.webp', [3, 3]);
  const stageAo = useClampedTexture('/textures/expo-runtime/hero-paver-4k/pavement_01_ao_4k.webp', [3, 3]);

  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={profile.floorSize} />
        <meshStandardMaterial
          color="#0a0f14"
          map={floorMap}
          normalMap={floorNormal}
          roughnessMap={floorRough}
          aoMap={floorAo}
          metalness={0.08}
          roughness={0.96}
        />
      </mesh>

      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <ringGeometry args={[profile.stageRadius + 2.6, profile.stageRadius + 6.6, 72]} />
        <meshStandardMaterial
          color="#101a24"
          map={stageMap}
          normalMap={stageNormal}
          roughnessMap={stageRough}
          aoMap={stageAo}
          metalness={0.12}
          roughness={0.8}
        />
      </mesh>

      <mesh position={[0, 8, profile.frontScreenZ - 5.6]} receiveShadow>
        <boxGeometry args={[profile.topScreenSize[0] + 22, 20, 2.8]} />
        <meshStandardMaterial color="#050b12" emissive={accent} emissiveIntensity={0.04} metalness={0.18} roughness={0.78} />
      </mesh>
      <mesh position={[-profile.screenGap, profile.sideScreenY - 0.8, profile.sideScreenZ - 2.8]} rotation={[0, profile.sideScreenRotation, 0]} receiveShadow>
        <boxGeometry args={[profile.sideScreenSize[0] + 12, profile.sideScreenSize[1] + 6.5, 2.2]} />
        <meshStandardMaterial color="#07101a" emissive={accent} emissiveIntensity={0.03} metalness={0.16} roughness={0.78} />
      </mesh>
      <mesh position={[profile.screenGap, profile.sideScreenY - 0.8, profile.sideScreenZ - 2.8]} rotation={[0, -profile.sideScreenRotation, 0]} receiveShadow>
        <boxGeometry args={[profile.sideScreenSize[0] + 12, profile.sideScreenSize[1] + 6.5, 2.2]} />
        <meshStandardMaterial color="#07101a" emissive={accent} emissiveIntensity={0.03} metalness={0.16} roughness={0.78} />
      </mesh>
    </>
  );
}

function ProceduralShowWall({
  accent,
  size,
  variant,
}: {
  accent: string;
  size: [number, number];
  variant: 'hero' | 'identity' | 'portfolio';
}) {
  const width = size[0];
  const height = size[1];
  const lines = variant === 'hero' ? 4 : 3;

  return (
    <group>
      <mesh>
        <planeGeometry args={size} />
        <meshStandardMaterial color="#07101a" emissive={accent} emissiveIntensity={0.1} roughness={0.24} metalness={0.04} />
      </mesh>
      {Array.from({ length: lines }).map((_, index) => {
        const lineWidth = width * (variant === 'hero' ? 0.8 - index * 0.09 : 0.56 - index * 0.07);
        const y = height * 0.22 - index * (height * 0.16);
        return (
          <mesh key={`${variant}-line-${index}`} position={[0, y, 0.03]}>
            <planeGeometry args={[lineWidth, height * 0.08]} />
            <meshStandardMaterial color="#dbeafe" emissive={accent} emissiveIntensity={variant === 'hero' ? 0.22 : 0.12} roughness={0.14} metalness={0.02} />
          </mesh>
        );
      })}
      <mesh position={[0, -height * 0.22, 0.04]}>
        <planeGeometry args={[width * 0.86, height * 0.18]} />
        <meshStandardMaterial color="#111b2a" emissive={accent} emissiveIntensity={0.1} roughness={0.18} metalness={0.02} />
      </mesh>
      <mesh position={[variant === 'identity' ? -width * 0.22 : width * 0.24, 0, 0.05]}>
        <planeGeometry args={[width * 0.22, height * 0.34]} />
        <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.22} roughness={0.12} metalness={0.02} />
      </mesh>
    </group>
  );
}

function ScreenWall({
  accent,
  imageUrl,
  position,
  rotation,
  size,
  variant,
}: {
  accent: string;
  imageUrl: string | null;
  position: [number, number, number];
  rotation: [number, number, number];
  size: [number, number];
  variant: 'hero' | 'identity' | 'portfolio';
}) {
  return (
    <group position={position} rotation={rotation}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[size[0] + 2.4, size[1] + 2.2, 1.18]} />
        <meshStandardMaterial color="#09111b" metalness={0.14} roughness={0.68} />
      </mesh>
      <mesh position={[0, 0, 0.72]}>
        <boxGeometry args={[size[0] + 0.72, size[1] + 0.72, 0.28]} />
        <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.1} roughness={0.24} metalness={0.04} />
      </mesh>
      <group position={[0, 0, 0.94]}>
        {imageUrl ? (
          <Suspense fallback={null}>
            <SponsorImageSurface size={size} url={imageUrl} />
          </Suspense>
        ) : (
          <ProceduralShowWall accent={accent} size={size} variant={variant} />
        )}
      </group>
    </group>
  );
}

function ExhibitHeroObject({
  accent,
  mode,
  scale = 1,
  y,
}: {
  accent: string;
  mode: 'immersive' | 'hero-object' | 'product' | 'support';
  scale?: number;
  y: number;
}) {
  const ref = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (ref.current) {
      ref.current.rotation.y += delta * (mode === 'immersive' ? 0.42 : 0.24);
    }
  });

  return (
    <group ref={ref} position={[0, y, 0]} scale={scale}>
      {mode === 'immersive' && (
        <>
          <mesh castShadow>
            <icosahedronGeometry args={[2.6, 0]} />
            <meshStandardMaterial color="#edf4f8" metalness={0.34} roughness={0.18} emissive={accent} emissiveIntensity={0.12} />
          </mesh>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[3.4, 0.22, 20, 72]} />
            <meshStandardMaterial color={accent} metalness={0.38} roughness={0.22} emissive={accent} emissiveIntensity={0.18} />
          </mesh>
        </>
      )}
      {mode === 'hero-object' && (
        <mesh castShadow>
          <cylinderGeometry args={[1.9, 2.6, 6.4, 14]} />
          <meshStandardMaterial color="#eef4f8" metalness={0.22} roughness={0.22} emissive={accent} emissiveIntensity={0.08} />
        </mesh>
      )}
      {mode === 'product' && (
        <mesh castShadow rotation={[0.18, 0.24, 0.08]}>
          <boxGeometry args={[3.8, 3.8, 3.8]} />
          <meshStandardMaterial color="#eef4f8" metalness={0.14} roughness={0.28} emissive={accent} emissiveIntensity={0.06} />
        </mesh>
      )}
      {mode === 'support' && (
        <mesh castShadow rotation={[0.08, 0.38, 0]}>
          <octahedronGeometry args={[2.4, 0]} />
          <meshStandardMaterial color="#dfe8ee" metalness={0.1} roughness={0.36} emissive={accent} emissiveIntensity={0.04} />
        </mesh>
      )}
    </group>
  );
}

function CustomHeroInsert({ accent, url, y }: { accent: string; url: string; y: number }) {
  const { scene } = useGLTF(url);
  const model = useMemo(() => {
    const clone = scene.clone(true);
    normalizeModel(clone, 6.4);
    clone.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
    return clone;
  }, [scene]);

  return (
    <group position={[0, y - 0.6, 0]}>
      <primitive object={model} />
      <mesh position={[0, -3.2, 0]} receiveShadow>
        <cylinderGeometry args={[3.8, 4.2, 0.16, 44]} />
        <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.18} metalness={0.2} roughness={0.3} />
      </mesh>
    </group>
  );
}

function SponsorRoomWalkControls({
  movementInput,
  profile,
}: {
  movementInput: MutableRefObject<RoomMovementState>;
  profile: HallProfile;
}) {
  const controlsRef = useRef<any>(null);
  const roomBounds = useMemo(() => ({
    maxX: (profile.floorSize[0] / 2) - 5,
    maxZ: (profile.floorSize[1] / 2) - 5,
    minX: (-profile.floorSize[0] / 2) + 5,
    minZ: (-profile.floorSize[1] / 2) + 5,
  }), [profile.floorSize]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (isEditableKeyboardTarget(event.target)) {
        return;
      }

      const key = resolveRoomMovementKey(event);
      if (!key) {
        return;
      }

      event.preventDefault();
      setRoomMovement(movementInput, key, true);
    }

    function onKeyUp(event: KeyboardEvent) {
      const key = resolveRoomMovementKey(event);
      if (!key) {
        return;
      }

      event.preventDefault();
      setRoomMovement(movementInput, key, false);
    }

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      resetRoomMovement(movementInput);
    };
  }, [movementInput]);

  useFrame(({ camera }, delta) => {
    const input = movementInput.current;
    const forwardInput = Number(input.forward) - Number(input.backward);
    const strafeInput = Number(input.right) - Number(input.left);

    if (forwardInput === 0 && strafeInput === 0) {
      return;
    }

    const target = controlsRef.current?.target as THREE.Vector3 | undefined;
    const forward = target
      ? target.clone().sub(camera.position)
      : new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
    forward.y = 0;

    if (forward.lengthSq() < 0.0001) {
      forward.set(0, 0, -1);
    } else {
      forward.normalize();
    }

    const right = new THREE.Vector3(-forward.z, 0, forward.x).normalize();
    const move = forward
      .multiplyScalar(forwardInput)
      .add(right.multiplyScalar(strafeInput));

    if (move.lengthSq() < 0.0001) {
      return;
    }

    const distance = Math.min(18, 12 * delta);
    move.normalize().multiplyScalar(distance);

    const nextX = THREE.MathUtils.clamp(camera.position.x + move.x, roomBounds.minX, roomBounds.maxX);
    const nextZ = THREE.MathUtils.clamp(camera.position.z + move.z, roomBounds.minZ, roomBounds.maxZ);
    const applied = new THREE.Vector3(nextX - camera.position.x, 0, nextZ - camera.position.z);

    if (applied.lengthSq() < 0.0001) {
      return;
    }

    camera.position.x = nextX;
    camera.position.z = nextZ;
    target?.add(applied);
    controlsRef.current?.update();
  });

  return (
    <OrbitControls
      ref={controlsRef}
      enablePan
      minDistance={profile.orbitMin}
      maxDistance={profile.orbitMax}
      maxPolarAngle={Math.PI / 2 - 0.02}
      minPolarAngle={0.18}
      rotateSpeed={0.9}
      zoomSpeed={0.95}
      panSpeed={0.9}
      target={[0, profile.heroY + 1.1, -8]}
    />
  );
}

function SponsorRoomMovementPad({
  accent,
  movementInput,
}: {
  accent: string;
  movementInput: MutableRefObject<RoomMovementState>;
}) {
  const startMovement = (key: RoomMovementKey) => (event: ReactPointerEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    setRoomMovement(movementInput, key, true);
  };
  const stopMovement = (key: RoomMovementKey) => (event: ReactPointerEvent<HTMLButtonElement>) => {
    event.preventDefault();
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    setRoomMovement(movementInput, key, false);
  };

  const buttonStyle: CSSProperties = {
    alignItems: 'center',
    background: 'rgba(5, 10, 18, 0.78)',
    border: `1px solid ${accent}40`,
    borderRadius: '14px',
    color: '#f8fafc',
    cursor: 'pointer',
    display: 'flex',
    fontSize: '0.78rem',
    fontWeight: 900,
    justifyContent: 'center',
    minHeight: '42px',
    minWidth: '52px',
    padding: '10px 12px',
    touchAction: 'none',
    userSelect: 'none',
  };

  function controlButton(key: RoomMovementKey, label: string) {
    return (
      <button
        key={key}
        aria-label={`Move ${key}`}
        onPointerCancel={stopMovement(key)}
        onPointerDown={startMovement(key)}
        onPointerLeave={stopMovement(key)}
        onPointerUp={stopMovement(key)}
        style={buttonStyle}
        type="button"
      >
        {label}
      </button>
    );
  }

  return (
    <div style={{
      background: 'linear-gradient(180deg, rgba(8,12,18,0.22), rgba(5,9,14,0.42))',
      border: `1px solid ${accent}12`,
      borderRadius: '18px',
      bottom: '18px',
      left: '18px',
      padding: '12px',
      pointerEvents: 'auto',
      position: 'absolute',
      width: 'min(246px, calc(100vw - 36px))',
    }}>
      <div style={{ color: accent, fontSize: '0.68rem', fontWeight: 900, letterSpacing: '0.16em', marginBottom: '10px', textTransform: 'uppercase' }}>
        Walk controls
      </div>
      <div style={{ display: 'grid', gap: '8px', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}>
        <span />
        {controlButton('forward', 'W')}
        <span />
        {controlButton('left', 'A')}
        {controlButton('backward', 'S')}
        {controlButton('right', 'D')}
      </div>
      <div style={{ color: '#94a3b8', fontSize: '0.72rem', lineHeight: 1.45, marginTop: '10px' }}>
        Use WASD, arrow keys, or hold the buttons.
      </div>
    </div>
  );
}

function ShowcaseHallCanvas({
  accent,
  adTier,
  customInsertUrl,
  logoUrl,
  movementInput,
  mode,
  posterUrl,
}: {
  accent: string;
  adTier: SponsorRoomRecord['presentation']['adTier'];
  customInsertUrl: string | null;
  logoUrl: string | null;
  movementInput: MutableRefObject<RoomMovementState>;
  mode: 'immersive' | 'hero-object' | 'product' | 'support';
  posterUrl: string | null;
}) {
  const profile = getHallProfile(adTier);
  const hallPoster = posterUrl && /8k|4k/i.test(posterUrl) ? posterUrl : '/textures/expo-runtime/hero-facade-screen-8k/hero_facade_screen_01.webp';
  const hallLogo = logoUrl || '/textures/expo-runtime/screen-placeholders-4k/vertical-9x16/screen_vertical_01.webp';

  return (
    <>
      <color attach="background" args={['#010204']} />
      <fog attach="fog" args={['#010204', 46, 120]} />
      <ambientLight intensity={0.18} />
      <directionalLight castShadow intensity={0.7} position={[0, 26, 16]} shadow-mapSize-width={2048} shadow-mapSize-height={2048} />
      <spotLight castShadow intensity={58} angle={0.24} penumbra={0.58} position={[0, 28, 4]} color={accent} />
      <pointLight intensity={4.2} position={[-18, 8, -24]} color={accent} distance={48} />
      <pointLight intensity={3.1} position={[18, 8, -24]} color="#dbeafe" distance={44} />

      <PremiumHallShell accent={accent} profile={profile} />

      <ScreenWall
        accent={accent}
        imageUrl={hallPoster}
        position={[0, 9.4, profile.frontScreenZ]}
        rotation={[0, 0, 0]}
        size={profile.topScreenSize}
        variant="hero"
      />
      <ScreenWall
        accent={accent}
        imageUrl={hallLogo}
        position={[-profile.screenGap, profile.sideScreenY, profile.sideScreenZ]}
        rotation={[0, profile.sideScreenRotation, 0]}
        size={profile.sideScreenSize}
        variant="identity"
      />
      <ScreenWall
        accent={accent}
        imageUrl={hallPoster}
        position={[profile.screenGap, profile.sideScreenY, profile.sideScreenZ]}
        rotation={[0, -profile.sideScreenRotation, 0]}
        size={profile.sideScreenSize}
        variant="portfolio"
      />

      <mesh position={[0, profile.stageHeight * 0.5, 0]} receiveShadow>
        <cylinderGeometry args={[profile.stageRadius, profile.stageRadius + 1.4, profile.stageHeight, 56]} />
        <meshStandardMaterial color="#0b111a" metalness={0.18} roughness={0.74} />
      </mesh>
      <mesh position={[0, profile.stageHeight + 0.12, 0]} receiveShadow>
        <cylinderGeometry args={[profile.stageTopRadius, profile.stageTopRadius + 0.56, 0.2, 56]} />
        <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.16} metalness={0.16} roughness={0.34} />
      </mesh>

      {customInsertUrl ? (
        <Suspense fallback={null}>
          <CustomHeroInsert accent={accent} url={customInsertUrl} y={profile.heroY} />
        </Suspense>
      ) : (
        <ExhibitHeroObject accent={accent} mode={mode} scale={profile.heroScale} y={profile.heroY} />
      )}

      <ContactShadows scale={44} blur={2.8} opacity={0.42} far={32} resolution={1024} />
      <SponsorRoomWalkControls movementInput={movementInput} profile={profile} />
    </>
  );
}

export default function BoothRoom() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [state, setState] = useState<RoomState>({ status: 'loading' });
  const [leadForm, setLeadForm] = useState<LeadFormState>({ clientEmail: '', clientName: '', message: '' });
  const [leadStatus, setLeadStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const movementInput = useRef<RoomMovementState>(createRoomMovementState());

  useEffect(() => {
    let active = true;
    resetRoomMovement(movementInput);

    loadExpoSceneForRelease()
      .then((scene) => {
        const record = resolveSponsorRoomRecord(scene, id);
        if (!active) return;
        if (!record) {
          setState({ status: 'missing' });
          return;
        }
        setState({ status: 'ready', record, scene });
        trackExpoBoothViewed(record.company, { boothId: record.boothId, sectorName: record.sectorName, source: 'sponsor_room' });
        trackExpoDemoRoomEntered(record.company, { boothId: record.boothId, sectorName: record.sectorName, source: 'sponsor_room' });
      })
      .catch(() => {
        if (active) setState({ status: 'missing' });
      });

    return () => {
      active = false;
    };
  }, [id]);

  const actions = useMemo(() => {
    if (state.status !== 'ready') return null;
    return buildSponsorRoomActions(state.record);
  }, [state]);

  if (state.status === 'loading') {
    return <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#05080d', color: '#f8fafc' }}>Loading sponsor exhibit room...</div>;
  }

  if (state.status === 'missing') {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#05080d', color: '#f8fafc', padding: '32px' }}>
        <div style={{ maxWidth: '560px', textAlign: 'center' }}>
          <p style={{ color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.18em', fontSize: '0.82rem' }}>Sponsor Room Unavailable</p>
          <h1 style={{ margin: '12px 0 16px', fontSize: '2.2rem' }}>This sponsor room is not available in the current release scene.</h1>
          <Link to="/expo-3d" style={{ display: 'inline-block', marginTop: '24px', padding: '14px 20px', background: '#2563eb', color: '#f8fafc', borderRadius: '999px', textDecoration: 'none', fontWeight: 700 }}>
            Back to Sponsor Boulevard
          </Link>
        </div>
      </div>
    );
  }

  const { record } = state;
  const accent = record.company.sponsorTier === 'hero' ? '#22c55e' : record.company.sponsorTier === 'gold' ? '#f59e0b' : record.company.sponsorTier === 'platinum' ? '#e879f9' : '#38bdf8';
  const presentation = record.presentation;
  const hallProfile = getHallProfile(presentation.adTier);
  const roomLabel = presentation.adTier === 'elite' ? 'Elite Buyer Hall' : presentation.adTier === 'premium' ? 'Premium Sponsor Hall' : presentation.adTier === 'standard' ? 'Sponsor Showcase Hall' : 'Support Showcase Hall';
  const brochureUrl = actions?.brochureAction?.intent.target ?? null;

  async function handleExternalClick(kind: 'website' | 'booking' | 'brochure', target: string) {
    if (kind === 'website') {
      trackExpoWebsiteOpened(record.company, { boothId: record.boothId, source: 'sponsor_room', websiteUrl: target });
    } else if (kind === 'booking') {
      trackExpoBookingClicked(record.company, { boothId: record.boothId, source: 'sponsor_room', bookingUrl: target });
    } else {
      trackExpoBoothViewed(record.company, { boothId: record.boothId, source: 'sponsor_room_brochure', brochureUrl: target });
    }
    window.open(target, '_blank', 'noopener,noreferrer');
  }

  async function handleLeadSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalized = normalizeLeadForm(leadForm);
    if (!normalized.clientName || !normalized.clientEmail) {
      setLeadStatus('error');
      return;
    }
    try {
      setLeadStatus('submitting');
      await submitSponsorLead(record, normalized);
      setLeadForm({ clientEmail: '', clientName: '', message: '' });
      setLeadStatus('success');
      trackExpoBoothViewed(record.company, { boothId: record.boothId, source: 'sponsor_room_lead_submitted' });
    } catch {
      setLeadStatus('error');
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#010204', color: '#f8fafc', ...roomShellStyle(accent) }}>
      <div style={{ padding: '14px 18px 10px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '10px' }}>
          <div>
            <div style={{ color: accent, textTransform: 'uppercase', letterSpacing: '0.18em', fontSize: '0.76rem', fontWeight: 900 }}>{roomLabel}</div>
            <h1 style={{ margin: '8px 0 4px', fontSize: 'clamp(1.8rem, 3vw, 2.8rem)', lineHeight: 1 }}>{record.company.name}</h1>
          </div>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <Link to="/expo-3d" style={{ padding: '12px 18px', borderRadius: '999px', border: '1px solid #334155', textDecoration: 'none', color: '#f8fafc', fontWeight: 700 }}>Back to Boulevard</Link>
            <button type="button" onClick={() => navigate(`/expo-3d?focus=${encodeURIComponent(record.slugOrId)}`)} style={{ padding: '12px 18px', borderRadius: '999px', border: 'none', background: accent, color: '#08111c', fontWeight: 900, cursor: 'pointer' }}>
              Return to Booth
            </button>
          </div>
        </div>

        <div style={{ position: 'relative', height: '92vh', minHeight: '960px', borderRadius: '18px', overflow: 'hidden', border: `1px solid ${accent}14`, background: '#010204' }}>
          <Canvas
            shadows
            dpr={[1.5, 2.25]}
            gl={{ antialias: true, powerPreference: 'high-performance' }}
            camera={{ position: hallProfile.cameraPosition, fov: 36 }}
          >
            <Suspense fallback={null}>
              <ShowcaseHallCanvas
                accent={accent}
                adTier={presentation.adTier}
                customInsertUrl={presentation.customInsertUrl}
                logoUrl={presentation.logoUrl}
                movementInput={movementInput}
                mode={presentation.showcaseMode}
                posterUrl={presentation.posterUrl || presentation.logoUrl}
              />
            </Suspense>
          </Canvas>

          <div style={{ position: 'absolute', left: '18px', top: '18px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <div style={{ width: 'fit-content', padding: '10px 14px', borderRadius: '999px', background: `${accent}22`, color: accent, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.16em', fontSize: '0.74rem' }}>{presentation.adTier}</div>
            <div style={{ width: 'fit-content', padding: '10px 14px', borderRadius: '999px', background: 'rgba(8,13,20,0.42)', color: '#dbe7f1', border: '1px solid rgba(148,163,184,0.08)', fontWeight: 700 }}>Private isolated hall</div>
          </div>

          <SponsorRoomMovementPad accent={accent} movementInput={movementInput} />

          <div style={{ position: 'absolute', right: '18px', bottom: '18px', width: 'min(520px, calc(100vw - 36px))', display: 'grid', gap: '12px', alignItems: 'end', pointerEvents: 'none' }}>
            <div style={{ display: 'grid', gap: '12px', padding: '12px 14px', borderRadius: '18px', border: `1px solid ${accent}10`, background: 'linear-gradient(180deg, rgba(8,12,18,0.16), rgba(5,9,14,0.34))', backdropFilter: 'blur(4px)', pointerEvents: 'auto' }}>
              <div style={{ color: accent, fontSize: '0.76rem', textTransform: 'uppercase', letterSpacing: '0.18em', fontWeight: 900 }}>Sponsor actions</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '10px' }}>
                {(actions?.primaryActions ?? []).map(({ action, intent }) => (
                  <button key={action.kind} type="button" onClick={() => handleExternalClick(action.kind === 'booking' ? 'booking' : 'website', intent.target)} style={{ padding: '14px', minHeight: '82px', borderRadius: '18px', border: `1px solid ${accent}32`, background: 'linear-gradient(180deg, rgba(11,18,28,0.72), rgba(7,12,18,0.86))', color: '#f8fafc', textAlign: 'left', cursor: 'pointer' }}>
                    <div style={{ color: accent, fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.16em', fontWeight: 800 }}>{action.kind.replace('_', ' ')}</div>
                    <div style={{ marginTop: '8px', fontSize: '1rem', fontWeight: 800 }}>{action.label}</div>
                  </button>
                ))}
                {brochureUrl && (
                  <button type="button" onClick={() => handleExternalClick('brochure', brochureUrl)} style={{ padding: '14px', minHeight: '82px', borderRadius: '18px', border: `1px solid ${accent}32`, background: 'linear-gradient(180deg, rgba(11,18,28,0.72), rgba(7,12,18,0.86))', color: '#f8fafc', textAlign: 'left', cursor: 'pointer' }}>
                    <div style={{ color: accent, fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.16em', fontWeight: 800 }}>brochure</div>
                    <div style={{ marginTop: '8px', fontSize: '1rem', fontWeight: 800 }}>Open media pack</div>
                  </button>
                )}
              </div>
            </div>

            <form onSubmit={handleLeadSubmit} style={{ display: 'grid', gap: '10px', padding: '12px 14px', borderRadius: '18px', border: `1px solid ${accent}10`, background: 'linear-gradient(180deg, rgba(8,12,18,0.16), rgba(5,9,14,0.34))', backdropFilter: 'blur(4px)', pointerEvents: 'auto' }}>
              <div style={{ color: accent, fontSize: '0.76rem', textTransform: 'uppercase', letterSpacing: '0.18em', fontWeight: 900 }}>Private lead capture</div>
              <input type="text" placeholder="Your name" value={leadForm.clientName} onChange={(event) => setLeadForm((current) => ({ ...current, clientName: event.target.value }))} style={{ padding: '14px 15px', borderRadius: '16px', border: '1px solid #334155', background: '#020617', color: '#f8fafc' }} />
              <input type="email" placeholder="Your email" value={leadForm.clientEmail} onChange={(event) => setLeadForm((current) => ({ ...current, clientEmail: event.target.value }))} style={{ padding: '14px 15px', borderRadius: '16px', border: '1px solid #334155', background: '#020617', color: '#f8fafc' }} />
              <textarea rows={3} placeholder="Project scope, meeting request, or sponsor question" value={leadForm.message} onChange={(event) => setLeadForm((current) => ({ ...current, message: event.target.value }))} style={{ padding: '14px 15px', borderRadius: '16px', border: '1px solid #334155', background: '#020617', color: '#f8fafc', resize: 'vertical' }} />
              <button type="submit" disabled={leadStatus === 'submitting'} style={{ padding: '14px 16px', borderRadius: '16px', border: 'none', background: accent, color: '#08111c', fontWeight: 900, cursor: 'pointer' }}>
                {leadStatus === 'submitting' ? 'Sending...' : 'Send sponsor request'}
              </button>
              {leadStatus === 'success' && <div style={{ color: '#4ade80' }}>Sponsor request sent successfully.</div>}
              {leadStatus === 'error' && <div style={{ color: '#fca5a5' }}>Please complete the required fields and try again.</div>}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
