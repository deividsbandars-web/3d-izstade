import type { ExpoWorldVisualProfile } from '../../world-contract';

export function WorldGroundPlane({ visualProfile }: { visualProfile: ExpoWorldVisualProfile }) {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]} receiveShadow={false}>
      <planeGeometry args={[2000, 2000]} />
      <meshStandardMaterial color={visualProfile.global.groundBase} roughness={0.82} metalness={0.04} />
    </mesh>
  );
}
