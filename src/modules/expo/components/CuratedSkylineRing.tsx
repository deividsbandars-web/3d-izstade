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
  { asset: 'commercial_wide_a', position: [-346, -2, -374], rotationY: 0.06, scale: 2.9 },
  { asset: 'commercial_mid_f', position: [0, -4, -462], rotationY: 0, scale: 3.05 },
  { asset: 'commercial_wide_b', position: [354, -2, -386], rotationY: -0.06, scale: 2.95 },
];

const QUALITY_PLACEMENTS: SkylinePlacement[] = [
  { asset: 'suburban_f', position: [-454, -1, -522], rotationY: 0.08, scale: 2.05 },
  { asset: 'commercial_tower_b', position: [188, -8, -528], rotationY: -0.16, scale: 2.15 },
  { asset: 'suburban_n', position: [468, -1, -536], rotationY: -0.08, scale: 2.08 },
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
          const material = mesh.material;
          const materials = Array.isArray(material) ? material : material ? [material] : [];
          materials.forEach((entry) => {
            const next = entry as THREE.MeshStandardMaterial;
            if ('transparent' in next) {
              next.transparent = true;
              next.opacity = density === 'standard' ? 0.86 : 0.74;
              next.depthWrite = false;
            }
            if ('roughness' in next) {
              next.roughness = Math.max(0.88, Number(next.roughness || 0));
            }
            if ('metalness' in next) {
              next.metalness = Math.min(0.08, Number(next.metalness || 0));
            }
          });
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
