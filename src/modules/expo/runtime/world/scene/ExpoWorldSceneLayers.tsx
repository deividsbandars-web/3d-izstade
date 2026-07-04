import { Suspense } from 'react';
import { AdaptiveDpr, AdaptiveEvents, Environment, Html, Sky } from '@react-three/drei';
import { EffectComposer, N8AO, SMAA } from '@react-three/postprocessing';
import { DistrictBooth as RuntimeDistrictBooth } from '../../booths';
import { EXPO_CITY_QUALITY_TIER, EXPO_FEATURE_FLAGS, type ExpoMode } from '../../../state/expoRuntime';
import type { ExpoBoothPlacement, ExpoSectorMarker } from '../../../layout-engine';
import type { ExpoDistrictProgramSummary, ExpoWorldContract, ExpoWorldVisualProfile } from '../../../world-contract';
import type { ExpoWalkRegion } from '../../../walk-region';
import type { ExpoVerticalAccessNode } from '../../planning/types';
import type { ExpoQualitySettings } from '../quality/expoQualitySettings';
import type { ExpoZoneRuntimeState } from '../zones/expoZoneRuntimeState';
import type { ExpoWorldLayerToggles, ExpoWorldSectionToggles } from '../debug/worldSceneDebugContract';
import { ExpoZoneGroup } from '../zones/ExpoZoneGroup';
import { CuratedSkylineRing } from '../CuratedSkylineRing';
import { ExpoEvidenceProbe } from '../../../components/ExpoEvidenceProbe';
import { ExpoRearCampus } from '../ExpoRearCampus';
import { WorldCitySkeleton } from '../WorldCitySkeleton';
import { WorldGroundPlane } from '../WorldGroundPlane';
import { WorldPromenade } from '../WorldPromenade';
import { WorldWayfinding } from '../WorldWayfinding';
import { ModularHomeEntrancePortal } from '../ModularHomeEntrancePortal';
import { ModularHomeModel, ModularHomeUploadedModelPreview, isHomeStudioEnabled } from '../../modularHome';
import { resolveExpoWorldSceneQualityStrategy } from './ExpoWorldSceneQualityStrategy';
import {
  WorldCommunityHub,
  WorldVisitorPresence,
} from '../../community';
import type { ExpoPresenceGuest } from '../../community/expoPresencePolicy';

