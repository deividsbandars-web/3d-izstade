import { useMemo } from 'react';
import type { ExpoBoothPlacement } from '../../layout-engine';
import type { ExpoDistrictProgramSummary, ExpoWorldVisualProfile } from '../../world-contract';
import {
  buildArrivalGatewayBlocks,
  buildArrivalPlanes,
  buildBoothForecourtPlanes,
  buildBoulevardEdgeBlocks,
  buildCivicWaterCourt,
  buildCleanTowerLandmarks,
  buildDiscoveryEdgeBlocks,
  buildDiscoveryLandmarks,
  buildDiscoveryObservatory,
  buildDiscoverySkybridge,
  buildDiscoverySupportTerraces,
  buildMediaWallLandmarks,
  buildPromenadeAxisPlanes,
  buildRightSupportBlocks,
  buildShowcaseMonuments,
  buildShowcasePlazas,
  buildSignatureMegaLandmarks,
  buildSupportEdgeBlocks,
  getWorldCityStadiumReserve,
} from './WorldCitySkeletonLayout';
import { WorldCityMasses } from './WorldCityMasses';
import { WorldCityMegaLandmarks } from './WorldCityMegaLandmarks';
import { WorldCityPlanes } from './WorldCityPlanes';
import { WorldCityTowers } from './WorldCityTowers';
import { WorldCityWaterCourt } from './WorldCityWaterCourt';
import type { CityMass, CityPlane } from './WorldCitySkeletonLayout';

const CENTRAL_CLUTTER_PLANE_PATTERNS = [
  'showcase-front-carpet',
  'showcase-center-carpet',
  'showcase-threshold-band',
  'showcase-gallery-band',
  'booth-forecourt-center',
  'booth-connector',
  'booth-mid-pad',
  'booth-inner-carpet',
  'promenade-axis-inner-carpet',
  'promenade-axis-center-carpet',
  'promenade-axis-front-carpet',
  'promenade-axis-threshold',
  'promenade-axis-terminal',
  'promenade-axis-transition',
];

const CENTRAL_CLUTTER_MASS_PATTERNS = [
  'gateway-mid-plinth',
  'gateway-front',
  'gateway-inner',
  'gateway-rear-band',
  'showcase-forum-plinth',
  'showcase-terrace',
  'showcase-obelisk',
  'showcase-dais',
  'showcase-forum-rear',
  'showcase-front-threshold-center',
  'media-wall-bridge',
  'media-wall-plinth',
  'media-wall-apron',
  'media-wall-gallery',
  'media-wall-center-link',
  'media-wall-front-node',
  'media-wall-forecourt-band',
  'media-wall-front-threshold',
  'discovery-axis-plinth',
  'discovery-front-threshold-center',
  'discovery-front-court',
  'discovery-terrace-center',
  'discovery-terrace-center-step',
  'discovery-viewing-step',
  'discovery-approach-plinth',
  'discovery-overlook-band',
  'discovery-overlook-center-band',
  'discovery-inner-step',
  'discovery-observatory-plinth',
  'discovery-observatory-front-pad',
  'media-wall-node-left',
  'media-wall-node-right',
  'signature-mega-front-court',
  'signature-mega-dais',
];

function isCentralClutterPlane(plane: CityPlane) {
  return Math.abs(plane.position[0]) <= 220 && CENTRAL_CLUTTER_PLANE_PATTERNS.some((pattern) => plane.id.includes(pattern));
}

function isCentralClutterMass(mass: CityMass) {
  return Math.abs(mass.position[0]) <= 220 && CENTRAL_CLUTTER_MASS_PATTERNS.some((pattern) => mass.id.includes(pattern));
}

