import type { StadiumReserve } from './WorldCitySkeletonLayout';

type CityTower = {
  id: string;
  position: [number, number, number];
  baseSize: [number, number, number];
  upperSize: [number, number, number];
  color: string;
  crownColor: string;
};

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

function WorldArchitecturalMassMaterial({
  fallbackColor: _fallbackColor,
  emissive = '#000000',
  emissiveIntensity = 0,
}: {
  fallbackColor: string;
  emissive?: string;
  emissiveIntensity?: number;
}) {
  const color = emissiveIntensity > 0.012 ? '#afbbc5' : '#9daab5';

  return (
    <meshStandardMaterial
      color={color}
      roughness={0.74}
      metalness={0.05}
      emissive={emissive}
      emissiveIntensity={emissiveIntensity}
    />
  );
}

export function WorldCityTowers({
  towers,
  stadiumReserve,
}: {
  towers: CityTower[];
  stadiumReserve: StadiumReserve;
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
          const isHero = tower.id.includes('hero-tower');
          const isOuterSupport = tower.id.includes('outer-support-tower');
          const isSupport = tower.id.includes('support-tower') && !isOuterSupport;
          const side = tower.position[0] < 0 ? -1 : 1;
          const podiumWidth = tower.baseSize[0] * (isHero ? 1.65 : isSupport ? 1.24 : 1.45);
          const podiumDepth = tower.baseSize[2] * (isHero ? 1.7 : isSupport ? 1.28 : 1.5);
          const finHeight = isHero ? 72 : isOuterSupport ? 28 : isSupport ? 22 : 36;
          const rearFinHeight = isHero ? 48 : isOuterSupport ? 18 : isSupport ? 18 : 26;
          const crownBandHeight = isHero ? 12 : isOuterSupport ? 0 : isSupport ? 0 : 8;
          const midBandHeight = isHero ? 18 : isOuterSupport ? 0 : isSupport ? 0 : 10;

          return (
          <group key={tower.id} name={`city-tower:${tower.id}`} position={[tower.position[0], 0, tower.position[2]]}>
            <mesh receiveShadow position={[0, tower.baseSize[1] * 0.08, 0]}>
              <boxGeometry args={[podiumWidth, tower.baseSize[1] * 0.16, podiumDepth]} />
              <WorldArchitecturalMassMaterial
                fallbackColor="#d9e4ea"
                emissive={tower.crownColor}
                emissiveIntensity={0.012}
              />
            </mesh>
            <mesh receiveShadow position={[0, tower.baseSize[1] * 0.5, 0]}>
              <boxGeometry args={tower.baseSize} />
              <WorldArchitecturalMassMaterial
                fallbackColor={tower.color}
                emissive={tower.crownColor}
                emissiveIntensity={0.01}
              />
            </mesh>
            <mesh position={[0, tower.baseSize[1] + (tower.upperSize[1] * 0.5) - 18, 0]} receiveShadow>
              <boxGeometry args={tower.upperSize} />
              <WorldArchitecturalMassMaterial
                fallbackColor="#94a6b2"
                emissive={tower.crownColor}
                emissiveIntensity={0.012}
              />
            </mesh>
            <mesh position={[side * (tower.baseSize[0] * 0.38), tower.baseSize[1] * 0.58, 0]} receiveShadow>
              <boxGeometry args={[tower.baseSize[0] * 0.16, finHeight, tower.baseSize[2] * 0.48]} />
              <WorldArchitecturalMassMaterial
                fallbackColor="#6f7b85"
                emissive={tower.crownColor}
                emissiveIntensity={0.026}
              />
            </mesh>
            <mesh position={[0, tower.baseSize[1] * 0.58, -tower.baseSize[2] * 0.28]} receiveShadow>
              <boxGeometry args={[tower.baseSize[0] * 0.42, rearFinHeight, tower.baseSize[2] * 0.18]} />
              <WorldArchitecturalMassMaterial
                fallbackColor="#65717b"
                emissive={tower.crownColor}
                emissiveIntensity={isSupport ? 0.01 : 0.018}
              />
            </mesh>
            {!isSupport && (
              <mesh position={[-side * (tower.baseSize[0] * 0.22), tower.baseSize[1] * 0.32, 0]} receiveShadow>
                <boxGeometry args={[tower.baseSize[0] * 0.38, tower.baseSize[1] * 0.2, tower.baseSize[2] * 0.4]} />
                <WorldArchitecturalMassMaterial
                  fallbackColor="#5f6a73"
                  emissive={tower.crownColor}
                  emissiveIntensity={isHero ? 0.018 : 0.01}
                />
              </mesh>
            )}
            {isHero && (
              <mesh position={[0, tower.baseSize[1] + tower.upperSize[1] - 8, 0]}>
              <boxGeometry args={[tower.baseSize[0] * 0.62, 1.8, tower.baseSize[2] * 0.62]} />
              <meshStandardMaterial color={tower.crownColor} metalness={0.12} roughness={0.44} />
              </mesh>
            )}
            {isHero && (
              <mesh position={[0, tower.baseSize[1] + (tower.upperSize[1] * 0.48), 0]} receiveShadow>
              <boxGeometry args={[tower.upperSize[0] * 1.08, midBandHeight, tower.upperSize[2] * 0.34]} />
              <meshStandardMaterial color="#6d7983" emissive={tower.crownColor} emissiveIntensity={isSupport ? 0.01 : 0.02} roughness={0.5} metalness={0.14} />
              </mesh>
            )}
            {isHero && (
              <mesh position={[0, tower.baseSize[1] + tower.upperSize[1] + 6, 0]} receiveShadow>
              <boxGeometry args={[tower.upperSize[0] * 0.78, crownBandHeight, tower.upperSize[2] * 0.78]} />
              <meshStandardMaterial color="#66727c" emissive={tower.crownColor} emissiveIntensity={isHero ? 0.026 : 0.014} roughness={0.5} metalness={0.14} />
              </mesh>
            )}
            {isHero && (
              <>
                <mesh position={[side * (tower.upperSize[0] * 0.36), tower.baseSize[1] + tower.upperSize[1] + 3, 0]} receiveShadow>
                  <boxGeometry args={[tower.upperSize[0] * 0.14, crownBandHeight + 6, tower.upperSize[2] * 0.26]} />
                  <meshStandardMaterial color="#6e7b84" emissive={tower.crownColor} emissiveIntensity={isHero ? 0.02 : 0.01} roughness={0.5} metalness={0.14} />
                </mesh>
                <mesh position={[-side * (tower.upperSize[0] * 0.26), tower.baseSize[1] + tower.upperSize[1] - 2, -tower.upperSize[2] * 0.12]} receiveShadow>
                  <boxGeometry args={[tower.upperSize[0] * 0.18, crownBandHeight + 4, tower.upperSize[2] * 0.18]} />
                  <meshStandardMaterial color="#5e6973" emissive={tower.crownColor} emissiveIntensity={isHero ? 0.016 : 0.008} roughness={0.52} metalness={0.12} />
                </mesh>
              </>
            )}
            {isHero && (
              <>
                <mesh position={[0, tower.baseSize[1] + tower.upperSize[1] + 22, 0]}>
                <boxGeometry args={[tower.upperSize[0] * 0.48, 24, tower.upperSize[2] * 0.48]} />
                <meshStandardMaterial color="#8d9ba6" emissive={tower.crownColor} emissiveIntensity={0.02} metalness={0.12} roughness={0.46} />
                </mesh>
                <mesh position={[0, tower.baseSize[1] + tower.upperSize[1] + 44, 0]}>
                  <cylinderGeometry args={[tower.upperSize[0] * 0.12, tower.upperSize[0] * 0.18, 18, 12]} />
                  <meshStandardMaterial color="#95a3ad" emissive={tower.crownColor} emissiveIntensity={0.02} metalness={0.16} roughness={0.42} />
                </mesh>
              </>
            )}
          </group>
        )})}
    </>
  );
}
