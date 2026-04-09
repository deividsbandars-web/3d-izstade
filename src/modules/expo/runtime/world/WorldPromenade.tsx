import { useMemo } from 'react';
import type { ExpoSectorMarker } from '../../layout-engine';
import type { ExpoBoothPlacement } from '../../layout-engine';
import { EXPO_SPATIAL_DEBUG_FLAGS } from '../../state/expoRuntime';
import { ArrivalReveal } from '../../components/ArrivalReveal';
import type { ExpoWorldVisualProfile } from '../../world-contract';

function ExpoAxisMaterial({
  color,
  metalness = 0.04,
  roughness = 0.64,
}: {
  color: string;
  metalness?: number;
  roughness?: number;
}) {
  return <meshStandardMaterial color={color} metalness={metalness} roughness={roughness} />;
}

export function WorldPromenade({
  boothPlacements,
  sectorMarkers: _sectorMarkers,
}: {
  boothPlacements: ExpoBoothPlacement[];
  sectorMarkers: ExpoSectorMarker[];
  visualProfile?: ExpoWorldVisualProfile;
}) {
  const footprint = useMemo(() => {
    const planned = boothPlacements[0]?.layoutFootprint;
    if (planned) {
      return planned;
    }

    const xs = boothPlacements.map((placement) => placement.position[0]);
    const zs = boothPlacements.map((placement) => placement.position[2]);
    return {
      maxX: xs.length > 0 ? Math.max(...xs) + 96 : 260,
      maxZ: zs.length > 0 ? Math.max(...zs) + 96 : 80,
      minX: xs.length > 0 ? Math.min(...xs) - 96 : -260,
      minZ: zs.length > 0 ? Math.min(...zs) - 180 : -620,
    };
  }, [boothPlacements]);
  const centerZ = (footprint.minZ + footprint.maxZ) * 0.5;
  const promenadeLength = Math.max(1320, (footprint.maxZ - footprint.minZ) + 520);
  const promenadeWidth = 148;
  const innerRunwayWidth = 44;
  const shoulderWidth = 28;
  const sidePromenadeWidth = 104;
  const sidePromenadeX = 288;
  const plazaDepth = 196;
  const plazaOffsets = [
    footprint.maxZ - 168,
    centerZ + 44,
    footprint.minZ + 224,
  ];

  return (
    <group name="expo-district-promenade">
      <mesh position={[0, 0.03, centerZ]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[promenadeWidth, promenadeLength]} />
        <ExpoAxisMaterial color="#dce3eb" roughness={0.58} metalness={0.05} />
      </mesh>
      <mesh position={[0, 0.035, centerZ]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[innerRunwayWidth, promenadeLength - 36]} />
        <ExpoAxisMaterial color="#eef4f8" roughness={0.48} metalness={0.05} />
      </mesh>
      <mesh position={[-((promenadeWidth * 0.5) - (shoulderWidth * 0.5)), 0.034, centerZ]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[shoulderWidth, promenadeLength - 36]} />
        <ExpoAxisMaterial color="#cfd7df" roughness={0.66} metalness={0.04} />
      </mesh>
      <mesh position={[(promenadeWidth * 0.5) - (shoulderWidth * 0.5), 0.034, centerZ]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[shoulderWidth, promenadeLength - 36]} />
        <ExpoAxisMaterial color="#cfd7df" roughness={0.66} metalness={0.04} />
      </mesh>
      <mesh position={[-sidePromenadeX, 0.031, centerZ - 24]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[sidePromenadeWidth, promenadeLength - 180]} />
        <ExpoAxisMaterial color="#dce6ed" roughness={0.68} metalness={0.03} />
      </mesh>
      <mesh position={[sidePromenadeX, 0.031, centerZ - 24]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[sidePromenadeWidth, promenadeLength - 180]} />
        <ExpoAxisMaterial color="#dce6ed" roughness={0.68} metalness={0.03} />
      </mesh>
      {plazaOffsets.map((z, index) => (
        <group key={`city-plaza-${z}`}>
          <mesh position={[0, 0.029, z]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
            <planeGeometry args={[186, plazaDepth]} />
            <ExpoAxisMaterial
              color={index === 0 ? '#d7e0e8' : index === 1 ? '#d2dbe4' : '#d0d9e1'}
              roughness={0.74}
              metalness={0.03}
            />
          </mesh>
          <mesh position={[0, 0.032, z]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
            <planeGeometry args={[52, plazaDepth - 24]} />
            <ExpoAxisMaterial color="#edf3f7" roughness={0.52} metalness={0.04} />
          </mesh>
        </group>
      ))}
      {!EXPO_SPATIAL_DEBUG_FLAGS.disableArrivalReveal && <ArrivalReveal />}
    </group>
  );
}
