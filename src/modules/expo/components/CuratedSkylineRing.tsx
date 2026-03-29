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
  { asset: 'commercial_wide_a', position: [-318, 0, -332], rotationY: 0.08, scale: 3.2 },
  { asset: 'commercial_mid_f', position: [0, 0, -428], rotationY: 0, scale: 3.4 },
  { asset: 'commercial_wide_b', position: [328, 0, -346], rotationY: -0.08, scale: 3.2 },
];

const QUALITY_PLACEMENTS: SkylinePlacement[] = [
  { asset: 'suburban_f', position: [-432, 0, -472], rotationY: 0.12, scale: 2.2 },
  { asset: 'commercial_tower_b', position: [136, 0, -452], rotationY: -0.18, scale: 2.5 },
  { asset: 'suburban_n', position: [438, 0, -486], rotationY: -0.1, scale: 2.2 },
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
  const { scene: commercialWideASource } = useGLTF('/models/expo/skyline-candidates/low-detail-building-wide-a.glb');
  const { scene: commercialWideBSource } = useGLTF('/models/expo/skyline-candidates/low-detail-building-wide-b.glb');
  const { scene: commercialMidFSource } = useGLTF('/models/expo/skyline-candidates/low-detail-building-f.glb');
  const { scene: commercialTowerBSource } = useGLTF('/models/expo/skyline-candidates/building-skyscraper-b.glb');
  const { scene: suburbanFSource } = useGLTF('/models/expo/skyline-candidates/building-type-f.glb');
  const { scene: suburbanNSource } = useGLTF('/models/expo/skyline-candidates/building-type-n.glb');

  const assetMap = useMemo(() => ({
    commercial_mid_f: commercialMidFSource,
    commercial_tower_b: commercialTowerBSource,
    commercial_wide_a: commercialWideASource,
    commercial_wide_b: commercialWideBSource,
    suburban_f: suburbanFSource,
    suburban_n: suburbanNSource,
  }), [commercialMidFSource, commercialTowerBSource, commercialWideASource, commercialWideBSource, suburbanFSource, suburbanNSource]);

  const placements = density === 'standard' ? [...BASE_PLACEMENTS, ...QUALITY_PLACEMENTS] : BASE_PLACEMENTS;
  const instances = useMemo(() => {
    const measured = placements.map((placement, index) => {
      const clone = assetMap[placement.asset].clone(true);
      normalizeModel(clone, 20);
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
      normalizeModel(clone, 20);
      clone.scale.setScalar(placement.scale);
      clone.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh;
          mesh.castShadow = false;
          mesh.receiveShadow = false;
        }
      });
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
