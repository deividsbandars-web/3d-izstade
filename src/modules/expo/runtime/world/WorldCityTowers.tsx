import type { ExpoWorldVisualProfile } from '../../world-contract';
import type { StadiumReserve } from './WorldCitySkeletonLayout';

type CityTower = {
  id: string;
  position: [number, number, number];
  baseSize: [number, number, number];
  upperSize: [number, number, number];
  color: string;
  crownColor: string;
  role?: 'hero' | 'mid' | 'support' | 'outer-support';
  composition?: 'hero' | 'standard' | 'minimal';
};

type TowerDecorSpec = {
  podiumWidthMultiplier: number;
  podiumDepthMultiplier: number;
  sideFinHeight: number;
  rearFinHeight: number;
  crownBandHeight: number;
  midBandHeight: number;
  hasInsetMass: boolean;
  hasCrownPlate: boolean;
  hasCrownPods: boolean;
  hasSpire: boolean;
  rearFinEmissive: number;
  sideFinEmissive: number;
  insetEmissive: number;
};

function getTowerDecorSpec(tower: CityTower): TowerDecorSpec {
  switch (tower.composition ?? tower.role ?? 'standard') {
    case 'hero':
      return {
        podiumWidthMultiplier: 1.65,
        podiumDepthMultiplier: 1.7,
        sideFinHeight: 72,
        rearFinHeight: 48,
        crownBandHeight: 12,
        midBandHeight: 18,
        hasInsetMass: true,
        hasCrownPlate: true,
        hasCrownPods: true,
        hasSpire: true,
        rearFinEmissive: 0.018,
        sideFinEmissive: 0.026,
        insetEmissive: 0.018,
      };
    case 'minimal':
      return {
        podiumWidthMultiplier: tower.role === 'outer-support' ? 1.45 : 1.24,
        podiumDepthMultiplier: tower.role === 'outer-support' ? 1.5 : 1.28,
        sideFinHeight: tower.role === 'outer-support' ? 28 : 22,
        rearFinHeight: 18,
        crownBandHeight: 0,
        midBandHeight: 0,
        hasInsetMass: false,
        hasCrownPlate: false,
        hasCrownPods: false,
        hasSpire: false,
        rearFinEmissive: 0.01,
        sideFinEmissive: 0.026,
        insetEmissive: 0,
      };
    default:
      return {
        podiumWidthMultiplier: 1.45,
        podiumDepthMultiplier: 1.5,
        sideFinHeight: 36,
        rearFinHeight: 26,
        crownBandHeight: 8,
        midBandHeight: 10,
        hasInsetMass: true,
        hasCrownPlate: false,
        hasCrownPods: false,
        hasSpire: false,
        rearFinEmissive: 0.018,
        sideFinEmissive: 0.026,
        insetEmissive: 0.01,
      };
  }
}

