import type { ExpoBoothPlacement } from '../sceneWorld.js';

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
  | 'tree_small'
  | 'tree_large'
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
  color: string;
  districtTheme: {
    accentColor: string;
    name: string;
  };
  id: string;
  label: string;
  position: [number, number, number];
  side: 'left' | 'right';
};

function round3(value: number) {
  return Number(value.toFixed(3));
}

export function buildExpoCuratedPropPlacements(
  boothPlacements: ExpoBoothPlacement[],
  sectorMarkers: SectorMarker[],
  options: { showcase?: boolean } = {}
) {
  const placements: ExpoCuratedPropPlacement[] = [];
  const showcase = options.showcase === true;
  const corridorHalfWidth = 34;

  sectorMarkers.forEach((marker, index) => {
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
        assetKey: 'planter',
        id: `sector-planter-${marker.id}`,
        position: [round3(accentX), 0, round3(marker.position[2] + 1.5)],
        rotationY: 0,
        scale: 1.2,
      },
      {
        assetKey: side === -1 ? 'tree_small' : 'bush',
        id: `sector-greenery-${marker.id}`,
        position: [round3(side * (corridorHalfWidth + 30)), 0, round3(marker.position[2] - 10)],
        rotationY: 0,
        scale: side === -1 ? 1.2 : 1.8,
      }
    );

    if (showcase) {
      placements.push({
        assetKey: 'light_curved',
        id: `sector-curved-light-${marker.id}`,
        position: [round3(side * (corridorHalfWidth + 26)), 0, round3(marker.position[2] + 18)],
        rotationY: side === -1 ? Math.PI * 0.35 : -Math.PI * 0.35,
        scale: 1.1,
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
        assetKey: 'tree_large',
        id: `endcap-tree-${placement.id}`,
        position: [round3(edgeDeepX + (side * 4)), 0, round3(placement.position[2] - 20)],
        rotationY: 0,
        scale: 0.9,
      });
    }
  });

  return placements;
}
