import { Text } from '@react-three/drei';
import { useMemo } from 'react';
import type { ExpoBoothPlacement, ExpoSectorMarker } from '../../layout-engine';

type WorldWayfindingProps = {
  boothPlacements: ExpoBoothPlacement[];
  playerPosition: [number, number, number];
  sectorMarkers: ExpoSectorMarker[];
};

type WayfindingMarker = {
  accent: 'elite' | 'hero' | 'premium' | 'standard';
  color: string;
  distance: number;
  id: string;
  label: string;
  position: [number, number, number];
  type: 'booth' | 'district';
};

function getBoothMarkerAccent(placement: ExpoBoothPlacement): WayfindingMarker['accent'] {
  const tier = String(placement.company?.sponsorTier || placement.sponsorTier || '').toLowerCase();

  if (tier === 'hero' || placement.boothType === 'hero') {
    return 'hero';
  }

  if (tier === 'platinum' || tier === 'elite') {
    return 'elite';
  }

  if (tier === 'gold' || tier === 'premium') {
    return 'premium';
  }

  return 'standard';
}

function getMarkerColor(accent: WayfindingMarker['accent']) {
  switch (accent) {
    case 'hero':
      return '#fbbf24';
    case 'elite':
      return '#67e8f9';
    case 'premium':
      return '#c084fc';
    default:
      return '#93c5fd';
  }
}

function formatMarkerDistance(distance: number) {
  return `${Math.round(distance)}u`;
}

function getMarkerBadge(marker: WayfindingMarker) {
  if (marker.type === 'district') {
    return 'DISTRICT';
  }

  switch (marker.accent) {
    case 'hero':
      return 'FLAGSHIP';
    case 'elite':
      return 'ELITE';
    case 'premium':
      return 'PREMIUM';
    default:
      return 'BOOTH';
  }
}

export function WorldWayfinding({
  boothPlacements,
  playerPosition,
  sectorMarkers,
}: WorldWayfindingProps) {
  const markers = useMemo(() => {
    const [playerX, , playerZ] = playerPosition;

    const districtMarkers: WayfindingMarker[] = sectorMarkers
      .map((marker) => {
        const dx = marker.position[0] - playerX;
        const dz = marker.position[2] - playerZ;
        const distance = Math.hypot(dx, dz);

        return {
          accent: 'standard' as const,
          color: marker.color,
          distance,
          id: `district-${marker.id}`,
          label: marker.label.toUpperCase(),
          position: [marker.position[0], 17, marker.position[2]] as [number, number, number],
          type: 'district' as const,
        };
      })
      .filter((marker) => marker.distance > 60 && marker.distance < 1800)
      .sort((left, right) => left.distance - right.distance)
      .slice(0, 4);

    const boothMarkers: WayfindingMarker[] = boothPlacements
      .filter((placement) => {
        const tier = String(placement.company?.sponsorTier || placement.sponsorTier || '').toLowerCase();
        return (
          placement.boothType === 'hero'
          || tier === 'hero'
          || tier === 'platinum'
          || tier === 'elite'
          || tier === 'gold'
          || tier === 'premium'
        );
      })
      .map((placement) => {
        const dx = placement.position[0] - playerX;
        const dz = placement.position[2] - playerZ;
        const distance = Math.hypot(dx, dz);
        const accent = getBoothMarkerAccent(placement);

        return {
          accent,
          color: getMarkerColor(accent),
          distance,
          id: `booth-${placement.id}`,
          label: placement.company?.name || placement.sectorName || 'BOOTH',
          position: [placement.position[0], accent === 'hero' ? 14.2 : accent === 'elite' ? 13.1 : 11.5, placement.position[2]] as [number, number, number],
          type: 'booth' as const,
        };
      })
      .filter((marker) => marker.distance > 28 && marker.distance < 1100)
      .sort((left, right) => {
        const accentWeight = (value: WayfindingMarker['accent']) => {
          switch (value) {
            case 'hero':
              return 4;
            case 'elite':
              return 3;
            case 'premium':
              return 2;
            default:
              return 1;
          }
        };

        const accentDiff = accentWeight(right.accent) - accentWeight(left.accent);
        if (accentDiff !== 0) {
          return accentDiff;
        }

        return left.distance - right.distance;
      })
      .slice(0, 5);

    return [...districtMarkers, ...boothMarkers];
  }, [boothPlacements, playerPosition, sectorMarkers]);

  return (
    <group name="world-wayfinding">
      {markers.map((marker) => (
        <group key={marker.id} position={marker.position}>
          <mesh position={[0, marker.type === 'district' ? -3.5 : marker.accent === 'hero' ? -4.7 : marker.accent === 'elite' ? -4.1 : -3.25, 0]}>
            <cylinderGeometry
              args={[
                marker.type === 'district' ? 0.12 : marker.accent === 'hero' ? 0.16 : marker.accent === 'elite' ? 0.15 : 0.11,
                marker.type === 'district' ? 0.12 : marker.accent === 'hero' ? 0.16 : marker.accent === 'elite' ? 0.15 : 0.11,
                marker.type === 'district' ? 7.5 : marker.accent === 'hero' ? 9.6 : marker.accent === 'elite' ? 8.2 : 4.8,
                10,
              ]}
            />
            <meshBasicMaterial color={marker.color} transparent opacity={0.7} />
          </mesh>
          <mesh position={[0, 0, 0]}>
            <sphereGeometry
              args={[
                marker.type === 'district' ? 0.42 : marker.accent === 'hero' ? 0.68 : marker.accent === 'elite' ? 0.56 : 0.42,
                14,
                14,
              ]}
            />
            <meshBasicMaterial color={marker.color} />
          </mesh>
          {marker.type === 'booth' && marker.accent !== 'standard' && (
            <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[marker.accent === 'hero' ? 0.98 : 0.82, marker.accent === 'hero' ? 1.26 : 1.02, 28]} />
              <meshBasicMaterial color={marker.color} transparent opacity={0.66} side={2} />
            </mesh>
          )}
          <Text
            anchorX="center"
            anchorY="bottom"
            color={marker.color}
            fontSize={0.44}
            outlineBlur={0.22}
            outlineColor="#020617"
            outlineWidth={0.06}
            position={[0, marker.type === 'district' ? 1.6 : 1.28, 0]}
          >
            {getMarkerBadge(marker)}
          </Text>
          <Text
            anchorX="center"
            anchorY="bottom"
            color="#f8fafc"
            fontSize={marker.type === 'district' ? 1.45 : marker.accent === 'hero' ? 1.08 : marker.accent === 'elite' ? 1.02 : 0.9}
            maxWidth={marker.type === 'district' ? 44 : marker.accent === 'hero' ? 30 : 24}
            outlineBlur={0.25}
            outlineColor="#020617"
            outlineWidth={0.08}
            position={[0, marker.type === 'district' ? 2.1 : 1.7, 0]}
          >
            {marker.label}
          </Text>
          <Text
            anchorX="center"
            anchorY="top"
            color={marker.color}
            fontSize={0.62}
            outlineBlur={0.2}
            outlineColor="#020617"
            outlineWidth={0.06}
            position={[0, marker.type === 'district' ? 1.88 : 1.42, 0]}
          >
            {formatMarkerDistance(marker.distance)}
          </Text>
        </group>
      ))}
    </group>
  );
}
