import { Text } from '@react-three/drei';
import { useMemo } from 'react';
import { buildDistrictLandmarkPlan } from '../lib/districtLandmarkPlan';
import type { ExpoBoothPlacement, ExpoSectorMarker } from '../sceneWorld';

export function DistrictAnchorNodes({
  boothPlacements,
  sectorMarkers,
  showcase = false,
}: {
  boothPlacements: ExpoBoothPlacement[];
  sectorMarkers: ExpoSectorMarker[];
  showcase?: boolean;
}) {
  const plan = useMemo(() => buildDistrictLandmarkPlan(boothPlacements, sectorMarkers), [boothPlacements, sectorMarkers]);
  const anchors = showcase ? plan.anchors : plan.anchors.filter((anchor) => anchor.kind !== 'gateway_lantern');

  return (
    <group name="district-anchor-nodes">
      {anchors.map((anchor) => {
        if (anchor.kind === 'arrival_beacon') {
          return null;
        }

        const width = anchor.kind === 'meeting_lounge' ? 10 : 8;
        const depth = anchor.kind === 'networking_hub' ? 7 : 5.4;

        return (
          <group key={`functional-${anchor.id}`} position={[anchor.position[0], 0, anchor.position[2] + 6]} rotation={[0, anchor.rotationY, 0]}>
            <mesh position={[0, 0.12, 0]} receiveShadow>
              <cylinderGeometry args={[width * 0.58, width * 0.7, 0.24, 26]} />
              <meshStandardMaterial color={anchor.theme.groundPalette.plaza} transparent opacity={0.14} />
            </mesh>
            <mesh position={[0, 1.8, 0]} castShadow>
              <boxGeometry args={[width, 3.6, depth]} />
              <meshStandardMaterial color="#131c2e" metalness={0.16} roughness={0.78} />
            </mesh>
            <mesh position={[0, 3.2, depth * 0.5 + 0.24]} castShadow>
              <boxGeometry args={[width - 1.2, 1.1, 0.5]} />
              <meshStandardMaterial color={anchor.accentColor} emissive={anchor.accentColor} emissiveIntensity={0.16} />
            </mesh>
            <Text position={[0, 2.1, depth * 0.5 + 0.54]} fontSize={0.58} color="#f8fafc" anchorX="center" anchorY="middle" maxWidth={width - 1.4}>
              {anchor.label.toUpperCase()}
            </Text>
          </group>
        );
      })}
    </group>
  );
}
