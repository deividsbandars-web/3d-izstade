export type GroundOwner = 'city' | 'stadium' | 'transition';

export type GroundDetailRibbon = {
  color: string;
  groundOwner: GroundOwner;
  id: string;
  opacity?: number;
  position: [number, number, number];
  size: [number, number];
};

export const GLOBAL_GROUND_SIZE: [number, number] = [16000, 16000];
export const GLOBAL_GROUND_POSITION: [number, number, number] = [0, -0.16, -1800];

export const GROUND_DETAIL_Y = -0.145;
export const GROUND_ACCENT_Y = -0.139;
export const GROUND_SURFACE_MARKER_Y = 0.034;
export const GROUND_DETAIL_DEFAULT_OPACITY = 0.055;
export const GROUND_DETAIL_ACCENT_OPACITY = 0.065;
export const GROUND_DETAIL_MAX_RENDER_OPACITY = 0.08;
export const CITY_STRUCTURAL_GROUND_OPACITY = 0.095;
export const CITY_STRUCTURAL_GROUND_ARRIVAL_OPACITY = 0.085;
export const STADIUM_FORECOURT_GROUND_OPACITY = 0.085;

export function resolveGroundDetailOpacity(ribbon: Pick<GroundDetailRibbon, 'opacity' | 'position'>) {
  const opacity = ribbon.opacity ?? (ribbon.position[1] === GROUND_ACCENT_Y
    ? GROUND_DETAIL_ACCENT_OPACITY
    : GROUND_DETAIL_DEFAULT_OPACITY);
  return Math.min(opacity, GROUND_DETAIL_MAX_RENDER_OPACITY);
}

