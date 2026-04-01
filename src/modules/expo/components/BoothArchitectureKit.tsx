import { useTexture } from '@react-three/drei';
import { useMemo } from 'react';
import * as THREE from 'three';
import type { SponsorBoothTemplate } from '../lib/sponsorBoothPresentation';
import type { ExpoDistrictExpressionMode } from '../lib/boulevardLayout';

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

const METRICS: Record<SponsorBoothTemplate, BoothArchitectureMetrics> = {
  hero_forum: {
    badgePosition: [0, 18.8, -5.5],
    colliderSize: [28, 18, 20],
    ctaPosition: [0, 1.45, 6.6],
    footprintSize: [36, 26],
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
    colliderSize: [24, 18, 18],
    ctaPosition: [0, 1.6, 6.4],
    footprintSize: [34, 26],
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
    colliderSize: [20, 15, 15],
    ctaPosition: [0, 1.4, 5.1],
    footprintSize: [26, 18],
    insertPosition: [0, 0.16, -2.2],
    insertScale: 1.75,
    logoPanelPosition: [6.6, 8.9, 3.2],
    mediaWallPosition: [0, 7.4, -4.7],
    sectorLabelPosition: [0, 0.72, -6.8],
    taglinePosition: [0, 10.4, -4.4],
    titleMaxWidth: 12,
    titlePosition: [0, 12.9, -4.4],
  },
  premium_spine: {
    badgePosition: [0, 15.6, -5.2],
    colliderSize: [19, 15, 14],
    ctaPosition: [0, 1.45, 5.8],
    footprintSize: [28, 20],
    insertPosition: [-2.6, 0.2, -2.2],
    insertScale: 1.8,
    logoPanelPosition: [-7.4, 10.4, 3.8],
    mediaWallPosition: [0, 7.8, -5.7],
    sectorLabelPosition: [0, 0.72, -8.9],
    taglinePosition: [0, 10.6, -5.3],
    titleMaxWidth: 14,
    titlePosition: [0, 13, -5.3],
  },
  standard_arcade: {
    badgePosition: [0, 12.1, -2.3],
    colliderSize: [15, 11, 11],
    ctaPosition: [0, 1.3, 3.4],
    footprintSize: [18, 14],
    insertPosition: [0, 0.14, -1.5],
    insertScale: 1.3,
    logoPanelPosition: [0, 8.2, 3.6],
    mediaWallPosition: [0, 5.6, -2.8],
    sectorLabelPosition: [0, 0.72, -4.8],
    taglinePosition: [0, 8.4, -2.4],
    titleMaxWidth: 10,
    titlePosition: [0, 10.7, -2.4],
  },
  standard_studio: {
    badgePosition: [0, 12.4, -2.4],
    colliderSize: [14, 10, 10],
    ctaPosition: [0, 1.4, 3.2],
    footprintSize: [18, 14],
    insertPosition: [0, 0.12, -1.8],
    insertScale: 1.35,
    logoPanelPosition: [0, 8.15, 3.8],
    mediaWallPosition: [0, 5.5, -3.1],
    sectorLabelPosition: [0, 0.72, -4.8],
    taglinePosition: [0, 8.55, -2.6],
    titleMaxWidth: 10,
    titlePosition: [0, 10.8, -2.5],
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
  visualTone = 'active-commercial',
}: {
  color: string;
  emissiveIntensity?: number;
  visualTone?: ExpoDistrictExpressionMode;
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

function configureRepeatedTexture(texture: THREE.Texture | null | undefined, repeat: [number, number], color = false) {
  if (!texture) {
    return undefined;
  }

  const clone = texture.clone();
  clone.wrapS = THREE.RepeatWrapping;
  clone.wrapT = THREE.RepeatWrapping;
  clone.repeat.set(repeat[0], repeat[1]);
  clone.colorSpace = color ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  clone.needsUpdate = true;
  return clone;
}

function useRepeatedTextureSet({
  colorUrl,
  normalUrl,
  repeat,
  roughnessUrl,
}: {
  colorUrl: string;
  normalUrl: string;
  repeat: [number, number];
  roughnessUrl: string;
}) {
  const textures = useTexture({
    map: colorUrl,
    normalMap: normalUrl,
    roughnessMap: roughnessUrl,
  });
  return useMemo(() => {
    return {
      map: configureRepeatedTexture(textures.map, repeat, true),
      normalMap: configureRepeatedTexture(textures.normalMap, repeat),
      roughnessMap: configureRepeatedTexture(textures.roughnessMap, repeat),
    };
  }, [repeat, textures.map, textures.normalMap, textures.roughnessMap]);
}

function useRepeatedMetalTextureSet({
  colorUrl,
  metalnessUrl,
  normalUrl,
  repeat,
  roughnessUrl,
}: {
  colorUrl: string;
  metalnessUrl: string;
  normalUrl: string;
  repeat: [number, number];
  roughnessUrl: string;
}) {
  const textures = useTexture({
    map: colorUrl,
    metalnessMap: metalnessUrl,
    normalMap: normalUrl,
    roughnessMap: roughnessUrl,
  });
  return useMemo(() => {
    return {
      map: configureRepeatedTexture(textures.map, repeat, true),
      metalnessMap: configureRepeatedTexture(textures.metalnessMap, repeat),
      normalMap: configureRepeatedTexture(textures.normalMap, repeat),
      roughnessMap: configureRepeatedTexture(textures.roughnessMap, repeat),
    };
  }, [repeat, textures.map, textures.metalnessMap, textures.normalMap, textures.roughnessMap]);
}

function ConcreteMasterMaterial() {
  const textures = useRepeatedTextureSet({
    colorUrl: '/textures/expo/master-phase/concrete/concrete_diff_4k.png',
    normalUrl: '/textures/expo/master-phase/concrete/concrete_nor_gl_4k.png',
    repeat: [2.2, 2.2],
    roughnessUrl: '/textures/expo/master-phase/concrete/concrete_rough_4k.png',
  });

  return <meshStandardMaterial color="#e8eef4" map={textures.map} metalness={0.04} normalMap={textures.normalMap} roughness={0.72} roughnessMap={textures.roughnessMap} />;
}

function FactoryWallMaterial() {
  const textures = useRepeatedTextureSet({
    colorUrl: '/textures/expo/master-phase/factory-wall/factory_wall_diff_4k.png',
    normalUrl: '/textures/expo/master-phase/factory-wall/factory_wall_nor_gl_4k.png',
    repeat: [2.4, 1.4],
    roughnessUrl: '/textures/expo/master-phase/factory-wall/factory_wall_rough_4k.png',
  });

  return <meshStandardMaterial color="#5f7688" map={textures.map} metalness={0.14} normalMap={textures.normalMap} roughness={0.66} roughnessMap={textures.roughnessMap} />;
}

function MetalTrimMaterial({ variant = '045' }: { variant?: '045' | '046' }) {
  const textures = useRepeatedMetalTextureSet({
    colorUrl: variant === '045'
      ? '/textures/expo/master-phase/metal-045/Metal045A_4K-JPG_Color.jpg'
      : '/textures/expo/master-phase/metal-046/Metal046A_4K-JPG_Color.jpg',
    metalnessUrl: variant === '045'
      ? '/textures/expo/master-phase/metal-045/Metal045A_4K-JPG_Metalness.jpg'
      : '/textures/expo/master-phase/metal-046/Metal046A_4K-JPG_Metalness.jpg',
    normalUrl: variant === '045'
      ? '/textures/expo/master-phase/metal-045/Metal045A_4K-JPG_NormalGL.jpg'
      : '/textures/expo/master-phase/metal-046/Metal046A_4K-JPG_NormalGL.jpg',
    repeat: [1.4, 1.4],
    roughnessUrl: variant === '045'
      ? '/textures/expo/master-phase/metal-045/Metal045A_4K-JPG_Roughness.jpg'
      : '/textures/expo/master-phase/metal-046/Metal046A_4K-JPG_Roughness.jpg',
  });

  return (
    <meshStandardMaterial
      color={variant === '045' ? '#ccd6e2' : '#60748a'}
      map={textures.map}
      metalness={0.4}
      metalnessMap={textures.metalnessMap}
      normalMap={textures.normalMap}
      roughness={0.58}
      roughnessMap={textures.roughnessMap}
    />
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function getBoothArchitectureMetrics(template: SponsorBoothTemplate) {
  return METRICS[template];
}

// eslint-disable-next-line react-refresh/only-export-components
export function getBoothColliderSegments(template: SponsorBoothTemplate): BoothColliderSegment[] {
  const metrics = getBoothArchitectureMetrics(template);
  const height = Math.max(6, metrics.colliderSize[1] * 0.94);
  const sideDepth = Math.max(6.2, metrics.footprintSize[1] * 0.62);
  const sideThickness = Math.max(0.85, metrics.colliderSize[0] * 0.06);
  const rearThickness = Math.max(0.95, metrics.colliderSize[2] * 0.08);
  const sideX = (metrics.footprintSize[0] * 0.5) - (sideThickness * 0.5) - 0.9;
  const rearZ = -(metrics.footprintSize[1] * 0.5) + (rearThickness * 0.5) + 1.2;

  return [
    {
      id: 'rear',
      position: [0, height * 0.5, rearZ],
      size: [Math.max(8, metrics.footprintSize[0] * 0.72), height, rearThickness],
    },
    {
      id: 'left',
      position: [-sideX, height * 0.5, -0.6],
      size: [sideThickness, height, sideDepth],
    },
    {
      id: 'right',
      position: [sideX, height * 0.5, -0.6],
      size: [sideThickness, height, sideDepth],
    },
  ];
}

function ActiveFrontage({ accentColor }: { accentColor: string }) {
  return (
    <group>
      <mesh position={[0, 0.14, 1.1]} receiveShadow>
        <boxGeometry args={[19.6, 0.32, 10.4]} />
        <ConcreteMasterMaterial />
      </mesh>
      <mesh position={[0, 0.34, 5.95]} receiveShadow>
        <boxGeometry args={[11.8, 0.18, 1.42]} />
        <meshStandardMaterial color="#31536f" emissive={accentColor} emissiveIntensity={0.025} roughness={0.56} metalness={0.18} />
      </mesh>
      <mesh position={[0, 5.2, -0.5]} castShadow>
        <boxGeometry args={[16.2, 10.6, 9.8]} />
        <FactoryWallMaterial />
      </mesh>
      <mesh position={[0, 5.9, -5.4]} castShadow>
        <boxGeometry args={[15.2, 10.2, 1.2]} />
        <PremiumSurface visualTone="active-commercial" />
      </mesh>
      <mesh position={[0, 11.2, -0.4]} castShadow>
        <boxGeometry args={[16.6, 0.82, 9.4]} />
        <MetalTrimMaterial variant="046" />
      </mesh>
      <mesh position={[0, 2.65, 1.95]} castShadow>
        <boxGeometry args={[13.8, 0.42, 6.8]} />
        <ConcreteMasterMaterial />
      </mesh>
      <mesh position={[0, 1.9, 4.55]} castShadow>
        <boxGeometry args={[11.2, 2.8, 1.18]} />
        <ConcreteMasterMaterial />
      </mesh>
      <mesh position={[-8.2, 5.8, -0.2]} rotation={[0, 0.16, 0]} castShadow>
        <boxGeometry args={[1.2, 10.9, 10.9]} />
        <MetalTrimMaterial variant="046" />
      </mesh>
      <mesh position={[8.2, 5.8, -0.2]} rotation={[0, -0.16, 0]} castShadow>
        <boxGeometry args={[1.2, 10.9, 10.9]} />
        <MetalTrimMaterial variant="046" />
      </mesh>
      <mesh position={[-5.8, 2.35, 5.35]} castShadow>
        <boxGeometry args={[2.8, 4.5, 1.35]} />
        <MetalTrimMaterial variant="045" />
      </mesh>
      <mesh position={[5.8, 2.35, 5.35]} castShadow>
        <boxGeometry args={[2.8, 4.5, 1.35]} />
        <MetalTrimMaterial variant="045" />
      </mesh>
      <mesh position={[0, 8.75, -4.7]} castShadow>
        <boxGeometry args={[15.85, 4.95, 0.14]} />
        <MetalTrimMaterial variant="045" />
      </mesh>
      <mesh position={[0, 9.35, 3.45]} castShadow>
        <boxGeometry args={[6.2, 3.1, 0.92]} />
        <FactoryWallMaterial />
      </mesh>
      <mesh position={[0, 6.5, -0.9]} castShadow>
        <boxGeometry args={[18.8, 0.22, 0.22]} />
        <meshStandardMaterial color="#4f7290" emissive={accentColor} emissiveIntensity={0.018} roughness={0.6} metalness={0.22} />
      </mesh>
    </group>
  );
}

function CalmFrontage({ accentColor }: { accentColor: string }) {
  const tone = resolveToneSurface('calm-dwell');
  return (
    <group>
      <mesh position={[0, 0.14, 0.9]} receiveShadow>
        <boxGeometry args={[15.4, 0.24, 9.8]} />
        <ConcreteMasterMaterial />
      </mesh>
      <mesh position={[0, 4.4, -0.3]} castShadow>
        <boxGeometry args={[12.4, 8.2, 8.8]} />
        <ConcreteMasterMaterial />
      </mesh>
      <mesh position={[0, 4.85, -4.6]} castShadow>
        <boxGeometry args={[11.4, 7.4, 1]} />
        <PremiumSurface visualTone="calm-dwell" />
      </mesh>
      <mesh position={[-5.4, 4.5, 0.4]} rotation={[0, 0.1, 0]} castShadow>
        <boxGeometry args={[0.98, 8.4, 8.8]} />
        <ShellMaterial color={accentColor} emissiveIntensity={tone.glow} visualTone="calm-dwell" />
      </mesh>
      <mesh position={[5.4, 4.5, 0.4]} rotation={[0, -0.1, 0]} castShadow>
        <boxGeometry args={[0.98, 8.4, 8.8]} />
        <ShellMaterial color={accentColor} emissiveIntensity={tone.glow} visualTone="calm-dwell" />
      </mesh>
      <mesh position={[0, 8.9, -0.1]} castShadow>
        <boxGeometry args={[12.8, 0.72, 8.1]} />
        <MetalTrimMaterial variant="046" />
      </mesh>
      <mesh position={[0, 1.75, 3.7]} castShadow>
        <boxGeometry args={[8.2, 2.7, 0.92]} />
        <ConcreteMasterMaterial />
      </mesh>
      <mesh position={[0, 0.38, 4.7]} receiveShadow>
        <boxGeometry args={[6.2, 0.08, 1.1]} />
        <meshStandardMaterial color="#517a76" emissive={accentColor} emissiveIntensity={0.015} roughness={0.62} metalness={0.12} />
      </mesh>
      <mesh position={[0, 7.2, 3.2]} castShadow>
        <boxGeometry args={[5.2, 2.2, 0.8]} />
        <MetalTrimMaterial variant="046" />
      </mesh>
    </group>
  );
}

function SupportFrontage({ accentColor }: { accentColor: string }) {
  const tone = resolveToneSurface('orientation');
  return (
    <group>
      <mesh position={[0, 0.12, 0.6]} receiveShadow>
        <boxGeometry args={[13.2, 0.22, 8.6]} />
        <ConcreteMasterMaterial />
      </mesh>
      <mesh position={[0, 4.0, -0.2]} castShadow>
        <boxGeometry args={[10.2, 7.2, 7.4]} />
        <ConcreteMasterMaterial />
      </mesh>
      <mesh position={[0, 4.3, -3.75]} castShadow>
        <boxGeometry args={[9.4, 6.3, 0.82]} />
        <PremiumSurface color={tone.shell} visualTone="orientation" />
      </mesh>
      <mesh position={[0, 7.85, -0.15]} castShadow>
        <boxGeometry args={[10.8, 0.56, 6.8]} />
        <MetalTrimMaterial variant="046" />
      </mesh>
      <mesh position={[-4.5, 3.7, 0.35]} rotation={[0, 0.08, 0]} castShadow>
        <boxGeometry args={[0.82, 6.9, 6.9]} />
        <ShellMaterial color={accentColor} emissiveIntensity={tone.glow} visualTone="orientation" />
      </mesh>
      <mesh position={[4.5, 3.7, 0.35]} rotation={[0, -0.08, 0]} castShadow>
        <boxGeometry args={[0.82, 6.9, 6.9]} />
        <ShellMaterial color={accentColor} emissiveIntensity={tone.glow} visualTone="orientation" />
      </mesh>
      <mesh position={[0, 1.42, 3.85]} castShadow>
        <boxGeometry args={[6.2, 2.1, 0.88]} />
        <ConcreteMasterMaterial />
      </mesh>
      <mesh position={[0, 0.38, 3.9]} receiveShadow>
        <boxGeometry args={[5.4, 0.08, 1.05]} />
        <meshStandardMaterial color="#5c6978" emissive={accentColor} emissiveIntensity={0.012} roughness={0.68} metalness={0.12} />
      </mesh>
      <mesh position={[0, 6.2, 2.95]} castShadow>
        <boxGeometry args={[4.2, 1.7, 0.72]} />
        <MetalTrimMaterial variant="046" />
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
