import type { SponsorBoothTemplate } from '../lib/sponsorBoothPresentation';
import type { ExpoDistrictExpressionMode } from '../lib/boulevardLayout';
import { EXPO_BOOTH_LOCAL_FOOTPRINT_SIZE } from '../../../shared/expo/lib/boothLocalFootprint';

export type BoothArchitectureMetrics = {
  badgePosition: [number, number, number];
  colliderSize: [number, number, number];
  ctaPosition: [number, number, number];
  footprintSize: [number, number];
  insertPosition: [number, number, number];
  insertScale: number;
  logoPanelPosition: [number, number, number];
  mediaWallPosition: [number, number, number];
  sectorLabelPosition: [number, number, number];
  taglinePosition: [number, number, number];
  titleMaxWidth: number;
  titlePosition: [number, number, number];
};

export type BoothColliderSegment = {
  id: 'rear' | 'left' | 'right';
  position: [number, number, number];
  size: [number, number, number];
};

export type BoothTemplateBaselineTier = 'common' | 'premium' | 'hero';

export type BoothArchitectureContractBaseline = {
  baselineTier: BoothTemplateBaselineTier;
  colliderDepth: number;
  colliderWidth: number;
  footprintDepth: number;
  footprintWidth: number;
  mediaWallHeight: number;
  titleMaxWidth: number;
};

const METRICS: Record<SponsorBoothTemplate, BoothArchitectureMetrics> = {
  hero_forum: {
    badgePosition: [0, 18.8, -5.5],
    colliderSize: [31, 18, 22],
    ctaPosition: [0, 1.45, 6.6],
    footprintSize: [EXPO_BOOTH_LOCAL_FOOTPRINT_SIZE.hero.width, EXPO_BOOTH_LOCAL_FOOTPRINT_SIZE.hero.depth],
    insertPosition: [0, 0.2, -3.4],
    insertScale: 2.2,
    logoPanelPosition: [9.8, 10.2, 4.8],
    mediaWallPosition: [0, 8.8, -6.2],
    sectorLabelPosition: [0, 0.76, -8.9],
    taglinePosition: [0, 14.8, -5.3],
    titleMaxWidth: 16,
    titlePosition: [0, 17.6, -5.3],
  },
  hero_gallery: {
    badgePosition: [0, 19.8, -7.1],
    colliderSize: [28, 18, 21],
    ctaPosition: [0, 1.6, 6.4],
    footprintSize: [EXPO_BOOTH_LOCAL_FOOTPRINT_SIZE.hero.width, EXPO_BOOTH_LOCAL_FOOTPRINT_SIZE.hero.depth],
    insertPosition: [0, 0.24, -3.6],
    insertScale: 2.4,
    logoPanelPosition: [-7.4, 10.4, 3.8],
    mediaWallPosition: [0, 8.8, -7.55],
    sectorLabelPosition: [0, 0.72, -8.9],
    taglinePosition: [0, 14.6, -7],
    titleMaxWidth: 14,
    titlePosition: [0, 17.6, -7],
  },
  premium_portal: {
    badgePosition: [0, 15.1, -3.9],
    colliderSize: [27, 17, 19],
    ctaPosition: [0, 1.55, 5.8],
    footprintSize: [EXPO_BOOTH_LOCAL_FOOTPRINT_SIZE.premium.width, EXPO_BOOTH_LOCAL_FOOTPRINT_SIZE.premium.depth],
    insertPosition: [0, 0.16, -2.2],
    insertScale: 2,
    logoPanelPosition: [7.8, 9.9, 3.8],
    mediaWallPosition: [0, 8.2, -5.5],
    sectorLabelPosition: [0, 0.72, -7.8],
    taglinePosition: [0, 11.6, -5.1],
    titleMaxWidth: 13.5,
    titlePosition: [0, 14.2, -5.1],
  },
  premium_spine: {
    badgePosition: [0, 15.6, -5.2],
    colliderSize: [26, 17, 18.5],
    ctaPosition: [0, 1.55, 6.4],
    footprintSize: [EXPO_BOOTH_LOCAL_FOOTPRINT_SIZE.premium.width, EXPO_BOOTH_LOCAL_FOOTPRINT_SIZE.premium.depth],
    insertPosition: [-2.6, 0.2, -2.2],
    insertScale: 2.05,
    logoPanelPosition: [-8.4, 11.2, 4.2],
    mediaWallPosition: [0, 8.6, -6.4],
    sectorLabelPosition: [0, 0.72, -9.8],
    taglinePosition: [0, 11.8, -5.9],
    titleMaxWidth: 15.5,
    titlePosition: [0, 14.4, -5.9],
  },
  standard_arcade: {
    badgePosition: [0, 12.1, -2.3],
    colliderSize: [18.5, 12.2, 13.2],
    ctaPosition: [0, 1.35, 3.8],
    footprintSize: [EXPO_BOOTH_LOCAL_FOOTPRINT_SIZE.standard.width, EXPO_BOOTH_LOCAL_FOOTPRINT_SIZE.standard.depth],
    insertPosition: [0, 0.14, -1.5],
    insertScale: 1.42,
    logoPanelPosition: [0, 8.2, 3.6],
    mediaWallPosition: [0, 6.1, -3.1],
    sectorLabelPosition: [0, 0.72, -5.3],
    taglinePosition: [0, 8.9, -2.8],
    titleMaxWidth: 10.8,
    titlePosition: [0, 11.2, -2.8],
  },
  standard_studio: {
    badgePosition: [0, 12.4, -2.4],
    colliderSize: [18.2, 11.6, 12.8],
    ctaPosition: [0, 1.45, 3.6],
    footprintSize: [EXPO_BOOTH_LOCAL_FOOTPRINT_SIZE.standard.width, EXPO_BOOTH_LOCAL_FOOTPRINT_SIZE.standard.depth],
    insertPosition: [0, 0.12, -1.8],
    insertScale: 1.46,
    logoPanelPosition: [0, 8.15, 3.8],
    mediaWallPosition: [0, 5.9, -3.4],
    sectorLabelPosition: [0, 0.72, -5.2],
    taglinePosition: [0, 8.9, -2.9],
    titleMaxWidth: 10.8,
    titlePosition: [0, 11.2, -2.8],
  },
};

