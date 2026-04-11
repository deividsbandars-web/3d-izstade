import { useEffect, useMemo } from 'react';
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

declare global {
  interface Window {
    __WARPALA_EXPO_INSPECT_SOURCES__?: {
      city?: Array<{ id: string; layer: string; position: [number, number, number] }>;
      stadium?: Array<{ id: string; layer: string; position: [number, number, number] }>;
    };
  }
}

const CENTRAL_CLUTTER_PLANE_PATTERNS = [
  'arrival-terminal',
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
  'promenade-axis-outer-left',
  'promenade-axis-outer-right',
  'promenade-axis-threshold',
  'promenade-axis-terminal',
  'promenade-axis-transition',
  'promenade-axis-endcap',
];

const CENTRAL_CLUTTER_MASS_PATTERNS = [
  'gateway-mid-plinth',
  'gateway-front',
  'gateway-inner',
  'gateway-rear-band',
  'gateway-lintel',
  'gateway-node',
  'gateway-outer',
  'showcase-forum-plinth',
  'showcase-terrace',
  'showcase-obelisk',
  'showcase-dais',
  'showcase-forum-rear',
  'showcase-wing',
  'showcase-outer-marker',
  'showcase-front-threshold-center',
  'media-wall-bridge',
  'media-wall-plinth',
  'media-wall-apron',
  'media-wall-gallery',
  'media-wall-center-link',
  'media-wall-front-node',
  'media-wall-forecourt-band',
  'media-wall-front-threshold',
  'media-wall-outer-marker',
  'media-wall-side-dais',
  'discovery-axis-plinth',
  'discovery-front-threshold-center',
  'discovery-front-court',
  'discovery-terrace-center',
  'discovery-terrace-center-step',
  'discovery-viewing-step',
  'discovery-approach-plinth',
  'discovery-overlook-band',
  'discovery-overlook-center-band',
  'discovery-overlook-anchor',
  'discovery-inner-step',
  'discovery-side-node',
  'discovery-outer-platform',
  'discovery-observatory-plinth',
  'discovery-observatory-front-pad',
  'discovery-observatory-wing',
  'discovery-observatory-rear-band',
  'discovery-observatory-side-left',
  'discovery-observatory-side-right',
  'discovery-observatory-rear-anchor-left',
  'discovery-observatory-rear-anchor-right',
  'media-wall-node-left',
  'media-wall-node-right',
  'media-wall-rear-node-left',
  'media-wall-rear-node-right',
  'center-transition-rear-left',
  'center-transition-rear-right',
  'signature-mega-front-court',
  'signature-mega-dais',
  'signature-mega-outer-node',
  'support-band',
  'support-link',
  'support-center-marker',
  'support-transition-court',
];

const HIDDEN_CITY_MASS_IDS = new Set([
  'arrival-gateway-lintel',
  'arrival-gateway-node-left',
  'arrival-gateway-node-right',
  'arrival-gateway-rear-band',
  'arrival-gateway-beacon-right',
  'arrival-gateway-mid-plinth',
  'arrival-gateway-outer-left',
  'arrival-gateway-outer-right',
  'arrival-gateway-front-left',
  'arrival-gateway-front-right',
  'arrival-gateway-inner-left',
  'arrival-gateway-inner-right',
  'arrival-gateway-left',
  'arrival-gateway-right',
  'arrival-core-showcase-rear-pylon-left',
  'arrival-core-showcase-rear-pylon-right',
  'arrival-core-showcase-outer-marker-left',
  'arrival-core-support-band-left',
  'arrival-core-support-band-right',
  'arrival-core-support-center-marker',
  'arrival-gateway-beacon-left',
  'arrival-core-center-transition-left',
  'arrival-core-center-transition-right',
  'discovery-hero-plinth-right',
  'discovery-observatory-neck',
  'media-wall-rear-node-right-1',
  'media-wall-right-2',
  'media-wall-left-1',
  'discovery-overlook-left',
  'discovery-overlook-right',
  'discovery-side-node-left',
  'discovery-observatory-deck',
  'discovery-skybridge-span',
  'discovery-observatory-beacon-left',
  'discovery-observatory-beacon-right',
  'discovery-rear-link-left',
  'discovery-rear-link-right',
  'discovery-spire-collar',
]);

