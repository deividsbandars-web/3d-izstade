import { useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { normalizeModel } from '../../../utils/threeUtils';
import type { ExpoWalkRegion } from '../sceneWorld';
import { sanitizeSkylinePlacements, type SkylineAssetId } from '../lib/skylinePlacement';

type SkylinePlacement = {
  asset: SkylineAssetId;
  position: [number, number, number];
  rotationY: number;
  scale: number;
};

const BASE_PLACEMENTS: SkylinePlacement[] = [
  { asset: 'atlanta', position: [-248, 0, -132], rotationY: 0.3, scale: 7.1 },
  { asset: 'helix', position: [0, 0, -318], rotationY: 0, scale: 6.4 },
  { asset: 'bridge', position: [246, 0, -168], rotationY: -0.5, scale: 6.9 },
];

const QUALITY_PLACEMENTS: SkylinePlacement[] = [
  { asset: 'atlanta', position: [-182, 0, -246], rotationY: 0.92, scale: 5.4 },
  { asset: 'bridge', position: [186, 0, -262], rotationY: -0.94, scale: 5.6 },
];

export function CuratedSkylineRing({
  debugBounds = false,
  showcase = false,
  walkRegions = [],
}: {
  debugBounds?: boolean;
  showcase?: boolean;
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

  const placements = showcase ? [...BASE_PLACEMENTS, ...QUALITY_PLACEMENTS] : BASE_PLACEMENTS;
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
