import type { StadiumReserve } from './WorldCitySkeletonLayout';

type CityMass = {
  decorPolicy?: 'signature' | 'standard' | 'none';
  id: string;
  position: [number, number, number];
  role?: 'signature' | 'ground' | 'support-strip' | 'slender-vertical' | 'structural';
  size: [number, number, number];
  color: string;
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
  const color = emissiveIntensity > 0.012 ? '#aebbc5' : '#9fadb8';

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

export function WorldCityMasses({
  masses,
  stadiumReserve,
}: {
  masses: CityMass[];
  stadiumReserve: StadiumReserve;
}) {
  return (
    <>
      {masses
        .filter((mass) => !overlapsStadiumReserve(mass.position, stadiumReserve, mass.size))
        .map((mass) => {
          const role = mass.role ?? 'structural';
          const decorPolicy = mass.decorPolicy ?? 'standard';
          const isSignature = role === 'signature';
          const isCenterLane = Math.abs(mass.position[0]) <= 220;
          const isThinHorizontalShelf = mass.size[1] <= 18 && mass.size[0] >= 72 && mass.size[2] <= 32;
          const isSlenderVertical = role === 'slender-vertical';
          const isSupportStrip = role === 'support-strip';
          const isGroundLikePlinth = role === 'ground';
          const suppressDecorativeStack =
            (isCenterLane && isThinHorizontalShelf) ||
            (isCenterLane && isSupportStrip) ||
            isSlenderVertical ||
            decorPolicy === 'none';
          const isLowPlinth = mass.size[1] <= 24;
          const hasHorizontalCap = !suppressDecorativeStack && mass.size[1] > 18 && mass.size[0] > 20 && mass.size[2] > 20;
          const hasSideInset = !suppressDecorativeStack && mass.size[1] > 28 && mass.size[0] >= 42 && mass.size[2] >= 18;
          const hasRearSpine = !suppressDecorativeStack && mass.size[1] > 40 && mass.size[0] >= 18 && mass.size[2] >= 14;
          const hasFrontWing = !suppressDecorativeStack && decorPolicy === 'signature' && mass.size[0] >= 28 && mass.size[1] > 24;
          const hasNodeTop = false;
          const hasMarkerTop = false;

          if (isGroundLikePlinth) {
            return null;
          }

          return (
            <group key={mass.id} name={`city-mass:${mass.id}`} position={[mass.position[0], 0, mass.position[2]]}>
              <mesh receiveShadow position={[0, mass.size[1] * 0.5, 0]}>
                <boxGeometry args={mass.size} />
                <WorldArchitecturalMassMaterial
                  fallbackColor={mass.color}
                  emissive={isSignature ? '#8fd6ff' : isLowPlinth ? '#d9eef8' : '#000000'}
                  emissiveIntensity={isSignature ? 0.014 : isLowPlinth ? 0.012 : 0}
                />
              </mesh>
              {hasHorizontalCap && (
                <mesh position={[0, mass.size[1] + 0.4, 0]}>
                  <boxGeometry args={[mass.size[0] * 0.78, 0.9, mass.size[2] * 0.78]} />
                  <meshStandardMaterial color="#96a5b0" roughness={0.58} metalness={0.14} />
                </mesh>
              )}
              {isSignature && !suppressDecorativeStack && mass.size[1] > 24 && (
                <mesh position={[0, mass.size[1] * 0.28, mass.size[2] * 0.18]}>
                  <boxGeometry args={[Math.max(12, mass.size[0] * 0.28), Math.max(8, mass.size[1] * 0.08), Math.max(6, mass.size[2] * 0.1)]} />
                  <meshStandardMaterial color="#8f9ea9" emissive="#bdd7e6" emissiveIntensity={0.012} roughness={0.46} metalness={0.18} />
                </mesh>
              )}
              {hasSideInset && (
                <>
                  <mesh position={[-mass.size[0] * 0.24, mass.size[1] * 0.54, 0]}>
                    <boxGeometry args={[Math.max(8, mass.size[0] * 0.1), Math.max(16, mass.size[1] * 0.24), Math.max(8, mass.size[2] * 0.16)]} />
                    <meshStandardMaterial color="#90a0ab" roughness={0.46} metalness={0.18} />
                  </mesh>
                  <mesh position={[mass.size[0] * 0.24, mass.size[1] * 0.5, 0]}>
                    <boxGeometry args={[Math.max(8, mass.size[0] * 0.08), Math.max(14, mass.size[1] * 0.2), Math.max(8, mass.size[2] * 0.14)]} />
                    <meshStandardMaterial color="#8a99a4" emissive="#b5cfde" emissiveIntensity={0.012} roughness={0.48} metalness={0.16} />
                  </mesh>
                </>
              )}
              {isSignature && !suppressDecorativeStack && mass.size[1] > 48 && (
                <mesh position={[0, mass.size[1] * 0.62, 0]}>
                  <boxGeometry args={[Math.max(8, mass.size[0] * 0.16), Math.max(18, mass.size[1] * 0.18), Math.max(8, mass.size[2] * 0.16)]} />
                  <meshStandardMaterial color="#93a2ac" emissive="#b9d4e3" emissiveIntensity={0.012} roughness={0.48} metalness={0.16} />
                </mesh>
              )}
              {hasNodeTop && (
                <mesh position={[0, mass.size[1] + 10, 0]}>
                  <boxGeometry args={[Math.max(8, mass.size[0] * 0.24), 12, Math.max(8, mass.size[2] * 0.24)]} />
                  <meshStandardMaterial color="#eef4f8" emissive="#cbe7f5" emissiveIntensity={0.03} roughness={0.34} metalness={0.14} />
                </mesh>
              )}
              {hasMarkerTop && (
                <mesh position={[0, mass.size[1] * 0.46, -mass.size[2] * 0.16]}>
                  <boxGeometry args={[Math.max(6, mass.size[0] * 0.18), Math.max(16, mass.size[1] * 0.22), Math.max(6, mass.size[2] * 0.12)]} />
                  <meshStandardMaterial color="#f4f8fb" emissive="#d7eef9" emissiveIntensity={0.035} roughness={0.3} metalness={0.18} />
                </mesh>
              )}
              {hasMarkerTop && (
                <mesh position={[0, mass.size[1] + 4, 0]}>
                  <boxGeometry args={[Math.max(10, mass.size[0] * 0.34), 6, Math.max(8, mass.size[2] * 0.22)]} />
                  <meshStandardMaterial color="#eef4f8" emissive="#d7eef9" emissiveIntensity={0.028} roughness={0.3} metalness={0.18} />
                </mesh>
              )}
              {hasRearSpine && (
                <mesh position={[0, mass.size[1] * 0.68, -mass.size[2] * 0.22]}>
                  <boxGeometry args={[Math.max(8, mass.size[0] * 0.12), Math.max(18, mass.size[1] * 0.18), Math.max(6, mass.size[2] * 0.1)]} />
                  <meshStandardMaterial color="#8897a2" emissive="#b5cfde" emissiveIntensity={0.01} roughness={0.48} metalness={0.14} />
                </mesh>
              )}
              {hasFrontWing && (
                <mesh position={[0, mass.size[1] * 0.34, mass.size[2] * 0.22]}>
                  <boxGeometry args={[Math.max(12, mass.size[0] * 0.26), Math.max(10, mass.size[1] * 0.12), Math.max(6, mass.size[2] * 0.1)]} />
                  <meshStandardMaterial color="#91a0ab" emissive="#bdd7e6" emissiveIntensity={0.01} roughness={0.46} metalness={0.16} />
                </mesh>
              )}
            </group>
          );
        })}
    </>
  );
}
