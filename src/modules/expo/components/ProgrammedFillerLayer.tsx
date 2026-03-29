import { Text } from '@react-three/drei';
import { useMemo } from 'react';
import { buildDistrictLandmarkPlan } from '../lib/districtLandmarkPlan';
import type { ExpoBoothPlacement, ExpoSectorMarker } from '../sceneWorld';

function ProgrammedZoneView({ zone }: { zone: ReturnType<typeof buildDistrictLandmarkPlan>['programmedZones'][number] }) {
  const [width, depth] = zone.footprint;
  const headerWidth = Math.max(6.8, width - 1.8);
  const glowOpacity = zone.kind === 'arrival_info' ? 0.18 : zone.kind === 'meeting_suite' ? 0.14 : 0.12;

  return (
    <group position={zone.position} rotation={[0, zone.rotationY, 0]}>
      <mesh position={[0, 0.08, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[width + 2, depth + 1.6]} />
        <meshStandardMaterial color={zone.theme.groundPalette.plaza} transparent opacity={0.1} />
      </mesh>
      <mesh position={[0, 1.25, 0]} castShadow>
        <boxGeometry args={[width, 2.5, depth]} />
        <meshStandardMaterial color="#111827" metalness={0.12} roughness={0.84} />
      </mesh>
      <mesh position={[0, 2.55, depth * 0.5 + 0.2]} castShadow>
        <boxGeometry args={[headerWidth, 0.7, 0.45]} />
        <meshStandardMaterial color={zone.accentColor} emissive={zone.accentColor} emissiveIntensity={0.18} />
      </mesh>
      <mesh position={[0, 0.25, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[Math.max(width * 0.32, 1.4), Math.max(width * 0.52, 2.6), 32]} />
        <meshBasicMaterial color={zone.accentColor} transparent opacity={glowOpacity} />
      </mesh>
      <Text position={[0, 1.55, depth * 0.5 + 0.46]} fontSize={0.48} color="#f8fafc" anchorX="center" anchorY="middle" maxWidth={headerWidth - 0.4}>
        {zone.label.toUpperCase()}
      </Text>
      <Text position={[0, 1.02, 0]} fontSize={0.34} color="#cbd5e1" anchorX="center" anchorY="middle" maxWidth={width - 1.6}>
        {zone.subLabel.toUpperCase()}
      </Text>
      {zone.kind === 'meeting_suite' && (
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
      {zone.kind === 'demo_corner' && (
        <mesh position={[0, 1.08, -0.9]} castShadow>
          <boxGeometry args={[width - 2.8, 1.5, 0.24]} />
          <meshStandardMaterial color="#020617" emissive={zone.accentColor} emissiveIntensity={0.08} />
        </mesh>
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