export function WorldCitySkeleton({
  boothPlacements,
  districtPrograms,
  playerPosition: _playerPosition = [0, 0, 0],
  visualProfile,
}: {
  boothPlacements: ExpoBoothPlacement[];
  districtPrograms: ExpoDistrictProgramSummary[];
  playerPosition?: [number, number, number];
  visualProfile: ExpoWorldVisualProfile;
}) {
  const stadiumReserve = useMemo(() => getWorldCityStadiumReserve(boothPlacements), [boothPlacements]);
  const districtStride = 548;

  const arrivalPlanes = useMemo(() => buildArrivalPlanes(), []);
  const promenadeAxisPlanes = useMemo(
    () => buildPromenadeAxisPlanes(districtPrograms.length, districtStride),
    [districtPrograms.length, districtStride]
  );
  const arrivalGatewayBlocks = useMemo(() => buildArrivalGatewayBlocks(), []);
  const boulevardEdgeBlocks = useMemo(
    () => buildBoulevardEdgeBlocks(districtPrograms.length, districtStride),
    [districtPrograms.length, districtStride]
  );
  const showcasePlazas = useMemo(
    () => buildShowcasePlazas(districtPrograms, boothPlacements, districtStride),
    [districtPrograms, boothPlacements, districtStride]
  );
  const showcaseMonuments = useMemo(
    () => buildShowcaseMonuments(districtPrograms, districtStride),
    [districtPrograms, districtStride]
  );
  const boothForecourtPlanes = useMemo(
    () => buildBoothForecourtPlanes(districtPrograms, boothPlacements, districtStride),
    [districtPrograms, boothPlacements, districtStride]
  );
  const rightSupportBlocks = useMemo(
    () => buildRightSupportBlocks(districtPrograms, boothPlacements, districtStride),
    [districtPrograms, boothPlacements, districtStride]
  );
  const mediaWallLandmarks = useMemo(
    () => buildMediaWallLandmarks(districtPrograms.length, districtStride),
    [districtPrograms.length, districtStride]
  );
  const discoveryEdgeBlocks = useMemo(
    () => buildDiscoveryEdgeBlocks(districtPrograms.length, districtStride),
    [districtPrograms.length, districtStride]
  );
  const supportEdgeBlocks = useMemo(
    () => buildSupportEdgeBlocks(districtPrograms.length, districtStride),
    [districtPrograms.length, districtStride]
  );
  const discoveryLandmarks = useMemo(
    () => buildDiscoveryLandmarks(districtPrograms.length, districtStride),
    [districtPrograms.length, districtStride]
  );
  const discoverySupportTerraces = useMemo(
    () => buildDiscoverySupportTerraces(districtPrograms.length, districtStride),
    [districtPrograms.length, districtStride]
  );
  const discoveryObservatory = useMemo(
    () => buildDiscoveryObservatory(districtPrograms.length, districtStride),
    [districtPrograms.length, districtStride]
  );
  const civicWaterCourt = useMemo(() => buildCivicWaterCourt(), []);
  const signatureMegaLandmarks = useMemo(
    () => buildSignatureMegaLandmarks(districtPrograms.length, districtStride),
    [districtPrograms.length, districtStride]
  );
  const discoverySkybridge = useMemo(
    () => buildDiscoverySkybridge(districtPrograms.length, districtStride),
    [districtPrograms.length, districtStride]
  );
  const cleanTowerLandmarks = useMemo(
    () => buildCleanTowerLandmarks(districtPrograms, boothPlacements, districtStride, visualProfile),
    [districtPrograms, boothPlacements, districtStride, visualProfile]
  );
  const filteredPromenadeAxisPlanes = useMemo(
    () => promenadeAxisPlanes.filter((plane) => !isCentralClutterPlane(plane)),
    [promenadeAxisPlanes]
  );
  const filteredShowcasePlazas = useMemo(
    () => showcasePlazas.filter((plane) => !isCentralClutterPlane(plane)),
    [showcasePlazas]
  );
  const filteredBoothForecourtPlanes = useMemo(
    () => boothForecourtPlanes.filter((plane) => !isCentralClutterPlane(plane)),
    [boothForecourtPlanes]
  );
  const filteredMasses = useMemo(
    () => ([
      ...arrivalGatewayBlocks,
      ...boulevardEdgeBlocks,
      ...mediaWallLandmarks,
      ...signatureMegaLandmarks,
      ...showcaseMonuments,
      ...rightSupportBlocks,
      ...supportEdgeBlocks,
      ...discoveryEdgeBlocks,
      ...discoveryLandmarks,
      ...discoverySupportTerraces,
      ...discoveryObservatory,
      ...discoverySkybridge,
    ]).filter((mass) => !isCentralClutterMass(mass)),
    [
      arrivalGatewayBlocks,
      boulevardEdgeBlocks,
      mediaWallLandmarks,
      signatureMegaLandmarks,
      showcaseMonuments,
      rightSupportBlocks,
      supportEdgeBlocks,
      discoveryEdgeBlocks,
      discoveryLandmarks,
      discoverySupportTerraces,
      discoveryObservatory,
      discoverySkybridge,
    ]
  );

  return (
    <group name="clean-expo-city-skeleton">
      <WorldCityPlanes
        arrivalPlanes={arrivalPlanes}
        promenadeAxisPlanes={filteredPromenadeAxisPlanes}
        showcasePlazas={filteredShowcasePlazas}
        boothForecourtPlanes={filteredBoothForecourtPlanes}
        stadiumReserve={stadiumReserve}
      />
      <WorldCityWaterCourt planes={civicWaterCourt} />
      <WorldCityMasses
        masses={filteredMasses}
        stadiumReserve={stadiumReserve}
      />
      <WorldCityMegaLandmarks districtCount={districtPrograms.length} districtStride={districtStride} />
      <WorldCityTowers towers={cleanTowerLandmarks} stadiumReserve={stadiumReserve} />
    </group>
  );
}