function overlapsStadiumReserve(
  point: [number, number, number],
  reserve: StadiumReserve,
  footprint?: [number, number] | [number, number, number] | number
) {
  if (typeof footprint === 'number') {
    return (
      Math.abs(point[0] - reserve.centerX) <= reserve.halfWidth + footprint &&
      Math.abs(point[2] - reserve.centerZ) <= reserve.halfDepth + footprint
    );
  }

  if (Array.isArray(footprint)) {
    const halfX = footprint[0] * 0.5;
    const halfZ = (footprint.length === 3 ? footprint[2] : footprint[1]) * 0.5;
    return (
      Math.abs(point[0] - reserve.centerX) <= reserve.halfWidth + halfX &&
      Math.abs(point[2] - reserve.centerZ) <= reserve.halfDepth + halfZ
    );
  }

  return (
    Math.abs(point[0] - reserve.centerX) <= reserve.halfWidth &&
    Math.abs(point[2] - reserve.centerZ) <= reserve.halfDepth
  );
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

function WorldArchitecturalMassMaterial({
  fallbackColor,
  globalHudAccent,
  emissive = '#000000',
  emissiveIntensity = 0,
}: {
  fallbackColor: string;
  globalHudAccent: string;
  emissive?: string;
  emissiveIntensity?: number;
}) {
  const base = emissiveIntensity > 0.012
    ? tintHex(fallbackColor, 0.1)
    : tintHex(shadeHex(fallbackColor, 0.08), 0.04);
  const color = emissiveIntensity > 0.02 ? tintHex(base, 0.04) : base;

  return (
    <meshStandardMaterial
      color={color}
      roughness={emissiveIntensity > 0.012 ? 0.66 : 0.74}
      metalness={0.06}
      emissive={emissive}
      emissiveIntensity={emissiveIntensity + (emissiveIntensity > 0 && emissive === globalHudAccent ? 0.004 : 0)}
    />
  );
}

export function WorldCityTowers({
  towers,
  stadiumReserve,
  visualProfile,
}: {
  towers: CityTower[];
  stadiumReserve: StadiumReserve;
  visualProfile: ExpoWorldVisualProfile;
}) {
  const hiddenTowerIds = new Set([
    'meetings-hero-tower-right',
    '75c36ca5-1c8e-4bd7-b61c-7cafd988fcf1-support-tower-right',
    '75c36ca5-1c8e-4bd7-b61c-7cafd988fcf1-support-tower-left',
    '1a459ffc-d447-4899-97e5-7af7b562487d-support-tower-left',
    '1a459ffc-d447-4899-97e5-7af7b562487d-outer-support-tower-right',
  ]);
  return (
    <>
      {towers
        .filter((tower) => !hiddenTowerIds.has(tower.id))
        .filter((tower) => !overlapsStadiumReserve(tower.position, stadiumReserve, tower.baseSize))
        .map((tower) => {
          const isHero = tower.role === 'hero';
          const side = tower.position[0] < 0 ? -1 : 1;
          const decor = getTowerDecorSpec(tower);
          const podiumWidth = tower.baseSize[0] * decor.podiumWidthMultiplier;
          const podiumDepth = tower.baseSize[2] * decor.podiumDepthMultiplier;

          return (
          <group key={tower.id} name={`city-tower:${tower.id}`} position={[tower.position[0], 0, tower.position[2]]}>
            <mesh receiveShadow position={[0, tower.baseSize[1] * 0.08, 0]}>
              <boxGeometry args={[podiumWidth, tower.baseSize[1] * 0.16, podiumDepth]} />
              <WorldArchitecturalMassMaterial
                fallbackColor="#d9e4ea"
                globalHudAccent={visualProfile.global.hudAccent}
                emissive={tower.crownColor}
                emissiveIntensity={0.012}
              />
            </mesh>
            <mesh receiveShadow position={[0, tower.baseSize[1] * 0.5, 0]}>
              <boxGeometry args={tower.baseSize} />
              <WorldArchitecturalMassMaterial
                fallbackColor={tower.color}
                globalHudAccent={visualProfile.global.hudAccent}
                emissive={tower.crownColor}
                emissiveIntensity={0.01}
              />
            </mesh>
            <mesh position={[0, tower.baseSize[1] + (tower.upperSize[1] * 0.5) - 18, 0]} receiveShadow>
              <boxGeometry args={tower.upperSize} />
              <WorldArchitecturalMassMaterial
                fallbackColor="#94a6b2"
                globalHudAccent={visualProfile.global.hudAccent}
                emissive={tower.crownColor}
                emissiveIntensity={0.012}
              />
            </mesh>
            <mesh position={[side * (tower.baseSize[0] * 0.38), tower.baseSize[1] * 0.58, 0]} receiveShadow>
              <boxGeometry args={[tower.baseSize[0] * 0.16, decor.sideFinHeight, tower.baseSize[2] * 0.48]} />
              <WorldArchitecturalMassMaterial
                fallbackColor="#6f7b85"
                globalHudAccent={visualProfile.global.hudAccent}
                emissive={tower.crownColor}
                emissiveIntensity={decor.sideFinEmissive}
              />
            </mesh>
            <mesh position={[0, tower.baseSize[1] * 0.58, -tower.baseSize[2] * 0.28]} receiveShadow>
              <boxGeometry args={[tower.baseSize[0] * 0.42, decor.rearFinHeight, tower.baseSize[2] * 0.18]} />
              <WorldArchitecturalMassMaterial
                fallbackColor="#65717b"
                globalHudAccent={visualProfile.global.hudAccent}
                emissive={tower.crownColor}
                emissiveIntensity={decor.rearFinEmissive}
              />
            </mesh>
            {decor.hasInsetMass && (
              <mesh position={[-side * (tower.baseSize[0] * 0.22), tower.baseSize[1] * 0.32, 0]} receiveShadow>
                <boxGeometry args={[tower.baseSize[0] * 0.38, tower.baseSize[1] * 0.2, tower.baseSize[2] * 0.4]} />
                <WorldArchitecturalMassMaterial
                  fallbackColor="#5f6a73"
                  globalHudAccent={visualProfile.global.hudAccent}
                  emissive={tower.crownColor}
                  emissiveIntensity={decor.insetEmissive}
                />
              </mesh>
            )}
            {decor.hasCrownPlate && (
              <mesh position={[0, tower.baseSize[1] + tower.upperSize[1] - 8, 0]}>
              <boxGeometry args={[tower.baseSize[0] * 0.62, 1.8, tower.baseSize[2] * 0.62]} />
              <meshStandardMaterial color={tower.crownColor} emissive={tower.crownColor} emissiveIntensity={isHero ? 0.05 : 0.024} metalness={0.16} roughness={0.34} />
              </mesh>
            )}
            {decor.midBandHeight > 0 && (
              <mesh position={[0, tower.baseSize[1] + (tower.upperSize[1] * 0.48), 0]} receiveShadow>
              <boxGeometry args={[tower.upperSize[0] * 1.08, decor.midBandHeight, tower.upperSize[2] * 0.34]} />
              <meshStandardMaterial color={isHero ? '#7b8a95' : '#6d7983'} emissive={tower.crownColor} emissiveIntensity={isHero ? 0.03 : 0.014} roughness={isHero ? 0.44 : 0.5} metalness={0.14} />
              </mesh>
            )}
            {decor.crownBandHeight > 0 && (
              <mesh position={[0, tower.baseSize[1] + tower.upperSize[1] + 6, 0]} receiveShadow>
              <boxGeometry args={[tower.upperSize[0] * 0.78, decor.crownBandHeight, tower.upperSize[2] * 0.78]} />
              <meshStandardMaterial color={isHero ? '#778692' : '#66727c'} emissive={tower.crownColor} emissiveIntensity={isHero ? 0.036 : 0.014} roughness={isHero ? 0.42 : 0.5} metalness={0.16} />
              </mesh>
            )}
            {decor.hasCrownPods && (
              <>
                <mesh position={[side * (tower.upperSize[0] * 0.36), tower.baseSize[1] + tower.upperSize[1] + 3, 0]} receiveShadow>
                  <boxGeometry args={[tower.upperSize[0] * 0.14, decor.crownBandHeight + 6, tower.upperSize[2] * 0.26]} />
                  <meshStandardMaterial color={isHero ? '#8897a3' : '#6e7b84'} emissive={tower.crownColor} emissiveIntensity={isHero ? 0.03 : 0.01} roughness={isHero ? 0.42 : 0.5} metalness={0.16} />
                </mesh>
                <mesh position={[-side * (tower.upperSize[0] * 0.26), tower.baseSize[1] + tower.upperSize[1] - 2, -tower.upperSize[2] * 0.12]} receiveShadow>
                  <boxGeometry args={[tower.upperSize[0] * 0.18, decor.crownBandHeight + 4, tower.upperSize[2] * 0.18]} />
                  <meshStandardMaterial color={isHero ? '#7f8d98' : '#5e6973'} emissive={tower.crownColor} emissiveIntensity={isHero ? 0.022 : 0.008} roughness={isHero ? 0.44 : 0.52} metalness={0.14} />
                </mesh>
              </>
            )}
            {decor.hasSpire && (
              <>
                <mesh position={[0, tower.baseSize[1] + tower.upperSize[1] + 22, 0]}>
                <boxGeometry args={[tower.upperSize[0] * 0.48, 24, tower.upperSize[2] * 0.48]} />
                <meshStandardMaterial color="#a2b3bf" emissive={tower.crownColor} emissiveIntensity={0.036} metalness={0.16} roughness={0.34} />
                </mesh>
                <mesh position={[0, tower.baseSize[1] + tower.upperSize[1] + 44, 0]}>
                  <cylinderGeometry args={[tower.upperSize[0] * 0.12, tower.upperSize[0] * 0.18, 18, 12]} />
                  <meshStandardMaterial color="#c0d2de" emissive={tower.crownColor} emissiveIntensity={0.05} metalness={0.22} roughness={0.26} />
                </mesh>
              </>
            )}
          </group>
        )})}
    </>
  );
}