export const GROUND_DETAIL_RIBBONS: GroundDetailRibbon[] = [
  { id: 'arrival-forecourt-wide-band', position: [0, GROUND_DETAIL_Y, 210], size: [1180, 86], color: '#949fa7', groundOwner: 'city' },
  { id: 'arrival-left-outer-pad', position: [-540, GROUND_DETAIL_Y, 64], size: [280, 520], color: '#858f98', groundOwner: 'city' },
  { id: 'arrival-right-outer-pad', position: [540, GROUND_DETAIL_Y, 64], size: [280, 520], color: '#858f98', groundOwner: 'city' },
  { id: 'arrival-to-seam-spine', position: [0, GROUND_DETAIL_Y, -650], size: [150, 1980], color: '#929da5', groundOwner: 'city' },
  { id: 'arrival-to-seam-left-lane', position: [-270, GROUND_DETAIL_Y, -610], size: [48, 1640], color: '#838e97', groundOwner: 'city' },
  { id: 'arrival-to-seam-right-lane', position: [270, GROUND_DETAIL_Y, -610], size: [48, 1640], color: '#838e97', groundOwner: 'city' },
  { id: 'left-edge-observation-pad', position: [-900, GROUND_DETAIL_Y, -520], size: [640, 1460], color: '#828d96', groundOwner: 'city' },
  { id: 'left-edge-inner-ribbon', position: [-650, GROUND_ACCENT_Y, -520], size: [92, 1380], color: '#97a2aa', groundOwner: 'city' },
  { id: 'left-edge-foreground-cross-band', position: [-920, GROUND_ACCENT_Y, 128], size: [980, 70], color: '#9aa5ad', groundOwner: 'city' },
  { id: 'left-edge-foreground-shadow-band', position: [-920, GROUND_ACCENT_Y, 20], size: [820, 42], color: '#7f8a93', groundOwner: 'city' },
  { id: 'left-edge-front-cross-band', position: [-900, GROUND_ACCENT_Y, -210], size: [820, 56], color: '#98a3ab', groundOwner: 'city' },
  { id: 'left-edge-rear-cross-band', position: [-900, GROUND_ACCENT_Y, -820], size: [760, 52], color: '#808b94', groundOwner: 'city' },
  { id: 'right-edge-observation-pad', position: [900, GROUND_DETAIL_Y, -720], size: [640, 1460], color: '#828d96', groundOwner: 'city' },
  { id: 'sponsor-left-forecourt-ribbon', position: [-410, GROUND_DETAIL_Y, -720], size: [250, 1280], color: '#8b969f', groundOwner: 'city' },
  { id: 'sponsor-right-forecourt-ribbon', position: [410, GROUND_DETAIL_Y, -720], size: [250, 1280], color: '#8b969f', groundOwner: 'city' },
  { id: 'stadium-transition-crosswalk', position: [0, GROUND_SURFACE_MARKER_Y, -1010], size: [1520, 72], color: '#98a3ab', groundOwner: 'transition', opacity: 0.3 },
  { id: 'stadium-transition-back-band', position: [0, GROUND_SURFACE_MARKER_Y, -1240], size: [980, 54], color: '#838e97', groundOwner: 'transition', opacity: 0.28 },
  { id: 'stadium-transition-center-stitch', position: [0, GROUND_SURFACE_MARKER_Y, -1122], size: [1080, 24], color: '#aeb8bf', groundOwner: 'transition', opacity: 0.32 },
  { id: 'stadium-transition-left-service-line', position: [-540, GROUND_SURFACE_MARKER_Y, -1122], size: [28, 420], color: '#75838d', groundOwner: 'transition', opacity: 0.3 },
  { id: 'stadium-transition-right-service-line', position: [540, GROUND_SURFACE_MARKER_Y, -1122], size: [28, 420], color: '#75838d', groundOwner: 'transition', opacity: 0.3 },
  { id: 'stadium-transition-midline', position: [0, GROUND_SURFACE_MARKER_Y, -1410], size: [42, 420], color: '#a0abb3', groundOwner: 'transition', opacity: 0.28 },
  { id: 'stadium-transition-city-ownership-left', position: [-260, GROUND_SURFACE_MARKER_Y, -1074], size: [128, 28], color: '#c2ccd3', groundOwner: 'transition', opacity: 0.32 },
  { id: 'stadium-transition-city-ownership-right', position: [260, GROUND_SURFACE_MARKER_Y, -1074], size: [128, 28], color: '#c2ccd3', groundOwner: 'transition', opacity: 0.32 },
  { id: 'stadium-transition-stadium-ownership-left', position: [-260, GROUND_SURFACE_MARKER_Y, -1186], size: [156, 30], color: '#6f7e89', groundOwner: 'transition', opacity: 0.32 },
  { id: 'stadium-transition-stadium-ownership-right', position: [260, GROUND_SURFACE_MARKER_Y, -1186], size: [156, 30], color: '#6f7e89', groundOwner: 'transition', opacity: 0.32 },
  { id: 'stadium-transition-center-meter-light', position: [0, GROUND_SURFACE_MARKER_Y, -1164], size: [180, 42], color: '#c7d3da', groundOwner: 'transition', opacity: 0.32 },
  { id: 'stadium-transition-center-meter-dark', position: [0, GROUND_SURFACE_MARKER_Y, -1236], size: [180, 42], color: '#6b7a86', groundOwner: 'transition', opacity: 0.32 },
  { id: 'stadium-transition-center-meter-left', position: [-142, GROUND_SURFACE_MARKER_Y, -1296], size: [112, 34], color: '#b8c5cc', groundOwner: 'transition', opacity: 0.3 },
  { id: 'stadium-transition-center-meter-right', position: [142, GROUND_SURFACE_MARKER_Y, -1296], size: [112, 34], color: '#75848f', groundOwner: 'transition', opacity: 0.3 },
  { id: 'stadium-transition-checkpoint-left-a', position: [-420, GROUND_SURFACE_MARKER_Y, -1320], size: [92, 24], color: '#b7c3cb', groundOwner: 'transition', opacity: 0.3 },
  { id: 'stadium-transition-checkpoint-left-b', position: [-148, GROUND_SURFACE_MARKER_Y, -1320], size: [92, 24], color: '#768590', groundOwner: 'transition', opacity: 0.3 },
  { id: 'stadium-transition-checkpoint-right-a', position: [148, GROUND_SURFACE_MARKER_Y, -1320], size: [92, 24], color: '#b7c3cb', groundOwner: 'transition', opacity: 0.3 },
  { id: 'stadium-transition-checkpoint-right-b', position: [420, GROUND_SURFACE_MARKER_Y, -1320], size: [92, 24], color: '#768590', groundOwner: 'transition', opacity: 0.3 },
  { id: 'rear-campus-approach-ribbon', position: [0, GROUND_SURFACE_MARKER_Y, -1640], size: [360, 1040], color: '#89949d', groundOwner: 'stadium' },
  { id: 'stadium-right-flank-approach-band', position: [760, GROUND_SURFACE_MARKER_Y, -2260], size: [520, 44], color: '#9aa6ae', groundOwner: 'stadium', opacity: 0.3 },
  { id: 'stadium-right-flank-service-edge', position: [970, GROUND_SURFACE_MARKER_Y, -2550], size: [52, 620], color: '#75838d', groundOwner: 'stadium', opacity: 0.28 },
  { id: 'stadium-right-flank-cross-tie', position: [820, GROUND_SURFACE_MARKER_Y, -2820], size: [360, 30], color: '#a2adb5', groundOwner: 'stadium', opacity: 0.28 },
];
