import type { StadiumReserve } from '../planning/types';
import {
  buildWorldCityMegaLandmarkBounds,
  filterWorldCityMegaLandmarkBounds,
} from './WorldCityMegaLandmarkBounds';

type WorldCityMegaLandmarksProps = {
  districtCount: number;
  districtStride: number;
  stadiumReserve: StadiumReserve;
  sectionToggles?: {
    arrival: boolean;
    left: boolean;
    middle: boolean;
    right: boolean;
  };
};

type LandmarkCompositionGroup =
  | 'arrival'
  | 'showcase'
  | 'media'
  | 'discovery'
  | 'right-citadel'
  | 'right-skybridge'
  | 'right-halo'
  | 'left-crown'
  | 'left-disc'
  | 'left-rampart'
  | 'left-cantilever'
  | 'left-monolith'
  | 'left-broken-wall';

const HIDDEN_LANDMARK_COMPOSITION: Record<LandmarkCompositionGroup, string[]> = {
  arrival: [
    'mega-landmark:arrival-base',
    'mega-landmark:arrival-plinth',
    'mega-landmark:arrival-core',
    'mega-landmark:arrival-support-left',
    'mega-landmark:arrival-support-right',
    'mega-landmark:arrival-accent-left',
    'mega-landmark:arrival-accent-right',
    'mega-landmark:arrival-ring-outer',
    'mega-landmark:arrival-ring-inner',
  ],
  showcase: [
    'mega-landmark:showcase-base',
    'mega-landmark:showcase-plinth',
    'mega-landmark:showcase-ring-outer',
    'mega-landmark:showcase-ring-inner',
    'mega-landmark:showcase-beam',
    'mega-landmark:showcase-inner-support-left',
    'mega-landmark:showcase-inner-support-right',
    'mega-landmark:showcase-support-left',
    'mega-landmark:showcase-support-right',
    'mega-landmark:showcase-base-bar',
    'mega-landmark:showcase-side-accent-left',
    'mega-landmark:showcase-side-accent-right',
    'mega-landmark:showcase-outer-accent-left',
    'mega-landmark:showcase-outer-accent-right',
  ],
  media: [
    'mega-landmark:media-base',
    'mega-landmark:media-plinth',
    'mega-landmark:media-support-left',
    'mega-landmark:media-support-right',
    'mega-landmark:media-spire-left',
    'mega-landmark:media-spire-right',
    'mega-landmark:media-side-accent-left',
    'mega-landmark:media-side-accent-right',
    'mega-landmark:media-outer-accent-left',
    'mega-landmark:media-outer-accent-right',
  ],
  discovery: [
    'mega-landmark:discovery-base',
    'mega-landmark:discovery-plinth',
    'mega-landmark:discovery-support-left',
    'mega-landmark:discovery-support-right',
    'mega-landmark:discovery-outer-accent-left',
    'mega-landmark:discovery-outer-accent-right',
    'mega-landmark:discovery-side-accent-left',
    'mega-landmark:discovery-side-accent-right',
    'mega-landmark:discovery-spine-base',
    'mega-landmark:discovery-spine-left-garden',
    'mega-landmark:discovery-spine-ribbon',
  ],
  'right-citadel': [
    'mega-landmark:right-citadel-fin-left',
    'mega-landmark:right-citadel-fin-right',
  ],
  'right-skybridge': [
    'mega-landmark:right-skybridge-side-fin-left',
    'mega-landmark:right-skybridge-side-fin-right',
    'mega-landmark:right-skybridge-terrace-left',
    'mega-landmark:right-skybridge-terrace-right',
  ],
  'right-halo': [
    'mega-landmark:right-media-halo-plinth',
    'mega-landmark:right-media-halo-fin-left',
    'mega-landmark:right-media-halo-fin-right',
  ],
  'left-crown': [
    'mega-landmark:left-split-crown-fin-left',
    'mega-landmark:left-split-crown-fin-right',
  ],
  'left-disc': [],
  'left-rampart': [],
  'left-cantilever': [],
  'left-monolith': [],
  'left-broken-wall': [],
};

function buildHiddenLandmarkParts() {
  return new Set(Object.values(HIDDEN_LANDMARK_COMPOSITION).flat());
}

function tintHex(hex: string, ratio: number) {
  const normalized = hex.replace('#', '').padStart(6, '0').slice(0, 6);
  const channel = (index: number) => parseInt(normalized.slice(index, index + 2), 16);
  const mix = (value: number) => Math.max(0, Math.min(255, Math.round(value + ((255 - value) * ratio))));
  return `#${[mix(channel(0)), mix(channel(2)), mix(channel(4))].map((value) => value.toString(16).padStart(2, '0')).join('')}`;
}

function shadeHex(hex: string, ratio: number) {
  const normalized = hex.replace('#', '').padStart(6, '0').slice(0, 6);
  const channel = (index: number) => parseInt(normalized.slice(index, index + 2), 16);
  const mix = (value: number) => Math.max(0, Math.min(255, Math.round(value * (1 - ratio))));
  return `#${[mix(channel(0)), mix(channel(2)), mix(channel(4))].map((value) => value.toString(16).padStart(2, '0')).join('')}`;
}

function LandmarkMaterial({
  color,
  emissive = '#000000',
  emissiveIntensity = 0,
  variant = 'default',
}: {
  color: string;
  emissive?: string;
  emissiveIntensity?: number;
  variant?: 'default' | 'subdued';
}) {
  const baseColor = variant === 'subdued'
    ? shadeHex(color, 0.18)
    : tintHex(color, emissiveIntensity >= 0.08 ? 0.1 : emissiveIntensity >= 0.03 ? 0.06 : 0.03);
  const resolvedColor = variant === 'subdued'
    ? tintHex(baseColor, emissiveIntensity >= 0.08 ? 0.03 : 0)
    : baseColor;
  return (
    <meshStandardMaterial
      color={resolvedColor}
      emissive={emissive}
      emissiveIntensity={variant === 'subdued' ? emissiveIntensity * 0.45 : emissiveIntensity}
      metalness={0.12}
      roughness={variant === 'subdued' ? 0.64 : 0.56}
    />
  );
}

