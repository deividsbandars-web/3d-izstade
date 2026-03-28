import { Text } from '@react-three/drei';
import { useMemo } from 'react';
import { buildDistrictLandmarkPlan } from '../lib/districtLandmarkPlan';
import type { ExpoBoothPlacement, ExpoSectorMarker } from '../sceneWorld';

function DistrictLandmarkNodeView({ anchor }: { anchor: ReturnType<typeof buildDistrictLandmarkPlan>['anchors'][number] }) {
  if (anchor.kind === 'arrival_beacon') {
    return null;
  }

  return (
    <group position={anchor.position} rotation={[0, anchor.rotationY, 0]} scale={anchor.scale}>
      <mesh position={[0, 0.18, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[12, 8]} />
        <meshStandardMaterial color={anchor.theme.groundPalette.plaza} transparent opacity={0.12} />
      </mesh>
      <mesh position={[0, 3.8, 0]} castShadow>
        <boxGeometry args={[8.4, 7.2, 1.4]} />
        <meshStandardMaterial color="#0f172a" metalness={0.18} roughness={0.76} />
      </mesh>
      <mesh position={[0, 7.6, 0.76]} castShadow>
        <boxGeometry args={[7.8, 0.7, 1.6]} />
        <meshStandardMaterial color={anchor.accentColor} emissive={anchor.accentColor} emissiveIntensity={0.2} />
      </mesh>
      <mesh position={[-3.7, 4.1, 0]} castShadow>
        <boxGeometry args={[0.8, 8, 1.8]} />
        <meshStandardMaterial color={anchor.accentColor} emissive={anchor.accentColor} emissiveIntensity={0.18} />
      </mesh>
      {anchor.kind !== 'gateway_lantern' && (
        <mesh position={[3.8, 4.8, -1.6]} castShadow>
          <cylinderGeometry args={[0.75, 0.9, 9.4, 16]} />
          <meshStandardMaterial color="#1f2937" />
        </mesh>
      )}
      <Text position={[0, 4.7, 1.05]} fontSize={0.72} color="#f8fafc" anchorX="center" anchorY="middle" maxWidth={6.8}>
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
