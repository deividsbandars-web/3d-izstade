export type GroundOwner = 'city' | 'stadium' | 'transition';

export type GroundDetailRibbon = {
  color: string;
  groundOwner: GroundOwner;
  id: string;
  position: [number, number, number];
  size: [number, number];
};

export const GLOBAL_GROUND_SIZE: [number, number] = [16000, 16000];
export const GLOBAL_GROUND_POSITION: [number, number, number] = [0, -0.16, -1800];

export const GROUND_DETAIL_Y = -0.145;
export const GROUND_ACCENT_Y = -0.139;

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
  { id: 'stadium-transition-crosswalk', position: [0, GROUND_DETAIL_Y, -1010], size: [1520, 72], color: '#98a3ab', groundOwner: 'transition' },
  { id: 'stadium-transition-back-band', position: [0, GROUND_DETAIL_Y, -1240], size: [980, 54], color: '#838e97', groundOwner: 'transition' },
  { id: 'rear-campus-approach-ribbon', position: [0, GROUND_DETAIL_Y, -1640], size: [360, 1040], color: '#89949d', groundOwner: 'stadium' },
];
