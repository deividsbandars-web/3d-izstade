import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Html, Text } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useNavigate } from 'react-router-dom';
import * as THREE from 'three';
import { createCanonicalModularHomeStudioPath } from '../modularHome/modularHomeShareUrl';

const MODULAR_HOME_ROUTE = createCanonicalModularHomeStudioPath('exterior');
const PORTAL_TRIGGER_SIZE: [number, number, number] = [7.2, 4.6, 4.8];
const PORTAL_NEARBY_DISTANCE_XZ = 48;
const PORTAL_ACTIVE_DISTANCE_XZ = 30;
const PORTAL_NEARBY_DISTANCE_Y = 28;
const PORTAL_ACTIVE_DISTANCE_Y = 22;
const PORTAL_AUTO_ENTER_DELAY_MS = 2000;

export function ModularHomeEntrancePortal({
  playerPosition,
  position = [0, 0, 126],
  rotationY = 0,
  scale = 4,
}: {
  playerPosition: [number, number, number];
  position?: [number, number, number];
  rotationY?: number;
  scale?: number;
}) {
  const navigate = useNavigate();
  const lastEnterRequestRef = useRef(0);
  const autoEnterTimerRef = useRef<number | null>(null);
  const autoEnterCountdownRef = useRef<number | null>(null);
  const haloRef = useRef<THREE.Mesh | null>(null);
  const ringRef = useRef<THREE.Mesh | null>(null);
  const [isTouchLike, setIsTouchLike] = useState(false);
  const [autoEnterCountdown, setAutoEnterCountdown] = useState<number | null>(null);

  const proximity = useMemo(() => {
    const dx = playerPosition[0] - position[0];
    const dz = playerPosition[2] - position[2];
    const dy = Math.abs(playerPosition[1] - position[1]);
    const distanceXZ = Math.hypot(dx, dz);
    return {
      distanceXZ,
      dy,
      isActive: distanceXZ <= PORTAL_ACTIVE_DISTANCE_XZ && dy <= PORTAL_ACTIVE_DISTANCE_Y,
      isNearby: distanceXZ <= PORTAL_NEARBY_DISTANCE_XZ && dy <= PORTAL_NEARBY_DISTANCE_Y,
    };
  }, [playerPosition, position]);

  const requestEnter = useCallback(() => {
    const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
    if (now - lastEnterRequestRef.current < 500) {
      return;
    }

    lastEnterRequestRef.current = now;
    navigate(MODULAR_HOME_ROUTE);
  }, [navigate]);

  useEffect(() => {
    if (!proximity.isActive || typeof window === 'undefined') {
      autoEnterCountdownRef.current = null;
      if (autoEnterTimerRef.current !== null) {
        window.clearTimeout(autoEnterTimerRef.current);
        autoEnterTimerRef.current = null;
      }
      return undefined;
    }

    autoEnterCountdownRef.current = Math.ceil(PORTAL_AUTO_ENTER_DELAY_MS / 1000);
    setAutoEnterCountdown(autoEnterCountdownRef.current);

    const intervalId = window.setInterval(() => {
      const nextValue = autoEnterCountdownRef.current;
      if (nextValue === null) {
        return;
      }

      const decremented = Math.max(0, nextValue - 1);
      autoEnterCountdownRef.current = decremented;
      setAutoEnterCountdown(decremented);
    }, 1000);

    autoEnterTimerRef.current = window.setTimeout(() => {
      autoEnterCountdownRef.current = null;
      setAutoEnterCountdown(null);
      requestEnter();
    }, PORTAL_AUTO_ENTER_DELAY_MS);

    return () => {
      window.clearInterval(intervalId);
      if (autoEnterTimerRef.current !== null) {
        window.clearTimeout(autoEnterTimerRef.current);
        autoEnterTimerRef.current = null;
      }
    };
  }, [proximity.isActive, requestEnter]);

  const visibleAutoEnterCountdown = proximity.isActive ? autoEnterCountdown : null;

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    const mediaQuery = window.matchMedia('(pointer: coarse)');
    const updateTouchLike = () => {
      setIsTouchLike(Boolean(mediaQuery.matches || navigator.maxTouchPoints > 0));
    };

    updateTouchLike();
    mediaQuery.addEventListener?.('change', updateTouchLike);
    mediaQuery.addListener?.(updateTouchLike);

    return () => {
      mediaQuery.removeEventListener?.('change', updateTouchLike);
      mediaQuery.removeListener?.(updateTouchLike);
    };
  }, []);

  useEffect(() => {
    if (!proximity.isNearby || typeof window === 'undefined') {
      return undefined;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.repeat) {
        return;
      }

      const target = event.target as HTMLElement | null;
      if (target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA' || target?.tagName === 'SELECT' || target?.isContentEditable) {
        return;
      }

      if (event.key === 'Enter' || event.code === 'Enter' || event.key === ' ' || event.code === 'Space') {
        event.preventDefault();
        requestEnter();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [proximity.isNearby, requestEnter]);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const nearbyPulse = 1 + (Math.sin(t * 4.25) * 0.03);
    const halo = haloRef.current;
    const ring = ringRef.current;

    if (halo) {
      const haloScale = proximity.isNearby ? nearbyPulse : 1;
      halo.scale.setScalar(haloScale);
      const material = halo.material as THREE.MeshBasicMaterial | THREE.MeshStandardMaterial;
      material.opacity = proximity.isNearby ? 0.78 : 0.34;
    }

    if (ring) {
      const ringScale = proximity.isNearby ? 1 + (Math.sin(t * 5.2) * 0.018) : 1;
      ring.scale.setScalar(ringScale);
      const material = ring.material as THREE.MeshBasicMaterial;
      material.opacity = proximity.isNearby ? 0.66 : 0.42;
    }
  });

  const promptText = isTouchLike
    ? visibleAutoEnterCountdown !== null
      ? `Ieeja pec ${Math.max(1, visibleAutoEnterCountdown)} s`
      : 'Pieskaries, lai ieietu'
    : proximity.isNearby
      ? visibleAutoEnterCountdown !== null
        ? `Ieeja pec ${Math.max(1, visibleAutoEnterCountdown)} s`
        : 'Enter / Space - enter the modular home presentation'
      : 'Apskatit modularo maju';

  const helperText = proximity.isActive
    ? 'Paliec zonā vai nospied Enter / Space'
    : proximity.isNearby
      ? 'Tuvojies vai izmanto Enter / Space'
      : 'Pietuvojies, lai aktivizetu';

  const doorHint = proximity.isNearby
    ? visibleAutoEnterCountdown !== null
      ? `Auto-entry ${Math.max(1, visibleAutoEnterCountdown)} s`
      : 'Enter / Space'
    : 'Klikskini uz portalu vai durvim';

  return (
    <group
      name="modular-home-entrance-portal"
      position={position}
      rotation={[0, rotationY, 0]}
      scale={[scale, scale, scale]}
      onClick={(event) => {
        event.stopPropagation();
        requestEnter();
      }}
      onPointerDown={(event) => {
        event.stopPropagation();
        requestEnter();
      }}
      onPointerOver={() => {
        if (typeof document !== 'undefined') {
          document.body.style.cursor = 'pointer';
        }
      }}
      onPointerOut={() => {
        if (typeof document !== 'undefined') {
          document.body.style.cursor = 'auto';
        }
      }}
      userData={{
        expoInteractionOwner: 'ModularHomeEntrancePortal',
        expoModularHomeEntryPortal: true,
        expoRouteTarget: MODULAR_HOME_ROUTE,
      }}
    >
      <mesh ref={haloRef} position={[0, 0.06, 0]} receiveShadow castShadow>
        <boxGeometry args={[7.4, 0.12, 5.2]} />
        <meshStandardMaterial color="#0b1324" emissive="#0ea5e9" emissiveIntensity={proximity.isNearby ? 0.34 : 0.16} metalness={0.12} roughness={0.34} />
      </mesh>
      <mesh ref={ringRef} position={[0, 0.14, 0]} receiveShadow>
        <boxGeometry args={[6.8, 0.06, 4.35]} />
        <meshBasicMaterial color="#22d3ee" opacity={0.34} transparent toneMapped={false} />
      </mesh>

      <mesh position={[-2.32, 1.78, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.34, 3.18, 0.42]} />
        <meshStandardMaterial color="#e2e8f0" emissive="#38bdf8" emissiveIntensity={proximity.isNearby ? 0.34 : 0.24} metalness={0.16} roughness={0.3} />
      </mesh>
      <mesh position={[2.32, 1.78, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.34, 3.18, 0.42]} />
        <meshStandardMaterial color="#e2e8f0" emissive="#38bdf8" emissiveIntensity={proximity.isNearby ? 0.34 : 0.24} metalness={0.16} roughness={0.3} />
      </mesh>
      <mesh position={[0, 3.46, 0]} castShadow receiveShadow>
        <boxGeometry args={[5.14, 0.4, 0.48]} />
        <meshStandardMaterial color="#f8fafc" emissive="#38bdf8" emissiveIntensity={proximity.isNearby ? 0.34 : 0.2} metalness={0.14} roughness={0.26} />
      </mesh>

      <mesh position={[0, 1.9, 0.16]} castShadow receiveShadow>
        <boxGeometry args={[2.72, 2.78, 0.08]} />
        <meshStandardMaterial color="#09111d" emissive="#0f172a" emissiveIntensity={0.08} metalness={0.06} roughness={0.48} />
      </mesh>
      <mesh position={[0, 1.9, 0.2]} castShadow receiveShadow>
        <boxGeometry args={[2.18, 2.56, 0.08]} />
        <meshStandardMaterial color="#0b2033" emissive="#0ea5e9" emissiveIntensity={proximity.isNearby ? 0.4 : 0.2} metalness={0.18} roughness={0.24} />
      </mesh>
      <mesh position={[0, 0.98, 0.34]} castShadow receiveShadow>
        <boxGeometry args={[1.18, 1.58, 0.08]} />
        <meshStandardMaterial color="#dbeafe" emissive="#38bdf8" emissiveIntensity={proximity.isNearby ? 0.34 : 0.24} metalness={0.08} roughness={0.18} />
      </mesh>

      <mesh position={[0, 0.84, 1.26]} castShadow receiveShadow>
        <boxGeometry args={[4.62, 0.24, 0.18]} />
        <meshStandardMaterial color="#0f172a" emissive="#22d3ee" emissiveIntensity={proximity.isNearby ? 0.34 : 0.2} metalness={0.1} roughness={0.35} />
      </mesh>
      <mesh position={[0, 1.16, 1.32]} castShadow receiveShadow>
        <boxGeometry args={[4.98, 0.16, 0.12]} />
        <meshStandardMaterial color="#38bdf8" emissive="#38bdf8" emissiveIntensity={proximity.isNearby ? 0.45 : 0.34} metalness={0.12} roughness={0.22} />
      </mesh>

      <Text
        position={[0, 4.14, 0.22]}
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={0.48}
        color="#f8fafc"
        anchorX="center"
        anchorY="middle"
        maxWidth={6.4}
      >
        MODULĀRĀS MĀJAS
      </Text>
      <Text
        position={[0, 4.48, 0.22]}
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={0.2}
        color="#bae6fd"
        anchorX="center"
        anchorY="middle"
        maxWidth={6.4}
      >
        IENĀKT PREZENTĀCIJĀ
      </Text>
      <Text
        position={[0, 1.2, 1.44]}
        fontSize={0.16}
        color="#f8fafc"
        anchorX="center"
        anchorY="middle"
        maxWidth={4.2}
      >
        Apskatīt modulāro māju
      </Text>
      <Text
        position={[0, 0.66, 1.46]}
        fontSize={0.11}
        color="#dbeafe"
        anchorX="center"
        anchorY="middle"
        maxWidth={4.2}
      >
        {doorHint}
      </Text>

      <Html position={[0, 4.92, 0.68]} transform center zIndexRange={[20, 0]} distanceFactor={10}>
        <a
          data-modular-home-portal-callout="true"
          href={MODULAR_HOME_ROUTE}
          onClick={(event) => {
            event.preventDefault();
            requestEnter();
          }}
          style={{
            background: proximity.isNearby
              ? 'linear-gradient(180deg, rgba(8, 47, 73, 0.98), rgba(15, 118, 110, 0.96))'
              : 'linear-gradient(180deg, rgba(7, 20, 34, 0.98), rgba(15, 118, 110, 0.9))',
            border: `1px solid ${proximity.isNearby ? 'rgba(103, 232, 249, 0.8)' : 'rgba(103, 232, 249, 0.45)'}`,
            borderRadius: '18px',
            boxShadow: proximity.isNearby
              ? '0 0 0 1px rgba(103, 232, 249, 0.28), 0 0 28px rgba(14, 165, 233, 0.34), 0 18px 36px rgba(2, 6, 23, 0.42)'
              : '0 18px 36px rgba(2, 6, 23, 0.42)',
            color: '#f8fafc',
            cursor: 'pointer',
            display: 'grid',
            gap: '4px',
            minWidth: '300px',
            padding: '13px 18px',
            textAlign: 'center',
            textDecoration: 'none',
          }}
        >
          <span style={{ fontSize: '0.76rem', fontWeight: 950, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
            Modulārās mājas
          </span>
          <span style={{ fontSize: '1rem', fontWeight: 900, lineHeight: 1.1 }}>
            {promptText}
          </span>
          <span style={{ color: proximity.isNearby ? '#e0f2fe' : '#bae6fd', fontSize: '0.66rem', fontWeight: 800 }}>
            {helperText}
          </span>
        </a>
      </Html>

      <mesh
        name="modular-home-entrance-trigger"
        position={[0, 1.78, 0.16]}
        onPointerDown={(event) => {
          event.stopPropagation();
          requestEnter();
        }}
        userData={{
          expoInteractionOwner: 'ModularHomeEntrancePortal',
          expoModularHomeEntryTrigger: true,
        }}
      >
        <boxGeometry args={PORTAL_TRIGGER_SIZE} />
        <meshBasicMaterial depthWrite={false} opacity={0} transparent />
      </mesh>

      <mesh position={[0, 0.02, -1.98]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <ringGeometry args={[1.3, 1.78, 48]} />
        <meshBasicMaterial color="#67e8f9" opacity={proximity.isNearby ? 0.72 : 0.42} side={THREE.DoubleSide} transparent toneMapped={false} />
      </mesh>
      <mesh position={[0, 0.06, -1.98]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <ringGeometry args={[2.08, 2.38, 48]} />
        <meshBasicMaterial color="#0ea5e9" opacity={proximity.isNearby ? 0.42 : 0.24} side={THREE.DoubleSide} transparent toneMapped={false} />
      </mesh>
    </group>
  );
}
