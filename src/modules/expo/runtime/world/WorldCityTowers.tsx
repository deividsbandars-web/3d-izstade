type StadiumReserve = {
  centerX: number;
  centerZ: number;
  halfWidth: number;
  halfDepth: number;
};

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
  fallbackColor,
  emissive = '#000000',
  emissiveIntensity = 0,
}: {
  fallbackColor: string;
  emissive?: string;
  emissiveIntensity?: number;
}) {
  return (
    <meshStandardMaterial
      color={fallbackColor}
      roughness={0.76}
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
            <mesh castShadow receiveShadow position={[0, tower.baseSize[1] * 0.08, 0]}>
              <boxGeometry args={[podiumWidth, tower.baseSize[1] * 0.16, podiumDepth]} />
              <WorldArchitecturalMassMaterial
                fallbackColor="#d9e4ea"
                emissive={tower.crownColor}
                emissiveIntensity={0.012}
              />
            </mesh>
            <mesh castShadow receiveShadow position={[0, tower.baseSize[1] * 0.5, 0]}>
              <boxGeometry args={tower.baseSize} />
              <WorldArchitecturalMassMaterial
                fallbackColor={tower.color}
                emissive={tower.crownColor}
                emissiveIntensity={0.01}
              />
            </mesh>
            <mesh position={[0, tower.baseSize[1] + (tower.upperSize[1] * 0.5) - 18, 0]} castShadow receiveShadow>
              <boxGeometry args={tower.upperSize} />
              <WorldArchitecturalMassMaterial
                fallbackColor="#94a6b2"
                emissive={tower.crownColor}
                emissiveIntensity={0.012}
              />
            </mesh>
            <mesh position={[side * (tower.baseSize[0] * 0.34), tower.baseSize[1] * 0.58, 0]} castShadow receiveShadow>
              <boxGeometry args={[tower.baseSize[0] * 0.12, finHeight, tower.baseSize[2] * 0.42]} />
              <WorldArchitecturalMassMaterial
                fallbackColor="#dbe5eb"
                emissive={tower.crownColor}
                emissiveIntensity={0.018}
              />
            </mesh>
            <mesh position={[0, tower.baseSize[1] * 0.58, -tower.baseSize[2] * 0.28]} castShadow receiveShadow>
              <boxGeometry args={[tower.baseSize[0] * 0.34, rearFinHeight, tower.baseSize[2] * 0.14]} />
              <WorldArchitecturalMassMaterial
                fallbackColor="#cfdae2"
                emissive={tower.crownColor}
                emissiveIntensity={isSupport ? 0.006 : 0.012}
              />
            </mesh>
            {!isSupport && (
              <mesh position={[-side * (tower.baseSize[0] * 0.18), tower.baseSize[1] * 0.32, 0]} castShadow receiveShadow>
                <boxGeometry args={[tower.baseSize[0] * 0.32, tower.baseSize[1] * 0.18, tower.baseSize[2] * 0.34]} />
                <WorldArchitecturalMassMaterial
                  fallbackColor="#cad7df"
                  emissive={tower.crownColor}
                  emissiveIntensity={isHero ? 0.012 : 0.006}
                />
              </mesh>
            )}
            {isHero && (
              <mesh position={[0, tower.baseSize[1] + tower.upperSize[1] - 8, 0]} castShadow>
              <boxGeometry args={[tower.baseSize[0] * 0.62, 1.8, tower.baseSize[2] * 0.62]} />
              <meshStandardMaterial color={tower.crownColor} metalness={0.12} roughness={0.44} />
              </mesh>
            )}
            {isHero && (
              <mesh position={[0, tower.baseSize[1] + (tower.upperSize[1] * 0.48), 0]} castShadow receiveShadow>
              <boxGeometry args={[tower.upperSize[0] * 1.08, midBandHeight, tower.upperSize[2] * 0.34]} />
              <meshStandardMaterial color="#eef4f8" emissive={tower.crownColor} emissiveIntensity={isSupport ? 0.014 : 0.026} roughness={0.32} metalness={0.18} />
              </mesh>
            )}
            {isHero && (
              <mesh position={[0, tower.baseSize[1] + tower.upperSize[1] + 6, 0]} castShadow receiveShadow>
              <boxGeometry args={[tower.upperSize[0] * 0.78, crownBandHeight, tower.upperSize[2] * 0.78]} />
              <meshStandardMaterial color="#f4f8fb" emissive={tower.crownColor} emissiveIntensity={isHero ? 0.06 : 0.03} roughness={0.3} metalness={0.18} />
              </mesh>
            )}
            {isHero && (
              <>
                <mesh position={[side * (tower.upperSize[0] * 0.36), tower.baseSize[1] + tower.upperSize[1] + 3, 0]} castShadow receiveShadow>
                  <boxGeometry args={[tower.upperSize[0] * 0.14, crownBandHeight + 6, tower.upperSize[2] * 0.26]} />
                  <meshStandardMaterial color="#eef4f8" emissive={tower.crownColor} emissiveIntensity={isHero ? 0.04 : 0.022} roughness={0.3} metalness={0.16} />
                </mesh>
                <mesh position={[-side * (tower.upperSize[0] * 0.26), tower.baseSize[1] + tower.upperSize[1] - 2, -tower.upperSize[2] * 0.12]} castShadow receiveShadow>
                  <boxGeometry args={[tower.upperSize[0] * 0.18, crownBandHeight + 4, tower.upperSize[2] * 0.18]} />
                  <meshStandardMaterial color="#e7eef3" emissive={tower.crownColor} emissiveIntensity={isHero ? 0.028 : 0.016} roughness={0.32} metalness={0.14} />
                </mesh>
              </>
            )}
            {isHero && (
              <>
                <mesh position={[0, tower.baseSize[1] + tower.upperSize[1] + 22, 0]} castShadow>
                <boxGeometry args={[tower.upperSize[0] * 0.48, 24, tower.upperSize[2] * 0.48]} />
                <meshStandardMaterial color="#e8f0f5" emissive={tower.crownColor} emissiveIntensity={0.08} metalness={0.12} roughness={0.34} />
                </mesh>
                <mesh position={[0, tower.baseSize[1] + tower.upperSize[1] + 44, 0]} castShadow>
                  <cylinderGeometry args={[tower.upperSize[0] * 0.12, tower.upperSize[0] * 0.18, 18, 12]} />
                  <meshStandardMaterial color="#f7fbfd" emissive={tower.crownColor} emissiveIntensity={0.09} metalness={0.16} roughness={0.26} />
                </mesh>
              </>
            )}
          </group>
        )})}
    </>
  );
}
