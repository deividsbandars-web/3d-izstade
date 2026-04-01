import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import * as THREE from 'three';
import type { ExpoSectorMarker } from '../layout-engine';
import type { ExpoDistrictProgramSummary } from '../world-contract';

function getDistrictSignal(marker: ExpoSectorMarker, districtPrograms: ExpoDistrictProgramSummary[]) {
  const district = districtPrograms.find((entry) => entry.sectorId === marker.sectorId)
    ?? districtPrograms.find((entry) => entry.clusterIndex === marker.clusterIndex);
  const roles = new Set((district?.programTargets ?? []).filter((target) => target.allocated > 0).map((target) => target.role));
  return {
    active: district?.expressionMode === 'active-commercial' || roles.has('demo_stage'),
    calm: district?.expressionMode === 'calm-dwell' || roles.has('meeting_pod') || roles.has('networking_lounge'),
    scenic: district?.expressionMode === 'scenic' || district?.expressionMode === 'feature-court' || (roles.has('scenic_showcase') && !roles.has('demo_stage')),
    subdued: district?.expressionMode === 'orientation' || district?.expressionMode === 'satellite',
    frontageIntensity: district?.frontageIntensity ?? 1,
  };
}

export function AmbientMotionLayer({
  districtPrograms,
  sectorMarkers,
}: {
  districtPrograms: ExpoDistrictProgramSummary[];
  sectorMarkers: ExpoSectorMarker[];
}) {
  const pulseRefs = useRef<THREE.Mesh[]>([]);
  const pylonRefs = useRef<THREE.Group[]>([]);

  useFrame((state) => {
    pulseRefs.current.forEach((mesh, index) => {
      if (!mesh) {
        return;
      }

      const signal = getDistrictSignal(sectorMarkers[index], districtPrograms);
      const pulseMultiplier = signal.active ? 0.08 + (signal.frontageIntensity * 0.015) : signal.calm ? 0.035 : signal.subdued ? 0.03 : 0.06;
      const scale = 1 + ((Math.sin(state.clock.elapsedTime * (signal.calm ? 0.9 : signal.subdued ? 0.72 : 1.2) + index) + 1) * pulseMultiplier);
      mesh.scale.set(scale, 1, scale);
      const material = mesh.material as THREE.MeshStandardMaterial;
      material.opacity = (signal.scenic ? 0.07 : signal.active ? 0.1 + (signal.frontageIntensity * 0.02) : signal.subdued ? 0.06 : 0.1)
        + ((Math.sin(state.clock.elapsedTime * (signal.calm ? 1.1 : signal.subdued ? 0.8 : 1.45) + index) + 1) * (signal.scenic ? 0.018 : 0.03));
    });

    pylonRefs.current.forEach((group, index) => {
      if (!group) {
        return;
      }

      const signal = getDistrictSignal(sectorMarkers[index], districtPrograms);
      const drift = Math.sin((state.clock.elapsedTime * (signal.calm ? 0.32 : 0.55)) + (index * 0.7));
      group.position.y = 0.14 + ((drift + 1) * (signal.active ? 0.1 + (signal.frontageIntensity * 0.02) : signal.scenic ? 0.08 : signal.subdued ? 0.07 : 0.1));
      group.rotation.y = drift * (signal.scenic ? 0.02 : signal.subdued ? 0.015 : 0.03);
      const halo = group.children[2] as THREE.Mesh | undefined;
      if (halo) {
        const haloMaterial = halo.material as THREE.MeshBasicMaterial;
        haloMaterial.opacity = (signal.scenic ? 0.05 : signal.subdued ? 0.04 : 0.07)
          + ((Math.sin((state.clock.elapsedTime * (signal.calm ? 0.75 : signal.subdued ? 0.62 : 1.0)) + index) + 1) * (signal.active ? 0.03 : 0.02));
      }
    });
  });

  return (
    <group name="ambient-motion-layer">
      {sectorMarkers.slice(0, 6).map((marker, index) => {
        const signal = getDistrictSignal(marker, districtPrograms);
        const pulseRadius = signal.active ? [5.1, 6.4 + (signal.frontageIntensity * 0.3)] : signal.calm ? [4.2, 5.4] : signal.subdued ? [3.9, 5.1] : [4.8, 6.2];
        return (
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
            <ringGeometry args={[pulseRadius[0], pulseRadius[1], 48]} />
            <meshStandardMaterial color={marker.color} emissive={marker.color} emissiveIntensity={signal.active ? 0.12 + (signal.frontageIntensity * 0.02) : signal.subdued ? 0.06 : 0.1} transparent opacity={signal.scenic ? 0.09 : signal.subdued ? 0.1 : 0.14} />
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
      )})}
    </group>
  );
}
