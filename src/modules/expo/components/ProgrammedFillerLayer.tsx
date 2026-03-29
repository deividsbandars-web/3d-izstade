import { Text } from '@react-three/drei';
import { useMemo } from 'react';
import { buildDistrictLandmarkPlan } from '../lib/districtLandmarkPlan';
import type { ExpoBoothPlacement, ExpoSectorMarker } from '../sceneWorld';

function ProgrammedZoneView({ zone }: { zone: ReturnType<typeof buildDistrictLandmarkPlan>['programmedZones'][number] }) {
  const [width, depth] = zone.footprint;
  const headerWidth = Math.max(6.8, width - 1.8);
  const glowOpacity = zone.kind === 'arrival_plaza' ? 0.2 : zone.kind === 'meeting_pod' ? 0.14 : zone.kind === 'scenic_promenade' ? 0.1 : 0.12;
  const baseHeight = zone.kind === 'arrival_plaza' ? 1.6 : zone.kind === 'info_pylon' ? 3.2 : zone.kind === 'gallery_wall' ? 2.2 : 2.5;

  return (
    <group position={zone.position} rotation={[0, zone.rotationY, 0]}>
      <mesh position={[0, 0.08, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[width + 2, depth + 1.6]} />
        <meshStandardMaterial color={zone.theme.groundPalette.plaza} transparent opacity={0.1} />
      </mesh>
      {zone.kind === 'scenic_promenade' ? (
        <>
          <mesh position={[0, 0.16, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
            <planeGeometry args={[width, depth]} />
            <meshStandardMaterial color={zone.theme.groundPalette.secondaryPath} metalness={0.06} roughness={0.84} />
          </mesh>
          <mesh position={[0, 0.18, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[Math.max(width * 0.22, 1.2), Math.max(width * 0.42, 2.2), 32]} />
            <meshBasicMaterial color={zone.accentColor} transparent opacity={0.12} />
          </mesh>
        </>
      ) : (
        <mesh position={[0, baseHeight * 0.5, 0]} castShadow>
          <boxGeometry args={[width, baseHeight, depth]} />
          <meshStandardMaterial color={zone.kind === 'arrival_plaza' ? zone.theme.groundPalette.baseField : "#111827"} metalness={0.12} roughness={0.84} />
        </mesh>
      )}
      {zone.kind !== 'scenic_promenade' && (
        <mesh position={[0, baseHeight + 0.55, depth * 0.5 + 0.2]} castShadow>
          <boxGeometry args={[headerWidth, 0.7, 0.45]} />
          <meshStandardMaterial color={zone.accentColor} emissive={zone.accentColor} emissiveIntensity={0.18} />
        </mesh>
      )}
      <mesh position={[0, 0.25, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[Math.max(width * 0.32, 1.4), Math.max(width * 0.52, 2.6), 32]} />
        <meshBasicMaterial color={zone.accentColor} transparent opacity={glowOpacity} />
      </mesh>
      <Text position={[0, zone.kind === 'scenic_promenade' ? 0.42 : Math.max(1.2, baseHeight + 0.12), zone.kind === 'scenic_promenade' ? 0 : depth * 0.5 + 0.46]} fontSize={0.48} color="#f8fafc" anchorX="center" anchorY="middle" maxWidth={headerWidth - 0.4}>
        {zone.label.toUpperCase()}
      </Text>
      <Text position={[0, zone.kind === 'scenic_promenade' ? 0.18 : 1.02, zone.kind === 'scenic_promenade' ? -1.1 : 0]} fontSize={0.34} color="#cbd5e1" anchorX="center" anchorY="middle" maxWidth={width - 1.6}>
        {zone.subLabel.toUpperCase()}
      </Text>
      {zone.kind === 'meeting_pod' && (
        <>
          <mesh position={[-width * 0.28, 1.04, -0.6]} castShadow>
            <boxGeometry args={[1.4, 0.3, 1.4]} />
            <meshStandardMaterial color={zone.theme.groundPalette.secondaryPath} />
          </mesh>
          <mesh position={[width * 0.28, 1.04, -0.6]} castShadow>
            <boxGeometry args={[1.4, 0.3, 1.4]} />
            <meshStandardMaterial color={zone.theme.groundPalette.secondaryPath} />
          </mesh>
        </>
      )}
      {zone.kind === 'demo_court' && (
        <mesh position={[0, 1.08, -0.9]} castShadow>
          <boxGeometry args={[width - 2.8, 1.5, 0.24]} />
          <meshStandardMaterial color="#020617" emissive={zone.accentColor} emissiveIntensity={0.08} />
        </mesh>
      )}
      {zone.kind === 'networking_lounge_island' && (
        <>
          <mesh position={[-width * 0.26, 0.98, -0.4]} castShadow>
            <cylinderGeometry args={[0.8, 0.8, 0.28, 18]} />
            <meshStandardMaterial color={zone.theme.groundPalette.secondaryPath} />
          </mesh>
          <mesh position={[width * 0.26, 0.98, -0.4]} castShadow>
            <cylinderGeometry args={[0.8, 0.8, 0.28, 18]} />
            <meshStandardMaterial color={zone.theme.groundPalette.secondaryPath} />
          </mesh>
        </>
      )}
      {zone.kind === 'info_pylon' && (
        <>
          <mesh position={[-width * 0.24, 1.6, 0]} castShadow>
            <boxGeometry args={[0.75, 3.2, 0.55]} />
            <meshStandardMaterial color={zone.accentColor} emissive={zone.accentColor} emissiveIntensity={0.14} />
          </mesh>
          <mesh position={[width * 0.24, 1.6, 0]} castShadow>
            <boxGeometry args={[0.75, 3.2, 0.55]} />
            <meshStandardMaterial color={zone.accentColor} emissive={zone.accentColor} emissiveIntensity={0.14} />
          </mesh>
        </>
      )}
      {zone.kind === 'gallery_wall' && (
        <group position={[0, 1.2, -0.5]}>
          {[-0.3, 0, 0.3].map((offset) => (
            <mesh key={offset} position={[offset * width, 0, 0]} castShadow>
              <boxGeometry args={[2.4, 1.6, 0.16]} />
              <meshStandardMaterial color="#020617" emissive={zone.accentColor} emissiveIntensity={0.05} />
            </mesh>
          ))}
        </group>
      )}
      {zone.kind === 'arrival_plaza' && (
        <group position={[0, 0.9, 0]}>
          {[-0.32, 0.32].map((offset) => (
            <mesh key={offset} position={[offset * width, 0, -1.4]} castShadow>
              <boxGeometry args={[2.4, 0.28, 2.4]} />
              <meshStandardMaterial color={zone.theme.groundPalette.secondaryPath} />
            </mesh>
          ))}
        </group>
      )}
    </group>
  );
}

export function ProgrammedFillerLayer({
  boothPlacements,
  sectorMarkers,
}: {
  boothPlacements: ExpoBoothPlacement[];
  sectorMarkers: ExpoSectorMarker[];
}) {
  const plan = useMemo(() => buildDistrictLandmarkPlan(boothPlacements, sectorMarkers), [boothPlacements, sectorMarkers]);

  return (
    <group name="programmed-filler-layer">
      {plan.programmedZones.map((zone) => (
        <ProgrammedZoneView key={zone.id} zone={zone} />
      ))}
    </group>
  );
}
