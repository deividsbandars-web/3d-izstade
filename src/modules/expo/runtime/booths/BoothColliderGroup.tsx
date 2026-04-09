import { ColliderMaterial } from '../world';

export function BoothColliderGroup({
  colliderSegments,
  debug,
}: {
  colliderSegments: ReturnType<typeof import('../../components/BoothArchitectureKit').getBoothColliderSegments>;
  debug: boolean;
}) {
  return (
    <group name="district-booth-collider">
      {colliderSegments.map((segment) => (
        <mesh key={segment.id} position={segment.position}>
          <boxGeometry args={segment.size} />
          <ColliderMaterial color="#2563eb" debug={debug} />
        </mesh>
      ))}
    </group>
  );
}
