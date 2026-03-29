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

        const width = anchor.kind === 'meeting_lounge' ? 10 : anchor.kind === 'sector_pavilion' ? 12 : anchor.kind === 'networking_hub' ? 9.5 : anchor.kind === 'photo_spot' ? 7.2 : 8;
        const depth = anchor.kind === 'networking_hub' ? 7.2 : anchor.kind === 'sector_pavilion' ? 7.8 : anchor.kind === 'demo_gallery' ? 6.2 : anchor.kind === 'photo_spot' ? 3.4 : 5.4;
        const height = anchor.kind === 'sector_pavilion' ? 5.2 : anchor.kind === 'gateway_lantern' ? 3.2 : anchor.kind === 'photo_spot' ? 4.4 : 3.6;
        const yOffset = anchor.kind === 'sector_pavilion' ? 2.6 : 1.8;

        return (
          <group key={`functional-${anchor.id}`} position={[anchor.position[0], 0, anchor.position[2] + 6]} rotation={[0, anchor.rotationY, 0]}>
            <mesh position={[0, 0.12, 0]} receiveShadow>
              <cylinderGeometry args={[width * 0.58, width * 0.7, 0.24, 26]} />
              <meshStandardMaterial color={anchor.theme.groundPalette.plaza} transparent opacity={0.14} />
            </mesh>
            {anchor.kind === 'sector_pavilion' ? (
              <>
                <mesh position={[0, yOffset, 0]} castShadow>
                  <cylinderGeometry args={[width * 0.52, width * 0.56, 0.44, 28]} />
                  <meshStandardMaterial color="#111827" metalness={0.16} roughness={0.78} />
                </mesh>
                <mesh position={[-width * 0.34, 1.9, 0]} castShadow>
                  <boxGeometry args={[0.9, height, 1]} />
                  <meshStandardMaterial color={anchor.accentColor} emissive={anchor.accentColor} emissiveIntensity={0.12} />
                </mesh>
                <mesh position={[width * 0.34, 1.9, 0]} castShadow>
                  <boxGeometry args={[0.9, height, 1]} />
                  <meshStandardMaterial color={anchor.accentColor} emissive={anchor.accentColor} emissiveIntensity={0.12} />
                </mesh>
                <mesh position={[0, height - 0.2, 0]} castShadow>
                  <boxGeometry args={[width - 1.2, 0.9, 1.2]} />
                  <meshStandardMaterial color="#131c2e" />
                </mesh>
              </>
            ) : anchor.kind === 'photo_spot' ? (
              <>
                <mesh position={[0, 2.1, -0.4]} castShadow>
                  <torusGeometry args={[2.2, 0.22, 14, 32]} />
                  <meshStandardMaterial color={anchor.accentColor} emissive={anchor.accentColor} emissiveIntensity={0.16} />
                </mesh>
                <mesh position={[-1.8, 1.9, 0]} castShadow>
                  <boxGeometry args={[0.45, 4, 0.45]} />
                  <meshStandardMaterial color="#131c2e" />
                </mesh>
                <mesh position={[1.8, 1.9, 0]} castShadow>
                  <boxGeometry args={[0.45, 4, 0.45]} />
                  <meshStandardMaterial color="#131c2e" />
                </mesh>
                <mesh position={[0, 0.9, 0.7]} castShadow>
                  <boxGeometry args={[3.8, 0.34, 1.2]} />
                  <meshStandardMaterial color={anchor.theme.groundPalette.baseField} metalness={0.08} roughness={0.88} />
                </mesh>
              </>
            ) : (
              <>
                <mesh position={[0, yOffset, 0]} castShadow>
                  <boxGeometry args={[width, height, depth]} />
                  <meshStandardMaterial color="#131c2e" metalness={0.16} roughness={0.78} />
                </mesh>
                <mesh position={[0, yOffset + 1.4, depth * 0.5 + 0.24]} castShadow>
                  <boxGeometry args={[width - 1.2, 1.1, 0.5]} />
                  <meshStandardMaterial color={anchor.accentColor} emissive={anchor.accentColor} emissiveIntensity={0.16} />
                </mesh>
              </>
            )}
            <Text position={[0, anchor.kind === 'sector_pavilion' ? 2.3 : 2.1, depth * 0.5 + 0.54]} fontSize={0.58} color="#f8fafc" anchorX="center" anchorY="middle" maxWidth={width - 1.4}>
              {anchor.label.toUpperCase()}
            </Text>
          </group>
        );
      })}
    </group>
  );
}
