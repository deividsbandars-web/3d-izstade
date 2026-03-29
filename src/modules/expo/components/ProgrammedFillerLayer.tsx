import { Text, useGLTF } from '@react-three/drei';
import { useMemo } from 'react';
import * as THREE from 'three';
import { normalizeModel } from '../../../utils/threeUtils';
import { buildDistrictLandmarkPlan } from '../lib/districtLandmarkPlan';
import type { ExpoQualityPreset } from '../state/expoRuntime';
import type { ExpoBoothPlacement, ExpoSectorMarker } from '../sceneWorld';

const PROGRAMMED_FILLER_ASSET_URLS = {
  construction_light: '/models/expo/props-candidates/construction-light.glb',
  light_curved_double: '/models/expo/props-candidates/light-curved-double.glb',
  lounge_chair: '/models/expo/props-candidates/loungeChair.glb',
  lounge_design_sofa: '/models/expo/props-candidates/loungeDesignSofa.glb',
  lounge_sofa: '/models/expo/props-candidates/loungeSofa.glb',
  sign_highway_detailed: '/models/expo/props-candidates/sign-highway-detailed.glb',
  sign_highway_wide: '/models/expo/props-candidates/sign-highway-wide.glb',
  speaker: '/models/expo/props-candidates/speaker.glb',
  table_coffee: '/models/expo/props-candidates/tableCoffee.glb',
  table_round: '/models/expo/props-candidates/tableRound.glb',
  television_modern: '/models/expo/props-candidates/televisionModern.glb',
} as const;

type ProgrammedFillerAssetKey = keyof typeof PROGRAMMED_FILLER_ASSET_URLS;

type ProgrammedZoneAssetPlacement = {
  asset: ProgrammedFillerAssetKey;
  quality: 'all' | 'quality-only';
  position: [number, number, number];
  rotationY?: number;
  scale?: number;
};

function cloneProgrammedAsset(source: THREE.Object3D, scale = 1) {
  const clone = source.clone(true);
  normalizeModel(clone, 4.8);
  clone.scale.multiplyScalar(scale);
  clone.traverse((child) => {
    if ((child as THREE.Mesh).isMesh) {
      const mesh = child as THREE.Mesh;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
    }
  });
  clone.updateMatrixWorld(true);
  return clone;
}

function buildZoneAssetPlacements(
  kind: ReturnType<typeof buildDistrictLandmarkPlan>['programmedZones'][number]['kind'],
  qualityPreset: ExpoQualityPreset
): ProgrammedZoneAssetPlacement[] {
  const placements: ProgrammedZoneAssetPlacement[] = (() => {
  switch (kind) {
    case 'arrival_plaza':
      return [
        { asset: 'sign_highway_wide', position: [0, 0.8, 1.2], quality: 'all', scale: 0.92 },
        { asset: 'light_curved_double', position: [-8.6, 0, -1.2], quality: 'all', rotationY: Math.PI * 0.5, scale: 1.1 },
        { asset: 'light_curved_double', position: [8.6, 0, -1.2], quality: 'all', rotationY: -Math.PI * 0.5, scale: 1.1 },
        { asset: 'construction_light', position: [-4.2, 0, 2.2], quality: 'quality-only', scale: 0.78 },
        { asset: 'construction_light', position: [4.2, 0, 2.2], quality: 'quality-only', scale: 0.78 },
      ];
    case 'networking_lounge_island':
      return [
        { asset: 'lounge_sofa', position: [-3.1, 0, -0.95], quality: 'all', rotationY: Math.PI * 0.5, scale: 0.92 },
        { asset: 'lounge_design_sofa', position: [3.1, 0, -0.95], quality: 'all', rotationY: -Math.PI * 0.5, scale: 0.92 },
        { asset: 'table_coffee', position: [0, 0, 0.35], quality: 'all', scale: 0.9 },
        { asset: 'lounge_chair', position: [0, 0, 2.2], quality: 'quality-only', rotationY: Math.PI, scale: 0.84 },
      ];
    case 'meeting_pod':
      return [
        { asset: 'lounge_chair', position: [-2.2, 0, -0.45], quality: 'all', rotationY: Math.PI * 0.18, scale: 0.92 },
        { asset: 'lounge_chair', position: [2.2, 0, -0.45], quality: 'all', rotationY: -Math.PI * 0.18, scale: 0.92 },
        { asset: 'table_round', position: [0, 0, -0.4], quality: 'all', scale: 0.95 },
        { asset: 'construction_light', position: [0, 0, 2.1], quality: 'quality-only', scale: 0.68 },
      ];
    case 'demo_court':
      return [
        { asset: 'television_modern', position: [0, 0, -1.45], quality: 'all', scale: 1.04 },
        { asset: 'speaker', position: [-3.4, 0, -1.3], quality: 'all', scale: 0.86 },
        { asset: 'speaker', position: [3.4, 0, -1.3], quality: 'all', scale: 0.86 },
        { asset: 'sign_highway_detailed', position: [0, 0, 2.35], quality: 'quality-only', scale: 0.74 },
      ];
    case 'info_pylon':
      return [
        { asset: 'sign_highway_detailed', position: [0, 0, 0], quality: 'all', scale: 0.82 },
        { asset: 'construction_light', position: [2.3, 0, -0.4], quality: 'quality-only', scale: 0.82 },
      ];
    case 'gallery_wall':
      return [
        { asset: 'sign_highway_wide', position: [0, 0.42, -0.9], quality: 'all', scale: 1 },
      ];
    case 'scenic_promenade':
      return [
        { asset: 'light_curved_double', position: [-6.8, 0, 0], quality: 'all', rotationY: Math.PI * 0.5, scale: 0.98 },
        { asset: 'light_curved_double', position: [6.8, 0, 0], quality: 'all', rotationY: -Math.PI * 0.5, scale: 0.98 },
        { asset: 'sign_highway_detailed', position: [0, 0, -1.6], quality: 'quality-only', scale: 0.72 },
      ];
    default:
      return [];
  }
  })();

  return qualityPreset === 'quality'
    ? placements
    : placements.filter((placement) => placement.quality === 'all');
}

