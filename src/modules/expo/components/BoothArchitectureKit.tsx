import type { SponsorBoothTemplate } from '../lib/sponsorBoothPresentation';

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

function ShellMaterial({ color, emissiveIntensity = 0.14 }: { color: string; emissiveIntensity?: number }) {
  return <meshStandardMaterial color={color} emissive={color} emissiveIntensity={emissiveIntensity} />;
}

function PremiumSurface({ color = '#0f172a' }: { color?: string }) {
  return <meshStandardMaterial color={color} metalness={0.16} roughness={0.72} />;
}

export function getBoothArchitectureMetrics(template: SponsorBoothTemplate) {
  return METRICS[template];
}

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

export function BoothArchitectureKit({
  accentColor,
  template,
}: {
  accentColor: string;
  template: SponsorBoothTemplate;
}) {
  if (template === 'hero_gallery') {
    return (
      <group>
        <mesh position={[0, 0.24, 0]} receiveShadow>
          <boxGeometry args={[26, 0.48, 20]} />
          <meshStandardMaterial color="#dfe7f2" />
        </mesh>
        <mesh position={[0, 9.8, -8.1]} castShadow>
          <boxGeometry args={[24, 16, 1.1]} />
          <PremiumSurface />
        </mesh>
        <mesh position={[0, 17.2, -1.4]} castShadow>
          <boxGeometry args={[26, 1.1, 17]} />
          <PremiumSurface color="#111827" />
        </mesh>
        <mesh position={[-12.1, 8.6, -1.5]} castShadow>
          <boxGeometry args={[1.15, 17.2, 17]} />
          <ShellMaterial color={accentColor} emissiveIntensity={0.18} />
        </mesh>
        <mesh position={[12.1, 8.6, -1.5]} castShadow>
          <boxGeometry args={[1.15, 17.2, 17]} />
          <ShellMaterial color={accentColor} emissiveIntensity={0.18} />
        </mesh>
        <mesh position={[0, 15.6, 6.3]} castShadow rotation={[0, 0.2, 0]}>
          <boxGeometry args={[18, 0.55, 2.4]} />
          <ShellMaterial color="#c7d2fe" emissiveIntensity={0.04} />
        </mesh>
      </group>
    );
  }

  if (template === 'hero_forum') {
    return (
      <group>
        <mesh position={[0, 0.26, 0]} receiveShadow>
          <cylinderGeometry args={[11.4, 13.8, 0.4, 36]} />
          <meshStandardMaterial color="#e5e7eb" />
        </mesh>
        <mesh position={[0, 9.6, -6.2]} castShadow>
          <boxGeometry args={[24, 15.6, 1]} />
          <PremiumSurface />
        </mesh>
        <mesh position={[-9.4, 8.2, 0.6]} castShadow>
          <cylinderGeometry args={[0.95, 1.15, 16.4, 18]} />
          <ShellMaterial color={accentColor} emissiveIntensity={0.18} />
        </mesh>
        <mesh position={[9.4, 8.2, 0.6]} castShadow>
          <cylinderGeometry args={[0.95, 1.15, 16.4, 18]} />
          <ShellMaterial color={accentColor} emissiveIntensity={0.18} />
        </mesh>
        <mesh position={[0, 16.7, 0]} castShadow>
          <torusGeometry args={[10.4, 0.72, 18, 48]} />
          <ShellMaterial color="#dbeafe" emissiveIntensity={0.06} />
        </mesh>
        <mesh position={[0, 14.6, 6.3]} castShadow>
          <boxGeometry args={[16, 0.5, 2]} />
          <PremiumSurface color="#172554" />
        </mesh>
      </group>
    );
  }

  if (template === 'premium_spine') {
    return (
      <group>
        <mesh position={[0, 0.22, 0]} receiveShadow>
          <boxGeometry args={[20, 0.44, 16]} />
          <meshStandardMaterial color="#dbe4ef" />
        </mesh>
        <mesh position={[0, 8.6, -6.3]} castShadow>
          <boxGeometry args={[18, 13.5, 1]} />
          <PremiumSurface />
        </mesh>
        <mesh position={[-8.5, 8.4, 0]} castShadow>
          <boxGeometry args={[1, 13.2, 13]} />
          <ShellMaterial color={accentColor} emissiveIntensity={0.16} />
        </mesh>
        <mesh position={[0, 14.8, -0.2]} castShadow>
          <boxGeometry args={[18, 0.8, 13]} />
          <PremiumSurface color="#111827" />
        </mesh>
      </group>
    );
  }

  if (template === 'premium_portal') {
    return (
      <group>
        <mesh position={[0, 0.2, 0]} receiveShadow>
          <boxGeometry args={[22, 0.4, 14]} />
          <meshStandardMaterial color="#e5ecf6" />
        </mesh>
        <mesh position={[0, 7.8, -4.8]} castShadow>
          <boxGeometry args={[20, 12.8, 1]} />
          <PremiumSurface />
        </mesh>
        <mesh position={[-9, 7.4, 1.2]} castShadow>
          <boxGeometry args={[1, 14.2, 10.4]} />
          <ShellMaterial color={accentColor} emissiveIntensity={0.16} />
        </mesh>
        <mesh position={[9, 7.4, 1.2]} castShadow>
          <boxGeometry args={[1, 14.2, 10.4]} />
          <ShellMaterial color={accentColor} emissiveIntensity={0.16} />
        </mesh>
        <mesh position={[0, 14.2, 1.2]} castShadow>
          <boxGeometry args={[18.5, 0.7, 10.6]} />
          <PremiumSurface color="#0b1120" />
        </mesh>
        <mesh position={[0, 0.5, 5.6]} receiveShadow>
          <boxGeometry args={[10.6, 0.1, 1.4]} />
          <ShellMaterial color={accentColor} emissiveIntensity={0.22} />
        </mesh>
      </group>
    );
  }

  if (template === 'standard_arcade') {
    return (
      <group>
        <mesh position={[0, 0.16, 0]} receiveShadow>
          <boxGeometry args={[15, 0.3, 10.5]} />
          <meshStandardMaterial color="#e5edf7" />
        </mesh>
        <mesh position={[0, 5.7, -2.9]} castShadow>
          <boxGeometry args={[12.8, 8.8, 0.85]} />
          <PremiumSurface />
        </mesh>
        <mesh position={[-5.2, 4.8, 0.4]} castShadow>
          <boxGeometry args={[0.72, 9.2, 7.2]} />
          <ShellMaterial color={accentColor} emissiveIntensity={0.14} />
        </mesh>
        <mesh position={[5.2, 4.8, 0.4]} castShadow>
          <boxGeometry args={[0.72, 9.2, 7.2]} />
          <ShellMaterial color={accentColor} emissiveIntensity={0.14} />
        </mesh>
        <mesh position={[0, 9.5, 0.2]} castShadow>
          <boxGeometry args={[12.2, 0.5, 7.2]} />
          <PremiumSurface color="#111827" />
        </mesh>
      </group>
    );
  }

  return (
    <group>
      <mesh position={[0, 0.16, 0]} receiveShadow>
        <boxGeometry args={[14, 0.32, 10]} />
        <meshStandardMaterial color="#e5edf7" />
      </mesh>
      <mesh position={[0, 5.8, -3.4]} castShadow>
        <boxGeometry args={[12, 9, 0.9]} />
        <PremiumSurface />
      </mesh>
      <mesh position={[0, 10.25, -0.4]} castShadow rotation={[0, 0.08, 0]}>
        <boxGeometry args={[12, 0.7, 7.4]} />
        <ShellMaterial color={accentColor} emissiveIntensity={0.16} />
      </mesh>
      <mesh position={[0, 6.4, 4]} castShadow rotation={[0, -0.12, 0]}>
        <boxGeometry args={[8.6, 0.38, 1.6]} />
        <PremiumSurface color="#cbd5e1" />
      </mesh>
    </group>
  );
}
