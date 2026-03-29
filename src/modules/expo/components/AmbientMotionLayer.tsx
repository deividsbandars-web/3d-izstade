import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import * as THREE from 'three';
import type { ExpoSectorMarker } from '../sceneWorld';

export function AmbientMotionLayer({ sectorMarkers }: { sectorMarkers: ExpoSectorMarker[] }) {
  const pulseRefs = useRef<THREE.Mesh[]>([]);
  const pylonRefs = useRef<THREE.Group[]>([]);

  useFrame((state) => {
    pulseRefs.current.forEach((mesh, index) => {
      if (!mesh) {
        return;
      }

      const scale = 1 + ((Math.sin(state.clock.elapsedTime * 1.35 + index) + 1) * 0.08);
      mesh.scale.set(scale, 1, scale);
      const material = mesh.material as THREE.MeshStandardMaterial;
      material.opacity = 0.12 + ((Math.sin(state.clock.elapsedTime * 1.8 + index) + 1) * 0.04);
    });

    pylonRefs.current.forEach((group, index) => {
      if (!group) {
        return;
      }

      const drift = Math.sin((state.clock.elapsedTime * 0.55) + (index * 0.7));
      group.position.y = 0.14 + ((drift + 1) * 0.12);
      group.rotation.y = drift * 0.04;
      const halo = group.children[2] as THREE.Mesh | undefined;
      if (halo) {
        const haloMaterial = halo.material as THREE.MeshBasicMaterial;
        haloMaterial.opacity = 0.08 + ((Math.sin((state.clock.elapsedTime * 1.15) + index) + 1) * 0.03);
      }
    });
  });

  return (
    <group name="ambient-motion-layer">
      {sectorMarkers.slice(0, 6).map((marker, index) => (
        <group key={`pulse-${marker.id}`}>
          <mesh
            ref={(mesh) => {
              if (mesh) {
                pulseRefs.current[index] = mesh;
              }
            }}
            position={[marker.position[0] * 0.72, 0.18, marker.position[2] + 10]}
            rotation={[-Math.PI / 2, 0, 0]}
          >
            <ringGeometry args={[4.8, 6.4, 48]} />
            <meshStandardMaterial color={marker.color} emissive={marker.color} emissiveIntensity={0.1} transparent opacity={0.16} />
          </mesh>
          <group
            ref={(group) => {
              if (group) {
                pylonRefs.current[index] = group;
              }
            }}
            position={[marker.position[0] * 0.56, 0.14, marker.position[2] + 2]}
          >
            <mesh castShadow>
              <cylinderGeometry args={[0.16, 0.22, 3.4, 16]} />
              <meshStandardMaterial color="#111827" metalness={0.18} roughness={0.72} />
            </mesh>
            <mesh position={[0, 1.85, 0]}>
              <octahedronGeometry args={[0.5, 0]} />
              <meshStandardMaterial color={marker.color} emissive={marker.color} emissiveIntensity={0.28} metalness={0.08} roughness={0.34} />
            </mesh>
            <mesh position={[0, 1.85, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[0.7, 1.28, 24]} />
              <meshBasicMaterial color={marker.color} transparent opacity={0.1} />
            </mesh>
          </group>
        </group>
      ))}
    </group>
  );
}
