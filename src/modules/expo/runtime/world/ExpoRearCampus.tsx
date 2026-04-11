import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import type { ExpoBoothPlacement } from '../../layout-engine';
import type { ExpoWorldVisualProfile } from '../../world-contract';
import {
  buildRearCampusForecourts,
  buildRearCampusLandmarkTowers,
  buildRearCampusMetrics,
  buildRearCampusSidePavilions,
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
  const { routeEndZ, campusCenterZ, stadiumBackWallZ } = useMemo(
    () => buildRearCampusMetrics(boothPlacements),
    [boothPlacements]
  );
  const accent = visualProfile.global.hudAccent;
  usePlayerColliderRegistration(campusColliderRef, 'rear-campus-collider');
  const enableHeavyShadows = false;
  const stadiumForecourts = useMemo(() => buildRearCampusForecourts(campusCenterZ), [campusCenterZ]);
  const stadiumSidePavilions = useMemo(() => buildRearCampusSidePavilions(campusCenterZ), [campusCenterZ]);
  const stadiumLandmarkTowers = useMemo(() => buildRearCampusLandmarkTowers(campusCenterZ), [campusCenterZ]);
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
  const filteredStadiumForecourts = useMemo(
    () => stadiumForecourts.filter((plane) => plane.id !== 'stadium-forecourt-axis-pad-right'),
    [stadiumForecourts]
  );
  const filteredStadiumSidePavilions = useMemo(
    () => stadiumSidePavilions.filter((pavilion) => pavilion.id !== 'rear-campus-axis-front-right'),
    [stadiumSidePavilions]
  );

  useEffect(() => {
    const stadiumEntries = [
      ...filteredStadiumForecourts.map((plane) => ({ id: plane.id, layer: 'stadium-plane', position: plane.position })),
      ...filteredStadiumSidePavilions.map((pavilion) => ({ id: pavilion.id, layer: 'stadium-pavilion', position: pavilion.position })),
      ...stadiumLandmarkTowers.map((tower) => ({ id: tower.id, layer: 'stadium-tower', position: tower.position })),
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
  }, [campusCenterZ, filteredStadiumForecourts, filteredStadiumSidePavilions, stadiumLandmarkTowers]);

  return (
    <group name="expo-rear-campus">
      <mesh position={[0, 0.02, routeEndZ + 240]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[1180, 2760]} />
        <ExpoRuntimeSurfaceMaterial fallbackColor="#e4ebf1" repeat={[2.4, 7.8]} surface="paver" />
      </mesh>
      <mesh position={[0, 0.02, campusCenterZ]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[6200, 4400]} />
        <ExpoRuntimeSurfaceMaterial fallbackColor="#edf3f8" repeat={[11.2, 8.2]} surface="concrete" />
      </mesh>
      <mesh position={[0, 0.024, campusCenterZ + 820]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[2600, 1500]} />
        <ExpoRuntimeSurfaceMaterial fallbackColor="#f6fafc" repeat={[5.2, 3.2]} surface="concrete" />
      </mesh>
      <mesh position={[0, 5.2, routeEndZ]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[1240, 220]} />
        <ExpoRuntimeSurfaceMaterial fallbackColor="#73889b" repeat={[3.4, 1.1]} surface="paver" />
      </mesh>
      <mesh position={[0, 5.92, campusCenterZ + 540]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[1380, 2140]} />
        <ExpoRuntimeSurfaceMaterial fallbackColor="#f8fbfd" repeat={[3.4, 4.4]} surface="concrete" />
      </mesh>
      <mesh position={[0, 6.34, campusCenterZ + 980]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[1960, 640]} />
        <ExpoRuntimeSurfaceMaterial fallbackColor="#d8e4ec" repeat={[4.2, 1.8]} surface="paver" />
      </mesh>
      {filteredStadiumForecourts.map((plane) => (
        <mesh key={plane.id} position={plane.position} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={plane.size} />
          <meshStandardMaterial color={plane.color} roughness={0.72} metalness={0.04} />
        </mesh>
      ))}
      <group position={[0, 0, campusCenterZ]}>
        <mesh position={[0, 6.08, -40]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <circleGeometry args={[3080, 112]} />
          <ExpoRuntimeSurfaceMaterial fallbackColor="#94a7b6" repeat={[6.8, 6.8]} surface="concrete" />
        </mesh>
        <mesh position={[0, 6.3, -40]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <circleGeometry args={[2120, 88]} />
          <ExpoRuntimeSurfaceMaterial fallbackColor="#ffffff" repeat={[4.8, 4.8]} surface="concrete" />
        </mesh>
        <mesh position={[0, 6.54, -40]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <ringGeometry args={[2120, 2540, 96]} />
          <ExpoRuntimeSurfaceMaterial fallbackColor="#d8e3ea" repeat={[5.8, 5.8]} surface="paver" />
        </mesh>
        <mesh position={[0, 6.82, -40]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <ringGeometry args={[1860, 2000, 96]} />
          <ExpoRuntimeSurfaceMaterial fallbackColor="#9eb2c0" repeat={[4.8, 4.8]} surface="paver" />
        </mesh>
        <mesh position={[0, 26, -40]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <ringGeometry args={[2440, 2720, 96]} />
          <meshStandardMaterial color="#cbd8e0" roughness={0.56} metalness={0.06} />
        </mesh>
      </group>

      <ExpoRearCampusStructures
        accent={accent}
        campusCenterZ={campusCenterZ}
        enableHeavyShadows={enableHeavyShadows}
        screenFeeds={stadiumScreenFeeds}
        sidePavilions={filteredStadiumSidePavilions}
        towers={stadiumLandmarkTowers}
      />
      <mesh position={[0, 10, 760]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[1380, 1880]} />
        <ExpoRuntimeSurfaceMaterial fallbackColor="#edf3f7" repeat={[3.6, 4.2]} surface="concrete" />
      </mesh>
      <mesh position={[0, 12, 60]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[1320, 920]} />
        <ExpoRuntimeSurfaceMaterial fallbackColor="#f6fafc" repeat={[3.2, 2.6]} surface="paver" />
      </mesh>
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
