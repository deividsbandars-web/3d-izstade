type StadiumReserve = {
  centerX: number;
  centerZ: number;
  halfWidth: number;
  halfDepth: number;
};

type CityScreenSurface = {
  color: string;
  glowColor: string;
  id: string;
  role: 'hero-wall' | 'support-wall' | 'tower-crown' | 'tower-side';
  position: [number, number, number];
  size: [number, number, number];
  type: 'tower-crown' | 'tower-side' | 'wall';
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

export function WorldCityScreenSurfaces({
  playerPosition,
  stadiumReserve,
  surfaces,
}: {
  playerPosition: [number, number, number];
  stadiumReserve: StadiumReserve;
  surfaces: CityScreenSurface[];
}) {
  return (
    <>
      {surfaces
        .filter((surface) => {
          if (overlapsStadiumReserve(surface.position, stadiumReserve, surface.size)) {
            return false;
          }

          const dx = surface.position[0] - playerPosition[0];
          const dz = surface.position[2] - playerPosition[2];
          const distanceSq = (dx * dx) + (dz * dz);
          const maxDistance = surface.role === 'hero-wall' || surface.role === 'tower-crown' ? 1800 : 1320;
          return distanceSq <= maxDistance * maxDistance;
        })
        .map((surface) => (
          <group key={surface.id} position={surface.position}>
            <mesh position={[0, 0, surface.size[2] * 0.5]}>
              <planeGeometry args={[surface.size[0], surface.size[1]]} />
              <meshStandardMaterial
                color={surface.color}
                roughness={0.42}
                metalness={0.22}
                emissive={surface.glowColor}
                emissiveIntensity={
                  surface.role === 'hero-wall'
                    ? 0.12
                    : surface.role === 'tower-crown'
                      ? 0.14
                      : 0.09
                }
                transparent
                opacity={0.96}
              />
            </mesh>
            <mesh position={[0, 0, surface.size[2] * 0.56]}>
              <planeGeometry args={[surface.size[0] * 0.94, surface.size[1] * 0.94]} />
              <meshBasicMaterial
                color={surface.glowColor}
                transparent
                opacity={
                  surface.role === 'hero-wall'
                    ? 0.2
                    : surface.role === 'tower-crown'
                      ? 0.22
                      : surface.type === 'wall'
                        ? 0.12
                        : 0.15
                }
              />
            </mesh>
            {surface.role === 'hero-wall' && (
              <mesh position={[0, 0, surface.size[2] * 0.58]}>
                <planeGeometry args={[surface.size[0] * 0.92, surface.size[1] * 0.92]} />
                <meshBasicMaterial color="#f8fafc" transparent opacity={0.04} />
              </mesh>
            )}
          </group>
        ))}
    </>
  );
}
