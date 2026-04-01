import { useMemo } from 'react';
import * as THREE from 'three';
import type { ExpoBackdropDensity } from '../lib/backdropSanitization';
import { sanitizeSkylinePlacements, type SkylineAssetId } from '../lib/skylinePlacement';
import type { ExpoWalkRegion } from '../walk-region';
import type { ExpoWorldVisualProfile } from '../world-contract';

type SkylinePlacement = {
  asset: SkylineAssetId;
  position: [number, number, number];
  rotationY: number;
  scale: number;
};

const BASE_PLACEMENTS: SkylinePlacement[] = [
  { asset: 'commercial_wide_a', position: [-412, -2, -536], rotationY: 0.02, scale: 1.12 },
  { asset: 'commercial_mid_f', position: [0, -3, -612], rotationY: 0, scale: 1.08 },
  { asset: 'commercial_wide_b', position: [412, -2, -544], rotationY: -0.02, scale: 1.12 },
];

const QUALITY_PLACEMENTS: SkylinePlacement[] = [
  { asset: 'suburban_f', position: [-528, -1, -676], rotationY: 0.04, scale: 0.84 },
  { asset: 'commercial_tower_b', position: [212, -7, -692], rotationY: -0.05, scale: 0.88 },
  { asset: 'suburban_n', position: [548, -1, -684], rotationY: -0.04, scale: 0.84 },
];

const SKYLINE_BOXES: Record<SkylineAssetId, [number, number, number]> = {
  commercial_mid_f: [54, 126, 34],
  commercial_tower_b: [34, 164, 28],
  commercial_wide_a: [84, 148, 36],
  commercial_wide_b: [86, 154, 38],
  suburban_f: [42, 78, 24],
  suburban_n: [40, 72, 24],
};

function createSkylineBlock(
  asset: SkylineAssetId,
  scale: number,
  color: string,
  opacity: number
) {
  const size = SKYLINE_BOXES[asset];
  const geometry = new THREE.BoxGeometry(size[0], size[1], size[2]);
  const material = new THREE.MeshStandardMaterial({
    color,
    depthWrite: false,
    metalness: 0.02,
    opacity,
    roughness: 0.94,
    transparent: true,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.castShadow = false;
  mesh.receiveShadow = false;
  mesh.scale.setScalar(scale);
  mesh.position.set(0, (size[1] * scale) * 0.5, 0);
  return mesh;
}

export function CuratedSkylineRing({
  debugBounds = false,
  density = 'minimal',
  visualProfile,
  walkRegions = [],
}: {
  debugBounds?: boolean;
  density?: ExpoBackdropDensity;
  visualProfile: ExpoWorldVisualProfile;
  walkRegions?: ExpoWalkRegion[];
}) {
  const placements = useMemo(
    () => (density === 'standard' ? [...BASE_PLACEMENTS, ...QUALITY_PLACEMENTS] : BASE_PLACEMENTS),
    [density]
  );

  const instances = useMemo(() => {
    const measured = placements.map((placement, index) => {
      const size = SKYLINE_BOXES[placement.asset];
      return {
        asset: placement.asset,
        boundsSize: [size[0] * placement.scale, size[1] * placement.scale, size[2] * placement.scale] as [number, number, number],
        id: `skyline-${placement.asset}-${index}`,
        position: placement.position,
        rotationY: placement.rotationY,
        scale: placement.scale,
      };
    });

    const sanitized = sanitizeSkylinePlacements(measured, walkRegions);

    return sanitized.map((placement, index) => {
      const districtProfile = visualProfile.districts[Math.min(visualProfile.districts.length - 1, index)] ?? visualProfile.districts[0];
      const profileScale = Math.min(0.82, districtProfile?.skylineScale ?? 0.76);
      const opacity = Math.max(0.06, (density === 'standard' ? 0.12 : 0.08) * (districtProfile?.skylineOpacity ?? 0.5));
      const object = createSkylineBlock(
        placement.asset,
        placement.scale * profileScale,
        visualProfile.global.skylineColor,
        opacity
      );

      return {
        ...placement,
        boundsCenter: [0, (SKYLINE_BOXES[placement.asset][1] * placement.scale * profileScale) * 0.5, 0] as [number, number, number],
        boundsSize: [
          SKYLINE_BOXES[placement.asset][0] * placement.scale * profileScale,
          SKYLINE_BOXES[placement.asset][1] * placement.scale * profileScale,
          SKYLINE_BOXES[placement.asset][2] * placement.scale * profileScale,
        ] as [number, number, number],
        object,
      };
    });
  }, [density, placements, visualProfile, walkRegions]);

  return (
    <group name="curated-skyline-ring">
      {instances.map((instance) => (
        <group key={instance.id} position={instance.position} rotation={[0, instance.rotationY, 0]}>
          <primitive object={instance.object} />
          {debugBounds && (
            <mesh position={instance.boundsCenter}>
              <boxGeometry args={instance.boundsSize} />
              <meshBasicMaterial color="#22d3ee" wireframe transparent opacity={0.18} toneMapped={false} />
            </mesh>
          )}
        </group>
      ))}
    </group>
  );
}
