import type { ExpoWorldVisualProfile } from '../../world-contract';

const GLOBAL_GROUND_SIZE: [number, number] = [16000, 16000];
const GLOBAL_GROUND_POSITION: [number, number, number] = [0, -0.16, -1800];

export function WorldGroundPlane({ visualProfile }: { visualProfile: ExpoWorldVisualProfile }) {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={GLOBAL_GROUND_POSITION} receiveShadow={false} name="world-ground:global-base">
      <planeGeometry args={GLOBAL_GROUND_SIZE} />
      <meshStandardMaterial color={visualProfile.global.groundEdge} roughness={0.98} metalness={0.01} />
    </mesh>
  );
}
