import { Text } from '@react-three/drei';
import { EXPO_SPATIAL_DEBUG_FLAGS } from '../../../state/expoRuntime';
import type { ExpoStartView } from '../../../world-contract';
import type { ExpoPlayBounds, ExpoWalkRegion } from '../../../walk-region';
import { TargetBasketHighlighter } from '../inspection/worldInspectionContract';

export function ExpoWorldDebugLayer({
  highlightedTargets,
  playBounds,
  startView,
  walkRegions,
}: {
  highlightedTargets: string[];
  playBounds: ExpoPlayBounds;
  startView: ExpoStartView;
  walkRegions: ExpoWalkRegion[];
}) {
  return (
    <>
      <TargetBasketHighlighter targets={highlightedTargets} />
      {(EXPO_SPATIAL_DEBUG_FLAGS.showSpawnMarkers || EXPO_SPATIAL_DEBUG_FLAGS.showWalkCorridor) && (
        <SpawnDebugOverlay playBounds={playBounds} startView={startView} walkRegions={walkRegions} />
      )}
    </>
  );
}

export function SpawnDebugOverlay({
  playBounds,
  startView,
  walkRegions,
}: {
  playBounds: ExpoPlayBounds;
  startView: ExpoStartView;
  walkRegions: ExpoWalkRegion[];
}) {
  return (
    <group name="expo-spatial-debug-overlay">
      {EXPO_SPATIAL_DEBUG_FLAGS.showWalkCorridor && (
        <>
          {walkRegions.map((region) => (
            <mesh
              key={region.id}
              position={[(region.minX + region.maxX) * 0.5, 0.02, (region.minZ + region.maxZ) * 0.5]}
              rotation={[-Math.PI / 2, 0, 0]}
            >
              <planeGeometry args={[region.maxX - region.minX, region.maxZ - region.minZ]} />
              <meshBasicMaterial
                color={
                  region.type === 'arrival'
                    ? '#38bdf8'
                    : region.type === 'spine'
                      ? '#22c55e'
                      : region.type === 'promenade'
                        ? '#f97316'
                        : '#eab308'
                }
                transparent
                opacity={region.type === 'booth-pocket' ? 0.09 : region.type === 'promenade' ? 0.1 : 0.14}
                depthWrite={false}
                toneMapped={false}
              />
            </mesh>
          ))}
          <mesh position={[0, 0.025, (playBounds.minZ + playBounds.maxZ) * 0.5]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[playBounds.maxX - playBounds.minX, playBounds.maxZ - playBounds.minZ]} />
            <meshBasicMaterial color="#ef4444" transparent opacity={0.04} depthWrite={false} toneMapped={false} />
          </mesh>
        </>
      )}
      {EXPO_SPATIAL_DEBUG_FLAGS.showSpawnMarkers && (
        <>
          <mesh position={[startView.position[0], 0.3, startView.position[2]]}>
            <cylinderGeometry args={[0.55, 0.55, 0.6, 18]} />
            <meshBasicMaterial color="#f97316" toneMapped={false} />
          </mesh>
          <mesh position={startView.lookAt}>
            <sphereGeometry args={[0.9, 18, 18]} />
            <meshBasicMaterial color="#22d3ee" toneMapped={false} />
          </mesh>
          <Text position={[startView.position[0], 2, startView.position[2]]} fontSize={0.9} color="#f8fafc" anchorX="center" anchorY="middle">
            SPAWN
          </Text>
          <Text position={[startView.lookAt[0], startView.lookAt[1] + 2.2, startView.lookAt[2]]} fontSize={0.72} color="#f8fafc" anchorX="center" anchorY="middle">
            START TARGET
          </Text>
        </>
      )}
    </group>
  );
}
