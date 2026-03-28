import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import * as THREE from 'three';
import type { ExpoSectorMarker } from '../sceneWorld';

export function AmbientMotionLayer({ sectorMarkers }: { sectorMarkers: ExpoSectorMarker[] }) {
  const pulseRefs = useRef<THREE.Mesh[]>([]);

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
  });

  return (
    <group name="ambient-motion-layer">
      {sectorMarkers.slice(0, 6).map((marker, index) => (
        <mesh
          key={`pulse-${marker.id}`}
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
      ))}
    </group>
  );
}