function resolveToneSurface(visualTone: ExpoDistrictExpressionMode) {
  switch (visualTone) {
    case 'active-commercial':
      return { edge: '#486f98', frame: '#dce5ee', glow: 0.02, shell: '#e7edf3', slab: '#21384b' };
    case 'calm-dwell':
      return { edge: '#4f7a77', frame: '#e2e9e7', glow: 0.015, shell: '#edf3f1', slab: '#29423d' };
    default:
      return { edge: '#5c6978', frame: '#e7ebf1', glow: 0.012, shell: '#f1f4f6', slab: '#32404e' };
  }
}

function ShellMaterial({
  color,
  emissiveIntensity = 0.02,
}: {
  color: string;
  emissiveIntensity?: number;
}) {
  return <meshStandardMaterial color={color} emissive={color} emissiveIntensity={emissiveIntensity} metalness={0.1} roughness={0.68} />;
}

function PremiumSurface({
  color,
  visualTone = 'active-commercial',
}: {
  color?: string;
  visualTone?: ExpoDistrictExpressionMode;
}) {
  const tone = resolveToneSurface(visualTone);
  return <meshStandardMaterial color={color ?? tone.shell} metalness={0.08} roughness={0.42} />;
}

function ConcreteMasterMaterial() {
  return <meshStandardMaterial color="#e8eef4" metalness={0.04} roughness={0.72} />;
}

function FactoryWallMaterial() {
  return <meshStandardMaterial color="#5f7688" metalness={0.14} roughness={0.66} />;
}

