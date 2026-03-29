import { useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { normalizeModel } from '../../../utils/threeUtils';
import type { ExpoWalkRegion } from '../sceneWorld';
import type { ExpoBackdropDensity } from '../lib/backdropSanitization';
import { sanitizeSkylinePlacements, type SkylineAssetId } from '../lib/skylinePlacement';

type SkylinePlacement = {
  asset: SkylineAssetId;
  position: [number, number, number];
  rotationY: number;
  scale: number;
};

const BASE_PLACEMENTS: SkylinePlacement[] = [
  { asset: 'atlanta', position: [-286, 0, -268], rotationY: 0.26, scale: 5.2 },
  { asset: 'helix', position: [0, 0, -388], rotationY: 0, scale: 4.8 },
  { asset: 'bridge', position: [294, 0, -292], rotationY: -0.42, scale: 5.5 },
];

const QUALITY_PLACEMENTS: SkylinePlacement[] = [
  { asset: 'atlanta', position: [-362, 0, -356], rotationY: 0.74, scale: 4.4 },
];

export function CuratedSkylineRing({
  debugBounds = false,
  density = 'minimal',
  walkRegions = [],
}: {
  debugBounds?: boolean;
  density?: ExpoBackdropDensity;
  walkRegions?: ExpoWalkRegion[];
}) {
  const { scene: atlantaSource } = useGLTF('/models/free__atlanta_corperate_office_building.glb');
  const { scene: bridgeSource } = useGLTF('/models/bridge_design.glb');
  const { scene: helixSource } = useGLTF('/models/helix_bridge.glb');

  const assetMap = useMemo(() => ({
    atlanta: atlantaSource,
    bridge: bridgeSource,
    helix: helixSource,
  }), [atlantaSource, bridgeSource, helixSource]);

  const placements = density === 'standard' ? [...BASE_PLACEMENTS, ...QUALITY_PLACEMENTS] : BASE_PLACEMENTS;
  const instances = useMemo(() => {
    const measured = placements.map((placement, index) => {
      const clone = assetMap[placement.asset].clone(true);
      normalizeModel(clone);
      clone.scale.setScalar(placement.scale);
      clone.updateMatrixWorld(true);
      const bounds = new THREE.Box3().setFromObject(clone);
      const size = bounds.getSize(new THREE.Vector3());

      return {
        asset: placement.asset,
        boundsSize: size.toArray() as [number, number, number],
        id: `skyline-${placement.asset}-${index}`,
        position: placement.position,
        rotationY: placement.rotationY,
        scale: placement.scale,
      };
    });

    const sanitized = sanitizeSkylinePlacements(measured, walkRegions);

    return sanitized.map((placement) => {
      const clone = assetMap[placement.asset].clone(true);
      normalizeModel(clone);
      clone.scale.setScalar(placement.scale);
      clone.updateMatrixWorld(true);
      const bounds = new THREE.Box3().setFromObject(clone);
      const size = bounds.getSize(new THREE.Vector3());
      const center = bounds.getCenter(new THREE.Vector3());

      return {
        ...placement,
        boundsCenter: center.toArray() as [number, number, number],
        boundsSize: size.toArray() as [number, number, number],
        object: clone,
      };
    });
  }, [assetMap, placements, walkRegions]);

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
