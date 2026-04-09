type StadiumReserve = {
  centerX: number;
  centerZ: number;
  halfWidth: number;
  halfDepth: number;
};

type CityPlane = {
  id: string;
  position: [number, number, number];
  size: [number, number];
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

function PlaneLayer({
  planes,
  roughness,
  metalness,
}: {
  planes: CityPlane[];
  roughness: number;
  metalness: number;
}) {
  return (
    <>
      {planes.map((plane) => (
        <group key={plane.id} position={plane.position}>
          <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
            <planeGeometry args={plane.size} />
            <meshStandardMaterial color={plane.color} roughness={roughness} metalness={metalness} />
          </mesh>
          {(plane.id.includes('carpet') || plane.id.includes('ribbon') || plane.id.includes('band')) && (
            <mesh position={[0, 0.012, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow={false}>
              <planeGeometry args={[plane.size[0] * 0.82, plane.size[1] * 0.78]} />
              <meshStandardMaterial
                color="#f8fbfd"
                emissive="#d9eef8"
                emissiveIntensity={plane.id.includes('ribbon') ? 0.08 : 0.05}
                roughness={0.34}
                metalness={0.08}
                transparent
                opacity={0.74}
              />
            </mesh>
          )}
        </group>
      ))}
    </>
  );
}

export function WorldCityPlanes({
  arrivalPlanes,
  promenadeAxisPlanes,
  showcasePlazas,
  boothForecourtPlanes,
  stadiumReserve,
}: {
  arrivalPlanes: CityPlane[];
  promenadeAxisPlanes: CityPlane[];
  showcasePlazas: CityPlane[];
  boothForecourtPlanes: CityPlane[];
  stadiumReserve: StadiumReserve;
}) {
  const openPlanes = [...showcasePlazas, ...boothForecourtPlanes].filter(
    (plane) => !overlapsStadiumReserve(plane.position, stadiumReserve, plane.size)
  );

  return (
    <>
      <PlaneLayer planes={arrivalPlanes} roughness={0.72} metalness={0.04} />
      <PlaneLayer planes={promenadeAxisPlanes} roughness={0.68} metalness={0.04} />
      <PlaneLayer planes={openPlanes} roughness={0.7} metalness={0.04} />
    </>
  );
}