const HIDDEN_CITY_PLANE_IDS = new Set([
  'arrival-core-showcase-main',
  'arrival-core-showcase-rear-carpet-left',
  'arrival-core-showcase-step-left',
  'arrival-core-showcase-step-right',
  'arrival-left',
  'arrival-core-showcase-rear-band',
  'arrival-main',
  'arrival-right',
  'arrival-spine',
  'promenade-axis-cross-0',
]);

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
  sectionToggles = { arrival: true, left: true, middle: true, right: true },
  visualProfile,
}: {
  boothPlacements: ExpoBoothPlacement[];
  districtPrograms: ExpoDistrictProgramSummary[];
  playerPosition?: [number, number, number];
  sectionToggles?: {
    arrival: boolean;
    left: boolean;
    middle: boolean;
    right: boolean;
  };
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
  const isVisibleSection = (position: [number, number, number]) => {
    if (position[2] > 120) {
      return sectionToggles.arrival;
    }
    if (position[0] < -260) {
      return sectionToggles.left;
    }
    if (position[0] > 260) {
      return sectionToggles.right;
    }
    return sectionToggles.middle;
  };
  const filteredPromenadeAxisPlanes = useMemo(
    () => promenadeAxisPlanes.filter((plane) => !isCentralClutterPlane(plane) && !HIDDEN_CITY_PLANE_IDS.has(plane.id) && isVisibleSection(plane.position)),
    [promenadeAxisPlanes, sectionToggles]
  );
  const filteredShowcasePlazas = useMemo(
    () => showcasePlazas.filter((plane) => !isCentralClutterPlane(plane) && !HIDDEN_CITY_PLANE_IDS.has(plane.id) && isVisibleSection(plane.position)),
    [sectionToggles, showcasePlazas]
  );
  const filteredBoothForecourtPlanes = useMemo(
    () => boothForecourtPlanes.filter((plane) => !isCentralClutterPlane(plane) && !HIDDEN_CITY_PLANE_IDS.has(plane.id) && isVisibleSection(plane.position)),
    [boothForecourtPlanes, sectionToggles]
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
    ]).filter((mass) => !isCentralClutterMass(mass) && !HIDDEN_CITY_MASS_IDS.has(mass.id) && isVisibleSection(mass.position)),
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
      sectionToggles,
    ]
  );
  const filteredArrivalPlanes = useMemo(
    () => arrivalPlanes.filter((plane) => !HIDDEN_CITY_PLANE_IDS.has(plane.id) && !isCentralClutterPlane(plane) && isVisibleSection(plane.position)),
    [arrivalPlanes, sectionToggles]
  );
  const filteredCivicWaterCourt = useMemo(
    () => civicWaterCourt.filter((plane) => isVisibleSection(plane.position)),
    [civicWaterCourt, sectionToggles]
  );
  const filteredTowerLandmarks = useMemo(
    () => cleanTowerLandmarks.filter((tower) => isVisibleSection(tower.position)),
    [cleanTowerLandmarks, sectionToggles]
  );

  useEffect(() => {
    const cityEntries = [
      ...filteredArrivalPlanes.map((plane) => ({ id: plane.id, layer: 'city-plane', position: plane.position })),
      ...filteredPromenadeAxisPlanes.map((plane) => ({ id: plane.id, layer: 'city-plane', position: plane.position })),
      ...filteredShowcasePlazas.map((plane) => ({ id: plane.id, layer: 'city-plane', position: plane.position })),
      ...filteredBoothForecourtPlanes.map((plane) => ({ id: plane.id, layer: 'city-plane', position: plane.position })),
      ...filteredMasses.map((mass) => ({ id: mass.id, layer: 'city-mass', position: mass.position })),
      ...filteredTowerLandmarks.map((tower) => ({ id: tower.id, layer: 'city-tower', position: tower.position })),
      { id: 'mega-landmark-arrival', layer: 'mega-landmark', position: [0, 0, 256] as [number, number, number] },
      { id: 'mega-landmark-showcase', layer: 'mega-landmark', position: [0, 0, -72] as [number, number, number] },
      { id: 'mega-landmark-media', layer: 'mega-landmark', position: [0, 0, -214 - districtStride - 56] as [number, number, number] },
      { id: 'mega-landmark-discovery', layer: 'mega-landmark', position: [0, 0, -196 - ((Math.max(1, districtPrograms.length) - 1) * districtStride) - 1080] as [number, number, number] },
    ];

    window.__WARPALA_EXPO_INSPECT_SOURCES__ = {
      ...(window.__WARPALA_EXPO_INSPECT_SOURCES__ ?? {}),
      city: cityEntries,
    };

    return () => {
      if (window.__WARPALA_EXPO_INSPECT_SOURCES__) {
        window.__WARPALA_EXPO_INSPECT_SOURCES__.city = [];
      }
    };
  }, [
    filteredArrivalPlanes,
    filteredTowerLandmarks,
    districtPrograms.length,
    districtStride,
    filteredBoothForecourtPlanes,
    filteredMasses,
    filteredPromenadeAxisPlanes,
    filteredShowcasePlazas,
  ]);

  return (
    <group name="clean-expo-city-skeleton">
      <WorldCityPlanes
        arrivalPlanes={filteredArrivalPlanes}
        promenadeAxisPlanes={filteredPromenadeAxisPlanes}
        showcasePlazas={filteredShowcasePlazas}
        boothForecourtPlanes={filteredBoothForecourtPlanes}
        stadiumReserve={stadiumReserve}
      />
      <WorldCityWaterCourt planes={filteredCivicWaterCourt} />
      <WorldCityMasses
        masses={filteredMasses}
        stadiumReserve={stadiumReserve}
      />
      <WorldCityMegaLandmarks districtCount={districtPrograms.length} districtStride={districtStride} sectionToggles={sectionToggles} />
      <WorldCityTowers towers={filteredTowerLandmarks} stadiumReserve={stadiumReserve} />
    </group>
  );
}
