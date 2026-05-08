import type { ExpoWorldVisualProfile } from '../../world-contract';

const GLOBAL_GROUND_SIZE: [number, number] = [16000, 16000];
const GLOBAL_GROUND_POSITION: [number, number, number] = [0, -0.16, -1800];
const GROUND_DETAIL_Y = -0.145;
const GROUND_ACCENT_Y = -0.139;

type GroundDetailRibbon = {
  color: string;
  id: string;
  position: [number, number, number];
  size: [number, number];
};

const GROUND_DETAIL_RIBBONS: GroundDetailRibbon[] = [
  { id: 'arrival-forecourt-wide-band', position: [0, GROUND_DETAIL_Y, 210], size: [1180, 86], color: '#9eabb3' },
  { id: 'arrival-left-outer-pad', position: [-540, GROUND_DETAIL_Y, 64], size: [280, 520], color: '#8796a0' },
  { id: 'arrival-right-outer-pad', position: [540, GROUND_DETAIL_Y, 64], size: [280, 520], color: '#8796a0' },
  { id: 'arrival-to-seam-spine', position: [0, GROUND_DETAIL_Y, -650], size: [150, 1980], color: '#96a5af' },
  { id: 'arrival-to-seam-left-lane', position: [-270, GROUND_DETAIL_Y, -610], size: [48, 1640], color: '#7f8e98' },
  { id: 'arrival-to-seam-right-lane', position: [270, GROUND_DETAIL_Y, -610], size: [48, 1640], color: '#7f8e98' },
  { id: 'left-edge-observation-pad', position: [-900, GROUND_DETAIL_Y, -520], size: [640, 1460], color: '#81919b' },
  { id: 'left-edge-inner-ribbon', position: [-650, GROUND_ACCENT_Y, -520], size: [92, 1380], color: '#9daab2' },
  { id: 'left-edge-foreground-cross-band', position: [-920, GROUND_ACCENT_Y, 128], size: [980, 70], color: '#aab6bd' },
  { id: 'left-edge-foreground-shadow-band', position: [-920, GROUND_ACCENT_Y, 20], size: [820, 42], color: '#6f808b' },
  { id: 'left-edge-front-cross-band', position: [-900, GROUND_ACCENT_Y, -210], size: [820, 56], color: '#a6b2ba' },
  { id: 'left-edge-rear-cross-band', position: [-900, GROUND_ACCENT_Y, -820], size: [760, 52], color: '#74858f' },
  { id: 'right-edge-observation-pad', position: [900, GROUND_DETAIL_Y, -720], size: [640, 1460], color: '#81919b' },
  { id: 'sponsor-left-forecourt-ribbon', position: [-410, GROUND_DETAIL_Y, -720], size: [250, 1280], color: '#8d9aa3' },
  { id: 'sponsor-right-forecourt-ribbon', position: [410, GROUND_DETAIL_Y, -720], size: [250, 1280], color: '#8d9aa3' },
  { id: 'stadium-transition-crosswalk', position: [0, GROUND_DETAIL_Y, -1010], size: [1520, 72], color: '#a0adb5' },
  { id: 'stadium-transition-back-band', position: [0, GROUND_DETAIL_Y, -1240], size: [980, 54], color: '#81909a' },
  { id: 'rear-campus-approach-ribbon', position: [0, GROUND_DETAIL_Y, -1640], size: [360, 1040], color: '#8a98a1' },
];

function GroundDetailRibbons() {
  return (
    <group name="world-ground:global-guide-ribbons">
      {GROUND_DETAIL_RIBBONS.map((ribbon) => (
        <mesh
          key={ribbon.id}
          name={`world-ground-guide:${ribbon.id}`}
          position={ribbon.position}
          receiveShadow={false}
          renderOrder={3}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <planeGeometry args={ribbon.size} />
          <meshStandardMaterial color={ribbon.color} roughness={0.94} metalness={0.01} />
        </mesh>
      ))}
    </group>
  );
}

export function WorldGroundPlane({ visualProfile }: { visualProfile: ExpoWorldVisualProfile }) {
  return (
    <group name="world-ground:global">
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={GLOBAL_GROUND_POSITION} receiveShadow={false} name="world-ground:global-base">
        <planeGeometry args={GLOBAL_GROUND_SIZE} />
        <meshStandardMaterial color={visualProfile.global.groundBase} roughness={0.98} metalness={0.01} />
      </mesh>
      <GroundDetailRibbons />
    </group>
  );
}
