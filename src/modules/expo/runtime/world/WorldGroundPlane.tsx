import type { ExpoWorldVisualProfile } from '../../world-contract';
import {
  ARRIVAL_GATE_FLOOR_ANCHOR,
  GLOBAL_GROUND_POSITION,
  GLOBAL_GROUND_SIZE,
  GROUND_SEAM_TRANSITION_PLATE,
  SPONSOR_BOULEVARD_RIGHT_FLOOR_ANCHOR,
} from './WorldGroundLayout';

export function WorldGroundPlane({ visualProfile }: { visualProfile: ExpoWorldVisualProfile }) {
  return (
    <group name="world-ground:global">
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={GLOBAL_GROUND_POSITION} receiveShadow={false} name="world-ground:global-base">
        <planeGeometry args={GLOBAL_GROUND_SIZE} />
        <meshStandardMaterial color={visualProfile.global.groundBase} emissive="#d8e4ec" emissiveIntensity={0.016} roughness={0.96} metalness={0.01} />
      </mesh>
      <mesh
        name={`world-ground:${GROUND_SEAM_TRANSITION_PLATE.id}`}
        position={GROUND_SEAM_TRANSITION_PLATE.position}
        raycast={() => undefined}
        receiveShadow={false}
        rotation={[-Math.PI / 2, 0, 0]}
        userData={{
          expoGroundDetailRole: 'city-stadium-transition-polish',
          expoInspectionTransparent: true,
          expoRaycastDisabled: true,
        }}
      >
        <planeGeometry args={GROUND_SEAM_TRANSITION_PLATE.size} />
        <meshStandardMaterial
          color={GROUND_SEAM_TRANSITION_PLATE.color}
          emissive="#d8e4ec"
          emissiveIntensity={0.012}
          metalness={0.015}
          roughness={0.94}
        />
      </mesh>
      <mesh
        name={`world-ground:${SPONSOR_BOULEVARD_RIGHT_FLOOR_ANCHOR.id}`}
        position={SPONSOR_BOULEVARD_RIGHT_FLOOR_ANCHOR.position}
        raycast={() => undefined}
        receiveShadow={false}
        rotation={[-Math.PI / 2, 0, 0]}
        userData={{
          expoGroundDetailRole: 'sponsor-boulevard-right-floor-anchor',
          expoInspectionTransparent: true,
          expoRaycastDisabled: true,
        }}
      >
        <planeGeometry args={SPONSOR_BOULEVARD_RIGHT_FLOOR_ANCHOR.size} />
        <meshStandardMaterial
          color={SPONSOR_BOULEVARD_RIGHT_FLOOR_ANCHOR.color}
          emissive="#d8e4ec"
          emissiveIntensity={0.01}
          metalness={0.018}
          roughness={0.92}
        />
      </mesh>
      <mesh
        name={`world-ground:${ARRIVAL_GATE_FLOOR_ANCHOR.id}`}
        position={ARRIVAL_GATE_FLOOR_ANCHOR.position}
        raycast={() => undefined}
        receiveShadow={false}
        rotation={[-Math.PI / 2, 0, 0]}
        userData={{
          expoGroundDetailRole: 'arrival-gate-floor-anchor',
          expoInspectionTransparent: true,
          expoRaycastDisabled: true,
        }}
      >
        <planeGeometry args={ARRIVAL_GATE_FLOOR_ANCHOR.size} />
        <meshStandardMaterial
          color={ARRIVAL_GATE_FLOOR_ANCHOR.color}
          emissive="#d8e4ec"
          emissiveIntensity={0.011}
          metalness={0.016}
          roughness={0.92}
        />
      </mesh>
    </group>
  );
}
