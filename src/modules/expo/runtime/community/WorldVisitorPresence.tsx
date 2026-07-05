import { Text } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import type { ExpoQualitySettings } from '../world/quality/expoQualitySettings';
import {
  getExpoVisibleGuestLimit,
  type ExpoPresenceGuest,
} from './expoPresencePolicy';

function VisitorAvatar({ guest }: { guest: ExpoPresenceGuest }) {
  const group = useRef<THREE.Group>(null);
  const visual = useRef<THREE.Group>(null);
  const leftLeg = useRef<THREE.Mesh>(null);
  const rightLeg = useRef<THREE.Mesh>(null);
  const leftArm = useRef<THREE.Mesh>(null);
  const rightArm = useRef<THREE.Mesh>(null);
  const walkPhase = useRef(0);
  const target = useMemo(() => new THREE.Vector3(...guest.position), [guest.position]);

  useFrame((_, delta) => {
    if (!group.current) return;
    const previous = group.current.position.clone();
    group.current.position.lerp(target, 1 - Math.exp(-delta * 7));
    const movement = group.current.position.clone().sub(previous);
    const moveDistance = movement.length();
    const isMoving = moveDistance > 0.002;
    if (isMoving) {
      group.current.rotation.y = Math.atan2(movement.x, movement.z);
      walkPhase.current += Math.min(10, moveDistance / Math.max(delta, 0.016)) * delta * 4.2;
    } else {
      walkPhase.current += delta * 0.8;
    }
    const stride = isMoving ? Math.sin(walkPhase.current) * 0.46 : 0;
    const armStride = isMoving ? -stride * 0.82 : 0;
    if (leftLeg.current) leftLeg.current.rotation.x = stride;
    if (rightLeg.current) rightLeg.current.rotation.x = -stride;
    if (leftArm.current) leftArm.current.rotation.x = armStride;
    if (rightArm.current) rightArm.current.rotation.x = -armStride;
    if (visual.current) {
      visual.current.position.y = Math.abs(Math.sin(walkPhase.current * 2)) * (isMoving ? 0.08 : 0.025);
    }
  });

  return (
    <group ref={group} position={guest.position} userData={{ expoVisitorId: guest.id }}>
      <group ref={visual}>
        <mesh position={[0, -1.08, 0]}>
          <capsuleGeometry args={[0.42, 0.92, 4, 8]} />
          <meshStandardMaterial color={guest.color} roughness={0.72} />
        </mesh>
        <mesh position={[0, -0.18, 0]}>
          <sphereGeometry args={[0.34, 12, 8]} />
          <meshStandardMaterial color="#f1c7a5" roughness={0.8} />
        </mesh>
        <mesh ref={leftLeg} position={[-0.22, -1.92, 0]}>
          <capsuleGeometry args={[0.11, 0.72, 3, 6]} />
          <meshStandardMaterial color="#172554" roughness={0.78} />
        </mesh>
        <mesh ref={rightLeg} position={[0.22, -1.92, 0]}>
          <capsuleGeometry args={[0.11, 0.72, 3, 6]} />
          <meshStandardMaterial color="#172554" roughness={0.78} />
        </mesh>
        <mesh ref={leftArm} position={[-0.52, -1.1, 0]}>
          <capsuleGeometry args={[0.08, 0.62, 3, 6]} />
          <meshStandardMaterial color={guest.color} roughness={0.78} />
        </mesh>
        <mesh ref={rightArm} position={[0.52, -1.1, 0]}>
          <capsuleGeometry args={[0.08, 0.62, 3, 6]} />
          <meshStandardMaterial color={guest.color} roughness={0.78} />
        </mesh>
      </group>
      <mesh position={[0, -1.82, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.56, guest.isSpeaking ? 0.82 : 0.7, 18]} />
        <meshBasicMaterial color={guest.isSpeaking ? '#facc15' : guest.color} transparent opacity={0.72} />
      </mesh>
      <Text anchorX="center" anchorY="bottom" color="#f8fafc" fontSize={0.28} maxWidth={2.2} outlineColor="#020617" outlineWidth={0.035} position={[0, 0.52, 0]}>
        Visitor
      </Text>
    </group>
  );
}

export function WorldVisitorPresence({
  guests,
  playerPosition,
  qualitySettings,
}: {
  guests: ExpoPresenceGuest[];
  playerPosition: [number, number, number];
  qualitySettings: ExpoQualitySettings;
}) {
  const tier = qualitySettings.resolvedTier === 'high' ? 'high' : qualitySettings.resolvedTier === 'medium' ? 'medium' : 'low';
  const maxDistance = tier === 'low' ? 140 : tier === 'medium' ? 220 : 320;
  const visible = guests
    .filter((guest) => Math.hypot(guest.position[0] - playerPosition[0], guest.position[2] - playerPosition[2]) <= maxDistance)
    .slice(0, getExpoVisibleGuestLimit(tier));

  return <group name="expo-visitor-presence">{visible.map((guest) => <VisitorAvatar key={guest.id} guest={guest} />)}</group>;
}
