import type { ExpoWorldVisualProfile } from '../../world-contract';
import {
  GLOBAL_GROUND_POSITION,
  GLOBAL_GROUND_SIZE,
} from './WorldGroundLayout';

export function WorldGroundPlane({ visualProfile }: { visualProfile: ExpoWorldVisualProfile }) {
  return (
    <group name="world-ground:global">
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={GLOBAL_GROUND_POSITION} receiveShadow={false} name="world-ground:global-base">
        <planeGeometry args={GLOBAL_GROUND_SIZE} />
        <meshStandardMaterial color={visualProfile.global.groundBase} emissive="#d8e4ec" emissiveIntensity={0.016} roughness={0.96} metalness={0.01} />
      </mesh>
    </group>
  );
}
