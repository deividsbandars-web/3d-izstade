import type { ExpoBoothPlacement } from '../layout-engine.js';
import type { ExpoDistrictProgramSummary } from '../world-contract.js';

export type ExpoCuratedPropKey =
  | 'planter'
  | 'bench'
  | 'bench_cushion_low'
  | 'light_square'
  | 'light_square_double'
  | 'light_curved'
  | 'sign_highway'
  | 'sign_highway_wide'
  | 'info_kiosk_base_computer_screen'
  | 'bush'
  | 'big_bush';

export interface ExpoCuratedPropPlacement {
  accentColor?: string;
  assetKey: ExpoCuratedPropKey;
  decorationKind?: 'district-sign' | 'district-sign-wide' | 'info-kiosk';
  id: string;
  label?: string;
  position: [number, number, number];
  rotationY: number;
  scale: number;
  subLabel?: string;
}

type SectorMarker = {
  clusterIndex?: number;
  color: string;
  districtTheme: {
    accentColor: string;
    name: string;
  };
  id: string;
  label: string;
  position: [number, number, number];
  sectorId?: string | null;
  side: 'left' | 'right';
};

function round3(value: number) {
  return Number(value.toFixed(3));
}

export function buildExpoCuratedPropPlacements(
  boothPlacements: ExpoBoothPlacement[],
  sectorMarkers: SectorMarker[],
  districtPrograms: ExpoDistrictProgramSummary[] = [],
  options: { showcase?: boolean } = {}
) {
  const placements: ExpoCuratedPropPlacement[] = [];
  const showcase = options.showcase === true;
  const corridorHalfWidth = 34;

  sectorMarkers.forEach((marker, index) => {
    const district = districtPrograms.find((entry) => entry.sectorId === marker.sectorId)
      ?? districtPrograms.find((entry) => entry.clusterIndex === marker.clusterIndex)
      ?? districtPrograms.find((entry) => entry.clusterIndex === index);
    const roles = new Set((district?.programTargets ?? []).filter((target) => target.allocated > 0).map((target) => target.role));
    const calmDistrict = district?.expressionMode === 'calm-dwell' || roles.has('meeting_pod') || roles.has('networking_lounge');
    const scenicDistrict = district?.expressionMode === 'scenic' || (roles.has('scenic_showcase') && !roles.has('demo_stage'));
    const orientationDistrict = district?.expressionMode === 'orientation';
    const featureCourtDistrict = district?.expressionMode === 'feature-court';
    const activeDistrict = district?.expressionMode === 'active-commercial';
    const side = marker.side === 'left' ? -1 : 1;
    const edgeX = side * (corridorHalfWidth + 12);
    const accentX = side * (corridorHalfWidth + 20);
    const signRotation = side === -1 ? Math.PI * 0.48 : -Math.PI * 0.48;

    placements.push(
      {
        assetKey: index % 2 === 0 ? 'light_square_double' : 'light_square',
        id: `sector-light-${marker.id}`,
        position: [round3(edgeX), 0, round3(marker.position[2] - 3)],
        rotationY: signRotation,
        scale: 1.15,
      },
      {
        assetKey: 'sign_highway_wide',
        accentColor: marker.color || marker.districtTheme.accentColor,
        decorationKind: 'district-sign-wide',
        id: `sector-sign-${marker.id}`,
        label: marker.label,
        position: [round3(edgeX), 0, round3(marker.position[2] + 7)],
        rotationY: signRotation,
        scale: 0.9,
        subLabel: marker.districtTheme.name === marker.label ? 'SPONSOR DISTRICT' : marker.districtTheme.name,
      },
      {
        assetKey: calmDistrict ? 'bench_cushion_low' : orientationDistrict ? 'light_square_double' : 'planter',
        id: `sector-planter-${marker.id}`,
        position: [round3(accentX), 0, round3(marker.position[2] + 1.5)],
        rotationY: 0,
        scale: calmDistrict ? 1.05 : orientationDistrict ? 1.04 : 1.2,
      },
      {
        assetKey: scenicDistrict || featureCourtDistrict ? (side === -1 ? 'light_curved' : 'big_bush') : side === -1 ? 'planter' : 'bush',
        id: `sector-greenery-${marker.id}`,
        position: [round3(side * (corridorHalfWidth + 30)), 0, round3(marker.position[2] - 10)],
        rotationY: 0,
        scale: scenicDistrict || featureCourtDistrict ? 1.18 : side === -1 ? 1.1 : 1.8,
      }
    );

    if (showcase || scenicDistrict || featureCourtDistrict) {
      placements.push({
        assetKey: 'light_curved',
        id: `sector-curved-light-${marker.id}`,
        position: [round3(side * (corridorHalfWidth + 26)), 0, round3(marker.position[2] + 18)],
        rotationY: side === -1 ? Math.PI * 0.35 : -Math.PI * 0.35,
        scale: scenicDistrict || featureCourtDistrict ? 1.24 : 1.1,
      });
    }

    if (activeDistrict || orientationDistrict) {
      placements.push({
        assetKey: 'info_kiosk_base_computer_screen',
        accentColor: marker.color || marker.districtTheme.accentColor,
        decorationKind: 'info-kiosk',
        id: `sector-info-${marker.id}`,
        label: marker.label,
        position: [round3(side * (corridorHalfWidth + 24)), 0, round3(marker.position[2] - 14)],
        rotationY: signRotation,
        scale: 0.96,
        subLabel: activeDistrict ? 'LIVE PROGRAM' : 'WAYFINDING',
      });
    }

    if (scenicDistrict || featureCourtDistrict) {
      placements.push({
        assetKey: 'sign_highway',
        accentColor: marker.color || marker.districtTheme.accentColor,
        decorationKind: 'district-sign',
        id: `sector-portal-${marker.id}`,
        label: scenicDistrict ? 'SCENIC WALK' : 'FEATURE COURT',
        position: [round3(side * (corridorHalfWidth + 18)), 0, round3(marker.position[2] + 24)],
        rotationY: signRotation,
        scale: 0.92,
        subLabel: scenicDistrict ? 'DISCOVERY EDGE' : 'SINGLE-FRONT MOMENT',
      });
    }
  });

  boothPlacements.forEach((placement, index) => {
    const side = placement.position[0] < 0 ? -1 : 1;
    const edgeBaseX = placement.position[0] + side * 20;
    const edgeDeepX = placement.position[0] + side * 28;
    const facingRotation = side === -1 ? Math.PI * 0.42 : -Math.PI * 0.42;

    if (placement.nodeType === 'hero_left' || placement.nodeType === 'hero_right') {
      placements.push(
        {
          assetKey: 'bench_cushion_low',
          id: `hero-bench-${placement.id}`,
          position: [round3(edgeBaseX), 0, round3(placement.position[2] + 14)],
          rotationY: facingRotation,
          scale: 1.1,
        },
        {
          assetKey: 'info_kiosk_base_computer_screen',
          accentColor: placement.color,
          decorationKind: 'info-kiosk',
          id: `hero-kiosk-${placement.id}`,
          label: placement.company?.name ? String(placement.company.name) : 'Sponsor Info',
          position: [round3(edgeDeepX), 0, round3(placement.position[2] + 4)],
          rotationY: facingRotation,
          scale: 1.1,
          subLabel: placement.sectorName ? `${String(placement.sectorName).toUpperCase()} INFO` : 'MEETINGS + DEMOS',
        },
        {
          assetKey: showcase ? 'big_bush' : 'bush',
          id: `hero-bush-${placement.id}`,
          position: [round3(edgeDeepX), 0, round3(placement.position[2] - 14)],
          rotationY: 0,
          scale: showcase ? 1.55 : 1.25,
        }
      );
      return;
    }

    placements.push(
      {
        assetKey: 'bench',
        id: `bench-${placement.id}`,
        position: [round3(edgeBaseX), 0, round3(placement.position[2] + ((index % 2 === 0) ? 9 : -9))],
        rotationY: facingRotation,
        scale: 1,
      },
      {
        assetKey: index % 2 === 0 ? 'planter' : 'bush',
        id: `edge-accent-${placement.id}`,
        position: [round3(edgeDeepX), 0, round3(placement.position[2] - ((index % 2 === 0) ? 11 : 13))],
        rotationY: 0,
        scale: index % 2 === 0 ? 1.1 : 1.4,
      }
    );

    if (showcase && placement.nodeType === 'endcap') {
      placements.push({
        assetKey: 'light_curved',
        id: `endcap-feature-${placement.id}`,
        position: [round3(edgeDeepX + (side * 4)), 0, round3(placement.position[2] - 20)],
        rotationY: 0,
        scale: 1.06,
      });
    }
  });

  return placements;
}
