import { Suspense } from 'react';
import { AdaptiveDpr, AdaptiveEvents, Environment, Html, Sky } from '@react-three/drei';
import { DistrictBooth as RuntimeDistrictBooth } from '../../booths';
import { EXPO_CITY_QUALITY_TIER, EXPO_FEATURE_FLAGS, type ExpoMode } from '../../../state/expoRuntime';
import type { ExpoBoothPlacement, ExpoSectorMarker } from '../../../layout-engine';
import type { ExpoDistrictProgramSummary, ExpoWorldContract, ExpoWorldVisualProfile } from '../../../world-contract';
import type { ExpoWalkRegion } from '../../../walk-region';
import type { ExpoWorldLayerToggles, ExpoWorldSectionToggles } from '../debug/worldSceneDebugContract';
import { CuratedSkylineRing } from '../CuratedSkylineRing';
import { ExpoEvidenceProbe } from '../../../components/ExpoEvidenceProbe';
import { ExpoRearCampus } from '../ExpoRearCampus';
import { WorldCitySkeleton } from '../WorldCitySkeleton';
import { WorldGroundPlane } from '../WorldGroundPlane';
import { WorldPromenade } from '../WorldPromenade';
import { WorldWayfinding } from '../WorldWayfinding';

export function ExpoWorldSceneLayers({
  activeZoneId,
  districtPrograms,
  layerToggles,
  mode,
  playerPosition,
  planningBoothPlacements,
  qualityProfileInputs,
  runtimeCaptureSafe,
  sceneVersion,
  sectorMarkers,
  sectionToggles,
  sectionVisibleBoothPlacements,
  visualProfile,
  walkRegions,
}: {
  activeZoneId: string | null;
  districtPrograms: ExpoDistrictProgramSummary[];
  layerToggles: ExpoWorldLayerToggles;
  mode: ExpoMode;
  playerPosition: [number, number, number];
  planningBoothPlacements: ExpoBoothPlacement[];
  qualityProfileInputs: ExpoWorldContract['qualityProfileInputs'];
  runtimeCaptureSafe: boolean;
  sceneVersion: string | null;
  sectorMarkers: ExpoSectorMarker[];
  sectionToggles: ExpoWorldSectionToggles;
  sectionVisibleBoothPlacements: ExpoBoothPlacement[];
  visualProfile: ExpoWorldVisualProfile;
  walkRegions: ExpoWalkRegion[];
}) {
  return (
    <Suspense fallback={null}>
      {!runtimeCaptureSafe && <AdaptiveDpr />}
      {!runtimeCaptureSafe && <AdaptiveEvents />}
      {runtimeCaptureSafe ? (
        <color attach="background" args={['#d8e4ef']} />
      ) : (
        <Sky distance={450000} sunPosition={[56, 10, 42]} inclination={0.42} azimuth={0.18} />
      )}
      {!runtimeCaptureSafe && EXPO_FEATURE_FLAGS.enableStreetEnvironmentLighting && (
        <Environment files="/models/modern_evening_street_4k.exr" />
      )}
      <ambientLight intensity={runtimeCaptureSafe ? 0.16 : 0.24} />
      <directionalLight position={[16, 26, 10]} intensity={runtimeCaptureSafe ? 0.66 : 0.96} castShadow={false} />
      <hemisphereLight args={['#94a8b8', '#4f5d69', runtimeCaptureSafe ? 0.24 : 0.36]} />
      {EXPO_FEATURE_FLAGS.enableFog && <fog attach="fog" args={['#748392', 230, 620]} />}

      <WorldGroundPlane visualProfile={visualProfile} />
      {layerToggles.promenade && (
        <WorldPromenade boothPlacements={sectionVisibleBoothPlacements} sectorMarkers={sectorMarkers} visualProfile={visualProfile} />
      )}
      {layerToggles.city && (
        <WorldCitySkeleton
          boothPlacements={planningBoothPlacements}
          districtPrograms={districtPrograms}
          playerPosition={playerPosition}
          sectionToggles={sectionToggles}
          visualProfile={visualProfile}
        />
      )}
      {layerToggles.stadium && sectionToggles.stadium && (
        <ExpoRearCampus boothPlacements={planningBoothPlacements} playerPosition={playerPosition} visualProfile={visualProfile} />
      )}
      {(layerToggles.city || layerToggles.booths) && (
        <WorldWayfinding
          boothPlacements={sectionVisibleBoothPlacements}
          playerPosition={playerPosition}
          sectorMarkers={sectorMarkers}
        />
      )}
      {layerToggles.skyline && EXPO_FEATURE_FLAGS.enableCuratedSkylineRing && (
        <CuratedSkylineRing
          density={EXPO_FEATURE_FLAGS.enableShowcaseSkylineDensity ? 'standard' : 'minimal'}
          visualProfile={visualProfile}
          walkRegions={walkRegions}
        />
      )}
      <ExpoEvidenceProbe
        activeZoneId={activeZoneId}
        mode={mode}
        playerPosition={playerPosition}
        qualityPreset={EXPO_CITY_QUALITY_TIER}
        qualityProfileInputs={qualityProfileInputs}
        sceneVersion={sceneVersion}
        sectorCount={qualityProfileInputs.sectorCount}
        sponsorCount={qualityProfileInputs.boothCount}
      />

      {layerToggles.booths && (
        <group>
          {sectionVisibleBoothPlacements.map((placement) => (
            <RuntimeDistrictBooth
              key={placement.id}
              districtVisual={getDistrictVisualProfile(placement.sectorId, placement.clusterIndex, visualProfile)}
              placement={placement}
              playerPosition={playerPosition}
            />
          ))}
        </group>
      )}

      {layerToggles.booths && sectionVisibleBoothPlacements.length === 0 && (
        <Html position={[0, 8, 0]} center>
          <div style={{ background: 'rgba(15, 23, 42, 0.9)', color: 'white', padding: '16px 20px', borderRadius: '14px', border: '1px solid rgba(59, 130, 246, 0.35)', width: '320px', textAlign: 'center' }}>
            Sponsor booths are not loaded yet. Check /api/expo/scene or the underlying Supabase sector and company data.
          </div>
        </Html>
      )}
    </Suspense>
  );
}

function getDistrictVisualProfile(
  sectorId: string | null | undefined,
  clusterIndex: number | null | undefined,
  visualProfile: ExpoWorldVisualProfile,
) {
  return (sectorId ? visualProfile.districts.find((district) => district.sectorId === sectorId) : undefined)
    ?? visualProfile.districts.find((district) => district.clusterIndex === clusterIndex)
    ?? visualProfile.districts[0];
}