export function ExpoWorldSceneLayers({
  activeZoneId,
  districtPrograms,
  guests,
  layerToggles,
  mode,
  playerPosition,
  planningBoothPlacements,
  qualitySettings,
  qualityProfileInputs,
  runtimeCaptureSafe,
  sceneVersion,
  sectorMarkers,
  sectionToggles,
  sectionVisibleBoothPlacements,
  verticalAccessNodes,
  visualProfile,
  walkRegions,
  webglMode,
  zoneRuntimeState,
}: {
  activeZoneId: string | null;
  districtPrograms: ExpoDistrictProgramSummary[];
  guests: ExpoPresenceGuest[];
  layerToggles: ExpoWorldLayerToggles;
  mode: ExpoMode;
  playerPosition: [number, number, number];
  planningBoothPlacements: ExpoBoothPlacement[];
  qualitySettings: ExpoQualitySettings;
  qualityProfileInputs: ExpoWorldContract['qualityProfileInputs'];
  runtimeCaptureSafe: boolean;
  sceneVersion: string | null;
  sectorMarkers: ExpoSectorMarker[];
  sectionToggles: ExpoWorldSectionToggles;
  sectionVisibleBoothPlacements: ExpoBoothPlacement[];
  verticalAccessNodes: ExpoVerticalAccessNode[];
  visualProfile: ExpoWorldVisualProfile;
  walkRegions: ExpoWalkRegion[];
  webglMode: 'webgl2' | 'webgl1' | null;
  zoneRuntimeState: ExpoZoneRuntimeState;
}) {
  const homeStudioEnabled = isHomeStudioEnabled();
  const sceneQualityStrategy = resolveExpoWorldSceneQualityStrategy({
    homeStudioEnabled,
    qualitySettings,
    runtimeCaptureSafe,
  });
  const lowDetail = false;
  const renderRearCampus = !lowDetail
    || zoneRuntimeState.activeZoneId === 'rearCampus'
    || zoneRuntimeState.adjacentZoneIds.includes('rearCampus');

  return (
    <Suspense fallback={null}>
      {qualitySettings.adaptiveDprEnabled && <AdaptiveDpr />}
      {qualitySettings.adaptiveEventsEnabled && <AdaptiveEvents />}
      {homeStudioEnabled ? (
        <>
          <color attach="background" args={['#081120']} />
          <fog attach="fog" args={['#081120', 96, 410]} />
          <Environment files="/textures/gala/gala-studio-512.hdr" environmentIntensity={0.7} />
          <ambientLight intensity={0.44} />
          <directionalLight
            castShadow={qualitySettings.shadowsEnabled}
            color="#fff1cc"
            intensity={1.08}
            position={[28, 34, 18]}
            shadow-bias={-0.00018}
            shadow-camera-bottom={-18}
            shadow-camera-far={90}
            shadow-camera-left={-18}
            shadow-camera-near={1}
            shadow-camera-right={18}
            shadow-camera-top={18}
            shadow-mapSize-height={1024}
            shadow-mapSize-width={1024}
            shadow-normalBias={0.026}
          />
          <hemisphereLight args={['#cfe9ff', '#1e293b', 0.48]} />
        </>
      ) : (
        <>
          {runtimeCaptureSafe || lowDetail ? (
            <color attach="background" args={[runtimeCaptureSafe ? '#e5dcff' : '#b8d6df']} />
          ) : (
            <Sky distance={450000} sunPosition={[68, 28, 36]} inclination={0.38} azimuth={0.16} />
          )}
          {sceneQualityStrategy.streetEnvironmentFile ? (
            <Environment files={sceneQualityStrategy.streetEnvironmentFile} />
          ) : null}
          <ambientLight intensity={runtimeCaptureSafe ? 0.2 : 0.34} />
          <directionalLight color="#fff1cc" position={[18, 30, 12]} intensity={runtimeCaptureSafe ? 0.76 : 1.1} castShadow={false} />
          <hemisphereLight args={['#d7f0ff', '#65757a', runtimeCaptureSafe ? 0.34 : 0.52]} />
          {EXPO_FEATURE_FLAGS.enableFog && <fog attach="fog" args={['#7b75a5', 460, 2550]} />}
        </>
      )}

      <ExpoZoneGroup
        alwaysVisible
        groupId="world-ground-global"
        runtimeState={zoneRuntimeState}
        zoneId="perimeter"
      >
        <WorldGroundPlane homeStudioMode={homeStudioEnabled} lowDetail={lowDetail} visualProfile={visualProfile} />
      </ExpoZoneGroup>
      {!homeStudioEnabled ? (
        <>
          {layerToggles.promenade && (
            <ExpoZoneGroup
              groupId="world-promenade"
              runtimeState={zoneRuntimeState}
              zoneId="center"
            >
              <WorldPromenade boothPlacements={sectionVisibleBoothPlacements} sectorMarkers={sectorMarkers} visualProfile={visualProfile} />
            </ExpoZoneGroup>
          )}
          {layerToggles.city && (
            <WorldCitySkeleton
              boothPlacements={planningBoothPlacements}
              districtPrograms={districtPrograms}
              playerPosition={playerPosition}
              qualitySettings={qualitySettings}
              sectionToggles={sectionToggles}
              verticalAccessNodes={verticalAccessNodes}
              visualProfile={visualProfile}
              zoneRuntimeState={zoneRuntimeState}
            />
          )}
          {layerToggles.stadium && sectionToggles.stadium && renderRearCampus && (
            <ExpoRearCampus
              boothPlacements={planningBoothPlacements}
              playerPosition={playerPosition}
              qualitySettings={qualitySettings}
              visualProfile={visualProfile}
              zoneRuntimeState={zoneRuntimeState}
            />
          )}
          {(layerToggles.city || layerToggles.booths) && (
            <ExpoZoneGroup
              alwaysVisible
              groupId="world-wayfinding"
              runtimeState={zoneRuntimeState}
              zoneId="center"
            >
              <WorldWayfinding
                boothPlacements={sectionVisibleBoothPlacements}
                playerPosition={playerPosition}
                sectorMarkers={sectorMarkers}
              />
            </ExpoZoneGroup>
          )}
          {(layerToggles.city || layerToggles.promenade) && (
            <ExpoZoneGroup
              alwaysVisible
              groupId="modular-home-entrance-portal"
              runtimeState={zoneRuntimeState}
              zoneId="center"
            >
            <ModularHomeEntrancePortal lowDetail={lowDetail} playerPosition={playerPosition} />
            </ExpoZoneGroup>
          )}
          {layerToggles.city && (
            <ExpoZoneGroup
              alwaysVisible
              groupId="expo-community-hub"
              runtimeState={zoneRuntimeState}
              zoneId="center"
            >
              <WorldCommunityHub />
              <WorldVisitorPresence
                guests={guests}
                playerPosition={playerPosition}
                qualitySettings={qualitySettings}
              />
            </ExpoZoneGroup>
          )}
          {layerToggles.skyline && EXPO_FEATURE_FLAGS.enableCuratedSkylineRing && (
            <ExpoZoneGroup
              canHideInLowQuality
              groupId="curated-skyline-ring"
              runtimeState={zoneRuntimeState}
              zoneId="legacy"
            >
              <CuratedSkylineRing
                density={EXPO_FEATURE_FLAGS.enableShowcaseSkylineDensity ? 'standard' : 'minimal'}
                visualProfile={visualProfile}
                walkRegions={walkRegions}
              />
            </ExpoZoneGroup>
          )}
        </>
      ) : null}
      {homeStudioEnabled ? (
        <ExpoZoneGroup
          alwaysVisible
          groupId="modular-home-preview"
          runtimeState={zoneRuntimeState}
          zoneId="center"
        >
          <ModularHomeModel renderDetailLevel={sceneQualityStrategy.modularHomeRenderDetailLevel} />
          <ModularHomeUploadedModelPreview />
        </ExpoZoneGroup>
      ) : null}
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

      {!homeStudioEnabled && layerToggles.booths && (
        <ExpoZoneGroup
          groupId="district-booths"
          runtimeState={zoneRuntimeState}
          zoneId="sponsorBoulevard"
        >
          {sectionVisibleBoothPlacements.map((placement) => (
            <RuntimeDistrictBooth
              key={placement.id}
              lowDetail={lowDetail}
              districtVisual={getDistrictVisualProfile(placement.sectorId, placement.clusterIndex, visualProfile)}
              placement={placement}
              playerPosition={playerPosition}
            />
          ))}
        </ExpoZoneGroup>
      )}

      {!homeStudioEnabled && layerToggles.booths && sectionVisibleBoothPlacements.length === 0 && (
        <Html position={[0, 8, 0]} center>
          <div style={{ background: 'rgba(15, 23, 42, 0.9)', color: 'white', padding: '16px 20px', borderRadius: '14px', border: '1px solid rgba(59, 130, 246, 0.35)', width: '320px', textAlign: 'center' }}>
            Sponsor booths are not loaded yet. Check /api/expo/scene or the underlying Supabase sector and company data.
          </div>
        </Html>
      )}
      {sceneQualityStrategy.homeStudioAoEnabled ? (
        <GalaHomeStudioPostProcessing
          qualityTier={qualitySettings.resolvedTier}
          webglMode={webglMode}
        />
      ) : null}
    </Suspense>
  );
}

function GalaHomeStudioPostProcessing({
  qualityTier,
  webglMode,
}: {
  qualityTier: ExpoQualitySettings['resolvedTier'];
  webglMode: 'webgl2' | 'webgl1' | null;
}) {
  const isHighQuality = qualityTier === 'high';
  const aoPass = (
    <N8AO
      aoRadius={1.65}
      aoSamples={isHighQuality ? 10 : 6}
      color="#15110b"
      denoiseRadius={isHighQuality ? 8 : 6}
      denoiseSamples={isHighQuality ? 5 : 3}
      depthAwareUpsampling
      distanceFalloff={1.12}
      halfRes={!isHighQuality}
      intensity={1.36}
      quality={isHighQuality ? 'medium' : 'performance'}
      screenSpaceRadius={false}
    />
  );

  if (webglMode === 'webgl1') {
    return (
      <EffectComposer enableNormalPass multisampling={0}>
        {aoPass}
        <SMAA />
      </EffectComposer>
    );
  }

  return (
    <EffectComposer enableNormalPass multisampling={0}>
      {aoPass}
    </EffectComposer>
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
