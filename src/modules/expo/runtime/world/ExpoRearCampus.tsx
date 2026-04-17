import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import type { ExpoBoothPlacement } from '../../layout-engine';
import type { ExpoWorldVisualProfile } from '../../world-contract';
import {
  buildRearCampusMetrics,
  buildVisibleRearCampusForecourts,
  buildVisibleRearCampusLandmarkTowers,
  buildVisibleRearCampusSidePavilions,
} from './ExpoRearCampusLayout';
import { ExpoRearCampusStructures } from './ExpoRearCampusStructures';
import {
  ColliderMaterial,
  ExpoRuntimeSurfaceMaterial,
  usePlayerColliderRegistration,
} from './WorldSceneSupport';

export function ExpoRearCampus({
  boothPlacements,
  visualProfile,
}: {
  boothPlacements: ExpoBoothPlacement[];
  visualProfile: ExpoWorldVisualProfile;
}) {
  const campusColliderRef = useRef<THREE.Group>(null);
  const { campusCenterZ, stadiumBackWallZ } = useMemo(
    () => buildRearCampusMetrics(boothPlacements),
    [boothPlacements]
  );
  const accent = visualProfile.global.hudAccent;
  usePlayerColliderRegistration(campusColliderRef, 'rear-campus-collider');
  const enableHeavyShadows = false;
  const stadiumForecourts = useMemo(() => buildVisibleRearCampusForecourts(campusCenterZ), [campusCenterZ]);
  const stadiumSidePavilions = useMemo(() => buildVisibleRearCampusSidePavilions(campusCenterZ), [campusCenterZ]);
  const stadiumLandmarkTowers = useMemo(() => buildVisibleRearCampusLandmarkTowers(campusCenterZ), [campusCenterZ]);
  const stadiumScreenFeeds = useMemo(
    () => [...boothPlacements]
      .filter((placement) => {
        const tier = String(placement.company?.sponsorTier || placement.sponsorTier || '').toLowerCase();
        return placement.boothType === 'hero' || tier === 'hero' || tier === 'platinum' || tier === 'elite' || tier === 'gold' || tier === 'premium';
      })
      .sort((left, right) => Number(right.priority || 0) - Number(left.priority || 0))
      .slice(0, 3)
      .map((placement, index) => ({
        accentColor: placement.color,
        id: `${placement.id}-stadium-feed-${index}`,
        imageUrl: placement.company?.posterUrl || placement.company?.heroAssetUrl || placement.company?.logo_url || null,
      })),
    [boothPlacements]
  );
  const filteredStadiumForecourts = stadiumForecourts;
  const filteredStadiumSidePavilions = stadiumSidePavilions;
  const filteredStadiumLandmarkTowers = stadiumLandmarkTowers;
  const campusPerimeterHalfWidth = 3060;
  const campusPerimeterFrontZ = campusCenterZ + 2140;
  const campusPerimeterRearZ = campusCenterZ - 2140;
  const campusPerimeterCenterZ = (campusPerimeterFrontZ + campusPerimeterRearZ) * 0.5;
  const campusPerimeterDepth = campusPerimeterFrontZ - campusPerimeterRearZ;
  const hasVisibleForecourts = filteredStadiumForecourts.length > 0;

  useEffect(() => {
    const stadiumEntries = [
      ...filteredStadiumForecourts.map((plane) => ({ id: plane.id, layer: 'stadium-plane', position: plane.position })),
      ...filteredStadiumSidePavilions.map((pavilion) => ({ id: pavilion.id, layer: 'stadium-pavilion', position: pavilion.position })),
      ...filteredStadiumLandmarkTowers.map((tower) => ({ id: tower.id, layer: 'stadium-tower', position: tower.position })),
      { id: 'rear-campus-arc-bastion-right', layer: 'stadium-structure', position: [1180, 0, campusCenterZ + 864] as [number, number, number] },
      { id: 'rear-campus-center-event-island', layer: 'stadium-structure', position: [0, 0, campusCenterZ - 1296] as [number, number, number] },
      { id: 'rear-campus-bowl-center-deck', layer: 'stadium-structure', position: [0, 212, campusCenterZ - 972] as [number, number, number] },
      { id: 'rear-campus-stage-monolith-canopy', layer: 'stadium-structure', position: [47, 0, -3018] as [number, number, number] },
      { id: 'rear-campus-mega-civic-hall', layer: 'stadium-structure', position: [-2490, 0, -3670] as [number, number, number] },
      { id: 'rear-campus-void-courtyard-monument', layer: 'stadium-structure', position: [-1971, 0, -2894] as [number, number, number] },
      { id: 'rear-campus-linked-mini-skyline', layer: 'stadium-structure', position: [-2537, 0, -4977] as [number, number, number] },
      { id: 'rear-campus-titan-frame-gate', layer: 'stadium-structure', position: [-682, 0, 396] as [number, number, number] },
      { id: 'rear-campus-linear-civic-terrace', layer: 'stadium-structure', position: [-1684, 0, -1430] as [number, number, number] },
      { id: 'rear-campus-bridge-linked-campus', layer: 'stadium-structure', position: [-1343, 0, -3449] as [number, number, number] },
      { id: 'rear-campus-petal-tower', layer: 'stadium-structure', position: [2340, 0, -4577] as [number, number, number] },
      { id: 'rear-campus-helix-spire', layer: 'stadium-structure', position: [2439, 0, -1432] as [number, number, number] },
      { id: 'rear-campus-grand-prism-citadel', layer: 'stadium-structure', position: [-1033, 0, -1902] as [number, number, number] },
      { id: 'rear-campus-split-wall-gate', layer: 'stadium-structure', position: [-836, 0, -1427] as [number, number, number] },
      { id: 'rear-campus-terrace-signal-court', layer: 'stadium-structure', position: [-864, 0, -936] as [number, number, number] },
      { id: 'rear-campus-needle-crown-skyscraper', layer: 'stadium-structure', position: [892, 0, -611] as [number, number, number] },
      { id: 'rear-campus-sky-slab-tower', layer: 'stadium-structure', position: [1087, 0, -1329] as [number, number, number] },
      { id: 'rear-campus-twin-void-monolith', layer: 'stadium-structure', position: [1340, 0, -3242] as [number, number, number] },
      { id: 'stadium-bowl', layer: 'stadium-structure', position: [0, 0, campusCenterZ - 1520] as [number, number, number] },
      { id: 'stadium-axis-center-1180', layer: 'stadium-structure', position: [0, 0, 1180] as [number, number, number] },
      { id: 'stadium-axis-center-1608', layer: 'stadium-structure', position: [0, 0, 1608] as [number, number, number] },
    ];

    window.__WARPALA_EXPO_INSPECT_SOURCES__ = {
      ...(window.__WARPALA_EXPO_INSPECT_SOURCES__ ?? {}),
      stadium: stadiumEntries,
    };

    return () => {
      if (window.__WARPALA_EXPO_INSPECT_SOURCES__) {
        window.__WARPALA_EXPO_INSPECT_SOURCES__.stadium = [];
      }
    };
  }, [campusCenterZ, filteredStadiumForecourts, filteredStadiumLandmarkTowers, filteredStadiumSidePavilions]);

  return (
    <group name="expo-rear-campus">
      <group name="rear-campus-ground-shell">
        <mesh position={[-80, 0.02, campusCenterZ - 420]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[7200, 4400]} />
          <ExpoRuntimeSurfaceMaterial fallbackColor="#6f7c85" repeat={[9.4, 5.8]} surface="concrete" />
        </mesh>
        {hasVisibleForecourts && filteredStadiumForecourts.map((plane) => (
          <mesh key={plane.id} position={plane.position} rotation={[-Math.PI / 2, 0, 0]} receiveShadow renderOrder={12}>
            <planeGeometry args={plane.size} />
            <meshStandardMaterial
              color={plane.color}
              roughness={0.72}
              metalness={0.04}
              polygonOffset
              polygonOffsetFactor={-2}
              polygonOffsetUnits={-2}
            />
          </mesh>
        ))}
        <group name="rear-campus-stadium-bowl-ground" position={[0, 0, campusCenterZ]}>
          <mesh position={[0, 6.08, -40]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
            <circleGeometry args={[3080, 112]} />
            <ExpoRuntimeSurfaceMaterial fallbackColor="#6f7c85" repeat={[6.4, 6.4]} surface="concrete" />
          </mesh>
          <mesh position={[0, 6.3, -40]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
            <circleGeometry args={[2120, 88]} />
            <ExpoRuntimeSurfaceMaterial fallbackColor="#6f7c85" repeat={[4.6, 4.6]} surface="concrete" />
          </mesh>
          <mesh position={[0, 6.54, -40]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
            <ringGeometry args={[2120, 2540, 96]} />
            <ExpoRuntimeSurfaceMaterial fallbackColor="#6f7c85" repeat={[5.2, 5.2]} surface="paver" />
          </mesh>
          <mesh position={[0, 6.82, -40]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
            <ringGeometry args={[1860, 2000, 96]} />
            <ExpoRuntimeSurfaceMaterial fallbackColor="#6f7c85" repeat={[4.2, 4.2]} surface="paver" />
          </mesh>
          <mesh position={[0, 26, -40]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
            <ringGeometry args={[2440, 2720, 96]} />
            <meshStandardMaterial color="#6f7c85" roughness={0.97} metalness={0.01} />
          </mesh>
        </group>
      </group>
      <group name="rear-campus-perimeter-shell">
        <mesh position={[0, 16, campusPerimeterRearZ]} receiveShadow>
          <boxGeometry args={[campusPerimeterHalfWidth * 2, 32, 20]} />
          <meshStandardMaterial color="#81909a" emissive={accent} emissiveIntensity={0.022} roughness={0.78} metalness={0.05} />
        </mesh>
        <mesh position={[-campusPerimeterHalfWidth, 15, campusPerimeterCenterZ]} receiveShadow>
          <boxGeometry args={[18, 30, campusPerimeterDepth]} />
          <meshStandardMaterial color="#798893" emissive={accent} emissiveIntensity={0.018} roughness={0.8} metalness={0.05} />
        </mesh>
        <mesh position={[campusPerimeterHalfWidth, 15, campusPerimeterCenterZ]} receiveShadow>
          <boxGeometry args={[18, 30, campusPerimeterDepth]} />
          <meshStandardMaterial color="#798893" emissive={accent} emissiveIntensity={0.018} roughness={0.8} metalness={0.05} />
        </mesh>
        <mesh name="stadium-structure:rear-campus-front-left-connector" position={[-2390, 16, campusPerimeterFrontZ]} receiveShadow>
          <boxGeometry args={[1340, 32, 18]} />
          <meshStandardMaterial color="#798893" emissive={accent} emissiveIntensity={0.018} roughness={0.8} metalness={0.05} />
        </mesh>
        <mesh name="stadium-structure:rear-campus-front-left-connector-cap" position={[-2390, 33, campusPerimeterFrontZ]} receiveShadow>
          <boxGeometry args={[1220, 2, 4]} />
          <meshStandardMaterial color="#98a4ad" emissive={accent} emissiveIntensity={0.03} roughness={0.66} metalness={0.06} />
        </mesh>
        <mesh name="stadium-structure:rear-campus-front-right-connector" position={[2390, 16, campusPerimeterFrontZ]} receiveShadow>
          <boxGeometry args={[1340, 32, 18]} />
          <meshStandardMaterial color="#798893" emissive={accent} emissiveIntensity={0.018} roughness={0.8} metalness={0.05} />
        </mesh>
        <mesh name="stadium-structure:rear-campus-front-right-connector-cap" position={[2390, 33, campusPerimeterFrontZ]} receiveShadow>
          <boxGeometry args={[1220, 2, 4]} />
          <meshStandardMaterial color="#98a4ad" emissive={accent} emissiveIntensity={0.03} roughness={0.66} metalness={0.06} />
        </mesh>
      </group>

      <ExpoRearCampusStructures
        accent={accent}
        campusCenterZ={campusCenterZ}
        enableHeavyShadows={enableHeavyShadows}
        screenFeeds={stadiumScreenFeeds}
        sidePavilions={filteredStadiumSidePavilions}
        towers={filteredStadiumLandmarkTowers}
      />
      <group name="stadium-structure:rear-campus-stage-monolith-canopy" position={[47, 0, -3018]}>
        <mesh position={[0, 10, 0]} receiveShadow>
          <boxGeometry args={[564, 16, 176]} />
          <meshStandardMaterial color="#84919a" roughness={0.74} metalness={0.04} emissive={accent} emissiveIntensity={0.025} />
        </mesh>
        <mesh position={[0, 28, 0]} receiveShadow>
          <boxGeometry args={[316, 12, 84]} />
          <meshStandardMaterial color="#98a4ad" roughness={0.62} metalness={0.06} emissive={accent} emissiveIntensity={0.05} />
        </mesh>
        <mesh position={[-164, 116, 0]} castShadow={enableHeavyShadows} receiveShadow>
          <boxGeometry args={[52, 232, 36]} />
          <meshStandardMaterial color="#84919a" roughness={0.7} metalness={0.05} emissive={accent} emissiveIntensity={0.04} />
        </mesh>
        <mesh position={[164, 116, 0]} castShadow={enableHeavyShadows} receiveShadow>
          <boxGeometry args={[52, 232, 36]} />
          <meshStandardMaterial color="#84919a" roughness={0.7} metalness={0.05} emissive={accent} emissiveIntensity={0.04} />
        </mesh>
        <mesh position={[0, 212, 0]} castShadow={enableHeavyShadows} receiveShadow>
          <boxGeometry args={[428, 18, 52]} />
          <meshStandardMaterial color="#98a4ad" roughness={0.56} metalness={0.06} emissive={accent} emissiveIntensity={0.07} />
        </mesh>
        <mesh position={[0, 126, 0]} castShadow={enableHeavyShadows} receiveShadow>
          <boxGeometry args={[86, 164, 58]} />
          <meshStandardMaterial color="#91a6b4" roughness={0.66} metalness={0.05} emissive={accent} emissiveIntensity={0.08} />
        </mesh>
        <mesh position={[0, 244, 0]} castShadow={enableHeavyShadows} receiveShadow>
          <boxGeometry args={[126, 14, 28]} />
          <meshStandardMaterial color="#98a4ad" roughness={0.58} metalness={0.06} emissive={accent} emissiveIntensity={0.08} />
        </mesh>
        <mesh position={[-108, 34, 0]} castShadow={enableHeavyShadows} receiveShadow>
          <boxGeometry args={[48, 18, 48]} />
          <meshStandardMaterial color="#98a4ad" roughness={0.62} metalness={0.04} emissive={accent} emissiveIntensity={0.04} />
        </mesh>
        <mesh position={[108, 34, 0]} castShadow={enableHeavyShadows} receiveShadow>
          <boxGeometry args={[48, 18, 48]} />
          <meshStandardMaterial color="#98a4ad" roughness={0.62} metalness={0.04} emissive={accent} emissiveIntensity={0.04} />
        </mesh>
      </group>
      <group name="stadium-structure:rear-campus-mega-civic-hall" position={[-2490, 0, -3670]}>
        <mesh position={[0, 18, 0]} receiveShadow>
          <boxGeometry args={[724, 28, 324]} />
          <meshStandardMaterial color="#84919a" roughness={0.74} metalness={0.04} emissive={accent} emissiveIntensity={0.025} />
        </mesh>
        <mesh position={[0, 136, 0]} castShadow={enableHeavyShadows} receiveShadow>
          <boxGeometry args={[428, 236, 196]} />
          <meshStandardMaterial color="#98a4ad" roughness={0.62} metalness={0.06} emissive={accent} emissiveIntensity={0.05} />
        </mesh>
        <mesh position={[-214, 94, 0]} castShadow={enableHeavyShadows} receiveShadow>
          <boxGeometry args={[152, 152, 142]} />
          <meshStandardMaterial color="#84919a" roughness={0.68} metalness={0.05} emissive={accent} emissiveIntensity={0.04} />
        </mesh>
        <mesh position={[214, 94, 0]} castShadow={enableHeavyShadows} receiveShadow>
          <boxGeometry args={[152, 152, 142]} />
          <meshStandardMaterial color="#84919a" roughness={0.68} metalness={0.05} emissive={accent} emissiveIntensity={0.04} />
        </mesh>
        <mesh position={[0, 264, 0]} castShadow={enableHeavyShadows} receiveShadow>
          <boxGeometry args={[488, 18, 216]} />
          <meshStandardMaterial color="#98a4ad" roughness={0.54} metalness={0.08} emissive={accent} emissiveIntensity={0.08} />
        </mesh>
        <mesh position={[0, 312, -12]} castShadow={enableHeavyShadows} receiveShadow>
          <boxGeometry args={[292, 56, 118]} />
          <meshStandardMaterial color="#90a5b3" roughness={0.66} metalness={0.05} emissive={accent} emissiveIntensity={0.07} />
        </mesh>
        <mesh position={[0, 346, -88]} castShadow={enableHeavyShadows} receiveShadow>
          <boxGeometry args={[196, 12, 18]} />
          <meshStandardMaterial color="#9aa7b0" roughness={0.5} metalness={0.08} emissive={accent} emissiveIntensity={0.1} />
        </mesh>
      </group>
      <group name="stadium-structure:rear-campus-void-courtyard-monument" position={[-1971, 0, -2894]}>
        <mesh position={[0, 16, 0]} receiveShadow>
          <boxGeometry args={[612, 22, 348]} />
          <meshStandardMaterial color="#84919a" roughness={0.74} metalness={0.04} emissive={accent} emissiveIntensity={0.025} />
        </mesh>
        <mesh position={[-188, 188, 0]} castShadow={enableHeavyShadows} receiveShadow>
          <boxGeometry args={[144, 376, 132]} />
          <meshStandardMaterial color="#98a4ad" roughness={0.6} metalness={0.06} emissive={accent} emissiveIntensity={0.06} />
        </mesh>
        <mesh position={[188, 188, 0]} castShadow={enableHeavyShadows} receiveShadow>
          <boxGeometry args={[144, 376, 132]} />
          <meshStandardMaterial color="#84919a" roughness={0.66} metalness={0.05} emissive={accent} emissiveIntensity={0.05} />
        </mesh>
        <mesh position={[0, 188, -108]} castShadow={enableHeavyShadows} receiveShadow>
          <boxGeometry args={[236, 376, 116]} />
          <meshStandardMaterial color="#84919a" roughness={0.64} metalness={0.05} emissive={accent} emissiveIntensity={0.05} />
        </mesh>
        <mesh position={[0, 188, 108]} castShadow={enableHeavyShadows} receiveShadow>
          <boxGeometry args={[236, 376, 116]} />
          <meshStandardMaterial color="#84919a" roughness={0.64} metalness={0.05} emissive={accent} emissiveIntensity={0.05} />
        </mesh>
        <mesh position={[0, 386, 0]} castShadow={enableHeavyShadows} receiveShadow>
          <boxGeometry args={[236, 20, 236]} />
          <meshStandardMaterial color="#98a4ad" roughness={0.52} metalness={0.08} emissive={accent} emissiveIntensity={0.09} />
        </mesh>
        <mesh position={[0, 92, 0]} castShadow={enableHeavyShadows} receiveShadow>
          <boxGeometry args={[118, 18, 118]} />
          <meshStandardMaterial color="#8fa5b2" roughness={0.66} metalness={0.05} emissive={accent} emissiveIntensity={0.08} />
        </mesh>
      </group>
      <group name="stadium-structure:rear-campus-linked-mini-skyline" position={[-2537, 0, -4977]}>
        <mesh position={[0, 12, 0]} receiveShadow>
          <boxGeometry args={[744, 18, 312]} />
          <meshStandardMaterial color="#84919a" roughness={0.74} metalness={0.04} emissive={accent} emissiveIntensity={0.024} />
        </mesh>
        <mesh position={[-286, 102, -38]} castShadow={enableHeavyShadows} receiveShadow>
          <boxGeometry args={[88, 204, 92]} />
          <meshStandardMaterial color="#84919a" roughness={0.68} metalness={0.05} emissive={accent} emissiveIntensity={0.04} />
        </mesh>
        <mesh position={[-134, 156, 42]} castShadow={enableHeavyShadows} receiveShadow>
          <boxGeometry args={[102, 312, 96]} />
          <meshStandardMaterial color="#98a4ad" roughness={0.62} metalness={0.06} emissive={accent} emissiveIntensity={0.05} />
        </mesh>
        <mesh position={[28, 222, -8]} castShadow={enableHeavyShadows} receiveShadow>
          <boxGeometry args={[112, 444, 102]} />
          <meshStandardMaterial color="#84919a" roughness={0.64} metalness={0.05} emissive={accent} emissiveIntensity={0.05} />
        </mesh>
        <mesh position={[188, 176, 36]} castShadow={enableHeavyShadows} receiveShadow>
          <boxGeometry args={[94, 352, 94]} />
          <meshStandardMaterial color="#98a4ad" roughness={0.6} metalness={0.06} emissive={accent} emissiveIntensity={0.05} />
        </mesh>
        <mesh position={[336, 124, -22]} castShadow={enableHeavyShadows} receiveShadow>
          <boxGeometry args={[82, 248, 88]} />
          <meshStandardMaterial color="#c4d2dc" roughness={0.66} metalness={0.05} emissive={accent} emissiveIntensity={0.04} />
        </mesh>
        <mesh position={[-206, 214, 2]} castShadow={enableHeavyShadows} receiveShadow>
          <boxGeometry args={[138, 16, 34]} />
          <meshStandardMaterial color="#98a4ad" roughness={0.54} metalness={0.08} emissive={accent} emissiveIntensity={0.08} />
        </mesh>
        <mesh position={[106, 286, 10]} castShadow={enableHeavyShadows} receiveShadow>
          <boxGeometry args={[168, 16, 36]} />
          <meshStandardMaterial color="#98a4ad" roughness={0.54} metalness={0.08} emissive={accent} emissiveIntensity={0.08} />
        </mesh>
        <mesh position={[260, 186, 6]} castShadow={enableHeavyShadows} receiveShadow>
          <boxGeometry args={[120, 14, 32]} />
          <meshStandardMaterial color="#98a4ad" roughness={0.56} metalness={0.06} emissive={accent} emissiveIntensity={0.07} />
        </mesh>
        <mesh position={[-56, 54, 0]} castShadow={enableHeavyShadows} receiveShadow>
          <boxGeometry args={[96, 18, 72]} />
          <meshStandardMaterial color="#98a4ad" roughness={0.66} metalness={0.05} emissive={accent} emissiveIntensity={0.08} />
        </mesh>
        <mesh position={[154, 54, -12]} castShadow={enableHeavyShadows} receiveShadow>
          <boxGeometry args={[82, 16, 58]} />
          <meshStandardMaterial color="#98a4ad" roughness={0.66} metalness={0.05} emissive={accent} emissiveIntensity={0.08} />
        </mesh>
      </group>
      <group name="stadium-structure:rear-campus-titan-frame-gate" position={[-682, 0, 396]}>
        <mesh position={[0, 16, 0]} receiveShadow>
          <boxGeometry args={[412, 20, 146]} />
          <meshStandardMaterial color="#84919a" roughness={0.74} metalness={0.04} emissive={accent} emissiveIntensity={0.024} />
        </mesh>
        <mesh position={[-188, 204, 0]} castShadow={enableHeavyShadows} receiveShadow>
          <boxGeometry args={[56, 408, 52]} />
          <meshStandardMaterial color="#84919a" roughness={0.68} metalness={0.05} emissive={accent} emissiveIntensity={0.04} />
        </mesh>
        <mesh position={[188, 204, 0]} castShadow={enableHeavyShadows} receiveShadow>
          <boxGeometry args={[56, 408, 52]} />
          <meshStandardMaterial color="#84919a" roughness={0.68} metalness={0.05} emissive={accent} emissiveIntensity={0.04} />
        </mesh>
        <mesh position={[0, 404, 0]} castShadow={enableHeavyShadows} receiveShadow>
          <boxGeometry args={[468, 20, 58]} />
          <meshStandardMaterial color="#98a4ad" roughness={0.54} metalness={0.08} emissive={accent} emissiveIntensity={0.08} />
        </mesh>
        <mesh position={[0, 142, 0]} castShadow={enableHeavyShadows} receiveShadow>
          <boxGeometry args={[96, 124, 34]} />
          <meshStandardMaterial color="#92a6b4" roughness={0.66} metalness={0.05} emissive={accent} emissiveIntensity={0.07} />
        </mesh>
      </group>
      <group name="stadium-structure:rear-campus-linear-civic-terrace" position={[-1684, 0, -1430]}>
        <mesh position={[0, 10, 0]} receiveShadow>
          <boxGeometry args={[868, 16, 188]} />
          <meshStandardMaterial color="#84919a" roughness={0.74} metalness={0.04} emissive={accent} emissiveIntensity={0.024} />
        </mesh>
        <mesh position={[0, 24, 0]} receiveShadow>
          <boxGeometry args={[656, 12, 124]} />
          <meshStandardMaterial color="#98a4ad" roughness={0.64} metalness={0.05} emissive={accent} emissiveIntensity={0.04} />
        </mesh>
        <mesh position={[0, 42, 0]} receiveShadow>
          <boxGeometry args={[428, 10, 86]} />
          <meshStandardMaterial color="#98a4ad" roughness={0.56} metalness={0.06} emissive={accent} emissiveIntensity={0.06} />
        </mesh>
        <mesh position={[-318, 22, 0]} castShadow={enableHeavyShadows} receiveShadow>
          <boxGeometry args={[64, 32, 64]} />
          <meshStandardMaterial color="#98a4ad" roughness={0.6} metalness={0.04} emissive={accent} emissiveIntensity={0.04} />
        </mesh>
        <mesh position={[318, 22, 0]} castShadow={enableHeavyShadows} receiveShadow>
          <boxGeometry args={[64, 32, 64]} />
          <meshStandardMaterial color="#98a4ad" roughness={0.6} metalness={0.04} emissive={accent} emissiveIntensity={0.04} />
        </mesh>
        <mesh position={[0, 86, 0]} castShadow={enableHeavyShadows} receiveShadow>
          <boxGeometry args={[34, 132, 34]} />
          <meshStandardMaterial color="#8ea4b2" roughness={0.66} metalness={0.05} emissive={accent} emissiveIntensity={0.08} />
        </mesh>
      </group>
      <group name="stadium-structure:rear-campus-bridge-linked-campus" position={[-1343, 0, -3449]}>
        <mesh position={[-214, 116, -24]} castShadow={enableHeavyShadows} receiveShadow>
          <boxGeometry args={[176, 228, 132]} />
          <meshStandardMaterial color="#84919a" roughness={0.68} metalness={0.05} emissive={accent} emissiveIntensity={0.04} />
        </mesh>
        <mesh position={[0, 176, 0]} castShadow={enableHeavyShadows} receiveShadow>
          <boxGeometry args={[224, 348, 154]} />
          <meshStandardMaterial color="#98a4ad" roughness={0.62} metalness={0.06} emissive={accent} emissiveIntensity={0.05} />
        </mesh>
        <mesh position={[236, 134, 28]} castShadow={enableHeavyShadows} receiveShadow>
          <boxGeometry args={[188, 264, 136]} />
          <meshStandardMaterial color="#84919a" roughness={0.64} metalness={0.05} emissive={accent} emissiveIntensity={0.05} />
        </mesh>
        <mesh position={[-108, 228, -8]} castShadow={enableHeavyShadows} receiveShadow>
          <boxGeometry args={[192, 18, 54]} />
          <meshStandardMaterial color="#98a4ad" roughness={0.54} metalness={0.08} emissive={accent} emissiveIntensity={0.08} />
        </mesh>
        <mesh position={[118, 264, 8]} castShadow={enableHeavyShadows} receiveShadow>
          <boxGeometry args={[208, 18, 54]} />
          <meshStandardMaterial color="#98a4ad" roughness={0.54} metalness={0.08} emissive={accent} emissiveIntensity={0.08} />
        </mesh>
        <mesh position={[0, 72, 0]} castShadow={enableHeavyShadows} receiveShadow>
          <boxGeometry args={[128, 18, 42]} />
          <meshStandardMaterial color="#98a4ad" roughness={0.66} metalness={0.05} emissive={accent} emissiveIntensity={0.08} />
        </mesh>
      </group>
      <group name="stadium-structure:rear-campus-petal-tower" position={[2340, 0, -4577]}>
        <mesh position={[0, 12, 0]} receiveShadow>
          <cylinderGeometry args={[98, 118, 20, 32]} />
          <meshStandardMaterial color="#84919a" roughness={0.74} metalness={0.04} emissive={accent} emissiveIntensity={0.024} />
        </mesh>
        <mesh position={[0, 262, 0]} castShadow={enableHeavyShadows} receiveShadow>
          <cylinderGeometry args={[34, 46, 524, 28]} />
          <meshStandardMaterial color="#98a4ad" roughness={0.6} metalness={0.06} emissive={accent} emissiveIntensity={0.06} />
        </mesh>
        <mesh position={[0, 198, 56]} rotation={[0.18, 0, 0]} castShadow={enableHeavyShadows} receiveShadow>
          <cylinderGeometry args={[18, 34, 336, 20]} />
          <meshStandardMaterial color="#c9d6e0" roughness={0.64} metalness={0.05} emissive={accent} emissiveIntensity={0.05} />
        </mesh>
        <mesh position={[48, 214, -20]} rotation={[0.08, 0, -0.72]} castShadow={enableHeavyShadows} receiveShadow>
          <cylinderGeometry args={[16, 30, 372, 20]} />
          <meshStandardMaterial color="#84919a" roughness={0.64} metalness={0.05} emissive={accent} emissiveIntensity={0.05} />
        </mesh>
        <mesh position={[-46, 208, -26]} rotation={[0.08, 0, 0.72]} castShadow={enableHeavyShadows} receiveShadow>
          <cylinderGeometry args={[16, 30, 356, 20]} />
          <meshStandardMaterial color="#84919a" roughness={0.64} metalness={0.05} emissive={accent} emissiveIntensity={0.05} />
        </mesh>
        <mesh position={[0, 472, 0]} castShadow={enableHeavyShadows} receiveShadow>
          <cylinderGeometry args={[14, 22, 96, 20]} />
          <meshStandardMaterial color="#98a4ad" roughness={0.5} metalness={0.08} emissive={accent} emissiveIntensity={0.1} />
        </mesh>
        <mesh position={[0, 548, 0]} castShadow={enableHeavyShadows} receiveShadow>
          <sphereGeometry args={[26, 20, 20]} />
          <meshStandardMaterial color="#98a4ad" roughness={0.42} metalness={0.12} emissive={accent} emissiveIntensity={0.14} />
        </mesh>
      </group>
      <group name="stadium-structure:rear-campus-helix-spire" position={[2439, 0, -1432]}>
        <mesh position={[0, 12, 0]} receiveShadow>
          <cylinderGeometry args={[112, 132, 20, 36]} />
          <meshStandardMaterial color="#84919a" roughness={0.74} metalness={0.04} emissive={accent} emissiveIntensity={0.024} />
        </mesh>
        <mesh position={[0, 312, 0]} castShadow={enableHeavyShadows} receiveShadow>
          <cylinderGeometry args={[26, 42, 624, 24]} />
          <meshStandardMaterial color="#98a4ad" roughness={0.58} metalness={0.08} emissive={accent} emissiveIntensity={0.06} />
        </mesh>
        <mesh position={[0, 112, 0]} rotation={[0.08, 0, 0.42]} castShadow={enableHeavyShadows} receiveShadow>
          <boxGeometry args={[228, 14, 22]} />
          <meshStandardMaterial color="#98a4ad" roughness={0.52} metalness={0.1} emissive={accent} emissiveIntensity={0.09} />
        </mesh>
        <mesh position={[0, 212, 0]} rotation={[0.08, 0, 1.08]} castShadow={enableHeavyShadows} receiveShadow>
          <boxGeometry args={[252, 14, 22]} />
          <meshStandardMaterial color="#84919a" roughness={0.56} metalness={0.08} emissive={accent} emissiveIntensity={0.08} />
        </mesh>
        <mesh position={[0, 318, 0]} rotation={[0.08, 0, 1.82]} castShadow={enableHeavyShadows} receiveShadow>
          <boxGeometry args={[272, 14, 22]} />
          <meshStandardMaterial color="#98a4ad" roughness={0.52} metalness={0.1} emissive={accent} emissiveIntensity={0.09} />
        </mesh>
        <mesh position={[0, 426, 0]} rotation={[0.08, 0, 2.46]} castShadow={enableHeavyShadows} receiveShadow>
          <boxGeometry args={[246, 14, 22]} />
          <meshStandardMaterial color="#84919a" roughness={0.56} metalness={0.08} emissive={accent} emissiveIntensity={0.08} />
        </mesh>
        <mesh position={[0, 536, 0]} rotation={[0.08, 0, 3.1]} castShadow={enableHeavyShadows} receiveShadow>
          <boxGeometry args={[214, 12, 20]} />
          <meshStandardMaterial color="#98a4ad" roughness={0.52} metalness={0.1} emissive={accent} emissiveIntensity={0.1} />
        </mesh>
        <mesh position={[0, 676, 0]} castShadow={enableHeavyShadows} receiveShadow>
          <cylinderGeometry args={[8, 16, 172, 18]} />
          <meshStandardMaterial color="#98a4ad" roughness={0.56} metalness={0.1} emissive={accent} emissiveIntensity={0.1} />
        </mesh>
        <mesh position={[0, 784, 0]} castShadow={enableHeavyShadows} receiveShadow>
          <octahedronGeometry args={[28, 0]} />
          <meshStandardMaterial color="#98a4ad" roughness={0.4} metalness={0.14} emissive={accent} emissiveIntensity={0.16} />
        </mesh>
      </group>
      <group name="stadium-structure:rear-campus-grand-prism-citadel" position={[-1033, 0, -1902]}>
        <mesh position={[0, 14, 0]} receiveShadow>
          <boxGeometry args={[596, 20, 224]} />
          <meshStandardMaterial color="#84919a" roughness={0.74} metalness={0.04} emissive={accent} emissiveIntensity={0.025} />
        </mesh>
        <mesh position={[-118, 176, -16]} rotation={[0, 0, -0.12]} castShadow={enableHeavyShadows} receiveShadow>
          <boxGeometry args={[114, 352, 72]} />
          <meshStandardMaterial color="#84919a" roughness={0.68} metalness={0.05} emissive={accent} emissiveIntensity={0.04} />
        </mesh>
        <mesh position={[34, 228, 18]} rotation={[0, 0, 0.08]} castShadow={enableHeavyShadows} receiveShadow>
          <boxGeometry args={[126, 456, 84]} />
          <meshStandardMaterial color="#98a4ad" roughness={0.62} metalness={0.06} emissive={accent} emissiveIntensity={0.06} />
        </mesh>
        <mesh position={[172, 142, 6]} rotation={[0, 0, 0.2]} castShadow={enableHeavyShadows} receiveShadow>
          <boxGeometry args={[68, 284, 52]} />
          <meshStandardMaterial color="#6f7b84" roughness={0.66} metalness={0.05} emissive={accent} emissiveIntensity={0.05} />
        </mesh>
      </group>
      <group name="stadium-structure:rear-campus-split-wall-gate" position={[-836, 0, -1427]}>
        <mesh position={[0, 10, 0]} receiveShadow>
          <boxGeometry args={[548, 16, 192]} />
          <meshStandardMaterial color="#84919a" roughness={0.74} metalness={0.04} emissive={accent} emissiveIntensity={0.025} />
        </mesh>
        <mesh position={[-124, 188, 0]} castShadow={enableHeavyShadows} receiveShadow>
          <boxGeometry args={[84, 376, 42]} />
          <meshStandardMaterial color="#84919a" roughness={0.68} metalness={0.05} emissive={accent} emissiveIntensity={0.04} />
        </mesh>
        <mesh position={[124, 206, 0]} castShadow={enableHeavyShadows} receiveShadow>
          <boxGeometry args={[92, 412, 44]} />
          <meshStandardMaterial color="#98a4ad" roughness={0.62} metalness={0.06} emissive={accent} emissiveIntensity={0.06} />
        </mesh>
        <mesh position={[0, 72, 0]} castShadow={enableHeavyShadows} receiveShadow>
          <boxGeometry args={[188, 28, 28]} />
          <meshStandardMaterial color="#98a4ad" roughness={0.66} metalness={0.05} emissive={accent} emissiveIntensity={0.07} />
        </mesh>
      </group>
      <group name="stadium-structure:rear-campus-terrace-signal-court" position={[-864, 0, -936]}>
        <mesh position={[0, 8, 0]} receiveShadow>
          <boxGeometry args={[404, 14, 132]} />
          <meshStandardMaterial color="#84919a" roughness={0.74} metalness={0.04} emissive={accent} emissiveIntensity={0.025} />
        </mesh>
        <mesh position={[0, 20, 0]} receiveShadow>
          <boxGeometry args={[276, 10, 84]} />
          <meshStandardMaterial color="#98a4ad" roughness={0.64} metalness={0.05} emissive={accent} emissiveIntensity={0.04} />
        </mesh>
        <mesh position={[0, 68, 0]} castShadow={enableHeavyShadows} receiveShadow>
          <boxGeometry args={[34, 120, 34]} />
          <meshStandardMaterial color="#98a4ad" roughness={0.68} metalness={0.05} emissive={accent} emissiveIntensity={0.08} />
        </mesh>
        <mesh position={[-104, 32, 0]} castShadow={enableHeavyShadows} receiveShadow>
          <boxGeometry args={[40, 24, 40]} />
          <meshStandardMaterial color="#98a4ad" roughness={0.62} metalness={0.04} emissive={accent} emissiveIntensity={0.04} />
        </mesh>
        <mesh position={[104, 32, 0]} castShadow={enableHeavyShadows} receiveShadow>
          <boxGeometry args={[40, 24, 40]} />
          <meshStandardMaterial color="#98a4ad" roughness={0.62} metalness={0.04} emissive={accent} emissiveIntensity={0.04} />
        </mesh>
      </group>
      <group name="stadium-structure:rear-campus-needle-crown-skyscraper" position={[892, 0, -611]}>
        <mesh position={[0, 12, 0]} receiveShadow>
          <boxGeometry args={[188, 18, 128]} />
          <meshStandardMaterial color="#84919a" roughness={0.74} metalness={0.04} emissive={accent} emissiveIntensity={0.024} />
        </mesh>
        <mesh position={[0, 172, 0]} castShadow={enableHeavyShadows} receiveShadow>
          <boxGeometry args={[84, 344, 52]} />
          <meshStandardMaterial color="#98a4ad" roughness={0.62} metalness={0.06} emissive={accent} emissiveIntensity={0.05} />
        </mesh>
        <mesh position={[0, 396, 0]} castShadow={enableHeavyShadows} receiveShadow>
          <boxGeometry args={[58, 104, 34]} />
          <meshStandardMaterial color="#84919a" roughness={0.66} metalness={0.05} emissive={accent} emissiveIntensity={0.06} />
        </mesh>
        <mesh position={[0, 574, 0]} castShadow={enableHeavyShadows} receiveShadow>
          <cylinderGeometry args={[8, 12, 252, 16]} />
          <meshStandardMaterial color="#94a8b5" roughness={0.58} metalness={0.08} emissive={accent} emissiveIntensity={0.08} />
        </mesh>
        <mesh position={[0, 722, 0]} castShadow={enableHeavyShadows} receiveShadow>
          <octahedronGeometry args={[26, 0]} />
          <meshStandardMaterial color="#98a4ad" roughness={0.42} metalness={0.12} emissive={accent} emissiveIntensity={0.12} />
        </mesh>
        <mesh position={[-34, 442, 0]} castShadow={enableHeavyShadows} receiveShadow>
          <boxGeometry args={[12, 96, 12]} />
          <meshStandardMaterial color="#98a4ad" roughness={0.6} metalness={0.05} emissive={accent} emissiveIntensity={0.05} />
        </mesh>
        <mesh position={[34, 458, 0]} castShadow={enableHeavyShadows} receiveShadow>
          <boxGeometry args={[12, 128, 12]} />
          <meshStandardMaterial color="#98a4ad" roughness={0.6} metalness={0.05} emissive={accent} emissiveIntensity={0.05} />
        </mesh>
      </group>
      <group name="stadium-structure:rear-campus-sky-slab-tower" position={[1087, 0, -1329]}>
        <mesh position={[0, 10, 0]} receiveShadow>
          <boxGeometry args={[224, 16, 136]} />
          <meshStandardMaterial color="#84919a" roughness={0.74} metalness={0.04} emissive={accent} emissiveIntensity={0.024} />
        </mesh>
        <mesh position={[0, 156, 0]} castShadow={enableHeavyShadows} receiveShadow>
          <boxGeometry args={[72, 312, 46]} />
          <meshStandardMaterial color="#98a4ad" roughness={0.62} metalness={0.06} emissive={accent} emissiveIntensity={0.05} />
        </mesh>
        <mesh position={[0, 286, 20]} castShadow={enableHeavyShadows} receiveShadow>
          <boxGeometry args={[168, 18, 96]} />
          <meshStandardMaterial color="#98a4ad" roughness={0.56} metalness={0.06} emissive={accent} emissiveIntensity={0.07} />
        </mesh>
        <mesh position={[0, 438, -12]} castShadow={enableHeavyShadows} receiveShadow>
          <boxGeometry args={[212, 20, 112]} />
          <meshStandardMaterial color="#8d9aa4" roughness={0.58} metalness={0.06} emissive={accent} emissiveIntensity={0.08} />
        </mesh>
        <mesh position={[0, 592, 14]} castShadow={enableHeavyShadows} receiveShadow>
          <boxGeometry args={[156, 16, 88]} />
          <meshStandardMaterial color="#98a4ad" roughness={0.52} metalness={0.08} emissive={accent} emissiveIntensity={0.09} />
        </mesh>
        <mesh position={[0, 694, 0]} castShadow={enableHeavyShadows} receiveShadow>
          <boxGeometry args={[40, 172, 24]} />
          <meshStandardMaterial color="#98a4ad" roughness={0.62} metalness={0.06} emissive={accent} emissiveIntensity={0.08} />
        </mesh>
      </group>
      <group name="stadium-structure:rear-campus-twin-void-monolith" position={[1340, 0, -3242]}>
        <mesh position={[0, 12, 0]} receiveShadow>
          <boxGeometry args={[276, 18, 168]} />
          <meshStandardMaterial color="#84919a" roughness={0.74} metalness={0.04} emissive={accent} emissiveIntensity={0.024} />
        </mesh>
        <mesh position={[-82, 244, 0]} castShadow={enableHeavyShadows} receiveShadow>
          <boxGeometry args={[72, 488, 44]} />
          <meshStandardMaterial color="#98a4ad" roughness={0.6} metalness={0.06} emissive={accent} emissiveIntensity={0.06} />
        </mesh>
        <mesh position={[82, 232, 0]} castShadow={enableHeavyShadows} receiveShadow>
          <boxGeometry args={[64, 464, 44]} />
          <meshStandardMaterial color="#84919a" roughness={0.66} metalness={0.05} emissive={accent} emissiveIntensity={0.05} />
        </mesh>
        <mesh position={[0, 92, 0]} castShadow={enableHeavyShadows} receiveShadow>
          <boxGeometry args={[92, 18, 30]} />
          <meshStandardMaterial color="#98a4ad" roughness={0.66} metalness={0.05} emissive={accent} emissiveIntensity={0.08} />
        </mesh>
        <mesh position={[0, 494, 0]} castShadow={enableHeavyShadows} receiveShadow>
          <boxGeometry args={[118, 14, 24]} />
          <meshStandardMaterial color="#98a4ad" roughness={0.52} metalness={0.08} emissive={accent} emissiveIntensity={0.09} />
        </mesh>
        <mesh position={[0, 586, 0]} castShadow={enableHeavyShadows} receiveShadow>
          <boxGeometry args={[22, 168, 22]} />
          <meshStandardMaterial color="#98a4ad" roughness={0.62} metalness={0.06} emissive={accent} emissiveIntensity={0.08} />
        </mesh>
      </group>
      <group ref={campusColliderRef} name="rear-campus-collider">
        {[-1, 1].map((side) => (
          <mesh key={`rear-campus-gateway-collider-${side}`} position={[side * 1260, 168, campusCenterZ + 980]} rotation={[0, 0, 0]}>
            <boxGeometry args={[126, 336, 126]} />
            <ColliderMaterial color="#f97316" />
          </mesh>
        ))}
        <mesh position={[0, 208, stadiumBackWallZ]} rotation={[-0.08, 0, 0]}>
          <boxGeometry args={[2860, 416, 860]} />
          <ColliderMaterial color="#f97316" />
        </mesh>
      </group>
    </group>
  );
}


