import { getBoothArchitectureMetrics } from '../../components/BoothArchitectureKit';

export function BoothDebugShellFallback({
  accentColor,
  metrics,
}: {
  accentColor: string;
  metrics: ReturnType<typeof getBoothArchitectureMetrics>;
}) {
  return (
    <group name="booth-debug-shell-fallback">
      <mesh position={[0, metrics.colliderSize[1] * 0.34, 0]} castShadow>
        <boxGeometry args={[metrics.footprintSize[0] * 0.78, metrics.colliderSize[1] * 0.68, metrics.footprintSize[1] * 0.72]} />
        <meshStandardMaterial color="#0f172a" metalness={0.18} roughness={0.82} />
      </mesh>
      <mesh position={[0, metrics.colliderSize[1] * 0.58, (metrics.footprintSize[1] * 0.36) + 0.22]} castShadow>
        <boxGeometry args={[metrics.footprintSize[0] * 0.64, 1.1, 0.44]} />
        <meshStandardMaterial color={accentColor} emissive={accentColor} emissiveIntensity={0.16} />
      </mesh>
    </group>
  );
}
