import type { ExpoWorldVisualProfile } from '../../world-contract';

export function WorldGroundPlane({ visualProfile }: { visualProfile: ExpoWorldVisualProfile }) {
  void visualProfile;
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.16, -1800]} receiveShadow={false}>
      <planeGeometry args={[16000, 16000]} />
      <meshStandardMaterial color="#6f7c85" roughness={0.97} metalness={0.01} />
    </mesh>
  );
}
