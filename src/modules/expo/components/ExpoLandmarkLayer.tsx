import { Text } from '@react-three/drei';
import { useMemo } from 'react';
import { buildDistrictLandmarkPlan } from '../lib/districtLandmarkPlan';
import type { ExpoBoothPlacement, ExpoSectorMarker } from '../sceneWorld';

function DistrictLandmarkNodeView({ anchor }: { anchor: ReturnType<typeof buildDistrictLandmarkPlan>['anchors'][number] }) {
  if (anchor.kind === 'arrival_beacon') {
    return null;
  }

  const baseWidth = anchor.kind === 'sector_pavilion' ? 10.8 : 8.4;
  const baseHeight = anchor.kind === 'sector_pavilion' ? 8.4 : 7.2;
  const plateWidth = anchor.kind === 'sector_pavilion' ? 9.8 : 7.8;
  const sideColumnOffset = anchor.kind === 'sector_pavilion' ? 4.7 : 3.7;

  return (
    <group position={anchor.position} rotation={[0, anchor.rotationY, 0]} scale={anchor.scale}>
      <mesh position={[0, 0.18, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={anchor.kind === 'sector_pavilion' ? [14, 10] : [12, 8]} />
        <meshStandardMaterial color={anchor.theme.groundPalette.plaza} transparent opacity={0.12} />
      </mesh>
      <mesh position={[0, 3.8, 0]} castShadow>
        <boxGeometry args={[baseWidth, baseHeight, anchor.kind === 'sector_pavilion' ? 1.8 : 1.4]} />
        <meshStandardMaterial color="#0f172a" metalness={0.18} roughness={0.76} />
      </mesh>
      <mesh position={[0, 7.6, 0.76]} castShadow>
        <boxGeometry args={[plateWidth, 0.7, 1.6]} />
        <meshStandardMaterial color={anchor.accentColor} emissive={anchor.accentColor} emissiveIntensity={0.2} />
      </mesh>
      <mesh position={[-sideColumnOffset, 4.1, 0]} castShadow>
        <boxGeometry args={[0.8, 8, 1.8]} />
        <meshStandardMaterial color={anchor.accentColor} emissive={anchor.accentColor} emissiveIntensity={0.18} />
      </mesh>
      {anchor.kind !== 'gateway_lantern' && (
        <mesh position={[sideColumnOffset + 0.1, 4.8, -1.6]} castShadow>
          <cylinderGeometry args={[0.75, 0.9, 9.4, 16]} />
          <meshStandardMaterial color="#1f2937" />
        </mesh>
      )}
      {anchor.kind === 'sector_pavilion' && (
        <mesh position={[0, 1.6, -1.8]} castShadow>
          <boxGeometry args={[8.6, 1.1, 2.6]} />
          <meshStandardMaterial color={anchor.theme.groundPalette.baseField} metalness={0.08} roughness={0.88} />
        </mesh>
      )}
      <Text position={[0, 4.7, 1.05]} fontSize={0.72} color="#f8fafc" anchorX="center" anchorY="middle" maxWidth={anchor.kind === 'sector_pavilion' ? 8.6 : 6.8}>
        {anchor.label.toUpperCase()}
      </Text>
    </group>
  );
}

export function ExpoLandmarkLayer({
  boothPlacements,
  sectorMarkers,
}: {
  boothPlacements: ExpoBoothPlacement[];
  sectorMarkers: ExpoSectorMarker[];
}) {
  const plan = useMemo(() => buildDistrictLandmarkPlan(boothPlacements, sectorMarkers), [boothPlacements, sectorMarkers]);

  return (
    <group name="expo-landmark-layer">
      {plan.anchors.map((anchor) => (
        <DistrictLandmarkNodeView key={anchor.id} anchor={anchor} />
      ))}
    </group>
  );
}