function ProgrammedZoneAssetCluster({
  assetMap,
  qualityPreset,
  zone,
}: {
  assetMap: Record<ProgrammedFillerAssetKey, THREE.Object3D>;
  qualityPreset: ExpoQualityPreset;
  zone: ReturnType<typeof buildDistrictLandmarkPlan>['programmedZones'][number];
}) {
  const placements = useMemo(() => buildZoneAssetPlacements(zone.kind, qualityPreset), [qualityPreset, zone.kind]);
  const instances = useMemo(
    () => placements.map((placement, index) => ({
      id: `${zone.id}-asset-${placement.asset}-${index}`,
      object: cloneProgrammedAsset(assetMap[placement.asset], placement.scale),
      position: placement.position,
      rotationY: placement.rotationY ?? 0,
    })),
    [assetMap, placements, zone.id]
  );

  if (instances.length === 0) {
    return null;
  }

  return (
    <group position={[0, 0.02, 0]}>
      {instances.map((instance) => (
        <group key={instance.id} position={instance.position} rotation={[0, instance.rotationY, 0]}>
          <primitive object={instance.object} />
        </group>
      ))}
    </group>
  );
}

function ProgrammedZoneView({ zone }: { zone: ReturnType<typeof buildDistrictLandmarkPlan>['programmedZones'][number] }) {
  const [width, depth] = zone.footprint;
  const headerWidth = Math.max(6.8, width - 1.8);
  const glowOpacity = zone.kind === 'arrival_plaza' ? 0.2 : zone.kind === 'meeting_pod' ? 0.14 : zone.kind === 'scenic_promenade' ? 0.1 : 0.12;
  const baseHeight = zone.kind === 'arrival_plaza' ? 1.6 : zone.kind === 'info_pylon' ? 3.2 : zone.kind === 'gallery_wall' ? 2.2 : 2.5;

  return (
    <group position={zone.position} rotation={[0, zone.rotationY, 0]}>
      <mesh position={[0, 0.08, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[width + 2, depth + 1.6]} />
        <meshStandardMaterial color={zone.theme.groundPalette.plaza} transparent opacity={0.1} />
      </mesh>
      {zone.kind === 'scenic_promenade' ? (
        <>
          <mesh position={[0, 0.16, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
            <planeGeometry args={[width, depth]} />
            <meshStandardMaterial color={zone.theme.groundPalette.secondaryPath} metalness={0.06} roughness={0.84} />
          </mesh>
          <mesh position={[0, 0.18, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[Math.max(width * 0.22, 1.2), Math.max(width * 0.42, 2.2), 32]} />
            <meshBasicMaterial color={zone.accentColor} transparent opacity={0.12} />
          </mesh>
        </>
      ) : (
        <mesh position={[0, baseHeight * 0.5, 0]} castShadow>
          <boxGeometry args={[width, baseHeight, depth]} />
          <meshStandardMaterial color={zone.kind === 'arrival_plaza' ? zone.theme.groundPalette.baseField : "#111827"} metalness={0.12} roughness={0.84} />
        </mesh>
      )}
      {zone.kind !== 'scenic_promenade' && (
        <mesh position={[0, baseHeight + 0.55, depth * 0.5 + 0.2]} castShadow>
          <boxGeometry args={[headerWidth, 0.7, 0.45]} />
          <meshStandardMaterial color={zone.accentColor} emissive={zone.accentColor} emissiveIntensity={0.18} />
        </mesh>
      )}
      <mesh position={[0, 0.25, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[Math.max(width * 0.32, 1.4), Math.max(width * 0.52, 2.6), 32]} />
        <meshBasicMaterial color={zone.accentColor} transparent opacity={glowOpacity} />
      </mesh>
      <Text position={[0, zone.kind === 'scenic_promenade' ? 0.42 : Math.max(1.2, baseHeight + 0.12), zone.kind === 'scenic_promenade' ? 0 : depth * 0.5 + 0.46]} fontSize={0.48} color="#f8fafc" anchorX="center" anchorY="middle" maxWidth={headerWidth - 0.4}>
        {zone.label.toUpperCase()}
      </Text>
      <Text position={[0, zone.kind === 'scenic_promenade' ? 0.18 : 1.02, zone.kind === 'scenic_promenade' ? -1.1 : 0]} fontSize={0.34} color="#cbd5e1" anchorX="center" anchorY="middle" maxWidth={width - 1.6}>
        {zone.subLabel.toUpperCase()}
      </Text>
      {zone.kind === 'meeting_pod' && (
        <>
          <mesh position={[-width * 0.28, 1.04, -0.6]} castShadow>
            <boxGeometry args={[1.4, 0.3, 1.4]} />
            <meshStandardMaterial color={zone.theme.groundPalette.secondaryPath} />
          </mesh>
          <mesh position={[width * 0.28, 1.04, -0.6]} castShadow>
            <boxGeometry args={[1.4, 0.3, 1.4]} />
            <meshStandardMaterial color={zone.theme.groundPalette.secondaryPath} />
          </mesh>
        </>
      )}
      {zone.kind === 'demo_court' && (
        <mesh position={[0, 1.08, -0.9]} castShadow>
          <boxGeometry args={[width - 2.8, 1.5, 0.24]} />
          <meshStandardMaterial color="#020617" emissive={zone.accentColor} emissiveIntensity={0.08} />
        </mesh>
      )}
      {zone.kind === 'networking_lounge_island' && (
        <>
          <mesh position={[-width * 0.26, 0.98, -0.4]} castShadow>
            <cylinderGeometry args={[0.8, 0.8, 0.28, 18]} />
            <meshStandardMaterial color={zone.theme.groundPalette.secondaryPath} />
          </mesh>
          <mesh position={[width * 0.26, 0.98, -0.4]} castShadow>
            <cylinderGeometry args={[0.8, 0.8, 0.28, 18]} />
            <meshStandardMaterial color={zone.theme.groundPalette.secondaryPath} />
          </mesh>
        </>
      )}
      {zone.kind === 'info_pylon' && (
        <>
          <mesh position={[-width * 0.24, 1.6, 0]} castShadow>
            <boxGeometry args={[0.75, 3.2, 0.55]} />
            <meshStandardMaterial color={zone.accentColor} emissive={zone.accentColor} emissiveIntensity={0.14} />
          </mesh>
          <mesh position={[width * 0.24, 1.6, 0]} castShadow>
            <boxGeometry args={[0.75, 3.2, 0.55]} />
            <meshStandardMaterial color={zone.accentColor} emissive={zone.accentColor} emissiveIntensity={0.14} />
          </mesh>
        </>
      )}
      {zone.kind === 'gallery_wall' && (
        <group position={[0, 1.2, -0.5]}>
          {[-0.3, 0, 0.3].map((offset) => (
            <mesh key={offset} position={[offset * width, 0, 0]} castShadow>
              <boxGeometry args={[2.4, 1.6, 0.16]} />
              <meshStandardMaterial color="#020617" emissive={zone.accentColor} emissiveIntensity={0.05} />
            </mesh>
          ))}
        </group>
      )}
      {zone.kind === 'arrival_plaza' && (
        <group position={[0, 0.9, 0]}>
          {[-0.32, 0.32].map((offset) => (
            <mesh key={offset} position={[offset * width, 0, -1.4]} castShadow>
              <boxGeometry args={[2.4, 0.28, 2.4]} />
              <meshStandardMaterial color={zone.theme.groundPalette.secondaryPath} />
            </mesh>
          ))}
        </group>
      )}
    </group>
  );
}

export function ProgrammedFillerLayer({
  boothPlacements,
  qualityPreset,
  sectorMarkers,
}: {
  boothPlacements: ExpoBoothPlacement[];
  qualityPreset: ExpoQualityPreset;
  sectorMarkers: ExpoSectorMarker[];
}) {
  const { scene: constructionLightSource } = useGLTF(PROGRAMMED_FILLER_ASSET_URLS.construction_light);
  const { scene: lightCurvedDoubleSource } = useGLTF(PROGRAMMED_FILLER_ASSET_URLS.light_curved_double);
  const { scene: loungeChairSource } = useGLTF(PROGRAMMED_FILLER_ASSET_URLS.lounge_chair);
  const { scene: loungeDesignSofaSource } = useGLTF(PROGRAMMED_FILLER_ASSET_URLS.lounge_design_sofa);
  const { scene: loungeSofaSource } = useGLTF(PROGRAMMED_FILLER_ASSET_URLS.lounge_sofa);
  const { scene: signHighwayDetailedSource } = useGLTF(PROGRAMMED_FILLER_ASSET_URLS.sign_highway_detailed);
  const { scene: signHighwayWideSource } = useGLTF(PROGRAMMED_FILLER_ASSET_URLS.sign_highway_wide);
  const { scene: speakerSource } = useGLTF(PROGRAMMED_FILLER_ASSET_URLS.speaker);
  const { scene: tableCoffeeSource } = useGLTF(PROGRAMMED_FILLER_ASSET_URLS.table_coffee);
  const { scene: tableRoundSource } = useGLTF(PROGRAMMED_FILLER_ASSET_URLS.table_round);
  const { scene: televisionModernSource } = useGLTF(PROGRAMMED_FILLER_ASSET_URLS.television_modern);
  const plan = useMemo(() => buildDistrictLandmarkPlan(boothPlacements, sectorMarkers), [boothPlacements, sectorMarkers]);
  const assetMap = useMemo(() => ({
    construction_light: constructionLightSource,
    light_curved_double: lightCurvedDoubleSource,
    lounge_chair: loungeChairSource,
    lounge_design_sofa: loungeDesignSofaSource,
    lounge_sofa: loungeSofaSource,
    sign_highway_detailed: signHighwayDetailedSource,
    sign_highway_wide: signHighwayWideSource,
    speaker: speakerSource,
    table_coffee: tableCoffeeSource,
    table_round: tableRoundSource,
    television_modern: televisionModernSource,
  }), [
    constructionLightSource,
    lightCurvedDoubleSource,
    loungeChairSource,
    loungeDesignSofaSource,
    loungeSofaSource,
    signHighwayDetailedSource,
    signHighwayWideSource,
    speakerSource,
    tableCoffeeSource,
    tableRoundSource,
    televisionModernSource,
  ]);

  return (
    <group name="programmed-filler-layer">
      {plan.programmedZones.map((zone) => (
        <group key={zone.id}>
          <ProgrammedZoneView zone={zone} />
          <ProgrammedZoneAssetCluster assetMap={assetMap} qualityPreset={qualityPreset} zone={zone} />
        </group>
      ))}
    </group>
  );
}