export function WorldCityMegaLandmarks({
  districtCount,
  districtStride,
  stadiumReserve,
  sectionToggles = { arrival: true, left: true, middle: true, right: true },
}: WorldCityMegaLandmarksProps) {
  const hiddenLandmarkParts = buildHiddenLandmarkParts();
  const visibleLandmarkIds = new Set(
    filterWorldCityMegaLandmarkBounds(
      buildWorldCityMegaLandmarkBounds({ districtCount, districtStride }),
      stadiumReserve,
    ).map((landmark) => landmark.id),
  );
  const isLandmarkVisible = (id: string) => visibleLandmarkIds.has(id);
  const arrivalBaseZ = 256;
  const showcaseBaseZ = 32;
  const discoveryBaseZ = -196 - ((Math.max(1, districtCount) - 1) * districtStride) - 1080;
  const mediaBaseZ = -214 - districtStride - 260;
  const mediaFrameBase: [number, number, number] = [860, 0, mediaBaseZ - 148];
  const mediaPodsBase: [number, number, number] = [500, 0, mediaBaseZ + 222];
  const discoveryCrownBase: [number, number, number] = [-368, 0, discoveryBaseZ - 32];
  const discoverySpineBase: [number, number, number] = [-492, 0, discoveryBaseZ + 212];
  const rightCitadelBase: [number, number, number] = [844, 0, -164];
  const leftDiscBase: [number, number, number] = [-940, 0, -600];
  const rightBeaconBase: [number, number, number] = [580, 0, 30];
  const rightHaloBase: [number, number, number] = [1120, 0, -400];
  const rightSupportBase: [number, number, number] = [360, 0, -460];
  const leftRampartBase: [number, number, number] = [-870, 0, -80];
  const leftMonolithBase: [number, number, number] = [-700, 0, -1030];
  const leftForumBase: [number, number, number] = [-520, 0, -48];
  const leftCrownBase: [number, number, number] = [-1450, 0, -415];
  const leftSupportBase: [number, number, number] = [-420, 0, -480];

  return (
    <group name="world-city-mega-landmarks">
      {sectionToggles.arrival && isLandmarkVisible('mega-landmark-arrival') && <group name="mega-landmark:arrival" position={[0, 0, arrivalBaseZ]}>
        {!hiddenLandmarkParts.has('mega-landmark:arrival-base') && (
        <mesh name="mega-landmark:arrival-base" position={[0, 8, 0]}>
          <boxGeometry args={[148, 6, 22]} />
          <LandmarkMaterial color="#edf4f8" emissive="#67e8f9" emissiveIntensity={0.018} />
        </mesh>
        )}
        {!hiddenLandmarkParts.has('mega-landmark:arrival-ring-outer') && (
        <mesh name="mega-landmark:arrival-ring-outer" position={[0, 174, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[112, 12, 16, 48]} />
          <LandmarkMaterial color="#e2edf4" emissive="#67e8f9" emissiveIntensity={0.08} />
        </mesh>
        )}
        {!hiddenLandmarkParts.has('mega-landmark:arrival-ring-inner') && (
        <mesh name="mega-landmark:arrival-ring-inner" position={[0, 126, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[74, 5, 12, 36]} />
          <LandmarkMaterial color="#edf4f8" emissive="#67e8f9" emissiveIntensity={0.04} />
        </mesh>
        )}
        {!hiddenLandmarkParts.has('mega-landmark:arrival-core') && (
        <mesh name="mega-landmark:arrival-core" position={[0, 54, 0]}>
          <cylinderGeometry args={[8, 12, 108, 18]} />
          <LandmarkMaterial color="#8ea2af" />
        </mesh>
        )}
        {!hiddenLandmarkParts.has('mega-landmark:arrival-support-left') && (
        <mesh name="mega-landmark:arrival-support-left" position={[-148, 102, 0]}>
          <boxGeometry args={[18, 204, 18]} />
          <LandmarkMaterial color="#d8e4ec" />
        </mesh>
        )}
        {!hiddenLandmarkParts.has('mega-landmark:arrival-support-right') && (
        <mesh name="mega-landmark:arrival-support-right" position={[148, 102, 0]}>
          <boxGeometry args={[18, 204, 18]} />
          <LandmarkMaterial color="#d8e4ec" />
        </mesh>
        )}
        {!hiddenLandmarkParts.has('mega-landmark:arrival-plinth') && (
        <mesh name="mega-landmark:arrival-plinth" position={[0, 12, 0]}>
          <boxGeometry args={[84, 6, 12]} />
          <LandmarkMaterial color="#d9e4eb" />
        </mesh>
        )}
        {!hiddenLandmarkParts.has('mega-landmark:arrival-accent-left') && (
        <mesh name="mega-landmark:arrival-accent-left" position={[-92, 46, 18]}>
          <boxGeometry args={[12, 92, 12]} />
          <LandmarkMaterial color="#edf4f8" emissive="#67e8f9" emissiveIntensity={0.05} />
        </mesh>
        )}
        {!hiddenLandmarkParts.has('mega-landmark:arrival-accent-right') && (
        <mesh name="mega-landmark:arrival-accent-right" position={[92, 46, 12]}>
          <boxGeometry args={[12, 92, 12]} />
          <LandmarkMaterial color="#edf4f8" emissive="#67e8f9" emissiveIntensity={0.05} />
        </mesh>
        )}
      </group>}

      {sectionToggles.middle && isLandmarkVisible('mega-landmark-showcase') && <group name="mega-landmark:showcase" position={[0, 0, showcaseBaseZ]}>
        {!hiddenLandmarkParts.has('mega-landmark:showcase-base') && (
        <mesh name="mega-landmark:showcase-base" position={[0, 12, 0]}>
          <boxGeometry args={[176, 10, 20]} />
          <LandmarkMaterial color="#f2f7fa" emissive="#c084fc" emissiveIntensity={0.02} />
        </mesh>
        )}
        {!hiddenLandmarkParts.has('mega-landmark:showcase-plinth') && (
        <mesh name="mega-landmark:showcase-plinth" position={[0, 18, -6]}>
          <boxGeometry args={[132, 10, 20]} />
          <LandmarkMaterial color="#dde7ed" />
        </mesh>
        )}
        {!hiddenLandmarkParts.has('mega-landmark:showcase-ring-outer') && (
        <mesh name="mega-landmark:showcase-ring-outer" position={[0, 162, 0]} rotation={[0, 0, Math.PI / 2]}>
          <torusGeometry args={[122, 10, 16, 42]} />
          <LandmarkMaterial color="#f7f3fb" emissive="#c084fc" emissiveIntensity={0.14} />
        </mesh>
        )}
        {!hiddenLandmarkParts.has('mega-landmark:showcase-ring-inner') && (
        <mesh name="mega-landmark:showcase-ring-inner" position={[0, 118, 0]} rotation={[0, 0, Math.PI / 2]}>
          <torusGeometry args={[82, 5, 12, 36]} />
          <LandmarkMaterial color="#edf4f8" emissive="#c084fc" emissiveIntensity={0.05} />
        </mesh>
        )}
        {!hiddenLandmarkParts.has('mega-landmark:showcase-beam') && (
        <mesh name="mega-landmark:showcase-beam" position={[0, 78, 0]}>
          <boxGeometry args={[138, 10, 14]} />
          <LandmarkMaterial color="#eef4f8" emissive="#c084fc" emissiveIntensity={0.03} />
        </mesh>
        )}
        {!hiddenLandmarkParts.has('mega-landmark:showcase-inner-support-left') && (
        <mesh name="mega-landmark:showcase-inner-support-left" position={[-66, 38, 0]}>
          <boxGeometry args={[12, 76, 12]} />
          <LandmarkMaterial color="#e4edf3" />
        </mesh>
        )}
        {!hiddenLandmarkParts.has('mega-landmark:showcase-inner-support-right') && (
        <mesh name="mega-landmark:showcase-inner-support-right" position={[66, 38, 0]}>
          <boxGeometry args={[12, 76, 12]} />
          <LandmarkMaterial color="#e4edf3" />
        </mesh>
        )}
        {!hiddenLandmarkParts.has('mega-landmark:showcase-support-left') && (
        <mesh name="mega-landmark:showcase-support-left" position={[-168, 84, 0]}>
          <boxGeometry args={[14, 168, 14]} />
          <LandmarkMaterial color="#e4edf3" />
        </mesh>
        )}
        {!hiddenLandmarkParts.has('mega-landmark:showcase-support-right') && (
        <mesh name="mega-landmark:showcase-support-right" position={[168, 84, 0]}>
          <boxGeometry args={[14, 168, 14]} />
          <LandmarkMaterial color="#e4edf3" />
        </mesh>
        )}
        {!hiddenLandmarkParts.has('mega-landmark:showcase-base-bar') && (
        <mesh name="mega-landmark:showcase-base-bar" position={[0, 10, 0]}>
          <boxGeometry args={[112, 6, 14]} />
          <LandmarkMaterial color="#dbe5eb" />
        </mesh>
        )}
        {!hiddenLandmarkParts.has('mega-landmark:showcase-outer-accent-left') && (
        <mesh name="mega-landmark:showcase-outer-accent-left" position={[-246, 62, -12]}>
          <boxGeometry args={[12, 124, 12]} />
          <LandmarkMaterial color="#eef4f8" emissive="#c084fc" emissiveIntensity={0.06} />
        </mesh>
        )}
        {!hiddenLandmarkParts.has('mega-landmark:showcase-outer-accent-right') && (
        <mesh name="mega-landmark:showcase-outer-accent-right" position={[246, 62, -18]}>
          <boxGeometry args={[12, 124, 12]} />
          <LandmarkMaterial color="#eef4f8" emissive="#c084fc" emissiveIntensity={0.06} />
        </mesh>
        )}
        {!hiddenLandmarkParts.has('mega-landmark:showcase-side-accent-left') && (
        <mesh name="mega-landmark:showcase-side-accent-left" position={[-104, 44, 34]}>
          <boxGeometry args={[14, 88, 14]} />
          <LandmarkMaterial color="#edf4f8" emissive="#c084fc" emissiveIntensity={0.05} />
        </mesh>
        )}
        {!hiddenLandmarkParts.has('mega-landmark:showcase-side-accent-right') && (
        <mesh name="mega-landmark:showcase-side-accent-right" position={[104, 44, 28]}>
          <boxGeometry args={[14, 88, 14]} />
          <LandmarkMaterial color="#edf4f8" emissive="#c084fc" emissiveIntensity={0.05} />
        </mesh>
        )}
      </group>}

      {sectionToggles.middle && isLandmarkVisible('mega-landmark-media') && <group name="mega-landmark:media" position={[0, 0, mediaBaseZ]}>
        {!hiddenLandmarkParts.has('mega-landmark:media-base') && (
        <mesh name="mega-landmark:media-base" position={[0, 8, 0]}>
          <boxGeometry args={[228, 6, 24]} />
          <LandmarkMaterial color="#eff5f8" emissive="#67e8f9" emissiveIntensity={0.018} />
        </mesh>
        )}
        {!hiddenLandmarkParts.has('mega-landmark:media-spire-left') && (
        <mesh name="mega-landmark:media-spire-left" position={[-382, 138, 0]}>
          <boxGeometry args={[18, 188, 18]} />
          <LandmarkMaterial color="#d6e2e8" emissive="#67e8f9" emissiveIntensity={0.1} />
        </mesh>
        )}
        {!hiddenLandmarkParts.has('mega-landmark:media-spire-right') && (
        <mesh name="mega-landmark:media-spire-right" position={[382, 138, 0]}>
          <boxGeometry args={[18, 188, 18]} />
          <LandmarkMaterial color="#d6e2e8" emissive="#c084fc" emissiveIntensity={0.1} />
        </mesh>
        )}
        {!hiddenLandmarkParts.has('mega-landmark:media-support-left') && (
        <mesh name="mega-landmark:media-support-left" position={[-212, 88, 0]}>
          <boxGeometry args={[16, 154, 16]} />
          <LandmarkMaterial color="#e7eef3" />
        </mesh>
        )}
        {!hiddenLandmarkParts.has('mega-landmark:media-support-right') && (
        <mesh name="mega-landmark:media-support-right" position={[212, 88, 0]}>
          <boxGeometry args={[16, 154, 16]} />
          <LandmarkMaterial color="#e7eef3" />
        </mesh>
        )}
        {!hiddenLandmarkParts.has('mega-landmark:media-plinth') && (
        <mesh name="mega-landmark:media-plinth" position={[0, 10, 0]}>
          <boxGeometry args={[92, 6, 12]} />
          <LandmarkMaterial color="#d6e2e8" />
        </mesh>
        )}
        <mesh name="mega-landmark:media-outer-accent-left" position={[-332, 54, 0]}>
          <boxGeometry args={[14, 108, 14]} />
          <LandmarkMaterial color="#eef4f8" emissive="#67e8f9" emissiveIntensity={0.06} />
        </mesh>
        {!hiddenLandmarkParts.has('mega-landmark:media-outer-accent-right') && (
        <mesh name="mega-landmark:media-outer-accent-right" position={[332, 54, 0]}>
          <boxGeometry args={[14, 108, 14]} />
          <LandmarkMaterial color="#eef4f8" emissive="#c084fc" emissiveIntensity={0.06} />
        </mesh>
        )}
        {!hiddenLandmarkParts.has('mega-landmark:media-side-accent-left') && (
        <mesh name="mega-landmark:media-side-accent-left" position={[-94, 64, 32]}>
          <boxGeometry args={[16, 126, 16]} />
          <LandmarkMaterial color="#edf4f8" emissive="#67e8f9" emissiveIntensity={0.05} />
        </mesh>
        )}
        {!hiddenLandmarkParts.has('mega-landmark:media-side-accent-right') && (
        <mesh name="mega-landmark:media-side-accent-right" position={[94, 64, 26]}>
          <boxGeometry args={[16, 126, 16]} />
          <LandmarkMaterial color="#edf4f8" emissive="#c084fc" emissiveIntensity={0.05} />
        </mesh>
        )}
      </group>}

      {sectionToggles.middle && isLandmarkVisible('mega-landmark-media-frame-wall') && (
        <group name="mega-landmark:media-frame-wall" position={mediaFrameBase}>
          <mesh name="mega-landmark:media-frame-left" position={[-132, 122, 0]}>
            <boxGeometry args={[26, 244, 24]} />
            <LandmarkMaterial color="#d7e2e9" emissive="#67e8f9" emissiveIntensity={0.03} variant="subdued" />
          </mesh>
          <mesh name="mega-landmark:media-frame-right" position={[132, 122, 0]}>
            <boxGeometry args={[26, 244, 24]} />
            <LandmarkMaterial color="#d7e2e9" emissive="#c084fc" emissiveIntensity={0.03} variant="subdued" />
          </mesh>
        <mesh name="mega-landmark:media-frame-top" position={[0, 236, 0]}>
          <boxGeometry args={[296, 20, 28]} />
          <LandmarkMaterial color="#f5f8fb" emissive="#93c5fd" emissiveIntensity={0.08} />
        </mesh>
          <mesh name="mega-landmark:media-frame-base" position={[0, 8, 0]}>
            <boxGeometry args={[214, 10, 42]} />
            <LandmarkMaterial color="#e7eef4" emissive="#67e8f9" emissiveIntensity={0.016} />
          </mesh>
          <mesh name="mega-landmark:media-frame-core" position={[0, 82, 12]}>
            <boxGeometry args={[18, 164, 18]} />
            <LandmarkMaterial color="#8ea2af" />
          </mesh>
        </group>
      )}

      {sectionToggles.middle && isLandmarkVisible('mega-landmark-media-signal-pods') && (
        <group name="mega-landmark:media-signal-pods" position={mediaPodsBase}>
          <mesh name="mega-landmark:media-pod-left" position={[-118, 42, 0]}>
            <boxGeometry args={[84, 84, 42]} />
            <LandmarkMaterial color="#dbe5eb" emissive="#67e8f9" emissiveIntensity={0.022} />
          </mesh>
          <mesh name="mega-landmark:media-pod-center" position={[0, 54, 0]}>
            <boxGeometry args={[92, 108, 48]} />
            <LandmarkMaterial color="#dbe5eb" emissive="#93c5fd" emissiveIntensity={0.024} />
          </mesh>
          <mesh name="mega-landmark:media-pod-right" position={[118, 42, 0]}>
            <boxGeometry args={[84, 84, 42]} />
            <LandmarkMaterial color="#dbe5eb" emissive="#c084fc" emissiveIntensity={0.022} />
          </mesh>
          <mesh name="mega-landmark:media-pod-base" position={[0, 8, 0]}>
            <boxGeometry args={[274, 10, 58]} />
            <LandmarkMaterial color="#e7eef4" emissive="#67e8f9" emissiveIntensity={0.014} />
          </mesh>
        </group>
      )}

      {sectionToggles.middle && isLandmarkVisible('mega-landmark-discovery') && <group name="mega-landmark:discovery" position={[0, 0, discoveryBaseZ]}>
        {!hiddenLandmarkParts.has('mega-landmark:discovery-base') && (
        <mesh name="mega-landmark:discovery-base" position={[0, 8, 0]}>
          <boxGeometry args={[152, 6, 20]} />
          <LandmarkMaterial color="#eef4f8" emissive="#67e8f9" emissiveIntensity={0.018} />
        </mesh>
        )}
        <mesh name="mega-landmark:discovery-ring-outer" position={[0, 154, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[118, 12, 18, 48]} />
          <LandmarkMaterial color="#f4fafb" emissive="#67e8f9" emissiveIntensity={0.15} />
        </mesh>
        <mesh name="mega-landmark:discovery-ring-inner" position={[0, 112, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[78, 5, 12, 36]} />
          <LandmarkMaterial color="#edf4f8" emissive="#67e8f9" emissiveIntensity={0.05} />
        </mesh>
        
        <mesh name="mega-landmark:discovery-core" position={[0, 72, -24]}>
          <cylinderGeometry args={[12, 18, 144, 18]} />
          <LandmarkMaterial color="#8ea2af" />
        </mesh>
        {!hiddenLandmarkParts.has('mega-landmark:discovery-support-left') && (
        <mesh name="mega-landmark:discovery-support-left" position={[-146, 78, 18]}>
          <boxGeometry args={[14, 128, 14]} />
          <LandmarkMaterial color="#e4edf3" />
        </mesh>
        )}
        {!hiddenLandmarkParts.has('mega-landmark:discovery-support-right') && (
        <mesh name="mega-landmark:discovery-support-right" position={[146, 78, 18]}>
          <boxGeometry args={[14, 128, 14]} />
          <LandmarkMaterial color="#e4edf3" />
        </mesh>
        )}
        {!hiddenLandmarkParts.has('mega-landmark:discovery-plinth') && (
        <mesh name="mega-landmark:discovery-plinth" position={[0, 10, 0]}>
          <boxGeometry args={[82, 6, 12]} />
          <LandmarkMaterial color="#d6e2e8" />
        </mesh>
        )}
        {!hiddenLandmarkParts.has('mega-landmark:discovery-outer-accent-left') && (
        <mesh name="mega-landmark:discovery-outer-accent-left" position={[-214, 54, 12]}>
          <boxGeometry args={[12, 108, 12]} />
          <LandmarkMaterial color="#eef4f8" emissive="#67e8f9" emissiveIntensity={0.06} />
        </mesh>
        )}
        {!hiddenLandmarkParts.has('mega-landmark:discovery-outer-accent-right') && (
        <mesh name="mega-landmark:discovery-outer-accent-right" position={[214, 54, 12]}>
          <boxGeometry args={[12, 108, 12]} />
          <LandmarkMaterial color="#eef4f8" emissive="#67e8f9" emissiveIntensity={0.06} />
        </mesh>
        )}
        {!hiddenLandmarkParts.has('mega-landmark:discovery-side-accent-left') && (
        <mesh name="mega-landmark:discovery-side-accent-left" position={[-98, 46, 30]}>
          <boxGeometry args={[14, 94, 14]} />
          <LandmarkMaterial color="#edf4f8" emissive="#67e8f9" emissiveIntensity={0.05} />
        </mesh>
        )}
        {!hiddenLandmarkParts.has('mega-landmark:discovery-side-accent-right') && (
        <mesh name="mega-landmark:discovery-side-accent-right" position={[98, 46, 26]}>
          <boxGeometry args={[14, 94, 14]} />
          <LandmarkMaterial color="#edf4f8" emissive="#67e8f9" emissiveIntensity={0.05} />
        </mesh>
        )}
      </group>}

      {sectionToggles.middle && isLandmarkVisible('mega-landmark-discovery-observatory-crown') && (
        <group name="mega-landmark:discovery-observatory-crown" position={discoveryCrownBase}>
          <mesh name="mega-landmark:discovery-crown-plinth" position={[0, 8, 0]}>
            <boxGeometry args={[212, 10, 54]} />
            <LandmarkMaterial color="#e7eef4" emissive="#67e8f9" emissiveIntensity={0.018} />
          </mesh>
          <mesh name="mega-landmark:discovery-crown-core" position={[0, 106, 0]}>
            <cylinderGeometry args={[18, 24, 212, 20]} />
            <LandmarkMaterial color="#d7e2e9" emissive="#67e8f9" emissiveIntensity={0.03} />
          </mesh>
          <mesh name="mega-landmark:discovery-crown-ring" position={[0, 196, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[82, 8, 14, 36]} />
            <LandmarkMaterial color="#eef4f8" emissive="#67e8f9" emissiveIntensity={0.1} />
          </mesh>
          <mesh name="mega-landmark:discovery-crown-wing-left" position={[-96, 74, 0]}>
            <boxGeometry args={[16, 148, 18]} />
            <LandmarkMaterial color="#edf4f8" emissive="#67e8f9" emissiveIntensity={0.04} />
          </mesh>
          <mesh name="mega-landmark:discovery-crown-wing-right" position={[96, 74, 0]}>
            <boxGeometry args={[16, 148, 18]} />
            <LandmarkMaterial color="#edf4f8" emissive="#c084fc" emissiveIntensity={0.04} />
          </mesh>
        </group>
      )}

      {sectionToggles.middle && isLandmarkVisible('mega-landmark-discovery-garden-spine') && (
        <group name="mega-landmark:discovery-garden-spine" position={discoverySpineBase}>
          {!hiddenLandmarkParts.has('mega-landmark:discovery-spine-base') && (
          <mesh name="mega-landmark:discovery-spine-base" position={[0, 5, 0]}>
            <boxGeometry args={[236, 8, 72]} />
            <LandmarkMaterial color="#e8eff4" emissive="#67e8f9" emissiveIntensity={0.012} />
          </mesh>
          )}
          {!hiddenLandmarkParts.has('mega-landmark:discovery-spine-left-garden') && (
          <mesh name="mega-landmark:discovery-spine-left-garden" position={[-88, 8, 0]}>
            <boxGeometry args={[52, 10, 44]} />
            <LandmarkMaterial color="#d7e6da" emissive="#86efac" emissiveIntensity={0.018} />
          </mesh>
          )}
          <mesh name="mega-landmark:discovery-spine-right-garden" position={[88, 8, 0]}>
            <boxGeometry args={[52, 10, 44]} />
            <LandmarkMaterial color="#d7e6da" emissive="#86efac" emissiveIntensity={0.018} />
          </mesh>
          <mesh name="mega-landmark:discovery-spine-ribbon" position={[0, 8, 0]}>
            <boxGeometry args={[148, 6, 16]} />
            <LandmarkMaterial color="#edf4f8" emissive="#67e8f9" emissiveIntensity={0.03} />
          </mesh>
        </group>
      )}

      {sectionToggles.right && isLandmarkVisible('mega-landmark-right-skyfold-citadel') && (
        <group name="mega-landmark:right-skyfold-citadel" position={rightCitadelBase}>
          <mesh name="mega-landmark:right-citadel-plinth" position={[0, 10, 0]}>
            <boxGeometry args={[248, 12, 62]} />
            <LandmarkMaterial color="#e7eef4" emissive="#67e8f9" emissiveIntensity={0.02} />
          </mesh>
          <mesh name="mega-landmark:right-citadel-core-left" position={[-58, 146, 0]} rotation={[0, 0, -0.08]}>
            <boxGeometry args={[72, 292, 34]} />
            <LandmarkMaterial color="#d7e2e9" emissive="#67e8f9" emissiveIntensity={0.03} />
          </mesh>
          <mesh name="mega-landmark:right-citadel-core-right" position={[42, 124, -12]} rotation={[0, 0, 0.06]}>
            <boxGeometry args={[68, 248, 32]} />
            <LandmarkMaterial color="#d7e2e9" emissive="#c084fc" emissiveIntensity={0.03} />
          </mesh>
          <mesh name="mega-landmark:right-citadel-fold-top" position={[0, 236, -4]} rotation={[0, 0.12, 0]}>
            <boxGeometry args={[182, 16, 24]} />
            <LandmarkMaterial color="#eef4f8" emissive="#93c5fd" emissiveIntensity={0.05} />
          </mesh>
          <mesh name="mega-landmark:right-citadel-bridge-cut" position={[0, 168, 14]}>
            <boxGeometry args={[118, 12, 16]} />
            <LandmarkMaterial color="#dbe8f0" emissive="#67e8f9" emissiveIntensity={0.04} />
          </mesh>
          {!hiddenLandmarkParts.has('mega-landmark:right-citadel-fin-left') && (
          <mesh name="mega-landmark:right-citadel-fin-left" position={[-142, 92, -18]}>
            <boxGeometry args={[16, 184, 14]} />
            <LandmarkMaterial color="#edf4f8" emissive="#67e8f9" emissiveIntensity={0.04} />
          </mesh>
          )}
          {!hiddenLandmarkParts.has('mega-landmark:right-citadel-fin-right') && (
          <mesh name="mega-landmark:right-citadel-fin-right" position={[144, 86, 18]}>
            <boxGeometry args={[16, 172, 14]} />
            <LandmarkMaterial color="#edf4f8" emissive="#c084fc" emissiveIntensity={0.04} />
          </mesh>
          )}
        </group>
      )}

      {sectionToggles.right && isLandmarkVisible('mega-landmark-right-skybridge-beacon') && (
        <group name="mega-landmark:right-skybridge-beacon" position={rightBeaconBase}>
          <mesh name="mega-landmark:right-skybridge-plinth" position={[0, 8, 0]}>
            <boxGeometry args={[236, 10, 56]} />
            <LandmarkMaterial color="#e6eef4" emissive="#67e8f9" emissiveIntensity={0.02} />
          </mesh>
          <mesh name="mega-landmark:right-skybridge-terrace-left" position={[-132, 12, 28]}>
            <boxGeometry args={[62, 8, 28]} />
            <LandmarkMaterial color="#dbe5eb" />
          </mesh>
          <mesh name="mega-landmark:right-skybridge-terrace-right" position={[132, 12, 20]}>
            <boxGeometry args={[62, 8, 28]} />
            <LandmarkMaterial color="#dbe5eb" />
          </mesh>
          <mesh name="mega-landmark:right-skybridge-tower-left" position={[-88, 118, 0]}>
            <boxGeometry args={[28, 236, 28]} />
            <LandmarkMaterial color="#d7e2e9" emissive="#67e8f9" emissiveIntensity={0.028} />
          </mesh>
          <mesh name="mega-landmark:right-skybridge-tower-right" position={[88, 134, -12]}>
            <boxGeometry args={[30, 268, 30]} />
            <LandmarkMaterial color="#d7e2e9" emissive="#c084fc" emissiveIntensity={0.028} />
          </mesh>
          <mesh name="mega-landmark:right-skybridge-bridge" position={[0, 204, -6]}>
            <boxGeometry args={[202, 12, 22]} />
            <LandmarkMaterial color="#eef4f8" emissive="#93c5fd" emissiveIntensity={0.05} />
          </mesh>
          <mesh name="mega-landmark:right-skybridge-bridge-underlight" position={[0, 194, -6]}>
            <boxGeometry args={[156, 4, 10]} />
            <LandmarkMaterial color="#dbe8f0" emissive="#67e8f9" emissiveIntensity={0.06} />
          </mesh>
          <mesh name="mega-landmark:right-skybridge-inner-support-left" position={[-34, 76, 18]}>
            <boxGeometry args={[14, 152, 14]} />
            <LandmarkMaterial color="#eef4f8" emissive="#67e8f9" emissiveIntensity={0.03} />
          </mesh>
          <mesh name="mega-landmark:right-skybridge-inner-support-right" position={[34, 84, 12]}>
            <boxGeometry args={[14, 168, 14]} />
            <LandmarkMaterial color="#eef4f8" emissive="#c084fc" emissiveIntensity={0.03} />
          </mesh>
          <mesh name="mega-landmark:right-skybridge-beacon-core" position={[0, 64, 34]}>
            <cylinderGeometry args={[10, 14, 128, 18]} />
            <LandmarkMaterial color="#8ea2af" />
          </mesh>
          <mesh name="mega-landmark:right-skybridge-beacon-cap" position={[0, 144, 34]}>
            <octahedronGeometry args={[20, 0]} />
            <LandmarkMaterial color="#dff4ff" emissive="#67e8f9" emissiveIntensity={0.14} />
          </mesh>
          {!hiddenLandmarkParts.has('mega-landmark:right-skybridge-side-fin-left') && (
          <mesh name="mega-landmark:right-skybridge-side-fin-left" position={[-156, 68, -18]}>
            <boxGeometry args={[16, 136, 14]} />
            <LandmarkMaterial color="#edf4f8" emissive="#67e8f9" emissiveIntensity={0.05} />
          </mesh>
          )}
          {!hiddenLandmarkParts.has('mega-landmark:right-skybridge-side-fin-right') && (
          <mesh name="mega-landmark:right-skybridge-side-fin-right" position={[156, 76, -26]}>
            <boxGeometry args={[16, 152, 14]} />
            <LandmarkMaterial color="#edf4f8" emissive="#c084fc" emissiveIntensity={0.05} />
          </mesh>
          )}
        </group>
      )}

      {sectionToggles.right && isLandmarkVisible('mega-landmark-right-media-halo') && (
        <group name="mega-landmark:right-media-halo" position={rightHaloBase}>
          <mesh name="mega-landmark:right-media-halo-plinth" position={[0, 8, 0]}>
            <boxGeometry args={[188, 8, 48]} />
            <LandmarkMaterial color="#e7eef4" emissive="#67e8f9" emissiveIntensity={0.018} />
          </mesh>
          <mesh name="mega-landmark:right-media-halo-base-left" position={[-72, 42, 0]}>
            <boxGeometry args={[18, 84, 18]} />
            <LandmarkMaterial color="#dbe5eb" emissive="#67e8f9" emissiveIntensity={0.025} />
          </mesh>
          <mesh name="mega-landmark:right-media-halo-base-right" position={[72, 42, 0]}>
            <boxGeometry args={[18, 84, 18]} />
            <LandmarkMaterial color="#dbe5eb" emissive="#c084fc" emissiveIntensity={0.025} />
          </mesh>
          <mesh name="mega-landmark:right-media-halo-ring-outer" position={[0, 126, 0]} rotation={[0, Math.PI / 2, 0]}>
            <torusGeometry args={[94, 10, 16, 42]} />
            <LandmarkMaterial color="#eff5f8" emissive="#67e8f9" emissiveIntensity={0.1} />
          </mesh>
          <mesh name="mega-landmark:right-media-halo-ring-inner" position={[0, 126, 0]} rotation={[0, Math.PI / 2, 0]}>
            <torusGeometry args={[58, 4, 12, 36]} />
            <LandmarkMaterial color="#edf4f8" emissive="#c084fc" emissiveIntensity={0.05} />
          </mesh>
          <mesh name="mega-landmark:right-media-halo-crossbeam" position={[0, 126, 0]}>
            <boxGeometry args={[132, 10, 16]} />
            <LandmarkMaterial color="#eef4f8" emissive="#93c5fd" emissiveIntensity={0.04} />
          </mesh>
          <mesh name="mega-landmark:right-media-halo-core" position={[0, 68, 0]}>
            <cylinderGeometry args={[8, 12, 136, 18]} />
            <LandmarkMaterial color="#8ea2af" />
          </mesh>
          <mesh name="mega-landmark:right-media-halo-cap" position={[0, 154, 0]}>
            <octahedronGeometry args={[16, 0]} />
            <LandmarkMaterial color="#e4f6ff" emissive="#67e8f9" emissiveIntensity={0.12} />
          </mesh>
          {!hiddenLandmarkParts.has('mega-landmark:right-media-halo-fin-left') && (
          <mesh name="mega-landmark:right-media-halo-fin-left" position={[-124, 56, -18]}>
            <boxGeometry args={[14, 112, 12]} />
            <LandmarkMaterial color="#edf4f8" emissive="#67e8f9" emissiveIntensity={0.04} />
          </mesh>
          )}
          {!hiddenLandmarkParts.has('mega-landmark:right-media-halo-fin-right') && (
          <mesh name="mega-landmark:right-media-halo-fin-right" position={[124, 64, 18]}>
            <boxGeometry args={[14, 128, 12]} />
            <LandmarkMaterial color="#edf4f8" emissive="#c084fc" emissiveIntensity={0.04} />
          </mesh>
          )}
        </group>
      )}

      {sectionToggles.left && isLandmarkVisible('mega-landmark-left-disc-habitat') && (
        <group name="mega-landmark:left-disc-habitat" position={leftDiscBase}>
          <mesh name="mega-landmark:left-disc-support-a" position={[-82, 72, 16]}>
            <boxGeometry args={[26, 144, 18]} />
            <LandmarkMaterial color="#c2d0d8" emissive="#67e8f9" emissiveIntensity={0.025} />
          </mesh>
          <mesh name="mega-landmark:left-disc-support-b" position={[82, 82, -34]} rotation={[0, 0, -0.14]}>
            <boxGeometry args={[28, 164, 30]} />
            <LandmarkMaterial color="#b8c5ce" emissive="#c084fc" emissiveIntensity={0.026} />
          </mesh>
          <mesh name="mega-landmark:left-disc-support-c" position={[-8, 58, 54]} rotation={[0, 0, 0.12]}>
            <boxGeometry args={[34, 112, 14]} />
            <LandmarkMaterial color="#dbe5eb" emissive="#93c5fd" emissiveIntensity={0.025} variant="subdued" />
          </mesh>
          <mesh name="mega-landmark:left-disc-body" position={[0, 178, 0]}>
            <cylinderGeometry args={[126, 148, 28, 36]} />
            <LandmarkMaterial color="#eef4f8" emissive="#67e8f9" emissiveIntensity={0.04} variant="subdued" />
          </mesh>
          <mesh name="mega-landmark:left-disc-core" position={[0, 178, 0]}>
            <cylinderGeometry args={[44, 56, 34, 24]} />
            <LandmarkMaterial color="#8ea2af" emissive="#93c5fd" emissiveIntensity={0.04} variant="subdued" />
          </mesh>
        </group>
      )}

      {sectionToggles.right && isLandmarkVisible('mega-landmark-right-support-spire') && (
        <group name="mega-landmark:right-support-spire" position={rightSupportBase}>
          <mesh name="mega-landmark:right-support-spire-plinth" position={[0, 7, 0]}>
            <boxGeometry args={[132, 8, 38]} />
            <LandmarkMaterial color="#e5edf3" emissive="#67e8f9" emissiveIntensity={0.016} />
          </mesh>
          <mesh name="mega-landmark:right-support-spire-core" position={[0, 74, 0]}>
            <boxGeometry args={[20, 148, 20]} />
            <LandmarkMaterial color="#d7e2e9" emissive="#67e8f9" emissiveIntensity={0.03} />
          </mesh>
          <mesh name="mega-landmark:right-support-spire-cap" position={[0, 170, 0]}>
            <octahedronGeometry args={[14, 0]} />
            <LandmarkMaterial color="#e4f6ff" emissive="#67e8f9" emissiveIntensity={0.12} />
          </mesh>
          <mesh name="mega-landmark:right-support-spire-wing-left" position={[-46, 52, 0]}>
            <boxGeometry args={[12, 104, 12]} />
            <LandmarkMaterial color="#edf4f8" emissive="#67e8f9" emissiveIntensity={0.035} />
          </mesh>
          <mesh name="mega-landmark:right-support-spire-wing-right" position={[46, 58, -8]}>
            <boxGeometry args={[12, 116, 12]} />
            <LandmarkMaterial color="#edf4f8" emissive="#c084fc" emissiveIntensity={0.035} />
          </mesh>
          <mesh name="mega-landmark:right-support-spire-band" position={[0, 118, 0]}>
            <boxGeometry args={[96, 8, 14]} />
            <LandmarkMaterial color="#eef4f8" emissive="#93c5fd" emissiveIntensity={0.04} />
          </mesh>
        </group>
      )}

      {sectionToggles.right && (
        <group name="mega-landmark:right-linear-water-terrace" />
      )}

      {sectionToggles.left && isLandmarkVisible('mega-landmark-left-grand-rampart') && (
        <group name="mega-landmark:left-grand-rampart" position={leftRampartBase}>
          <mesh name="mega-landmark:left-rampart-wall-left" position={[-96, 56, -8]} rotation={[0, 0, -0.04]}>
            <boxGeometry args={[84, 112, 26]} />
            <LandmarkMaterial color="#c4d0d8" emissive="#67e8f9" emissiveIntensity={0.024} variant="subdued" />
          </mesh>
          <mesh name="mega-landmark:left-rampart-wall-center" position={[-6, 98, -6]}>
            <boxGeometry args={[128, 196, 28]} />
            <LandmarkMaterial color="#d7e2e9" emissive="#93c5fd" emissiveIntensity={0.026} variant="subdued" />
          </mesh>
          <mesh name="mega-landmark:left-rampart-wall-right" position={[58, 124, 16]}>
            <boxGeometry args={[80, 18, 22]} />
            <LandmarkMaterial color="#edf4f8" emissive="#c084fc" emissiveIntensity={0.034} variant="subdued" />
          </mesh>
        </group>
      )}

      {sectionToggles.left && isLandmarkVisible('mega-landmark-left-cantilever-forum') && (
        <group name="mega-landmark:left-cantilever-forum" position={leftForumBase}>
          <mesh name="mega-landmark:left-cantilever-pylon-left" position={[-84, 78, -4]}>
            <boxGeometry args={[56, 156, 28]} />
            <LandmarkMaterial color="#c3cfd8" emissive="#67e8f9" emissiveIntensity={0.024} variant="subdued" />
          </mesh>
          <mesh name="mega-landmark:left-cantilever-pylon-right" position={[48, 66, -12]} rotation={[0, 0, 0.08]}>
            <boxGeometry args={[38, 132, 24]} />
            <LandmarkMaterial color="#b9c6cf" emissive="#c084fc" emissiveIntensity={0.024} variant="subdued" />
          </mesh>
          <mesh name="mega-landmark:left-cantilever-core" position={[-8, 42, 32]}>
            <boxGeometry args={[34, 84, 24]} />
            <LandmarkMaterial color="#8ea2af" variant="subdued" />
          </mesh>
          <mesh name="mega-landmark:left-cantilever-cap" position={[-8, 144, 32]}>
            <octahedronGeometry args={[18, 0]} />
            <LandmarkMaterial color="#e4f6ff" emissive="#67e8f9" emissiveIntensity={0.12} variant="subdued" />
          </mesh>
          {!hiddenLandmarkParts.has('mega-landmark:left-cantilever-fin-left') && (
          <mesh name="mega-landmark:left-cantilever-fin-left" position={[-146, 52, -18]} rotation={[0, 0, -0.16]}>
            <boxGeometry args={[26, 104, 18]} />
            <LandmarkMaterial color="#dce6ec" emissive="#67e8f9" emissiveIntensity={0.035} variant="subdued" />
          </mesh>
          )}
          <mesh name="mega-landmark:left-cantilever-fin-right" position={[126, 46, 18]} rotation={[0, 0, 0.16]}>
            <boxGeometry args={[24, 92, 18]} />
            <LandmarkMaterial color="#dce6ec" emissive="#c084fc" emissiveIntensity={0.034} variant="subdued" />
          </mesh>
        </group>
      )}

      {sectionToggles.left && isLandmarkVisible('mega-landmark-left-split-crown-gate') && (
        <group name="mega-landmark:left-split-crown-gate" position={leftCrownBase}>
          <mesh name="mega-landmark:left-split-crown-left" position={[-82, 146, 0]}>
            <boxGeometry args={[34, 292, 28]} />
            <LandmarkMaterial color="#d7e2e9" emissive="#67e8f9" emissiveIntensity={0.03} variant="subdued" />
          </mesh>
          <mesh name="mega-landmark:left-split-crown-right" position={[82, 138, -8]}>
            <boxGeometry args={[34, 276, 28]} />
            <LandmarkMaterial color="#d7e2e9" emissive="#c084fc" emissiveIntensity={0.03} variant="subdued" />
          </mesh>
          <mesh name="mega-landmark:left-split-crown-inner-left" position={[-24, 112, 14]}>
            <boxGeometry args={[18, 224, 18]} />
            <LandmarkMaterial color="#edf4f8" emissive="#67e8f9" emissiveIntensity={0.035} variant="subdued" />
          </mesh>
          <mesh name="mega-landmark:left-split-crown-inner-right" position={[24, 104, 8]}>
            <boxGeometry args={[18, 208, 18]} />
            <LandmarkMaterial color="#edf4f8" emissive="#c084fc" emissiveIntensity={0.035} variant="subdued" />
          </mesh>
          <mesh name="mega-landmark:left-split-crown-core" position={[0, 72, 32]}>
            <cylinderGeometry args={[10, 14, 144, 18]} />
            <LandmarkMaterial color="#8ea2af" variant="subdued" />
          </mesh>
          <mesh name="mega-landmark:left-split-crown-cap" position={[0, 162, 32]}>
            <octahedronGeometry args={[20, 0]} />
            <LandmarkMaterial color="#e4f6ff" emissive="#67e8f9" emissiveIntensity={0.13} variant="subdued" />
          </mesh>
          {!hiddenLandmarkParts.has('mega-landmark:left-split-crown-fin-left') && (
          <mesh name="mega-landmark:left-split-crown-fin-left" position={[-154, 88, -18]}>
            <boxGeometry args={[16, 176, 14]} />
            <LandmarkMaterial color="#edf4f8" emissive="#67e8f9" emissiveIntensity={0.045} variant="subdued" />
          </mesh>
          )}
          {!hiddenLandmarkParts.has('mega-landmark:left-split-crown-fin-right') && (
          <mesh name="mega-landmark:left-split-crown-fin-right" position={[154, 82, 18]}>
            <boxGeometry args={[16, 164, 14]} />
            <LandmarkMaterial color="#edf4f8" emissive="#c084fc" emissiveIntensity={0.045} variant="subdued" />
          </mesh>
          )}
        </group>
      )}

      {sectionToggles.left && isLandmarkVisible('mega-landmark-left-split-monolith-pair') && (
        <group name="mega-landmark:left-split-monolith-pair" position={leftMonolithBase}>
          <mesh name="mega-landmark:left-monolith-a" position={[-58, 146, 0]} rotation={[0, 0, -0.04]}>
            <boxGeometry args={[44, 292, 28]} />
            <LandmarkMaterial color="#d7e2e9" emissive="#67e8f9" emissiveIntensity={0.03} variant="subdued" />
          </mesh>
          <mesh name="mega-landmark:left-monolith-b" position={[64, 128, -10]} rotation={[0, 0, 0.05]}>
            <boxGeometry args={[38, 256, 28]} />
            <LandmarkMaterial color="#d7e2e9" emissive="#c084fc" emissiveIntensity={0.03} variant="subdued" />
          </mesh>
          <mesh name="mega-landmark:left-monolith-gap-marker" position={[0, 172, 22]}>
            <boxGeometry args={[92, 14, 16]} />
            <LandmarkMaterial color="#eef4f8" emissive="#93c5fd" emissiveIntensity={0.05} variant="subdued" />
          </mesh>
        </group>
      )}

      {sectionToggles.left && isLandmarkVisible('mega-landmark-left-broken-wall-monument') && (
        <group name="mega-landmark:left-broken-wall-monument" position={leftSupportBase}>
          <mesh name="mega-landmark:left-broken-wall-left" position={[-64, 86, -14]} rotation={[0, 0, -0.08]}>
            <boxGeometry args={[42, 172, 22]} />
            <LandmarkMaterial color="#c4d0d8" emissive="#67e8f9" emissiveIntensity={0.026} variant="subdued" />
          </mesh>
          <mesh name="mega-landmark:left-broken-wall-right" position={[48, 66, 22]} rotation={[0, 0, 0.1]}>
            <boxGeometry args={[54, 132, 20]} />
            <LandmarkMaterial color="#b7c4cd" emissive="#c084fc" emissiveIntensity={0.024} variant="subdued" />
          </mesh>
          <mesh name="mega-landmark:left-broken-wall-marker" position={[-6, 142, 28]}>
            <boxGeometry args={[96, 16, 16]} />
            <LandmarkMaterial color="#edf4f8" emissive="#67e8f9" emissiveIntensity={0.04} variant="subdued" />
          </mesh>
        </group>
      )}

      {sectionToggles.left && (
        <group name="mega-landmark:left-sunken-park-court" />
      )}

    </group>
  );
}