function MetalTrimMaterial({ variant = '045' }: { variant?: '045' | '046' }) {
  return (
    <meshStandardMaterial
      color={variant === '045' ? '#ccd6e2' : '#60748a'}
      metalness={0.4}
      roughness={0.58}
    />
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function getBoothArchitectureMetrics(template: SponsorBoothTemplate) {
  return METRICS[template];
}

// eslint-disable-next-line react-refresh/only-export-components
export function getBoothArchitectureContractBaseline(template: SponsorBoothTemplate): BoothArchitectureContractBaseline {
  const metrics = getBoothArchitectureMetrics(template);
  const baselineTier: BoothTemplateBaselineTier = template.startsWith('hero_')
    ? 'hero'
    : template.startsWith('premium_')
      ? 'premium'
      : 'common';

  return {
    baselineTier,
    colliderDepth: metrics.colliderSize[2],
    colliderWidth: metrics.colliderSize[0],
    footprintDepth: metrics.footprintSize[1],
    footprintWidth: metrics.footprintSize[0],
    mediaWallHeight: metrics.mediaWallPosition[1],
    titleMaxWidth: metrics.titleMaxWidth,
  };
}

// eslint-disable-next-line react-refresh/only-export-components
export function getBoothColliderSegments(template: SponsorBoothTemplate): BoothColliderSegment[] {
  const metrics = getBoothArchitectureMetrics(template);
  const isHero = template.startsWith('hero_');
  const isPremium = template.startsWith('premium_');
  const height = Math.max(5.4, metrics.colliderSize[1] * (isHero ? 0.86 : isPremium ? 0.82 : 0.78));
  const sideDepth = Math.max(isHero ? 4.4 : isPremium ? 3.6 : 2.8, metrics.footprintSize[1] * (isHero ? 0.28 : isPremium ? 0.22 : 0.16));
  const sideThickness = Math.max(0.62, metrics.colliderSize[0] * 0.045);
  const rearThickness = Math.max(0.72, metrics.colliderSize[2] * 0.06);
  const sideX = (metrics.footprintSize[0] * 0.5) - (sideThickness * 0.5) - 0.44;
  const rearZ = -(metrics.footprintSize[1] * 0.5) + (rearThickness * 0.5) + 0.72;
  const sideZ = rearZ + (sideDepth * 0.5) + 0.22;

  return [
    {
      id: 'rear',
      position: [0, height * 0.5, rearZ],
      size: [Math.max(6.4, metrics.footprintSize[0] * (isHero ? 0.62 : isPremium ? 0.58 : 0.52)), height, rearThickness],
    },
    {
      id: 'left',
      position: [-sideX, height * 0.5, sideZ],
      size: [sideThickness, height, sideDepth],
    },
    {
      id: 'right',
      position: [sideX, height * 0.5, sideZ],
      size: [sideThickness, height, sideDepth],
    },
  ];
}

function ActiveFrontage({ accentColor }: { accentColor: string }) {
  return (
    <group>
      <mesh position={[0, 0.12, 1.4]} receiveShadow>
        <boxGeometry args={[21.4, 0.24, 12.2]} />
        <ConcreteMasterMaterial />
      </mesh>
      <mesh position={[0, 5.2, -1.2]} castShadow>
        <boxGeometry args={[18.6, 10.8, 10.8]} />
        <ConcreteMasterMaterial />
      </mesh>
      <mesh position={[0, 6.3, -5.95]} castShadow>
        <boxGeometry args={[16.6, 8.6, 1.08]} />
        <FactoryWallMaterial />
      </mesh>
      <mesh position={[0, 5.1, 3.9]} castShadow>
        <boxGeometry args={[13.2, 9.6, 2.9]} />
        <PremiumSurface visualTone="active-commercial" />
      </mesh>
      <mesh position={[0, 11.0, -0.55]} castShadow>
        <boxGeometry args={[19.4, 0.92, 11.2]} />
        <MetalTrimMaterial variant="046" />
      </mesh>
      <mesh position={[0, 13.4, -1.8]} castShadow>
        <boxGeometry args={[16.4, 1.28, 8.4]} />
        <PremiumSurface visualTone="active-commercial" />
      </mesh>
      <mesh position={[0, 1.9, 5.95]} castShadow>
        <boxGeometry args={[15.6, 3.0, 1.5]} />
        <ConcreteMasterMaterial />
      </mesh>
      <mesh position={[-8.95, 5.35, -0.1]} rotation={[0, 0.08, 0]} castShadow>
        <boxGeometry args={[1.52, 10.1, 10.2]} />
        <MetalTrimMaterial variant="046" />
      </mesh>
      <mesh position={[8.95, 5.35, -0.1]} rotation={[0, -0.08, 0]} castShadow>
        <boxGeometry args={[1.52, 10.1, 10.2]} />
        <MetalTrimMaterial variant="046" />
      </mesh>
      <mesh position={[-6.25, 3.15, 4.8]} castShadow>
        <boxGeometry args={[2.1, 4.8, 1.84]} />
        <FactoryWallMaterial />
      </mesh>
      <mesh position={[6.25, 3.15, 4.8]} castShadow>
        <boxGeometry args={[2.1, 4.8, 1.84]} />
        <FactoryWallMaterial />
      </mesh>
      <mesh position={[0, 8.95, 0.7]} castShadow>
        <boxGeometry args={[11.6, 1.28, 6.6]} />
        <MetalTrimMaterial variant="046" />
      </mesh>
      <mesh position={[-10.9, 4.9, 1.8]} castShadow>
        <boxGeometry args={[2.2, 8.4, 6.8]} />
        <PremiumSurface visualTone="active-commercial" />
      </mesh>
      <mesh position={[10.9, 4.9, 1.8]} castShadow>
        <boxGeometry args={[2.2, 8.4, 6.8]} />
        <PremiumSurface visualTone="active-commercial" />
      </mesh>
      <mesh position={[-8.6, 9.2, 2.6]} castShadow>
        <boxGeometry args={[4.8, 1.1, 4.4]} />
        <MetalTrimMaterial variant="045" />
      </mesh>
      <mesh position={[8.6, 9.2, 2.6]} castShadow>
        <boxGeometry args={[4.8, 1.1, 4.4]} />
        <MetalTrimMaterial variant="045" />
      </mesh>
      <mesh position={[0, 6.1, 5.15]} castShadow>
        <boxGeometry args={[7.4, 1.8, 1.2]} />
        <MetalTrimMaterial variant="045" />
      </mesh>
      <mesh position={[0, 1.02, 6.15]} receiveShadow>
        <boxGeometry args={[14.2, 0.12, 0.74]} />
        <meshStandardMaterial color="#4c647a" emissive={accentColor} emissiveIntensity={0.01} roughness={0.72} metalness={0.18} />
      </mesh>
    </group>
  );
}

function CalmFrontage({ accentColor }: { accentColor: string }) {
  const tone = resolveToneSurface('calm-dwell');
  return (
    <group>
      <mesh position={[0, 0.12, 0.8]} receiveShadow>
        <boxGeometry args={[16.8, 0.22, 10.8]} />
        <ConcreteMasterMaterial />
      </mesh>
      <mesh position={[0, 4.8, -0.9]} castShadow>
        <boxGeometry args={[11.8, 8.8, 10.4]} />
        <ConcreteMasterMaterial />
      </mesh>
      <mesh position={[0, 5.05, -5.85]} castShadow>
        <boxGeometry args={[10.4, 7.4, 1.04]} />
        <PremiumSurface visualTone="calm-dwell" />
      </mesh>
      <mesh position={[-5.95, 4.65, 0.4]} rotation={[0, 0.05, 0]} castShadow>
        <boxGeometry args={[1.28, 8.9, 10.2]} />
        <ShellMaterial color={accentColor} emissiveIntensity={tone.glow} />
      </mesh>
      <mesh position={[5.95, 4.65, 0.4]} rotation={[0, -0.05, 0]} castShadow>
        <boxGeometry args={[1.28, 8.9, 10.2]} />
        <ShellMaterial color={accentColor} emissiveIntensity={tone.glow} />
      </mesh>
      <mesh position={[0, 9.15, -0.45]} castShadow>
        <boxGeometry args={[12.6, 0.74, 9.4]} />
        <MetalTrimMaterial variant="046" />
      </mesh>
      <mesh position={[0, 10.8, -1.2]} castShadow>
        <boxGeometry args={[9.6, 1.12, 6.8]} />
        <PremiumSurface visualTone="calm-dwell" />
      </mesh>
      <mesh position={[0, 3.45, 4.55]} castShadow>
        <boxGeometry args={[7.6, 5.8, 1.14]} />
        <PremiumSurface visualTone="calm-dwell" />
      </mesh>
      <mesh position={[-3.95, 2.85, 3.05]} castShadow>
        <boxGeometry args={[2.4, 4.8, 2.2]} />
        <ConcreteMasterMaterial />
      </mesh>
      <mesh position={[3.95, 2.85, 3.05]} castShadow>
        <boxGeometry args={[2.4, 4.8, 2.2]} />
        <ConcreteMasterMaterial />
      </mesh>
      <mesh position={[0, 1.0, 5.35]} receiveShadow>
        <boxGeometry args={[7.2, 0.1, 0.72]} />
        <meshStandardMaterial color="#58756f" emissive={accentColor} emissiveIntensity={0.008} roughness={0.74} metalness={0.1} />
      </mesh>
      <mesh position={[0, 7.55, 3.1]} castShadow>
        <boxGeometry args={[5.8, 1.7, 0.84]} />
        <MetalTrimMaterial variant="046" />
      </mesh>
      <mesh position={[-7.4, 3.4, 1.9]} castShadow>
        <boxGeometry args={[1.48, 5.6, 5.4]} />
        <PremiumSurface visualTone="calm-dwell" />
      </mesh>
      <mesh position={[7.4, 3.4, 1.9]} castShadow>
        <boxGeometry args={[1.48, 5.6, 5.4]} />
        <PremiumSurface visualTone="calm-dwell" />
      </mesh>
    </group>
  );
}

function SupportFrontage({ accentColor }: { accentColor: string }) {
  const tone = resolveToneSurface('orientation');
  return (
    <group>
      <mesh position={[0, 0.12, 0.6]} receiveShadow>
        <boxGeometry args={[13.8, 0.22, 8.8]} />
        <ConcreteMasterMaterial />
      </mesh>
      <mesh position={[0, 4.2, -0.85]} castShadow>
        <boxGeometry args={[10.2, 7.8, 8.8]} />
        <ConcreteMasterMaterial />
      </mesh>
      <mesh position={[0, 4.45, -4.65]} castShadow>
        <boxGeometry args={[8.6, 6.5, 0.84]} />
        <PremiumSurface color={tone.shell} visualTone="orientation" />
      </mesh>
      <mesh position={[0, 7.95, -0.45]} castShadow>
        <boxGeometry args={[10.4, 0.62, 7.8]} />
        <MetalTrimMaterial variant="046" />
      </mesh>
      <mesh position={[0, 9.35, -1.1]} castShadow>
        <boxGeometry args={[8.2, 0.92, 5.4]} />
        <PremiumSurface color="#eef2f5" visualTone="orientation" />
      </mesh>
      <mesh position={[-4.8, 3.9, 0.2]} rotation={[0, 0.06, 0]} castShadow>
        <boxGeometry args={[1.1, 7.2, 8.2]} />
        <ShellMaterial color={accentColor} emissiveIntensity={tone.glow} />
      </mesh>
      <mesh position={[4.8, 3.9, 0.2]} rotation={[0, -0.06, 0]} castShadow>
        <boxGeometry args={[1.1, 7.2, 8.2]} />
        <ShellMaterial color={accentColor} emissiveIntensity={tone.glow} />
      </mesh>
      <mesh position={[0, 2.35, 4.4]} castShadow>
        <boxGeometry args={[7.6, 3.7, 1.08]} />
        <ConcreteMasterMaterial />
      </mesh>
      <mesh position={[0, 0.92, 4.6]} receiveShadow>
        <boxGeometry args={[6.2, 0.12, 0.94]} />
        <meshStandardMaterial color="#667585" emissive={accentColor} emissiveIntensity={0.01} roughness={0.72} metalness={0.12} />
      </mesh>
      <mesh position={[0, 6.45, 2.95]} castShadow>
        <boxGeometry args={[4.8, 1.8, 0.82]} />
        <MetalTrimMaterial variant="046" />
      </mesh>
      <mesh position={[-6.2, 2.7, 1.8]} castShadow>
        <boxGeometry args={[1.22, 4.8, 4.4]} />
        <PremiumSurface color="#eef2f5" visualTone="orientation" />
      </mesh>
      <mesh position={[6.2, 2.7, 1.8]} castShadow>
        <boxGeometry args={[1.22, 4.8, 4.4]} />
        <PremiumSurface color="#eef2f5" visualTone="orientation" />
      </mesh>
    </group>
  );
}

function resolveArchetype(template: SponsorBoothTemplate, visualTone: ExpoDistrictExpressionMode) {
  if (visualTone === 'active-commercial' || template.startsWith('hero_') || template.startsWith('premium_')) {
    return 'active';
  }
  if (visualTone === 'calm-dwell') {
    return 'calm';
  }
  return 'support';
}

export function BoothArchitectureKit({
  accentColor,
  template,
  visualTone = 'active-commercial',
}: {
  accentColor: string;
  template: SponsorBoothTemplate;
  visualTone?: ExpoDistrictExpressionMode;
}) {
  const archetype = resolveArchetype(template, visualTone);

  if (archetype === 'active') {
    return <ActiveFrontage accentColor={accentColor} />;
  }

  if (archetype === 'calm') {
    return <CalmFrontage accentColor={accentColor} />;
  }

  return <SupportFrontage accentColor={accentColor} />;
}
