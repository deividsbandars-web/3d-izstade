import type { ExpoWorldVisualProfile } from '../../world-contract';
import {
  GLOBAL_GROUND_POSITION,
  GLOBAL_GROUND_SIZE,
  GROUND_DETAIL_RIBBONS,
} from './WorldGroundLayout';

function GroundDetailRibbons() {
  return (
    <group name="world-ground:global-guide-ribbons">
      {GROUND_DETAIL_RIBBONS.map((ribbon) => (
        <mesh
          key={ribbon.id}
          name={`world-ground-guide:${ribbon.id}`}
          position={ribbon.position}
          receiveShadow={false}
          renderOrder={3}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <planeGeometry args={ribbon.size} />
          <meshStandardMaterial color={ribbon.color} roughness={0.94} metalness={0.01} />
        </mesh>
      ))}
    </group>
  );
}

export function WorldGroundPlane({ visualProfile }: { visualProfile: ExpoWorldVisualProfile }) {
  return (
    <group name="world-ground:global">
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={GLOBAL_GROUND_POSITION} receiveShadow={false} name="world-ground:global-base">
        <planeGeometry args={GLOBAL_GROUND_SIZE} />
        <meshStandardMaterial color={visualProfile.global.groundBase} roughness={0.98} metalness={0.01} />
      </mesh>
      <GroundDetailRibbons />
    </group>
  );
}
